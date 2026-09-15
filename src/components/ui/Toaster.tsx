import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useUiStore, type Toast } from '@/stores/uiStore';

function ToastView({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((state) => state.dismissToast);
  useEffect(() => {
    const timer = setTimeout(
      () => dismiss(toast.id),
      toast.duration ?? (toast.action ? 6000 : 3200),
    );
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex animate-rise items-center gap-3 rounded-[14px] bg-[#1b1e27] py-2.5 pr-2 pl-3.5 text-sm text-white shadow-lift dark:bg-[#2a2e3b]"
    >
      {toast.tone === 'success' && <CheckCircle2 className="size-4 shrink-0 text-[#7EE0A1]" />}
      {toast.tone === 'error' && <AlertCircle className="size-4 shrink-0 text-[#FF7B72]" />}
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="rounded-[8px] px-2.5 py-1 font-semibold text-[#b4acff] hover:bg-white/10"
          onClick={() => {
            toast.action!.run();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        className={cn('rounded-[8px] p-1 text-white/60 hover:bg-white/10 hover:text-white')}
        onClick={() => dismiss(toast.id)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
