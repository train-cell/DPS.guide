import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, Arxeio, Mathima, Selida, XartisMathimatos } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import {
  ftiaxe_arxeio_id,
  parade_json,
  grapse_json,
  diavase_json,
  diavase_json_lista,
  analysise_json,
  diavase_mathimata,
  grapse_arxeia,
  diavase_keimeno,
  diavase_xarti,
} from './apothiki-json.js';

const apothiki = new MnimiApothiki();

describe('ftiaxe_arxeio_id', () => {
  it('υπολογίζει το id', () => {
    expect(ftiaxe_arxeio_id('M1', 'arx-1')).toBe('f547d296bec02dd7b064d44d1592e96e2c08fe3a7a55598f7c3f2d9d131853c3');
  });
});

describe('parade_json', () => {
  it('γράφει με 2 κενά και τελική γραμμή', () => {
    expect(parade_json({ a: 1 })).toBe('{\n  "a": 1\n}\n');
  });
});

describe('grapse_json', () => {
  it('γράφει JSON', async () => {
    const res = await grapse_json(apothiki, 'test.json', { a: 1 });
    expect(res.ok).toBe(true);
    const read = await apothiki.diavase_keimeno('test.json');
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.timi).toBe('{\n  "a": 1\n}\n');
  });
});

describe('diavase_json', () => {
  it('επιτυχία', async () => {
    await apothiki.grapse_keimeno('a.json', JSON.stringify({ a: 1 }));
    const res = await diavase_json(apothiki, 'a.json', { safeParse: (v: unknown) => ({ success: true, data: v }) } as any, 'a.json');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi).toEqual({ a: 1 });
  });

  it('μη έγκυρο JSON', async () => {
    await apothiki.grapse_keimeno('b.json', '{invalid}');
    const res = await diavase_json(apothiki, 'b.json', { safeParse: () => ({ success: true, data: null }) } as any, 'b.json');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δεν ταιριάζει με το σχήμα', async () => {
    await apothiki.grapse_keimeno('c.json', JSON.stringify({ a: 1 }));
    const res = await diavase_json(apothiki, 'c.json', { safeParse: () => ({ success: false, error: new Error('bad') }) } as any, 'c.json');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('diavase_json_lista', () => {
  it('επιτυχία', async () => {
    await apothiki.grapse_keimeno('d.json', JSON.stringify([{ a: 1 }, { a: 2 }]));
    const res = await diavase_json_lista(apothiki, 'd.json', { safeParse: (v: unknown) => ({ success: true, data: v }) } as any, 'd.json');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(2);
  });

  it('δεν είναι λίστα', async () => {
    await apothiki.grapse_keimeno('e.json', JSON.stringify({ a: 1 }));
    const res = await diavase_json_lista(apothiki, 'e.json', { safeParse: () => ({ success: true, data: null }) } as any, 'e.json');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('στοιχείο δεν ταιριάζει', async () => {
    await apothiki.grapse_keimeno('f.json', JSON.stringify([{ a: 1 }, 'όχι']));
    const res = await diavase_json_lista(apothiki, 'f.json', { safeParse: () => ({ success: false, error: new Error('bad') }) } as any, 'f.json');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('analysise_json', () => {
  it('valid JSON', () => {
    expect(analysise_json('{"a":1}', 't')).toEqual(ok({ a: 1 }));
  });

  it('invalid JSON', () => {
    const res = analysise_json('{', 't');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('diavase_mathimata', () => {
  it('επιτυχία', async () => {
    await apothiki.grapse_keimeno(
      'mathimata.json',
      JSON.stringify([{ kodikos: 'M1', titlos: 'Μ', url: '', epilegmeno: true }])
    );
    const res = await diavase_mathimata(apothiki, '');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(1);
  });

  it('δεν είναι λίστα', async () => {
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify({}));
    const res = await diavase_mathimata(apothiki, '');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('grapse_arxeia', () => {
  it('γράφει το ευρετήριο', async () => {
    const arxeia: Arxeio[] = [{ id: 'id1', kodikos_mathimatos: 'M1', diadromi: 'a.pdf', url: 'u', megethos: 1, imerominia: null, etag: null, sha256: 'h', diplotypo_tou: null }];
    const res = await grapse_arxeia(apothiki, '', 'M1', arxeia);
    expect(res.ok).toBe(true);
    const read = await apothiki.diavase_keimeno('M1/.spoudes/eurethrio-arxeion.json');
    expect(read.ok).toBe(true);
    if (read.ok) expect(JSON.parse(read.timi).length).toBe(1);
  });
});

describe('diavase_keimeno', () => {
  it('επιτυχία', async () => {
    await apothiki.grapse_keimeno('M1/.spoudes/keimeno/a.json', JSON.stringify([{ arxeio_id: 'a', arithmos: 1, keimeno: 'κ', lekseis: 2, xoris_keimeno: false }]));
    const res = await diavase_keimeno(apothiki, '', 'M1', 'a');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(1);
  });

  it('δεν υπάρχει αρχείο', async () => {
    const res = await diavase_keimeno(new MnimiApothiki(), '', 'M1', 'x');
    expect(res.ok).toBe(false);
  });
});

describe('diavase_xarti', () => {
  it('επιτυχία', async () => {
    const xartis: XartisMathimatos = {
  kodikos_mathimatos: 'M1',
  enotites: [
    {
      id: 'enot-1',
      titlos: 'Ενότητα',
      piges: [{ arxeio_id: 'a', apo: 1, eos: 1 }],
      ennoies: ['e'],
      proapaitoumenes: [{ enotita_id: 'pre', isxys: 'isxyri' }],
      seira: 1,
      lepta_ektimisi: 0,
      apodosi_exetasis: 0,
    },
  ],
  ekdosi_prompt: 'p',
  dimiourgithike: '2026-10-01',
};
    await apothiki.grapse_keimeno('M1/.spoudes/xartis.json', JSON.stringify(xartis));
    const res = await diavase_xarti(apothiki, '', 'M1');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.enotites.length).toBe(1);
  });

  it('δεν υπάρχει αρχείο', async () => {
    const res = await diavase_xarti(new MnimiApothiki(), '', 'M1');
    expect(res.ok).toBe(false);
  });
});
