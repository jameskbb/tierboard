import { useEffect } from 'react';
import type { TierBoard } from '@/models/board';
import { useBoardStore } from '@/stores/boardStore';
import { toast } from '@/stores/uiStore';
import { getRepository } from './boardRepository';

const DEBOUNCE_MS = 300;

/**
 * Persist the open board shortly after every change (including undo/redo).
 * Shared boards are skipped until the user saves them. Pending writes are
 * flushed when the tab is hidden or closed.
 */
export function useAutosave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: TierBoard | null = null;
    let warned = false;

    const flush = () => {
      clearTimeout(timer);
      if (!pending) return;
      const board = pending;
      pending = null;
      getRepository()
        .save(board)
        .catch((error: Error) => {
          if (!warned) toast({ message: error.message, tone: 'error', duration: 8000 });
          warned = true;
        });
    };

    const unsubscribe = useBoardStore.subscribe((state, previous) => {
      if (state.mode !== 'saved' || !state.history) return;
      if (state.revision === previous.revision && state.mode === previous.mode) return;
      pending = state.history.present;
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
    });

    const onVisibility = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unsubscribe();
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
