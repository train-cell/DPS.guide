import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, Mathima } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import {
  fere_mathimata,
  fere_episkeptes_mathimata,
  vres_mathima_apo_arxeio,
  vres_mathima_apo_enotita,
} from './ves.js';
import type { EisodosPipeline } from '../porte.js';

function katagrafi(): EisodosPipeline['katagrafi'] {
  return { pliroforia: () => {}, sfalma: () => {} };
}

function apotheke(): EisodosPipeline['apothiki'] {
  return new MnimiApothiki();
}

function mathima(): Mathima {
  return { kodikos: 'M1', titlos: 'Μαθημα', url: '', epilegmeno: true };
}

describe('fere_mathimata', () => {
  it('βρίσκει τα μαθήματα', async () => {
    const apothiki = apotheke();
    await apothiki.grapse_keimeno(
      'mathimata.json',
      JSON.stringify([{ kodikos: 'M1', titlos: 'Μαθημα', url: '', epilegmeno: true }])
    );
    const res = await fere_mathimata({
      eclass: {} as EisodosPipeline['eclass'],
      apothiki,
      katagrafi: katagrafi(),
      riza: '',
    } as EisodosPipeline);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(1);
  });

  it('κωδικός διαφορετικός από DEN_VRETHIKE', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DIKTYO', 'Δεν υπάρχει διαδίκτυο');
    const res = await fere_mathimata({
      eclass: {} as EisodosPipeline['eclass'],
      apothiki,
      katagrafi: katagrafi(),
      riza: '',
    } as EisodosPipeline);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DIKTYO');
  });

  it('δεν υπάρχουν μαθήματα -> κενή λίστα', async () => {
    const apothiki = apotheke();
    const res = await fere_mathimata({
      eclass: {} as EisodosPipeline['eclass'],
      apothiki,
      katagrafi: katagrafi(),
      riza: '',
    } as EisodosPipeline);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(0);
  });
});

describe('fere_episkeptes_mathimata', () => {
  it('επιλεγμένα μαθήματα', async () => {
    const apothiki = apotheke();
    await apothiki.grapse_keimeno(
      'mathimata.json',
      JSON.stringify([
        { kodikos: 'M1', titlos: 'Μαθημα', url: '', epilegmeno: true },
        { kodikos: 'M2', titlos: 'Μαθημα 2', url: '', epilegmeno: false },
      ])
    );
    const res = await fere_episkeptes_mathimata({
      eclass: {} as EisodosPipeline['eclass'],
      apothiki,
      katagrafi: katagrafi(),
      riza: '',
    } as EisodosPipeline);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.timi.length).toBe(1);
  });

  it('δεν βρέθηκαν μαθήματα', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DIKTYO', 'Δεν υπάρχει διαδίκτυο');
    const res = await fere_episkeptes_mathimata({
      eclass: {} as EisodosPipeline['eclass'],
      apothiki,
      katagrafi: katagrafi(),
      riza: '',
    } as EisodosPipeline);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DIKTYO');
  });
});

describe('vres_mathima_apo_arxeio', () => {
  it('δεν βρέθηκαν μαθήματα', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκε');
    const res = await vres_mathima_apo_arxeio(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'arx-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('δεν ανήκει σε μάθημα', async () => {
    const apothiki = apotheke();
    await apothiki.grapse_keimeno(
      'mathimata.json',
      JSON.stringify([{ kodikos: 'M1', titlos: 'Μαθημα', url: '', epilegmeno: true }])
    );
    const res = await vres_mathima_apo_arxeio(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'arx-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('σφάλμα αποθήκης -> επιστρέφει το σφάλμα (L46)', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DIKTYO', 'Δεν υπάρχει διαδίκτυο');
    const res = await vres_mathima_apo_arxeio(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'arx-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DIKTYO');
  });
});

describe('vres_mathima_apo_enotita', () => {
  it('δεν βρέθηκαν μαθήματα', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκε');
    const res = await vres_mathima_apo_enotita(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'enot-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('χάρτης αποτυγχάνει -> continue', async () => {
    const apothiki = apotheke();
    await apothiki.grapse_keimeno(
      'mathimata.json',
      JSON.stringify([{ kodikos: 'M1', titlos: 'Μαθημα', url: '', epilegmeno: true }])
    );
    const res = await vres_mathima_apo_enotita(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'enot-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('σφάλμα αποθήκης -> επιστρέφει το σφάλμα (L70)', async () => {
    const apothiki = apotheke();
    apothiki.diavase_keimeno = async () => apotyxia('DIKTYO', 'Δεν υπάρχει διαδίκτυο');
    const res = await vres_mathima_apo_enotita(
      {
        eclass: {} as EisodosPipeline['eclass'],
        apothiki,
        katagrafi: katagrafi(),
        riza: '',
      } as EisodosPipeline,
      'enot-1'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.sfalma.kodikos).toBe('DIKTYO');
  });
});
