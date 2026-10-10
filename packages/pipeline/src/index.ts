/**
 * ΚΟΙΝΟ ΣΥΜΒΟΛΑΙΟ @dps/pipeline — ΔΕΝ ΑΛΛΑΖΕΙ χωρίς αίτηση στον integrator.
 *
 * Το stream/F υλοποιεί την ορχήστρωση (packages/pipeline/**)· το stream/H
 * (apps/cli) καταναλώνει αυτή ακριβώς τη διεπαφή. Οι υπογραφές είναι οι
 * τελικές· οι stub αποτυχίες `MI_YPOSTIRIZOMENO` αντικαθίστανται από την
 * υλοποίηση χωρίς αλλαγή signature (συγχώνευση χωρίς conflict).
 *
 * Βήματα §4: syndesi → anakalypsi → sygxronismos → exagogi → perigramma →
 * xartis → megethi → odigos → tutor → programma. Όλα μέσω ports (D2, D4:
 * ο LLM κάνει μόνο NLP, οι αριθμοί deterministic στο core).
 */

import type {
  Apotelesma,
  ApothikiPyli,
  EclassPyli,
  KatagrafiPyli,
  KleidiMystikou,
  LlmPyli,
  Mathima,
  MystikaPyli,
  OdigosMeta,
  Perigramma,
  RologiPyli,
  XartisMathimatos,
} from '@dps/core';
import { apotyxia } from '@dps/core';

/** Όλα τα ports που χρειάζεται η ορχήστρωση, μαζί με τη ρίζα αποθήκευσης. */
export interface EisodosPipeline {
  readonly eclass: EclassPyli;
  readonly apothiki: ApothikiPyli;
  readonly llm: LlmPyli;
  readonly mystika: MystikaPyli;
  readonly rologi: RologiPyli;
  readonly katagrafi: KatagrafiPyli;
  /** Ρίζα αποθήκευσης (§5.3)· κενό = ίδια με τη θύρα. */
  readonly riza: string;
}

/** Αποτέλεσμα βήματος που δεν επιστρέφει οντότητα (π.χ. συγχρονισμός). */
export interface Metriti {
  readonly megaliteres: number;
}

function mi_yploadipo(onoma: string): Apotelesma<never> {
  return apotyxia('MI_YPOSTIRIZOMENO', `Το βήμα «${onoma}» δεν έχει υλοποιηθεί ακόμα`);
}

/** Βήμα 1: σύνδεση με το eClass (ports EclassPyli). */
export async function syndesi(_p: EisodosPipeline): Promise<Apotelesma<void>> {
  return mi_yploadipo('syndesi');
}

/** Βήμα 2: ανακάλυψη μαθημάτων → `mathimata.json`. */
export async function anakalypsi(_p: EisodosPipeline): Promise<Apotelesma<Mathima[]>> {
  return mi_yploadipo('anakalypsi');
}

/** Βήμα 3: συγχρονισμός αρχείων ενός μαθήματος (delta μεγέθους/ημερομηνίας/ETag). */
export async function sygxronismos(
  _p: EisodosPipeline,
  _kodikos_mathimatos: string
): Promise<Apotelesma<Metriti>> {
  return mi_yploadio('sygxronismos');
}

/** Βήμα 4: εξαγωγή κειμένου (packages/extract) → `keimeno/<arxeio_id>.json`. */
export async function exagogi(
  _p: EisodosPipeline,
  _kodikos_mathimatos: string
): Promise<Apotelesma<Metriti>> {
  return mi_yploadio('exagogi');
}

/** Βήμα 5: περίγραμμα αρχείου (LLM, ανά αρχείο, cache hash) → `perigrammata/`. */
export async function perigramma(
  _p: EisodosPipeline,
  _arxeio_id: string
): Promise<Apotelesma<Perigramma>> {
  return mi_yploadio('perigramma');
}

/** Βήμα 6: χάρτης μαθήματος (LLM) + επικύρωση DAG (core) → `xartis.json`. */
export async function xartis(
  _p: EisodosPipeline,
  _kodikos_mathimatos: string
): Promise<Apotelesma<XartisMathimatos>> {
  return mi_yploadio('xartis');
}

/** Βήμα 7: εκτίμηση λεπτών (deterministic, core L02) — εμπλουτίζει τον χάρτη. */
export async function megethi(
  _p: EisodosPipeline,
  _kodikos_mathimatos: string
): Promise<Apotelesma<XartisMathimatos>> {
  return mi_yploadio('megethi');
}

/** Βήμα 8: οδηγός ενότητας (LLM, lazy) → `odigoi/<enotita_id>.md` + meta. */
export async function odigos(
  _p: EisodosPipeline,
  _enotita_id: string
): Promise<Apotelesma<OdigosMeta>> {
  return mi_yploadio('odigos');
}

/** Βήμα 10: πρόγραμμα (deterministic, core L04) → `programma.json`. */
export async function programma(
  _p: EisodosPipeline
): Promise<Apotelesma<unknown>> {
  return mi_yploadio('programma');
}

/** Σύνθετη ροή «ανάλυση»: exagogi → perigramma → xartis → megethi για ένα μάθημα. */
export async function trekse_analysi(
  _p: EisodosPipeline,
  _kodikos_mathimatos: string
): Promise<Apotelesma<XartisMathimatos>> {
  return mi_yploadio('trekse_analysi');
}

/** Σύνθετη ροή «συγχρονισμός + ανάλυση» για όλα τα επιλεγμένα μαθήματα. */
export async function trekse_oloklirosi(
  _p: EisodosPipeline
): Promise<Apotelesma<{ mathimata: number }>> {
  return mi_yploadio('trekse_oloklirosi');
}

/** Τα κλειδιά μυστικών που χρησιμοποιεί η ορχήστρωση (για το CLI). */
export const KLEIDIA_PIPELINE: readonly KleidiMystikou[] = [
  'eclass_onoma_xristi',
  'eclass_kodikos',
  'llm_api_key',
];

