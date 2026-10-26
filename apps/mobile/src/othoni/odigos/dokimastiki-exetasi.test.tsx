import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DokimastikiExetasi,
  morfopoiisi_antistrofis_metrisis,
} from './dokimastiki-exetasi.js';
import type { AutoelegchosErwtisi } from '../../ypiresies/exetasi-simulator.js';

const PIGI_KODIKA = readFileSync(
  fileURLToPath(new URL('./dokimastiki-exetasi.tsx', import.meta.url)),
  'utf8'
);

describe('DokimastikiExetasi Component (dokimastiki-exetasi.tsx)', () => {
  const deigmaErwtiseon: AutoelegchosErwtisi[] = [
    {
      erwtisi: 'Ποια είναι η χρονική πολυπλοκότητα της δυαδικής αναζήτησης;',
      apantisi: 'O(log n)',
      ennoia: 'Αλγόριθμοι Αναζήτησης',
      enotita_id: 'en-anazitisi',
      epiloges: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    },
    {
      erwtisi: 'Ποια δομή δεδομένων λειτουργεί με βάση την αρχή LIFO;',
      apantisi: 'Στοίβα (Stack)',
      ennoia: 'Δομές Δεδομένων',
      enotita_id: 'en-domes',
      epiloges: ['Ουρά (Queue)', 'Στοίβα (Stack)', 'Δέντρο (Tree)', 'Γράφος (Graph)'],
    },
  ];

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('αποδίδει το κουμπί εκκίνησης διαγωνίσματος στην αρχική κατάσταση anamoni', () => {
      const html = renderToStaticMarkup(
        <DokimastikiExetasi
          kodikosMathimatos="CS-101"
          erwtiseis={deigmaErwtiseon}
          arxikoStadio="anamoni"
        />
      );

      expect(html).toContain('data-testid="odigos-start-mock-exam"');
      expect(html).toContain('Έναρξη Προσομοίωσης');
      expect(html).toContain('CS-101');
      expect(html).toContain('Ερωτήσεις: 2');
    });

    it('αποδίδει χρονόμετρο αντίστροφης μέτρησης με role="timer" στην κατάσταση se_exelixi', () => {
      const html = renderToStaticMarkup(
        <DokimastikiExetasi
          kodikosMathimatos="CS-101"
          erwtiseis={deigmaErwtiseon}
          arxikoStadio="se_exelixi"
          deuteroleptaDiarkeias={600}
        />
      );

      expect(html).toContain('data-testid="exetasi-countdown"');
      expect(html).toContain('role="timer"');
      expect(html).toContain('10:00');
    });

    it('αποδίδει επιλογές απάντησης / radio buttons με data-testid="exetasi-epilogi" και κουμπί υποβολής', () => {
      const html = renderToStaticMarkup(
        <DokimastikiExetasi
          kodikosMathimatos="CS-101"
          erwtiseis={deigmaErwtiseon}
          arxikoStadio="se_exelixi"
        />
      );

      expect(html).toContain('data-testid="exetasi-epilogi"');
      expect(html).toContain('type="radio"');
      expect(html).toContain('data-testid="exetasi-ypovoli"');
      expect(html).toContain('Υποβολή Διαγωνίσματος');
      expect(html).toContain('O(log n)');
      expect(html).toContain('Στοίβα (Stack)');
    });

    it('αποδίδει τα αποτελέσματα με role="alert" και data-testid="exetasi-apotelesmata" στην κατάσταση olokliromeno', () => {
      const html = renderToStaticMarkup(
        <DokimastikiExetasi
          kodikosMathimatos="CS-101"
          erwtiseis={deigmaErwtiseon}
          arxikoStadio="olokliromeno"
          arxikesApantiseis={{
            1: 'O(log n)',
            2: 'Στοίβα (Stack)',
          }}
        />
      );

      expect(html).toContain('data-testid="exetasi-apotelesmata"');
      expect(html).toContain('role="alert"');
      expect(html).toContain('100%');
      expect(html).toContain('Επιτυχής Επίδοση');
      expect(html).toContain('Σωστές: 2 από 2');
      expect(html).toContain('Ανάλυση ανά Έννοια');
    });
  });

  describe('morfopoiisi_antistrofis_metrisis', () => {
    it('μορφοποιεί δευτερόλεπτα σε MM:SS με συμπλήρωση μηδενικών', () => {
      expect(morfopoiisi_antistrofis_metrisis(600)).toBe('10:00');
      expect(morfopoiisi_antistrofis_metrisis(65)).toBe('01:05');
      expect(morfopoiisi_antistrofis_metrisis(9)).toBe('00:09');
      expect(morfopoiisi_antistrofis_metrisis(0)).toBe('00:00');
      expect(morfopoiisi_antistrofis_metrisis(-5)).toBe('00:00');
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

    it('περιλαμβάνει ρητά τα a11y roles (role="timer" και role="alert")', () => {
      expect(PIGI_KODIKA).toContain('role="timer"');
      expect(PIGI_KODIKA).toContain('role="alert"');
    });
  });
});
