import type { Mathima, Enotita, XartisMathimatos } from '@dps/core';

/** Καθυστέρηση προσομοίωσης ώστε η κατάσταση φόρτωσης να είναι πραγματική, όχι θεωρητική. */
export const KATHYSTERISI_PSEDON_MS = 220;

const MATHIMA_MOCK: Mathima = {
  kodikos: 'ΠΛΗ201',
  titlos: 'Πληροφορική & Προγραμματισμός',
  url: 'https://thales.cs.unipi.gr/courses/PPLI201',
  epilegmeno: true,
};

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

/** Ο χάρτης του mock μαθήματος, με τις ίδιες δομές των frozen contracts. */
export function pseudos_xartis(): XartisMathimatos {
  return {
    kodikos_mathimatos: MATHIMA_MOCK.kodikos,
    enotites: [...ENOTITES_MOCK],
    ekdosi_prompt: 'xartis-mock-v1',
    dimiourgithike: new Date('2026-10-09T10:00:00.000Z').toISOString(),
  };
}

/** Το mock μάθημα της λίστας. */
export function pseudos_mathimata(): readonly Mathima[] {
  return [MATHIMA_MOCK];
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

/** Οι ρυθμίσεις του εφαρμογής όπως τις βλέπει η οθόνη — ποτέ hardcoded μέσα στην οθόνη. */
export interface RythisiesPseudes {
  readonly baseUrl: string;
  readonly mathimataSynch: readonly string[];
  readonly onomaMontelou: string;
  readonly exeiKleidiLlm: boolean;
  readonly onomasApothikefsis: string;
  readonly einaiEidopoieseis: boolean;
}

/** Προσωρινές ρυθμίσεις, μέχρι να συνδεθεί η πραγματική αποθήκευση (rythmiseis.json). */
export function pseudos_rythisies(): RythisiesPseudes {
  return {
    baseUrl: 'https://thales.cs.unipi.gr',
    mathimataSynch: [MATHIMA_MOCK.kodikos],
    onomaMontelou: 'gemini-2.5-flash',
    exeiKleidiLlm: false,
    onomasApothikefsis: 'Documents/DPS.guide',
    einaiEidopoieseis: true,
  };
}