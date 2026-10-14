import type { KleidiMystikou, MystikaPyli } from '@dps/core';

const METAVLITES_PERIVALLONTOS: Record<KleidiMystikou, string> = {
  eclass_onoma_xristi: 'ECLASS_USERNAME',
  eclass_kodikos: 'ECLASS_PASSWORD',
  eclass_panepistimio_id: 'ECLASS_PANEPISTIMIO_ID',
  eclass_base_url: 'ECLASS_BASE_URL',
  moodle_webservice_token: 'MOODLE_WEBSERVICE_TOKEN',
  llm_api_key: 'GEMINI_API_KEY',
  vault_biometric_unlock: 'DPS_VAULT_BIOMETRIC_UNLOCK',
};

/** Μετατρέπει κλειδί μυστικού σε όνομα μεταβλητής περιβάλλοντος. */
export function onoma_metavlitis(k: KleidiMystikou): string {
  return METAVLITES_PERIVALLONTOS[k];
}

/**
 * MystikaPyli πάνω σε μεταβλητές περιβάλλοντος.
 *
 * ΜΟΝΟ ανάγνωση: οι μεταβλητές περιβάλλοντος δεν γράφονται ούτε σβήνονται
 * από τη διεργασία. Χρησιμοποιείται ως fallback του KeyringMystika.
 */
export class PerivallonMystika implements MystikaPyli {
  async pare(k: KleidiMystikou): Promise<string | null> {
    const timi = process.env[onoma_metavlitis(k)];
    return timi ?? null;
  }

  async vale(k: KleidiMystikou): Promise<void> {
    throw {
      sfalma: {
        kodikos: 'MI_YPOSTIRIZOMENO',
        minima: `Αποτυχία αποθήκευσης μυστικού: ${k} (το περιβάλλον είναι μόνο για ανάγνωση)`,
      },
    };
  }

  async svise(): Promise<void> {
    // no-op: οι μεταβλητές περιβάλλοντος δεν διαγράφονται από εμάς.
  }
}
