import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type {
  AntistoixisiThematos,
  Apotelesma,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
  Selida,
} from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, LigmaArchiou, StatheriRologi } from '../testing/voirtheia.js';
import type { EisodosPipeline, OcrPyli } from '../porte.js';
import { arxeio_apodosis, arxeio_xarti, diadromi_thematon, me_riza } from '../statheroi.js';
import { grapse_json } from '../grammata/apothiki-json.js';
import { exagage_pdf } from '@dps/extract';
import {
  antistoihisi_tematices_eotisis,
  ftiaxe_analysi_thematon,
  prompt_antistoihisis_thematos,
  EKDOSI_PROMPT_P5,
  ELAXISTES_MONADES,
  MEGISTES_MONADES,
} from './themata.js';

/** Το πεττωμένο `@dps/extract`· η εξαγωγή κειμένου ελέγχεται από την ροή, όχι από εδώ. */
vi.mock('@dps/extract', () => ({
  exagage_pdf: vi.fn(),
}));

/** Κλήση του P5 που καταγράφει το αίτημα και περνάει στο `MockLlmArchiou`. */
interface KlisiP5 {
  systima: string;
  xristis: string;
  ekdosi_prompt: string;
}

class SpyOcr implements OcrPyli {
  kliseis: number = 0;

  constructor(private apantisi: () => Promise<Apotelesma<string>>) {}

  async anagnorise_pdf_selida(_bytes: Uint8Array, _page: number): Promise<Apotelesma<string>> {
    this.kliseis += 1;
    return this.apantisi();
  }
}

class SpyLlm implements LlmPyli {
  readonly montelo = 'spy';
  kliseis: KlisiP5[] = [];

  constructor(private meta: LlmPyli) {}

  async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    this.kliseis.push({ systima: a.systima, xristis: a.xristis, ekdosi_prompt: a.ekdosi_prompt });
    return this.meta.parage_json(a);
  }

  async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    return this.meta.parage_keimeno(a);
  }
}

const KODIKOS = 'M1';
const DIADROMI_THEMA = diadromi_thematon(KODIKOS);
const THEMA_1 = 'theima1.pdf';
const THEMA_2 = 'theima2.pdf';

function ftiaxe_eisodos(
  apothiki: MnimiApothiki,
  llm: LigmaArchiou,
  katagrafi: KatagrafiDiamnemata,
  ocr?: OcrPyli
): EisodosPipeline {
  const base = {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: new SpyLlm(llm.llm),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi,
    riza: '',
  };
  return ocr === undefined ? base : { ...base, ocr };
}

/** Χάρτης με δύο ενότητες, όπως τον γράφει το βήμα xartis. */
async function these_xartis(apothiki: MnimiApothiki): Promise<void> {
  await grapse_json(apothiki, arxeio_xarti(KODIKOS), {
    kodikos_mathimatos: KODIKOS,
    enotites: [
      {
        id: 'en1',
        titlos: 'Λίστες',
        piges: [],
        ennoies: [],
        proapaitoumenes: [],
        seira: 1,
        lepta_ektimisi: null,
        apodosi_exetasis: null,
      },
      {
        id: 'en2',
        titlos: 'Δένδρα',
        piges: [],
        ennoies: [],
        proapaitoumenes: [],
        seira: 2,
        lepta_ektimisi: null,
        apodosi_exetasis: null,
      },
    ],
    ekdosi_prompt: 'p2@1',
    dimiourgithike: '2026-10-09',
  });
}

/** Γράφει ένα ψεύτικο PDF στον φάκελο `themata/` — η εξαγωγή κειμένου είναι πεττωμένη. */
async function these_thema(apothiki: MnimiApothiki, onoma: string, keimeno: string): Promise<void> {
  await apothiki.grapse_dyadiko(`${DIADROMI_THEMA}/${onoma}`, new TextEncoder().encode(keimeno));
}

/** Το κείμενο που επιστρέφει η πεττωμένη εξαγωγή για ένα θέμα. */
function keimeno_thematos(otios: string): Selida {
  return { arxeio_id: 'arx-1', arithmos: 1, keimeno: otios, lekseis: 0, xoris_keimeno: false };
}

/** Αντιστοίχιση μίας ερώτησης σε μία ενότητα (έξοδος P5). */
function antistoihisi(enotita_id: string, monades: number): AntistoixisiThematos {
  return { enotita_id, monades };
}

/** Η επόμενη ηχογραφημένη απάντηση του LigmaArchiou (μία ανά κλήση P5). */
function orise_tema(llm: LigmaArchiou, antistoixiseis: AntistoixisiThematos[]): void {
  llm.orise(antistoixiseis);
}

beforeEach(() => {
  vi.mocked(exagage_pdf).mockReset();
});

describe('ftiaxe_analysi_thematon (T3)', () => {
  it('αναλύει δύο θέματα, αθροίζει τις μονάδες και γράφει το apodosi.json', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1: ερώτηση Α');
    await these_thema(apothiki, THEMA_2, 'Θέμα 2: ερώτηση Β');
    orise_tema(llm, [antistoihisi('en1', 2), antistoihisi('en2', 3.5)]);
    orise_tema(llm, [antistoihisi('en1', 1)]);
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 1: ερώτηση Α')]));
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 2: ερώτηση Β')]));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ en1: 3, en2: 3.5 });
    expect(await apothiki.yparxei(me_riza('', arxeio_apodosis(KODIKOS)))).toBe(true);
    const gram = await apothiki.diavase_keimeno(me_riza('', arxeio_apodosis(KODIKOS)));
    expect(gram.ok).toBe(true);
    if (!gram.ok) throw new Error('aπέτυχε');
    expect(JSON.parse(gram.timi)).toEqual({ en1: 3, en2: 3.5 });
    // Ένα θέμα = μία κλήση P5.
    expect(llm.fortiseis).toBe(2);
    // Καταγραφή ολοκλήρωσης.
    expect(katagrafi.plirofories).toContain('analysi_thematon: η ανάλυση θεμάτων ολοκληρώθηκε');
    expect(katagrafi.plirofories).toHaveLength(3);
  });

  it('ιδempotent: το υπάρχον apodosi.json επιστρέφεται χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    await apothiki.grapse_keimeno(
      me_riza('', arxeio_apodosis(KODIKOS)),
      JSON.stringify({ en1: 1, en2: 2 })
    );
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ en1: 1, en2: 2 });
    expect(llm.fortiseis).toBe(0);
    expect(vi.mocked(exagage_pdf)).not.toHaveBeenCalled();
  });

  it('η ίδια είσοδος δίνει πάντα το ίδιο αποτέλεσμα (ντετερμινισμός)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    orise_tema(llm, [antistoihisi('en1', 2)]);
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 1')]));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const proti = await ftiaxe_analysi_thematon(p, KODIKOS);
    const defteri = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(proti.ok && defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('aπέτυχε');
    expect(defteri.timi).toEqual({ en1: 2 });
    expect(llm.fortiseis).toBe(1);
  });

  it('χωρίς PDF στον φάκελο επιστρέφει {} χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({});
    expect(llm.fortiseis).toBe(0);
    expect(vi.mocked(exagage_pdf)).not.toHaveBeenCalled();
    expect(katagrafi.proeidopoiiseis).toContain('analysi_thematon: δεν υπάρχουν PDF στον φάκελο themata/');
  });

  it('χωρίς χάρτη επιστρέφει DEN_VRETHIKE χωρίς κλήση LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(0);
    expect(vi.mocked(exagage_pdf)).not.toHaveBeenCalled();
    expect(katagrafi.sfalmata).toContain('analysi_thematon: ο χάρτης δεν διαβάστηκε');
  });

  it('εξαγωγή κειμένου με σφάλμα επιστρέφει το σφάλμα χωρίς εγγραφή', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    vi.mocked(exagage_pdf).mockResolvedValue(apotyxia('MI_EGKYRO_SXIMA', 'Το PDF δεν μπορεί να ανοιχτεί'));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(llm.fortiseis).toBe(0);
    expect(vi.mocked(exagage_pdf)).toHaveBeenCalledTimes(1);
    // Το πρώτο θέμα απέτυχε — δεν γράφεται τίποτα.
    expect(await apothiki.yparxei(me_riza('', arxeio_apodosis(KODIKOS)))).toBe(false);
  });

  it('θέμα χωρίς κείμενο το παραλείπει με προειδοποίηση', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Κενό θέμα');
    await these_thema(apothiki, THEMA_2, 'Θέμα 2');
    orise_tema(llm, [antistoihisi('en1', 2)]);
    let kliseis = 0;
    vi.mocked(exagage_pdf).mockImplementation(async () => {
      kliseis += 1;
      return ok([keimeno_thematos(kliseis === 1 ? '' : 'Θέμα 2')]);
    });
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ en1: 2 });
    // Μόνο το δεύτερο θέμα καλείται.
    expect(llm.fortiseis).toBe(1);
    expect(vi.mocked(exagage_pdf)).toHaveBeenCalledTimes(2);
    expect(katagrafi.proeidopoiiseis).toContain('analysi_thematon: το θέμα είναι άδειο');
  });

  it('σφάλλει με MI_EGKYRO_SXIMA όταν η LLM επινοεί id ενότητας', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    orise_tema(llm, [antistoihisi('hallucinomeno', 2)]);
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 1')]));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('hallucinomeno');
    expect(llm.fortiseis).toBe(1);
    expect(vi.mocked(exagage_pdf)).toHaveBeenCalledTimes(1);
  });

  it('σφάλλει με MI_EGKYRO_SXIMA όταν οι μονάδες είναι εκτός εύρους', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    orise_tema(llm, [antistoihisi('en1', MEGISTES_MONADES + 1)]);
    orise_tema(llm, [antistoihisi('en2', ELAXISTES_MONADES - 1)]);
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 1')]));
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 2')]));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain(`${MEGISTES_MONADES + 1}`);
    expect(llm.fortiseis).toBe(1);
  });

  it('η επιφύλαξη OCR διαβάζει σελίδες χωρίς στρώμα κειμένου', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    orise_tema(llm, [antistoihisi('en1', 2)]);
    vi.mocked(exagage_pdf).mockImplementation(async () => {
      // Σελίδα χωρίς κείμενο: η ροή καλεί την OCR.
      return ok([
        { arxeio_id: 'arx-1', arithmos: 1, keimeno: '', lekseis: 0, xoris_keimeno: true },
      ]);
    });
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi, new SpyOcr(async () => ok('Αντικατέστησε το κείμενο')));

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ en1: 2 });
  });

  it('δίνει το σφάλμα της LLM όταν η σειρά fixtures έχει εξαντληθεί', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_xartis(apothiki);
    await these_thema(apothiki, THEMA_1, 'Θέμα 1');
    vi.mocked(exagage_pdf).mockResolvedValue(ok([keimeno_thematos('Θέμα 1')]));
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(1);
  });
});

describe('antistoihisi_tematices_eotisis (T3)', () => {
  it('επα validειροποιεί τα ids και τις μονάδες πριν επιστρέψει το αποτέλεσμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    orise_tema(llm, [antistoihisi('en1', 5)]);
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const result = await antistoihisi_tematices_eotisis(p, {
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('aπέτυχε');
    expect(result.timi).toEqual([{ enotita_id: 'en1', monades: 5 }]);
    expect(llm.fortiseis).toBe(1);
  });

  it('σφάλλει όταν η LLM επινοεί id ενότητας', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    orise_tema(llm, [antistoihisi('hallucinomeno', 2)]);
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const result = await antistoihisi_tematices_eotisis(p, {
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('aπέτυχε');
    expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('σφάλλει όταν οι μονάδες είναι εκτός εύρους', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    orise_tema(llm, [antistoihisi('en1', MEGISTES_MONADES + 1)]);
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const result = await antistoihisi_tematices_eotisis(p, {
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('aπέτυχε');
    expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('σφάλλει όταν η LLM δεν απαντήσει (κενή σειρά fixtures)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, llm, katagrafi);

    const result = await antistoihisi_tematices_eotisis(p, {
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('aπέτυχε');
    expect(result.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });
});

describe('prompt_antistoihisis_thematos', () => {
  it('δίνει έκδοση p5 και σχήμα ενότητα/μονάδες', () => {
    const aitisi = prompt_antistoihisis_thematos({
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });
    expect(aitisi.ekdosi_prompt).toBe(EKDOSI_PROMPT_P5);
    const egkyro = aitisi.sisma.safeParse([{ enotita_id: 'en1', monades: 2 }]);
    expect(egkyro.success).toBe(true);
    if (!egkyro.success) throw new Error('aπέτυχε');
    expect(egkyro.data).toEqual([{ enotita_id: 'en1', monades: 2 }]);
  });

  it('περιέχει τις ενότητες του χάρτη στο σύστημα', () => {
    const aitisi = prompt_antistoihisis_thematos({
      keimeno: 'Θέμα',
      enotites: [{ id: 'en1', titlos: 'Λίστες' }],
    });
    expect(aitisi.sistima).toContain('en1');
    expect(aitisi.sistima).toContain('Λίστες');
    expect(aitisi.xristis).toContain('Θέμα');
  });
});
