import { describe, it, expect } from 'vitest';
import type { Enotita } from '../contracts/montela.js';
import type { EisodosProgrammatos, MathimaProgrammatos } from './index.js';
import { ftiaxe_programma } from './index.js';

function enotita(
  id: string,
  lepta: number | null,
  proaps: string[] = [],
  apodosi: number | null = null,
  seira = 0
): Enotita {
  return {
    id,
    titlos: `Enotita ${id}`,
    piges: [],
    ennoies: [],
    proapaitoumenes: proaps.map((enotita_id) => ({ enotita_id, isxys: 'isxyri' as const })),
    seira,
    lepta_ektimisi: lepta,
    apodosi_exetasis: apodosi,
  };
}

function mathima(
  kodikos: string,
  enotites: Enotita[],
  imerominia_exetasis: string | null
): MathimaProgrammatos {
  return { kodikos_mathimatos: kodikos, enotites, imerominia_exetasis };
}

const diathesimotita_120 = {
  ana_imera_evdomadas: [120, 120, 120, 120, 120, 120, 120],
  overrides: {},
};

function eisodos(
  mathimata: MathimaProgrammatos[],
  simera = '2026-10-12',
  arxi: string | null = '2026-11-01'
): EisodosProgrammatos {
  return {
    mathimata,
    diathesimotita: diathesimotita_120,
    checkins: [],
    simera,
    arxi_exetastikis: arxi,
  };
}

function synolika_lepta(programma: { meres: { ergasies: { eidos: string; lepta: number }[] }[] }, eidos: string): number {
  return programma.meres.flatMap((m) => m.ergasies)
    .filter((e) => e.eidos === eidos)
    .reduce((s, e) => s + e.lepta, 0);
}

describe('ftiaxe_programma', () => {
  it('schedules one course with one exam inside capacity', () => {
    const res = ftiaxe_programma(
      eisodos([mathima('PLI-1', [enotita('e1', 60, [], null, 0), enotita('e2', 30, ['e1'], null, 1)], '2026-10-22')])
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(90, 10);
    for (const mera of res.timi.meres) {
      const synolo = mera.ergasies.reduce((s, e) => s + e.lepta, 0);
      expect(synolo).toBeLessThanOrEqual(96 + 1e-9);
    }
    const seira = res.timi.meres.flatMap((m) => m.ergasies).filter((e) => e.eidos === 'nea_yli');
    const teleutaia_e1 = seira.map((e) => e.enotita_id).lastIndexOf('e1');
    const proti_e2 = seira.map((e) => e.enotita_id).indexOf('e2');
    expect(teleutaia_e1).toBeLessThan(proti_e2);
    expect(res.timi.protasi_epiviosis).toEqual([]);
  });

  it('orders courses by earliest deadline first', () => {
    const res = ftiaxe_programma(
      eisodos([
        mathima('B', [enotita('eb', 60, [], null, 0)], '2026-10-30'),
        mathima('A', [enotita('ea', 60, [], null, 0)], '2026-10-15'),
      ])
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const proti_nea = res.timi.meres.flatMap((m) => m.ergasies).find((e) => e.eidos === 'nea_yli');
    expect(proti_nea?.kodikos_mathimatos).toBe('A');
  });

  it('schedules five exams in three weeks', () => {
    const mathimata = ['M1', 'M2', 'M3', 'M4', 'M5'].map((k, i) =>
      mathima(k, [enotita(`e-${k}`, 120, [], null, 0)], `2026-10-${13 + i * 4}`)
    );
    const res = ftiaxe_programma(eisodos(mathimata, '2026-10-12', '2026-11-02'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(600, 10);
    for (const mera of res.timi.meres) {
      const synolo = mera.ergasies.reduce((s, e) => s + e.lepta, 0);
      expect(synolo).toBeLessThanOrEqual(96 + 1e-9);
    }
  });

  it('charges reviews before new material', () => {
    const base = eisodos([mathima('PLI-1', [enotita('e-done', 60, [], null, 0), enotita('e-new', 60, [], null, 1)], '2026-10-30')]);
    const res = ftiaxe_programma({
      ...base,
      checkins: [{ enotita_id: 'e-done', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true }],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const mera13 = res.timi.meres.find((m) => m.imerominia === '2026-10-13');
    expect(mera13).toBeDefined();
    expect(mera13?.ergasies[0]?.eidos).toBe('epanalipsi');
    expect(mera13?.ergasies[0]?.enotita_id).toBe('e-done');
  });

  it('recomputes after a skipped day without exceeding capacity', () => {
    const mathimata = [mathima('PLI-1', [enotita('e1', 200, [], null, 0)], '2026-10-25')];
    const res = ftiaxe_programma(eisodos(mathimata, '2026-10-14', '2026-11-01'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    for (const mera of res.timi.meres) {
      const synolo = mera.ergasies.reduce((s, e) => s + e.lepta, 0);
      expect(synolo).toBeLessThanOrEqual(96 + 1e-9);
      expect(mera.imerominia >= '2026-10-14').toBe(true);
    }
  });

  it('proposes survival candidates when slack is negative', () => {
    const res = ftiaxe_programma(
      eisodos(
        [mathima('PLI-1', [
          enotita('e-flira', 1000, [], 5, 0),
          enotita('e-sos', 60, [], 90, 1),
        ], '2026-10-13')],
        '2026-10-12',
        '2026-11-01'
      )
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi.slack_ana_mathima['PLI-1'] ?? 0).toBeLessThan(0);
    expect(res.timi.protasi_epiviosis).toHaveLength(1);
    expect(res.timi.protasi_epiviosis[0]?.ypopshfies[0]?.enotita_id).toBe('e-flira');
  });

  it('handles the DST change on 2026-10-25 with calendar days', () => {
    const res = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e1', 60, [], null, 0)], '2026-11-05')], '2026-10-20', '2026-11-06'),
      diathesimotita: {
        ana_imera_evdomadas: [120, 120, 120, 120, 120, 120, 30],
        overrides: {},
      },
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const imerominies = res.timi.meres.map((m) => m.imerominia);
    expect(imerominies).toContain('2026-10-24');
    expect(imerominies).toContain('2026-10-25');
    expect(imerominies).toContain('2026-10-26');
    const kyriaki = res.timi.meres.find((m) => m.imerominia === '2026-10-25');
    const synolo = (kyriaki?.ergasies ?? []).reduce((s, e) => s + e.lepta, 0);
    expect(synolo).toBeLessThanOrEqual(24 + 1e-9);
  });

  it('is deterministic', () => {
    const input = eisodos([
      mathima('B', [enotita('eb', 60, [], 10, 0)], '2026-10-30'),
      mathima('A', [enotita('ea', 45, [], 90, 0), enotita('ea2', 30, ['ea'], 20, 1)], '2026-10-15'),
    ]);
    const prwto = ftiaxe_programma(input);
    const deutero = ftiaxe_programma(input);
    expect(deutero).toEqual(prwto);
  });

  it('rejects invalid input', () => {
    const bad_date = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], 'oxi-imerominia')]));
    expect(bad_date.ok).toBe(false);

    const base = eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')]);
    const agnosto_checkin = ftiaxe_programma({
      ...base,
      checkins: [{ enotita_id: 'fantasma', imerominia: '2026-10-12', pragmatika_lepta: 10, oloklirothike: false }],
    });
    expect(agnosto_checkin.ok).toBe(false);
    if (!agnosto_checkin.ok) {
      expect(agnosto_checkin.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }

    const null_lepta = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', null)], '2026-10-20')]));
    expect(null_lepta.ok).toBe(false);

    const xoris_deadline = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], null)], '2026-10-12', null));
    expect(xoris_deadline.ok).toBe(false);
  });
});
