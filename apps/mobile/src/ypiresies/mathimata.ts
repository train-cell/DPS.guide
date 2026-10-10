import type { ApothikiPyli, Mathima } from '@dps/core';
import { adeio, etimo, sfalma, type Katastasi } from '../kathstasi/index.js';

/** Διαδρομή της λίστας μαθημάτων στη ρίζα του layout §5.3. */
export const DIADROMI_MATHIMATON = 'mathimata.json';

/**
 * Φορτώνει τη λίστα μαθημάτων από τα αρχεία του §5.3. Χωρίς αρχείο (πριν τον πρώτο
 * συγχρονισμό) επιστρέφει κενή κατάσταση, ποτέ ψεύτικη λίστα.
 */
export async function fortose_mathimata_apo_apothiki(
  apothiki: ApothikiPyli
): Promise<Katastasi<readonly Mathima[]>> {
  const diavase = await apothiki.diavase_keimeno(DIADROMI_MATHIMATON);
  if (!diavase.ok) {
    return adeio<readonly Mathima[]>();
  }
  let mathimata: unknown;
  try {
    mathimata = JSON.parse(diavase.timi);
  } catch {
    return sfalma<readonly Mathima[]>({
      kodikos: 'MI_EGKYRO_SXIMA',
      minima: 'Η λίστα μαθημάτων δεν είναι έγκυρο JSON.',
    });
  }
  if (!Array.isArray(mathimata)) {
    return sfalma<readonly Mathima[]>({
      kodikos: 'MI_EGKYRO_SXIMA',
      minima: 'Η λίστα μαθημάτων δεν είναι λίστα.',
    });
  }
  const kathara = mathimata as Mathima[];
  if (kathara.length === 0) {
    return adeio<readonly Mathima[]>();
  }
  return etimo<readonly Mathima[]>(kathara);
}
