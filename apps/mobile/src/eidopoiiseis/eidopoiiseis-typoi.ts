/**
 * Τύποι της οθόνης ρυθμίσεων ειδοποιήσεων (κάρτα P3).
 *
 * D7: ΜΟΝΟ τοπικές ειδοποιήσεις. Η οθόνη δεν ξέρει τίποτα για το plugin· μιλάει μόνο
 * με τη δομική πύλα `EidopoiisiYpiresies`, ώστε να μπορεί να δοκιμαστεί χωρίς συσκευή
 * και χωρίς δίκτυο. Η σύνδεση με το πραγματικό plugin των ειδοποιήσεων γίνεται στο
 * bootstrap της εφαρμογής (δες `docs/requests/G-01.md`).
 *
 * Η πύλα επιστρέφει το ΑΠΟΤΕΛΕΣΜΑ του `@dps/core` (`Apotelesma`), ώστε η οθόνη να
 * μιλάει την ίδια γλώσσα με τις υπόλοιπες (οδηγός §3.9: ΠΟΤΕ ψευδή δεδομένα).
 */

import type { Apotelesma } from '@dps/core';

/** Κατάσταση άδειας εμφάνισης, όπως τη δίνει το plugin (`PermissionState`). */
export type KatastasiAdieas = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

/** Μία προγραμματισμένη υπενθύμιση, όπως τη δίνει η πύλα. */
export interface EidopoiisiProgrammatismeni {
  readonly kleidiEnotitas: string;
  readonly titlos: string;
  readonly soma: string;
  readonly otan: Date | null;
  readonly id: number;
}

/** Η δομική πύλα της οθόνης — πρόσοψη πάνω στον `CapacitorEidopoiiseis` του adapter. */
export interface EidopoiisiYpiresies {
  /** Ελέγχει την άδεια χωρίς να ρωτήσει τον χρήστη. */
  zitise_adia(): Promise<Apotelesma<KatastasiAdieas>>;
  /** Ζητά άδεια από τον χρήστη (μόνο από κόμβο). */
  zitisi_adias(): Promise<Apotelesma<KatastasiAdieas>>;
  /** Προγραμματίζει μία δοκιμαστική υπενθύμιση. */
  programmatise_dokimi(
    otn: Date,
    leptaProeidopoisis: number
  ): Promise<Apotelesma<EidopoiisiProgrammatismeni>>;
  /** Ακυρώνει όλες τις εκκρεμείς υπενθυμίσεις. */
  akiro_ol(): Promise<Apotelesma<void>>;
  /** Οι εκκρεμείς υπενθυμίσεις. */
  lista(): Promise<Apotelesma<EidopoiisiProgrammatismeni[]>>;
}

/** Οι ρυθμίσεις που η οθόνη διαχειρίζεται. */
export interface RytheseisEidopoiseon {
  /** Αν είναι ενεργοποιημένες οι τοπικές ειδοποιήσεις. */
  readonly einaiEnergies: boolean;
  /** Πόσα λεπτά πριν την έναρξη της ενότητας θέλει υπενθύμιση ο χρήστης. */
  readonly leptaProeidopoisis: number;
}

/** Η επιτρεπόμενη λίστα λεπτών προειδοποίησης που προσφέρει η οθόνη. */
export const LEPTES_PROEIDOPOISIS: readonly number[] = [15, 30, 60, 120, 1440] as const;

/** Προσωρινές ρυθμίσεις όσο δεν υπάρχουν αποθηκευμένες — τιμές παραδείγματος, όχι hardcoded μέσα στην οθόνη. */
export function proedapes_eidopoiseis(): RytheseisEidopoiseon {
  return { einaiEnergies: false, leptaProeidopoisis: 30 };
}