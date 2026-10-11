/**
 * Εντοπισμός μαθήματος από αναγνωριστικό αρχείου ή ενότητας.
 *
 * ΥΠΟΓΡΑΦΕΣ ΣΥΜΒΑΤΕΣ ΠΡΟΣ ΤΑ ΠΙΣΩ: το `perigramma(p, arxeio_id)` και το
 * `odigos(p, enotita_id)` του κοινού συμβολαίου ΔΕΝ παίρνουν κωδικό μαθήματος.
 * Τα αρχεία του §5.3 όμως είναι φθασμένα σε αυτόν, οπότε η ροή εντοπίζει το
 * μάθημα διαβάζοντας ΜΟΝΟ το `mathimata.json` και ελέγχοντας την ύπαρξη του
 * αρχείου-στόχου. Αν δεν βρεθεί, επιστρέφεται `DEN_VRETHIKE` — ποτέ ψεύτικα
 * δεδομένα, ποτέ επιλογή «όποιο τύχει».
 */

import type { Apotelesma, Mathima } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import type { EisodosPipeline } from '../porte.js';
import { arxeio_keimenou, arxeio_xarti, me_riza } from '../statheroi.js';
import { diavase_mathimata, diavase_xarti } from './apothiki-json.js';

/** Τα μαθήματα της ρίζας, ή κενή λίστα αν το `mathimata.json` δεν υπάρχει ακόμα. */
export async function fere_mathimata(p: EisodosPipeline): Promise<Apotelesma<Mathima[]>> {
  const gram = await diavase_mathimata(p.apothiki, p.riza);
  if (!gram.ok) {
    return gram.sfalma.kodikos === 'DEN_VRETHIKE' ? ok([]) : gram;
  }
  return gram;
}

/** Μαθήματα με `epilegmeno: true`, με τη σειρά του `mathimata.json`. */
export async function fere_episkeptes_mathimata(p: EisodosPipeline): Promise<Apotelesma<Mathima[]>> {
  const mathimata = await fere_mathimata(p);
  if (!mathimata.ok) {
    return mathimata;
  }
  return ok(mathimata.timi.filter((mathima) => mathima.epilegmeno));
}

/**
 * Βρίσκει σε ποιο μάθημα ανήκει το `arxeio_id`, ελέγχοντας αν υπάρχει το
 * `keimeno/<arxeio_id>.json` του. Καθαρά ανάγνωση: καμία εγγραφή, καμία κλήση LLM.
 */
export async function vres_mathima_apo_arxeio(
  p: EisodosPipeline,
  arxeio_id: string
): Promise<Apotelesma<string>> {
  const mathimata = await fere_mathimata(p);
  if (!mathimata.ok) {
    return mathimata;
  }
  for (const mathima of mathimata.timi) {
    if (await p.apothiki.yparxei(me_riza(p.riza, arxeio_keimenou(mathima.kodikos, arxeio_id)))) {
      return ok(mathima.kodikos);
    }
  }
  p.katagrafi.sfalma('ves: το αρχείο δεν ανήκει σε κανένα γνωστό μάθημα', { arxeio_id });
  return apotyxia(
    'DEN_VRETHIKE',
    `Το αρχείο ${arxeio_id} δεν βρέθηκε σε κανένα μάθημα· τρέξε πρώτα τα βήματα anakalypsi και exagogi`
  );
}

/**
 * Βρίσκει σε ποιο μάθημα ανήκει η `enotita_id`, διαβάζοντας τον χάρτη κάθε
 * γνωστού μαθήματος. Χαμένος ή άλλος χάρτης αγνοείται (απλή ανάγνωση).
 */
export async function vres_mathima_apo_enotita(
  p: EisodosPipeline,
  enotita_id: string
): Promise<Apotelesma<string>> {
  const mathimata = await fere_mathimata(p);
  if (!mathimata.ok) {
    return mathimata;
  }
  for (const mathima of mathimata.timi) {
    const xartis = await diavase_xarti(p.apothiki, p.riza, mathima.kodikos);
    if (!xartis.ok) {
      continue;
    }
    if (xartis.timi.enotites.some((enotita) => enotita.id === enotita_id)) {
      return ok(mathima.kodikos);
    }
  }
  p.katagrafi.sfalma('ves: η ενότητα δεν ανήκει σε κανένα γνωστό μάθημα', { enotita_id });
  return apotyxia(
    'DEN_VRETHIKE',
    `Η ενότητα «${enotita_id}» δεν βρέθηκε στο χάρτη κανενός μαθήματος· τρέξε πρώτα τα βήματα xartis και megethi`
  );
}

/** Επανεξαγωγή: η διαδρομή του χάρτη, για τους καλούντες που τη χρειάζονται. */
export { arxeio_xarti };