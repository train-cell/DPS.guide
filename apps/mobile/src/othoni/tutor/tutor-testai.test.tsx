// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { type ApothikiPyli, etimo, adeio, sfalma } from '@dps/core';
import { MockLlm } from '@dps/core/testing';
import {
  apodhosi_keimenou_me_parapompes,
  pagesForSection,
  loadCourseContext,
  xairetisma_tutor,
  apantisi_me_llm_i_topika,
  APANTISI_YPARXEIS_STO_YLIKO,
} from './tutor.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import TutorChat from './tutor.js';
import { MnimiApothiki } from '@dps/core/testing';

/** Δοκιμαστική ενότητα. */
function enotita(id: string, titlos: string, piges: { arxeio_id: string; apo: number; eos: number }[]): import('@dps/core').Enotita {
  return {
    id,
    titlos,
    piges,
    ennoies: [],
    proapaitoumenes: [],
    seira: 1,
    lepta_ektimisi: 30,
    apodosi_exetasis: 1,
  };
}

/** Δοκιμαστικές σελίδες. */
function selides(): import('@dps/core').Selida[] {
  return [
    { arxeio_id: 'arx-1', arithmos: 1, keimeno: 'Η στοίβα ακολουθεί LIFO.' },
    { arxeio_id: 'arx-1', arithmos: 2, keimeno: 'Οι ενέργειες push και pop.' },
  ];
}

describe('tutor — βοηθητικές συναρτήσεις', () => {
  afterEach(() => cleanup());

  it('αποδίδει το κείμενο με παραπομπές ως συνδέσμους', () => {
    const stoixeia = apodhosi_keimenou_me_parapompes('Δείτε το [[arx-1:σ.2]] και τελείωσε.');
    expect(stoixeia).toHaveLength(3);
    expect(stoixeia[0]).toBe('Δείτε το ');
    expect(stoixeia[1]).toMatchObject({ props: { 'data-testid': 'tutor-parapompi' } });
    expect(stoixeia[2]).toBe(' και τελείωσε.');
  });

  it('δεν αλλάζει κείμενο χωρίς παραπομπές', () => {
    const stoixeia = apodhosi_keimenou_me_parapompes('Μόνο κείμενο.');
    expect(stoixeia).toEqual(['Μόνο κείμενο.']);
  });


  it('δίνει χαιρετισμό για ολόκληρο το μάθημα', () => {
    expect(xairetisma_tutor(null, 'ΠΛΗ201').keimeno).toContain('ΠΛΗ201');
    expect(xairetisma_tutor(null, 'ΠΛΗ201').keimeno).toContain('το υλικό του μαθήματος');
  });

  it('δίνει χαιρετισμό για ενότητα', () => {
    expect(xairetisma_tutor(enotita('en-1', 'Βασικές', []), 'ΠΛΗ201').keimeno).toContain('την ενότητα «Βασικές»');
  });

  it('δεν δέχεται απάντηση όταν λείπει το κείμενο', async () => {
    const result = await apantisi_me_llm_i_topika('Ερώτηση', { llm: new MockLlm() } as never, 'ΠΛΗ201', null, [], '');
    expect(result.keimeno).toBe(APANTISI_YPARXEIS_STO_YLIKO);
  });

  it('δέχεται απάντηση από το μοντέλο', async () => {
    const llm = new MockLlm();
    llm.parage_keimeno = vi.fn(() => Promise.resolve({ ok: true, timi: 'Η απάντηση.' }));
    const result = await apantisi_me_llm_i_topika('Ερώτηση', { llm } as never, 'ΠΛΗ201', null, [], 'Υλικό');
    expect(result.keimeno).toBe('Η απάντηση.');
  });

  it('πετάει όταν αποτύχει το μοντέλο', async () => {
    const llm = new MockLlm();
    llm.parage_keimeno = vi.fn(() => Promise.resolve({ ok: false, sfalma: { kodikos: 'LLM_ERR', minima: 'όχι' } }));
    await expect(
      apantisi_me_llm_i_topika('Ερώτηση', { llm } as never, 'ΠΛΗ201', null, [], 'Υλικό')
    ).rejects.toThrow('όχι');
  });
});

describe('tutor — φόρτωση πλαισίου μαθήματος', () => {
  afterEach(() => cleanup());

  it('επιστρέφει όλες τις σελίδες όταν δεν υπάρχει ενότητα', () => {
    const pages = selides();
    expect(pagesForSection(pages, null)).toEqual(pages);
  });

  it('φιλτράρει τις σελίδες βάσει των ορίων της ενότητας', () => {
    const pages = selides();
    const section = enotita('en-1', 'Βασικές', [{ arxeio_id: 'arx-1', apo: 1, eos: 1 }]);
    expect(pagesForSection(pages, section)).toEqual([pages[0]]);
  });

  it('δεν περιέχει σελίδες όταν το μάθημα δεν έχει υλικό', async () => {
    const periballon = ftiaxe_periballon_test({ apothiki: new MnimiApothiki() });
    const context = await loadCourseContext(periballon, { kodikos: 'ΠΛΗ201', titlos: 'Προγραμματισμός' } as never, 'en-1');
    expect(context.pages).toEqual([]);
    expect(context.promptContext).toBe('');
    expect(context.section).toBeNull();
  });

  it('δεν κάνει fetch όταν η λίστα αρχείων αποτυγχάνει', async () => {
    const apothiki = new MnimiApothiki();
    vi.spyOn(apothiki, 'lista').mockResolvedValue({ ok: false, sfalma: { kodikos: 'MI_PROSI', minima: 'δεν υπάρχει' } } as never);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const context = await loadCourseContext(periballon, { kodikos: 'ΠΛΗ201', titlos: 'Προγραμματισμός' } as never, 'en-1');
    expect(context.pages).toEqual([]);
    expect(context.promptContext).toBe('');
  });
});

describe('tutor — οθόνη', () => {
  afterEach(() => cleanup());

  /** Η οθόνη πρέπει να φτάσει στην τελική κατάσταση πριν γίνει κάθε έλεγχος. */
  async function apoidefsi_ekran(kodikosMathimatos: string, periballon: import('../../periballon/periballon.js').PylesPeriballontos) {
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos={kodikosMathimatos}>
          <MemoryRouter initialEntries={['/tutor']}>
            <Routes>
              <Route path="/tutor" element={<TutorChat />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('tutor-ekran')).toHaveLength(1), { timeout: 2000 });
    // Η expect πετάει σφάλμα· ο waitFor επαναλαμβάνει μέχρι η οθόνη να σταθεροποιηθεί.
    await waitFor(
      () => {
        expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull();
        // Ψάχνουμε με regex γιατί το κείμενο είναι μεγαλύτερο (ακριβής αντιστοίχιση)
        expect(result.queryByText(/Έχω φορτώσει τοπικά το κείμενο/)).not.toBeNull();
      },
      { timeout: 3000 }
    );
    return result;
  }

  it('δείχνει φόρτωση ενώ φορτώνει υλικό', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([{ kodikos: 'ΠΛΗ201', titlos: 'Προγραμματισμός' }]));
    await apothiki.grapse_keimeno('ΠΛΗ201/.spoudes/xartis.json', JSON.stringify({ enotites: [] }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = await apoidefsi_ekran('ΠΛΗ201', periballon);
    expect(result.queryByText('ΠΛΗ201 · Προγραμματισμός')).not.toBeNull();
    expect(result.queryByText(/Έχω φορτώσει τοπικά το κείμενο/)).not.toBeNull();
    expect(result.queryByText('2 σελίδες από τοπικά αποθηκευμένα αρχεία')).toBeNull();
  });

  it('δεν έχει επιλεγμένο μάθημα όταν δεν υπάρχουν μαθήματα', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify([]));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/tutor']}>
            <Routes>
              <Route path="/tutor" element={<TutorChat />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(
      () => {
        expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull();
        expect(result.queryByText('Δεν έχει επιλεγεί μάθημα')).not.toBeNull();
      },
      { timeout: 3000 }
    );
    expect(result.queryByText('Δεν έχει επιλεγεί μάθημα')).not.toBeNull();
    expect(result.queryByText(/Επίλεξε ή συγχρόνισε μάθημα/)).not.toBeNull();
    expect(result.queryByText('Φόρτωση τοπικών δεδομένων')).toBeNull();
  });
});
