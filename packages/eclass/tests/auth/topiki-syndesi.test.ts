import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpAitima, HttpApantisi } from '@dps/core';
import { FakeHttp } from '@dps/core/testing';
import {
  CookieDiaxeiristis,
  TopikiSyndesi,
  VASIKO_URL_ECLASS,
} from '../../src/index.js';

describe('TopikiSyndesi (L14)', () => {
  let http: FakeHttp;
  let cookie_diaxeiristis: CookieDiaxeiristis;

  beforeEach(() => {
    http = new FakeHttp();
    cookie_diaxeiristis = new CookieDiaxeiristis();
  });

  it('επιτυχής σύνδεση: ανάκτηση φόρμας -> υποβολή διαπιστευτηρίων -> αποθήκευση cookies', async () => {
    // 1. GET login_form.php
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {
            'set-cookie': 'PHPSESSID=session_arxiko_123; path=/',
          },
          keimeno: `
            <html>
              <form action="/main/login_form.php" method="post">
                <input type="text" name="uname" value="">
                <input type="password" name="pass" value="">
                <input type="hidden" name="csrf_token" value="xyz789">
                <button type="submit">Είσοδος</button>
              </form>
            </html>
          `,
        };
      }
      // 2. POST login_form.php (επιτυχία -> redirect σε portfolio)
      expect(a.soma_forma).toBeDefined();
      expect(a.soma_forma?.['uname']).toBe('testuser');
      expect(a.soma_forma?.['pass']).toBe('correctpass');
      expect(a.soma_forma?.['csrf_token']).toBe('xyz789');

      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {
          'set-cookie': 'PHPSESSID=session_syndedemenos_456; path=/',
        },
        keimeno: '<html><body><h1>Χαρτοφυλάκιο Χρήστη</h1></body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({
      onoma_xristi: 'testuser',
      kodikos: 'correctpass',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(true);
    expect(cookie_diaxeiristis.exei_session()).toBe(true);
    expect(cookie_diaxeiristis.pare_kefalida()).toContain('PHPSESSID=session_syndedemenos_456');
    expect(http.kliseis.length).toBe(2);
  });

  it('στέλνει το named submit control και το action query της φόρμας Thales', async () => {
    const thales = 'https://thales.cs.unipi.gr';
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      expect(a.methodos).toBe('GET');
      return {
        katastasi: 200,
        teliko_url: `${thales}/main/login_form.php`,
        kefalides: {},
        keimeno: `
          <form action='/?login_page=1' method='post'>
            <input type='text' name='uname'>
            <input type='password' name='pass'>
            <input type='submit' name='submit' value='Είσοδος'>
          </form>
        `,
      };
    });
    http.orise_apantisi('/?login_page=1', (a: HttpAitima): HttpApantisi => {
      expect(a.methodos).toBe('POST');
      expect(a.url).toBe(`${thales}/?login_page=1`);
      expect(a.soma_forma).toMatchObject({
        uname: 'testuser',
        pass: 'correctpass',
        submit: 'Είσοδος',
      });
      return {
        katastasi: 200,
        teliko_url: `${thales}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body><h1>Χαρτοφυλάκιο</h1></body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({
      base_url: thales,
      onoma_xristi: 'testuser',
      kodikos: 'correctpass',
    });
    const result = await stratigiki.syndesi({ http, base_url: thales, cookie_diaxeiristis });

    expect(result.ok).toBe(true);
    expect(http.kliseis).toHaveLength(2);
  });

  it('λάθος κωδικός: ΜΙΑ ΜΟΝΟ προσπάθεια POST (ποτέ retry) -> AUTH_APOTYXIA', async () => {
    let post_metritis = 0;

    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: `
            <form action="/main/login_form.php" method="post">
              <input type="text" name="uname">
              <input type="password" name="pass">
            </form>
          `,
        };
      }
      post_metritis += 1;
      // Η σελίδα επιστρέφει σφάλμα και επανεμφανίζει τη φόρμα
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
        kefalides: {},
        keimeno: `
          <div class="alert alert-danger">Εσφαλμένο όνομα χρήστη ή κωδικός πρόσβασης</div>
          <form action="/main/login_form.php" method="post">
            <input type="text" name="uname">
            <input type="password" name="pass">
          </form>
        `,
      };
    });

    const stratigiki = new TopikiSyndesi({
      onoma_xristi: 'testuser',
      kodikos: 'wrongpass',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
    // Υποχρεωτικός κανόνας §8: Ακριβώς 1 POST αίτημα!
    expect(post_metritis).toBe(1);
    expect(http.kliseis.length).toBe(2); // 1 GET + 1 POST
  });

  it('κενά διαπιστευτήρια -> AUTH_APOTYXIA χωρίς να σταλεί κανένα αίτημα', async () => {
    const stratigiki = new TopikiSyndesi({
      onoma_xristi: '',
      kodikos: '',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
    expect(http.kliseis.length).toBe(0);
  });

  it('σφάλμα δικτύου στο GET -> επιστρέφει DIKTYO', async () => {
    http.orise_apantisi('/main/login_form.php', () => {
      throw new Error('Connection refused');
    });

    const stratigiki = new TopikiSyndesi({
      onoma_xristi: 'user',
      kodikos: 'pass',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('HTTP 401 στο POST -> AUTH_APOTYXIA', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
        };
      }
      return {
        katastasi: 401,
        teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
        kefalides: {},
        keimeno: 'Unauthorized',
      };
    });

    const stratigiki = new TopikiSyndesi({
      onoma_xristi: 'user',
      kodikos: 'badpass',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('στέλνει υπάρχον cookie στο GET', async () => {
    let dektika_kefalides: Record<string, string> = {};

    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      dektika_kefalides = { ...a.kefalides };
      if (a.methodos === 'POST') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
          kefalides: {},
          keimeno: '<html><body>OK</body></html>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
        kefalides: {},
        keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
      };
    });

    cookie_diaxeiristis.apothikefse('PHPSESSID', 'pre_existing');

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(dektika_kefalides['cookie']).toBe('PHPSESSID=pre_existing');
    expect(res.ok).toBe(true);
  });

  it('σφάλμα δικτύου στο POST -> DIKTYO', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
        };
      }
      throw new Error('Connection refused');
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
    expect(http.kliseis.length).toBe(2); // 1 GET + 1 POST
  });

  it('POST με φόρμα σύνδεσης στο response -> AUTH_APOTYXIA', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<form action="/main/portfolio.php"><input type="password" name="pass"></form>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('form action απόλυτο (http) -> χρησιμοποιείται ως έχει', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="https://sso.unipi.gr/login" method="post"><input name="uname"></form>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });
    http.orise_apantisi('sso.unipi.gr/login', (a: HttpAitima): HttpApantisi => {
      expect(a.url).toBe('https://sso.unipi.gr/login');
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('form action σχετική (χωρίς /) -> συνθέτει με base_url', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="login" method="post"><input name="uname"></form>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });
    http.orise_apantisi('/main/login', (a: HttpAitima): HttpApantisi => {
      expect(a.url).toBe(`${VASIKO_URL_ECLASS}/main/login`);
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('input χωρίς name -> παραλείπεται από τα πεδία', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: `
            <form action="/main/login_form.php">
              <input type="text" name="uname">
              <input type="text">
              <input type="password" name="pass">
            </form>
          `,
        };
      }
      expect(a.soma_forma).toEqual({ uname: 'u', pass: 'p' });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('input text με διαφορετικό όνομα -> η else-if δεν παίρνει', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: `
            <form action="/main/login_form.php">
              <input type="text" name="onoma_xristi">
              <input type="text" name="epitheto">
            </form>
          `,
        };
      }
      expect(a.soma_forma).toEqual({ onoma_xristi: 'u', pass: 'p' });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('response GET χωρίς keimeno -> συνεχίζει με κενό', async () => {
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
    }));

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('response POST χωρίς keimeno -> φόρμα σύνδεσης', async () => {
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
      keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
    }));
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
    }));

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('ανακατεύθυνση σε login μετά το POST -> AUTH_APOTYXIA', async () => {
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
      keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
    }));
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
      keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
    }));

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('form χωρίς action -> fallback', async () => {
    let metritis = 0;
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form><input type="text" name="uname"></form>',
        };
      }
      metritis += 1;
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
    expect(metritis).toBe(1);
  });

  it('input χωρίς type -> text, input χωρίς name -> παραλείπεται', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: `
            <form action="/main/login_form.php">
              <input name="uname">
              <input type="password" name="pass">
              <input type="hidden" name="csrf_token" value="xyz">
              <button type="submit" name="login">Είσοδος</button>
            </form>
          `,
        };
      }
      expect(a.soma_forma).toMatchObject({
        uname: 'u',
        pass: 'p',
        csrf_token: 'xyz',
        login: '',
      });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('button χωρίς type -> submit, button χωρίς name -> παραλείπεται', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: `
            <form action="/main/login_form.php">
              <input type="text" name="uname">
              <button name="login">Είσοδος</button>
              <button type="reset">Cancel</button>
            </form>
          `,
        };
      }
      expect(a.soma_forma).toMatchObject({
        uname: 'u',
        login: '',
      });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('pare_idiotita: τιμή χωρίς εισαγωγικά', async () => {
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action=/main/login_form.php><input name=usr></form>',
        };
      }
      expect(a.soma_forma).toMatchObject({ usr: 'u' });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('χωρίς base_url -> VASIKO_URL_ECLASS', async () => {
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
      kefalides: {},
      keimeno: '<form action="/main/login_form.php"><input type="password" name="pass"></form>',
    }));
    http.orise_apantisi('/main/login_form.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      kefalides: {},
      keimeno: '<html><body>OK</body></html>',
    }));

    const stratigiki = new TopikiSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
    expect(http.kliseis[0].url).toBe(`${VASIKO_URL_ECLASS}/main/login_form.php`);
  });
});
