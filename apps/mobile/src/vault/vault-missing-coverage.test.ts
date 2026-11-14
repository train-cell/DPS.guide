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
const HEADER_PATH = '.dps-vault/header.json';
const CHUNK_BYTES = 1024 * 1024;
const TERMINATOR_RECORD = new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const VALID_HEADER_JSON = encoder.encode(
  JSON.stringify({
    version: 1,
    master: { salt: 'c2FsdA==', iv: 'aXY=', wrapped_key: 'd3JhcHBlZA==' },
    recovery: { salt: 'c2FsdA==', iv: 'aXY=', wrapped_key: 'd3JhcHBlZA==' },
  })
);

let backup: Blob;
const streamMocks: Array<() => void> = [];

function concatenate(...items: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(items.reduce((length, item) => length + item.byteLength, 0));
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.byteLength;
  }
  return result;
}

/** Φτιάχνει ένα κρυπτογραφημένο τμήμα backup (kind, 4 byte length, iv, ciphertext). */
function encryptedBackupRecord(kind: 0 | 1, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const record = new Uint8Array(17 + ciphertext.byteLength);
  record[0] = kind;
  new DataView(record.buffer).setUint32(1, ciphertext.byteLength, false);
  record.set(iv, 5);
  record.set(ciphertext, 17);
  return record;
}

function encodeRecord(kind: number, path: string, data: Uint8Array): Uint8Array {
  const pathBytes = encoder.encode(path);
  const header = new Uint8Array(11);
  header[0] = kind;
  new DataView(header.buffer).setUint16(1, pathBytes.byteLength, false);
  new DataView(header.buffer).setBigUint64(3, BigInt(data.byteLength), false);
  return concatenate(header, pathBytes, data);
}

async function createV2BackupRaw(
  chunks: readonly Uint8Array[],
  { finalData = new Uint8Array(0) }: { finalData?: Uint8Array } = {}
): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(encoder.encode(BACKUP_PASSWORD)).buffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: Uint8Array.from(salt).buffer, iterations: 600_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const prefix = new Uint8Array(28);
  prefix.set(encoder.encode('DPSBKP02'));
  prefix.set(salt, 8);
  new DataView(prefix.buffer).setUint32(24, 600_000, false);

  const parts: Uint8Array[] = [prefix];
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]!;
    const aad = `dps.backup.v2/chunk/${index}`;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: Uint8Array.from(iv).buffer, additionalData: encoder.encode(aad) },
        wrappingKey,
        Uint8Array.from(chunk).buffer
      )
    );
    parts.push(encryptedBackupRecord(0, iv, ciphertext));
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: Uint8Array.from(iv).buffer,
        additionalData: encoder.encode(`dps.backup.v2/final/${chunks.length}`),
      },
      wrappingKey,
      Uint8Array.from(finalData).buffer
    )
  );
  parts.push(encryptedBackupRecord(1, iv, ciphertext));
  return new Blob(parts.map((part) => Uint8Array.from(part).buffer as ArrayBuffer), {
    type: 'application/vnd.dps-guide.backup',
  });
}

/**
 * Κωδικοποιεί ένα plaintext backup v2· τα records χωρίζονται σε τμήματα όπως τα
 * `createEncryptedBackup` αλλά με πλήρη έλεγχο του περιεχομένου κάθε τμήματος.
 */
async function createV2Backup(
  records: { kind: number; path: string; data: Uint8Array }[],
  { finalData = new Uint8Array(0) }: { finalData?: Uint8Array } = {}
): Promise<Blob> {
  const parts: Uint8Array[] = [];
  for (const record of records) {
    if (record.kind === 255) {
      parts.push(TERMINATOR_RECORD);
    } else {
      parts.push(encodeRecord(record.kind, record.path, record.data));
    }
  }
  return createV2BackupRaw([concatenate(...parts)], { finalData });
}

/** Blob που δίνει ένα ψεύτικο stream με τα δεδομένα που ορίζουμε σε χωριστά τμήματα. */
function chunkedBlob(chunks: readonly Uint8Array[]): Blob {
  const originalStream = Blob.prototype.stream;
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const stream = new Blob([new Uint8Array(Math.max(48, totalLength))], {
    type: 'application/vnd.dps-guide.backup',
  });
  Blob.prototype.stream = function () {
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    });
  };
  streamMocks.push(() => {
    Blob.prototype.stream = originalStream;
  });
  return stream;
}

/** Φτιάχνει ένα backup v2 στο οποίο λείπει η κρυπτογράφηση των επαναλήψεων (μόνο 24 bytes). */
function truncatedV2Backup(): Blob {
  const prefix = new Uint8Array(24);
  prefix.set(encoder.encode('DPSBKP02'));
  return chunkedBlob([prefix]);
}

/** Πλάσμα backup με μόνο το prefix (28 bytes), χωρίς καμία εγγραφή. */
function prefixOnlyBlob(): Blob {
  const prefix = new Uint8Array(28);
  prefix.set(encoder.encode('DPSBKP02'));
  new DataView(prefix.buffer).setUint32(24, 600_000, false);
  return chunkedBlob([prefix]);
}

/** Backup με το prefix και το 5byte header μίας εγγραφής, χωρίς υπόλοιπα bytes. */
function truncatedChunkBlob(): Blob {
  const prefix = new Uint8Array(28);
  prefix.set(encoder.encode('DPSBKP02'));
  new DataView(prefix.buffer).setUint32(24, 600_000, false);
  const header = new Uint8Array(5);
  header[0] = 0;
  new DataView(header.buffer).setUint32(1, 16, false);
  return chunkedBlob([prefix, header]);
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

describe('BackupPlaintextReader — ακριβής κάλυψη εγγραφών', () => {
  it('πετάει όταν το feed καλείται μετά το τέλος (terminator) του backup', async () => {
    const backup = await createV2BackupRaw([
      concatenate(TERMINATOR_RECORD, new Uint8Array([1, 2, 3])),
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει επιπλέον δεδομένα μετά το τέλος του'
    );
  });

  it('δίνει το header σε δύο χωριστά τμήματα feed (μέρος του header)', async () => {
    const headerRec = encodeRecord(0, '.dps-vault/header.json', VALID_HEADER_JSON);
    const chunk0 = headerRec.subarray(0, 5);
    const chunk1 = concatenate(headerRec.subarray(5), TERMINATOR_RECORD);
    const backup = await createV2BackupRaw([chunk0, chunk1]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD);
  });

  it('απορρίπτείνει header με πολύ μεγάλο μέγεθος δεδομένου (MAX_BACKUP_RECORD_BYTES)', async () => {
    const header = new Uint8Array(11);
    header[0] = 0;
    new DataView(header.buffer).setUint16(1, 19, false);
    new DataView(header.buffer).setBigUint64(3, BigInt(220 * 1024 * 1024 + 1), false);
    const backup = await createV2BackupRaw([header]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει υπερβολικά μεγάλο αρχείο'
    );
  });

  it('απορρίπτείνει terminator με pathLength ή dataLength διαφορετικά του 0', async () => {
    const badTerminator = new Uint8Array(11);
    badTerminator[0] = 255;
    new DataView(badTerminator.buffer).setUint16(1, 1, false);
    new DataView(badTerminator.buffer).setBigUint64(3, 0n, false);
    const backup = await createV2BackupRaw([badTerminator]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Μη έγκυρο τέλος backup'
    );
  });

  it('απορρίπτείνει άγνωστο kind εγγραφής', async () => {
    const badKind = new Uint8Array(11);
    badKind[0] = 2;
    new DataView(badKind.buffer).setUint16(1, 0, false);
    new DataView(badKind.buffer).setBigUint64(3, 0n, false);
    const backup = await createV2BackupRaw([badKind]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει άγνωστο τύπο εγγραφής'
    );
  });

  it('δίνει το path σε δύο χωριστά τμήματα feed (μέρος του path)', async () => {
    const headerRec = encodeRecord(0, '.dps-vault/header.json', VALID_HEADER_JSON);
    const chunk0 = headerRec.subarray(0, 16);
    const chunk1 = concatenate(headerRec.subarray(16), TERMINATOR_RECORD);
    const backup = await createV2BackupRaw([chunk0, chunk1]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD);
  });

  it('δέχεται εγγραφή με μηδενικό μήκος δεδομένων', async () => {
    const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
    const backup = await createV2Backup([
      { kind: 0, path: '.dps-vault/header.json', data: header },
      { kind: 0, path: '.dps-vault/empty.bin', data: new Uint8Array(0) },
      { kind: 255, path: '', data: new Uint8Array(0) },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD);
    expect((await targetStorage.diavase_dyadiko('.dps-vault/empty.bin')).timi).toEqual(new Uint8Array(0));
  });

  it('απορρίπτείνει backup χωρίς κρυπτογράφηση επαναλήψεων (24 bytes μόνο)', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(
      restoreEncryptedBackup(targetStorage, targetSecrets, truncatedV2Backup(), BACKUP_PASSWORD)
    ).rejects.toThrow('Το backup δεν περιέχει ρύθμιση κρυπτογράφησης');
  });

  it('απορρίπτείνει backup με μόνο το prefix (δεν έχει τέλος)', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(
      restoreEncryptedBackup(targetStorage, targetSecrets, prefixOnlyBlob(), BACKUP_PASSWORD)
    ).rejects.toThrow('Το backup δεν έχει έγκυρο τέλος');
  });

  it('απορρίπτείνει backup με μόνο το prefix και το header της εγγραφής (κομμένο iv)', async () => {
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(
      restoreEncryptedBackup(targetStorage, targetSecrets, truncatedChunkBlob(), BACKUP_PASSWORD)
    ).rejects.toThrow('Το backup είναι κομμένο');
  });

  it('απορρίπτείνει backup με διπλή διαδρομή', async () => {
    const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
    const backup = await createV2Backup([
      { kind: 0, path: '.dps-vault/header.json', data: header },
      { kind: 0, path: '.dps-vault/header.json', data: header },
      { kind: 255, path: '', data: new Uint8Array(0) },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει άκυρη ή διπλή διαδρομή'
    );
  });

  it('απορρίπτείνει backup με μη έγκυρη διαδρομή', async () => {
    const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
    const backup = await createV2Backup([
      { kind: 0, path: 'CS101/notes.json', data: header },
      { kind: 255, path: '', data: new Uint8Array(0) },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει άκυρη ή διπλή διαδρομή'
    );
  });

  it('απορρίπτείνει backup με τελικό chunk που δεν είναι άδειο', async () => {
    const header = encoder.encode(JSON.stringify({ version: 1, master: {}, recovery: {} }));
    const backup = await createV2Backup([
      { kind: 0, path: '.dps-vault/header.json', data: header },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup δεν περιέχει πλήρη, αυθεντικοποιημένα δεδομένα'
    );
  });

  it('απορρίπτείνει backup που δεν περιέχει header (δεν είναι πλήρες)', async () => {
    const backup = await createV2Backup([
      { kind: 0, path: '.dps-vault/other.txt', data: new Uint8Array(0) },
      { kind: 255, path: '', data: new Uint8Array(0) },
    ]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup δεν περιέχει πλήρες vault'
    );
  });
});

describe('BackupStreamReader — κενά τμήματα και trailing bytes', () => {
  it('διαβάζει ακριβώς όταν το stream βγάζει άδειο τμήμα πριν το υπόλοιπο', async () => {
    const prefix = new Uint8Array(24);
    prefix.set(encoder.encode('DPSBKP02'));
    const stream = chunkedBlob([prefix, new Uint8Array(0), encoder.encode('x')]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, stream, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup είναι κομμένο ή αλλοιωμένο'
    );
  });

  it('διαβάζει trailing bytes σε ξεχωριστό τμήμα μετά το τελικό chunk', async () => {
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const stream = chunkedBlob([backupBytes, new Uint8Array(10)]);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, stream, BACKUP_PASSWORD)).rejects.toThrow(
      'Το backup περιέχει δεδομένα μετά την τελική υπογραφή'
    );
  });
});

describe('restore — συσκευή με ήδη υπάρχον vault', () => {
  it('δεν ξεκινά επαναφορά όταν το vault υπάρχει ήδη (κενή συσκευή ≠ vault)', async () => {
    const targetStorage = new MnimiApothiki();
    await createVault(targetStorage, MASTER_PASSWORD);
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Η επαναφορά επιτρέπεται μόνο σε κενή συσκευή'
    );
  });

  it('απορρίπτείνει όταν η λίστα της συσκευής αποτυγχάνει', async () => {
    class BrokenStorage extends MnimiApothiki {
      override async lista(): Promise<ReturnType<MnimiApothiki['lista']>> {
        return { ok: false, sfalma: { kodikos: 'AGNOSTO', minima: 'den mporei' } };
      }
    }
    const targetStorage = new BrokenStorage();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Η επαναφορά επιτρέπεται μόνο σε κενή συσκευή'
    );
  });
});

describe('restore — αποτυχία εγγραφής στο vault', () => {
  it('απορρίπτείνει όταν αποτυγχάνει η εγγραφή ενός αρχείου', async () => {
    class FailingStorage extends MnimiApothiki {
      override async grapse_dyadiko(
        diadromi: string,
        dedomena: Uint8Array
      ): Promise<ReturnType<MnimiApothiki['grapse_dyadiko']>> {
        return { ok: false, sfalma: { kodikos: 'AGNOSTO', minima: 'disk full' } };
      }
    }
    const targetStorage = new FailingStorage();
    const targetSecrets = new FakeMystika();
    await expect(restoreEncryptedBackup(targetStorage, targetSecrets, backup, BACKUP_PASSWORD)).rejects.toThrow(
      'Δεν ήταν δυνατή η εγγραφή των δεδομένων στο vault'
    );
    expect((await targetStorage.lista('.dps-vault')).timi).toEqual([]);
  });
});

describe('enclosed storage — κρυπτογραφημένος κατάλογος και κρυπτογράφηση', () => {
  it('απορρίπτείνει κρυπτογραφημένο κατάλογο χωρίς έγκυρη μορφή', async () => {
    const storage = new MnimiApothiki();
    const created = await createVault(storage, MASTER_PASSWORD);
    const session = await unlockVault(storage, MASTER_PASSWORD);
    // Γράφουμε έναν κακοσχηματισμένο κρυπτογραφημένο κατάλογο.
    const clear = encoder.encode(JSON.stringify({ version: 1, files: 'not-an-object' }));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: Uint8Array.from(iv).buffer,
          additionalData: encoder.encode('dps.vault.v1/index'),
        },
        created.session.dataKey,
        Uint8Array.from(clear).buffer
      )
    );
    const ciphertext = {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...encrypted)),
    };
    await storage.grapse_dyadiko('.dps-vault/index.enc', encoder.encode(JSON.stringify(ciphertext)));
    const res = await session.storage.diavase_keimeno('CS101/notes.json');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('απορρίπτείνει όταν αποτυγχάνει η κρυπτογράφηση της εγγραφής', async () => {
    const storage = new MnimiApothiki();
    await createVault(storage, MASTER_PASSWORD);
    const session = await unlockVault(storage, MASTER_PASSWORD);
    const original = crypto.subtle.encrypt;
    (crypto.subtle as Record<string, unknown>).encrypt = async () => {
      throw new Error('crypto failure');
    };
    try {
      const res = await session.storage.grapse_keimeno('CS101/fail.txt', 'fail');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.minima).toContain('κρυπτογράφηση και αποθήκευση');
      }
    } finally {
      (crypto.subtle as Record<string, unknown>).encrypt = original;
    }
  });
});

describe('backup — ακριβές 1MB plaintext', () => {
  it('κλείνει το backup όταν το plaintext είναι ακριβώς 1MB', async () => {
    const storage = new MnimiApothiki();
    const secrets = new FakeMystika();
    await createVault(storage, MASTER_PASSWORD);
    const headerRes = await storage.diavase_keimeno(HEADER_PATH);
    const headerBytes = encoder.encode(headerRes.timi).byteLength;
    // Overhead without pad file:
    // header: 11 header + 22 path + headerBytes data
    // pad: 11 header + 19 path
    // terminator: 11
    const overheadWithoutPad = 11 + 22 + headerBytes + 11 + 19 + 11;
    const padLen = CHUNK_BYTES - overheadWithoutPad;
    await storage.grapse_dyadiko('.dps-vault/pad.bin', new Uint8Array(padLen));
    const blob = await createEncryptedBackup(storage, secrets, BACKUP_PASSWORD);
    const targetStorage = new MnimiApothiki();
    const targetSecrets = new FakeMystika();
    await restoreEncryptedBackup(targetStorage, targetSecrets, blob, BACKUP_PASSWORD);
    expect((await targetStorage.lista('.dps-vault')).timi.length).toBeGreaterThan(0);
  });
});
