import { Dices, ListPlus, Presentation, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { togglePresenting } from '@/features/group/presentation';
import { useUiStore } from '@/stores/uiStore';

function BarButton({
  label,
  icon,
  onClick,
  primary,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-[14px] bg-accent font-semibold text-accent-ink active:scale-[0.97]'
          : 'flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] text-[11px] font-medium text-muted active:bg-sunken'
      }
    >
      {icon}
      {label}
    </button>
  );
}

/** Thumb-reach actions on phones. */
export function MobileActionBar() {
  const openDialog = useUiStore((state) => state.openDialog);
  return (
    <nav
      aria-label="Board actions"
      className="fixed inset-x-0 bottom-0 z-30 flex gap-1.5 border-t border-line/70 bg-bg/92 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
    >
      <BarButton
        label="Quick rank"
        icon={<Zap className="size-5" />}
        onClick={() => openDialog('quick-rank')}
      />
      <BarButton
        label="Random"
        icon={<Dices className="size-5" />}
        onClick={() => openDialog('random')}
      />
      <BarButton
        label="Add items"
        icon={<ListPlus className="size-5" />}
        onClick={() => openDialog('add-items')}
        primary
      />
      <BarButton
        label="Present"
        icon={<Presentation className="size-5" />}
        onClick={togglePresenting}
      />
    </nav>
  );
}
