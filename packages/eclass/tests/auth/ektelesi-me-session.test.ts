import { describe, it, expect, beforeEach } from 'vitest';
import type { Apotelesma, HttpAitima, HttpApantisi } from '@dps/core';
import { FakeHttp, ok } from '@dps/core';
import {
  CookieDiaxeiristis,
  ektelesi_me_session,
  VASIKO_URL_ECLASS,
} from '../../src/index.js';
import type { AuthPerivallon, SyndesiStratigiki } from '../../src/auth/typoi.js';

class DummyStratigiki implements SyndesiStratigiki {
  public syndeseis_metritis = 0;
  public prepei_na_apotyxei = false;

  async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
    this.syndeseis_metritis += 1;
    if (this.prepei_na_apotyxei) {
      return {
        ok: false,
        sfalma: { kodikos: 'AUTH_APOTYXIA', minima: 'Αποτυχία επανασύνδεσης' },
      };
    }
    perivallon.cookie_diaxeiristis.apothikefse(
      'PHPSESSID',
      `session_v${this.syndeseis_metritis}`
    );
    return ok(undefined);
  }
}

describe('ektelesi_me_session (L14)', () => {
  let http: FakeHttp;
  let cookie_diaxeiristis: CookieDiaxeiristis;
  let stratigiki: DummyStratigiki;
  let perivallon: AuthPerivallon;

  beforeEach(() => {
    http = new FakeHttp();
    cookie_diaxeiristis = new CookieDiaxeiristis();
    stratigiki = new DummyStratigiki();
    perivallon = {
      http,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    };
  });

  it('αρχική σύνδεση αν δεν υπάρχουν cookies -> εκτέλεση αιτήματος', async () => {
    http.orise_apantisi('/main/portfolio.php', (a: HttpAitima): HttpApantisi => {
      expect(a.kefalides?.['cookie']).toBe('PHPSESSID=session_v1');
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<h1>Portfolio</h1>',
      };
    });

    const res = await ektelesi_me_session(perivallon, stratigiki, {
      methodos: 'GET',
      url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(true);
    expect(stratigiki.syndeseis_metritis).toBe(1);
  });

  it('λήξη session -> ΑΚΡΙΒΩΣ 1 επανασύνδεση -> retry πετυχαίνει', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'old_expired_session');
    let aitimata_metritis = 0;

    http.orise_apantisi('/main/portfolio.php', (a: HttpAitima): HttpApantisi => {
      aitimata_metritis += 1;
      if (aitimata_metritis === 1) {
        // Πρώτο αίτημα: δείχνει ότι το session έληξε (redirect σε login_form.php)
        expect(a.kefalides?.['cookie']).toBe('PHPSESSID=old_expired_session');
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php"><input type="password"></form>',
        };
      }
      // Δεύτερο αίτημα (μετά την 1 επανασύνδεση): επιτυχία
      expect(a.kefalides?.['cookie']).toBe('PHPSESSID=session_v1');
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<h1>Portfolio</h1>',
      };
    });

    const res = await ektelesi_me_session(perivallon, stratigiki, {
      methodos: 'GET',
      url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(true);
    expect(stratigiki.syndeseis_metritis).toBe(1);
    expect(aitimata_metritis).toBe(2);
  });

  it('διπλή λήξη (λήξη -> επανασύνδεση -> ξανά λήξη) -> SESSION_LIXI', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'old_expired_session');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      // Πάντοτε επιστρέφει ληγμένη συνεδρία (redirect σε login)
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
        kefalides: {},
        keimeno: '<form action="/main/login_form.php"><input type="password"></form>',
      };
    });

    const res = await ektelesi_me_session(perivallon, stratigiki, {
      methodos: 'GET',
      url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('SESSION_LIXI');
    }
    // Έκανε ακριβώς 1 απόπειρα επανασύνδεσης και σταμάτησε
    expect(stratigiki.syndeseis_metritis).toBe(1);
  });

  it('λήξη session με HTTP 401 και αποτυχία επανασύνδεσης -> SESSION_LIXI', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'session_expired');
    stratigiki.prepei_na_apotyxei = true;

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      return {
        katastasi: 401,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: 'Unauthorized',
      };
    });

    const res = await ektelesi_me_session(perivallon, stratigiki, {
      methodos: 'GET',
      url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('SESSION_LIXI');
    }
  });
});
