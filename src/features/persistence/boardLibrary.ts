/** Board-level library operations used by the home screen and menus. */
import { createBoard } from '@/features/ranking/boardOps';
import { boardFromTemplate, type BoardTemplate } from '@/features/templates/templates';
import { createId, nowIso } from '@/lib/ids';
import { navigate, routes } from '@/lib/router';
import type { TierBoard } from '@/models/board';
import { toast } from '@/stores/uiStore';
import { getRepository } from './boardRepository';

async function saveAndOpen(board: TierBoard, openAdd: boolean) {
  try {
    await getRepository().save(board);
    navigate(routes.board(board.id) + (openAdd ? '?add' : ''));
  } catch (error) {
    toast({ message: (error as Error).message, tone: 'error' });
  }
}

/** Create a board and jump straight into adding items. */
export function createNewBoard(title = 'Untitled board') {
  return saveAndOpen(createBoard(title.trim() || 'Untitled board'), true);
}

export function createFromTemplate(template: BoardTemplate) {
  const board = boardFromTemplate(template);
  return saveAndOpen(board, Object.keys(board.items).length === 0);
}

export function openImportedBoard(board: TierBoard) {
  const now = nowIso();
  return saveAndOpen({ ...board, id: createId(), updatedAt: now }, false);
}

export async function duplicateBoard(id: string) {
  const board = await getRepository().load(id);
  if (!board) return;
  const now = nowIso();
  await getRepository().save({
    ...board,
    id: createId(),
    title: `${board.title} (copy)`,
    createdAt: now,
    updatedAt: now,
  });
}

export async function renameBoard(id: string, title: string) {
  const board = await getRepository().load(id);
  if (!board) return;
  await getRepository().save({ ...board, title: title.trim() || board.title, updatedAt: nowIso() });
}
