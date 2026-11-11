import { describe, expect, it } from 'vitest';
import { grammi_katastasis, grammes_katastaseon, katastaseis_mystikon } from './mystika-katastaseis.js';
import type { KatastasiMystikou } from './mystika-katastaseis.js';
import type { KleidiMystikou } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';

function eisodos(parichon_onoma: boolean, parichon_kodikos: boolean): EisodosPipeline {
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
      pare: async (kleidi: KleidiMystikou) => {
        const onoma = kleidi === 'eclass_onoma_xristi';
        return onoma ? (parichon_onoma ? 'onoma' : null) : parichon_kodikos ? 'kodikos' : null;
      },
    },
    rologi: { tora: () => new Date('2026-10-09T10:00:00.000Z') },
    katagrafi: { pliroforia: () => undefined, proeidopoiisi: () => undefined, sfalma: () => undefined },
    riza: '/riza-upokpistea',
  } as unknown as EisodosPipeline;
}

describe('katastaseis_mystikon', () => {
  it('σημειώνει τα μυστικά που βρέθηκαν', async () => {
    const katastaseis = await katastaseis_mystikon(eisodos(true, true));
    expect(katastaseis).toEqual([
      { kleidi: 'eclass_onoma_xristi', onoma_metavlitis: 'ECLASS_USERNAME', parichon: true },
      { kleidi: 'eclass_kodikos', onoma_metavlitis: 'ECLASS_PASSWORD', parichon: true },
    ]);
  });

  it('σημειώνει τα μυστικά που λείπουν', async () => {
    const katastaseis = await katastaseis_mystikon(eisodos(false, false));
    expect(katastaseis).toEqual([
      { kleidi: 'eclass_onoma_xristi', onoma_metavlitis: 'ECLASS_USERNAME', parichon: false },
      { kleidi: 'eclass_kodikos', onoma_metavlitis: 'ECLASS_PASSWORD', parichon: false },
    ]);
  });

  it('σημειώνει το ένα από τα δύο', async () => {
    const katastaseis = await katastaseis_mystikon(eisodos(true, false));
    expect(katastaseis).toHaveLength(2);
    expect(katastaseis[0]!.parichon).toBe(true);
    expect(katastaseis[1]!.parichon).toBe(false);
  });
});

describe('grammi_katastasis', () => {
  it('βρέθηκε', () => {
    expect(grammi_katastasis({ kleidi: 'eclass_onoma_xristi', onoma_metavlitis: 'ECLASS_USERNAME', parichon: true })).toBe(
      'ECLASS_USERNAME: βρέθηκε (eclass_onoma_xristi)'
    );
  });

  it('λείπει', () => {
    expect(grammi_katastasis({ kleidi: 'eclass_kodikos', onoma_metavlitis: 'ECLASS_PASSWORD', parichon: false })).toBe(
      'ECLASS_PASSWORD: λείπει (eclass_kodikos)'
    );
  });
});

describe('grammes_katastaseon', () => {
  it('μετατρέπει τις καταστάσεις σε γραμμές χωρίς τιμές', () => {
    const katastaseis: KatastasiMystikou[] = [
      { kleidi: 'eclass_onoma_xristi', onoma_metavlitis: 'ECLASS_USERNAME', parichon: true },
      { kleidi: 'eclass_kodikos', onoma_metavlitis: 'ECLASS_PASSWORD', parichon: false },
    ];
    expect(grammes_katastaseon(katastaseis)).toEqual([
      'ECLASS_USERNAME: βρέθηκε (eclass_onoma_xristi)',
      'ECLASS_PASSWORD: λείπει (eclass_kodikos)',
    ]);
  });
});
