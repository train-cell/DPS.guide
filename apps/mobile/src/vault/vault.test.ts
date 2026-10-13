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

describe('encrypted vault backup/restore', () => {
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
