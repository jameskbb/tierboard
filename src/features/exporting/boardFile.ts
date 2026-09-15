import { BoardImportError, migrateBoard } from '@/models/migrate';
import { SCHEMA_VERSION, type TierBoard } from '@/models/board';

export interface BoardFile {
  app: 'tierboard';
  schemaVersion: number;
  exportedAt: string;
  board: TierBoard;
}

export function serializeBoardFile(board: TierBoard): string {
  const file: BoardFile = {
    app: 'tierboard',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    board,
  };
  return JSON.stringify(file, null, 2);
}

/** Accepts a Tierboard export file or a bare board object (any schema version). */
export function parseBoardFile(text: string): TierBoard {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BoardImportError('That file is not valid JSON.');
  }
  if (typeof parsed === 'object' && parsed !== null && 'board' in parsed) {
    const wrapper = parsed as { board: unknown; schemaVersion?: unknown };
    const board = wrapper.board;
    if (typeof board === 'object' && board !== null && !('schemaVersion' in board)) {
      return migrateBoard({ ...board, schemaVersion: wrapper.schemaVersion });
    }
    return migrateBoard(board);
  }
  return migrateBoard(parsed);
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'tierboard'
  );
}
