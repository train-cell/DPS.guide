import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { trekse_oloklirosi } from '@dps/pipeline';
import { trexe_run } from './entole-run.js';
import type { EisodosPipeline } from '@dps/pipeline';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  trekse_oloklirosi: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

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

describe('trexe_run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bima.trekse_oloklirosi.mockResolvedValue(ok({ mathimata: 1 }));
  });

  it('καλεί την ολοκληρη ροή και δείχνει τα δεδομένα', async () => {
    const eisodos = parastates();
    const apotelesma = await trexe_run(eisodos);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(bima.trekse_oloklirosi).toHaveBeenCalledTimes(1);
    expect(bima.trekse_oloklirosi).toHaveBeenCalledWith(eisodos);
    expect(apotelesma.timi).toEqual({ eidos: 'allh_dedomena', dedomena: { mathimata: 1 } });
  });

  it('αποτυχία της ροής επιστρέφεται nguyên', async () => {
    const eisodos = parastates();
    bima.trekse_oloklirosi.mockResolvedValue(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const apotelesma = await trexe_run(eisodos);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(apotelesma.sfalma.minima).toBe('Η συνεδρία λήξησε');
  });
});
