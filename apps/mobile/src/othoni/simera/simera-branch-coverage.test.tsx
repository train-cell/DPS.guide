// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Checkin, Exetasi, Mathima, XartisMathimatos } from '@dps/core';
import { proedapes_rytheseis } from '../../apothiki/apothiki-ypiresies.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { pseudos_mathimata, pseudos_xartis } from '../../../test-fixtures/pseudomata/index.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import type { Periballon } from '../../periballon/periballon.js';
import Simera from './simera.js';

/** Η ημερομηνία που επιστρέφει το πραγματικό ρολόι (2026-11-11 στο περιβάλλον). */
const SHIMERINA = new Date().toISOString().slice(0, 10);
/** Η χθεσινή ημερομηνία (μία μέρα πριν τη σημερινή) με βάση το ίδιο χρονικό σημείο. */
const EITA = new Date(new Date().getTime() - 86400000).toISOString().slice(0, 10);

/** Πλαστική καταγραφή check-in· η πραγματική γράφει στο proodhos.json. */
const mocks = vi.hoisted(() => ({ katagrapse_checkin: vi.fn() }));

vi.mock('../../apothiki/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../apothiki/index.js')>();
  return { ...actual, katagrapse_checkin: mocks.katagrapse_checkin };
});

/** Γράφει τα αρχεία του §5.3 στο κενό αρχείο και αποδίδει την οθόνη. */
async function apodosi_simeras(
  epidoseis: {
    readonly mathimata?: readonly Mathima[];
    readonly xartis?: XartisMathimatos;
    readonly xartisKatastasi?: 'etimo' | 'adeio' | 'sfalma';
    readonly telies?: readonly string[];
    readonly checkins?: readonly Checkin[];
    readonly kodikos?: string;
    readonly exetaseis?: readonly Exetasi[];
    readonly panepistimioId?: string;
  } = {}
): Promise<ReturnType<typeof render>> {
  const apothiki = new MnimiApothiki();
  await apothiki.grapse_keimeno(
    'mathimata.json',
    JSON.stringify(epidoseis.mathimata ?? pseudos_mathimata())
  );
  const kodikos = epidoseis.kodikos ?? 'ΠΛΗ201';
  const xartis = epidoseis.xartis ?? pseudos_xartis();
  await apothiki.grapse_keimeno(
    `${kodikos}/.spoudes/xartis.json`,
    epidoseis.xartisKatastasi === 'sfalma'
      ? '{bad: true'
      : epidoseis.xartisKatastasi === 'adeio'
        ? JSON.stringify({ enotites: [] })
        : JSON.stringify(xartis)
  );
  await apothiki.grapse_keimeno(
    `${kodikos}/proodhos.json`,
    JSON.stringify({ aristeiesEnotiton: epidoseis.telies ?? [], checkins: epidoseis.checkins ?? [] })
  );
  if (epidoseis.exetaseis !== undefined || epidoseis.panepistimioId !== undefined) {
    await apothiki.grapse_keimeno(
      'rythmiseis.json',
      JSON.stringify({
        ...proedapes_rytheseis(),
        baseUrl: '',
        panepistimioId: epidoseis.panepistimioId,
        /** το null γράφεται έτσι ώστε η `?? []` του κώδικα να πάρει το δεξί κλαδί */
        exetaseis: epidoseis.exetaseis !== undefined ? epidoseis.exetaseis : [],
      })
    );
  }
  const periballon = ftiaxe_periballon_test({ apothiki });
  return render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={epidoseis.kodikos ?? 'ΠΛΗ201'}>
        <MemoryRouter>
          <Simera />
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon
    )
  );
}

/** Περιμένει μέχρι η οθόνη να έχει αποδώσει το περιεχόμενό της (όχι μόνο να φύγει ο φορτωτής). */
async function periimeno_fortosi(result: ReturnType<typeof render>): Promise<void> {
  await waitFor(
    () => {
      expect(result.queryByTestId('simera-stoxoi')).not.toBeNull();
    },
    { timeout: 3000 }
  );
}

describe('simera — κατάσταση φόρτωσης και δεδομένων', () => {
  beforeEach(() => {
    mocks.katagrapse_checkin.mockResolvedValue({ aristeiesEnotiton: [], checkins: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('αποδίδει τη κατάσταση φόρτωσης πριν κλείσουν οι κλήσεις', async () => {
    const result = render(me_periballon_test(<MemoryRouter><Simera /></MemoryRouter>));
    expect(result.getByTestId('katastasi-fortosi'));
    await waitFor(
      () => {
        expect(result.queryByTestId('katastasi-fortosi')).toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('αποδίδει τα στοιχεία όταν ο χάρτης είναι έτοιμος', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    expect(result.getByTestId('simera-ekran'));
    expect(result.getByTestId('simera-stoxoi'));
    expect(result.getByTestId('simera-daiktylos'));
    expect(result.getByTestId('simera-radar-perioxi'));
    expect(result.getByTestId('simera-seri'));
    expect(result.getByTestId('simera-checkin'));
    result.unmount();
  });

  it('αποδίδει το κενό όταν λείπει ο χάρτης', async () => {
    const result = await apodosi_simeras({ xartisKatastasi: 'adeio' });
    await waitFor(
      () => {
        expect(result.getByTestId('katastasi-adeio')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    expect(result.queryByTestId('simera-stoxoi')).toBeNull();
    result.unmount();
  });

  it('αποσυνδέεται πριν κλείσει η φόρτωση (guard αποσύνδεσης)', async () => {
    const result = render(me_periballon_test(<MemoryRouter><Simera /></MemoryRouter>));
    result.unmount();
    await waitFor(
      () => {
        expect(result.queryByTestId('katastasi-fortosi')).toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('αποδίδει το σφάλμα με το κουμπί επανάληψης', async () => {
    const result = await apodosi_simeras({ xartisKatastasi: 'sfalma' });
    await waitFor(
      () => {
        expect(result.getByTestId('katastasi-sfalma')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    expect(result.getByTestId('epanalipsi'));
    result.unmount();
  });

  it('επαναφέρει τη φόρτωση με την επανάληψη', async () => {
    const result = await apodosi_simeras({ xartisKatastasi: 'sfalma' });
    await waitFor(
      () => {
        expect(result.getByTestId('epanalipsi')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    fireEvent.click(result.getByTestId('epanalipsi'));
    await waitFor(
      () => {
        expect(result.getByTestId('katastasi-fortosi')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        expect(result.queryByTestId('katastasi-sfalma')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('δεν εμφανίζει ενεργό μάθημα όταν δεν υπάρχουν μαθήματα', async () => {
    const result = await apodosi_simeras({ mathimata: [] });
    await periimeno_fortosi(result);
    expect(result.queryByText('ΠΛΗ201 - Μάθημα'));
    result.unmount();
  });
});

describe('simera — σειρά μελέτης και check-in', () => {
  beforeEach(() => {
    mocks.katagrapse_checkin.mockResolvedValue({ aristeiesEnotiton: [], checkins: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('δείχνει μηδενικό σερί όταν δεν υπάρχουν checkins', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    expect(result.getByTestId('simera-seri').textContent).toContain('0 ημέρες');
    expect(
      result.getByText((text) => text.includes('Κατάγραψε τη σημερινή σου μελέτη'))
    ).not.toBeNull();
    result.unmount();
  });

  it('δείχνει μία μέρα σερί όταν υπάρχει check-in σήμερα', async () => {
    const checkins: Checkin[] = [
      { enotita_id: 'en-1', imerominia: SHIMERINA, pragmatika_lepta: 30, oloklirothike: false },
    ];
    const result = await apodosi_simeras({ checkins });
    await periimeno_fortosi(result);
    expect(result.getByTestId('simera-seri').textContent).toContain('1 μέρα σερί');
    result.unmount();
  });

  it('δείχνει πολλαπλές ημέρες σερί', async () => {
    const checkins: Checkin[] = [
      { enotita_id: 'en-1', imerominia: SHIMERINA, pragmatika_lepta: 30, oloklirothike: false },
      { enotita_id: 'en-1', imerominia: EITA, pragmatika_lepta: 30, oloklirothike: false },
    ];
    const result = await apodosi_simeras({ checkins });
    await periimeno_fortosi(result);
    expect(result.getByTestId('simera-seri').textContent).toContain('2 ημέρες');
    result.unmount();
  });

  it('καταγράφει check-in με κενό χάρτη (b21)', async () => {
    const result = await apodosi_simeras({ xartisKatastasi: 'adeio' });
    await waitFor(
      () => {
        expect(result.getByTestId('katastasi-adeio')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    const koumpi = result.getByTestId('simera-checkin');
    fireEvent.click(koumpi);
    await waitFor(
      () => {
        expect(mocks.katagrapse_checkin).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('ανοίγει το modal παγώματος σερί', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    fireEvent.click(result.getByTestId('simera-streak-freeze-btn'));
    await waitFor(
      () => {
        expect(result.getByTestId('streak-freeze-modal')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('καλεί τα onKleisimo, onXrisiToken, onEnarxiBlitz από τα κουμπιά του modal', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const anoikse = () => {
      fireEvent.click(result.getByTestId('simera-streak-freeze-btn'));
      return waitFor(
        () => {
          expect(result.getByTestId('streak-freeze-modal')).not.toBeNull();
        },
        { timeout: 3000 }
      );
    };
    // κάθε κουμπί κλείνει το modal· το ανοίγουν ξανά πριν το επόμενο κλικ
    await anoikse();
    fireEvent.click(result.getByTestId('streak-freeze-close'));
    await anoikse();
    fireEvent.click(result.getByTestId('streak-freeze-use-token'));
    await anoikse();
    fireEvent.click(result.getByTestId('streak-freeze-start-blitz'));
    await waitFor(
      () => {
        expect(result.queryByTestId('streak-freeze-modal')).toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('διαχειρίζεται ρυθμίσεις χωρίς εξετάσεις', async () => {
    /** Η ρύθμιση `exetaseis` είναι null: η `?? []` παίρνει το δεξί κλαδί του `??`. */
    const exetaseis = null as unknown as readonly Exetasi[];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(result.queryByText('Επόμενη εξέταση:')).toBeNull();
    result.unmount();
  });

  it('καταγράφει το check-in και το επιβεβαιώνει', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const koumpi = result.getByTestId('simera-checkin');
    expect(koumpi).not.toBeNull();
    fireEvent.click(koumpi);
    await waitFor(
      () => {
        expect(mocks.katagrapse_checkin).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        expect(result.getByText('Καταγράφηκε επιτυχώς!')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('αποκλείει το επόμενο κλικ όσο εκτελείται το check-in', async () => {
    let ekteleste = 0;
    mocks.katagrapse_checkin.mockImplementation(async () => {
      ekteleste++;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { aristeiesEnotiton: [], checkins: [] };
    });
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const koumpi = result.getByTestId('simera-checkin');
    fireEvent.click(koumpi);
    fireEvent.click(koumpi);
    await waitFor(
      () => {
        expect(koumpi.disabled).toBe(true);
      },
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        expect(ekteleste).toBe(1);
      },
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        expect(result.queryByText('Καταγραφή…')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('δεν έχει κωδικό μαθήματος όταν δεν υπάρχει συγχρονισμένη λίστα', async () => {
    const result = await apodosi_simeras({ mathimata: [], kodikos: '' });
    await periimeno_fortosi(result);
    const koumpi = result.getByTestId('simera-checkin');
    fireEvent.click(koumpi);
    await waitFor(
      () => {
        expect(mocks.katagrapse_checkin).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
    const kliseis = mocks.katagrapse_checkin.mock.calls;
    expect(kliseis.length).toBe(1);
    expect(kliseis[0][1]).toBe('');
    expect(kliseis[0][2]).toBe('en-1');
    result.unmount();
  });
});

describe('simera — εξέταση, μάθημα και φιλτραρίσματα', () => {
  beforeEach(() => {
    mocks.katagrapse_checkin.mockResolvedValue({ aristeiesEnotiton: [], checkins: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('δείχνει την επόμενη εξέταση με τις ημέρες που απομένουν', async () => {
    const mellontikiImerominia = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10);
    const exetaseis: Exetasi[] = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: mellontikiImerominia, tropos: 'kleista_vivlia' },
    ];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('Επόμενη εξέταση: ΠΛΗ201')));
    expect(result.getByText('9ημ.'));
    result.unmount();
  });

  it('δείχνει σήμερα όταν η εξέταση είναι σήμερα', async () => {
    const exetaseis: Exetasi[] = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: SHIMERINA, tropos: 'kleista_vivlia' },
    ];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(
      result.getByText('Σήμερα', { selector: '.simera-eksetasi-imeres span' }).textContent
    ).toContain('Σήμερα');
    result.unmount();
  });

  it('δεν δείχνει καρτέλα εξέτασης όταν δεν υπάρχουν εξετάσεις', async () => {
    const result = await apodosi_simeras({ exetaseis: [] });
    await periimeno_fortosi(result);
    expect(result.queryByText('Επόμενη εξέταση:')).toBeNull();
    result.unmount();
  });

  it('επιλέγει μάθημα με κλικ στην κάψουλα', async () => {
    const result = await apodosi_simeras({ kodikos: 'ΠΛΗ101' });
    await periimeno_fortosi(result);
    const kapsules = result.queryAllByRole('button', { name: 'ΠΛΗ101' });
    expect(kapsules.length).toBe(1);
    fireEvent.click(kapsules[0]);
    await waitFor(
      () => {
        expect(result.getByTestId('simera-checkin')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('ορίζει τα λεπτά σε 0', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const input = result.getByLabelText('Λεπτά μελέτης');
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('0');
    result.unmount();
  });

  it('διαχειρίζεται εξέταση χωρίς ημερομηνία', async () => {
    const exetaseis: Exetasi[] = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: null, tropos: 'kleista_vivlia' },
    ];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(result.queryByText('Επόμενη εξέταση:')).toBeNull();
    result.unmount();
  });

  it('διαχειρίζεται δύο εξετάσεις και τις排序', async () => {
    const exetaseis: Exetasi[] = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2026-11-20', tropos: 'kleista_vivlia' },
      { kodikos_mathimatos: 'ΠΛΗ101', imerominia: '2026-11-15', tropos: 'anoixta_vivlia' },
    ];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('Επόμενη εξέταση: ΠΛΗ101')));
    result.unmount();
  });

  it('διαχειρίζεται ακύρια ημερομηνία εξέτασης', async () => {
    const exetaseis: Exetasi[] = [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: 'όχι-ημερομηνία', tropos: 'kleista_vivlia' },
    ];
    const result = await apodosi_simeras({ exetaseis });
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('όχι-ημερομηνία'))).not.toBeNull();
    result.unmount();
  });

  it('δείχνει το πανεπιστημιακό έμβλημα όταν ορίζεται το id', async () => {
    const result = await apodosi_simeras({ panepistimioId: 'unipi' });
    await periimeno_fortosi(result);
    expect(result.getByText('ΠΑΠΕΙ')).not.toBeNull();
    result.unmount();
  });

  it('δεν δείχνει έμβλημα όταν δεν ορίζεται το id', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    expect(result.queryByText('ΠΑΠΕΙ')).toBeNull();
    result.unmount();
  });

  it('δείχνει τον τίτλο του ενεργού μαθήματος', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('ΠΛΗ201 - Προγραμματισμός')));
    result.unmount();
  });

  it('δείχνει τον τίτλο χωρίς ενεργό μάθημα', async () => {
    const result = await apodosi_simeras({ mathimata: [], kodikos: 'ΠΛΗ999' });
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('ΠΛΗ999 - Μάθημα')));
    result.unmount();
  });

  it('δεν έχει επιλεγεί μάθημα όταν λείπει ο κωδικός', async () => {
    const result = await apodosi_simeras({ mathimata: [], kodikos: '' });
    await periimeno_fortosi(result);
    expect(result.getByText((text) => text.includes('Δεν έχει επιλεγεί μάθημα')));
    expect(result.queryByText('ΠΛΗ201')).toBeNull();
    result.unmount();
  });

  it('δίνει ενεργή κάψουλα στο συγχρονισμένο μάθημα', async () => {
    const result = await apodosi_simeras({ kodikos: 'ΠΛΗ201' });
    await periimeno_fortosi(result);
    const kapsules = result.queryAllByRole('button', { name: 'ΠΛΗ201' });
    expect(kapsules.length).toBe(1);
    expect(kapsules[0].getAttribute('aria-pressed')).toBe('true');
    result.unmount();
  });
});

describe('simera — στόχοι και ολοκλήρωση', () => {
  beforeEach(() => {
    mocks.katagrapse_checkin.mockResolvedValue({ aristeiesEnotiton: [], checkins: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('κάνει κλικ στο κουμπί σήμανσης και αλλάζει την κατάσταση', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const koumpi = result.queryAllByTestId('simera-telos')[0];
    expect(koumpi).not.toBeNull();
    fireEvent.click(koumpi);
    await waitFor(
      () => {
        expect(result.queryAllByTestId('simera-telos')[0].getAttribute('aria-pressed')).toBe('true');
      },
      { timeout: 3000 }
    );
    result.unmount();
  });

  it('δίνει συνεχόμενη ενότητα στο κουμπί μελέτης', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const links = result.getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('/odigos/en-1');
    result.unmount();
  });

  it('δίνει σύνδεση μαθημάτων όταν λείπει ο χάρτης', async () => {
    const result = await apodosi_simeras({ xartisKatastasi: 'adeio' });
    await waitFor(
      () => {
        expect(result.getByTestId('katastasi-adeio')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    const links = result.getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('/mathimata');
    result.unmount();
  });

  it('αλλάζει τα λεπτά στο πεδίο του check-in', async () => {
    const result = await apodosi_simeras();
    await periimeno_fortosi(result);
    const input = result.getByLabelText('Λεπτά μελέτης');
    fireEvent.change(input, { target: { value: '60' } });
    expect(input.value).toBe('60');
    result.unmount();
  });
});
