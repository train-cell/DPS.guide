/**
 * Σταθερές της ροής (§3 κανόνας 10: μηδέν magic numbers).
 *
 * Οι τιμές προέρχονται από το `docs/PLAN.md` (§4, §5.3, §7.1, §7.2, §8).
 * Ό,τι έχει ήδη οριστεί στο `packages/core/src/statheres.ts` ή στο
 * `packages/ai/src/cache/statheroi.ts` ΔΕΝ αντιγράφεται εδώ — μόνο εισάγεται.
 */

/** Θερμοκρασία (sampling temperature) της κλήσης P1 για το περίγραμμα αρχείου. */
export const THERMOKRASIA_PERIGRAMMA = 0.3;

/** Θερμοκρασία της κλήσης P2 για τον χάρτη του μαθήματος. */
export const THERMOKRASIA_XARTI = 0.3;

/** Θερμοκρασία της κλήσης P3 για τον οδηγό ενότητας (πιο προσεκτική διάταξη). */
export const THERMOKRASIA_ODIGOU = 0.7;

/** Ανώτατος αριθμός ταυτόχρονων βημάτων «περίγραμμα» στη σύνθετη ροή (κάρτα I1). */
export const MEGISTES_PARALLELOI_BHMATA = 2;

/** Λεπτά πολλαπλασιαστή MB → bytes, για το `MEGISTO_MEGETHOS_ARXEIOU_MB` του core. */
export const BYTES_ANA_MEGA = 1024 * 1024;

/** Μέγεθος τμήματος (bytes) στο οποίο τεμνχίζεται το hashing ενός αρχείου. */
export const BYTES_ANA_KOMMATI_HASH = 1024 * 1024;

/** Φάκελος εσωτερικών δεδομένων του μαθήματος (§5.3). */
export const KATALYMMA_YPOKEIMENON = '.spoudes';

/** Φάκελος των ληφθέντων αρχείων του eClass (§5.3). */
export const KATALYMMA_ARXEION = 'arxeia';

/** Φάκελος των περιγραμμάτων (§5.3). */
export const KATALYMMA_PERIGRAMMATON = 'perigrammata';

/** Φάκελος του εξαγόμενου κειμένου (§5.3). */
export const KATALYMMA_KEIMENON = 'keimeno';

/** Φάκελος των οδηγών (§5.3). */
export const KATALYMMA_ODIGON = 'odigoi';

/** Φάκελος των συνομιλιών του tutor (§5.3). */
export const KATALYMMA_SYNOMILION = 'synomilies';

/** Φάκελος της κρυφής μνήμης LLM, σχετικός με το `.spoudes` (§5.3). */
export const KATALYMMA_KACHE_LLM = 'cache/llm';

/** Αρχείο των μαθημάτων στη ρίζα (§5.3). */
export const ARXEIO_MATHIMATON = 'mathimata.json';

/** Αρχείο ρυθμίσεων στη ρίζα (§5.3). */
export const ARXEIO_RYTHMISEON = 'rythmiseis.json';

/** Αρχείο προόδου ανά μάθημα (ίδιο με αυτό της εφαρμογής, βλ. §5.3). */
export function arxeio_proodhou(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/proodhos.json`;
}

/** Αρχείο του ευρετηρίου αρχείων ενός μαθήματος (§5.3). */
export function arxeio_eurethriou(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/eurethrio-arxeion.json`;
}

/** Αρχείο του χάρτη ενοτήτων ενός μαθήματος (§5.3). */
export function arxeio_xarti(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/xartis.json`;
}

/** Αρχείο εξαγόμενου κειμένου ανά `arxeio_id` (§5.3). */
export function arxeio_keimenou(kodikos_mathimatos: string, arxeio_id: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_KEIMENON}/${arxeio_id}.json`;
}

/** Αρχείο περιγράμματος ανά `arxeio_id` (§5.3). */
export function arxeio_perigrammatos(kodikos_mathimatos: string, arxeio_id: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_PERIGRAMMATON}/${arxeio_id}.json`;
}

/** Αρχείο Markdown του οδηγού μιας ενότητας (§5.3). */
export function arxeio_odigou(kodikos_mathimatos: string, enotita_id: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_ODIGON}/${enotita_id}.md`;
}

/** Αρχείο μεταδεδομένων του οδηγού μιας ενότητας (§5.3). */
export function arxeio_meta_odigou(kodikos_mathimatos: string, enotita_id: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_ODIGON}/${enotita_id}.meta.json`;
}

/** Αρχείο jsonl της συνομιλίας του tutor για μια ενότητα (§5.3). */
export function arxeio_synomilias(kodikos_mathimatos: string, enotita_id: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_SYNOMILION}/${enotita_id}.jsonl`;
}

/** Πρόχειρο της κρυφής μνήμης LLM ενός μαθήματος (§5.3). */
export function proorismos_kache_llm(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_YPOKEIMENON}/${KATALYMMA_KACHE_LLM}`;
}

/** Θέση του ληφθέντος αρχείου, όπως στο §5.3 (`arxeia/<ίδια δομή με το eClass>`). */
export function diadromi_arxeiou(kodikos_mathimatos: string, kanonikopiemeni_diadromi: string): string {
  return `${kodikos_mathimatos}/${KATALYMMA_ARXEION}/${kanonikopiemeni_diadromi}`;
}

/** Θέση του αρχείου `themata/` (χρήστης, Wave 3) — δεν γράφεται από τη ροή. */
export function diadromi_thematon(kodikos_mathimatos: string): string {
  return `${kodikos_mathimatos}/themata`;
}

/**
 * Προσθέτει τη ρίζα αποθήκευσης σε μια σχετική διαδρομή του §5.3.
 * Κενή ρίζα = οι διαδρομές μένουν σχετικές με τη θύρα του `ApothikiPyli`.
 */
export function me_riza(riza: string, sxetiki: string): string {
  return riza === '' ? sxetiki : `${riza}/${sxetiki}`;
}