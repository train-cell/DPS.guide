import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createServer, type Server } from 'node:http';
import { CookieJar } from '../src/http/cookie-jar.js';
import { NodeFetchHttpPyli, dimiourgise_http_pyli } from '../src/http/index.js';

let server: Server;
let lenis: number;

beforeAll(async () => {
  server = createServer((aitima, apantisi) => {
    apantisi.on('error', () => undefined);
    const url = new URL(aitima.url ?? '/', `http://127.0.0.1:${lenis}`);
    if (url.pathname === '/two-cookies') {
      apantisi.writeHead(200, {
        'set-cookie': ['a=1; Path=/', 'b=2; Path=/'],
        'content-type': 'text/plain',
      });
      apantisi.end('ok');
      return;
    }
    if (url.pathname === '/form') {
      apantisi.writeHead(200, { 'content-type': 'text/plain' });
      apantisi.end(`body<${aitima.headers['content-type']}>`);
      return;
    }
    apantisi.writeHead(404, { 'content-type': 'text/plain' });
    apantisi.end('den vrethike');
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

describe('NodeFetchHttpPyli — σώμα και κεφαλίδες', () => {
  it('δεν στέλνει σώμα σε GET (L45/L42 false)', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/keimeno'),
      kefalides: {},
      soma: null,
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(true);
  });

  it('στέλνει soma_forma και body x-www-form-urlencoded', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/form'),
      kefalides: {},
      soma_forma: { onoma: 'xristis', timi: 'fwtakis' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.keimeno).toBe('body<application/x-www-form-urlencoded>');
  });

  it('στέλνει soma_json και κεφαλίδα content-type', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/form'),
      kefalides: {},
      soma_json: { arxeio_id: 'a' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.keimeno).toBe('body<application/json>');
  });

  it('δεν στέλνει σώμα σε POST χωρίς body', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/form'),
      kefalides: {},
      soma: null,
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.keimeno).toBe('body<undefined>');
  });

  it('στέλνει πολλά Set-Cookie με την ίδια κεφαλίδα (L74/L70 false)', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/two-cookies'),
      kefalides: {},
      soma: null,
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.kefalides['set-cookie']).toBe('a=1; Path=/, b=2; Path=/');
  });

  it('δίνει σφάλμα όταν δίνονται και τα δύο σώματα', async () => {
    const pyli = dimiourgise_http_pyli();
    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/form'),
      kefalides: {},
      soma_forma: { onoma: 'x' },
      soma_json: { arxeio_id: 'a' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
      simatodotis: undefined,
    });
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});

describe('dimiourgise_http_pyli', () => {
  it('δένει νέο jar όταν δεν δίνεται', () => {
    const pyli = dimiourgise_http_pyli();
    expect(pyli.cookie_jar).toBeInstanceOf(CookieJar);
  });

  it('μοιράζεται το jar όταν δίνεται', () => {
    const jar = new CookieJar();
    const pyli = new NodeFetchHttpPyli(jar);
    expect(pyli.cookie_jar).toBe(jar);
  });
});
