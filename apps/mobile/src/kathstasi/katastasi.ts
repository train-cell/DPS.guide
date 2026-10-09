import type { Apotelesma, Sfalma } from '@dps/core';

/** Τετράκωδη κατάσταση UI: φόρτωση, κενό, σφάλμα ή έτοιμα δεδομένα. */
export type Katastasi<T> =
  | { readonly katastasi: 'fortosi' }
  | { readonly katastasi: 'adeio' }
  | { readonly katastasi: 'sfalma'; readonly sfalma: Sfalma }
  | { readonly katastasi: 'etimo'; readonly dedomena: T };

/** Δημιουργεί κατάσταση φόρτωσης χωρίς κανένα δεδομένο. */
export function fortosi<T = never>(): Katastasi<T> {
  return { katastasi: 'fortosi' };
}

/** Δημιουργεί κατάσταση κενού αποτελέσματος χωρίς σφάλμα. */
export function adeio<T = never>(): Katastasi<T> {
  return { katastasi: 'adeio' };
}

/** Δημιουργεί κατάσταση σφάλματος κρατώντας αυτούσιο το Sfalma. */
export function sfalma<T = never>(s: Sfalma): Katastasi<T> {
  return { katastasi: 'sfalma', sfalma: s };
}

/** Δημιουργεί κατάσταση έτοιμων δεδομένων. */
export function etimo<T>(dedomena: T): Katastasi<T> {
  return { katastasi: 'etimo', dedomena };
}

/** Μετατρέπει ένα Apotelesma σε Katastasi περνώντας το σφάλμα αναλλοίωτο και ποτέ χωρίς ψευδή δεδομένα. */
export function apo_apotelesma<T>(
  apotelesma: Apotelesma<T>,
  einai_adeio?: (dedomena: T) => boolean
): Katastasi<T> {
  if (!apotelesma.ok) {
    return { katastasi: 'sfalma', sfalma: apotelesma.sfalma };
  }
  const dedomena = apotelesma.timi;
  if (einai_adeio !== undefined && einai_adeio(dedomena)) {
    return { katastasi: 'adeio' };
  }
  return { katastasi: 'etimo', dedomena };
}

/** Οι τέσσερις υποχρεωτικές αποδόσεις μιας κατάστασης σε οθόνη ή widget. */
export interface ParallagesKatastasis<T, R> {
  readonly fortosi: () => R;
  readonly adeio: () => R;
  readonly sfalma: (s: Sfalma) => R;
  readonly etimo: (dedomena: T) => R;
}

/** Επιστρέφει το αποτέλεσμα του μοναδικού παραλλαγή που ταιριάζει στην κατάσταση. */
export function metatropi<T, R>(k: Katastasi<T>, parallages: ParallagesKatastasis<T, R>): R {
  switch (k.katastasi) {
    case 'fortosi':
      return parallages.fortosi();
    case 'adeio':
      return parallages.adeio();
    case 'sfalma':
      return parallages.sfalma(k.sfalma);
    case 'etimo':
      return parallages.etimo(k.dedomena);
  }
}

/** Ελέγχει αν η κατάσταση είναι φόρτωση και στενεύει την ένωση. */
export function einai_fortosi<T>(k: Katastasi<T>): k is { readonly katastasi: 'fortosi' } {
  return k.katastasi === 'fortosi';
}

/** Ελέγχει αν η κατάσταση είναι κενό αποτέλεσμα και στενεύει την ένωση. */
export function einai_adeio<T>(k: Katastasi<T>): k is { readonly katastasi: 'adeio' } {
  return k.katastasi === 'adeio';
}

/** Ελέγχει αν η κατάσταση είναι σφάλμα και στενεύει την ένωση ώστε να είναι ορατό το sfalma. */
export function einai_sfalma<T>(
  k: Katastasi<T>
): k is { readonly katastasi: 'sfalma'; readonly sfalma: Sfalma } {
  return k.katastasi === 'sfalma';
}

/** Ελέγχει αν η κατάσταση έχει έτοιμα δεδομένα και στενεύει την ένωση ώστε να είναι ορατή η dedomena. */
export function einai_etimo<T>(
  k: Katastasi<T>
): k is { readonly katastasi: 'etimo'; readonly dedomena: T } {
  return k.katastasi === 'etimo';
}

/** Επιστρέφει τα δεδομένα μόνο όταν η κατάσταση είναι έτοιμη, αλλιώς undefined. */
export function xoris_katastasi<T>(k: Katastasi<T>): T | undefined {
  return einai_etimo(k) ? k.dedomena : undefined;
}

/** Οι επιτρεπτές καταστάσεις κάθε οθόνης και widget, σε σταθερή σειρά απόδοσης. */
export const EPITREPOMENES_KATASTASEIS = Object.freeze([
  'fortosi',
  'adeio',
  'sfalma',
  'etimo',
] as const);

/** Κωδικός κατάστασης που προκύπτει από τη λίστα των επιτρεπτών καταστάσεων. */
export type KodikosKatastasis = (typeof EPITREPOMENES_KATASTASEIS)[number];
