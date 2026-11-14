// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ok } from '@dps/core';
import type { Arxeio, Mathima } from '@dps/core';
import { etimo } from '../../kathstasi/katastasi.js';
import { fortose_mathimata_apo_apothiki } from '../../ypiresies/index.js';
import { fortose_eurethrio } from '../../provoli-pdf/provoli-ypiresies.js';
import { me_tilemetria } from '../../tilemetria/tilemetria.js';
import { epanasygxronise_mathimata_apo_apothiki } from '../../ypiresies/syndesi-eclass.js';
import Mathimata, {
  KartaMathimatos,
  DentroArxeionMathimatos,
  ProodosSygxronismou,
  STADIA_SYGXRONISMOU,
  morfopoiise_megethos_arxeiou,
} from './mathimata.js';
import { pseudos_mathimata } from '../../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

const ORISTO_MATHIMATA = dirname(fileURLToPath(import.meta.url));
const MONI_PIGIS = join(ORISTO_MATHIMATA, 'mathimata.tsx');

/** Τυλίγει ένα στοιχείο σε MemoryRouter ώστε τα Link να αποδίδουν href. */
function apoidefsi(stoixeio: ReactElement): string {
  return renderToStaticMarkup(me_periballon_test(<MemoryRouter>{stoixeio}</MemoryRouter>));
}

/** Αντιγράφει τη διαφύγαση HTML που κάνει το renderToStaticMarkup στο κείμενο. */
function xekseki(keimeno: string): string {
  return keimeno.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

describe('mathimata — οθόνη λίστας μαθημάτων', () => {
  it('στο αρχικό render δείχνει την κατάσταση φόρτωσης του OloniKatastasis', () => {
    const html = apoidefsi(<Mathimata />);
    expect(html).toContain('data-testid="mathimata-ekran"');
    expect(html).toContain('data-testid="katastasi-fortosi"');
  });

  it('η κάρτα μαθήματος δείχνει τίτλο, κωδικό και την ετικέτα συγχρονισμένου', () => {
    const mathima = pseudos_mathimata()[0];
    expect(mathima).toBeDefined();
    if (mathima === undefined) {
      return;
    }
    const html = apoidefsi(<KartaMathimatos mathima={mathima} />);
    expect(html).toContain('data-testid="mathimata-karta"');
    expect(html).toContain('href="/xartis"');
    expect(html).toContain(mathima.kodikos);
    expect(html).toContain(xekseki(mathima.titlos));
    expect(html).toContain('Συγχρονισμένο');
  });

  it('οι υποχρεωτικές data-testid υπάρχουν στην πηγή της οθόνης', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    for (const testid of ['mathimata-ekran', 'mathimata-karta', 'mathimata-lista', 'mathimata-sygxronismos']) {
      expect(pigi).toContain(`"${testid}"`);
    }
  });

  it('η κάρτα δείχνει την ετικέτα Ενεργό όταν einaiTrexon είναι true', () => {
    const mathima = pseudos_mathimata()[0];
    expect(mathima).toBeDefined();
    if (mathima === undefined) return;
    const html = apoidefsi(<KartaMathimatos mathima={mathima} einaiTrexon={true} />);
    expect(html).toContain('Ενεργό');
  });

  it('η οθόνη χρησιμοποιεί το xrisiApothekisis και καλεί allaxe_kodiko_mathimatos', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('xrisiApothekisis');
    expect(pigi).toContain('allaxe_kodiko_mathimatos(mathima.kodikos)');
  });

  it('η οθόνη περιλαμβάνει πεδίο αναζήτησης και κάψουλες φιλτραρίσματος', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('mathimata-anazitisi-kouti');
    expect(pigi).toContain('type="search"');
    expect(pigi).toContain('kapsoules-filtra-mpara');
    expect(pigi).toContain('Συγχρονισμένα');
    expect(pigi).toContain('Εκκρεμή');
  });

  it('η morfopoiise_megethos_arxeiou μορφοποιεί σωστά bytes σε KB και MB', () => {
    expect(morfopoiise_megethos_arxeiou(null)).toBe('Άγνωστο');
    expect(morfopoiise_megethos_arxeiou(undefined)).toBe('Άγνωστο');
    expect(morfopoiise_megethos_arxeiou(512)).toBe('0.5 KB');
    expect(morfopoiise_megethos_arxeiou(1024)).toBe('1.0 KB');
    expect(morfopoiise_megethos_arxeiou(1024 * 500)).toBe('500.0 KB');
    expect(morfopoiise_megethos_arxeiou(1024 * 1024)).toBe('1.0 MB');
    expect(morfopoiise_megethos_arxeiou(1024 * 1024 * 5.5)).toBe('5.5 MB');
  });

  it('η οθόνη περιλαμβάνει Empty state CTA που οδηγεί στο /proedri', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(pigi).toContain('to="/proedri"');
    expect(pigi).toContain('mathimata-keno-cta');
    expect(pigi).toContain('Σύνδεση στο eClass');
  });

  it('το DentroArxeionMathimatos εξάγεται και χρησιμοποιεί το fortose_eurethrio', () => {
    const pigi = readFileSync(MONI_PIGIS, 'utf8');
    expect(typeof DentroArxeionMathimatos).toBe('function');
    expect(pigi).toContain('fortose_eurethrio');
    expect(pigi).toContain('/provoli/');
    expect(pigi).toContain('arxeio-pdf-link');
  });

  describe('ProodosSygxronismou — αναλυτική πρόοδος συγχρονισμού (Stream 3)', () => {
    it('περιλαμβάνει και τα τρία απαιτούμενα στάδια συγχρονισμού', () => {
      expect(STADIA_SYGXRONISMOU).toEqual([
        'Σύνδεση στο LMS & ανάκτηση λίστας μαθημάτων...',
        'Έλεγχος νέων αρχείων & λήψη...',
        'Κρυπτογράφηση & αποθήκευση στο vault...',
      ]);
    });

    it('αποδίδει το component με data-testid="mathimata-proodos-sygxronismou", progress bar και ποσοστό', () => {
      const html = renderToStaticMarkup(<ProodosSygxronismou stadio={1} pososto={33} />);
      expect(html).toContain('data-testid="mathimata-proodos-sygxronismou"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
      expect(html).toContain('33%');
      expect(html).toContain('ion-progress-bar');
      expect(html).toContain('Σύνδεση στο LMS &amp; ανάκτηση λίστας μαθημάτων...');
      expect(html).toContain('Έλεγχος νέων αρχείων &amp; λήψη...');
      expect(html).toContain('Κρυπτογράφηση &amp; αποθήκευση στο vault...');
    });

    it('αποδίδει σωστά ένδειξη ολοκλήρωσης σταδίων στο στάδιο 2 και 3', () => {
      const html2 = renderToStaticMarkup(<ProodosSygxronismou stadio={2} pososto={66} />);
      expect(html2).toContain('aria-valuenow="66"');
      expect(html2).toContain('66%');
      expect(html2).toContain('Στάδιο 2 από 3');

      const html3 = renderToStaticMarkup(<ProodosSygxronismou stadio={3} pososto={100} />);
      expect(html3).toContain('aria-valuenow="100"');
      expect(html3).toContain('100%');
      expect(html3).toContain('Στάδιο 3 από 3');
    });

    it('η πηγή της οθόνης περιλαμβάνει το testid της αναλυτικής προόδου και τα testids', () => {
      const pigi = readFileSync(MONI_PIGIS, 'utf8');
      expect(pigi).toContain('mathimata-proodos-sygxronismou');
      expect(pigi).toContain('ProodosSygxronismou');
      for (const testid of [
        'mathimata-ekran',
        'mathimata-karta',
        'mathimata-lista',
        'mathimata-sygxronismos',
        'mathimata-keno-cta',
      ]) {
        expect(pigi).toContain(`"${testid}"`);
      }
    });
  });
});

/** Πλαστικές απαντήσεις των εξωτερικών υπηρεσιών που χρησιμοποιεί η οθόνη. */
const mocks = vi.hoisted(() => ({
  fortose_mathimata_apo_apothiki: vi.fn(),
  fortose_eurethrio: vi.fn(),
  me_tilemetria: vi.fn(),
  epanasygxronise_mathimata_apo_apothiki: vi.fn(),
}));

vi.mock('../../ypiresies/index.js', () => ({
  fortose_mathimata_apo_apothiki: mocks.fortose_mathimata_apo_apothiki,
}));

vi.mock('../../provoli-pdf/provoli-ypiresies.js', () => ({
  fortose_eurethrio: mocks.fortose_eurethrio,
}));

vi.mock('../../tilemetria/tilemetria.js', () => ({
  me_tilemetria: mocks.me_tilemetria,
  katagrapse_tilemetria: vi.fn(),
}));

vi.mock('../../ypiresies/syndesi-eclass.js', () => ({
  epanasygxronise_mathimata_apo_apothiki: mocks.epanasygxronise_mathimata_apo_apothiki,
}));

/** Δείχνει την οθόνη με τα δεδομένα που επιστρέφει η πλαστική υπηρεσία. */
async function apotelesma_ergazias(apotelesma: () => Promise<unknown>) {
  mocks.fortose_mathimata_apo_apothiki.mockResolvedValue(apotelesma());
  render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
  await waitFor(
    () => expect(screen.getByTestId('mathimata-lista')),
    { timeout: 3000 }
  );
}

/** Ακέραια δεδομένα αρχείου για το DentroArxeionMathimatos. */
function pseudos_arxeio(): readonly Arxeio[] {
  return [
    {
      id: 'arx-1',
      kodikos_mathimatos: 'ΠΛΗ201',
      diadromi: 'mathima/1.pdf',
      url: 'https://thales.cs.unipi.gr/file/1',
      megethos: 1024,
      imerominia: null,
      etag: null,
      sha256: null,
      diplotypo_tou: null,
    },
  ];
}

describe('mathimata — δυναμική απόδοση με render', () => {
  beforeEach(() => {
    mocks.fortose_mathimata_apo_apothiki.mockResolvedValue(etimo(pseudos_mathimata()));
    mocks.fortose_eurethrio.mockResolvedValue({ ok: true, timi: [] });
    mocks.epanasygxronise_mathimata_apo_apothiki.mockResolvedValue(ok(pseudos_mathimata()));
    mocks.me_tilemetria.mockRejectedValue(new Error('Δεν υπάρχει πλαστική μέθοδος'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('αποδίδει την κατάσταση φόρτωσης πριν πέσει το αποτέλεσμα', () => {
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    expect(screen.getByTestId('mathimata-ekran'));
    expect(screen.getByTestId('katastasi-fortosi'));
  });

  it('αποδίδει τη λίστα με τα μαθήματα όταν η κατάσταση είναι έτοιμη', async () => {
    await apotelesma_ergazias(() => etimo(pseudos_mathimata()));
    for (const mathima of pseudos_mathimata()) {
      expect(screen.getByTestId(`mathima-kartela-${mathima.kodikos}`));
      expect(screen.getByText(mathima.titlos));
    }
    const links = screen.getAllByTestId('mathimata-karta');
    expect(links.length).toBe(4);
    expect(links[0].getAttribute('href')).toBe('/xartis');
  });

  it('αποδίδει την κενή κατάσταση όταν η λίστα είναι άδεια', async () => {
    mocks.fortose_mathimata_apo_apothiki.mockResolvedValue(etimo<readonly Mathima[]>([]));
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    await waitFor(
      () => expect(screen.getByTestId('mathimata-keno-perioxi')),
      { timeout: 3000 }
    );
    expect(screen.getByText('Δεν υπάρχουν μαθήματα'));
    const cta = screen.getByTestId('mathimata-keno-cta');
    expect(cta.getAttribute('href')).toBe('/proedri');
  });

  it('η αναζήτηση φιλτράρει κατά κωδικό, τίτλο και καθηγητή', async () => {
    await apotelesma_ergazias(() => etimo(pseudos_mathimata()));
    const input = screen.getByPlaceholderText('🔍 Αναζήτηση μαθήματος (π.χ. ΠΛΗ, Αλγόριθμοι)...');
    fireEvent.change(input, { target: { value: 'δομές' } });
    expect(screen.getByTestId('mathima-kartela-ΠΛΗ101'));
    expect(screen.queryByTestId('mathima-kartela-ΠΛΗ201')).toBeNull();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByTestId('mathima-kartela-ΠΛΗ201'));
  });

  it('οι κάψουλες φιλτραρίσματος αλλάζουν την προβολή των μαθημάτων', async () => {
    await apotelesma_ergazias(() => etimo(pseudos_mathimata()));
    fireEvent.click(screen.getByText('Συγχρονισμένα'));
    expect(screen.getByTestId('mathima-kartela-ΠΛΗ201'));
    fireEvent.click(screen.getByText('Εκκρεμή'));
    expect(screen.queryByTestId('mathima-kartela-ΠΛΗ201')).toBeNull();
    expect(screen.getByTestId('mathima-kartela-ΠΛΗ302'));
    fireEvent.click(screen.getByText(/Όλα/));
    expect(screen.getByTestId('mathima-kartela-ΠΛΗ201'));
  });

  it('δεν βρέθηκαν μαθήματα όταν η αναζήτηση δεν ταιριάζει', async () => {
    await apotelesma_ergazias(() => etimo(pseudos_mathimata()));
    fireEvent.change(screen.getByPlaceholderText('🔍 Αναζήτηση μαθήματος (π.χ. ΠΛΗ, Αλγόριθμοι)...'), {
      target: { value: 'ακατανόητος όρος' },
    });
    expect(screen.getByText('Δεν βρέθηκαν μαθήματα'));
    expect(screen.getByText('Δεν υπάρχει μάθημα που να ταιριάζει με την αναζήτηση.'));
  });

  it('η κάρτα δείχνει Εκκρεμεί όταν δεν είναι συγχρονισμένο', async () => {
    const mathima = pseudos_mathimata()[2];
    if (mathima === undefined) throw new Error('λείπει η mock λίστα');
    const html = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <KartaMathimatos mathima={mathima} />
        </MemoryRouter>
      )
    );
    expect(html).toContain('Εκκρεμεί');
    expect(html).not.toContain('Ενεργό');
  });

  it('η κάρτα καλεί το allaxe_kodiko_mathimatos στο click', async () => {
    mocks.fortose_mathimata_apo_apothiki.mockResolvedValue(etimo(pseudos_mathimata()));
    render(
      me_periballon_test(
        <MemoryRouter>
          <KartaMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    const link = screen.getByTestId('mathimata-karta');
    fireEvent.click(link);
    expect(link.getAttribute('href')).toBe('/xartis');
  });

  it('το DentroArxeionMathimatos δείχνει τα αρχεία όταν το ευρετήριο είναι έτοιμο', async () => {
    mocks.fortose_eurethrio.mockResolvedValue({ ok: true, timi: pseudos_arxeio() });
    render(
      me_periballon_test(
        <MemoryRouter>
          <DentroArxeionMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    await waitFor(
      () => expect(screen.getByTestId('arxeio-pdf-link')),
      { timeout: 3000 }
    );
    expect(screen.getByText('📄 1.pdf'));
    expect(screen.getByText('1.0 KB'));
  });

  it('το DentroArxeionMathimatos δεν αποδίδει τίποτα όταν δεν υπάρχουν αρχεία', async () => {
    mocks.fortose_eurethrio.mockResolvedValue({ ok: true, timi: [] });
    render(
      me_periballon_test(
        <MemoryRouter>
          <DentroArxeionMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    await waitFor(
      () => expect(screen.queryByTestId('mathima-dentro-arxeion-ΠΛΗ201')).toBeNull(),
      { timeout: 3000 }
    );
  });

  it('ο συγχρονισμός προχωράει στάδια μέσω του interval και ολοκληρώνεται', async () => {
    mocks.me_tilemetria.mockImplementation(async (_onoma, ektelesi) => {
      await new Promise<void>((resolve) => {
        void setTimeout(resolve, 3200);
      });
      return ektelesi();
    });
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    fireEvent.click(screen.getByText('Συγχρονισμός από LMS'));

    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 400);
    });
    expect(screen.getByTestId('proodos-pososto').textContent).toContain('35%');

    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 350);
    });
    expect(screen.getByTestId('proodos-pososto').textContent).toContain('50%');

    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 700);
    });
    expect(screen.getByTestId('proodos-pososto').textContent).toContain('80%');

    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 1400);
    });
    expect(screen.getByTestId('proodos-pososto').textContent).toContain('95%');

    await waitFor(async () => {
      expect(screen.getByText(/Ο συγχρονισμός ολοκληρώθηκε/));
    }, { timeout: 5000 });
    expect(screen.getByText(/για 4 μαθήματα/));
    // Η λίστα ανανεώθηκε από το `fortose_mathimata_apo_apothiki` μετά την επιτυχία
    for (const mathima of pseudos_mathimata()) {
      expect(screen.getByTestId(`mathima-kartela-${mathima.kodikos}`));
    }
  }, 20000);

  it('ο συγχρονισμός δείχνει σφάλμα όταν η αποστολή αποτυγχάνει', async () => {
    mocks.epanasygxronise_mathimata_apo_apothiki.mockResolvedValue({
      ok: false,
      sfalma: { kodikos: 'AUTH_APOTYXIA', minima: 'Δεν υπάρχουν στοιχεία.' },
    });
    mocks.me_tilemetria.mockImplementation(async (_onoma, ektelesi) => {
      return ektelesi();
    });
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    fireEvent.click(screen.getByText('Συγχρονισμός από LMS'));
    await waitFor(async () => {
      expect(screen.getByText(/Δεν υπάρχουν στοιχεία/));
    }, { timeout: 5000 });
    expect(screen.queryByTestId('mathimata-proodos-sygxronismou')).toBeNull();
  });

  it('ο συγχρονισμός δείχνει σφάλμα όταν η μέθοδος πετάει', async () => {
    mocks.me_tilemetria.mockRejectedValue(new Error('Δίκτυο'));
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    fireEvent.click(screen.getByText('Συγχρονισμός από LMS'));
    await waitFor(async () => {
      expect(screen.getByText('Ο συγχρονισμός απέτυχε. Έλεγξε τη σύνδεση και δοκίμασε ξανά.'));
    }, { timeout: 5000 });
  });

  it('η φωνητική εξέταση ανοίγει και κλείνει με το κουμπί', async () => {
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    const koumpi = screen.getByTestId('mathimata-toggle-voice-btn');
    expect(koumpi.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(koumpi);
    expect(koumpi.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Ποια είναι η χρονική πολυπλοκότητα της δυαδικής αναζήτησης;'));
    fireEvent.click(koumpi);
    expect(koumpi.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Ποια είναι η χρονική πολυπλοκότητα')).toBeNull();
  });

  it('οι αναλυτικές ενδείξεις προόδου είναι σωστές για κάθε στάδιο', async () => {
    const html1 = renderToStaticMarkup(<ProodosSygxronismou stadio={1} pososto={0} />);
    expect(html1).toContain('Στάδιο 1 από 3');
    expect(html1).toContain('0%');
    const html2 = renderToStaticMarkup(<ProodosSygxronismou stadio={2} pososto={150} />);
    expect(html2).toContain('Στάδιο 2 από 3');
    expect(html2).toContain('100%');
    const html3 = renderToStaticMarkup(<ProodosSygxronismou stadio={9} pososto={-10} />);
    expect(html3).toContain('Στάδιο 3 από 3');
    expect(html3).toContain('0%');
  });

  it('η οθόνη δείχνει κατάσταση σφάλματος όταν η αρχική φόρτωση αποτύχει', async () => {
    mocks.fortose_mathimata_apo_apothiki.mockRejectedValue(new Error('Δίκτυο'));
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    await waitFor(async () => {
      expect(screen.getByTestId('katastasi-sfalma'));
    }, { timeout: 5000 });
    expect(screen.getByText('Δεν ήταν δυνατή η φόρτωση των μαθημάτων από το eClass.'));
  });

  it('η επανάληψη φόρτωσης ανανεώνει τη λίστα', async () => {
    mocks.fortose_mathimata_apo_apothiki.mockRejectedValueOnce(new Error('Δίκτυο'));
    mocks.fortose_mathimata_apo_apothiki.mockResolvedValue(etimo(pseudos_mathimata()));
    render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    await waitFor(async () => {
      expect(screen.getByTestId('katastasi-sfalma'));
    }, { timeout: 5000 });
    fireEvent.click(screen.getByTestId('epanalipsi'));
    await waitFor(async () => {
      expect(screen.getByTestId('mathimata-lista'));
    }, { timeout: 5000 });
    expect(screen.getByText('Προγραμματισμός'));
  });

  it('η λίστα δεν ανανεώνεται αν η οθόνη απομακρυνθεί πριν πέσει το αποτέλεσμα', async () => {
    const { unmount } = render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    unmount();
    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 50);
    });
    expect(screen.queryByTestId('mathimata-lista')).toBeNull();
  });

  it('η λίστα δεν δείχνει σφάλμα αν η οθόνη απομακρυνθεί πριν πέσει το σφάλμα', async () => {
    mocks.fortose_mathimata_apo_apothiki.mockRejectedValue(new Error('Δίκτυο'));
    const { unmount } = render(me_periballon_test(<MemoryRouter><Mathimata /></MemoryRouter>));
    unmount();
    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 50);
    });
    expect(screen.queryByTestId('katastasi-sfalma')).toBeNull();
  });

  it('το DentroArxeionMathimatos αγνοεί το αποτέλεσμα όταν απομακρυνθεί', async () => {
    mocks.fortose_eurethrio.mockResolvedValue({ ok: true, timi: pseudos_arxeio() });
    const { unmount } = render(
      me_periballon_test(
        <MemoryRouter>
          <DentroArxeionMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    unmount();
    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 50);
    });
    expect(screen.queryByTestId('mathima-dentro-arxeion-ΠΛΗ201')).toBeNull();
  });

  it('το DentroArxeionMathimatos δεν αποδίδει αρχεία όταν το ευρετήριο αποτύχει', async () => {
    mocks.fortose_eurethrio.mockResolvedValue({
      ok: false,
      sfalma: { kodikos: 'DIKTYO', minima: 'Δεν βρέθηκαν αρχεία.' },
    });
    render(
      me_periballon_test(
        <MemoryRouter>
          <DentroArxeionMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    await waitFor(async () => {
      expect(screen.queryByTestId('mathima-dentro-arxeion-ΠΛΗ201')).toBeNull();
    }, { timeout: 5000 });
  });

  it('το DentroArxeionMathimatos χρησιμοποιεί το id όταν λείπει η διαδρομή αρχείου', async () => {
    mocks.fortose_eurethrio.mockResolvedValue({
      ok: true,
      timi: [{ ...pseudos_arxeio()[0], diadromi: '' }],
    });
    render(
      me_periballon_test(
        <MemoryRouter>
          <DentroArxeionMathimatos mathima={pseudos_mathimata()[0]} />
        </MemoryRouter>
      )
    );
    await waitFor(async () => {
      expect(screen.getByTestId('arxeio-pdf-link'));
    }, { timeout: 5000 });
    expect(screen.getByText('📄 arx-1'));
  });

  it('η πρόοδος υπολογίζει το ποσοστό από το στάδιο όταν λείπει η αναλογία', async () => {
    const html = renderToStaticMarkup(<ProodosSygxronismou stadio={2} />);
    expect(html).toContain('Στάδιο 2 από 3');
    expect(html).toContain('67%');
    const html2 = renderToStaticMarkup(<ProodosSygxronismou />);
    expect(html2).toContain('Στάδιο 1 από 3');
    const html4 = renderToStaticMarkup(<ProodosSygxronismou stadio={NaN} />);
    expect(html4).toContain('Σύνδεση στο LMS &amp; ανάκτηση λίστας μαθημάτων...');
  });

  it('η κάρτα δείχνει κωδικό και εξάμηνο όταν λείπει ο καθηγητής', async () => {
    const mathima = { ...pseudos_mathimata()[0], kathigitis: null };
    const html = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <KartaMathimatos mathima={mathima} />
        </MemoryRouter>
      )
    );
    expect(html).not.toContain('Καθ.:');
    expect(html).toContain('ΠΛΗ201');
    expect(html).toContain('1ο Εξάμηνο');
  });
});
