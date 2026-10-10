import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { lepita_aristeias, pososto_aristeias, pseudos_xartis } from '../../pseudomata/index.js';
import { MetrikesSimeras, StochoiSimeras } from './simera.js';

const KODIKOS_SIMERAS = readFileSync(new URL('./simera.tsx', import.meta.url), 'utf8');

const TESTIDS_YPOXREOUSA = [
  'simera-ekran',
  'simera-stoxoi',
  'simera-daiktylos',
  'simera-stochos',
] as const;

function stixi(onoma: string) {
  return renderToStaticMarkup(
    <MemoryRouter>
      {onoma === 'metrikes' ? (
        <MetrikesSimeras enotites={pseudos_xartis().enotites} />
      ) : (
        <StochoiSimeras enotites={pseudos_xartis().enotites} />
      )}
    </MemoryRouter>
  );
}

describe('simera — συμβόλαιο data-testid', () => {
  it('δηλώνει και τα τέσσερα υποχρεωτικά testid', () => {
    for (const testid of TESTIDS_YPOXREOUSA) {
      expect(KODIKOS_SIMERAS).toContain(`data-testid="${testid}"`);
    }
  });

  it('η οθόνη δηλώνει κάθε testid μία και μόνη φορά', () => {
    for (const testid of TESTIDS_YPOXREOUSA) {
      expect(KODIKOS_SIMERAS.split(`data-testid="${testid}"`).length - 1).toBe(1);
    }
  });

  it('χρησιμοποιεί μόνο κλάσεις του koinima.css', () => {
    const epikeimena = [...KODIKOS_SIMERAS.matchAll(/className="([^"]+)"/g)].flatMap((synthronismo) =>
      (synthronismo[1] ?? '').split(/\s+/)
    );
    const keimeno_koinima = readFileSync(
      new URL('../../koinima/koinima.css', import.meta.url),
      'utf8'
    );
    for (const klasi of epikeimena) {
      expect(keimeno_koinima).toContain(`.${klasi}`);
    }
  });
});

describe('simera — δακτύλιος μετρικών', () => {
  it('δείχνει τα συνολικά λεπτά του μαθήματος', () => {
    const markup = stixi('metrikes');
    const synolika = lepita_aristeias(pseudos_xartis().enotites);
    expect(synolika).toBe(270);
    expect(markup).toContain('data-testid="simera-daiktylos"');
    expect(markup).toContain(`${synolika} λεπτά αναμένουν στο σύνολο του μαθήματος`);
  });

  it('δείχνει το ποσοστό προόδου από τις ολοκληρωμένες ενότητες', () => {
    const markup = stixi('metrikes');
    const pososto = pososto_aristeias(pseudos_xartis().enotites, []);
    expect(pososto).toBe(0);
    expect(markup).toContain('0%');
    expect(markup).toContain('Πρόοδος μαθήματος: 0%');
  });
});

describe('simera — στόχοι σήμερα', () => {
  it('δείχνει τις πρώτες τρεις ενότητες με τον εκτιμώμενο χρόνο τους', () => {
    const markup = stixi('stochoi');
    expect(markup).toContain('data-testid="simera-stoxoi"');
    expect(markup).toContain('Στοχοί σήμερα');
    expect(markup).toContain('Βασικές αρχές και ιστορικό');
    expect(markup).toContain('Μεταβλητές και τύποι');
    expect(markup).toContain('Έλεγχος ροής και επανάληψη');
    expect(markup).toContain('45 λεπτά');
  });

  it('κάθε ενότητα-στόχος παίρνει το δικό της testid και δεσμό προς τον οδό μελέτης', () => {
    const markup = stixi('stochoi');
    expect(markup.split('data-testid="simera-stochos"').length - 1).toBe(3);
    expect(markup).toContain('href="/odigos/en-1"');
    expect(markup).toContain('href="/odigos/en-2"');
    expect(markup).toContain('href="/odigos/en-3"');
  });

  it('δεν προτείνει τέταρτη ενότητα όταν ζητηθεί μικρότερη λίστα', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <StochoiSimeras enotites={pseudos_xartis().enotites.slice(0, 2)} />
      </MemoryRouter>
    );
    expect(markup).toContain('href="/odigos/en-2"');
    expect(markup).not.toContain('href="/odigos/en-3"');
  });

  it('κρατάει την ετικέτα όταν η ενότητα δεν έχει εκτιμώμενη διάρκεια', () => {
    const enotites = pseudos_xartis().enotites.map((enotita, thesis) =>
      thesis === 0 ? { ...enotita, lepta_ektimisi: null } : enotita
    );
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <StochoiSimeras enotites={enotites} />
      </MemoryRouter>
    );
    expect(markup).toContain('χωρίς εκτίμηση');
  });
});