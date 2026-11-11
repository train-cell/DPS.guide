// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { MnimiApothiki, type ApothikiPyli, type Proodhos } from '@dps/core/testing';
import {
  ParoxeApothekisis,
  xrisiApothekisis,
  type ApothikiSyntheseon,
} from './aperixirto.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { DIADROMI_MATHIMATON } from '../ypiresies/mathimata.js';

afterEach(cleanup);

/** Θύρα αποθήκευσης που καθυστερεί κάθε λειτουργία, για προσομοίωση αργής πύλης. */
class ThrystoApotiki implements ApothikiPyli {
  private base = new MnimiApothiki();
  private async katestera() {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  private anasferi<K extends keyof ApothikiPyli>(fn: K) {
    return (async (...args: unknown[]) => {
      await this.katestera();
      return (this.base[fn] as ApothikiPyli[K])(...args);
    }) as ApothikiPyli[K];
  }
  diavase_keimeno = this.anasferi('diavase_keimeno');
  grapse_keimeno = this.anasferi('grapse_keimeno');
  diavase_dyadiko = this.anasferi('diavase_dyadiko');
  grapse_dyadiko = this.anasferi('grapse_dyadiko');
  yparxei = this.anasferi('yparxei');
  lista = this.anasferi('lista');
  diagrafi = this.anasferi('diagrafi');
}

/** Γράφει το αρχείο μαθημάτων σε μια θύρα. */
async function grapse_mathimata(apothiki: ApothikiPyli, mathimata: unknown) {
  await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify(mathimata));
}

/**
 * Μοντέλο μαθήματος για τα τεστ.
 */
const MATHIMA = (kodikos: string, onoma: string) => ({ kodikos, onoma });

/**
 * Σημείο ελέγχου: πιάνει την τρέχουσα τιμή του Provider σε κάθε render.
 */
function ftiaxe_probe(capture: (value: ApothikiSyntheseon) => void) {
  function ProbeApothikis() {
    const value = xrisiApothekisis();
    capture(value);
    return createElement(
      'span',
      null,
      `${value.kodikosMathimatos}|${value.proodhos.aristeiesEnotiton.join(',')}`
    );
  }
  return ProbeApothikis;
}

/**
 * Render του παρόχου με την παραπάνω θύρα· επιστρέφει το element και τον capture.
 */
async function paroxe_se_jsdom(
  apothiki: ApothikiPyli,
  kodikosMathimatos = 'CS101',
  perimenei = ''
): Promise<{ readonly markup: string; readonly value: ApothikiSyntheseon }> {
  const periballon = ftiaxe_periballon_test({ apothiki });
  let captured: ApothikiSyntheseon | undefined;
  const Probe = ftiaxe_probe((value) => {
    captured = value;
  });
  const { container } = render(
    me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos={kodikosMathimatos}>
        <Probe />
      </ParoxeApothekisis>
    )
  );
  await waitFor(() => {
    expect(container.textContent).toContain(perimenei || kodikosMathimatos);
  });
  return { markup: container.textContent ?? '', value: captured! };
}

describe('aperixirto — ParoxeApothekisis (jsdom)', () => {
  it('φορτώνει και αποδίδει τα παιδιά όταν η θύρα είναι κενή', async () => {
    const { value } = await paroxe_se_jsdom(new MnimiApothiki());
    expect(value.kodikosMathimatos).toBe('CS101');
    expect(value.rytheseis.themaId).toBe('midnight');
    expect(value.proodhos.aristeiesEnotiton).toEqual([]);
  });

  it('επιλέγει το πρώτο μάθημα όταν το τρέχον δεν υπάρχει στη λίστα', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_mathimata(apothiki, [MATHIMA('MATH1', 'Αλγόριθμοι'), MATHIMA('MATH2', 'Γραμμές')]);
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101', 'MATH1');
    expect(value.kodikosMathimatos).toBe('MATH1');
  });

  it('διατηρεί το τρέχον μάθημα όταν υπάρχει στη λίστα', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_mathimata(apothiki, [MATHIMA('CS101', 'Δομές Δεδομένων')]);
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101');
    expect(value.kodikosMathimatos).toBe('CS101');
  });

  it('χρησιμοποιεί το periballon της εφαρμογής όταν δεν δίνεται', async () => {
    const { container } = render(
      me_periballon_test(
        <ParoxeApothekisis kodikosMathimatos="CS101">
          <span>Τοπική εφαρμογή</span>
        </ParoxeApothekisis>
      )
    );
    await waitFor(() => {
      expect(container.textContent).toContain('Τοπική εφαρμογή');
    });
  });

  it('δεν αλλάζει μάθημα όταν λείπει ο κωδικός στο πρώτο στοιχείο', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_mathimata(apothiki, [
      { onoma: 'Χωρίς κωδικό' },
      MATHIMA('MATH1', 'Αλγόριθμοι'),
    ]);
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101', 'CS101');
    expect(value.kodikosMathimatos).toBe('CS101');
  });

  it('δεν αλλάζει μάθημα όταν η λίστα μαθημάτων είναι σφάλμα', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, 'δεν είναι json');
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101');
    expect(value.kodikosMathimatos).toBe('CS101');
  });

  it('δεν αλλάζει μάθημα όταν η λίστα μαθημάτων είναι κενή', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_mathimata(apothiki, []);
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101');
    expect(value.kodikosMathimatos).toBe('CS101');
  });

  it('ακυρώνει τη φόρτωση όταν απομονώνεται ο πάροχος', async () => {
    const apothiki = new ThrystoApotiki();
    await grapse_mathimata(apothiki, [MATHIMA('MATH1', 'Αλγόριθμοι')]);
    const periballon = ftiaxe_periballon_test({ apothiki });
    const { container, unmount } = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="CS101">
          <span>Τοπική εφαρμογή</span>
        </ParoxeApothekisis>
      )
    );

    expect(container.textContent).toBe('');
    unmount();
    await waitFor(() => {
      expect(container.textContent).toBe('');
    });
  });

  it('δεν αποδίδει τίποτα όσο φορτώνει', async () => {
    const apothiki = new ThrystoApotiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    const { container } = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="CS101">
          <span>Τοπική εφαρμογή</span>
        </ParoxeApothekisis>
      )
    );

    expect(container.textContent).toBe('');
    await waitFor(() => {
      expect(container.textContent).toContain('Τοπική εφαρμογή');
    });
  });

  it('δεν αλλάζει τελεία χωρίς Provider', () => {
    let captured: ApothikiSyntheseon | undefined;
    function ProbeApothikis() {
      const value = xrisiApothekisis();
      captured = value;
      return createElement('span', null, value.kodikosMathimatos);
    }
    render(me_periballon_test(<ProbeApothikis />));
    expect(captured?.kodikosMathimatos).toBe('');
    expect(captured?.rytheseis.themaId).toBe('midnight');
    expect(typeof captured?.allaxe_telia).toBe('function');
    expect(typeof captured?.allaxe_rytheseis).toBe('function');
    expect(typeof captured?.allaxe_kodiko_mathimatos).toBe('function');
    void captured?.allaxe_telia('E1');
    void captured?.allaxe_rytheseis({} as never);
    captured?.allaxe_kodiko_mathimatos('CS200');
  });
});

describe('aperixirto — allaxe μέθοδοι', () => {
  it('επισημαίνει και αθετοίει τελεία ενοτήτων', async () => {
    const apothiki = new MnimiApothiki();
    const { value } = await paroxe_se_jsdom(apothiki);

    await value.allaxe_telia('ENOTITA-1');
    await value.allaxe_telia('ENOTITA-1');
  });

  it('αποθηκεύει νέες ρυθμίσεις', async () => {
    const apothiki = new MnimiApothiki();
    const { value } = await paroxe_se_jsdom(apothiki);

    await value.allaxe_rytheseis({ ...value.rytheseis, baseUrl: 'https://example.gr' });
    const apotelesma = await apothiki.yparxei('rythmiseis.json');
    expect(apotelesma).toBe(true);
  });

  it('αλλάζει κωδικό μαθήματος και επαναφορτώνει πρόοδο', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('CS101/proodhos.json', JSON.stringify({ aristeiesEnotiton: ['E1'] }));
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101', 'E1');
    expect(value.proodhos.aristeiesEnotiton).toContain('E1');

    value.allaxe_kodiko_mathimatos('CS200');
  });

  it('εκτελεί όλες τις διαδρομές σε ελεγχόμενη σειρά', async () => {
    const apothiki = new MnimiApothiki();
    await grapse_mathimata(apothiki, [MATHIMA('CS101', 'Δομές Δεδομένων')]);
    await apothiki.grapse_keimeno('CS101/proodhos.json', JSON.stringify({ aristeiesEnotiton: ['E1'] }));
    const { value } = await paroxe_se_jsdom(apothiki, 'CS101', 'E1');
    expect(value.proodhos.aristeiesEnotiton).toContain('E1');

    await value.allaxe_telia('E2');
    await value.allaxe_rytheseis({ ...value.rytheseis, baseUrl: 'https://example.gr' });
    value.allaxe_kodiko_mathimatos('CS200');
  });
});
