/** Μία παραπομπή οδηγού προς αρχείο PDF: ταυτότητα αρχείου και εύρος σελίδων (1-based). */
export interface ParapompiPdf {
  readonly arxeio_id: string;
  readonly apo: number;
  readonly eos: number;
}

/** Πρώτη σελίδα ενός εγγράφου, όπως την αριθμούν τα PDF. */
export const PROTI_SELIDA = 1;

/** Μοτίβο παραπομπής οδηγού: [[arxeio_id: (σ.|σελ.) N(–M)]], με ελεύθερα κενά και προαιρετικό εύρος. */
const MOTIVO_PARAPOMPIS =
  /\[\[\s*([A-Za-z0-9._-]+)\s*:\s*(?:σελ\.?|σ\.?)\s*(\d+)\s*(?:[\u2013\u2014-]\s*(\d+)\s*)?\]\]/;

/** Αναλύει την πρώτη παραπομπή ενός κειμένου· επιστρέφει null αν δεν υπάρχει ή είναι ανέγκυρη. */
export function analise_parapompi(keimeno: string): ParapompiPdf | null {
  const tairiasma = MOTIVO_PARAPOMPIS.exec(keimeno);
  if (tairiasma === null) {
    return null;
  }
  const arxeio_id = tairiasma[1] ?? '';
  const apo = Number.parseInt(tairiasma[2] ?? '', 10);
  if (arxeio_id.length === 0 || !Number.isFinite(apo) || apo < PROTI_SELIDA) {
    return null;
  }
  const eosKeimeno = tairiasma[3];
  if (eosKeimeno === undefined) {
    return { arxeio_id, apo, eos: apo };
  }
  const eos = Number.parseInt(eosKeimeno, 10);
  if (!Number.isFinite(eos) || eos < apo) {
    return null;
  }
  return { arxeio_id, apo, eos };
}

/** Μαζεύει όλες τις παραπομπές ενός κειμένου, με τη σειρά εμφάνισης. */
export function pare_oli_parapompes(keimeno: string): ParapompiPdf[] {
  const parapompes: ParapompiPdf[] = [];
  for (const tairiasma of keimeno.matchAll(new RegExp(MOTIVO_PARAPOMPIS, 'g'))) {
    const analise = analise_parapompi(tairiasma[0]);
    if (analise !== null) {
      parapompes.push(analise);
    }
  }
  return parapompes;
}

/** Γράφει μια παραπομπή στην κανονική μορφή [[arxeio_id: σ. N]]. */
export function stilise_parapompi(parapompi: ParapompiPdf): string {
  const euros = parapompi.eos > parapompi.apo ? `\u2013${parapompi.eos}` : '';
  return `[[${parapompi.arxeio_id}: \u03c3. ${parapompi.apo}${euros}]]`;
}

/** Διαδρομή πλοήγησης της προβολής PDF για μια παραπομπή. */
export function diadromi_provolis(parapompi: ParapompiPdf): string {
  return `/provoli/${encodeURIComponent(parapompi.arxeio_id)}/${parapompi.apo}`;
}
