import { afterEach, describe, expect, it, vi } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import { fortose_apodosi, diadromi_apodosis } from './themata.js';
import { pare_tilemetria_arxeio } from '../tilemetria/tilemetria.js';

/** `JSON.parse` ρίπτει πάντα SyntaxError, οπότε η προστατευτική κλάση `String(sfalma)`
 *  δεν καλύπτεται με κανονική είσοδο. */
describe('fortose_apodosi — non-Error σφάλματα', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('καταγράφει το μήνυμα όταν το JSON.parse ρίπτει τιμή που δεν είναι Error', async () => {
    vi.stubGlobal('JSON', {
      ...JSON,
      parse: vi.fn(() => {
        throw 'όχι σφάλμα';
      }),
    } as unknown as typeof JSON);

    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_apodosis('PLH101'), '{"en-1": 15}');

    const apodosi = await fortose_apodosi(apothiki, 'PLH101');
    expect(apodosi).toEqual({});
    expect(pare_tilemetria_arxeio()).toHaveLength(1);
    expect(pare_tilemetria_arxeio()[0]?.metadedomena).toEqual({
      kodikos: '[REDACTED]',
      sfalma: expect.any(String),
    });
  });
});
