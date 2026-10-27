import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Mnemonika } from './mnemonika.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./mnemonika.tsx', import.meta.url)),
  'utf8'
);

describe('Mnemonika Component (mnemonika.tsx)', () => {
  const deigmaOron = ['Δυαδική Αναζήτηση', 'Πολυπλοκότητα', 'Στοίβα'];

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('αποδίδει τη φόρμα καταχώρησης μνημονικού με data-testid="mnemonika-form"', () => {
      const html = renderToStaticMarkup(
        <Mnemonika arxikoiOroi={[]} />
      );

      expect(html).toContain('data-testid="mnemonika-form"');
      expect(html).toContain('data-testid="mnemonika-submit"');
      expect(html).toContain('Μνημονικός Βοηθός');
      expect(html).toContain('Δημιουργία Μνημονικού');
    });

    it('αποδίδει το παραγόμενο ακρωνύμιο και τα αποτελέσματα όταν δίνονται όροι', () => {
      const html = renderToStaticMarkup(
        <Mnemonika
          arxikoiOroi={deigmaOron}
          arxikoEidos="akronymio"
          thema="Δομές Δεδομένων"
        />
      );

      expect(html).toContain('data-testid="mnemoniko-akronymio"');
      expect(html).toContain('ΔΠΣ');
      expect(html).toContain('data-testid="mnemoniko-katanomi"');
      expect(html).toContain('Δυαδική Αναζήτηση');
      expect(html).toContain('Πολυπλοκότητα');
      expect(html).toContain('Στοίβα');
      expect(html).toContain('data-testid="mnemoniko-prompt"');
      expect(html).toContain('DPS Mnemonic Co-Pilot');
    });

    it('εμφανίζει σωστά το badge είδους', () => {
      const html = renderToStaticMarkup(
        <Mnemonika
          arxikoiOroi={['Όρος 1', 'Όρος 2']}
          arxikoEidos="peg_system"
        />
      );

      expect(html).toContain('data-testid="mnemoniko-eidos-badge"');
      expect(html).toContain('peg_system');
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

    it('περιλαμβάνει ρητά προσβασιμότητα a11y (role, aria-label, labels)', () => {
      expect(PIGI_KODIKA).toContain('role="status"');
      expect(PIGI_KODIKA).toContain('aria-live="polite"');
      expect(PIGI_KODIKA).toContain('htmlFor=');
    });
  });
});
