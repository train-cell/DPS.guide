/**
 * Κανονικοποίηση διαδρομών αρχείων κατά το §5.3.
 *
 * Οι κανόνες είναι ιδιοκτησία του frozen `@dps/core` (μέσα στο `Arxeio.diadromi`),
 * οπότε η εφαρμογή τους είναι υποχρεωτική εδώ. Δεν αντιγράφεται η συνάρτηση
 * `karnikopoise_diadromi` των adapters (L10) — εκεί είναι διαφορετική ευθύνη
 * (ασφάλεια filesystem) και το `@dps/pipeline` δεν εξαρτάται από `@dps/adapters-node`.
 *
 * §5.3: Unicode NFC · αφαίρεση `/ \ : * ? " < > |` · απαγόρευση `..`.
 */

import { apotyxia, ok } from '@dps/core';
import type { Apotelesma } from '@dps/core';

/** Χαρακτήρες που απαγορεύονται μέσα σε τμήμα διαδρομής (§5.3). */
const APAGOREYMENOI_XARAKTIRES = /[\\/:*?"<>|]/g;

/** Κανονικοποιεί μια διαδρομή eClass: NFC, χωρίς απαγορευμένους χαρακτήρες, χωρίς `..`. */
export function karnikopoiese_diadromi(diadromi: string): Apotelesma<string> {
  if (diadromi.trim() === '') {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αρχείου είναι κενή');
  }
  const tmimata = diadromi
    .normalize('NFC')
    .split('/')
    .filter((tmima) => tmima !== '' && tmima !== '.')
    .map((tmima) => tmima.replace(APAGOREYMENOI_XARAKTIRES, '_'));

  if (tmimata.some((tmima) => tmima === '..')) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαγορεύεται το «..» στη διαδρομή αρχείου');
  }
  if (tmimata.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αρχείου δεν έχει τμήματα');
  }
  return ok(tmimata.join('/'));
}

/** Η μικρή επέκταση του αρχείου, με πεζά γράμματα· κενή αν δεν υπάρχει. */
export function ektekseven_arxeio(diadromi: string): string {
  const onoma = diadromi.slice(diadromi.lastIndexOf('/') + 1);
  const telia = onoma.lastIndexOf('.');
  return telia > 0 ? onoma.slice(telia + 1).toLowerCase() : '';
}