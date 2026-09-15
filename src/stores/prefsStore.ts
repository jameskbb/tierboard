/** Per-device preferences, persisted in localStorage. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorScheme = 'light' | 'dark' | 'system';

interface PrefsState {
  colorScheme: ColorScheme;
  skipDuplicates: boolean;
  exportScale: 1 | 2;
  setColorScheme: (scheme: ColorScheme) => void;
  setSkipDuplicates: (skip: boolean) => void;
  setExportScale: (scale: 1 | 2) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      colorScheme: 'system',
      skipDuplicates: true,
      exportScale: 2,
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setSkipDuplicates: (skipDuplicates) => set({ skipDuplicates }),
      setExportScale: (exportScale) => set({ exportScale }),
    }),
    { name: 'tierboard:prefs' },
  ),
);
