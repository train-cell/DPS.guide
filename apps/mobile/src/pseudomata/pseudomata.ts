import type { Mathima, Enotita, XartisMathimatos } from '@dps/core';

const MATHIMATA_MOCK: readonly Mathima[] = [
  {
    kodikos: 'ΠΛΗ201',
    titlos: 'Προγραμματισμός',
    url: 'https://thales.cs.unipi.gr/courses/PPLI201',
    epilegmeno: true,
    examino: '1ο Εξάμηνο',
    ects: 6,
    kathigitis: 'Καθ. Νικόλαος Γεωργίου',
    katastasi_sygxronismou: 'Συγχρονισμένο',
  },
  {
    kodikos: 'ΠΛΗ101',
    titlos: 'Δομές Δεδομένων',
    url: 'https://thales.cs.unipi.gr/courses/PPLI101',
    epilegmeno: true,
    examino: '2ο Εξάμηνο',
    ects: 6,
    kathigitis: 'Αναπλ. Καθ. Μαρία Παπαδοπούλου',
    katastasi_sygxronismou: 'Συγχρονισμένο',
  },
  {
    kodikos: 'ΠΛΗ302',
    titlos: 'Βάσεις Δεδομένων',
    url: 'https://thales.cs.unipi.gr/courses/PPLI302',
    epilegmeno: false,
    examino: '3ο Εξάμηνο',
    ects: 6,
    kathigitis: 'Καθ. Ιωάννης Δημητρίου',
    katastasi_sygxronismou: 'Εκκρεμεί',
  },
  {
    kodikos: 'ΠΛΗ204',
    titlos: 'Αρχιτεκτονική Υπολογιστών',
    url: 'https://thales.cs.unipi.gr/courses/PPLI204',
    epilegmeno: true,
    examino: '2ο Εξάμηνο',
    ects: 5,
    kathigitis: 'Επικ. Καθ. Κωνσταντίνος Αντωνίου',
    katastasi_sygxronismou: 'Συγχρονισμένο',
  },
];

const MATHIMA_MOCK: Mathima = MATHIMATA_MOCK[0]!;

const ENOTITES_MOCK: readonly Enotita[] = [
  {
    id: 'en-1',
    titlos: 'Βασικές αρχές και ιστορικό',
    piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 12 }],
    ennoies: ['διαδρομή εκτέλεσης', 'αλγόριθμος'],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 45,
    apodosi_exetasis: 2,
  },
  {
    id: 'en-2',
    titlos: 'Μεταβλητές και τύποι',
    piges: [{ arxeio_id: 'arx-1', apo: 13, eos: 28 }],
    ennoies: ['int', 'float', 'boolean'],
    proapaitoumenes: [{ enotita_id: 'en-1', isxys: 'isxyri' }],
    seira: 2,
    lepta_ektimisi: 60,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-3',
    titlos: 'Έλεγχος ροής και επανάληψη',
    piges: [{ arxeio_id: 'arx-2', apo: 1, eos: 18 }],
    ennoies: ['if', 'while', 'for'],
    proapaitoumenes: [{ enotita_id: 'en-2', isxys: 'asthenis' }],
    seira: 3,
    lepta_ektimisi: 75,
    apodosi_exetasis: 4,
  },
  {
    id: 'en-4',
    titlos: 'Πίνακες και συναρτήσεις',
    piges: [{ arxeio_id: 'arx-2', apo: 19, eos: 34 }],
    ennoies: ['array', 'function'],
    proapaitoumenes: [{ enotita_id: 'en-3', isxys: 'isxyri' }],
    seira: 4,
    lepta_ektimisi: 90,
    apodosi_exetasis: 3,
  },
] as const;

/** Οι ενότητες του μαθήματος ΠΛΗ101 — Δομές Δεδομένων. */
const ENOTITES_PLH101: readonly Enotita[] = [
  {
    id: 'en-ds-1',
    titlos: 'Στοίβες & Ουρές',
    piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 15 }],
    ennoies: ['στοίβα', 'ουρά', 'LIFO', 'FIFO', 'push', 'pop'],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 60,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-ds-2',
    titlos: 'Συνδεδεμένες Λίστες',
    piges: [{ arxeio_id: 'arx-1', apo: 16, eos: 30 }],
    ennoies: ['κόμβος', 'δείκτης', 'μονά συνδεδεμένη λίστα', 'διπλά συνδεδεμένη λίστα'],
    proapaitoumenes: [{ enotita_id: 'en-ds-1', isxys: 'asthenis' }],
    seira: 2,
    lepta_ektimisi: 75,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-ds-3',
    titlos: 'Δυαδικά Δένδρα Αναζήτησης',
    piges: [{ arxeio_id: 'arx-2', apo: 1, eos: 16 }],
    ennoies: ['δυαδικό δένδρο', 'BST', 'διάσχιση in-order', 'αναζήτηση', 'ισοζύγιση'],
    proapaitoumenes: [{ enotita_id: 'en-ds-2', isxys: 'isxyri' }],
    seira: 3,
    lepta_ektimisi: 90,
    apodosi_exetasis: 4,
  },
  {
    id: 'en-ds-4',
    titlos: 'Πίνακες Κατακερματισμού & Γράφοι',
    piges: [{ arxeio_id: 'arx-2', apo: 17, eos: 35 }],
    ennoies: ['κατακερματισμός', 'hash table', 'συγκρούσεις', 'γράφημα', 'BFS', 'DFS'],
    proapaitoumenes: [{ enotita_id: 'en-ds-3', isxys: 'asthenis' }],
    seira: 4,
    lepta_ektimisi: 90,
    apodosi_exetasis: 4,
  },
] as const;

/** Οι ενότητες του μαθήματος ΠΛΗ302 — Βάσεις Δεδομένων. */
const ENOTITES_PLH302: readonly Enotita[] = [
  {
    id: 'en-db-1',
    titlos: 'Σχεσιακό Μοντέλο & SQL',
    piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 14 }],
    ennoies: ['σχέση', 'πρωτεύον κλειδί', 'ξένο κλειδί', 'SQL', 'SELECT', 'JOIN'],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 60,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-db-2',
    titlos: 'Σχεδιασμός ER & Μετασχηματισμός',
    piges: [{ arxeio_id: 'arx-1', apo: 15, eos: 30 }],
    ennoies: ['μοντέλο ER', 'οντότητα', 'συσχέτιση', 'πληθικότητα', 'μετασχηματισμός'],
    proapaitoumenes: [{ enotita_id: 'en-db-1', isxys: 'asthenis' }],
    seira: 2,
    lepta_ektimisi: 70,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-db-3',
    titlos: 'Κανονικοποίηση',
    piges: [{ arxeio_id: 'arx-2', apo: 1, eos: 16 }],
    ennoies: ['συναρτησιακή εξάρτηση', '1NF', '2NF', '3NF', 'BCNF'],
    proapaitoumenes: [{ enotita_id: 'en-db-2', isxys: 'isxyri' }],
    seira: 3,
    lepta_ektimisi: 85,
    apodosi_exetasis: 4,
  },
  {
    id: 'en-db-4',
    titlos: 'Συναλλαγές ACID & Ευρετήρια',
    piges: [{ arxeio_id: 'arx-2', apo: 17, eos: 34 }],
    ennoies: ['ACID', 'δοσοληψία', 'σειριοποιησιμότητα', 'ευρετήριο', 'B-Tree'],
    proapaitoumenes: [{ enotita_id: 'en-db-3', isxys: 'isxyri' }],
    seira: 4,
    lepta_ektimisi: 80,
    apodosi_exetasis: 4,
  },
] as const;

/** Οι ενότητες του μαθήματος ΠΛΗ204 — Αρχιτεκτονική Υπολογιστών. */
const ENOTITES_PLH204: readonly Enotita[] = [
  {
    id: 'en-arch-1',
    titlos: 'Οργάνωση CPU & Καταχωρητές',
    piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 14 }],
    ennoies: ['CPU', 'ALU', 'CU', 'καταχωρητές', 'κύκλος εντολής'],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 55,
    apodosi_exetasis: 2,
  },
  {
    id: 'en-arch-2',
    titlos: 'Ιεραρχία Μνήμης & Caches',
    piges: [{ arxeio_id: 'arx-1', apo: 15, eos: 30 }],
    ennoies: ['κρυφή μνήμη', 'L1/L2 cache', 'χρονική τοπικότητα', 'χωρική τοπικότητα', 'αστοχία cache'],
    proapaitoumenes: [{ enotita_id: 'en-arch-1', isxys: 'isxyri' }],
    seira: 2,
    lepta_ektimisi: 75,
    apodosi_exetasis: 3,
  },
  {
    id: 'en-arch-3',
    titlos: 'Pipelining & Hazards',
    piges: [{ arxeio_id: 'arx-2', apo: 1, eos: 16 }],
    ennoies: ['διοχέτευση', 'βαθμίδες εντολής', 'structural hazard', 'data hazard', 'control hazard'],
    proapaitoumenes: [{ enotita_id: 'en-arch-2', isxys: 'asthenis' }],
    seira: 3,
    lepta_ektimisi: 90,
    apodosi_exetasis: 4,
  },
  {
    id: 'en-arch-4',
    titlos: 'Σύνολο Εντολών',
    piges: [{ arxeio_id: 'arx-2', apo: 17, eos: 32 }],
    ennoies: ['ISA', 'RISC', 'CISC', 'μορφές εντολών', 'τρόποι διευθυνσιοδότησης'],
    proapaitoumenes: [{ enotita_id: 'en-arch-3', isxys: 'isxyri' }],
    seira: 4,
    lepta_ektimisi: 70,
    apodosi_exetasis: 3,
  },
] as const;

/** Επιστρέφει τον χάρτη ενοτήτων για οποιοδήποτε από τα 4 δηλωμένα μαθήματα, με προεπιλογή το ΠΛΗ201. */
export function pare_xarti_mathimatos(kodikos: string): XartisMathimatos {
  switch (kodikos) {
    case 'ΠΛΗ101':
      return {
        kodikos_mathimatos: 'ΠΛΗ101',
        enotites: [...ENOTITES_PLH101],
        ekdosi_prompt: 'xartis-mock-v1',
        dimiourgithike: new Date('2026-10-09T10:00:00.000Z').toISOString(),
      };
    case 'ΠΛΗ302':
      return {
        kodikos_mathimatos: 'ΠΛΗ302',
        enotites: [...ENOTITES_PLH302],
        ekdosi_prompt: 'xartis-mock-v1',
        dimiourgithike: new Date('2026-10-09T10:00:00.000Z').toISOString(),
      };
    case 'ΠΛΗ204':
      return {
        kodikos_mathimatos: 'ΠΛΗ204',
        enotites: [...ENOTITES_PLH204],
        ekdosi_prompt: 'xartis-mock-v1',
        dimiourgithike: new Date('2026-10-09T10:00:00.000Z').toISOString(),
      };
    case 'ΠΛΗ201':
    default:
      return {
        kodikos_mathimatos: MATHIMA_MOCK.kodikos,
        enotites: [...ENOTITES_MOCK],
        ekdosi_prompt: 'xartis-mock-v1',
        dimiourgithike: new Date('2026-10-09T10:00:00.000Z').toISOString(),
      };
  }
}

/** Ο χάρτης του mock μαθήματος ΠΛΗ201, με τις ίδιες δομές των frozen contracts. */
export function pseudos_xartis(): XartisMathimatos {
  return pare_xarti_mathimatos('ΠΛΗ201');
}

/** Τα mock μαθήματα της λίστας (UniStudents Informatics Set). */
export function pseudos_mathimata(): readonly Mathima[] {
  return MATHIMATA_MOCK;
}

/** Υπολογισμός ανεξάρτητου κόστους σε λεπτά (Τζένκι της οθόνης Σήμερα). */
export function lepita_aristeias(ektyposi: readonly Enotita[]): number {
  return ektyposi.reduce((athroisma, enotita) => athroisma + (enotita.lepta_ektimisi ?? 0), 0);
}

/** Αναλογία επιτυχίας ανά ενότητα, για τον δακτύλιο μετρικού. */
export function pososto_aristeias(ektyposi: readonly Enotita[], aristeies: readonly string[]): number {
  if (ektyposi.length === 0) {
    return 0;
  }
  return aristeies.length / ektyposi.length;
}
