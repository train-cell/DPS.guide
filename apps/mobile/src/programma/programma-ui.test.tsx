// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import type { DedomenaMathimatosMeleti, DraftProgrammatos, Rytheseis } from '@dps/core';
import { pseudos_xartis } from '../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { MnimiApothiki } from '@dps/core/testing';
import RythmiseisProgrammatos from './programma.js';
import { PROEDAFO_TEMPLATE } from './programma-vohthia.js';

/** Κλείδωση ημερολογίου για ντετερμινιστικούς υπολογισμούς. */
function klidwsei_rologi(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T10:00:00.000Z'));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T10:00:00.000Z'));
});

/** Επιστρέφει ρυθμίσεις προγράμματος πλήρεις, για αρχική φόρτωση. */
function rytheseis_kenan(): Rytheseis {
  return {
    baseUrl: '',
    themaId: 'midnight',
    mathimataSynch: [],
    onomaMontelou: 'gemini-3.8-flash',
    paroxosLlm: 'gemini',
    urlOllama: 'http://localhost:11434',
    exeiKleidiLlm: false,
    einaiEidopoieseis: true,
    exetaseis: [],
    arxiExetastikis: null,
    templateLepton: PROEDAFO_TEMPLATE,
    overridesLepton: [],
    tropos: 'kleista_vivlia',
    yfos_exigisis: 1,
  };
}

/** Φορτώνει το αποθηκευμένο πρόγραμμα πριν την απόδοση. */
async function ekgrafe_rytheseis(apothiki: MnimiApothiki, rytheseis: Rytheseis): Promise<void> {
  await apothiki.grapse_keimeno('rythmiseis.json', JSON.stringify(rytheseis));
}

describe('RythmiseisProgrammatos — οθόνη jsdom', () => {
  it('δεν έχει draft και δείχνει το κενό πρόγραμμα', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    expect(document.querySelector('[data-testid="programma-ekran"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="programma-exetaseis"]')).not.toBeNull();
  });

  it('προσθέτει εξέταση με το κουμπί', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!);

    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);
  });

  it('αλλάζει κωδικό, ημερομηνία και τρόπο εξέτασης', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);

    const kodikos = document.querySelector('[data-testid="programma-exetasi-kodikos"]');
    if (kodikos) {
      fireEvent.change(kodikos, { target: { value: 'ΠΛΗ201' } });
      expect(kodikos.getAttribute('value')).toBe('ΠΛΗ201');
    }

    const imeradata = document.querySelector('[data-testid="programma-exetasi-imera"]')!;
    fireEvent.change(imeradata, { target: { value: '2027-01-20' } });

    const tropos = document.querySelector('[data-testid="programma-exetasi-tropos"]')!;
    fireEvent.change(tropos, { target: { value: 'kleista_vivlia' } });
  });

  it('αφαιρεί εξέταση', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);
    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-afairesi"]')!);

    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(0);
  });

  it('προσθέτει και αφαιρεί εξαίρεση', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-override-prosthesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-override"]').length).toBe(1);

    const imeradata = document.querySelector('[data-testid="programma-override-imera"]')!;
    fireEvent.change(imeradata, { target: { value: '2027-01-20' } });
    const lepta = document.querySelector('[data-testid="programma-override-lepta"]')!;
    fireEvent.change(lepta, { target: { value: '90' } });

    fireEvent.click(document.querySelector('[data-testid="programma-override-afairesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-override"]').length).toBe(0);
  });

  it('αλλάζει το εβδομαδιαίο template λεπτών', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    const lepta = document.querySelector('[data-testid="programma-template-1"]')!;
    fireEvent.change(lepta, { target: { value: '180' } });
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('720 λεπτά');
  });

  it('αλλάζει την έναρξη εξεταστικής', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    const arxi = document.querySelector('[data-testid="programma-arxi"]')!;
    fireEvent.change(arxi, { target: { value: '2027-02-01' } });
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('2027-02-01');
  });

  it('αποθηκεύει χωρίς ρυθμίσεις', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await vi.advanceTimersByTime(50);
    // `rytheseis === null` → νωρίς return, κλάση δεν πετάει
    expect(document.querySelector('[data-testid="programma-ekran"]')).not.toBeNull();
  });

  it('δείχνει σφάλμα άκυρης εξέτασης', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);

    const kodikos = document.querySelector('[data-testid="programma-exetasi-kodikos"]')!;
    fireEvent.change(kodikos, { target: { value: '' } });

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('κωδικό');
  });

  it('υπολογίζει πρόγραμμα μελέτης όταν υπάρχουν μαθήματα και εξετάσεις', async () => {
    const apothiki = new MnimiApothiki();
    const mathimata: DedomenaMathimatosMeleti[] = [
      { kodikos: 'ΠΛΗ201', enotites: pseudos_xartis().enotites, checkins: [] },
    ];
    const arxikoDraft: DraftProgrammatos = {
      exetaseis: [{ kodikos: 'ΠΛΗ201', imerominia: '2027-01-20', tropos: 'kleista_vivlia' }],
      arxiExetastikis: '2027-01-20',
      templateLepton: PROEDAFO_TEMPLATE,
      overrides: [],
    };
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos arxikaMathimata={mathimata} arxikoDraft={arxikoDraft} />
        </MemoryRouter>,
        periballon
      )
    );
    await vi.advanceTimersByTime(50);

    expect(document.querySelector('[data-testid="programma-xronodiagramma"]')).not.toBeNull();
  });

  it('εξαγωγή ημερολογίου ics', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_kenan());
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );

    const eksagoge = document.querySelector('[data-testid="programma-export-ics"]')!;
    expect(eksagoge).not.toBeNull();
    fireEvent.click(eksagoge);
    await vi.advanceTimersByTime(50);
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('Εξαγωγή…');
  });
});
