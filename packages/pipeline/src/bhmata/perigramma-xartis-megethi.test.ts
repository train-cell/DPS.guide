import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import type { Arxeio, Selida } from '@dps/core';
import { FakeEclassPyli, KatagrafiDiamnemata, LigmaArchiou, StatheriRologi } from '../testing/voirtheia.js';
import { ftiaxe_docx } from '../testing/fixtures-arxeia.js';
import { perigramma_mathimatos } from '../bhmata/perigramma.js';
import { xartis } from '../bhmata/xartis.js';
import { megethi } from '../bhmata/megethi.js';
import type { EisodosPipeline } from '../porte.js';
import {
  arxeio_eurethriou,
  arxeio_keimenou,
  arxeio_perigrammatos,
  arxeio_xarti,
  diadromi_arxeiou,
} from '../statheroi.js';
import { ftiaxe_arxeio_id, grapse_json } from '../grammata/apothiki-json.js';
import { me_cache } from '@dps/ai';

const KODIKOS = 'M1';
const DIADROMI = 'dokimio.docx';

function ftiaxe_eisodos(apothiki: MnimiApothiki, llm: LigmaArchiou, katagrafi: KatagrafiDiamnemata): EisodosPipeline {
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    // Η ροή περνάει ΠΑΝΤΑ από το me_cache του @dps/ai (δεν γράφει δικό της cache).
    llm: me_cache(llm.llm, apothiki, `${KODIKOS}/.spoudes/cache/llm`),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi,
    riza: '',
  };
}

function arxeio_test(diadromi: string): Arxeio {
  return {
    id: ftiaxe_arxeio_id(KODIKOS, diadromi),
    kodikos_mathimatos: KODIKOS,
    diadromi,
    url: `https://thales.example/${diadromi}`,
    megethos: 3,
    imerominia: '2026-10-01T00:00:00.000Z',
    etag: null,
    sha256: 'aabb',
    diplotypo_tou: null,
  };
}

function selida(arithmos: number, keimeno: string, arxeio_id: string): Selida {
  const lekseis = keimeno.split(' ').filter((l) => l !== '').length;
  return { arxeio_id, arithmos, keimeno, lekseis, xoris_keimeno: false };
}

async function these_arxeio_keimeno(apothiki: MnimiApothiki, selides: Selida[]): Promise<Arxeio> {
  const arxeio = arxeio_test(DIADROMI);
  const eurethrio = await grapse_json(apothiki, arxeio_eurethriou(KODIKOS), [arxeio]);
  if (!eurethrio.ok) throw new Error('aπέτυχε');
  const arkeio = await apothiki.grapse_dyadiko(
    diadromi_arxeiou(KODIKOS, DIADROMI),
    ftiaxe_docx(['# Τμήμα'])
  );
  if (!arkeio.ok) throw new Error('aπέτυχε');
  const keimeno = await grapse_json(apothiki, arxeio_keimenou(KODIKOS, arxeio.id), selides);
  if (!keimeno.ok) throw new Error('aπέτυχε');
  return arxeio;
}

const PERIGRAMMA_ANTISKEPSI = {
  titlos: 'Δομές δεδομένων',
  tmimata: [
    { titlos: 'Λίστες', selides: { apo: 1, eos: 2 }, typos: 'theoria', ennoies: ['λίστα'], proapaitoumena: [] },
  ],
};

describe('perigramma', () => {
  it('παράγει περίγραμμα από το keimeno και το γράφει στο perigrammata/', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', arxeio_test(DIADROMI).id),
      selida(2, 'ένα δέντρο έχει ρίζα και παιδιά', arxeio_test(DIADROMI).id),
    ]);
    llm.orise({ ...PERIGRAMMA_ANTISKEPSI, arxeio_id: arxeio.id });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await perigramma_mathimatos(p, KODIKOS, arxeio.id);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.arxeio_id).toBe(arxeio.id);
    expect(apotelesma.timi.tmimata).toHaveLength(1);
    expect(await apothiki.yparxei(arxeio_perigrammatos(KODIKOS, arxeio.id))).toBe(true);
  });

  it('δεύτερη εκτέλεση: μηδέν κλήσεις LLM (η κρυφή μνήμη του @dps/ai απαντά)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', arxeio_test(DIADROMI).id),
    ]);
    llm.orise({ ...PERIGRAMMA_ANTISKEPSI, arxeio_id: arxeio.id });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const proti = await perigramma_mathimatos(p, KODIKOS, arxeio.id);
    const defteri = await perigramma_mathimatos(p, KODIKOS, arxeio.id);

    expect(proti.ok && defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('aπέτυχε');
    expect(defteri.timi).toEqual(proti.timi);
    expect(llm.fortiseis).toBe(1);
  });

  it('χωρίς keimeno επιστρέφει DEN_VRETHIKE χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await perigramma_mathimatos(p, KODIKOS, ftiaxe_arxeio_id(KODIKOS, DIADROMI));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(0);
  });

  it('σφάλμα LLM μεταδίδεται χωρίς να γραφτεί μισό perigrammata', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', arxeio_test(DIADROMI).id),
    ]);
    llm.orise({
      arxeio_id: arxeio.id,
      titlos: 'χαλάει',
      tmimata: [{ titlos: 'λάθος', selides: { apo: 'x', eos: 2 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await perigramma_mathimatos(p, KODIKOS, arxeio.id);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei(arxeio_perigrammatos(KODIKOS, arxeio.id))).toBe(false);
  });

  it('επισκευάζει εύρη σελίδων εκτός ορίων (clamp) αντί να τα απορρίπτει', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [selida(1, 'μια λίστα', arxeio_test(DIADROMI).id)]);
    llm.orise({
      ...PERIGRAMMA_ANTISKEPSI,
      arxeio_id: arxeio.id,
      tmimata: [{ titlos: 'εκτός', selides: { apo: 1, eos: 99 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await perigramma_mathimatos(p, KODIKOS, arxeio.id);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.tmimata[0]?.selides).toEqual({ apo: 1, eos: 1 });
  });

  it('κρατάει το δικό μας arxeio_id ακόμα κι αν το μοντέλο γράψει άλλο', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [selida(1, 'μια λίστα', arxeio_test(DIADROMI).id)]);
    llm.orise({ ...PERIGRAMMA_ANTISKEPSI, arxeio_id: 'hallucinomeno-id' });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await perigramma_mathimatos(p, KODIKOS, arxeio.id);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.arxeio_id).toBe(arxeio.id);
  });
});

describe('xartis', () => {
  async function these_perigramma(apothiki: MnimiApothiki, tmimata: unknown[]): Promise<Arxeio> {
    const arxeio = await these_arxeio_keimeno(apothiki, [selida(1, 'μια λίστα', arxeio_test(DIADROMI).id)]);
    const gram = await grapse_json(apothiki, arxeio_perigrammatos(KODIKOS, arxeio.id), {
      ...PERIGRAMMA_ANTISKEPSI,
      arxeio_id: arxeio.id,
      tmimata,
    });
    if (!gram.ok) throw new Error('aπέτυχε');
    return arxeio;
  }

  it('χτίζει χάρτη από τα περιγράμματα και τον γράφει στο xartis.json', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_perigramma(apothiki, PERIGRAMMA_ANTISKEPSI.tmimata);
    llm.orise({
      kodikos_mathimatos: KODIKOS,
      enotites: [
        {
          id: 'en1',
          titlos: 'Λίστες',
          piges: [{ arxeio_id: arxeio.id, apo: 1, eos: 2 }],
          ennoies: ['λίστα'],
          proapaitoumenes: [],
          seira: 1,
          lepta_ektimisi: null,
          apodosi_exetasis: null,
        },
      ],
      ekdosi_prompt: 'p2@1',
      dimiourgithike: '2026-10-09',
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await xartis(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.enotites).toHaveLength(1);
    expect(await apothiki.yparxei(arxeio_xarti(KODIKOS))).toBe(true);
  });

  it('αρνείται χάρτη με κύκλο προαπαιτούμενων (μηδέν κύκλο, §4 βήμα 6)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_perigramma(apothiki, PERIGRAMMA_ANTISKEPSI.tmimata);
    const enotita = (id: string, apo: number) => ({
      id,
      titlos: id,
      piges: [{ arxeio_id: arxeio.id, apo, eos: apo + 1 }],
      ennoies: [],
      proapaitoumenes: [{ enotita_id: id === 'a' ? 'b' : 'a', isxys: 'isxyri' as const }],
      seira: 1,
      lepta_ektimisi: null,
      apodosi_exetasis: null,
    });
    llm.orise({
      kodikos_mathimatos: KODIKOS,
      enotites: [enotita('a', 1), enotita('b', 2)],
      ekdosi_prompt: 'p2@1',
      dimiourgithike: '2026-10-09',
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await xartis(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei(arxeio_xarti(KODIKOS))).toBe(false);
  });

  it('χωρίς περιγράμματα επιστρέφει DEN_VRETHIKE χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await xartis(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(0);
  });
});

describe('megethi', () => {
  async function these_xartis(apothiki: MnimiApothiki, arxeio: Arxeio, apo: number, eos: number): Promise<void> {
    const gram = await grapse_json(apothiki, arxeio_xarti(KODIKOS), {
      kodikos_mathimatos: KODIKOS,
      enotites: [
        {
          id: 'en1',
          titlos: 'Λίστες',
          piges: [{ arxeio_id: arxeio.id, apo, eos }],
          ennoies: [],
          proapaitoumenes: [],
          seira: 1,
          lepta_ektimisi: null,
          apodosi_exetasis: null,
        },
      ],
      ekdosi_prompt: 'p2@1',
      dimiourgithike: '2026-10-09',
    });
    if (!gram.ok) throw new Error('aπέτυχε');
  }

  it('συμπληρώνει τα λεπτά deterministic χωρίς καμία κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με πολλές λέξεις εδώ', arxeio_test(DIADROMI).id),
    ]);
    const tmimata = [{ titlos: 'Λίστες', selides: { apo: 1, eos: 1 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }];
    const per = await grapse_json(apothiki, arxeio_perigrammatos(KODIKOS, arxeio.id), {
      ...PERIGRAMMA_ANTISKEPSI,
      arxeio_id: arxeio.id,
      tmimata,
    });
    if (!per.ok) throw new Error('aπέτυχε');
    await these_xartis(apothiki, arxeio, 1, 1);
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await megethi(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.enotites[0]?.lepta_ektimisi).toBeGreaterThan(0);
    expect(llm.fortiseis).toBe(0);
  });

  it('δεύτερη εκτέλεση δίνει ακριβώς τα ίδια λεπτά (ντετερμινισμός)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_arxeio_keimeno(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με πολλές λέξεις εδώ', arxeio_test(DIADROMI).id),
    ]);
    const per = await gripse_perigramma(apothiki, arxeio);
    if (!per) throw new Error('aπέτυχε');
    await these_xartis(apothiki, arxeio, 1, 1);
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const proti = await megethi(p, KODIKOS);
    const defteri = await megethi(p, KODIKOS);

    expect(proti.ok && defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('aπέτυχε');
    expect(defteri.timi).toEqual(proti.timi);
  });

  it('χωρίς χάρτη επιστρέφει DEN_VRETHIKE', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await megethi(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });
});

async function gripse_perigramma(apothiki: MnimiApothiki, arxeio: Arxeio): Promise<boolean> {
  const gram = await grapse_json(apothiki, arxeio_perigrammatos(KODIKOS, arxeio.id), {
    ...PERIGRAMMA_ANTISKEPSI,
    arxeio_id: arxeio.id,
    tmimata: [{ titlos: 'Λίστες', selides: { apo: 1, eos: 1 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
  });
  return gram.ok;
}