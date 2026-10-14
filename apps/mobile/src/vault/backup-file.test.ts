import { beforeEach, describe, expect, it, vi } from 'vitest';

const filesystem = vi.hoisted(() => ({
  writeFile: vi.fn(async (_options: { data: string }) => undefined),
  appendFile: vi.fn(async (_options: { data: string }) => undefined),
  getUri: vi.fn(async () => ({ uri: 'file:///private/cache/backup.dpsbackup' })),
  deleteFile: vi.fn(async () => undefined),
  share: vi.fn(async () => undefined),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
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
});
