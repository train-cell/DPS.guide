// Δημιουργεί ΣΥΝΘΕΤΙΚΑ office fixtures (100% generated, μηδέν πραγματικό υλικό σχολής).
// Χρήση: node scripts/make-fixtures/office.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const RIZA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EXODOS = path.join(RIZA, 'fixtures/office');

const SLIDES = [
  'Οι δομές δεδομένων ταξινομούν στοιχεία κατά αύξουσα σειρά.',
  'Η στοίβαξη ακολουθεί τη σειρά τελευταίου μέσα πρώτου έξω.',
  null,
  'Η αναζήτηση δυαδικού δέντρου χρειάζεται αν ζητηθεί άμεση πρόσβαση.',
];

const PARAGRAPHOI = [
  { epikefalida: 1, keimeno: 'Άλγεβρα' },
  { keimeno: 'Η άλγεβρα Boole μελετά πύλες και λογική.' },
  { epikefalida: 2, keimeno: 'Θεωρία Boolean' },
  { keimeno: 'Οι πίνακες αληθείας περιγράφουν συναρτήσεις.' },
  { epikefalida: 3, keimeno: 'Παραδείγματα' },
  { keimeno: 'Τα παραδείγματα δείχνουν απλούς υπολογισμούς.' },
];

async function ftiaxe_pptx() {
  const parousiastiko = new pptxgen();
  parousiastiko.layout = 'LAYOUT_16x9';
  for (let i = 0; i < SLIDES.length; i += 1) {
    const selida = parousiastiko.addSlide();
    const keimeno = SLIDES[i];
    if (keimeno !== null) {
      selida.addText(keimeno, { x: 0.5, y: 1, w: 9, h: 1, fontSize: 18 });
    }
  }
  return Buffer.from(await parousiastiko.write({ outputType: 'nodebuffer' }));
}

async function ftiaxe_docx() {
  const eggrafo = new Document({
    sections: [
      {
        children: PARAGRAPHOI.map((p) =>
          p.epikefalida === undefined
            ? new Paragraph({ children: [new TextRun(p.keimeno)] })
            : new Paragraph({
                heading:
                  p.epikefalida === 1
                    ? 'heading1'
                    : p.epikefalida === 2
                      ? 'heading2'
                      : 'heading3',
                children: [new TextRun(p.keimeno)],
              })
        ),
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(eggrafo));
}

function grapse(onoma, dedomena) {
  const diadromi = path.join(EXODOS, onoma);
  fs.writeFileSync(diadromi, dedomena);
  return { onoma, megethos: dedomena.length };
}

fs.mkdirSync(EXODOS, { recursive: true });

const apotelesmata = [
  grapse('slides-tessera.pptx', await ftiaxe_pptx()),
  grapse('enotites-tria.docx', await ftiaxe_docx()),
];

for (const a of apotelesmata) {
  console.log(`[fixtures:office] ${a.onoma} (${a.megethos} bytes)`);
}
