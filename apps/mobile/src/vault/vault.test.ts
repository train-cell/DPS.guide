import { beforeAll, describe, expect, it } from 'vitest';
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
const LEGACY_KDF_ITERATIONS = 310_000;
const encoder = new TextEncoder();

let backup: Blob;

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function concatenate(...items: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(items.reduce((length, item) => length + item.byteLength, 0));
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.byteLength;
  }
  return result;
}

async function legacyWrappingKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw', Uint8Array.from(encoder.encode(secret)).buffer, 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: Uint8Array.from(salt).buffer, iterations: LEGACY_KDF_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function makeLegacyEnvelope(dataKey: Uint8Array, password: string, aad: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await legacyWrappingKey(password, salt);
  const wrapped = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(iv).buffer, additionalData: encoder.encode(aad) },
    wrappingKey,
    Uint8Array.from(dataKey).buffer,
  ));
  return { salt: encodeBase64(salt), iv: encodeBase64(iv), wrapped_key: encodeBase64(wrapped) };
}

function encryptedBackupRecord(kind: 0 | 1, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const record = new Uint8Array(17 + ciphertext.byteLength);
  record[0] = kind;
  new DataView(record.buffer).setUint32(1, ciphertext.byteLength, false);
  record.set(iv, 5);
  record.set(ciphertext, 17);
  return record;
}

async function createLegacyBackup(): Promise<Blob> {
  const dataKey = crypto.getRandomValues(new Uint8Array(32));
  const envelope = await makeLegacyEnvelope(dataKey, MASTER_PASSWORD, 'dps.vault.v1/master');
  const vaultHeader = encoder.encode(JSON.stringify({ version: 1, master: envelope, recovery: envelope }));
  const path = encoder.encode('.dps-vault/header.json');
  const recordHeader = new Uint8Array(11);
  recordHeader[0] = 0;
  new DataView(recordHeader.buffer).setUint16(1, path.byteLength, false);
  new DataView(recordHeader.buffer).setBigUint64(3, BigInt(vaultHeader.byteLength), false);
  const plaintext = concatenate(recordHeader, path, vaultHeader, new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await legacyWrappingKey(BACKUP_PASSWORD, salt);
  const chunkIv = crypto.getRandomValues(new Uint8Array(12));
  const chunk = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(chunkIv).buffer, additionalData: encoder.encode('dps.backup.v1/chunk/0') },
    wrappingKey,
    Uint8Array.from(plaintext).buffer,
  ));
  const finalIv = crypto.getRandomValues(new Uint8Array(12));
  const final = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(finalIv).buffer, additionalData: encoder.encode('dps.backup.v1/final/1') },
    wrappingKey,
    new Uint8Array(0),
  ));
  const prefix = new Uint8Array(24);
  prefix.set(encoder.encode('DPSBKP01'));
  prefix.set(salt, 8);
  const parts = [prefix, encryptedBackupRecord(0, chunkIv, chunk), encryptedBackupRecord(1, finalIv, final)];
  return new Blob(parts.map((part) => Uint8Array.from(part).buffer as ArrayBuffer), {
    type: 'application/vnd.dps-guide.backup',
  });
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

describe('encrypted vault backup/restore', () => {
  it('γράφει νέες εγγραφές με 600.000 PBKDF2 iterations', async () => {
    const storage = new MnimiApothiki();
    await createVault(storage, MASTER_PASSWORD);
    const header = await storage.diavase_keimeno('.dps-vault/header.json');
    if (!header.ok) throw new Error('λείπει το header του vault');
    const parsed = JSON.parse(header.timi) as { master: { iterations?: number }; recovery: { iterations?: number } };
    expect(parsed.master.iterations).toBe(600_000);
    expect(parsed.recovery.iterations).toBe(600_000);
  });

  it('επιδιορθώνει παλιό Base64-encoded Capacitor vault header και διατηρεί το ξεκλείδωμα', async () => {
    const storage = new MnimiApothiki();
    await createVault(storage, MASTER_PASSWORD);
    const current = await storage.diavase_keimeno('.dps-vault/header.json');
    if (!current.ok) throw new Error('λείπει το header του vault');
    const legacy = encodeBase64(encoder.encode(current.timi));
    await storage.grapse_keimeno('.dps-vault/header.json', legacy);

    const session = await unlockVault(storage, MASTER_PASSWORD);
    const repaired = await storage.diavase_keimeno('.dps-vault/header.json');

    expect(repaired.ok && repaired.timi).toBe(current.timi);
    await session.storage.grapse_keimeno('migration-check.txt', 'vault recovered');
    const value = await session.storage.diavase_keimeno('migration-check.txt');
    expect(value.ok && value.timi).toBe('vault recovered');
  });

  it('αποτρέπει δύο ταυτόχρονες αρχικές ρυθμίσεις από το να αντικαταστήσουν η μία την άλλη', async () => {
    const storage = new MnimiApothiki();
    const attempts = await Promise.allSettled([
      createVault(storage, MASTER_PASSWORD),
      createVault(storage, MASTER_PASSWORD),
    ]);

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    await expect(unlockVault(storage, MASTER_PASSWORD)).resolves.toBeDefined();
  });

  it('διατηρεί κάθε αρχείο όταν γίνονται ταυτόχρονες εγγραφές στο vault', async () => {
    const storage = new MnimiApothiki();
    const created = await createVault(storage, MASTER_PASSWORD);
    const paths = Array.from({ length: 12 }, (_, index) => `concurrent/file-${index}.json`);

    const results = await Promise.all(paths.map((path) => created.session.storage.grapse_keimeno(path, path)));
    const files = await created.session.storage.lista('concurrent');

    expect(results.every((result) => result.ok)).toBe(true);
    expect(files.ok && files.timi).toEqual([...paths].sort());
    for (const path of paths) {
      const content = await created.session.storage.diavase_keimeno(path);
      expect(content.ok && content.timi).toBe(path);
    }
  });

  it('ξεκλειδώνει παλιό vault χωρίς πεδίο iterations', async () => {
    const storage = new MnimiApothiki();
    const dataKey = crypto.getRandomValues(new Uint8Array(32));
    const envelope = await makeLegacyEnvelope(dataKey, MASTER_PASSWORD, 'dps.vault.v1/master');
    await storage.grapse_keimeno('.dps-vault/header.json', JSON.stringify({ version: 1, master: envelope, recovery: envelope }));

    const session = await unlockVault(storage, MASTER_PASSWORD);
    await session.storage.grapse_keimeno('legacy-vault-check.txt', 'legacy data is readable');
    const check = await session.storage.diavase_keimeno('legacy-vault-check.txt');
    expect(check.ok && check.timi).toBe('legacy data is readable');
  });

  it('κάνει restore παλιό v1 backup με 310.000 iterations', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    const legacyBackup = await createLegacyBackup();
    await restoreEncryptedBackup(targetStorage, targetSecrets, legacyBackup, BACKUP_PASSWORD);
    const session = await unlockVault(targetStorage, MASTER_PASSWORD);
    await session.storage.grapse_keimeno('legacy-backup-check.txt', 'legacy backup restored');
    const check = await session.storage.diavase_keimeno('legacy-backup-check.txt');
    expect(check.ok && check.timi).toBe('legacy backup restored');
  });

  it('δημιουργεί recovery key που μπορεί να ξεκλειδώσει το vault ανεξάρτητα από τον master password', async () => {
    const storage = new MnimiApothiki();
    const created = await createVault(storage, MASTER_PASSWORD);
    expect(created.recoveryKey).toMatch(/^[A-F0-9]{48}$/);
    const recovered = await unlockVault(storage, created.recoveryKey);
    await recovered.storage.grapse_keimeno('recovery-check.txt', 'recovered');
    const value = await recovered.storage.diavase_keimeno('recovery-check.txt');
    expect(value.ok && value.timi).toBe('recovered');
  });

  it('μεταφέρει κρυπτογραφημένα αρχεία και secrets σε κενή συσκευή χωρίς plaintext στο backup', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const backupText = new TextDecoder().decode(backupBytes);
    expect(backup.type).toBe('application/vnd.dps-guide.backup');
    expect(new TextDecoder().decode(backupBytes.subarray(0, 8))).toBe('DPSBKP02');
    expect(new DataView(backupBytes.buffer, backupBytes.byteOffset, backupBytes.byteLength).getUint32(24, false)).toBe(600_000);
    expect(backupText).not.toContain('encrypted course notes');
    expect(backupText).not.toContain('test-only-secret-never-plaintext');

    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD);
    const session = await unlockVault(targetStorage, MASTER_PASSWORD);

    const note = await session.storage.diavase_keimeno('CS101/notes.json');
    expect(note.ok && note.timi).toBe('{"notes":"encrypted course notes"}');
    const file = await session.storage.diavase_dyadiko('CS101/files/scan.bin');
    expect(file.ok && [...file.timi]).toEqual([0, 1, 127, 255]);
    const secrets = new EncryptedMystikaPyli(targetSecrets, session.dataKey);
    expect(await secrets.pare('llm_api_key')).toBe('test-only-secret-never-plaintext');
  });

  it('λανθασμένος κωδικός backup απορρίπτεται και αφήνει το vault κενό', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(
      targetStorage, targetSecrets, backup, 'incorrect-backup-password-2026',
    )).rejects.toThrow('Ο κωδικός backup δεν είναι σωστός');
    const files = await targetStorage.lista('.dps-vault');
    expect(files.ok && files.timi).toEqual([]);
    expect(await targetSecrets.pare('llm_api_key')).toBeNull();
  });

  it('αλλοίωση στο τελικό authenticated chunk κάνει rollback όλων των εγγραφών', async () => {
    const corrupted = new Uint8Array(await backup.arrayBuffer());
    corrupted[corrupted.length - 1] = (corrupted[corrupted.length - 1] ?? 0) ^ 1;
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(
      targetStorage, targetSecrets, new Blob([corrupted]), BACKUP_PASSWORD,
    )).rejects.toThrow();
    const files = await targetStorage.lista('.dps-vault');
    expect(files.ok && files.timi).toEqual([]);
    expect(await targetSecrets.pare('llm_api_key')).toBeNull();
  });

  it('δεν ξεκινά επαναφορά σε συσκευή που περιέχει ήδη vault δεδομένα', async () => {
    const targetStorage = new MnimiApothiki();
    await targetStorage.grapse_keimeno('.dps-vault/unrelated', 'occupied');
    await expect(restoreEncryptedBackup(targetStorage, new FakeMystika(), backup, BACKUP_PASSWORD))
      .rejects.toThrow('καθαρή εγκατάσταση');
  });
});
