import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ItemChip } from '@/components/items/ItemChip';
import { TierRow } from '@/components/tiers/TierRow';
import { actions } from '@/features/ranking/actions';
import { normalizeName } from '@/features/importing/parseItems';
import { tierLabelStyle } from '@/lib/boardThemes';
import { UNRANKED_ID, type ContainerId, type TierBoard } from '@/models/board';
import { useUiStore } from '@/stores/uiStore';
import { UnrankedTray } from './UnrankedTray';

type Containers = Record<ContainerId, string[]>;

interface DragState {
  activeId: string;
  kind: 'item' | 'tier';
  /** Live preview of container contents while an item is dragged. */
  containers: Containers | null;
}

const containersOf = (board: TierBoard): Containers => {
  const containers: Containers = { [UNRANKED_ID]: board.unrankedItemIds };
  for (const tier of board.tiers) containers[tier.id] = tier.itemIds;
  return containers;
};

const findContainer = (containers: Containers, id: UniqueIdentifier): ContainerId | null => {
  if (id in containers) return id as ContainerId;
  return Object.keys(containers).find((key) => containers[key]!.includes(id as string)) ?? null;
};

const tierIdOf = (id: UniqueIdentifier) => String(id).replace(/^tier:/, '');

/** Items prefer the item under the pointer, then the row/tray; tiers only collide with tiers. */
const collisionDetection: CollisionDetection = (args) => {
  const kind = args.active.data.current?.type;
  if (kind === 'tier') {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'tier'),
    });
  }
  const droppableContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type !== 'tier',
  );
  const hits = pointerWithin({ ...args, droppableContainers });
  if (hits.length > 0) {
    const itemHit = hits.find((hit) => hit.data?.droppableContainer?.data.current?.type === 'item');
    return [itemHit ?? hits[0]!];
  }
  return closestCorners({ ...args, droppableContainers });
};

export function useSearchMatches(board: TierBoard): Set<string> | null {
  const search = useUiStore((state) => state.search);
  return useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    const normalized = normalizeName(query);
    const matches = new Set<string>();
    for (const item of Object.values(board.items)) {
      const haystack = [item.name, item.subtitle, item.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (
        haystack.includes(query) ||
        (normalized && normalizeName(haystack).includes(normalized))
      ) {
        matches.add(item.id);
      }
    }
    return matches;
  }, [board.items, search]);
}

export function BoardView({ board, presenting }: { board: TierBoard; presenting: boolean }) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const matches = useSearchMatches(board);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Long-press to drag on touch so normal scrolling keeps working.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const containers = drag?.containers ?? containersOf(board);
  const tierIds = useMemo(() => board.tiers.map((tier) => `tier:${tier.id}`), [board.tiers]);

  const containerName = useCallback(
    (id: ContainerId | null) =>
      id === UNRANKED_ID ? 'Unranked' : `${board.tiers.find((t) => t.id === id)?.name ?? ''} tier`,
    [board.tiers],
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const kind = active.data.current?.type === 'tier' ? 'tier' : 'item';
    useUiStore.getState().openEditor(null);
    setDrag({
      activeId: String(active.id),
      kind,
      containers: kind === 'item' ? containersOf(board) : null,
    });
    if (navigator.vibrate && kind === 'item') navigator.vibrate(8);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!drag?.containers || !over) return;
    const from = findContainer(drag.containers, active.id);
    const to = findContainer(drag.containers, over.id);
    if (!from || !to || from === to) return;
    setDrag((current) => {
      if (!current?.containers) return current;
      const source = current.containers[from]!.filter((id) => id !== active.id);
      const target = [...current.containers[to]!];
      const overIndex = target.indexOf(String(over.id));
      let index = target.length;
      if (overIndex >= 0) {
        const activeRect = active.rect.current.translated;
        const isAfter = activeRect && activeRect.left > over.rect.left + over.rect.width / 2;
        index = overIndex + (isAfter ? 1 : 0);
      }
      target.splice(index, 0, String(active.id));
      return { ...current, containers: { ...current.containers, [from]: source, [to]: target } };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const state = drag;
    setDrag(null);
    if (!state || !over) return;

    if (state.kind === 'tier') {
      const from = board.tiers.findIndex((t) => t.id === tierIdOf(active.id));
      const to = board.tiers.findIndex((t) => t.id === tierIdOf(over.id));
      if (from >= 0 && to >= 0 && from !== to) actions.moveTier(from, to);
      return;
    }

    const preview = state.containers!;
    const container = findContainer(preview, active.id);
    if (!container) return;
    let ids = preview[container]!;
    const overIndex = ids.indexOf(String(over.id));
    const activeIndex = ids.indexOf(String(active.id));
    if (overIndex >= 0 && overIndex !== activeIndex) ids = arrayMove(ids, activeIndex, overIndex);
    actions.moveItem(String(active.id), container, ids.indexOf(String(active.id)));
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      active.data.current?.type === 'tier'
        ? `Picked up ${containerName(tierIdOf(active.id))}.`
        : `Picked up ${board.items[active.id as string]?.name}.`,
    onDragOver: ({ active, over }) => {
      if (!over) return undefined;
      if (active.data.current?.type === 'tier') return `Over ${containerName(tierIdOf(over.id))}.`;
      const target = drag?.containers ? findContainer(drag.containers, over.id) : null;
      return `${board.items[active.id as string]?.name} is over ${containerName(target)}.`;
    },
    onDragEnd: ({ active, over }) => {
      if (!over) return 'Dropped. Nothing moved.';
      if (active.data.current?.type === 'tier')
        return `Moved ${containerName(tierIdOf(active.id))}.`;
      const target = drag?.containers ? findContainer(drag.containers, active.id) : null;
      return `${board.items[active.id as string]?.name} dropped in ${containerName(target)}.`;
    },
    onDragCancel: () => 'Drag cancelled. Nothing moved.',
  };

  const activeItem = drag?.kind === 'item' ? board.items[drag.activeId] : undefined;
  const activeTier =
    drag?.kind === 'tier' ? board.tiers.find((t) => t.id === tierIdOf(drag.activeId)) : undefined;
  const compact = board.settings.itemSize === 'compact';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'To pick up an item, press space. Use the arrow keys to move it between tiers, then press space again to drop it, or escape to cancel. You can also press a number key to rank it.',
        },
      }}
    >
      <div className="flex flex-col gap-[var(--row-gap)]" role="list" aria-label="Tiers">
        <SortableContext items={tierIds} strategy={verticalListSortingStrategy}>
          {board.tiers.map((tier, index) => (
            <TierRow
              key={tier.id}
              tier={tier}
              index={index}
              itemIds={containers[tier.id] ?? tier.itemIds}
              items={board.items}
              settings={board.settings}
              tierCount={board.tiers.length}
              matches={matches}
              dragging={drag?.kind === 'item'}
              presenting={presenting}
            />
          ))}
        </SortableContext>
      </div>

      <div className="mt-[calc(14px*var(--scale))]">
        <UnrankedTray
          itemIds={containers[UNRANKED_ID] ?? board.unrankedItemIds}
          items={board.items}
          compact={compact}
          matches={matches}
          totalItems={Object.keys(board.items).length}
          presenting={presenting}
        />
      </div>

      {createPortal(
        <DragOverlay
          dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }}
          zIndex={70}
        >
          {activeItem && (
            <div
              className="board"
              data-board-theme={board.settings.theme}
              data-presenting={presenting}
              style={{ background: 'transparent', padding: 0 }}
            >
              <ItemChip item={activeItem} compact={compact} lifted />
            </div>
          )}
          {activeTier && (
            <div
              className="board"
              data-board-theme={board.settings.theme}
              data-presenting={presenting}
              style={{ background: 'transparent', padding: 0 }}
            >
              <div className="flex h-16 items-stretch overflow-hidden rounded-[var(--row-radius)] bg-[var(--row-bg)] shadow-lift">
                <div
                  className="tier-label flex w-24 items-center justify-center font-display text-2xl font-extrabold"
                  style={tierLabelStyle(board.settings.theme, activeTier.color)}
                >
                  {activeTier.name}
                </div>
                <div className="flex items-center px-4 text-sm opacity-70">
                  {activeTier.itemIds.length} item{activeTier.itemIds.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
