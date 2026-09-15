/** Relative luminance of a hex color (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value.padEnd(6, '0');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Dark or light text, whichever reads better on the given background. */
export function readableText(background: string): string {
  return luminance(background) > 0.28 ? '#1b1e27' : '#ffffff';
}
