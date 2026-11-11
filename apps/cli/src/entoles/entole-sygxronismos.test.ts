import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Apotelesma, Mathima } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { sygxronismos } from '@dps/pipeline';
import { trexe_sygxronismos } from './entole-sygxronismos.js';
import type { EisodosPipeline, Metriti } from '@dps/pipeline';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  sygxronismos: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

const MATHIMA_EPILEGMENO: Mathima = {
  kodikos: 'MATH101',
  titlos: 'Δομές Δεδομένων',
  url: 'https://example.invalid/MATH101',
  epilegmeno: true,
};

const MATHIMA_MH_EPILEGMENO: Mathima = {
  kodikos: 'MATH202',
  titlos: 'Αλγόριθμοι',
  url: 'https://example.invalid/MATH202',
  epilegmeno: false,
};

const MATHIMA_EPILEGMENO_2: Mathima = {
  kodikos: 'MATH303',
  titlos: 'Κατασκευές Δεδομένων',
  url: 'https://example.invalid/MATH303',
  epilegmeno: true,
};

function apothiki(gram: string): EisodosPipeline['apothiki'] {
  return {
    grapse_keimeno: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    diavase_keimeno: async () => ok(gram),
    diavase_dyadiko: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    grapse_dyadiko: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    yparxei: async () => false,
    lista: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    diagrafi: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
  };
}

function parastates(gram: string): EisodosPipeline {
  return {
    eclass: {
      syndesi: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      fere_mathimata: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      fere_dentro_arxeion: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    },
    apothiki: apothiki(gram),
    katevasma: { katevase: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test') },
    llm: {
      montelo: 'gemini-ypokpisteio',
      parage_json: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      parage_keimeno: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    },
    mystika: {
      vale: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      pare: async () => null,
    },
    rologi: { tora: () => new Date('2026-10-09T10:00:00.000Z') },
    katagrafi: { pliroforia: () => undefined, proeidopoiisi: () => undefined, sfalma: () => undefined },
    riza: '/riza-upokpistea',
  } as unknown as EisodosPipeline;
}

describe('trexe_sygxronismos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bima.sygxronismos.mockResolvedValue(ok({ megaliteres: 7 } satisfies Metriti));
  });

  it('καλεί το βήμα για τον κωδικό που δόθηκε', async () => {
    const eisodos = parastates(JSON.stringify([]));
    const apotelesma = await trexe_sygxronismos(eisodos, ['MATH101']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(bima.sygxronismos).toHaveBeenCalledTimes(1);
    expect(bima.sygxronismos).toHaveBeenCalledWith(eisodos, 'MATH101');
    expect(apotelesma.timi).toEqual({ eidos: 'sygxronismos', apotelesmata: [{ kodikos_mathimatos: 'MATH101', megaliteres: 7 }] });
  });

  it('καταρρέει στο δεύτερο μάθημα και επιστρέφει το σφάλμα', async () => {
    const eisodos = parastates(
      JSON.stringify([MATHIMA_EPILEGMENO, MATHIMA_EPILEGMENO_2, MATHIMA_MH_EPILEGMENO])
    );
    bima.sygxronismos
      .mockResolvedValueOnce(ok({ megaliteres: 3 } satisfies Metriti))
      .mockResolvedValueOnce(apotyxia('DIKTYO', 'δεν απαντά ο διακομιστής'));
    const apotelesma = await trexe_sygxronismos(eisodos, []);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    expect(bima.sygxronismos).toHaveBeenCalledTimes(2);
  });

  it('χωρίς επιλεγμένα μαθήματα δίνει σφάλμα', async () => {
    const eisodos = parastates(JSON.stringify([MATHIMA_MH_EPILEGMENO]));
    const apotelesma = await trexe_sygxronismos(eisodos, []);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(bima.sygxronismos).not.toHaveBeenCalled();
  });

  it('ακυρό mathimata.json δίνει σφάλμα', async () => {
    const eisodos = parastates('αυτό δεν είναι JSON');
    const apotelesma = await trexe_sygxronismos(eisodos, []);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(bima.sygxronismos).not.toHaveBeenCalled();
  });

  it('βήμα που αποτυγχάνει επιστρέφει το σφάλμα (κωδικός)', async () => {
    const eisodos = parastates(JSON.stringify([]));
    bima.sygxronismos.mockResolvedValueOnce(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const apotelesma = await trexe_sygxronismos(eisodos, ['MATH101']);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(apotelesma.sfalma.minima).toBe('Η συνεδρία λήξησε');
  });
});
