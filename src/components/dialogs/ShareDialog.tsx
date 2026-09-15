import { AlertTriangle, Check, Copy, Download, ImageOff, Loader2, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { copyText } from '@/features/exporting/download';
import { shareTransport, type ShareLink } from '@/features/sharing/shareTransport';
import { useBoard } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const openDialog = useUiStore((state) => state.openDialog);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shareTransport.createLink(board).then((result) => !cancelled && setLink(result));
    return () => {
      cancelled = true;
    };
  }, [board]);

  const copy = async () => {
    if (!link) return;
    if (await copyText(link.url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nativeShare = typeof navigator.share === 'function';

  return (
    <Dialog
      open
      onClose={onClose}
      title="Share this board"
      description="Anyone with the link sees this board as it is right now. The board lives inside the link, so nothing is uploaded anywhere."
    >
      {!link ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Creating link" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              readOnly
              value={link.url}
              aria-label="Share link"
              onFocus={(event) => event.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-[10px] bg-surface-2 px-3 font-mono text-xs text-muted ring-1 ring-line outline-none ring-inset focus:ring-2 focus:ring-accent"
            />
            <Button
              variant="primary"
              className="h-11"
              data-autofocus
              icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              onClick={copy}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
          {nativeShare && (
            <Button
              className="w-full"
              icon={<Share className="size-4" />}
              onClick={() =>
                navigator.share({ title: board.title, url: link.url }).catch(() => undefined)
              }
            >
              Share…
            </Button>
          )}

          {link.strippedImages > 0 && (
            <Notice icon={<ImageOff className="size-4" />}>
              {link.strippedImages} uploaded image{link.strippedImages === 1 ? '' : 's'} can’t fit
              in a link, so {link.strippedImages === 1 ? 'that item shows' : 'those items show'} as
              text. To send the pictures too, share an image of the board or the board file.
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  icon={<Download className="size-4" />}
                  onClick={() => openDialog('export')}
                >
                  Export image or file
                </Button>
              </div>
            </Notice>
          )}
          {link.isLong && (
            <Notice
              icon={<AlertTriangle className="size-4" />}
              tone={link.isTooLong ? 'danger' : 'default'}
            >
              This link is {link.url.length.toLocaleString()} characters.{' '}
              {link.isTooLong
                ? 'That is too long for most apps. Send the board file instead. It opens with Import.'
                : 'Some chat apps cut off long links. If it doesn’t open, send the board file instead.'}
              <div className="mt-2">
                <Button
                  size="sm"
                  icon={<Download className="size-4" />}
                  onClick={() => openDialog('export')}
                >
                  Get the board file
                </Button>
              </div>
            </Notice>
          )}
          <p className="text-xs text-muted">
            The link opens as a temporary copy. The recipient can rearrange it and choose Save to My
            Boards. It never changes your board.
          </p>
        </div>
      )}
    </Dialog>
  );
}

function Notice({
  icon,
  children,
  tone = 'default',
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <div
      className={`flex gap-2.5 rounded-[12px] p-3 text-sm ${tone === 'danger' ? 'bg-danger/10' : 'bg-surface-2'}`}
    >
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <div>{children}</div>
    </div>
  );
}
