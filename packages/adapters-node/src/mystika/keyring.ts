/**
 * Wrapper για το Windows Credential Manager μέσω `@napi-rs/keyring`.
 *
 * Το dependency ΔΕΝ είναι εγκατεστημένο (request docs/requests/E-L10-01 —
 * προς έγκριση), οπότε το `@napi-rs/keyring` φορτώνεται ΔΥΝΑΜΙΚΑ. Η αποτυχία
 * φόρτωσης (module απών / αποτυγχάνει η φόρτωση) μετατρέπεται σε σήμα «μη
 * διαθέσιμο» (null), ώστε ο καλώντας (KeyringMystika) να πέφτει ομαλά στο
 * PerivallonMystika.
 *
 * Zero-guessing: το package λείπει από τα node_modules, συνεπώς η ύπαρξη και η
 * δομή του export `Entry` ελέγχονται ΔΟΜΙΚΑ κατά το φορτίο και θα
 * επιβεβαιωθούν στο πρώτο run με εγκατεστημένο dependency. Μόνο τα ονόματα
 * μεθόδων (`getPassword`/`setPassword`/`deleteCredential`) βασίζονται στο
 * εγκεκριμένο API v2.1.0 της κάρτας L11.
 */

/** Εμφάνιση ενός entry του keyring που μας ενδιαφέρει. */
interface KeyringEntry {
  getPassword(): Promise<string | null>;
  setPassword(timi: string): Promise<void>;
  deleteCredential(): Promise<boolean>;
}

/** Δημιουργεί entry για (υπηρεσία, κλειδί). */
export type KeyringFortoma = (service: string, onoma: string) => KeyringEntry;

let forti_gia_elegxo: KeyringFortoma | null = null;

/**
 * Το όνομα του module κρατιέται σε μεταβλητή ώστε ο TS να μην το ψάξει στα
 * type declarations: το `@napi-rs/keyring` δεν είναι εγκατεστημένο (request
 * docs/requests/E-L10-01) και ο έλεγχος της ύπαρξης/δομής του γίνεται σε
 * runtime χωρίς @ts-expect-error.
 */
const ONOMA_MODULOU = '@napi-rs/keyring';

/**
 * Δομικός έλεγχος του φορτωμένου namespace (zero-guessing για τα ονόματα):
 * πρέπει να περιέχει constructor `Entry` με τις μεθόδους του API v2.
 */
function epivevaiose_keyring(modula: unknown): KeyringFortoma {
  if (typeof modula === 'object' && modula !== null && 'Entry' in modula) {
    const grammi = (modula as { Entry: unknown }).Entry;
    if (typeof grammi === 'function') {
      const Kataskevastis = grammi as new (
        service: string,
        onoma: string
      ) => KeyringEntry;
      return (service: string, onoma: string) => {
        const eggrafi = new Kataskevastis(service, onoma);
        if (
          typeof eggrafi.getPassword !== 'function' ||
          typeof eggrafi.setPassword !== 'function' ||
          typeof eggrafi.deleteCredential !== 'function'
        ) {
          throw new Error('Μη αναμενόμενη διεπαφή Entry στο @napi-rs/keyring');
        }
        return eggrafi;
      };
    }
  }
  throw new Error('Μη αναμενόμενη δομή module @napi-rs/keyring');
}

/**
 * Φορτώνει το keyring · null = μη διαθέσιμο (module απών ή αναπάντεχη δομή).
 * Το Node κρατά cache του module, οπότε επαναλαμβανόμενες κλήσεις είναι φτηνές.
 */
export async function phortose_keyring(): Promise<KeyringFortoma | null> {
  if (forti_gia_elegxo) {
    return forti_gia_elegxo;
  }
  let modula: unknown;
  try {
    modula = await import(ONOMA_MODULOU);
  } catch {
    return null;
  }
  try {
    return epivevaiose_keyring(modula);
  } catch {
    return null;
  }
}

/** Δοκιμαστικό hook: inject/καθάρισμα της φόρτωσης του keyring. */
export function orise_keyring_gia_elegxo(fortoma: KeyringFortoma | null): void {
  forti_gia_elegxo = fortoma;
}
