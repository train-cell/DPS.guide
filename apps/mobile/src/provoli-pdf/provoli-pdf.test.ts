import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ProvoliPdf, { KLIMAKA_SELIDAS } from './provoli-pdf.js';

const KATALOGOS = dirname(fileURLToPath(import.meta.url));
const KODIKOS_PROVOLIS = readFileSync(join(KATALOGOS, 'provoli-pdf.tsx'), 'utf8');
const KODIKOS_CSS = readFileSync(join(KATALOGOS, 'provoli-pdf.css'), 'utf8');

const TESTIDS_YPOXREOTIKA = [
  'provoli-ekran',
  'provoli-epistrofi',
  'provoli-toolbar',
  'provoli-selida',
  'provoli-smikrynsi',
  'provoli-megenthinsi',
  'provoli-epanaphora-klimakas',
  'provoli-klimaka-endeixi',
  'provoli-kanvas',
  'provoli-sfalma-apostolis',
  'provoli-proigoumeno',
  'provoli-epomeno',
  'provoli-metavasi-selidas',
  'provoli-docked-bar',
] as const;

/** Αποδίδει στατικά την οθόνη ProvoliPdf μέσα σε Router. */
function apodosi_provolis(arxikiDiadromi = '/provoli/arx-1/1'): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [arxikiDiadromi] },
      createElement(ProvoliPdf, null)
    )
  );
}

describe('ProvoliPdf — συμβόλαιο οθόνης και αρχιτεκτονικής', () => {
  it('εξάγει συνάρτηση React component', () => {
    expect(typeof ProvoliPdf).toBe('function');
  });

  it('εξάγει την προεπιλεγμένη κλίμακα 1.5', () => {
    expect(KLIMAKA_SELIDAS).toBe(1.5);
  });

  it('δηλώνει όλα τα απαιτούμενα data-testid στον πηγαίο κώδικα', () => {
    for (const testid of TESTIDS_YPOXREOTIKA) {
      expect(KODIKOS_PROVOLIS).toContain(`data-testid="${testid}"`);
    }
  });

  it('η στατική απόδοση δεν καταρρέει και περιέχει τίτλο, toolbar και κουμπί επιστροφής', () => {
    const html = apodosi_provolis();
    expect(html).toContain('Προβολή PDF');
    expect(html).toContain('← Πίσω');
    expect(html).toContain('data-testid="provoli-epistrofi"');
    expect(html).toContain('data-testid="provoli-toolbar"');
  });

  it('περιέχει zoom controls με ένδειξη ποσοστού και Fit width', () => {
    const html = apodosi_provolis();
    expect(html).toContain('data-testid="provoli-smikrynsi"');
    expect(html).toContain('data-testid="provoli-megenthinsi"');
    expect(html).toContain('data-testid="provoli-epanaphora-klimakas"');
    expect(html).toContain('data-testid="provoli-klimaka-endeixi"');
    expect(html).toContain('150%');
    expect(html).toContain('Fit');
  });

  it('περιέχει breadcrumb με ένδειξη μαθήματος', () => {
    const html = apodosi_provolis();
    expect(html).toContain('provoli-breadcrumb');
    expect(html).toContain('PLI201');
  });

  it('περιέχει tactile pill badge για την ένδειξη σελίδας', () => {
    const html = apodosi_provolis();
    expect(html).toContain('data-testid="provoli-selida"');
    expect(html).toContain('provoli-pill-badge');
  });

  it('χρησιμοποιεί τις υποδομές αποθήκευσης και περιβάλλοντος', () => {
    expect(KODIKOS_PROVOLIS).toContain('xrisiApothekisis');
    expect(KODIKOS_PROVOLIS).toContain('xrisiPeriballontos');
    expect(KODIKOS_PROVOLIS).toContain('fortose_pdf');
    expect(KODIKOS_PROVOLIS).toContain('arithmos_selidon');
    expect(KODIKOS_PROVOLIS).toContain('stilise_selida');
  });
});

describe('ProvoliPdf — CSS Bevel / Dark Wellness κανόνες', () => {
  it('ορίζει όλες τις απαιτούμενες κλάσεις στο provoli-pdf.css', () => {
    const kllaseis = [
      '.provoli-odoni',
      '.provoli-ergaleia-mpara',
      '.provoli-breadcrumb',
      '.provoli-pill-badge',
      '.provoli-zoom-cluster',
      '.provoli-zoom-koumpi',
      '.provoli-zoom-fit-koumpi',
      '.provoli-periohos',
      '.provoli-vivlio-plaisio',
      '.provoli-kanvas',
      '.provoli-katw-mpara',
      '.provoli-metavasi-forma',
      '.provoli-metavasi-eisodos',
    ];
    for (const klasi of kllaseis) {
      expect(KODIKOS_CSS).toContain(klasi);
    }
  });

  it('εφαρμόζει bevel σκιές, border-radius και glassmorphism εφέ', () => {
    expect(KODIKOS_CSS).toContain('box-shadow');
    expect(KODIKOS_CSS).toContain('backdrop-filter');
    expect(KODIKOS_CSS).toContain('border-radius');
    expect(KODIKOS_CSS).toContain('var(--xroma-karta)');
    expect(KODIKOS_CSS).toContain('var(--xroma-synorio)');
  });
});
