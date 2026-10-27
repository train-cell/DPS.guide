import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FwnitikiKarta } from './fwnitiki-karta.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./fwnitiki-karta.tsx', import.meta.url)),
  'utf8'
);

describe('FwnitikiKarta Component (fwnitiki-karta.tsx)', () => {
  const deigmaErwtisis = 'Ποια είναι η χρονική πολυπλοκότητα της δυαδικής αναζήτησης;';
  const stoxosApantisi = 'O(log n)';
  const lexeisKleidia = ['λογαριθμικη', 'δυαδικη'];

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('αποδίδει το πλήκτρο μικροφώνου με το απαιτούμενο aria-label', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={deigmaErwtisis}
          stoxosApantisi={stoxosApantisi}
          lexeisKleidia={lexeisKleidia}
        />
      );

      expect(html).toContain('aria-label="Έναρξη φωνητικής απάντησης"');
      expect(html).toContain('data-testid="fwnitiki-mic-btn"');
      expect(html).toContain(deigmaErwtisis);
    });

    it('αποδίδει ένδειξη κατάστασης με aria-live="polite"', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={deigmaErwtisis}
          stoxosApantisi={stoxosApantisi}
          lexeisKleidia={lexeisKleidia}
        />
      );

      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('data-testid="fwnitiki-katastasi"');
    });

    it('αποδίδει badge επιτυχίας όταν η απάντηση έχει αξιολογηθεί θετικά', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={deigmaErwtisis}
          stoxosApantisi={stoxosApantisi}
          lexeisKleidia={lexeisKleidia}
          arxikiApantisi="O(log n)"
        />
      );

      expect(html).toContain('data-testid="fwnitiki-badge-epityxia"');
      expect(html).toContain('Επιτυχία');
    });

    it('αποδίδει badge λάθους όταν η απάντηση δεν επαρκεί', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={deigmaErwtisis}
          stoxosApantisi={stoxosApantisi}
          lexeisKleidia={lexeisKleidia}
          arxikiApantisi="Κάτι εντελώς άσχετο"
        />
      );

      expect(html).toContain('data-testid="fwnitiki-badge-apotyxia"');
      expect(html).toContain('Προσπάθησε ξανά');
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

    it('περιλαμβάνει ρητά aria-label στο κουμπί και aria-live="polite"', () => {
      expect(PIGI_KODIKA).toContain('aria-label="Έναρξη φωνητικής απάντησης"');
      expect(PIGI_KODIKA).toContain('aria-live="polite"');
    });
  });
});
