import type { Exetasi, TroposExetasis } from '@dps/core';

/** Αριθμός ημέρας εβδομάδας κατά ISO: 1 = Δευτέρα, 7 = Κυριακή. */
export type ArithmosImeras = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Μία ημέρα της εβδομάδας με το όνομά της, για το εβδομαδιαίο template. */
export interface ImeraEvdomadas {
  readonly arithmos: ArithmosImeras;
  readonly onoma: string;
}

/** Τα λεπτά μελέτης που προτείνει το template για μία ημέρα της εβδομάδας. */
export interface GrammiTemplate {
  readonly imera: ArithmosImeras;
  readonly lepta: number;
}

/** Εβδομαδιαίο template λεπτών: μία γραμμή για κάθε ημέρα, πάντα και οι επτά. */
export type TemplateLepton = readonly GrammiTemplate[];

/** Εξαίρεση στο template για μία συγκεκριμένη ημερομηνία. */
export interface OverrideLepton {
  readonly imerominia: string;
  readonly lepta: number;
}

/** Οι επτά ημέρες της εβδομάδας κατά ISO, για απόδοση και εισαγωγή. */
export const IMERES_EVDOMADAS: readonly ImeraEvdomadas[] = Object.freeze([
  { arithmos: 1, onoma: 'Δευτέρα' },
  { arithmos: 2, onoma: 'Τρίτη' },
  { arithmos: 3, onoma: 'Τετάρτη' },
  { arithmos: 4, onoma: 'Πέμπτη' },
  { arithmos: 5, onoma: 'Παρασκευή' },
  { arithmos: 6, onoma: 'Σάββατο' },
  { arithmos: 7, onoma: 'Κυριακή' },
]);

/** Ημέρα εξέτασης της κάρτας P1: κωδικός μαθήματος, ημερομηνία και τρόπο εξέτασης. */
export interface ExetasiP1 {
  readonly kodikos: string;
  readonly imerominia: string;
  readonly tropos: TroposExetasis;
}

/** Το μέρος των ρυθμίσεων που διαμορφώνει η οθόνη του προγράμματος. */
export interface ProgrammaRytheseis {
  readonly exetaseis: readonly Exetasi[];
  readonly arxiExetastikis: string | null;
  readonly templateLepton: TemplateLepton;
  readonly overridesLepton: readonly OverrideLepton[];
}

/** Ώρες μιας ημέρας, για τον υπολογισμό του ημερήσιου ορίου λεπτών. */
export const MERES_ORES = 24;

/** Λεπτά μιας ώρας. */
export const ORA_LEPTA = 60;

/** Μέγιστα λεπτά μελέτης που επιτρέπονται σε μία ημέρα: όχι παραπάνω από μια ημέρα. */
export const MEGISTA_LEPTA_IMERAS = MERES_ORES * ORA_LEPTA;

/** Μοτίβο ημερομηνίας ISO: ακριβώς έτος-μήνας-μέρα. */
export const MOTIVO_IMEROMINIAS = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Μήνες με τρία γράμματα, για την εμφάνιση ημερομηνιών. */
export const ONOMATA_MINON: readonly string[] = Object.freeze([
  'Ιαν',
  'Φεβ',
  'Μαρ',
  'Απρ',
  'Μαϊ',
  'Ιουν',
  'Ιουλ',
  'Αυγ',
  'Σεπ',
  'Οκτ',
  'Νοε',
  'Δεκ',
]);

/** Οι τρόποι εξέτασης με την ελληνική τους ετικέτα. */
export const ETIKETES_TROPON: Readonly<Record<TroposExetasis, string>> = Object.freeze({
  anoixta_vivlia: 'Ανοιχτά βιβλία',
  kleista_vivlia: 'Κλειστά βιβλία',
  polapli_epilogi_arnitiki: 'Πολλαπλής επιλογής (αρνητική)',
  ergasia: 'Εργασία',
});

/** Όλοι οι τρόποι εξέτασης του συμβολαίου, σε σταθερή σειρά εμφάνισης. */
export const TROPOI_EXETASIS: readonly TroposExetasis[] = Object.freeze([
  'anoixta_vivlia',
  'kleista_vivlia',
  'polapli_epilogi_arnitiki',
  'ergasia',
]);
