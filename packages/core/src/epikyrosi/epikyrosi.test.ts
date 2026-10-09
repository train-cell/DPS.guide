import { describe, it, expect } from 'vitest';
import type { Perigramma, Pigi, Tmima, XartisMathimatos } from '../contracts/montela.js';
import { epikyrose_perigramma, epikyrose_xarti, epikyrose_odigo } from './index.js';

function tmima(
  titlos: string,
  apo: number,
  eos: number,
  typos: Tmima['typos'] = 'theoria'
): Tmima {
  return { titlos, selides: { apo, eos }, typos, ennoies: [], proapaitoumena: [] };
}

function perigramma_raw(tmimata: Tmima[], arxeio_id = 'arx-1'): unknown {
  return { arxeio_id, titlos: 'Perigramma', tmimata };
}

function xartis_raw(enotites: XartisMathimatos['enotites']): unknown {
  return {
    kodikos_mathimatos: 'PLI-1',
    enotites,
    ekdosi_prompt: 'p1',
    dimiourgithike: '2026-10-09',
  };
}

function enotita(
  id: string,
  piges: Pigi[] = [{ arxeio_id: 'arx-1', apo: 1, eos: 3 }],
  proapaitoumenes: { enotita_id: string; isxys: 'isxyri' | 'asthenis' }[] = []
): XartisMathimatos['enotites'][number] {
  return {
    id,
    titlos: `Enotita ${id}`,
    piges,
    ennoies: [],
    proapaitoumenes,
    seira: 0,
    lepta_ektimisi: null,
    apodosi_exetasis: null,
  };
}

function perigramma_apo(arxeio_id: string): Perigramma {
  return { arxeio_id, titlos: 'P', tmimata: [] };
}

describe('epikyrose_perigramma', () => {
  it('rejects non-object input', () => {
    for (const raw of [null, 'json', 42, []]) {
      const res = epikyrose_perigramma(raw, 10);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('rejects wrong field types', () => {
    const res = epikyrose_perigramma(
      { arxeio_id: 'arx-1', titlos: 'P', tmimata: [{ titlos: 'T', selides: 'lathos', typos: 'theoria', ennoies: [], proapaitoumena: [] }] },
      10
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects an invalid page count', () => {
    for (const n of [0, -5, Number.NaN, 2.5]) {
      const res = epikyrose_perigramma(perigramma_raw([tmima('T', 1, 2)]), n);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('accepts in-bounds ranges without warnings', () => {
    const res = epikyrose_perigramma(perigramma_raw([tmima('T', 1, 3), tmima('A', 5, 6, 'askiseis')]), 10);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.proeidopoiiseis).toEqual([]);
      expect(res.timi.perigramma.tmimata).toHaveLength(2);
    }
  });

  it('clamps out-of-bounds ranges with warnings', () => {
    const res = epikyrose_perigramma(perigramma_raw([tmima('T', 0, 99)]), 10);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.perigramma.tmimata[0]?.selides).toEqual({ apo: 1, eos: 10 });
      expect(res.timi.proeidopoiiseis.length).toBeGreaterThan(0);
    }
  });

  it('rejects apo greater than eos', () => {
    const res = epikyrose_perigramma(perigramma_raw([tmima('T', 5, 2)]), 10);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('sorts unordered ranges', () => {
    const res = epikyrose_perigramma(
      perigramma_raw([tmima('B', 5, 6), tmima('A', 1, 2)]),
      10
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.perigramma.tmimata.map((t) => t.titlos)).toEqual(['A', 'B']);
    }
  });

  it('merges overlaps larger than the tolerance with a warning', () => {
    const res = epikyrose_perigramma(
      perigramma_raw([tmima('A', 1, 5), tmima('B', 3, 7)]),
      10
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.perigramma.tmimata).toHaveLength(1);
      expect(res.timi.perigramma.tmimata[0]?.selides).toEqual({ apo: 1, eos: 7 });
      expect(res.timi.proeidopoiiseis.length).toBeGreaterThan(0);
    }
  });

  it('sorts by end when starts are equal', () => {
    const res = epikyrose_perigramma(
      perigramma_raw([tmima('B', 1, 2), tmima('A', 1, 1)]),
      10
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.perigramma.tmimata.map((t) => t.titlos)).toEqual(['A', 'B']);
    }
  });

  it('tolerates a single shared boundary page', () => {
    const res = epikyrose_perigramma(
      perigramma_raw([tmima('A', 1, 3), tmima('B', 3, 5)]),
      10
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.perigramma.tmimata).toHaveLength(2);
      expect(res.timi.proeidopoiiseis).toEqual([]);
    }
  });
});

describe('epikyrose_xarti', () => {
  it('rejects non-object input', () => {
    const res = epikyrose_xarti({ lathos: true }, [perigramma_apo('arx-1')]);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects sources that do not exist', () => {
    const res = epikyrose_xarti(
      xartis_raw([enotita('e1', [{ arxeio_id: 'aniparkto', apo: 1, eos: 2 }])]),
      [perigramma_apo('arx-1')]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('rejects duplicate unit ids', () => {
    const res = epikyrose_xarti(
      xartis_raw([enotita('e1'), enotita('e1')]),
      [perigramma_apo('arx-1')]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects prerequisites that do not exist', () => {
    const res = epikyrose_xarti(
      xartis_raw([enotita('e1', undefined, [{ enotita_id: 'fantasma', isxys: 'isxyri' }])]),
      [perigramma_apo('arx-1')]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('rejects inverted source ranges', () => {
    const res = epikyrose_xarti(
      xartis_raw([enotita('e1', [{ arxeio_id: 'arx-1', apo: 5, eos: 2 }])]),
      [perigramma_apo('arx-1')]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('accepts a valid chart', () => {
    const res = epikyrose_xarti(
      xartis_raw([
        enotita('e1'),
        enotita('e2', [{ arxeio_id: 'arx-1', apo: 4, eos: 6 }], [{ enotita_id: 'e1', isxys: 'asthenis' }]),
      ]),
      [perigramma_apo('arx-1')]
    );
    expect(res.ok).toBe(true);
  });
});

describe('epikyrose_odigo', () => {
  const epitrepomenes: Pigi[] = [{ arxeio_id: 'arx-1', apo: 1, eos: 5 }];

  const egkyros_odigos = [
    '# Odigos',
    '## 🎯 Στόχοι',
    'Stoxoi keimeno [[arx-1:1]].',
    '## 👶 ELI5',
    'Aplo keimeno [[arx-1:2]].',
    '## 🔬 Θεωρία',
    'Theoria keimeno [[arx-1:3]].',
    '## 🧪 Λυμένο παράδειγμα',
    'Paradeigma keimeno [[arx-1:3]].',
    '## ⚠️ Παγίδες',
    'Pagides keimeno [[arx-1:4]].',
    '## 🔗 Συνδέσεις',
    'Syndeseis keimeno [[arx-1:4]].',
    '## ✅ Αυτοέλεγχος',
    'Erotiseis keimeno [[arx-1:5]].',
  ].join('\n');

  it('rejects non-string input', () => {
    const res = epikyrose_odigo(42, epitrepomenes);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects a guide with a missing section', () => {
    const xoris_theoria = egkyros_odigos.replace('## 🔬 Θεωρία', '## Kati allo');
    const res = epikyrose_odigo(xoris_theoria, epitrepomenes);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects a reference outside the allowed pages', () => {
    const ektos = `${egkyros_odigos}\nExtra [[arx-1:99]].`;
    const res = epikyrose_odigo(ektos, epitrepomenes);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('rejects a reference to an unknown file', () => {
    const agnosto = `${egkyros_odigos}\nExtra [[arx-2:1]].`;
    const res = epikyrose_odigo(agnosto, epitrepomenes);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('accepts a valid guide and extracts references', () => {
    const res = epikyrose_odigo(egkyros_odigos, epitrepomenes);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.parapompes).toHaveLength(7);
      expect(res.timi.parapompes[0]).toEqual({ arxeio_id: 'arx-1', selida: 1 });
    }
  });
});
