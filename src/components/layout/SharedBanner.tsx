import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveSharedBoard } from '@/features/sharing/saveShared';

export function SharedBanner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-accent px-4 py-2 text-center text-sm text-accent-ink">
      <span>
        <strong className="font-semibold">Shared board.</strong> Changes stay on this screen until
        you save it.
      </span>
      <Button
        size="sm"
        className="bg-white/95 text-[#1b1e27] ring-0 hover:bg-white"
        icon={<Download className="size-4" />}
        onClick={saveSharedBoard}
      >
        Save to My Boards
      </Button>
    </div>
  );
}
