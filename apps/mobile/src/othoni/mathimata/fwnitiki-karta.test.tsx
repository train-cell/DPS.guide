/**
 * Tests της οθόνης φωνητικής κάρτας (κάρτα P3).
 *
 * ZERO NETWORK: τα τεστ δεν χρησιμοποιούν το Web Speech API. Η υπηρεσία
 * αντικαθίσταται με mock μέσω της prop `fwnitikiYpiresia`.
 */

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FwnitikiKarta } from './fwnitiki-karta.js';
import { type FwnitikiExetasiYpiresia } from '../../ypiresies/fwnitiki-exetasi.js';
import { type FwnitikoApotelesmaCallback, type FwnitikoSfalmaCallback } from '../../ypiresies/fwnitiki-exetasi.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const PIGI_KODIKA = readFileSync(join(ORISTO, 'fwnitiki-karta.tsx'), 'utf8');

/** Δείγμα ερώτησης και απάντησης για τις δοκιμές. */
const ERWTISI = 'Ποια είναι η χρονική πολυπλοκότητα της δυαδικής αναζήτησης;';
const STOCHOS = 'O(log n)';
const LEXEIS = ['λογαριθμικη', 'δυαδικη'];

/**
 * Μοντέλο της υπηρεσίας φωνητικής εξέτασης.
 * Το component δέχεται οποιαδήποτε υλοποίηση που ικανοποιεί τον τύπο της.
 */
function ftiaxe_mock_ypiresia(
  epiloges: {
    xekinaEpxei?: boolean;
    apotelesma?: (onApotelesma: FwnitikoApotelesmaCallback, onSfalma?: FwnitikoSfalmaCallback) => void;
    sfalma?: string;
  } = {}
): FwnitikiExetasiYpiresia {
  const stamata = vi.fn();
  const akyrwse = vi.fn();
  const ypostirizetai = () => true;
  const einaiSeAkroasi = () => false;
  const xekina = vi.fn((onApotelesma, onSfalma) => {
    if (epiloges.xekinaEpxei === false) return false;
    if (epiloges.sfalma) {
      onSfalma?.(epiloges.sfalma);
      return true;
    }
    epiloges.apotelesma?.(onApotelesma, onSfalma);
    return true;
  });
  return { stamata, xekina, akyrwse, ypostirizetai, einaiSeAkroasi } as unknown as FwnitikiExetasiYpiresia;
}

describe('FwnitikiKarta Component (fwnitiki-karta.tsx)', () => {
  afterEach(cleanup);

  describe('Λειτουργικότητα & SSR Rendering', () => {
    it('αποδίδει το πλήκτρο μικροφώνου με το απαιτούμενο aria-label', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} lexeisKleidia={LEXEIS} />
      );

      expect(html).toContain('aria-label="Έναρξη φωνητικής απάντησης"');
      expect(html).toContain('data-testid="fwnitiki-mic-btn"');
      expect(html).toContain(ERWTISI);
    });

    it('αποδίδει ένδειξη κατάστασης με aria-live="polite"', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} lexeisKleidia={LEXEIS} />
      );

      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('data-testid="fwnitiki-katastasi"');
    });

    it('αποδίδει badge επιτυχίας όταν η απάντηση έχει αξιολογηθεί θετικά', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          arxikiApantisi="O(log n)"
        />
      );

      expect(html).toContain('data-testid="fwnitiki-badge-epityxia"');
      expect(html).toContain('Επιτυχία');
    });

    it('αποδίδει badge λάθους όταν η απάντηση δεν επαρκεί', () => {
      const html = renderToStaticMarkup(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          arxikiApantisi="Κάτι εντελώς άσχετο"
        />
      );

      expect(html).toContain('data-testid="fwnitiki-badge-apotyxia"');
      expect(html).toContain('Προσπάθησε ξανά');
    });
  });

  describe('jsdom αλληλεπιδράσεις & κατάσταση', () => {
    it('φορτώνει χωρίς ennoia, σφάλμα, απάντηση ή αποτέλεσμα', () => {
      render(<FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} lexeisKleidia={LEXEIS} />);

      expect(screen.queryByText('ennoia')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-sfalma-keimeno')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-apantisi-proepiskopisi')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-apotelesmata-plaisio')).toBeNull();
      expect(screen.getByText('Εκφώνηση Απάντησης')).toBeTruthy();
      expect(screen.queryByText('Διακοπή Ακρόασης')).toBeNull();
    });

    it('δείχνει την ennoia όταν υπάρχει', () => {
      render(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} ennoia="Θεωρία" />
      );

      expect(screen.getByText('Θεωρία')).toBeTruthy();
    });

    it('εκκινεί την ακρόαση και αξιολογεί την τελική απάντηση', async () => {
      const onEpityxia = vi.fn();
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('O(log n)', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          onEpityxia={onEpityxia}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.getByTestId('fwnitiki-apantisi-proepiskopisi')).toBeTruthy();
      expect(screen.getByText('O(log n)')).toBeTruthy();
      expect(onEpityxia).toHaveBeenCalledWith(expect.anything());
      expect(screen.getByText('Διακοπή Ακρόασης')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-badge-epityxia').textContent).toContain('100%');
    });

    it('δεν δέχεται κλήση onEpityxia όταν δεν δίνεται', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('O(log n)', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.getByTestId('fwnitiki-apantisi-proepiskopisi')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-badge-epityxia').textContent).toContain('100%');
    });

    it('απορρίπτει απάντηση και καλεί onApotyxia όταν δεν υπάρχει επιτυχία', async () => {
      const onApotyxia = vi.fn();
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('Κάτι άσχετο', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          onApotyxia={onApotyxia}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.getByTestId('fwnitiki-apantisi-proepiskopisi')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-badge-apotyxia').textContent).toContain('%');
      expect(onApotyxia).toHaveBeenCalledWith(expect.anything());
    });

    it('δεν δέχεται κλήση onApotyxia όταν δεν δίνεται', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('Κάτι άσχετο', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.getByTestId('fwnitiki-apantisi-proepiskopisi')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-badge-apotyxia').textContent).toContain('%');
    });

    it('δεν ξεκινάει η ακρόαση όταν επιστρέφει false η υπηρεσία', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({ xekinaEpxei: false });
      render(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} fwnitikiYpiresia={ypiresia} />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByText('Εκφώνηση Απάντησης')).toBeTruthy();
      });
      expect(screen.queryByTestId('fwnitiki-sfalma-keimeno')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-apantisi-proepiskopisi')).toBeNull();
    });

    it('δεν καλεί την αξιολόγηση όταν η απάντηση είναι κενή', async () => {
      const onEpityxia = vi.fn();
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          onEpityxia={onEpityxia}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.queryByTestId('fwnitiki-apantisi-proepiskopisi')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-badge-epityxia')).toBeNull();
      expect(screen.queryByTestId('fwnitiki-lexeis-kleidia')).toBeNull();
      expect(onEpityxia).not.toHaveBeenCalled();
    });

    it('βρίσκει λέξεις-κλειδιά στα αποτελέσματα', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('λογαριθμικη δυαδικη', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-lexeis-kleidia')).toBeTruthy();
      });
      expect(screen.getByText('λογαριθμικη')).toBeTruthy();
      expect(screen.getByText('δυαδικη')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
        'Ακρόαση σε εξέλιξη...'
      );
    });

    it('δεν βρίσκει λέξεις-κλειδιά όταν δεν υπάρχουν', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('Κάτι άσχετο', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          fwnitikiYpiresia={ypiresia}
        />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });
      expect(screen.queryByTestId('fwnitiki-lexeis-kleidia')).toBeNull();
    });

    it('δείχνει σφάλμα όταν αποτυγχάνει η αναγνώριση', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({ sfalma: 'Δεν βρέθηκε μικρόφωνο.' });
      render(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} fwnitikiYpiresia={ypiresia} />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-sfalma-keimeno')).toBeTruthy();
      });
      expect(screen.getByText('Δεν βρέθηκε μικρόφωνο.')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
        'Ακρόαση σε εξέλιξη...'
      );
      expect(screen.getByText('Διακοπή Ακρόασης')).toBeTruthy();
    });

    it('κάνει ενδιάμεση καταγραφή χωρίς τελική αξιολόγηση', async () => {
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('Ο log', false);
        },
      });
      render(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} fwnitikiYpiresia={ypiresia} />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-apantisi-proepiskopisi')).toBeTruthy();
      });
      expect(screen.getByText('Ο log')).toBeTruthy();
      expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
        'Ακρόαση σε εξέλιξη...'
      );
      expect(screen.getByText('Διακοπή Ακρόασης')).toBeTruthy();
    });

    it('σταματά την ακρόαση και αξιολογεί την απάντηση', async () => {
      const onEpityxia = vi.fn();
      const ypiresia = ftiaxe_mock_ypiresia({
        apotelesma: (onApotelesma) => {
          onApotelesma('O(log n)', true);
        },
      });
      render(
        <FwnitikiKarta
          erwtisi={ERWTISI}
          stoxosApantisi={STOCHOS}
          lexeisKleidia={LEXEIS}
          onEpityxia={onEpityxia}
          fwnitikiYpiresia={ypiresia}
        />
      );

      // Ακρόαση σε εξέλιξη
      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });

      // Διακοπή με απάντηση
      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Επιτυχής απάντηση!'
        );
      });
      expect(screen.getByText('Εκφώνηση Απάντησης')).toBeTruthy();
      expect(onEpityxia).toHaveBeenCalled();
    });

    it('σταματά την ακρόαση χωρίς απάντηση', async () => {
      const ypiresia = ftiaxe_mock_ypiresia();
      render(
        <FwnitikiKarta erwtisi={ERWTISI} stoxosApantisi={STOCHOS} fwnitikiYpiresia={ypiresia} />
      );

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Ακρόαση σε εξέλιξη...'
        );
      });

      fireEvent.click(screen.getByTestId('fwnitiki-mic-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('fwnitiki-katastasi').textContent).toContain(
          'Η φωνητική καταγραφή σταμάτησε.'
        );
      });
      expect(screen.getByText('Εκφώνηση Απάντησης')).toBeTruthy();
      expect(screen.queryByTestId('fwnitiki-sfalma-keimeno')).toBeNull();
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
