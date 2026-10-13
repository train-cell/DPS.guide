import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function backupName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `DPS.guide-${stamp}.dpsbackup`;
}

/** Downloads on desktop browsers or opens the native share sheet from the app-private cache. */
export async function deliverEncryptedBackup(blob: Blob): Promise<void> {
  const filename = backupName();
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return;
  }

  const path = filename;
  try {
    await Filesystem.writeFile({
      path,
      directory: Directory.Cache,
      data: base64(new Uint8Array(await blob.arrayBuffer())),
    });
    const file = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({
      title: 'Κρυπτογραφημένο backup DPS.guide',
      dialogTitle: 'Αποθήκευση encrypted backup',
      files: [file.uri],
    });
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
  }
}
