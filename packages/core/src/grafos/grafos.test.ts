import { describe, it, expect } from 'vitest';
import type {
  Enotita,
  Perigramma,
  Proapaitoumeno,
  Tmima,
  XartisMathimatos,
} from '../contracts/montela.js';
import type { AkmiGrafou } from './index.js';
import {
  elegxos_kalypsis,
  episkevi_kyklon,
  topologiki_taxinomisi,
  vres_kyklous,
} from './index.js';

function proapaitoumeno(
  enotita_id: string,
  isxys: 'isxyri' | 'asthenis' = 'isxyri'
): Proapaitoumeno {
  return { enotita_id, isxys };
}

function enotita(
  id: string,
  seira: number,
  proapaitoumenes: Proapaitoumeno[] = []
): Enotita {
  return {
    id,
    titlos: `Enotita ${id}`,
    piges: [],
    ennoies: [],
    proapaitoumenes,
    seira,
    lepta_ektimisi: null,
    apodosi_exetasis: null,
  };
}

function tmima(titlos: string, apo: number, eos: number): Tmima {
  return {
    titlos,
    selides: { apo, eos },
    typos: 'theoria',
    ennoies: [],
    proapaitoumena: [],
  };
}

function perigramma(arxeio_id: string, tmimata: Tmima[]): Perigramma {
  return { arxeio_id, titlos: `Perigramma ${arxeio_id}`, tmimata };
}

function xartis(enotites: Enotita[]): XartisMathimatos {
  return {
    kodikos_mathimatos: 'PLI101',
    enotites,
    ekdosi_prompt: 'v1',
    dimiourgithike: '2026-10-09T00:00:00.000Z',
  };
}

function afairese_akmes(enotites: Enotita[], akmes: AkmiGrafou[]): Enotita[] {
  return enotites.map((e) => ({
    ...e,
    proapaitoumenes: e.proapaitoumenes.filter(
      (p) =>
        !akmes.some(
          (a) => a.pros === e.id && a.apo === p.enotita_id
        )
    ),
  }));
}

describe('topologiki_taxinomisi', () => {
  it('orders a linear chain prerequisite first', () => {
    const enotites = [
      enotita('c', 3, [proapaitoumeno('b')]),
      enotita('a', 1),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual(['a', 'b', 'c']);
    }
  });

  it('orders a diamond graph with stable seira then id tie-break', () => {
    const enotites = [
      enotita('d', 4, [proapaitoumeno('b'), proapaitoumeno('c')]),
      enotita('b', 2, [proapaitoumeno('a')]),
      enotita('c', 3, [proapaitoumeno('a')]),
      enotita('a', 1),
    ];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('breaks ties by id when seira is equal', () => {
    const enotites = [
      enotita('a', 1),
      enotita('b', 1),
      enotita('c', 1),
      enotita('d', 2, [proapaitoumeno('a'), proapaitoumeno('b'), proapaitoumeno('c')]),
    ];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('orders by seira before id', () => {
    const enotites = [
      enotita('a', 5, [proapaitoumeno('b')]),
      enotita('b', 1),
    ];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual(['b', 'a']);
    }
  });

  it('rejects a reference to a nonexistent unit', () => {
    const enotites = [enotita('a', 1, [proapaitoumeno('den-yparxei')])];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('rejects duplicate unit ids', () => {
    const enotites = [enotita('a', 1), enotita('a', 2)];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('returns an error for graphs with cycles', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('b')]),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = topologiki_taxinomisi(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('returns an empty order for empty input', () => {
    const res = topologiki_taxinomisi([]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([]);
    }
  });

  it('is deterministic under shuffled input', () => {
    const base = [
      enotita('a', 1),
      enotita('b', 2, [proapaitoumeno('a')]),
      enotita('c', 2, [proapaitoumeno('a')]),
      enotita('d', 3, [proapaitoumeno('b'), proapaitoumeno('c')]),
      enotita('e', 4, [proapaitoumeno('d')]),
      enotita('f', 1, [proapaitoumeno('e')]),
    ];
    const expected = topologiki_taxinomisi(base);
    const shuffled = [...base].reverse();
    const actual = topologiki_taxinomisi(shuffled);
    expect(actual).toEqual(expected);
  });

  it('deduplicates repeated prerequisites with the strong edge winning', () => {
    const enotites = [
      enotita('a', 1, [
        proapaitoumeno('b', 'asthenis'),
        proapaitoumeno('b'),
      ]),
      enotita('b', 2, [proapaitoumeno('a', 'asthenis')]),
    ];
    const taxinomisi = topologiki_taxinomisi(enotites);
    expect(taxinomisi.ok).toBe(false);

    const kykloi = vres_kyklous(enotites);
    expect(kykloi.ok).toBe(true);
    if (kykloi.ok) {
      expect(kykloi.timi).toEqual([['a', 'b']]);
    }

    const episkevi = episkevi_kyklon(enotites);
    expect(episkevi.ok).toBe(true);
    if (episkevi.ok) {
      expect(episkevi.timi.afairemenes_akmes).toEqual([
        { apo: 'a', pros: 'b', isxys: 'asthenis' },
      ]);
    }
  });
});

describe('vres_kyklous', () => {
  it('finds no cycles in an acyclic graph', () => {
    const enotites = [
      enotita('a', 1),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([]);
    }
  });

  it('finds a 2-node cycle starting from the smallest id', () => {
    const enotites = [
      enotita('b', 1, [proapaitoumeno('a')]),
      enotita('a', 2, [proapaitoumeno('b')]),
    ];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([['a', 'b']]);
    }
  });

  it('finds a 3-node cycle', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('c')]),
      enotita('b', 2, [proapaitoumeno('a')]),
      enotita('c', 3, [proapaitoumeno('b')]),
    ];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([['a', 'b', 'c']]);
    }
  });

  it('finds a self-loop', () => {
    const enotites = [enotita('a', 1, [proapaitoumeno('a')])];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([['a']]);
    }
  });

  it('finds multiple independent cycles ordered by smallest id', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('b')]),
      enotita('b', 2, [proapaitoumeno('a')]),
      enotita('c', 3, [proapaitoumeno('d')]),
      enotita('d', 4, [proapaitoumeno('c')]),
    ];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    }
  });

  it('rejects references to nonexistent units', () => {
    const enotites = [enotita('a', 1, [proapaitoumeno('fantasma')])];
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('returns an empty list for empty input', () => {
    const res = vres_kyklous([]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toEqual([]);
    }
  });

  it('aborts with MI_EGKYRO_SXIMA when the step budget is exhausted', () => {
    const plethos = 3200;
    const enotites: Enotita[] = [];
    for (let i = 0; i < plethos; i += 1) {
      const proigoumeno = (i + plethos - 1) % plethos;
      enotites.push(enotita(`k${String(i).padStart(5, '0')}`, i, [proapaitoumeno(`k${String(proigoumeno).padStart(5, '0')}`)]));
    }
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('aborts with MI_EGKYRO_SXIMA when the cycle cap is reached', () => {
    const zeugaria = 500;
    const enotites: Enotita[] = [];
    for (let i = 0; i < zeugaria; i += 1) {
      enotites.push(enotita(`a${i}`, 2 * i, [proapaitoumeno(`b${i}`)]));
      enotites.push(enotita(`b${i}`, 2 * i + 1, [proapaitoumeno(`a${i}`)]));
    }
    const res = vres_kyklous(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('episkevi_kyklon', () => {
  it('removes no edges from an acyclic graph', () => {
    const enotites = [
      enotita('a', 1),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([]);
    }
  });

  it('removes the weak edge before the strong one', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('b', 'asthenis')]),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([
        { apo: 'b', pros: 'a', isxys: 'asthenis' },
      ]);
    }
  });

  it('removes the lexicographically smallest edge when none is weak', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('b')]),
      enotita('b', 2, [proapaitoumeno('a')]),
    ];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([
        { apo: 'a', pros: 'b', isxys: 'isxyri' },
      ]);
    }
  });

  it('removes a self-loop edge', () => {
    const enotites = [enotita('a', 1, [proapaitoumeno('a', 'asthenis')])];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([
        { apo: 'a', pros: 'a', isxys: 'asthenis' },
      ]);
    }
  });

  it('removes the smallest weak edge even when it is not the first', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('d')]),
      enotita('b', 2, [proapaitoumeno('c', 'asthenis')]),
      enotita('c', 3, [proapaitoumeno('a')]),
      enotita('d', 4, [proapaitoumeno('b', 'asthenis')]),
    ];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([
        { apo: 'b', pros: 'd', isxys: 'asthenis' },
      ]);
    }
  });

  it('repairs multiple cycles until the graph is acyclic', () => {
    const enotites = [
      enotita('a', 1, [proapaitoumeno('b')]),
      enotita('b', 2, [proapaitoumeno('a')]),
      enotita('c', 3, [proapaitoumeno('d', 'asthenis')]),
      enotita('d', 4, [proapaitoumeno('c')]),
      enotita('e', 5, [proapaitoumeno('a')]),
    ];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([
        { apo: 'a', pros: 'b', isxys: 'isxyri' },
        { apo: 'd', pros: 'c', isxys: 'asthenis' },
      ]);
      const repaired = afairese_akmes(enotites, res.timi.afairemenes_akmes);
      const meta = topologiki_taxinomisi(repaired);
      expect(meta.ok).toBe(true);
      if (meta.ok) {
        expect(meta.timi).toEqual(['b', 'a', 'c', 'd', 'e']);
      }
    }
  });

  it('rejects references to nonexistent units', () => {
    const enotites = [enotita('a', 1, [proapaitoumeno('keno')])];
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('returns no removed edges for empty input', () => {
    const res = episkevi_kyklon([]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.afairemenes_akmes).toEqual([]);
    }
  });

  it('aborts with MI_EGKYRO_SXIMA when the repair exceeds the step budget', () => {
    const plethos = 3200;
    const enotites: Enotita[] = [];
    for (let i = 0; i < plethos; i += 1) {
      const proigoumeno = (i + plethos - 1) % plethos;
      enotites.push(enotita(`k${String(i).padStart(5, '0')}`, i, [proapaitoumeno(`k${String(proigoumeno).padStart(5, '0')}`)]));
    }
    const res = episkevi_kyklon(enotites);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('elegxos_kalypsis', () => {
  it('reports sections not covered by the map sources', () => {
    const perigrammata = [
      perigramma('arx-1', [
        tmima('Eisagogi', 1, 5),
        tmima('Theoria', 8, 11),
        tmima('Askiseis', 20, 22),
      ]),
      perigramma('arx-2', [tmima('Orismoi', 1, 3)]),
    ];
    const enotites = [
      enotita('en-1', 1, []),
      enotita('en-2', 2, []),
    ];
    const withPiges = enotites.map((e, i) => ({
      ...e,
      piges:
        i === 0
          ? [{ arxeio_id: 'arx-1', apo: 1, eos: 6 }]
          : [{ arxeio_id: 'arx-1', apo: 8, eos: 10 }],
    }));
    const res = elegxos_kalypsis(perigrammata, xartis(withPiges));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.akalypta_tmimata).toEqual([
        { arxeio_id: 'arx-1', titlos: 'Theoria', apo: 8, eos: 11 },
        { arxeio_id: 'arx-1', titlos: 'Askiseis', apo: 20, eos: 22 },
        { arxeio_id: 'arx-2', titlos: 'Orismoi', apo: 1, eos: 3 },
      ]);
    }
  });

  it('treats merged and overlapping source ranges as coverage', () => {
    const perigrammata = [
      perigramma('arx-1', [
        tmima('Enomeno', 4, 5),
        tmima('Epikalyptomeno', 3, 9),
      ]),
    ];
    const enotites = [enotita('en-1', 1, [])];
    const withPiges = enotites.map((e) => ({
      ...e,
      piges: [
        { arxeio_id: 'arx-1', apo: 1, eos: 5 },
        { arxeio_id: 'arx-1', apo: 1, eos: 3 },
        { arxeio_id: 'arx-1', apo: 6, eos: 10 },
        { arxeio_id: 'arx-1', apo: 3, eos: 12 },
      ],
    }));
    const res = elegxos_kalypsis(perigrammata, xartis(withPiges));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.akalypta_tmimata).toEqual([]);
    }
  });

  it('returns no uncovered sections for empty input', () => {
    const res = elegxos_kalypsis([], xartis([]));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.akalypta_tmimata).toEqual([]);
    }
  });
});
