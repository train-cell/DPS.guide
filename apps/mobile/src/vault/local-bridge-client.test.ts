import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getLocalBridgeToken, isLocalBridgePaired, pairLocalBridge } from './local-bridge-client.js';

const VALID_CODE = 'A1B2C3D4E5F60718';

function fakeFetch(response: Record<string, unknown> | string, status = 200): void {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: status < 400,
    status,
    json: async () => response,
  })));
}

describe('local-bridge-client.ts', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('δεν έχει συνδεθεί initially', () => {
    expect(isLocalBridgePaired()).toBe(false);
    expect(getLocalBridgeToken()).toBe(null);
  });

  it('απορρίπτει κωδικό χωρίς 16 δεκαεξαδικούς χαρακτήρες', async () => {
    const error = await pairLocalBridge('INVALID').catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('16 δεκαεξαδικούς');
    }
    expect(getLocalBridgeToken()).toBe(null);
  });

  it('απορρίπτει κωδικό με κενά και πεζά', async () => {
    const error = await pairLocalBridge('a1b2 c3d4 e5f6 071').catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('16 δεκαεξαδικούς');
    }
  });

  it('δέχεται έγκυρο κωδικό και αποθηκεύει το token', async () => {
    const token = 'x'.repeat(32);
    fakeFetch({ token });

    await pairLocalBridge(VALID_CODE);

    expect(isLocalBridgePaired()).toBe(true);
    expect(getLocalBridgeToken()).toBe(token);
    const fetchUrl = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(fetchUrl).toBe('/__dps_bridge/pair');
  });

  it('ρίχνει σφάλμα όταν ο server επιστρέφει 429', async () => {
    fakeFetch('ΑΠΟΡΡΙΠΤΗΚΕ', 429);

    const error = await pairLocalBridge(VALID_CODE).catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('Περίμενε ένα λεπτό');
    }
  });

  it('ρίχνει σφάλμα όταν ο server επιστρέφει 500', async () => {
    fakeFetch('ΑΠΟΡΡΙΠΤΗΚΕ', 500);

    const error = await pairLocalBridge(VALID_CODE).catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('δεν έγινε δεκτός');
    }
  });

  it('ρίχνει σφάλμα όταν η απάντηση δεν έχει token', async () => {
    fakeFetch({ message: 'εντάξει' });

    const error = await pairLocalBridge(VALID_CODE).catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('άκυρη απάντηση');
    }
  });

  it('ρίχνει σφάλμα όταν το token είναι μικρότερο από 32 χαρακτήρες', async () => {
    fakeFetch({ token: 'small' });

    const error = await pairLocalBridge(VALID_CODE).catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain('άκυρη απάντηση');
    }
  });
});
