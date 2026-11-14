import { beforeAll, describe, expect, it } from 'vitest';
import { FakeMystika, MnimiApothiki } from '@dps/core/testing';
import { createVault } from './vault.js';

const MASTER_PASSWORD = 'master-password-test-2026';

describe('probe object sizes', () => {
  for (const size of [0, 1, 2, 3, 4, 100, 101, 102, 103]) {
    it(`measures for file size ${size}`, async () => {
      const storage = new MnimiApothiki();
      const created = await createVault(storage, MASTER_PASSWORD);
      await created.session.storage.grapse_dyadiko('CS101/files/scan.bin', new Uint8Array(size));
      const list = await storage.lista('.dps-vault');
      const sizes: Record<string, number> = {};
      for (const path of list.timi) {
        const entry = await storage.diavase_dyadiko(path);
        sizes[path] = entry.ok ? entry.timi.length : -1;
      }
      const fs = await import('node:fs');
      fs.writeFileSync(`/tmp/probe-obj-${size}.txt`, Object.entries(sizes).map(([k, v]) => `${k}=${v}`).join('\n'));
      expect(true).toBe(true);
    });
  }
});
