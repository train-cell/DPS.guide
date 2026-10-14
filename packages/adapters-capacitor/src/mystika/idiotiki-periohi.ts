/** `MystikaPyli` πάνω σε `@aparajita/capacitor-secure-storage` (iOS Keychain /
 *  Android EncryptedSharedPreferences+Keystore).
 *
 *  MIRROR του `KeyringMystika`:
 *  - `pare`: keyring πρώτα· σε οποιαδήποτε αποτυχία επιστρέφει null (ΔΕΝ πετάει ποτέ).
 *  - `vale`: σε αποτυχία πετάει `{ sfalma }` με `MI_YPOSTIRIZOMENO`.
 *  - `svise`: απόν κλειδί = τεκμηριωμένο no-op.
 *
 *  VERIFIED API (`@aparajita/capacitor-secure-storage@8.0.1`):
 *  - named export `SecureStorage` (default proxy instance)
 *  - `get(key)` → `Promise<DataType | null>` (verified: null για απόν)
 *  - `set(key, data)` → `Promise<void>`
 *  - `remove(key)` → `Promise<boolean>` (true αν σβήστηκε)
 *  - `StorageError` extends Error — δεν διαρρέει ποτέ η τιμή.
 *
 *  Κανένα μυστικό δεν εμφανίζεται σε μηνύματα σφαλμάτων — μόνο το κλειδί. */

import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import type { KleidiMystikou, MystikaPyli, Sfalma } from '@dps/core';

const DEVICE_SECRET_KEYS: readonly KleidiMystikou[] = [
  'eclass_onoma_xristi',
  'eclass_kodikos',
  'eclass_panepistimio_id',
  'eclass_base_url',
  'moodle_webservice_token',
  'llm_api_key',
  'vault_biometric_unlock',
];

function sfalma_mi_diathesimo(k: KleidiMystikou, praksi: string): Sfalma {
  return {
    kodikos: 'MI_YPOSTIRIZOMENO',
    minima: `Η πράξη «${praksi}» δεν υποστηρίζεται για το μυστικό: ${k} (αποτυχία του secure storage της συσκευής)`,
  };
}

export class CapacitorMystikaPyli implements MystikaPyli {
  private initialization: Promise<void> | null = null;

  private ensureInitialized(): Promise<void> {
    this.initialization ??= this.initializeDeviceOnlyKeychain();
    return this.initialization;
  }

  private async initializeDeviceOnlyKeychain(): Promise<void> {
    if (Capacitor.getPlatform() !== 'ios') return;
    await SecureStorage.setSynchronize(false);
    await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
    for (const key of DEVICE_SECRET_KEYS) {
      const value = await SecureStorage.get(key, false, false);
      if (typeof value === 'string') {
        await SecureStorage.set(
          key,
          value,
          false,
          false,
          KeychainAccess.whenUnlockedThisDeviceOnly,
        );
      }
    }
  }

  async pare(k: KleidiMystikou): Promise<string | null> {
    try {
      await this.ensureInitialized();
      const timi = await SecureStorage.get(k, false, false);
      return typeof timi === 'string' ? timi : null;
    } catch {
      // λείπει/κλειδωμένο storage → null, ποτέ throw, ποτέ μυστικό στο σφάλμα
      return null;
    }
  }

  async vale(k: KleidiMystikou, timi: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await SecureStorage.set(
        k,
        timi,
        false,
        false,
        KeychainAccess.whenUnlockedThisDeviceOnly,
      );
    } catch {
      throw { sfalma: sfalma_mi_diathesimo(k, 'αποθήκευση') };
    }
  }

  async svise(k: KleidiMystikou): Promise<void> {
    try {
      await this.ensureInitialized();
      await SecureStorage.remove(k, false);
    } catch {
      // no-op: αν δεν είναι διαθέσιμο/απόν, δεν υπάρχει τι να σβηστεί
    }
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_mystika_pyli(): CapacitorMystikaPyli {
  return new CapacitorMystikaPyli();
}
