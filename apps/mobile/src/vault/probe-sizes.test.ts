import { beforeAll, describe, expect, it } from 'vitest';
import { FakeMystika, MnimiApothiki } from '@dps/core/testing';
import {
  EncryptedMystikaPyli,
  createEncryptedBackup,
  createVault,
} from './vault.js';

const MASTER_PASSWORD = 'master-password-test-2026';
const BACKUP_PASSWORD = 'separate-backup-password-2026';

let storage: MnimiApothiki;
let secrets: FakeMystika;
let created: Awaited<ReturnType<typeof createVault>>;

beforeAll(async () => {
  storage = new MnimiApothiki();
  secrets = new FakeMystika();
  created = await createVault(storage, MASTER_PASSWORD);
  await created.session.storage.grapse_dyadiko('CS101/files/scan.bin', new Uint8Array(100));
  const encryptedSecrets = new EncryptedMystikaPyli(secrets, created.session.dataKey);
  await encryptedSecrets.vale('llm_api_key', 'test-only-secret-never-plaintext');
});

describe('probe sizes', () => {
  it('measures the .dps-vault entries', async () => {
    const list = await storage.lista('.dps-vault');
    const sizes: Record<string, number> = {};
    for (const path of list.timi) {
      const entry = await storage.diavase_dyadiko(path);
      sizes[path] = entry.ok ? entry.timi.length : -1;
    }
    const fs = await import('node:fs');
    fs.writeFileSync('/tmp/probe-sizes.txt', Object.entries(sizes).map(([k, v]) => `${k}=${v}`).join('\n'));
    expect(true).toBe(true);
  });

  it('measures the plaintext total', async () => {
    const blob = await createEncryptedBackup(storage, secrets, BACKUP_PASSWORD);
    const fs = await import('node:fs');
    fs.writeFileSync('/tmp/probe-plaintext.txt', `blob=${blob.size}`);
    expect(true).toBe(true);
  });
});
