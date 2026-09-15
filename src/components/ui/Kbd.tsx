import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD = IS_MAC ? '⌘' : 'Ctrl';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-sunken px-1.5 font-mono text-[11px] font-medium text-muted shadow-[inset_0_-1px_0_var(--line)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
