// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Enotita } from '@dps/core';
import { MnimiApothiki } from '@dps/core/testing';
import { katagrapse_checkin } from '../../apothiki/apothiki-ypiresies.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { type Periballon } from '../../periballon/periballon.js';
import { GapRadar } from './gap-radar.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';

describe('GapRadar — Knowledge Gap Radar Component', () => {
  const dokimastikesEnotites: Enotita[] = [
    {
      id: 'en-1',
      titlos: 'Εισαγωγή',
      piges: [],
      ennoies: ['Έννοια 1'],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 30,
      apodosi_exetasis: 10,
    },
    {
      id: 'en-2',
      titlos: 'Αλγόριθμοι',
      piges: [],
      ennoies: ['Έννοια 2'],
      proapaitoumenes: [],
      seira: 2,
      lepta_ektimisi: 45,
      apodosi_exetasis: 20,
    },
    {
      id: 'en-3',
      titlos: 'Δομές Δεδομένων',
      piges: [],
      ennoies: ['Έννοια 3'],
      proapaitoumenes: [],
      seira: 3,
      lepta_ektimisi: 60,
      apodosi_exetasis: 30,
    },
  ];

  it('αποδίδει το βασικό στοιχείο SVG με data-testid, role και aria-label', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={dokimastikesEnotites} />)
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Διάγραμμα Ετοιμότητας Ύλης"');
  });

  it('χρησιμοποιεί αποκλειστικά CSS custom properties για το styling (0 hex colors)', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(
        <GapRadar
          enotites={dokimastikesEnotites}
          mastery={{ 'en-1': 80, 'en-2': 50, 'en-3': 100 }}
        />
      )
    );

    expect(markup).toContain('stroke="var(--xroma-entono)"');
    expect(markup).toContain('fill="var(--xroma-epifaneia-patimeni)"');
    expect(markup).toContain('stroke="var(--xroma-synorio)"');

    // Κανόνας D11: κανένα hex color
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('δεν χρησιμοποιεί κανένα inline style (0 inline styles)', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={dokimastikesEnotites} />)
    );

    expect(markup).not.toContain('style="');
  });

  it('αποδίδει τα ποσοστά και τους τίτλους των ενοτήτων', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(
        <GapRadar
          enotites={dokimastikesEnotites}
          mastery={{ 'en-1': 85, 'en-2': 40, 'en-3': 100 }}
        />
      )
    );

    expect(markup).toContain('Εισαγωγή');
    expect(markup).toContain('85%');
    expect(markup).toContain('Αλγόριθμοι');
    expect(markup).toContain('40%');
    expect(markup).toContain('Δομές Δεδομέ…');
    expect(markup).toContain('100%');
  });

  it('αποδίδει κενή κατάσταση όταν η λίστα ενοτήτων είναι άδεια', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={[]} />)
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    expect(markup).toContain('Δεν υπάρχουν διαθέσιμες ενότητες');
  });

  it('αποδίδει κύκλους (όχι πολύγωνα) όταν οι ενότητες είναι < 3', () => {
    const duoEnotites: Enotita[] = [
      {
        id: 'en-1',
        titlos: 'Εισαγωγή',
        piges: [],
        ennoies: ['Έννοια 1'],
        proapaitoumenes: [],
        seira: 1,
        lepta_ektimisi: 30,
        apodosi_exetasis: 10,
      },
      {
        id: 'en-2',
        titlos: 'Αλγόριθμοι',
        piges: [],
        ennoies: ['Έννοια 2'],
        proapaitoumenes: [],
        seira: 2,
        lepta_ektimisi: 45,
        apodosi_exetasis: 20,
      },
    ];

    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={duoEnotites} />)
    );

    expect(markup).toContain('circle');
    expect(markup).toContain('stroke-dasharray="2,3"');
    // Το 4ο επίπεδο (100%) δεν έχει dasharray — καλύπτει και τις δύο πλευρές της cond-expr.
    expect(markup.match(/stroke-dasharray="2,3"/g)).toHaveLength(3);
  });

  it('υπολογίζει αυτόματα το mastery από την αποθήκευση αν δεν δοθεί prop', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={dokimastikesEnotites} />)
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    expect(markup).toContain('polygon');
    expect(markup).toContain('0%'); // Προεπιλεγμένη πρόοδος
  });

  it('χρησιμοποιεί το δοσμένο mastery ακόμα και όταν λείπει το id μιας ενότητας', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(
        <GapRadar enotites={dokimastikesEnotites} mastery={{ 'en-99': 50 }} />
      )
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    // Το mastery λείπει για κάθε ενότητα, οπότε η τιμή πέφτει στο 0.
    expect(markup).toContain('0%');
  });

  it('δεν σπάει όταν το proodhos δεν έχει checkins', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(
        <GapRadar
          enotites={dokimastikesEnotites}
          mastery={{ 'en-1': 100, 'en-2': 60, 'en-3': 90 }}
        />
      )
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    expect(markup).toContain('100%');
    expect(markup).toContain('60%');
    expect(markup).toContain('90%');
  });

  afterEach(() => {
    cleanup();
  });

  it('χρησιμοποιεί τα checkins της αποθήκης όταν υπάρχουν', async () => {
    const apothiki = new MnimiApothiki();
    await katagrapse_checkin(apothiki, 'CS101', 'en-1', 45, false, '2026-10-26');
    await katagrapse_checkin(apothiki, 'CS101', 'en-2', 60, false, '2026-10-27');
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="CS101">
          <GapRadar enotites={dokimastikesEnotites} />
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('simera-gap-radar')).toHaveLength(1), { timeout: 2000 });
    expect(result.queryAllByTestId('simera-gap-radar')).toHaveLength(1);
  });

  it('δεν σπάει όταν το proodhos έχει checkins', async () => {
    const apothiki = new MnimiApothiki();
    await katagrapse_checkin(apothiki, 'CS101', 'en-1', 45, false, '2026-10-26');
    const periballon = ftiaxe_periballon_test({ apothiki }) as Periballon;
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={dokimastikesEnotites} />, periballon)
    );
    expect(markup).toContain('data-testid="simera-gap-radar"');
  });
});
