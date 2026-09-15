# Architecture

Tierboard is a static single-page app. There is no server: boards live in the browser, and sharing
puts the board inside the URL. This document explains how the pieces fit together and where a future
realtime backend would plug in.

## Data model

`src/models/board.ts` defines everything that is persisted, shared or exported:

```ts
interface TierBoard {
  id: string;
  schemaVersion: number; // currently 1
  title: string;
  description?: string;
  createdAt: string; // ISO timestamps, never Date objects
  updatedAt: string;
  tiers: Tier[]; // { id, name, color, itemIds[] }, in display order
  unrankedItemIds: string[];
  items: Record<string, RankItem>; // name, subtitle, emoji, image, accent, notes, url, hotTake, hotTakeNote
  settings: BoardSettings; // theme, showCounts, showBranding, itemSize
}
```

Items are stored once in `items`. Tiers and the Unranked tray hold ordered id lists. Every item is in
exactly one container, and `migrateBoard()` enforces that invariant for anything coming from outside
(older localStorage data, JSON imports, share links). Uploaded images are stored in IndexedDB and
referenced as `local:<id>`.

### Migrations

`src/models/migrate.ts` holds a table of `version → upgrade(raw)` steps, followed by one normalization
pass. To change the schema:

1. Bump `SCHEMA_VERSION`.
2. Add a `MIGRATIONS[oldVersion]` step.
3. Add a test with a fixture in the old shape.

## State and history

```
UI event → actions.* → useBoardStore.apply(op) → pushHistory → autosave
                          (op: pure fn from boardOps)
```

- `features/ranking/boardOps.ts` has pure, immutable board operations: move, add, delete, tier
  changes, presets, sorting, buckets. It has no React and no I/O.
- `stores/boardStore.ts` holds a snapshot history (`past / present / future`). Each `apply` pushes
  the new board. Rapid edits with the same coalesce key (typing a title, for example) merge into a
  single undo step.
- `features/ranking/actions.ts` gives each operation a name and adds product behavior: undo toasts
  on destructive actions, the drop animation, and the "ranking complete" celebration.
- Drag and drop keeps a live preview of container contents in local component state while dragging.
  It commits one `moveItem` on drop, so each drag is exactly one undo step.
- `stores/uiStore.ts` holds ephemeral UI state (open dialog, selection, search, presentation mode,
  toasts) and is never persisted.

## Persistence

`BoardRepository` (`features/persistence/boardRepository.ts`):

```ts
interface BoardRepository {
  list(): Promise<BoardSummary[]>;
  load(id: string): Promise<TierBoard | null>;
  save(board: TierBoard): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(listener: (boardId: string) => void): () => void;
}
```

The default implementation uses localStorage: one key per board plus a summary index for the home
screen. Its `subscribe` listens to `storage` events, so two open tabs stay in sync. `useAutosave`
debounces writes and flushes them when the page is hidden.

## Sharing

`features/sharing/shareCodec.ts` converts the board to a compact form (items referenced by index,
short keys), compresses it with the native `CompressionStream('deflate-raw')`, and base64url-encodes
the result. The payload has a version prefix (`1z…`), so the format can change later.

`ShareTransport.createLink(board)` is the only thing the UI calls. The current transport writes
`#/s/<payload>`. A hash never reaches the server, so GitHub Pages never sees the board. Opening a link
decodes into an in-memory board in `shared` mode, and autosave skips it until the user chooses
**Save to My Boards**.

Local images can't be embedded in a URL. The codec strips them and reports a count, and the share
dialog offers PNG or JSON export instead.

## Export

`features/exporting/renderBoardImage.ts` lays out and paints the board directly on a canvas instead of
screenshotting the DOM. That gives predictable output with no UI controls. Remote images are loaded
with CORS, and any that refuse fall back to emoji or text, so the canvas never becomes tainted. The
export dialog is lazy-loaded.

## Future: live rooms

The goal is `…/room/PIZZA`: everyone at lunch opens the room on their phone, the host puts an item up,
everyone votes, and the shared board updates live.

The seams already exist:

| Concern       | Today                                            | Live rooms                                                                                                                                           |
| ------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Board storage | `createLocalStorageRepository()`                 | A `BoardRepository` backed by Supabase, Firebase or a room server; `subscribe` pushes remote changes and `BoardPage` already reloads on them         |
| Board edits   | `apply(op)` on local snapshots                   | Broadcast `op` calls (they are pure and deterministic) or replicate whole boards; a CRDT library could replace history                               |
| Voting        | `createLocalVoteChannel()` + `applyVote` reducer | A `VoteChannel` over WebSockets or realtime rows, with each participant sending `VoteEvent { itemId, choice, delta, voterId }` into the same reducer |
| Sharing       | `ShareTransport` writing the URL hash            | A transport that returns a short link or room code                                                                                                   |

A backend would be optional. The static GitHub Pages build would keep working with the local
implementations.
