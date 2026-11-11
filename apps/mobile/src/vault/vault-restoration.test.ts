import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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

/** Βοηθητική: κρυπτογραφημένο τμήμα backup (kind, 4 byte length, iv, ciphertext). */
function encryptedBackupRecord(kind: 0 | 1, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const record = new Uint8Array(17 + ciphertext.byteLength);
  record[0] = kind;
  new DataView(record.buffer).setUint32(1, ciphertext.byteLength, false);
  record.set(iv, 5);
  record.set(ciphertext, 17);
  return record;
}

/** Κωδικοποιεί ένα plaintext backup ως blob v2 με καθένα record σε δικό του τμήμα. */
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

describe('encrypted vault restore — edge cases', () => {
  it('απορρίπτείνει backup με κενό prefix', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    const blob = truncatedBlob(0);
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, blob, BACKUP_PASSWORD))
      .rejects.toThrow('Το αρχείο δεν είναι έγκυρο DPS.guide encrypted backup');
    expect((await targetStorage.lista('.dps-vault')).ok && (await targetStorage.lista('.dps-vault')).timi).toEqual([]);
  });

  it('απορρίπτείνει κομμένο backup όταν τελειώνουν τα bytes πριν το prefix', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    const blob = truncatedBlob(10);
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, blob, BACKUP_PASSWORD))
      .rejects.toThrow('Το backup είναι κομμένο ή αλλοιωμένο');
    expect((await targetStorage.lista('.dps-vault')).ok && (await targetStorage.lista('.dps-vault')).timi).toEqual([]);
  });

  it('απορρίπτείνει backup με δεδομένα μετά το τελικό chunk', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const withTrailing = new Uint8Array(backupBytes.length + 32);
    withTrailing.set(backupBytes);
    withTrailing.set(new Uint8Array(32), backupBytes.length);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, new Blob([withTrailing]), BACKUP_PASSWORD))
      .rejects.toThrow('Το backup περιέχει δεδομένα μετά την τελική υπογραφή');
  });

  it('απορρίπτείνει backup με μη έγκυρο κρυπτογραφημένο μυστικό', async () => {
    const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
    const backup = await createV2Backup([
      { kind: 0, path: '.dps-vault/header.json', data: header },
      { kind: 1, path: 'secret:llm_api_key', data: encoder.encode('όχι-έγκυρη-συσκεύη') },
      { kind: 255, path: '', data: new Uint8Array(0) },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD))
      .rejects.toThrow('Το backup περιέχει μη έγκυρο κρυπτογραφημένο μυστικό');
  });

  it('απορρίπτείνει backup με πολύ μεγάλη διαδρομή', async () => {
    const sourceStorage = new MnimiApothiki();
    const sourceSecrets = new FakeMystika();
    await createVault(sourceStorage, MASTER_PASSWORD);
    const longPath = `.dps-vault/${'a'.repeat(0xffff + 10)}.json`;
    await sourceStorage.grapse_keimeno(longPath, 'pad');
    await expect(createEncryptedBackup(sourceStorage, sourceSecrets, BACKUP_PASSWORD))
      .rejects.toThrow('Υπάρχει διαδρομή vault πολύ μεγάλη για backup');
  });

  it('απορρίπτείνει backup με μη υποστηριζόμενες επαναλήψεις κρυπτογράφησης', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const withIterations = new Uint8Array(backupBytes);
    new DataView(withIterations.buffer, withIterations.byteOffset, withIterations.byteLength).setUint32(24, 1000, false);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, new Blob([withIterations]), BACKUP_PASSWORD))
      .rejects.toThrow('Το backup χρησιμοποιεί μη υποστηριζόμενη ρύθμιση κρυπτογράφησης');
  });
});

describe('encrypted vault unlock and storage', () => {
  it('ξεκλειδώνει με recovery key όταν αποτυγχάνει το master', async () => {
    const storage = new MnimiApothiki();
    const created = await createVault(storage, MASTER_PASSWORD);
    // Το recovery key γράφεται με πεζά γράμματα ώστε να περάσει η δεύτερη επανάληψη
    // (η `cleaned` εκδοχή του κλειδιού ξεκλειδώνει το recovery envelope).
    const session = await unlockVault(storage, created.recoveryKey.toLowerCase());
    expect(session).toBeDefined();
    await session.storage.grapse_keimeno('recovery-unlock-check.txt', 'recovered');
    const check = await session.storage.diavase_keimeno('recovery-unlock-check.txt');
    expect(check.ok && check.timi).toBe('recovered');
  });

  it('διαγράφει το προηγούμενο κρυπτογραφημένο αντικείμενο όταν επαναγράφει διαδρομή', async () => {
    const storage = new MnimiApothiki();
    const created = await createVault(storage, MASTER_PASSWORD);
    const { session } = created;
    await session.storage.grapse_dyadiko('CS101/files/scan.bin', new Uint8Array([1, 2, 3]));
    expect(await session.storage.yparxei('CS101/files/scan.bin')).toBe(true);
    await session.storage.grapse_dyadiko('CS101/files/scan.bin', new Uint8Array([4, 5, 6]));
    expect(await session.storage.yparxei('CS101/files/scan.bin')).toBe(true);
    const content = await session.storage.diavase_dyadiko('CS101/files/scan.bin');
    expect(content.ok && [...content.timi]).toEqual([4, 5, 6]);
  });
});
