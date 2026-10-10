// Δημιουργεί ΣΥΝΘΕΤΙΚΑ PDF fixtures (100% generated, μηδέν πραγματικό υλικό σχολής).
// Χρήση: node scripts/make-fixtures/pdf.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const RIZA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EXODOS = path.join(RIZA, 'fixtures/pdf');
const GRAMMATOSEIRA = path.join(RIZA, 'fixtures/fonts/NotoSans-Regular.ttf');

const SELIDES_TRIA = [
  [
    'Οι δομές δεδομένων ταξινομούν στοιχεία κατά αύξουσα σειρά.',
    'Ένα παράδειγμα ταξινόμησης εμφανίζεται στο επόμενο κεφάλαιο.',
  ],
  ['', ''],
  [
    'Η αναζήτηση δυαδικού δέντρου χρειάζεται αν ζητηθεί άμεση πρόσβαση.',
    'Το βάθος του δέντρου καθορίζει το πλήθος των συγκρίσεων.',
  ],
];

const SELIDES_KENI = [
  ['Η στοίβαξη ακολουθεί τη σειρά τελευταίου μέσα πρώτου έξω.'],
  ['', ''],
];

const ARITHMOS_GRAMMATOSEIRAS = 11;
const MEGISTO_PLATOS = 540;
const APOSTASI_GRAMMON = 16;
const ARXI_GRAMMON = 760;
const PERITHORIO = 60;

async function ftiaxe_pdf(selides) {
  const eggrafo = await PDFDocument.create();
  eggrafo.registerFontkit(fontkit);
  const grammatoseiraBytes = fs.readFileSync(GRAMMATOSEIRA);
  const grammatoseira = await eggrafo.embedFont(grammatoseiraBytes, { subset: true });

  for (const keimenaSelidas of selides) {
    const selida = eggrafo.addPage([595, 842]);
    let grammi = ARXI_GRAMMON;
    for (const keimeno of keimenaSelidas) {
      // Απλή αναδίπλωση λέξεων ώστε το κείμενο να μην βγαίνει έξω από τη σελίδα.
      let trexon = '';
      for (const leksi of keimeno.split(' ')) {
        const dokimi = trexon.length === 0 ? leksi : `${trexon} ${leksi}`;
        const platos = grammatoseira.widthOfTextAtSize(dokimi, ARITHMOS_GRAMMATOSEIRAS);
        if (platos > MEGISTO_PLATOS && trexon.length > 0) {
          selida.drawText(trexon, {
            x: PERITHORIO,
            y: grammi,
            size: ARITHMOS_GRAMMATOSEIRAS,
            font: grammatoseira,
          });
          grammi -= APOSTASI_GRAMMON;
          trexon = leksi;
          continue;
        }
        trexon = dokimi;
      }
      if (trexon.length > 0) {
        selida.drawText(trexon, {
          x: PERITHORIO,
          y: grammi,
          size: ARITHMOS_GRAMMATOSEIRAS,
          font: grammatoseira,
        });
        grammi -= APOSTASI_GRAMMON;
      }
      grammi -= APOSTASI_GRAMMON / 2;
    }
  }
  return eggrafo.save();
}

function grapse(onoma, dedomena) {
  const diadromi = path.join(EXODOS, onoma);
  fs.writeFileSync(diadromi, dedomena);
  return { onoma, megethos: dedomena.length };
}

fs.mkdirSync(EXODOS, { recursive: true });

const apotelesmata = [
  grapse('notosans-tria-selides.pdf', await ftiaxe_pdf(SELIDES_TRIA)),
  grapse('notosans-keni-selida.pdf', await ftiaxe_pdf(SELIDES_KENI)),
];

for (const a of apotelesmata) {
  console.log(`[fixtures:pdf] ${a.onoma} (${a.megethos} bytes)`);
}
