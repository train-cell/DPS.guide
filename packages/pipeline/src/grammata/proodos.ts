/**
 * Γεγονότα προόδου της ορχήστρωσης (κάρτα I1: «Events `ProodosEvent`»).
 *
 * Η ορχήστρωση ΔΕΝ κρατάει κατάσταση στη μνήμη: όλη η κατάσταση είναι τα αρχεία
 * του §5.3. Το `ProodosEvent` είναι η μόνη «ρύθμιση» εξόδου: μια συνάρτηση
 * επιστροφής που δίνεται από τον καλούντα (CLI/UI) και επιτρέπει στην οθόνη να
 * δείξει πρόοδο χωρίς η ροή να γνωρίζει UI.
 */

import type { Apotelesma } from '@dps/core';

/** Γεγονός προόδου ενός βήματος ή μιας σύνθετης ροής. */
export interface ProodosEvent {
  /** Το βήμα §4 που εκτελείται (π.χ. `exagogi`, `perigramma`). */
  readonly vhima: string;
  /** Πλήθος στοιχείων που επεξεργάζεται το βήμα (αρχεία, ενότητες). */
  readonly synolo: number;
  /** Πόσα στοιχεία ολοκληρώθηκαν. */
  readonly olokliromena: number;
  /** Ελεύθερο μήνυμα για τον άνθρωπο (Ελληνικά, χωρίς μυστικά). */
  readonly minima: string;
  /** `false` όταν το βήμα ολοκληρώθηκε με σφάλμα. */
  readonly oloklirothike: boolean;
}

/** Τύπος επιστροφής για την ενημέρωση προόδου. */
export type IparastypotisProodou = (gegonos: ProodosEvent) => void;

/**
 * Επιστρέφει μια αναφορά προόδου που τροφοδοτεί τον καλούντα και παράλληλα
 * γράφει στο `KatagrafiPyli`, ώστε η ίδια πληροφορία να φαίνεται και στα logs.
 * Χωρίς καλούντα (`undefined`) είναι no-op — η ροή δεν απαιτεί παρατηρητή.
 */
export function proodos(
  p: { katagrafi: { pliroforia(m: string, d?: Record<string, unknown>): void; sfalma(m: string, d?: Record<string, unknown>): void } },
  parastypotis: IparastypotisProodou | undefined,
  vhima: string,
  synolo: number
): (olokliromena: number, minima: string, oloklirothike?: boolean) => void {
  return (olokliromena, minima, oloklirothike = true) => {
    const gegonos: ProodosEvent = { vhima, synolo, olokliromena, minima, oloklirothike };
    if (oloklirothike) {
      p.katagrafi.pliroforia(`${vhima}: ${minima}`, { olokliromena, synolo });
    } else {
      p.katagrafi.sfalma(`${vhima}: ${minima}`, { olokliromena, synolo });
    }
    if (parastypotis !== undefined) {
      parastypotis(gegonos);
    }
  };
}

/** Μετατρέπει ένα `Apotelesma` σε μηνύμαμα προόδου χωρίς να χάσει τον κωδικό σφάλματος. */
export function minima_sfalmatos(apotelesma: Apotelesma<unknown>): string {
  return apotelesma.ok ? 'ολοκληρώθηκε' : `${apotelesma.sfalma.kodikos}: ${apotelesma.sfalma.minima}`;
}