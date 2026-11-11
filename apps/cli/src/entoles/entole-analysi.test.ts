import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Apotelesma, XartisMathimatos } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { trekse_analysi } from '@dps/pipeline';
import { trexe_analysi } from './entole-analysi.js';
import type { EisodosPipeline } from '@dps/pipeline';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  trekse_analysi: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

const XARTIS: XartisMathimatos = {
  kodikos_mathimatos: 'MATH101',
  enotites: [
    {
      id: 'en-1',
      titlos: 'Δεντικά δέντρα',
      piges: [],
      ennoies: [],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 120,
      apodosi_exetasis: null,
    },
  ],
  ekdosi_prompt: 'p2',
  dimiourgithike: '2026-10-09T10:00:00.000Z',
};

function parastates(): EisodosPipeline {
  return {
    eclass: {
      syndesi: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      fere_mathimata: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      fere_dentro_arxeion: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    },
    apothiki: {
      grapse_keimeno: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
      diavase_keimeno: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    },
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

describe('trexe_analysi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bima.trekse_analysi.mockResolvedValue(ok(XARTIS));
  });

  it('καλεί τη ροή με τον κωδικό', async () => {
    const eisodos = parastates();
    const apotelesma = await trexe_analysi(eisodos, ['MATH101']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(bima.trekse_analysi).toHaveBeenCalledTimes(1);
    expect(bima.trekse_analysi).toHaveBeenCalledWith(eisodos, 'MATH101');
    expect(apotelesma.timi).toEqual({ eidos: 'xartis', xartis: XARTIS });
  });

  it('χωρίς κωδικό δίνει σφάλμα χρήσης', async () => {
    const eisodos = parastates();
    const apotelesma = await trexe_analysi(eisodos, []);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('KODIKOS');
    expect(bima.trekse_analysi).not.toHaveBeenCalled();
  });

  it('αποτυχία της ροής επιστρέφεται nguyên', async () => {
    const eisodos = parastates();
    bima.trekse_analysi.mockResolvedValue(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const apotelesma = await trexe_analysi(eisodos, ['MATH101']);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(apotelesma.sfalma.minima).toBe('Η συνεδρία λήξησε');
  });
});
