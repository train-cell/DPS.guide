import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const filesystem = vi.hoisted(() => ({
  writeFile: vi.fn(async (_options: { data: string }) => undefined),
  appendFile: vi.fn(async (_options: { data: string }) => undefined),
  getUri: vi.fn(async () => ({ uri: 'file:///private/cache/backup.dpsbackup' })),
  deleteFile: vi.fn(async () => undefined),
  share: vi.fn(async () => undefined),
}));

const capacitor = vi.hoisted(() => ({ isNativePlatform: () => true }));

vi.mock('@capacitor/core', () => ({
  Capacitor: capacitor,
}));

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    writeFile: filesystem.writeFile,
    appendFile: filesystem.appendFile,
    getUri: filesystem.getUri,
    deleteFile: filesystem.deleteFile,
  },
}));

vi.mock('@capacitor/share', () => ({ Share: { share: filesystem.share } }));

import { deliverEncryptedBackup } from './backup-file.js';

const CHUNK_BYTES = 256 * 1024;

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

describe('deliverEncryptedBackup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps Android FileProvider scoped to the private app cache', () => {
    const paths = readFileSync(new URL('../../android/app/src/main/res/xml/file_paths.xml', import.meta.url), 'utf8');
    expect(paths).toMatch(/<cache-path\b[^>]*path="\."/);
    expect(paths).not.toMatch(/<(?:external|root|files)-path\b/);
  });

  it('γράφει μεγάλο native backup σε μικρά chunks και μοιράζεται το ιδιωτικό αρχείο', async () => {
    const source = Uint8Array.from({ length: CHUNK_BYTES + 37 }, (_, index) => index % 256);
    await deliverEncryptedBackup(new Blob([source.slice().buffer as ArrayBuffer]));

    expect(filesystem.writeFile).toHaveBeenCalledTimes(1);
    expect(filesystem.appendFile).toHaveBeenCalledTimes(1);
    const written = [
      ...filesystem.writeFile.mock.calls.map(([options]) => decodeBase64(options.data)),
      ...filesystem.appendFile.mock.calls.map(([options]) => decodeBase64(options.data)),
    ];
    const restored = new Uint8Array(written.reduce((total, chunk) => total + chunk.byteLength, 0));
    let offset = 0;
    for (const chunk of written) {
      restored.set(chunk, offset);
      offset += chunk.byteLength;
    }
    expect([...restored]).toEqual([...source]);
    expect(filesystem.writeFile.mock.calls[0]?.[0].data.length).toBeLessThanOrEqual(Math.ceil(CHUNK_BYTES / 3) * 4);
    expect(filesystem.appendFile.mock.calls[0]?.[0].data.length).toBeLessThanOrEqual(Math.ceil(37 / 3) * 4);
    expect(filesystem.share).toHaveBeenCalledOnce();
    expect(filesystem.deleteFile).toHaveBeenCalledOnce();
  });

  it('διαγράφει το προσωρινό cache αρχείο αν αποτύχει η τμηματική εγγραφή', async () => {
    filesystem.appendFile.mockRejectedValueOnce(new Error('disk full'));
    const source = new Uint8Array(CHUNK_BYTES + 1);

    await expect(deliverEncryptedBackup(new Blob([source]))).rejects.toThrow('disk full');

    expect(filesystem.share).not.toHaveBeenCalled();
    expect(filesystem.deleteFile).toHaveBeenCalledOnce();
  });

  it('καλύπτει το catch του deleteFile όταν αποτύχει η διαγραφή', async () => {
    filesystem.deleteFile.mockRejectedValueOnce(new Error('den briskei'));
    const source = new Uint8Array(CHUNK_BYTES + 1);

    await deliverEncryptedBackup(new Blob([source]));

    expect(filesystem.deleteFile).toHaveBeenCalledOnce();
  });

  it('γράφει κενό αρχείο όταν το blob είναι άδειο', async () => {
    await deliverEncryptedBackup(new Blob([]), 'keno.dpsbackup');

    expect(filesystem.writeFile).toHaveBeenCalledTimes(1);
    expect(filesystem.appendFile).not.toHaveBeenCalled();
    expect(filesystem.writeFile.mock.calls[0]?.[0].data).toBe('');
    expect(filesystem.deleteFile).toHaveBeenCalledOnce();
  });

  it('σε μη native πλατφόρμα κατεβάζει το αρχείο μέσω anchor', async () => {
    const revokeObjectURL = vi.fn();
    const createElement = vi.fn(() => ({ click: vi.fn(), href: '', download: '' }));
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL });
    vi.stubGlobal('document', { createElement });
    vi.stubGlobal('window', {
      setTimeout: (callback: (...args: never[]) => void) => callback(),
    });
    const isNative = capacitor.isNativePlatform;
    capacitor.isNativePlatform = () => false;

    try {
      await deliverEncryptedBackup(new Blob([new Uint8Array(64)]), 'onoma.dpsbackup');

      expect(createElement).toHaveBeenCalledWith('a');
      expect(revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(filesystem.writeFile).not.toHaveBeenCalled();
      expect(filesystem.share).not.toHaveBeenCalled();
    } finally {
      capacitor.isNativePlatform = isNative;
    }
  });
});
