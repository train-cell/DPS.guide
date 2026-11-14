// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import type { DedomenaMathimatosMeleti, DraftProgrammatos, Exetasi, Mathima, Rytheseis } from '@dps/core';
import { pseudos_xartis, pseudos_mathimata } from '../../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { MnimiApothiki } from '@dps/core/testing';
import RythmiseisProgrammatos from './programma.js';
import { PROEDAFO_TEMPLATE, enimerose_template, kilise_lepta, synolika_lepta_template } from './programma-vohthia.js';
import { XronodiagrammaMeletis } from './programma.js';

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
  klidwsei_rologi();
});

/** Γράφει κείμενο στη μνήμη αποθήκευσης. */
async function eggrafe_apotheiki(apothiki: MnimiApothiki, diadromi: string, keimeno: string): Promise<void> {
  await apothiki.grapse_keimeno(diadromi, keimeno);
}

/** Πλήρεις ρυθμίσεις με εξετάσεις. */
function rytheseis_με_εξετάσεις(overrides: Partial<Rytheseis> = {}): Rytheseis {
  return {
    baseUrl: '',
    themaId: 'midnight',
    mathimataSynch: [],
    onomaMontelou: 'gemini-3.8-flash',
    paroxosLlm: 'gemini',
    urlOllama: 'http://localhost:11434',
    exeiKleidiLlm: false,
    einaiEidopoieseis: true,
    exetaseis: [
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-18', tropos: 'kleista_vivlia' },
      { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-20', tropos: 'kleista_vivlia' },
    ] as unknown as Exetasi[],
    arxiExetastikis: '2027-01-15',
    templateLepton: PROEDAFO_TEMPLATE,
    overridesLepton: [{ imerominia: '2027-01-21', lepta: 90 }],
    tropos: 'kleista_vivlia',
    yfos_exigisis: 1,
    ...overrides,
  };
}

/** Μαθήματα για τη φόρτωση: ένας συγχρονισμός, μία επιλογή, μία καμία περίπτωση. */
function mathimata_εφαρμογής(): readonly Mathima[] {
  return [
    { ...pseudos_mathimata()[0]!, mathimataSynch: undefined },
    { ...pseudos_mathimata()[1]!, katastasi_sygxronismou: 'Συγχρονισμένο' },
    { ...pseudos_mathimata()[2]!, epilegmeno: true },
  ] as unknown as readonly Mathima[];
}

/** Φορτώνει το αποθηκευμένο πρόγραμμα πριν την απόδοση. */
async function ekgrafe_rytheseis(apothiki: MnimiApothiki, rytheseis: Rytheseis): Promise<void> {
  await eggrafe_apotheiki(apothiki, 'rythmiseis.json', JSON.stringify(rytheseis));
}

/** Φορτώνει τη λίστα μαθημάτων. */
async function ekgrafe_mathimata(apothiki: MnimiApothiki, mathimata: readonly Mathima[]): Promise<void> {
  await eggrafe_apotheiki(apothiki, 'mathimata.json', JSON.stringify(mathimata));
}

/** Φορτώνει τον χάρτη ενοτήτων ενός μαθήματος. */
async function ekgrafe_xarti(apothiki: MnimiApothiki, kodikos: string, xartis: unknown): Promise<void> {
  await eggrafe_apotheiki(apothiki, `${kodikos}/.spoudes/xartis.json`, JSON.stringify(xartis));
}

/** Φορτώνει την πρόοδο ενός μαθήματος. */
async function ekgrafe_proodho(apothiki: MnimiApothiki, kodikos: string, proodhos: unknown): Promise<void> {
  await eggrafe_apotheiki(apothiki, `${kodikos}/proodhos.json`, JSON.stringify(proodhos));
}

/** Φορτώνει την απόδοση ενός μαθήματος. */
async function ekgrafe_apodosi(apothiki: MnimiApothiki, kodikos: string, apodosi: unknown): Promise<void> {
  await eggrafe_apotheiki(apothiki, `${kodikos}/apodosi.json`, JSON.stringify(apodosi));
}

/** Σενάριο Α: πλήρως αποθηκευμένο πρόγραμμα, μαθήματα με όλα τα status συγχρονισμού. */
async function skenario_pilou(): Promise<{ apothiki: MnimiApothiki; periballon: unknown }> {
  const apothiki = new MnimiApothiki();
  const rytheseis_ = rytheseis_με_εξετάσεις({ mathimataSynch: ['ΠΛΗ201'] });
  await ekgrafe_rytheseis(apothiki, rytheseis_);
  await ekgrafe_mathimata(apothiki, mathimata_εφαρμογής());
  await ekgrafe_xarti(apothiki, 'ΠΛΗ201', pseudos_xartis());
  await ekgrafe_xarti(apothiki, 'ΠΛΗ101', { enotites: [] });
  await ekgrafe_xarti(apothiki, 'ΠΛΗ302', { enotites: [] });
  await ekgrafe_proodho(apothiki, 'ΠΛΗ201', { aristeiesEnotiton: [], checkins: [] });
  await ekgrafe_apodosi(apothiki, 'ΠΛΗ201', { 'en-1': 30 });
  const periballon = ftiaxe_periballon_test({ apothiki });
  return { apothiki, periballon };
}

describe('RythmiseisProgrammatos — οθόνη jsdom, πλήρης κάλυψη', () => {
  it('φορτώνει αποθηκευμένες ρυθμίσεις με εξετάσεις και εξαιρέσεις (draft_apo_rytheseis)', async () => {
    const apothiki = new MnimiApothiki();
    const rytheseis_ = rytheseis_με_εξετάσεις({
      mathimataSynch: ['ΠΛΗ201'],
      exetaseis: [
        { kodikos_mathimatos: 'ΠΛΗ201', imerominia: null, tropos: 'kleista_vivlia' },
        { kodikos_mathimatos: 'ΠΛΗ201', imerominia: '2027-01-20', tropos: 'kleista_vivlia' },
      ] as unknown as Exetasi[],
    });
    await ekgrafe_rytheseis(apothiki, rytheseis_);
    await ekgrafe_mathimata(apothiki, mathimata_εφαρμογής());
    await ekgrafe_xarti(apothiki, 'ΠΛΗ201', pseudos_xartis());
    await ekgrafe_proodho(apothiki, 'ΠΛΗ201', { aristeiesEnotiton: [], checkins: [] });
    await ekgrafe_apodosi(apothiki, 'ΠΛΗ201', { 'en-1': 30 });
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-override"]').length).toBe(1));

    // Κενή ημερομηνία εξέτασης (branch p0) και έγκυρη (branch p1).
    expect(document.querySelectorAll('[data-testid="programma-exetasi-imera"]').length).toBe(2);

    // Ημερομηνία έναρξης εξεταστικής.
    expect(document.querySelector('[data-testid="programma-arxi"]')!.getAttribute('value')).toBe('2027-01-15');

    // Σύνοψη εβδομάδας.
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('660 λεπτά');

    // Επαναφορά δεδομένων μέσω φόρτωσης.
    await waitFor(() => expect(document.querySelector('[data-testid="programma-xronodiagramma"]')).not.toBeNull());
  });

  it('δεν έχει λίστα μαθημάτων (L127 p1, L134 p1)', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(apothiki, rytheseis_με_εξετάσεις({ mathimataSynch: [] }));
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));
    // Χωρίς μαθήματα, κανένα χρονοδιάγραμμα.
    expect(document.querySelector('[data-testid="programma-mera"]')).toBeNull();
  });

  it('μαθήματα χωρίς συγχρονισμό (L134 p1, L179 p0, L198 p0, L199 p0)', async () => {
    const apothiki = new MnimiApothiki();
    await ekgrafe_rytheseis(
      apothiki,
      rytheseis_με_εξετάσεις({
        mathimataSynch: [],
        arxiExetastikis: '',
        exetaseis: [{ kodikos_mathimatos: 'ΠΛΗ201', imerominia: null, tropos: 'kleista_vivlia' } as unknown as Exetasi],
      })
    );
    await ekgrafe_mathimata(apothiki, [
      { ...pseudos_mathimata()[0]!, katastasi_sygxronismou: 'Εκκρεμεί', epilegmeno: false },
    ] as unknown as readonly Mathima[]);
    await ekgrafe_xarti(apothiki, 'ΠΛΗ201', pseudos_xartis());
    await ekgrafe_proodho(apothiki, 'ΠΛΗ201', { aristeiesEnotiton: [], checkins: [] });
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1));
    // Κανένα έγκυρο μάθημα χωρίς εξέταση, οπότε το πρόγραμμα είναι null.
    expect(document.querySelector('[data-testid="programma-mera"]')).toBeNull();
  });

  it('δεν έχει draft (arxikoDraft null)', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos arxikoDraft={null as unknown as DraftProgrammatos} />
        </MemoryRouter>,
        periballon
      )
    );
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(0);
  });

  it('αποθηκεύει έγκυρο πρόγραμμα (L258-L272)', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await waitFor(() =>
      expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('Αποθηκεύτηκε')
    );
    // Έναρξη εξεταστικής.
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('15 Ιαν 2027');
    // Έξοδος ICS.
    expect(document.querySelector('[data-testid="programma-export-ics"]')!.getAttribute('disabled')).toBeNull();
  });

  it('δείχνει σφάλμα άκυρης εξέτασης (L241-L243)', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    const kodikos = document.querySelector('[data-testid="programma-exetasi-kodikos"]')!;
    fireEvent.change(kodikos, { target: { value: '' } });

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await vi.advanceTimersByTime(50);

    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('Κάθε εξέταση χρειάζεται κωδικό');
  });

  it('δείχνει σφάλμα άκυρης έναρξης (L245-L248)', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    const arxi = document.querySelector('[data-testid="programma-arxi"]') as HTMLInputElement;
    arxi.type = 'text';
    fireEvent.change(arxi, { target: { value: '2027-13-01' } });

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await waitFor(() =>
      expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('ημερομηνία έναρξης')
    );
  });

  it('δείχνει σφάλμα άκυρης εξαίρεσης (L250-L256)', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    // Νέα εξαίρεση με κενή ημερομηνία.
    fireEvent.click(document.querySelector('[data-testid="programma-override-prosthesi"]')!);
    await vi.advanceTimersByTime(50);

    fireEvent.click(document.querySelector('[data-testid="programma-apothikefsi"]')!);
    await vi.advanceTimersByTime(50);

    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('Κάθε εξαίρεση χρειάζεται έγκυρη ημερομηνία');
  });

  it('προσθέτει και αλλάζει εξετάσεις', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    // Αφαίρεση εξέτασης.
    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-afairesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);

    // Προσθήκη εξέτασης.
    fireEvent.click(document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2);

    // Αλλαγή τρόπου.
    const tropos = document.querySelector('[data-testid="programma-exetasi-tropos"]')!;
    fireEvent.change(tropos, { target: { value: 'anoixta_vivlia' } });

    // Γρήγορη προσθήκη από τα συγχρονισμένα μαθήματα.
    const koumpi = document.querySelector('[data-testid="programma-exetasi-prosthesi"]')!;
    fireEvent.click(koumpi);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(3);
  });

  it('αλλάζει το εβδομαδιαίο template και την έναρξη', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    const lepta = document.querySelector('[data-testid="programma-template-1"]')!;
    fireEvent.change(lepta, { target: { value: '180' } });
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('720 λεπτά');

    const arxi = document.querySelector('[data-testid="programma-arxi"]')!;
    fireEvent.change(arxi, { target: { value: '2027-02-01' } });
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('2027-02-01');
  });

  it('αλλάζει εξαίρεση (ημερομηνία και λεπτά)', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-override"]').length).toBe(1));

    const imera = document.querySelector('[data-testid="programma-override-imera"]')!;
    fireEvent.change(imera, { target: { value: '2027-01-22' } });

    const lepta = document.querySelector('[data-testid="programma-override-lepta"]')!;
    fireEvent.change(lepta, { target: { value: '120' } });

    fireEvent.click(document.querySelector('[data-testid="programma-override-afairesi"]')!);
    await vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('[data-testid="programma-override"]').length).toBe(0);
  });

  it('εξαγωγή ημερολογίου ics', async () => {
    const { apothiki, periballon } = await skenario_pilou();
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(2));

    const eksagoge = document.querySelector('[data-testid="programma-export-ics"]')!;
    expect(eksagoge).not.toBeNull();
    fireEvent.click(eksagoge);
    await vi.advanceTimersByTime(50);
    expect(document.querySelector('[data-testid="programma-ekran"]')!.innerHTML).toContain('Εξαγωγή…');
  });

  it('απόδοση XronodiagrammaMeletis με κενό πρόγραμμα', () => {
    const html = renderToStaticMarkup(
      <XronodiagrammaMeletis programma={null} />
    );
    expect(html).toContain('Δεν υπάρχουν προγραμματισμένες εργασίες');
  });

  it('απόδοση XronodiagrammaMeletis με κενές ημέρες', () => {
    const html = renderToStaticMarkup(
      <XronodiagrammaMeletis programma={{ meres: [], slack_ana_mathima: {}, protasi_epiviosis: [] }} />
    );
    expect(html).toContain('Δεν υπάρχουν προγραμματισμένες εργασίες');
  });

  it('απόδοση XronodiagrammaMeletis με survival proposal', () => {
    const html = renderToStaticMarkup(
      <XronodiagrammaMeletis
        programma={{
          meres: [{ imerominia: '2027-01-20', ergasies: [{ eidos: 'nea_yli', kodikos_mathimatos: 'ΠΛΗ201', enotita_id: 'en-1', titlos: 'Βασικές αρχές', lepta: 60 }] }],
          slack_ana_mathima: { 'ΠΛΗ201': -10 },
          protasi_epiviosis: [
            {
              kodikos_mathimatos: 'ΠΛΗ201',
              ypopshfies: [
                { enotita_id: 'en-1', titlos: 'Βασικές αρχές', apodosi_exetasis: 25, lepta: 45 },
                { enotita_id: 'en-2', titlos: 'Μεταβλητές', apodosi_exetasis: 5, lepta: 30 },
              ],
            },
          ],
        }}
        mathimata={[]}
      />
    );
    expect(html).toContain('data-testid="programma-protasi-epiviosis"');
    expect(html).toContain('data-testid="programma-systasi-proteraiotitas"');
    expect(html).toContain('data-testid="programma-proteraiotita-enotita"');
    expect(html).toContain('⭐ Βασικές αρχές (+25 μονάδες)');
  });

  it('απόδοση XronodiagrammaMeletis με σύσταση προτεραιότητας', () => {
    const html = renderToStaticMarkup(
      <XronodiagrammaMeletis
        programma={{
          meres: [{ imerominia: '2027-01-20', ergasies: [{ eidos: 'nea_yli', kodikos_mathimatos: 'ΠΛΗ201', enotita_id: 'en-1', titlos: 'Βασικές αρχές', lepta: 60 }] }],
          slack_ana_mathima: { 'ΠΛΗ201': 10 },
          protasi_epiviosis: [],
        }}
        mathimata={[
          {
            kodikos: 'ΠΛΗ201',
            enotites: [
              { id: 'en-1', titlos: 'Βασικές αρχές', piges: [], ennoies: [], proapaitoumenes: [], seira: 1, lepta_ektimisi: 60, apodosi_exetasis: 30 },
              { id: 'en-2', titlos: 'Μεταβλητές', piges: [], ennoies: [], proapaitoumenes: [], seira: 2, lepta_ektimisi: 60, apodosi_exetasis: null },
            ],
            checkins: [],
            apodosi: { 'en-1': 30 },
          },
        ]}
      />
    );
    expect(html).toContain('data-testid="programma-systasi-proteraiotitas"');
    expect(html).toContain('⭐ Βασικές αρχές (+30 μονάδες)');
  });
});
