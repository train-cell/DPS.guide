import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RythisiesAi, {
  PAROXOI_LLM,
  entopise_paroxo_montelou,
} from './rythisies-ai.js';
import { ftiaxe_periballon } from '../../periballon/index.js';
import { ParoxosPeriballontos } from '../../periballon/provolos.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'rythisies-ai.tsx'), 'utf8');

const APOTELEMATA_AI = [
  'rythisies-ai-ekran',
  'ai-paroxos-select',
  'ai-montelo-select',
  'ai-api-key',
  'ai-dokimi-syndesis',
  'ai-apothikeysi',
  'ai-epistrofi-link',
  'paroxos-gemini',
  'paroxos-openai',
  'paroxos-claude',
  'paroxos-ollama',
] as const;

/** Αποδίδει στατικά την οθόνη RythisiesAi. */
function apostrophes_rythisies_ai(): string {
  const periballon = ftiaxe_periballon();
  return renderToStaticMarkup(
    <MemoryRouter>
      <ParoxosPeriballontos periballon={periballon}>
        <RythisiesAi />
      </ParoxosPeriballontos>
    </MemoryRouter>
  );
}

describe('RythisiesAi — συμβόλαιο οθόνης', () => {
  it('εξάγει ένα React component συνάρτησης', () => {
    expect(typeof RythisiesAi).toBe('function');
  });

  it('η στατική απόδοση δεν σπάει και περιλαμβάνει όλες τις κάρτες', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('Μοντέλο AI &amp; Vault');
    expect(html).toContain('Πάροχος AI');
    expect(html).toContain('Επιλογή Μοντέλου');
    expect(html).toContain('Zero-Knowledge Hardware Vault');
    expect(html).toContain('Δοκιμή &amp; Επαλήθευση');
  });

  it('κάθε απαιτούμενο data-testid εμφανίζεται στην απόδοση', () => {
    const html = apostrophes_rythisies_ai();
    for (const testid of APOTELEMATA_AI) {
      expect(html).toContain(`data-testid="${testid}"`);
    }
  });

  it('παρέχει σύνδεσμο επιστροφής προς τις γενικές ρυθμίσεις', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('href="/rythisies"');
    expect(html).toContain('data-testid="ai-epistrofi-link"');
    expect(html).toContain('Επιστροφή στις Ρυθμίσεις');
  });
});

describe('RythisiesAi — επιλογές παρόχων και μοντέλων', () => {
  it('ορίζει ακριβώς τους 4 ζητούμενους παρόχους AI', () => {
    const idList = PAROXOI_LLM.map((p) => p.id);
    expect(idList).toEqual(['gemini', 'openai', 'claude', 'ollama']);
  });

  it('το Google Gemini περιλαμβάνει τα μοντέλα flash και pro', () => {
    const gemini = PAROXOI_LLM.find((p) => p.id === 'gemini');
    expect(gemini).toBeDefined();
    const montela = gemini?.montela.map((m) => m.id);
    expect(montela).toContain('gemini-2.5-flash');
    expect(montela).toContain('gemini-2.5-pro');
    expect(gemini?.apaitisiKleidiou).toBe(true);
  });

  it('το OpenAI ChatGPT περιλαμβάνει τα gpt-4o, gpt-4o-mini και o3-mini', () => {
    const openai = PAROXOI_LLM.find((p) => p.id === 'openai');
    expect(openai).toBeDefined();
    const montela = openai?.montela.map((m) => m.id);
    expect(montela).toContain('gpt-4o');
    expect(montela).toContain('gpt-4o-mini');
    expect(montela).toContain('o3-mini');
    expect(openai?.apaitisiKleidiou).toBe(true);
  });

  it('το Anthropic Claude περιλαμβάνει τα claude-3-7-sonnet και claude-3-5-haiku', () => {
    const claude = PAROXOI_LLM.find((p) => p.id === 'claude');
    expect(claude).toBeDefined();
    const montela = claude?.montela.map((m) => m.id);
    expect(montela).toContain('claude-3-7-sonnet');
    expect(montela).toContain('claude-3-5-haiku');
    expect(claude?.apaitisiKleidiou).toBe(true);
  });

  it('το Local Ollama περιλαμβάνει llama3.2, mistral, deepseek-r1 και default port 11434', () => {
    const ollama = PAROXOI_LLM.find((p) => p.id === 'ollama');
    expect(ollama).toBeDefined();
    const montela = ollama?.montela.map((m) => m.id);
    expect(montela).toContain('llama3.2');
    expect(montela).toContain('mistral');
    expect(montela).toContain('deepseek-r1');
    expect(ollama?.proepilegmenoUrl).toBe('http://localhost:11434');
    expect(ollama?.apaitisiKleidiou).toBe(false);
  });

  it('το entopise_paroxo_montelou αντιστοιχίζει σωστά ονόματα μοντέλων σε παρόχους', () => {
    expect(entopise_paroxo_montelou('gemini-2.5-flash')).toBe('gemini');
    expect(entopise_paroxo_montelou('gemini-2.5-pro')).toBe('gemini');
    expect(entopise_paroxo_montelou('gpt-4o')).toBe('openai');
    expect(entopise_paroxo_montelou('gpt-4o-mini')).toBe('openai');
    expect(entopise_paroxo_montelou('o3-mini')).toBe('openai');
    expect(entopise_paroxo_montelou('claude-3-7-sonnet')).toBe('claude');
    expect(entopise_paroxo_montelou('claude-3-5-haiku')).toBe('claude');
    expect(entopise_paroxo_montelou('llama3.2')).toBe('ollama');
    expect(entopise_paroxo_montelou('mistral')).toBe('ollama');
    expect(entopise_paroxo_montelou('deepseek-r1')).toBe('ollama');
    expect(entopise_paroxo_montelou('agnosto')).toBe('gemini');
  });
});

describe('RythisiesAi — Zero-Knowledge Hardware Vault & Ασφάλεια', () => {
  it('αποθηκεύει το κλειδί ΑΠΟΚΛΕΙΣΤΙΚΑ μέσω periballon.mystika.vale με llm_api_key', () => {
    expect(ARXIKOS).toContain("periballon.mystika.vale('llm_api_key'");
    expect(ARXIKOS).toContain("periballon.mystika.pare('llm_api_key'");
  });

  it('το πεδίο εισαγωγής API Key είναι αρχικά τύπου password για προστασία', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('type="password"');
    expect(html).toContain('data-testid="ai-api-key"');
  });

  it('παρέχει κουμπί εναλλαγής ορατότητας κλειδιού', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('data-testid="ai-toggle-oratoklidi"');
  });

  it('ενημερώνει το exeiKleidiLlm κατά την αποθήκευση', () => {
    expect(ARXIKOS).toContain('exeiKleidiLlm: exeiKleidi');
    expect(ARXIKOS).toContain('apothiki.allaxe_rytheseis');
  });
});

describe('RythisiesAi — δοκιμή σύνδεσης και ενέργειες', () => {
  it('διαθέτει κουμπί Έλεγχος Σύνδεσης με προσβάσιμη ετικέτα', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('data-testid="ai-dokimi-syndesis"');
    expect(html).toContain('Έλεγχος Σύνδεσης');
    expect(html).toContain('aria-label="Έλεγχος Σύνδεσης"');
  });

  it('διαθέτει κουμπί υποβολής για αποθήκευση και επιστροφή', () => {
    const html = apostrophes_rythisies_ai();
    expect(html).toContain('data-testid="ai-apothikeysi"');
    expect(html).toContain('Αποθήκευση &amp; Επιστροφή');
    expect(html).toContain('type="submit"');
  });

  it('καλεί το periballon.llm.parage_keimeno κατά τον έλεγχο σύνδεσης', () => {
    expect(ARXIKOS).toContain('periballon.llm.parage_keimeno');
    expect(ARXIKOS).toContain("systima: 'Έλεγχος σύνδεσης συστήματος'");
  });
});

describe('RythisiesAi — περιορισμοί κώδικα και ποιότητα', () => {
  it('δεν περιέχει any, ts-ignore, ts-expect-error ή μη-null assertions', () => {
    expect(ARXIKOS).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS).not.toContain('@ts-ignore');
    expect(ARXIKOS).not.toContain('@ts-expect-error');
    expect(ARXIKOS).not.toMatch(/!\s*[.;,)]/);
  });

  it('όλες οι σχετικές εισαγωγές έχουν κατάληξη .js', () => {
    expect(ARXIKOS).toContain("from '../../apothiki/index.js'");
    expect(ARXIKOS).toContain("from '../../periballon/index.js'");
    expect(ARXIKOS).toContain("from '../../koinima/index.js'");
    expect(ARXIKOS).not.toMatch(/from '\.\.?\/[^']*[^s]'/);
  });

  it('χρησιμοποιεί μόνο υπάρχουσες CSS κλάσεις χωρίς inline styles ή hardcoded hex', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(ARXIKOS).toContain('className="odoni-lista"');
  });
});
