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
    // Αρκετό υλικό ώστε η προγραμματισμένη εργασία να διασπίζει την
    // ημέρα αλλαγής ώρας (2026-10-25, κυριακή 30 λεπτά × 0,8 = 24).
    const res = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e1', 600, [], null, 0)], '2026-11-05')], '2026-10-20', '2026-11-06'),
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
    expect(ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')], 'pote', null)).ok).toBe(false);
    expect(ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-02-30')], '2026-10-12', null)).ok).toBe(false);
    expect(ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')], '2026-00-10', null)).ok).toBe(false);
    expect(ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', -5)], '2026-10-20')], '2026-10-12', null)).ok).toBe(false);
    expect(ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', Number.NaN)], '2026-10-20')], '2026-10-12', null)).ok).toBe(false);
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

describe('ftiaxe_programma validation and branches', () => {
  it('rejects bad availability, empty courses and bad season start', () => {
    const base_mathimata = [mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')];
    const lathos_template = ftiaxe_programma({ ...eisodos(base_mathimata), diathesimotita: { ana_imera_evdomadas: [60, 60], overrides: {} } });
    expect(lathos_template.ok).toBe(false);
    const arnitiki = ftiaxe_programma({ ...eisodos(base_mathimata), diathesimotita: { ana_imera_evdomadas: [60, 60, 60, 60, 60, 60, -1], overrides: {} } });
    expect(arnitiki.ok).toBe(false);
    const lathos_override = ftiaxe_programma({ ...eisodos(base_mathimata), diathesimotita: { ana_imera_evdomadas: [60, 60, 60, 60, 60, 60, 60], overrides: { 'oxi-mera': 10 } } });
    expect(lathos_override.ok).toBe(false);
    const arnitiko_override = ftiaxe_programma({ ...eisodos(base_mathimata), diathesimotita: { ana_imera_evdomadas: [60, 60, 60, 60, 60, 60, 60], overrides: { '2026-10-13': -5 } } });
    expect(arnitiko_override.ok).toBe(false);
    expect(ftiaxe_programma(eisodos([], '2026-10-12', null)).ok).toBe(false);
    expect(ftiaxe_programma(eisodos(base_mathimata, '2026-10-12', 'pote')).ok).toBe(false);
  });

  it('rejects duplicate unit ids, cycles and bad checkins', () => {
    const dipla = ftiaxe_programma(
      eisodos([mathima('A', [enotita('e', 60)], '2026-10-20'), mathima('B', [enotita('e', 30)], '2026-10-21')], '2026-10-12', null)
    );
    expect(dipla.ok).toBe(false);

    const kyklos = ftiaxe_programma(
      eisodos([mathima('A', [enotita('e1', 60, ['e2']), enotita('e2', 30, ['e1'])], '2026-10-20')], '2026-10-12', null)
    );
    expect(kyklos.ok).toBe(false);

    const base = eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')]);
    expect(ftiaxe_programma({ ...base, checkins: [{ enotita_id: 'e1', imerominia: 'pote', pragmatika_lepta: 5, oloklirothike: false }] }).ok).toBe(false);
    expect(ftiaxe_programma({ ...base, checkins: [{ enotita_id: 'e1', imerominia: '2026-10-12', pragmatika_lepta: -5, oloklirothike: false }] }).ok).toBe(false);
    expect(ftiaxe_programma({ ...base, checkins: [{ enotita_id: 'e1', imerominia: '2026-10-13', pragmatika_lepta: 5, oloklirothike: false }] }).ok).toBe(false);
  });

  it('uses the season start when an exam date is unknown', () => {
    const res = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], null)], '2026-10-12', '2026-10-20'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(60, 10);
  });

  it('works without a season start up to the deadlines', () => {
    const res = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-15')], '2026-10-12', null));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(60, 10);
  });

  it('stops new material on the season start and revises after', () => {
    const res = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')], '2026-10-12', '2026-10-15'));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    for (const mera of res.timi.meres) {
      if (mera.imerominia >= '2026-10-15') {
        expect(mera.ergasies.some((e) => e.eidos === 'nea_yli')).toBe(false);
      }
    }
  });

  it('skips a zero-capacity day via override', () => {
    const res = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-16')], '2026-10-12', null),
      diathesimotita: { ana_imera_evdomadas: [120, 120, 120, 120, 120, 120, 120], overrides: { '2026-10-13': 0 } },
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi.meres.some((m) => m.imerominia === '2026-10-13')).toBe(false);
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(60, 10);
  });

  it('carries an oversized review to the next day', () => {
    const base = eisodos(
      [mathima('PLI-1', [enotita('ea', 60, [], null, 0), enotita('eb', 60, [], null, 1)], '2026-10-30')],
      '2026-10-12',
      null
    );
    const res = ftiaxe_programma({
      ...base,
      diathesimotita: { ana_imera_evdomadas: [120, 30, 120, 120, 120, 120, 120], overrides: {} },
      checkins: [
        { enotita_id: 'ea', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true },
        { enotita_id: 'eb', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const mera13 = res.timi.meres.find((m) => m.imerominia === '2026-10-13');
    expect(mera13).toBeDefined();
    const synolo = (mera13?.ergasies ?? []).reduce((s, e) => s + e.lepta, 0);
    expect(synolo).toBeLessThanOrEqual(24 + 1e-9);
  });

  it('drops reviews outside the study window', () => {
    const palia = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e-old', 60, [], null, 0), enotita('e-new', 30, [], null, 1)], '2026-10-30')], '2026-10-12', null),
      checkins: [{ enotita_id: 'e-old', imerominia: '2026-10-01', pragmatika_lepta: 60, oloklirothike: true }],
    });
    expect(palia.ok).toBe(true);
    if (!palia.ok) return;
    const epanalipseis_old = palia.timi.meres.flatMap((m) => m.ergasies).filter((e) => e.enotita_id === 'e-old');
    expect(epanalipseis_old).toEqual([]);

    const konta = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e1', 60)], '2026-10-13')], '2026-10-12', null),
      checkins: [{ enotita_id: 'e1', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true }],
    });
    expect(konta.ok).toBe(true);
  });

  it('handles zero-minute units and partial checkins', () => {
    const miden = ftiaxe_programma(eisodos([mathima('PLI-1', [enotita('e0', 0), enotita('e1', 60)], '2026-10-20')], '2026-10-12', null));
    expect(miden.ok).toBe(true);
    if (!miden.ok) return;
    expect(miden.timi.meres.flatMap((m) => m.ergasies).some((e) => e.enotita_id === 'e0')).toBe(false);

    const miden_checkin = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e0', 0), enotita('e1', 60)], '2026-10-20')], '2026-10-12', null),
      checkins: [{ enotita_id: 'e0', imerominia: '2026-10-12', pragmatika_lepta: 0, oloklirothike: true }],
    });
    expect(miden_checkin.ok).toBe(true);
    if (!miden_checkin.ok) return;
    expect(miden_checkin.timi.meres.flatMap((m) => m.ergasies).some((e) => e.enotita_id === 'e0')).toBe(false);

    const merika = ftiaxe_programma({
      ...eisodos([mathima('PLI-1', [enotita('e1', 100)], '2026-10-25')], '2026-10-12', null),
      checkins: [
        { enotita_id: 'e1', imerominia: '2026-10-11', pragmatika_lepta: 20, oloklirothike: false },
        { enotita_id: 'e1', imerominia: '2026-10-10', pragmatika_lepta: 30, oloklirothike: false },
      ],
    });
    expect(merika.ok).toBe(true);
    if (!merika.ok) return;
    expect(synolika_lepta(merika.timi, 'nea_yli')).toBeCloseTo(50, 10);
  });

  it('supports a course without units', () => {
    const res = ftiaxe_programma(
      eisodos([mathima('Keno', [], '2026-10-20'), mathima('PLI-1', [enotita('e1', 60)], '2026-10-20')], '2026-10-12', null)
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(synolika_lepta(res.timi, 'nea_yli')).toBeCloseTo(60, 10);
    expect(res.timi.slack_ana_mathima['Keno']).toBeGreaterThanOrEqual(0);
  });

  it('orders carried reviews before fresher ones on the same day', () => {
    const res = ftiaxe_programma({
      ...eisodos(
        [mathima('PLI-1', [
          enotita('e-a', 60, [], null, 0),
          enotita('e-b', 60, [], null, 1),
          enotita('e-c', 60, [], null, 2),
          enotita('e-d', 64, [], null, 3),
        ], '2026-10-30')],
        '2026-10-13',
        null
      ),
      diathesimotita: { ana_imera_evdomadas: [60, 60, 60, 60, 60, 60, 60], overrides: {} },
      checkins: [
        { enotita_id: 'e-a', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true },
        { enotita_id: 'e-b', imerominia: '2026-10-13', pragmatika_lepta: 60, oloklirothike: true },
        { enotita_id: 'e-c', imerominia: '2026-10-13', pragmatika_lepta: 60, oloklirothike: true },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const mera15 = res.timi.meres.find((m) => m.imerominia === '2026-10-15');
    expect(mera15?.ergasies.map((e) => e.enotita_id)).toEqual(['e-c', 'e-a', 'e-d']);
  });

  it('sorts same-day reviews by deadline', () => {
    const res = ftiaxe_programma({
      ...eisodos([
        mathima('B', [enotita('eb', 60, [], null, 0)], '2026-10-30'),
        mathima('A', [enotita('ea', 60, [], null, 0)], '2026-10-15'),
      ], '2026-10-12', null),
      checkins: [
        { enotita_id: 'ea', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true },
        { enotita_id: 'eb', imerominia: '2026-10-12', pragmatika_lepta: 60, oloklirothike: true },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const mera13 = res.timi.meres.find((m) => m.imerominia === '2026-10-13');
    expect(mera13?.ergasies[0]?.enotita_id).toBe('ea');
  });

  it('sorts survival candidates by yield, minutes and id', () => {
    const res = ftiaxe_programma(
      eisodos(
        [mathima('PLI-1', [
          enotita('e-flira', 1000, [], 5, 0),
          enotita('e-mid', 100, [], 5, 1),
          enotita('e-mid2', 100, [], 5, 2),
          enotita('e-agnosto', 50, [], null, 4),
          enotita('e-agnosto2', 40, [], null, 5),
          enotita('e-sos', 60, [], 90, 3),
        ], '2026-10-13')],
        '2026-10-12',
        '2026-11-01'
      )
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.timi.protasi_epiviosis[0]?.ypopshfies.map((y) => y.enotita_id)).toEqual(['e-agnosto', 'e-agnosto2', 'e-flira', 'e-mid', 'e-mid2', 'e-sos']);
  });
});
