import { beforeAll, describe, expect, it } from 'vitest';
import { FakeMystika, MnimiApothiki } from '@dps/core/testing';
import {
  EncryptedMystikaPyli,
  createEncryptedBackup,
  createVault,
} from './vault.js';

const MASTER_PASSWORD = 'master-password-test-2026';
const BACKUP_PASSWORD = 'separate-backup-password-2026';

let backup: Blob;

beforeAll(async () => {
  const sourceStorage = new MnimiApothiki();
  const sourceSecrets = new FakeMystika();
  const created = await createVault(sourceStorage, MASTER_PASSWORD);
  await created.session.storage.grapse_keimeno('CS101/notes.json', '{"notes":"encrypted course notes"}');
  await created.session.storage.grapse_dyadiko('CS101/files/scan.bin', new Uint8Array([0, 1, 127, 255]));
  const encryptedSecrets = new EncryptedMystikaPyli(sourceSecrets, created.session.dataKey);
  await encryptedSecrets.vale('llm_api_key', 'test-only-secret-never-plaintext');
  backup = await createEncryptedBackup(sourceStorage, sourceSecrets, BACKUP_PASSWORD);
});

describe('probe', () => {
  it('traces chunks', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const fs = await import('node:fs');
    const out: string[] = [];
    const log = (...args: unknown[]) => out.push(args.map(String).join(' '));
    log('backup size', backup.size);
    const reader = backup.stream().getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    log('chunk count', chunks.length);
    for (let i = 0; i < chunks.length; i++) {
      log(`chunk ${i}: len`, chunks[i].byteLength, 'kind', chunks[i][0], 'len field', new DataView(chunks[i].buffer).getUint32(1, false));
    }
    fs.writeFileSync('/tmp/probe-out.txt', out.join('\n'));
    expect(true).toBe(true);
  });
});
