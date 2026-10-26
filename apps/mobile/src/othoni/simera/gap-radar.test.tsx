import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Enotita } from '@dps/core';
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

  it('υπολογίζει αυτόματα το mastery από την αποθήκευση αν δεν δοθεί prop', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(<GapRadar enotites={dokimastikesEnotites} />)
    );

    expect(markup).toContain('data-testid="simera-gap-radar"');
    expect(markup).toContain('polygon');
    expect(markup).toContain('0%'); // Προεπιλεγμένη πρόοδος
  });
});
