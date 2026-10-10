/**
 * Κοινά test suites για τα ports του πυρήνα (§5.2).
 *
 * Τα τρέχει οποιοσδήποτε adapter, ώστε η συμμόρφωση με το contract να
 * επαληθεύεται ένα για πρωτότυπο και σε κάθε υλοποίηση. Το suite είναι
 * αυτοτελές: παίρνει την υλοποίηση ως παράμετρο, χωρίς να εξαρτάται από
 * τον τρόπο δημιουργίας της.
 */

import { expect } from 'vitest';
import type { Apotelesma } from '../contracts/apotelesma.js';
import type { ApothikiPyli } from '../contracts/pyles.js';

/** Βοηθός: περιμένει επιτυχία και επιστρέφει την τιμή, αλλιώς αποτυγχάνει. */
export function tora<T>(a: Apotelesma<T>): T {
  if (!a.ok) {
    throw new Error(`Αναμενόταν επιτυχία, πήρα σφάλμα ${a.sfalma.kodikos}: ${a.sfalma.minima}`);
  }
  return a.timi;
}

/** Βοηθός: περιμένει συγκεκριμένο κωδικό σφάλματος. */
export function sfalma(a: Apotelesma<unknown>, kodikos: string): void {
  expect(a.ok).toBe(false);
  if (!a.ok) {
    expect(a.sfalma.kodikos).toBe(kodikos);
  }
}

/** Εκτέλεση του suite πάνω σε μια υλοποίηση `ApothikiPyli`. */
export async function apothiki_contract(apothiki: ApothikiPyli): Promise<void> {
  const diadromi = 'PLI101/vivlia/keimeno.txt';

  expect(await apothiki.yparxei(diadromi)).toBe(false);

  // Διάβασμα ανύπαρκτου → σαφές σφάλμα, ποτέ κενό δεδομένο.
  sfalma(await apothiki.diavase_keimeno(diadromi), 'DEN_VRETHIKE');
  sfalma(await apothiki.diavase_dyadiko(diadromi), 'DEN_VRETHIKE');
  sfalma(await apothiki.diagrafi(diadromi), 'DEN_VRETHIKE');

  // Εγγραφή κειμένου με ελληνικούς χαρακτήρες (round-trip UTF-8).
  const periexomeno = 'Ελληνικά με τόνους: άέήίόύώ';
  expect((await apothiki.grapse_keimeno(diadromi, periexomeno)).ok).toBe(true);
  expect(await apothiki.yparxei(diadromi)).toBe(true);
  expect(tora(await apothiki.diavase_keimeno(diadromi))).toBe(periexomeno);

  // Εγγραφή δυαδικού δεδομένου με αντιγραφή, όχι αναφορά.
  const arxika = new Uint8Array([1, 2, 3, 255]);
  expect((await apothiki.grapse_dyadiko(diadromi, arxika)).ok).toBe(true);
  const anagnoristiko = tora(await apothiki.diavase_dyadiko(diadromi));
  expect(Array.from(anagnoristiko)).toEqual([1, 2, 3, 255]);
  arxika[0] = 9;
  expect(tora(await apothiki.diavase_dyadiko(diadromi))[0]).toBe(1);

  // Υπο-φάκελοι: το listing επιστρέφει πλήρεις διαδρομές.
  await apothiki.grapse_keimeno('PLI101/vivlia/enotita1/themata.txt', 'θέματα');
  const lista = tora(await apothiki.lista('PLI101/vivlia'));
  expect(lista.sort()).toEqual([
    'PLI101/vivlia/enotita1/themata.txt',
    'PLI101/vivlia/keimeno.txt',
  ]);
  // Η τελική κάθετος στο φάκελο δεν αλλάζει το αποτέλεσμα.
  const lista_kaveti = tora(await apothiki.lista('PLI101/vivlia/'));
  expect(lista_kaveti.sort()).toEqual([
    'PLI101/vivlia/enotita1/themata.txt',
    'PLI101/vivlia/keimeno.txt',
  ]);

  // Διαγραφή.
  expect((await apothiki.diagrafi(diadromi)).ok).toBe(true);
  expect(await apothiki.yparxei(diadromi)).toBe(false);
  sfalma(await apothiki.diavase_keimeno(diadromi), 'DEN_VRETHIKE');
}

/** Εκτέλεση του suite πάνω σε μια υλοποίηση `MystikaPyli`. */
export async function mystika_contract(mystika: MystikaPyliLike): Promise<void> {
  const kleidi = 'eclass_kodikos';
  const timi = 'Μυστικό-1234';

  expect(await mystika.pare(kleidi)).toBe(null);

  await mystika.vale(kleidi, timi);
  expect(await mystika.pare(kleidi)).toBe(timi);

  // Επαναγραφή υπερκαλύπτει την παλιά τιμή.
  await mystika.vale(kleidi, 'νέο');
  expect(await mystika.pare(kleidi)).toBe('νέο');

  await mystika.svise(kleidi);
  expect(await mystika.pare(kleidi)).toBe(null);

  // Διαγραφή μη υπαρκτού κλειδιού δεν πετάει.
  await expect(mystika.svise(kleidi)).resolves.toBeUndefined();

  // Ένα κλειδί δεν επηρεάζει τα άλλα.
  await mystika.vale('llm_api_key', 'key-1');
  await mystika.vale('eclass_onoma_xristi', 'user');
  expect(await mystika.pare('llm_api_key')).toBe('key-1');
  expect(await mystika.pare('eclass_onoma_xristi')).toBe('user');
  await mystika.svise('llm_api_key');
  expect(await mystika.pare('eclass_onoma_xristi')).toBe('user');
}

type MystikaPyliLike = {
  pare(k: string): Promise<string | null>;
  vale(k: string, timi: string): Promise<void>;
  svise(k: string): Promise<void>;
};
