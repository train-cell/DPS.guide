import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpAitima, HttpApantisi } from '@dps/core';
import { FakeHttp } from '@dps/core';
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
});
