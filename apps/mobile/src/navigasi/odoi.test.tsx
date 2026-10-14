import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ODOI, OdoiNavigisis } from './odoi.js';
import EidopoiiseisRoute from '../eidopoiiseis/route.js';
import { dimiourgise_ypiresies_eidopoiseon } from '../eidopoiiseis/sindesi.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_ODOI = readFileSync(join(ORISTO, 'odoi.tsx'), 'utf8');

describe('odoi — χάρτης διαδρομών εφαρμογής', () => {
  it('περιλαμβάνει τη διαδρομή /eidopoiseis με ελληνικό όνομα', () => {
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
});
