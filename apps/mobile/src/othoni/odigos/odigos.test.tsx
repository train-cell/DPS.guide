import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  return readFileSync(fileURLToPath(new URL('./odigos.tsx', import.meta.url)), 'utf8');
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
