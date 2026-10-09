import type { Apotelesma } from '@dps/core';
import { ok, apotyxia } from '@dps/core';

const APAGOREYMENOI_XARAKTIRES = /[:*?"<>|\\]/g;

/** Κανόνες §5.3: NFC, απαγόρευση segment `..`, καθαρισμός απαγορευμένων χαρακτήρων.
 *  Ενιαίος separator το `/`· ό,τι αλλο (Windows backslash κλπ) είναι παράνομος χαρακτήρας ονόματος. */
export function karnikopoise_diadromi(diadromi: string): Apotelesma<string> {
  if (diadromi.trim() === '') {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή είναι κενή');
  }

  const nfc = diadromi.normalize('NFC');

  const tmimata = nfc
    .split('/')
    .filter((tmima) => tmima !== '' && tmima !== '.')
    .map((tmima) => tmima.replace(APAGOREYMENOI_XARAKTIRES, '_'));

  if (tmimata.some((tmima) => tmima === '..')) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαγορεύεται το .. στη διαδρομή');
  }

  if (tmimata.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή δεν περιέχει όνομα αρχείου');
  }

  return ok(tmimata.join('/'));
}
