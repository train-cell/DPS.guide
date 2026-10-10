import { describe, it, expect } from 'vitest';
import type { Apotelesma, Sfalma } from '@dps/core';
import {
  EPITREPOMENES_KATASTASEIS,
  adeio,
  apo_apotelesma,
  einai_adeio,
  einai_etimo,
  einai_fortosi,
  einai_sfalma,
  etimo,
  fortosi,
  metatropi,
  sfalma,
  xoris_katastasi,
  type Katastasi,
  type KodikosKatastasis,
  type ParallagesKatastasis,
} from './katastasi.js';

const SFALMA_DIKTYO: Sfalma = { kodikos: 'DIKTYO', minima: 'Δεν υπάρχει σύνδεση' };

const SFALMA_SESSION: Sfalma = { kodikos: 'SESSION_LIXI', minima: 'Έληξε η συνεδρία' };

function metrites_me_mia(kodikos: KodikosKatastasis): Record<KodikosKatastasis, number> {
  return {
    fortosi: kodikos === 'fortosi' ? 1 : 0,
    adeio: kodikos === 'adeio' ? 1 : 0,
    sfalma: kodikos === 'sfalma' ? 1 : 0,
    etimo: kodikos === 'etimo' ? 1 : 0,
  };
}

function metre_se_katastasi<T>(k: Katastasi<T>): {
  metrites: Record<KodikosKatastasis, number>;
  apotelesma_metatropis: string;
} {
  const metrites: Record<KodikosKatastasis, number> = {
    fortosi: 0,
    adeio: 0,
    sfalma: 0,
    etimo: 0,
  };
  const parallages: ParallagesKatastasis<T, string> = {
    fortosi: () => {
      metrites.fortosi += 1;
      return 'fortosi';
    },
    adeio: () => {
      metrites.adeio += 1;
      return 'adeio';
    },
    sfalma: (s) => {
      metrites.sfalma += 1;
      return s.minima;
    },
    etimo: (dedomena) => {
      metrites.etimo += 1;
      return JSON.stringify(dedomena);
    },
  };
  return { metrites, apotelesma_metatropis: metatropi(k, parallages) };
}

describe('katastasi — κατασκευαστές καταστάσεων', () => {
  it('ο κάθε κατασκευαστής επιστρέφει ακριβώς το δικό του διάκριση (discriminant)', () => {
    expect(fortosi<number>().katastasi).toBe('fortosi');
    expect(adeio<number>().katastasi).toBe('adeio');
    expect(sfalma<number>(SFALMA_DIKTYO).katastasi).toBe('sfalma');
    expect(etimo(7).katastasi).toBe('etimo');
  });

  it('ο κατασκευαστής sfalma διατηρεί αναλλοίωτο το Sfalma', () => {
    const k = sfalma(SFALMA_SESSION);
    expect(k.katastasi).toBe('sfalma');
    if (einai_sfalma(k)) {
      expect(k.sfalma).toBe(SFALMA_SESSION);
    }
  });

  it('ο κατασκευαστής etimo μεταφέρει ακριβώς τα δεδομένα', () => {
    const dedomena = { id: 'mathima-1', titlos: 'Άλγεβρα' };
    const k = etimo(dedomena);
    expect(k.katastasi).toBe('etimo');
    expect(xoris_katastasi(k)).toBe(dedomena);
  });
});

describe('katastasi — apo_apotelesma', () => {
  it('ok χωρίς κατηγόρημα κενότητας δίνει etimo με την τιμή', () => {
    const apotelesma: Apotelesma<number> = { ok: true, timi: 42 };
    const k = apo_apotelesma(apotelesma);
    expect(k.katastasi).toBe('etimo');
    expect(xoris_katastasi(k)).toBe(42);
  });

  it('ok με κατηγόρημα που επιστρέφει false δίνει etimo με την τιμή', () => {
    const apotelesma: Apotelesma<number> = { ok: true, timi: 42 };
    const k = apo_apotelesma(apotelesma, (dedomena) => dedomena > 100);
    expect(k.katastasi).toBe('etimo');
    expect(xoris_katastasi(k)).toBe(42);
  });

  it('ok με κατηγόρημα που επιστρέφει true δίνει adeio', () => {
    const apotelesma: Apotelesma<number> = { ok: true, timi: 0 };
    const k = apo_apotelesma(apotelesma, (dedomena) => dedomena === 0);
    expect(k.katastasi).toBe('adeio');
    expect(xoris_katastasi(k)).toBeUndefined();
  });

  it('μηδενικό πίνακας με κατηγόρημα μήκους δίνει adeio', () => {
    const apotelesma: Apotelesma<string[]> = { ok: true, timi: [] };
    const k = apo_apotelesma(apotelesma, (dedomena) => dedomena.length === 0);
    expect(k.katastasi).toBe('adeio');
  });

  it('μη κενός πίνακας με κατηγόρημα μήκους δίνει etimo', () => {
    const mathimata = ['PLI101', 'PLI102'];
    const apotelesma: Apotelesma<string[]> = { ok: true, timi: mathimata };
    const k = apo_apotelesma(apotelesma, (dedomena) => dedomena.length === 0);
    expect(k.katastasi).toBe('etimo');
    expect(xoris_katastasi(k)).toBe(mathimata);
  });

  it('το κατηγόρημα κενότητας δέχεται την πραγματική τιμή', () => {
    const pare: number[] = [];
    const apotelesma: Apotelesma<number> = { ok: true, timi: 5 };
    const k = apo_apotelesma(apotelesma, (dedomena) => {
      pare.push(dedomena);
      return dedomena > 10;
    });
    expect(pare).toEqual([5]);
    expect(k.katastasi).toBe('etimo');
  });

  it('αποτυχία δίνει sfalma με το ΑΚΡΙΒΩΣ ίδιο αντικείμενο Sfalma', () => {
    const apotelesma: Apotelesma<number> = { ok: false, sfalma: SFALMA_DIKTYO };
    const k = apo_apotelesma(apotelesma);
    expect(k.katastasi).toBe('sfalma');
    if (einai_sfalma(k)) {
      expect(k.sfalma).toBe(SFALMA_DIKTYO);
      expect(k.sfalma.kodikos).toBe(SFALMA_DIKTYO.kodikos);
      expect(k.sfalma.minima).toBe(SFALMA_DIKTYO.minima);
    }
  });

  it('αποτυχία με κατηγόρημα κενότητας ΔΕΝ γίνεται ποτέ adeio ούτε etimo', () => {
    const apotelesma: Apotelesma<string[]> = { ok: false, sfalma: SFALMA_DIKTYO };
    const k = apo_apotelesma<string[]>(apotelesma, (dedomena) => dedomena.length === 0);
    expect(k.katastasi).toBe('sfalma');
    expect(xoris_katastasi(k)).toBeUndefined();
  });

  it('αποτυχία δεν ψευδίζει ποτέ δεδομένα', () => {
    const apotelesma: Apotelesma<string> = {
      ok: false,
      sfalma: { kodikos: 'DIKTYO', minima: 'x' },
    };
    const k = apo_apotelesma(apotelesma);
    expect(k.katastasi).toBe('sfalma');
    expect(xoris_katastasi(k)).toBeUndefined();
    expect(
      metatropi(k, {
        fortosi: () => 'fortosi',
        adeio: () => 'adeio',
        sfalma: () => 'sfalma',
        etimo: () => 'etimo',
      })
    ).toBe('sfalma');
  });
});

describe('katastasi — metatropi', () => {
  it('εκτελεί ακριβώς ένα παραλλαγή ανά κατάσταση και επιστρέφει την τιμή του', () => {
    const periptoseis: {
      readonly k: Katastasi<unknown>;
      readonly kodikos: KodikosKatastasis;
      readonly etiketa: string;
    }[] = [
      { k: fortosi<unknown>(), kodikos: 'fortosi', etiketa: 'fortosi' },
      { k: adeio<unknown>(), kodikos: 'adeio', etiketa: 'adeio' },
      { k: sfalma<unknown>(SFALMA_DIKTYO), kodikos: 'sfalma', etiketa: SFALMA_DIKTYO.minima },
      { k: etimo<unknown>({ id: 1 }), kodikos: 'etimo', etiketa: '{"id":1}' },
    ];

    for (const periptosi of periptoseis) {
      const { metrites, apotelesma_metatropis } = metre_se_katastasi(periptosi.k);
      expect(apotelesma_metatropis).toBe(periptosi.etiketa);
      expect(metrites).toEqual(metrites_me_mia(periptosi.kodikos));
    }
  });

  it('το παραλλαγή sfalma παίρνει το αρχικό Sfalma', () => {
    const k = apo_apotelesma<number>({ ok: false, sfalma: SFALMA_SESSION });
    const paralagi_sfalma = metatropi(k, {
      fortosi: () => undefined,
      adeio: () => undefined,
      sfalma: (s) => s,
      etimo: () => undefined,
    });
    expect(paralagi_sfalma).toBe(SFALMA_SESSION);
  });

  it('το παραλλαγή etimo παίρνει τα δεδομένα χωρίς αντιγραφή', () => {
    const dedomena = ['a', 'b'];
    const paralagi_etimo = metatropi(etimo(dedomena), {
      fortosi: () => undefined,
      adeio: () => undefined,
      sfalma: () => undefined,
      etimo: (d) => d,
    });
    expect(paralagi_etimo).toBe(dedomena);
  });
});

describe('katastasi — xoris_katastasi', () => {
  it('επιστρέφει τα δεδομένα μόνο σε etimo', () => {
    expect(xoris_katastasi(etimo('Τιμή'))).toBe('Τιμή');
    expect(xoris_katastasi(fortosi<string>())).toBeUndefined();
    expect(xoris_katastasi(adeio<string>())).toBeUndefined();
    expect(xoris_katastasi(sfalma<string>(SFALMA_DIKTYO))).toBeUndefined();
  });

  it('επιστρέφει undefined ακόμα και για ψευδή τιμή σε etimo', () => {
    expect(xoris_katastasi(etimo(0))).toBe(0);
    expect(xoris_katastasi(etimo(''))).toBe('');
  });
});

describe('katastasi — φύλακες τύπου (narrowing)', () => {
  it('einai_etimo ανοίγει τη dedomena χωρίς cast', () => {
    const k: Katastasi<number> = etimo(99);
    expect(einai_etimo(k)).toBe(true);
    if (einai_etimo(k)) {
      expect(k.dedomena).toBe(99);
      expect(k.dedomena.toFixed(1)).toBe('99.0');
    }
  });

  it('einai_sfalma ανοίγει το sfalma χωρίς cast', () => {
    const k: Katastasi<number> = sfalma(SFALMA_DIKTYO);
    expect(einai_sfalma(k)).toBe(true);
    if (einai_sfalma(k)) {
      expect(k.sfalma).toBe(SFALMA_DIKTYO);
      expect(k.sfalma.kodikos).toBe(SFALMA_DIKTYO.kodikos);
    }
  });

  it('einai_fortosi και einai_adeio διακρίνουν τις καταστάσεις χωρίς δεδομένα', () => {
    const fortosi_k: Katastasi<number> = fortosi();
    expect(einai_fortosi(fortosi_k)).toBe(true);
    expect(einai_etimo(fortosi_k)).toBe(false);
    if (einai_fortosi(fortosi_k)) {
      expect(fortosi_k.katastasi).toBe('fortosi');
    }

    const adeio_k: Katastasi<number> = adeio();
    expect(einai_adeio(adeio_k)).toBe(true);
    expect(einai_sfalma(adeio_k)).toBe(false);
    if (einai_adeio(adeio_k)) {
      expect(adeio_k.katastasi).toBe('adeio');
    }
  });

  it('οι φύλακες είναι απόλυτα εξαντλητικοί πάνω στις τέσσερις καταστάσεις', () => {
    const oles: Katastasi<number>[] = [
      fortosi<number>(),
      adeio<number>(),
      sfalma<number>(SFALMA_DIKTYO),
      etimo<number>(1),
    ];
    for (const k of oles) {
      const energoi = [
        einai_fortosi(k),
        einai_adeio(k),
        einai_sfalma(k),
        einai_etimo(k),
      ].filter((energo) => energo === true);
      expect(energoi).toHaveLength(1);
    }
  });
});

describe('katastasi — επιτρεπτές καταστάσεις', () => {
  it('η λίστα είναι παγωμένη και περιέχει τις τέσσερις καταστάσεις με σειρά', () => {
    expect(Object.isFrozen(EPITREPOMENES_KATASTASEIS)).toBe(true);
    expect([...EPITREPOMENES_KATASTASEIS]).toEqual(['fortosi', 'adeio', 'sfalma', 'etimo']);
  });

  it('ο τύπος KodikosKatastasis δέχεται ακριβώς τα τέσσερα διακρίσης', () => {
    const kodikoi: readonly KodikosKatastasis[] = ['fortosi', 'adeio', 'sfalma', 'etimo'];
    expect(kodikoi).toEqual([...EPITREPOMENES_KATASTASEIS]);
  });

  it('κάθε παραγόμενη κατάσταση ανήκει στη λίστα των επιτρεπτών', () => {
    const epitrepomenes = new Set<string>(EPITREPOMENES_KATASTASEIS);
    const oles: Katastasi<number>[] = [
      fortosi<number>(),
      adeio<number>(),
      sfalma<number>(SFALMA_DIKTYO),
      etimo<number>(1),
      apo_apotelesma<number>({ ok: true, timi: 2 }),
      apo_apotelesma<number>({ ok: false, sfalma: SFALMA_DIKTYO }),
      apo_apotelesma<number>({ ok: true, timi: 2 }, (d) => d > 100),
    ];
    for (const k of oles) {
      expect(epitrepomenes.has(k.katastasi)).toBe(true);
    }
  });
});
