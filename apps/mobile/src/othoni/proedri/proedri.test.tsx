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
  'fortose_mathimata_apo_apothiki(',
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
    expect(ARXIKOS).toContain("vale('eclass_panepistimio_id'");
    expect(ARXIKOS).toContain("vale('eclass_base_url'");
    expect(ARXIKOS).not.toContain('llm_api_key');
  });

  it('δεν εισάγει χρώματα ούτε inline styles', () => {
    expect(ARXIKOS).not.toContain('style={{');
    expect(ARXIKOS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Proedri — Bevel x UniStudents UI & Visual Components', () => {
  it('εμφανίζει το σήμα ασφαλείας του Zero-Knowledge Vault', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="asfaleia-shma"');
    expect(html).toContain('Zero-Knowledge Hardware Vault');
  });

  it('εμφανίζει το φοιτητικό tip ημέρας', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="foititiko-tip-kouti"');
    expect(html).toContain('💡');
  });

  it('εμφανίζει τις κάψουλες φίλτρων πανεπιστημίων με όλες τις κατηγορίες', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="filtra-panepistimion"');
    expect(html).toContain('data-testid="filtro-ola"');
    expect(html).toContain('data-testid="filtro-stem"');
    expect(html).toContain('data-testid="filtro-athina"');
    expect(html).toContain('data-testid="filtro-thessaloniki"');
    expect(html).toContain('data-testid="filtro-perifereia"');
    expect(html).toContain('data-testid="filtro-custom"');
    expect(html).toContain('kapsoula-filtrou energi');
  });

  it('εμφανίζει το πεδίο αναζήτησης πανεπιστημίου / σχολής', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="anazitisi-panepistimiou-pedio"');
    expect(html).toContain('placeholder="Αναζήτηση σχολής, τμήματος ή πόλης..."');
  });

  it('εμφανίζει τη λίστα καρτών πανεπιστημίων με tactile κάρτες και badges', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('data-testid="lista-panepistimion"');
    expect(html).toContain('data-testid="karta-panepistimiou-unipi"');
    expect(html).toContain('karta-panepistimiou epilegmeni');
    expect(html).toContain('data-testid="eikonidio-panepistimiou-unipi"');
    expect(html).toContain('ΠΑΠΕΙ — Πανεπιστήμιο Πειραιώς');
  });

  it('εμφανίζει την Bevel 4-Segmented Progress Bar στην κορυφή', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('class="onboarding-vima-mpara"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="4"');
    expect(html.split('class="vima-tmima').length - 1).toBe(4);
  });

  it('εμφανίζει το Bevel fixed bottom navigation dock με πίσω και επόμενο κουμπιά', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('class="onboarding-ploigisi-mpara"');
    expect(html).toContain('class="onboarding-koumpi-piso aoratos"');
    expect(html).toContain('data-testid="onboarding-epomeno-koumpi"');
    expect(html).toContain('Επόμενο: Ίδρυμα →');
  });

  it('εμφανίζει την κάρτα επιβεβαίωσης πλάνου (Plan Receipt) στο Βήμα 4', () => {
    const html = apotelesma_proedri();
    expect(html).toContain('onboarding-apodeixi-karta');
    expect(html).toContain('Το ακαδημαϊκό σου προφίλ είναι έτοιμο');
    expect(html).toContain('Zero-Knowledge Hardware Vault');
  });
});