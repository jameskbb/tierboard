/**
 * How a board becomes a link. Today: the whole board in the URL hash (never
 * sent to any server). The interface exists so a future backend can issue
 * short links (`/s/abc123`) or live rooms without touching the UI.
 */
import type { TierBoard } from '@/models/board';
import { encodeBoard } from './shareCodec';

export interface ShareLink {
  url: string;
  /** Uploaded images that could not be included. */
  strippedImages: number;
  /** Links longer than this get cut off by some chat apps and browsers. */
  isLong: boolean;
  /** Links longer than this are unreliable everywhere. */
  isTooLong: boolean;
}

export interface ShareTransport {
  createLink(board: TierBoard): Promise<ShareLink>;
}

export const LONG_LINK = 4000;
export const MAX_LINK = 32000;

export const SHARE_ROUTE_PREFIX = '#/s/';

export function createUrlHashTransport(
  baseUrl: () => string = () => window.location.href.split('#')[0]!,
): ShareTransport {
  return {
    async createLink(board) {
      const { payload, strippedImages } = await encodeBoard(board);
      const url = `${baseUrl()}${SHARE_ROUTE_PREFIX}${payload}`;
      return {
        url,
        strippedImages,
        isLong: url.length > LONG_LINK,
        isTooLong: url.length > MAX_LINK,
      };
    },
  };
}

export const shareTransport: ShareTransport = createUrlHashTransport();
