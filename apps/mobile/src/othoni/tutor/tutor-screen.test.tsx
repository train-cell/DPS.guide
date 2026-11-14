// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { type ApothikiPyli, etimo, sfalma } from '@dps/core';
import { MockLlm, MnimiApothiki } from '@dps/core/testing';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { write_course_gemini_opt_in } from '../../ypiresies/ai-policy.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import TutorChat from './tutor.js';
import type { PylesPeriballontos } from '../../periballon/periballon.js';
import type { Enotita, Selida } from '@dps/core';

const KODIKOS = 'ΠΛΗ201';
const MATHIMA = { kodikos: KODIKOS, titlos: 'Προγραμματισμός' };
const ENOTITA = () =>
  ({
    id: 'en-1',
    titlos: 'Βασικές',
    piges: [],
    ennoies: [],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 30,
    apodosi_exetasis: 1,
  } satisfies Enotita);

/** Δοκιμαστική σελίδα. */
function selida(arxeio_id: string, arithmos: number, keimeno: string): Selida {
  return { arxeio_id, arithmos, keimeno };
}

/** Γράφει τα αρχεία υλικού στο memory vault. */
async function grapse_yplika(apothiki: MnimiApothiki, options: { readonly xartis: 'adeio' | 'etimo'; readonly makri?: boolean } = { xartis: 'etimo' }): Promise<void> {
  await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([MATHIMA]));
  await apothiki.grapse_keimeno(
    `${KODIKOS}/.spoudes/xartis.json`,
    JSON.stringify({ enotites: options.xartis === 'etimo' ? [ENOTITA()] : [] }),
  );
  const selides: Selida[] = [selida('arx-1', 1, 'Η στοίβα ακολουθεί LIFO.'), selida('arx-1', 2, 'Οι ενέργειες push και pop.')];
  if (options.makri) {
    selides.push(selida('arx-2', 3, 'x'.repeat(30_000)));
  }
  await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-1.json`, JSON.stringify(selides));
}

/** Γράφει αποθηκευμένο ιστορικό συνομιλίας. */
async function grapse_imerologia(apothiki: MnimiApothiki, grammes: string): Promise<void> {
  await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/synomilies/656e2d31.jsonl`, grammes);
}

/** Κάνει αργή την ανάγνωση κειμένου (ελέγχει την επαναφορά κατά τη διάρκεια αναμονής). */
function xronio_apothiki(apothiki: MnimiApothiki, delay: Record<string, number> = {}): void {
  const original = apothiki.diavase_keimeno.bind(apothiki);
  vi.spyOn(apothiki, 'diavase_keimeno').mockImplementation(async (path) => {
    const delayMs = delay[path] ?? 0;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return original(path);
  });
}

/** Σχεδίαση της οθόνης μέσα στον πάροχο αποθήκευσης. */
function me_tutor(kodikosMathimatos: string, periballon: PylesPeriballontos) {
  return render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={kodikosMathimatos}>
        <MemoryRouter initialEntries={['/tutor']}>
          <Routes>
            <Route path="/tutor" element={<TutorChat />} />
          </Routes>
        </MemoryRouter>
      </ParoxeApothekisis>,
      periballon,
    ),
  );
}

/** Περιμένει την οθόνη να σταθεροποιηθεί (να τελειώσει η φόρτωση). */
async function stathero(result: ReturnType<typeof render>) {
  await waitFor(
    () => {
      expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull();
    },
    { timeout: 3000 },
  );
}

describe('tutor — φόρτωση πλαισίου μαθήματος', () => {
  afterEach(() => cleanup());

  it('δεν χρησιμοποιεί χάρτη όταν η κατάσταση του χάρτη δεν είναι έτοιμη', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki, { xartis: 'adeio' });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.section).toBeNull();
    expect(context.pages).toHaveLength(2);
  });

  it('βρίσκει την ενότητα όταν η κατάσταση του χάρτη είναι έτοιμη', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki, { xartis: 'etimo' });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.section).toEqual(ENOTITA());
    expect(context.pages).toHaveLength(2);
  });

  it('περνάει όλες τις γραμμές ανάγνωσης ακόμη και όταν μια αποτυγχάνει', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-2.json`, JSON.stringify([selida('arx-2', 1, 'Κείμενο.')]));
    vi.spyOn(apothiki, 'diavase_keimeno').mockImplementation(async (path) => {
      if (path === `${KODIKOS}/.spoudes/keimeno/arx-2.json`) {
        return sfalma<string>('DEN_VRETHIKE', 'δεν βρέθηκε');
      }
      return apothiki.diavase_keimeno(path);
    });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.pages).toHaveLength(1);
    expect(context.promptContext).toContain('arx-2');
  });

  it('παραλείπει τα χαλασμένα αρχεία κειμένου με προειδοποίηση', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-3.json`, 'όχι json');
    const apothikiSpy = vi.spyOn(apothiki, 'diavase_keimeno');
    apothikiSpy.mockImplementation(async (path) => {
      if (path.endsWith('arx-3.json')) {
        return { ok: true, timi: 'όχι json' };
      }
      return apothiki.diavase_keimeno(path);
    });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.pages).toEqual([]);
    apothikiSpy.mockRestore();
  });

  it('δεν χρησιμοποιεί JSON.parse όταν πετάει μη σφάλμα', async () => {
    const parseSpy = vi.spyOn(JSON, 'parse');
    parseSpy.mockImplementationOnce(() => {
      throw { kodikos: 'MALFORMED' };
    });
    try {
      const apothiki = new MnimiApothiki();
      await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-3.json`, 'όχι json');
      const periballon = ftiaxe_periballon_test({ apothiki });
      const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
      expect(context.pages).toEqual([]);
    } finally {
      parseSpy.mockRestore();
    }
  });

  it('δίνει έγκυρες σελίδες με όλα τα πεδία', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-1.json`, JSON.stringify([
      'όχι αντικείμενο',
      null,
      {},
      { keimeno: 'x' },
      { keimeno: 'x', arithmos: 1 },
      { keimeno: 'x', arithmos: 1, arxeio_id: 'a' },
      { keimeno: 1, arithmos: 1, arxeio_id: 'a' },
      { keimeno: 'x', arithmos: '1', arxeio_id: 'a' },
      { keimeno: 'x', arithmos: 1, arxeio_id: 1 },
      selida('arx-1', 1, 'Η στοίβα ακολουθεί LIFO.'),
    ]));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.pages).toEqual([selida('arx-1', 1, 'Η στοίβα ακολουθεί LIFO.')]);
  });

  it('δεν περιλαμβάνει σελίδες με άδειο κείμενο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/keimeno/arx-1.json`, JSON.stringify([
      selida('arx-1', 1, ''),
      selida('arx-1', 2, 'Κείμενο εδώ.'),
    ]));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.pages).toEqual([selida('arx-1', 2, 'Κείμενο εδώ.')]);
    expect(context.promptContext).toContain('arx-1');
  });

  it('σπάζει όταν ξεπερνά το μέγιστο μήκος και δεν ξεπερνάει το όριο', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki, { xartis: 'etimo', makri: true });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await (await import('./tutor.js')).loadCourseContext(periballon, MATHIMA, 'en-1');
    expect(context.pages).toHaveLength(3);
    expect(context.promptContext.length).toBeLessThan(24_000 * 2);
  });
});

describe('tutor — οθόνη χωρίς μάθημα', () => {
  afterEach(() => cleanup());

  it('δείχνει την κάρτα έλλειψης μαθήματος', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([]));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    expect(result.queryByText('Δεν έχει επιλεγεί μάθημα')).not.toBeNull();
    expect(result.queryByText(/Επίλεξε ή συγχρόνισε μάθημα/)).not.toBeNull();
    expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull();
  });

  it('στέλνει σφάλμα όταν πετάει η φόρτωση (μη σφάλμα τιμή)', async () => {
    const apothiki = new MnimiApothiki();
    vi.spyOn(apothiki, 'diavase_keimeno').mockRejectedValue('όχι σφάλμα');
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await waitFor(
      () => {
        expect(result.queryByText('Δεν φορτώθηκε το τοπικό υλικό.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('στέλνει σφάλμα όταν πετάει η φόρτωση (Error)', async () => {
    const apothiki = new MnimiApothiki();
    vi.spyOn(apothiki, 'diavase_keimeno').mockRejectedValue(new Error('Δίκτυο'));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await waitFor(
      () => {
        expect(result.queryByText('Δίκτυο')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('δεν ενημερώνει κατάσταση όταν η συνιστώσα αφαιρέθηκε (πρώτο await)', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([MATHIMA]));
    xronio_apothiki(apothiki, { 'mathimata.json': 100 });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    result.unmount();
    await waitFor(() => expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull(), { timeout: 3000 });
  });

  it('δεν ενημερώνει κατάσταση όταν η συνιστώσα αφαιρέθηκε (δεύτερο await)', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    await grapse_imerologia(apothiki, '');
    xronio_apothiki(apothiki, { [`${KODIKOS}/.spoudes/synomilies/656e2d31.jsonl`]: 100 });
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    result.unmount();
    await waitFor(() => expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull(), { timeout: 3000 });
  });
});

describe('tutor — οθόνη με μάθημα', () => {
  afterEach(() => cleanup());

  it('δείχνει χαιρετισμό όταν δεν υπάρχει αποθηκευμένο ιστορικό', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    expect(result.queryByText(/Έχω φορτώσει τοπικά το κείμενο/)).not.toBeNull();
    expect(result.queryByText('2 σελίδες από τοπικά αποθηκευμένα αρχεία')).not.toBeNull();
    expect(result.queryByText('Φόρτωση τοπικού υλικού')).toBeNull();
  });

  it('επαναφέρει το αποθηκευμένο ιστορικό', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    await grapse_imerologia(apothiki, JSON.stringify({ rolos: 'xristis', keimeno: 'Παλιά ερώτηση' }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    expect(result.queryByText('Παλιά ερώτηση')).not.toBeNull();
    expect(result.queryByText(/Έχω φορτώσει τοπικά το κείμενο/)).toBeNull();
  });

  it('δείχνει το κείμενο φόρτωσης όταν το context είναι κενό', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([MATHIMA]));
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/xartis.json`, JSON.stringify({ enotites: [] }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    expect(result.queryByText('Δεν βρέθηκε εξαγμένο κείμενο. Συγχρόνισε και εξήγαγε αρχεία του μαθήματος.')).not.toBeNull();
    expect(result.queryByText('Φόρτωση τοπικού υλικού')).toBeNull();
  });

  it('δεν στέλνει ερώτηση όταν δεν υπάρχει εξαγμένο κείμενο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([MATHIMA]));
    await apothiki.grapse_keimeno(`${KODIKOS}/.spoudes/xartis.json`, JSON.stringify({ enotites: [] }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const form = result.getByTestId('tutor-paixidi');
    fireEvent.submit(form);
    await waitFor(
      () => {
        expect(result.queryByText('Δεν υπάρχει εξαγμένο κείμενο για αυτό το μάθημα.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('στέλνει ερώτηση όταν υπάρχει εξαγμένο κείμενο', async () => {
    const llm = new MockLlm();
    llm.orise_keimeno('Καλώς ήρθατε.', 'Η απάντηση.');
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki, llm });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const input = result.getByLabelText('Ερώτηση για τον tutor');
    fireEvent.change(input, { target: { value: 'Τι λέει η πηγή;' } });
    const button = result.getByTestId('tutor-apomilosi');
    fireEvent.click(button);
    await waitFor(
      () => {
        expect(result.queryByText('Η απάντηση.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
    expect(result.queryByText('Καλώς ήρθατε.')).not.toBeNull();
  });

  it('δεν στέλνει αν είναι απενεργοποιημένο το Gemini', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const button = result.getByTestId('tutor-apomilosi');
    expect(button.getAttribute('disabled')).not.toBeNull();
  });
});

describe('tutor — επιβεβαίωση και αποστολή', () => {
  afterEach(() => cleanup());

  it('απόρριψη επιβεβαίωσης όταν δεν υπάρχει εκκρεμούσα ερώτηση', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    expect(result.queryByTestId('tutor-confirmation')).toBeNull();
  });

  it('εμφανίζει την κάρτα επιβεβαίωσης', async () => {
    const llm = new MockLlm();
    llm.orise_keimeno('Καλώς ήρθατε.', 'Η απάντηση.');
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki, llm });
    const result = me_tutor('ΠΛΗ999', periballon);
    await stathero(result);
    const input = result.getByLabelText('Ερώτηση για τον tutor');
    fireEvent.change(input, { target: { value: 'Ρωτώ κάτι.' } });
    const button = result.getByTestId('tutor-apomilosi');
    fireEvent.click(button);
    await waitFor(
      () => {
        expect(result.queryByText('Επιβεβαίωση δημιουργίας')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('επικυρώνει την επιβεβαίωση', async () => {
    const llm = new MockLlm();
    llm.orise_keimeno('Ρωτώ κάτι.', 'Η απάντηση.');
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki, llm });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const input = result.getByLabelText('Ερώτηση για τον tutor');
    fireEvent.change(input, { target: { value: 'Ρωτώ κάτι.' } });
    // Μοντέλο εκτός Gemini → ο χρήστης επιβεβαιώνει.
    const button = result.getByTestId('tutor-apomilosi');
    fireEvent.click(button);
    await waitFor(
      () => {
        expect(result.queryByText('Επιβεβαίωση δημιουργίας')).not.toBeNull();
      },
      { timeout: 3000 },
    );
    const confirm = result.getByText('Επιβεβαίωση τοπικής δημιουργίας');
    fireEvent.click(confirm);
    await waitFor(
      () => {
        expect(result.queryByText('Η απάντηση.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('ακυρώνει την επιβεβαίωση', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const input = result.getByLabelText('Ερώτηση για τον tutor');
    fireEvent.change(input, { target: { value: 'Ρωτώ κάτι.' } });
    fireEvent.click(result.getByTestId('tutor-apomilosi'));
    await waitFor(
      () => {
        expect(result.queryByText('Επιβεβαίωση δημιουργίας')).not.toBeNull();
      },
      { timeout: 3000 },
    );
    fireEvent.click(result.getByText('Ακύρωση'));
    expect(result.queryByTestId('tutor-confirmation')).toBeNull();
  });
});

describe('tutor — γραμμή οθόνης', () => {
  afterEach(() => cleanup());

  it('κάνει κλικ στο κουμπί αποστολής χωρίς να στείλει ερώτηση', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const form = result.getByTestId('tutor-paixidi');
    fireEvent.submit(form);
    expect(result.queryByText('Η απάντηση')).toBeNull();
  });

  it('ενεργοποιεί τον τσεκμποξ όταν η αποθήκευση αποτυγχάνει', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    vi.spyOn(apothiki, 'grapse_keimeno').mockResolvedValue(sfalma<void>('MI_GRAPE', 'δεν γίνεται γραφή'));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const checkbox = result.getByRole('checkbox');
    fireEvent.change(checkbox, { target: { checked: true } });
    await waitFor(
      () => {
        expect(result.queryByText('Δεν αποθηκεύτηκε η επιλογή Gemini.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('δεν στέλνει όταν το μήνυμα είναι κενό', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor(KODIKOS, periballon);
    await stathero(result);
    const form = result.getByTestId('tutor-paixidi');
    fireEvent.submit(form);
    expect(result.queryByText('Δεν υπάρχει εξαγμένο κείμενο')).toBeNull();
  });

  it('δείχνει σφάλμα when το μάθημα λείπει', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_yplika(apothiki);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = me_tutor('ΠΛΗ999', periballon);
    await stathero(result);
    const input = result.getByLabelText('Ερώτηση για τον tutor');
    fireEvent.change(input, { target: { value: 'Ρωτώ κάτι.' } });
    fireEvent.click(result.getByTestId('tutor-apomilosi'));
    await waitFor(
      () => {
        expect(result.queryByText('Επίλεξε πρώτα μάθημα.')).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });
});
