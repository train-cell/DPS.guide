import { describe, expect, it } from 'vitest';
import {
  einai_arithmetiki_apantisi,
  kanonikopoie_arithmo,
  pericharei_sto_yliko,
  sugkrise_arithmetika,
} from '../src/tutor/index.js';

const YLIKO_ME_TIMI = '## Θεωρία\nΗ μέση τιμή είναι 3,14. [[arx-1:4]]';

describe('kanonikopoie_arithmo', () => {
  it('κάνει κανονικοποίηση της υποδιαστολής σε τελεία', () => {
    expect(kanonikopoie_arithmo('3,14')).toBe('3.14');
  });

it('αφαιρεί κενά και περιορισμένους χαρακτήρες διαχωριστικού', () => {
    expect(kanonikopoie_arithmo(' 3 , 14 ')).toBe('3.14');
    expect(kanonikopoie_arithmo('3,1 4')).toBe('3.14');
    expect(kanonikopoie_arithmo(' 3,14 ')).toBe('3.14');
    expect(kanonikopoie_arithmo('3,1\u202F4')).toBe('3.14');
  });

  it('κόβει τα μηδενικά της ακέραιας και της δεκαδικής μερίδας', () => {
    expect(kanonikopoie_arithmo('007')).toBe('7');
    expect(kanonikopoie_arithmo('3.1400')).toBe('3.14');
    expect(kanonikopoie_arithmo('+42')).toBe('42');
    expect(kanonikopoie_arithmo('.5')).toBe('0.5');
  });

  it('κρατά το πρόσημο εκτός από το αρνητικό μηδέν', () => {
    expect(kanonikopoie_arithmo('-2,50')).toBe('-2.5');
    expect(kanonikopoie_arithmo('-0.00')).toBe('0');
  });

  it('επιστρέφει null όταν το κείμενο δεν είναι ένας αριθμός', () => {
    expect(kanonikopoie_arithmo('πέντε')).toBeNull();
    expect(kanonikopoie_arithmo('η απάντηση είναι 3,14')).toBeNull();
    expect(kanonikopoie_arithmo('')).toBeNull();
    expect(kanonikopoie_arithmo('3.14.2')).toBeNull();
  });
});

describe('einai_arithmetiki_apantisi', () => {
  it('αναγνωρίζει μόνο καθαρές αριθμητικές απαντήσεις', () => {
    expect(einai_arithmetiki_apantisi('3,14')).toBe(true);
    expect(einai_arithmetiki_apantisi('δεν ξέρω')).toBe(false);
  });
});

describe('pericharei_sto_yliko', () => {
  it('βρίσκει την τιμή στο υλικό είτε με τελεία είτε με κόμμα', () => {
    expect(pericharei_sto_yliko(YLIKO_ME_TIMI, '3.14')).toBe(true);
    expect(pericharei_sto_yliko('Η τιμή είναι 3.14', '3.14')).toBe(true);
  });

  it('δεν δεχεται τμήμα αριθμού που ανήκει σε μεγαλύτερο', () => {
    expect(pericharei_sto_yliko('Η τιμή είναι 13.14', '3.14')).toBe(false);
    expect(pericharei_sto_yliko('Η τιμή είναι 3.145', '3.14')).toBe(false);
  });

  it('δεν βρίσκει τιμή που λείπει από το υλικό', () => {
    expect(pericharei_sto_yliko(YLIKO_ME_TIMI, '42')).toBe(false);
  });
});

describe('sugkrise_arithmetika', () => {
  it('κρίνει σωστή όταν η απάντηση κανονικοποιείται στην ίδια τιμή', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: ' 3,140 ',
      anamomeni_timi: '3.14',
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('sosto');
    expect(symkrisi.apantisi_mafis).toBe('3.14');
    expect(symkrisi.anamomeni).toBe('3.14');
  });

  it('κρίνει λάθος όταν η απάντηση διαφέρει', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: '3,15',
      anamomeni_timi: '3.14',
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('lathos');
  });

  it('δεν επαληθεύει όταν η αναμενόμενη τιμή λείπει από το υλικό', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: '42',
      anamomeni_timi: '42',
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('den_epalythevomene');
  });

  it('δεν επαληθεύει όταν δεν υπάρχει αναμενόμενη τιμή', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: '42',
      anamomeni_timi: null,
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('den_epalythevomene');
    expect(symkrisi.anamomeni).toBeNull();
  });

  it('δεν επαληθεύει όταν η αναμενόμενη τιμή δεν είναι αριθμός', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: '3,14',
      anamomeni_timi: 'κάτι',
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('den_epalythevomene');
    expect(symkrisi.anamomeni).toBeNull();
  });

  it('δεν επαληθεύει όταν η απάντηση δεν είναι καθαρός αριθμός', () => {
    const symkrisi = sugkrise_arithmetika({
      apantisi_mafis: 'νομίζω 3,14',
      anamomeni_timi: '3.14',
      yliko: YLIKO_ME_TIMI,
    });
    expect(symkrisi.poreia).toBe('den_epalythevomene');
    expect(symkrisi.apantisi_mafis).toBeNull();
  });
});
