import type { CSSProperties } from 'react';
import type { BoardThemeId } from '@/models/board';
import { THEME_PALETTES } from '@/features/ranking/presets';
import { readableText } from './color';

export interface BoardThemeMeta {
  id: BoardThemeId;
  name: string;
  description: string;
  /** Labels are solid blocks of the tier color (vs. outlined/accented). */
  filledLabels: boolean;
  swatch: string[];
}

export const BOARD_THEMES: BoardThemeMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Soft color blocks',
    filledLabels: true,
    swatch: THEME_PALETTES.classic,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Glow on midnight',
    filledLabels: false,
    swatch: THEME_PALETTES.neon,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Quiet lines, pill items',
    filledLabels: false,
    swatch: THEME_PALETTES.minimal,
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Paper, ink and stickers',
    filledLabels: true,
    swatch: THEME_PALETTES.retro,
  },
  {
    id: 'arcade',
    name: 'Arcade',
    description: 'Hard edges, cabinet colors',
    filledLabels: true,
    swatch: THEME_PALETTES.arcade,
  },
];

export function themeMeta(id: BoardThemeId): BoardThemeMeta {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0]!;
}

/** Inline style for a tier label under a board theme. */
export function tierLabelStyle(theme: BoardThemeId, color: string): CSSProperties {
  const style = { '--tier': color } as CSSProperties;
  if (themeMeta(theme).filledLabels)
    return { ...style, background: color, color: readableText(color) };
  if (theme === 'neon') return { ...style, color };
  return style;
}
