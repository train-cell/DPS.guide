import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createServer, type Server } from 'node:http';
import { rmSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, realRm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeKatevasmaPyli, dimiourgise_katevasma_pyli } from '../src/storage/index.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, rm: vi.fn(), realRm: original.rm };
});

beforeEach(() => {
  vi.mocked(rm).mockImplementation(async (...args: Parameters<typeof realRm>) => realRm(...args));
});

const DEDOMENA_DYADIKA = [0, 1, 2, 250, 255];
const PERIEXOMENO_KEIMENOU = 'Περιεχόμενο αρχείου δοκιμής με τόνους';
const MYSTIKO_COOKIE = 'xristis=p2970';
const KATHYSTERISI_AKYROSI_MS = 50;
const MEGETHOS_KAIROU_MISIS_MS = 10;

let riza: string;
let pyli: NodeKatevasmaPyli;

beforeAll(async () => {
  riza = await mkdtemp(path.join(tmpdir(), 'dps-katevasma-'));
  pyli = dimiourgise_katevasma_pyli(riza);
});

afterAll(async () => {
  rmSync(riza, { recursive: true, force: true });
});

let server: Server;
let lenis: number;

beforeAll(async () => {
  server = createServer((aitima, apantisi) => {
    apantisi.on('error', () => undefined);
    const url = new URL(aitima.url ?? '/', `http://127.0.0.1:${lenis}`);
    const cookie = aitima.headers.cookie ?? '';
    switch (url.pathname) {
      case '/dyadiko':
        apantisi.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        apantisi.end(Buffer.from(DEDOMENA_DYADIKA));
        return;
      case '/keimeno':
        apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        apantisi.end(Buffer.from(PERIEXOMENO_KEIMENOU, 'utf8'));
        return;
      case '/keno':
        apantisi.writeHead(200, { 'Content-Length': '0' });
        apantisi.end();
        return;
      case '/anakateuthinsi':
        apantisi.writeHead(302, { Location: '/teliko', 'Set-Cookie': 'seed=abc; Path=/' });
        apantisi.end();
        return;
      case '/teliko':
        apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        apantisi.end(`teliko cookie<${cookie}>`);
        return;
      case '/echo-cookie':
        apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        apantisi.end(`cookie<${cookie}>`);
        return;
      case '/pefano':
        apantisi.writeHead(302, { Location: '/pefano' });
        apantisi.end();
        return;
      case '/sfalma-misasi':
        apantisi.writeHead(200, { 'Content-Length': '100' });
        apantisi.write('meros');
        setTimeout(() => apantisi.destroy(), MEGETHOS_KAIROU_MISIS_MS);
        return;
      case '/arga':
        apantisi.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        apantisi.write('ena');
        setTimeout(() => {
          apantisi.write('dyo');
          apantisi.end();
        }, 300);
        return;
      default:
        apantisi.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        apantisi.end('den vrethike');
    }
  });
  await new Promise<void>((lysi) => {
    server.listen(0, '127.0.0.1', () => {
      lenis = (server.address() as AddressInfo).port;
      lysi();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((lysi) => {
    server.close(() => {
      lysi();
    });
  });
});

function diefthinsi(monopathia: string): string {
  return `http://127.0.0.1:${lenis}${monopathia}`;
}

async function arxeia_fakelou(fakelos: string): Promise<string[]> {
  try {
    return await readdir(path.join(riza, fakelos));
  } catch {
    return [];
  }
}

describe('NodeKatevasmaPyli', () => {
  it('κατεβάζει δυαδικό αρχείο, επιστρέφει το σωστό megethos και γράφει τα σωστά bytes', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/dyadiko'), 'dyadiko.bin', {});

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.megethos).toBe(DEDOMENA_DYADIKA.length);
    }
    const periexomena = await readFile(path.join(riza, 'dyadiko.bin'));
    expect(Array.from(periexomena)).toEqual(DEDOMENA_DYADIKA);
  });

  it('ακολουθεί 302 και γράφει το σώμα της τελικής απάντησης', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/anakateuthinsi'), 'teliko.txt', {});

    const anamenomeno = 'teliko cookie<seed=abc>';
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.megethos).toBe(Buffer.byteLength(anamenomeno, 'utf8'));
    }
    const keimeno = await readFile(path.join(riza, 'teliko.txt'), 'utf8');
    expect(keimeno).toBe(anamenomeno);
  });

  it('μεταφέρει τα Set-Cookie των ενδιάμεσων 30x στο τελικό αίτημα', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/anakateuthinsi'), 'meta.txt', {});

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'meta.txt'), 'utf8');
    expect(keimeno).toBe('teliko cookie<seed=abc>');
  });

  it('τιμά την κεφαλίδα Cookie που στέλνει ο καλών (pass-through)', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/echo-cookie'), 'cook.txt', {
      Cookie: MYSTIKO_COOKIE,
    });

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'cook.txt'), 'utf8');
    expect(keimeno).toBe(`cookie<${MYSTIKO_COOKIE}>`);
  });

  it('δημιουργεί ένθετους γονικούς φακέλους', async () => {
    const apotelesma = await pyli.katevase(
      diefthinsi('/keimeno'),
      'vathia/diadromi/arxeio.txt',
      {}
    );

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'vathia', 'diadromi', 'arxeio.txt'), 'utf8');
    expect(keimeno).toBe(PERIEXOMENO_KEIMENOU);
  });

  it('κενό σώμα → megethos 0 και δημιουργημένο αρχείο', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/keno'), 'keno.bin', {});

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.megethos).toBe(0);
    }
    const statistiko = await stat(path.join(riza, 'keno.bin'));
    expect(statistiko.size).toBe(0);
  });

  it('απόλυτη διαδρομή με .. απορρίπτεται ως MI_EGKYRO_SXIMA χωρίς να γράψει τίποτα', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/dyadiko'), '../rgpd.pdf', {});

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('rgpd.pdf');
  });

  it('404 → DEN_VRETHIKE χωρίς να αφήσει αρχείο', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/den-yparxei'), 'lixi.bin', {});

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(apotelesma.sfalma.minima).toContain('404');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('lixi.bin');
    expect((await arxeia_fakelou('.')).filter((onoma) => onoma.startsWith('lixi.bin.tmp'))).toEqual(
      []
    );
  });

  it('σφάλμα στη μέση της ροής → DIKTYO χωρίς μερικό ή τελικό αρχείο (atomic)', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/sfalma-misasi'), 'meros.bin', {});

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('meros.bin');
    expect(eggrafes.filter((onoma) => onoma.startsWith('meros.bin.tmp'))).toEqual([]);
  });

  it('AbortSignal στη μέση της λήψης → AKYROTHIKE και καθαρισμένο temp', async () => {
    const elegktis = new AbortController();
    const yposxesi = pyli.katevase(diefthinsi('/arga'), 'arga.bin', {}, elegktis.signal);
    setTimeout(() => elegktis.abort(), KATHYSTERISI_AKYROSI_MS);
    const apotelesma = await yposxesi;

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('arga.bin');
    expect(eggrafes.filter((onoma) => onoma.startsWith('arga.bin.tmp'))).toEqual([]);
  });

  it('προ-ακυρωμένο σήμα → AKYROTHIKE χωρίς εκκίνηση (L128 true)', async () => {
    const elegktis = new AbortController();
    elegktis.abort();
    const apotelesma = await pyli.katevase(diefthinsi('/keimeno'), 'akyr.bin', {}, elegktis.signal);

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
      expect(apotelesma.sfalma.minima).toBe('Η λήψη ακυρώθηκε πριν από την εκκίνησή της');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('akyr.bin');
  });

  it('άκυρο URL → MI_EGKYRO_SXIMA', async () => {
    const apotelesma = await pyli.katevase('όχι url', 'kali.bin', {});

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
    const eggrafes = await arxeia_fakelou('.');
    expect(eggrafes).not.toContain('kali.bin');
  });

  it('υπέρβαση ορίου ανακατευθύνσεων → DIKTYO', async () => {
    const url = diefthinsi('/pefano');
    const apotelesma = await pyli.katevase(url, 'pefano.txt', {});

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
      expect(apotelesma.sfalma.minima).toContain('Υπέρβαση μέγιστου αριθμού ανακατευθύνσεων');
    }
  });

  it('διαβάζει κεφαλίδα Cookie με κεφαλαία (L45/L46 true)', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/echo-cookie'), 'kapitala.txt', {
      COOKIE: MYSTIKO_COOKIE,
    });

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'kapitala.txt'), 'utf8');
    expect(keimeno).toBe(`cookie<${MYSTIKO_COOKIE}>`);
  });

  it('ενώνει το cookie του καλούντα με το jar (L64 false)', async () => {
    const elegktis = vi.spyOn(global, 'fetch');
    elegktis.mockImplementation(async () =>
      new Response('ok', {
        status: 200,
        headers: { 'set-cookie': 'jar=1; Path=/', 'content-type': 'text/plain' },
      })
    );

    const apotelesma = await pyli.katevase(diefthinsi('/echo'), 'sym.txt', {
      Cookie: MYSTIKO_COOKIE,
    });

    elegktis.mockRestore();
    expect(apotelesma.ok).toBe(true);
  });

  it('σώμα null → κενό αρχείο (L87 true)', async () => {
    const elegktis = vi.spyOn(global, 'fetch');
    elegktis.mockImplementation(async () => new Response());

    const apotelesma = await pyli.katevase(diefthinsi('/keno'), 'keno2.bin', {});

    elegktis.mockRestore();
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.megethos).toBe(0);
    }
    const statistiko = await stat(path.join(riza, 'keno2.bin'));
    expect(statistiko.size).toBe(0);
  });

  it('σφάλμα διαγραφής temp → απορροφάται (L195)', async () => {
    const sfalma = new Error('δεν μπορώ να διαγράψω');
    vi.mocked(rm).mockImplementationOnce(() => Promise.reject(sfalma));

    const apotelesma = await pyli.katevase(diefthinsi('/keimeno'), 'lixi2.txt', {});

    vi.mocked(rm).mockImplementation(async () => undefined);
    expect(apotelesma.ok).toBe(true);
  });

  it('ενώνει το cookie του καλούντα με το jar (L45/L46/L64 false)', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/anakateuthinsi'), 'syn.txt', {
      Cookie: MYSTIKO_COOKIE,
    });

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'syn.txt'), 'utf8');
    expect(keimeno).toBe(`teliko cookie<${MYSTIKO_COOKIE}; seed=abc>`);
  });

  it('δεν έχει Cookie κεφαλίδα στον καλούντα (L45 false)', async () => {
    const apotelesma = await pyli.katevase(diefthinsi('/anakateuthinsi'), 'syn2.txt', {
      Authorization: 'Bearer xristis',
    });

    expect(apotelesma.ok).toBe(true);
    const keimeno = await readFile(path.join(riza, 'syn2.txt'), 'utf8');
    expect(keimeno).toBe(`teliko cookie<seed=abc>`);
  });

  it('σώμα με cancel() που ρίχνει σφάλμα (L114)', async () => {
    const elegktis = vi.spyOn(global, 'fetch');
    elegktis.mockImplementation(async () => ({
      status: 404,
      headers: {
        get: () => null,
        getSetCookie: () => [],
      },
      body: {
        cancel: async () => {
          throw new Error('δεν γίνεται');
        },
      },
    }));

    const apotelesma = await pyli.katevase(diefthinsi('/den-vrethike'), 'kali.bin', {});

    elegktis.mockRestore();
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });
});
