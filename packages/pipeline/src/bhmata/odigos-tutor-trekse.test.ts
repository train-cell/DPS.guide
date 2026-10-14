import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Arxeio, Selida, XartisMathimatos } from '@dps/core';
import {
  ArgiosLlm,
  FakeEclassPyli,
  FakeKatevasmaPyli,
  KatagrafiDiamnemata,
  LigmaArchiou,
  StatheriRologi,
} from '../testing/voirtheia.js';
import { odigos_mathimatos } from '../bhmata/odigos.js';
import { srixi_tutor_mathimatos } from '../bhmata/tutor.js';
import { trekse_analysi, trekse_mathimata } from '../bhmata/trekse.js';
import type { EisodosPipeline } from '../porte.js';
import {
  ARXEIO_MATHIMATON,
  arxeio_eurethriou,
  arxeio_keimenou,
  arxeio_odigou,
  arxeio_perigrammatos,
  arxeio_synomilias,
  arxeio_xarti,
  diadromi_arxeiou,
} from '../statheroi.js';
import { ftiaxe_arxeio_id, grapse_json } from '../grammata/apothiki-json.js';
import { me_cache } from '@dps/ai';
import { ftiaxe_docx } from '../testing/fixtures-arxeia.js';

const KODIKOS = 'M1';
const DIADROMI = 'dokimio.docx';

function ftiaxe_eisodos(apothiki: MnimiApothiki, llm: LigmaArchiou | ArgiosLlm, katagrafi: KatagrafiDiamnemata): EisodosPipeline {
  const pyli = llm instanceof LigmaArchiou ? me_cache(llm.llm, apothiki, `${KODIKOS}/.spoudes/cache/llm`) : llm;
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: pyli,
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

async function these_yliko(apothiki: MnimiApothiki, selides: Selida[]): Promise<Arxeio> {
  const arxeio = arxeio_test(DIADROMI);
  const eurethrio = await grapse_json(apothiki, arxeio_eurethriou(KODIKOS), [arxeio]);
  if (!eurethrio.ok) throw new Error('απέτυχε');
  const arkeio = await apothiki.grapse_dyadiko(diadromi_arxeiou(KODIKOS, DIADROMI), ftiaxe_docx(['# Τμήμα']));
  if (!arkeio.ok) throw new Error('απέτυχε');
  const keimeno = await grapse_json(apothiki, arxeio_keimenou(KODIKOS, arxeio.id), selides);
  if (!keimeno.ok) throw new Error('απέτυχε');
  return arxeio;
}

const PERIGRAMMA = {
  titlos: 'Δομές δεδομένων',
  tmimata: [
    { titlos: 'Λίστες', selides: { apo: 1, eos: 2 }, typos: 'theoria', ennoies: ['λίστα'], proapaitoumena: [] },
  ],
};

const XARTIS = {
  enotites: [
    {
      id: 'en1',
      titlos: 'Λίστες',
      piges: [{ arxeio_id: ftiaxe_arxeio_id(KODIKOS, DIADROMI), apo: 1, eos: 2 }],
      ennoies: ['λίστα'],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: null,
      apodosi_exetasis: null,
    },
  ],
  ekdosi_prompt: 'p2@1',
  dimiourgithike: '2026-10-09',
};

/** Οδηγός με τις 7 υποχρεωτικές ενότητες, με παραπομπές στο ΠΡΑΓΜΑΤΙΚΟ `arxeio_id`. */
function ftiaxe_odigo_md(arxeio_id: string): string {
  const parapompi = `[[${arxeio_id}:1]]`;
  return [
    '## 🎯 Στόχοι',
    `- Να κατανοεί τις λίστες. ${parapompi}`,
    '## 👶 ELI5',
    `- Μια λίστα σαν σειρά. ${parapompi}`,
    '## 🔬 Θεωρία',
    `- Θεωρία λιστών. ${parapompi}`,
    '## 🧪 Λυμένο παράδειγμα',
    `- Παράδειγμα λίστας. ${parapompi}`,
    '## ⚠️ Παγίδες',
    `- Μην μπερδέψεις με το σύνολο. ${parapompi}`,
    '## 🔗 Συνδέσεις',
    `- Σύνδεση με δέντρα. ${parapompi}`,
    '## ✅ Αυτοέλεγχος',
    `- Τι είναι λίστα; Απάντηση: ακολουθία στοιχείων. ${parapompi}`,
  ].join('\n');
}

async function these_perigramma_kai_xartis(
  apothiki: MnimiApothiki,
  arxeio: Arxeio,
  enotites: XartisMathimatos['enotites'] = XARTIS.enotites
): Promise<void> {
  const per = await grapse_json(apothiki, arxeio_perigrammatos(KODIKOS, arxeio.id), {
    ...PERIGRAMMA,
    arxeio_id: arxeio.id,
  });
  if (!per.ok) throw new Error('απέτυχε');
  const xa = await grapse_json(apothiki, arxeio_xarti(KODIKOS), {
    kodikos_mathimatos: KODIKOS,
    enotites,
    ekdosi_prompt: XARTIS.ekdosi_prompt,
    dimiourgithike: XARTIS.dimiourgithike,
  });
  if (!xa.ok) throw new Error('απέτυχε');
}

describe('odigos (lazy, βήμα 8)', () => {
  async function these_enotita(apothiki: MnimiApothiki, llm: LigmaArchiou): Promise<Arxeio> {
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
      selida(2, 'το δέντρο έχει ρίζα και παιδιά', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    await these_perigramma_kai_xartis(apothiki, arxeio);
    llm.orise({ markdown: ftiaxe_odigo_md(arxeio.id), parapompes: [] });
    return arxeio;
  }

  it('παράγει τον οδηγό με το P3 και γράφει .md + .meta.json', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_enotita(apothiki, llm);
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await odigos_mathimatos(p, KODIKOS, 'en1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.enotita_id).toBe('en1');
    const gram = await apothiki.diavase_keimeno(arxeio_odigou(KODIKOS, 'en1'));
    expect(gram.ok && gram.timi).toContain('🎯 Στόχοι');
    expect(await apothiki.yparxei(`${KODIKOS}/.spoudes/odigoi/en1.meta.json`)).toBe(true);
    expect(arxeio.id.length).toBe(64);
  });

  it('δεύτερη κλήση: μηδέν κλήσεις LLM (lazy, χωρίς επαναπαραγωγή)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_enotita(apothiki, llm);
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const proti = await odigos_mathimatos(p, KODIKOS, 'en1');
    const defteri = await odigos_mathimatos(p, KODIKOS, 'en1');

    expect(proti.ok && defteri.ok).toBe(true);
    if (!defteri.ok) throw new Error('απέτυχε');
    expect(defteri.timi).toEqual(proti.ok ? proti.timi : undefined);
    expect(llm.fortiseis).toBe(1);
  });

  it('αρνείται οδηγό χωρίς τις 7 υποχρεωτικές ενότητες και δεν γράφει τίποτα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_enotita(apothiki, llm);
    llm.katharize();
    llm.orise({
      markdown: `## 🎯 Στόχοι\n- μόνο αυτό [[${arxeio.id}:1]]`,
      parapompes: [],
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await odigos_mathimatos(p, KODIKOS, 'en1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei(arxeio_odigou(KODIKOS, 'en1'))).toBe(false);
  });

  it('αρνείται παραπομπή εκτός των επιτρεπόμενων πηγών', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_enotita(apothiki, llm);
    llm.katharize();
    llm.orise({
      markdown: ftiaxe_odigo_md(arxeio.id).replace(`:${1}]]`, ':99]]'),
      parapompes: [],
    });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await odigos_mathimatos(p, KODIKOS, 'en1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('άγνωστη ενότητα → DEN_VRETHIKE χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_enotita(apothiki, llm);
    await these_perigramma_kai_xartis(apothiki, arxeio);
    llm.katharize();
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await odigos_mathimatos(p, KODIKOS, 'ayto-yparkei');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(0);
  });
});

describe('srixi_tutor (βήμα 9)', () => {
  async function these_protosimos(apothiki: MnimiApothiki): Promise<Arxeio> {
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
      selida(2, 'το δέντρο έχει ρίζα και παιδιά', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    await these_perigramma_kai_xartis(apothiki, arxeio);
    const md = await apothiki.grapse_keimeno(arxeio_odigou(KODIKOS, 'en1'), ftiaxe_odigo_md(arxeio.id));
    if (!md.ok) throw new Error('απέτυχε');
    return arxeio;
  }

/** Απάντηση tutor που περνά το `ApantisiTutorSchema` (με `leitourgia` + `exexigmeni`). */
function apantisi_tutor(keimeno: string): Record<string, unknown> {
    return { apantisi: keimeno, parapompes: [], leitourgia: 'exigisi', exexigmeni: true };
  }

  it('γράφει τη συνομιλία στο jsonl (μαθητής + μοντέλο)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_protosimos(apothiki);
    llm.orise(apantisi_tutor('Μια λίστα είναι ακολουθία στοιχείων.'));
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await srixi_tutor_mathimatos(p, KODIKOS, { enotita_id: 'en1', erotisi: 'Τι είναι λίστα;', leitourgia: 'exigisi' });

    expect(apotelesma.ok).toBe(true);
    const gram = await apothiki.diavase_keimeno(arxeio_synomilias(KODIKOS, 'en1'));
    expect(gram.ok).toBe(true);
    if (!gram.ok) throw new Error('απέτυχε');
    const grammes = gram.timi.trim().split('\n').map((g) => JSON.parse(g) as { rolos: string; keimeno: string });
    expect(grammes.map((g) => g.rolos)).toEqual(['xristis', 'montelo']);
    expect(grammes[1]?.keimeno).toContain('ακολουθία στοιχείων');
  });

  it('κρατάει το ιστορικό στις επόμενες στροφές', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_protosimos(apothiki);
    llm.orise(apantisi_tutor('Πρώτη απάντηση.'));
    llm.orise(apantisi_tutor('Δεύτερη απάντηση.'));
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    await srixi_tutor_mathimatos(p, KODIKOS, { enotita_id: 'en1', erotisi: 'Πρώτη ερώτηση;', leitourgia: 'exigisi' });
    await srixi_tutor_mathimatos(p, KODIKOS, { enotita_id: 'en1', erotisi: 'Δεύτερη ερώτηση;', leitourgia: 'exigisi' });

    const gram = await apothiki.diavase_keimeno(arxeio_synomilias(KODIKOS, 'en1'));
    if (!gram.ok) throw new Error('απέτυχε');
    expect(gram.timi.trim().split('\n')).toHaveLength(4);
  });

  it('χωρίς οδηγό → DEN_VRETHIKE (οδηγός είναι προϋπόθεση, όχι ψεύτικη συνομιλία)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    await these_perigramma_kai_xartis(apothiki, arxeio);
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await srixi_tutor_mathimatos(p, KODIKOS, { enotita_id: 'en1', erotisi: 'Τι είναι λίστα;', leitourgia: 'exigisi' });

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });
});

describe('trekse_analysi (βήματα 4-7)', () => {
  it('κλίνει όλη τη ροή και δίνει χάρτη με λεπτά', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με πολλές λέξεις εδώ', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
      selida(2, 'το δέντρο έχει ρίζα και παιδιά και κλαδιά επίσης εδώ', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    llm.orise({ ...PERIGRAMMA, arxeio_id: arxeio.id });
    llm.orise({ ...XARTIS, kodikos_mathimatos: KODIKOS });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await trekse_analysi(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.enotites[0]?.lepta_ektimisi).toBeGreaterThan(0);
    expect(await apothiki.yparxei(arxeio_perigrammatos(KODIKOS, arxeio.id))).toBe(true);
    expect(await apothiki.yparxei(arxeio_xarti(KODIKOS))).toBe(true);
  });

  it('δεύτερη εκτέλεση: μηδέν νέες κλήσεις LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με πολλές λέξεις εδώ', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    llm.orise({ ...PERIGRAMMA, arxeio_id: arxeio.id });
    llm.orise({ ...XARTIS, kodikos_mathimatos: KODIKOS });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    await trekse_analysi(p, KODIKOS);
    const metaferis = llm.fortiseis;
    await trekse_analysi(p, KODIKOS);

    expect(llm.fortiseis).toBe(metaferis);
  });

  it('άδειο περίγραμμα: ο χάρτης γράφεται, αλλά η ανάλυση επιστρέφει επιτυχία (ποτέ ψεύτικες ενότητες)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    llm.orise({ ...PERIGRAMMA, arxeio_id: arxeio.id, tmimata: [] });
    llm.orise({ kodikos_mathimatos: KODIKOS, enotites: [], ekdosi_prompt: XARTIS.ekdosi_prompt, dimiourgithike: XARTIS.dimiourgithike });
    const p = ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata());

    const apotelesma = await trekse_analysi(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.enotites).toEqual([]);
    expect(await apothiki.yparxei(arxeio_xarti(KODIKOS))).toBe(true);
  });
});

describe('trekse_oloklirosi', () => {
  it('δουλεύει μόνο τα επιλεγμένα μαθήματα', async () => {
    const apothiki = new MnimiApothiki();
    const eclass = new FakeEclassPyli();
    const arxeio = await these_yliko(apothiki, [
      selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με πολλές λέξεις εδώ', ftiaxe_arxeio_id(KODIKOS, DIADROMI)),
    ]);
    const gram = await grapse_json(apothiki, ARXEIO_MATHIMATON, [
      { kodikos: KODIKOS, titlos: 'Δομές', url: '/M1', epilegmeno: true },
      { kodikos: 'M2', titlos: 'Άλλο', url: '/M2', epilegmeno: false },
    ]);
    if (!gram.ok) throw new Error('απέτυχε');
    eclass.dendra = { M1: [{ typos: 'arxeio', onoma: DIADROMI, diadromi: DIADROMI, url: 'u', megethos: 3, imerominia: null }] };
    const llm = new LigmaArchiou();
    llm.orise({ ...PERIGRAMMA, arxeio_id: arxeio.id });
    llm.orise({ ...XARTIS, kodikos_mathimatos: KODIKOS });
    const p: EisodosPipeline = { ...ftiaxe_eisodos(apothiki, llm, new KatagrafiDiamnemata()), eclass };

    const apotelesma = await trekse_mathimata(p, [
      { kodikos: KODIKOS, titlos: 'Δομές', url: '/M1', epilegmeno: true },
      { kodikos: 'M2', titlos: 'Άλλο', url: '/M2', epilegmeno: false },
    ]);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.mathimata).toBe(1);
    expect(eclass.kliseis_dendrou).toEqual([KODIKOS]);
  });

  it('χωρίς επιλεγμένο μάθημα → DEN_VRETHIKE', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new LigmaArchiou(), new KatagrafiDiamnemata());

    const apotelesma = await trekse_mathimata(p, []);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });
});

/** Ο τύπος του `Mathima` που χρειάζεται η σύνθετη ροή. */
export type MathimaRohimatos = Parameters<typeof trekse_mathimata>[1][number];
