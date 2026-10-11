/**
 * Σύνθετες ροές (§4): `trekse_analysi` (βήματα 4–7) και `trekse_oloklirosi`.
 *
 * Καμία νέα λογική εδώ: κάθε βήμα καλείται μέσα από τη δική του συνάρτηση, ώστε να
 * παραμένει idempotent και επαναχρησιμοποιήσιμο. Τα περιγράμματα τρέχουν ΠΑΡΑΛΛΗΛΑ
 * αλλά με ανώτατο αριθμό ταυτόχρονων κλήσεων (`MEGISTES_PARALLELOI_BHMATA`, κάρτα I1).
 */

import type { Apotelesma, Mathima, XartisMathimatos } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { exagogi } from './exagogi.js';
import { megethi } from './megethi.js';
import { perigramma_mathimatos } from './perigramma.js';
import { sygxronismos } from './sygxronismos.js';
import { xartis } from './xartis.js';
import type { EisodosPipeline } from '../porte.js';
import { arxeio_xarti } from '../statheroi.js';
import { MEGISTES_PARALLELOI_BHMATA } from '../statheroi.js';
import { diavase_arxeia, diavase_xarti, grapse_json } from '../grammata/apothiki-json.js';
import { fere_episkeptes_mathimata } from '../grammata/ves.js';
import { proodos } from '../grammata/proodos.js';
import type { IparastypotisProodou } from '../grammata/proodos.js';

/** Αποτέλεσμα της `trekse_oloklirosi`. */
export interface MetritiOloklirosis {
  readonly mathimata: number;
}

/**
 * Βήματα 4–7 για ένα μάθημα: `exagogi` → `perigramma` (παράλληλα) → `xartis` → `megethi`.
 * Επιστρέφει τον ενημερωμένο χάρτη με τα `lepta_ektimisi`.
 */
export async function trekse_analysi(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<XartisMathimatos>> {
  const exagogou = await exagogi(p, kodikos_mathimatos);
  if (!exagogou.ok) {
    return exagogou;
  }

  const eurethrio = await diavase_arxeia(p.apothiki, p.riza, kodikos_mathimatos);
  if (!eurethrio.ok) {
    return eurethrio;
  }

  const arxeio_ids = eurethrio.timi
    .map((arxeio) => arxeio.id)
    .sort((a, b) => a.localeCompare(b));

  // Τα περιγράμματα τρέχουν παράλληλα, αλλά ΠΟΤΕ πάνω από
  // MEGISTES_PARALLELOI_BHMATA ταυτόχρονες κλήσεις LLM (κόστος, §7.2).
  const report = proodos(p, parastypotis, 'trekse_analysi', arxeio_ids.length);
  const apotelesmata = new Map<string, Apotelesma<XartisMathimatos> | null>();
  let epomeno = 0;
  while (epomeno < arxeio_ids.length) {
    const amma = arxeio_ids.slice(epomeno, epomeno + MEGISTES_PARALLELOI_BHMATA);
    const paralleles = await Promise.all(
      amma.map(async (arxeio_id) => ({
        arxeio_id,
        apotelesma: await perigramma_mathimatos(p, kodikos_mathimatos, arxeio_id, parastypotis),
      }))
    );
    for (const { arxeio_id, apotelesma } of paralleles) {
      apotelesmata.set(arxeio_id, apotelesma.ok ? null : apotelesma);
      epomeno += 1;
      report(epomeno, `περίγραμμα ${epomeno} από ${arxeio_ids.length}`, apotelesma.ok);
    }
  }

  for (const [arxeio_id, apotelesma] of apotelesmata) {
    if (apotelesma !== null) {
      p.katagrafi.sfalma('trekse_analysi: απέτυχε το περίγραμμα αρχείου', {
        kodikos_mathimatos,
        arxeio_id,
      });
      return apotelesma;
    }
  }

  const chartis = await xartis(p, kodikos_mathimatos, parastypotis);
  if (!chartis.ok) {
    return chartis;
  }

  return megethi(p, kodikos_mathimatos);
}

/**
 * Συγχρονισμός + ανάλυση για ΟΛΑ ΤΑ ΕΠΙΛΕΓΜΕΝΑ μαθήματα.
 *
 * ΥΠΟΓΡΑΦΗ ΣΥΜΒΑΤΗ ΠΡΟΣ ΤΑ ΠΙΣΩ: `(p)` — η λίστα διαβάζεται από το `mathimata.json`
 * (§5.3), όπως ακριβώς την βλέπει και ο χρήστης στην εφαρμογή.
 * Σταματά στο ΠΡΩΤΟ μάθημα που αποτυγχάνει: ποτέ δεν γράφει ψεύτικο
 * «ολοκληρώθηκε» για μαθήματα που δεν αναλύθηκαν.
 */
export async function trekse_oloklirosi(
  p: EisodosPipeline,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<MetritiOloklirosis>> {
  const episkeptes = await fere_episkeptes_mathimata(p);
  if (!episkeptes.ok) {
    return episkeptes;
  }
  return trekse_mathimata(p, episkeptes.timi, parastypotis);
}

/** Παραλλαγή με ρητή λίστα μαθημάτων (χρήσιμη στο CLI και στα tests). */
export async function trekse_mathimata(
  p: EisodosPipeline,
  mathimata: readonly Mathima[],
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<MetritiOloklirosis>> {
  const episkeptes = mathimata.filter((mathima) => mathima.epilegmeno);
  if (episkeptes.length === 0) {
    p.katagrafi.sfalma('trekse_oloklirosi: δεν υπάρχει επιλεγμένο μάθημα');
    return apotyxia('DEN_VRETHIKE', 'Δεν υπάρχει επιλεγμένο μάθημα');
  }

  const report = proodos(p, parastypotis, 'trekse_oloklirosi', episkeptes.length);
  let olosimena = 0;
  for (const mathima of episkeptes) {
    const sync = await sygxronismos(p, mathima.kodikos);
    if (!sync.ok) {
      report(olosimena, `απέτυχε ο συγχρονισμός του ${mathima.kodikos}`, false);
      return sync;
    }
    const analysi = await trekse_analysi(p, mathima.kodikos, parastypotis);
    if (!analysi.ok) {
      report(olosimena, `απέτυχε η ανάλυση του ${mathima.kodikos}`, false);
      return analysi;
    }
    olosimena += 1;
    report(olosimena, `ολοκληρώθηκε το μάθημα ${mathima.kodikos}`);
  }

  return ok({ mathimata: olosimena });
}

/** Επανεξαγωγή: το αρχείο του χάρτη και οι αναγνώστες του, για τους καλούντες. */
export { arxeio_xarti, diavase_xarti, grapse_json };