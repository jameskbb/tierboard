import { Link2Off } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BoardScreen } from '@/components/layout/BoardScreen';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { decodeBoard } from '@/features/sharing/shareCodec';
import { navigate, routes } from '@/lib/router';
import { useBoardStore } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';

/**
 * A board opened from a share link. It lives only in memory (mode 'shared')
 * until the recipient explicitly saves it — it never touches their saved boards.
 */
export function SharedPage({ payload }: { payload: string }) {
  const [state, setState] = useState<
    { status: 'loading' | 'ready' } | { status: 'error'; message: string }
  >({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    useUiStore.getState().resetForBoard();
    decodeBoard(payload)
      .then((board) => {
        if (cancelled) return;
        useBoardStore.getState().load(board, 'shared');
        setState({ status: 'ready' });
      })
      .catch((error: Error) => !cancelled && setState({ status: 'error', message: error.message }));
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (state.status === 'loading') return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (state.status === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <Logo />
        <Link2Off className="size-10 text-muted" aria-hidden />
        <div className="max-w-sm space-y-2">
          <h1 className="font-display text-2xl font-bold">This link didn’t open</h1>
          <p className="text-muted">{state.message}</p>
        </div>
        <Button variant="primary" onClick={() => navigate(routes.home())}>
          Go to my boards
        </Button>
      </main>
    );
  }
  return <BoardScreen />;
}
