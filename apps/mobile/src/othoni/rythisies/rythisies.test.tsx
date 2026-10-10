import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import Rythisies from './rythisies.js';
import type { RythisiesProps } from './rythisies.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'rythisies.tsx'), 'utf8');

const APOTELEMATA = ['rythisies-ekran', 'rythisies-seira-montelo', 'rythisies-apothikeysi'] as const;

const RYTHISIES: RythisiesProps = {
  baseUrl: 'https://thales.cs.unipi.gr',
  mathimataSynch: ['Πληροφορική & Προγραμματισμός'],
  onomaMontelou: 'gemini-2.5-flash',
  exeiKleidiLlm: true,
  onomasApothikefsis: 'Documents/DPS.guide',
  einaiEidopoieseis: true,
};

function apotelesma_rythisi(antikatastaseis: Partial<RythisiesProps> = {}): string {
  return renderToStaticMarkup(<Rythisies {...RYTHISIES} {...antikatastaseis} />);
}

describe('Rythisies — συμβόλαιο οθόνης', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof Rythisies).toBe('function');
  });

  it('η στατική απόδοση δεν σπάει και δείχνει τους τέσσερις τομείς', () => {
    const html = apotelesma_rythisi();
    expect(html).toContain('Ρυθμίσεις');
    for (const titlos of ['Σύνδεση', 'Μοντέλο AI', 'Αποθήκευση', 'Ειδοποιήσεις']) {
      expect(html).toContain(titlos);
    }
  });

  it('κάθε απαιτούμενο data-testid εμφανίζεται στην απόδοση', () => {
    const html = apotelesma_rythisi();
    for (const testid of APOTELEMATA) {
      expect(html).toContain(`data-testid="${testid}"`);
    }
  });

  it('η οθόνη δεν έχει σταθερό μοντέλο: ακολουθεί πάντα τις ρυθμίσεις', () => {
    expect(apotelesma_rythisi({ onomaMontelou: 'montelo-alfa' })).toContain('montelo-alfa');
    expect(apotelesma_rythisi({ onomaMontelou: 'montelo-beta' })).toContain('montelo-beta');
    expect(ARXIKOS).not.toMatch(/gemini|gpt-|claude|anthropic/i);
  });

  it('η διεύθυνση σύνδεσης και η θέση αποθήκευσης έρχονται από τις ρυθμίσεις', () => {
    const html = apotelesma_rythisi({
      baseUrl: 'https://eclass.example.unipi.gr',
      onomasApothikefsis: 'DPS.guide/λεπτομέρειες',
    });
    expect(html).toContain('https://eclass.example.unipi.gr');
    expect(html).toContain('DPS.guide/λεπτομέρειες');
  });

  it('τα μαθήματα συγχρονισμού εμφανίζονται και το κενό λέγεται ρητά', () => {
    expect(apotelesma_rythisi()).toContain('Πληροφορική &amp; Προγραμματισμός');
    expect(apotelesma_rythisi({ mathimataSynch: [] })).toContain('Συγχρονισμός: κανένα μάθημα');
  });

  it('δείχνει αν υπάρχει κλειδί LLM, ποτέ την τιμή του', () => {
    expect(apotelesma_rythisi({ exeiKleidiLlm: true })).toContain('Κλειδί: Ρυθμισμένο');
    expect(apotelesma_rythisi({ exeiKleidiLlm: false })).toContain('Κλειδί: Μη ρυθμισμένο');
    expect(ARXIKOS).not.toContain('llm_api_key');
    expect(ARXIKOS).not.toMatch(/console\./);
  });

  it('οι ειδοποιήσεις δείχνονται με Pilegma ON/OFF', () => {
    const html = apotelesma_rythisi({ einaiEidopoieseis: true });
    expect(html).toContain('Ενεργές');
    expect(html).toContain('pilegma-entono');
    expect(apotelesma_rythisi({ einaiEidopoieseis: false })).toContain('Ανενεργές');
  });

  it('χρησιμοποιεί μόνο υπάρχουσες τάξεις CSS, χωρίς χρώματα και inline styles', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(ARXIKOS).toContain('className="odoni-lista"');
    expect(ARXIKOS).not.toContain('.css');
  });
});