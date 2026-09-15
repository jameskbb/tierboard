import { Dialog } from '@/components/ui/Dialog';
import { Kbd, MOD } from '@/components/ui/Kbd';

const GROUPS: { title: string; items: [string[], string][] }[] = [
  {
    title: 'Everywhere',
    items: [
      [['N'], 'Add items'],
      [['/'], 'Search items'],
      [[MOD, 'K'], 'Command palette'],
      [[MOD, 'Z'], 'Undo'],
      [[MOD, 'Shift', 'Z'], 'Redo'],
      [['?'], 'This list'],
      [['Esc'], 'Close, clear search, exit presentation'],
    ],
  },
  {
    title: 'Group',
    items: [
      [['F'], 'Present to the room'],
      [['R'], 'Pick a random unranked item'],
      [['Q'], 'Quick rank'],
      [['V'], 'Vote on the selected item'],
      [['D'], 'Random debate'],
      [['E'], 'Export'],
    ],
  },
  {
    title: 'Selected item',
    items: [
      [['Tab'], 'Move between items'],
      [['1', '–', '9'], 'Put it in that tier'],
      [['0'], 'Back to Unranked'],
      [['Enter'], 'Edit'],
      [['Space'], 'Pick up, arrows to move, Space to drop'],
      [['Delete'], 'Delete'],
    ],
  },
  {
    title: 'Quick rank and compare',
    items: [
      [['1', '–', '9'], 'Choose a tier'],
      [['Space'], 'Skip for now'],
      [['⌫'], 'Undo last'],
      [['←', '→'], 'Pick left or right (compare)'],
    ],
  },
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} title="Keyboard shortcuts" size="lg">
      <div className="grid gap-6 sm:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-sm font-semibold">{group.title}</h3>
            <dl className="space-y-1.5">
              {group.items.map(([keys, label]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="flex shrink-0 items-center gap-1">
                    {keys.map((key) =>
                      key === '–' ? (
                        <span key={key} className="text-muted">
                          –
                        </span>
                      ) : (
                        <Kbd key={key}>{key}</Kbd>
                      ),
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
