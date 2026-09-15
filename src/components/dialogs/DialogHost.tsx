import { lazy, Suspense } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { AddItemsDialog } from './AddItemsDialog';
import { CommandPalette } from './CommandPalette';
import { CompareDialog } from './CompareDialog';
import { DebateDialog } from './DebateDialog';
import { ImportDialog } from './ImportDialog';
import { QuickRankDialog } from './QuickRankDialog';
import { RandomPickDialog } from './RandomPickDialog';
import { SettingsDialog } from './SettingsDialog';
import { ShareDialog } from './ShareDialog';
import { ShortcutsDialog } from './ShortcutsDialog';
import { StatsDialog } from './StatsDialog';
import { TieBreakerDialog } from './TieBreakerDialog';
import { VoteDialog } from './VoteDialog';

// The PNG renderer is only needed when exporting; keep it out of the main bundle.
const ExportDialog = lazy(() => import('./ExportDialog'));

/** Renders the one open dialog. */
export function DialogHost() {
  const dialog = useUiStore((state) => state.dialog);
  const itemId = useUiStore((state) => state.dialogItemId);
  const close = useUiStore((state) => state.closeDialog);

  switch (dialog) {
    case 'add-items':
      return <AddItemsDialog open onClose={close} />;
    case 'share':
      return <ShareDialog onClose={close} />;
    case 'export':
      return (
        <Suspense fallback={null}>
          <ExportDialog onClose={close} />
        </Suspense>
      );
    case 'settings':
      return <SettingsDialog onClose={close} />;
    case 'shortcuts':
      return <ShortcutsDialog onClose={close} />;
    case 'palette':
      return <CommandPalette onClose={close} />;
    case 'random':
      return <RandomPickDialog onClose={close} />;
    case 'debate':
      return <DebateDialog onClose={close} />;
    case 'tie-breaker':
      return <TieBreakerDialog onClose={close} initialItemId={itemId} />;
    case 'vote':
      return <VoteDialog key={itemId ?? 'pick'} onClose={close} initialItemId={itemId} />;
    case 'compare':
      return <CompareDialog onClose={close} />;
    case 'stats':
      return <StatsDialog onClose={close} />;
    case 'import':
      return <ImportDialog onClose={close} />;
    case 'quick-rank':
      return <QuickRankDialog onClose={close} initialItemId={itemId} />;
    default:
      return null;
  }
}
