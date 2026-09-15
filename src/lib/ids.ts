const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Short random id (10 chars of base36 ≈ 51 bits). Plenty for local boards. */
export function createId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}

export function nowIso(): string {
  return new Date().toISOString();
}
