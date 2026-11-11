// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserHttpPyli } from './browser-http.js';
import { getLocalBridgeToken, pairLocalBridge } from './local-bridge-client.js';

const TOKEN = 'a'.repeat(32);

/** Φτιάχνει μια απάντηση fetch με τις κεφαλίδες που θέλει ο χρήστης. */
class FakeHeaders extends Map {
  constructor(entries: Record<string, string> = {}) {
    super(Object.entries(entries).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]));
  }
  get(key: string): string | null {
    return super.has(key) ? super.get(key) as string : null;
  }
}

function fakeResponse(
  status = 200,
  headers: Record<string, string> = {},
  body: string | null = null,
  arrayBuffer: ArrayBuffer | null = null,
) {
  return {
    ok: status < 400,
    status,
    json: async () => ({ token: TOKEN }),
    headers: new FakeHeaders(headers),
    arrayBuffer: async () => arrayBuffer ?? new TextEncoder().encode(body ?? '').buffer,
  };
}

/** Ζευγώνει τον τοπικό bridge με πλαστικό fetch. */
async function zevgi_bridge(
  headers: Record<string, string> = {
    'x-dps-target-status': '200',
    'x-dps-target-headers': btoa(JSON.stringify({ 'x-foo': ['a', 'b'] })),
    'x-dps-target-url': 'https://localhost/redirect/',
  },
  body: string = '{"apotelesma":"ok"}',
): Promise<void> {
  vi.stubGlobal('fetch', vi.fn(async (init: unknown) => {
    const url = typeof init === 'string' ? init : (init as { url: string }).url;
    if (url === '/__dps_bridge/pair') {
      return fakeResponse(200);
    }
    return fakeResponse(200, headers, body);
  }));
  await pairLocalBridge(TOKEN.slice(0, 16));
  expect(getLocalBridgeToken()).toBe(TOKEN);
}

describe('browser-http.ts', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('location', { hostname: 'localhost' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('δεν επιτρέπει αίτημα από μη βρόχο localhost', async () => {
    vi.stubGlobal('location', { hostname: 'example.com' });
    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://lms.example.gr/curso/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('δεν στέλνει αίτημα χωρίς paired token', async () => {
    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('DIKTYO');
  });

  it('στέλνει JSON σώμα και αποκρίνεται με κείμενο', async () => {
    await zevgi_bridge();
    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: 'https://localhost/aitima/',
      kefalides: { authorization: 'Bearer x' },
      soma_json: { apotelesma: 'ok' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.katastasi).toBe(200);
    expect(apotelesma.timi?.teliko_url).toBe('https://localhost/redirect/');
    expect(apotelesma.timi?.keimeno).toBe('{"apotelesma":"ok"}');
  });

  it('στέλνει φόρμα σώμα και δυαδική απάντηση', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      return fakeResponse(200, {
        'x-dps-target-status': '200',
        'x-dps-target-headers': '',
        'x-dps-target-url': '',
      }, undefined, bytes.buffer);
    }));
    await pairLocalBridge(TOKEN.slice(0, 16));

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: 'https://localhost/aitima/',
      kefalides: {},
      soma_forma: { key: 'value' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'dyadiko',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.dyadiko).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('δεν περνάει κεφαλίδα χωρίς κατάσταση απάντησης', async () => {
    await zevgi_bridge();
    vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(200, {})));

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('DIKTYO');
  });

  it('αγνοεί κεφαλίδες που δεν είναι multi-map', async () => {
    await zevgi_bridge({
      'x-dps-target-status': '200',
      'x-dps-target-headers': btoa(JSON.stringify({ 'x-foo': 'abc' })),
    });

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });

  it('αγνοεί μη έγκυρη βάση 64 των κεφαλίδων', async () => {
    await zevgi_bridge({
      'x-dps-target-status': '200',
      'x-dps-target-headers': '!!όχι-βαση-64!!',
    });

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });

  it('διαλύει σφάλμα δικτύου όταν η αίτηση απέτυχε', async () => {
    await zevgi_bridge();
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Δίκτυο');
    }));

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(false);
    expect(apotelesma.sfalma?.kodikos).toBe('DIKTYO');
  });

  it('δεν έχει κεφαλίδα headers όταν η απάντηση δεν την στέλνει', async () => {
    await zevgi_bridge();
    vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(200, {
      'x-dps-target-status': '200',
    })));

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });

  it('αγνοεί κεφαλίδα που δεν είναι JSON αντικείμενο', async () => {
    await zevgi_bridge({
      'x-dps-target-status': '200',
      'x-dps-target-headers': btoa('"abc"'),
    });

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });

  it('αγνοεί κεφαλίδα που είναι null JSON', async () => {
    await zevgi_bridge({
      'x-dps-target-status': '200',
      'x-dps-target-headers': btoa('null'),
    });

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });

  it('αγνοεί κεφαλίδα που είναι JSON λίστα', async () => {
    await zevgi_bridge({
      'x-dps-target-status': '200',
      'x-dps-target-headers': btoa('[1, 2]'),
    });

    const pyli = new BrowserHttpPyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: 'https://localhost/aitima/',
      kefalides: {},
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 0,
      typos_apantisis: 'keimeno',
    });
    expect(apotelesma.ok).toBe(true);
    expect(apotelesma.timi?.kefalides).toEqual({});
  });
});
