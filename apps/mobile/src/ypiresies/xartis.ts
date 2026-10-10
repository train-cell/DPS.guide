import type { ApothikiPyli } from '@dps/core';
import type { XartisMathimatos } from '@dps/core';
import { adeio, etimo, sfalma, type Katastasi } from '../kathstasi/index.js';

/** Διαδρομή του χάρτη ενοτήτων ενός μαθήματος στο layout §5.3. */
export function diadromi_xarti(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/.spoudes/xartis.json`;
}

/** Διαβάζει ένα JSON από τη θύρα αποθήκευσης· η απουσία αρχείου δεν είναι σφάλμα. */
async function diavase_json<T>(
  apothiki: ApothikiPyli,
  diadromi: string
): Promise<{ ok: true; timi: T } | { ok: false; kodikos: 'DEN_VRETHIKE' } | { ok: false; kodikos: 'MI_EGKYRO_SXIMA' }> {
  const diavase = await apothiki.diavase_keimeno(diadromi);
  if (!diavase.ok) {
    return { ok: false, kodikos: 'DEN_VRETHIKE' };
  }
  try {
    return { ok: true, timi: JSON.parse(diavase.timi) as T };
  } catch {
    return { ok: false, kodikos: 'MI_EGKYRO_SXIMA' };
  }
}

/**
 * Φορτώνει τον χάρτη ενοτήτων ενός μαθήματος από τα αρχεία του §5.3. Χωρίς χάρτη
 * (μάθημα χωρίς ανάλυση) επιστρέφει κενή κατάσταση, ποτέ ψεύτικες ενότητες.
 */
export async function fortose_xartis_apo_apothiki(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string
): Promise<Katastasi<XartisMathimatos>> {
  const diavase = await diavase_json<XartisMathimatos>(
    apothiki,
    diadromi_xarti(kodikos_mathimatos)
  );
  if (!diavase.ok) {
    if (diavase.kodikos === 'MI_EGKYRO_SXIMA') {
      return sfalma<XartisMathimatos>({
        kodikos: 'MI_EGKYRO_SXIMA',
        minima: 'Ο χάρτης του μαθήματος δεν είναι έγκυρο JSON.',
      });
    }
    return adeio<XartisMathimatos>();
  }
  if (diavase.timi.enotites.length === 0) {
    return adeio<XartisMathimatos>();
  }
  return etimo(diavase.timi);
}
