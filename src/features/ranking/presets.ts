import type { BoardThemeId } from '@/models/board';

export interface TierPreset {
  id: string;
  label: string;
  tiers: { name: string; color: string }[];
}

/** Default tier palette: recognizable, readable with dark text, not neon. */
export const CLASSIC_COLORS = ['#FF7B72', '#FFA657', '#F6D55C', '#7EE0A1', '#6CB8FF', '#C49BFF'];

/** Swatches offered in the tier color picker. */
export const TIER_SWATCHES = [
  '#FF7B72',
  '#FFA657',
  '#F6D55C',
  '#7EE0A1',
  '#5FD4C4',
  '#6CB8FF',
  '#8F9BFF',
  '#C49BFF',
  '#F59AD0',
  '#D4B896',
  '#B8C0CC',
  '#5C6370',
];

function withColors(names: string[], colors = CLASSIC_COLORS) {
  // Spread the palette across however many tiers the preset has.
  return names.map((name, index) => {
    const position =
      names.length === 1 ? 0 : Math.round((index * (colors.length - 1)) / (names.length - 1));
    return { name, color: colors[position] ?? colors[0]! };
  });
}

export const TIER_PRESETS: TierPreset[] = [
  {
    id: 'sabcdf',
    label: 'S / A / B / C / D / F',
    tiers: withColors(['S', 'A', 'B', 'C', 'D', 'F']),
  },
  {
    id: 'goat',
    label: 'GOAT / Great / Good / Mid / Bad / Trash',
    tiers: withColors(['GOAT', 'Great', 'Good', 'Mid', 'Bad', 'Trash']),
  },
  {
    id: 'must-have',
    label: 'Must Have / Nice / Maybe / Skip',
    tiers: withColors(['Must Have', 'Nice', 'Maybe', 'Skip']),
  },
  {
    id: 'love-hate',
    label: 'Love / Like / Neutral / Dislike / Hate',
    tiers: withColors(['Love', 'Like', 'Neutral', 'Dislike', 'Hate']),
  },
  {
    id: 'top-5',
    label: '1 / 2 / 3 / 4 / 5',
    tiers: withColors(['1', '2', '3', '4', '5']),
  },
];

export const DEFAULT_PRESET = TIER_PRESETS[0]!;

/** Per-board-theme tier palettes, applied when the user switches board theme. */
export const THEME_PALETTES: Record<BoardThemeId, string[]> = {
  classic: CLASSIC_COLORS,
  neon: ['#FF4F8B', '#FF9F1C', '#F9F871', '#2EF2A0', '#2CC8FF', '#B266FF'],
  minimal: ['#E8E4DE', '#DAD6CF', '#CCC7BF', '#BEB8AF', '#B0A99F', '#A29A90'],
  retro: ['#E4572E', '#F3A712', '#E9D985', '#76B041', '#2E86AB', '#8E6C8A'],
  arcade: ['#FF3864', '#FF8E3C', '#FFD23F', '#3BCEAC', '#3A86FF', '#8338EC'],
};

export function paletteColor(theme: BoardThemeId, index: number, total: number): string {
  const colors = THEME_PALETTES[theme];
  const position = total <= 1 ? 0 : Math.round((index * (colors.length - 1)) / (total - 1));
  return colors[Math.min(position, colors.length - 1)]!;
}
