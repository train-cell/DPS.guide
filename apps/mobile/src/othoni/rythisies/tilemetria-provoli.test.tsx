// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  join(dirname(fileURLToPath(import.meta.url)), 'tilemetria-provoli.tsx'),
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

  /**
   * Οι δοκιμές εδώ φορτώνουν το component σε jsdom, ώστε να καλυφθούν οι
   * κλάδοι αλληλεπδράσεων (effects, event handlers, state transitions).
   */
  describe('jsdom αλληλεπιδράσεις & κατάσταση', () => {
    beforeEach(() => {
      katharise_tilemetria();
    });

    afterEach(() => {
      cleanup();
      // Επαναφορά της clipboard API όπως ήταν πριν τις δοκιμές.
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      });
    });

    it('εγγράφει τον ακροατή και ανανεώνει τις εγγραφές όταν μπαίνει νέο μήνυμα', async () => {
      render(<TilemetriaProvoli />);
      expect(screen.getByTestId('tilemetria-log-list')).toBeTruthy();

      const eggrafi = katagrapse_tilemetria('info', 'Ζωντανό μήνυμα', { module: 'test' }, 12.5);
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-row-${eggrafi.id}`)).not.toBeNull();
      });
    });

    it('καθαρίζει τις εγγραφές και δείχνει το μήνυμα καθαρισμού', () => {
      katagrapse_tilemetria('info', 'Παλιό μήνυμα');
      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId('tilemetria-clear-btn'));
      expect(
        screen.getByTestId('tilemetria-status-msg').textContent
      ).toContain('Τα logs καθαρίστηκαν.');
      expect(screen.queryByTestId('tilemetria-keno')).not.toBeNull();
    });

    it('αντιγράφει στο πρόχειρο όταν η clipboard API είναι διαθέσιμη', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId('tilemetria-copy-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('tilemetria-status-msg').textContent).toContain(
          'Τα logs αντιγράφηκαν στο πρόχειρο!'
        );
      });
    });

    it('δεν αντιγράφει όταν δεν υπάρχει clipboard API', async () => {
      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId('tilemetria-copy-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('tilemetria-status-msg').textContent).toContain(
          'Το JSON εξήχθη.'
        );
      });
      expect(navigator.clipboard).toBeUndefined();
    });

    it('περνά στο fallback όταν η clipboard API υπάρχει αλλά αποτυγχάνει', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('αποτυχία')) },
        configurable: true,
      });
      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId('tilemetria-copy-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('tilemetria-status-msg').textContent).toContain(
          'Το JSON εξήχθη.'
        );
      });
    });

    it('καλεί το onEksagwgi με το JSON όταν πατιέται το κουμπί εξαγωγής', async () => {
      const onEksagwgi = vi.fn();
      render(<TilemetriaProvoli onEksagwgi={onEksagwgi} />);

      fireEvent.click(screen.getByTestId('tilemetria-export-btn'));
      await waitFor(() => {
        expect(onEksagwgi).toHaveBeenCalledWith(expect.any(String));
      });
      expect(screen.getByTestId('tilemetria-status-msg').textContent).toContain(
        'Εξαγωγή αρχείου logs έτοιμη.'
      );
    });

    it('εναλλάσσει τα φίλτρα επιπέδου', async () => {
      const e1 = katagrapse_tilemetria('info', 'Μήνυμα Info');
      const e2 = katagrapse_tilemetria('error', 'Μήνυμα Error');

      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId('tilemetria-filtro-error'));
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-row-${e1.id}`)).toBeNull();
        expect(screen.queryByTestId(`tilemetria-row-${e2.id}`)).not.toBeNull();
      });

      fireEvent.click(screen.getByTestId('tilemetria-filtro-ola'));
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-row-${e1.id}`)).not.toBeNull();
        expect(screen.queryByTestId(`tilemetria-row-${e2.id}`)).not.toBeNull();
      });
    });

    it('φιλτράρει τις εγγραφές με κείμενο αναζήτησης', () => {
      const e1 = katagrapse_tilemetria('info', 'Αντικείμενο Α');
      const e2 = katagrapse_tilemetria('info', 'Αντικείμενο Β');
      const e3 = katagrapse_tilemetria('warn', 'Άλλο μήνυμα', { kleidi: 'timh-A' });

      render(<TilemetriaProvoli />);

      fireEvent.change(screen.getByTestId('tilemetria-search-input'), {
        target: { value: 'Αντικείμενο' },
      });
      expect(screen.queryByTestId(`tilemetria-row-${e1.id}`)).not.toBeNull();
      expect(screen.queryByTestId(`tilemetria-row-${e2.id}`)).not.toBeNull();

      fireEvent.change(screen.getByTestId('tilemetria-search-input'), {
        target: { value: 'kleidi' },
      });
      expect(screen.queryByTestId(`tilemetria-row-${e3.id}`)).not.toBeNull();
      expect(screen.queryByTestId(`tilemetria-row-${e1.id}`)).toBeNull();

      fireEvent.change(screen.getByTestId('tilemetria-search-input'), {
        target: { value: 'δεν-υπάρχει' },
      });
      expect(screen.queryByTestId('tilemetria-keno')).not.toBeNull();
    });

    it('επιλέγει και αποεπιλέγει μια εγγραφή με κλικ και με πληκτρολόγιο', async () => {
      const e1 = katagrapse_tilemetria('info', 'Επιλεγμένο', { meta: 2 });
      const e2 = katagrapse_tilemetria('warn', 'Με metadata', { meta: 1 });

      render(<TilemetriaProvoli />);

      // Χωρίς επιλογή: δεν υπάρχει pre metadata
      expect(screen.queryByTestId(`tilemetria-meta-${e2.id}`)).toBeNull();

      fireEvent.click(screen.getByTestId(`tilemetria-row-${e2.id}`));
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-meta-${e2.id}`)).not.toBeNull();
      });

      // Επιλογή με κλειδί
      fireEvent.keyDown(screen.getByTestId(`tilemetria-row-${e1.id}`), { key: 'Enter' });
      expect(screen.queryByTestId(`tilemetria-meta-${e1.id}`)).not.toBeNull();

      // Άλλο κλειδί: δεν επιλέγει τίποτα
      fireEvent.keyDown(screen.getByTestId(`tilemetria-row-${e1.id}`), { key: 'Escape' });
      expect(screen.queryByTestId(`tilemetria-meta-${e1.id}`)).not.toBeNull();

      // Αποεπιλογή με κλειδί Space
      fireEvent.keyDown(screen.getByTestId(`tilemetria-row-${e1.id}`), { key: ' ' });
      expect(screen.queryByTestId(`tilemetria-meta-${e1.id}`)).toBeNull();
    });

    it('αποεπιλέγει με κλικ μια επιλεγμένη εγγραφή', async () => {
      const e1 = katagrapse_tilemetria('info', 'Κλικ', { meta: 3 });

      render(<TilemetriaProvoli />);

      fireEvent.click(screen.getByTestId(`tilemetria-row-${e1.id}`));
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-meta-${e1.id}`)).not.toBeNull();
      });

      // Δεύτερο κλικ: αποεπιλογή
      fireEvent.click(screen.getByTestId(`tilemetria-row-${e1.id}`));
      await waitFor(() => {
        expect(screen.queryByTestId(`tilemetria-meta-${e1.id}`)).toBeNull();
      });
    });

    it('δείχνει το μήνυμα κατάστασης μόνο όταν υπάρχει', () => {
      render(<TilemetriaProvoli />);

      expect(screen.queryByTestId('tilemetria-status-msg')).toBeNull();
    });
  });
});
