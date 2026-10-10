import { deflateSync } from 'node:zlib';
import { describe, it, expect } from 'vitest';
import type { Selida } from '@dps/core';
import { ELAXISTES_LEKSEIS_SELIDAS } from '@dps/core';
import { exagage_pdf } from '../src/pdf/index.js';

const ARXEIO_ID = 'arx-pdf-probe';
const ENCODERS = new TextEncoder();

const LEIMES_P1 = 'Οι δομές δεδομένων ταξινομούν στοιχεία κατά αύξουσα σειρά.';
const LEIMES_P3 = 'Η ανάζηση δυαδικού δέντρου χρειάζεται αν ζητηθεί άμεση πρόσβαση.';

const LEKSEIS_P1 = LEIMES_P1.split(' ').length;
const LEKSEIS_P3 = LEIMES_P3.split(' ').length;
const LEKSEIS_KENIS = 0;

const SELIDES_TRIA: readonly string[] = [LEIMES_P1, '', LEIMES_P3];
const SELIDES_KENI: readonly string[] = [LEIMES_P1, ''];

const ARITHMOS_PROTIS_SELIDAS = 7;
const XREF_GENIKO_ANATHEORISI = 65535;
const XREF_THEISI_GENIKOU = 0;
/** Πλάτος MediaBox αρκετό για δοκιμαστικές γραμμές χωρίς αποκοπή γλύφοιων. */
const PLATOS_SELIDAS = 2000;

function utf16be_deiktes(keimeno: string): string {
  let hex = '';
  for (let i = 0; i < keimeno.length; i++) {
    hex += keimeno.charCodeAt(i).toString(16).padStart(4, '0');
  }
  return hex;
}

function cmap_tounicode(kwdikes: readonly number[]): string {
  const grammes = kwdikes.map(
    (k) => `<${k.toString(16).padStart(4, '0')}> <${k.toString(16).padStart(4, '0')}>`
  );
  const omades: string[] = [];
  for (let i = 0; i < grammes.length; i += 100) {
    const meros = grammes.slice(i, i + 100);
    omades.push(`${meros.length} beginbfchar\n${meros.join('\n')}\nendbfchar`);
  }
  return [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
    ...omades,
    'endcmap',
    'CMapName currentdict /CMap defineresource pop',
    'end',
    'end',
    '',
  ].join('\n');
}

function utf8(keimeno: string): Uint8Array {
  return ENCODERS.encode(keimeno);
}

function reuma(lexiko: string, dedomena: Uint8Array): Uint8Array {
  const kephalida = utf8(`<< ${lexiko} /Length ${dedomena.length} >>\nstream\n`);
  const telos = utf8('\nendstream');
  const apotelesma = new Uint8Array(kephalida.length + dedomena.length + telos.length);
  apotelesma.set(kephalida, 0);
  apotelesma.set(dedomena, kephalida.length);
  apotelesma.set(telos, kephalida.length + dedomena.length);
  return apotelesma;
}

/**
 * Συνθέτει ένα έγκυρο, ντετερμινιστικό PDF με ένα κείμενο ανά σελίδα.
 *
 * Χρησιμοποιεί μόνο node built-ins (`zlib.deflateSync`) και ελάχιστη δομή PDF
 * (catalog, pages, content streams FlateDecode, Type0/Identity-H font με
 * `/ToUnicode` CMap ώστε τα ελληνικά να ανακτώνται χωρίς ενσωματωμένη γραμματοσειρά,
 * xref/trailer). Δεν διαβάζει τίποτα από δίσκο.
 *
 * Το MediaBox είναι στενά ορατό (612 πόντους): το pdfjs κόβει τα γλύφοι που
 * πέφτουν έξω από το όριο της σελίδας, οπότε για δοκιμαστικές γραμμές άνω των
 * ~45 χαρακτήρων η σελίδα πρέπει να είναι αρκετά πλατιά, αλλιώς χάνεται το
 * τέλος του κειμένου.
 */
function ftiaxe_pdf(selides: readonly string[]): Uint8Array {
  const arithmos_font = 3;
  const arithmos_apogonou = 4;
  const arithmos_perigrafis = 5;
  const arithmos_tounicode = 6;

  const kwdikes = new Set<number>();
  for (const selida of selides) {
    for (let i = 0; i < selida.length; i++) {
      kwdikes.add(selida.charCodeAt(i));
    }
  }
  const kwdikes_taxinomimenoi = [...kwdikes].sort((a, b) => a - b);

  const paidika = selides.map((_, j) => `${ARITHMOS_PROTIS_SELIDAS + j * 2} 0 R`).join(' ');
  const somata: Uint8Array[] = [];
  somata[0] = utf8('<< /Type /Catalog /Pages 2 0 R >>');
  somata[1] = utf8(`<< /Type /Pages /Kids [${paidika}] /Count ${selides.length} >>`);
  somata[2] = utf8(
    `<< /Type /Font /Subtype /Type0 /BaseFont /NotoSans /Encoding /Identity-H ` +
      `/DescendantFonts [${arithmos_apogonou} 0 R] /ToUnicode ${arithmos_tounicode} 0 R >>`
  );
  somata[3] = utf8(
    `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /NotoSans ` +
      '/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> ' +
      `/FontDescriptor ${arithmos_perigrafis} 0 R /DW 1000 >>`
  );
  somata[4] = utf8(
    '<< /Type /FontDescriptor /FontName /NotoSans /Flags 4 /FontBBox [0 -200 1000 900] ' +
      '/ItalicAngle 0 /Ascent 900 /Descent -200 /CapHeight 700 /StemV 80 >>'
  );
  somata[5] = reuma('', utf8(cmap_tounicode(kwdikes_taxinomimenoi)));

  for (let j = 0; j < selides.length; j++) {
    const keimeno = selides[j] ?? '';
    const leitourgia =
      keimeno.length === 0
        ? ''
        : `BT /F1 12 Tf 72 720 Td <${utf16be_deiktes(keimeno)}> Tj ET`;
    const arithmos_periexomenou = ARITHMOS_PROTIS_SELIDAS + j * 2 + 1;
    somata[ARITHMOS_PROTIS_SELIDAS + j * 2 - 1] = utf8(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PLATOS_SELIDAS} 792] ` +
        `/Resources << /Font << /F1 ${arithmos_font} 0 R >> >> ` +
        `/Contents ${arithmos_periexomenou} 0 R >>`
    );
    somata[arithmos_periexomenou - 1] = reuma('/Filter /FlateDecode', new Uint8Array(deflateSync(utf8(leitourgia))));
  }

  const kommatia: Uint8Array[] = [];
  const kephalida = utf8('%PDF-1.7\n');
  const ypografi = Uint8Array.from([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]);
  kommatia.push(kephalida, ypografi);
  let offset = kephalida.length + ypografi.length;

  const theseis: number[] = [];
  for (let n = 0; n < somata.length; n++) {
    theseis.push(offset);
    const arxi = utf8(`${n + 1} 0 obj\n`);
    const telos = utf8('\nendobj\n');
    const soma = somata[n] ?? new Uint8Array(0);
    kommatia.push(arxi, soma, telos);
    offset += arxi.length + soma.length + telos.length;
  }

  const thesi_xref = offset;
  let xref = `xref\n0 ${somata.length + 1}\n`;
  xref += `${String(XREF_THEISI_GENIKOU).padStart(10, '0')} ${XREF_GENIKO_ANATHEORISI} f \n`;
  for (const thesi of theseis) {
    xref += `${String(thesi).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${somata.length + 1} /Root 1 0 R >>\nstartxref\n${thesi_xref}\n%%EOF\n`;
  kommatia.push(utf8(xref));

  const synolo = kommatia.reduce((athroisma, tmima) => athroisma + tmima.length, 0);
  const apotelesma = new Uint8Array(synolo);
  let theseis_eggrafis = 0;
  for (const tmima of kommatia) {
    apotelesma.set(tmima, theseis_eggrafis);
    theseis_eggrafis += tmima.length;
  }
  return apotelesma;
}

const PDF_TRIA = ftiaxe_pdf(SELIDES_TRIA);
const PDF_KENI = ftiaxe_pdf(SELIDES_KENI);

function kelides(res: Awaited<ReturnType<typeof exagage_pdf>>): Selida[] {
  if (!res.ok) {
    throw new Error(`Η εξαγωγή απέτυχε: ${res.sfalma.kodikos} ${res.sfalma.minima}`);
  }
  return res.timi;
}

describe('exagage_pdf (L05)', () => {
  it('επιστρέφει μία Selida ανά σελίδα, με αρίθμηση 1..N και το ίδιο arxeio_id', async () => {
    const res = await exagage_pdf(PDF_TRIA, ARXEIO_ID);

    const selides = kelides(res);
    expect(selides.length).toBe(3);
    expect(selides.map((s) => s.arithmos)).toEqual([1, 2, 3]);
    expect(selides.every((s) => s.arxeio_id === ARXEIO_ID)).toBe(true);
  });

  it('διατηρεί τα ελληνικά με τόνους και τα φέρνει σε κανονική μορφή NFC', async () => {
    const selides = kelides(await exagage_pdf(PDF_TRIA, ARXEIO_ID));

    expect(selides[0]?.keimeno).toContain(LEIMES_P1);
    expect(selides[2]?.keimeno).toContain(LEIMES_P3);
    expect(selides[0]?.keimeno).toBe(selides[0]?.keimeno.normalize('NFC'));
    for (const s of selides) {
      expect(s.keimeno).not.toMatch(/[\uFFFD]/);
    }
  });

  it('χαρακτηρίζει σωστά το πλήθος λέξεων κάθε σελίδας', async () => {
    const selides = kelides(await exagage_pdf(PDF_TRIA, ARXEIO_ID));

    expect(selides[0]?.lekseis).toBe(LEKSEIS_P1);
    expect(selides[1]?.lekseis).toBe(LEKSEIS_KENIS);
    expect(selides[2]?.lekseis).toBe(LEKSEIS_P3);
    for (const s of selides) {
      const lekesis_ariste = s.keimeno.length === 0 ? LEKSEIS_KENIS : s.keimeno.split(' ').length;
      expect(s.lekseis).toBe(lekesis_ariste);
      expect(s.lekseis).toBeGreaterThanOrEqual(0);
    }
  });

  it('σημειώνει ως xoris_keimeno τη σελίδα με λιγότερες από ELAXISTES_LEKSEIS_SELIDAS λέξεις', async () => {
    const selides = kelides(await exagage_pdf(PDF_KENI, ARXEIO_ID));

    const keni = selides.find((s) => s.arithmos === 2);
    expect(keni).toBeDefined();
    expect(keni?.lekseis).toBeLessThan(ELAXISTES_LEKSEIS_SELIDAS);
    expect(keni?.xoris_keimeno).toBe(true);

    const pliris = selides.find((s) => s.arithmos === 1);
    expect(pliris?.lekseis).toBeGreaterThanOrEqual(ELAXISTES_LEKSEIS_SELIDAS);
    expect(pliris?.xoris_keimeno).toBe(false);
  });

  it('επιστρέφει σφάλμα, όχι exception, σε κατεστραμμένο αρχείο', async () => {
    const katasmmeno = Uint8Array.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, 0x00, 0xff,
      0xfe, 0x99,
    ]);

    const res = await exagage_pdf(katasmmeno, ARXEIO_ID);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima.length).toBeGreaterThan(0);
    }
  });

  it('είναι ντετερμινιστική: ίδια είσοδος → ίδια ακριβώς έξοδος', async () => {
    const prwto = kelides(await exagage_pdf(PDF_TRIA, ARXEIO_ID));
    const deftero = kelides(await exagage_pdf(PDF_TRIA, ARXEIO_ID));

    expect(deftero).toEqual(prwto);
  });

  it('κόβει τις λέξεις στο τέλος γραμμής και συμπιέζει τα κενά (υφολισμός, NFC, whitespace)', async () => {
    const selides = kelides(await exagage_pdf(PDF_KENI, ARXEIO_ID));

    for (const s of selides) {
      expect(s.keimeno).not.toMatch(/\s\s/);
      expect(s.keimeno).toBe(s.keimeno.trim());
      expect(s.keimeno).toBe(s.keimeno.normalize('NFC'));
    }
  });
});
