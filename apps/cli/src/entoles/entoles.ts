import type { GrammatikopoioEntolhs } from './grammatikopoio-entolhs.js';
import { trexe_analysi } from './entole-analysi.js';
import { trexe_mathimata } from './entole-mathimata.js';
import { trexe_odigos } from './entole-odigos.js';
import { trexe_panepistimia } from './entole-panepistimia.js';
import { trexe_programma } from './entole-programma.js';
import { trexe_run } from './entole-run.js';
import { trexe_sygxronismos } from './entole-sygxronismos.js';
import { trexe_syndesi } from './entole-syndesi.js';

/**
 * Ο πίνακας εντολών του CLI.
 *
 * Κάθε εγγραφή είναι το ΜΟΝΟ σημείο αλήθειας για το όνομα, τα ορίσματα και το αν
 * χρειάζεται LLM· η βοήθεια και η επικύρωση ορισμάτων παράγονται από εδώ.
 */
export const ENTOLES: readonly GrammatikopoioEntolhs[] = [
  {
    onoma: 'panepistimia',
    perigrafh: 'Λίστα υποστηριζόμενων ελληνικών πανεπιστημίων και eClass portals.',
    argia: [
      {
        onoma: 'ANAZITISI',
        upoxreitai: false,
        perigrafh: 'Όρος αναζήτησης (όνομα, ίδρυμα, πόλη ή ID).',
      },
    ],
    xreiazetai_llm: false,
    trexe: (eisodos, _parastates, ori_arg) => trexe_panepistimia(eisodos, ori_arg),
  },
  {
    onoma: 'syndesi',
    perigrafh: 'Σύνδεση με το eClass (μυστικά από το keyring ή το περιβάλλον).',
    argia: [],
    xreiazetai_llm: false,
    trexe: (eisodos) => trexe_syndesi(eisodos),
  },
  {
    onoma: 'mathimata',
    perigrafh: 'Λίστα μαθημάτων του λογαριασμού.',
    argia: [],
    xreiazetai_llm: false,
    trexe: (eisodos) => trexe_mathimata(eisodos),
  },
  {
    onoma: 'sygxronismos',
    perigrafh: 'Συγχρονισμός αρχείων ενός μαθήματος ή όλων των επιλεγμένων.',
    argia: [{ onoma: 'KODIKOS', upoxreitai: false, perigrafh: 'Κωδικός μαθήματος· χωρίς αυτόν, τα επιλεγμένα.' }],
    xreiazetai_llm: false,
    trexe: (eisodos, _parastates, ori_arg) => trexe_sygxronismos(eisodos, ori_arg),
  },
  {
    onoma: 'analysi',
    perigrafh: 'Ανάλυση μαθήματος: exagogi → perigramma → xartis → megethi.',
    argia: [{ onoma: 'KODIKOS', upoxreitai: true, perigrafh: 'Κωδικός μαθήματος.' }],
    xreiazetai_llm: true,
    trexe: (eisodos, _parastates, ori_arg) => trexe_analysi(eisodos, ori_arg),
  },
  {
    onoma: 'odigos',
    perigrafh: 'Παραγωγή (lazy) του οδηγού μιας ενότητας.',
    argia: [{ onoma: 'ENOTITA_ID', upoxreitai: true, perigrafh: 'Id ενότητας του χάρτη.' }],
    xreiazetai_llm: true,
    trexe: (eisodos, _parastates, ori_arg) => trexe_odigos(eisodos, ori_arg),
  },
  {
    onoma: 'programma',
    perigrafh: 'Πρόγραμμα μελέτης μέχρι τις εξετάσεις (Φάση 2).',
    argia: [],
    xreiazetai_llm: false,
    trexe: (eisodos) => trexe_programma(eisodos),
  },
  {
    onoma: 'run',
    perigrafh: 'Πλήρης ροή: σύνδεση, μαθήματα, συγχρονισμός, ανάλυση.',
    argia: [],
    xreiazetai_llm: true,
    trexe: (eisodos) => trexe_run(eisodos),
  },
];

/** Αναζήτηση εντολής κατά όνομα· `undefined` αν δεν υπάρχει (άγνωστη εντολή). */
export function pire_entoli(onoma: string): GrammatikopoioEntolhs | undefined {
  return ENTOLES.find((entoli) => entoli.onoma === onoma);
}

/** Λίστα με τα ονόματα όλων των εντολών, για τα μηνύματα χρήσης. */
export function onomata_entolon(): string[] {
  return ENTOLES.map((entoli) => entoli.onoma);
}
