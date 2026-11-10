import { describe, expect, it, vi } from 'vitest';
import type { Apotelesma, Selida } from '@dps/core';
import { exagage_docx, exagage_pptx } from '../src/office/index.js';
import { ENCODERS, store_zip } from './office.test.js';

const ARXEIO_ID = 'arx-office-branch';

function p_tou(keimeno: string): string {
  return `<w:p><w:r><w:t>${keimeno}</w:t></w:r></w:p>`;
}

function docx(body: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    body +
    '</w:body></w:document>'
  );
}

/** `w:p` χωρίς `<w:pPr>` (κενός τρόπος επικεφαλίδας). */
const DOCX_NO_PSTYLE = docx(p_tou('Πρώτη γραμμή') + p_tou('Δεύτερη γραμμή'));

/** `w:p` που δεν είναι κόμβος (κείμενο) — παραλείπεται στο L127. */
const DOCX_P_TEXT = docx('<w:p>Πρώτη</w:p><w:p>Δεύτερη</w:p>');

/** `w:body` κενό — η `<w:p>` λείπει τελείως. */
const DOCX_NO_P = docx('');

/** `w:document` κείμενο (root level) — `riza` δεν είναι κόμβος (L116 false). */
const DOCX_DOCUMENT_STRING = docx('α');

/** `<w:body>` κείμενο — η `<w:p>` δεν είναι κόμβος (L117 false). */
const DOCX_BODY_TEXT = docx('α');

/** `<w:document>` απουσιολογία: η `riza` είναι `undefined` (L116 false). */
const DOCX_RIZA_LYPEI = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:body xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">α</w:body>';

/** `<w:t>` `{ '#text': ... }` — L61 false, L63 true. */
const DOCX_T_NESTED = docx(p_tou('Π').replace('<w:t>', '<w:t xml:space="preserve">'));

/** `<w:t>` μόνο attributes — `{ '@_xml:space': 'preserve' }` (L61 false, L63 false). */
const DOCX_T_ATTRS_ONLY = docx(p_tou('Π').replace('<w:t>Π</w:t>', '<w:t xml:space="preserve"></w:t>'));

/** `<w:p>` attributes — `pPr` δεν υπάρχει (L131 false). */
const DOCX_P_ATTRS = docx(p_tou('Π').replace('<w:p>', '<w:p w:id="1">'));

/** `<a:t>` `{ '#text': ... }` — L61 false, L63 true. */
function slide_xml(keimeno: string, runs: number): string {
  const r = Array.from({ length: runs }, () => `<a:r><a:t xml:space="preserve">${keimeno}</a:t></a:r>`).join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<p:cSld><p:spTree><p:sp><p:txBody><a:p>' +
    r +
    '</a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>'
  );
}

/** Δύο `<a:r>` → το `a:r` γίνεται array (L47 true). */
const PPTX_RICH = store_zip([
  { onoma: 'ppt/slides/slide1.xml', dedomena: ENCODERS.encode(slide_xml('Α', 2)) },
]);

/** `<a:t>` `{ '#text': ... }` — L61 false, L63 true. */
const PPTX_T_NESTED = store_zip([
  { onoma: 'ppt/slides/slide1.xml', dedomena: ENCODERS.encode(slide_xml('Α', 1)) },
]);

/** `<a:t>` μόνο attributes → αναδρομή (L61 false, L63 false). */
const PPTX_T_ATTRS_ONLY = store_zip([
  {
    onoma: 'ppt/slides/slide1.xml',
    dedomena: ENCODERS.encode(slide_xml('Α', 1).replace('<a:t xml:space="preserve">Α</a:t>', '<a:t xml:space="preserve"></a:t>')),
  },
]);

/** `pptx` χωρίς slides. */
const PPTX_NO_SLIDES = store_zip([
  { onoma: 'word/document.xml', dedomena: ENCODERS.encode('<doc/>') },
]);

/** `pptx` με άλλα ονόματα αρχείων. */
const PPTX_OTHER_NAMES = store_zip([
  { onoma: 'ppt/slides/_rels/slide1.xml.rels', dedomena: ENCODERS.encode('<rels/>') },
  { onoma: 'word/document.xml', dedomena: ENCODERS.encode('<doc/>') },
]);

/** Μη zip και παλιό δυαδικό .ppt (OLE2) — για το `magika !== null` (L195). */
const AKYRO = ENCODERS.encode('αυτό δεν είναι αρχείο zip καθόλου ' + 'x'.repeat(96));
const PPT_OLE2 = (() => {
  const bytes = new Uint8Array(512);
  bytes.set(Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), 0);
  return bytes;
})();

/** Κατεστραμμένο zip (PK header αλλά χωρίς ουσιαστικά δεδομένα). */
const ZIP_CORRUPT = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]);

/** `docx` χωρίς `w:document` στο zip. */
const DOCX_NO_DOCUMENT_XML = store_zip([
  { onoma: 'word/styles.xml', dedomena: ENCODERS.encode('<styles/>') },
]);

/** `docx` με άκυρο XML. */
const DOCX_INVALID_XML = store_zip([
  {
    onoma: 'word/document.xml',
    dedomena: ENCODERS.encode('<w:document xmlns:w="x"><w:body><!--'),
  },
]);

describe('L06 office — κλάδοι διαφύλαξης (branch coverage)', () => {
  it('w:p χωρίς w:pPr → κενή επικεφαλίδα (L131/L133 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_NO_PSTYLE) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toHaveLength(1);
    expect(apotelesma.timi[0]?.keimeno).toBe('Πρώτη γραμμή Δεύτερη γραμμή');
  });

  it('w:p κείμενο (όχι κόμβος) → παραλείπεται, αποτυχία (L127 true)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_P_TEXT) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('w:body κενό → κανένας κλάδος (L121 true)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_NO_P) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('w:document κείμενο → το σώμα δεν είναι κόμβος (L116 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_DOCUMENT_STRING) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('w:body κείμενο → η w:p δεν είναι κόμβος (L117 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_BODY_TEXT) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('w:t { #text } → L63 true (L61 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_T_NESTED) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi[0]?.keimeno).toBe('Π');
  });

  it('w:t attributes μόνο → αναδρομή (L61 false, L63 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_T_ATTRS_ONLY) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi[0]?.keimeno).toBe('');
  });

  it('pptx χωρίς slide → MI_EGKYRO_SXIMA (L106 true)', async () => {
    const apotelesma = await exagage_pptx(PPTX_NO_SLIDES, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('pptx με άλλα ονόματα αρχείων → MI_EGKYRO_SXIMA (L102 false)', async () => {
    const apotelesma = await exagage_pptx(PPTX_OTHER_NAMES, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('pptx με δύο a:r → a:r array (L47 true)', async () => {
    const apotelesma = await exagage_pptx(PPTX_RICH, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toHaveLength(1);
    expect(apotelesma.timi[0]?.keimeno).toBe('Α Α');
  });

  it('pptx a:t { #text } → L61 false, L63 true', async () => {
    const apotelesma = await exagage_pptx(PPTX_T_NESTED, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toHaveLength(1);
    expect(apotelesma.timi[0]?.keimeno).toBe('Α');
  });

  it('pptx a:t attributes μόνο → αναδρομή (L61 false, L63 false)', async () => {
    const apotelesma = await exagage_pptx(PPTX_T_ATTRS_ONLY, ARXEIO_ID);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi[0]?.keimeno).toBe('');
  });

  it('κατεστραμμένο zip → σφάλμα ανάγνωσης (L93/L161/L199 true)', async () => {
    const pptx = await exagage_pptx(ZIP_CORRUPT, ARXEIO_ID);
    expect(pptx.ok).toBe(false);
    if (pptx.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(pptx.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');

    const docx = await exagage_docx(ZIP_CORRUPT, ARXEIO_ID);
    expect(docx.ok).toBe(false);
    if (docx.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(docx.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('ακυρο zip (μη zip) → σφάλμα (L195 true)', async () => {
    const docx = await exagage_docx(AKYRO, ARXEIO_ID);
    expect(docx.ok).toBe(false);
    if (docx.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(docx.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('παλιό OLE2 → σφάλμα (L195 true)', async () => {
    const docx = await exagage_docx(PPT_OLE2, ARXEIO_ID);
    expect(docx.ok).toBe(false);
    if (docx.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(docx.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('δεν έχει word/document.xml → MI_EGKYRO_SXIMA (L203 true)', async () => {
    const apotelesma = await exagage_docx(DOCX_NO_DOCUMENT_XML, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('w:document κείμενο χωρίς w:body → κανένα σώμα (L116 false)', async () => {
    const apotelesma = await exagage_docx(
      store_zip([{ onoma: 'word/document.xml', dedomena: ENCODERS.encode(DOCX_RIZA_LYPEI) }]),
      ARXEIO_ID
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('άκυρο XML → MI_EGKYRO_SXIMA (L211 true)', async () => {
    const apotelesma = await exagage_docx(DOCX_INVALID_XML, ARXEIO_ID);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      throw new Error('πρέπει να αποτύχει');
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});
