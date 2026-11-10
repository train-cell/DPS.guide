import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Arxeio, Selida, XartisMathimatos } from '@dps/core';
import { ArgiosLlm, FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, LigmaArchiou, StatheriRologi } from '../testing/voirtheia.js';
import { ftiaxe_docx } from '../testing/fixtures-arxeia.js';
import { antistoihisi_tematices_eotisis, ftiaxe_analysi_thematon, prompt_antistoihisis_thematos } from '../themata/themata.js';
import type { EisodosPipeline, OcrPyli } from '../porte.js';
import { arxeio_apodosis, arxeio_xarti, diadromi_thematon } from '../statheroi.js';
import { ftiaxe_arxeio_id, grapse_json } from '../grammata/apothiki-json.js';
import { me_cache } from '@dps/ai';

const KODIKOS = 'M1';
const ENOTITA_1 = 'en1';

/** Συνθετικό PDF: κείμενο σε μία σελίδα (όπως το βγάζει το `@dps/extract`). */
function ftiaxe_pdf(keimeno: string): Uint8Array {
  const content = `BT /F1 12 Tf 72 700 Td (${keimeno}) Tj ET\n`;
  const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const page = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const contentObj = `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`;
  const font = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const xrefPos = catalog.length + pagesObj.length + page.length + contentObj.length + font.length;
  const xref = `xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000073 00000 n \n0000000133 00000 n \n0000000243 00000 n \n0000000343 00000 n \n`;
  return new TextEncoder().encode(
    `%PDF-1.4\n${catalog}${pagesObj}${page}${contentObj}${font}${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`
  );
}

/** Κατεστραμμένο PDF: η `xref` οδηγεί σε λάθος θέση → το pdfjs πετάει. */
function ftiaxe_pdf_katorismeno(): Uint8Array {
  const dedomena = ftiaxe_pdf('κείμενο').buffer.slice(0);
  const view = new DataView(dedomena);
  // Σβήνω το `startxref` για να μην μπορέσει να βρει τον πίνακα αναφορών.
  const idx = new TextDecoder().decode(new Uint8Array(dedomena)).indexOf('startxref');
  for (let i = idx; i < idx + 10; i++) {
    view.setUint8(i, 0x20);
  }
  return new Uint8Array(dedomena);
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
  return { arxeio_id, arithmos, keimeno, lekseis, xoris_keimeno: lekseis < 5 };
}

function xartis_test(enotites: XartisMathimatos['enotites']): XartisMathimatos {
  return {
    kodikos_mathimatos: KODIKOS,
    enotites: enotites.map((e) => ({
      ...e,
      piges: [],
      ennoies: [],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: null,
      apodosi_exetasis: null,
    })),
    ekdosi_prompt: 'p2@1',
    dimiourgithike: '2026-10-09',
  };
}

function ftiaxe_eisodos(apothiki: MnimiApothiki, katagrafi: KatagrafiDiamnemata, ocr?: OcrPyli, llm: LigmaArchiou | ArgiosLlm = new LigmaArchiou()): EisodosPipeline {
  const pyli = llm instanceof LigmaArchiou ? me_cache(llm.llm, apothiki, `${KODIKOS}/.spoudes/cache/llm`) : llm;
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    // Η ροή περνάει ΠΑΝΤΑ από το me_cache του `@dps/ai`.
    llm: pyli,
    ocr,
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi,
    riza: '',
  };
}

const ENOTITES = [{ id: ENOTITA_1, titlos: 'Λίστες' }];
const ANTISTOIΧΙΣΕΙΣ = [{ enotita_id: ENOTITA_1, monades: 5 }];

describe('prompt_antistoihisis_thematos', () => {
  it('δένει το κείμενο του θέματος με τις ενότητες του χάρτη', () => {
    const aitisi = prompt_antistoihisis_thematos({ keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(aitisi.sistima).toContain('Ενότητες του μαθήματος');
    expect(aitisi.sistima).toContain(`id: ${ENOTITA_1}, τίτλος: Λίστες`);
    expect(aitisi.xristis).toContain('Κείμενο θέματος');
    expect(aitisi.ekdosi_prompt).toBe('p5@1');
  });
});

describe('antistoihisi_tematices_eotisis', () => {
  it('επιστρέφει την αντιστοίχιση (LLM θετικό)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await antistoihisi_tematices_eotisis(p, { keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual(ANTISTOIΧΙΣΕΙΣ);
  });

  it('σφάλμα LLM → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, new ArgiosLlm());

    const apotelesma = await antistoihisi_tematices_eotisis(p, { keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('άγνωστο id ενότητας → MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    llm.orise([{ enotita_id: 'ayto-yparkei', monades: 5 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await antistoihisi_tematices_eotisis(p, { keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μονάδες εκτός εύρους → MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    llm.orise([{ enotita_id: ENOTITA_1, monades: 21 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await antistoihisi_tematices_eotisis(p, { keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('κενές μονάδες → αποδεκτές (0 = ELAXISTES_MONADES)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    llm.orise([{ enotita_id: ENOTITA_1, monades: 0 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await antistoihisi_tematices_eotisis(p, { keimeno: 'ένα θέμα', enotites: ENOTITES });

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual([{ enotita_id: ENOTITA_1, monades: 0 }]);
  });
});

describe('ftiaxe_analysi_thematon', () => {
  /** Γράφει χάρτη και ένα έγκυρο `apodosi.json` σε νέο `MnimiApothiki`. */
  async function these_eieis(apothiki: MnimiApothiki, llm: LigmaArchiou): Promise<void> {
    await apothiki.grapse_keimeno(arxeio_xarti(KODIKOS), JSON.stringify(xartis_test(ENOTITES)));
  }

  it('το υπάρχον apodosi.json επιστρέφεται χωρίς LLM', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), JSON.stringify({ [ENOTITA_1]: 5 }));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ [ENOTITA_1]: 5 });
    expect(llm.fortiseis).toBe(0);
  });

  it('κενό υπάρχον apodosi.json → MI_EGKYRO_SXIMA (null)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), '   ');
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('null υπάρχον apodosi.json → MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), 'null');
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη έγκυρο υπάρχον apodosi.json → MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), '[]');
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('αριθμός ως apodosi.json → MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), '42');
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('σφάλμα ανάγνωσης υπάρχοντος apodosi.json → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(arxeio_apodosis(KODIKOS), JSON.stringify({ [ENOTITA_1]: 5 }));
    const diavase_keimeno = apothiki.diavase_keimeno.bind(apothiki);
    apothiki.diavase_keimeno = async (diadromi) => {
      if (diadromi.includes(arxeio_apodosis(KODIKOS))) {
        return { ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'δεν γίνεται ανάγνωση' } };
      }
      return diavase_keimeno(diadromi);
    };
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('σφάλμα λίστας themata/ → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    apothiki.lista = async () => ({ ok: false, sfalma: { kodikos: 'DIKTYO', minima: '' } });
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('δεν υπάρχουν PDF → κενή ανάλυση', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    await apothiki.diagrafi(arxeio_apodosis(KODIKOS));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({});
    expect(llm.fortiseis).toBe(0);
  });

  it('σφάλμα χάρτη → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);
    await apothiki.diagrafi(arxeio_xarti(KODIKOS));

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('κατεστραμμένο PDF → σφάλμα εξαγωγής κειμένου', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf_katorismeno());
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('non-pdf αρχείο στον φάκελο → παραλείπεται (L216 false branch)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi_pdf = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi_pdf, ftiaxe_pdf('μια λίστα'));
    // Ένα μη pdf αρχείο που πρέπει να παραληφθεί από το `pdf_onomata`.
    await apothiki.grapse_dyadiko(`M1/themata/synaxis.txt`, ftiaxe_docx(['#']));
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ [ENOTITA_1]: 5 });
    expect(llm.fortiseis).toBe(1);
  });

  it('ενότητα με κενό id → MI_EGKYRO_SXIMA (L280)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await apothiki.grapse_keimeno(
      arxeio_xarti(KODIKOS),
      JSON.stringify(xartis_test([{ id: '', titlos: '' }, ...ENOTITES]))
    );
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    // Μία ενότητα με κενό id: η `antistoihisi` την δέχεται, ο `ypologise_apodosi` όχι.
    llm.orise([{ enotita_id: '', monades: 5 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('Κενό id ενότητας');
  });

  it('LLM χωρίς fixture → DEN_VRETHIKE (L145, L146)', async () => {
    const apothiki = new MnimiApothiki();
    // Ουδέτερο `LigmaArchiou`: καμία ηχογράφηση, ο MockLlmArchiou επιστρέφει null.
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.fortiseis).toBe(1);
  });

  it('σφάλμα ανάγνωσης PDF → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    const diavase_dyadiko = apothiki.diavase_dyadiko.bind(apothiki);
    apothiki.diavase_dyadiko = async (d) => {
      if (d.includes('subject.pdf')) {
        return { ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'δεν γίνεται ανάγνωση' } };
      }
      return diavase_dyadiko(d);
    };
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('άδειο θέμα → παραλείπεται', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf(''));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({});
    expect(llm.fortiseis).toBe(0);
  });

  it('OCR: σελίδα χωρίς κείμενο → OCR, χωρίς παραλήπτη κειμένου', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const ocr = {
      anagnorise_pdf_selida: async () => ({ ok: true, timi: 'κεείμενο OCR' }),
    } as OcrPyli;
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('α β'));
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ [ENOTITA_1]: 5 });
  });

  it('OCR: σελίδα με κείμενο (xoris_keimeno false) → δεν καλεί OCR', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const ocr = {
      anagnorise_pdf_selida: async () => ({ ok: true, timi: 'κεείμενο OCR' }),
    } as OcrPyli;
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    // 6 λέξεις → `xoris_keimeno: false` → δεν καλείται OCR
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα είναι μια ακολουθία'));
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ [ENOTITA_1]: 5 });
    expect(llm.fortiseis).toBe(1);
  });

  it('OCR αποτυγχάνει → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const ocr = {
      anagnorise_pdf_selida: async () => ({
        ok: false,
        sfalma: { kodikos: 'OCR_APOTYXIA', minima: 'δεν βγήκε κείμενο' },
      }),
    } as OcrPyli;
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('α'));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('OCR_APOTYXIA');
  });

  it('κενό κείμενο από OCR → παραλείπεται', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    const ocr = {
      anagnorise_pdf_selida: async () => ({ ok: true, timi: '  ' }),
    } as OcrPyli;
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('α'));
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({});
  });

  it('αποτυχία αντιστοίχισης → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    llm.orise([{ enotita_id: 'ayto-yparkei', monades: 5 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('αποτυχία εγγραφής apodosi.json → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const grapse_keimeno = apothiki.grapse_keimeno.bind(apothiki);
    apothiki.grapse_keimeno = async (diadromi, periexomeno) => {
      if (diadromi.includes(arxeio_apodosis(KODIKOS))) {
        return { ok: false, sfalma: { kodikos: 'DIKTYO', minima: '' } };
      }
      return grapse_keimeno(diadromi, periexomeno);
    };
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('αποτυχία υπολογισμού απόδοσης → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα'));
    llm.orise([{ enotita_id: ENOTITA_1, monades: -1 }]);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('γράφει την apodosi.json (ολόκληρη ροή)', async () => {
    const apothiki = new MnimiApothiki();
    const llm = new LigmaArchiou();
    await these_eieis(apothiki, llm);
    const diadromi = `M1/themata/subject.pdf`;
    await apothiki.grapse_dyadiko(diadromi, ftiaxe_pdf('μια λίστα είναι μια ακολουθία'));
    llm.orise(ANTISTOIΧΙΣΕΙΣ);
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), undefined, llm);

    const apotelesma = await ftiaxe_analysi_thematon(p, KODIKOS);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi).toEqual({ [ENOTITA_1]: 5 });
    const gram = await apothiki.diavase_keimeno(arxeio_apodosis(KODIKOS));
    expect(gram.ok).toBe(true);
    if (!gram.ok) throw new Error('aπέτυχε');
    expect(JSON.parse(gram.timi)).toEqual({ [ENOTITA_1]: 5 });
  });
});
