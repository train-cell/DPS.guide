import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Apotelesma, OdigosMeta } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { odigos } from '@dps/pipeline';
import { trexe_odigos } from './entole-odigos.js';
import type { EisodosPipeline } from '@dps/pipeline';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  odigos: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

const MONTELO = 'gemini-ypokpisteio';

const ODIGOS_META: OdigosMeta = {
  enotita_id: 'en-1',
  parapompes: [{ arxeio_id: 'arx-1', selida: 12 }],
  montelo: MONTELO,
  ekdosi_prompt: 'p3',
  hash_eisodou: 'abc123',
  proeidopoiiseis: ['Αναφέρθηκε στη σελίδα 3, όχι στο υλικό'],
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

describe('trexe_odigos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bima.odigos.mockResolvedValue(ok(ODIGOS_META));
  });

  it('καλεί το βήμα odigos με το id της ενότητας', async () => {
    const eisodos = parastates();
    const apotelesma = await trexe_odigos(eisodos, ['en-1']);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(bima.odigos).toHaveBeenCalledTimes(1);
    expect(bima.odigos).toHaveBeenCalledWith(eisodos, 'en-1');
    expect(apotelesma.timi).toEqual({ eidos: 'odigos', meta: ODIGOS_META });
  });

  it('χωρίς id δίνει σφάλμα χρήσης', async () => {
    const eisodos = parastates();
    const apotelesma = await trexe_odigos(eisodos, []);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('ENOTITA_ID');
    expect(bima.odigos).not.toHaveBeenCalled();
  });

  it('αποτυχία της ροής επιστρέφεται nguyên', async () => {
    const eisodos = parastates();
    bima.odigos.mockResolvedValue(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const apotelesma = await trexe_odigos(eisodos, ['en-1']);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(apotelesma.sfalma.minima).toBe('Η συνεδρία λήξησε');
  });
});
