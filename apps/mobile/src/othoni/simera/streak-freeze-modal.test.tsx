import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StreakFreezeModal } from './streak-freeze-modal.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./streak-freeze-modal.tsx', import.meta.url)),
  'utf8'
);

describe('StreakFreezeModal Component (streak-freeze-modal.tsx)', () => {
  const proepiloges = {
    anoikto: true,
    trexwnStreak: 7,
    diathesimaTokens: 2,
    kindynosDiakopis: true,
    onKleisimo: () => {},
  };

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('δεν αποδίδει τίποτα όταν anoikto=false', () => {
      const html = renderToStaticMarkup(
        <StreakFreezeModal {...proepiloges} anoikto={false} />
      );
      expect(html).toBe('');
    });

    it('αποδίδει το modal με data-testid="streak-freeze-modal" όταν anoikto=true', () => {
      const html = renderToStaticMarkup(
        <StreakFreezeModal {...proepiloges} />
      );

      expect(html).toContain('data-testid="streak-freeze-modal"');
      expect(html).toContain('Κίνδυνος Διακοπής Streak!');
      expect(html).toContain('data-testid="streak-freeze-current-streak"');
      expect(html).toContain('7 ημέρες');
      expect(html).toContain('data-testid="streak-freeze-tokens-count"');
      expect(html).toContain('2 🧊');
      expect(html).toContain('data-testid="streak-freeze-start-blitz"');
      expect(html).toContain('data-testid="streak-freeze-use-token"');
      expect(html).toContain('data-testid="streak-freeze-close"');
    });

    it('απενεργοποιεί το κουμπί χρήσης token όταν diathesimaTokens=0', () => {
      const html = renderToStaticMarkup(
        <StreakFreezeModal {...proepiloges} diathesimaTokens={0} />
      );

      expect(html).toContain('disabled=""');
      expect(html).toContain('0 διαθέσιμα');
    });

    it('αποδίδει ήπιο τίτλο όταν δεν υπάρχει κίνδυνος διακοπής (kindynosDiakopis=false)', () => {
      const html = renderToStaticMarkup(
        <StreakFreezeModal {...proepiloges} kindynosDiakopis={false} />
      );

      expect(html).toContain('Κατάσταση Streak &amp; Freeze Vault');
      expect(html).toContain('Το σερί μελέτης σου είναι ασφαλές');
    });
  });

  describe('Κανόνας D11 & Zero Inline Styles', () => {
    it('ο κώδικας δεν περιέχει κανένα αυθαίρετο hex χρώμα (zero raw hex)', () => {
      const hexMatch = PIGI_KODIKA.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexMatch, `Βρέθηκαν αυθαίρετα hex: ${hexMatch.join(', ')}`).toEqual([]);
    });

    it('ο κώδικας δεν περιέχει inline styles (zero inline styles)', () => {
      expect(PIGI_KODIKA).not.toMatch(/style\s*=\s*\{\{/);
    });

    it('περιλαμβάνει ρητά προσβασιμότητα a11y (role="dialog", aria-modal="true")', () => {
      expect(PIGI_KODIKA).toContain('role="dialog"');
      expect(PIGI_KODIKA).toContain('aria-modal="true"');
      expect(PIGI_KODIKA).toContain('aria-labelledby=');
    });
  });
});
