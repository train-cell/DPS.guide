import { describe, expect, it, vi } from 'vitest';
import type { KeyringFortoma } from '../src/mystika/keyring.js';
import { phortose_keyring, orise_keyring_gia_elegxo } from '../src/mystika/keyring.js';

/** Φορτώνει το keyring με το δοσμένο module (εναλλακτική δομή). */
async function phortose_me_modula(modula: unknown): Promise<KeyringFortoma | null> {
  vi.doMock('@napi-rs/keyring', () => modula);
  vi.resetModules();
  const mod = await import('../src/mystika/keyring.js');
  return mod.phortose_keyring();
}

describe('phortose_keyring', () => {
  it('κάνει cache το forge όταν του δωθεί', async () => {
    const fortoma = (): any => ({ apodoxi: true });
    orise_keyring_gia_elegxo(fortoma);
    expect(await phortose_keyring()).toBe(fortoma);
  });

  it('δεν έχει Entry → null', async () => {
    expect(await phortose_me_modula({})).toBeNull();
  });

  it('Entry δεν είναι function → null', async () => {
    expect(await phortose_me_modula({ Entry: 'όχι function' })).toBeNull();
  });

  it('Entry δεν είναι object → null', async () => {
    expect(await phortose_me_modula('όχι object')).toBeNull();
  });

  it('Entry δεν έχει μεθόδους → null (δεν φτάνει στην κλήση)', async () => {
    const Entry = function (): any {
      return {};
    };
    const fortoma = (await phortose_me_modula({ Entry })) as KeyringFortoma | null;
    // η δομική έλεγχος περνάει μόνο στην κλήση του fortoma
    expect(() => fortoma?.('service', 'onoma')).toThrow('Μη αναμενόμενη διεπαφή Entry');
  });

  it('εισάγει το module με δομή Entry και επιστρέφει το fortoma', async () => {
    class Entry {
      async getPassword(): Promise<string | null> {
        return 'kwdiko';
      }
      async setPassword(timi: string): Promise<void> {
        void timi;
      }
      async deleteCredential(): Promise<boolean> {
        return true;
      }
    }
    const fortoma = (await phortose_me_modula({ Entry })) as KeyringFortoma | null;
    expect(fortoma).not.toBeNull();
    if (fortoma === null) {
      throw new Error('αναμενόταν fortoma');
    }
    const eggrafi = fortoma('service', 'onoma');
    expect(await eggrafi.getPassword()).toBe('kwdiko');
  });

  it('δεν φορτώνει ξανά το module όταν έχει cache', async () => {
    const fortoma = (): any => ({ apodoxi: true });
    vi.doMock('@napi-rs/keyring', () => {
      throw new Error('δεν φορτώνεται');
    });
    vi.resetModules();
    const mod = await import('../src/mystika/keyring.js');
    // το cache ρυθμίζεται από τη νέα έκδοση του module
    mod.orise_keyring_gia_elegxo(fortoma);
    expect(await mod.phortose_keyring()).toBe(fortoma);
  });
});
