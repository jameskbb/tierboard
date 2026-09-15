import { useEffect } from 'react';
import { usePrefsStore } from '@/stores/prefsStore';
import { useMediaQuery } from './useMediaQuery';

/** Sync the `dark` class on <html> with the preference (and OS when "system"). */
export function useApplyColorScheme(forceDark = false) {
  const scheme = usePrefsStore((state) => state.colorScheme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = forceDark || scheme === 'dark' || (scheme === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', dark ? '#13151B' : '#EEF0F4'));
  }, [dark]);

  return dark;
}
