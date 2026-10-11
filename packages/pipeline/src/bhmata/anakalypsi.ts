/**
 * Βήμα 2 (§4): ανακάλυψη μαθημάτων → `mathimata.json`.
 *
 * Idempotent: η επιλογή του χρήστη (`epilegmeno`) διατηρείται ανάμεσα στους
 * γύρους — το eClass δεν γνωρίζει τι διάλεξε ο χρήστης στην εφαρμογή.
 */

import type { Apotelesma, Mathima } from '@dps/core';
import type { EisodosPipeline } from '../porte.js';
import { ARXEIO_MATHIMATON, me_riza } from '../statheroi.js';
import { grapse_json, parade_json } from '../grammata/apothiki-json.js';
import { apotyxia, ok } from '@dps/core';

/** Διαβάζει τις προηγούμενες επιλογές· η απουσία αρχείου είναι φυσιολογική κατάσταση. */
async function proigoumenes_epiloges(
  p: EisodosPipeline
): Promise<Apotelesma<Map<string, boolean>>> {
  const gram = await p.apothiki.diavase_keimeno(me_riza(p.riza, ARXEIO_MATHIMATON));
  if (!gram.ok) {
    return ok(new Map<string, boolean>());
  }
  let anagnosmeno: unknown;
  try {
    anagnosmeno = JSON.parse(gram.timi);
  } catch (aitia) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το mathimata.json δεν είναι έγκυρο JSON', aitia);
  }
  if (!Array.isArray(anagnosmeno)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το mathimata.json δεν είναι λίστα μαθημάτων');
  }
  const epiloges = new Map<string, boolean>();
  for (const stoixeio of anagnosmeno) {
    if (
      typeof stoixeio === 'object' &&
      stoixeio !== null &&
      'kodikos' in stoixeio &&
      typeof stoixeio.kodikos === 'string' &&
      'epilegmeno' in stoixeio &&
      typeof stoixeio.epilegmeno === 'boolean'
    ) {
      epiloges.set(stoixeio.kodikos, stoixeio.epilegmeno);
    }
  }
  return ok(epiloges);
}

/** Βήμα 2: `fere_mathimata()` → `mathimata.json`. */
export async function anakalypsi(p: EisodosPipeline): Promise<Apotelesma<Mathima[]>> {
  const mathimata = await p.eclass.fere_mathimata();
  if (!mathimata.ok) {
    p.katagrafi.sfalma('anakalypsi: το eClass δεν επέστρεψε μαθήματα', {
      kodikos: mathimata.sfalma.kodikos,
    });
    return mathimata;
  }

  const proigoumenes = await proigoumenes_epiloges(p);
  if (!proigoumenes.ok) {
    return proigoumenes;
  }

  const apotelestes: Mathima[] = mathimata.timi.map((mathima) => ({
    ...mathima,
    epilegmeno: proigoumenes.timi.get(mathima.kodikos) ?? mathima.epilegmeno,
  }));

  const diadromi = me_riza(p.riza, ARXEIO_MATHIMATON);
  const yparxei = await p.apothiki.yparxei(diadromi);
  const periexomeno = parade_json(apotelestes);
  if (yparxei) {
    const palio = await p.apothiki.diavase_keimeno(diadromi);
    if (!palio.ok) {
      p.katagrafi.sfalma('anakalypsi: δεν διαβάστηκε το υπάρχον mathimata.json');
      return palio;
    }
    if (palio.timi === periexomeno) {
      p.katagrafi.pliroforia('anakalypsi: το mathimata.json είναι ήδη ενημερωμένο');
      return ok(apotelestes);
    }
  }

  const grapse = await grapse_json(p.apothiki, diadromi, apotelestes);
  if (!grapse.ok) {
    p.katagrafi.sfalma('anakalypsi: απέτυχε η εγγραφή του mathimata.json', {
      kodikos: grapse.sfalma.kodikos,
    });
    return grapse;
  }

  p.katagrafi.pliroforia('anakalypsi: η λίστα μαθημάτων ενημερώθηκε', { plithos: apotelestes.length });
  return ok(apotelestes);
}