import { useEffect, useLayoutEffect, useRef } from 'react';

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

/** True when the user is typing somewhere and single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.closest('[role="dialog"], [role="menu"]') !== null
  );
}

/**
 * Normalize an event into a combo string: "mod+shift+z", "?", "1", "escape".
 * `mod` is Cmd on macOS and Ctrl elsewhere.
 */
export function comboOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.altKey) parts.push('alt');
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  // "?" already implies shift; keep shift only for letter/number combos.
  if (event.shiftKey && key.length === 1 && /[a-z0-9]/.test(key)) parts.push('shift');
  parts.push(key === ' ' ? 'space' : key);
  return parts.join('+');
}

/**
 * Global shortcuts. Single keys never fire while typing in a field or when a
 * dialog/menu has focus; `mod+` combos always do (so Cmd+Z works everywhere
 * except text fields, where the browser's own undo wins).
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const mapRef = useRef(map);
  useLayoutEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const combo = comboOf(event);
      const handler = mapRef.current[combo];
      if (!handler) return;
      const typing = isTypingTarget(event.target);
      const isMod = combo.startsWith('mod+');
      const el = event.target as HTMLElement | null;
      const inTextField =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing && !isMod) return;
      if (isMod && inTextField && combo !== 'mod+k') return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
