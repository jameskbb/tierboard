import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kbd } from './Kbd';

export type MenuEntry =
  | {
      label: string;
      icon?: ReactNode;
      onSelect: () => void;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
    }
  | 'separator'
  | { heading: string };

interface MenuProps {
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
    'aria-controls': string;
  }) => ReactNode;
  items: MenuEntry[];
  align?: 'start' | 'end';
  className?: string;
}

/** Dropdown menu with arrow-key navigation, Esc/outside-click to close. */
export function Menu({ trigger, items, align = 'end', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const buttons = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
          [],
      );
    requestAnimationFrame(() => buttons()[0]?.focus());
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target))
        setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      const list = buttons();
      const index = list.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        list[(index + 1) % list.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
      } else if (event.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'aria-controls': menuId,
      })}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={cn(
            'scrollbar-thin absolute top-full z-40 mt-1.5 max-h-[70dvh] min-w-56 animate-rise overflow-y-auto rounded-[14px] bg-surface p-1.5 text-text shadow-panel',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {items.map((entry, index) => {
            if (entry === 'separator')
              return <div key={index} className="my-1 h-px bg-line" role="separator" />;
            if ('heading' in entry)
              return (
                <div key={index} className="px-2.5 pt-2 pb-1 text-xs font-medium text-muted">
                  {entry.heading}
                </div>
              );
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                disabled={entry.disabled}
                onClick={() => {
                  setOpen(false);
                  entry.onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-sm outline-none hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none disabled:opacity-40',
                  entry.danger && 'text-danger',
                )}
              >
                <span className="flex size-4 shrink-0 items-center justify-center opacity-80 [&>svg]:size-4">
                  {entry.icon}
                </span>
                <span className="flex-1">{entry.label}</span>
                {entry.shortcut && <Kbd>{entry.shortcut}</Kbd>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
