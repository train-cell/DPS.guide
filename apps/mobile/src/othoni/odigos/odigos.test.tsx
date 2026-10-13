import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OdigosMeletis, { ParapompiTmimatos } from './odigos.js';
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
