import type { ApothikiPyli, Apotelesma, Arxeio } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { PROTI_SELIDA } from './parapompi.js';

/** Διαδρομή του ευρετηρίου αρχείων ενός μαθήματος, σύμφωνα με το layout §5.3. */
export function diadromi_eurethriou(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/.spoudes/eurethrio-arxeion.json`;
}

/** Διαβάζει το ευρετήριο αρχείων ενός μαθήματος· αν δεν υπάρχει, επιστρέφει κενή λίστα. */
export async function fortose_eurethrio(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string
): Promise<Apotelesma<readonly Arxeio[]>> {
  const diavase = await apothiki.diavase_keimeno(diadromi_eurethriou(kodikos_mathimatos));
  if (!diavase.ok) {
    return ok([]);
  }
  try {
    const anagnose: unknown = JSON.parse(diavase.timi);
    if (!Array.isArray(anagnose)) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το ευρετήριο αρχείων δεν είναι λίστα.');
    }
    return ok(anagnose as Arxeio[]);
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το ευρετήριο αρχείων δεν είναι έγκυρο JSON.');
  }
}

/** Ψάχνει στο ευρετήριο τη διαδρομή ενός αρχείου· άγνωστο id δίνει DEN_VRETHIKE, όχι κενή οθόνη. */
export async function diadromi_arxeiou(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<string>> {
  const eurethrio = await fortose_eurethrio(apothiki, kodikos_mathimatos);
  if (!eurethrio.ok) {
    return eurethrio;
  }
  const arxeio = eurethrio.timi.find((k) => k.id === arxeio_id);
  if (arxeio === undefined || arxeio.diadromi.length === 0) {
    return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκε το αρχείο ${arxeio_id} στο ευρετήριο του μαθήματος.`);
  }
  return ok(arxeio.diadromi);
}

/** Φορτώνει τα byteof ενός αρχείου του μαθήματος, επαληθεύοντας ότι είναι PDF. */
export async function fortose_pdf(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<Uint8Array>> {
  const diadromi = await diadromi_arxeiou(apothiki, kodikos_mathimatos, arxeio_id);
  if (!diadromi.ok) {
    return diadromi;
  }
  const dyadiko = await apothiki.diavase_dyadiko(diadromi.timi);
  if (!dyadiko.ok) {
    return apotyxia(
      dyadiko.sfalma.kodikos,
      `Το αρχείο ${arxeio_id} δεν ανοίγει: ${dyadiko.sfalma.minima}`
    );
  }
  return ok(dyadiko.timi);
}

/** Περιορίζει έναν αριθμό σελίδας στα όρια [1, synolo] του εγγράφου. */
export function kilise_selida(zitoumeni: number, synoloSelidon: number): number {
  if (!Number.isFinite(synoloSelidon) || synoloSelidon < PROTI_SELIDA) {
    return PROTI_SELIDA;
  }
  const akeraia = Math.trunc(zitoumeni);
  if (!Number.isFinite(akeraia) || akeraia < PROTI_SELIDA) {
    return PROTI_SELIDA;
  }
  return Math.min(akeraia, synoloSelidon);
}
