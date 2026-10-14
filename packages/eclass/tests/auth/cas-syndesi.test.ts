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
});
