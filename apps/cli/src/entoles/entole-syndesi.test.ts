import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Apotelesma, KleidiMystikou } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { syndesi } from '@dps/pipeline';
import { trexe_syndesi } from './entole-syndesi.js';
import type { EisodosPipeline } from '@dps/pipeline';
import type { KatastasiMystikou } from './mystika-katastaseis.js';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  syndesi: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

function mystika(): EisodosPipeline['mystika'] {
  return {
    vale: async () => {
      apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test');
    },
    pare: async () => null,
    svise: async () => undefined,
  };
}

function parastates(kleidi: string, timi: string | null): EisodosPipeline {
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
      pare: async (kleidi: KleidiMystikou) => (kleidi === 'eclass_onoma_xristi' || kleidi === 'eclass_kodikos' ? timi : null),
    },
    rologi: { tora: () => new Date('2026-10-09T10:00:00.000Z') },
    katagrafi: { pliroforia: () => undefined, proeidopoiisi: () => undefined, sfalma: () => undefined },
    riza: '/riza-upokpistea',
  } as unknown as EisodosPipeline;
}

describe('trexe_syndesi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bima.syndesi.mockResolvedValue(ok(undefined));
  });

  it('καλεί το βήμα σύνδεσης όταν βρέκουν τα διαπιστευτήρια', async () => {
    const eisodos = parastates('eclass_onoma_xristi', 'student');
    const apotelesma = await trexe_syndesi(eisodos);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(bima.syndesi).toHaveBeenCalledTimes(1);
    expect(bima.syndesi).toHaveBeenCalledWith(eisodos);
    expect(apotelesma.timi).toEqual({
      eidos: 'plirofories',
      minima: `Η σύνδεση ολοκληρώθηκε.\nECLASS_USERNAME: βρέθηκε (eclass_onoma_xristi)\nECLASS_PASSWORD: βρέθηκε (eclass_kodikos)`,
    });
  });

  it('δεν καλεί το βήμα όταν λείπουν τα διαπιστευτήρια', async () => {
    const eisodos = parastates('eclass_onoma_xristi', null);
    const apotelesma = await trexe_syndesi(eisodos);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(bima.syndesi).not.toHaveBeenCalled();
  });

  it('αποτυχία της σύνδεσης επιστρέφεται nguyên', async () => {
    const eisodos = parastates('eclass_onoma_xristi', 'student');
    bima.syndesi.mockResolvedValue(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const apotelesma = await trexe_syndesi(eisodos);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(apotelesma.sfalma.minima).toBe('Η συνεδρία λήξησε');
  });
});
