import { describe, it, expect, vi } from 'vitest';
import { FakeHttp, MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, HttpAitima, HttpApantisi, Mathima } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { ftiaxe_periballon_test as ftiaxe_periballon } from '../../test-fixtures/ftiaxe-test-periballon.js';
import {
  epanasygxronise_mathimata_apo_apothiki,
  ftiaxe_katevasma,
  syndesi_kai_anaktisi_mathimaton,
} from './syndesi-eclass.js';
import { DIADROMI_MATHIMATON } from './mathimata.js';
import { fortose_rytheseis } from '../apothiki/apothiki-ypiresies.js';

describe('syndesi_kai_anaktisi_mathimaton', () => {
  it('αρνείται επανασυγχρονισμό όταν λείπουν αποθηκευμένα στοιχεία σύνδεσης', async () => {
    const periballon = ftiaxe_periballon();

    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
  });

  it('επαναχρησιμοποιεί τα αποθηκευμένα στοιχεία για νέο πραγματικό discovery και sync', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: request.url,
              kefalides: { 'set-cookie': 'PHPSESSID=init456; path=/' },
              keimeno: '<form action="login_form.php"><input name="uname"/><input name="pass"/></form>',
            },
          };
        }
        if (request.methodos === 'POST') {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: 'https://eclass.unipi.gr/main/portfolio.php',
              kefalides: { 'set-cookie': 'PHPSESSID=refresh456; path=/' },
              keimeno: 'Καλώς ήρθατε στο eClass!',
            },
          };
        }
        return {
          ok: true,
          timi: {
            katastasi: 200,
            teliko_url: request.url,
            kefalides: {},
            keimeno: '<a href="/courses/CS303/">Βάσεις Δεδομένων</a>',
          },
        };
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    await periballon.mystika.vale('eclass_onoma_xristi', 'student');
    await periballon.mystika.vale('eclass_kodikos', 'secret');
    await periballon.mystika.vale('eclass_base_url', 'https://eclass.unipi.gr');
    await periballon.mystika.vale('eclass_panepistimio_id', 'unipi');

    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result.ok).toBe(true);
    expect(mockHttp.aitima).toHaveBeenCalled();
    const stored = await apothiki.diavase_keimeno(DIADROMI_MATHIMATON);
    expect(stored).toMatchObject({ ok: true });
    if (stored.ok) expect(stored.timi).toContain('CS303');
  });

  it('χρησιμοποιεί το Moodle token μόνο στο προσωρινό file download URL', async () => {
    const apothiki = new MnimiApothiki();
    const token = 'moodle-file-download-secret';
    const fileUrl = 'https://moodle.example.edu/lms/webservice/pluginfile.php/42/mod_resource/content/1/notes.txt';
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (request.methodos === 'POST') {
          const functionName = request.soma_forma?.wsfunction;
          if (functionName === 'core_webservice_get_site_info') {
            return { ok: true, timi: { katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: JSON.stringify({ sitename: 'Moodle' }) } };
          }
          if (functionName === 'core_enrol_get_users_courses') {
            return { ok: true, timi: { katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: JSON.stringify([{ id: 42, fullname: 'Algorithms' }]) } };
          }
          if (functionName === 'core_course_get_contents') {
            return {
              ok: true,
              timi: {
                katastasi: 200,
                teliko_url: request.url,
                kefalides: {},
                keimeno: JSON.stringify([
                  { name: 'General', modules: [{ name: 'Notes', contents: [{ type: 'file', fileurl: fileUrl, filename: 'notes.txt', filesize: 12 }] }] },
                ]),
              },
            };
          }
        }
        if (request.methodos === 'GET' && request.url.startsWith(fileUrl)) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: request.url,
              kefalides: {},
              dyadiko: new TextEncoder().encode('local notes'),
            },
          };
        }
        return { ok: true, timi: { katastasi: 404, teliko_url: request.url, kefalides: {}, keimeno: '' } };
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const result = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://moodle.example.edu/lms',
      onoma_xristi: '',
      kodikos: '',
      panepistimio_id: 'moodle',
      lms: 'moodle',
      webservice_token: token,
    });

    expect(result.ok).toBe(true);
    const downloadRequest = mockHttp.aitima.mock.calls.find(([request]) => request.methodos === 'GET' && request.url.startsWith(fileUrl))?.[0];
    expect(downloadRequest?.url).toBe(`${fileUrl}?token=${token}`);
    const index = await apothiki.diavase_keimeno('42/.spoudes/eurethrio-arxeion.json');
    expect(index).toMatchObject({ ok: true });
    if (index.ok) expect(index.timi).not.toContain(token);
  });

  it('απορρίπτει κενό όνομα χρήστη ή κωδικό πρόσβασης', async () => {
    const periballon = ftiaxe_periballon();
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: '  ',
      kodikos: '',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('σε επιτυχή σύνδεση κάνει scrap τα πραγματικά μαθήματα από το portfolio και τα αποθηκεύει', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (a: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (a.methodos === 'GET' && a.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: a.url,
              kefalides: { 'set-cookie': 'PHPSESSID=init123; path=/' },
              keimeno: '<form action="https://eclass.unipi.gr/main/login_form.php"><input name="uname"/><input type="password" name="pass"/></form>',
            },
          };
        }
        if (a.methodos === 'POST' && a.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: 'https://eclass.unipi.gr/main/portfolio.php',
              kefalides: { 'set-cookie': 'PHPSESSID=session123; path=/' },
              keimeno: '<html><body>Καλώς ήρθατε στο eClass!</body></html>',
            },
          };
        }
        // Portfolio page
        return {
          ok: true,
          timi: {
            katastasi: 200,
            teliko_url: a.url,
            kefalides: {},
            keimeno: `
              <html>
                <body>
                  <a href="/courses/CS101/">Εισαγωγή στην Επιστήμη Υπολογιστών</a>
                  <a href="/courses/CS202/">Αντικειμενοστρεφής Προγραμματισμός</a>
                </body>
              </html>
            `,
          },
        };
      }),
    };

    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student2024',
      kodikos: 'securepassword ',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(true);
    const loginRequest = mockHttp.aitima.mock.calls.find(([request]) => request.methodos === 'POST');
    expect(loginRequest?.[0].soma_forma?.pass).toBe('securepassword ');
    if (res.ok) {
      expect(res.timi).toHaveLength(2);
      expect(res.timi[0]?.kodikos).toBe('CS101');
      expect(res.timi[0]?.titlos).toBe('Εισαγωγή στην Επιστήμη Υπολογιστών');
      expect(res.timi[1]?.kodikos).toBe('CS202');
      expect(res.timi[1]?.titlos).toBe('Αντικειμενοστρεφής Προγραμματισμός');
    }

    // Επιβεβαίωση εγγραφής στο mathimata.json
    expect(await apothiki.yparxei(DIADROMI_MATHIMATON)).toBe(true);
    const mathimataJson = await apothiki.diavase_keimeno(DIADROMI_MATHIMATON);
    expect(mathimataJson.ok).toBe(true);
    if (mathimataJson.ok) {
      const parsed = JSON.parse(mathimataJson.timi) as Mathima[];
      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.kodikos).toBe('CS101');
    }

    // Επιβεβαίωση ενημέρωσης mathimataSynch
    const rythmiseis = await fortose_rytheseis(apothiki);
    expect(rythmiseis.mathimataSynch).toContain('CS101');
    expect(rythmiseis.mathimataSynch).toContain('CS202');
  });

  it('επιστρέφει σφάλμα πιστοποίησης όταν ο κωδικός είναι λανθασμένος', async () => {
    const mockHttp = {
      aitima: vi.fn(async (a: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (a.methodos === 'GET') {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: a.url,
              kefalides: {},
              keimeno: '<form action="https://eclass.unipi.gr/main/login_form.php"><input name="uname"/><input type="password" name="pass"/></form>',
            },
          };
        }
        // POST επιστρέφει τη φόρμα σύνδεσης ξανά (αποτυχία)
        return {
          ok: true,
          timi: {
            katastasi: 200,
            teliko_url: 'https://eclass.unipi.gr/main/login_form.php',
            kefalides: {},
            keimeno: '<div class="alert alert-danger">Λάθος όνομα χρήστη ή συνθηματικό</div><form action="login_form.php"><input type="password"/></form>',
          },
        };
      }),
    };

    const periballon = ftiaxe_periballon({ http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'wronguser',
      kodikos: 'wrongpass',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('το test-only deigma δεν επιστρέφει cached demo μάθημα όταν το LMS δεν είναι διαθέσιμο', async () => {
    const apothiki = new MnimiApothiki();
    const mockMathimata: readonly Mathima[] = [
      { kodikos: 'DEMO101', titlos: 'Δοκιμαστικό Μάθημα', url: 'https://example.org', epilegmeno: true },
    ];
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify(mockMathimata));

    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify(mockMathimata));
    const http = new FakeHttp();
    const periballon = ftiaxe_periballon({ apothiki, http }, { deigma: true });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://thales.cs.unipi.gr',
      onoma_xristi: 'demo',
      kodikos: 'demopass',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(false);
    expect(http.kliseis.length).toBeGreaterThan(0);
    const cached = await apothiki.diavase_keimeno(DIADROMI_MATHIMATON);
    expect(cached.ok).toBe(true);
    if (cached.ok) expect(cached.timi).toContain('DEMO101');
  });

  it('η καταχώριση μόνο μαθήματος δεν δημιουργεί πλασματικό χάρτη ή οδηγούς', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (a: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (a.methodos === 'GET' && a.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: a.url,
              kefalides: { 'set-cookie': 'PHPSESSID=session999; path=/' },
              keimeno: '<form action="login_form.php"><input name="uname"/><input name="pass"/></form>',
            },
          };
        }
        if (a.methodos === 'POST') {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: 'https://eclass.uoi.gr/main/portfolio.php',
              kefalides: { 'set-cookie': 'PHPSESSID=session999; path=/' },
              keimeno: 'Καλώς ήρθατε στο eClass!',
            },
          };
        }
        return {
          ok: true,
          timi: {
            katastasi: 200,
            teliko_url: a.url,
            kefalides: {},
            keimeno: '<a href="/courses/MYY105/">Εισαγωγή στους Αλγορίθμους</a>',
          },
        };
      }),
    };

    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.uoi.gr',
      onoma_xristi: 'uoi_student',
      kodikos: 'uoi_pass',
      panepistimio_id: 'uoi',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error(`${res.sfalma.kodikos}: ${res.sfalma.minima}`);
    expect(res.timi.map((course) => course.kodikos)).toContain('MYY105');
    expect(await apothiki.yparxei('MYY105/.spoudes/xartis.json')).toBe(false);
    expect(await apothiki.lista('MYY105/.spoudes/odigoi')).toMatchObject({ ok: true, timi: [] });
  });

  it('αρνείται μη HTTPS διεύθυνση LMS', async () => {
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon: ftiaxe_periballon(),
      base_url: 'http://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima).toContain('HTTPS');
    }
  });

  it('ανιχνεύει Moodle login index.php', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (request.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: request.url,
              kefalides: {},
              keimeno: '<form action="login.php"><input name="usrname"/></form>',
            },
          };
        }
        if (request.url.includes('login/index.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: request.url,
              kefalides: {},
              keimeno: '<html><body><div id="page-login">Moodle</div><input name="username"/></body></html>',
            },
          };
        }
        return {
          ok: true,
          timi: { katastasi: 404, teliko_url: request.url, kefalides: {}, keimeno: '' },
        };
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://moodle.example.edu/lms',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'moodle',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
      expect(res.sfalma.minima).toContain('τυπική φόρμα');
    }
  });

  it('απαιτεί μόνο κωδικό πρόσβασης για Moodle (όχι token)', async () => {
    const periballon = ftiaxe_periballon();

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://moodle.example.edu/lms',
      onoma_xristi: 'student',
      kodikos: '',
      panepistimio_id: 'moodle',
      lms: 'moodle',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
      expect(res.sfalma.minima).toContain('Moodle username/password');
    }
  });

  it('αρνείται μη αναγνωρισμένο portal', async () => {
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon: ftiaxe_periballon(),
      base_url: 'https://portal.example.edu',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'custom',
      lms: 'unsupported',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
      expect(res.sfalma.minima).toContain('connector');
    }
  });

  it('απαιτεί username/password για open-eclass', async () => {
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon: ftiaxe_periballon(),
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: '',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
      expect(res.sfalma.minima).toContain('όνομα χρήστη');
    }
  });

  it('απαιτεί username/password για Moodle', async () => {
    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon: ftiaxe_periballon(),
      base_url: 'https://moodle.example.edu/lms',
      onoma_xristi: '',
      kodikos: '',
      panepistimio_id: 'moodle',
      lms: 'moodle',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AUTH_APOTYXIA');
      expect(res.sfalma.minima).toContain('Συμπλήρωσε');
    }
  });

  it('απορρίπτει το sync όταν το LMS επιστρέψει αρχείο εκτός HTTPS', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.methodos === 'GET' && request.url.includes('/courses/CS101/document/')) {
          // Μη HTTPS αρχείο από το LMS → `fileUrl.protocol !== 'https:'` (L103-L104)
          return ok({
            katastasi: 200,
            teliko_url: request.url,
            kefalides: {},
            keimeno: '<table><tr><td><a href="http://malicious.example.org/file.pdf">File.pdf</a></td><td>1.2 MB</td><td>2024-01-01</td></tr></table>',
          });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
      expect(res.sfalma.minima).toContain('εκτός της ασφαλούς διεύθυνσής του');
    }
  });

  it('απορρίπτει το sync όταν το LMS επιστρέψει μη έγκυρη διεύθυνση αρχείου', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.methodos === 'GET' && request.url.includes('/courses/CS101/document/')) {
          // Μη έγκυρη διεύθυνση αρχείου → `new URL(url)` πετάει (L106-L107)
          return ok({
            katastasi: 200,
            teliko_url: request.url,
            kefalides: {},
            keimeno: '<table><tr><td><a href="http://">File.pdf</a></td><td>1.2 MB</td><td>2024-01-01</td></tr></table>',
          });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima).toContain('μη έγκυρη διεύθυνση αρχείου');
    }
  });

  it('απορρίπτει το αρχείο όταν η απάντηση δεν είναι επιτυχής', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: request.url,
              kefalides: {},
              keimeno: '<form action="login_form.php"><input name="uname"/></form>',
            },
          };
        }
        if (request.methodos === 'POST') {
          return {
            ok: true,
            timi: {
              katastasi: 200,
              teliko_url: 'https://eclass.unipi.gr/main/portfolio.php',
              kefalides: {},
              keimeno: 'Καλώς ήρθατε στο eClass!',
            },
          };
        }
        if (request.methodos === 'GET' && /\/courses\/CS101\/document/.test(request.url)) {
          // 500 στο δομο φύλλο του μαθήματος → DIKTYO από την `fere_dentro_arxeion`
          return {
            ok: true,
            timi: { katastasi: 500, teliko_url: request.url, kefalides: {}, keimeno: '' },
          };
        }
        if (request.methodos === 'GET' && request.url.startsWith('https://eclass.unipi.gr/courses/')) {
          return {
            ok: true,
            timi: { katastasi: 404, teliko_url: request.url, kefalides: {}, keimeno: '' },
          };
        }
        return {
          ok: true,
          timi: {
            katastasi: 200,
            teliko_url: request.url,
            kefalides: {},
            keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>',
          },
        };
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.minima).toContain('Αποτυχία ανάκτησης εγγράφων');
    }
  });

  it('απορρίπτει τη λήψη αρχείου με μη επιτυχή απάντηση HTTP', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.pdf')) {
          // Λήψη: η απάντηση δεν είναι επιτυχής → `!response.ok` (L128)
          return apotyxia('DIKTYO', 'Αποτυχία λήψης αρχείου');
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.pdf">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.minima).toContain('Δεν ήταν δυνατή η λήψη');
    }
  });

  it('απορρίπτει το αρχείο όταν λείπουν τα bytes', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.pdf')) {
          // 200 αλλά χωρίς bytes → `bytes === undefined` (L131)
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: undefined });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.pdf">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.minima).toContain('Το LMS δεν επέστρεψε το αρχείο');
    }
  });

  it('απορρίπτει το αρχείο όταν ξεπερνά το όριο 100 MB', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.pdf')) {
          // 200 με 101 MB → `bytes.byteLength > MAX_DOWNLOAD_BYTES` (L134)
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: new Uint8Array(101 * 1024 * 1024) });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.pdf">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima).toContain('100 MB');
    }
  });

  it('απορρίπτει το sync όταν αποτύχει το discovery', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          // 500 στο portfolio → αποτυχία discovery
          return ok({ katastasi: 500, teliko_url: request.url, kefalides: {}, keimeno: '' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.minima).toContain('Αποτυχία ανάκτησης μαθημάτων');
    }
  });

  it('απορρίπτει το sync όταν αποτύχει η εξαγωγή κειμένου', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.pdf')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: new TextEncoder().encode('κείμενο') });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.pdf">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    // Το ευρετήριο αρχείων είναι κατεστραμμένο → αποτυχία `exagogi`
    const origDiavaseKeimeno = apothiki.diavase_keimeno;
    apothiki.diavase_keimeno = vi.fn(async (diadromi) => {
      if (diadromi.includes('eurethrio-arxeion')) {
        return apotyxia('MI_EGKYRO_SXIMA', 'Το ευρετήριο είναι κατεστραμμένο');
      }
      return origDiavaseKeimeno.call(apothiki, diadromi);
    });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(res.sfalma.minima).toContain('αποθηκεύτηκαν, αλλά η εξαγωγή κειμένου απέτυχε');
    }
  });

  it('απορρίπτει το sync όταν το LMS επιστρέψει κενό ευρετήριο μαθημάτων', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          // Κενό portfolio → κενό discovery (L153-L154)
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(res.sfalma.minima).toContain('Δεν βρέθηκαν εγγεγραμμένα μαθήματα');
    }
  });

  it('δεν στέλνει σήμα ακύρωσης όταν δεν δίνεται', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    const katevasma = ftiaxe_katevasma(
      {
        periballon,
        base_url: 'https://eclass.unipi.gr',
        onoma_xristi: 'student',
        kodikos: 'secret',
        panepistimio_id: 'unipi',
        lms: 'open-eclass',
      },
      new URL('https://eclass.unipi.gr'),
      'open-eclass',
    );

    const result = await katevasma.katevase(
      'https://eclass.unipi.gr/courses/CS101/document/notes.pdf',
      'CS101/.spoudes/arxeia/notes.pdf',
      {},
      undefined,
    );

    // τα bytes λείπουν → DIKTYO, αλλά το σήμα ακύρωσης δεν περνάει ποτέ στο αίτημα
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('DIKTYO');
    const request = mockHttp.aitima.mock.calls[0][0];
    expect(request.simatodotis).toBeUndefined();
  });

  it('απορρίπτει το sync όταν αποτύχει η εγγραφή των ρυθμίσεων', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.txt')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: new TextEncoder().encode('κείμενο') });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.txt">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    // Η εγγραφή των ρυθμίσεων αποτυγχάνει
    const origGrapseKeimeno = apothiki.grapse_keimeno;
    apothiki.grapse_keimeno = vi.fn(async (diadromi, periexomeno) => {
      if (diadromi.includes('rythmiseis')) {
        return apotyxia('DIKTYO', 'Δεν γράφονται οι ρυθμίσεις');
      }
      return origGrapseKeimeno.call(apothiki, diadromi, periexomeno);
    });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://eclass.unipi.gr',
      onoma_xristi: 'student',
      kodikos: 'secret',
      panepistimio_id: 'unipi',
      lms: 'open-eclass',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.minima).toContain('ρυθμίσεις');
    }
  });

  it('δεν δέχεται αποθηκευμένα στοιχεία χωρίς διαπιστευτήρια', async () => {
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon({ apothiki }, { deigma: false });
    await periballon.mystika.vale('eclass_base_url', 'https://eclass.unipi.gr');

    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA' } });
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('αποθηκευμένα στοιχεία');
    }
  });

  it('χρησιμοποιεί το "custom" όταν λείπουν τα πανεπιστημιακά ID', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.txt')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: new TextEncoder().encode('κείμενο') });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.txt">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    await periballon.mystika.vale('eclass_onoma_xristi', 'student');
    await periballon.mystika.vale('eclass_kodikos', 'secret');
    await periballon.mystika.vale('eclass_base_url', 'https://eclass.unipi.gr');

    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result.ok).toBe(true);
    const settings = await fortose_rytheseis(apothiki);
    expect(settings.panepistimioId).toBe('custom');
  });
  it('στέλνει το token χωρίς διαπιστευτήρια LMS', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<{ ok: true; timi: HttpApantisi }> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    await periballon.mystika.vale('eclass_base_url', 'https://eclass.unipi.gr');
    await periballon.mystika.vale('moodle_webservice_token', 'moodle-file-download-secret');

    // username/password: null → `?? ''`, webservice_token: μη κενό → το `{ webservice_token }`
    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    }
  });

  it('απορρίπτει το sync όταν αποτύχει η εγγραφή των bytes στο αρχείο', async () => {
    const apothiki = new MnimiApothiki();
    const mockHttp = {
      aitima: vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => {
        if (request.methodos === 'GET' && request.url.includes('login_form.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<form action="login_form.php"><input name="uname"/><input type="password" name="pass"/></form>' });
        }
        if (request.methodos === 'POST') {
          return ok({ katastasi: 200, teliko_url: 'https://eclass.unipi.gr/main/portfolio.php', kefalides: {}, keimeno: 'Καλώς ήρθατε στο eClass!' });
        }
        if (request.methodos === 'GET' && request.url.includes('/main/portfolio.php')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/">Εισαγωγή</a>' });
        }
        if (request.url.endsWith('/document/notes.txt')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, dyadiko: new TextEncoder().encode('κείμενο') });
        }
        if (request.url.endsWith('/document/')) {
          return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '<a href="/courses/CS101/document/notes.txt">Σημειώσεις</a>' });
        }
        return ok({ katastasi: 200, teliko_url: request.url, kefalides: {}, keimeno: '' });
      }),
    };
    const periballon = ftiaxe_periballon({ apothiki, http: mockHttp }, { deigma: false });
    await periballon.mystika.vale('eclass_onoma_xristi', 'student');
    await periballon.mystika.vale('eclass_kodikos', 'secret');
    await periballon.mystika.vale('eclass_base_url', 'https://eclass.unipi.gr');
    await periballon.mystika.vale('eclass_panepistimio_id', 'unipi');

    const origGrapseDyadiko = apothiki.grapse_dyadiko;
    apothiki.grapse_dyadiko = vi.fn(async () => apotyxia('DIKTYO', 'Δεν γράφονται τα bytes'));

    const result = await epanasygxronise_mathimata_apo_apothiki(periballon);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.kodikos).toBe('DIKTYO');
    }
  });

});
