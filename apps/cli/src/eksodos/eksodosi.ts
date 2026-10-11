import type { Sfalma } from '@dps/core';
import type { ExodosEn } from './exodos-en.js';
import { grammmes_exodou } from './exodos-en.js';

/**
 * Έξοδος του CLI, απομονωμένη από την κονσόλα.
 *
 * Οι δοκιμές την αντικαθιστούν, ώστε να μην χρειάζεται πραγματική κονσόλα και για να
 * ελέγχεται τι πηγαίνει στο stdout και τι στο stderr.
 */
export interface Eksodosi {
  /** Κανονική έξοδος (stdout). */
  grapse_grammi(grammi: string): void;
  /** Σφάλμα (stderr). */
  grapse_sfalma(sfalma: Sfalma): void;
}

/**
 * Κατασκευάζει έξοδο που γράφει σε δοσμένες ροές.
 *
 * Οι δοκιμές περνούν συλλέκτες συμβολοσειρών· η διεργασία το stdout/stderr.
 */
export function dimiourgise_eksodosi(
  graptiki: (grammi: string) => void,
  kathisteriki: (grammi: string) => void
): Eksodosi {
  return {
    grapse_grammi: graptiki,
    grapse_sfalma: (sfalma) => {
      kathisteriki(`Σφάλμα [${sfalma.kodikos}]: ${sfalma.minima}`);
    },
  };
}

/** Εγγραφή επιτυχίας: ανθρώπινα ή ως μία εγγραφή JSON, ποτέ και τα δύο. */
export function grapse_epityxies(eksodosi: Eksodosi, exodos: ExodosEn, json: boolean): void {
  if (json) {
    eksodosi.grapse_grammi(JSON.stringify({ ok: true, apotelesma: exodos }));
    return;
  }
  for (const grammi of grammmes_exodou(exodos)) {
    eksodosi.grapse_grammi(grammi);
  }
}

/** Εγγραφή σφάλματος: στο stderr, ή ως μία εγγραφή JSON με `ok: false`. */
export function grapse_apotychias(eksodosi: Eksodosi, sfalma: Sfalma, json: boolean): void {
  if (json) {
    eksodosi.grapse_grammi(JSON.stringify({ ok: false, sfalma }));
    return;
  }
  eksodosi.grapse_sfalma(sfalma);
}
