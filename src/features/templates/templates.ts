import { createBoard } from '@/features/ranking/boardOps';
import { TIER_PRESETS, type TierPreset } from '@/features/ranking/presets';
import type { TierBoard } from '@/models/board';

export interface BoardTemplate {
  id: string;
  title: string;
  emoji: string;
  presetId: string;
  /** Neutral starter items (always Unranked). Most templates start empty. */
  items?: string[];
  hint?: string;
}

export const TEMPLATES: BoardTemplate[] = [
  {
    id: 'pizza',
    title: 'Pizza Places',
    emoji: '🍕',
    presetId: 'sabcdf',
    hint: 'Paste every place in town',
  },
  { id: 'lunch', title: 'Office Lunch Spots', emoji: '🥪', presetId: 'must-have' },
  { id: 'restaurants', title: 'Restaurants', emoji: '🍽️', presetId: 'sabcdf' },
  {
    id: 'fast-food',
    title: 'Fast Food',
    emoji: '🍟',
    presetId: 'sabcdf',
    items: [
      "McDonald's",
      'Burger King',
      "Wendy's",
      'Taco Bell',
      'Chick-fil-A',
      'Subway',
      'KFC',
      'Popeyes',
      'Sonic',
      'Whataburger',
      'In-N-Out',
      'Chipotle',
    ],
  },
  { id: 'movies', title: 'Movies', emoji: '🎬', presetId: 'goat' },
  { id: 'games', title: 'Video Games', emoji: '🎮', presetId: 'goat' },
  { id: 'albums', title: 'Music Albums', emoji: '💿', presetId: 'love-hate' },
  { id: 'teams', title: 'Sports Teams', emoji: '🏈', presetId: 'sabcdf' },
  { id: 'tools', title: 'Tools', emoji: '🛠️', presetId: 'must-have' },
  { id: 'cars', title: 'Cars', emoji: '🚗', presetId: 'sabcdf' },
  { id: 'travel', title: 'Vacation Destinations', emoji: '🏝️', presetId: 'must-have' },
  {
    id: 'snacks',
    title: 'Snacks',
    emoji: '🍿',
    presetId: 'goat',
    items: [
      'Popcorn',
      'Pretzels',
      'Potato chips',
      'Tortilla chips',
      'Trail mix',
      'Beef jerky',
      'Gummy bears',
      'Cheese crackers',
      'Granola bar',
      'Peanut butter crackers',
    ],
  },
  {
    id: 'coffee',
    title: 'Coffee',
    emoji: '☕',
    presetId: 'love-hate',
    items: [
      'Espresso',
      'Americano',
      'Latte',
      'Cappuccino',
      'Flat white',
      'Cortado',
      'Mocha',
      'Cold brew',
      'Drip coffee',
      'Macchiato',
    ],
  },
];

export function presetById(id: string): TierPreset {
  return TIER_PRESETS.find((preset) => preset.id === id) ?? TIER_PRESETS[0]!;
}

export function boardFromTemplate(template: BoardTemplate): TierBoard {
  return createBoard(template.title, {
    preset: presetById(template.presetId),
    drafts: template.items?.map((name) => ({ name })),
  });
}
