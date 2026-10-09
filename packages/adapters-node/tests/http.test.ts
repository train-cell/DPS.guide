import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createServer, type Server } from 'node:http';
import {
  CookieJar,
  MEGISTES_ANAKATEUTHINSEIS,
  MEGISTOS_ARITHMOS_COOKIES,
  NodeFetchHttpPyli,
  anakateuthinsi,
  apofasi_anakateuthinsis,
  default_path,
  parse_set_cookies,
} from '../src/http/index.js';
import type {
  AitimaProsEkdoti,
  ApantisiEkdoti,
  BasikaAnakateuthinsis,
  Cookie,
  EkdotisAitimaton,
} from '../src/http/index.js';

const MYSTIKO = 'MystikoKwdikos123';
const XORI_ORIO_MS = 5000;

function t_url(dieftinsi: string): URL {
  return new URL(dieftinsi);
}

function dimiourgise_ekdoti(vimata: readonly ApantisiEkdoti[]): {
  ekdotis: EkdotisAitimaton;
  kliseis: () => number;
  teleftaio: () => AitimaProsEkdoti | undefined;
} {
  let deiktis = 0;
  const eggrafes: AitimaProsEkdoti[] = [];
  const ekdotis: EkdotisAitimaton = async (aitima) => {
    eggrafes.push(aitima);
    const thesi = Math.min(deiktis, vimata.length - 1);
    const apantisi = vimata[thesi];
    deiktis += 1;
    if (apantisi === undefined) {
      throw new Error('Εξαντλήθηκαν οι απαντήσεις του ψεύτικου εκδότη');
    }
    return apantisi;
  };
  return {
    ekdotis,
    kliseis: () => deiktis,
    teleftaio: () => eggrafes[eggrafes.length - 1],
  };
}

function dimiourgise_apantisi(
  katastasi: number,
  parts: {
    readonly url?: string;
    readonly thesi?: string;
    readonly set_cookie?: readonly string[];
    readonly keimeno?: string;
  } = {}
): ApantisiEkdoti {
  const kefalides: Record<string, string[]> = {};
  if (parts.set_cookie !== undefined) {
    kefalides['set-cookie'] = [...parts.set_cookie];
  }
  if (parts.thesi !== undefined) {
    kefalides['location'] = [parts.thesi];
  }
  const soma = parts.keimeno ?? 'προεπιλεγμένο σώμα';
  return {
    url: parts.url ?? 'http://127.0.0.1/proorismos',
    katastasi,
    kefalides,
    keimeno: async () => soma,
    dyadiko: async () => new TextEncoder().encode(soma),
  };
}

function dimiourgise_basika(parts: Partial<BasikaAnakateuthinsis> = {}): BasikaAnakateuthinsis {
  return {
    methodos: 'GET',
    url: 'http://127.0.0.1/arxiki',
    kefalides: {},
    soma: null,
    akolouthise: true,
    xronos_orio_ms: XORI_ORIO_MS,
    typos: 'keimeno',
    simatodotis: undefined,
    ...parts,
  };
}

function dimiourgise_cookie(
  parts: Pick<Cookie, 'onoma' | 'timi' | 'host'> & Partial<Cookie>
): Cookie {
  return {
    monopathia: '/',
    asfales: false,
    host_only: true,
    mexri: null,
    ...parts,
  };
}

describe('CookieJar', () => {
  it('αποθηκεύει, διαβάζει, ενημερώνει και διαγράφει cookie', () => {
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'simata', timi: '1', host: '127.0.0.1' }));

    expect(zakari.pare('simata', '127.0.0.1')?.timi).toBe('1');

    zakari.val(dimiourgise_cookie({ onoma: 'simata', timi: '2', host: '127.0.0.1' }));
    expect(zakari.pare('simata', '127.0.0.1')?.timi).toBe('2');

    expect(zakari.svise('simata', '127.0.0.1')).toBe(true);
    expect(zakari.pare('simata', '127.0.0.1')).toBeUndefined();
    expect(zakari.svise('simata', '127.0.0.1')).toBe(false);
  });

  it('περιορίζει τα cookies ανά host (ίδιο όνομα σε διαφορετικούς hosts)', () => {
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'simata', timi: 'a', host: 'enas.test' }));
    zakari.val(dimiourgise_cookie({ onoma: 'simata', timi: 'b', host: 'allos.test' }));

    expect(zakari.pare('simata', 'enas.test')?.timi).toBe('a');
    expect(zakari.pare('simata', 'allos.test')?.timi).toBe('b');
    expect(zakari.pare('simata', 'tritos.test')).toBeUndefined();
    expect(zakari.pare_ola('enas.test')).toHaveLength(1);
  });

  it('στέλνει μόνο cookies ίδιου host και συμβατής διαδρομής', () => {
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'rizas', timi: 'r', host: 'enas.test' }));
    zakari.val(
      dimiourgise_cookie({ onoma: 'kato', timi: 'k', host: 'enas.test', monopathia: '/kato' })
    );
    zakari.val(dimiourgise_cookie({ onoma: 'xenos', timi: 'x', host: 'allos.test' }));

    expect(zakari.kefalida_gia(new URL('http://enas.test/kato/selida'))).toBe('kato=k; rizas=r');
    expect(zakari.kefalida_gia(t_url('http://enas.test/ano'))).toBe('rizas=r');
    expect(zakari.kefalida_gia(t_url('http://allos.test/kato/selida'))).toBe('xenos=x');
  });

  it('δεν στέλνει ληγμένο cookie ούτε μη-ασφαλές cookie σε http', () => {
    const zakari = new CookieJar();
    zakari.val(
      dimiourgise_cookie({ onoma: 'ligmeno', timi: '1', host: 'enas.test', mexri: Date.now() - 1000 })
    );
    zakari.val(
      dimiourgise_cookie({ onoma: 'asfales', timi: '2', host: 'enas.test', asfales: true })
    );

    expect(zakari.kefalida_gia(t_url('http://enas.test/'))).toBe('');
    expect(zakari.kefalida_gia(t_url('https://enas.test/'))).toBe('asfales=2');
    expect(zakari.pare('ligmeno', 'enas.test')).toBeUndefined();
  });

  it('parse_set_cookies διαβάζει χαρακτηριστικά με ανεπιτήρητη κεφαλαία', () => {
    const cookies = parse_set_cookies(
      ['JSESSIONID=abc; PATH=/cas; Secure; HTTPONLY; SameSite=Strict'],
      t_url('http://127.0.0.1:8080/cas/login?service=x')
    );

    expect(cookies).toHaveLength(1);
    const mono = cookies[0];
    expect(mono).toBeDefined();
    if (mono !== undefined) {
      expect(mono.onoma).toBe('JSESSIONID');
      expect(mono.timi).toBe('abc');
      expect(mono.host).toBe('127.0.0.1');
      expect(mono.monopathia).toBe('/cas');
      expect(mono.asfales).toBe(true);
      expect(mono.host_only).toBe(true);
      expect(mono.mexri).toBeNull();
    }
  });

  it('parse_set_cookies σηματοδοτεί Max-Age<=0 και το jar σβήνει το cookie', () => {
    const diagrafi = parse_set_cookies(['a=1; Max-Age=0'], t_url('http://127.0.0.1/'));
    expect(diagrafi[0]?.mexri).toBeLessThanOrEqual(Date.now());

    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'a', timi: '1', host: '127.0.0.1' }));
    zakari.val_se_ola(diagrafi);
    expect(zakari.pare('a', '127.0.0.1')).toBeUndefined();

    expect(default_path('/cas/login')).toBe('/cas');
    expect(default_path('/')).toBe('/');
    expect(default_path('keno')).toBe('/');
    expect(default_path('/cas')).toBe('/');
  });

  it('parse_set_cookies μετατρέπει Max-Age/Expires σε απόλυτη ημερομηνία λήξης', () => {
    const me_max_age = parse_set_cookies(['a=1; Max-Age=3600'], t_url('http://127.0.0.1/'));
    expect(me_max_age[0]?.mexri).toBeGreaterThan(Date.now());

    const me_expires = parse_set_cookies(
      ['a=1; Expires=Fri, 31 Dec 2099 23:59:59 GMT'],
      t_url('http://127.0.0.1/')
    );
    expect(me_expires[0]?.mexri).toBeGreaterThan(Date.now());

    const ligmeno = parse_set_cookies(
      ['a=1; Expires=Wed, 21 Oct 2015 07:28:00 GMT'],
      t_url('http://127.0.0.1/')
    );
    expect(ligmeno[0]?.mexri).toBeLessThan(Date.now());
  });

  it('parse_set_cookies αφαιρεί την αρχική τελεία από το Domain', () => {
    const cookies = parse_set_cookies(
      ['a=1; Domain=.ypodomi.test'],
      t_url('http://app.ypodomi.test/x')
    );
    expect(cookies[0]?.host).toBe('ypodomi.test');
  });

  it('απορρίπτει Domain που δεν ταιριάζει με τον host του αιτήματος', () => {
    const kako = parse_set_cookies(['kako=1; Domain=evil.com'], t_url('http://eclass.gr/login'));
    expect(kako).toHaveLength(0);

    const kako_ypodomi = parse_set_cookies(
      ['kako=1; Domain=.evil.com'],
      t_url('http://eclass.gr/login')
    );
    expect(kako_ypodomi).toHaveLength(0);

    const se_ip = parse_set_cookies(['kako=1; Domain=127.0.0.1'], t_url('http://127.0.0.1/'));
    expect(se_ip).toHaveLength(0);

    const zakari = new CookieJar();
    zakari.val_se_ola(kako);
    expect(zakari.pare('kako', 'evil.com')).toBeUndefined();
    expect(zakari.kefalida_gia(t_url('http://evil.com/'))).toBe('');
  });

  it('αποθηκεύει Domain cookie και το στέλνει σε ίδιο host και υπο-domain', () => {
    const cookies = parse_set_cookies(['kalo=1; Domain=.eclass.gr'], t_url('http://eclass.gr/login'));
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.host).toBe('eclass.gr');
    expect(cookies[0]?.host_only).toBe(false);

    const zakari = new CookieJar();
    zakari.val_se_ola(cookies);

    expect(zakari.kefalida_gia(t_url('http://eclass.gr/x'))).toBe('kalo=1');
    expect(zakari.kefalida_gia(t_url('http://sub.eclass.gr/x'))).toBe('kalo=1');
    expect(zakari.kefalida_gia(t_url('http://allos.gr/x'))).toBe('');
  });

  it('host-only cookie δεν αποστέλλεται σε υπο-domain', () => {
    const cookies = parse_set_cookies(['mono=1'], t_url('http://eclass.gr/login'));
    expect(cookies[0]?.host_only).toBe(true);

    const zakari = new CookieJar();
    zakari.val_se_ola(cookies);

    expect(zakari.kefalida_gia(t_url('http://eclass.gr/x'))).toBe('mono=1');
    expect(zakari.kefalida_gia(t_url('http://sub.eclass.gr/x'))).toBe('');
  });

  it('περιορίζει το πλήθος cookies σβήνοντας τα παλαιότερα', () => {
    const zakari = new CookieJar();
    for (let i = 0; i < MEGISTOS_ARITHMOS_COOKIES + 5; i += 1) {
      zakari.val(dimiourgise_cookie({ onoma: `k${i}`, timi: String(i), host: 'ypodomi.test' }));
    }

    expect(zakari.megethos).toBe(MEGISTOS_ARITHMOS_COOKIES);
    expect(zakari.pare('k0', 'ypodomi.test')).toBeUndefined();
    expect(zakari.pare('k4', 'ypodomi.test')).toBeUndefined();
    expect(zakari.pare(`k${MEGISTOS_ARITHMOS_COOKIES + 4}`, 'ypodomi.test')).toBeDefined();
  });
});

describe('apofasi_anakateuthinsis', () => {
  it('301/302/303 με GET/HEAD διατηρούν τη μέθοδο, με POST γίνονται GET', () => {
    expect(apofasi_anakateuthinsis('GET', 301, '/b', 'http://h.test/a')).toEqual({
      eidos: 'senenxisi',
      methodos: 'GET',
      url: 'http://h.test/b',
      kratima_somatos: false,
    });
    expect(apofasi_anakateuthinsis('HEAD', 302, '/b', 'http://h.test/a').methodos).toBe('HEAD');
    expect(apofasi_anakateuthinsis('POST', 302, '/b', 'http://h.test/a')).toEqual({
      eidos: 'senenxisi',
      methodos: 'GET',
      url: 'http://h.test/b',
      kratima_somatos: false,
    });
    expect(apofasi_anakateuthinsis('POST', 303, '/b', 'http://h.test/a').methodos).toBe('GET');
  });

  it('307/308 διατηρούν μέθοδο και σώμα', () => {
    expect(apofasi_anakateuthinsis('POST', 307, '/b', 'http://h.test/a')).toEqual({
      eidos: 'senenxisi',
      methodos: 'POST',
      url: 'http://h.test/b',
      kratima_somatos: true,
    });
    expect(apofasi_anakateuthinsis('POST', 308, 'http://allo.test/b', 'http://h.test/a')).toEqual({
      eidos: 'senenxisi',
      methodos: 'POST',
      url: 'http://allo.test/b',
      kratima_somatos: true,
    });
  });

  it('μη-3xx, έλλειψη Location ή άκυρο URL σταματούν τον βρόχο', () => {
    expect(apofasi_anakateuthinsis('GET', 200, null, 'http://h.test/a')).toEqual({ eidos: 'telos' });
    expect(apofasi_anakateuthinsis('GET', 201, '/b', 'http://h.test/a')).toEqual({ eidos: 'telos' });
    expect(apofasi_anakateuthinsis('GET', 302, null, 'http://h.test/a')).toEqual({ eidos: 'telos' });
    expect(apofasi_anakateuthinsis('GET', 302, 'http://', 'http://h.test/a')).toEqual({
      eidos: 'telos',
    });
  });
});

describe('anakateuthinsi (με ψεύτικο εκδότη)', () => {
  it('ακολουθεί 2 hops συλλέγοντας cookies και κεφαλίδα Cookie', async () => {
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(302, {
        url: 'http://127.0.0.1/ena',
        thesi: '/dyo',
        set_cookie: ['JSESSIONID=AAA; Path=/'],
      }),
      dimiourgise_apantisi(200, {
        url: 'http://127.0.0.1/dyo',
        set_cookie: ['extra=BBB; Path=/'],
        keimeno: 'τελικό',
      }),
    ]);
    const zakari = new CookieJar();

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/ena' }),
      ekdotis.ekdotis,
      zakari
    );

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe('τελικό');
      expect(apotelesma.timi.katastasi).toBe(200);
      expect(apotelesma.timi.teliko_url).toBe('http://127.0.0.1/dyo');
    }
    expect(ekdotis.kliseis()).toBe(2);
    expect(zakari.pare('JSESSIONID', '127.0.0.1')?.timi).toBe('AAA');
    expect(zakari.pare('extra', '127.0.0.1')?.timi).toBe('BBB');
    expect(ekdotis.teleftaio()?.kefalides['Cookie']).toBe('JSESSIONID=AAA');
  });

  it('POST με 303 γίνεται GET χωρίς σώμα', async () => {
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(303, { url: 'http://127.0.0.1/forma', thesi: '/meta' }),
      dimiourgise_apantisi(200, { url: 'http://127.0.0.1/meta' }),
    ]);

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({
        methodos: 'POST',
        url: 'http://127.0.0.1/forma',
        soma: 'onoma=timi',
        kefalides: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
      ekdotis.ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(true);
    const deftero = ekdotis.teleftaio();
    expect(deftero?.methodos).toBe('GET');
    expect(deftero?.soma).toBeNull();
  });

  it('POST με 307 διατηρεί μέθοδο και σώμα', async () => {
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(307, { url: 'http://127.0.0.1/forma', thesi: '/meta' }),
      dimiourgise_apantisi(200, { url: 'http://127.0.0.1/meta' }),
    ]);

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({
        methodos: 'POST',
        url: 'http://127.0.0.1/forma',
        soma: 'onoma=timi',
      }),
      ekdotis.ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(true);
    const deftero = ekdotis.teleftaio();
    expect(deftero?.methodos).toBe('POST');
    expect(deftero?.soma).toBe('onoma=timi');
  });

  it('υπέρβαση του ορίου ανακατευθύνσεων επιστρέφει DIKTYO', async () => {
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(302, { url: 'http://127.0.0.1/a', thesi: '/b' }),
    ]);

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/a' }),
      ekdotis.ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
      expect(apotelesma.sfalma.minima).toBe(
        `Υπέρβαση μέγιστου αριθμού ανακατευθύνσεων (${MEGISTES_ANAKATEUTHINSEIS})`
      );
    }
    expect(ekdotis.kliseis()).toBe(MEGISTES_ANAKATEUTHINSEIS + 1);
  });

  it('akolouthise_anakateuthinseis=false επιστρέφει την ίδια την 3xx', async () => {
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(302, {
        url: 'http://127.0.0.1/a',
        thesi: '/b',
        set_cookie: ['simata=1; Path=/'],
      }),
      dimiourgise_apantisi(200, { url: 'http://127.0.0.1/b' }),
    ]);
    const zakari = new CookieJar();

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/a', akolouthise: false }),
      ekdotis.ekdotis,
      zakari
    );

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.katastasi).toBe(302);
      expect(apotelesma.timi.teliko_url).toBe('http://127.0.0.1/a');
      expect(apotelesma.timi.keimeno).toBe('προεπιλεγμένο σώμα');
    }
    expect(ekdotis.kliseis()).toBe(1);
    expect(zakari.pare('simata', '127.0.0.1')?.timi).toBe('1');
  });

  it('αποτυχία δικτύου επιστρέφει DIKTYO χωρίς την τιμή του cookie στο μήνυμα', async () => {
    const kliseis: AitimaProsEkdoti[] = [];
    const ekdotis_me_cookie: EkdotisAitimaton = async (aitima) => {
      kliseis.push(aitima);
      if (kliseis.length === 1) {
        return dimiourgise_apantisi(302, {
          url: 'http://127.0.0.1/a',
          thesi: '/b',
          set_cookie: [`JSESSIONID=${MYSTIKO}; Path=/`],
        });
      }
      throw new Error('σφάλμα μεταφοράς');
    };

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/a' }),
      ekdotis_me_cookie,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
      expect(apotelesma.sfalma.minima).not.toContain(MYSTIKO);
    }
  });

  it('δυαδική απάντηση μετατρέπεται σε Uint8Array', async () => {
    const ekdotis = dimiourgise_ekdoti([dimiourgise_apantisi(200, { keimeno: 'dyadiko' })]);

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ typos: 'dyadiko' }),
      ekdotis.ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.dyadiko).toBeInstanceOf(Uint8Array);
      expect(apotelesma.timi.keimeno).toBeUndefined();
      expect(new TextDecoder().decode(apotelesma.timi.dyadiko)).toBe('dyadiko');
    }
  });

  it('συνδυάζει εξωτερικό σήμα ακύρωσης (AKYROTHIKE) και την προωθεί στον εκδότη', async () => {
    const elegktis = new AbortController();
    elegktis.abort();
    const ekdotis = dimiourgise_ekdoti([dimiourgise_apantisi(200)]);

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ simatodotis: elegktis.signal }),
      ekdotis.ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
    expect(ekdotis.kliseis()).toBe(0);
  });

  it('διατηρεί πολλαπλά Set-Cookie (κόμμα στο Expires) σε ανακατεύθυνση', async () => {
    const me_expires = 'enas=1; Expires=Fri, 31 Dec 2099 23:59:59 GMT; Path=/';
    const ekdotis = dimiourgise_ekdoti([
      dimiourgise_apantisi(302, {
        url: 'http://127.0.0.1/ena',
        thesi: '/dyo',
        set_cookie: [me_expires, 'dyo=2; Path=/'],
      }),
      dimiourgise_apantisi(200, { url: 'http://127.0.0.1/dyo', keimeno: 'telos' }),
    ]);
    const zakari = new CookieJar();

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/ena' }),
      ekdotis.ekdotis,
      zakari
    );

    expect(apotelesma.ok).toBe(true);
    expect(zakari.pare('enas', '127.0.0.1')?.timi).toBe('1');
    expect(zakari.pare('dyo', '127.0.0.1')?.timi).toBe('2');
    const kefalida = ekdotis.teleftaio()?.kefalides['Cookie'] ?? '';
    expect(kefalida).toContain('enas=1');
    expect(kefalida).toContain('dyo=2');
  });

  it('διαβάζει Location/Set-Cookie με ανεξάρτητη κεφαλαία (τρίτος εκδότης)', async () => {
    const vimata: ApantisiEkdoti[] = [
      {
        url: 'http://127.0.0.1/ena',
        katastasi: 302,
        kefalides: { Location: ['/dyo'], 'Set-Cookie': ['kapitala=1; Path=/'] },
        keimeno: async () => '',
        dyadiko: async () => new Uint8Array(),
      },
      {
        url: 'http://127.0.0.1/dyo',
        katastasi: 200,
        kefalides: {},
        keimeno: async () => 'telos',
        dyadiko: async () => new TextEncoder().encode('telos'),
      },
    ];
    const ekdotis = dimiourgise_ekdoti(vimata);
    const zakari = new CookieJar();

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/ena' }),
      ekdotis.ekdotis,
      zakari
    );

    expect(apotelesma.ok).toBe(true);
    expect(ekdotis.kliseis()).toBe(2);
    expect(zakari.pare('kapitala', '127.0.0.1')?.timi).toBe('1');
    expect(ekdotis.teleftaio()?.kefalides['Cookie']).toBe('kapitala=1');
  });

  it('συγχωνεύει cookie του καλούντα (πεζό) με το jar σε ΜΙΑ κεφαλίδα Cookie', async () => {
    const ekdotis = dimiourgise_ekdoti([dimiourgise_apantisi(200, { url: 'http://127.0.0.1/ena' })]);
    const zakari = new CookieJar();
    zakari.val(dimiourgise_cookie({ onoma: 'jar', timi: 'j', host: '127.0.0.1' }));

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ kefalides: { cookie: 'kalon=k' } }),
      ekdotis.ekdotis,
      zakari
    );

    expect(apotelesma.ok).toBe(true);
    const kefalides = ekdotis.teleftaio()?.kefalides ?? {};
    const cookie_kleidia = Object.keys(kefalides).filter((k) => k.toLowerCase() === 'cookie');
    expect(cookie_kleidia).toHaveLength(1);
    expect(kefalides[cookie_kleidia[0] ?? '']).toBe('kalon=k; jar=j');
  });

  it('αδειάζει (drain) το σώμα των ενδιάμεσων 30x απαντήσεων', async () => {
    let ena_keimeno = 0;
    let dyo_keimeno = 0;
    const ekdotis: EkdotisAitimaton = async (aitima) => {
      if (aitima.url.endsWith('/ena')) {
        return {
          url: 'http://127.0.0.1/ena',
          katastasi: 302,
          kefalides: { location: ['/dyo'] },
          keimeno: async () => {
            ena_keimeno += 1;
            return 'soma-enomeno';
          },
          dyadiko: async () => new Uint8Array(),
        };
      }
      return {
        url: 'http://127.0.0.1/dyo',
        katastasi: 200,
        kefalides: {},
        keimeno: async () => {
          dyo_keimeno += 1;
          return 'teliko';
        },
        dyadiko: async () => new TextEncoder().encode('teliko'),
      };
    };

    const apotelesma = await anakateuthinsi(
      dimiourgise_basika({ url: 'http://127.0.0.1/ena' }),
      ekdotis,
      new CookieJar()
    );

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe('teliko');
    }
    expect(ena_keimeno).toBe(1);
    expect(dyo_keimeno).toBe(1);
  });
});

let server: Server;
let lenis: number;
let server_b: Server;
let lenis_b: number;
let auth_sto_a = '';

beforeAll(async () => {
  server = createServer((aitima, apantisi) => {
    const url = new URL(aitima.url ?? '/', `http://127.0.0.1:${lenis}`);
    const somata: Buffer[] = [];
    aitima.on('data', (tmima: Buffer) => {
      somata.push(tmima);
    });
    aitima.on('end', () => {
      const soma = Buffer.concat(somata).toString('utf8');
      const cookie = aitima.headers.cookie ?? '';
      switch (url.pathname) {
        case '/arxiki':
          apantisi.writeHead(302, {
            Location: '/telefteo',
            'Set-Cookie': `JSESSIONID=${MYSTIKO}; Path=/; HttpOnly`,
          });
          apantisi.end();
          return;
        case '/braves-303':
          apantisi.writeHead(303, { Location: '/echo' });
          apantisi.end();
          return;
        case '/braves-307':
          apantisi.writeHead(307, { Location: '/echo' });
          apantisi.end();
          return;
        case '/echo':
          apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end(`met<${aitima.method}> len<${soma.length}> cookie<${cookie}>`);
          return;
        case '/telefteo':
          apantisi.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Set-Cookie': 'extra=1; Path=/',
          });
          apantisi.end(`telefteo cookie<${cookie}>`);
          return;
        case '/dyadiko':
          apantisi.writeHead(200, { 'Content-Type': 'application/octet-stream' });
          apantisi.end(Buffer.from([0, 1, 2, 250, 255]));
          return;
        case '/forma':
          apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end(`soma<${soma}> typo<${aitima.headers['content-type'] ?? ''}>`);
          return;
        case '/bradu':
          setTimeout(() => {
            apantisi.writeHead(200);
            apantisi.end('arga');
          }, 200);
          return;
        case '/klisto-lenis':
          apantisi.writeHead(302, {
            Location: 'http://127.0.0.1:1/proorismos',
            'Set-Cookie': `JSESSIONID=${MYSTIKO}; Path=/`,
          });
          apantisi.end();
          return;
        case '/me-auth-xeno':
          auth_sto_a = aitima.headers.authorization ?? '';
          apantisi.writeHead(302, { Location: `http://127.0.0.1:${lenis_b}/proorismos` });
          apantisi.end('meta');
          return;
        case '/me-auth-idio':
          apantisi.writeHead(302, { Location: '/auth-echo' });
          apantisi.end();
          return;
        case '/auth-echo':
          apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end(`auth<${aitima.headers.authorization ?? ''}>`);
          return;
        default:
          apantisi.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end('den vrethike');
      }
    });
  });
  await new Promise<void>((lysi) => {
    server.listen(0, '127.0.0.1', () => {
      lenis = (server.address() as AddressInfo).port;
      lysi();
    });
  });

  server_b = createServer((aitima, apantisi) => {
    const url = new URL(aitima.url ?? '/', `http://127.0.0.1:${lenis_b}`);
    aitima.on('data', () => undefined);
    aitima.on('end', () => {
      switch (url.pathname) {
        case '/proorismos':
          apantisi.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end(`auth<${aitima.headers.authorization ?? ''}>`);
          return;
        default:
          apantisi.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          apantisi.end('den vrethike');
      }
    });
  });
  await new Promise<void>((lysi) => {
    server_b.listen(0, '127.0.0.1', () => {
      lenis_b = (server_b.address() as AddressInfo).port;
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
  await new Promise<void>((lysi) => {
    server_b.close(() => {
      lysi();
    });
  });
});

function diefthinsi(monopathia: string): string {
  return `http://127.0.0.1:${lenis}${monopathia}`;
}

describe('NodeFetchHttpPyli (localhost)', () => {
  it('ακολουθεί 302, σπάνε τα ενδιάμεσα cookies και στέλνονται στο επόμενο hop', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/arxiki'),
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.katastasi).toBe(200);
      expect(apotelesma.timi.keimeno).toContain(`${MYSTIKO}`);
      expect(apotelesma.timi.teliko_url).toBe(diefthinsi('/telefteo'));
      expect(apotelesma.timi.kefalides['set-cookie']).toContain('extra=1');
    }
    expect(pyli.cookie_jar.pare('JSESSIONID', '127.0.0.1')?.timi).toBe(MYSTIKO);
    expect(pyli.cookie_jar.pare('extra', '127.0.0.1')?.timi).toBe('1');
  });

  it('akolouthise_anakateuthinseis=false επιστρέφει την 3xx ως έχει', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/arxiki'),
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.katastasi).toBe(302);
      expect(apotelesma.timi.teliko_url).toBe(diefthinsi('/arxiki'));
    }
  });

  it('POST forma με 303 γίνεται GET χωρίς σώμα', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/braves-303'),
      soma_forma: { onoma: 'timi', kodikas: MYSTIKO },
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe('met<GET> len<0> cookie<>');
    }
  });

  it('POST forma με 307 διατηρεί μέθοδο και σώμα', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/braves-307'),
      soma_forma: { onoma: 'timi' },
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe(
        'met<POST> len<10> cookie<>'
      );
    }
  });

  it('soma_forma αποστέλλεται ως x-www-form-urlencoded', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/forma'),
      soma_forma: { xristis: 'p2970', kodikos: 'mystiko' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe(
        'soma<xristis=p2970&kodikos=mystiko> typo<application/x-www-form-urlencoded>'
      );
    }
  });

  it('soma_json αποστέλλεται ως application/json', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/forma'),
      soma_json: { mathima: 'PLI101' },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.keimeno).toBe('soma<{"mathima":"PLI101"}> typo<application/json>');
    }
  });

  it('xronos_orio_ms επιστρέφει TIMEOUT', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/bradu'),
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 50,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('TIMEOUT');
      expect(apotelesma.sfalma.minima).not.toContain('Mystiko');
    }
  });

  it('αποτυχία σύνδεσης μετά από Set-Cookie επιστρέφει DIKTYO χωρίς μυστικό στο μήνυμα', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/klisto-lenis'),
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
      expect(apotelesma.sfalma.minima).not.toContain(MYSTIKO);
    }
  });

  it('δυαδικό και κειμενικό round-trip', async () => {
    const pyli = new NodeFetchHttpPyli();

    const dyadiko = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/dyadiko'),
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'dyadiko',
    });
    expect(dyadiko.ok).toBe(true);
    if (dyadiko.ok) {
      expect(Array.from(dyadiko.timi.dyadiko ?? [])).toEqual([0, 1, 2, 250, 255]);
    }

    const keimeno = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/telefteo'),
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });
    expect(keimeno.ok).toBe(true);
    if (keimeno.ok) {
      expect(keimeno.timi.dyadiko).toBeUndefined();
      expect(typeof keimeno.timi.keimeno).toBe('string');
    }
  });

  it('HEAD επιστρέφει κενό κείμενο και 404 διατηρείται', async () => {
    const pyli = new NodeFetchHttpPyli();

    const head = await pyli.aitima({
      methodos: 'HEAD',
      url: diefthinsi('/telefteo'),
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });
    expect(head.ok).toBe(true);
    if (head.ok) {
      expect(head.timi.katastasi).toBe(200);
      expect(head.timi.keimeno).toBe('');
    }

    const lixi = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/agnowto'),
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });
    expect(lixi.ok).toBe(true);
    if (lixi.ok) {
      expect(lixi.timi.katastasi).toBe(404);
    }
  });

  it('συμα_forma και soma_json μαζί απορρίπτονται ως MI_EGKYRO_SXIMA', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'POST',
      url: diefthinsi('/forma'),
      soma_forma: { a: '1' },
      soma_json: { b: 2 },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('ρίχνει το Authorization όταν η ανακατεύθυνση αλλάζει host', async () => {
    const pyli = new NodeFetchHttpPyli();
    auth_sto_a = '';

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/me-auth-xeno'),
      kefalides: { authorization: `Bearer ${MYSTIKO}` },
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.teliko_url).toBe(`http://127.0.0.1:${lenis_b}/proorismos`);
      expect(apotelesma.timi.keimeno).toBe('auth<>');
    }
    expect(auth_sto_a).toBe(`Bearer ${MYSTIKO}`);
  });

  it('διατηρεί το Authorization όταν η ανακατεύθυνση μένει στον ίδιο host', async () => {
    const pyli = new NodeFetchHttpPyli();

    const apotelesma = await pyli.aitima({
      methodos: 'GET',
      url: diefthinsi('/me-auth-idio'),
      kefalides: { authorization: `Bearer ${MYSTIKO}` },
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: XORI_ORIO_MS,
      typos_apantisis: 'keimeno',
    });

    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi.teliko_url).toBe(diefthinsi('/auth-echo'));
      expect(apotelesma.timi.keimeno).toBe(`auth<Bearer ${MYSTIKO}>`);
    }
  });
});
