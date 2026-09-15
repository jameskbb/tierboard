import { useEffect, useState } from 'react';
import { isLocalImage, resolveImageSrc } from '@/features/persistence/imageStore';

/** Resolve an item image reference (URL or `local:` IndexedDB id) to a usable src. */
export function useImageSrc(image: string | undefined): string | null {
  const [resolved, setResolved] = useState<{ key: string; src: string | null } | null>(null);

  useEffect(() => {
    if (!image || !isLocalImage(image)) return;
    let cancelled = false;
    resolveImageSrc(image).then((src) => {
      if (!cancelled) setResolved({ key: image, src });
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  if (!image) return null;
  if (!isLocalImage(image)) return image;
  return resolved?.key === image ? resolved.src : null;
}
