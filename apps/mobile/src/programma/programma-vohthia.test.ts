import { describe, it, expect } from 'vitest';
import {
  ETIKETES_TROPON,
  IMERES_EVDOMADAS,
  MEGISTA_LEPTA_IMERAS,
  ONOMATA_MINON,
  TROPOI_EXETASIS,
} from './programma-typoi.js';
import {
  PROEDAFO_TEMPLATE,
  afairese_exetasi,
  afairese_override,
  einai_egkyri_exetasi,
  einai_iso_imerominia,
  enimerose_template,
  exetasi_simvolaiou,
  kilise_lepta,
  lepta_imeras,
  nea_exetasi,
  pare_programma_rytheseis,
  prosthese_exetasi,
  prosthese_override,
  stilise_imerominia,
  synolika_lepta_template,
} from './programma-vohthia.js';

describe('einai_iso_imerominia', () => {
  it('δέχεται ημερομηνίες που υπάρχουν στον ημερολόγιο', () => {
    expect(einai_iso_imerominia('2026-10-10')).toBe(true);
    expect(einai_iso_imerominia('2028-02-29')).toBe(true);
    expect(einai_iso_imerominia('  2026-01-01  ')).toBe(true);
  });

  it('απορρίπτει ανύπαρκτες ημερομηνίες, λάθος μορφή και σκουπίδια', () => {
    expect(einai_iso_imerominia('2026-02-30')).toBe(false);
    expect(einai_iso_imerominia('2027-02-29')).toBe(false);
    expect(einai_iso_imerominia('2026-13-01')).toBe(false);
    expect(einai_iso_imerominia('10-10-2026')).toBe(false);
    expect(einai_iso_imerominia('2026-1-1')).toBe(false);
    expect(einai_iso_imerominia('αύριο')).toBe(false);
  });
});

describe('stilise_imerominia', () => {
  it('εμφανίζει ημερομηνία ISO σε ελληνικά', () => {
    expect(stilise_imerominia('2026-10-10')).toBe('10 Οκτ 2026');
    expect(stilise_imerominia('2027-01-01')).toBe('1 Ιαν 2027');
  });

  it('επιστρέφει null για null και μη έγκυρες τιμές, ποτέ «Invalid Date»', () => {
    expect(stilise_imerominia(null)).toBeNull();
    expect(stilise_imerominia('2026-02-30')).toBeNull();
  });

  it('τους δώδεκα μήνες με τρία γράμματα', () => {
    expect(ONOMATA_MINON).toHaveLength(12);
    expect(ONOMATA_MINON[0]).toBe('Ιαν');
    expect(ONOMATA_MINON[11]).toBe('Δεκ');
  });
});

describe('kilise_lepta', () => {
  it('κρατά έγκυρα λεπτά και σφηνώνει τα άκρα', () => {
    expect(kilise_lepta(60)).toBe(60);
    expect(kilise_lepta(-5)).toBe(0);
    expect(kilise_lepta(MEGISTA_LEPTA_IMERAS + 100)).toBe(MEGISTA_LEPTA_IMERAS);
  });

  it('κόβει τα δεκαδικά και πέφτει στο 0 για μη-αριθμό', () => {
    expect(kilise_lepta(59.9)).toBe(59);
    expect(kilise_lepta(Number.NaN)).toBe(0);
  });

  it('το ημερήσιο όριο είναι 24 ώρες', () => {
    expect(MEGISTA_LEPTA_IMERAS).toBe(1440);
  });
});

describe('template', () => {
  it('το προεπιλεγμένο template έχει και τις επτά ημέρες', () => {
    expect(PROEDAFO_TEMPLATE).toHaveLength(7);
    expect(synolika_lepta_template(PROEDAFO_TEMPLATE)).toBeGreaterThan(0);
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 7)).toBe(0);
  });

  it('η ενημέρωση μιας ημέρας αλλάζει μόνο αυτή την ημέρα', () => {
    const neo = enimerose_template(PROEDAFO_TEMPLATE, 3, 45);
    expect(lepta_imeras(neo, 3)).toBe(45);
    expect(lepta_imeras(neo, 1)).toBe(lepta_imeras(PROEDAFO_TEMPLATE, 1));
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 3)).not.toBe(45);
  });

  it('οι ημέρες είναι 1..7 με ελληνικά ονόματα', () => {
    expect(IMERES_EVDOMADAS.map((i) => i.arithmos)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(IMERES_EVDOMADAS[0]?.onoma).toBe('Δευτέρα');
  });
});

describe('exetaseis', () => {
  it('νέα γραμμή ξεκινά κενή με τον πρώτο τρόπο του συμβολαίου', () => {
    expect(nea_exetasi()).toEqual({ kodikos: '', imerominia: '', tropos: 'anoixta_vivlia' });
  });

  it('γραμμή χωρίς κωδικό ή με ανύπαρκτη ημερομηνία δεν είναι έγκυρη', () => {
    expect(einai_egkyri_exetasi({ kodikos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' })).toBe(true);
    expect(einai_egkyri_exetasi({ kodikos: '', imerominia: '2027-01-18', tropos: 'kleista_vivlia' })).toBe(false);
    expect(einai_egkyri_exetasi({ kodikos: 'ΠΛΗ201', imerominia: '', tropos: 'kleista_vivlia' })).toBe(false);
    expect(einai_egkyri_exetasi({ kodikos: 'ΠΛΗ201', imerominia: '2027-02-30', tropos: 'ergasia' })).toBe(false);
  });

  it('η μετατροπή σε Exetasi του συμβολαίου δίνει null για ανέγκυρη γραμμή', () => {
    expect(exetasi_simvolaiou({ kodikos: ' ΠΛΗ201 ', imerominia: '2027-01-18', tropos: 'kleista_vivlia' })).toEqual({
      kodikos_mathimatos: 'ΠΛΗ201',
      imerominia: '2027-01-18',
      tropos: 'kleista_vivlia',
    });
    expect(exetasi_simvolaiou({ kodikos: '', imerominia: '2027-01-18', tropos: 'kleista_vivlia' })).toBeNull();
  });

  it('η προσθήκη αντικαθιστά την εξέταση του ίδιου μαθήματος και ταξινομεί', () => {
    const arxikes = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' as const },
    ];
    const meta = prosthese_exetasi(arxikes, {
      kodikos_mathimatos: 'ΑΝΑ100',
      imerominia: '2027-01-05',
      tropos: 'anoixta_vivlia',
    });
    expect(meta.map((e) => e.kodikos_mathimatos)).toEqual(['ΑΝΑ100', 'ΠΛΗ201']);

    const antikatastasi = prosthese_exetasi(meta, {
      kodikos_mathimatos: 'ΠΛΗ201',
      imerominia: '2027-01-20',
      tropos: 'anoixta_vivlia',
    });
    expect(antikatastasi).toHaveLength(2);
    expect(antikatastasi.find((e) => e.kodikos_mathimatos === 'ΠΛΗ201')?.imerominia).toBe('2027-01-20');
  });

  it('η αφαίρεση αφαιρεί μόνο τον κωδικό που ζητήθηκε', () => {
    const exetaseis = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' as const },
      { kodikos_mathimatos: 'ΑΝΑ100', imerominia: '2027-01-05', tropos: 'anoixta_vivlia' as const },
    ];
    expect(afairese_exetasi(exetaseis, 'ΠΛΗ201').map((e) => e.kodikos_mathimatos)).toEqual(['ΑΝΑ100']);
  });

  it('όλοι οι τρόποι εξέτασης έχουν ελληνική ετικέτα', () => {
    for (const tropos of TROPOI_EXETASIS) {
      expect(ETIKETES_TROPON[tropos].length).toBeGreaterThan(0);
    }
  });
});

describe('overrides', () => {
  it('προσθήκη αντικαθιστά την ίδια ημερομηνία και κρατά τη σειρά', () => {
    const meta = prosthese_override(
      [{ imerominia: '2027-01-10', lepta: 30 }],
      { imerominia: '2027-01-05', lepta: 90 }
    );
    expect(meta.map((o) => o.imerominia)).toEqual(['2027-01-05', '2027-01-10']);

    const antikatastasi = prosthese_override(meta, { imerominia: '2027-01-10', lepta: 15 });
    expect(antikatastasi).toHaveLength(2);
    expect(antikatastasi.find((o) => o.imerominia === '2027-01-10')?.lepta).toBe(15);
  });

  it('η αφαίρεση αφαιρεί μόνο τη ζητούμενη ημερομηνία', () => {
    const overrides = [
      { imerominia: '2027-01-05', lepta: 30 },
      { imerominia: '2027-01-10', lepta: 90 },
    ];
    expect(afairese_override(overrides, '2027-01-05').map((o) => o.imerominia)).toEqual(['2027-01-10']);
  });
});

describe('pare_programma_rytheseis', () => {
  it('συμπληρώνει προεπιλογές για ρυθμίσεις παλιού σχήματος', () => {
    const programma = pare_programma_rytheseis({});
    expect(programma.exetaseis).toEqual([]);
    expect(programma.arxiExetastikis).toBeNull();
    expect(programma.overridesLepton).toEqual([]);
    expect(programma.templateLepton).toHaveLength(7);
  });

  it('διαβάζει τις αποθηκευμένες τιμές όπως δίνονται', () => {
    const programma = pare_programma_rytheseis({
      exetaseis: [{ kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' }],
      arxiExetastikis: '2027-01-11',
    });
    expect(programma.exetaseis).toHaveLength(1);
    expect(programma.arxiExetastikis).toBe('2027-01-11');
  });
});
