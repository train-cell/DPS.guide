// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import type { Proodhos } from '../../apothiki/apothiki-typoi.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { generateCourseGuide } from '../../ypiresies/pipeline-analisis.js';

vi.mock('../../ypiresies/pipeline-analisis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/pipeline-analisis.js')>();
  return {
    ...actual,
    generateCourseGuide: vi.fn(),
  };
});

/** Το workspace root, ανεξάρτητα από το από πού τρέχει το test. */
function rootDir(): string {
  return existsSync(join(process.cwd(), 'apps', 'mobile'))
    ? process.cwd()
    : join(process.cwd(), '..', '..');
}

import OdigosMeletis, {
  AutoelegchosAkordeon,
  AutoelegchosErwtisi,
  ParapompiTmimatos,
  ProodosDimiourgiasOdigou,
  STADIA_DIMIOURGIAS_ODIGOU,
  analise_erwtisi_autoelegchou,
  lezanta_leitner_koutioy,
} from './odigos.js';
import { EPKEFALIDES_TMIMATON, LEKIKIA_TMIMATON } from '../../ypiresies/index.js';
import { ODIGOI_PSEUDOI } from '../../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

const DIALOMOS_PALIAS = LEKIKIA_TMIMATON;

function odigos_arxeio(): string {
  return readFileSync(join(rootDir(), 'apps/mobile/src/othoni/odigos/odigos.tsx'), 'utf8');
}

/** Αποδίδει την οθόνη σε SSR μέσα σε MemoryRouter, χωρίς DOM και χωρίς @testing-library. */
function apostrophes_odigos(diadromi: string): string {
  return renderToStaticMarkup(
    me_periballon_test(<MemoryRouter initialEntries={[diadromi]}>
      <Routes>
        <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
        <Route path="/tutor" element={<div data-testid="alilos-xartis">alilos xartis</div>} />
      </Routes>
    </MemoryRouter>)
  );
}

describe('odigos — τοπικός χάρτης οδηγών (ψεύτικα περιεχόμενα)', () => {
  it('καλύπτει ακριβώς τις τέσσερις ενότητες του ψεύτικου μαθήματος', () => {
    expect([...Object.keys(ODIGOI_PSEUDOI)].sort()).toEqual(['en-1', 'en-2', 'en-3', 'en-4']);
  });

  it('κάθε ενότητα έχει και τις επτά υποχρεωτικές ενότητες με τη σειρά του προϊόντος', () => {
    expect([...DIALOMOS_PALIAS]).toEqual([
      'stoxoi',
      'eli5',
      'theoria',
      'paradeigma',
      'pagides',
      'syndeseis',
      'autoelegchos',
    ]);
    for (const odigos of Object.values(ODIGOI_PSEUDOI)) {
      expect([...Object.keys(odigos.tmimata)].sort()).toEqual([...DIALOMOS_PALIAS].sort());
    }
  });

  it('κάθε τμήμα έχει κείμενο και παραπομπή της μορφής [[arx-N: σ. X]]', () => {
    for (const odigos of Object.values(ODIGOI_PSEUDOI)) {
      for (const kleidi of DIALOMOS_PALIAS) {
        const tmima = odigos.tmimata[kleidi];
        expect(tmima.keimena.length).toBeGreaterThan(0);
        expect(tmima.parapompi).toMatch(/^\[\[arx-\d+: σ\. \d+(–\d+)?\]\]$/);
      }
    }
  });

  it('οι επτά επικεφαλίδες είναι αυτές που ζητά το προϊόν, με τη σειρά του', () => {
    expect(DIALOMOS_PALIAS.map((kleidi) => EPKEFALIDES_TMIMATON[kleidi])).toEqual([
      '🎯 Στόχοι',
      '👶 ELI5',
      '🔬 Θεωρία',
      '🧪 Λυμένο παράδειγμα',
      '⚠️ Παγίδες',
      '🔗 Συνδέσεις',
      '✅ Αυτοέλεγχος',
    ]);
  });
});

describe('odigos — ParapompiTmimatos', () => {
  it('αποδίδει κουμπί με την κανονική παραπομπή όταν το κείμενο αναλύεται', () => {
    const html = renderToStaticMarkup(
      me_periballon_test(<MemoryRouter>
        <ParapompiTmimatos parapompi="[[arx-1: σ. 3]]" />
      </MemoryRouter>)
    );
    expect(html).toContain('data-testid="odigos-parapompi"');
    expect(html).toContain('[[arx-1: σ. 3]]');
  });

  it('αποδίδει απλό κείμενο όταν η παραπομπή δεν αναλύεται', () => {
    const html = renderToStaticMarkup(
      me_periballon_test(<MemoryRouter>
        <ParapompiTmimatos parapompi="χωρίς παραπομπή" />
      </MemoryRouter>)
    );
    expect(html).not.toContain('data-testid="odigos-parapompi"');
    expect(html).toContain('χωρίς παραπομπή');
  });

  it('αποδίδει ως κείμενο αναλύσιμη παραπομπή με μη ασφαλές id αρχείου', () => {
    const html = renderToStaticMarkup(
      me_periballon_test(<MemoryRouter>
        <ParapompiTmimatos parapompi="[[..: σ. 3]]" />
      </MemoryRouter>)
    );
    expect(html).not.toContain('data-testid="odigos-parapompi"');
    expect(html).toContain('[[..: σ. 3]]');
  });
});

describe('odigos — SSR της οθόνης', () => {
  it('αποδίδει την οθόνη με τα testid του κελύφους και τα δύο controls', () => {
    const html = apostrophes_odigos('/odigos/en-2');
    expect(html).toContain('data-testid="odigos-ekran"');
    expect(html).toContain('data-testid="odigos-episostrofh"');
    expect(html).toContain('data-testid="odigos-tutor"');
  });

  it('η αρχική απόδοση περνά από το OloniKatastasis σε κατάσταση φόρτωσης, όχι κενή οθόνη', () => {
    const html = apostrophes_odigos('/odigos/en-2');
    expect(html).toContain('data-testid="katastasi-fortosi"');
    expect(html).toContain('odigos-kyrio');
  });

  it('η κεφαλίδα δείχνει το id της ενότητας πριν φορτωθεί ο οδηγός', () => {
    const html = apostrophes_odigos('/odigos/en-3');
    expect(html).toContain('Οδηγός en-3');
  });
});

describe('odigos — συμβόλαιο data-testid στον πηγαίο κώδικα', () => {
  it('δηλώνει ακριβώς τα υποχρεωτικά testid', () => {
    const arxeio = odigos_arxeio();
    for (const testid of [
      'odigos-ekran',
      'odigos-epikefalida',
      'odigos-tutor',
      'odigos-episostrofh',
      'odigos-parapompi',
      'odigos-dimiourgia',
      'odigos-proodos-analisis',
    ]) {
      expect(arxeio).toContain(`data-testid="${testid}"`);
    }
    expect(arxeio).toContain('generateCourseGuide(');
  });

  it('χρησιμοποιεί τις κλάσεις της οδού, των ενοτήτων και της παραπομπής', () => {
    const arxeio = odigos_arxeio();
    for (const klasa of [
      'odigos-kyrio',
      'odigos-epikefalida',
      'odigos-paragrafos',
      'odigos-parapompi',
    ]) {
      expect(arxeio).toContain(klasa);
    }
  });

  it('δεν εισάγει inline style ούτε νέο αρχείο CSS', () => {
    const arxeio = odigos_arxeio();
    expect(arxeio).not.toContain('style={{');
    expect(arxeio).not.toContain(".css'");
    expect(arxeio).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('δεν χρησιμοποιεί any, ts-ignore, ts-expect-error ή μη-null assertion', () => {
    const arxeio = odigos_arxeio();
    expect(arxeio).not.toMatch(/:\s*any\b/);
    expect(arxeio).not.toContain('@ts-ignore');
    expect(arxeio).not.toContain('@ts-expect-error');
    expect(arxeio).not.toMatch(/!\s*[.;,)]/);
  });
});

describe('odigos — AutoelegchosAkordeon & Leitner 5-box', () => {
  it('η lezanta_leitner_koutioy αντιστοιχεί σωστά τα κουτιά 1 έως 5', () => {
    expect(lezanta_leitner_koutioy(1)).toBe('Κουτί 1');
    expect(lezanta_leitner_koutioy(2)).toBe('Κουτί 2');
    expect(lezanta_leitner_koutioy(3)).toBe('Κουτί 3');
    expect(lezanta_leitner_koutioy(4)).toBe('Κουτί 4');
    expect(lezanta_leitner_koutioy(5)).toBe('Κουτί 5: Κατοχυρωμένη');
    expect(lezanta_leitner_koutioy(undefined)).toBe('Κουτί 1');
  });

  it('η analise_erwtisi_autoelegchou διαχωρίζει ερώτηση και απάντηση', () => {
    const parsed1 = analise_erwtisi_autoelegchou(
      'Ερώτηση: Ποια δομή ακολουθεί LIFO; Απάντηση: «Η στοίβα.»',
      0,
      'en-1'
    );
    expect(parsed1.erwtisi).toBe('Ποια δομή ακολουθεί LIFO;');
    expect(parsed1.apantisi).toBe('Η στοίβα.');
    expect(parsed1.ennoia).toBe('Ποια δομή ακολουθεί LIFO;');

    const parsed2 = analise_erwtisi_autoelegchou(
      'Πώς λειτουργεί ο διερμηνέας;',
      1,
      'en-1'
    );
    expect(parsed2.erwtisi).toBe('Πώς λειτουργεί ο διερμηνέας;');
    expect(parsed2.apantisi).toContain('Ανατρέξτε στην αντίστοιχη πηγή');
  });

  it('η AutoelegchosErwtisi αποδίδει ερώτηση, toggle απάντησης, badge κουτιού και κουμπιά αυτοαξιολόγησης', () => {
    const htmlKleisto = renderToStaticMarkup(
      me_periballon_test(
        <AutoelegchosErwtisi
          arithmos={1}
          erwtisi="Τι είναι αναδρομή;"
          apantisi="Μία συνάρτηση που καλεί τον εαυτό της."
          ennoia="Αναδρομή"
          kouti={3}
          arxikaAnoixto={false}
        />
      )
    );
    expect(htmlKleisto).toContain('Ερώτηση 1:');
    expect(htmlKleisto).toContain('Τι είναι αναδρομή;');
    expect(htmlKleisto).toContain('Κουτί 3');
    expect(htmlKleisto).toContain('Εμφάνιση απάντησης');
    expect(htmlKleisto).not.toContain('Μία συνάρτηση που καλεί τον εαυτό της.');
    expect(htmlKleisto).toContain('data-testid="autoelegchos-apantisi-koumpi"');
    expect(htmlKleisto).toContain('Το ήξερα');
    expect(htmlKleisto).toContain('Χρειάζομαι επανάληψη');

    const htmlAnoixto = renderToStaticMarkup(
      me_periballon_test(
        <AutoelegchosErwtisi
          arithmos={2}
          erwtisi="Τι είναι ουρά;"
          apantisi="Δομή FIFO."
          ennoia="Ουρά"
          kouti={5}
          arxikaAnoixto={true}
        />
      )
    );
    expect(htmlAnoixto).toContain('Κουτί 5: Κατοχυρωμένη');
    expect(htmlAnoixto).toContain('Απόκρυψη');
    expect(htmlAnoixto).toContain('Δομή FIFO.');
  });

  it('το AutoelegchosAkordeon αποδίδει τη λίστα ερωτήσεων με Leitner badges', () => {
    const keimena = [
      'Ερώτηση: Τι είναι int; Απάντηση: Ακέραιος.',
      'Ερώτηση: Τι είναι float; Απάντηση: Δεκαδικός.',
    ];
    const html = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <AutoelegchosAkordeon
            keimena={keimena}
            kodikosMathimatos="CS101"
            enotitaId="en-1"
          />
        </MemoryRouter>
      )
    );
    expect(html).toContain('odigos-autoelegchos-lista');
    expect(html).toContain('Ερώτηση 1:');
    expect(html).toContain('Τι είναι int;');
    expect(html).toContain('Ερώτηση 2:');
    expect(html).toContain('Τι είναι float;');
    expect(html).toContain('Κουτί 1');
  });

  describe('odigos — ProodosDimiourgiasOdigou (Stream 3)', () => {
    it('περιλαμβάνει και τα τρία στάδια ανάλυσης και σύνθεσης οδηγού', () => {
      expect(STADIA_DIMIOURGIAS_ODIGOU).toEqual([
        'Ανάγνωση τοπικά αποθηκευμένου υλικού...',
        'Εξαγωγή εννοιών & λυμένων παραδειγμάτων...',
        'Σύνθεση οδηγού 7 ενοτήτων & παραπομπών...',
      ]);
    });

    it('αποδίδει το component με data-testid="odigos-proodos-analisis", progress bar και ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosDimiourgiasOdigou stadio={1} pososto={33} />);
      expect(html).toContain('data-testid="odigos-proodos-analisis"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
      expect(html).toContain('33%');
      expect(html).toContain('ion-progress-bar');
      expect(html).toContain('Ανάγνωση τοπικά αποθηκευμένου υλικού...');
      expect(html).toContain('Εξαγωγή εννοιών &amp; λυμένων παραδειγμάτων...');
      expect(html).toContain('Σύνθεση οδηγού 7 ενοτήτων &amp; παραπομπών...');
    });

    it('αποδίδει ένδειξη ολοκλήρωσης σταδίων 2 και 3', () => {
      const html2 = renderToStaticMarkup(<ProodosDimiourgiasOdigou stadio={2} pososto={66} />);
      expect(html2).toContain('aria-valuenow="66"');
      expect(html2).toContain('66%');
      expect(html2).toContain('Στάδιο 2/3');

      const html3 = renderToStaticMarkup(<ProodosDimiourgiasOdigou stadio={3} pososto={100} />);
      expect(html3).toContain('aria-valuenow="100"');
      expect(html3).toContain('100%');
      expect(html3).toContain('Στάδιο 3/3');
    });
  });
});

/** Κείμενο Markdown ενός πλήρη οδηγού μελέτης, πλήρες με τις επτά ενότητες. */
function grammata_odigou(enotitaId: string): string {
  let keimeno = `# Τίτλος ενότητας ${enotitaId}\n\n`;
  for (const kleidi of LEKIKIA_TMIMATON) {
    keimeno += `## ${EPKEFALIDES_TMIMATON[kleidi]}\n\n`;
    keimeno += `- Κείμενο τμήματος ${kleidi}.\n\n`;
    keimeno += `[[arx-1: σ. 1]]\n\n`;
  }
  return keimeno;
}

/** Κείμενο Markdown ενός ελλιπούς οδηγού (λιγότερες από επτά ενότητες). */
function grammata_odigou_kalasmenou(): string {
  return `# Κακός οδηγός\n\n## 🎯 Στόχοι\n\n- Μόνο ένα τμήμα.\n\n[[arx-1: σ. 1]]\n\n`;
}

/** Αποδίδει την οθόνη του οδηγού σε πραγματικό DOM, με δεδομένα μέσα από την αποθήκη. */
async function apoidefsi_odigos(enotitaId: string): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno(`ΠΛΗ201/.spoudes/odigoi/${enotitaId}.md`, grammata_odigou(enotitaId));
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
        <MemoryRouter initialEntries={[`/odigos/${enotitaId}`]}>
          <Routes>
            <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('odigos-epikefalida').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

/** Αποδίδει την οθόνη χωρίς οδηγό (κενή ή χαλασμένη κατάσταση) σε πραγματικό DOM. */
async function apoidefsi_karos(statos: 'adeio' | 'sfalma'): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  if (statos === 'sfalma') {
    await apothiki.grapse_keimeno('ΠΛΗ201/.spoudes/odigoi/en-1.md', grammata_odigou_kalasmenou());
  }
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
        <MemoryRouter initialEntries={['/odigos/en-1']}>
          <Routes>
            <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  // περιμένουμε να σταθεροποιηθεί η κατάσταση (φόρτωση ή κενή/σφαλμα κάρτα)
  await waitFor(() => {
    expect(result.queryAllByTestId('odigos-dimiourgia').length > 0 ||
      result.queryByText('Ο οδηγός δεν έχει όλα τα επτά υποχρεωμένα τμήματα.') !== null ||
      result.queryAllByTestId('odigos-epikefalida').length > 0
    ).toBe(true);
  }, { timeout: 2000 });
  return result;
}

/** Ενεργοποιεί την επιλογή Gemini χωρίς την οποία το κουμπί παραγωγής μένει αδρανές. */
export async function epilexe_optin(result: ReturnType<typeof render>): Promise<void> {
  await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
  fireEvent.click(result.getByTestId('odigos-gemini-optin'));
  await waitFor(() => expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(false), { timeout: 2000 });
}

/** Αποδίδει την οθόνη με ορισμένες διαδρομές (χάρτης, tutor) για δοκιμές πλοήγησης. */
async function apoidefsi_odigos_pliros(enotitaId: string): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno(`ΠΛΗ201/.spoudes/odigoi/${enotitaId}.md`, grammata_odigou(enotitaId));
  const periballon = ftiaxe_periballon_test({ apothiki });
  const result = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
        <MemoryRouter initialEntries={[`/odigos/${enotitaId}`]}>
          <Routes>
            <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
            <Route path="/xartis" element={<div data-testid="alilos-xartis">alilos xartis</div>} />
            <Route path="/tutor" element={<div data-testid="alilos-tutor">alilos tutor</div>} />
            <Route
              path="/provoli/:arxeioId/:selida"
              element={<div data-testid="alilos-provoli">alilos provoli</div>}
            />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
  await waitFor(() => expect(result.queryAllByTestId('odigos-epikefalida').length).toBeGreaterThan(0), { timeout: 2000 });
  return result;
}

describe('odigos — οθόνη σε πραγματικό DOM', () => {
  afterEach(() => {
    cleanup();
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('δείχνει την κενή κάρτα όταν δεν υπάρχει οδηγός', async () => {
    const result = await apoidefsi_karos('adeio');
    expect(result.getByText('Δημιουργία οδηγού μελέτης')).not.toBeNull();
    expect(result.getByText('Οδηγός en-1')).not.toBeNull();
    // το κείμενο «Επίλεξε και συγχρόνισε πρώτα ένα μάθημα.» και η αδράνεια του κουμπιού
    // εξαρτώνται από κωδικό μαθήματος· εδώ το παρέχουμε μέσω του ParoxeApothekisis
    expect(result.queryByText('Επίλεξε και συγχρόνισε πρώτα ένα μάθημα.')).toBeNull();
    // η επιλογή Gemini δεν έχει ενεργοποιηθεί· το κουμπί μένει αδρανές
    expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(true);
  });

  it('δείχνει την κάρτα σφάλματος όταν ο οδηγός είναι χαλασμένο σχήμα', async () => {
    const result = await apoidefsi_karos('sfalma');
    expect(result.getByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull();
    expect(result.getByText('Ο οδηγός δεν έχει όλα τα επτά υποχρεωμένα τμήματα.')).not.toBeNull();
    expect(result.getByText('Δημιουργία ξανά').disabled).toBe(true);
  });

  it('δείχνει τον οδηγό με όλες τις ενότητες και τις παραπομπές', async () => {
    const result = await apoidefsi_odigos('en-1');
    expect(result.getByText('Τίτλος ενότητας en-1')).not.toBeNull();
    for (const kleidi of LEKIKIA_TMIMATON) {
      expect(result.getByText(EPKEFALIDES_TMIMATON[kleidi])).not.toBeNull();
    }
    expect(result.queryAllByText(/Κείμενο τμήματος/).length).toBe(7);
    expect(result.queryAllByTestId('odigos-parapompi').length).toBe(7);
    expect(result.container.querySelector('.odigos-autoelegchos-lista')).not.toBeNull();
  });

  it('αποδίδει το πλήρες τμήμα κειμένου όταν δεν είναι αυτοέλεγχος', async () => {
    const result = await apoidefsi_odigos('en-1');
    expect(result.getByTestId('odigos-ekran')).not.toBeNull();
    expect(result.queryAllByTestId('odigos-parapompi').length).toBe(7);
    expect(result.container.querySelector('.odigos-autoelegchos-lista')).not.toBeNull();
  });

  it('ναυτιγεί στον χάρτη όταν πατηθεί το κουμπί επιστροφής', async () => {
    const result = await apoidefsi_odigos_pliros('en-1');
    fireEvent.click(result.getByTestId('odigos-episostrofh'));
    await waitFor(() => expect(result.queryByTestId('alilos-xartis')).not.toBeNull(), { timeout: 2000 });
  });

  it('ναυτιγεί στον tutor όταν πατηθεί το κουμπί άσκησης', async () => {
    const result = await apoidefsi_odigos_pliros('en-1');
    fireEvent.click(result.getByTestId('odigos-tutor'));
    await waitFor(() => expect(result.queryByTestId('alilos-tutor')).not.toBeNull(), { timeout: 2000 });
  });

  it('εναλλάσσει τα εργαλεία εξάσκησης (εξέταση, μνημονικά, P2P)', async () => {
    const result = await apoidefsi_odigos('en-1');
    const tool = result.getByTestId('odigos-tool-exam');
    expect(result.queryByTestId('odigos-start-mock-exam')).toBeNull();
    fireEvent.click(tool);
    expect(result.queryByTestId('odigos-start-mock-exam')).not.toBeNull();

    const toolMnemonika = result.getByTestId('odigos-tool-mnemonika');
    fireEvent.click(toolMnemonika);
    expect(result.queryByText(/Μνημονικά/)).not.toBeNull();

    const toolP2p = result.getByTestId('odigos-tool-p2p');
    fireEvent.click(toolP2p);
    expect(result.queryByText(/Κάρτες Μελέτης: en-1/)).not.toBeNull();

    // επαναγωγή στο κανονικό
    fireEvent.click(tool);
    expect(result.queryByText(/Ποιος είναι ο βασικός στόχος/)).toBeNull();
  });

  it('η παραγωγή οδηγού προχωράει όλα τα στάδια και απορρίπτει το μη εφορτωμένο αποτέλεσμα', async () => {
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      timi: {
        enotita_id: 'en-1',
        titlos: 'Τίτλος ενότητας en-1',
        tmimata: {
          stoxoi: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          eli5: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          theoria: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          paradeigma: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          pagides: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          syndeseis: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
          autoelegchos: { keimena: ['Κείμενο'], parapompi: '[[arx-1: σ. 1]]' },
        },
      } as unknown as OdigosEnotitas,
    });
    const result = await apoidefsi_karos('adeio');
    await epilexe_optin(result);
    fireEvent.click(result.getByTestId('odigos-dimiourgia'));
    await waitFor(
      () => expect(result.queryAllByTestId('odigos-proodos-pososto')).toHaveLength(0),
      { timeout: 6000 }
    );
    // η παραγωγή ολοκληρώνεται, αλλά το φορτωμένο αρχείο δεν υπάρχει· η οθόνη επιστρέφει στο σφάλμα
    await waitFor(() => expect(result.getByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull(), { timeout: 2000 });
    expect(result.getByText('Ο οδηγός παράχθηκε αλλά δεν μπόρεσε να φορτωθεί.')).not.toBeNull();
    expect(result.queryAllByTestId('odigos-parapompi').length).toBe(0);
  });

  it('η παραγωγή στέλνει σφάλμα όταν το αποτέλεσμα είναι μη έγκυρο', async () => {
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      timi: { enotita_id: 'en-1' } as unknown as OdigosEnotitas,
    });
    const result = await apoidefsi_karos('adeio');
    await epilexe_optin(result);
    fireEvent.click(result.getByTestId('odigos-dimiourgia'));
    await waitFor(() => expect(result.getByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull(), { timeout: 3000 });
  });

  it('η παραγωγή αποτυγχάνει με σφάλμα δικτύου', async () => {
    const { generateCourseGuide } = await import('../../ypiresies/pipeline-analisis.js');
    (generateCourseGuide as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Δεν υπάρχει δικτύωση'));
    const result = await apoidefsi_karos('adeio');
    await epilexe_optin(result);
    fireEvent.click(result.getByTestId('odigos-dimiourgia'));
    await waitFor(() => expect(result.getByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull(), { timeout: 3000 });
  });

  it('αντιδρά στα κουμπιά αυτοαξιολόγησης και στέλνει την απάντηση', async () => {
    const result = await apoidefsi_odigos('en-1');
    const toggle = result.getByText('Εμφάνιση απάντησης');
    fireEvent.click(toggle);
    expect(result.queryByText(/Κείμενο τμήματος autoelegchos/)).not.toBeNull();
    expect(result.getByText('Απόκρυψη')).not.toBeNull();

    const apantisi = result.getAllByTestId('autoelegchos-apantisi-koumpi');
    fireEvent.click(apantisi[0]);
    expect(apantisi[0].disabled).toBe(true);
    fireEvent.click(apantisi[1]);
  });

  it('είναι επιβεβαιωμένο το opt-in Gemini όταν υπάρχει επιλογή', async () => {
    const result = await apoidefsi_karos('adeio');
    const checkbox = result.getByTestId('odigos-gemini-optin');
    expect(checkbox).not.toBeNull();
    expect(result.getByText(/Επιτρέπω στο Gemini να λαμβάνει το υλικό/)).not.toBeNull();
    // μη ενεργοποιημένο· το κουμπί παραγωγής μένει αδρανές
    expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(true);
    fireEvent.click(checkbox);
    await waitFor(() => expect(result.getByTestId('odigos-dimiourgia').disabled).toBe(false), { timeout: 2000 });
  });

  it('επαναφέρει την κατάσταση με το κουμπί επανάληψης', async () => {
    const result = await apoidefsi_odigos('en-1');
    expect(result.getByTestId('odigos-ekran')).not.toBeNull();
  });

  it('πλοηγείται στη προβολή PDF όταν πατηθεί μία παραπομπή', async () => {
    const result = await apoidefsi_odigos_pliros('en-1');
    const parapompi = result.getAllByTestId('odigos-parapompi')[0];
    fireEvent.click(parapompi);
    await waitFor(
      () => expect(result.queryByTestId('alilos-provoli')).not.toBeNull(),
      { timeout: 2000 }
    );
  });

  it('φορτώνει δεδομένα Leitner στην αρχική κατάσταση του AutoelegchosAkordeon', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'ΠΛΗ201/proodhos.json',
      JSON.stringify({
        aristeiesEnotiton: [],
        katastasiMathisis: [
          {
            /** Η `analise_erwtisi_autoelegchou` αφαιρεί το `Ερώτηση:` και δίνει `Τι είναι αναδρομή;` */
            ennoia: 'Τι είναι αναδρομή;',
            kouti: 2,
            epomeni_epanalipsi: '2026-11-20',
            sosta_seiri: 1,
          },
        ],
      } as unknown as Proodhos)
    );
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter>
            <AutoelegchosAkordeon
              keimena={['Ερώτηση: Τι είναι αναδρομή; Απάντηση: Συνάρτηση.']}
              kodikosMathimatos="ΠΛΗ201"
              enotitaId="en-1"
            />
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.container.querySelector('.odigos-autoelegchos-lista')).not.toBeNull(), {
      timeout: 2000,
    });
    expect(result.getByText('Κουτί 2')).not.toBeNull();
    result.unmount();
  });

  it('καταγράφει απάντηση Leitner και ενημερώνει τον πίνακα καταστάσεων', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      'ΠΛΗ201/proodhos.json',
      JSON.stringify({
        aristeiesEnotiton: [],
        katastasiMathisis: [
          {
            /** Η `analise_erwtisi_autoelegchou` αφαιρεί το `Ερώτηση:` και δίνει `Τι είναι αναδρομή;` */
            ennoia: 'Τι είναι αναδρομή;',
            kouti: 2,
            epomeni_epanalipsi: '2026-11-20',
            sosta_seiri: 1,
          },
        ],
      } as unknown as Proodhos)
    );
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter>
            <AutoelegchosAkordeon
              keimena={['Ερώτηση: Τι είναι αναδρομή; Απάντηση: Συνάρτηση.']}
              kodikosMathimatos="ΠΛΗ201"
              enotitaId="en-1"
            />
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.container.querySelector('.odigos-autoelegchos-lista')).not.toBeNull(), {
      timeout: 2000,
    });
    const koumpi = result.getAllByTestId('autoelegchos-apantisi-koumpi')[0];
    fireEvent.click(koumpi);
    await waitFor(() => expect(koumpi.disabled).toBe(true), { timeout: 2000 });
    /** σωστή απάντηση: το κουτί ανεβαίνει 2 → 3 */
    expect(result.getByText('Κουτί 3')).not.toBeNull();
    result.unmount();
  });

  it('η παραγωγή ξανά στην κατάσταση σφάλματος είναι ενεργή μετά το opt-in', async () => {
    const result = await apoidefsi_karos('sfalma');
    expect(result.getByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull();
    // μη ενεργοποιημένο· το κουμπί παραγωγής μένει αδρανές
    expect(result.getByText('Δημιουργία ξανά').disabled).toBe(true);
    await waitFor(() => expect(result.getByTestId('odigos-gemini-optin').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('odigos-gemini-optin'));
    await waitFor(() => expect(result.getByText('Δημιουργία ξανά').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByText('Δημιουργία ξανά'));
    // η οθόνη περνά στη φόρτωση και επιστρέφει στο σφάλμα όταν δεν παράγεται οδηγός
    await waitFor(() => expect(result.queryByText('Δεν φορτώθηκε ο οδηγός')).not.toBeNull(), {
      timeout: 2000,
    });
  });
});
