import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MathimaSchema } from '@dps/core';
import type { Apotelesma, EclassPyli, KomvosArxeiou, Mathima, Sfalma } from '@dps/core';
import { MockEclassPyli, RIZA_FIXTURES_PAKETA } from '../src/index.js';

function sfalma(r: Apotelesma<unknown>): Sfalma {
  if (r.ok) {
    throw new Error('Αναμένονταν σφάλμα, ήρθε επιτυχία');
  }
  return r.sfalma;
}

function timi<T>(r: Apotelesma<T>): T {
  if (!r.ok) {
    throw new Error(`Αναμένονταν επιτυχία, ήρθε σφάλμα ${r.sfalma.kodikos}: ${r.sfalma.minima}`);
  }
  return r.timi;
}

const KODIKOI_SYNTETIKOI = ['PLI101', 'PLI200', 'ANA100'] as const;

let riza_prosorini: string;

beforeEach(async () => {
  riza_prosorini = await fs.mkdtemp(path.join(os.tmpdir(), 'dps-mock-eclass-'));
});

afterEach(async () => {
  await fs.rm(riza_prosorini, { recursive: true, force: true });
});

async function grapse_arxeio(diadromi: string, periexomeno: string): Promise<void> {
  const teliki = path.isAbsolute(diadromi) ? diadromi : path.join(riza_prosorini, diadromi);
  await fs.mkdir(path.dirname(teliki), { recursive: true });
  await fs.writeFile(teliki, periexomeno, 'utf8');
}

const POUTSA_MATHIMATON = JSON.stringify([
  { kodikos: 'PLI101', titlos: 'Μάθημα δοκιμής', url: 'https://thales.cs.unipi.gr/courses/PLI101/', epilegmeno: true },
]);

const POUTSO_DENTRO = JSON.stringify([
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
    onoma: 'dokimio.pdf',
    diadromi: 'dokimio.pdf',
    url: 'https://thales.cs.unipi.gr/courses/PLI101/document/dokimio.pdf',
    megethos: 1024,
    imerominia: '2026-09-28T10:15:00+03:00',
  },
]);

describe('MockEclassPyli — σύνδεση', () => {
  it('συνδέεται όταν τα scrubbed fixtures υπάρχουν', async () => {
    const pyli = new MockEclassPyli();
    const r = await pyli.syndesi();
    expect(r.ok).toBe(true);
  });

  it('η προεπιλεγμένη ρίζα fixtures είναι ο φάκελος scrubbed του repo', () => {
    expect(path.basename(RIZA_FIXTURES_PAKETA)).toBe('scrubbed');
    expect(RIZA_FIXTURES_PAKETA.endsWith(path.join('fixtures', 'eclass', 'scrubbed'))).toBe(true);
  });

  it('δίνει DEN_VRETHIKE (όχι κενή επιτυχία) όταν λείπει ο φάκελος των fixtures', async () => {
    const pyli = new MockEclassPyli({ riza_fixture: path.join(riza_prosorini, 'den-uparxei') });
    const r = await pyli.syndesi();
    expect(sfalma(r).kodikos).toBe('DEN_VRETHIKE');
  });

  it('δίνει DEN_VRETHIKE όταν λείπει το mathimata.json', async () => {
    const pyli = new MockEclassPyli({ riza_fixture: riza_prosorini });
    const r = await pyli.syndesi();
    expect(sfalma(r).kodikos).toBe('DEN_VRETHIKE');
    expect(sfalma(r).minima).toContain('mathimata.json');
  });
});

describe('MockEclassPyli — fere_mathimata', () => {
  it('διαβάζει τα 3 συνθετικά μαθήματα', async () => {
    const pyli = new MockEclassPyli();
    const mathimata = timi(await pyli.fere_mathimata());
    expect(mathimata).toHaveLength(3);
    expect(mathimata.map((m: Mathima) => m.kodikos)).toEqual([...KODIKOI_SYNTETIKOI]);
  });

  it('κάθε μάθημα περνά το MathimaSchema και έχει url βασισμένο στο thales', async () => {
    const pyli = new MockEclassPyli();
    for (const mathima of timi(await pyli.fere_mathimata())) {
      expect(MathimaSchema.safeParse(mathima).success).toBe(true);
      expect(mathima.url.startsWith('https://thales.cs.unipi.gr/courses/')).toBe(true);
      expect(mathima.titlos.length).toBeGreaterThan(0);
      expect(typeof mathima.epilegmeno).toBe('boolean');
    }
  });

  it('είναι ντετερμινισμένο: δύο κλήσεις και δύο instances δίνουν ίδια αποτελέσματα', async () => {
    const pyli_a = new MockEclassPyli();
    const pyli_b = new MockEclassPyli();
    const pr = timi(await pyli_a.fere_mathimata());
    const de = timi(await pyli_a.fere_mathimata());
    const tri = timi(await pyli_b.fere_mathimata());
    expect(pr).toEqual(de);
    expect(pr).toEqual(tri);
  });

  it('δεν κάνει mutate το fixture στη δίσκο', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'mathimata.json'), POUTSA_MATHIMATON);
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    timi(await pyli.fere_mathimata());
    timi(await pyli.fere_mathimata());
    const keimeno = await fs.readFile(path.join(riza, 'mathimata.json'), 'utf8');
    expect(keimeno).toBe(POUTSA_MATHIMATON);
  });

  it('λείπει το fixture → DEN_VRETHIKE με σαφές μήνυμα', async () => {
    const pyli = new MockEclassPyli({ riza_fixture: riza_prosorini });
    const s = sfalma(await pyli.fere_mathimata());
    expect(s.kodikos).toBe('DEN_VRETHIKE');
    expect(s.minima).toContain('mathimata.json');
  });

  it('μη έγκυρο JSON → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'mathimata.json'), '{ δεν είναι json');
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_mathimata());
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μάθημα εκτός σχήματος → MI_EGKYRO_SXIMA που δείχνει τη θέση', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'mathimata.json'),
      JSON.stringify([
        { kodikos: 'PLI101', titlos: 'Εντάξει', url: 'u', epilegmeno: true },
        { kodikos: 'PLI200', url: 'u', epilegmeno: true },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_mathimata());
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('1');
  });

  it('κενός πίνακας → DEN_VRETHIKE, ΠΟΤΕ κενή επιτυχία', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'mathimata.json'), '[]');
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_mathimata());
    expect(s.kodikos).toBe('DEN_VRETHIKE');
    expect(s.minima).toContain('κενό');
  });

  it('μη πίνακας → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'mathimata.json'), '{"mathimata": []}');
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    expect(sfalma(await pyli.fere_mathimata()).kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('MockEclassPyli — fere_dentro_arxeion', () => {
  it('διαβάζει το δέντρο του PLI101 με έγκυρα KomvosArxeiou, ρίζα πρώτη', async () => {
    const pyli = new MockEclassPyli();
    const dendro = timi(await pyli.fere_dentro_arxeion('PLI101'));
    expect(dendro.length).toBeGreaterThan(0);
    expect(dendro[0]?.diadromi).toBe('');
    expect(dendro[0]?.typos).toBe('fakelos');
    for (const komvos of dendro) {
      expect(typeof komvos.url).toBe('string');
      expect(komvos.url.startsWith('https://thales.cs.unipi.gr/courses/PLI101/')).toBe(true);
    }
  });

  it('περιλαμβάνει φακέλους και αρχεία pdf/pptx/docx/zip', async () => {
    const pyli = new MockEclassPyli();
    const dendro = timi(await pyli.fere_dentro_arxeion('PLI101'));
    const fakeloi = dendro.filter((k: KomvosArxeiou) => k.typos === 'fakelos');
    const arxeia = dendro.filter((k: KomvosArxeiou) => k.typos === 'arxeio');
    expect(fakeloi.length).toBeGreaterThan(0);
    expect(arxeia.length).toBeGreaterThan(0);
    const extensions = new Set(arxeia.map((k: KomvosArxeiou) => path.extname(k.onoma).toLowerCase()));
    expect([...extensions].sort()).toEqual(['.docx', '.pdf', '.pptx']);
    expect(arxeia.some((k: KomvosArxeiou) => k.diadromi.includes('/'))).toBe(true);
  });

  it('διαβάζει δέντρο και για τα άλλα δύο μαθήματα', async () => {
    const pyli = new MockEclassPyli();
    for (const kodikos of KODIKOI_SYNTETIKOI.slice(1)) {
      const dendro = timi(await pyli.fere_dentro_arxeion(kodikos));
      expect(dendro.length).toBeGreaterThan(0);
      expect(dendro[0]?.diadromi).toBe('');
    }
  });

  it('κρατάει τα nullable πεδία megethos/imerominia ως null', async () => {
    const pyli = new MockEclassPyli();
    const dendro = timi(await pyli.fere_dentro_arxeion('PLI101'));
    const xer = dendro.find((k: KomvosArxeiou) => k.onoma === 'parousia-eisagogi.pptx');
    expect(xer?.megethos).toBeNull();
    expect(xer?.imerominia).toBeNull();
    const plires = dendro.find((k: KomvosArxeiou) => k.onoma === 'programmatismos.pdf');
    expect(plires?.megethos).toBe(1843200);
    expect(plires?.imerominia).toBe('2026-09-28T10:15:00+03:00');
  });

  it('είναι ντετερμινισμένο', async () => {
    const pyli = new MockEclassPyli();
    expect(timi(await pyli.fere_dentro_arxeion('ANA100'))).toEqual(
      timi(await pyli.fere_dentro_arxeion('ANA100'))
    );
  });

  it('άγνωστος κωδικός → DEN_VRETHIKE που αναφέρει τον κωδικό', async () => {
    const pyli = new MockEclassPyli();
    const s = sfalma(await pyli.fere_dentro_arxeion('ZZZ999'));
    expect(s.kodikos).toBe('DEN_VRETHIKE');
    expect(s.minima).toContain('ZZZ999');
  });

  it('κωδικός με διαδρομή escape (..) → DEN_VRETHIKE, δεν φεύγει από τον φάκελο', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'mathimata.json'), POUTSA_MATHIMATON);
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('../mathimata'));
    expect(s.kodikos).toBe('DEN_VRETHIKE');
  });

  it('fixture με «..» μέσα στο δέντρο → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'arxeio',
          onoma: 'kako.pdf',
          diadromi: '../../../../etc/passwd',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    expect(sfalma(await pyli.fere_dentro_arxeion('PLI101')).kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('komvos με λάθος typos → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'symlinko',
          onoma: 'x',
          diadromi: 'x',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('PLI101'));
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('typos');
  });

  it('δέντρο χωρίς ρίζα → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'arxeio',
          onoma: 'dokimio.pdf',
          diadromi: 'dokimio.pdf',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('PLI101'));
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('ρίζα');
  });

  it('δεύτερη ρίζα στο δέντρο → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'fakelos',
          onoma: '',
          diadromi: '',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
        {
          typos: 'fakelos',
          onoma: '',
          diadromi: '',
          url: 'https://thales.cs.unipi.gr/y',
          megethos: null,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    expect(sfalma(await pyli.fere_dentro_arxeion('PLI101')).kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('komvos με μη http url → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'fakelos',
          onoma: '',
          diadromi: '',
          url: 'javascript:alert(1)',
          megethos: null,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('PLI101'));
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('url');
  });

  it('komvos με αρνητικό megethos → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'fakelos',
          onoma: '',
          diadromi: '',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
        {
          typos: 'arxeio',
          onoma: 'x.pdf',
          diadromi: 'x.pdf',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: -5,
          imerominia: null,
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('PLI101'));
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('megethos');
  });

  it('komvos με μη ISO-8601 imerominia → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(
      path.join(riza, 'dentro', 'PLI101.json'),
      JSON.stringify([
        {
          typos: 'fakelos',
          onoma: '',
          diadromi: '',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: null,
          imerominia: null,
        },
        {
          typos: 'arxeio',
          onoma: 'x.pdf',
          diadromi: 'x.pdf',
          url: 'https://thales.cs.unipi.gr/x',
          megethos: 1,
          imerominia: 'χτες',
        },
      ])
    );
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    const s = sfalma(await pyli.fere_dentro_arxeion('PLI101'));
    expect(s.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(s.minima).toContain('imerominia');
  });

  it('κενό δέντρο → DEN_VRETHIKE', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'dentro', 'PLI101.json'), '[]');
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    expect(sfalma(await pyli.fere_dentro_arxeion('PLI101')).kodikos).toBe('DEN_VRETHIKE');
  });

  it('μη έγκυρο JSON στο δέντρο → MI_EGKYRO_SXIMA', async () => {
    const riza = path.join(riza_prosorini, 'fixtures');
    await grapse_arxeio(path.join(riza, 'dentro', 'PLI101.json'), '[[[');
    const pyli = new MockEclassPyli({ riza_fixture: riza });
    expect(sfalma(await pyli.fere_dentro_arxeion('PLI101')).kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('MockEclassPyli — smoke', () => {
  it('είναι EclassPyli και οι 3 μέθοδοι απαντούν', async () => {
    const pyli: EclassPyli = new MockEclassPyli();
    expect((await pyli.syndesi()).ok).toBe(true);
    expect((await pyli.fere_mathimata()).ok).toBe(true);
    expect((await pyli.fere_dentro_arxeion('PLI101')).ok).toBe(true);
  });

  it('δεν περιέχει μυστικά ή cookies στα fixtures', async () => {
    const pyli = new MockEclassPyli();
    const mathimata = timi(await pyli.fere_mathimata());
    const dendro = timi(await pyli.fere_dentro_arxeion('PLI101'));
    const seiriaka = [...mathimata, ...dendro].map((x: unknown) => JSON.stringify(x)).join(' ');
    for (const parevonomo of ['password', 'session', 'cookie', 'PHPSESSID', 'token', 'bearer']) {
      expect(seiriaka.toLowerCase()).not.toContain(parevonomo.toLowerCase());
    }
  });
});