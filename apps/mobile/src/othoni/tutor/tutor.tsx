import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import { Pilegma, OloniKatastasis, ProskelesioOmonimas } from '../../koinima/index.js';
import { fortosi, etimo, type Katastasi } from '../../kathstasi/index.js';
import { xoris_katastasi } from '../../kathstasi/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import type { Periballon } from '../../periballon/index.js';
import {
  fortose_synomilia_apo_apothiki,
  fortose_xartis_apo_apothiki,
} from '../../ypiresies/index.js';
import type { Enotita, XartisMathimatos } from '@dps/core';

/** Η απάντηση-φράγκος του tutor όταν δεν υπάρχει τεκμηρίωση στο υλικό. */
export const APANTISI_YPARXEIS_STO_YLIKO = 'Δεν υπάρχει στο υλικό';

/** Χρόνος εικονικής «σκέψης» του tutor πριν την απάντηση, ώστε η αναμονή να είναι ορατή. */
export const KATHYSTERISI_APANTISIS_MS = 420;

/** Ένα γράμμα της ιστορικής συνομιλίας, είτε ερώτημα είτε απάντηση. */
export interface GrammiImerrologiou {
  readonly rolos: 'xristis' | 'tutor';
  readonly keimeno: string;
}

/** Ιδιότητες του context του tutor: η ενεργή ενότητα και το πρώτο γράμμα. */
export interface KontekstoTutor {
  readonly enotita: Enotita | null;
  readonly arxikes_grammata: readonly GrammiImerrologiou[];
}

/** Μία ερώτηση του διαδραστικού Quiz μαθήματος. */
export interface ErotisiQuiz {
  readonly id: string;
  readonly kodikosMathimatos: string;
  readonly enotitaId?: string;
  readonly erotisi: string;
  readonly epiloges: readonly string[];
  readonly sostiEpilogi: 'A' | 'B' | 'Γ' | 'Δ';
  readonly sostiPerigrafi: string;
  readonly epexigisi: string;
  readonly parapompi: string;
}

/** Ιδιότητες μιας ψεύτικης απάντησης του tutor και των λέξεων-κλειδιών της. */
interface ApantisiPseudos {
  readonly kleidi: readonly string[];
  readonly keimeno: string;
}

/** Επιλογές γρήγορης ενέργειας (Quick Action Bar) πάνω από το chat input. */
export const DRASEIS_TUTOR = [
  { titlos: '🎯 Quiz Μαθήματος', prompt: '🎯 Quiz Μαθήματος' },
  { titlos: '💡 Εξήγηση Ύλης', prompt: '💡 Εξήγηση Ύλης' },
  { titlos: '⚠️ SOS Εξεταστικής', prompt: '⚠️ SOS Εξεταστικής' },
  { titlos: '🧪 Λυμένη Άσκηση', prompt: '🧪 Λυμένη Άσκηση' },
] as const;

const TONI_ME_TONO: Readonly<Record<string, string>> = {
  'ά': 'α',
  'έ': 'ε',
  'ή': 'η',
  'ί': 'ι',
  'ϊ': 'ι',
  'ΐ': 'ι',
  'ό': 'ο',
  'ύ': 'υ',
  'ϋ': 'υ',
  'ΰ': 'υ',
  'ώ': 'ω',
};

/** Βάση δεδομένων ερωτήσεων Quiz ανά μάθημα και ενότητα. */
export const EROTISEIS_QUIZ: readonly ErotisiQuiz[] = [
  {
    id: 'quiz-pli201-en1',
    kodikosMathimatos: 'ΠΛΗ201',
    enotitaId: 'en-1',
    erotisi: 'Ποια είναι η ουσιαστική διαφορά μεταξύ ενός αλγορίθμου και ενός προγράμματος;',
    epiloges: [
      'A) Ο αλγόριθμος είναι η αφηρημένη μέθοδος επίλυσης, ενώ το πρόγραμμα είναι η συγκεκριμένη έκφρασή του σε γλώσσα προγραμματισμού.',
      'B) Ο αλγόριθμος εκτελείται αποκλειστικά στο υλικό, ενώ το πρόγραμμα στο λειτουργικό σύστημα.',
      'C) Δεν υφίσταται καμία διαφορά, αποτελούν ταυτόσημες έννοιες.',
      'D) Το πρόγραμμα περιλαμβάνει μόνο μαθηματικούς τύπους χωρίς εντολές ελέγχου.',
    ],
    sostiEpilogi: 'A',
    sostiPerigrafi:
      'Ο αλγόριθμος είναι η αφηρημένη μέθοδος επίλυσης, ενώ το πρόγραμμα είναι η συγκεκριμένη έκφρασή του σε γλώσσα προγραμματισμού.',
    epexigisi:
      'Ο αλγόριθμος ορίζει τα λογικά βήματα επίλυσης ανεξάρτητα από πλατφόρμα, ενώ το πρόγραμμα αποτελεί τη γραμμή κώδικα που εκτελείται από τη μηχανή.',
    parapompi: '[[arx-1: σ. 3]]',
  },
  {
    id: 'quiz-pli201-en2',
    kodikosMathimatos: 'ΠΛΗ201',
    enotitaId: 'en-2',
    erotisi: 'Στην Python, ποιο είναι το αποτέλεσμα και ο τύπος της πράξης 5 / 2;',
    epiloges: [
      'A) 2 με τύπο int',
      'B) 2.5 με τύπο float',
      'C) 2.0 με τύπο float',
      'D) TypeError κατά την εκτέλεση',
    ],
    sostiEpilogi: 'B',
    sostiPerigrafi: '2.5 με τύπο float',
    epexigisi:
      'Ο τελεστής διαίρεσης `/` στην Python 3 αποδίδει πάντα πραγματικό αριθμό (float). Για ακέραια διαίρεση χρησιμοποιείται ο τελεστής `//`.',
    parapompi: '[[arx-1: σ. 14]]',
  },
  {
    id: 'quiz-pli201-en3',
    kodikosMathimatos: 'ΠΛΗ201',
    enotitaId: 'en-3',
    erotisi: 'Τι συμβαίνει όταν η συνθήκη ενός βρόχου while παραμένει πάντα αληθής;',
    epiloges: [
      'A) Ο βρόχος τερματίζει αυτόματα μετά από 100 επαναλήψεις.',
      'B) Δημιουργείται ατέρμων βρόχος (infinite loop) και η εκτέλεση δεν προχωρά.',
      'C) Εκτελείται αυτόματα το μπλοκ else.',
      'D) Επιστρέφεται σιωπηρά η τιμή None.',
    ],
    sostiEpilogi: 'B',
    sostiPerigrafi: 'Δημιουργείται ατέρμων βρόχος (infinite loop) και η εκτέλεση δεν προχωρά.',
    epexigisi:
      'Χωρίς ανανέωση της συνθήκης ή εντολή break, ο βρόχος δεν ικανοποιεί συνθήκη εξόδου και συνεχίζει επ’ άπειρον.',
    parapompi: '[[arx-2: σ. 5]]',
  },
  {
    id: 'quiz-pli201-en4',
    kodikosMathimatos: 'ΠΛΗ201',
    enotitaId: 'en-4',
    erotisi: 'Σε μία λίστα μεγέθους len(p), ποιος είναι ο έγκυρος δείκτης του τελευταίου στοιχείου;',
    epiloges: [
      'A) len(p)',
      'B) len(p) - 1',
      'C) len(p) + 1',
      'D) 0',
    ],
    sostiEpilogi: 'B',
    sostiPerigrafi: 'len(p) - 1',
    epexigisi:
      'Οι δείκτες ξεκινούν από το 0, οπότε ένα στοιχείο με n στοιχεία έχει έγκυρους δείκτες από 0 έως n - 1.',
    parapompi: '[[arx-2: σ. 22]]',
  },
  {
    id: 'quiz-pli101-1',
    kodikosMathimatos: 'ΠΛΗ101',
    enotitaId: 'en-ds-1',
    erotisi: 'Ποια είναι η θεμελιώδης αρχή λειτουργίας της Στοίβας (Stack) και της Ουράς (Queue);',
    epiloges: [
      'A) Στοίβα: FIFO, Ουρά: LIFO',
      'B) Στοίβα: LIFO (Last-In-First-Out), Ουρά: FIFO (First-In-First-Out)',
      'C) Και οι δύο λειτουργούν με τυχαία προσπέλαση O(1)',
      'D) Και οι δύο ταξινομούν αυτόματα τα στοιχεία τους',
    ],
    sostiEpilogi: 'B',
    sostiPerigrafi: 'Στοίβα: LIFO (Last-In-First-Out), Ουρά: FIFO (First-In-First-Out)',
    epexigisi:
      'Στη στοίβα το τελευταίο εισαχθέν στοιχείο εξάγεται πρώτο (push/pop στην κορυφή), ενώ στην ουρά το πρώτο που εισήχθη εξυπηρετείται πρώτο (enqueue στο τέλος, dequeue στην αρχή).',
    parapompi: '[[arx-1: σ. 8]]',
  },
  {
    id: 'quiz-pli101-2',
    kodikosMathimatos: 'ΠΛΗ101',
    enotitaId: 'en-ds-3',
    erotisi: 'Ποια είναι η μέση χρονική πολυπλοκότητα αναζήτησης σε ένα ισοζυγισμένο Δυαδικό Δέντρο Αναζήτησης (BST);',
    epiloges: [
      'A) O(1)',
      'B) O(n)',
      'C) O(log n)',
      'D) O(n log n)',
    ],
    sostiEpilogi: 'Γ',
    sostiPerigrafi: 'O(log n)',
    epexigisi:
      'Σε κάθε επίπεδο του ισοζυγισμένου BST αποκλείεται το ήμισυ των κόμβων, άρα η αναζήτηση ολοκληρώνεται σε λογαριθμικό χρόνο O(log n).',
    parapompi: '[[arx-1: σ. 22]]',
  },
  {
    id: 'quiz-pli302-1',
    kodikosMathimatos: 'ΠΛΗ302',
    erotisi: 'Ποια ιδιότητα ACID εξασφαλίζει ότι μία συναλλαγή είτε θα εκτελεστεί πλήρως είτε δεν θα εφαρμοστεί καμία αλλαγή;',
    epiloges: [
      'A) Ατομικότητα (Atomicity)',
      'B) Συνέπεια (Consistency)',
      'C) Απομόνωση (Isolation)',
      'D) Ανθεκτικότητα (Durability)',
    ],
    sostiEpilogi: 'A',
    sostiPerigrafi: 'Ατομικότητα (Atomicity)',
    epexigisi:
      'Η Ατομικότητα (all-or-nothing) εγγυάται ότι σε περίπτωση σφάλματος πριν το commit, εκτελείται πλήρης αναίρεση (rollback).',
    parapompi: '[[arx-1: σ. 30]]',
  },
  {
    id: 'quiz-pli302-2',
    kodikosMathimatos: 'ΠΛΗ302',
    erotisi: 'Ποια είναι η κύρια διαφορά ανάμεσα στις εντολές WHERE και HAVING στην SQL;',
    epiloges: [
      'A) Το WHERE φιλτράρει γραμμές πριν την ομαδοποίηση, ενώ το HAVING φιλτράρει συγκεντρωτικές ομάδες μετά το GROUP BY.',
      'B) Το WHERE χρησιμοποιείται μόνο για αριθμητικά πεδία, ενώ το HAVING για κείμενα.',
      'C) Δεν υπάρχει διαφορά, είναι εναλλάξιμες.',
      'D) Το WHERE μπορεί να χρησιμοποιεί συναρτήσεις συνάθροισης (π.χ. SUM, COUNT).',
    ],
    sostiEpilogi: 'A',
    sostiPerigrafi: 'Το WHERE φιλτράρει γραμμές πριν την ομαδοποίηση, ενώ το HAVING φιλτράρει συγκεντρωτικές ομάδες μετά το GROUP BY.',
    epexigisi:
      'Το WHERE αξιολογείται σε επίπεδο μεμονωμένης εγγραφής, ενώ το HAVING εφαρμόζεται στα συγκεντρωτικά αποτελέσματα του GROUP BY.',
    parapompi: '[[arx-1: σ. 12]]',
  },
  {
    id: 'quiz-pli204-1',
    kodikosMathimatos: 'ΠΛΗ204',
    erotisi: 'Ποια είναι η ακολουθία των βασικών σταδίων του κλασικού κύκλου εντολής επεξεργαστή;',
    epiloges: [
      'A) Execute -> Fetch -> Decode',
      'B) Fetch (Ανάκληση) -> Decode (Αποκωδικοποίηση) -> Execute (Εκτέλεση)',
      'C) Store -> Read -> Interrupt',
      'D) Pipeline -> Cache -> Branch',
    ],
    sostiEpilogi: 'B',
    sostiPerigrafi: 'Fetch (Ανάκληση) -> Decode (Αποκωδικοποίηση) -> Execute (Εκτέλεση)',
    epexigisi:
      'Ο επεξεργαστής διαβάζει την εντολή από τη μνήμη (Fetch), την αποκωδικοποιεί στη μονάδα ελέγχου (Decode) και εκτελεί την πράξη στην ALU (Execute).',
    parapompi: '[[arx-1: σ. 9]]',
  },
  {
    id: 'quiz-pli204-2',
    kodikosMathimatos: 'ΠΛΗ204',
    erotisi: 'Ποιο είδος τοπικότητας αξιοποιεί η προσωρινή αποθήκευση πρόσφατα προσπελασμένων δεδομένων στην Cache;',
    epiloges: [
      'A) Χρονική τοπικότητα (Temporal Locality)',
      'B) Χωρική τοπικότητα (Spatial Locality)',
      'C) Δικτυακή τοπικότητα',
      'D) Σειριακή πολυπλεξία',
    ],
    sostiEpilogi: 'A',
    sostiPerigrafi: 'Χρονική τοπικότητα (Temporal Locality)',
    epexigisi:
      'Η χρονική τοπικότητα βασίζεται στην παρατήρηση ότι δεδομένα που χρησιμοποιήθηκαν πρόσφατα είναι πολύ πιθανό να ξαναχρησιμοποιηθούν σύντομα.',
    parapompi: '[[arx-1: σ. 14]]',
  },
];

const APANTISEIS_PSEDES: readonly ApantisiPseudos[] = [
  {
    kleidi: ['μεταβλητη', 'μεταβλητες', 'int', 'float', 'τυπος'],
    keimeno:
      'Μεταβλητή είναι ένα όνομα που δεσμεύει θέση στη μνήμη, και ο τύπος της (int, float, boolean) καθορίζει τι επιτρέπεται να αποθηκεύσει. Δηλώνεται μία φορά και μετά αλλάζει τιμή με εκχωρήσεις.',
  },
  {
    kleidi: ['παγιδα', 'παγιδες', 'sos'],
    keimeno:
      'Οι συχνότερες παγίδες: στην Python το 5 / 2 δεν κάνει στρογγυλό, τα δείκτες ξεκινούν από 0 και το range(1, 5) σταματά στο 4.',
  },
  {
    kleidi: ['εντολη', 'if', 'else', 'elif', 'συνθηκη'],
    keimeno:
      'Η επιλεκτική εκτέλεση if / elif / else τρέχει το πρώτο κλάδημα που ικανοποιεί τη συνθήκη. Δύο ανεξάρτητα if δεν κάνουν «αλλιώς»· γι’ αυτό υπάρχει το elif.',
  },
  {
    kleidi: ['βροχο', 'while', 'for', 'επαναληψη'],
    keimeno:
      'Ο while επαναλαμβάνει όσο η συνθήκη κρατάει, ο for όσο διατρέχει μια ακολουθία. Χωρίς αρχικοποίηση ή επαύξηση της συνθήκης ο βρόχος δεν τερματίζει ποτέ.',
  },
  {
    kleidi: ['πινακ', 'array', 'δεικτη', 'δεικτες'],
    keimeno:
      'Ο πίνακας αποθηκεύει στοιχεία ίδιου τύπου με συνεχείς δείκτες από το 0, οπότε ο τελευταίος έχει τιμή len(p) - 1.',
  },
  {
    kleidi: ['συναρτησ', 'function', 'return'],
    keimeno:
      'Η συνάρτηση δέχεται παραμέτρους και επιστρέφει τιμή με return. Χωρίς return επιστρέφει None, και οι μεταβλητές μέσα της είναι τοπικές.',
  },
  {
    kleidi: ['αλγοριθμ', 'διαδρομη εκτελεσης', 'προγραμμ'],
    keimeno:
      'Ο αλγόριθμος είναι η ιδέα της λύσης και το πρόγραμμα η γραμμή κώδικα που την εκφράζει. Η διαδρομή εκτέλεσης είναι η σειρά των εντολών όπως τρέχουν πραγματικά.',
  },
  {
    kleidi: ['αυτοελεγχο', 'εξετασ', 'τελικη'],
    keimeno:
      'Ο αυτοέλεγχος έχει 3–5 ερωτήσεις με κρυφές απαντήσεις. Κάθε απάντηση παραπέμπει στη σελίδα της πηγής, ώστε να ελέγχεται στο υλικό.',
  },
  {
    kleidi: ['στοιβα', 'stack', 'lifo', 'push', 'pop'],
    keimeno:
      'Η Στοίβα (Stack) είναι δομή LIFO (Last-In-First-Out) όπου η εισαγωγή (push) και η εξαγωγή (pop) εκτελούνται στην κορυφή σε χρόνο O(1). [[arx-1: σ. 8]]',
  },
  {
    kleidi: ['ουρα', 'queue', 'fifo', 'enqueue', 'dequeue'],
    keimeno:
      'Η Ουρά (Queue) είναι δομή FIFO (First-In-First-Out) όπου η εισαγωγή (enqueue) γίνεται στο τέλος και η εξαγωγή (dequeue) στην αρχή σε χρόνο O(1). [[arx-1: σ. 12]]',
  },
  {
    kleidi: ['δεντρ', 'tree', 'bst', 'δυαδικο'],
    keimeno:
      'Το Δυαδικό Δέντρο Αναζήτησης (BST) περιέχει κόμβους όπου το αριστερό παιδί έχει μικρότερο κλειδί και το δεξί μεγαλύτερο. Αναζήτηση σε μέσο χρόνο O(log n). [[arx-1: σ. 22]]',
  },
  {
    kleidi: ['διασυνδεδεμεν', 'linked list', 'κομβο'],
    keimeno:
      'Η διασυνδεδεμένη λίστα αποτελείται από κόμβους με δείκτες. Επιτρέπει δυναμική δέσμευση και εισαγωγή/διαγραφή στην αρχή σε χρόνο O(1). [[arx-1: σ. 5]]',
  },
  {
    kleidi: ['πολυπλοκοτητ', 'big o', 'o(n)', 'o(1)'],
    keimeno:
      'Η ασυμπτωτική πολυπλοκότητα Big-O εκφράζει το άνω φράγμα αύξησης του χρόνου εκτέλεσης ή μνήμης σε συνάρτηση με το μέγεθος n των δεδομένων εισόδου. [[arx-1: σ. 15]]',
  },
  {
    kleidi: ['sql', 'select', 'query'],
    keimeno:
      'Η SQL είναι δηλωτική γλώσσα ερωτημάτων σχεσιακών βάσεων. Η εντολή SELECT...FROM...WHERE φιλτράρει και ανακτά γραμμές που ικανοποιούν κριτήρια. [[arx-1: σ. 10]]',
  },
  {
    kleidi: ['join', 'inner join', 'left join'],
    keimeno:
      'Η πράξη JOIN συνδέει εγγραφές από δύο ή περισσότερους πίνακες βάσει συσχετιζόμενων πεδίων πρωτεύοντος και ξένου κλειδιού. [[arx-1: σ. 18]]',
  },
  {
    kleidi: ['πρωτευον', 'primary key', 'foreign key'],
    keimeno:
      'Το Πρωτεύον Κλειδί ταυτοποιεί μοναδικά κάθε εγγραφή (απαγορεύεται NULL), ενώ το Ξένο Κλειδί εξασφαλίζει αναφορική ακεραιότητα μεταξύ πινάκων. [[arx-1: σ. 7]]',
  },
  {
    kleidi: ['κανονικοποιησ', '1nf', '2nf', '3nf'],
    keimeno:
      'Η κανονικοποίηση εξαλείφει τον πλεονασμό δεδομένων και προλαμβάνει ανωμαλίες εισαγωγής, ενημέρωσης και διαγραφής μέσω διάσπασης πινάκων. [[arx-1: σ. 25]]',
  },
  {
    kleidi: ['acid', 'συναλλαγ', 'transaction'],
    keimeno:
      'Οι ιδιότητες ACID εγγυώνται: Ατομικότητα (Atomicity), Συνέπεια (Consistency), Απομόνωση (Isolation) και Ανθεκτικότητα (Durability) των συναλλαγών. [[arx-1: σ. 30]]',
  },
  {
    kleidi: ['cpu', 'επεξεργαστ', 'alu', 'καταχωρητ'],
    keimeno:
      'Η CPU περιλαμβάνει την ALU για υπολογισμούς, τη Μονάδα Ελέγχου και τους Καταχωρητές (Registers) για ταχύτατη αποθήκευση εντολών και δεικτών. [[arx-1: σ. 4]]',
  },
  {
    kleidi: ['cache', 'κρυφη μνημη', 'l1', 'l2'],
    keimeno:
      'Η μνήμη Cache είναι γρήγορη μνήμη SRAM που μειώνει την καθυστέρηση προσπέλασης δεδομένων από την κεντρική μνήμη RAM εκμεταλλευόμενη την τοπικότητα. [[arx-1: σ. 14]]',
  },
  {
    kleidi: ['κυκλος εντολης', 'fetch', 'decode', 'execute'],
    keimeno:
      'Ο κύκλος εντολής περιλαμβάνει: Ανάκληση (Fetch από μνήμη), Αποκωδικοποίηση (Decode από μονάδα ελέγχου) και Εκτέλεση (Execute από την ALU). [[arx-1: σ. 9]]',
  },
  {
    kleidi: ['assembly', 'mips'],
    keimeno:
      'Η γλώσσα Assembly παρέχει συμβολική έκφραση της γλώσσας μηχανής, όπου κάθε εντολή (π.χ. add, lw, beq στο MIPS) αντιστοιχεί σε συγκεκριμένη λειτουργία υλικού. [[arx-1: σ. 20]]',
  },
];

/** Κανονικοποιεί ελληνικό κείμενο σε μικρά γράμματα χωρίς τόνους, για ανθεκτική αντιστοίχιση. */
export function kanonikopoiei(keimeno: string): string {
  return keimeno
    .toLowerCase()
    .replaceAll('ς', 'σ')
    .split('')
    .map((char) => TONI_ME_TONO[char] ?? char)
    .join('');
}

/** Βρίσκει την ενότητα του χάρτη με όρους αντιστοίχισης ανθεκτικούς σε τόνους και κενά. */
export function enotita_apo_xarti(xartis: XartisMathimatos, enotita_id: string): Enotita | null {
  const zitoumeni = kanonikopoiei(enotita_id).trim();
  if (zitoumeni === '') {
    return null;
  }
  return xartis.enotites.find((katixeino) => kanonikopoiei(katixeino.id) === zitoumeni) ?? null;
}

/** Το χαιρετιστήριο γράμμα του tutor για την ενότητα και το μάθημα. */
export function xairetisma_tutor(
  enotita: Enotita | null,
  kodikosMathimatos?: string
): GrammiImerrologiou {
  const anafMathimatos = kodikosMathimatos ? `του μαθήματος ${kodikosMathimatos}` : 'του μαθήματος';
  const skeinos =
    enotita === null
      ? `το μάθημα${kodikosMathimatos ? ` (${kodikosMathimatos})` : ''}`
      : `την ενότητα «${enotita.titlos}» ${anafMathimatos}`;
  return {
    rolos: 'tutor',
    keimeno: `Γεια σου, ρώτα με γλώσσα του μαθήματος για ${skeinos}. Αν κάτι δεν τεκμηριώνεται στο υλικό, θα το πω.`,
  };
}

/** Ελέγχει εάν το κείμενο αποτελεί αίτημα έναρξης Quiz. */
export function einai_aitima_quiz(keimeno: string): boolean {
  const k = kanonikopoiei(keimeno).trim();
  return (
    k.includes('quiz') ||
    k.includes('κουιζ') ||
    k.includes('εξετασε με') ||
    k.includes('τεστ') ||
    k.includes('εξεταση')
  );
}

/** Αναγνωρίζει αν το κείμενο του χρήστη αποτελεί επιλογή απάντησης πολλαπλής επιλογής (A, B, C/Γ, D/Δ). */
export function entopise_epilogi_apantisis(keimeno: string): 'A' | 'B' | 'Γ' | 'Δ' | null {
  const k = kanonikopoiei(keimeno).trim();
  if (k === 'α' || k === 'a' || k.startsWith('επιλογη α') || k.startsWith('α)') || k.startsWith('α.')) {
    return 'A';
  }
  if (k === 'β' || k === 'b' || k.startsWith('επιλογη β') || k.startsWith('β)') || k.startsWith('β.')) {
    return 'B';
  }
  if (k === 'γ' || k === 'c' || k.startsWith('επιλογη γ') || k.startsWith('γ)') || k.startsWith('γ.')) {
    return 'Γ';
  }
  if (k === 'δ' || k === 'd' || k.startsWith('επιλογη δ') || k.startsWith('δ)') || k.startsWith('δ.')) {
    return 'Δ';
  }
  return null;
}

/** Επιλέγει την καταλληλότερη ερώτηση Quiz για το ενεργό μάθημα και ενότητα. */
export function pare_erotisi_quiz(kodikosMathimatos?: string, enotitaId?: string): ErotisiQuiz {
  const katharisKodikos = (kodikosMathimatos ?? 'ΠΛΗ201').trim();
  if (enotitaId !== undefined && enotitaId.trim() !== '') {
    const vrethikeEnotitas = EROTISEIS_QUIZ.find(
      (q) => q.kodikosMathimatos === katharisKodikos && q.enotitaId === enotitaId
    );
    if (vrethikeEnotitas !== undefined) {
      return vrethikeEnotitas;
    }
  }
  const vrethikeMathimatos = EROTISEIS_QUIZ.find((q) => q.kodikosMathimatos === katharisKodikos);
  if (vrethikeMathimatos !== undefined) {
    return vrethikeMathimatos;
  }
  return {
    id: `quiz-${katharisKodikos}-dyn`,
    kodikosMathimatos: katharisKodikos,
    erotisi: `Ποιος είναι ο βασικός στόχος μελέτης και η κεντρική μεθοδολογία στο μάθημα ${katharisKodikos};`,
    epiloges: [
      'A) Η ουσιαστική κατανόηση των θεμελιωδών εννοιών και η πρακτική εφαρμογή στην επίλυση προβλημάτων.',
      'B) Η αποστήθιση κειμένων χωρίς κατανόηση της θεωρίας.',
      'Γ) Η αποφυγή εκτέλεσης πρακτικών ασκήσεων και εργαστηρίων.',
      'Δ) Η επιφανειακή ανάγνωση χωρίς εξάσκηση.',
    ],
    sostiEpilogi: 'A',
    sostiPerigrafi: 'Η ουσιαστική κατανόηση των θεμελιωδών εννοιών και η πρακτική εφαρμογή στην επίλυση προβλημάτων.',
    epexigisi: `Στο μάθημα ${katharisKodikos}, η κατανόηση της θεωρίας σε συνδυασμό με την πρακτική εξάσκηση εξασφαλίζουν την πλήρη ετοιμότητα για την εξεταστική.`,
    parapompi: '[[arx-1: σ. 1]]',
  };
}

/** Μορφοποιεί την ερώτηση Quiz για την οθόνη του Tutor. */
export function diamorfose_erotisi_quiz(
  q: ErotisiQuiz,
  kodikosMathimatos?: string,
  enotitaTitlos?: string
): string {
  const perigrafi = enotitaTitlos
    ? `(${kodikosMathimatos ?? q.kodikosMathimatos} - ${enotitaTitlos})`
    : `(${kodikosMathimatos ?? q.kodikosMathimatos})`;
  return [
    `🎯 Quiz Μαθήματος ${perigrafi}`,
    '',
    `Ερώτηση: ${q.erotisi}`,
    '',
    ...q.epiloges,
    '',
    '👉 Απάντησε με το γράμμα της επιλογής σου (Α, Β, Γ, Δ).',
  ].join('\n');
}

/** Αξιολογεί την απάντηση του χρήστη στο ενεργό Quiz. */
export function axiologise_quiz(q: ErotisiQuiz, epilogi: 'A' | 'B' | 'Γ' | 'Δ'): string {
  if (epilogi === q.sostiEpilogi) {
    return [
      `✅ Σωστά! (Επιλογή ${q.sostiEpilogi})`,
      '',
      `💡 Ανάλυση: ${q.epexigisi}`,
      '📊 Σκορ: 1/1 (100%)',
      `📖 Τεκμηρίωση: ${q.parapompi}`,
    ].join('\n');
  }
  return [
    '❌ Λάθος απάντηση.',
    '',
    `Η σωστή επιλογή είναι η ${q.sostiEpilogi}: ${q.sostiPerigrafi}`,
    `💡 Ανάλυση: ${q.epexigisi}`,
    '📊 Σκορ: 0/1 (0%)',
    `📖 Τεκμηρίωση: ${q.parapompi}`,
  ].join('\n');
}

/** Επιστρέφει την κατάλληλη απάντηση για τα κουμπιά γρήγορης ενέργειας (Quick Actions). */
export function apantisi_drasis(
  typosDrasis: string,
  kodikosMathimatos?: string,
  enotitaTitlos?: string
): string {
  const kodikos = (kodikosMathimatos ?? 'ΠΛΗ201').trim();
  const k = kanonikopoiei(typosDrasis);

  if (k.includes('εξηγηση') || k.includes('υλη')) {
    if (kodikos === 'ΠΛΗ101') {
      return '💡 Σύνοψη Ύλης ΠΛΗ101 (Δομές Δεδομένων):\nΓραμμικές δομές (λίστες, στοίβες LIFO, ουρές FIFO), ιεραρχικές δομές (δέντρα BST), αλγόριθμοι αναζήτησης/ταξινόμησης και ασυμπτωτική ανάλυση Big-O. [[arx-1: σ. 1–30]]';
    }
    if (kodikos === 'ΠΛΗ302') {
      return '💡 Σύνοψη Ύλης ΠΛΗ302 (Βάσεις Δεδομένων):\nΣχεσιακό μοντέλο, σχεδιασμός ERD, γλώσσα SQL (DDL/DML, JOINs, aggregations), κανονικοποίηση 1NF–3NF και συναλλαγές ACID. [[arx-1: σ. 1–30]]';
    }
    if (kodikos === 'ΠΛΗ204') {
      return '💡 Σύνοψη Ύλης ΠΛΗ204 (Αρχιτεκτονική Υπολογιστών):\nΑρχιτεκτονική von Neumann, οργάνωση CPU (ALU, καταχωρητές), ιεραρχία Cache/RAM, κύκλος εντολής Fetch-Decode-Execute και assembly MIPS. [[arx-1: σ. 1–25]]';
    }
    return `💡 Σύνοψη Ύλης ΠΛΗ201 (Προγραμματισμός):\nΒασικές αρχές: αλγόριθμοι, μεταβλητές & τύποι (int, float, bool), έλεγχος ροής (if, while, for), και δομές συναρτήσεων με παραμέτρους και return. ${
      enotitaTitlos ? `Ενεργή ενότητα: «${enotitaTitlos}».` : ''
    } [[arx-1: σ. 1–28]]`;
  }

  if (
    k.includes('sos εξεταστικης') ||
    (k.includes('sos') && (k.includes('εξετασ') || k.includes('εξεταστικ')))
  ) {
    if (kodikos === 'ΠΛΗ101') {
      return '⚠️ SOS Παγίδες Εξεταστικής (ΠΛΗ101):\nΟι συχνότερες παγίδες:\n1. Διαφορά LIFO (στοίβα) και FIFO (ουρά) στις push/pop και enqueue/dequeue.\n2. Χρόνος διαγραφής σε λίστα: O(1) με δείκτη, O(n) με αναζήτηση.\n3. Σε μη-ισοζυγισμένο BST η αναζήτηση εκφυλίζεται σε O(n).\n4. Υπερχείλιση στοίβας (stack overflow) σε αναδρομή χωρίς τερματισμό. [[arx-1: σ. 15]]';
    }
    if (kodikos === 'ΠΛΗ302') {
      return '⚠️ SOS Παγίδες Εξεταστικής (ΠΛΗ302):\nΟι συχνότερες παγίδες:\n1. Χρήση WHERE vs HAVING: το WHERE δεν δέχεται συναθροίσεις.\n2. Διαφορά INNER JOIN vs LEFT JOIN όταν υπάρχουν εγγραφές χωρίς ταίριασμα.\n3. Παραβίαση αναφορικής ακεραιότητας κατά τη διαγραφή γονέα.\n4. Κανονικοποίηση 2NF (πλήρης εξάρτηση) vs 3NF (χωρίς μεταβατική εξάρτηση). [[arx-1: σ. 20]]';
    }
    if (kodikos === 'ΠΛΗ204') {
      return '⚠️ SOS Παγίδες Εξεταστικής (ΠΛΗ204):\nΟι συχνότερες παγίδες:\n1. Χρόνος CPU: CPU Time = IC × CPI × Clock Cycle Time.\n2. Διαφορά χωρικής και χρονικής τοπικότητας στις κρυφές μνήμες.\n3. Hazards σε pipeline επεξεργαστή (data, control, structural hazards).\n4. Εντολές άλματος Assembly (beq, bne) και υπολογισμός διεύθυνσης. [[arx-1: σ. 18]]';
    }
    return '⚠️ SOS Παγίδες Εξεταστικής (ΠΛΗ201):\nΟι συχνότερες παγίδες: στην Python το 5 / 2 δεν κάνει στρογγυλό, τα δείκτες ξεκινούν από 0 και το range(1, 5) σταματά στο 4. [[arx-1: σ. 10]]';
  }

  if (k.includes('ασκησ') || k.includes('παραδειγμ')) {
    if (kodikos === 'ΠΛΗ101') {
      return '🧪 Λυμένη Άσκηση (ΠΛΗ101):\nΠρόβλημα: Έλεγχος ισορροπημένων παρενθέσεων με Στοίβα.\nΑλγόριθμος: Κάθε άνοιγμα «(» εισάγεται με push. Κάθε κλείσιμο «)» αφαιρεί με pop. Εάν η στοίβα είναι κενή κατά το pop ή μη-κενή στο τέλος, η έκφραση είναι άκυρη. Χρόνος O(n), χώρος O(n). [[arx-1: σ. 9]]';
    }
    if (kodikos === 'ΠΛΗ302') {
      return '🧪 Λυμένη Άσκηση (ΠΛΗ302):\nΠρόβλημα: Εύρεση τμημάτων με μέσο όρο βαθμολογίας > 8.\nΕρώτημα SQL:\nSELECT tmima, AVG(vathmos) AS mo\nFROM foitites\nGROUP BY tmima\nHAVING AVG(vathmos) > 8.0;\nΕπεξήγηση: Το GROUP BY ομαδοποιεί και το HAVING φιλτράρει το συγκεντρωτικό αποτέλεσμα. [[arx-1: σ. 14]]';
    }
    if (kodikos === 'ΠΛΗ204') {
      return '🧪 Λυμένη Άσκηση (ΠΛΗ204):\nΠρόβλημα: Υπολογισμός ποσοστού Cache Hit.\nΔεδομένα: Σε 1000 προσπελάσεις μνήμης, οι 950 εξυπηρετούνται από την Cache.\nΛύση: Hit Rate = 950 / 1000 = 95%. Miss Rate = 100% - 95% = 5%. AMAT = Hit Time + (Miss Rate × Miss Penalty). [[arx-1: σ. 16]]';
    }
    return '🧪 Λυμένη Άσκηση (ΠΛΗ201):\nΠρόβλημα: Υπολογισμός αθροίσματος ζυγών αριθμών σε λίστα.\nΚώδικας:\ndef athroisma_zygon(arithmoi):\n    synolo = 0\n    for arithmos in arithmoi:\n        if arithmos % 2 == 0:\n            synolo += arithmos\n    return synolo\nΕπεξήγηση: Ο βρόχος διατρέχει τα στοιχεία και το if ελέγχει το υπόλοιπο διαίρεσης με το 2. [[arx-1: σ. 21]]';
  }

  return APANTISI_YPARXEIS_STO_YLIKO;
}

/** Δίνει την απάντηση του tutor· χωρίς αντιστοίχιση επιστρέφει ακριβώς «Δεν υπάρχει στο υλικό». */
export function apantisa_tutor(
  erotisi: string,
  konteksto?: {
    readonly kodikosMathimatos?: string | undefined;
    readonly enotitaId?: string | undefined;
    readonly enotitaTitlos?: string | undefined;
  }
): string {
  const zitoumeni = kanonikopoiei(erotisi).trim();
  if (zitoumeni === '') {
    return APANTISI_YPARXEIS_STO_YLIKO;
  }

  if (einai_aitima_quiz(zitoumeni)) {
    const q = pare_erotisi_quiz(konteksto?.kodikosMathimatos, konteksto?.enotitaId);
    return diamorfose_erotisi_quiz(q, konteksto?.kodikosMathimatos, konteksto?.enotitaTitlos);
  }

  const drasi = apantisi_drasis(zitoumeni, konteksto?.kodikosMathimatos, konteksto?.enotitaTitlos);
  if (drasi !== APANTISI_YPARXEIS_STO_YLIKO) {
    return drasi;
  }

  for (const apantisi of APANTISEIS_PSEDES) {
    for (const kleidi of apantisi.kleidi) {
      if (zitoumeni.includes(kanonikopoiei(kleidi))) {
        return apantisi.keimeno;
      }
    }
  }

  return APANTISI_YPARXEIS_STO_YLIKO;
}

/**
 * Συνδυάζει την αξιολόγηση quiz, τον έλεγχο του LLM Port (Hardware Vault / API key / MockLlm)
 * και την εφεδρική τοπική μηχανή τεκμηριωμένης συλλογιστικής (Grounded Reasoning Engine).
 */
export async function apantisi_me_llm_i_topika(
  erotisi: string,
  periballon: Periballon,
  kodikosMathimatos: string,
  enotita: Enotita | null,
  ekremesQuiz: ErotisiQuiz | null,
  istoriko: readonly GrammiImerrologiou[]
): Promise<{ readonly keimeno: string; readonly neoQuiz: ErotisiQuiz | null }> {
  const katharis = erotisi.trim();

  // 1. Εάν υπάρχει ενεργό quiz σε αναμονή, ελέγχουμε αν ο χρήστης έδωσε επιλογή απάντησης
  if (ekremesQuiz !== null) {
    const epilogi = entopise_epilogi_apantisis(katharis);
    if (epilogi !== null) {
      return {
        keimeno: axiologise_quiz(ekremesQuiz, epilogi),
        neoQuiz: null,
      };
    }
  }

  // 2. Εάν ζητήθηκε έναρξη Quiz (είτε με κουμπί είτε με κείμενο «quiz», «κουιζ», «τεστ», «εξετασε με»)
  if (einai_aitima_quiz(katharis)) {
    const neoQ = pare_erotisi_quiz(kodikosMathimatos, enotita?.id);
    return {
      keimeno: diamorfose_erotisi_quiz(neoQ, kodikosMathimatos, enotita?.titlos),
      neoQuiz: neoQ,
    };
  }

  // 3. Εάν είναι εντολή Quick Action (Εξήγηση Ύλης, SOS, Λυμένη Άσκηση)
  const drasiApantisi = apantisi_drasis(katharis, kodikosMathimatos, enotita?.titlos);
  if (drasiApantisi !== APANTISI_YPARXEIS_STO_YLIKO) {
    return {
      keimeno: drasiApantisi,
      neoQuiz: null,
    };
  }

  // 4. Σύνδεση με το LLM Port (Hardware Vault & LLM Gate)
  let kleidiVault: string | null = null;
  try {
    kleidiVault = await periballon.mystika.pare('llm_api_key');
  } catch {
    kleidiVault = null;
  }
  const exeiVaultKleidi = Boolean(kleidiVault && kleidiVault.trim().length > 0);

  try {
    const apotelesmaLlm = await periballon.llm.parage_keimeno({
      systima: `Είσαι ο αυστηρός ακαδημαϊκός Tutor του μαθήματος ${kodikosMathimatos}${
        enotita ? ` (ενότητα: ${enotita.titlos})` : ''
      }. Απαντάς ΜΟΝΟ από το υλικό του μαθήματος με ακριβείς παραπομπές [[arx-X: σ. Y]]. Αν η ερώτηση δεν τεκμηριώνεται στο υλικό, απάντησε ακριβώς: «${APANTISI_YPARXEIS_STO_YLIKO}».`,
      minimata: [
        ...istoriko.map((g) => ({
          rolos: g.rolos === 'xristis' ? ('xristis' as const) : ('montelo' as const),
          keimeno: g.keimeno,
        })),
        { rolos: 'xristis' as const, keimeno: katharis },
      ],
      ekdosi_prompt: 'tutor-v2',
      thermokrasia: 0.2,
    });

    if (apotelesmaLlm.ok) {
      const keimenoLlm = apotelesmaLlm.timi.trim();
      const einaiDefaultMock = keimenoLlm.startsWith('Mocked response for prompt v');
      if (exeiVaultKleidi || !einaiDefaultMock) {
        return {
          keimeno: keimenoLlm,
          neoQuiz: null,
        };
      }
    }
  } catch {
    // Σφάλμα ή αποσύνδεση LLM -> μετάπτωση στη grounded reasoning engine
  }

  // 5. Τοπική μηχανή τεκμηριωμένης συλλογιστικής (Local Grounded Reasoning Engine)
  const topiki = apantisa_tutor(katharis, {
    kodikosMathimatos,
    enotitaId: enotita?.id,
    enotitaTitlos: enotita?.titlos,
  });

  return {
    keimeno: topiki,
    neoQuiz: null,
  };
}

/** Συνομιλία με τον tutor: ιστορικό από τα αρχεία, ορατή αναμονή και κανόνας «Δεν υπάρχει στο υλικό». */
export default function TutorChat() {
  const [parametroi] = useSearchParams();
  const enotitaId = parametroi.get('enotita') ?? '';
  const periballon = xrisiPeriballontos();
  const { kodikosMathimatos } = xrisiApothekisis();
  const [katastasi, setKatastasi] = useState<Katastasi<KontekstoTutor>>(fortosi());
  const [exomena, setExomena] = useState<readonly GrammiImerrologiou[]>([]);
  const [trima, setTrima] = useState('');
  const [apostolto, setApostolto] = useState(false);
  const ekremesQuiz = useRef<ErotisiQuiz | null>(null);
  const alive = useRef(true);
  const xronologia = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    alive.current = true;
    setKatastasi(fortosi<KontekstoTutor>());
    setExomena([]);
    void (async () => {
      const energosKodikos = kodikosMathimatos.trim() || 'ΠΛΗ201';
      const xartis = await fortose_xartis_apo_apothiki(periballon.apothiki, energosKodikos);
      const dedomenaXarti = xoris_katastasi(xartis);
      const enotita = dedomenaXarti === undefined ? null : enotita_apo_xarti(dedomenaXarti, enotitaId);
      const istoriko = await fortose_synomilia_apo_apothiki(
        periballon.apothiki,
        energosKodikos,
        enotitaId
      );
      if (!alive.current) {
        return;
      }
      setKatastasi(
        etimo<KontekstoTutor>({
          enotita,
          arxikes_grammata:
            istoriko.length > 0 ? istoriko : [xairetisma_tutor(enotita, energosKodikos)],
        })
      );
    })();
    return () => {
      alive.current = false;
      for (const xronos of xronologia.current) {
        clearTimeout(xronos);
      }
      xronologia.current = [];
    };
  }, [periballon.apothiki, kodikosMathimatos, enotitaId]);

  const apostoli_erotisi = (keimenoApostolis?: string | unknown): void => {
    const keimeno = typeof keimenoApostolis === 'string' ? keimenoApostolis : trima;
    const katharis = keimeno.trim();
    if (apostolto || katharis === '') {
      return;
    }
    setExomena((palia) => [...palia, { rolos: 'xristis', keimeno: katharis }]);
    if (typeof keimenoApostolis !== 'string') {
      setTrima('');
    }
    setApostolto(true);
    const xronos = setTimeout(() => {
      void (async () => {
        if (!alive.current) {
          return;
        }
        const energosKodikos = kodikosMathimatos.trim() || 'ΠΛΗ201';
        const apantisi = await apantisi_me_llm_i_topika(
          katharis,
          periballon,
          energosKodikos,
          enotita,
          ekremesQuiz.current,
          exomena
        );
        if (!alive.current) {
          return;
        }
        ekremesQuiz.current = apantisi.neoQuiz;
        setExomena((palia) => [
          ...palia,
          { rolos: 'tutor', keimeno: apantisi.keimeno },
        ]);
        setApostolto(false);
      })();
    }, KATHYSTERISI_APANTISIS_MS);
    xronologia.current.push(xronos);
  };

  const enotita = xoris_katastasi(katastasi)?.enotita ?? null;
  const pilegmaEnotitas = `Ενότητα: ${enotita?.titlos ?? (enotitaId.length > 0 ? enotitaId : 'γενικά')}`;

  return (
    <div className="episkefsi" data-testid="tutor-ekran">
      <ProskelesioOmonimas
        titlos="Tutor"
        ypokeimeno="Απαντά μόνο από το υλικό του μαθήματος."
        akseis={<Pilegma keimeno={pilegmaEnotitas} entono />}
      />
      <OloniKatastasis katastasi={katastasi} adeioMinima="Δεν υπάρχει ακόμη συνομιλία.">
        {(konteksto) => (
          <>
            <div className="imerologia" data-testid="tutor-imerologia">
              {[...konteksto.arxikes_grammata, ...exomena].map((gramma, thesi) => (
                <div
                  key={`${thesi}-${gramma.keimeno}`}
                  className={
                    gramma.rolos === 'xristis'
                      ? 'imerologia-gramma imerologia-bolakia'
                      : 'imerologia-gramma imerologia-apantisi'
                  }
                >
                  {gramma.keimeno}
                </div>
              ))}
            </div>
            {apostolto && (
              <div className="katastasi-periohos" data-testid="tutor-fortisi">
                <IonSpinner name="crescent" aria-label="Ο tutor γράφει" />
                <p className="katastasi-ypokeimeno">Ο tutor γράφει…</p>
              </div>
            )}
            <div className="tutor-draseis-mpara" role="toolbar" aria-label="Γρήγορες ενέργειες tutor">
              {DRASEIS_TUTOR.map((drasis) => (
                <button
                  key={drasis.titlos}
                  type="button"
                  className="pilegma tutor-drasis-koumpi"
                  disabled={apostolto}
                  onClick={() => {
                    apostoli_erotisi(drasis.prompt);
                  }}
                >
                  {drasis.titlos}
                </button>
              ))}
            </div>
            <div className="imerologia-paixidi" data-testid="tutor-paixidi">
              <input
                className="imerologia-paixidi-gramma"
                value={trima}
                placeholder="Γράψε την ερώτησή σου…"
                aria-label="Ερώτηση για τον tutor"
                onChange={(γεγονός) => {
                  setTrima(γεγονός.target.value);
                }}
                onKeyDown={(γεγονός) => {
                  if (γεγονός.key === 'Enter') {
                    apostoli_erotisi();
                  }
                }}
              />
              <IonButton
                size="small"
                disabled={apostolto || trima.trim() === ''}
                onClick={apostoli_erotisi}
                data-testid="tutor-apomilosi"
              >
                Αποστολή
              </IonButton>
            </div>
          </>
        )}
      </OloniKatastasis>
    </div>
  );
}
