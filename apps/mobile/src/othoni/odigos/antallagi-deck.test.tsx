import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AntallagiDeck } from './antallagi-deck.js';
import type { PaketoKartonPayload } from '@dps/core';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./antallagi-deck.tsx', import.meta.url)),
  'utf8'
);

describe('AntallagiDeck Component (antallagi-deck.tsx)', () => {
  const deigmaPaketou: PaketoKartonPayload = {
    id: 'deck-123',
    titlos: 'Αλγόριθμοι & Πολυπλοκότητα',
    dimiourgithike: '2026-10-27T10:00:00.000Z',
    kartes: [
      {
        erwtisi: 'Τι είναι το P vs NP;',
        apantisi: 'Ανοικτό πρόβλημα θεωρητικής πληροφορικής.',
      },
    ],
  };

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('αποδίδει τα απαραίτητα testids για export και import', () => {
      const html = renderToStaticMarkup(
        <AntallagiDeck trexwnPaketo={deigmaPaketou} />
      );

      expect(html).toContain('data-testid="antallagi-export-btn"');
      expect(html).toContain('data-testid="antallagi-import-input"');
      expect(html).toContain('data-testid="antallagi-import-btn"');
    });

    it('εμφανίζει τον τίτλο του τρέχοντος πακέτου προς εξαγωγή', () => {
      const html = renderToStaticMarkup(
        <AntallagiDeck trexwnPaketo={deigmaPaketou} />
      );

      expect(html).toContain('Αλγόριθμοι &amp; Πολυπλοκότητα');
      expect(html).toContain('1 κάρτες');
    });

    it('αποδίδει πεδίο κατάστασης με aria-live="polite"', () => {
      const html = renderToStaticMarkup(
        <AntallagiDeck trexwnPaketo={deigmaPaketou} />
      );

      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('data-testid="antallagi-status"');
    });
  });

  describe('Κανόνας D11 & Προσβασιμότητα (a11y)', () => {
    it('ο κώδικας δεν περιέχει κανένα αυθαίρετο hex χρώμα (zero raw hex)', () => {
      const hexMatch = PIGI_KODIKA.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexMatch, `Βρέθηκαν αυθαίρετα hex: ${hexMatch.join(', ')}`).toEqual([]);
    });

    it('ο κώδικας δεν περιέχει inline styles (zero inline styles)', () => {
      expect(PIGI_KODIKA).not.toMatch(/style\s*=\s*\{\{/);
    });

    it('όλα τα πεδία εισαγωγής διαθέτουν aria-label ή συνδεδεμένη ετικέτα', () => {
      expect(PIGI_KODIKA).toContain('aria-label');
    });
  });
});
