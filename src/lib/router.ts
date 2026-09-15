/**
 * Tiny hash router. Hash routes survive any static host (GitHub Pages serves
 * one index.html, and a hash never reaches the server — which also keeps
 * share-link payloads private).
 *
 *   #/            home / board picker
 *   #/b/:id       a saved board
 *   #/s/:payload  a shared (temporary) board
 */
import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'board'; id: string; intent?: 'add' }
  | { name: 'shared'; payload: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const board = path.match(/^\/b\/([\w-]+)(\?add)?/);
  if (board)
    return { name: 'board', id: board[1]!, ...(board[2] ? { intent: 'add' as const } : {}) };
  const shared = path.match(/^\/s\/(.+)$/);
  if (shared) return { name: 'shared', payload: shared[1]! };
  return { name: 'home' };
}

export const routes = {
  home: () => '#/',
  board: (id: string) => `#/b/${id}`,
};

export function navigate(hash: string, { replace = false } = {}) {
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  // parseRoute is cheap and returns structurally equal results for equal hashes.
  return parseRoute(hash);
}
