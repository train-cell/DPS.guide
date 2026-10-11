/**
 * Συνθετικά δυαδικά fixtures για τις δοκιμές της ροής.
 *
 * ΚΑΝΕΝΑ πραγματικό υλικό μαθήματος (§3 κανόνας 15). Χτίζεται από την αρχή, με
 * αποθηκευμένες (μη συμπιεσμένες) εγγραφές ZIP, ώστε τα tests να περνούν μέσα από
 * το ΠΡΑΓΜΑΤΙΚΟ `@dps/extract` χωρίς καμία νέα εξάρτηση.
 */

/** Υπογραφή τοπικής κεφαλίδας ZIP (`PK\x03\x04`). */
const ZIP_ANTIKAS_KEFALIDAS = 0x04034b50;

/** Υπογραφή κεντρικής εγγραφής ZIP (`PK\x01\x02`). */
const ZIP_ANTIKAS_KENTRIKAS = 0x02014b50;

/** Υπογραφή εγγραφής τέλους ZIP (`PK\x05\x06`). */
const ZIP_ANTIKAS_TELOUS = 0x06054b50;

/** Μέθοδος αποθήκευσης: χωρίς συμπίεση (απλό και ντετερμινιστικό). */
const ZIP_METHODOS_ATHIKOUSTO = 0;

/** Έκδοση ZIP που γράφουμε (2.0). */
const ZIP_EDOSI = 20;

/** Σταθερή ημερομηνία ZIP (1 Ιανουαρίου 1980) — κάνει το fixture ντετερμινιστικό. */
const ZIP_IMEROMINIA = 0x0021;

/** Μέγεθη σταθερών τμημάτων της εγγραφής ZIP (bytes). */
const ZIP_MIKROS_KEFALIDA = 30;
const ZIP_MIKROS_KENTRIKI = 46;
const ZIP_MIKROS_TELOUS = 22;

/** Πίνακας CRC-32 (IEEE 802.3), όπως ζητάει το ZIP. */
const CRC32_PINAKAS = (() => {
  const pinakas = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    pinakas[n] = c >>> 0;
  }
  return pinakas;
})();

/** CRC-32 των bytes, όπως το υπολογίζει το JSZip. */
export function crc32(dedomena: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of dedomena) {
    c = (CRC32_PINAKAS[(c ^ byte) & 0xff] as number) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Ένα αρχείο μέσα στο συνθετικό ZIP. */
export interface ArthroZip {
  readonly onoma: string;
  readonly dedomena: Uint8Array;
}

/** DataView πάνω σε προσωρινό buffer, με σαφής αρίθμηση θέσεων (μη μαγεύει). */
interface Grammikos {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  thesi: number;
}

function ftiaxe_grammikos(megethos: number): Grammikos {
  const bytes = new Uint8Array(megethos);
  return { bytes, view: new DataView(bytes.buffer), thesi: 0 };
}

function grapse_u32(g: Grammikos, timi: number, thesi: number): void {
  g.view.setUint32(thesi, timi, true);
  g.thesi += 4;
}

function grapse_u16(g: Grammikos, timi: number, thesi: number): void {
  g.view.setUint16(thesi, timi, true);
  g.thesi += 2;
}

function grapse_bytes(g: Grammikos, dedomena: Uint8Array): void {
  g.bytes.set(dedomena, g.thesi);
  g.thesi += dedomena.length;
}

/**
 * Χτίζει ZIP με αποθηκευμένες (μη συμπιεσμένες) εγγραφές — αρκετό για το JSZip
 * και χωρίς καμία εξωτερική εξάρτηση. Οι θέσεις των πεδίων είναι ρητές
 * (προδιαγραφή APPNOTE 6.3.10/6.3.12/6.3.16).
 */
export function ftiaxe_zip(arthra: readonly ArthroZip[]): Uint8Array {
  const onomatta = arthra.map((a) => new TextEncoder().encode(a.onoma));
  const megethosDedomenon = arthra.map((a) => a.dedomena.length);
  const onomattaKentr = onomatta.reduce((sumiko, o) => sumiko + o.length, 0);
  const megethosDedomenonKentr = megethosDedomenon.reduce((sumiko, m) => sumiko + m, 0);
  const mikrosKentr = ZIP_MIKROS_KENTRIKI * arthra.length + onomattaKentr;
  const synolo =
    arthra.length * ZIP_MIKROS_KEFALIDA +
    onomattaKentr +
    megethosDedomenonKentr +
    mikrosKentr +
    ZIP_MIKROS_TELOUS;

  const g = ftiaxe_grammikos(synolo);
  const theseisKentr = new Array<number>(arthra.length).fill(0);

  for (let i = 0; i < arthra.length; i += 1) {
    const arthro = arthra[i] as ArthroZip;
    const onoma = onomatta[i] as Uint8Array;
    theseisKentr[i] = g.thesi;

    // Τοπική κεφαλίδα (30 bytes) — τα offsets είναι ΣΧΕΤΙΚΑ με την αρχή της.
    const arxiKefalidas = g.thesi;
    grapse_u32(g, ZIP_ANTIKAS_KEFALIDAS, arxiKefalidas);
    grapse_u16(g, ZIP_EDOSI, arxiKefalidas + 4);
    grapse_u16(g, 0, arxiKefalidas + 6);
    grapse_u16(g, ZIP_METHODOS_ATHIKOUSTO, arxiKefalidas + 8);
    grapse_u16(g, 0, arxiKefalidas + 10);
    grapse_u16(g, ZIP_IMEROMINIA, arxiKefalidas + 12);
    grapse_u32(g, crc32(arthro.dedomena), arxiKefalidas + 14);
    grapse_u32(g, arthro.dedomena.length, arxiKefalidas + 18);
    grapse_u32(g, arthro.dedomena.length, arxiKefalidas + 22);
    grapse_u16(g, onoma.length, arxiKefalidas + 26);
    grapse_u16(g, 0, arxiKefalidas + 28);
    grapse_bytes(g, onoma);
    grapse_bytes(g, arthro.dedomena);
  }

  const theseKentr = g.thesi;
  for (let i = 0; i < arthra.length; i += 1) {
    const arthro = arthra[i] as ArthroZip;
    const onoma = onomatta[i] as Uint8Array;
    const arxi = g.thesi;

    // Κεντρική καταχώριση (46 bytes) — τα offsets είναι ΣΧΕΤΙΚΑ με την αρχή της.
    grapse_u32(g, ZIP_ANTIKAS_KENTRIKAS, arxi);
    grapse_u16(g, ZIP_EDOSI, arxi + 4);
    grapse_u16(g, ZIP_EDOSI, arxi + 6);
    grapse_u16(g, 0, arxi + 8);
    grapse_u16(g, ZIP_METHODOS_ATHIKOUSTO, arxi + 10);
    grapse_u16(g, 0, arxi + 12);
    grapse_u16(g, ZIP_IMEROMINIA, arxi + 14);
    grapse_u32(g, crc32(arthro.dedomena), arxi + 16);
    grapse_u32(g, arthro.dedomena.length, arxi + 20);
    grapse_u32(g, arthro.dedomena.length, arxi + 24);
    grapse_u16(g, onoma.length, arxi + 28);
    grapse_u16(g, 0, arxi + 30);
    grapse_u16(g, 0, arxi + 32);
    grapse_u16(g, 0, arxi + 34);
    grapse_u16(g, 0, arxi + 36);
    grapse_u32(g, 0, arxi + 38);
    grapse_u32(g, theseisKentr[i] as number, arxi + 42);
    grapse_bytes(g, onoma);
  }

  // Εγγραφή τέλους (22 bytes).
  const arxiTelous = g.thesi;
  grapse_u32(g, ZIP_ANTIKAS_TELOUS, arxiTelous);
  grapse_u16(g, 0, arxiTelous + 4);
  grapse_u16(g, 0, arxiTelous + 6);
  grapse_u16(g, arthra.length, arxiTelous + 8);
  grapse_u16(g, arthra.length, arxiTelous + 10);
  grapse_u32(g, arxiTelous - theseKentr, arxiTelous + 12);
  grapse_u32(g, theseKentr, arxiTelous + 16);
  grapse_u16(g, 0, arxiTelous + 20);

  return g.bytes;
}

/** Το XML ενός docx: οι παραγράφοι που αρχίζουν με `#` γίνονται `Heading1`. */
function xml_docx(paragrafies: readonly string[]): Uint8Array {
  const grammai = paragrafies
    .map((p) => {
      const stil = p.startsWith('#') ? 'Heading1' : 'Normal';
      const keimeno = p.replace(/^#\s*/, '');
      return `<w:p><w:pPr><w:pStyle w:val="${stil}"/></w:pPr><w:t>${keimeno}</w:t></w:p>`;
    })
    .join('');
  const eggrafo = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${grammai}</w:body></w:document>`;
  return new TextEncoder().encode(eggrafo);
}

/** Έγκυρο docx με τις δοθέντες παραγράφους (οι `#` σημαίνουν επικεφαλίδα). */
export function ftiaxe_docx(paragrafies: readonly string[]): Uint8Array {
  return ftiaxe_zip([
    {
      onoma: '[Content_Types].xml',
      dedomena: new TextEncoder().encode(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'
      ),
    },
    { onoma: 'word/document.xml', dedomena: xml_docx(paragrafies) },
  ]);
}

/** Έγκυρο pptx με τα δοθέντα slides (κάθε κείμενο γίνεται μία παράγραφος `<a:p>`). */
export function ftiaxe_pptx(slides: readonly (readonly string[])[]): Uint8Array {
  const arthra: ArthroZip[] = slides.map((keimena, i) => {
    const rips = keimena.map((k) => `<a:p><a:r><a:t>${k}</a:t></a:r></a:p>`).join('');
    const xml = `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>${rips}</p:spTree></p:cSld></p:sld>`;
    return { onoma: `ppt/slides/slide${i + 1}.xml`, dedomena: new TextEncoder().encode(xml) };
  });
  return ftiaxe_zip(arthra);
}

/** Υπογραφή OLE2 του παλιού δυαδικού Office (για το .ppt/.doc). */
export const MAGIKA_OLE2 = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

/** Υπογραφή zip (για τις αρνητικές δοκιμές του extract). */
export const MAGIKA_ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);