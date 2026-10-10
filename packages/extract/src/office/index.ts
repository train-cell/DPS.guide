import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import type { Selida } from '@dps/core';
import { MAGIKA_OLE2, MAGIKA_ZIP, arxizei_me, ftiaxe_selida } from '../koines.js';

/** Μοτίβο ονομάτων slides μέσα στο pptx (`ppt/slides/slideN.xml`). */
const MOTIBO_SLIDE = /^ppt\/slides\/slide(\d+)\.xml$/;

/** Κεντρικό έγγραφο ενός docx. */
const EGGRAPHO_DOCX = 'word/document.xml';

/** Μοτίβο επικεφαλίδας paragraph σε docx (`Heading1`/`heading1`..`Heading9`). */
const MOTIBO_EPIKEFALIDAS = /^heading(\d)$/i;

/** Ρυθμίσεις αναλυτή XML: κρατάμε attributes και κείμενο ως string. */
const XML_RYTHMISEIS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: true,
} as const;

const analutis = new XMLParser(XML_RYTHMISEIS);

interface KomvosXml {
  readonly [kleidi: string]: unknown;
}

/** Ευθύνη: ανιχνεύει αν ο κόμβος είναι αντικείμενο (όχι κείμενο/πίνακας). */
function einai_komvos(komvos: unknown): komvos is KomvosXml {
  return typeof komvos === 'object' && komvos !== null && !Array.isArray(komvos);
}

/** Κλειδί του κόμβου κειμένου όταν το στοιχείο φέρει attributes (π.χ. `xml:space`). */
const KLEIDI_KEIMENOU = '#text';

/**
 * Ευθύνη: συλλέγει in-order όλα τα κείμενα κάτω από την ετικέτα `etiketa`.
 *
 * Παραδείγματα: `a:t` στα slides, `w:t` στα docx. Τα attributes
 * (`@_...`) αγνοούνται, ώστε να μην ανακατεύουν τα κείμενα. Στοιχεία με
 * attributes (π.χ. `xml:space="preserve"`) αναλύονται σε `{ '#text': ... }`.
 */
function synekdose_keimenon(komvos: unknown, etiketa: string, apotelesma: string[]): void {
  if (Array.isArray(komvos)) {
    for (const stoixeio of komvos) {
      synekdose_keimenon(stoixeio, etiketa, apotelesma);
    }
    return;
  }
  if (!einai_komvos(komvos)) {
    return;
  }
  for (const [kleidi, timi] of Object.entries(komvos)) {
    if (kleidi.startsWith('@_')) {
      continue;
    }
    if (kleidi === etiketa) {
      if (typeof timi === 'string') {
        apotelesma.push(timi);
      } else if (einai_komvos(timi) && typeof timi[KLEIDI_KEIMENOU] === 'string') {
        apotelesma.push(timi[KLEIDI_KEIMENOU] as string);
      } else {
        synekdose_keimenon(timi, etiketa, apotelesma);
      }
      continue;
    }
    synekdose_keimenon(timi, etiketa, apotelesma);
  }
}

/** Ευθύνη: MI_YPOSTIRIZOMENO για παλιό OLE2 (.ppt), MI_EGKYRO_SXIMA για μη-zip. */
function tsekarose_magika(dedomena: Uint8Array): Apotelesma<never> | null {
  if (arxizei_me(dedomena, MAGIKA_OLE2)) {
    return apotyxia(
      'MI_YPOSTIRIZOMENO',
      'Το παλιό δυαδικό .ppt (OLE2) δεν υποστηρίζεται· μόνο .pptx'
    );
  }
  if (!arxizei_me(dedomena, MAGIKA_ZIP)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το αρχείο δεν είναι zip (κακή υπογραφή PK)');
  }
  return null;
}

/** Ευθύνη: ανοίγει το zip ή επιστρέφει σφάλμα, ποτέ exception. */
async function anoixe_zip(dedomena: Uint8Array): Promise<Apotelesma<JSZip>> {
  try {
    return ok(await JSZip.loadAsync(dedomena));
  } catch (aitia) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το αρχείο δεν είναι έγκυρο zip· πιθανόν κατεστραμμένο', aitia);
  }
}

/** Ευθύνη: ονόματα slides ταξινομημένα αριθμητικά (slide10 μετά το slide9). */
function slides_taxinomimena(zip: JSZip): Apotelesma<string[]> {
  const arithmoi: { arithmos: number; onoma: string }[] = [];
  for (const onoma of Object.keys(zip.files)) {
    const tairiasma = MOTIBO_SLIDE.exec(onoma);
    if (tairiasma?.[1] !== undefined) {
      arithmoi.push({ arithmos: Number(tairiasma[1]), onoma });
    }
  }
  if (arithmoi.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το pptx δεν περιέχει κανένα slide (ppt/slides/slideN.xml)');
  }
  arithmoi.sort((a, b) => a.arithmos - b.arithmos);
  return ok(arithmoi.map((s) => s.onoma));
}

/** Ευθύνη: διαβάζει τις παραγράφους του `w:body` με το επίπεδο επικεφαλίδας κάθε μίας. */
function diavase_paragraphous(eggrafo: unknown): { epikefalida: number | null; keimeno: string }[] {
  const riza = einai_komvos(eggrafo) ? ((eggrafo as KomvosXml)['w:document'] as unknown) : undefined;
  const soma = einai_komvos(riza) ? ((riza as KomvosXml)['w:body'] as unknown) : undefined;
  const paragr = einai_komvos(soma) ? ((soma as KomvosXml)['w:p'] as unknown) : undefined;

  const lista: unknown[] = Array.isArray(paragr)
    ? [...paragr]
    : paragr === undefined
      ? []
      : [paragr];

  const parags: { epikefalida: number | null; keimeno: string }[] = [];
  for (const p of lista) {
    if (!einai_komvos(p)) {
      continue;
    }
    const pPr = (p as KomvosXml)['w:pPr'];
    const pStyle = einai_komvos(pPr) ? ((pPr as KomvosXml)['w:pStyle'] as unknown) : undefined;
    const timi = einai_komvos(pStyle) ? ((pStyle as KomvosXml)['@_w:val'] as unknown) : undefined;
    const tairiasma = typeof timi === 'string' ? MOTIBO_EPIKEFALIDAS.exec(timi) : null;
    const keimena: string[] = [];
    synekdose_keimenon(p, 'w:t', keimena);
    parags.push({
      epikefalida: tairiasma?.[1] === undefined ? null : Number(tairiasma[1]),
      keimeno: keimena.join(' '),
    });
  }
  return parags;
}

/**
 * Εξάγει τις διαφάνειες ενός PPTX σε `Selida[]` (L06).
 *
 * Κάθε `ppt/slides/slideN.xml` γίνεται μία σελίδα με αρίθμηση 1..N. Το κείμενο
 * προέρχεται από τα runs `<a:t>` με τη σειρά του εγγράφου. Ποτέ exception:
 * παλιό `.ppt` → `MI_YPOSTIRIZOMENO`, μη-zip/κατεστραμμένο/χωρίς slides →
 * `MI_EGKYRO_SXIMA`.
 */
export async function exagage_pptx(
  dedomena: Uint8Array,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  const magika = tsekarose_magika(dedomena);
  if (magika !== null) {
    return magika;
  }
  const fortosi = await anoixe_zip(dedomena);
  if (!fortosi.ok) {
    return fortosi;
  }
  const slides = slides_taxinomimena(fortosi.timi);
  if (!slides.ok) {
    return slides;
  }

  const selides: Selida[] = [];
  for (let i = 0; i < slides.timi.length; i += 1) {
    const onoma = slides.timi[i] ?? '';
    const arxeio = fortosi.timi.file(onoma);
    if (arxeio === null) {
      return apotyxia('MI_EGKYRO_SXIMA', `Λείπει το slide ${onoma} από το pptx`);
    }
    const keimena: string[] = [];
    synekdose_keimenon(analutis.parse(await arxeio.async('string')), 'a:t', keimena);
    selides.push(ftiaxe_selida(arxeio_id, i + 1, keimena.join('\n')));
  }
  return ok(selides);
}

/**
 * Εξάγει τις ενότητες ενός DOCX σε `Selida[]` (L06).
 *
 * Το `word/document.xml` σπάρεται σε σελίδες σε κάθε επικεφαλίδα
 * (`Heading1`..`Heading9`): η επικεφαλίδα και το κείμενο μέχρι την επόμενη
 * επικεφαλίδα αποτελούν μία `Selida`, με διατηρημένη σειρά. Ποτέ exception.
 */
export async function exagage_docx(
  dedomena: Uint8Array,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  const magika = tsekarose_magika(dedomena);
  if (magika !== null) {
    return magika;
  }
  const fortosi = await anoixe_zip(dedomena);
  if (!fortosi.ok) {
    return fortosi;
  }
  const eggrafo = fortosi.timi.file(EGGRAPHO_DOCX);
  if (eggrafo === null) {
    return apotyxia('MI_EGKYRO_SXIMA', `Λείπει το ${EGGRAPHO_DOCX} από το docx`);
  }

  let eggrafos: unknown;
  try {
    eggrafos = analutis.parse(await eggrafo.async('string'));
  } catch (aitia) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το ${EGGRAPHO_DOCX} δεν είναι έγκυρο XML`, aitia);
  }

  const parags = diavase_paragraphous(eggrafos);
  if (parags.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το docx δεν περιέχει παραγράφους');
  }

  const selides: Selida[] = [];
  let trexon: string[] = [];
  for (const parag of parags) {
    if (parag.epikefalida !== null && trexon.length > 0) {
      selides.push(ftiaxe_selida(arxeio_id, selides.length + 1, trexon.join('\n')));
      trexon = [];
    }
    trexon.push(parag.keimeno);
  }
  if (trexon.length > 0) {
    selides.push(ftiaxe_selida(arxeio_id, selides.length + 1, trexon.join('\n')));
  }
  return ok(selides);
}
