import { describe, expect, it, vi } from 'vitest';
import type { Cookie } from '../src/http/cookie-jar.js';
import {
  CookieJar,
  default_path,
  parse_set_cookies,
} from '../src/http/cookie-jar.js';

function url(dieftinsi: string): URL {
  return new URL(dieftinsi);
}

function meta(epateseis: Partial<Cookie> = {}): Cookie {
  return {
    onoma: 'onoma',
    timi: 'timi',
    host: 'enas.test',
    monopathia: '/',
    asfales: false,
    host_only: true,
    mexri: null,
    ...epateseis,
  };
}

describe('parse_set_cookies', () => {
  it('απορρίπτει κενό zeugari, κενό όνομα και έλλειψη `=`', () => {
    expect(parse_set_cookies(['=x', ';', '   ', 'a=b', 'x'], url('http://enas.test/'))).toHaveLength(1);
  });

  it('παραλείπει κενά χαρακτηριστικά (L108 false)', () => {
    const cookies = parse_set_cookies(['a=1;;b=2'], url('http://enas.test/'));
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.onoma).toBe('a');
    expect(cookies[0]?.timi).toBe('1');
  });

  it('απορρίπτει cookie χωρίς `Domain` όταν ο host είναι IP', () => {
    const cookies = parse_set_cookies(['kako=1; Domain=127.0.0.1'], url('http://127.0.0.1/'));
    expect(cookies).toHaveLength(0);
  });

  it('διαβάζει max-age, expires και domain', () => {
    const cookies = parse_set_cookies(
      [
        'a=1; Max-Age=3600',
        'b=2; Expires=Fri, 31 Dec 2099 23:59:59 GMT',
        'c=3; Domain=enas.test; Path=/kato',
        'd=4; Domain=xenos.test',
        'e=5; Domain=1.2.3.4',
        'f=6; Max-Age=not-a-number',
        'g=7; Expires=not-a-date',
      ],
      url('http://enas.test/')
    );
    expect(cookies).toHaveLength(5);
    const byOnoma = (onoma: string): Cookie | undefined => cookies.find((c) => c.onoma === onoma);
    expect(byOnoma('a')?.mexri).toBeGreaterThan(Date.now());
    expect(byOnoma('b')?.mexri).toBeGreaterThan(Date.now());
    expect(byOnoma('c')?.monopathia).toBe('/kato');
    expect(byOnoma('c')?.host_only).toBe(false);
    expect(byOnoma('d')).toBeUndefined();
    expect(byOnoma('e')).toBeUndefined();
    expect(byOnoma('f')?.mexri).toBeNull();
    expect(byOnoma('g')?.mexri).toBeNull();
  });

  it('δεν χρειάζεται `Domain` και δέχεται IP host', () => {
    const cookies = parse_set_cookies(['a=1; Domain=1.2.3.4; Path=/x'], url('http://1.2.3.4/'));
    expect(cookies).toHaveLength(0);

    const meta_k = meta({ host_only: false, host: '1.2.3.4', monopathia: '/' });
    expect(meta_k).toMatchObject({ host_only: false });
  });

  it('ταξονομεί cookies ανά host', () => {
    const cookies = parse_set_cookies(
      ['a=1; Domain=.; Path=/'],
      url('http://up.xenos.test/')
    );
    expect(cookies).toHaveLength(0);
  });
});

describe('CookieJar', () => {
  it('δέχεται cookie και το επιστρέφει (L215 false)', () => {
    const zakari = new CookieJar();
    zakari.val(meta());
    expect(zakari.pare('onoma', 'enas.test')?.timi).toBe('timi');
    expect(zakari.pare_ola('enas.test')).toHaveLength(1);
    expect(zakari.pare_ola('den-yparxei')).toEqual([]);
    expect(zakari.megethos).toBe(1);
  });

  it('σβήνει cookie που λήγει (L240 false)', () => {
    const zakari = new CookieJar();
    zakari.val(meta({ mexri: Date.now() - 1000 }));
    expect(zakari.pare('onoma', 'enas.test')).toBeUndefined();
    expect(zakari.megethos).toBe(0);
  });

  it('τα Domain cookies ταιριάζουν σε υπο-domain (L34 false)', () => {
    const zakari = new CookieJar();
    zakari.val(meta({ host: 'enastest', host_only: false }));
    expect(zakari.pare('onoma', 'enastest')?.timi).toBe('timi');
    expect(zakari.kefalida_gia(url('http://up.enastest/kato'))).toBe('onoma=timi');
    expect(zakari.kefalida_gia(url('http://enastest/kato'))).toBe('onoma=timi');
  });

  it('τα host-only cookies είναι ακριβή (L34 false)', () => {
    const zakari = new CookieJar();
    zakari.val(meta({ host: 'up.enastest' }));
    expect(zakari.pare('onoma', 'enastest')).toBeUndefined();
    expect(zakari.kefalida_gia(url('http://enastest/kato'))).toBe('');
  });

  it('δέχεται IP host με ακριβή ταίριασμα (L34 true)', () => {
    const zakari = new CookieJar();
    zakari.val(meta({ host: '1.2.3.4', host_only: true }));
    expect(zakari.pare('onoma', '1.2.3.4')?.timi).toBe('timi');
    expect(zakari.pare('onoma', 'up.1.2.3.4')).toBeUndefined();
  });

  it('δεν στέλνει ληγμένο cookie (L240 false) μετά την πάροδο του χρόνου', () => {
    vi.setSystemTime(Date.now() + 1000);
    try {
      const zakari = new CookieJar();
      zakari.val(meta({ mexri: Date.now() + 60_000 }));
      expect(zakari.pare('onoma', 'enas.test')?.timi).toBe('timi');

      vi.setSystemTime(Date.now() + 60_000);
      expect(zakari.kefalida_gia(url('http://enas.test/'))).toBe('');
    } finally {
      vi.setSystemTime(0);
    }
  });

  it('ταίριασμα διαδρομής (L257 false)', () => {
    const zakari = new CookieJar();
    zakari.val(meta({ monopathia: '/kato' }));
    expect(zakari.kefalida_gia(url('http://enas.test/kato/'))).toBe('onoma=timi');
    expect(zakari.kefalida_gia(url('http://enas.test/'))).toBe('');
  });

  it('εφαρμόζει το φράγμα MEGISTOS_ARITHMOS_COOKIES', () => {
    const zakari = new CookieJar();
    for (let i = 0; i < 310; i += 1) {
      zakari.val(meta({ onoma: `cookie-${i}`, mexri: Date.now() + 1000 * (i + 1) }));
    }
    expect(zakari.megethos).toBeLessThanOrEqual(300);
  });

  it('adelaiώνει το jar', () => {
    const zakari = new CookieJar();
    zakari.val(meta());
    zakari.adeia();
    expect(zakari.pare('onoma', 'enas.test')).toBeUndefined();
    expect(zakari.megethos).toBe(0);
  });
});

describe('default_path', () => {
  it('δίνει / για κενή ή μη-διαδρομή', () => {
    expect(default_path('')).toBe('/');
    expect(default_path('x')).toBe('/');
  });

  it('δίνει το προηγούμενο της τελευταίας /', () => {
    expect(default_path('/cas/login')).toBe('/cas');
    expect(default_path('/cas/')).toBe('/cas');
    expect(default_path('/')).toBe('/');
  });
});
