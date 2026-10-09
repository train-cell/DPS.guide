import { describe, it, expect } from 'vitest';
import type { Apotelesma, Selida } from '@dps/core';
import { ELAXISTES_LEKSEIS_SELIDAS, SelidaSchema } from '@dps/core';
import { exagage_docx, exagage_pptx } from '../src/office/index.js';

const ARXEIO_ID = 'arx-office-probe';
const ENCODERS = new TextEncoder();
const OLE_MAGIKO = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;
const DOS_TIME = 0;
const FLAG_UTF8 = 0x0800;

const CRC_PINAKAS = (() => {
  const pinakas = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) === 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    pinakas[n] = c >>> 0;
  }
  return pinakas;
})();

function crc32(dedomena: Uint32Array | Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < dedomena.length; i++) {
    const v = dedomena[i] ?? 0;
    crc = (CRC_PINAKAS[(crc ^ v) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function grafe_u16(target: Uint8Array, theseis: number, timi: number): void {
  target[theseis] = timi & 0xff;
  target[theseis + 1] = (timi >>> 8) & 0xff;
}

function grafe_u32(target: Uint8Array, theseis: number, timi: number): void {
  target[theseis] = timi & 0xff;
  target[theseis + 1] = (timi >>> 8) & 0xff;
  target[theseis + 2] = (timi >>> 16) & 0xff;
  target[theseis + 3] = (timi >>> 24) & 0xff;
}

interface EisodosZip {
  readonly onoma: string;
  readonly dedomena: Uint8Array;
}

function store_zip(eisodoi: ReadonlyArray<EisodosZip>): Uint8Array {
  const topika: Uint8Array[] = [];
  const kentrika: Uint8Array[] = [];
  let offset = 0;

  for (const eisodos of eisodoi) {
    const onoma = ENCODERS.encode(eisodos.onoma);
    const dedomena = eisodos.dedomena;
    const anathesi = crc32(dedomena);

    const kefalida = new Uint8Array(30 + onoma.length + dedomena.length);
    grafe_u32(kefalida, 0, 0x04034b50);
    grafe_u16(kefalida, 4, 20);
    grafe_u16(kefalida, 6, FLAG_UTF8);
    grafe_u16(kefalida, 8, 0);
    grafe_u16(kefalida, 10, DOS_TIME);
    grafe_u16(kefalida, 12, DOS_DATE);
    grafe_u32(kefalida, 14, anathesi);
    grafe_u32(kefalida, 18, dedomena.length);
    grafe_u32(kefalida, 22, dedomena.length);
    grafe_u16(kefalida, 26, onoma.length);
    grafe_u16(kefalida, 28, 0);
    kefalida.set(onoma, 30);
    kefalida.set(dedomena, 30 + onoma.length);
    topika.push(kefalida);

    const kentriko = new Uint8Array(46 + onoma.length);
    grafe_u32(kentriko, 0, 0x02014b50);
    grafe_u16(kentriko, 4, 20);
    grafe_u16(kentriko, 6, 20);
    grafe_u16(kentriko, 8, FLAG_UTF8);
    grafe_u16(kentriko, 10, 0);
    grafe_u16(kentriko, 12, DOS_TIME);
    grafe_u16(kentriko, 14, DOS_DATE);
    grafe_u32(kentriko, 16, anathesi);
    grafe_u32(kentriko, 20, dedomena.length);
    grafe_u32(kentriko, 24, dedomena.length);
    grafe_u16(kentriko, 28, onoma.length);
    grafe_u16(kentriko, 30, 0);
    grafe_u16(kentriko, 32, 0);
    grafe_u16(kentriko, 34, 0);
    grafe_u16(kentriko, 36, 0);
    grafe_u32(kentriko, 42, offset);
    kentriko.set(onoma, 46);
    kentrika.push(kentriko);

    offset += kefalida.length;
  }

  const megethos_kentrikou = kentrika.reduce((synolo, tmima) => synolo + tmima.length, 0);
  const telos = new Uint8Array(22);
  grafe_u32(telos, 0, 0x06054b50);
  grafe_u16(telos, 8, eisodoi.length);
  grafe_u16(telos, 10, eisodoi.length);
  grafe_u32(telos, 12, megethos_kentrikou);
  grafe_u32(telos, 16, offset);

  const ola = [...topika, ...kentrika, telos];
  const synolo = ola.reduce((athroisma, tmima) => athroisma + tmima.length, 0);
  const apotelesma = new Uint8Array(synolo);
  let theseis = 0;
  for (const tmima of ola) {
    apotelesma.set(tmima, theseis);
    theseis += tmima.length;
  }
  return apotelesma;
}

function slide_xml(keimeno: string | null): Uint8Array {
  const kefalidaS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
    '<p:cSld><p:spTree><p:sp><p:txBody>';
  const somaV =
    keimeno === null ? '<a:p/>' : '<a:p><a:r><a:t>' + keimeno + '</a:t></a:r></a:p>';
  const telosS = '</p:txBody></p:sp></p:spTree></p:cSld></p:sld>';
  return ENCODERS.encode(kefalidaS + somaV + telosS);
}

interface ParagraphosDocx {
  readonly kefalida: number | null;
  readonly keimeno: string;
}

function keimeno_paragraphou(p: ParagraphosDocx): string {
  const run = '<w:r><w:t>' + p.keimeno + '</w:t></w:r>';
  if (p.kefalida === null) {
    return '<w:p>' + run + '</w:p>';
  }
  const prokirixi = '<w:pPr><w:pStyle w:val="Heading' + p.kefalida + '"/></w:pPr>';
  return '<w:p>' + prokirixi + run + '</w:p>';
}

function document_xml(paragraphoi: ReadonlyArray<ParagraphosDocx>): Uint8Array {
  const kefalidaS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>';
  const telosS = '</w:body></w:document>';
  return ENCODERS.encode(kefalidaS + paragraphoi.map(keimeno_paragraphou).join('') + telosS);
}

function styles_xml(): Uint8Array {
  return ENCODERS.encode(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/></w:style>' +
      '</w:styles>'
  );
}

function docx_zip(paragraphoi: ReadonlyArray<ParagraphosDocx>): Uint8Array {
  return store_zip([
    {
      onoma: '[Content_Types].xml',
      dedomena: ENCODERS.encode('<?xml version="1.0" encoding="UTF-8"?><Types/>'),
    },
    { onoma: 'word/document.xml', dedomena: document_xml(paragraphoi) },
    { onoma: 'word/styles.xml', dedomena: styles_xml() },
  ]);
}

const SEIRA_ANAKATEV = [1, 5, 2, 11, 3, 12, 4, 9, 6, 10, 7, 8];
const PPTX_12 = store_zip(
  SEIRA_ANAKATEV.map((i) => ({
    onoma: 'ppt/slides/slide' + i + '.xml',
    dedomena: slide_xml('Διαφάνεια ' + i + ' με αρκετές λέξεις εδώ'),
  }))
);

const GLOSSA = 'Καλημέρα κόσμε με ελληνικά κείμενα εδώ';
const PPTX_GLOSSA = store_zip([
  { onoma: 'ppt/slides/slide1.xml', dedomena: slide_xml(GLOSSA) },
]);

const PPTX_KENO = store_zip([{ onoma: 'ppt/slides/slide1.xml', dedomena: slide_xml(null) }]);

const PPT_OLE2 = (() => {
  const bytes = new Uint8Array(512);
  bytes.set(OLE_MAGIKO, 0);
  return bytes;
})();

const AKYRO = ENCODERS.encode('αυτό δεν είναι αρχείο zip καθόλου ' + 'x'.repeat(96));

const PARAGRAPHOI_DOCX: ReadonlyArray<ParagraphosDocx> = [
  { kefalida: 1, keimeno: 'Άλγεβρα' },
  { keimeno: 'Η άλγεβρα Boole μελετά πύλες και λογική.' },
  { kefalida: 2, keimeno: 'Θεωρία Boolean' },
  { keimeno: 'Οι πίνακες αληθείας περιγράφουν συναρτήσεις.' },
  { kefalida: 3, keimeno: 'Παραδείγματα' },
  { keimeno: 'Τα παραδείγματα δείχνουν απλούς υπολογισμούς.' },
];
const DOCX = docx_zip(PARAGRAPHOI_DOCX);

function elenxe_sxima(selides: ReadonlyArray<Selida>): void {
  for (const selida of selides) {
    expect(SelidaSchema.safeParse(selida).success).toBe(true);
    expect(selida.arxeio_id).toBe(ARXEIO_ID);
  }
}

describe('L06 office extraction', () => {
  it('σειρά slides 1..12 με αριθμητική ταξινόμηση (slide10 μετά το slide9)', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_pptx(PPTX_12, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    const selides = apotelesma.timi;
    expect(selides).toHaveLength(12);
    expect(selides.map((s) => s.arithmos)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (let k = 1; k <= 12; k++) {
      const selida = selides[k - 1];
      if (!selida) {
        throw new Error('λείπει η σελίδα με αριθμό ' + k);
      }
      expect(selida.arithmos).toBe(k);
      const vlema = ('Διαφάνεια ' + k + ' ').normalize('NFC');
      expect(selida.keimeno.normalize('NFC')).toContain(vlema);
    }
    elenxe_sxima(selides);
  });

  it('ελληνικά με τόνους διατηρούνται με NFC κανονικοποίηση', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_pptx(PPTX_GLOSSA, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    const selida = apotelesma.timi[0];
    if (!selida) {
      throw new Error('λείπει η σελίδα');
    }
    expect(selida.keimeno).toContain('\u03cc');
    expect(selida.keimeno).not.toContain('\u0301');
    expect(selida.keimeno.normalize('NFC')).toBe(GLOSSA.normalize('NFC'));
    expect(selida.xoris_keimeno).toBe(false);
    expect(selida.lekseis).toBeGreaterThanOrEqual(ELAXISTES_LEKSEIS_SELIDAS);
  });

  it('κενό slide → κενό keimeno με xoris_keimeno', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_pptx(PPTX_KENO, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toHaveLength(1);
    const selida = apotelesma.timi[0];
    if (!selida) {
      throw new Error('λείπει η σελίδα');
    }
    expect(selida.arithmos).toBe(1);
    expect(selida.keimeno).toBe('');
    expect(selida.lekseis).toBeLessThan(ELAXISTES_LEKSEIS_SELIDAS);
    expect(selida.xoris_keimeno).toBe(true);
    elenxe_sxima([selida]);
  });

  it('άκυρο zip → Apotelesma σφάλματος, χωρίς throw και χωρίς ψεύτικα δεδομένα', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_pptx(AKYRO, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima.length).toBeGreaterThan(0);
    expect('timi' in apotelesma).toBe(false);
  });

  it('.ppt παλιό δυαδικό (OLE2) → μη υποστηριζόμενο', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_pptx(PPT_OLE2, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('exagage_docx: σελίδες ανά επικεφαλίδα με διατηρημένη σειρά κειμένου', async () => {
    const apotelesma: Apotelesma<Selida[]> = await exagage_docx(DOCX, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    const selides = apotelesma.timi;
    expect(selides.map((s) => s.arithmos)).toEqual([1, 2, 3]);
    const simasia = ['πύλες', 'πίνακες', 'παραδείγματα'].map((s) => s.normalize('NFC'));
    const [pyles, pinakes, paradeigmata] = simasia;
    for (let i = 0; i < simasia.length; i++) {
      const selida = selides[i];
      if (!selida) {
        throw new Error('λείπει η ενότητα ' + i);
      }
      expect(selida.keimeno.normalize('NFC')).toContain(simasia[i]);
    }
    const proto = selides[0];
    const deutero = selides[1];
    if (!proto || !deutero) {
      throw new Error('λείπει ενότητα');
    }
    expect(proto.keimeno.normalize('NFC')).not.toContain(pinakes ?? '');
    expect(proto.keimeno.normalize('NFC')).not.toContain(paradeigmata ?? '');
    expect(deutero.keimeno.normalize('NFC')).not.toContain(pyles ?? '');
    elenxe_sxima(selides);
  });

  it('ντετερμινισμός: ίδια bytes → ίδιο Selida[]', async () => {
    const pptxA = await exagage_pptx(PPTX_12, ARXEIO_ID);
    const pptxB = await exagage_pptx(PPTX_12, ARXEIO_ID);
    expect(pptxA).toEqual(pptxB);
    expect(pptxA.ok).toBe(true);

    const docxA = await exagage_docx(DOCX, ARXEIO_ID);
    const docxB = await exagage_docx(DOCX, ARXEIO_ID);
    expect(docxA).toEqual(docxB);
  });
});
