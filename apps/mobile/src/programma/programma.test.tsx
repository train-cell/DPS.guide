import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ftiaxe_programma } from '@dps/core';
import { PROEDAFO_TEMPLATE } from './programma-vohthia.js';
import RythmiseisProgrammatos, {
  XronodiagrammaMeletis,
  type DedomenaMathimatosMeleti,
  type DraftProgrammatos,
} from './programma.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { pseudos_xartis } from '../../test-fixtures/pseudomata/index.js';

describe('RythmiseisProgrammatos — συμβόλαιο οθόνης και χρονοδιάγραμμα', () => {
  it('εξάγει component συνάρτησης', () => {
    expect(typeof RythmiseisProgrammatos).toBe('function');
  });

  it('αποδίδει τα βασικά testids φόρμας και το τμήμα χρονοδιαγράμματος', () => {
    const markup = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>
      )
    );

    expect(markup).toContain('data-testid="programma-ekran"');
    expect(markup).toContain('data-testid="programma-exetaseis"');
    expect(markup).toContain('data-testid="programma-template"');
    expect(markup).toContain('data-testid="programma-overrides"');
    expect(markup).toContain('data-testid="programma-apothikefsi"');
    expect(markup).toContain('data-testid="programma-xronodiagramma"');
  });

  it('υπολογίζει και εμφανίζει χρονοδιάγραμμα μελέτης EDF όταν υπάρχουν συγχρονισμένα μαθήματα', () => {
    const arxikaMathimata: DedomenaMathimatosMeleti[] = [
      {
        kodikos: 'ΠΛΗ201',
        enotites: pseudos_xartis().enotites,
        checkins: [],
      },
    ];
    const arxikoDraft: DraftProgrammatos = {
      exetaseis: [
        {
          kodikos: 'ΠΛΗ201',
          imerominia: '2027-01-20',
          tropos: 'kleista_vivlia',
        },
      ],
      arxiExetastikis: '2027-01-15',
      templateLepton: PROEDAFO_TEMPLATE,
      overrides: [],
    };

    const markup = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos
            arxikaMathimata={arxikaMathimata}
            arxikoDraft={arxikoDraft}
          />
        </MemoryRouter>
      )
    );

    expect(markup).toContain('data-testid="programma-xronodiagramma"');
    expect(markup).toContain('data-testid="programma-mera"');
    expect(markup).toContain('data-testid="programma-ergasia"');
    expect(markup).toContain('Νέα ύλη');
    expect(markup).toContain('ΠΛΗ201');
    expect(markup).toContain('Βασικές αρχές και ιστορικό');
  });

  it('εμφανίζει ενημερωτική κάρτα πρότασης επιβίωσης όταν ο χρόνος είναι εξαιρετικά περιορισμένος', () => {
    const arxikaMathimata: DedomenaMathimatosMeleti[] = [
      {
        kodikos: 'ΠΛΗ201',
        enotites: pseudos_xartis().enotites,
        checkins: [],
      },
    ];
    // Εξέταση αύριο, αλλά μελέτη μόνο 1 λεπτό την ημέρα: αναγκαστικά θα προκύψει survival proposal
    const arxikoDraft: DraftProgrammatos = {
      exetaseis: [
        {
          kodikos: 'ΠΛΗ201',
          imerominia: '2026-10-27',
          tropos: 'kleista_vivlia',
        },
      ],
      arxiExetastikis: '',
      templateLepton: [
        { imera: 1, lepta: 1 },
        { imera: 2, lepta: 1 },
        { imera: 3, lepta: 1 },
        { imera: 4, lepta: 1 },
        { imera: 5, lepta: 1 },
        { imera: 6, lepta: 1 },
        { imera: 7, lepta: 1 },
      ],
      overrides: [],
    };

    const markup = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos
            arxikaMathimata={arxikaMathimata}
            arxikoDraft={arxikoDraft}
          />
        </MemoryRouter>
      )
    );

    expect(markup).toContain('data-testid="programma-xronodiagramma"');
    expect(markup).toContain('data-testid="programma-protasi-epiviosis"');
    expect(markup).toContain('Survival Mode');
  });

  it('η XronodiagrammaMeletis αποδίδει κανονικά έτοιμο Programma', () => {
    const coreApotelesma = ftiaxe_programma({
      mathimata: [
        {
          kodikos_mathimatos: 'CS101',
          enotites: [
            {
              id: 'en-1',
              titlos: 'Εισαγωγή στην πληροφορική',
              piges: [],
              ennoies: [],
              proapaitoumenes: [],
              seira: 1,
              lepta_ektimisi: 60,
              apodosi_exetasis: 10,
            },
          ],
          imerominia_exetasis: '2027-01-20',
        },
      ],
      diathesimotita: {
        ana_imera_evdomadas: [60, 60, 60, 60, 60, 60, 60],
        overrides: {},
      },
      checkins: [],
      simera: '2027-01-01',
      arxi_exetastikis: null,
    });

    expect(coreApotelesma.ok).toBe(true);
    if (!coreApotelesma.ok) return;

    const html = renderToStaticMarkup(<XronodiagrammaMeletis programma={coreApotelesma.timi} />);
    expect(html).toContain('data-testid="programma-xronodiagramma"');
    expect(html).toContain('data-testid="programma-mera"');
    expect(html).toContain('data-testid="programma-ergasia"');
    expect(html).toContain('CS101');
    expect(html).toContain('Εισαγωγή στην πληροφορική');
    expect(html).toContain('Νέα ύλη');
  });

  it('εμφανίζει σύσταση προτεραιότητας στην κάρτα πρότασης επιβίωσης όταν υπάρχει apodosi', () => {
    const enotites = pseudos_xartis().enotites.map((en, idx) => ({
      ...en,
      apodosi_exetasis: idx === 0 ? 25 : idx === 1 ? 5 : null,
    }));
    const arxikaMathimata: DedomenaMathimatosMeleti[] = [
      {
        kodikos: 'ΠΛΗ201',
        enotites,
        checkins: [],
      },
    ];
    const arxikoDraft: DraftProgrammatos = {
      exetaseis: [
        {
          kodikos: 'ΠΛΗ201',
          imerominia: '2026-10-27',
          tropos: 'kleista_vivlia',
        },
      ],
      arxiExetastikis: '',
      templateLepton: [
        { imera: 1, lepta: 1 },
        { imera: 2, lepta: 1 },
        { imera: 3, lepta: 1 },
        { imera: 4, lepta: 1 },
        { imera: 5, lepta: 1 },
        { imera: 6, lepta: 1 },
        { imera: 7, lepta: 1 },
      ],
      overrides: [],
    };

    const markup = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos
            arxikaMathimata={arxikaMathimata}
            arxikoDraft={arxikoDraft}
          />
        </MemoryRouter>
      )
    );

    expect(markup).toContain('data-testid="programma-protasi-epiviosis"');
    expect(markup).toContain('data-testid="programma-systasi-proteraiotitas"');
    expect(markup).toContain('data-testid="programma-proteraiotita-enotita"');
    expect(markup).toContain('⭐ Βασικές αρχές και ιστορικό (+25 μονάδες)');
  });

  it('εμφανίζει σύσταση προτεραιότητας μελέτης όταν υπάρχει apodosi εκτός survival mode', () => {
    const arxikaMathimata: DedomenaMathimatosMeleti[] = [
      {
        kodikos: 'ΠΛΗ201',
        enotites: pseudos_xartis().enotites,
        checkins: [],
        apodosi: { 'en-1': 30, 'en-2': 10 },
      },
    ];
    const arxikoDraft: DraftProgrammatos = {
      exetaseis: [
        {
          kodikos: 'ΠΛΗ201',
          imerominia: '2027-01-20',
          tropos: 'kleista_vivlia',
        },
      ],
      arxiExetastikis: '2027-01-15',
      templateLepton: PROEDAFO_TEMPLATE,
      overrides: [],
    };

    const markup = renderToStaticMarkup(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos
            arxikaMathimata={arxikaMathimata}
            arxikoDraft={arxikoDraft}
          />
        </MemoryRouter>
      )
    );

    expect(markup).toContain('data-testid="programma-systasi-proteraiotitas"');
    expect(markup).toContain('Σύσταση Προτεραιότητας Μελέτης');
    expect(markup).toContain('⭐ Βασικές αρχές και ιστορικό (+30 μονάδες)');
  });
});
