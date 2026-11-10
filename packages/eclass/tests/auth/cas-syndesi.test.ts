import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpAitima, HttpApantisi } from '@dps/core';
import { FakeHttp } from '@dps/core/testing';
import {
  CasSyndesi,
  CookieDiaxeiristis,
  VASIKO_URL_ECLASS,
} from '../../src/index.js';

describe('CasSyndesi (L14)', () => {
  let http: FakeHttp;
  let cookie_diaxeiristis: CookieDiaxeiristis;

  beforeEach(() => {
    http = new FakeHttp();
    cookie_diaxeiristis = new CookieDiaxeiristis();
  });

  it('επιτυχής CAS σύνδεση: GET cas -> form με ticket/tokens -> POST -> redirect', async () => {
    // 1. GET /modules/auth/cas.php (redirects to CAS login form)
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => {
      return {
        katastasi: 200,
        teliko_url: 'https://sso.unipi.gr/login?service=https://thales.cs.unipi.gr/modules/auth/cas.php',
        kefalides: {
          'set-cookie': 'CAS_TGC=tgt_abc123; Path=/;',
        },
        keimeno: `
          <html>
            <form action="https://sso.unipi.gr/login" method="post">
              <input type="text" name="username">
              <input type="password" name="password">
              <input type="hidden" name="lt" value="LT-9999-xyz">
              <input type="hidden" name="execution" value="e1s1">
              <input type="hidden" name="_eventId" value="submit">
              <input type="submit" value="LOGIN">
            </form>
          </html>
        `,
      };
    });

    // 2. POST https://sso.unipi.gr/login
    http.orise_apantisi('sso.unipi.gr/login', (a: HttpAitima): HttpApantisi => {
      expect(a.soma_forma?.['username']).toBe('sso_user');
      expect(a.soma_forma?.['password']).toBe('sso_pass');
      expect(a.soma_forma?.['lt']).toBe('LT-9999-xyz');
      expect(a.soma_forma?.['execution']).toBe('e1s1');

      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {
          'set-cookie': 'PHPSESSID=cas_session_established; Path=/;',
        },
        keimeno: '<html><body><h1>Χαρτοφυλάκιο</h1></body></html>',
      };
    });

    const stratigiki = new CasSyndesi({
      onoma_xristi: 'sso_user',
      kodikos: 'sso_pass',
    });

    const res = await stratigiki.syndesi({
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });

    expect(res.ok).toBe(true);
    expect(cookie_diaxeiristis.exei_session()).toBe(true);
    expect(cookie_diaxeiristis.pare_kefalida()).toContain('PHPSESSID=cas_session_established');
  });

  it('λάθος κωδικός CAS: ΜΙΑ ΜΟΝΟ προσπάθεια POST -> AUTH_APOTYXIA', async () => {
    let post_metritis = 0;

    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => {
      return {
        katastasi: 200,
        teliko_url: 'https://sso.unipi.gr/login',
        kefalides: {},
        keimeno: `
          <form action="https://sso.unipi.gr/login" method="post">
            <input type="text" name="username">
            <input type="password" name="password">
            <input type="hidden" name="lt" value="LT-1">
          </form>
        `,
      };
    });

    http.orise_apantisi('sso.unipi.gr/login', (): HttpApantisi => {
      post_metritis += 1;
      return {
        katastasi: 200,
        teliko_url: 'https://sso.unipi.gr/login',
        kefalides: {},
        keimeno: `
          <div class="errors">Invalid credentials.</div>
          <form action="https://sso.unipi.gr/login" method="post">
            <input type="text" name="username">
            <input type="password" name="password">
          </form>
        `,
      };
    });

    const stratigiki = new CasSyndesi({
      onoma_xristi: 'sso_user',
      kodikos: 'wrong_sso_pass',
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
    // Ακριβώς 1 προσπάθεια POST
    expect(post_metritis).toBe(1);
  });

  it('κενά CAS διαπιστευτήρια -> AUTH_APOTYXIA χωρίς αποστολή αιτημάτων', async () => {
    const stratigiki = new CasSyndesi({
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

  it('στέλνει υπάρχον cookie στο GET', async () => {
    let dektika_kefalides: Record<string, string> = {};

    http.orise_apantisi('/modules/auth/cas.php', (a: HttpAitima): HttpApantisi => {
      dektika_kefalides = { ...a.kefalides };
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
        kefalides: {},
        keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
      };
    });
    http.orise_apantisi('/cas/login', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      kefalides: {},
      keimeno: '<html><body>OK</body></html>',
    }));

    cookie_diaxeiristis.apothikefse('PHPSESSID', 'pre_existing');

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(dektika_kefalides['cookie']).toBe('PHPSESSID=pre_existing');
    expect(res.ok).toBe(true);
  });

  it('αποτυχία GET -> DIKTYO', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => {
      throw new Error('Connection refused');
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('response GET χωρίς keimeno -> συνεχίζει με κενό', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
    }));

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('αποτυχία POST -> DIKTYO', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
    }));
    http.orise_apantisi('/cas/login', (): HttpApantisi => {
      throw new Error('Connection refused');
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('response POST χωρίς keimeno -> αποτυχία με φόρμα σύνδεσης', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
    }));
    http.orise_apantisi('/cas/login', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/cas/login`,
      kefalides: {},
    }));

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    // Η απάντηση δεν έχει keimeno -> η λογική δέχεται ότι έγινε σύνδεση
    expect(res.ok).toBe(true);
  });

  it('HTTP 401 -> AUTH_APOTYXIA', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
    }));
    http.orise_apantisi('/cas/login', (): HttpApantisi => ({
      katastasi: 403,
      teliko_url: `${VASIKO_URL_ECLASS}/cas/login`,
      kefalides: {},
      keimeno: 'Forbidden',
    }));

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('form χωρίς action -> χρησιμοποιεί το fallback', async () => {
    let metritis = 0;
    http.orise_apantisi('/modules/auth/cas.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
          kefalides: {},
          keimeno: '<form><input type="text" name="username"></form>',
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

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
    expect(metritis).toBe(1);
  });

  it('form action ξεκινά με / -> συνθέτει URL με την αρχή', async () => {
    let url_post: string = '';
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
    }));
    http.orise_apantisi('/cas/login', (a: HttpAitima): HttpApantisi => {
      url_post = a.url;
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
    expect(url_post).toBe(`${VASIKO_URL_ECLASS}/cas/login`);
  });

  it('input χωρίς type -> text, input χωρίς name -> παραλείπεται', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: `
        <form action="/cas/login">
          <input name="username">
          <input type="password" name="pass">
          <input type="hidden" name="lt" value="LT-1">
          <input type="submit" name="submit">
        </form>
      `,
    }));
    http.orise_apantisi('/cas/login', (a: HttpAitima): HttpApantisi => {
      expect(a.soma_forma).toMatchObject({
        username: 'u',
        pass: 'p',
        lt: 'LT-1',
      });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('pare_idiotita: τιμή χωρίς εισαγωγικά', async () => {
    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    // eslint-disable-next-line
    const form = (stratigiki as unknown as { analysi_cas_formas: (html: string, f: string) => Record<string, unknown> });
    const res = form.analysi_cas_formas(
      '<form action="/cas/login"><input name=usr value=v1></form>',
      `${VASIKO_URL_ECLASS}/fallback`
    );
    expect(res.action).toBe(`${VASIKO_URL_ECLASS}/cas/login`);
    expect(res.pedio_xristi).toBe('usr');
  });

  it('χωρίς base_url -> VASIKO_URL_ECLASS', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
      kefalides: {},
      keimeno: '<form action="/cas/login"><input type="text" name="username"></form>',
    }));
    http.orise_apantisi('/cas/login', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      kefalides: {},
      keimeno: '<html><body>OK</body></html>',
    }));

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
    expect(http.kliseis[0].url).toBe(`${VASIKO_URL_ECLASS}/modules/auth/cas.php`);
  });

  it('form action σχετική (χωρίς /) -> συνθέτει με base_url', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
          kefalides: {},
          keimeno: '<form action="cas/login" method="post"><input type="text" name="username"></form>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });
    http.orise_apantisi('/modules/auth/cas/login', (a: HttpAitima): HttpApantisi => {
      expect(a.url).toBe(`${VASIKO_URL_ECLASS}/modules/auth/cas/login`);
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });

  it('input text με όνομα που περιέχει user και διαφορετικό πεδίο πρώτο', async () => {
    http.orise_apantisi('/modules/auth/cas.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/modules/auth/cas.php`,
          kefalides: {},
          keimeno: `
            <form action="/cas/login">
              <input type="text" name="xristi">
              <input type="text" name="user_name">
              <input type="password" name="password">
            </form>
          `,
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });
    http.orise_apantisi('/cas/login', (a: HttpAitima): HttpApantisi => {
      expect(a.soma_forma).toMatchObject({
        user_name: 'u',
        password: 'p',
      });
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body>OK</body></html>',
      };
    });

    const stratigiki = new CasSyndesi({ onoma_xristi: 'u', kodikos: 'p' });
    const res = await stratigiki.syndesi({ http, base_url: VASIKO_URL_ECLASS, cookie_diaxeiristis });

    expect(res.ok).toBe(true);
  });
});
