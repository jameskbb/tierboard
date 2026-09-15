/**
 * Dedicated PNG renderer. Instead of screenshotting the interactive DOM (which
 * would capture hover controls, scroll positions and cross-origin image
 * failures), the board is laid out and painted directly onto a canvas.
 * Remote images load with CORS; any that refuse are replaced by emoji/initials
 * so the canvas never becomes tainted and export always succeeds.
 */
import { resolveImageSrc } from '@/features/persistence/imageStore';
import { readableText } from '@/lib/color';
import type { BoardThemeId, RankItem, TierBoard } from '@/models/board';

export interface RenderOptions {
  scale: 1 | 2;
  dark: boolean;
  branding: boolean;
  includeUnranked: boolean;
  includeHotTakes: boolean;
}

interface Palette {
  bg: string;
  row: string;
  rowStroke?: string;
  chip: string;
  chipStroke: string;
  chipShadow?: string;
  text: string;
  muted: string;
  labelFont: string;
  labelUpper: boolean;
  filledLabels: boolean;
  radius: number;
  chipRadius: number;
}

const DISPLAY = '"Bricolage Grotesque Variable", "Inter Variable", system-ui, sans-serif';
const SANS = '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function paletteFor(theme: BoardThemeId, dark: boolean): Palette {
  const base: Palette = dark
    ? {
        bg: '#13151b',
        row: '#1c1f28',
        chip: '#262a36',
        chipStroke: '#343947',
        text: '#eceef3',
        muted: '#9aa3b5',
        labelFont: DISPLAY,
        labelUpper: false,
        filledLabels: true,
        radius: 14,
        chipRadius: 10,
      }
    : {
        bg: '#eef0f4',
        row: '#ffffff',
        chip: '#f4f5f8',
        chipStroke: '#d9dde5',
        text: '#1b1e27',
        muted: '#5f6879',
        labelFont: DISPLAY,
        labelUpper: false,
        filledLabels: true,
        radius: 14,
        chipRadius: 10,
      };
  switch (theme) {
    case 'neon':
      return {
        ...base,
        bg: '#0d0b1a',
        row: '#15122a',
        chip: '#1d1938',
        chipStroke: '#342d63',
        text: '#f1eeff',
        muted: '#a49fc9',
        filledLabels: false,
      };
    case 'minimal':
      return {
        ...base,
        row: base.bg,
        rowStroke: dark ? '#2e3340' : '#d9dde5',
        chip: dark ? '#1c1f28' : '#ffffff',
        filledLabels: false,
        chipRadius: 999,
        radius: 0,
      };
    case 'retro':
      return {
        ...base,
        bg: '#f1e6cf',
        row: '#fbf3e2',
        rowStroke: '#2b2118',
        chip: '#fffaf0',
        chipStroke: '#2b2118',
        chipShadow: '#2b2118',
        text: '#2b2118',
        muted: '#6b5b48',
        labelFont: 'Georgia, "Iowan Old Style", serif',
        radius: 10,
        chipRadius: 6,
      };
    case 'arcade':
      return {
        ...base,
        bg: '#0a0f1f',
        row: '#111831',
        chip: '#182246',
        chipStroke: '#2f3d74',
        chipShadow: '#05081a',
        text: '#e9f0ff',
        muted: '#8f9cc8',
        labelFont: MONO,
        labelUpper: true,
        radius: 4,
        chipRadius: 3,
      };
    default:
      return base;
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
    setTimeout(() => resolve(null), 6000);
  });
}

async function loadImages(items: RankItem[]) {
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    items.map(async (item) => {
      if (!item.image) return;
      const src = await resolveImageSrc(item.image);
      const image = src ? await loadImage(src) : null;
      if (image) images.set(item.id, image);
    }),
  );
  return images;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low).trimEnd() + '…';
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncate(ctx, kept[maxLines - 1] + '…', maxWidth);
    return kept;
  }
  return lines;
}

const WIDTH = 1200;
const PAD = 48;
const LABEL_W = 124;
const CHIP_H = 52;
const GAP = 8;
const ROW_PAD = 12;
const CHIP_MAX_W = 300;

interface ChipLayout {
  item: RankItem;
  x: number;
  y: number;
  w: number;
  label: string;
}

function layoutChips(
  ctx: CanvasRenderingContext2D,
  ids: string[],
  board: TierBoard,
  images: Map<string, HTMLImageElement>,
  areaWidth: number,
) {
  ctx.font = `600 17px ${SANS}`;
  const chips: ChipLayout[] = [];
  let x = 0;
  let y = 0;
  for (const id of ids) {
    const item = board.items[id];
    if (!item) continue;
    const visual = images.has(id) || !!item.emoji;
    const inner = CHIP_MAX_W - 28 - (visual ? 44 : 0);
    const label = truncate(ctx, item.name, inner);
    const w = Math.ceil(ctx.measureText(label).width + 28 + (visual ? 44 : 0));
    if (x > 0 && x + w > areaWidth) {
      x = 0;
      y += CHIP_H + GAP;
    }
    chips.push({ item, x, y, w, label });
    x += w + GAP;
  }
  const height = chips.length ? y + CHIP_H : CHIP_H;
  return { chips, height };
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  chip: ChipLayout,
  ox: number,
  oy: number,
  palette: Palette,
  image: HTMLImageElement | undefined,
) {
  const x = ox + chip.x;
  const y = oy + chip.y;
  const radius = Math.min(palette.chipRadius, CHIP_H / 2);
  if (palette.chipShadow) {
    ctx.fillStyle = palette.chipShadow;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, chip.w, CHIP_H, radius);
    ctx.fill();
  }
  ctx.fillStyle = palette.chip;
  ctx.strokeStyle = palette.chipStroke;
  ctx.lineWidth = palette.chipShadow ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x + 0.5, y + 0.5, chip.w - 1, CHIP_H - 1, radius);
  ctx.fill();
  ctx.stroke();

  if (chip.item.accent) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = chip.item.accent;
    ctx.fillRect(x, y, 4, CHIP_H);
    ctx.restore();
  }

  let textX = x + 14;
  if (image) {
    const size = 36;
    const ix = x + 8;
    const iy = y + (CHIP_H - size) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ix, iy, size, size, 8);
    ctx.clip();
    const ratio = Math.max(size / image.width, size / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    ctx.drawImage(image, ix + (size - w) / 2, iy + (size - h) / 2, w, h);
    ctx.restore();
    textX = x + 52;
  } else if (chip.item.emoji) {
    ctx.font = `24px ${EMOJI}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(chip.item.emoji, x + 28, y + CHIP_H / 2 + 1);
    ctx.textAlign = 'left';
    textX = x + 52;
  }

  ctx.fillStyle = palette.text;
  ctx.font = `600 17px ${SANS}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(chip.label, textX, y + CHIP_H / 2 + 1);

  if (chip.item.hotTake) {
    ctx.fillStyle = '#ff6b3d';
    ctx.beginPath();
    ctx.arc(x + chip.w - 4, y + 4, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `12px ${EMOJI}`;
    ctx.textAlign = 'center';
    ctx.fillText('🔥', x + chip.w - 4, y + 5);
    ctx.textAlign = 'left';
  }
}

function drawBranding(ctx: CanvasRenderingContext2D, x: number, y: number, palette: Palette) {
  const bars: [number, string][] = [
    [18, '#FF7B72'],
    [13, '#F6D55C'],
    [8, '#6CB8FF'],
  ];
  bars.forEach(([w, color], i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y - 9 + i * 6, w, 4, 1.5);
    ctx.fill();
  });
  ctx.fillStyle = palette.muted;
  ctx.font = `500 14px ${SANS}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Made with Tierboard', x + 26, y);
}

export async function renderBoardImage(
  board: TierBoard,
  options: RenderOptions,
): Promise<HTMLCanvasElement> {
  await Promise.all(
    [`800 44px ${DISPLAY}`, `800 30px ${DISPLAY}`, `600 17px ${SANS}`, `500 14px ${SANS}`].map(
      (font) => document.fonts?.load(font).catch(() => undefined),
    ),
  );
  const palette = paletteFor(board.settings.theme, options.dark);
  const allIds = [
    ...board.tiers.flatMap((t) => t.itemIds),
    ...(options.includeUnranked ? board.unrankedItemIds : []),
  ];
  const images = await loadImages(allIds.map((id) => board.items[id]!).filter(Boolean));

  const measure = document.createElement('canvas').getContext('2d')!;
  const areaWidth = WIDTH - PAD * 2 - LABEL_W - ROW_PAD * 2;

  // Layout pass --------------------------------------------------------------
  measure.font = `800 44px ${DISPLAY}`;
  const titleLines = wrapLines(measure, board.title || 'Untitled board', WIDTH - PAD * 2, 2);
  let y = PAD + titleLines.length * 52;
  const descriptionLines = board.description
    ? ((measure.font = `400 17px ${SANS}`),
      wrapLines(measure, board.description, WIDTH - PAD * 2, 2))
    : [];
  y += descriptionLines.length * 24 + 28;

  const rows = board.tiers.map((tier) => {
    const layout = layoutChips(measure, tier.itemIds, board, images, areaWidth);
    const height = Math.max(84, layout.height + ROW_PAD * 2);
    const row = { tier, layout, y, height };
    y += height + (palette.rowStroke && board.settings.theme === 'minimal' ? 0 : 6);
    return row;
  });

  let unranked: { layout: ReturnType<typeof layoutChips>; y: number } | null = null;
  if (options.includeUnranked && board.unrankedItemIds.length) {
    y += 22;
    const layout = layoutChips(measure, board.unrankedItemIds, board, images, WIDTH - PAD * 2);
    unranked = { layout, y: y + 30 };
    y += 30 + layout.height;
  }

  const hotTakes = options.includeHotTakes
    ? Object.values(board.items).filter((item) => item.hotTake && item.hotTakeNote)
    : [];
  const hotTakeLayout: { item: RankItem; lines: string[] }[] = [];
  if (hotTakes.length) {
    y += 34;
    measure.font = `400 16px ${SANS}`;
    for (const item of hotTakes) {
      const lines = wrapLines(
        measure,
        `${item.name}: “${item.hotTakeNote}”`,
        WIDTH - PAD * 2 - 30,
        2,
      );
      hotTakeLayout.push({ item, lines });
    }
    y += 30 + hotTakeLayout.reduce((sum, h) => sum + h.lines.length * 22 + 8, 0);
  }

  y += options.branding ? 64 : PAD;
  const height = Math.ceil(y);

  // Paint pass ---------------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * options.scale;
  canvas.height = height * options.scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(options.scale, options.scale);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = palette.text;
  ctx.font = `800 44px ${DISPLAY}`;
  ctx.textBaseline = 'alphabetic';
  titleLines.forEach((line, i) => ctx.fillText(line, PAD, PAD + 40 + i * 52));
  ctx.fillStyle = palette.muted;
  ctx.font = `400 17px ${SANS}`;
  descriptionLines.forEach((line, i) =>
    ctx.fillText(line, PAD, PAD + titleLines.length * 52 + 14 + i * 24),
  );

  for (const { tier, layout, y: rowY, height: rowH } of rows) {
    ctx.fillStyle = palette.row;
    ctx.beginPath();
    ctx.roundRect(PAD, rowY, WIDTH - PAD * 2, rowH, palette.radius);
    ctx.fill();
    if (palette.rowStroke) {
      ctx.strokeStyle = palette.rowStroke;
      ctx.lineWidth = board.settings.theme === 'minimal' ? 1 : 2;
      if (board.settings.theme === 'minimal') {
        ctx.beginPath();
        ctx.moveTo(PAD, rowY + rowH - 0.5);
        ctx.lineTo(WIDTH - PAD, rowY + rowH - 0.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(PAD + 1, rowY + 1, WIDTH - PAD * 2 - 2, rowH - 2, palette.radius);
        ctx.stroke();
      }
    }

    // Label
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD, rowY, LABEL_W, rowH, [palette.radius, 0, 0, palette.radius]);
    ctx.clip();
    let labelColor = palette.text;
    if (palette.filledLabels) {
      ctx.fillStyle = tier.color;
      ctx.fillRect(PAD, rowY, LABEL_W, rowH);
      labelColor = readableText(tier.color);
    } else if (board.settings.theme === 'neon') {
      ctx.strokeStyle = tier.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = tier.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(PAD + 8, rowY + 8, LABEL_W - 16, rowH - 16, 10);
      ctx.stroke();
      labelColor = tier.color;
    } else {
      ctx.fillStyle = tier.color;
      ctx.fillRect(PAD, rowY, 5, rowH);
    }
    ctx.restore();

    const name = palette.labelUpper ? tier.name.toUpperCase() : tier.name;
    const size = name.length <= 2 ? 40 : name.length <= 6 ? 24 : 17;
    ctx.fillStyle = labelColor;
    ctx.font = `800 ${size}px ${palette.labelFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    measure.font = ctx.font;
    const labelLines = wrapLines(measure, name, LABEL_W - 16, 3);
    const lineH = size * 1.05;
    labelLines.forEach((line, i) =>
      ctx.fillText(
        line,
        PAD + LABEL_W / 2,
        rowY + rowH / 2 + (i - (labelLines.length - 1) / 2) * lineH + 2,
      ),
    );
    ctx.textAlign = 'left';

    const chipY = rowY + (rowH - layout.height) / 2;
    for (const chip of layout.chips)
      drawChip(ctx, chip, PAD + LABEL_W + ROW_PAD, chipY, palette, images.get(chip.item.id));
  }

  if (unranked) {
    ctx.fillStyle = palette.muted;
    ctx.font = `700 16px ${DISPLAY}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Unranked', PAD, unranked.y - 12);
    for (const chip of unranked.layout.chips)
      drawChip(ctx, chip, PAD, unranked.y, palette, images.get(chip.item.id));
  }

  if (hotTakeLayout.length) {
    let hy =
      height -
      (options.branding ? 64 : PAD) -
      hotTakeLayout.reduce((sum, h) => sum + h.lines.length * 22 + 8, 0) -
      10;
    ctx.fillStyle = palette.text;
    ctx.font = `700 18px ${DISPLAY}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🔥 Hot takes', PAD, hy - 14);
    ctx.font = `400 16px ${SANS}`;
    ctx.fillStyle = palette.muted;
    for (const { lines } of hotTakeLayout) {
      lines.forEach((line, i) => ctx.fillText(line, PAD + 30, hy + 16 + i * 22));
      hy += lines.length * 22 + 8;
    }
  }

  if (options.branding) drawBranding(ctx, WIDTH - PAD - 176, height - 32, palette);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))),
      'image/png',
    ),
  );
}
