import { describe, expect, it, vi } from 'vitest';
import type { Apotelesma, Mathima } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';
import { trexe_panepistimia } from './entole-panepistimia.js';

vi.mock('@dps/core', async () => ({
  ...(await vi.importActual('@dps/core')),
  fere_ola_ta_panepistimia: () => [] as readonly Mathima[],
}));

function parastates(): EisodosPipeline {
  return {
    eclass: {
      syndesi: async () => ({ ok: false } as never),
      fere_mathimata: async () => ({ ok: false } as never),
      fere_dentro_arxeion: async () => ({ ok: false } as never),
    },
    apothiki: {
      grapse_keimeno: async () => ({ ok: false } as never),
      diavase_keimeno: async () => ({ ok: false } as never),
    },
    katevasma: { katevase: async () => ({ ok: false } as never) },
    llm: {
      montelo: 'gemini-ypokpisteio',
      parage_json: async () => ({ ok: false } as never),
      parage_keimeno: async () => ({ ok: false } as never),
    },
    mystika: {
      vale: async () => ({ ok: false } as never),
      pare: async () => null,
    },
    rologi: { tora: () => new Date('2026-10-09T10:00:00.000Z') },
    katagrafi: { pliroforia: () => undefined, proeidopoiisi: () => undefined, sfalma: () => undefined },
    riza: '/riza-upokpistea',
  } as unknown as EisodosPipeline;
}

describe('trexe_panepistimia — κενή λίστα', () => {
  it('χωρίς όρο και χωρίς πανεπιστήμια δίνει μήνυμα χωρίς κενό μοντέλο', async () => {
    const apotelesma = await trexe_panepistimia(parastates(), []);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi).toEqual({
      eidos: 'plirofories',
      minima: `Δεν βρέθηκαν πανεπιστήμια με όρο αναζήτησης: "". Μπορείς να χρησιμοποιήσεις προσαρμοσμένο URL με τη ρύθμιση ECLASS_BASE_URL.`,
    });
  });
});
