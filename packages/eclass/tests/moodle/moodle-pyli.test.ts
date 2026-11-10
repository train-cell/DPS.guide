import { describe, expect, it, vi } from 'vitest';
import type { Apotelesma, HttpAitima, HttpApantisi, HttpPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { CookieDiaxeiristis } from '../../src/auth/cookie-diaxeiristis.js';
import { MoodlePyli } from '../../src/moodle/moodle-pyli.js';

const BASE = 'https://moodle.example.edu';
const BASE_URL = BASE + '/';

/**
 * Ψεύτικη HttpPyli με routes ανά URL pattern.
 * Κάθε route επιστρέφει ή απάντηση ή σφάλμα.
 */
function httpWith(routes: Record<string, HttpApantisi | Apotelesma<HttpApantisi> | ((request: HttpAitima) => HttpApantisi | Apotelesma<HttpApantisi>)>) {
  const aitima = vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
    for (const [pattern, response] of Object.entries(routes)) {
      if (request.url.includes(pattern)) {
        const result = typeof response === 'function' ? response(request) : response;
        const resolved = (await Promise.resolve(result)) as Apotelesma<HttpApantisi>;
        return resolved.ok === false ? resolved : ok(resolved as HttpApantisi);
      }
    }
    return ok({ katastasi: 200, kefalides: {}, teliko_url: request.url, keimeno: '' });
  });
  return { http: { aitima }, aitima };
}

function makeConnector(overrides?: Partial<Parameters<typeof MoodlePyli>[0]>) {
  const { http, aitima } = httpWith(() => ({
    katastasi: 200,
    kefalides: {},
    teliko_url: BASE_URL,
    keimeno: '',
  }));
  const connector = new MoodlePyli({
    http,
    base_url: BASE,
    username: 'student',
    password: 'password',
    ...overrides,
  });
  return { connector, http, aitima };
}

const LOGIN_FORM = `<form action="/login/index.php" method="post">
  <input type="hidden" name="logintoken" value="nonce">
  <input name="username"><input name="password">
  <button type="submit" name="loginbtn" value="Log in">Log in</button></form>`;

/** Ίδια φόρμα, αλλά όλα τα πεδία είναι χωρίς value και υπάρχουν κουμπιά με type και χωρίς type. */
const LOGIN_FORM_FIELDS = `<form action="/login/index.php" method="post">
  <input type="hidden" name="logintoken">
  <input name="username"><input name="password">
  <button type="button" name="cancel">Άκυρο</button>
  <button name="loginbtn">Log in</button></form>`;

/** Φόρμα χωρίς attribute action — η action γίνεται η URL της φόρμας. */
const LOGIN_FORM_NO_ACTION = `<form method="post">
  <input type="hidden" name="logintoken" value="nonce">
  <input name="username"><input name="password">
  <button type="submit" name="loginbtn" value="Log in">Log in</button></form>`;

/** Φτιάχνει connector με routes και το συνδέει (form path). */
async function authenticated(routes: Record<string, unknown>) {
  const { http, aitima } = httpWith(routes);
  const connector = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
  const login = await connector.syndesi();
  expect(login.ok).toBe(true);
  return { connector, http, aitima };
}

/** Φτιάχνει connector με routes και token (token path) — χωρίς σύνδεση. */
function tokenConnector(routes: Record<string, unknown>) {
  const { http, aitima } = httpWith(routes);
  const connector = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password', webservice_token: 'token' });
  return { connector, http, aitima };
}

/** Φτιάχνει connector με routes και token (token path) — με επιτυχημένη σύνδεση. */
async function authenticatedToken(routes: Record<string, unknown>) {
  const { connector, http, aitima } = await authenticatedTokenNoCheck(routes);
  return { connector, http, aitima };
}

/** Φτιάχνει connector με routes και token — χωρίς επαλήθευση σύνδεσης. */
function authenticatedTokenNoCheck(routes: Record<string, unknown>) {
  const { connector, http, aitima } = tokenConnector(routes);
  (connector as unknown as { authenticated: boolean }).authenticated = true;
  return { connector, http, aitima };
}

describe('MoodlePyli', () => {
  describe('pare_kefalides_lipshs', () => {
    it('κενό object χωρίς cookie', () => {
      const { connector } = makeConnector();
      expect(connector.pare_kefalides_lipshs()).toEqual({});
    });
    it('cookie όταν υπάρχει session', () => {
      const { connector } = makeConnector();
      (connector as unknown as { cookieJar: CookieDiaxeiristis }).cookieJar.apothikefse('MoodleSession', 'sess_id');
      expect(connector.pare_kefalides_lipshs()).toEqual({ cookie: 'MoodleSession=sess_id' });
    });
  });

  describe('syndesi: missing credentials', () => {
    it('άδειο όνομα χρήστη', async () => {
      const { connector } = makeConnector({ username: '' });
      const result = await connector.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('άδειο κωδικό', async () => {
      const { connector } = makeConnector({ password: '' });
      const result = await connector.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
  });

  describe('syndesi: token path', () => {
    it('επιτυχία με token', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'webservice/rest/server.php', keimeno: JSON.stringify({ sitename: 'Moodle' }) },
      });
      const result = await connector.syndesi();
      expect(result.ok).toBe(true);
    });
    it('invalid JSON from web service', async () => {
      const { connector } = tokenConnector({
        '/webservice/rest/server.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'webservice/rest/server.php', keimeno: 'not-json' },
      });
      const result = await connector.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('moodle error απορρίπτει token', async () => {
      const { connector } = tokenConnector({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify({ message: 'invalid token', errorcode: 'invalid_token' }),
        },
      });
      const result = await connector.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('500 στο web service', async () => {
      const { connector } = tokenConnector({
        '/webservice/rest/server.php': apotyxia('DIKTYO', 'Server error'),
      });
      const result = await connector.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
  });

  describe('syndesi: form path', () => {
    it('GET login αποτυχία', async () => {
      const { http } = httpWith({ '/login/index.php': apotyxia('DIKTYO', 'No network') });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
    it('όχι φόρμα login', async () => {
      const { http } = httpWith({
        '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: '<h1>Hi</h1>' },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('external action', async () => {
      const { http } = httpWith({
        '/login/index.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'login/index.php',
          keimeno: `<form action="https://sso.example.edu/login" method="post"><input name="username"><input name="password"></form>`,
        },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('401 login', async () => {
      const post = (request: HttpAitima) => (request.methodos === 'POST'
        ? { katastasi: 401, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: '' }
        : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM });
      const { http } = httpWith({ '/login/index.php': post });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('login failure message', async () => {
      const post = (request: HttpAitima) => (request.methodos === 'POST'
        ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: 'invalid login' }
        : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM });
      const { http } = httpWith({ '/login/index.php': post });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('υπερβολικά μεγάλο HTML φόρμας', async () => {
      const big = LOGIN_FORM.repeat(240_000);
      const { http } = httpWith({ '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: big } });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('POST αποτυχία', async () => {
      const post = (request: HttpAitima) => (request.methodos === 'POST'
        ? apotyxia('DIKTYO', 'No network')
        : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM });
      const { http } = httpWith({ '/login/index.php': post });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
  });

  describe('fere_mathimata', () => {
    it('όχι σύνδεση', async () => {
      const { connector } = makeConnector();
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('token path with courses', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([{ id: 42, fullname: 'Αλγόριθμοι' }]),
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '42', titlos: 'Αλγόριθμοι' }] });
    });
    it('token path without courses', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([]),
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE' } });
    });
    it('token path web service αποτυχία', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': apotyxia('DIKTYO', 'Server error'),
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
    it('token path moodle error', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify({ message: 'no permission', errorcode: 'nopermission' }),
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('token path με μη έγκυρα αντικείμενα', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([{ id: 42, fullname: 'Αλγόριθμοι' }, { id: 'bad', fullname: 123 }, { other: 'x' }]),
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '42', titlos: 'Αλγόριθμοι' }] });
    });
    it('token path not array', async () => {
      const { connector } = await authenticatedToken({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify({ id: 42 }),
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
  });

  describe('syndesi: SSO', () => {
    it('ανιχνεύει SSO μόνο login', async () => {
      const { http } = httpWith({
        '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: '<a href="/auth/saml2/login.php">University SSO</a>' },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: expect.stringContaining('SSO') } });
    });
    it('ανιχνεύει login φόρμα χωρίς username/password', async () => {
      const { http } = httpWith({
        '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: '<form action="/login/index.php"><input name="other"></form>' },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: expect.stringContaining('τυπική φόρμα') } });
    });
  });

  describe('constructor', () => {
    it('απορρίπτει non-HTTPS base_url', () => {
      expect(() => new MoodlePyli({ http: { aitima: async () => ok({} as HttpApantisi) } as HttpPyli, base_url: 'http://moodle.example.edu', username: 'student', password: 'password' })).toThrow('Moodle LMS must use HTTPS.');
    });
  });

  describe('moodleError', () => {
    it('επιστρέφει null όταν το JSON δεν είναι αντικείμενο', async () => {
      const { http } = httpWith({
        '/webservice/rest/server.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'webservice/rest/server.php', keimeno: JSON.stringify(42) },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password', webservice_token: 'token' });
      const result = await bad.syndesi();
      expect(result.ok).toBe(true);
    });
  });

  describe('fere_mathimata: HTML path', () => {
    it('GET αποτυχία', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': apotyxia('DIKTYO', 'No network'),
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
    it('υπερβολικά μεγάλο HTML', async () => {
      const big = '<a href="/course/view.php?id=1">Μάθημα</a>'.repeat(240_000);
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/courses.php', keimeno: big },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('δεν βρίσκει μαθήματα', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/courses.php', keimeno: '<p>Κανένα μάθημα</p>' },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE' } });
    });
    it('περιθωριοποιεί μη έγκυρους συνδέσμους', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'my/courses.php',
          keimeno: `
            <a href="not-a-url">Άκυρο</a>
            <a href="https://other.example.edu/course/view.php?id=1">Εξωτερικό</a>
            <a href="https://moodle.example.edu/course/view.php?id=abc">Μη αριθμός</a>
            <a href="https://moodle.example.edu/course/view.php?id=7">Κανονικό</a>
          `,
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '7', titlos: 'Κανονικό' }] });
    });
    it('χρησιμοποιεί το label ή τον ID ως τίτλο', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'my/courses.php',
          keimeno: `<a href="https://moodle.example.edu/course/view.php?id=3"></a>`,
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '3', titlos: 'Μάθημα 3' }] });
    });
    it('περιθωριοποιεί μη έγκυρο URL συνδέσμου', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'my/courses.php',
          keimeno: `<a href="https://moodle.example.edu/course/view.php?id=8">Κανονικό</a>
            <a href="http://">Άκυρο URL</a>`,
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '8' }] });
    });
    it('απαλείφει διπλότυπα μαθήματα', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'my/courses.php',
          keimeno: `
            <a href="https://moodle.example.edu/course/view.php?id=9">Α</a>
            <a href="https://moodle.example.edu/course/view.php?id=9">Β</a>
          `,
        },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: true, timi: [{ kodikos: '9', titlos: 'Α' }] });
    });
  });

  describe('courseContentsFromApi', () => {
    it('webservice αποτυχία', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': apotyxia('DIKTYO', 'Server error'),
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
    it('moodle error', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify({ message: 'no access', errorcode: 'nopermission' }),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('μη έγκυρη δομή', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify({ course: '42' }),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('έγκυρη δομή με ενότητες και αρχεία', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([
            {
              name: 'Ενότητα 1',
              modules: [
                {
                  name: 'Μάθημα 1',
                  contents: [
                    { type: 'file', fileurl: `${BASE}/pluginfile.php/1/file.pdf`, filename: 'file.pdf', filesize: 1234 },
                    { type: 'file', fileurl: `${BASE}/pluginfile.php/2/file.txt`, filename: 'file.txt' },
                    { type: 'file', fileurl: `https://other.example.edu/pluginfile.php/3/file.pdf`, filename: 'file.pdf' },
                    { type: 'file', fileurl: `${BASE}/pluginfile.php/4/file.png`, filename: 'file.png' },
                    { type: 'resource', fileurl: `${BASE}/pluginfile.php/5/file.pdf`, filename: 'file.pdf' },
                    { type: 'file', fileurl: `${BASE}/pluginfile.php/6/fileb.pdf`, filename: 'fileb.pdf' },
                    { type: 'file', fileurl: `${BASE}/pluginfile.php/7/noext`, filename: 'noext' },
                  ],
                },
              ],
            },
          ]),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const onoma = result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma);
        expect(onoma).toContain('file.pdf');
        expect(onoma).toContain('file.txt');
        expect(onoma).toContain('fileb.pdf');
        expect(onoma).not.toContain('file.png');
        expect(onoma).not.toContain('noext');
        expect(result.timi.find((k) => k.typos === 'arxeio' && k.onoma === 'file.pdf')?.megethos).toBe(1234);
      }
    });
    it('μη έγκυρη ενότητα', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify(['not-an-object']),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.length).toBe(1);
      }
    });
    it('μη έγκυρο module', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([{ name: 'Ενότητα', modules: ['not-an-module'] }]),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.length).toBe(2);
      }
    });
    it('ενότητα με κενό όνομα', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'webservice/rest/server.php',
          keimeno: JSON.stringify([
            {
              name: '',
              modules: [
                { name: 'Μάθημα', contents: [{ type: 'file', fileurl: `${BASE}/pluginfile.php/1/file.pdf`, filename: 'file.pdf' }] },
              ],
            },
          ]),
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.find((k) => k.typos === 'fakelos' && k.diadromi === 'Ενότητα')?.onoma).toBe('Ενότητα');
      }
    });
  });

  describe('request', () => {
    it('dyadiko typos apantisis', async () => {
      const { connector } = makeConnector();
      const request = connector as unknown as { request: (input: Parameters<typeof connector.request>[0]) => Promise<Apotelesma<HttpApantisi>> };
      const result = await request.request({
        methodos: 'GET',
        url: BASE_URL,
        typos_apantisis: 'dyadiko',
      });
      expect(result.ok).toBe(true);
    });
    it('με cookie', async () => {
      const { connector } = makeConnector();
      (connector as unknown as { cookieJar: CookieDiaxeiristis }).cookieJar.apothikefse('MoodleSession', 'sess_id');
      const request = connector as unknown as { request: (input: Parameters<typeof connector.request>[0]) => Promise<Apotelesma<HttpApantisi>> };
      const result = await request.request({
        methodos: 'GET',
        url: BASE_URL,
        typos_apantisis: 'keimeno',
      });
      expect(result.ok).toBe(true);
    });
    it('μη έγκυρη διεύθυνση', async () => {
      const { connector } = makeConnector();
      const request = connector as unknown as { request: (input: Parameters<typeof connector.request>[0]) => Promise<Apotelesma<HttpApantisi>> };
      const result = await request.request({
        methodos: 'GET',
        url: 'not-a-url',
        typos_apantisis: 'keimeno',
      });
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('μη origin διεύθυνση', async () => {
      const { connector } = makeConnector();
      const request = connector as unknown as { request: (input: Parameters<typeof connector.request>[0]) => Promise<Apotelesma<HttpApantisi>> };
      const result = await request.request({
        methodos: 'GET',
        url: 'https://other.example.edu/',
        typos_apantisis: 'keimeno',
      });
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('ανακατεύθυνση σε εξωτερικό', async () => {
      const { http } = httpWith({
        '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: 'https://other.example.edu/', keimeno: LOGIN_FORM },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('μη έγκυρη τελική διεύθυνση', async () => {
      const { http } = httpWith({
        '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: 'not-a-url', keimeno: LOGIN_FORM },
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
  });

  describe('fere_dentro_arxeion', () => {
    it('περιθωριοποιεί μη έγκυρο URL συνδέσμου module', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Κανονικό</a>
            <a href="http://">Άκυρο URL</a>`,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/diaphaneies.pdf">PDF</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('diaphaneies.pdf');
      }
    });
    it('μη έγκυρη αναφορά αρχείου', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="http://">Άκυρο URL</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.length).toBe(1);
      }
    });
    it('HEAD με μη έγκυρο teliko_url', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/download.php?id=1">Εξωτερικό</a>`,
        },
        '/mod/resource/download.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: 'not-a-url',
          keimeno: 'external',
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').length).toBe(0);
      }
    });
    it('εμφωλευμένη αναφορά μέσω GET', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/download.php?id=1">Εξωτερικό</a>`,
        },
        '/mod/resource/download.php?id=1': (request: HttpAitima) => (request.methodos === 'HEAD'
          ? apotyxia('DIKTYO', 'No network')
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'mod/resource/download.php?id=1', keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/nested.pdf">Εμφωλευμένο</a>` }),
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('nested.pdf');
      }
    });
    it('διπλότυπη διαδρομή αρχείου', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/file.pdf">Α</a>
            <a href="https://moodle.example.edu/pluginfile.php/1/file.pdf?x">Β</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').length).toBe(1);
      }
    });
    it('όχι σύνδεση', async () => {
      const { connector } = makeConnector();
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    });
    it('invalid course ID', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
      });
      const result = await connector.fere_dentro_arxeion('PLI 101');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('GET αποτυχία', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': apotyxia('DIKTYO', 'No network'),
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DIKTYO' } });
    });
    it('υπερβολικά μεγάλο HTML', async () => {
      const big = '<a href="/mod/resource/view.php?id=1">Υλικό</a>'.repeat(240_000);
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'course/view.php?id=42', keimeno: big },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
    it('module pages με αρχεία και εμφωλευμένα references', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Διαφάνειες</a>
            <a href="https://moodle.example.edu/mod/resource/view.php?id=2"></a>`,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/diaphaneies.pdf">PDF</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('diaphaneies.pdf');
      }
    });
    it('label με control character -> cleanPath (L79)', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">\u0001Διαφάνειες</a>`,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/diaphaneies.pdf">PDF</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('diaphaneies.pdf');
      }
    });
    it('module page 500 και resource view με άδειο body', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Διαφάνειες</a>`,
        },
        '/mod/resource/view.php?id=1': apotyxia('DIKTYO', 'Server error'),
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
    });
    it('περιθωριοποιεί μη έγκυρους συνδέσμους module', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `
            <a href="not-a-url">Άκυρο</a>
            <a href="https://other.example.edu/mod/resource/view.php?id=1">Εξωτερικό</a>
            <a href="https://moodle.example.edu/mod/resource/view.php?id=1">Κανονικό</a>
          `,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/diaphaneies.pdf">PDF</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('diaphaneies.pdf');
      }
    });
    it('module link με μη έγκυρο port', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Κανονικό</a>
            <a href="https://moodle.example.edu:mod/mod/resource/view.php?id=1">Άκυρο Port</a>`,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/diaphaneies.pdf">PDF</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma)).toContain('diaphaneies.pdf');
      }
    });
    it('reference με μη έγκυρο port', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu:mod/pluginfile.php/1/file.pdf">Άκυρο Port</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').length).toBe(0);
      }
    });
    it('module page με υπερβολικά μεγάλο body', async () => {
      const big = `<a href="https://moodle.example.edu/pluginfile.php/1/x.pdf">PDF</a>`.repeat(240_000);
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Διαφάνειες</a>`,
        },
        '/mod/resource/view.php?id=1': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'mod/resource/view.php?id=1', keimeno: big },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.timi.filter((k) => k.typos === 'arxeio').length).toBe(0);
      }
    });
    it('resource view με κενό body -> addFileReference στο teliko_url', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Διαφάνειες</a>`,
        },
        '/mod/resource/view.php?id=1': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'mod/resource/view.php?id=1',
          keimeno: '',
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
    });
    it('course page with file references', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/pluginfile.php/1/file&#x1F600;.pdf">X</a>
            <a href="https://moodle.example.edu/pluginfile.php/2/file&#65;.pdf">Y</a>
            <a href="https://moodle.example.edu/pluginfile.php/1/&#x20;">Κενό onoma</a>
            <a>Ασύνδετο</a>`,
        },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const onoma = result.timi.filter((k) => k.typos === 'arxeio').map((k) => k.onoma);
        expect(onoma).toContain('file%F0%9F%98%80.pdf');
        expect(onoma).toContain('fileA.pdf');
      }
    });
  });

  describe('fere_dentro_arxeion: απαντήσεις χωρίς keimeno', () => {
    it('course page', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'course/view.php?id=42' },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.timi.length).toBe(1);
    });
    it('module page', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/course/view.php?id=42': {
          katastasi: 200,
          kefalides: {},
          teliko_url: BASE_URL + 'course/view.php?id=42',
          keimeno: `<a href="https://moodle.example.edu/mod/resource/view.php?id=1">Διαφάνειες</a>`,
        },
        '/mod/resource/view.php?id=1': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'mod/resource/view.php?id=1' },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result.ok).toBe(true);
    });
    it('webservice', async () => {
      const { connector } = await authenticatedTokenNoCheck({
        '/webservice/rest/server.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'webservice/rest/server.php' },
      });
      const result = await connector.fere_dentro_arxeion('42');
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA' } });
    });
  });

  describe('fere_mathimata: απάντηση χωρίς keimeno', () => {
    it('my/courses.php', async () => {
      const { connector } = await authenticated({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
        '/my/courses.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/courses.php' },
      });
      const result = await connector.fere_mathimata();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE' } });
    });
  });

  describe('syndesi: φόρμα χωρίς keimeno', () => {
    it('GET login', async () => {
      const { http } = httpWith({ '/login/index.php': { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php' } });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'MI_YPOSTIRIZOMENO' } });
    });
    it('POST login', async () => {
      const { http } = httpWith({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM }),
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result.ok).toBe(true);
    });
    it('φόρμα χωρίς action', async () => {
      const { http } = httpWith({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM_NO_ACTION }),
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result.ok).toBe(true);
    });
  });

  describe('syndesi: πεδία φόρμας login', () => {
    it('όλα τα πεδία', async () => {
      const { http } = httpWith({
        '/login/index.php': (request: HttpAitima) => (request.methodos === 'POST'
          ? { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'my/', keimeno: 'Welcome' }
          : { katastasi: 200, kefalides: {}, teliko_url: BASE_URL + 'login/index.php', keimeno: LOGIN_FORM_FIELDS }),
      });
      const bad = new MoodlePyli({ http, base_url: BASE, username: 'student', password: 'password' });
      const result = await bad.syndesi();
      expect(result.ok).toBe(true);
    });
  });
});
