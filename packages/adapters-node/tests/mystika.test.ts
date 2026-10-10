import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Sfalma } from '@dps/core';
import { MnimiMystika } from '../src/mystika/mnimi-mystika.js';
import { PerivallonMystika } from '../src/mystika/perivallon-mystika.js';
import { KeyringMystika } from '../src/mystika/keyring-mystika.js';
import { orise_keyring_gia_elegxo } from '../src/mystika/keyring.js';

const KRATIMENO_MYSTIKO = 'MystikoKwdikos123';

function einai_sfalma(timi: unknown): timi is { sfalma: Sfalma } {
  return typeof timi === 'object' && timi !== null && 'sfalma' in timi;
}

async function pare_sfalma(timi: unknown): Promise<Sfalma> {
  if (!einai_sfalma(timi)) {
    throw new Error('Αναμενόταν σφάλμα');
  }
  return timi.sfalma;
}

describe('MnimiMystika', () => {
  it('round-trips a secret', async () => {
    const mystika = new MnimiMystika();
    await mystika.vale('eclass_kodikos', 'kwdikos');
    expect(await mystika.pare('eclass_kodikos')).toBe('kwdikos');
  });

  it('overwrites on vale', async () => {
    const mystika = new MnimiMystika();
    await mystika.vale('eclass_kodikos', 'prwto');
    await mystika.vale('eclass_kodikos', 'deftero');
    expect(await mystika.pare('eclass_kodikos')).toBe('deftero');
  });

  it('pare returns null after svise', async () => {
    const mystika = new MnimiMystika();
    await mystika.vale('eclass_onoma_xristi', 'fwtakis');
    await mystika.svise('eclass_onoma_xristi');
    expect(await mystika.pare('eclass_onoma_xristi')).toBeNull();
  });

  it('svise of unknown key fails with DEN_VRETHIKE', async () => {
    const mystika = new MnimiMystika();
    await expect(mystika.svise('llm_api_key')).rejects.toMatchObject({
      sfalma: { kodikos: 'DEN_VRETHIKE' },
    });
  });
});

describe('PerivallonMystika', () => {
  let arxikes_metavlites: string | undefined;

  beforeEach(() => {
    arxikes_metavlites = process.env.ECLASS_USERNAME;
    delete process.env.ECLASS_USERNAME;
    delete process.env.ECLASS_PASSWORD;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (arxikes_metavlites === undefined) {
      delete process.env.ECLASS_USERNAME;
    } else {
      process.env.ECLASS_USERNAME = arxikes_metavlites;
    }
    delete process.env.ECLASS_PASSWORD;
    delete process.env.GEMINI_API_KEY;
  });

  it('pare returns the environment value', async () => {
    process.env.ECLASS_USERNAME = 'fwtakis';
    const mystika = new PerivallonMystika();
    expect(await mystika.pare('eclass_onoma_xristi')).toBe('fwtakis');
  });

  it('pare returns null when the variable is absent', async () => {
    const mystika = new PerivallonMystika();
    expect(await mystika.pare('eclass_onoma_xristi')).toBeNull();
  });

  it('vale fails with MI_YPOSTIRIZOMENO (env is read-only)', async () => {
    const mystika = new PerivallonMystika();
    const sfalma = await pare_sfalma(await mystika.vale('eclass_onoma_xristi', 'fwtakis').catch((l: unknown) => l));
    expect(sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('svise is a documented no-op', async () => {
    const mystika = new PerivallonMystika();
    await expect(mystika.svise('eclass_kodikos')).resolves.toBeUndefined();
  });

  it('error messages never contain secret values', async () => {
    process.env.ECLASS_PASSWORD = KRATIMENO_MYSTIKO;
    const mystika = new PerivallonMystika();
    const sfalma = await pare_sfalma(await mystika.vale('eclass_kodikos', KRATIMENO_MYSTIKO).catch((l: unknown) => l));
    expect(sfalma.minima).not.toContain(KRATIMENO_MYSTIKO);
  });
});

describe('KeyringMystika fallback', () => {
  let arxikes_metavlites: string | undefined;

  beforeEach(() => {
    arxikes_metavlites = process.env.GEMINI_API_KEY;
    delete process.env.ECLASS_USERNAME;
    delete process.env.ECLASS_PASSWORD;
  });

  afterEach(() => {
    if (arxikes_metavlites === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = arxikes_metavlites;
    }
    orise_keyring_gia_elegxo(null);
  });

  it('pare falls back to env when no keyring module is installed', async () => {
    // default: no injected forge + module not installed → perivallon
    process.env.GEMINI_API_KEY = 'kleidi-apo-perivallon';
    const mystika = new KeyringMystika();
    expect(await mystika.pare('llm_api_key')).toBe('kleidi-apo-perivallon');
  });

  it('pare returns null when neither backend has the secret', async () => {
    delete process.env.GEMINI_API_KEY;
    const mystika = new KeyringMystika();
    expect(await mystika.pare('llm_api_key')).toBeNull();
  });

  it('vale fails with a Greek error when keyring is unavailable', async () => {
    const mystika = new KeyringMystika();
    const sfalma = await pare_sfalma(await mystika.vale('llm_api_key', KRATIMENO_MYSTIKO).catch((l: unknown) => l));
    expect(sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
    expect(sfalma.minima).not.toContain(KRATIMENO_MYSTIKO);
  });

  it('pare prefers the keyring over env when the forge works', async () => {
    // κοινόχρηστο store ανά (service, account) — όπως ο πραγμαικός CRT
    const apothiki = new Map<string, string | null>();
    orise_keyring_gia_elegxo((service, onoma) => {
      const kleidi = `${service}::${onoma}`;
      if (!apothiki.has(kleidi)) {
        apothiki.set(kleidi, 'mystiko-apo-keyring');
      }
      return {
        async getPassword() {
          return apothiki.get(kleidi) ?? null;
        },
        async setPassword(timi_neou: string) {
          apothiki.set(kleidi, timi_neou);
        },
        async deleteCredential() {
          const yparxe = (apothiki.get(kleidi) ?? null) !== null;
          apothiki.set(kleidi, null);
          return yparxe;
        },
      };
    });
    process.env.GEMINI_API_KEY = 'mystiko-apo-perivallon';
    const mystika = new KeyringMystika();
    expect(await mystika.pare('llm_api_key')).toBe('mystiko-apo-keyring');

    await mystika.vale('llm_api_key', 'neo-mystiko');
    expect(await mystika.pare('llm_api_key')).toBe('neo-mystiko');

    await mystika.svise('llm_api_key');
    // delete is effective: το keyring ΔΕΝ έχει πια τιμή και δεν γίνεται
    // env-fallback (το fallback ενεργοποιείται ΜΟΝΟ σε αποτυχία του keyring)
    expect(await mystika.pare('llm_api_key')).toBeNull();
  });

  it('pare falls back to env when the keyring throws (store locked)', async () => {
    orise_keyring_gia_elegxo(() => ({
      async getPassword(): Promise<string | null> {
        throw new Error('store locked');
      },
      async setPassword(): Promise<void> {},
      async deleteCredential(): Promise<boolean> {
        return false;
      },
    }));
    process.env.GEMINI_API_KEY = 'mystiko-apo-perivallon';
    const mystika = new KeyringMystika();
    expect(await mystika.pare('llm_api_key')).toBe('mystiko-apo-perivallon');
  });
});
