/**
 * Καθαρές συναρτήσεις της οθόνης ειδοποιήσεων (κάρτα P3): επικύρωση, ετικέτες,
 * μηνύματα καταστάσεων. Χωρίς React και χωρίς plugin — τεστάκια καθαράς λογικής.
 */

import { LEPTES_PROEIDOPOISIS, proedapes_eidopoiseis } from './eidopoiiseis-typoi.js';
import type { KatastasiAdieas } from './eidopoiiseis-typoi.js';

/** Μήνυμα κενής λίστας (οδηγός D: ποτέ λευκή οθόνη). */
export const MINIMA_ADEIO = 'Δεν υπάρχει προγραμματισμένη υπενθύμιση αυτή τη στιγμή.';

/** Μήνυμα σφάλματος που δεν εκθέτει τίποτα ευαίσθητο — μόνο τι να κάνει ο χρήστης. */
export const MINIMA_SFALMA = 'Δεν ήταν δυνατή η επικοινωνία με τις ειδοποιήσεις.';

/**
 * Επιστρέφει τα λεπτά προειδοποίησης μόνο αν είναι επιτρεπόμενη τιμή,
 * αλλιώς την προεπιλογή — ποτέ αυθαίρετο αριθμό από το UI.
 */
export function pare_proedries(lepta: number): number {
  return LEPTES_PROEIDOPOISIS.includes(lepta) ? lepta : proedapes_eidopoiseis().leptaProeidopoisis;
}

/** Ελληνική ετικέτα λεπτών για την επιλογή. */
export function etiketa_lepton(lepta: number): string {
  if (lepta === 1440) {
    return '1 ημέρα πριν';
  }
  if (lepta >= 60) {
    const horas = lepta / 60;
    return `${horas} ώρα πριν`;
  }
  return `${lepta} λεπτά πριν`;
}

/** Κείμενο του διακόπτη ενεργοποίησης. */
export function keimeno_diakopti(einaiEnergies: boolean): string {
  return einaiEnergies ? 'Ενεργές' : 'Ανενεργές';
}

/**
 * Κείμενο κατάστασης άδειας. Το `prompt`/`prompt-with-rationale` λέγεται ρητά
 * «δεν έχει δοθεί» — ΠΟΤΕ δεν παρουσιάζεται ως ενεργή.
 */
export function keimeno_adias(adia: KatastasiAdieas): string {
  if (adia === 'granted') {
    return 'Άδεια: δοθείσα';
  }
  if (adia === 'denied') {
    return 'Άδεια: απορριφθείσα στη συσκευή';
  }
  return 'Άδεια: δεν έχει δοθεί ακόμη';
}

/** Είναι η άδεια χρησιμοποιήσιμη για προγραμματισμό; */
export function einai_chorigimeni(adia: KatastasiAdieas): boolean {
  return adia === 'granted';
}