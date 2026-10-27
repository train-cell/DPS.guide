import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TilemetriaProvoli,
  ypologismos_statistikon_tilemetrias,
} from './tilemetria-provoli.js';
import {
  katagrapse_tilemetria,
  katharise_tilemetria,
  type TilemetriaEggrafi,
} from '../../tilemetria/tilemetria.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./tilemetria-provoli.tsx', import.meta.url)),
  'utf8'
);

describe('TilemetriaProvoli Component (tilemetria-provoli.tsx)', () => {
  beforeEach(() => {
    katharise_tilemetria();
  });

  describe('ypologismos_statistikon_tilemetrias', () => {
    it('υπολογίζει σωστά πλήθος, σφάλματα, προειδοποιήσεις και μέση διάρκεια', () => {
      const deigma: TilemetriaEggrafi[] = [
        { id: '1', timestamp: '2026-10-27T10:00:00Z', epipedo: 'info', minima: 'A', diarkeiaMs: 10 },
        { id: '2', timestamp: '2026-10-27T10:01:00Z', epipedo: 'error', minima: 'B', diarkeiaMs: 30 },
        { id: '3', timestamp: '2026-10-27T10:02:00Z', epipedo: 'warn', minima: 'C' },
      ];

      const stats = ypologismos_statistikon_tilemetrias(deigma);
      expect(stats.synolo).toBe(3);
      expect(stats.sfalmata).toBe(1);
      expect(stats.proeidopoiiseis).toBe(1);
      expect(stats.mesiDiarkeiaMs).toBe(20);
    });

    it('χειρίζεται κενό πίνακα εγγραφών με ασφάλεια', () => {
      const stats = ypologismos_statistikon_tilemetrias([]);
      expect(stats.synolo).toBe(0);
      expect(stats.sfalmata).toBe(0);
      expect(stats.proeidopoiiseis).toBe(0);
      expect(stats.mesiDiarkeiaMs).toBe(0);
    });
  });

  describe('SSR Rendering & Δομή UI', () => {
    it('αποδίδει κενή κατάσταση όταν δεν υπάρχουν καταγραφές', () => {
      const html = renderToStaticMarkup(<TilemetriaProvoli />);

      expect(html).toContain('data-testid="tilemetria-provoli"');
      expect(html).toContain('data-testid="tilemetria-statistika"');
      expect(html).toContain('data-testid="tilemetria-search-input"');
      expect(html).toContain('data-testid="tilemetria-keno"');
      expect(html).toContain('Δεν υπάρχουν εγγραφές τηλεμετρίας');
    });

    it('αποδίδει τις γραμμές καταγραφής με κατάλληλα badges και roles', () => {
      katagrapse_tilemetria('info', 'Εκκίνηση συστήματος', { module: 'auth' }, 45.2);
      katagrapse_tilemetria('error', 'Αποτυχία σύνδεσης', { code: 500 });

      const html = renderToStaticMarkup(<TilemetriaProvoli />);

      expect(html).toContain('Εκκίνηση συστήματος');
      expect(html).toContain('Αποτυχία σύνδεσης');
      expect(html).toContain('INFO');
      expect(html).toContain('ERROR');
      expect(html).toContain('45.2ms');
      expect(html).toContain('role="log"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('data-testid="tilemetria-copy-btn"');
      expect(html).toContain('data-testid="tilemetria-export-btn"');
      expect(html).toContain('data-testid="tilemetria-clear-btn"');
    });

    it('υποστηρίζει αρχικό φιλτράρισμα επιπέδου', () => {
      katagrapse_tilemetria('info', 'Μήνυμα Info');
      katagrapse_tilemetria('error', 'Μήνυμα Error');

      const html = renderToStaticMarkup(<TilemetriaProvoli arxikoFiltroEpipedou="error" />);

      expect(html).toContain('Μήνυμα Error');
      expect(html).not.toContain('Μήνυμα Info');
    });
  });

  describe('Κανόνας D11, CSS Standards & Accessibility (a11y)', () => {
    it('ο κώδικας δεν περιέχει κανένα αυθαίρετο hex χρώμα (zero raw hex)', () => {
      const hexMatch = PIGI_KODIKA.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexMatch, `Βρέθηκαν αυθαίρετα hex: ${hexMatch.join(', ')}`).toEqual([]);
    });

    it('ο κώδικας δεν περιέχει inline styles (zero inline styles)', () => {
      expect(PIGI_KODIKA).not.toMatch(/style\s*=\s*\\{\\{/);
    });

    it('διαθέτει προσβάσιμα ARIA roles και συνδέσεις label/input', () => {
      expect(PIGI_KODIKA).toContain('role="region"');
      expect(PIGI_KODIKA).toContain('role="log"');
      expect(PIGI_KODIKA).toContain('aria-live="polite"');
      expect(PIGI_KODIKA).toContain('htmlFor={anazitisiInputId}');
    });
  });
});
