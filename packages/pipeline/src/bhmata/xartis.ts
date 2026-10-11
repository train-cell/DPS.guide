/**
 * Βήμα 6 (§4): χάρτης μαθήματος με το prompt P2 → `xartis.json`.
 *
 * Είσοδος του P2: ΜΟΝΟ τίτλοι, εύρη σελίδων, έννοιες και τύποι τμημάτων από τα
 * περιγράμματα (ποτέ πλήρες κείμενο) — αυτό το εγγυάται ο ίδιος ο builder του
 * `prompt_xarti` (§7.1). Η επικύρωση είναι του frozen core: `epikyrose_xarti`
 * (L03) και `vres_kyklous` (L01) για την απαγόρευση κύκλων.
 */

import type { Apotelesma, Perigramma, XartisMathimatos } from '@dps/core';
import { prompt_xarti } from '@dps/ai';
import { apotyxia, epikyrose_xarti, ok, vres_kyklous } from '@dps/core';
import type { EisodosPipeline } from '../porte.js';
import { THERMOKRASIA_XARTI, arxeio_xarti, me_riza } from '../statheroi.js';
import { diavase_arxeia, grapse_json } from '../grammata/apothiki-json.js';
import type { IparastypotisProodou } from '../grammata/proodos.js';
import { proodos } from '../grammata/proodos.js';

/** Βήμα 6: χάρτης μαθήματος (LLM) + επικύρωση DAG (μηδέν κύκλοι). */
export async function xartis(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<XartisMathimatos>> {
  const eurethrio = await diavase_arxeia(p.apothiki, p.riza, kodikos_mathimatos);
  if (!eurethrio.ok) {
    p.katagrafi.sfalma('xartis: το ευρετήριο αρχείων δεν διαβάστηκε', {
      kodikos: eurethrio.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return eurethrio;
  }

  const perigrammata: Perigramma[] = [];
  for (const arxeio of eurethrio.timi) {
    const gram = await p.apothiki.diavase_keimeno(
      me_riza(p.riza, `${kodikos_mathimatos}/.spoudes/perigrammata/${arxeio.id}.json`)
    );
    if (!gram.ok) {
      continue;
    }
    perigrammata.push(JSON.parse(gram.timi) as Perigramma);
  }

  if (perigrammata.length === 0) {
    p.katagrafi.sfalma('xartis: δεν υπάρχουν περιγράμματα για τον χάρτη', { kodikos_mathimatos });
    return apotyxia(
      'DEN_VRETHIKE',
      `Δεν βρέθηκαν περιγράμματα για το μάθημα ${kodikos_mathimatos}· τρέξε πρώτα το βήμα perigramma`
    );
  }

  const report = proodos(p, parastypotis, 'xartis', 1);
  const dimiourgithike = p.rologi.tora().toISOString().slice(0, 10);
  const aitisi = prompt_xarti({ kodikos_mathimatos, perigrammata, dimiourgithike });

  const apantisi = await p.llm.parage_json({
    systima: aitisi.sistima,
    xristis: aitisi.xristis,
    sxima: aitisi.sisma,
    ekdosi_prompt: aitisi.ekdosi_prompt,
    thermokrasia: THERMOKRASIA_XARTI,
  });
  if (!apantisi.ok) {
    p.katagrafi.sfalma('xartis: το μοντέλο απέτυχε', {
      kodikos: apantisi.sfalma.kodikos,
      kodikos_mathimatos,
    });
    report(0, apantisi.sfalma.minima, false);
    return apantisi;
  }

  const epikyrommenos = epikyrose_xarti(apantisi.timi, perigrammata);
  if (!epikyrommenos.ok) {
    p.katagrafi.sfalma('xartis: ο χάρτης δεν πέρασε την επικύρωση', {
      kodikos_mathimatos,
      minima: epikyrommenos.sfalma.minima,
    });
    report(0, epikyrommenos.sfalma.minima, false);
    return epikyrommenos;
  }
  const xartis_mathimatos = epikyrommenos.timi.xartis;

  // Μηδέν κύκλος στο γράφο προαπαιτούμενων (L01): αλλιώς ο scheduler δεν τερματίζει.
  const kykloi = vres_kyklous(xartis_mathimatos.enotites);
  if (!kykloi.ok) {
    p.katagrafi.sfalma('xartis: ο γράφος προαπαιτούμενων δεν ελέγχθηκε', {
      kodikos_mathimatos,
      minima: kykloi.sfalma.minima,
    });
    report(0, kykloi.sfalma.minima, false);
    return kykloi;
  }
  if (kykloi.timi.length > 0) {
    const minima = `Ο χάρτης του μαθήματος ${kodikos_mathimatos} έχει κύκλο προαπαιτούμενων: ${kykloi.timi
      .map((k) => k.join(' → '))
      .join(' | ')}`;
    p.katagrafi.sfalma('xartis: κύκλος προαπαιτούμενων', { kodikos_mathimatos });
    report(0, minima, false);
    return apotyxia('MI_EGKYRO_SXIMA', minima);
  }

  // Οι τιμές των λεπτών και της απόδοσης είναι deterministic (βήμα megeti, T3).
  const xartis_schisto: XartisMathimatos = {
    ...xartis_mathimatos,
    enotites: xartis_mathimatos.enotites.map((enotita) => ({
      ...enotita,
      lepta_ektimisi: null,
      apodosi_exetasis: null,
    })),
  };

  const grapse = await grapse_json(
    p.apothiki,
    me_riza(p.riza, arxeio_xarti(kodikos_mathimatos)),
    xartis_schisto
  );
  if (!grapse.ok) {
    p.katagrafi.sfalma('xartis: απέτυχε η εγγραφή του χάρτη', {
      kodikos: grapse.sfalma.kodikos,
      kodikos_mathimatos,
    });
    report(0, grapse.sfalma.minima, false);
    return grapse;
  }

  report(1, `ο χάρτης έχει ${xartis_schisto.enotites.length} ενότητες`);
  return ok(xartis_schisto);
}