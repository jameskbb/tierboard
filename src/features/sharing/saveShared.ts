import { getRepository } from '@/features/persistence/boardRepository';
import { createId, nowIso } from '@/lib/ids';
import { navigate, routes } from '@/lib/router';
import { getBoard, useBoardStore } from '@/stores/boardStore';
import { toast } from '@/stores/uiStore';

/** Persist the temporary shared board as a new board of the recipient's own. */
export async function saveSharedBoard() {
  const board = getBoard();
  if (!board) return;
  const now = nowIso();
  const saved = { ...board, id: createId(), createdAt: now, updatedAt: now };
  try {
    await getRepository().save(saved);
    useBoardStore.getState().markSaved(saved);
    navigate(routes.board(saved.id), { replace: true });
    toast({ message: 'Saved to My Boards', tone: 'success' });
  } catch (error) {
    toast({ message: (error as Error).message, tone: 'error' });
  }
}
