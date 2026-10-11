import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpAitima, HttpApantisi } from '@dps/core';
import { FakeHttp, MnimiApothiki } from '@dps/core';
import {
  CookieDiaxeiristis,
  DpsEclassPyli,
  TopikiSyndesi,
  VASIKO_URL_ECLASS,
} from '../src/index.js';

describe('DpsEclassPyli (Gateway Contract)', () => {
  let http: FakeHttp;
  let cookie_diaxeiristis: CookieDiaxeiristis;
  let pyli: DpsEclassPyli;

  beforeEach(() => {
    http = new FakeHttp();
    cookie_diaxeiristis = new CookieDiaxeiristis();

    const stratigiki = new TopikiSyndesi({
      onoma_xristi: 'foititis',
      kodikos: 'mystiko123',
    });

    pyli = new DpsEclassPyli({
      http,
      stratigiki,
      base_url: VASIKO_URL_ECLASS,
      cookie_diaxeiristis,
    });
  });

  it('πλήρης κύκλος: syndesi -> fere_mathimata -> fere_dentro_arxeion -> sygxronise', async () => {
    // 1. Mock Login
    http.orise_apantisi('/main/login_form.php', (a: HttpAitima): HttpApantisi => {
      if (a.methodos === 'GET') {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/main/login_form.php`,
          kefalides: {},
          keimeno: '<form action="/main/login_form.php" method="post"><input type="password" name="pass"></form>',
        };
      }
      return {
        katastasi: 200,
        teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
        kefalides: { 'set-cookie': 'PHPSESSID=live_token_777; path=/' },
        keimeno: '<h1>Portfolio</h1>',
      };
    });

    // 2. Mock Portfolio
    http.orise_apantisi('/main/portfolio.php', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/main/portfolio.php`,
      kefalides: {},
      keimeno: `
        <a href="/courses/PLI101/">Προγραμματισμός Υπολογιστών</a>
      `,
    }));

    // 3. Mock File Download
    const binary = new TextEncoder().encode('Εργασία εξαμήνου');
    http.orise_apantisi('ergasia.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/ergasia.pdf`,
      kefalides: {},
      dyadiko: binary,
    }));

    // 4. Mock Documents
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('document/')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: `
            <table>
              <tr><td><a href="/courses/PLI101/document/ergasia.pdf">ergasia.pdf</a></td><td>100 KB</td></tr>
            </table>
          `,
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    // Εκτέλεση syndesi
    const syndesi_res = await pyli.syndesi();
    expect(syndesi_res.ok).toBe(true);
    expect(pyli.cookie_diaxeiristis.exei_session()).toBe(true);

    // Εκτέλεση fere_mathimata
    const mathimata_res = await pyli.fere_mathimata();
    expect(mathimata_res.ok).toBe(true);
    if (mathimata_res.ok) {
      expect(mathimata_res.timi.length).toBe(1);
      expect(mathimata_res.timi[0]?.kodikos).toBe('PLI101');
    }

    // Εκτέλεση fere_dentro_arxeion
    const dentro_res = await pyli.fere_dentro_arxeion('PLI101');
    expect(dentro_res.ok).toBe(true);
    if (dentro_res.ok) {
      expect(dentro_res.timi.length).toBe(2); // ρίζα + ergasia.pdf
      expect(dentro_res.timi[0]?.typos).toBe('fakelos');
      expect(dentro_res.timi[1]?.typos).toBe('arxeio');
    }

    // Εκτέλεση sygxronise
    const apothiki = new MnimiApothiki();
    const sync_res = await pyli.sygxronise({
      kodikos_mathimatos: 'PLI101',
      apothiki,
    });

    expect(sync_res.ok).toBe(true);
    if (sync_res.ok) {
      expect(sync_res.timi.nea_arxeia).toBe(1);
      expect(sync_res.timi.synolo_arxeion).toBe(1);
    }

    const exei_apothiki = await apothiki.yparxei('PLI101/arxeia/ergasia.pdf');
    expect(exei_apothiki).toBe(true);
  });
});
