import { BoardView } from '@/components/board/BoardView';
import { Celebration } from '@/components/board/Celebration';
import { DialogHost } from '@/components/dialogs/DialogHost';
import { ItemEditorHost } from '@/components/items/ItemEditor';
import { useAutosave } from '@/features/persistence/useAutosave';
import { useBoardHotkeys } from '@/hooks/useBoardHotkeys';
import { useBoard, useBoardStore } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';
import { BoardHeader } from './BoardHeader';
import { MobileActionBar } from './MobileActionBar';
import { PresentBar } from './PresentBar';
import { SharedBanner } from './SharedBanner';

/** The main ranking screen, used for saved and shared boards alike. */
export function BoardScreen() {
  const board = useBoard();
  const mode = useBoardStore((state) => state.mode);
  const presenting = useUiStore((state) => state.presenting);
  useAutosave();
  useBoardHotkeys();

  if (!board) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {mode === 'shared' && !presenting && <SharedBanner />}
      {presenting ? <PresentBar title={board.title} /> : <BoardHeader board={board} />}
      <main
        className={
          presenting
            ? 'mx-auto w-full max-w-[1900px] flex-1 px-3 pt-2 pb-6 sm:px-8'
            : 'mx-auto w-full max-w-[1480px] flex-1 px-2.5 pt-2 pb-28 sm:px-6 sm:pt-4 sm:pb-12'
        }
      >
        <div className="board" data-board-theme={board.settings.theme} data-presenting={presenting}>
          <BoardView board={board} presenting={presenting} />
        </div>
      </main>
      {!presenting && <MobileActionBar />}
      <ItemEditorHost />
      <DialogHost />
      <Celebration />
    </div>
  );
}
