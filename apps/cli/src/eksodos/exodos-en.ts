import type { Mathima, OdigosMeta, XartisMathimatos } from '@dps/core';

/** Μετρήσεις συγχρονισμού ανά μάθημα. */
export interface MetritiMathimatos {
  readonly kodikos_mathimatos: string;
  readonly megaliteres: number;
}

/**
 * Αποτέλεσμα ενός βήματος σε μορφή προς εμφάνιση.
 *
 * Κάθε εντολή επιστρέφει αυτή τη δομή (ή `Apotelesma` με σφάλμα) — ο CLI δεν
 * γράφει ποτέ απευθείας στην κονσόλα, ώστε το ίδιο αποτέλεσμα να εκτυπώνεται
 * είτε ανθρώπινα είτε ως JSON (§3.9: ποτέ ψεύτικη επιτυχία).
 */
export type ExodosEn =
  | { readonly eidos: 'plirofories'; readonly minima: string }
  | { readonly eidos: 'mathimata'; readonly mathimata: readonly Mathima[] }
  | { readonly eidos: 'sygxronismos'; readonly apotelesmata: readonly MetritiMathimatos[] }
  | { readonly eidos: 'xartis'; readonly xartis: XartisMathimatos }
  | { readonly eidos: 'odigos'; readonly meta: OdigosMeta }
  | { readonly eidos: 'allh_dedomena'; readonly dedomena: unknown };

/** Μορφοποίηση λεπτών· κενό όταν η εκτίμηση δεν έχει γίνει ακόμα (deterministic, core). */
function lepta_ektimisis(lepta: number | null): string {
  return lepta === null ? 'χωρίς εκτίμηση λεπτών' : `${lepta} λεπτά μελέτης`;
}

function grammmes_pliroforion(minima: string): string[] {
  return [minima];
}

function grammmes_mathimaton(mathimata: readonly Mathima[]): string[] {
  if (mathimata.length === 0) {
    return ['Δεν βρέθηκαν μαθήματα.'];
  }
  const grammmes: string[] = [`Μαθήματα (${mathimata.length}):`];
  for (const mathima of mathimata) {
    const simeira = mathima.epilegmeno ? '  [επιλεγμένο]' : '';
    grammmes.push(`  ${mathima.kodikos}  ${mathima.titlos}${simeira}`);
  }
  const epilegmena = mathimata.filter((mathima) => mathima.epilegmeno).length;
  grammmes.push(`Επιλεγμένα για συγχρονισμό: ${epilegmena}`);
  return grammmes;
}

function grammmes_sygxronismou(apotelesmata: readonly MetritiMathimatos[]): string[] {
  if (apotelesmata.length === 0) {
    return ['Δεν συγχρονίστηκε κανένα μάθημα.'];
  }
  const grammmes: string[] = ['Συγχρονισμός αρχείων:'];
  let syn = 0;
  for (const metriti of apotelesmata) {
    syn += metriti.megaliteres;
    grammmes.push(`  ${metriti.kodikos_mathimatos}  ${metriti.megaliteres} αρχεία`);
  }
  grammmes.push(`Σύνολο: ${syn} αρχεία σε ${apotelesmata.length} μαθήματα`);
  return grammmes;
}

function grammmes_xarti(xartis: XartisMathimatos): string[] {
  const grammmes: string[] = [
    `Χάρτης μαθήματος ${xartis.kodikos_mathimatos} (${xartis.enotites.length} ενότητες):`,
  ];
  for (const enotita of xartis.enotites) {
    grammmes.push(
      `  ${enotita.seira}. ${enotita.titlos} [${enotita.id}] — ${lepta_ektimisis(enotita.lepta_ektimisi)}`
    );
  }
  return grammmes;
}

function grammmes_odigou(meta: OdigosMeta): string[] {
  const grammmes: string[] = [`Οδηγός ενότητας ${meta.enotita_id}`, `  μοντέλο: ${meta.montelo}`];
  if (meta.parapompes.length === 0) {
    grammmes.push('  παραπομπές: καμία');
  } else {
    grammmes.push(`  παραπομπές (${meta.parapompes.length}):`);
    for (const parapompi of meta.parapompes) {
      grammmes.push(`    ${parapompi.arxeio_id} σελ. ${parapompi.selida}`);
    }
  }
  if (meta.proeidopoiiseis.length > 0) {
    grammmes.push(`  προειδποιήσεις (${meta.proeidopoiiseis.length}):`);
    for (const proeidopoiisi of meta.proeidopoiiseis) {
      grammmes.push(`    ${proeidopoiisi}`);
    }
  }
  return grammmes;
}

function grammmes_allhon(dedomena: unknown): string[] {
  return JSON.stringify(dedomena, null, 2).split('\n');
}

/** Αναλύει ένα αποτέλεσμα σε γραμμές για ανθρώπινη ανάγνωση. */
export function grammmes_exodou(exodos: ExodosEn): string[] {
  switch (exodos.eidos) {
    case 'plirofories':
      return grammmes_pliroforion(exodos.minima);
    case 'mathimata':
      return grammmes_mathimaton(exodos.mathimata);
    case 'sygxronismos':
      return grammmes_sygxronismou(exodos.apotelesmata);
    case 'xartis':
      return grammmes_xarti(exodos.xartis);
    case 'odigos':
      return grammmes_odigou(exodos.meta);
    case 'allh_dedomena':
      return grammmes_allhon(exodos.dedomena);
  }
}
