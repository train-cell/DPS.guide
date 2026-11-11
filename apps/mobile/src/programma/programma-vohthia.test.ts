import { describe, expect, it } from 'vitest';
import {
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
  PROEDAFO_TEMPLATE,
  synolika_lepta_template,
  stilise_imerominia,
  afairese_exetasi,
  afairese_override,
} from './programma-vohthia.js';
import {
  IMERES_EVDOMADAS,
  MEGISTA_LEPTA_IMERAS,
  ONOMATA_MINON,
  type ArithmosImeras,
  type Exetasi,
  type ExetasiP1,
  type OverrideLepton,
} from './programma-typoi.js';

describe('programma-vohthia.ts — ημερομηνία', () => {
  it('δέχεται έγκυρη ISO ημερομηνία', () => {
    expect(einai_iso_imerominia('2026-11-11')).toBe(true);
    expect(einai_iso_imerominia('2026-02-28')).toBe(true);
  });

  it('απορρίπτει μη έγκυρη ημερομηνία', () => {
    expect(einai_iso_imerominia('2026-13-01')).toBe(false);
    expect(einai_iso_imerominia('2026-02-30')).toBe(false);
    expect(einai_iso_imerominia('2026-02-29')).toBe(false);
    expect(einai_iso_imerominia('11-11-2026')).toBe(false);
    expect(einai_iso_imerominia('')).toBe(false);
  });

  it('μετατρέπει ISO σε αναγνώσιμη μορφή', () => {
    expect(stilise_imerominia('2026-11-11')).toBe('11 Νοε 2026');
    expect(stilise_imerominia(null)).toBe(null);
    expect(stilise_imerominia('2026-13-01')).toBe(null);
  });
});

describe('programma-vohthia.ts — λεπτά', () => {
  it('περιορίζει τα λεπτά στα αποδεκτά όρια', () => {
    expect(kilise_lepta(120)).toBe(120);
    expect(kilise_lepta(0)).toBe(0);
    expect(kilise_lepta(MEGISTA_LEPTA_IMERAS)).toBe(MEGISTA_LEPTA_IMERAS);
    expect(kilise_lepta(MEGISTA_LEPTA_IMERAS + 10)).toBe(MEGISTA_LEPTA_IMERAS);
    expect(kilise_lepta(-5)).toBe(0);
    expect(kilise_lepta(Number.NaN)).toBe(0);
  });
});

describe('programma-vohthia.ts — template', () => {
  it('έχει 7 ημέρες με τα προτεινόμενα λεπτά', () => {
    expect(PROEDAFO_TEMPLATE).toHaveLength(7);
    const perIma = IMERES_EVDOMADAS;
    for (const [i, imera] of perIma.entries()) {
      const lepta = i === 6 ? 0 : i === 5 ? 60 : 120;
      expect(PROEDAFO_TEMPLATE[i].imera).toBe(imera.arithmos);
      expect(PROEDAFO_TEMPLATE[i].lepta).toBe(lepta);
    }
  });

  it('αλλάζει τα λεπτά μίας ημέρας χωρίς να αλλάζει το υπόλοιπο', () => {
    const template = enimerose_template(PROEDAFO_TEMPLATE, 1 as ArithmosImeras, 200);
    expect(template[0].imera).toBe(1);
    expect(template[0].lepta).toBe(200);
    expect(template[1].lepta).toBe(120);
  });

  it('συνολικά λεπτά template', () => {
    expect(synolika_lepta_template(PROEDAFO_TEMPLATE)).toBe(120 * 5 + 60);
  });
});

describe('programma-vohthia.ts — εξετάσεις', () => {
  it('φτιάχνει κενή γραμμή εξέτασης', () => {
    expect(nea_exetasi()).toEqual({ kodikos: '', imerominia: '', tropos: 'anoixta_vivlia' });
  });

  it('ελέγχει αν η γραμμή εξέτασης είναι έγκυρη', () => {
    expect(einai_egkyri_exetasi({ kodikos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' })).toBe(true);
    expect(einai_egkyri_exetasi({ kodikos: 'CS101', imerominia: '2026-13-01', tropos: 'anoixta_vivlia' })).toBe(false);
    expect(einai_egkyri_exetasi({ kodikos: '', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' })).toBe(false);
    expect(einai_egkyri_exetasi({ kodikos: 'CS101', imerominia: '', tropos: 'anoixta_vivlia' })).toBe(false);
  });

  it('μετατρέπει έγκυρη γραμμή σε σύμβολαιο', () => {
    const exetasi = { kodikos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' } as ExetasiP1;
    expect(exetasi_simvolaiou(exetasi)).toEqual({
      kodikos_mathimatos: 'CS101',
      imerominia: '2026-11-11',
      tropos: 'anoixta_vivlia',
    });
  });

  it('δεν μετατρέπει μη έγκυρη γραμμή σε σύμβολαιο', () => {
    expect(exetasi_simvolaiou({ kodikos: '', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' } as ExetasiP1)).toBe(null);
    expect(exetasi_simvolaiou({ kodikos: 'CS101', imerominia: '2026-13-01', tropos: 'anoixta_vivlia' } as ExetasiP1)).toBe(null);
  });

  it('προσθέτει και διατηρεί τη σειρά εισαγωγής', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS202', imerominia: '2026-11-10', tropos: 'anoixta_vivlia' },
    ];
    const neo: Exetasi = { kodikos_mathimatos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' };
    const neos = prosthese_exetasi(exetaseis, neo);
    expect(neos).toHaveLength(2);
    expect(neos[0]?.kodikos_mathimatos).toBe('CS202');
    expect(neos[1]?.kodikos_mathimatos).toBe('CS101');
  });

  it('αντικαθιστά το ίδιο μάθημα', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' },
    ];
    const neo: Exetasi = { kodikos_mathimatos: 'CS101', imerominia: '2026-11-12', tropos: 'anoixta_vivlia' };
    expect(prosthese_exetasi(exetaseis, neo)).toHaveLength(1);
    expect(prosthese_exetasi(exetaseis, neo)[0]?.imerominia).toBe('2026-11-12');
  });

  it('αφαιρεί εξέταση μαθήματος', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' },
      { kodikos_mathimatos: 'CS202', imerominia: '2026-11-12', tropos: 'anoixta_vivlia' },
    ];
    const nees = afairese_exetasi(exetaseis, 'CS101');
    expect(nees).toHaveLength(1);
    expect(nees[0]?.kodikos_mathimatos).toBe('CS202');
    expect(afairese_exetasi(exetaseis, 'CS999')).toHaveLength(2);
  });

  it('διαχειρίζεται κενό imerominia στον χαμηλότερο δείκτη', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS101' },
      { kodikos_mathimatos: 'CS102', imerominia: '2026-11-11' },
    ];
    const neo: Exetasi = { kodikos_mathimatos: 'CS103', imerominia: '2026-11-12', tropos: 'anoixta_vivlia' };
    const nees = prosthese_exetasi(exetaseis, neo);
    expect(nees).toHaveLength(3);
    expect(nees[0]?.kodikos_mathimatos).toBe('CS101');
  });

  it('διαχειρίζεται κενό imerominia στον υψηλότερο δείκτη', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS102', imerominia: '2026-11-11' },
      { kodikos_mathimatos: 'CS101' },
    ];
    const neo: Exetasi = { kodikos_mathimatos: 'CS103', imerominia: '2026-11-12', tropos: 'anoixta_vivlia' };
    const nees = prosthese_exetasi(exetaseis, neo);
    expect(nees).toHaveLength(3);
    expect(nees[0]?.kodikos_mathimatos).toBe('CS101');
  });
});

describe('programma-vohthia.ts — overrides', () => {
  it('προσθέτει και αντικαθιστά εξαίρεση ημέρας', () => {
    const overrides: readonly OverrideLepton[] = [
      { imerominia: '2026-11-11', lepta: 90 },
    ];
    const neo: OverrideLepton = { imerominia: '2026-11-11', lepta: 120 };
    const nees = prosthese_override(overrides, neo);
    expect(nees).toHaveLength(1);
    expect(nees[0]?.lepta).toBe(120);
  });

  it('διατηρεί τη σειρά ημερομηνιών', () => {
    const overrides: readonly OverrideLepton[] = [
      { imerominia: '2026-11-12', lepta: 90 },
      { imerominia: '2026-11-11', lepta: 60 },
    ];
    const nees = prosthese_override(overrides, { imerominia: '2026-11-10', lepta: 120 });
    expect(nees.map((o) => o.imerominia)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12']);
  });

  it('αφαιρεί εξαίρεση ημέρας', () => {
    const overrides: readonly OverrideLepton[] = [
      { imerominia: '2026-11-11', lepta: 90 },
      { imerominia: '2026-11-12', lepta: 60 },
    ];
    expect(afairese_override(overrides, '2026-11-11')).toHaveLength(1);
    expect(afairese_override(overrides, '2026-11-13')).toHaveLength(2);
  });
});

describe('programma-vohthia.ts — ρυθμίσεις προγράμματος', () => {
  it('συμπληρώνει τα προεπιλεγμένα template', () => {
    const rytheseis = pare_programma_rytheseis({});
    expect(rytheseis.exetaseis).toEqual([]);
    expect(rytheseis.arxiExetastikis).toBe(null);
    expect(rytheseis.templateLepton).toEqual(PROEDAFO_TEMPLATE);
    expect(rytheseis.overridesLepton).toEqual([]);
  });

  it('διαβάζει πλήρεις ρυθμίσεις', () => {
    const exetaseis: readonly Exetasi[] = [
      { kodikos_mathimatos: 'CS101', imerominia: '2026-11-11', tropos: 'anoixta_vivlia' },
    ];
    const rytheseis = pare_programma_rytheseis({
      exetaseis,
      arxiExetastikis: '2026-11-01',
      templateLepton: [{ imera: 1 as ArithmosImeras, lepta: 240 }],
      overridesLepton: [{ imerominia: '2026-11-11', lepta: 90 }],
    });
    expect(rytheseis.exetaseis).toBe(exetaseis);
    expect(rytheseis.arxiExetastikis).toBe('2026-11-01');
    expect(rytheseis.templateLepton).toEqual([{ imera: 1 as ArithmosImeras, lepta: 240 }]);
    expect(rytheseis.overridesLepton).toEqual([{ imerominia: '2026-11-11', lepta: 90 }]);
  });

  it('δεν βρίσκει ημέρα στο template', () => {
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 9 as ArithmosImeras)).toBe(0);
  });

  it('βρίσκει ημέρα στο template', () => {
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 1 as ArithmosImeras)).toBe(120);
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 6 as ArithmosImeras)).toBe(60);
    expect(lepta_imeras(PROEDAFO_TEMPLATE, 7 as ArithmosImeras)).toBe(0);
  });
});
