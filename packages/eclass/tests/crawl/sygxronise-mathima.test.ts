import { describe, it, expect, beforeEach } from 'vitest';
import type { Apotelesma, ApothikiPyli, EclassPyli, HttpApantisi, KatagrafiPyli, KomvosArxeiou, Mathima } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { FakeHttp, MnimiApothiki } from '@dps/core/testing';
import {
  sygxronise_mathima,
  ftiaxe_arxeio_id,
  hash_periexomenou,
  MEGISTO_MEGETHOS_ARXEIOU_BYTES,
} from '../../src/index.js';

class MockCrawlPyli implements EclassPyli {
  public dentro_apotelesma: KomvosArxeiou[] = [];

  async syndesi(): Promise<Apotelesma<void>> {
    return ok(undefined);
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    return ok([]);
  }

  async fere_dentro_arxeion(_kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    return ok(this.dentro_apotelesma);
  }
}

class FakeKatagrafi implements KatagrafiPyli {
  public plirofories: string[] = [];
  public proeidopoiiseis: string[] = [];
  public sfalmata: string[] = [];

  pliroforia(minima: string): void {
    this.plirofories.push(minima);
  }

  proeidopoiisi(minima: string): void {
    this.proeidopoiiseis.push(minima);
  }

  sfalma(minima: string): void {
    this.sfalmata.push(minima);
  }
}

class MockCrawlPyliError implements EclassPyli {
  async syndesi(): Promise<Apotelesma<void>> {
    return ok(undefined);
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    return ok([]);
  }

  async fere_dentro_arxeion(_kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    return apotyxia('DIKTYO', 'Δεν βρέθηκε το δέντρο αρχείων');
  }
}

class MockApothikiError implements ApothikiPyli {
  constructor(
    private toApotelesma: string,
    private fail_methods: string[] = ['diavase_keimeno', 'grapse_keimeno'],
  ) {}

  async yparxei(_diadromi: string): Promise<boolean> {
    return true;
  }

  async diavase_keimeno(_diadromi: string): Promise<Apotelesma<string>> {
    if (this.fail_methods.includes('diavase_keimeno')) {
      return apotyxia(this.toApotelesma, 'Δεν γίνεται ανάγνωση');
    }
    return ok('[]');
  }

  async diavase_dyadiko(_diadromi: string): Promise<Apotelesma<Uint8Array>> {
    return ok(new Uint8Array(0));
  }

  async grapse_keimeno(_diadromi: string, _periexomeno: string): Promise<Apotelesma<void>> {
    if (this.fail_methods.includes('grapse_keimeno')) {
      return apotyxia(this.toApotelesma, 'Δεν γίνεται εγγραφή');
    }
    return ok(undefined);
  }

  async grapse_dyadiko(_diadromi: string, _dedomena: Uint8Array): Promise<Apotelesma<void>> {
    if (this.fail_methods.includes('grapse_dyadiko')) {
      return apotyxia(this.toApotelesma, 'Δεν γίνεται εγγραφή δυαδικού');
    }
    return ok(undefined);
  }
}

describe('sygxronise_mathima (L15)', () => {
  let eclass: MockCrawlPyli;
  let http: FakeHttp;
  let apothiki: MnimiApothiki;
  let katagrafi: FakeKatagrafi;

  const KODIKOS = 'PLI101';

  beforeEach(() => {
    eclass = new MockCrawlPyli();
    http = new FakeHttp();
    apothiki = new MnimiApothiki();
    katagrafi = new FakeKatagrafi();
  });

  it('εμφωλευμένοι φάκελοι & ελληνικά ονόματα: κατέβασμα, sha256 και εγγραφή eurethrio', async () => {
    const periexomeno1 = new TextEncoder().encode('Περιεχόμενο εισαγωγής PDF');
    const periexomeno2 = new TextEncoder().encode('Διαφάνειες θεωρίας DOCX');

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'fakelos',
        onoma: '01-εισαγωγή',
        diadromi: '01-εισαγωγή/',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/01-εισαγωγή/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'σημειώσεις.pdf',
        diadromi: '01-εισαγωγή/σημειώσεις.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/01-εισαγωγή/σημειώσεις.pdf',
        megethos: periexomeno1.byteLength,
        imerominia: '2026-10-01',
      },
      {
        typos: 'arxeio',
        onoma: 'οδηγίες.docx',
        diadromi: 'οδηγίες.docx',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/οδηγίες.docx',
        megethos: periexomeno2.byteLength,
        imerominia: '2026-10-02',
      },
    ];

    http.orise_apantisi('σημειώσεις.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/01-εισαγωγή/σημειώσεις.pdf',
      kefalides: { etag: '"etag-1"' },
      dyadiko: periexomeno1,
    }));

    http.orise_apantisi('οδηγίες.docx', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/οδηγίες.docx',
      kefalides: { etag: '"etag-2"' },
      dyadiko: periexomeno2,
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(2);
      expect(res.timi.allagmena_arxeia).toBe(0);
      expect(res.timi.ametavlita_arxeia).toBe(0);
      expect(res.timi.synolo_arxeion).toBe(2);
    }

    // Έλεγχος ότι τα αρχεία γράφτηκαν στην αποθήκη
    const exei_arxeio1 = await apothiki.yparxei(`${KODIKOS}/arxeia/01-εισαγωγή/σημειώσεις.pdf`);
    const exei_arxeio2 = await apothiki.yparxei(`${KODIKOS}/arxeia/οδηγίες.docx`);
    expect(exei_arxeio1).toBe(true);
    expect(exei_arxeio2).toBe(true);

    // Έλεγχος ότι το eurethrio-arxeion.json γράφτηκε
    const eurethrio_txt = await apothiki.diavase_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`
    );
    expect(eurethrio_txt.ok).toBe(true);
    if (eurethrio_txt.ok) {
      const parsed = JSON.parse(eurethrio_txt.timi);
      expect(parsed.length).toBe(2);
      expect(parsed[0].id).toBe(ftiaxe_arxeio_id(KODIKOS, '01-εισαγωγή/σημειώσεις.pdf'));
      expect(parsed[0].sha256).toBe(hash_periexomenou(periexomeno1));
      expect(parsed[1].id).toBe(ftiaxe_arxeio_id(KODIKOS, 'οδηγίες.docx'));
      expect(parsed[1].sha256).toBe(hash_periexomenou(periexomeno2));
    }
  });

  it('αμετάβλητο αρχείο -> καμία νέα λήψη (0 network downloads)', async () => {
    const dedomena = new TextEncoder().encode('Σταθερό περιεχόμενο');
    const kanoniki_diadromi = 'theoria.pdf';
    const topiki_diadromi = `${KODIKOS}/arxeia/${kanoniki_diadromi}`;
    const diadromi_eurethriou = `${KODIKOS}/.spoudes/eurethrio-arxeion.json`;

    // Προετοιμασία υπάρχουσας αποθήκης και ευρετηρίου
    await apothiki.grapse_dyadiko(topiki_diadromi, dedomena);
    await apothiki.grapse_keimeno(
      diadromi_eurethriou,
      JSON.stringify([
        {
          id: ftiaxe_arxeio_id(KODIKOS, kanoniki_diadromi),
          kodikos_mathimatos: KODIKOS,
          diadromi: kanoniki_diadromi,
          url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
          megethos: dedomena.byteLength,
          imerominia: '2026-10-01',
          etag: '"etag-1"',
          sha256: hash_periexomenou(dedomena),
          diplotypo_tou: null,
        },
      ])
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'theoria.pdf',
        diadromi: 'theoria.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
        megethos: dedomena.byteLength, // ίδιο μέγεθος
        imerominia: '2026-10-01',      // ίδια ημερομηνία
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.ametavlita_arxeia).toBe(1);
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.allagmena_arxeia).toBe(0);
    }
    // ΜΗΔΕΝ HTTP downloads
    expect(http.kliseis.length).toBe(0);
  });

  it('riza -> topiki_diadromi μέσα στον riza φάκελο (L62)', async () => {
    const dedomena = new TextEncoder().encode('Περιεχόμενο εισαγωγής');

    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'theoria.pdf',
        diadromi: 'theoria.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
        megethos: dedomena.byteLength,
        imerominia: '2026-10-01',
      },
    ];

    http.orise_apantisi('theoria.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
      kefalides: {},
      dyadiko: dedomena,
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
      riza: 'spoudes',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(1);
      expect(res.timi.synolo_arxeion).toBe(1);
    }
    // Το αρχείο πάει μέσα στο spoudes/PLI101/arxeia/
    expect(await apothiki.yparxei('spoudes/PLI101/arxeia/theoria.pdf')).toBe(true);
    expect(await apothiki.yparxei(`${KODIKOS}/arxeia/theoria.pdf`)).toBe(false);
    // Και το ευρετήριο στην riza θέση
    expect(await apothiki.yparxei('spoudes/PLI101/.spoudes/eurethrio-arxeion.json')).toBe(true);
    expect(await apothiki.yparxei(`${KODIKOS}/.spoudes/eurethrio-arxeion.json`)).toBe(false);
  });

  it('etag = url + διαφορετική ημερομηνία -> ametavlito (L156 etag branch)', async () => {
    const dedomena = new TextEncoder().encode('Σταθερό περιεχόμενο');
    const kanoniki_diadromi = 'theoria.pdf';
    const topiki_diadromi = `${KODIKOS}/arxeia/${kanoniki_diadromi}`;
    const diadromi_eurethriou = `${KODIKOS}/.spoudes/eurethrio-arxeion.json`;
    const url = 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf';

    // Υπάρχουσα τοπική αποθήκη με etag ίσο με το URL
    await apothiki.grapse_dyadiko(topiki_diadromi, dedomena);
    await apothiki.grapse_keimeno(
      diadromi_eurethriou,
      JSON.stringify([
        {
          id: ftiaxe_arxeio_id(KODIKOS, kanoniki_diadromi),
          kodikos_mathimatos: KODIKOS,
          diadromi: kanoniki_diadromi,
          url,
          megethos: dedomena.byteLength,
          imerominia: '2026-10-01',
          etag: url, // το etag είναι το ίδιο με το URL του komvos
          sha256: hash_periexomenou(dedomena),
          diplotypo_tou: null,
        },
      ])
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'theoria.pdf',
        diadromi: 'theoria.pdf',
        url,
        megethos: dedomena.byteLength, // ίδιο μέγεθος
        imerominia: '2026-10-02', // διαφορετική ημερομηνία
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.ametavlita_arxeia).toBe(1);
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.allagmena_arxeia).toBe(0);
    }
    // ΜΗΔΕΝ HTTP downloads λόγω etag
    expect(http.kliseis.length).toBe(0);
  });

  it('αλλαγμένο αρχείο -> λήψη και ενημέρωση', async () => {
    const palia_dedomena = new TextEncoder().encode('Παλιό περιεχόμενο');
    const nea_dedomena = new TextEncoder().encode('Νέο ενημερωμένο περιεχόμενο');
    const kanoniki_diadromi = 'theoria.pdf';

    await apothiki.grapse_dyadiko(`${KODIKOS}/arxeia/${kanoniki_diadromi}`, palia_dedomena);
    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify([
        {
          id: ftiaxe_arxeio_id(KODIKOS, kanoniki_diadromi),
          kodikos_mathimatos: KODIKOS,
          diadromi: kanoniki_diadromi,
          url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
          megethos: palia_dedomena.byteLength,
          imerominia: '2026-09-01',
          etag: '"etag-old"',
          sha256: hash_periexomenou(palia_dedomena),
          diplotypo_tou: null,
        },
      ])
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'theoria.pdf',
        diadromi: 'theoria.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
        megethos: nea_dedomena.byteLength, // ΑΛΛΑΞΕ μέγεθος
        imerominia: '2026-10-01',          // ΑΛΛΑΞΕ ημερομηνία
      },
    ];

    http.orise_apantisi('theoria.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf',
      kefalides: { etag: '"etag-new"' },
      dyadiko: nea_dedomena,
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.allagmena_arxeia).toBe(1);
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.ametavlita_arxeia).toBe(0);
    }
    expect(http.kliseis.length).toBe(1);

    // Το τοπικό αρχείο ενημερώθηκε με τα νέα δεδομένα
    const neo_arxeio = await apothiki.diavase_dyadiko(`${KODIKOS}/arxeia/${kanoniki_diadromi}`);
    expect(neo_arxeio.ok).toBe(true);
    if (neo_arxeio.ok) {
      expect(hash_periexomenou(neo_arxeio.timi)).toBe(hash_periexomenou(nea_dedomena));
    }
  });

  it('404 σε αρχείο -> προειδοποίηση και συνέχεια του συγχρονισμού', async () => {
    const dedomena2 = new TextEncoder().encode('Αρχείο 2');

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'xamino.pdf',
        diadromi: 'xamino.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/xamino.pdf',
        megethos: 100,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'yparxon.pdf',
        diadromi: 'yparxon.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/yparxon.pdf',
        megethos: dedomena2.byteLength,
        imerominia: null,
      },
    ];

    http.orise_apantisi('xamino.pdf', (): HttpApantisi => ({
      katastasi: 404,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/xamino.pdf',
      kefalides: {},
    }));

    http.orise_apantisi('yparxon.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/yparxon.pdf',
      kefalides: {},
      dyadiko: dedomena2,
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(1);
    }
    // Καταγράφηκε προειδοποίηση για το 404
    expect(katagrafi.proeidopoiiseis.some((p) => p.includes('404'))).toBe(true);
  });

  it('τεράστιο αρχείο (> 100 MB) -> παράλειψη με προειδοποίηση', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'terastio_video.zip',
        diadromi: 'terastio_video.zip',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/terastio_video.zip',
        megethos: MEGISTO_MEGETHOS_ARXEIOU_BYTES + 1024, // > 100 MB
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.paraleifthikan).toBe(1);
      expect(res.timi.nea_arxeia).toBe(0);
    }
    // Δεν έγινε κλήση HTTP
    expect(http.kliseis.length).toBe(0);
    expect(katagrafi.proeidopoiiseis.some((p) => p.includes('100 MB'))).toBe(true);
  });

  it('μη επιτρεπόμενη επέκταση (.exe) -> παράλειψη με προειδοποίηση', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'program.exe',
        diadromi: 'program.exe',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/program.exe',
        megethos: 1024,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.paraleifthikan).toBe(1);
    }
    expect(katagrafi.proeidopoiiseis.some((p) => p.includes('allowlist'))).toBe(true);
  });

  it('εντοπισμός διπλοτύπων (diplotypo_tou) μέσω SHA-256 περιεχομένου', async () => {
    const dedomena_koina = new TextEncoder().encode('Ακριβώς το ίδιο περιεχόμενο');

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'arxiko.pdf',
        diadromi: 'arxiko.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/arxiko.pdf',
        megethos: dedomena_koina.byteLength,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'antigrafo.pdf',
        diadromi: 'fakelos/antigrafo.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/fakelos/antigrafo.pdf',
        megethos: dedomena_koina.byteLength,
        imerominia: null,
      },
    ];

    http.orise_apantisi('arxiko.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'url1',
      kefalides: {},
      dyadiko: dedomena_koina,
    }));

    http.orise_apantisi('antigrafo.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'url2',
      kefalides: {},
      dyadiko: dedomena_koina,
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);

    const eurethrio_res = await apothiki.diavase_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`
    );
    expect(eurethrio_res.ok).toBe(true);
    if (eurethrio_res.ok) {
      const parsed = JSON.parse(eurethrio_res.timi);
      expect(parsed.length).toBe(2);
      const proto = parsed.find((a: { diadromi: string }) => a.diadromi === 'arxiko.pdf');
      const deftero = parsed.find((a: { diadromi: string }) => a.diadromi === 'fakelos/antigrafo.pdf');

      expect(proto.diplotypo_tou).toBeNull();
      // Το 2ο αρχείο επισημάνθηκε ως διπλότυπο του πρώτου
      expect(deftero.diplotypo_tou).toBe(proto.id);
    }
  });

  it('διακοπή μέσω AbortSignal -> αποθήκευση προόδου και συνέχιση στο επόμενο run', async () => {
    const d1 = new TextEncoder().encode('Αρχείο 1');
    const d2 = new TextEncoder().encode('Αρχείο 2');

    const controller = new AbortController();

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: d1.byteLength,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'file2.pdf',
        diadromi: 'file2.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file2.pdf',
        megethos: d2.byteLength,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => {
      // Μετά τη λήψη του file1, προκαλούμε abort
      controller.abort();
      return {
        katastasi: 200,
        teliko_url: 'url1',
        kefalides: {},
        dyadiko: d1,
      };
    });

    http.orise_apantisi('file2.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'url2',
      kefalides: {},
      dyadiko: d2,
    }));

    // 1ο Run: Διακόπτεται
    const run1 = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
      simatodotis: controller.signal,
    });

    expect(run1.ok).toBe(false);
    if (!run1.ok) {
      expect(run1.sfalma.kodikos).toBe('AKYROTHIKE');
    }

    // Το file1 πρόλαβε να γραφτεί στο eurethrio
    const eurethrio_meta_run1 = await apothiki.diavase_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`
    );
    expect(eurethrio_meta_run1.ok).toBe(true);

    // 2ο Run: Συνέχιση χωρίς abort -> το file1 είναι ametavlito, κατεβαίνει ΜΟΝΟ το file2
    http.kliseis = []; // μηδενισμός καταγραφής κλήσεων
    const run2 = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(run2.ok).toBe(true);
    if (run2.ok) {
      expect(run2.timi.ametavlita_arxeia).toBe(1); // file1 δεν ξανακατέβηκε
      expect(run2.timi.nea_arxeia).toBe(1);        // file2 κατέβηκε
      expect(run2.timi.synolo_arxeion).toBe(2);
    }
  });

  it('κατεστραμμένο eurethrio-arxeion.json -> MI_EGKYRO_SXIMA', async () => {
    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      'invalid json format {{{{['
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'url',
        megethos: null,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('eurethrio-arxeion.json που δεν είναι πίνακας -> MI_EGKYRO_SXIMA', async () => {
    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify({ notAnArray: true })
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'url',
        megethos: null,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('eurethrio-arxeion.json με άκυρη εγγραφή -> MI_EGKYRO_SXIMA', async () => {
    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify([{ invalidEntry: 123 }])
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'url',
        megethos: null,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('διακοπή όταν υπάρχουν παλαιότερα αρχεία που δεν πρόλαβαν να επεξεργαστούν -> διατηρούνται', async () => {
    const palio_arxeio = {
      id: ftiaxe_arxeio_id(KODIKOS, 'palio.pdf'),
      kodikos_mathimatos: KODIKOS,
      diadromi: 'palio.pdf',
      url: 'url_palio',
      megethos: 50,
      imerominia: null,
      etag: null,
      sha256: 'hash_palio',
      diplotypo_tou: null,
    };

    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify([palio_arxeio])
    );

    const controller = new AbortController();
    controller.abort(); // διακοπή άμεσα στην αρχή

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'url',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'neo.pdf',
        diadromi: 'neo.pdf',
        url: 'url_neo',
        megethos: 100,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
      simatodotis: controller.signal,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AKYROTHIKE');
    }

    // Το παλιό αρχείο διατηρήθηκε
    const eurethrio_res = await apothiki.diavase_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`
    );
    expect(eurethrio_res.ok).toBe(true);
    if (eurethrio_res.ok) {
      const parsed = JSON.parse(eurethrio_res.timi);
      expect(parsed.length).toBe(1);
      expect(parsed[0].diadromi).toBe('palio.pdf');
    }
  });

  it('αποτυχία ανάκτησης δέντρου αρχείων -> SFALMA και επιστροφή', async () => {
    eclass = new MockCrawlPyliError();

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
    expect(katagrafi.sfalmata.length).toBe(1);
    expect(katagrafi.proeidopoiiseis.length).toBe(0);
    expect(katagrafi.plirofories.length).toBe(0);
  });

  it('αποτυχία ανάγνωσης ευρετηρίου -> DIKTYO', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    const apothiki2 = new MockApothikiError('DIKTYO');
    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify([{ id: 'x', diadromi: 'file1.pdf' }])
    );

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki: apothiki2,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
    }
    expect(katagrafi.sfalmata.length).toBe(1);
    expect(katagrafi.proeidopoiiseis.length).toBe(0);
  });

  it('μη έγκυρη διαδρομή αρχείου (..) -> παράλειψη με προειδοποίηση', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'escape.pdf',
        diadromi: '../escapes/escape.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/../escapes/escape.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.paraleifthikan).toBe(1);
      expect(res.timi.synolo_arxeion).toBe(0);
    }
    expect(katagrafi.proeidopoiiseis.length).toBe(1);
  });

  it('αποτυχία λήψης αρχείου -> προειδοποίηση και συνέχεια', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => {
      throw new Error('Connection refused');
    });

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.synolo_arxeion).toBe(0);
    }
    expect(katagrafi.proeidopoiiseis.length).toBe(1);
  });

  it('HTTP 500 σε λήψη αρχείου -> προειδοποίηση και συνέχεια', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 500,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
      kefalides: {},
      dyadiko: new Uint8Array(0),
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.synolo_arxeion).toBe(0);
    }
    expect(katagrafi.proeidopoiiseis.length).toBe(1);
  });

  it('αποτυχία αποθήκευσης αρχείου -> sfalma και συνέχεια', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
      kefalides: {},
      dyadiko: new TextEncoder().encode('Περιεχόμενο'),
    }));

    const apothiki2 = new MockApothikiError('DIKTYO', ['grapse_dyadiko']);

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki: apothiki2,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(0);
      expect(res.timi.synolo_arxeion).toBe(0);
    }
    expect(katagrafi.sfalmata.length).toBe(1);
  });

  it('kathysterisi_ms > 0 -> περιμένει μεταξύ των λήψεων', async () => {
    const d1 = new TextEncoder().encode('Αρχείο 1');
    const d2 = new TextEncoder().encode('Αρχείο 2');

    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: d1.byteLength,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'file2.pdf',
        diadromi: 'file2.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file2.pdf',
        megethos: d2.byteLength,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'url1',
      kefalides: {},
      dyadiko: d1,
    }));

    http.orise_apantisi('file2.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'url2',
      kefalides: {},
      dyadiko: d2,
    }));

    const start = Date.now();
    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
      kathysterisi_ms: 50,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(2);
      expect(res.timi.synolo_arxeion).toBe(2);
    }
    expect(Date.now() - start).toBeGreaterThanOrEqual(50);
  });

  it('αποτυχία εγγραφής ευρετηρίου -> sfalma και επιστροφή', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
      kefalides: {},
      dyadiko: new TextEncoder().encode('Περιεχόμενο'),
    }));

    const apothiki2 = new MockApothikiError('MI_EGKYRO_SXIMA', ['grapse_keimeno']);

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki: apothiki2,
      katagrafi,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
    expect(katagrafi.sfalmata.length).toBe(1);
  });

  it('ημερομηνία/etag δεν αλλάζουν το αρχείο αλλά το sha256 είναι null -> L253 true', async () => {
    const dedomena = new TextEncoder().encode('Σταθερό περιεχόμενο');
    const kanoniki_diadromi = 'theoria.pdf';
    const topiki_diadromi = `${KODIKOS}/arxeia/${kanoniki_diadromi}`;
    const diadromi_eurethriou = `${KODIKOS}/.spoudes/eurethrio-arxeion.json`;
    const url = 'https://thales.cs.unipi.gr/courses/PLI101/document/theoria.pdf';

    // Υπάρχουσα τοπική αποθήκη με etag = url, αλλά κενό sha256
    await apothiki.grapse_dyadiko(topiki_diadromi, dedomena);
    await apothiki.grapse_keimeno(
      diadromi_eurethriou,
      JSON.stringify([
        {
          id: ftiaxe_arxeio_id(KODIKOS, kanoniki_diadromi),
          kodikos_mathimatos: KODIKOS,
          diadromi: kanoniki_diadromi,
          url,
          megethos: dedomena.byteLength,
          imerominia: '2026-10-01',
          etag: url,
          sha256: null,
          diplotypo_tou: null,
        },
      ])
    );

    eclass.dentro_apotelesma = [
      {
        typos: 'fakelos',
        onoma: '',
        diadromi: '',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/',
        megethos: null,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'theoria.pdf',
        diadromi: 'theoria.pdf',
        url,
        megethos: dedomena.byteLength,
        imerominia: '2026-10-02',
      },
    ];

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.ametavlita_arxeia).toBe(1);
      expect(res.timi.nea_arxeia).toBe(0);
    }
    expect(http.kliseis.length).toBe(0);
  });

  it('response χωρίς dyadiko -> χρησιμοποιείται η fallback κενή δέσμη (L210)', async () => {
    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: 100,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
      kefalides: {},
    }));

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.nea_arxeia).toBe(1);
      expect(res.timi.synolo_arxeion).toBe(1);
    }
    const periexomeno = await apothiki.diavase_dyadiko(`${KODIKOS}/arxeia/file1.pdf`);
    expect(periexomeno.ok).toBe(true);
    if (periexomeno.ok) {
      expect(periexomeno.timi.length).toBe(0);
    }
  });

  it('AbortSignal μετά την πρώτη λήψη -> L307 false (διατήρηση παλαιών αρχείων)', async () => {
    const d1 = new TextEncoder().encode('Αρχείο 1');
    const d2 = new TextEncoder().encode('Αρχείο 2');

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50); // διακοπή μετά την πρώτη λήψη

    eclass.dentro_apotelesma = [
      {
        typos: 'arxeio',
        onoma: 'file1.pdf',
        diadromi: 'file1.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
        megethos: d1.byteLength,
        imerominia: null,
      },
      {
        typos: 'arxeio',
        onoma: 'file2.pdf',
        diadromi: 'file2.pdf',
        url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file2.pdf',
        megethos: d2.byteLength,
        imerominia: null,
      },
    ];

    http.orise_apantisi('file1.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
      kefalides: {},
      dyadiko: d1,
    }));
    http.orise_apantisi('file2.pdf', (): HttpApantisi => ({
      katastasi: 200,
      teliko_url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file2.pdf',
      kefalides: {},
      dyadiko: d2,
    }));

    await apothiki.grapse_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`,
      JSON.stringify([
        {
          id: ftiaxe_arxeio_id(KODIKOS, 'file1.pdf'),
          kodikos_mathimatos: KODIKOS,
          diadromi: 'file1.pdf',
          url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file1.pdf',
          megethos: d1.byteLength,
          imerominia: null,
          etag: null,
          sha256: hash_periexomenou(d1),
          diplotypo_tou: null,
        },
        {
          id: ftiaxe_arxeio_id(KODIKOS, 'file3.pdf'),
          kodikos_mathimatos: KODIKOS,
          diadromi: 'file3.pdf',
          url: 'https://thales.cs.unipi.gr/courses/PLI101/document/file3.pdf',
          megethos: 0,
          imerominia: null,
          etag: null,
          sha256: null,
          diplotypo_tou: null,
        },
      ])
    );

    const res = await sygxronise_mathima({
      kodikos_mathimatos: KODIKOS,
      eclass,
      http,
      apothiki,
      katagrafi,
      kathysterisi_ms: 100,
      simatodotis: controller.signal,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AKYROTHIKE');
    }
    // Η πρόοδος αποθηκεύτηκε με το file1 (επεξεργασμένο) και το file3 (παλιό)
    const eurethrio_res = await apothiki.diavase_keimeno(
      `${KODIKOS}/.spoudes/eurethrio-arxeion.json`
    );
    expect(eurethrio_res.ok).toBe(true);
    if (eurethrio_res.ok) {
      const parsed = JSON.parse(eurethrio_res.timi);
      expect(parsed.length).toBe(2);
      expect(parsed.map((p: Record<string, unknown>) => p.diadromi).sort()).toEqual([
        'file1.pdf',
        'file3.pdf',
      ]);
    }
  });
});
