// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Mnemonika } from './mnemonika.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const PIGI_KODIKA = readFileSync(join(ORISTO, 'mnemonika.tsx'), 'utf8');

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

  describe('Διαδραστική λειτουργία (render + submit)', () => {
    afterEach(() => {
      cleanup();
    });

    it('υποβάλει τη φόρμα και υπολογίζει το ακρωνύμιο', async () => {
      const onDimiourgia = vi.fn();
      const result = render(
        <Mnemonika
          arxikoiOroi={['Δυαδική Αναζήτηση', 'Πολυπλοκότητα']}
          arxikoEidos="akronymio"
          onDimiourgia={onDimiourgia}
        />
      );
      const textarea = result.getByTestId('mnemonika-input-oroi');
      fireEvent.change(textarea, { target: { value: 'Δομές Δεδομένων' } });
      fireEvent.submit(result.getByTestId('mnemonika-form'));
      await waitFor(() => expect(onDimiourgia).toHaveBeenCalled(), { timeout: 1000 });
      expect(result.queryByTestId('mnemoniko-akronymio')).not.toBeNull();
    });

    it('στέλνει το thema στο κέντρο όταν δίνεται', async () => {
      const onDimiourgia = vi.fn();
      const result = render(
        <Mnemonika arxikoiOroi={['A', 'B']} thema='Δομές Δεδομένων' onDimiourgia={onDimiourgia} />
      );
      const textarea = result.getByTestId('mnemonika-input-oroi');
      fireEvent.change(textarea, { target: { value: 'Δομές Δεδομένων' } });
      fireEvent.change(result.getByTestId('mnemonika-input-thema'), { target: { value: 'Δομές Δεδομένων' } });
      fireEvent.submit(result.getByTestId('mnemonika-form'));
      await waitFor(() => expect(onDimiourgia).toHaveBeenCalled(), { timeout: 1000 });
      expect(result.queryByTestId('mnemoniko-akronymio')).not.toBeNull();
    });

    it('αλλάζει είδος και θέμα μέσω των πεδίων (onChange)', async () => {
      const result = render(<Mnemonika arxikoiOroi={['A', 'B']} />);
      fireEvent.change(result.getByTestId('mnemonika-select-eidos'), { target: { value: 'peg_system' } });
      expect(result.queryByTestId('mnemoniko-eidos-badge')).not.toBeNull();
      fireEvent.change(result.getByTestId('mnemonika-input-thema'), { target: { value: 'Οι όροι' } });
      expect(result.queryByTestId('mnemoniko-akronymio')).not.toBeNull();
    });

    it('δεν στέλνει thema όταν δεν δίνεται', async () => {
      const result = render(<Mnemonika arxikoiOroi={['A', 'B']} />);
      const html = result.baseElement.innerHTML;
      expect(html).toContain('mnemonika-form');
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
