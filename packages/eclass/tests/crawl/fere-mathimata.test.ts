import { describe, it, expect, beforeEach } from 'vitest';
import type { Apotelesma, HttpAitima, HttpApantisi } from '@dps/core';
import { ok } from '@dps/core';
import { FakeHttp } from '@dps/core/testing';
import {
  CookieDiaxeiristis,
  fere_mathimata,
  VASIKO_URL_ECLASS,
} from '../../src/index.js';
import type { AuthPerivallon, SyndesiStratigiki } from '../../src/auth/typoi.js';

class DummyStratigiki implements SyndesiStratigiki {
  public syndeseis_metritis = 0;

  async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
    this.syndeseis_metritis += 1;
    perivallon.cookie_diaxeiristis.apothikefse(
      'PHPSESSID',
      `session_ok_${this.syndeseis_metritis}`
    );
    return ok(undefined);
  }
}

describe('fere_mathimata (L15)', () => {
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

  it('ανακτά και αναλύει μαθήματα από HTML portfolio με ελληνικούς τίτλους', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'valid_sess');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: `
          <html>
            <body>
              <div class="courses-list">
                <a href="/courses/PLI101/">Προγραμματισμός και Βασικές Αρχές Υπολογιστών</a>
                <a href="https://thales.cs.unipi.gr/courses/PLI200/">Δομές Δεδομένων και Αλγόριθμοι</a>
                <a href="/courses/ANA100/">Εφαρμοσμένη Ανάλυση Δεδομένων</a>
              </div>
            </body>
          </html>
        `,
      };
    });

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.length).toBe(3);
      expect(res.timi[0]).toEqual({
        kodikos: 'PLI101',
        titlos: 'Προγραμματισμός και Βασικές Αρχές Υπολογιστών',
        url: `${VASIKO_URL_ECLASS}/courses/PLI101/`,
        epilegmeno: true,
      });
      expect(res.timi[1]?.kodikos).toBe('PLI200');
      expect(res.timi[2]?.kodikos).toBe('ANA100');
    }
  });

  it('υποστηρίζει JSON μορφή μαθημάτων (από fixtures)', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'valid_sess');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: { 'content-type': 'application/json' },
        keimeno: JSON.stringify([
          {
            kodikos: 'PLI101',
            titlos: 'Προγραμματισμός και Βασικές Αρχές',
            url: 'https://thales.cs.unipi.gr/courses/PLI101/',
            epilegmeno: true,
          },
        ]),
      };
    });

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.length).toBe(1);
      expect(res.timi[0]?.kodikos).toBe('PLI101');
    }
  });

  it('κενή λίστα μαθημάτων -> επιστρέφει DEN_VRETHIKE (ποτέ κενή επιτυχία)', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'valid_sess');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<html><body><p>Δεν υπάρχουν εγγεγραμμένα μαθήματα</p></body></html>',
      };
    });

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('λήξη session κατά την ανάκτηση -> 1 επανασύνδεση -> επιτυχής ανάκτηση', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'expired_sess');
    let kliseis_metritis = 0;

    http.orise_apantisi('/main/portfolio.php', (a: HttpAitima): HttpApantisi => {
      kliseis_metritis += 1;
      if (kliseis_metritis === 1) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php"><input type="password"></form>',
        };
      }
      expect(a.kefalides?.['cookie']).toBe('PHPSESSID=session_ok_1');
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: '<a href="/courses/PLI101/">Μάθημα PLI101</a>',
      };
    });

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(true);
    expect(stratigiki.syndeseis_metritis).toBe(1);
    if (res.ok) {
      expect(res.timi.length).toBe(1);
      expect(res.timi[0]?.kodikos).toBe('PLI101');
    }
  });

  it('σφάλμα διακομιστή HTTP 500 -> DIKTYO', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'sess');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => {
      return {
        katastasi: 500,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: {},
        keimeno: 'Internal Server Error',
      };
    });

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('μη έγκυρο σχήμα μαθήματος -> MI_EGKYRO_SXIMA', async () => {
    cookie_diaxeiristis.apothikefse('PHPSESSID', 'sess');

    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      kefalides: { 'content-type': 'application/json' },
      keimeno: JSON.stringify([{ kodikos: 12345 }]), // invalid schema (kodikos must be string)
    }));

    const res = await fere_mathimata(perivallon, stratigiki);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});
