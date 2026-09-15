export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(filename: string, text: string, type: string) {
  downloadBlob(filename, new Blob([text], { type }));
}

export const canCopyImage = () =>
  typeof ClipboardItem !== 'undefined' && !!navigator.clipboard && 'write' in navigator.clipboard;

/**
 * Copy a PNG to the clipboard. The blob is passed as a promise so Safari
 * accepts the write inside the original click gesture.
 */
export async function copyImage(blob: Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
