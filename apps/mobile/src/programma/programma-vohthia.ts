import type { Exetasi } from '@dps/core';
import {
  IMERES_EVDOMADAS,
  MEGISTA_LEPTA_IMERAS,
  MOTIVO_IMEROMINIAS,
  ONOMATA_MINON,
  type ArithmosImeras,
  type ExetasiP1,
  type OverrideLepton,
  type ProgrammaRytheseis,
  type TemplateLepton,
} from './programma-typoi.js';

/** Ελέγχει αν η τιμή είναι ημερομηνία ISO YYYY-MM-DD που υπάρχει στον ημερολόγιο. */
export function einai_iso_imerominia(timi: string): boolean {
  const tairiasma = MOTIVO_IMEROMINIAS.exec(timi.trim());
  if (tairiasma === null) {
    return false;
  }
  const etos = Number(tairiasma[1]);
  const minas = Number(tairiasma[2]);
  const mera = Number(tairiasma[3]);
  if (minas < 1 || minas > 12 || mera < 1) {
    return false;
  }
  const imerominia = new Date(Date.UTC(etos, minas - 1, mera));
  return (
    imerominia.getUTCFullYear() === etos &&
    imerominia.getUTCMonth() === minas - 1 &&
    imerominia.getUTCDate() === mera
  );
}

/** Εμφανίζει ημερομηνία ISO ως «12 Ιαν 2026»· μη έγκυρη τιμή επιστρέφει null. */
export function stilise_imerominia(timi: string | null): string | null {
  if (timi === null || !einai_iso_imerominia(timi)) {
    return null;
  }
  const tairiasma = MOTIVO_IMEROMINIAS.exec(timi.trim());
  if (tairiasma === null) {
    return null;
  }
  const etos = Number(tairiasma[1]);
  const minas = Number(tairiasma[2]);
  const mera = Number(tairiasma[3]);
  const onomaMina = ONOMATA_MINON[minas - 1] ?? '';
  return `${mera} ${onomaMina} ${etos}`;
}

/** Περιορίζει τα λεπτά μιας ημέρας στα αποδεκτά όρια [0, MEGISTA_LEPTA_IMERAS]. */
export function kilise_lepta(lepta: number): number {
  if (!Number.isFinite(lepta)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(lepta), 0), MEGISTA_LEPTA_IMERAS);
}

/** Προτεινόμενο εβδομαδιαίο template εκκίνησης: καθημεριά και Σάββατο, ανάπαυλα Κυριακή. */
export const PROEDAFO_TEMPLATE: TemplateLepton = Object.freeze(
  IMERES_EVDOMADAS.map((imera) => ({
    imera: imera.arithmos,
    lepta: imera.arithmos === 7 ? 0 : imera.arithmos === 6 ? 60 : 120,
  }))
);

/** Αλλάζει τα λεπτά μίας ημέρας στο template, επιστρέφοντας νέο αντίγραφο. */
export function enimerose_template(
  template: TemplateLepton,
  imera: ArithmosImeras,
  lepta: number
): TemplateLepton {
  return template.map((grammi) =>
    grammi.imera === imera ? { imera, lepta: kilise_lepta(lepta) } : grammi
  );
}

/** Φτιάχνει κενή γραμμή εξέτασης με τον πρώτο τρόπο του συμβολαίου. */
export function nea_exetasi(): ExetasiP1 {
  return { kodikos: '', imerominia: '', tropos: 'anoixta_vivlia' };
}

/** Ελέγχει αν μια γραμμή εξέτασης είναι έγκυρη: κωδικός και πραγματική ημερομηνία. */
export function einai_egkyri_exetasi(exetasi: ExetasiP1): boolean {
  return exetasi.kodikos.trim().length > 0 && einai_iso_imerominia(exetasi.imerominia);
}

/** Μετατρέπει γραμμή οθόνης σε Exetasi του συμβολαίου, ή null αν δεν είναι έγκυρη. */
export function exetasi_simvolaiou(exetasi: ExetasiP1): Exetasi | null {
  if (!einai_egkyri_exetasi(exetasi)) {
    return null;
  }
  return {
    kodikos_mathimatos: exetasi.kodikos.trim(),
    imerominia: exetasi.imerominia.trim(),
    tropos: exetasi.tropos,
  };
}

/** Προσθέτει ή αντικαθιστά εξέταση ίδιου μαθήματος· οι έγκυρες γραμμές κρατιούνται με τη σειρά εισαγωγής. */
export function prosthese_exetasi(
  exetaseis: readonly Exetasi[],
  nea: Exetasi
): readonly Exetasi[] {
  const xorisEna = exetaseis.filter((e) => e.kodikos_mathimatos !== nea.kodikos_mathimatos);
  return [...xorisEna, nea].sort((a, b) => (a.imerominia ?? '').localeCompare(b.imerominia ?? ''));
}

/** Αφαιρεί την εξέταση ενός μαθήματος. */
export function afairese_exetasi(
  exetaseis: readonly Exetasi[],
  kodikos: string
): readonly Exetasi[] {
  return exetaseis.filter((e) => e.kodikos_mathimatos !== kodikos);
}

/** Προσθέτει ή αντικαθιστά εξαίρεση για ημερομηνία· κρατιέται η ταξινόμηση ημερομηνίας. */
export function prosthese_override(
  overrides: readonly OverrideLepton[],
  neo: OverrideLepton
): readonly OverrideLepton[] {
  const xorisMia = overrides.filter((o) => o.imerominia !== neo.imerominia);
  return [...xorisMia, neo].sort((a, b) => a.imerominia.localeCompare(b.imerominia));
}

/** Αφαιρεί την εξαίρεση μιας ημερομηνίας. */
export function afairese_override(
  overrides: readonly OverrideLepton[],
  imerominia: string
): readonly OverrideLepton[] {
  return overrides.filter((o) => o.imerominia !== imerominia);
}

/** Διαβάζει το μέρος προγράμματος από πλήρεις ρυθμίσεις, συμπληρώνοντας τα προεπιλεγμένα template. */
export function pare_programma_rytheseis(pithos: {
  readonly exetaseis?: readonly Exetasi[];
  readonly arxiExetastikis?: string | null;
  readonly templateLepton?: TemplateLepton;
  readonly overridesLepton?: readonly OverrideLepton[];
}): ProgrammaRytheseis {
  return {
    exetaseis: pithos.exetaseis ?? [],
    arxiExetastikis: pithos.arxiExetastikis ?? null,
    templateLepton: pithos.templateLepton ?? PROEDAFO_TEMPLATE,
    overridesLepton: pithos.overridesLepton ?? [],
  };
}

/** Συνολικά λεπτά εβδομαδιαίου template, για την ετικέτα σύνοψης. */
export function synolika_lepta_template(template: TemplateLepton): number {
  return template.reduce((athroisma, grammi) => athroisma + kilise_lepta(grammi.lepta), 0);
}

/** Επιστρέφει τα λεπτά μίας ημέρας από το template, ή 0 αν η ημέρα δεν βρεθεί. */
export function lepta_imeras(template: TemplateLepton, imera: ArithmosImeras): number {
  return template.find((grammi) => grammi.imera === imera)?.lepta ?? 0;
}

/** Μήνυμα όταν μια γραμμή εξέτασης δεν έχει κωδικό ή έγκυρη ημερομηνία. */
export const MINIMA_AKYRIS_EXETASIS = 'Κάθε εξέταση χρειάζεται κωδικό μαθήματος και έγκυρη ημερομηνία.';

/** Μήνυμα όταν η έναρξη της εξεταστικής δεν είναι έγκυρη ημερομηνία. */
export const MINIMA_AKYRIS_ARXIS = 'Η ημερομηνία έναρξης της εξεταστικής δεν είναι έγκυρη.';

/** Μήνυμα όταν μια εξαίρεση δεν έχει έγκυρη ημερομηνία. */
export const MINIMA_AKYRON_OVERRIDES = 'Κάθε εξαίρεση χρειάζεται έγκυρη ημερομηνία.';
