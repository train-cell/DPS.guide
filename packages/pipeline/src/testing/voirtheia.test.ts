import { describe, it, expect } from 'vitest';
import { ApotelesmaErgaleiou, UlikoTutor } from '@dps/ai';
import type { Apotelesma } from '@dps/core';
import {
  ArgiosLlm,
  FakeEclassPyli,
  apotelesma_ergaleiou_stathero,
  apotelesma_sfalma,
  LigmaArchiou,
  StatheriRologi,
  uliko_tutor_keno,
  MONTELO_TEST,
} from '../testing/voirtheia.js';

describe('voirtheia doubles', () => {
  it('StatheriRologi: σταθερός και ρυθμιζόμενος', () => {
    const rologi = new StatheriRologi();
    expect(rologi.tora().toISOString().slice(0, 10)).toBe('2026-10-09');
    rologi.theste_xrono(new Date('2027-01-15T08:00:00.000Z'));
    expect(rologi.tora().toISOString().slice(0, 10)).toBe('2027-01-15');
  });

  it('LigmaArchiou: ουρά fixtures', () => {
    const llm = new LigmaArchiou();
    expect(llm.anamomena).toBe(0);
    llm.orise({ titlos: 'x' });
    expect(llm.anamomena).toBe(1);
    llm.katharize();
    expect(llm.anamomena).toBe(0);
    expect(llm.montelo).toBe(MONTELO_TEST);
  });

  it('uliko_tutor_keno: κενό αποτέλεσμα εργαλείου', () => {
    const uliko = uliko_tutor_keno();
    expect(uliko).toEqual({ enotites: [], selides: [], perigrafies: [], erotiseis: [] });
    expect(uliko.enotites).toHaveLength(0);
    expect(uliko.selides).toHaveLength(0);
    expect(uliko.perigrafies).toHaveLength(0);
    expect(uliko.erotiseis).toHaveLength(0);
  });

  it('apotelesma_ergaleiou_stathero: σταθερό αποτέλεσμα', () => {
    const res = apotelesma_ergaleiou_stathero('askisi' as unknown as ApotelesmaErgaleiou['onoma'], 'απάντηση');
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('aπέτυχε');
    expect(res.timi.onoma).toBe('askisi');
    expect(res.timi.keimeno).toBe('απάντηση');
    expect(res.timi.parapompi).toBe(null);
    expect(res.timi.erotisi).toBe(null);
  });

  it('apotelesma_sfalma: αποτέλεσμα σφάλματος', () => {
    const res = apotelesma_sfalma('DEN_VRETHIKE', 'Δεν βρέθηκε');
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('aπέτυχε');
    expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(res.sfalma.minima).toBe('Δεν βρέθηκε');

    const res2 = apotelesma_sfalma('MI_EGKYRO_SXIMA', 'Κακό σχήμα');
    expect(res2.ok).toBe(false);
    if (res2.ok) throw new Error('aπέτυχε');
    expect(res2.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('fere_dentro_arxeion: κενό δέντρο για άγνωστο κωδικό', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [] };
    const res = await eclass.fere_dentro_arxeion('M2');
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('aπέτυχε');
    expect(res.timi).toEqual([]);
  });

  it('ArgiosLlm: αποτυγχάνει πάντα σε parage_json', async () => {
    const llm = new ArgiosLlm();
    const res = await llm.parage_json();
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('aπέτυχε');
    expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.kliseis).toBe(1);
    expect(llm.montelo).toBe('mock-llm-ουδέτερο');
  });

  it('ArgiosLlm: αποτυγχάνει πάντα σε parage_keimeno', async () => {
    const llm = new ArgiosLlm();
    const res = await llm.parage_keimeno();
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error('aπέτυχε');
    expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.kliseis).toBe(1);
  });
});
