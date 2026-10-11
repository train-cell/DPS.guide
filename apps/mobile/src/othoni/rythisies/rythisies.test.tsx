import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Rythisies, { pare_editable_rytheseis } from './rythisies.js';
import { proedapes_rytheseis } from '../../apothiki/index.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'rythisies.tsx'), 'utf8');

const APOTELEMATA = [
  'rythisies-ekran',
  'rythisies-seira-montelo',
  'rythisies-apothikeysi',
  'rythisies-gramma-base',
  'rythisies-gramma-montelo',
  'rythisies-eidopoieseis',
  'rythisies-apothekeysto',
  'rythisies-eidopoiseis-othoni',
] as const;

/** Αποδίδει την οθόνη χωρίς Provider· ο γαντζότης πέφτει στις προεπιλογές της αποθήκευσης.
 *  MemoryRouter ώστε το συνδέσμο προς την οθόνη προγράμματος (κάρτα P1) να μην απαιτεί πραγματικό router. */
function apostrophes_rythisi(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <Rythisies />
    </MemoryRouter>
  );
}

describe('Rythisies — συμβόλαιο οθόνης', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof Rythisies).toBe('function');
  });

  it('η στατική απόδοση χωρίς Provider δεν σπάει και δείχνει τους τέσσερις τομείς', () => {
    const html = apostrophes_rythisi();
    expect(html).toContain('Ρυθμίσεις');
    for (const titlos of ['Σύνδεση', 'Μοντέλο AI', 'Αποθήκευση', 'Ειδοποιήσεις']) {
      expect(html).toContain(titlos);
    }
  });

  it('κάθε απαιτούμενο data-testid εμφανίζεται στην απόδοση', () => {
    const html = apostrophes_rythisi();
    for (const testid of APOTELEMATA) {
      expect(html).toContain(`data-testid="${testid}"`);
    }
  });
});

describe('Rythisies — τιμές από την αποθήκευση, όχι hardcoded', () => {
  it('διαβάζει τις ρυθμίσεις από το γαντζότο xrisiApothekisis', () => {
    expect(ARXIKOS).toContain('xrisiApothekisis');
    expect(ARXIKOS).toContain('apothiki.rytheseis');
  });

  it('χωρίς Provider η οθόνη παρουσιάζει τις προεπιλογές της αποθήκευσης', () => {
    const proedapes = proedapes_rytheseis();
    const html = apostrophes_rythisi();
    expect(html).toContain(proedapes.baseUrl);
    expect(html).toContain(proedapes.onomaMontelou);
    expect(html).toContain(proedapes.onomasApothikefsis);
  });

  it('η οθόνη δεν έχει σταθερό μοντέλο: το όνομα έρχεται από το store', () => {
    expect(ARXIKOS).not.toMatch(/gemini|gpt-|claude|anthropic/i);
    expect(ARXIKOS).toContain('grammata.onomaMontelou');
  });

  it('το pare_editable_rytheseis κρατάει μόνο τα τρία επεξεργάσιμα πεδία', () => {
    const pare = pare_editable_rytheseis({
      baseUrl: 'https://eclass.example.unipi.gr',
      mathimataSynch: ['ΠΛΗ201'],
      onomaMontelou: 'montelo-alfa',
      exeiKleidiLlm: true,
      onomasApothikefsis: 'Documents/DPS.guide',
      einaiEidopoieseis: false,
      exetaseis: [{ kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' }],
      arxiExetastikis: '2027-01-11',
      templateLepton: [{ imera: 1, lepta: 60 }],
      overridesLepton: [{ imerominia: '2027-01-09', lepta: 45 }],
    });
    expect(pare).toEqual({
      baseUrl: 'https://eclass.example.unipi.gr',
      onomaMontelou: 'montelo-alfa',
      einaiEidopoieseis: false,
    });
  });

  it('η συγχρονισμός με το store κρέμεται από πρωτόγονα, όχι από την ταυτότητα του αντικειμένου', () => {
    const eksartiseis = ARXIKOS.match(/useEffect\([\s\S]*?\}, \[([\s\S]*?)\]\);/)?.[1];
    expect(eksartiseis).toBeDefined();
    expect(String(eksartiseis)).not.toContain('apothiki.rytheseis');
    for (const pedio of ['baseUrl', 'onomaMontelou', 'einaiEidopoieseis']) {
      expect(String(eksartiseis)).toContain(pedio);
    }
  });
});

describe('Rythisies — επεξεργασία και αποθήκευση', () => {
  it('η αποθήκευση περνά από το allaxe_rytheseis του store', () => {
    expect(ARXIKOS).toContain('apothiki.allaxe_rytheseis');
    expect(ARXIKOS).toMatch(/await apothiki\.allaxe_rytheseis/);
  });

  it('η οθόνη έχει δύο επεξεργάσιμα πεδία κειμένου και κουμπί αποθήκευσης', () => {
    const html = apostrophes_rythisi();
    expect((html.match(/<input/g) ?? []).length).toBe(2);
    expect(html).toContain('rythisies-apothekeysto');
    expect(ARXIKOS).toContain('onSubmit={ypostiripse}');
  });

  it('κάθε control έχει προσβάσιμο όνομα', () => {
    const html = apostrophes_rythisi();
    expect(html).toContain('aria-label="Διεύθυνση eClass"');
    expect(html).toContain('aria-label="Όνομα μοντέλου AI"');
    expect(html).toContain('aria-label="Τοπικές ειδοποιήσεις"');
    expect(html).toContain('aria-label="Αποθήκευση ρυθμίσεων"');
  });

  it('οι ειδοποιήσεις είναι role=switch, όχι γυμνό checkbox', () => {
    const html = apostrophes_rythisi();
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('Ενεργές');
    expect(html).toContain('pilegma-entono');
    expect(ARXIKOS).not.toContain('type="checkbox"');
  });

  it('παρέχει σύνδεσμο προς την οθόνη ρυθμίσεων ειδοποιήσεων', () => {
    const html = apostrophes_rythisi();
    expect(html).toContain('href="/eidopoiseis"');
    expect(html).toContain('data-testid="rythisies-eidopoiseis-othoni"');
    expect(html).toContain('Ρυθμίσεις ειδοποιήσεων');
  });
});

describe('Rythisies — το κλειδί LLM μέναι μυστικό', () => {
  it('δείχνει μόνο αν υπάρχει κλειδί, ποτέ την τιμή του', () => {
    const html = apostrophes_rythisi();
    expect(html).toContain('Κλειδί: Μη ρυθμισμένο');
    expect(html).not.toContain('Κλειδί: Ρυθμισμένο');
    expect(ARXIKOS).toContain("exeiKleidiLlm ? 'Κλειδί: Ρυθμισμένο' : 'Κλειδί: Μη ρυθμισμένο'");
  });

  it('ο πηγαίος κώδικας δεν έχει κλειδί, μέθοδο καταγραφής ή κρυφό input', () => {
    expect(ARXIKOS).not.toContain('llm_api_key');
    expect(ARXIKOS).not.toMatch(/console\./);
    expect(ARXIKOS).not.toContain('type="password"');
    expect(ARXIKOS.match(/type="password"/g) ?? []).toHaveLength(0);
  });
});

describe('Rythisies — περιορισμοί κώδικα', () => {
  it('χρησιμοποιεί μόνο υπάρχουσες τάξεις CSS, χωρίς χρώματα και inline styles', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(ARXIKOS).toContain('className="odoni-lista"');
    expect(ARXIKOS).not.toContain('.css');
  });

  it('χρησιμοποιεί τις υπάρχουσες κάρτες, ετικέτες και τάξεις της οθόνης', () => {
    for (const symbolo of ['Karta', 'Pilegma', 'ProskelesioOmonimas']) {
      expect(ARXIKOS).toContain(symbolo);
    }
    for (const klasa of ['pilegma', 'pilegma-entono', 'proedri-travla-gramma']) {
      expect(ARXIKOS).toContain(klasa);
      expect(apostrophes_rythisi()).toContain(klasa);
    }
  });

  it('δεν εισάγει any, ts-ignore, ts-expect-error ή μη-null assertion', () => {
    expect(ARXIKOS).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS).not.toContain('@ts-ignore');
    expect(ARXIKOS).not.toContain('@ts-expect-error');
    expect(ARXIKOS).not.toMatch(/!\s*[.;,)]/);
  });

  it('οι σχετικές εισαγωγές έχουν επέκταση .js', () => {
    expect(ARXIKOS).toContain("from '../../apothiki/index.js'");
    expect(ARXIKOS).toContain("from '../../koinima/index.js'");
    expect(ARXIKOS).not.toMatch(/from '\.\.?\/[^']*[^s]'/);
  });
});