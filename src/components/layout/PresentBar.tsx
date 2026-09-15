import { Dices, Expand, ListPlus, Minimize2, Vote, X, Zap } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { setPresenting, toggleFullscreen } from '@/features/group/presentation';
import { useUiStore } from '@/stores/uiStore';

const subscribeFullscreen = (callback: () => void) => {
  document.addEventListener('fullscreenchange', callback);
  return () => document.removeEventListener('fullscreenchange', callback);
};

/** Minimal chrome for the room: big title, the few actions a group needs. */
export function PresentBar({ title }: { title: string }) {
  const openDialog = useUiStore((state) => state.openDialog);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, () => !!document.fullscreenElement);

  return (
    <header className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-2 sm:px-8 sm:pt-6">
      <h1 className="min-w-0 flex-1 truncate font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <div className="flex items-center gap-1.5">
        <Button
          size="lg"
          variant="primary"
          icon={<Dices className="size-5" />}
          onClick={() => openDialog('random')}
        >
          Next up
        </Button>
        <Button
          size="lg"
          icon={<Zap className="size-5" />}
          onClick={() => openDialog('quick-rank')}
          className="max-md:hidden"
        >
          Quick rank
        </Button>
        <Button
          size="lg"
          icon={<Vote className="size-5" />}
          onClick={() => openDialog('vote')}
          className="max-md:hidden"
        >
          Vote
        </Button>
        <IconButton size="lg" label="Add items" onClick={() => openDialog('add-items')}>
          <ListPlus className="size-5" />
        </IconButton>
        <IconButton
          size="lg"
          label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={toggleFullscreen}
          className="max-sm:hidden"
        >
          {fullscreen ? <Minimize2 className="size-5" /> : <Expand className="size-5" />}
        </IconButton>
        <IconButton size="lg" label="Exit presentation (Esc)" onClick={() => setPresenting(false)}>
          <X className="size-5" />
        </IconButton>
      </div>
    </header>
  );
}
