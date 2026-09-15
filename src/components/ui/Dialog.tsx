import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Hide the visible title (still announced to screen readers). */
  hideTitle?: boolean;
  className?: string;
  /** Dark stage look for group-facing dialogs (random pick, vote). */
  tone?: 'default' | 'stage';
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-6xl',
};

/**
 * Accessible modal. Centered on larger screens, a bottom sheet on phones.
 * Focus is trapped while open and restored on close; Esc and backdrop close.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideTitle,
  className,
  tone = 'default',
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade bg-[#0b0d12]/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-rise flex-col overflow-hidden rounded-t-[22px] shadow-panel sm:rounded-[var(--radius-panel)]',
          tone === 'stage' ? 'dark bg-[#15171f] text-[#eceef3]' : 'bg-surface text-text',
          SIZES[size],
          className,
        )}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden"
          aria-hidden
        />
        <header
          className={cn('flex items-start gap-3 px-5 pt-4 sm:px-6 sm:pt-5', hideTitle && 'sr-only')}
        >
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl font-bold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 inline-flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-sunken/70 hover:text-text"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
