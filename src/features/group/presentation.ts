import { useUiStore } from '@/stores/uiStore';

/** Enter/exit presentation (group) mode, using fullscreen when the browser allows it. */
export function setPresenting(on: boolean) {
  useUiStore.getState().setPresenting(on);
  useUiStore.getState().openEditor(null);
  try {
    if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    } else if (!on && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  } catch {
    // Fullscreen is optional (iOS Safari, iframes).
  }
}

export function togglePresenting() {
  setPresenting(!useUiStore.getState().presenting);
}

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}
