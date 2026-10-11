/**
 * ΚΟΙΝΟ ΣΥΜΒΟΛΑΙΟ @dps/pipeline — ΔΕΝ ΑΛΛΑΖΕΙ χωρίς αίτηση στον integrator.
 *
 * Το stream/F υλοποιεί την ορχήστρωση (packages/pipeline/**)· το stream/H
 * (apps/cli) καταναλώνει αυτή ακριβώς τη διεπαφή. Οι υπογραφές των βημάτων
 * είναι αυτές που δηλώθηκαν στο contract skeleton και δεν αλλάζουν: κάθε βήμα
 * του §4 υλοποιείται πίσω από την ίδια signature.
 *
 * Βήματα §4: syndesi → anakalypsi → sygxronismos → exagogi → perigramma →
 * xartis → megethi → odigos → srixi_tutor → programma. Όλα μέσω ports
 * (D2/D4: ο LLM κάνει μόνο NLP, οι αριθμοί είναι deterministic στο core).
 */

export type {
  EisodosPipeline,
  Metriti,
  ApotelestesSyndesis,
  ApotelestesAnakalypsis,
  ApotelestesSygxronismou,
  ApotelestesExagogis,
  ApotelestesPerigrammatos,
  ApotelestesXarti,
  ApotelestesMegethon,
  ApotelestesOdigou,
} from './porte.js';
export { KLEIDIA_PIPELINE } from './porte.js';

export { syndesi } from './bhmata/syndesi.js';
export { anakalypsi } from './bhmata/anakalypsi.js';
export { sygxronismos, hash_periexomenou } from './bhmata/sygxronismos.js';
export { exagogi } from './bhmata/exagogi.js';
export { perigramma, perigramma_mathimatos } from './bhmata/perigramma.js';
export { xartis } from './bhmata/xartis.js';
export { megethi } from './bhmata/megethi.js';
export { odigos, odigos_mathimatos } from './bhmata/odigos.js';
export { srixi_tutor, srixi_tutor_mathimatos } from './bhmata/tutor.js';
export { programma } from './bhmata/programma.js';
export { trekse_analysi, trekse_oloklirosi, trekse_mathimata } from './bhmata/trekse.js';

export type { ProodosEvent, IparastypotisProodou } from './grammata/proodos.js';
export { proodos } from './grammata/proodos.js';

export type { GrammaSynomilias, AitisiTutor } from './bhmata/tutor.js';
export type {
  RythiseisProgrammatos,
  ProodhosMathimatos,
  ProgrammaMeletis,
} from './bhmata/programma.js';
export type { MetritiOloklirosis } from './bhmata/trekse.js';
export type { ArithmosImeras, GrammiTemplate, ParateropismosLepton } from './bhmata/programma.js';

export { ftiaxe_arxeio_id, parade_json } from './grammata/apothiki-json.js';
export { karnikopoiese_diadromi, ektekseven_arxeio } from './grammata/diadromes.js';
export { fere_mathimata, fere_episkeptes_mathimata } from './grammata/ves.js';
export * from './statheroi.js';