// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, cleanup, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ODOI, OdoiNavigisis } from './odoi.js';
import EidopoiiseisRoute from '../eidopoiiseis/route.js';
import { dimiourgise_ypiresies_eidopoiseon } from '../eidopoiiseis/sindesi.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_ODOI = readFileSync(join(ORISTO, 'odoi.tsx'), 'utf8');

describe('odoi — χάρτης διαδρομών εφαρμογής', () => {
  it('περιλαμβάνει τη διορθωμένη διαδρομή /eidopoiiseis καθώς και τη συμβατή /eidopoiseis με ελληνικό όνομα', () => {
    const eidopoiiseisOdos = ODOI.find((o) => o.diadromi === '/eidopoiiseis');
    expect(eidopoiiseisOdos).toBeDefined();
    expect(eidopoiiseisOdos?.onoma).toBe('Ειδοποιήσεις');

    const eidopoiseisOdos = ODOI.find((o) => o.diadromi === '/eidopoiseis');
    expect(eidopoiseisOdos).toBeDefined();
    expect(eidopoiseisOdos?.onoma).toBe('Ειδοποιήσεις');
  });

  it('περιλαμβάνει τη διαδρομή /rythisies/ai με ελληνικό όνομα', () => {
    const aiOdos = ODOI.find((o) => o.diadromi === '/rythisies/ai');
    expect(aiOdos).toBeDefined();
    expect(aiOdos?.onoma).toBe('Ρυθμίσεις AI & Vault');
  });

  it('εμφανίζει ένδειξη φόρτωσης όσο φορτώνεται η διαδρομή', () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon();
    const html = renderToStaticMarkup(
      me_periballon_test(<MemoryRouter initialEntries={['/eidopoiseis']}>
        <OdoiNavigisis ypiresiesEidopoiseon={ypiresies} />
      </MemoryRouter>)
    );
    expect(html).toContain('Φόρτωση οθόνης');
  });

  it('η οθόνη ειδοποιήσεων αποδίδει κανονικά όταν φορτωθεί το route chunk', () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon();
    const html = renderToStaticMarkup(
      me_periballon_test(<EidopoiiseisRoute ypiresiesEidopoiseon={ypiresies} />)
    );
    expect(html).toContain('eidopoiseis-ekran');
  });

  it('τηρεί τους κανόνες καθαρού TypeScript', () => {
    expect(ARXIKOS_ODOI).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS_ODOI).not.toContain('@ts-ignore');
    expect(ARXIKOS_ODOI).not.toContain('@ts-expect-error');
  });

  it('δρομολογεί τον ArxikiDromologisi στη ρίζα και φορτώνει το τοπικό προφίλ', async () => {
    const { container, unmount } = render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/']}>
          <OdoiNavigisis />
        </MemoryRouter>
      )
    );
    await waitFor(() => expect(container.textContent).toContain('Φόρτωση τοπικού προφίλ'));
    unmount();
  });

  it('δρομολογεί το /simera όταν υπάρχει συνδεδεμένος χρήστης', async () => {
    const mystika = {
      pare: async (k: string) => (k === 'eclass_onoma_xristi' || k === 'eclass_base_url' ? 'user' : null),
      vale: async () => undefined,
      svise: async () => undefined,
    };
    const { container, unmount } = render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/']}>
          <OdoiNavigisis />
        </MemoryRouter>,
        ftiaxe_periballon_test({ mystika } as never)
      )
    );
    await waitFor(() => expect(container.textContent).toContain('Σήμερα'), { timeout: 2000 });
    unmount();
  });

  it('δρομολογεί το Proedri όταν αποτυγχάνει η ανάγνωση των μυστικών', async () => {
    const mystika = {
      pare: async () => { throw new Error('αδύνατο'); },
      vale: async () => undefined,
      svise: async () => undefined,
    };
    const { container, unmount } = render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/']}>
          <OdoiNavigisis />
        </MemoryRouter>,
        ftiaxe_periballon_test({ mystika } as never)
      )
    );
    await waitFor(() => expect(container.querySelector('[data-testid="proedri-ekran"]')).not.toBeNull(), { timeout: 2000 });
    unmount();
  });

  it('καθαρίζει την επίδραση αν απομεταφερθεί η οθόνη πριν τελειώσει η φόρτωση', async () => {
    const mystika = {
      pare: async () => { throw new Error('αδύνατο'); },
      vale: async () => undefined,
      svise: async () => undefined,
    };
    const { unmount } = render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/']}>
          <OdoiNavigisis />
        </MemoryRouter>,
        ftiaxe_periballon_test({ mystika } as never)
      )
    );
    unmount();
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  });

  it('φορτώνει κάθε διαδρομή του χάρτη', async () => {
    for (const odos of ODOI) {
      if (odos.diadromi === '/') continue;
      const { container, unmount } = render(
        me_periballon_test(
          <MemoryRouter initialEntries={[odos.diadromi]}>
            <OdoiNavigisis />
          </MemoryRouter>
        )
      );
      await waitFor(() => expect(container.innerHTML).not.toBe(''), { timeout: 2000 });
      unmount();
    }
  });

  it('καθαρίζει την επίδραση αν απομεταφερθεί η οθόνη πριν ανανέξει τη σύνδεση', async () => {
    const mystika = {
      pare: async (k: string) => (k === 'eclass_onoma_xristi' || k === 'eclass_base_url' ? 'user' : null),
      vale: async () => undefined,
      svise: async () => undefined,
    };
    const { unmount } = render(
      me_periballon_test(
        <MemoryRouter initialEntries={['/']}>
          <OdoiNavigisis />
        </MemoryRouter>,
        ftiaxe_periballon_test({ mystika } as never)
      )
    );
    unmount();
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  });
});
