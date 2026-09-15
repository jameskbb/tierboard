/**
 * Uploaded images live in IndexedDB as Blobs; items reference them as
 * `local:<id>`. Images are downscaled on upload so boards stay light.
 */
import { createStore, del, get, set } from 'idb-keyval';
import { createId } from '@/lib/ids';
import type { TierBoard } from '@/models/board';

export const LOCAL_IMAGE_PREFIX = 'local:';
const store = typeof indexedDB !== 'undefined' ? createStore('tierboard-images', 'images') : null;

export const isLocalImage = (src: string | undefined): src is string =>
  !!src && src.startsWith(LOCAL_IMAGE_PREFIX);

export async function resizeImage(file: Blob, maxSize = 360): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/webp',
      0.86,
    ),
  );
}

export async function saveLocalImage(file: Blob): Promise<string> {
  if (!store) throw new Error('Image storage is not available in this browser.');
  const blob = file.type === 'image/svg+xml' ? file : await resizeImage(file);
  const id = createId();
  await set(id, blob, store);
  return `${LOCAL_IMAGE_PREFIX}${id}`;
}

export async function loadLocalImage(ref: string): Promise<Blob | undefined> {
  if (!store) return undefined;
  return get<Blob>(ref.slice(LOCAL_IMAGE_PREFIX.length), store);
}

export async function deleteLocalImage(ref: string): Promise<void> {
  if (store && isLocalImage(ref)) await del(ref.slice(LOCAL_IMAGE_PREFIX.length), store);
}

const objectUrls = new Map<string, Promise<string | null>>();

/** Resolve any image reference to something an <img> or canvas can load. */
export function resolveImageSrc(src: string): Promise<string | null> {
  if (!isLocalImage(src)) return Promise.resolve(src);
  let pending = objectUrls.get(src);
  if (!pending) {
    pending = loadLocalImage(src).then((blob) => (blob ? URL.createObjectURL(blob) : null));
    objectUrls.set(src, pending);
  }
  return pending;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** For JSON export: replace local image refs with portable data: URLs. */
export async function inlineLocalImages(board: TierBoard): Promise<TierBoard> {
  const items = { ...board.items };
  for (const item of Object.values(items)) {
    if (!isLocalImage(item.image)) continue;
    const blob = await loadLocalImage(item.image);
    items[item.id] = blob
      ? { ...item, image: await blobToDataUrl(blob) }
      : { ...item, image: undefined };
  }
  return { ...board, items };
}

/** For JSON import: move inline data: images into IndexedDB to keep localStorage small. */
export async function internalizeDataImages(board: TierBoard): Promise<TierBoard> {
  if (!store) return board;
  const items = { ...board.items };
  for (const item of Object.values(items)) {
    if (!item.image?.startsWith('data:')) continue;
    try {
      const blob = await (await fetch(item.image)).blob();
      items[item.id] = { ...item, image: await saveLocalImage(blob) };
    } catch {
      // Keep the inline image if it can't be converted.
    }
  }
  return { ...board, items };
}
