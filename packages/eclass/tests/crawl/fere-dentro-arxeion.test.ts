import { describe, it, expect, beforeEach } from 'vitest';
import type { Apotelesma, HttpAitima, HttpApantisi } from '@dps/core';
import { ok } from '@dps/core';
import { FakeHttp } from '@dps/core/testing';
import {
  CookieDiaxeiristis,
  fere_dentro_arxeion,
  VASIKO_URL_ECLASS,
} from '../../src/index.js';
import type { AuthPerivallon, SyndesiStratigiki } from '../../src/auth/typoi.js';

class DummyStratigiki implements SyndesiStratigiki {
  async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
    perivallon.cookie_diaxeiristis.apothikefse('PHPSESSID', 'valid_sess');
    return ok(undefined);
  }
}

describe('fere_dentro_arxeion (L15)', () => {
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

  it('διάσχιση BFS με εμφωλευμένους φακέλους και ελληνικά ονόματα', async () => {
    // 1. Ρίζα: /courses/PLI101/document/
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      // Αν είναι ακριβώς η ρίζα
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
          kefalides: {},
          keimeno: `
            <table>
              <tr>
                <td><a href="/courses/PLI101/document/01-εισαγωγή/">01-εισαγωγή</a></td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr>
                <td><a href="/courses/PLI101/document/σημειώσεις.pdf">σημειώσεις.pdf</a></td>
                <td>1.5 MB</td>
                <td>2026-10-01</td>
              </tr>
            </table>
          `,
        };
      }

      // 2. Υποφάκελος: /courses/PLI101/document/01-εισαγωγή/
      if (decodeURIComponent(a.url).includes('01-εισαγωγή')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: `
            <table>
              <tr>
                <td><a href="/courses/PLI101/document/01-εισαγωγή/διαφάνειες.pdf">διαφάνειες.pdf</a></td>
                <td>512 KB</td>
                <td>2026-10-02</td>
              </tr>
            </table>
          `,
        };
      }

      return {
        katastasi: 404,
        teliko_url: a.url,
        kefalides: {},
        keimeno: 'Not found',
      };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');

    expect(res.ok).toBe(true);
    if (res.ok) {
      const dentro = res.timi;
      // Κανόνας: Ο 1ος κόμβος είναι πάντοτε η ρίζα
      expect(dentro[0]).toEqual({
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
        megethos: null,
        imerominia: null,
      });

      // Υποφάκελος 01-εισαγωγή/
      const fakelos_eisagogi = dentro.find((k) => k.onoma === '01-εισαγωγή');
      expect(fakelos_eisagogi).toBeDefined();
      expect(fakelos_eisagogi?.typos).toBe('fakelos');
      expect(fakelos_eisagogi?.diadromi).toBe('01-εισαγωγή/');

      // Αρχείο σημειώσεις.pdf στη ρίζα
      const arxeio_riza = dentro.find((k) => k.onoma === 'σημειώσεις.pdf');
      expect(arxeio_riza).toBeDefined();
      expect(arxeio_riza?.diadromi).toBe('σημειώσεις.pdf');
      expect(arxeio_riza?.megethos).toBe(Math.round(1.5 * 1024 * 1024));

      // Αρχείο διαφάνειες.pdf στον υποφάκελο
      const arxeio_ypo = dentro.find((k) => k.onoma === 'διαφάνειες.pdf');
      expect(arxeio_ypo).toBeDefined();
      expect(arxeio_ypo?.diadromi).toBe('01-εισαγωγή/διαφάνειες.pdf');
      expect(arxeio_ypo?.megethos).toBe(512 * 1024);
    }
  });

  it('404 σε υποφάκελο -> προειδοποίηση και συνέχεια της διάσχισης', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: `
            <table>
              <tr><td><a href="/courses/PLI101/document/fakelos-404/">fakelos-404</a></td></tr>
              <tr><td><a href="/courses/PLI101/document/fakelos-ok/">fakelos-ok</a></td></tr>
            </table>
          `,
        };
      }
      if (a.url.includes('fakelos-404')) {
        return {
          katastasi: 404,
          teliko_url: a.url,
          kefalides: {},
          keimeno: 'Folder not found',
        };
      }
      if (a.url.includes('fakelos-ok')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: `
            <table>
              <tr><td><a href="/courses/PLI101/document/fakelos-ok/file.pdf">file.pdf</a></td></tr>
            </table>
          `,
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');

    expect(res.ok).toBe(true);
    if (res.ok) {
      // Παρά το 404 στον fakelos-404, η διάσχιση συνέχισε και βρήκε το file.pdf
      const arxeio = res.timi.find((k) => k.onoma === 'file.pdf');
      expect(arxeio).toBeDefined();
    }
  });

  it('404 στη ρίζα -> DEN_VRETHIKE', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      return {
        katastasi: 404,
        teliko_url: a.url,
        kefalides: {},
        keimeno: 'Course not found',
      };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('μη έγκυρος κωδικός μαθήματος -> DEN_VRETHIKE', async () => {
    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI 101 / bad');

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('διακοπή μέσω AbortSignal -> AKYROTHIKE', async () => {
    const controller = new AbortController();
    controller.abort();

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101', {
      simatodotis: controller.signal,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AKYROTHIKE');
    }
  });

  it('500 στη ρίζα -> DIKTYO', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => ({
      katastasi: 500,
      teliko_url: a.url,
      kefalides: {},
    }));

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
  });

  it('500 σε υποφάκελο -> παράλειψη και συνέχεια, υποστηρίζει kathysterisi_ms', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: '<table><tr><td><a href="/courses/PLI101/document/err-dir/">err-dir</a></td></tr></table>',
        };
      }
      return {
        katastasi: 500,
        teliko_url: a.url,
        kefalides: {},
      };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101', {
      kathysterisi_ms: 1,
    });
    expect(res.ok).toBe(true);
  });

  it('simatodotis χωρίς ακύρωση -> στέλνει το σήμα (L76 true)', async () => {
    const controller = new AbortController();

    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      expect(a.simatodotis).toBe(controller.signal);
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
          kefalides: {},
          keimeno: '<table><tr><td><a href="/courses/PLI101/document/f1/">f1</a></td></tr></table>',
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101', {
      simatodotis: controller.signal,
    });
    expect(res.ok).toBe(true);
  });

  it('σφάλμα στην ρίζα -> επιστρέφει το σφάλμα (L79/L81)', async () => {
    const apotyxi_stratigiki: SyndesiStratigiki = {
      async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
        return {
          ok: false,
          sfalma: { kodikos: 'AUTH_APOTYXIA', minima: 'Αποτυχία σύνδεσης' },
        };
      },
    };

    const res = await fere_dentro_arxeion(perivallon, apotyxi_stratigiki, 'PLI101');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('σφάλμα σε υποφάκελο -> συνεχίζει (L79/L81 false)', async () => {
    let metritis = 0;
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      metritis += 1;
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: a.url,
          kefalides: {},
          keimeno: '<table><tr><td><a href="/courses/PLI101/document/f1/">f1</a></td></tr></table>',
        };
      }
      throw new Error('σφάλμα δικτύου');
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Η ρίζα + ο υποφάκελος (παραλείπεται μόνο στην ανάκτηση)
      expect(res.timi.length).toBe(2);
    }
    expect(metritis).toBe(2);
  });

  it('response χωρίς keimeno -> κενό κείμενο (L110)', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
      kefalides: {},
    }));

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.length).toBe(1);
    }
  });

  it('διπλή εμφάνιση φακέλου -> παραλείπεται (L116/L137)', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
          kefalides: {},
          keimeno: `
            <table>
              <tr><td><a href="/courses/PLI101/document/f1/">f1</a></td></tr>
              <tr><td><a href="/courses/PLI101/document/f1/">f1</a></td></tr>
              <tr><td><a href="/courses/PLI101/document/a.pdf">a.pdf</a></td></tr>
            </table>
          `,
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.filter((k) => k.onoma === 'f1').length).toBe(1);
      expect(res.timi.filter((k) => k.onoma === 'a.pdf').length).toBe(1);
    }
  });

  it('JSON response με διπλό diadromi -> L115/L136 true (δεν επεξεργάζεται το JSON dedup)', async () => {
    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
          kefalides: {},
          keimeno: JSON.stringify([
            {
              typos: 'fakelos',
              onoma: 'f1',
              diadromi: 'f1/',
              url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/f1/`,
            },
            {
              typos: 'fakelos',
              onoma: 'f1',
              diadromi: 'f1/',
              url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/f1/`,
            },
            {
              typos: 'arxeio',
              onoma: 'a.pdf',
              diadromi: 'a.pdf',
              url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/a.pdf`,
            },
            {
              typos: 'arxeio',
              onoma: 'a.pdf',
              diadromi: 'a.pdf',
              url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/a.pdf`,
            },
          ]),
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    const res = await fere_dentro_arxeion(perivallon, stratigiki, 'PLI101');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.filter((k) => k.onoma === 'f1').length).toBe(1);
      expect(res.timi.filter((k) => k.onoma === 'a.pdf').length).toBe(1);
    }
  });

  it('χωρίς base_url χρησιμοποιεί το VASIKO_URL_ECLASS (L43)', async () => {
    const perivallon2: AuthPerivallon = {
      http,
      cookie_diaxeiristis,
    };

    http.orise_apantisi('/courses/PLI101/document/', (a: HttpAitima): HttpApantisi => {
      if (a.url.endsWith('/courses/PLI101/document/')) {
        return {
          katastasi: 200,
          teliko_url: `${VASIKO_URL_ECLASS}/courses/PLI101/document/`,
          kefalides: {},
          keimeno: '<table><tr><td><a href="/courses/PLI101/document/f1/">f1</a></td></tr></table>',
        };
      }
      return { katastasi: 404, teliko_url: a.url, kefalides: {} };
    });

    const res = await fere_dentro_arxeion(perivallon2, stratigiki, 'PLI101');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.length).toBe(2);
    }
  });
});
