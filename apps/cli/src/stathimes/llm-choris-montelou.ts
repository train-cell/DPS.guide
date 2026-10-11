import type { Apotelesma, LlmPyli } from '@dps/core';
import { apotyxia } from '@dps/core';

/** Τιμή του πεδίου `montelo` όταν δεν έχει οριστεί μοντέλο — ρητή, όχι ψεύτικη. */
export const MONTELO_ME_ORISMENO = '(δεν έχει οριστεί μοντέλο)';

/**
 * `LlmPyli` που δεν μπορεί να παράγει τίποτα, γιατί δεν έχει οριστεί μοντέλο.
 *
 * Χρησιμοποιείται ΜΟΝΟ από εντολές που δεν χρειάζονται LLM (`mathimata`,
 * `sygxronismos`, `programma`). Αν κάποτε ζητηθεί παραγωγή, επιστρέφεται σφάλμα —
 * ποτέ ψεύτικη επιτυχία και ποτέ κρυφό default μοντέλο (§7.2, §3.9).
 */
export class MiOrismenoMonteloLlmPyli implements LlmPyli {
  readonly montelo: string = MONTELO_ME_ORISMENO;

  private apotyxia_klis<T>(): Apotelesma<T> {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Δεν έχει οριστεί μοντέλο LLM για αυτή την εντολή: δώσε --montelo <ονομα> ' +
        'ή βάλε το πεδίο "montelo" στο <riza>/rythmiseis.json'
    );
  }

  parage_json<T>(): Promise<Apotelesma<T>> {
    return Promise.resolve(this.apotyxia_klis<T>());
  }

  parage_keimeno(): Promise<Apotelesma<string>> {
    return Promise.resolve(this.apotyxia_klis<string>());
  }
}
