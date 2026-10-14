import { XartisMathimatosSchema } from '@dps/core';
import type { Perigramma, XartisMathimatos } from '@dps/core';
import { EKDOSI_PROMPT_P2 } from './ekdoseis.js';
import type { AitisiPrompt } from './koines.js';
import { eksoudeterose_deiktes, enotita_se_keimeno, perivale_dedomena } from './koines.js';

const SISTIMA_P2 =
  enotita_se_keimeno('Ρόλος', [
    'Φτιάχνεις τον χάρτη του μαθήματος από περίγραμμα αρχείων. Το χάρτη είναι μια λίστα εννοτήτων με προαπαιτούμενες.',
    'Δεν διαβάζεις ποτέ πλήρες κείμενο σελίδων: σου δίνονται μόνο τίτλοι, εύρη σελίδων, έννοιες και τύποι τμημάτων.',
  ]) +
  enotita_se_keimeno('Κανόνες', [
    '- Μην επινοείς. Κάθε ενότητα στηρίζεται σε τμήματα που εμφανίζονται στα δεδομένα.',
    '- Συγχωνεύεις τμήματα από ΔΙΑΦΟΡΕΤΙΚΑ αρχεία που καλύπτουν το ίδιο θέμα σε ΜΙΑ ενότητα.',
    '- Τα piges κάθε ενότητας είναι εύρη από τα δεδομένα: arxeio_id, apo, eos. Απαγορεύεται επικάλυψη που ξεπερνάει τα όρια των δεδομένων.',
    '- Τα proapaitoumenes γράφονται με enotita_id (το id της ενότητας-προαπαιτούμενου, όχι τίτλο) και με isxys ίσο με isxyri ή asthenis.',
    '- Το proapaitoumeno χρησιμοποιείται μόνο όταν το ίδιο το υλικό δείχνει ότι η μια ενότητα χρειάζεται την άλλη.',
    '- Κάθε id ενότητας είναι ασφαλές αναγνωριστικό διαδρομής έως 128 χαρακτήρες: αρχίζει με γράμμα ή αριθμό και περιέχει μόνο γράμματα, αριθμούς, τελεία, παύλα ή κάτω παύλα. Μην χρησιμοποιείς κενά, slash, backslash, ποσοστό, query ή fragment.',
    '- Το πεδίο seira είναι μοναδικός αύξοντας ακέραιος που ξεκινάει από 1, με σεβασμό των προαπαιτούμενων.',
    '- Τα πεδία lepta_ektimisi και apodosi_exetasis παραμένουν null: τα λεπτά και η απόδοση εξετάσεων υπολογίζονται deterministic έξω από σένα.',
    `- Το πεδίο ekdosi_prompt του χάρτη παίρνει την τιμή ${EKDOSI_PROMPT_P2} και το dimiourgithike την ημερομηνία εισόδου που δίνεται παρακάτω.`,
    '- Η απάντηση πρέπει να συμμορφώνεται πλήρως με το σχήμα XartisMathimatos: kodikos_mathimatos, enotites[], ekdosi_prompt, dimiourgithike.',
    '- Η απάντηση είναι ΑΠΟΚΛΕΙΣΤΙΚΑ JSON: χωρίς Markdown, χωρίς σχόλια, χωρίς κείμενο εκτός JSON.',
  ]);

export interface EisodosXarti {
  kodikos_mathimatos: string;
  perigrammata: Perigramma[];
  dimiourgithike: string;
}

export function prompt_xarti(eisodos: EisodosXarti): AitisiPrompt<XartisMathimatos> {
  const perigrammata_se_keimeno = eisodos.perigrammata.map((p) => {
    const tmimata = p.tmimata.map(
      (t) =>
        `- τμήμα: ${t.titlos} | σελίδες: ${t.selides.apo}-${t.selides.eos} | τύπος: ${t.typos}\n  έννοιες: ${t.ennoies.join(', ')}`
    );
    return enotita_se_keimeno(`Αρχείο ${eksoudeterose_deiktes(p.arxeio_id)}`, [
      perivale_dedomena([`τίτλος: ${p.titlos}`, ...tmimata].join('\n')),
    ]);
  });

  return {
    sistima: SISTIMA_P2,
    xristis:
      enotita_se_keimeno('Μάθημα', [
        `kodikos_mathimatos: ${eisodos.kodikos_mathimatos}`,
        `dimiourgithike: ${eisodos.dimiourgithike}`,
      ]) + perigrammata_se_keimeno.join(''),
    sisma: XartisMathimatosSchema,
    ekdosi_prompt: EKDOSI_PROMPT_P2,
  };
}
