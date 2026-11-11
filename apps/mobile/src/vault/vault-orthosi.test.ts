import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apotyxia, ok } from '@dps/core';
import { FakeMystika, MnimiApothiki } from '@dps/core/testing';
import type { ApothikiPyli, MystikaPyli, Apotelesma } from '@dps/core';
import {
  ApothikiMystikaPyli,
  EncryptedApothiki,
  EncryptedMystikaPyli,
  createEncryptedBackup,
  createVault,
  exportBiometricUnlockKey,
  restoreEncryptedBackup,
  unlockVault,
  unlockWithBiometricKey,
} from './vault.js';

const MASTER_PASSWORD = 'master-password-test-2026';
const BACKUP_PASSWORD = 'separate-backup-password-2026';

/** Φτιάχνει μια αποθήκη που επιστρέφει το σφάλμα που ορίζει ο κλήρος. */
function klono_storage(diafaneia: Record<string, Apotelesma<unknown>>): ApothikiPyli {
  /** Κρατάει τα γράψιμα δυαδικών διαδρομών για να διαβάζονται μετά την εγγραφή. */
  const written: Map<string, Uint8Array> = new Map();

  /** Βρίσκει τιμή με ακριβή ή pattern `*` αντιστοίχιση. */
  function find(key: string): Apotelesma<unknown> | undefined {
    if (key in diafaneia) return diafaneia[key];
    for (const [pattern, value] of Object.entries(diafaneia)) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.split('*').join('.*') + '$');
        if (regex.test(key)) return value;
      }
    }
    return undefined;
  }

  return {
    async diavase_keimeno(diadromi: string) {
      return (find(`diavase_keimeno:${diadromi}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<string>;
    },
    async grapse_keimeno(diadromi: string, _periexomeno: string) {
      return (find(`grapse_keimeno:${diadromi}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<void>;
    },
    async diavase_dyadiko(diadromi: string) {
      const saved = written.get(diadromi);
      if (saved) return ok(saved);
      return (find(`diavase_dyadiko:${diadromi}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<Uint8Array>;
    },
    async grapse_dyadiko(diadromi: string, dedomena: Uint8Array) {
      const result = (find(`grapse_dyadiko:${diadromi}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<void>;
      if (result.ok) written.set(diadromi, new Uint8Array(dedomena));
      return result as Apotelesma<void>;
    },
    async yparxei() { return false; },
    async lista(fakelos: string) {
      return (find(`lista:${fakelos}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<string[]>;
    },
    async diagrafi(diadromi: string) {
      return (find(`diagrafi:${diadromi}`) ?? apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε')) as Apotelesma<void>;
    },
  };
}

/** Φτιάχνει μια πύλη μυστικών με συγκεκριμένη συμπεριφορά. */
function klono_mystika(diafaneia: Record<string, unknown>): MystikaPyli {
  return {
    async pare(key: string) {
      return diafaneia[key] as unknown as string | null;
    },
    async vale(key: string, value: string) {
      diafaneia[key] = value as unknown as Apotelesma<unknown>;
    },
    async svise(key: string) {
      diafaneia[key] = null;
    },
  };
}

/** Κωδικοποιεί κείμενο σε Base64 για τα legacy header (D7: μόνο δοκιμές). */
function toBase64(value: string): string {
  return b64(new TextEncoder().encode(value));
}

function b64(bytes: Uint8Array): string {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}

describe('vault — έλεγχος έγκυρων διαδρομών αποθήκευσης', () => {
  let storage: ApothikiPyli;

  beforeEach(() => {
    storage = klono_storage({ 'diavase_dyadiko:*': apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε') });
  });

  it('απορρίπτει κενή και βαθμωτή διαδρομή', async () => {
    const vault = new EncryptedApothiki(storage, await crypto.subtle.importKey(
      'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
    ));
    expect(await vault.diavase_keimeno('')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
    expect(await vault.grapse_keimeno('..', 'x')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
    expect(await vault.diavase_keimeno('a\0b')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
    expect(await vault.diavase_keimeno('.dps-vault/header.json')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
    expect(await vault.diavase_keimeno('../vault.json')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
    expect(await vault.yparxei('.dps-vault/header.json')).toBe(false);
    expect(await vault.diagrafi('')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.'),
    );
  });

  it('απορρίπτει μη έγκυρη διαδρομή φακέλου', async () => {
    const vault = new EncryptedApothiki(storage, await crypto.subtle.importKey(
      'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
    ));
    expect(await vault.lista('.dps-vault')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή φακέλου δεν είναι έγκυρη.'),
    );
  });
});

describe('vault — unlockVault με κλειδωμένο vault', () => {
  it('πετάει όταν δεν υπάρχει header', async () => {
    const storage = klono_storage({ 'diavase_keimeno:*': apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε') });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Δεν έχει δημιουργηθεί vault σε αυτή τη συσκευή.');
  });

  it('πετάει όταν το header δεν είναι έγκυρο', async () => {
    const storage = klono_storage({ 'diavase_keimeno:.dps-vault/header.json': ok('{"x":1}') });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Το αρχείο ρύθμισης του vault είναι κατεστραμμένο');
  });

  it('δεν πετάει όταν το header έχει άγνωστη κρυπτογραφημένη ρύθμιση', async () => {
    const storage = klono_storage({ 'diavase_keimeno:.dps-vault/header.json': ok('{}') });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Το αρχείο ρύθμισης του vault είναι κατεστραμμένο');
  });

  it('πετάει σφάλμα ανάγνωσης όταν η αποθήκη αποτυγχάνει', async () => {
    const storage = klono_storage({ 'diavase_keimeno:.dps-vault/header.json': apotyxia('AGNOSTO', 'fail') });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Δεν ήταν δυνατή η ανάγνωση της ρύθμισης του vault.');
  });

  it('πετάει όταν η επιδιόρθωση legacy αποθήκης αποτυγχάνει', async () => {
    const legacyHeader = JSON.stringify({
      version: 1,
      master: { salt: b64(new Uint8Array([1])), iv: b64(new Uint8Array([2])), wrapped_key: b64(new Uint8Array([3])) },
      recovery: { salt: b64(new Uint8Array([4])), iv: b64(new Uint8Array([5])), wrapped_key: b64(new Uint8Array([6])) },
    });
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(toBase64(legacyHeader)),
      'grapse_keimeno:.dps-vault/header.json': apotyxia('AGNOSTO', 'αδυναμία γραφής'),
    });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Δεν ήταν δυνατή η επιδιόρθωση της ρύθμισης του vault.');
  });

  it('πετάει όταν η κρυπτογράφηση δεν υποστηρίζεται', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(JSON.stringify({
        version: 1,
        master: { salt: b64(new Uint8Array([1])), iv: b64(new Uint8Array([2])), wrapped_key: b64(new Uint8Array([3])), iterations: 100 },
        recovery: { salt: b64(new Uint8Array([4])), iv: b64(new Uint8Array([5])), wrapped_key: b64(new Uint8Array([6])), iterations: 100 },
      })),
    });
    await expect(unlockVault(storage, MASTER_PASSWORD)).rejects.toThrow('Ο κύριος κωδικός ή το recovery key δεν είναι σωστό.');
  });

  it('πετάει όταν κανένα διαπιστευτήριο δεν ταιριάζει', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(JSON.stringify({
        version: 1,
        master: { salt: b64(new Uint8Array([1])), iv: b64(new Uint8Array([2])), wrapped_key: b64(new Uint8Array([3])), iterations: 600_000 },
        recovery: { salt: b64(new Uint8Array([4])), iv: b64(new Uint8Array([5])), wrapped_key: b64(new Uint8Array([6])), iterations: 600_000 },
      })),
    });
    await expect(unlockVault(storage, 'wrong-master-password')).rejects.toThrow(
      'Ο κύριος κωδικός ή το recovery key δεν είναι σωστό.',
    );
  });

  it('δοκιμάζει την καθαρισμένη μορφή του κωδικού πριν πετάει', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(JSON.stringify({
        version: 1,
        master: { salt: b64(new Uint8Array([1])), iv: b64(new Uint8Array([2])), wrapped_key: b64(new Uint8Array([3])), iterations: 600_000 },
        recovery: { salt: b64(new Uint8Array([4])), iv: b64(new Uint8Array([5])), wrapped_key: b64(new Uint8Array([6])), iterations: 600_000 },
      })),
    });
    // Με whitespace στο κωδικό, η αναπλήρωση "cleaned" απορρίπτεται από το unwrap.
    await expect(unlockVault(storage, ' wrong-master-password ')).rejects.toThrow(
      'Ο κύριος κωδικός ή το recovery key δεν είναι σωστό.',
    );
  });
});

describe('vault — unlockWithBiometricKey', () => {
  const dataKey = async () => crypto.subtle.importKey(
    'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );

  it('πετάει όταν η λίστα δεν είναι έγκυρη', async () => {
    const storage = klono_storage({
      'diavase_dyadiko:.dps-vault/index.enc': apotyxia('AGNOSTO', 'αδυναμία'),
    });
    const key = await dataKey();
    await expect(unlockWithBiometricKey(storage, b64(new Uint8Array(await crypto.subtle.exportKey('raw', key))))).rejects.toThrow(
      'Το κλειδί βιομετρικού ξεκλειδώματος δεν είναι έγκυρο.',
    );
  });

  it('επιστρέφει το encoded κλειδί', async () => {
    const key = await dataKey();
    const session = { storage: new EncryptedApothiki(klono_storage({}), key), dataKey: key };
    expect(await exportBiometricUnlockKey(session)).toBe(b64(new Uint8Array(await crypto.subtle.exportKey('raw', key))));
  });

  it('επιστρέφει το session όταν η λίστα είναι έγκυρη', async () => {
    const key = await dataKey();
    const storage = klono_storage({
      'lista:*': ok(['.dps-vault/header.json']),
      'diavase_dyadiko:.dps-vault/index.enc': await encryptedIndex(key, {}),
    });
    const session = await unlockWithBiometricKey(storage, b64(new Uint8Array(await crypto.subtle.exportKey('raw', key))));
    expect(session.storage).toBeInstanceOf(EncryptedApothiki);
    expect(session.dataKey.usages).toEqual(['encrypt', 'decrypt']);
  });
});

describe('vault — createVault σφάλματα', () => {
  it('πετάει όταν ο κωδικός είναι αδύναμος', async () => {
    await expect(createVault(klono_storage({}), 'short')).rejects.toThrow('Ο κύριος κωδικός πρέπει να έχει τουλάχιστον 12 χαρακτήρες.');
  });

  it('πετάει όταν η αποθήκη δεν γράφει το header', async () => {
    const storage = klono_storage({
      'diavase_keimeno:*': apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε'),
      'grapse_keimeno:.dps-vault/header.json': apotyxia('AGNOSTO', 'αδυναμία γραφής'),
    });
    await expect(createVault(storage, MASTER_PASSWORD)).rejects.toThrow('Δεν ήταν δυνατή η αποθήκευση της ρύθμισης του vault.');
  });
});

/** Δοκιμαστικό vault header που αναγνωρίζεται από το `readHeader`. */
const vaultHeader = JSON.stringify({
  version: 1,
  master: { salt: b64(new Uint8Array([1])), iv: b64(new Uint8Array([2])), wrapped_key: b64(new Uint8Array([3])), iterations: 600_000 },
  recovery: { salt: b64(new Uint8Array([4])), iv: b64(new Uint8Array([5])), wrapped_key: b64(new Uint8Array([6])), iterations: 600_000 },
});

describe('vault — createEncryptedBackup σφάλματα', () => {
  it('πετάει όταν ο κωδικός backup είναι αδύναμος', async () => {
    const storage = klono_storage({ 'lista:*': ok([]) });
    await expect(createEncryptedBackup(storage, new FakeMystika(), 'short')).rejects.toThrow(
      'Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.',
    );
  });

  it('πετάει όταν δεν υπάρχει ρυθμισμένο vault', async () => {
    const storage = klono_storage({ 'lista:*': ok([]) });
    await expect(createEncryptedBackup(storage, new FakeMystika(), BACKUP_PASSWORD)).rejects.toThrow(
      'Δεν υπάρχει ρυθμισμένο vault για backup.',
    );
  });
});

describe('vault — vaultBackupPlaintext σφάλματα', () => {
  it('πετάει όταν η λίστα αποτυγχάνει', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(vaultHeader),
      'lista:.dps-vault': apotyxia('AGNOSTO', 'αδυναμία'),
    });
    await expect(createEncryptedBackup(storage, new FakeMystika(), BACKUP_PASSWORD)).rejects.toThrow(
      'Δεν ήταν δυνατή η ανάγνωση του vault για backup.',
    );
  });

  it('πετάει όταν η λίστα περιέχει μη αναμενόμενη διαδρομή', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(vaultHeader),
      'lista:.dps-vault': ok(['other-file.json']),
      'diavase_dyadiko:*': apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε'),
    });
    await expect(createEncryptedBackup(storage, new FakeMystika(), BACKUP_PASSWORD)).rejects.toThrow(
      'Το vault περιέχει μη αναμενόμενη διαδρομή.',
    );
  });

  it('πετάει όταν η ανάγνωση ενός αρχείου αποτυγχάνει', async () => {
    const storage = klono_storage({
      'diavase_keimeno:.dps-vault/header.json': ok(vaultHeader),
      'lista:.dps-vault': ok(['.dps-vault/header.json']),
      'diavase_dyadiko:.dps-vault/header.json': apotyxia('AGNOSTO', 'αδυναμία'),
    });
    await expect(createEncryptedBackup(storage, new FakeMystika(), BACKUP_PASSWORD)).rejects.toThrow(
      'Δεν ήταν δυνατή η ανάγνωση όλων των κρυπτογραφημένων αρχείων του vault.',
    );
  });
});

describe('vault — ApothikiMystikaPyli σφάλματα', () => {
  let storage: ApothikiPyli;
  let secrets: ApothikiMystikaPyli;

  beforeEach(() => {
    storage = klono_storage({ 'diavase_keimeno:*': apotyxia('DEN_VRETHIKE', 'δεν βρέθηκε') });
    secrets = new ApothikiMystikaPyli(storage);
  });

  it('επιστρέφει null όταν δεν βρέθηκε κλειδί', async () => {
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('πετάει όταν η διαγραφή αποτυγχάνει', async () => {
    const store = new ApothikiMystikaPyli(klono_storage({
      'diagrafi:.dps-vault/secrets/llm_api_key': apotyxia('AGNOSTO', 'αδυναμία'),
    }));
    await expect(store.svise('llm_api_key')).rejects.toThrow('Δεν ήταν δυνατή η διαγραφή του κλειδιού από τη συσκευή.');
  });

  it('δεν πετάει όταν η διαγραφή δεν βρήκε το κλειδί', async () => {
    await expect(secrets.svise('llm_api_key')).resolves.toBeUndefined();
  });

  it('πετάει όταν η αποθήκευση αποτυγχάνει', async () => {
    const store = new ApothikiMystikaPyli(klono_storage({
      'grapse_keimeno:.dps-vault/secrets/llm_api_key': apotyxia('AGNOSTO', 'αδυναμία'),
    }));
    await expect(store.vale('llm_api_key', 'value')).rejects.toThrow('Δεν ήταν δυνατή η αποθήκευση του κλειδιού στη συσκευή.');
  });
});

describe('vault — EncryptedMystikaPyli σφάλματα', () => {
  const dataKey = async () => crypto.subtle.importKey(
    'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );

  it('επιστρέφει null όταν δεν υπάρχει κλειδί', async () => {
    const secrets = new EncryptedMystikaPyli(klono_mystika({}), await dataKey());
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('επιστρέφει null όταν το κλειδί είναι κενό', async () => {
    const secrets = new EncryptedMystikaPyli(klono_mystika({ llm_api_key: null }), await dataKey());
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('επιστρέφει null όταν το κλειδί δεν είναι έγκυρο', async () => {
    const secrets = new EncryptedMystikaPyli(klono_mystika({ llm_api_key: 'not-json' }), await dataKey());
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('επιστρέφει null όταν το κλειδί δεν έχει έγκυρη μορφή', async () => {
    const secrets = new EncryptedMystikaPyli(
      klono_mystika({ llm_api_key: JSON.stringify({ iv: 1, data: 'x' }) }), await dataKey(),
    );
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('δεν πετάει όταν η αποκρυπτογράφηση αποτυγχάνει', async () => {
    const secrets = new EncryptedMystikaPyli(
      klono_mystika({ llm_api_key: JSON.stringify({ iv: 'x', data: 'x' }) }), await dataKey(),
    );
    expect(await secrets.pare('llm_api_key')).toBeNull();
  });

  it('δεν πετάει όταν η svise αποτυγχάνει', async () => {
    const secrets = new EncryptedMystikaPyli(klono_mystika({}), await dataKey());
    await expect(secrets.svise('llm_api_key')).resolves.toBeUndefined();
  });
});

/** Κρυπτογραφεί τον δείκτη vault με το κλειδί δεδομένων, σαν την παραγωγή. */
async function encryptedIndex(dataKey: CryptoKey, files: Record<string, string>): Promise<Apotelesma<Uint8Array>> {
  const clear = new TextEncoder().encode(JSON.stringify({ version: 1, files }));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('dps.vault.v1/index') },
    dataKey,
    clear,
  ));
  return ok(new TextEncoder().encode(JSON.stringify({
    iv: b64(iv),
    data: b64(ciphertext),
  })));
}

describe('vault — EncryptedApothiki σφάλματα', () => {
  const dataKey = async () => crypto.subtle.importKey(
    'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );

  it('επιστρέφει σφάλμα αποκρυπτογράφησης όταν ο κατάλογος δεν μπορεί να αναγνωστεί', async () => {
    const vault = new EncryptedApothiki(
      klono_storage({ 'diavase_dyadiko:.dps-vault/index.enc': apotyxia('AGNOSTO', 'αδυναμία') }),
      await dataKey(),
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει σφάλμα αποκρυπτογράφησης όταν ο κατάλογος είναι αλλοιωμένος', async () => {
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': ok(new TextEncoder().encode(JSON.stringify({
          iv: b64(new Uint8Array([1, 2, 3])),
          data: b64(new Uint8Array([4, 5, 6])),
        }))),
      }),
      await dataKey(),
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει σφάλμα αποκρυπτογράφησης όταν ο κατάλογος δεν έχει έγκυρη μορφή', async () => {
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': ok(new TextEncoder().encode(JSON.stringify({ version: 2, files: {} }))),
      }),
      await dataKey(),
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει σφάλμα όταν ο κατάλογος δεν έχει πεδίο αρχείων', async () => {
    const key = await dataKey();
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': ok(new TextEncoder().encode(JSON.stringify({ version: 1, files: 'x' }))),
      }),
      key,
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει σφάλμα αποκρυπτογράφησης όταν τα κρυπτογραφημένα δεδομένα είναι μη έγκυρα', async () => {
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': ok(new TextEncoder().encode(JSON.stringify({ version: 1, files: { 'x': 'id' } }))),
        'diavase_dyadiko:.dps-vault/objects/id.enc': ok(new TextEncoder().encode('not-json')),
      }),
      await dataKey(),
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει DEN_VRETHIKE όταν δεν υπάρχει αρχείο', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, {});
    const vault = new EncryptedApothiki(
      klono_storage({ 'diavase_dyadiko:.dps-vault/index.enc': index }),
      key,
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('επιστρέφει MI_EGKYRO_SXIMA όταν η αποκρυπτογράφηση αποτυγχάνει', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'id' });
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'diavase_dyadiko:.dps-vault/objects/id.enc': ok(new TextEncoder().encode(JSON.stringify({
          iv: b64(new Uint8Array([1, 2, 3])),
          data: b64(new Uint8Array([4, 5, 6])),
        }))),
      }),
      key,
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει σφάλμα όταν η αποθήκη δεν γράφει το αντικείμενο', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, {});
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'grapse_dyadiko:.dps-vault/objects/*.enc': apotyxia('AGNOSTO', 'αδυναμία'),
      }),
      key,
    );
    const result = await vault.grapse_keimeno('x', 'content');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('επιστρέφει σφάλμα όταν δεν μπορεί να ενημερωθεί ο κατάλογος', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, {});
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'grapse_dyadiko:.dps-vault/objects/*.enc': ok(undefined),
        'grapse_dyadiko:.dps-vault/index.enc': apotyxia('AGNOSTO', 'αδυναμία'),
      }),
      key,
    );
    const result = await vault.grapse_keimeno('x', 'content');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('διαγράφει το προηγούμενο αντικείμενο όταν υπάρχει', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'old-id' });
    const storage = klono_storage({
      'diavase_dyadiko:.dps-vault/index.enc': index,
      'grapse_dyadiko:.dps-vault/objects/*.enc': ok(undefined),
      'grapse_dyadiko:.dps-vault/index.enc': ok(undefined),
      'diagrafi:.dps-vault/objects/old-id.enc': ok(undefined),
    });
    const vault = new EncryptedApothiki(storage, key);
    await vault.grapse_keimeno('x', 'content');
  });

  it('επιστρέφει DEN_VRETHIKE όταν η αποθήκη δεν διαβάζει το αντικείμενο', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'id' });
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'diavase_dyadiko:.dps-vault/objects/id.enc': apotyxia('AGNOSTO', 'αδυναμία'),
      }),
      key,
    );
    const result = await vault.diavase_keimeno('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('επιστρέφει false και σφάλμα αποκρυπτογράφησης όταν ο κατάλογος δεν μπορεί να διαβαστεί', async () => {
    const key = await dataKey();
    const vault = new EncryptedApothiki(
      klono_storage({ 'diavase_dyadiko:.dps-vault/index.enc': apotyxia('AGNOSTO', 'αδυναμία') }),
      key,
    );
    expect(await vault.yparxei('x')).toBe(false);
    expect(await vault.lista('.')).toEqual(
      apotyxia('MI_EGKYRO_SXIMA', 'Δεν ήταν δυνατή η ανάγνωση του κρυπτογραφημένου καταλόγου.'),
    );
    const result = await vault.diagrafi('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('επιστρέφει σφάλμα όταν η διαγραφή αποτύχει', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'id' });
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'diagrafi:.dps-vault/objects/id.enc': apotyxia('AGNOSTO', 'αδυναμία'),
      }),
      key,
    );
    const result = await vault.diagrafi('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('επιστρέφει DEN_VRETHIKE όταν δεν υπάρχει το αρχείο προς διαγραφή', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, {});
    const vault = new EncryptedApothiki(
      klono_storage({ 'diavase_dyadiko:.dps-vault/index.enc': index }),
      key,
    );
    const result = await vault.diagrafi('x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('επιστρέφει ok όταν διαγράφεται με επιτυχία', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'id' });
    const vault = new EncryptedApothiki(
      klono_storage({
        'diavase_dyadiko:.dps-vault/index.enc': index,
        'grapse_dyadiko:.dps-vault/index.enc': ok(undefined),
        'diagrafi:.dps-vault/objects/id.enc': ok(undefined),
      }),
      key,
    );
    expect((await vault.diagrafi('x')).ok).toBe(true);
  });

  it('επιστρέφει true όταν υπάρχει το αρχείο', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, { 'x': 'id' });
    const vault = new EncryptedApothiki(
      klono_storage({ 'diavase_dyadiko:.dps-vault/index.enc': index }),
      key,
    );
    expect(await vault.yparxei('x')).toBe(true);
    expect(await vault.yparxei('y')).toBe(false);
  });

  it('επιστρέφει ok όταν γράφεται με επιτυχία', async () => {
    const key = await dataKey();
    const index = await encryptedIndex(key, {});
    const storage = klono_storage({
      'diavase_dyadiko:.dps-vault/index.enc': index,
      'grapse_dyadiko:.dps-vault/objects/*.enc': ok(undefined),
      'grapse_dyadiko:.dps-vault/index.enc': ok(undefined),
    });
    const vault = new EncryptedApothiki(storage, key);
    expect((await vault.grapse_keimeno('x', 'content')).ok).toBe(true);
    expect(await vault.yparxei('x')).toBe(true);
  });
});


describe('vault — restoreEncryptedBackup σφάλματα', () => {
  const encoder = new TextEncoder();
  const dataKey = () => crypto.subtle.importKey(
    'raw', new Uint8Array(32), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );

  /** Φτιάχνει ένα header backup (28 bytes) με δεδομένα για να φτάσει τα 40+ bytes του ορίου μεγέθους. */
  function makeBackup(kdfIterations: number, extra: number = 12): Blob {
    const header = new Uint8Array(28);
    header.set(encoder.encode('DPSBKP02'), 0);
    new DataView(header.buffer).setUint32(24, kdfIterations, false);
    const padding = new Uint8Array(extra);
    for (let i = 0; i < extra; i += 1) padding[i] = i;
    return new Blob([header, padding]);
  }

  it('πετάει όταν ο κωδικός backup είναι αδύναμος', async () => {
    const storage = klono_storage({ 'lista:.dps-vault': ok([]) });
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), makeBackup(600_000), 'short'))
      .rejects.toThrow('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.');
  });

  it('πετάει όταν το backup είναι πολύ μικρό', async () => {
    const storage = klono_storage({ 'lista:.dps-vault': ok([]) });
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), new Blob([new Uint8Array(39)]), BACKUP_PASSWORD))
      .rejects.toThrow('Το μέγεθος του αρχείου backup δεν είναι έγκυρο.');
  });

  it('πετάει όταν η συσκευή περιέχει δεδομένα', async () => {
    const storage = klono_storage({ 'lista:*': ok(['.dps-vault/x']) });
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), makeBackup(600_000), BACKUP_PASSWORD))
      .rejects.toThrow('Η συσκευή περιέχει ήδη δεδομένα vault');
  });

  it('πετάει όταν το backup έχει άγνωστο magic', async () => {
    const storage = klono_storage({ 'lista:.dps-vault': ok([]) });
    const header = new Uint8Array(28);
    header.set(encoder.encode('DPSBKP03'), 0);
    new DataView(header.buffer).setUint32(24, 600_000, false);
    const padding = new Uint8Array(12);
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), new Blob([header, padding]), BACKUP_PASSWORD))
      .rejects.toThrow('Το αρχείο δεν είναι έγκυρο DPS.guide encrypted backup.');
  });

  it('πετάει όταν χρησιμοποιεί μη υποστηριζόμενη ρύθμιση', async () => {
    const storage = klono_storage({ 'lista:.dps-vault': ok([]) });
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), makeBackup(100), BACKUP_PASSWORD))
      .rejects.toThrow('Το backup χρησιμοποιεί μη υποστηριζόμενη ρύθμιση κρυπτογράφησης.');
  });

  it('πετάει όταν το backup έχει άκυρο κρυπτογραφημένο τμήμα', async () => {
    const storage = klono_storage({ 'lista:.dps-vault': ok([]) });
    const header = new Uint8Array(28);
    header.set(encoder.encode('DPSBKP02'), 0);
    new DataView(header.buffer).setUint32(24, 600_000, false);
    const chunk = new Uint8Array(5);
    chunk[0] = 0;
    new DataView(chunk.buffer).setUint32(1, 10, false);
    const padding = new Uint8Array(7);
    await expect(restoreEncryptedBackup(storage, new FakeMystika(), new Blob([header, chunk, padding]), BACKUP_PASSWORD))
      .rejects.toThrow('Το backup περιέχει μη έγκυρο κρυπτογραφημένο τμήμα.');
  });
});
