import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ODOI, OdoiNavigisis } from './odoi.js';
import { dimiourgise_ypiresies_eidopoiseon } from '../eidopoiiseis/sindesi.js';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_ODOI = readFileSync(join(ORISTO, 'odoi.tsx'), 'utf8');

describe('odoi — χάρτης διαδρομών εφαρμογής', () => {
  it('περιλαμβάνει τη διαδρομή /eidopoiseis με ελληνικό όνομα', () => {
    const eidopoiseisOdos = ODOI.find((o) => o.diadromi === '/eidopoiseis');
    expect(eidopoiseisOdos).toBeDefined();
    expect(eidopoiseisOdos?.onoma).toBe('Ειδοποιήσεις');
  });

  it('αποδίδεται στατικά χωρίς σφάλμα με MemoryRouter', () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon();
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/eidopoiseis']}>
        <OdoiNavigisis ypiresiesEidopoiseon={ypiresies} />
      </MemoryRouter>
    );
    expect(html).toContain('eidopoiseis-ekran');
  });

  it('τηρεί τους κανόνες καθαρού TypeScript', () => {
    expect(ARXIKOS_ODOI).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS_ODOI).not.toContain('@ts-ignore');
    expect(ARXIKOS_ODOI).not.toContain('@ts-expect-error');
  });
});
