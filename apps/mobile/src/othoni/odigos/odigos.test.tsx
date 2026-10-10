import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OdigosMeletis, {
  EPKEFALIDES_TMIMATON,
  LEKIKIA_TMIMATON,
  ODIGOI_PSEUDOI,
  fortose_odigo,
  type KleidiTmimatos,
} from './odigos.js';

const DIALOMOS_PALIAS = LEKIKIA_TMIMATON;

function odigos_arxeio(): string {
  return readFileSync(fileURLToPath(new URL('./odigos.tsx', import.meta.url)), 'utf8');
}

/** Αποδίδει την οθόνη σε SSR μέσα σε MemoryRouter, χωρίς DOM και χωρίς @testing-library. */
function apostrophes_odigos(diadromi: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[diadromi]}>
      <Routes>
        <Route path="/odigos/:enotitaId" element={<OdigosMeletis />} />
        <Route path="/tutor" element={<div data-testid="alilos-xartis">alilos xartis</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('odigos — τοπικός χάρτης οδηγών', () => {
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
        const tmima = odigos.tmimata[kleidi as KleidiTmimatos];
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

describe('odigos — fortose_odigo', () => {
  it('δίνει etimo με τις επτά ενότητες και τον τίτλο από τον ψεύτικο χάρτη', async () => {
    const apokrisis = await fortose_odigo('en-2');
    expect(apokrisis.katastasi).toBe('etimo');
    if (apokrisis.katastasi === 'etimo') {
      expect(apokrisis.dedomena.enotita_id).toBe('en-2');
      expect(apokrisis.dedomena.titlos).toBe('Μεταβλητές και τύποι');
      expect([...Object.keys(apokrisis.dedomena.tmimata)]).toHaveLength(DIALOMOS_PALIAS.length);
    }
  });

  it('δίνει sfalma DEN_VRETHIKE για άγνωστο id, ποτέ κενή κατάσταση', async () => {
    const apokrisis = await fortose_odigo('en-999');
    expect(apokrisis.katastasi).toBe('sfalma');
    if (apokrisis.katastasi === 'sfalma') {
      expect(apokrisis.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(apokrisis.sfalma.minima).toContain('en-999');
    }
  });

  it('οι τέσσερις διαθέσιμες ενότητες φορτώνουν όλες με κατάσταση etimo', async () => {
    for (const enotitaId of ['en-1', 'en-2', 'en-3', 'en-4']) {
      const apokrisis = await fortose_odigo(enotitaId);
      expect(apokrisis.katastasi).toBe('etimo');
    }
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
  it('δηλώνει ακριβώς τα τέσσερα υποχρεωτικά testid', () => {
    const arxeio = odigos_arxeio();
    for (const testid of [
      'odigos-ekran',
      'odigos-epikefalida',
      'odigos-tutor',
      'odigos-episostrofh',
    ]) {
      expect(arxeio).toContain(`data-testid="${testid}"`);
    }
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