import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

export interface Anchor {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface PopoverProps {
  anchor: Anchor | null;
  onClose: () => void;
  children: ReactNode;
  label: string;
  width?: number;
  className?: string;
}

/**
 * Lightweight floating panel anchored to a rect (an item, a tier label).
 * On phones it becomes a bottom sheet so controls stay thumb-sized.
 */
export function Popover({
  anchor,
  onClose,
  children,
  label,
  width = 340,
  className,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isPhone = useMediaQuery('(max-width: 639px)');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  useFocusTrap(ref, true);

  useLayoutEffect(() => {
    if (isPhone || !ref.current) return;
    const panel = ref.current.getBoundingClientRect();
    const margin = 12;
    const a = anchor ?? {
      top: window.innerHeight / 2,
      bottom: window.innerHeight / 2,
      left: window.innerWidth / 2 - width / 2,
      right: window.innerWidth / 2 + width / 2,
    };
    const below = a.bottom + 8;
    const top =
      below + panel.height <= window.innerHeight - margin
        ? below
        : Math.max(margin, a.top - 8 - panel.height);
    const left = Math.min(Math.max(margin, a.left), window.innerWidth - panel.width - margin);
    setPosition({ top, left });
  }, [anchor, isPhone, width]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    // Defer so the click that opened the popover doesn't close it.
    const timer = setTimeout(() => document.addEventListener('pointerdown', onPointer), 0);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [onClose]);

  return createPortal(
    <>
      {isPhone && <div className="fixed inset-0 z-40 animate-fade bg-[#0b0d12]/45" aria-hidden />}
      <div
        ref={ref}
        role="dialog"
        aria-label={label}
        style={
          isPhone
            ? undefined
            : { top: position?.top ?? -9999, left: position?.left ?? -9999, width }
        }
        className={cn(
          'z-50 animate-rise bg-surface text-text shadow-panel',
          isPhone
            ? 'fixed inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[22px] pb-[env(safe-area-inset-bottom)]'
            : 'fixed max-h-[80dvh] overflow-y-auto rounded-[var(--radius-panel)]',
          'scrollbar-thin',
          className,
        )}
      >
        {isPhone && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" aria-hidden />}
        {children}
      </div>
    </>,
    document.body,
  );
}

export function rectOf(element: Element | null): Anchor | null {
  if (!element) return null;
  const { top, left, bottom, right } = element.getBoundingClientRect();
  return { top, left, bottom, right };
}
