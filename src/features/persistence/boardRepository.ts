/**
 * Where boards live. The app only talks to {@link BoardRepository}; today it is
 * backed by localStorage. A realtime backend (Supabase, Firebase, a WebSocket
 * room server) can implement the same interface — `subscribe` is the hook for
 * pushing remote changes into an open board.
 */
import { migrateBoard } from '@/models/migrate';
import { summarizeBoard, type BoardSummary, type TierBoard } from '@/models/board';

export interface BoardRepository {
  list(): Promise<BoardSummary[]>;
  load(id: string): Promise<TierBoard | null>;
  save(board: TierBoard): Promise<void>;
  remove(id: string): Promise<void>;
  /** Notified when a board changes outside this tab/device. */
  subscribe(listener: (boardId: string) => void): () => void;
}

export class StorageFullError extends Error {
  override name = 'StorageFullError';
}

const PREFIX = 'tierboard:v1';
const INDEX_KEY = `${PREFIX}:index`;
const boardKey = (id: string) => `${PREFIX}:board:${id}`;

export function createLocalStorageRepository(
  storage: Storage = window.localStorage,
): BoardRepository {
  const readIndex = (): BoardSummary[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(INDEX_KEY) ?? '[]');
      return Array.isArray(parsed) ? (parsed as BoardSummary[]) : [];
    } catch {
      return [];
    }
  };
  const writeIndex = (index: BoardSummary[]) => storage.setItem(INDEX_KEY, JSON.stringify(index));

  return {
    async list() {
      return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async load(id) {
      const raw = storage.getItem(boardKey(id));
      if (!raw) return null;
      try {
        return migrateBoard(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    async save(board) {
      try {
        storage.setItem(boardKey(board.id), JSON.stringify(board));
        const index = readIndex().filter((entry) => entry.id !== board.id);
        index.push(summarizeBoard(board));
        writeIndex(index);
      } catch (error) {
        if (error instanceof DOMException && /quota/i.test(error.name + error.message)) {
          throw new StorageFullError(
            'Browser storage is full. Delete old boards or remove large inline images.',
          );
        }
        throw error;
      }
    },
    async remove(id) {
      storage.removeItem(boardKey(id));
      writeIndex(readIndex().filter((entry) => entry.id !== id));
    },
    subscribe(listener) {
      const onStorage = (event: StorageEvent) => {
        const match = event.key?.match(/^tierboard:v1:board:(.+)$/);
        if (match) listener(match[1]!);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  };
}

let repository: BoardRepository | null = null;

export function getRepository(): BoardRepository {
  repository ??= createLocalStorageRepository();
  return repository;
}

/** Tests or a future backend can swap the implementation. */
export function setRepository(next: BoardRepository) {
  repository = next;
}
