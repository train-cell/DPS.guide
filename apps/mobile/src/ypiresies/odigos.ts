import type { ApothikiPyli } from '@dps/core';
import { adeio, etimo, sfalma, type Katastasi } from '../kathstasi/index.js';

/** Οι επτά υποχρεωτικές ενότητες ενός οδηγού μελέτης, με τη σειρά του προϊόντος (§7.1 P3). */
export const LEKIKIA_TMIMATON = [
  'stoxoi',
  'eli5',
  'theoria',
  'paradeigma',
  'pagides',
  'syndeseis',
  'autoelegchos',
] as const;

/** Κωδικός μιας υποχρεωτικής ενότητας οδηγού. */
export type KleidiTmimatos = (typeof LEKIKIA_TMIMATON)[number];

/** Ιδιότητες μιας ενότητας οδηγού: παράγραφοι και παραπομπή στην πηγή. */
export interface TmimaOdigou {
  readonly keimena: readonly string[];
  readonly parapompi: string;
}

/** Ιδιότητες του οδηγού μιας ενότητας μελέτης. */
export interface OdigosEnotitas {
  readonly enotita_id: string;
  readonly titlos: string;
  readonly tmimata: Readonly<Record<KleidiTmimatos, TmimaOdigou>>;
}

/** Οι επικεφαλίδες των υποχρεωτικών ενοτήτων, όπως τις γράφει ο οδηγός στο Markdown. */
export const EPKEFALIDES_TMIMATON: Readonly<Record<KleidiTmimatos, string>> = {
  stoxoi: '🎯 Στόχοι',
  eli5: '👶 ELI5',
  theoria: '🔬 Θεωρία',
  paradeigma: '🧪 Λυμένο παράδειγμα',
  pagides: '⚠️ Παγίδες',
  syndeseis: '🔗 Συνδέσεις',
  autoelegchos: '✅ Αυτοέλεγχος',
};

/** Πρόθεμμα γραμμής περιεχομένου μέσα σε ένα τμήμα. */
const PROTHEMA_KEIMENOU = '- ';

/** Πρόθεμμα υποεπικεφαλίδας, της οποίας το περιεχόμενο είναι δευτερεύον και αγνοείται. */
const PROTHEMA_YPOKEFALIDAS = '###';

/** Αντίστροφος χάρτης: επικεφαλίδα Markdown → κωδικός τμήματος. */
const KLEIDIA_APO_EPKEFALIDA: Readonly<Record<string, KleidiTmimatos>> = Object.freeze(
  Object.fromEntries(
    LEKIKIA_TMIMATON.map((kleidi) => [EPKEFALIDES_TMIMATON[kleidi], kleidi] as const)
  ) as Record<string, KleidiTmimatos>
);

/** Αναλύει το Markdown ενός οδηγού στα επτά υποχρεωμένα τμήματα· null αν δεν είναι πλήρης. */
export function analise_odigo_md(enotita_id: string, md: string): OdigosEnotitas | null {
  const grammes = md.split(/\r?\n/);
  const titlos = grammes.find((grammi) => grammi.startsWith('# '))?.slice(2).trim() ?? enotita_id;

  const tmimata: Partial<Record<KleidiTmimatos, TmimaOdigou>> = {};
  let trexon: KleidiTmimatos | null = null;
  const keimena: string[] = [];
  let parapompi: string | null = null;

  const kleise_trexon = (): void => {
    if (trexon === null || parapompi === null || keimena.length === 0) {
      return;
    }
    tmimata[trexon] = { keimena: [...keimena], parapompi };
  };

  for (const grammi of grammes) {
    if (grammi.startsWith(PROTHEMA_YPOKEFALIDAS)) {
      continue;
    }
    if (grammi.startsWith('## ')) {
      kleise_trexon();
      const kleidi = KLEIDIA_APO_EPKEFALIDA[grammi.slice(3).trim()];
      trexon = kleidi ?? null;
      keimena.length = 0;
      parapompi = null;
      continue;
    }
    if (trexon === null) {
      continue;
    }
    if (grammi.startsWith(PROTHEMA_KEIMENOU)) {
      keimena.push(grammi.slice(PROTHEMA_KEIMENOU.length).trim());
      continue;
    }
    if (grammi.includes('[[') && parapompi === null) {
      parapompi = grammi.trim();
    }
  }
  kleise_trexon();

  if (!LEKIKIA_TMIMATON.every((kleidi) => tmimata[kleidi] !== undefined)) {
    return null;
  }
  return { enotita_id, titlos, tmimata: tmimata as Readonly<Record<KleidiTmimatos, TmimaOdigou>> };
}

/** Διαδρομή του οδηγού μιας ενότητας στο layout §5.3. */
export function diadromi_odigou(kodikos_mathimatos: string, enotita_id: string): string {
  return `${kodikos_mathimatos}/.spoudes/odigoi/${enotita_id}.md`;
}

/**
 * Φορτώνει τον οδηγό μιας ενότητας από τα αρχεία του §5.3. Οι οδηγοί παράγονται lazily,
 * άρα η απουσία αρχείου είναι κανονική κενή κατάσταση· μόνο το χαλασμένο αρχείο είναι σφάλμα.
 */
export async function fortose_odigo_apo_apothiki(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<Katastasi<OdigosEnotitas>> {
  const diavase = await apothiki.diavase_keimeno(diadromi_odigou(kodikos_mathimatos, enotita_id));
  if (!diavase.ok) {
    return adeio<OdigosEnotitas>();
  }
  const odigos = analise_odigo_md(enotita_id, diavase.timi);
  if (odigos === null) {
    return sfalma<OdigosEnotitas>({
      kodikos: 'MI_EGKYRO_SXIMA',
      minima: 'Ο οδηγός δεν έχει όλα τα επτά υποχρεωμένα τμήματα.',
    });
  }
  return etimo(odigos);
}
