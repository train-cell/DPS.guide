import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FakeMystika, MnimiApothiki } from '@dps/core/testing';
import {
  EncryptedMystikaPyli,
  createEncryptedBackup,
  createVault,
  restoreEncryptedBackup,
  unlockVault,
} from './vault.js';

const MASTER_PASSWORD = 'master-password-test-2026';
const BACKUP_PASSWORD = 'separate-backup-password-2026';
const encoder = new TextEncoder();

let backup: Blob;

function concatenate(...items: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(items.reduce((length, item) => length + item.byteLength, 0));
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.byteLength;
  }
  return result;
}

function encryptedBackupRecord(kind: 0 | 1, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const record = new Uint8Array(17 + ciphertext.byteLength);
  record[0] = kind;
  new DataView(record.buffer).setUint32(1, ciphertext.byteLength, false);
  record.set(iv, 5);
  record.set(ciphertext, 17);
  return record;
}


/** Blob που δίνει ένα ψεύτικο stream με όσα bytes θέλουμε, για δοκιμή κομμένου backup. */
const streamMocks: Array<() => void> = [];
function truncatedBlob(bytes: number): Blob {
  const originalStream = Blob.prototype.stream;
  const stream = new Blob([new Uint8Array(40)], { type: 'application/vnd.dps-guide.backup' });
  Blob.prototype.stream = function () {
    return new ReadableStream({
      start(controller) {
        if (bytes > 0) controller.enqueue(new Uint8Array(bytes));
        controller.close();
      },
    });
  };
  streamMocks.push(() => { Blob.prototype.stream = originalStream; });
  return stream;
}

afterEach(() => {
  for (const restore of streamMocks) restore();
  streamMocks.length = 0;
});

/** Κωδικοποιεί ένα plaintext backup ως blob v2· το τελευταίο record γίνεται το τελικό chunk. */
async function createV2Backup(records: { kind: number; path: string; data: Uint8Array }[]): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    'raw', Uint8Array.from(encoder.encode(BACKUP_PASSWORD)).buffer, 'PBKDF2', false, ['deriveKey'],
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: Uint8Array.from(salt).buffer, iterations: 600_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const prefix = new Uint8Array(28);
  prefix.set(encoder.encode('DPSBKP02'));
  prefix.set(salt, 8);
  new DataView(prefix.buffer).setUint32(24, 600_000, false);

  const parts: Uint8Array[] = [prefix];
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    const header = new Uint8Array(11);
    header[0] = record.kind;
    const pathBytes = encoder.encode(record.path);
    new DataView(header.buffer).setUint16(1, pathBytes.byteLength, false);
    new DataView(header.buffer).setBigUint64(3, BigInt(record.data.byteLength), false);
    const plaintext = concatenate(header, pathBytes, record.data);
    const aad = index === records.length - 1 ? `dps.backup.v2/final/${index}` : `dps.backup.v2/chunk/${index}`;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: Uint8Array.from(iv).buffer, additionalData: encoder.encode(aad) },
      wrappingKey,
      Uint8Array.from(plaintext).buffer,
    ));
    parts.push(encryptedBackupRecord(index === records.length - 1 ? 1 : 0, iv, ciphertext));
  }
  return new Blob(parts.map((part) => Uint8Array.from(part).buffer as ArrayBuffer), {
    type: 'application/vnd.dps-guide.backup',
  });
}


/** Φτιάχνει ένα έγκυρο backup v2 με τρία chunk: header, μυστικό, τελικό κενό chunk. */
async function ftiaxe_backup_ameio(secretData: Uint8Array): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    'raw', Uint8Array.from(encoder.encode(BACKUP_PASSWORD)).buffer, 'PBKDF2', false, ['deriveKey'],
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: Uint8Array.from(salt).buffer, iterations: 600_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const prefix = new Uint8Array(28);
  prefix.set(encoder.encode('DPSBKP02'));
  prefix.set(salt, 8);
  new DataView(prefix.buffer).setUint32(24, 600_000, false);

  const parts: Uint8Array[] = [prefix];
  const encryptChunk = async (kind: number, plaintext: Uint8Array, index: number): Promise<Uint8Array> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: Uint8Array.from(iv).buffer, additionalData: encoder.encode(`dps.backup.v2/chunk/${index}`) },
      wrappingKey,
      Uint8Array.from(plaintext).buffer,
    ));
    return encryptedBackupRecord(kind, iv, ciphertext);
  };
  const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
  const recordHeader = (kind: number, path: string, data: Uint8Array): Uint8Array => {
    const out = new Uint8Array(11);
    out[0] = kind;
    new DataView(out.buffer).setUint16(1, encoder.encode(path).byteLength, false);
    new DataView(out.buffer).setBigUint64(3, BigInt(data.byteLength), false);
    return concatenate(out, encoder.encode(path), data);
  };
  parts.push(await encryptChunk(0, recordHeader(0, '.dps-vault/header.json', header), 0));
  parts.push(await encryptChunk(0, recordHeader(1, 'secret:llm_api_key', secretData), 1));
  parts.push(encryptedBackupRecord(1, crypto.getRandomValues(new Uint8Array(12)), new Uint8Array(16)));
  return new Blob(parts.map((part) => Uint8Array.from(part).buffer as ArrayBuffer), {
    type: 'application/vnd.dps-guide.backup',
  });
}

/** Φτιάχνει ένα vault με ένα αρχείο δεδομένων ορισμένου μεγέθους. */
async function ftiaxe_vault_me_arxeio(megeθος: number): Promise<{ storage: MnimiApothiki; secrets: FakeMystika }> {
  const storage = new MnimiApothiki();
  const secrets = new FakeMystika();
  const created = await createVault(storage, MASTER_PASSWORD);
  await created.session.storage.grapse_dyadiko('CS101/notes.bin', new Uint8Array(megeθος));
  const encryptedSecrets = new EncryptedMystikaPyli(secrets, created.session.dataKey);
  await encryptedSecrets.vale('llm_api_key', 'test-only-secret-never-plaintext');
  return { storage, secrets };
}

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

describe('vault storage lock — απουσία navigator', () => {
  const saved = () => (globalThis as Record<string, unknown>).navigator;

  it('λειτουργεί όταν δεν υπάρχει navigator καθόλου', async () => {
    const αρχική = saved();
    delete (globalThis as Record<string, unknown>).navigator;
    try {
      const storage = new MnimiApothiki();
      const created = await createVault(storage, MASTER_PASSWORD);
      expect(created.session).toBeDefined();
      expect(await created.session.storage.yparxei('CS101/notes.json')).toBe(false);
    } finally {
      (globalThis as Record<string, unknown>).navigator = αρχική;
    }
  });
});

describe('vault backup — μεγάλος όγκος δεδομένων', () => {
  it('γεμίζει το 1MB τμήμα ακριβώς και κλείνει το backup', async () => {
    const { storage } = await ftiaxe_vault_me_arxeio(1024 * 1024 - 11 - 'CS101/notes.bin'.length);
    const blob = await createEncryptedBackup(storage, storageSecrets(), BACKUP_PASSWORD);
    expect(blob.size).toBeGreaterThan(0);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, blob, BACKUP_PASSWORD);
    expect((await targetStorage.lista('.dps-vault')).timi.length).toBeGreaterThan(2);
  });
});

function storageSecrets(): FakeMystika {
  return new FakeMystika();
}

describe('vault restore — σπασμένα αρχεία', () => {
  it('απορρίπτείνει backup με επιπλέον δεδομένα στο τέλος', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const withExtra = new Uint8Array(backupBytes.length + 64);
    withExtra.set(backupBytes);
    withExtra.set(new Uint8Array(64), backupBytes.length);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, new Blob([withExtra]), BACKUP_PASSWORD))
      .rejects.toThrow('Το backup περιέχει δεδομένα μετά την τελική υπογραφή');
  });

  it('απορρίπτείνει backup με κενά bytes στο prefix', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    const blob = truncatedBlob(10);
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, blob, BACKUP_PASSWORD))
      .rejects.toThrow('Το backup είναι κομμένο ή αλλοιωμένο');
  });

  it('απορρίπτείνει backup με κομμένο κρυπτογραφημένο τμήμα', async () => {
    const targetBytes = new Uint8Array(await backup.arrayBuffer());
    const targetBlob = new Blob([targetBytes.subarray(0, targetBytes.length - 100)]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, targetBlob, BACKUP_PASSWORD))
      .rejects.toThrow('Το backup είναι κομμένο');
  });

  it('διαγράφει όλα τα γραμμένα δεδομένα όταν το backup είναι κατεστραμμένο', async () => {
    const backup = await ftiaxe_backup_ameio(encoder.encode('όχι-έγκυρη-συσκεύη'));
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD))
      .rejects.toThrow('Το backup περιέχει μη έγκυρο κρυπτογραφημένο μυστικό');
    expect((await targetStorage.lista('.dps-vault')).timi).toEqual([]);
  });
});

describe('vault secrets', () => {
  it('δεν πετάει όταν σβήνει κλειδί που δεν υπάρχει', async () => {
    const secrets = new FakeMystika();
    await secrets.vale('llm_api_key', 'value');
    await secrets.svise('llm_api_key');
    await expect(secrets.svise('llm_api_key')).resolves.toBeUndefined();
  });
});
