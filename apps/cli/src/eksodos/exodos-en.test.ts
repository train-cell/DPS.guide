import { describe, expect, it } from 'vitest';
import type { Enotita, Mathima, OdigosMeta, XartisMathimatos } from '@dps/core';
import { grammmes_exodou } from './exodos-en.js';
import type { ExodosEn, MetritiMathimatos } from './exodos-en.js';

const MATHIMA: Mathima = {
  kodikos: 'MATH101',
  titlos: 'Δομές Δεδομένων',
  url: 'https://example.invalid/MATH101',
  epilegmeno: true,
};

const METRITI: MetritiMathimatos = {
  kodikos_mathimatos: 'MATH101',
  megaliteres: 7,
};

const ODIGOS_META: OdigosMeta = {
  enotita_id: 'en-1',
  parapompes: [{ arxeio_id: 'arx-1', selida: 12 }],
  montelo: 'gemini-ypokpisteio',
  ekdosi_prompt: 'p3',
  hash_eisodou: 'abc123',
  proeidopoiiseis: ['Αναφέρθηκε στη σελίδα 3, όχι στο υλικό'],
};

const XARTIS: XartisMathimatos = {
  kodikos_mathimatos: 'MATH101',
  enotites: [
    {
      id: 'en-1',
      titlos: 'Δεντικά δέντρα',
      piges: [],
      ennoies: [],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 120,
      apodosi_exetasis: null,
    },
  ],
  ekdosi_prompt: 'p2',
  dimiourgithike: '2026-10-09T10:00:00.000Z',
};

describe('grammmes_exodou — plirofories', () => {
  it('τυπώνει το μήνυμα', () => {
    const exodos: ExodosEn = { eidos: 'plirofories', minima: 'Δεν υπάρχει κάτι για εμφάνιση' };
    expect(grammmes_exodou(exodos)).toEqual(['Δεν υπάρχει κάτι για εμφάνιση']);
  });
});

describe('grammmes_exodou — mathimata', () => {
  it('κενή λίστα δίνει μήνυμα', () => {
    const exodos: ExodosEn = { eidos: 'mathimata', mathimata: [] };
    expect(grammmes_exodou(exodos)).toEqual(['Δεν βρέθηκαν μαθήματα.']);
  });

  it('βγάζει τον κωδικό, τον τίτλο και το επιλεγμένο σήμα', () => {
    const exodos: ExodosEn = {
      eidos: 'mathimata',
      mathimata: [MATHIMA],
    };
    expect(grammmes_exodou(exodos)).toEqual([
      'Μαθήματα (1):',
      '  MATH101  Δομές Δεδομένων  [επιλεγμένο]',
      'Επιλεγμένα για συγχρονισμό: 1',
    ]);
  });

  it('μετράει μόνο τα επιλεγμένα', () => {
    const exodos: ExodosEn = {
      eidos: 'mathimata',
      mathimata: [{ ...MATHIMA, epilegmeno: false }, MATHIMA],
    };
    expect(grammmes_exodou(exodos)).toContain('Επιλεγμένα για συγχρονισμό: 1');
  });
});

describe('grammmes_exodou — sygxronismos', () => {
  it('κενή λίστα δίνει μήνυμα', () => {
    const exodos: ExodosEn = { eidos: 'sygxronismos', apotelesmata: [] };
    expect(grammmes_exodou(exodos)).toEqual(['Δεν συγχρονίστηκε κανένα μάθημα.']);
  });

  it('αθροίζει τα αρχεία ανά μάθημα', () => {
    const exodos: ExodosEn = {
      eidos: 'sygxronismos',
      apotelesmata: [METRITI, { kodikos_mathimatos: 'MATH202', megaliteres: 3 }],
    };
    expect(grammmes_exodou(exodos)).toEqual([
      'Συγχρονισμός αρχείων:',
      '  MATH101  7 αρχεία',
      '  MATH202  3 αρχεία',
      'Σύνολο: 10 αρχεία σε 2 μαθήματα',
    ]);
  });
});

describe('grammmes_exodou — xartis', () => {
  it('βγάζει τις ενότητες με τις εκτιμήσεις', () => {
    const exodos: ExodosEn = { eidos: 'xartis', xartis: XARTIS };
    const grammes = grammmes_exodou(exodos);
    expect(grammes[0]).toContain('Χάρτης μαθήματος');
    expect(grammes[1]).toContain('120 λεπτά μελέτης');
  });

  it('δίνει χωρίς εκτίμηση όταν λείπει', () => {
    const enotita: Enotita = { ...(XARTIS.enotites[0] as Enotita), lepta_ektimisi: null };
    const grammes = grammmes_exodou({ eidos: 'xartis', xartis: { ...XARTIS, enotites: [enotita] } });
    expect(grammes[1]).toContain('χωρίς εκτίμηση λεπτών');
  });
});

describe('grammmes_exodou — odigos', () => {
  it('με παραπομπές βγάζει τη λίστα τους', () => {
    const grammes = grammmes_exodou({ eidos: 'odigos', meta: ODIGOS_META });
    expect(grammes).toEqual([
      'Οδηγός ενότητας en-1',
      '  μοντέλο: gemini-ypokpisteio',
      '  παραπομπές (1):',
      '    arx-1 σελ. 12',
      '  προειδποιήσεις (1):',
      '    Αναφέρθηκε στη σελίδα 3, όχι στο υλικό',
    ]);
  });

  it('χωρίς παραπομπές βγάζει καμία', () => {
    const grammes = grammmes_exodou({
      eidos: 'odigos',
      meta: { ...ODIGOS_META, parapompes: [] },
    });
    expect(grammes).toContain('  παραπομπές: καμία');
  });

  it('χωρίς προειδποιήσεις δεν βγάζει ενότητα', () => {
    const grammes = grammmes_exodou({ eidos: 'odigos', meta: { ...ODIGOS_META, proeidopoiiseis: [] } });
    expect(grammes).not.toContain('προειδποιήσεις');
  });
});

describe('grammmes_exodou — allh_dedomena', () => {
  it('δίνει το JSON του', () => {
    expect(grammmes_exodou({ eidos: 'allh_dedomena', dedomena: { a: 1 } })).toEqual(['{', '  "a": 1', '}']);
  });
});
