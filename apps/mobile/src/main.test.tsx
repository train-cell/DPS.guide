// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Πλαστικό `Capacitor`: ο browser δεν είναι native πλατφόρμα. */
const capacitor = vi.hoisted(() => ({ isNativePlatform: () => false }));
vi.mock('@capacitor/core', () => ({ Capacitor: capacitor }));

/** Διορθώνει τον `navigator.serviceWorker` — το jsdom δεν το υποστηρίζει. */
function stiliServiceWorker(): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: vi.fn(() => Promise.resolve()) },
    configurable: true,
    writable: true,
  });
}

describe('main.tsx — είσοδος εφαρμογής', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renderάρει την εφαρμογή όταν υπάρχει #root (dev)', async () => {
    stiliServiceWorker();
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main.js');
  });

  it('πετάει όταν λείπει το #root (production)', async () => {
    stiliServiceWorker();
    vi.stubEnv('NODE_ENV', 'production');
    document.body.innerHTML = '';
    let error: Error | null = null;
    try {
      await import('./main.js');
    } catch (e) {
      error = e as Error;
    }
    // Το callback του `load` είναι ήδη καταχωρισμένο πριν πετάξει.
    window.dispatchEvent(new Event('load'));
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Root element #root not found in index.html');
  });
});
