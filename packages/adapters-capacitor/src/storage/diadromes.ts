import type { Apotelesma } from '@dps/core';
import { ok, apotyxia } from '@dps/core';

const APAGOREYMENOI_XARAKTIRES = /[:*?"<>|\\]/g;

/** Δεσμευμένα ονόματα συσκευών Windows (case-insensitive, και με κατάληξη π.χ. `CON.txt`). */
const DESMEYMENA_ONAMATA_WINDOWS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

/** Τα Windows δεν επιτρέπουν τελεία ή κενό στο τέλος τμήματος διαδρομής. */
const XARAKTIRES_TELOUS_WINDOWS = /[. ]$/;

/** Ένα τμήμα που θα αποτύχει στο runtime των Windows (δεσμευμένο όνομα ή τελεία/κενό στο τέλος). */
function epikindyno_tmima(tmima: string): boolean {
  return DESMEYMENA_ONAMATA_WINDOWS.test(tmima) || XARAKTIRES_TELOUS_WINDOWS.test(tmima);
}

/** Κανόνες §5.3: NFC, απαγόρευση segment `..`, καθαρισμός απαγορευμένων χαρακτήρων.
 *  Ενιαίος separator το `/`· ό,τι αλλο (Windows backslash κλπ) είναι παράνομος χαρακτήρας ονόματος.
 *  Απορρίπτονται επίσης δεσμευμένα ονόματα Windows και τμήματα που λήγουν σε τελεία/κενό. */
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

  if (tmimata.some(epikindyno_tmima)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαγορευμένο όνομα τμήματος στη διαδρομή');
  }

  return ok(tmimata.join('/'));
}
