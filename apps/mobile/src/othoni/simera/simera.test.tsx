import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { lepita_aristeias, pososto_aristeias, pseudos_xartis } from '../../pseudomata/index.js';
import Simera, { KEIMENO_STOXOU, KEIMENO_TELIOU, MetrikesSimeras, StochoiSimeras, StoxosEnotitas } from './simera.js';

const KODIKOS_SIMERAS = readFileSync(new URL('./simera.tsx', import.meta.url), 'utf8');

const TESTIDS_YPOXREOUSA = [
  'simera-ekran',
  'simera-stoxoi',
  'simera-daiktylos',
  'simera-stochos',
  'simera-telos',
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

/** Αποδίδει ένα στοιχείο ενότητας-στόχου μέσα σε router, με τη δοθείμένη κατάσταση ολοκλήρωσης. */
function stixi_stoxou(enotitaId: string, tetagmeni: boolean): string {
  const enotita = pseudos_xartis().enotites.find((katixeino) => katixeino.id === enotitaId);
  if (enotita === undefined) {
    throw new Error(`Άγνωστη ενότητα ${enotitaId}`);
  }
  const stoixeio: ReactElement = (
    <StoxosEnotitas
      enotita={enotita}
      tetagmeni={tetagmeni}
      allaxe_telia={() => Promise.resolve()}
    />
  );
  return renderToStaticMarkup(<MemoryRouter>{stoixeio}</MemoryRouter>);
}

describe('simera — συμβόλαιο data-testid', () => {
  it('δηλώνει και τα πέντε υποχρεωτικά testid', () => {
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
    expect(KODIKOS_SIMERAS).toContain('pilegma-entono');
    expect(keimeno_koinima).toContain('.pilegma-entono');
  });
});

describe('simera — η πρόοδος έρχεται από την αποθήκευση', () => {
  it('η παγωμένη κενή λίστα ARISTEIES_ENOTITON έχει αφαιρεθεί', () => {
    expect(KODIKOS_SIMERAS).not.toContain('ARISTEIES_ENOTITON');
    expect(KODIKOS_SIMERAS).not.toContain('Object.freeze([])');
  });

  it('διαβάζει και γράφει την πρόοδο μέσω της αποθήκευσης', () => {
    expect(KODIKOS_SIMERAS).toContain(
      "import { xrisiApothekisis } from '../../apothiki/index.js'"
    );
    expect(KODIKOS_SIMERAS).toContain('xrisiApothekisis()');
    expect(KODIKOS_SIMERAS).toContain('apothiki.proodhos.aristeiesEnotiton');
    expect(KODIKOS_SIMERAS).toContain('await allaxe_telia(enotita.id)');
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

  it('χωρίς Provider ο δακτύλιος δείχνει την κενή προεπιλογή, όχι σφάλμα', () => {
    const markup = stixi('metrikes');
    const pososto = pososto_aristeias(pseudos_xartis().enotites, []);
    expect(pososto).toBe(0);
    expect(markup).toContain('0%');
    expect(markup).toContain('Πρόοδος μαθήματος: 0%');
    expect(markup).toContain(`0 από ${pseudos_xartis().enotites.length} ολοκληρωμένες ενότητες`);
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

  it('κάθε στόχος έχει το δικό του κουμπί σήμανσης ολοκλήρωσης', () => {
    const markup = stixi('stochoi');
    expect(markup.split('data-testid="simera-telos"').length - 1).toBe(3);
    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain(KEIMENO_STOXOU);
  });

  it('ο στόχος χωρίς αποθηκευμένη ολοκλήρωση ζητά να σημειωθεί', () => {
    const markup = stixi_stoxou('en-1', false);
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain(KEIMENO_STOXOU);
    expect(markup).not.toContain('pilegma-entono');
  });

  it('ο στόχος με αποθηκευμένη ολοκλήρωση φαίνεται ολοκληρωμένος', () => {
    const markup = stixi_stoxou('en-1', true);
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain(KEIMENO_TELIOU);
    expect(markup).toContain('pilegma-entono');
    expect(markup).toContain('data-testid="simera-telos"');
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

describe('simera — ένδειξη ενεργού μαθήματος και εναλλαγή', () => {
  it('αποδίδει την ένδειξη ενεργού μαθήματος στην κορυφή της οθόνης', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Simera />
      </MemoryRouter>
    );
    expect(markup).toContain('ΕΝΕΡΓΟ ΜΑΘΗΜΑ');
    expect(markup).toContain('ΠΛΗ201 - Προγραμματισμός');
  });

  it('περιέχει κουμπιά εναλλαγής για τα συγχρονισμένα μαθήματα', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Simera />
      </MemoryRouter>
    );
    expect(markup).toContain('ΠΛΗ201');
    expect(markup).toContain('ΠΛΗ101');
    expect(markup).toContain('ΠΛΗ204');
  });

  it('αποδίδει το έμβλημα του πανεπιστημίου και το κέντρο γρήγορων ενεργειών', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Simera />
      </MemoryRouter>
    );
    expect(markup).toContain('simera-panepistimio-badge');
    expect(markup).toContain('ΠΑΠΕΙ');
    expect(markup).toContain('simera-draseis-plegma');
    expect(markup).toContain('🚀 Μελέτη');
    expect(markup).toContain('🤖 AI Tutor');
    expect(markup).toContain('🗺️ Ύλη');
    expect(markup).toContain('📅 Πρόγραμμα');
  });
});