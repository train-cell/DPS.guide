import { describe, it, expect, vi } from 'vitest';
import { MnimiApothiki, ok, apotyxia } from '@dps/core';
import type { HttpAitima, HttpApantisi, Mathima } from '@dps/core';
import { ftiaxe_periballon } from '../periballon/index.js';
import { syndesi_kai_anaktisi_mathimaton, ftiaxe_arxiko_xarti_kai_odigous } from './syndesi-eclass.js';
import { DIADROMI_MATHIMATON } from './mathimata.js';
import { fortose_rytheseis } from '../apothiki/apothiki-ypiresies.js';

describe('syndesi_kai_anaktisi_mathimaton', () => {
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
      kodikos: 'securepassword',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(true);
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

  it('σε δοκιμαστικό περιβάλλον (deigma) διατηρεί ομαλό demo fallback', async () => {
    const apothiki = new MnimiApothiki();
    const mockMathimata: readonly Mathima[] = [
      { kodikos: 'DEMO101', titlos: 'Δοκιμαστικό Μάθημα', url: 'https://example.org', epilegmeno: true },
    ];
    await apothiki.grapse_keimeno(DIADROMI_MATHIMATON, JSON.stringify(mockMathimata));

    const periballon = ftiaxe_periballon({ apothiki }, { deigma: true });

    const res = await syndesi_kai_anaktisi_mathimaton({
      periballon,
      base_url: 'https://thales.cs.unipi.gr',
      onoma_xristi: 'demo',
      kodikos: 'demopass',
      panepistimio_id: 'unipi',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toHaveLength(1);
      expect(res.timi[0]?.kodikos).toBe('DEMO101');
    }
  });

  it('το ftiaxe_arxiko_xarti_kai_odigous παράγει έγκυρο χάρτη και οδηγούς μελέτης με τα 7 υποχρεωτικά τμήματα', () => {
    const mathima: Mathima = {
      kodikos: 'MYY105',
      titlos: 'Εισαγωγή στους Αλγορίθμους',
      url: 'https://eclass.uoi.gr/courses/MYY105/',
      epilegmeno: true,
    };

    const apotelesma = ftiaxe_arxiko_xarti_kai_odigous(mathima);
    expect(apotelesma.xartis.kodikos_mathimatos).toBe('MYY105');
    expect(apotelesma.xartis.enotites).toHaveLength(4);
    expect(apotelesma.odigoi).toHaveLength(4);

    for (const od of apotelesma.odigoi) {
      expect(od.periexomeno_md).toContain('## 🎯 Στόχοι');
      expect(od.periexomeno_md).toContain('## 👶 ELI5');
      expect(od.periexomeno_md).toContain('## 🔬 Θεωρία');
      expect(od.periexomeno_md).toContain('## 🧪 Λυμένο παράδειγμα');
      expect(od.periexomeno_md).toContain('## ⚠️ Παγίδες');
      expect(od.periexomeno_md).toContain('## 🔗 Συνδέσεις');
      expect(od.periexomeno_md).toContain('## ✅ Αυτοέλεγχος');
      expect(od.periexomeno_md).toContain('[[arx-1:');
    }
  });

  it('κατά το scraping δημιουργεί αυτόματα τον χάρτη xartis.json και τους οδηγούς μελέτης στην τοπική αποθήκη', async () => {
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
              keimeno: 'OK',
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
    expect(await apothiki.yparxei('MYY105/.spoudes/xartis.json')).toBe(true);
    const xartisRaw = await apothiki.diavase_keimeno('MYY105/.spoudes/xartis.json');
    expect(xartisRaw.ok).toBe(true);
    if (xartisRaw.ok) {
      const parsedXartis = JSON.parse(xartisRaw.timi);
      expect(parsedXartis.kodikos_mathimatos).toBe('MYY105');
      expect(parsedXartis.enotites.length).toBeGreaterThan(0);
      const protiEnotita = parsedXartis.enotites[0]?.id;
      expect(await apothiki.yparxei(`MYY105/.spoudes/odigoi/${protiEnotita}.md`)).toBe(true);
    }
  });
});
