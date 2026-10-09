import type { KleidiMystikou, MystikaPyli, Sfalma } from '@dps/core';
import { PerivallonMystika } from './perivallon-mystika.js';
import { phortose_keyring } from './keyring.js';

/** Όνομα υπηρεσίας στο Windows Credential Manager. */
const ONOMA_YPIRESIAS = 'DPS.guide';

function sfalma_mi_diathesimo(k: KleidiMystikou, praksi: string): Sfalma {
  return {
    kodikos: 'MI_YPOSTIRIZOMENO',
    minima: `Η πράξη «${praksi}» δεν υποστηρίζεται για το μυστικό: ${k} (το keyring δεν είναι διαθέσιμο και το περιβάλλον είναι μόνο για ανάγνωση)`,
  };
}

/**
 * MystikaPyli με πρωτεύον backend το Windows Credential Manager
 * (`@napi-rs/keyring`) και εφεδρικό (fallback) τις μεταβλητές περιβάλλοντος.
 *
 * Ροή κάθε λειτουργίας:
 * - `pare`: keyring πρώτα· σε οποιαδήποτε αποτυχία (module απών / κλειδωμένο
 *   store / σφάλμα CRT) πέφτει στο PerivallonMystika· αν ούτε εκεί υπάρχει,
 *   επιστρέφει null (ΔΕΝ πετάει ποτέ).
 * - `vale`: keyring πρώτα· σε αποτυχία πετάει Sfalma (το env είναι read-only).
 * - `svise`: keyring πρώτα· αν το keyring λείπει είναι τεκμηριωμένο no-op.
 *
 * Κανένα μυστικό δεν εμφανίζεται σε μηνύματα σφαλμάτων — μόνο το κλειδί.
 */
export class KeyringMystika implements MystikaPyli {
  private readonly perivallon = new PerivallonMystika();

  async pare(k: KleidiMystikou): Promise<string | null> {
    try {
      const fortoma = await phortose_keyring();
      if (fortoma) {
        const eggrafi = fortoma(ONOMA_YPIRESIAS, k);
        return await eggrafi.getPassword();
      }
    } catch {
      // πέφτουμε στο περιβάλλον — το μυστικό δεν αποκαλύπτεται στο σφάλμα
    }
    return this.perivallon.pare(k);
  }

  async vale(k: KleidiMystikou, timi: string): Promise<void> {
    try {
      const fortoma = await phortose_keyring();
      if (fortoma) {
        const eggrafi = fortoma(ONOMA_YPIRESIAS, k);
        await eggrafi.setPassword(timi);
        return;
      }
    } catch {
      // πέφτουμε στο περιβάλλον — το οποίο είναι αναγνώσιμο μόνο
    }
    throw { sfalma: sfalma_mi_diathesimo(k, 'αποθήκευση') };
  }

  async svise(k: KleidiMystikou): Promise<void> {
    try {
      const fortoma = await phortose_keyring();
      if (fortoma) {
        const eggrafi = fortoma(ONOMA_YPIRESIAS, k);
        await eggrafi.deleteCredential();
        return;
      }
    } catch {
      // no-op: αν το keyring δεν είναι διαθέσιμο δεν υπάρχει τι να σβηστεί
    }
  }
}
