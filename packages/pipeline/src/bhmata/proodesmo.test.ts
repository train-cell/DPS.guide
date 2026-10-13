/**
 * Κλειδώνει το ΚΟΙΝΟ ΣΥΜΒΟΛΑΙΟ: οι υπογραφές των βημάτων δεν αλλάζουν.
 *
 * Οι δοκιμές αυτές καλούν τις ΔΗΛΩΜΕΝΕΣ υπογραφές (`perigramma(p, arxeio_id)`,
 * `odigos(p, enotita_id)`, `trekse_oloklirosi(p)`) και ελέγχουν ότι η ροή
 * εντοπίζει ΜΟΝΗ ΤΗΣ το μάθημα από το `mathimata.json` — χωρίς να αλλάξει signature.
 */

import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Arxeio, Selida } from '@dps/core';
import {
  FakeEclassPyli,
  FakeKatevasmaPyli,
  KatagrafiDiamnemata,
  LigmaArchiou,
  StatheriRologi,
} from '../testing/voirtheia.js';
import {
  odigos,
  perigramma,
  srixi_tutor,
  trekse_oloklirosi,
} from '../index.js';
import type { EisodosPipeline } from '../porte.js';
import {
  ARXEIO_MATHIMATON,
  arxeio_eurethriou,
  arxeio_keimenou,
  arxeio_perigrammatos,
  arxeio_xarti,
  diadromi_arxeiou,
} from '../statheroi.js';
import { ftiaxe_arxeio_id, grapse_json } from '../grammata/apothiki-json.js';
import { me_cache } from '@dps/ai';
import { ftiaxe_docx } from '../testing/fixtures-arxeia.js';

const KODIKOS = 'M1';
const DIADROMI = 'dokimio.docx';

function ftiaxe_eisodos(apothiki: MnimiApothiki, llm: LigmaArchiou): EisodosPipeline {
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: me_cache(llm.llm, apothiki, `${KODIKOS}/.spoudes/cache/llm`),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi: new KatagrafiDiamnemata(),
    riza: '',
  };
}

function selida(arithmos: number, keimeno: string, arxeio_id: string): Selida {
  return {
    arxeio_id,
    arithmos,
    keimeno,
    lekseis: keimeno.split(' ').filter((l) => l !== '').length,
    xoris_keimeno: false,
  };
}

async function these_yliko(apothiki: MnimiApothiki): Promise<Arxeio> {
  const arxeio: Arxeio = {
    id: ftiaxe_arxeio_id(KODIKOS, DIADROMI),
    kodikos_mathimatos: KODIKOS,
    diadromi: DIADROMI,
    url: 'https://thales.example/dokimio.docx',
    megethos: 3,
    imerominia: null,
    etag: null,
    sha256: 'aabb',
    diplotypo_tou: null,
  };
  const mathimata = await grapse_json(apothiki, ARXEIO_MATHIMATON, [
    { kodikos: KODIKOS, titlos: 'Δομές', url: '/M1', epilegmeno: true },
  ]);
  if (!mathimata.ok) throw new Error('απέτυχε');
  const eurethrio = await grapse_json(apothiki, arxeio_eurethriou(KODIKOS), [arxeio]);
  if (!eurethrio.ok) throw new Error('απέτυχε');
  const arkeio = await apothiki.grapse_dyadiko(diadromi_arxeiou(KODIKOS, DIADROMI), ftiaxe_docx(['# Τ']));
  if (!arkeio.ok) throw new Error('απέτυχε');
  const keimeno = await grapse_json(apothiki, arxeio_keimenou(KODIKOS, arxeio.id), [
    selida(1, 'μια λίστα είναι μια ακολουθία στοιχείων με λέξεις', arxeio.id),
    selida(2, 'το δέντρο έχει ρίζα και παιδιά και κλαδιά εδώ', arxeio.id),
  ]);
  if (!keimeno.ok) throw new Error('απέτυχε');
  const per = await grapse_json(apothiki, arxeio_perigrammatos(KODIKOS, arxeio.id), {
    arxeio_id: arxeio.id,
    titlos: 'Δομές',
    tmimata: [{ titlos: 'Λίστες', selides: { apo: 1, eos: 2 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
  });
  if (!per.ok) throw new Error('απέτυχε');
  const xa = await grapse_json(apothiki, arxeio_xarti(KODIKOS), {
    kodikos_mathimatos: KODIKOS,
    enotites: [
      {
        id: 'en1',
        titlos: 'Λίστες',
        piges: [{ arxeio_id: arxeio.id, apo: 1, eos: 2 }],
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
  if (!xa.ok) throw new Error('απέτυχε');
  return arxeio;
}

describe('κοινό συμβόλαιο — οι δηλωμένες υπογραφές', () => {
  it('perigramma(p, arxeio_id): εντοπίζει το μάθημα μόνο του', async () => {
    const apothiki = new MnimiApothiki();
    const arxeio = await these_yliko(apothiki);
    const llm = new LigmaArchiou();
    llm.orise({
      arxeio_id: arxeio.id,
      titlos: 'Δομές',
      tmimata: [{ titlos: 'Λίστες', selides: { apo: 1, eos: 2 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
    });
    const p = ftiaxe_eisodos(apothiki, llm);

    const apotelesma = await perigramma(p, arxeio.id);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.arxeio_id).toBe(arxeio.id);
  });

  it('perigramma: άγνωστο arxeio_id → DEN_VRETHIKE χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    await these_yliko(apothiki);
    const llm = new LigmaArchiou();
    const p = ftiaxe_eisodos(apothiki, llm);

    const apotelesma = await perigramma(p, ftiaxe_arxeio_id(KODIKOS, 'allot-dokimio.docx'));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(0);
  });

  it('odigos(p, enotita_id): εντοπίζει το μάθημα από τον χάρτη', async () => {
    const apothiki = new MnimiApothiki();
    const arxeio = await these_yliko(apothiki);
    const parapompi = `[[${arxeio.id}:1]]`;
    const llm = new LigmaArchiou();
    llm.orise({
      markdown: [
        '## 🎯 Στόχοι',
        `- x ${parapompi}`,
        '## 👶 ELI5',
        `- x ${parapompi}`,
        '## 🔬 Θεωρία',
        `- x ${parapompi}`,
        '## 🧪 Λυμένο παράδειγμα',
        `- x ${parapompi}`,
        '## ⚠️ Παγίδες',
        `- x ${parapompi}`,
        '## 🔗 Συνδέσεις',
        `- x ${parapompi}`,
        '## ✅ Αυτοέλεγχος',
        `- x ${parapompi}`,
      ].join('\n'),
      parapompes: [],
    });
    const p = ftiaxe_eisodos(apothiki, llm);

    const apotelesma = await odigos(p, 'en1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.enotita_id).toBe('en1');
  });

  it('odigos: άγνωστη enotita_id → DEN_VRETHIKE', async () => {
    const apothiki = new MnimiApothiki();
    await these_yliko(apothiki);
    const llm = new LigmaArchiou();
    const p = ftiaxe_eisodos(apothiki, llm);

    const apotelesma = await odigos(p, 'ayto-yparkei');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('srixi_tutor(p, aitisi): εντοπίζει το μάθημα μόνο του', async () => {
    const apothiki = new MnimiApothiki();
    const arxeio = await these_yliko(apothiki);
    const parapompi = `[[${arxeio.id}:1]]`;
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/odigoi/en1.md`, `## 🎯 Στόχοι\n- x ${parapompi}`);
    const llm = new LigmaArchiou();
    llm.orise({ apantisi: 'Απάντηση.', parapompes: [], leitourgia: 'exigisi', exexigmeni: true });
    const p = ftiaxe_eisodos(apothiki, llm);

    const apotelesma = await srixi_tutor(p, { enotita_id: 'en1', erotisi: 'Τι είναι λίστα;', leitourgia: 'exigisi' });

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.apantisi).toBe('Απάντηση.');
  });

  it('trekse_oloklirosi(p): διαβάζει τα επιλεγμένα μαθήματα από το mathimata.json', async () => {
    const apothiki = new MnimiApothiki();
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      [KODIKOS]: [
        { typos: 'arxeio', onoma: DIADROMI, diadromi: DIADROMI, url: 'u', megethos: 3, imerominia: null },
      ],
    };
    await these_yliko(apothiki);
    const llm = new LigmaArchiou();
    llm.orise({
      arxeio_id: ftiaxe_arxeio_id(KODIKOS, DIADROMI),
      titlos: 'Δομές',
      tmimata: [{ titlos: 'Λίστες', selides: { apo: 1, eos: 2 }, typos: 'theoria', ennoies: [], proapaitoumena: [] }],
    });
    llm.orise({
      kodikos_mathimatos: KODIKOS,
      enotites: [
        {
          id: 'en1',
          titlos: 'Λίστες',
          piges: [{ arxeio_id: ftiaxe_arxeio_id(KODIKOS, DIADROMI), apo: 1, eos: 2 }],
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
    const p: EisodosPipeline = { ...ftiaxe_eisodos(apothiki, llm), eclass };

    const apotelesma = await trekse_oloklirosi(p);

if (!apotelesma.ok) throw new Error(`απέτυχε: ${apotelesma.sfalma.minima}`);
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi.mathimata).toBe(1);
    expect(eclass.kliseis_dendrou).toEqual([KODIKOS]);
  });
});
