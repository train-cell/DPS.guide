import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createServer, type Server } from 'node:http';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeKatevasmaPyli, dimiourgise_katevasma_pyli } from '../src/storage/index.js';

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
  await rm(riza, { recursive: true, force: true });
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
});
