import { describe, it, expect } from 'vitest';
import type { Selida, Tmima } from '../contracts/montela.js';
import { ektimisi_lepton, enimerosi_syntelesti } from './index.js';
import type { Perigramma } from '../contracts/montela.js';

function selida(
  arxeio_id: string,
  arithmos: number,
  lekseis: number
): Selida {
  return {
    arxeio_id,
    arithmos,
    keimeno: '',
    lekseis,
    xoris_keimeno: false,
  };
}

function tmima(
  titlos: string,
  apo: number,
  eos: number,
  typos: Tmima['typos']
): Tmima {
  return {
    titlos,
    selides: { apo, eos },
    typos,
    ennoies: [],
    proapaitoumena: [],
  };
}

function perigramma(arxeio_id: string, tmimata: Tmima[]): Perigramma {
  return { arxeio_id, titlos: `Perigramma ${arxeio_id}`, tmimata };
}

describe('ektimisi_lepton', () => {
  it('returns 0 for a section with no pages available', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 3, 'theoria')]),
      []
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe(0);
    }
  });

  it('returns 0 when no page belongs to the section file', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 3, 'theoria')]),
      [selida('arx-2', 1, 120), selida('arx-2', 2, 120)]
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe(0);
    }
  });

  it('uses the default user coefficient of 1', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, 120)]
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBeCloseTo(3.0, 10);
    }
  });

  it('multiplies by the user coefficient', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, 120)],
      2
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBeCloseTo(6.0, 10);
    }
  });

  it('rejects a NaN word count', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, Number.NaN)]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects a negative word count', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, -10)]
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('rejects a non-finite user coefficient', () => {
    const per = perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]);
    const pages = [selida('arx-1', 1, 120)];
    for (const syntelestis of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const res = ektimisi_lepton(per, pages, syntelestis);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('clamps the word ratio to the lower bound for very short pages', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, 6)]
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 6/120 = 0.05 → 0.3 · 3.0 × 0.3
      expect(res.timi).toBeCloseTo(0.9, 10);
    }
  });

  it('clamps the word ratio to the upper bound for very long pages', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 1, 'theoria')]),
      [selida('arx-1', 1, 1000)]
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 1000/120 ≈ 8.33 → 3.0 · 3.0 × 3.0
      expect(res.timi).toBeCloseTo(9.0, 10);
    }
  });

  it('sums multiple sections and pages from the constants', () => {
    const per = perigramma('arx-1', [
      tmima('Theoria', 1, 2, 'theoria'),
      tmima('Askiseis', 4, 5, 'askiseis'),
    ]);
    const selides = [
      selida('arx-1', 1, 12),
      selida('arx-1', 2, 240),
      selida('arx-1', 4, 120),
      selida('arx-1', 5, 6),
    ];
    const res = ektimisi_lepton(per, selides, 1.5);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // p1: 3.0×0.3=0.9 · p2: 3.0×2.0=6.0 · p4: 8.0×1.0=8.0 · p5: 8.0×0.3=2.4
      // Σ = 17.3 · × 1.5 = 25.95
      expect(res.timi).toBeCloseTo(25.95, 10);
    }
  });

  it('skips pages missing from the table without failing', () => {
    const res = ektimisi_lepton(
      perigramma('arx-1', [tmima('Theoria', 1, 3, 'theoria')]),
      [selida('arx-1', 1, 120), selida('arx-1', 3, 240)]
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      // μόνο p1 (3.0×1.0) και p3 (3.0×2.0)
      expect(res.timi).toBeCloseTo(9.0, 10);
    }
  });

  it('is deterministic under shuffled pages', () => {
    const per = perigramma('arx-1', [
      tmima('Theoria', 1, 2, 'theoria'),
      tmima('Askiseis', 4, 5, 'askiseis'),
    ]);
    const selides = [
      selida('arx-1', 1, 12),
      selida('arx-1', 2, 240),
      selida('arx-1', 4, 120),
      selida('arx-1', 5, 6),
    ];
    const expected = ektimisi_lepton(per, selides, 1.5);
    const shuffled = ektimisi_lepton(per, [...selides].reverse(), 1.5);
    expect(shuffled).toEqual(expected);
  });

  it('applies the minutes rate of each section type', () => {
    const per = perigramma('arx-1', [
      tmima('Eisagogi', 1, 1, 'eisagogi'),
      tmima('Apodeixi', 2, 2, 'apodeixi'),
    ]);
    const res = ektimisi_lepton(per, [
      selida('arx-1', 1, 120),
      selida('arx-1', 2, 120),
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 1.5×1.0 + 5.0×1.0
      expect(res.timi).toBeCloseTo(6.5, 10);
    }
  });
});

describe('enimerosi_syntelesti', () => {
  it('moves the coefficient with EWMA', () => {
    const res = enimerosi_syntelesti(1.0, 20, 30);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 0.7×1.0 + 0.3×(30/20) = 0.7 + 0.45
      expect(res.timi).toBeCloseTo(1.15, 10);
    }
  });

  it('clamps to the upper bound', () => {
    const res = enimerosi_syntelesti(3.0, 10, 50);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 0.7×3.0 + 0.3×5.0 = 3.6 → 3.0
      expect(res.timi).toBeCloseTo(3.0, 10);
    }
  });

  it('clamps to the lower bound', () => {
    const res = enimerosi_syntelesti(0.5, 10, 0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 0.7×0.5 + 0.3×0 = 0.35 → 0.5
      expect(res.timi).toBeCloseTo(0.5, 10);
    }
  });

  it('rejects a non-positive estimate', () => {
    for (const ektimisi of [0, -5, Number.NaN]) {
      const res = enimerosi_syntelesti(1.0, ektimisi, 30);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('rejects negative or non-finite actual minutes', () => {
    for (const pragmatika of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const res = enimerosi_syntelesti(1.0, 20, pragmatika);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('rejects an old coefficient outside the allowed range', () => {
    for (const palios of [0.4, 3.5, Number.NaN]) {
      const res = enimerosi_syntelesti(palios, 20, 30);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      }
    }
  });

  it('accepts the boundary values of the old coefficient', () => {
    const res = enimerosi_syntelesti(0.5, 10, 5);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // 0.7×0.5 + 0.3×0.5 = 0.5
      expect(res.timi).toBeCloseTo(0.5, 10);
    }
  });
});
