import { Check, Copy, Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Segmented, Toggle } from '@/components/ui/Controls';
import { serializeBoardFile, slugify } from '@/features/exporting/boardFile';
import { boardToCsv } from '@/features/exporting/csv';
import { canCopyImage, copyImage, downloadBlob, downloadText } from '@/features/exporting/download';
import {
  canvasToBlob,
  renderBoardImage,
  type RenderOptions,
} from '@/features/exporting/renderBoardImage';
import { inlineLocalImages } from '@/features/persistence/imageStore';
import { actions } from '@/features/ranking/actions';
import { themeMeta } from '@/lib/boardThemes';
import { useBoard } from '@/stores/boardStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { toast } from '@/stores/uiStore';

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const board = useBoard()!;
  const scale = usePrefsStore((state) => state.exportScale);
  const setScale = usePrefsStore((state) => state.setExportScale);
  const fixedLook = ['neon', 'arcade', 'retro'].includes(board.settings.theme);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [includeUnranked, setIncludeUnranked] = useState(false);
  const [includeHotTakes, setIncludeHotTakes] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const renderRef = useRef<Promise<HTMLCanvasElement> | null>(null);

  const options: RenderOptions = useMemo(
    () => ({
      scale,
      dark,
      branding: board.settings.showBranding,
      includeUnranked,
      includeHotTakes,
    }),
    [scale, dark, board.settings.showBranding, includeUnranked, includeHotTakes],
  );

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    const render = renderBoardImage(board, options);
    renderRef.current = render;
    render
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => !cancelled && toast({ message: 'Could not render the image.', tone: 'error' }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [board, options]);

  const fileBase = slugify(board.title);
  const hasHotTakeNotes = Object.values(board.items).some(
    (item) => item.hotTake && item.hotTakeNote,
  );

  const downloadPng = async () => {
    const canvas = await (renderRef.current ?? renderBoardImage(board, options));
    downloadBlob(`${fileBase}${scale === 2 ? '@2x' : ''}.png`, await canvasToBlob(canvas));
  };

  const copy = async () => {
    try {
      await copyImage((renderRef.current ?? renderBoardImage(board, options)).then(canvasToBlob));
      setCopied(true);
      toast({ message: 'Image copied. Paste it into Slack, Teams or Discord.', tone: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        message: 'This browser blocked copying images. Download it instead.',
        tone: 'error',
      });
    }
  };

  const exportJson = async () => {
    downloadText(
      `${fileBase}.tierboard.json`,
      serializeBoardFile(await inlineLocalImages(board)),
      'application/json',
    );
  };

  return (
    <Dialog open onClose={onClose} title="Export" size="xl">
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="flex min-h-64 items-start justify-center overflow-hidden rounded-[14px] bg-sunken p-3">
          {preview ? (
            <img
              src={preview}
              alt={`Preview of ${board.title}`}
              className="max-h-[58dvh] w-auto rounded-[8px] shadow-lift"
            />
          ) : (
            <Loader2 className="mt-24 size-6 animate-spin text-muted" aria-label="Rendering" />
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              icon={<Download className="size-4" />}
              onClick={downloadPng}
            >
              Download PNG
            </Button>
            {canCopyImage() && (
              <Button
                className="w-full"
                icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                onClick={copy}
              >
                {copied ? 'Copied' : 'Copy image'}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Segmented
              label="Resolution"
              value={String(scale)}
              onChange={(value) => setScale(value === '2' ? 2 : 1)}
              options={[
                { value: '1', label: 'Standard' },
                { value: '2', label: 'High-res' },
              ]}
            />
            {!fixedLook && (
              <Segmented
                label="Background"
                value={dark ? 'dark' : 'light'}
                onChange={(value) => setDark(value === 'dark')}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            )}
            {fixedLook && (
              <p className="text-xs text-muted">
                Uses the {themeMeta(board.settings.theme).name} board theme.
              </p>
            )}
            {board.unrankedItemIds.length > 0 && (
              <Toggle
                label={`Include Unranked (${board.unrankedItemIds.length})`}
                checked={includeUnranked}
                onChange={setIncludeUnranked}
              />
            )}
            {hasHotTakeNotes && (
              <Toggle
                label="List hot takes"
                checked={includeHotTakes}
                onChange={setIncludeHotTakes}
              />
            )}
            <Toggle
              label="“Made with Tierboard”"
              checked={board.settings.showBranding}
              onChange={(showBranding) => actions.updateSettings({ showBranding })}
            />
          </div>

          <div className="space-y-1.5 border-t border-line pt-4">
            <div className="text-xs font-medium text-muted">Files</div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              icon={<FileJson className="size-4" />}
              onClick={exportJson}
            >
              Board file (.json)
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              icon={<FileSpreadsheet className="size-4" />}
              onClick={() => downloadText(`${fileBase}.csv`, boardToCsv(board), 'text/csv')}
            >
              Spreadsheet (.csv)
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
