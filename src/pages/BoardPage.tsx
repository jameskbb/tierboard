import { useEffect, useState } from 'react';
import { BoardScreen } from '@/components/layout/BoardScreen';
import { getRepository } from '@/features/persistence/boardRepository';
import { navigate, routes } from '@/lib/router';
import { useBoardStore } from '@/stores/boardStore';
import { toast, useUiStore } from '@/stores/uiStore';

export function BoardPage({ boardId, intent: routeIntent }: { boardId: string; intent?: 'add' }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  // Read the "?add" intent once: clearing it from the URL must not reload the board.
  const [intent] = useState(routeIntent);

  useEffect(() => {
    let cancelled = false;
    useUiStore.getState().resetForBoard();
    getRepository()
      .load(boardId)
      .then((board) => {
        if (cancelled) return;
        if (!board) {
          toast({ message: 'That board is not on this device.', tone: 'error' });
          navigate(routes.home(), { replace: true });
          return;
        }
        useBoardStore.getState().load(board, 'saved');
        setStatus('ready');
        if (intent === 'add') {
          useUiStore.getState().openDialog('add-items');
          navigate(routes.board(board.id), { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, intent]);

  // Another tab edited this board: reload it (only when nothing is pending here).
  useEffect(
    () =>
      getRepository().subscribe(async (changedId) => {
        if (changedId !== boardId) return;
        const fresh = await getRepository().load(boardId);
        const current = useBoardStore.getState().history?.present;
        if (fresh && current && fresh.updatedAt > current.updatedAt)
          useBoardStore.getState().load(fresh, 'saved');
      }),
    [boardId],
  );

  if (status === 'loading') return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  return <BoardScreen />;
}
