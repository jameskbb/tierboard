import { useId } from 'react';
import { cn } from '@/lib/cn';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hideLabel?: boolean;
}

/** Radio-group styled as a segmented control. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <div id={id} className={cn('mb-1.5 text-xs font-medium text-muted', hideLabel && 'sr-only')}>
        {label}
      </div>
      <div className="flex rounded-[10px] bg-sunken p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 flex-1 rounded-[8px] px-2.5 text-sm font-medium transition-colors',
              value === option.value
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm">
        {label}
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
    </label>
  );
}
