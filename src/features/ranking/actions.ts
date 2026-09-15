/**
 * Named, undoable board actions used by the UI. Each wraps a pure operation
 * from boardOps in `useBoardStore.apply` and adds the small bits of product
 * behaviour around it: undo toasts for destructive actions, the drop pop, the
 * "ranking complete" and "F → S" moments.
 */
import { useBoardStore, getBoard } from '@/stores/boardStore';
import { toast, useUiStore } from '@/stores/uiStore';
import {
  UNRANKED_ID,
  type BoardSettings,
  type BoardThemeId,
  type ContainerId,
  type RankItem,
  type Tier,
  type TierBoard,
} from '@/models/board';
import * as ops from './boardOps';
import { DEFAULT_PRESET, paletteColor, type TierPreset } from './presets';

const apply = (update: (board: TierBoard) => TierBoard, coalesceKey?: string) =>
  useBoardStore.getState().apply(update, { coalesceKey });

const undoAction = { label: 'Undo', run: () => actions.undo() };

function nameOf(itemId: string) {
  return getBoard()?.items[itemId]?.name ?? 'Item';
}

function afterMove(before: TierBoard, after: TierBoard, itemId: string) {
  const ui = useUiStore.getState();
  ui.markDropped(itemId);
  const total = Object.keys(after.items).length;
  if (before.unrankedItemIds.length > 0 && after.unrankedItemIds.length === 0 && total > 1) {
    ui.celebrate({ kind: 'complete' });
    return;
  }
  const from = ops.findItemContainer(before, itemId);
  const to = ops.findItemContainer(after, itemId);
  const last = before.tiers.length - 1;
  if (
    last >= 2 &&
    from &&
    to &&
    ops.tierIndex(before, from) === last &&
    ops.tierIndex(after, to) === 0
  ) {
    ui.celebrate({ kind: 'glow-up', itemId });
  }
}

export const actions = {
  undo() {
    if (useBoardStore.getState().undo()) useUiStore.getState().select(null);
  },
  redo() {
    useBoardStore.getState().redo();
  },

  // Items -------------------------------------------------------------------
  addItems(drafts: ops.ItemDraft[], containerId: ContainerId = UNRANKED_ID): RankItem[] {
    let added: RankItem[] = [];
    apply((board) => {
      const result = ops.addItems(board, drafts, containerId);
      added = result.added;
      return result.board;
    });
    return added;
  },

  moveItem(itemId: string, containerId: ContainerId, index?: number) {
    const before = getBoard();
    if (!before) return;
    if (apply((board) => ops.moveItem(board, itemId, containerId, index))) {
      afterMove(before, getBoard()!, itemId);
    }
  },

  /** Rank by tier position (number keys, Quick Rank). -1 = Unranked. */
  rankItem(itemId: string, tierPosition: number) {
    const board = getBoard();
    if (!board) return;
    const target = tierPosition < 0 ? UNRANKED_ID : board.tiers[tierPosition]?.id;
    if (target) actions.moveItem(itemId, target);
  },

  updateItem(itemId: string, patch: Partial<Omit<RankItem, 'id'>>, field?: string) {
    apply(
      (board) => ops.updateItem(board, itemId, patch),
      field ? `item:${itemId}:${field}` : undefined,
    );
  },

  deleteItem(itemId: string) {
    const name = nameOf(itemId);
    if (apply((board) => ops.removeItem(board, itemId))) {
      const ui = useUiStore.getState();
      if (ui.selectedItemId === itemId) ui.select(null);
      ui.openEditor(null);
      toast({ message: `Deleted ${name}`, action: undoAction });
    }
  },

  duplicateItem(itemId: string): string | null {
    let newId: string | null = null;
    apply((board) => {
      const result = ops.duplicateItem(board, itemId);
      newId = result.newId;
      return result.board;
    });
    return newId;
  },

  // Board -------------------------------------------------------------------
  renameBoard(title: string) {
    apply((board) => (board.title === title ? board : { ...board, title }), 'board:title');
  },

  updateSettings(patch: Partial<BoardSettings>) {
    apply((board) => ({ ...board, settings: { ...board.settings, ...patch } }));
  },

  setBoardTheme(theme: BoardThemeId, recolor: boolean) {
    apply((board) => {
      const withTheme = { ...board, settings: { ...board.settings, theme } };
      return recolor ? ops.recolorTiers(withTheme, (i, n) => paletteColor(theme, i, n)) : withTheme;
    });
  },

  // Tiers -------------------------------------------------------------------
  addTier(index?: number) {
    apply((board) => ops.addTier(board, {}, index));
  },
  updateTier(tierId: string, patch: Partial<Pick<Tier, 'name' | 'color'>>) {
    apply(
      (board) => ops.updateTier(board, tierId, patch),
      `tier:${tierId}:${Object.keys(patch).join()}`,
    );
  },
  deleteTier(tierId: string, mode: ops.TierDeleteMode = 'unrank') {
    const tier = getBoard()?.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    if (apply((board) => ops.deleteTier(board, tierId, mode))) {
      const moved =
        mode === 'unrank' && tier.itemIds.length
          ? ` · ${tier.itemIds.length} moved to Unranked`
          : '';
      toast({ message: `Deleted tier ${tier.name}${moved}`, action: undoAction });
    }
  },
  duplicateTier(tierId: string) {
    apply((board) => ops.duplicateTier(board, tierId));
  },
  moveTier(from: number, to: number) {
    apply((board) => ops.moveTier(board, from, to));
  },
  applyPreset(preset: TierPreset) {
    apply((board) => ops.applyTierPreset(board, preset));
  },
  resetTiers() {
    apply((board) => ops.applyTierPreset(board, DEFAULT_PRESET));
  },
  clearTier(tierId: string) {
    apply((board) => {
      const ids = ops.getContainerItems(board, tierId);
      return ids.reduce((b, id) => ops.moveItem(b, id, UNRANKED_ID), board);
    });
  },

  // Bulk --------------------------------------------------------------------
  sortContainer(containerId: ContainerId, mode: ops.SortMode) {
    apply((board) => ops.sortContainer(board, containerId, mode));
  },
  clearRankings() {
    if (apply(ops.clearRankings))
      toast({ message: 'Everything is back in Unranked', action: undoAction });
  },
  deleteAllItems() {
    if (apply(ops.deleteAllItems)) toast({ message: 'Deleted all items', action: undoAction });
  },
  reorderWithin(containerId: ContainerId, ordered: string[]) {
    apply((board) => ops.reorderWithin(board, containerId, ordered));
  },
  applyBuckets(buckets: string[][]) {
    const before = getBoard();
    if (!before) return;
    if (
      apply((board) => ops.applyBuckets(board, buckets)) &&
      before.unrankedItemIds.length > 0 &&
      getBoard()!.unrankedItemIds.length === 0
    ) {
      useUiStore.getState().celebrate({ kind: 'complete' });
    }
  },
  replaceBoard(next: TierBoard) {
    apply(() => next);
  },
};
