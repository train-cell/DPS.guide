import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { CapacitorMystikaPyli } from '../src/mystika/idiotiki-periohi.js';

const h = vi.hoisted(() => {
  const timi = new Map<string, string>();
  return { timi, sfalma_set: false, sfalma_get: false, sfalma_remove: false };
});

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    get: vi.fn(async (k: string) => {
      if (h.sfalma_get) {
        throw new Error('κλειδωμένο storage');
      }
      return h.timi.get(k) ?? null;
    }),
    set: vi.fn(async (k: string, v: string) => {
      if (h.sfalma_set) {
        throw new Error('μη διαθέσιμο storage');
      }
      h.timi.set(k, v);
    }),
    remove: vi.fn(async (k: string) => {
      if (h.sfalma_remove) {
        throw new Error('μη διαθέσιμο storage');
      }
      h.timi.delete(k);
      return true;
    }),
  },
}));

describe('CapacitorMystikaPyli', () => {
  beforeEach(() => {
    h.timi.clear();
    h.sfalma_set = false;
    h.sfalma_get = false;
    h.sfalma_remove = false;
  });

  it('κάνει round-trip μυστικού', async () => {
    const mystika = new CapacitorMystikaPyli();
    await mystika.vale('eclass_kodikos', 'kwdikos123');
    expect(await mystika.pare('eclass_kodikos')).toBe('kwdikos123');
  });

  it('pare κρυφού κλειδιού επιστρέφει null', async () => {
    const mystika = new CapacitorMystikaPyli();
    expect(await mystika.pare('llm_api_key')).toBeNull();
  });

  it('pare με σφαλμαίνων storage επιστρέφει null, ποτέ throw', async () => {
    h.sfalma_get = true;
    const mystika = new CapacitorMystikaPyli();
    expect(await mystika.pare('llm_api_key')).toBeNull();
  });

  it('pare με μη-string τιμή επιστρέφει null', async () => {
    vi.mocked(SecureStorage.get).mockImplementationOnce(async () => 42 as unknown as string);
    const mystika = new CapacitorMystikaPyli();
    expect(await mystika.pare('llm_api_key')).toBeNull();
  });

  it('vale σε αποτυχία πετάει { sfalma: MI_YPOSTIRIZOMENO } χωρίς την τιμή', async () => {
    h.sfalma_set = true;
    const mystika = new CapacitorMystikaPyli();
    await expect(mystika.vale('llm_api_key', 'kwdikos')).rejects.toEqual({
      sfalma: {
        kodikos: 'MI_YPOSTIRIZOMENO',
        minima: expect.stringContaining('llm_api_key'),
      },
    });
  });

  it('το μήνυμα του vale ΔΕΝ περιέχει το μυστικό', async () => {
    h.sfalma_set = true;
    const mystika = new CapacitorMystikaPyli();
    try {
      await mystika.vale('llm_api_key', 'ΤΟΠΙΚΟΜΥΣΤΙΚΟ');
      throw new Error('αναμενόταν αποτυχία');
    } catch (sfalma) {
      const minima = (sfalma as { sfalma: { minima: string } }).sfalma.minima;
      expect(minima).not.toContain('ΤΟΠΙΚΟΜΥΣΤΙΚΟ');
    }
  });

  it('svise είναι no-op όταν το storage αποτύχει', async () => {
    h.sfalma_remove = true;
    const mystika = new CapacitorMystikaPyli();
    await expect(mystika.svise('eclass_kodikos')).resolves.toBeUndefined();
  });

  it('svise αφαιρεί την αποθηκευμένη τιμή', async () => {
    const mystika = new CapacitorMystikaPyli();
    await mystika.vale('eclass_onoma_xristi', 'fwtakis');
    await mystika.svise('eclass_onoma_xristi');
    expect(await mystika.pare('eclass_onoma_xristi')).toBeNull();
  });
});
