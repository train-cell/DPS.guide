import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CapacitorHttp } from '@capacitor/core';
import type { HttpAitima } from '@dps/core';
import {
  CapacitorHttpPyli,
  dimiourgise_http_pyli,
  spase_set_cookie_joined,
} from '../src/http/http-pyli.js';
import { apofasi_anakateuthinsis } from '../src/http/anakateuthinsi.js';
import { CookieJar } from '../src/http/cookie-jar.js';
import type { Cookie } from '../src/http/cookie-jar.js';

const h = vi.hoisted(() => ({ kliseis: [] as { url: string; kefalides: Record<string, string>; methodos: string }[] }));

vi.mock('@capacitor/core', () => ({
  CapacitorHttp: {
    request: vi.fn(async (opts: { url: string; headers: Record<string, string>; method: string }) => {
      h.kliseis.push({ url: opts.url, kefalides: opts.headers, methodos: opts.method });
      throw new Error('το mock δεν έχει ρυθμιστεί για αυτό το αίτημα');
    }),
  },
  Capacitor: {},
  registerPlugin: vi.fn(),
}));

function dimiourgise_cookie(parts: Partial<Cookie> = {}): Cookie {
  return {
    onoma: 'onoma',
    timi: 'timi',
    host: 'thales.cs.unipi.gr',
    monopathia: '/',
    asfales: false,
    host_only: true,
    mexri: null,
    ...parts,
  };
}

function aitima(patches: Partial<HttpAitima> = {}): HttpAitima {
  return {
    methodos: 'GET',
    url: 'https://thales.cs.unipi.gr/main/portfolio.php',
    akolouthise_anakateuthinseis: true,
    xronos_orio_ms: 0,
    typos_apantisis: 'keimeno',
    ...patches,
  };
}

function stise_apantiseis(
  apantiseis: readonly {
    katastasi: number;
    url?: string;
    kefalides?: Record<string, string>;
    dedomena?: unknown;
  }[]
): void {
  const ouras = [...apantiseis];
  vi.mocked(CapacitorHttp.request).mockImplementation(async (opts: { url: string; headers: Record<string, string>; method: string }) => {
    h.kliseis.push({ url: opts.url, kefalides: opts.headers, methodos: opts.method });
    const epomeni = ouras.shift();
    if (epomeni === undefined) {
      throw new Error('η ουρά αποκρίσεων εξαντλήθηκε');
    }
    return {
      status: epomeni.katastasi,
      url: epomeni.url ?? opts.url,
      headers: epomeni.kefalides ?? {},
      data: epomeni.dedomena,
    };
  });
}

describe('spase_set_cookie_joined', () => {
  it('χωρίζει πολλαπλά Set-Cookie που ήρθαν joined με κόμμα', () => {
    const timi = 'a=1; Path=/, b=2; Path=/';
    expect(spase_set_cookie_joined(timi)).toEqual(['a=1; Path=/', 'b=2; Path=/']);
  });

  it('κρατάει ανέπαφο το κόμμα του Expires', () => {
    const timi = 'sid=abc; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/';
    expect(spase_set_cookie_joined(timi)).toEqual(['sid=abc; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/']);
  });

  it('επανενώνει κομμένο cookie μετά από Expires', () => {
    const timi = 'sid=abc; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/, allo=1';
    const tmimata = spase_set_cookie_joined(timi);
    expect(tmimata).toHaveLength(2);
    expect(tmimata[0]).toContain('Wed, 21 Oct 2015');
    expect(tmimata[1]).toBe('allo=1');
  });
});

describe('CapacitorHttpPyli', () => {
  beforeEach(() => {
    h.kliseis.length = 0;
    vi.mocked(CapacitorHttp.request).mockReset();
  });

  it('GET επιστρέφει κείμενο και κατάσταση', async () => {
    stise_apantiseis([{ katastasi: 200, kefalides: { 'content-type': 'text/html' }, dedomena: '<html>ok</html>' }]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.katastasi).toBe(200);
      expect(apotelesma.timi.keimeno).toBe('<html>ok</html>');
      expect(apotelesma.timi.teliko_url).toBe('https://thales.cs.unipi.gr/main/portfolio.php');
    }
  });

  it('POST με soma_forma στέλνει urlencoded και δικό του content-type', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima({ methodos: 'POST', soma_forma: { uname: 'fwtakis', pass: 'kwdikos' } }));
    const proti = h.kliseis[0];
    expect(proti?.kefalides['content-type']).toBe('application/x-www-form-urlencoded');
    const zitoumeno = vi.mocked(CapacitorHttp.request).mock.calls[0]?.[0] as { data?: string };
    expect(zitoumeno.data).toBe('uname=fwtakis&pass=kwdikos');
  });

  it('POST με soma_json στέλνει JSON', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima({ methodos: 'POST', soma_json: { a: 1 } }));
    expect(h.kliseis[0]?.kefalides['content-type']).toBe('application/json');
    const zitoumeno = vi.mocked(CapacitorHttp.request).mock.calls[0]?.[0] as { data?: string };
    expect(zitoumeno.data).toBe('{"a":1}');
  });

  it('soma_forma και soma_json μαζί → MI_EGKYRO_SXIMA χωρίς αίτημα', async () => {
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(
      aitima({ methodos: 'POST', soma_forma: { a: '1' }, soma_json: { a: 1 } })
    );
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
    expect(vi.mocked(CapacitorHttp.request)).not.toHaveBeenCalled();
  });

  it('ακυρωμένο σήμα πριν την εκκίνηση → AKYROTHIKE', async () => {
    const pyli = new CapacitorHttpPyli();
    const simatodotis = AbortSignal.abort();
    const apotelesma = await pyli.aitima(aitima({ simatodotis }));
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
  });

  it('άκυρο URL → MI_EGKYRO_SXIMA', async () => {
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima({ url: 'όχι-url' }));
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('redirect 302: ακολουθεί, στέλνει τα cookies του jar στο επόμενο hop', async () => {
    stise_apantiseis([
      {
        katastasi: 302,
        kefalides: {
          location: 'https://thales.cs.unipi.gr/main/portfolio.php',
          'set-cookie': 'sid=abc; Path=/, theme=dark; Path=/',
        },
      },
      { katastasi: 200, kefalides: { 'content-type': 'text/html' }, dedomena: '<html>mesa</html>' },
    ]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima({ url: 'https://thales.cs.unipi.gr/main/login_form.php' }));
    expect(apotelesma.ok).toBe(true);
    expect(h.kliseis).toHaveLength(2);
    expect(h.kliseis[1]?.kefalides['Cookie']).toContain('sid=abc');
    expect(h.kliseis[1]?.kefalides['Cookie']).toContain('theme=dark');
  });

  it('redirect 302 χωρίς ακολούθηση: επιστρέφει την 30x ίδια', async () => {
    stise_apantiseis([
      { katastasi: 302, kefalides: { location: 'https://thales.cs.unipi.gr/main/portfolio.php' } },
    ]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(
      aitima({ akolouthise_anakateuthinseis: false, url: 'https://thales.cs.unipi.gr/main/login_form.php' })
    );
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.katastasi).toBe(302);
    }
    expect(h.kliseis).toHaveLength(1);
  });

  it('redirect 307 κρατάει τη μέθοδο POST', async () => {
    stise_apantiseis([
      { katastasi: 307, kefalides: { location: 'https://thales.cs.unipi.gr/modules/auth/cas.php' } },
      { katastasi: 200, dedomena: 'ok' },
    ]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(
      aitima({ methodos: 'POST', soma_forma: { a: '1' }, url: 'https://thales.cs.unipi.gr/main/login_form.php' })
    );
    expect(h.kliseis[1]?.methodos).toBe('POST');
  });

  it('302 με POST γίνεται GET και χάνει το σώμα', async () => {
    stise_apantiseis([
      { katastasi: 302, kefalides: { location: 'https://thales.cs.unipi.gr/main/portfolio.php' } },
      { katastasi: 200, dedomena: 'ok' },
    ]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(
      aitima({ methodos: 'POST', soma_forma: { a: '1' }, url: 'https://thales.cs.unipi.gr/main/login_form.php' })
    );
    expect(h.kliseis[1]?.methodos).toBe('GET');
  });

  it('auth header κόβεται σε cross-origin redirect', async () => {
    stise_apantiseis([
      {
        katastasi: 302,
        kefalides: { location: 'https://cas.unipi.gr/login' },
      },
      { katastasi: 200, dedomena: 'ok' },
    ]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(
      aitima({ kefalides: { Authorization: 'Basic xyz' }, url: 'https://thales.cs.unipi.gr/main/login_form.php' })
    );
    expect(h.kliseis[1]?.kefalides['Authorization']).toBeUndefined();
  });

  it('cross-origin redirect χωρίς Authorization → false (L187)', async () => {
    stise_apantiseis([
      {
        katastasi: 302,
        kefalides: { location: 'https://cas.unipi.gr/login' },
      },
      { katastasi: 200, dedomena: 'ok' },
    ]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima({ url: 'https://thales.cs.unipi.gr/main/login_form.php' }));
    expect(h.kliseis[1]?.kefalides['Authorization']).toBeUndefined();
  });

  it('αποτυχία δικτύου → DIKTYO', async () => {
    vi.mocked(CapacitorHttp.request).mockImplementation(async () => {
      throw new Error('συνδεθεί ματαίως');
    });
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('υπέρβαση μέγιστων ανακατευθύνσεων → DIKTYO', async () => {
    const ateleftes = Array.from({ length: 12 }, () => ({
      katastasi: 302,
      kefalides: { location: 'https://thales.cs.unipi.gr/main/portfolio.php' },
    }));
    stise_apantiseis(ateleftes);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('δυαδική απάντηση base64 → Uint8Array', async () => {
    const dedomena = Uint8Array.from([1, 2, 3, 250]);
    const base64 = btoa(String.fromCharCode(...dedomena));
    stise_apantiseis([{ katastasi: 200, dedomena: base64 }]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima({ typos_apantisis: 'dyadiko' }));
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.dyadiko).toEqual(dedomena);
    }
  });

  it('το αίτημα περνάει disableRedirects για χειροκίνητο βρόχο', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima());
    const zitoumeno = vi.mocked(CapacitorHttp.request).mock.calls[0]?.[0] as { disableRedirects?: boolean };
    expect(zitoumeno.disableRedirects).toBe(true);
  });

  it('POST χωρίς σώμα → null (L76)', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima({ methodos: 'POST' }));
    const zitoumeno = vi.mocked(CapacitorHttp.request).mock.calls[0]?.[0] as { data?: string };
    expect(zitoumeno.data).toBeUndefined();
  });

  it('κενή data → keimeno κενό (L144/L145)', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: undefined }]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe('');
    }
  });

  it('xronos_orio_ms > 0 → connectTimeout/readTimeout (L179/L189 true)', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    await pyli.aitima(aitima({ xronos_orio_ms: 5000 }));
    const zitoumeno = vi.mocked(CapacitorHttp.request).mock.calls[0]?.[0] as {
      connectTimeout?: number;
      readTimeout?: number;
    };
    expect(zitoumeno.connectTimeout).toBe(5000 + 1000);
    expect(zitoumeno.readTimeout).toBe(5000 + 1000);
  });

  it('ακύρωση μετά την εκκίνηση → AKYROTHIKE (L343/L347)', async () => {
    vi.mocked(CapacitorHttp.request).mockImplementation(async (_opts, sima) => {
      await new Promise<void>((lysi) => {
        setTimeout(lysi, 50);
      });
      if (sima.aborted) {
        throw new Error('ακυρώθηκε από τον καλούντα');
      }
      return { status: 200, url: 'https://thales.cs.unipi.gr/main/portfolio.php', headers: {}, data: '' };
    });
    const elegktis = new AbortController();
    const pyli = new CapacitorHttpPyli();
    const p = pyli.aitima(aitima({ simatodotis: elegktis.signal }));
    await new Promise<void>((lysi) => {
      setTimeout(lysi, 10);
    });
    elegktis.abort();
    const apotelesma = await p;
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
  });

  it('dimiourgise_http_pyli (L241)', () => {
    const pyli = dimiourgise_http_pyli();
    expect(pyli).toBeInstanceOf(CapacitorHttpPyli);
    expect(pyli.cookie_jar instanceof CookieJar).toBe(true);
  });

  it('apofasi_anakateuthinsis: άκυρη τοποθεσία → telos (L96)', () => {
    expect(apofasi_anakateuthinsis('GET', 200, null, 'https://thales.cs.unipi.gr/')).toEqual({ eidos: 'telos' });
  });

  it('apofasi_anakateuthinsis: 304 → telos (L106)', () => {
    expect(
      apofasi_anakateuthinsis('POST', 304, 'https://thales.cs.unipi.gr/x', 'https://thales.cs.unipi.gr/y')
    ).toEqual({
      eidos: 'telos',
    });
  });

  it('apofasi_anakateuthinsis: άκυρη τοποθεσία → catch (L96)', () => {
    expect(apofasi_anakateuthinsis('GET', 302, 'http://[invalid', 'https://thales.cs.unipi.gr/')).toEqual({
      eidos: 'telos',
    });
  });

  it('jar cookies χωρίς Header `Cookie` (L160 false, L214 true)', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'jar', timi: 'j', host: 'thales.cs.unipi.gr' }));
    const pyli = new CapacitorHttpPyli(zakari);
    await pyli.aitima(aitima({ kefalides: { Accept: 'application/json' } }));
    expect(h.kliseis[0]?.kefalides['Cookie']).toBe('jar=j');
  });

  it('κεφαλίδα Cookie με πεζό αναζήτηση (L160/L161)', async () => {
    stise_apantiseis([{ katastasi: 200, dedomena: 'ok' }]);
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'jar', timi: 'j', host: 'thales.cs.unipi.gr' }));
    const pyli = new CapacitorHttpPyli(zakari);
    await pyli.aitima(aitima({ kefalides: { Cookie: 'jar=j' } }));
    expect(h.kliseis[0]?.kefalides['Cookie']).toBe('jar=j; jar=j');
  });

  it('url απάντησης κενή → teliko_url η τρέχουσα (L226)', async () => {
    stise_apantiseis([{ katastasi: 200, url: '', dedomena: 'ok' }]);
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.teliko_url).toBe('https://thales.cs.unipi.gr/main/portfolio.php');
    }
  });

  it('απαντηση με σφάλμα ανάγνωσης σώματος → DIKTYO (L243)', async () => {
    vi.mocked(CapacitorHttp.request).mockImplementation(async () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      return { status: 200, url: 'https://thales.cs.unipi.gr/main/portfolio.php', headers: {}, data: circular };
    });
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima());
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('TIMEOUT με xronos_orio_ms (L344)', async () => {
    vi.mocked(CapacitorHttp.request).mockImplementation(async () => {
      await new Promise<void>((lysi) => {
        setTimeout(lysi, 100);
      });
      throw new Error('πέρασε το όριο');
    });
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima({ xronos_orio_ms: 50 }));
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('TIMEOUT');
    }
  });

  it('άκυρο URL που ρίχνει σφάλμα στο new URL (L271)', async () => {
    const pyli = new CapacitorHttpPyli();
    const apotelesma = await pyli.aitima(aitima({ url: 'http://[invalid' }));
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});
