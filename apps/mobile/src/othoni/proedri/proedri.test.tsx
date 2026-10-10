import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { ftiaxe_periballon } from '../../periballon/index.js';
import Proedri, { PROEDRI_BASE_URL } from './proedri.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS = readFileSync(join(ORISTO, 'proedri.tsx'), 'utf8');

const APOTELEMATA = [
  'proedri-ekran',
  'proedri-forma',
  'proedri-gramma-base',
  'proedri-gramma-xristis',
  'proedri-gramma-kodikos',
  'proediri-syndeon',
] as const;

const AMIDES_ASYNKRONES = [
  'OloniKatastasis',
  'fortosi()',
  'sfalma(',
  'fortose_mathimata()',
  'epanalipsi={ananevei}',
] as const;

function apotelesma_proedri(): string {
  return renderToStaticMarkup(<Proedri periballon={ftiaxe_periballon()} />);
}

describe('Proedri — συμβόλαιο οθόνης', () => {
  it('εξάγει ένα React component', () => {
    expect(typeof Proedri).toBe('function');
  });

  it('η στατική απόδοση με ψεύτικες πύλες δεν σπάει και δείχνει το brand', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('proedri-plaka');
    expect(html).toContain('DPS.guide');
  });

  it('κάθε απαιτούμενο data-testid εμφανίζεται στην απόδοση', () => {
    const html = apotelesma_proedri();
    for (const testid of APOTELEMATA) {
      expect(html).toContain(`data-testid="${testid}"`);
    }
  });

  it('η πρώτη εμφάνιση περνά από το OloniKatastasis, όχι από λευκή οθόνη', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="katastasi-adeio"');
    expect(html).toContain('Πατήστε «Σύνδεση»');
  });

  it('η διεύθυνση eClass είναι προσυμπληρωμένη', () => {
    expect(PROEDRI_BASE_URL).toBe('https://thales.cs.unipi.gr');
    expect(apotelesma_proedri()).toContain(`value="${PROEDRI_BASE_URL}"`);
  });

  it('κάθε πεδίο έχει ετικέτα και ο κωδικός είναι κρυφός', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('<label class="odoni-xeiris-zeugos" for="proedri-gramma-base">');
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Κωδικός πρόσβασης eClass"');
  });

  it('η σημείωση λέει την αλήθεια για την αποθήκευση στη συσκευή', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('proedri-ypostirixtiki');
    expect(html).toContain('αποθηκεύονται μόνο στη συσκευή σου');
  });

  it('κάθε ασύγχρονη κατάσταση περνά από το OloniKatastasis', () => {
    for (const meros of AMIDES_ASYNKRONES) {
      expect(ARXIKOS).toContain(meros);
    }
  });

  it('η οθόνη δεν μπερδεύει το όνομα χρήστη με τον κωδικό στη μνήμη της συσκευής', () => {
    expect(ARXIKOS).toContain("vale('eclass_onoma_xristi'");
    expect(ARXIKOS).toContain("vale('eclass_kodikos'");
    expect(ARXIKOS).not.toContain('llm_api_key');
  });

  it('δεν εισάγει χρώματα ούτε inline styles', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});