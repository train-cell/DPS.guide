import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Arxeio, Selida } from '@dps/core';
import { apotyxia } from '@dps/core';
import { ArgiosLlm, FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, StatheriRologi } from '../testing/voirtheia.js';
import { ftiaxe_docx, ftiaxe_pptx } from '../testing/fixtures-arxeia.js';
import { exagogi } from '../bhmata/exagogi.js';
import type { EisodosPipeline, OcrPyli } from '../porte.js';
import { arxeio_eurethriou, arxeio_keimenou, diadromi_arxeiou } from '../statheroi.js';
import { ftiaxe_arxeio_id, grapse_json } from '../grammata/apothiki-json.js';

/** Συνθετικό PDF: ένα κείμενο ανά σελίδα, όπως το βγάζει το `@dps/extract`. */
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

function ftiaxe_pdf_xoris_keimeno(): Uint8Array {
  // Καμία λέξη: η σελίδα σημαίνεται `xoris_keimeno` και πηγαίνει στο OCR.
  return ftiaxe_pdf('α');
}

function ftiaxe_eisodos(
  apothiki: MnimiApothiki,
  katagrafi: KatagrafiDiamnemata,
  ocr?: OcrPyli
): EisodosPipeline {
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: new ArgiosLlm(),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi,
    riza: '',
    ...(ocr === undefined ? {} : { ocr }),
  };
}

function arxeio_test(diadromi: string, epitexseis: Partial<Arxeio> = {}): Arxeio {
  return {
    id: ftiaxe_arxeio_id('M1', diadromi),
    kodikos_mathimatos: 'M1',
    diadromi,
    url: `https://thales.example/${diadromi}`,
    megethos: 3,
    imerominia: '2026-10-01T00:00:00.000Z',
    etag: null,
    sha256: 'aabb',
    diplotypo_tou: null,
    ...epitexseis,
  };
}

async function these_arxeia(
  apothiki: MnimiApothiki,
  arxeia: readonly Arxeio[],
  dedomena: ReadonlyMap<string, Uint8Array>
): Promise<void> {
  const gram = await grapse_json(apothiki, arxeio_eurethriou('M1'), arxeia);
  if (!gram.ok) throw new Error('απέτυχε η εγγραφή του ευρετηρίου');
  for (const arxeio of arxeia) {
    const ded = dedomena.get(arxeio.diadromi);
    if (ded === undefined) continue;
    const grapse = await apothiki.grapse_dyadiko(diadromi_arxeiou('M1', arxeio.diadromi), ded);
    if (!grapse.ok) throw new Error('απέτυχε η εγγραφή του αρχείου');
  }
}

async function diavase_keimeno(
  apothiki: MnimiApothiki,
  arxeio_id: string
): Promise<Selida[]> {
  const gram = await apothiki.diavase_keimeno(arxeio_keimenou('M1', arxeio_id));
  if (!gram.ok) throw new Error('λείπει το keimeno');
  return JSON.parse(gram.timi) as Selida[];
}

const DOCX_KEIMENO = ftiaxe_docx([
  '# Δομές δεδομένων και αναζητήσεις',
  'Μια λίστα είναι μια ακολουθία στοιχείων.',
  '# Δέντρα',
  'Ένα δέντρο έχει ρίζα και παιδιά.',
]);
const PPTX_KEIMENO = ftiaxe_pptx([['Λίστα: σειρά στοιχείων'], ['Στοίβα: LIFO']]);

describe('exagogi', () => {
  it('εξάγει το κείμενο docx στο keimeno/<arxeio_id>.json', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    const arxeio = arxeio_test('dokimio.docx');
    await these_arxeia(apothiki, [arxeio], new Map([['dokimio.docx', DOCX_KEIMENO]]));

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    const selides = await diavase_keimeno(apothiki, arxeio.id);
    expect(selides).toHaveLength(2);
    expect(selides[0]?.arxeio_id).toBe(arxeio.id);
    expect(selides[0]?.arithmos).toBe(1);
    expect(selides[0]?.keimeno).toContain('Δομές δεδομένων');
  });

  it('εξάγει pptx με αριθμητική σειρά slides', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    const arxeio = arxeio_test('dia.pptx');
    await these_arxeia(apothiki, [arxeio], new Map([['dia.pptx', PPTX_KEIMENO]]));

    await exagogi(p, 'M1');

    const selides = await diavase_keimeno(apothiki, arxeio.id);
    expect(selides.map((s) => s.arithmos)).toEqual([1, 2]);
    expect(selides[1]?.keimeno).toContain('Στοίβα');
  });

  it('είναι idempotent: το δεύτερο run δεν εξάγει ξανά', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    await these_arxeia(apothiki, [arxeio_test('dokimio.docx')], new Map([['dokimio.docx', DOCX_KEIMENO]]));

    const proti = await exagogi(p, 'M1');
    const defteri = await exagogi(p, 'M1');

    expect(proti.ok && proti.timi.megaliteres).toBe(1);
    expect(defteri.ok && defteri.timi.megaliteres).toBe(0);
  });

  it('μεταδίδει MI_EGKYRO_SXIMA σε κατεστραμμένο docx χωρίς μισό αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    const arxeio = arxeio_test('laxo.docx');
    await these_arxeia(apothiki, [arxeio], new Map([['laxo.docx', new Uint8Array([0, 1, 2, 3])]]));

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei(arxeio_keimenou('M1', arxeio.id))).toBe(false);
  });

  it('χωρίς ευρετήριο επιστρέφει DEN_VRETHIKE (καμία ψεύτικη λίστα)', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('παραλείπει αρχεία χωρίς εξαγωγή (png, zip) και το αναφέρει', async () => {
    const apothiki = new MnimiApothiki();
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, katagrafi);
    await these_arxeia(
      apothiki,
      [arxeio_test('foto.png'), arxeio_test('arxeia.zip')],
      new Map([['foto.png', new Uint8Array([1, 2])]])
    );

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(0);
    expect(katagrafi.proeidopoiiseis).toHaveLength(2);
  });

  it('δεν σταματά στο .ppt (OLE2): προειδοποιεί και συνεχίζει', async () => {
    const apothiki = new MnimiApothiki();
    const katagrafi = new KatagrafiDiamnemata();
    const p = ftiaxe_eisodos(apothiki, katagrafi);
    await these_arxeia(
      apothiki,
      [arxeio_test('palia.ppt'), arxeio_test('dokimio.docx')],
      new Map([
        ['palia.ppt', new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
        ['dokimio.docx', DOCX_KEIMENO],
      ])
    );

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    expect(katagrafi.proeidopoiiseis.join(' ')).toContain('palia.ppt');
  });

  it('συνεχίζει μετά από crash: το επόμενο run εξάγει μόνο όσα λείπουν', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    const vathio = arxeio_test('vathio.docx');
    const lasso = arxeio_test('lasso.docx');
    // Το πρώτο αρχείο είναι έγκυρο και εξάγεται· το δεύτερο είναι κατεστραμμένο
    // και σταματάει τη ροή. Έτσι δοκιμάζουμε τη συνέχιση μετά το «κράση».
    await these_arxeia(
      apothiki,
      [vathio, lasso],
      new Map([
        ['vathio.docx', DOCX_KEIMENO],
        ['lasso.docx', new Uint8Array([0, 1, 2])],
      ])
    );

    const proti = await exagogi(p, 'M1');

    expect(proti.ok).toBe(false);
    if (proti.ok) throw new Error('απέτυχε');
    expect(proti.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei(arxeio_keimenou('M1', vathio.id))).toBe(true);
    expect(await apothiki.yparxei(arxeio_keimenou('M1', lasso.id))).toBe(false);

    // Διορθώνουμε το δεύτερο αρχείο και ξανατρέχουμε: εξάγεται ΜΟΝΟ αυτό.
    await apothiki.grapse_dyadiko(diadromi_arxeiou('M1', 'lasso.docx'), DOCX_KEIMENO);
    const defteri = await exagogi(p, 'M1');

    expect(defteri.ok).toBe(true);
    if (!defteri.ok) throw new Error('απέτυχε');
    expect(defteri.timi.megaliteres).toBe(1);
  });

  it('δεν επεξεργάζεται αρχείο που λείπει από τη θύρα (DEN_VRETHIKE, όχι κενό keimeno)', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    await these_arxeia(apothiki, [arxeio_test('dokimio.docx')], new Map());

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('εξάγει pdf με κείμενο', async () => {
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());
    const arxeio = arxeio_test('dokimio.pdf');
    await these_arxeia(
      apothiki,
      [arxeio],
      new Map([['dokimio.pdf', ftiaxe_pdf('a list is a sequence of elements')]])
    );

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    const selides = await diavase_keimeno(apothiki, arxeio.id);
    expect(selides).toHaveLength(1);
    expect(selides[0]?.keimeno).toBe('a list is a sequence of elements');
  });

  it('pdf χωρίς κείμενο σελίδας → τοπικό OCR', async () => {
    const apothiki = new MnimiApothiki();
    const ocr = {
      anagnorise_pdf_selida: async () => ({ ok: true, timi: 'κείμενο από OCR' }),
    } as OcrPyli;
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr);
    const arxeio = arxeio_test('dokimio.pdf');
    await these_arxeia(apothiki, [arxeio], new Map([['dokimio.pdf', ftiaxe_pdf_xoris_keimeno()]]));

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    const selides = await diavase_keimeno(apothiki, arxeio.id);
    expect(selides).toHaveLength(1);
    expect(selides[0]?.keimeno).toBe('κείμενο από OCR');
    expect(selides[0]?.xoris_keimeno).toBe(false);
  });

  it('σελίδα με κείμενο δεν καλεί το OCR', async () => {
    const apothiki = new MnimiApothiki();
    const kliseis: string[] = [];
    const ocr = {
      anagnorise_pdf_selida: async () => {
        kliseis.push('OCR');
        return { ok: true, timi: 'κενό' };
      },
    } as OcrPyli;
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr);
    const arxeio = arxeio_test('dokimio.pdf');
    await these_arxeia(
      apothiki,
      [arxeio],
      new Map([['dokimio.pdf', ftiaxe_pdf('a list is a sequence of elements')]])
    );

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    expect(kliseis).toHaveLength(0);
  });

  it('αποτυχία OCR → σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    const ocr = {
      anagnorise_pdf_selida: async () => ({
        ok: false,
        sfalma: { kodikos: 'OCR_APOTYXIA', minima: 'Δεν αναγνωρίστηκε κείμενο' },
      }),
    } as unknown as OcrPyli;
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr);
    const arxeio = arxeio_test('dokimio.pdf');
    await these_arxeia(apothiki, [arxeio], new Map([['dokimio.pdf', ftiaxe_pdf_xoris_keimeno()]]));

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('OCR_APOTYXIA');
  });

  it('κενό κείμενο από OCR → xoris_keimeno', async () => {
    const apothiki = new MnimiApothiki();
    const ocr = {
      anagnorise_pdf_selida: async () => ({ ok: true, timi: '  ' }),
    } as OcrPyli;
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata(), ocr);
    const arxeio = arxeio_test('dokimio.pdf');
    await these_arxeia(apothiki, [arxeio], new Map([['dokimio.pdf', ftiaxe_pdf_xoris_keimeno()]]));

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    const selides = await diavase_keimeno(apothiki, arxeio.id);
    expect(selides[0]?.xoris_keimeno).toBe(true);
  });

  it('αποτυχία εγγραφής → σφάλμα, όχι ημιτελές αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    const arxeio = arxeio_test('dokimio.pdf');
    await grapse_json(apothiki, arxeio_eurethriou('M1'), [arxeio]);
    await apothiki.grapse_dyadiko(
      diadromi_arxeiou('M1', 'dokimio.pdf'),
      ftiaxe_pdf('a list is a sequence of elements')
    );
    apothiki.grapse_keimeno = async () => apotyxia('DIKTYO', 'Δεν γίνεται εγγραφή');
    const p = ftiaxe_eisodos(apothiki, new KatagrafiDiamnemata());

    const apotelesma = await exagogi(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    expect(await apothiki.yparxei(arxeio_keimenou('M1', arxeio.id))).toBe(false);
  });
});
