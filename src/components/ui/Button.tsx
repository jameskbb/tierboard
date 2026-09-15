import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover shadow-sm',
  secondary: 'bg-surface text-text ring-1 ring-inset ring-line hover:bg-surface-2',
  ghost: 'text-text hover:bg-sunken/70',
  soft: 'bg-accent-soft text-accent hover:brightness-95 dark:hover:brightness-110',
  danger: 'bg-danger text-white hover:brightness-95',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5',
  md: 'h-10 px-3.5 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-[10px] font-medium whitespace-nowrap transition-[background-color,filter,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'soft';
  active?: boolean;
}

const ICON_SIZES = { sm: 'size-8', md: 'size-10', lg: 'size-12' };

/** Square icon-only button. `label` becomes the accessible name and tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', active, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[10px] transition-[background-color,color,transform] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-35',
        ICON_SIZES[size],
        variant === 'ghost' && 'text-muted hover:bg-sunken/70 hover:text-text',
        variant === 'secondary' &&
          'bg-surface text-text ring-1 ring-inset ring-line hover:bg-surface-2',
        variant === 'soft' && 'bg-accent-soft text-accent',
        active && 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
