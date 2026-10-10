import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FakeHttp, FakeMystika, FakeRologi, LLM_TIMEOUT_MS, MEGISTES_EPANALIPSEIS } from '@dps/core';
import type {
  Apotelesma,
  HttpAitima,
  HttpApantisi,
  HttpPyli,
  KatagrafiPyli,
  KodikosSfalmatos,
  LlmAitimaJson,
} from '@dps/core';
import type { ZodType } from 'zod';
import {
  ftiaxe_gemini_llm,
  gemini_url,
  gemini_sxima,
  perimeno_realis,
  BASIKO_ANAMONOS_MS,
  PARAPOGONH_ANAMONOU,
  ANAMONOS_JITTER,
  MILLISECONDS_PER_SECOND,
  GEMINI_TYPOS_KEIMENOU_JSON,
} from '../src/gemini/index.js';

class PylesiPleiromenon implements HttpPyli {
  kliseis: HttpAitima[] = [];

  async aitima(a: HttpAitima): Promise<Apotelesma<HttpApantisi>> {
    this.kliseis.push(a);
    throw new Error('syndesi akoustise');
  }
}

const MONTELO = 'gemini-2.5-flash';
const URL_ANAMONTE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const URL_ANAMONTE_ALT = 'https://proxy.example.org/gemini/v1beta/models/gemini-2.5-flash:generateContent';
const KLEIDI = 'AIzaSyTOP-SECRET-KLEIDI-0001';
const ANTIPOCHO = ':generateContent';

const SximaPerigramma = z.object({
  arxeio_id: z.string(),
  titlos: z.string(),
  tmimata: z.array(z.object({ titlos: z.string(), selides: z.number() })),
});

interface MinimaKatagrafis {
  minima: string;
  dedomena: Record<string, unknown> | undefined;
}

class MnimiKatagrafi implements KatagrafiPyli {
  pliroforeies: MinimaKatagrafis[] = [];
  proeidopoiiseis: MinimaKatagrafis[] = [];
  sfalmata: MinimaKatagrafis[] = [];

  pliroforia(minima: string, dedomena?: Record<string, unknown>): void {
    this.pliroforeies.push({ minima, dedomena });
  }

  proeidopoiisi(minima: string, dedomena?: Record<string, unknown>): void {
    this.proeidopoiiseis.push({ minima, dedomena });
  }

  sfalma(minima: string, dedomena?: Record<string, unknown>): void {
    this.sfalmata.push({ minima, dedomena });
  }

  alla(): MinimaKatagrafis[] {
    return [...this.pliroforeies, ...this.proeidopoiiseis, ...this.sfalmata];
  }
}

interface Periballon {
  http: FakeHttp;
  mystika: FakeMystika;
  rologi: FakeRologi;
  katagrafi: MnimiKatagrafi;
  anamonos: number[];
  llm: ReturnType<typeof ftiaxe_gemini_llm>;
}

async function ftiaxe_periballon(
  arxiki_mera: Date = new Date('2026-10-09T10:00:00.000Z'),
  kleidi: string | null = KLEIDI
): Promise<Periballon> {
  const http = new FakeHttp();
  const mystika = new FakeMystika();
  const rologi = new FakeRologi(arxiki_mera);
  const katagrafi = new MnimiKatagrafi();
  const anamonos: number[] = [];
  if (kleidi !== null) {
    await mystika.vale('llm_api_key', kleidi);
  }
  const llm = ftiaxe_gemini_llm(http, mystika, rologi, katagrafi, {
    montelo: MONTELO,
    perimeno_ms: async (ms: number): Promise<void> => {
      anamonos.push(ms);
    },
  });
  return { http, mystika, rologi, katagrafi, anamonos, llm };
}

function apantisi(katastasi: number, keimeno: string): HttpApantisi {
  return { katastasi, kefalides: {}, teliko_url: URL_ANAMONTE, keimeno };
}

function soma_apantisis(keimeno: string): string {
  return JSON.stringify({
    candidates: [{ content: { parts: [{ text: keimeno }] }, finishReason: 'STOP' }],
  });
}

function orise_aponixia(http: FakeHttp, apantiseis: HttpApantisi[]): void {
  let i = 0;
  http.orise_apantisi(ANTIPOCHO, () => {
    const trexo = apantiseis[i];
    i += 1;
    if (trexo === undefined) {
      throw new Error('to script apantiseon exexerastihke');
    }
    return trexo;
  });
}

type ParageldiaJson = Omit<LlmAitimaJson<unknown>, 'sxima'> & { sxima: ZodType<unknown> };

function aitima_json(epitexseis: Partial<ParageldiaJson> = {}): ParageldiaJson {
  const aitima: ParageldiaJson = {
    systima: epitexseis.systima ?? 'Είσαι βοηθός.',
    xristis: epitexseis.xristis ?? 'Περιέγραψε το κείμενο.',
    sxima: epitexseis.sxima ?? SximaPerigramma,
    ekdosi_prompt: epitexseis.ekdosi_prompt ?? 'p1',
    thermokrasia: epitexseis.thermokrasia ?? 0.2,
  };
  if (epitexseis.simatodotis !== undefined) {
    aitima.simatodotis = epitexseis.simatodotis;
  }
  return aitima;
}

function kodikos(apotelesma: Apotelesma<unknown>): KodikosSfalmatos {
  if (apotelesma.ok) {
    throw new Error('aytithethike epityxia alla zitithike sfalma');
  }
  return apotelesma.sfalma.kodikos;
}

function minima(apotelesma: Apotelesma<unknown>): string {
  if (apotelesma.ok) {
    throw new Error('aytithethike epityxia alla zitithike sfalma');
  }
  return apotelesma.sfalma.minima;
}

function lektika_tou_somatos(aitima: { soma_json?: unknown }): Record<string, unknown> {
  if (aitima.soma_json === undefined || typeof aitima.soma_json !== 'object' || aitima.soma_json === null) {
    throw new Error('to soma_json den einai object');
  }
  return aitima.soma_json as Record<string, unknown>;
}

describe('gemini_url', () => {
  it('χτίζει το endpoint του generateContent από το προεπιλεγμένο base URL', () => {
    expect(gemini_url('https://generativelanguage.googleapis.com', MONTELO)).toBe(URL_ANAMONTE);
  });

  it('δεν διπλασιάζει το κάτωλιγμα στο custom base URL', () => {
    expect(gemini_url('https://proxy.example.org/gemini/', MONTELO)).toBe(URL_ANAMONTE_ALT);
  });

  it('ο πραγματικός χρόνος αναμονής ολοκληρώνεται', async () => {
    await expect(perimeno_realis(0)).resolves.toBeUndefined();
  });

  it('κωδικοποιεί το όνομα του μοντέλου στο URL', () => {
    expect(gemini_url('https://proxy.example.org/gemini', 'a b/c')).toBe(
      'https://proxy.example.org/gemini/v1beta/models/a%20b%2Fc:generateContent'
    );
  });
});

describe('gemini_sxima', () => {
  it('κάνει upper-case τους τύπους JSON Schema όπως τα ορίζει το Gemini', () => {
    const sisma = gemini_sxima(SximaPerigramma);
    expect(sisma['type']).toBe('OBJECT');
    const properties = sisma['properties'];
    if (typeof properties !== 'object' || properties === null) {
      throw new Error('λείπουν τα properties');
    }
    const arxeio_id = (properties as Record<string, unknown>)['arxeio_id'];
    expect(arxeio_id).toMatchObject({ type: 'STRING' });
    const tmimata = (properties as Record<string, unknown>)['tmimata'];
    expect(tmimata).toMatchObject({ type: 'ARRAY' });
  });

  it('κάνει upper-case και τα nullable unions', () => {
    const sisma = gemini_sxima(z.object({ lepta: z.number().nullable() }));
    const properties = sisma['properties'];
    if (typeof properties !== 'object' || properties === null) {
      throw new Error('λείπουν τα properties');
    }
    expect((properties as Record<string, unknown>)['lepta']).toMatchObject({ type: ['NUMBER', 'NULL'] });
  });

  it('αφαιρεί το $schema που δεν υποστηρίζει το Gemini', () => {
    const sisma = gemini_sxima(z.object({ titlos: z.string() }));
    expect(Object.keys(sisma)).not.toContain('$schema');
  });
});

describe('parage_json', () => {
  it('επιστρέφει την τυποποιημένη τιμή όταν η απάντηση ταιριάζει με το σχήμα', async () => {
    const b = await ftiaxe_periballon();
    const perigramma = {
      arxeio_id: 'arx-1',
      titlos: 'Δομές δεδομένων',
      tmimata: [{ titlos: 'Λίστες', selides: 3 }],
    };
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis(JSON.stringify(perigramma))));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toEqual(perigramma);
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('στέλνει POST στο σωστό endpoint με το κλειδί στο header x-goog-api-key', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () =>
      apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a', titlos: 'b', tmimata: [] })))
    );

    await b.llm.parage_json(aitima_json());

    const aitima = b.http.kliseis[0];
    if (aitima === undefined) throw new Error('δεν έγινε αίτημα');
    expect(aitima.methodos).toBe('POST');
    expect(aitima.url).toBe(URL_ANAMONTE);
    expect(aitima.kefalides?.['x-goog-api-key']).toBe(KLEIDI);
    expect(aitima.xronos_orio_ms).toBe(LLM_TIMEOUT_MS);
    expect(aitima.simatodotis).toBeInstanceOf(AbortSignal);
    expect(aitima.akolouthise_anakateuthinseis).toBe(false);
    expect(aitima.typos_apantisis).toBe('keimeno');
  });

  it('βάζει το σύστημα στο systemInstruction και το σχήμα στο generationConfig', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () =>
      apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a', titlos: 'b', tmimata: [] })))
    );

    await b.llm.parage_json(aitima_json({ systima: 'Είσαι βοηθός.', xristis: 'Περιέγραψε.' }));

    const soma = lektika_tou_somatos(b.http.kliseis[0] ?? { soma_json: undefined });
    expect(soma['systemInstruction']).toEqual({ parts: [{ text: 'Είσαι βοηθός.' }] });
    const contents = soma['contents'];
    expect(contents).toEqual([{ role: 'user', parts: [{ text: 'Περιέγραψε.' }] }]);
    const generationConfig = soma['generationConfig'];
    if (typeof generationConfig !== 'object' || generationConfig === null) {
      throw new Error('λείπει το generationConfig');
    }
    const config = generationConfig as Record<string, unknown>;
    expect(config['responseMimeType']).toBe(GEMINI_TYPOS_KEIMENOU_JSON);
    expect(config['temperature']).toBe(0.2);
    expect(config['responseSchema']).toMatchObject({ type: 'OBJECT' });
  });

  it('χρησιμοποιεί το custom base URL', async () => {
    const http = new FakeHttp();
    const mystika = new FakeMystika();
    await mystika.vale('llm_api_key', KLEIDI);
    const katagrafi = new MnimiKatagrafi();
    http.orise_apantisi(ANTIPOCHO, () =>
      apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a', titlos: 'b', tmimata: [] })))
    );
    const llm = ftiaxe_gemini_llm(http, mystika, new FakeRologi(), katagrafi, {
      montelo: MONTELO,
      base_url: 'https://proxy.example.org/gemini/',
    });

    await llm.parage_json(aitima_json());

    expect(http.kliseis[0]?.url).toBe(URL_ANAMONTE_ALT);
  });

  it('MI_EGKYRO_SXIMA όταν το κείμενο δεν είναι JSON', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('Δεν είμαι JSON {')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('MI_EGKYRO_SXIMA όταν το JSON δεν ταιριάζει με το σχήμα', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a' }))));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('MI_EGKYRO_SXIMA όταν λείπει το envelope της απάντησης', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, JSON.stringify({ candidates: [] })));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
  });

  it('MI_EGKYRO_SXIMA όταν το σώμα της απάντησης δεν είναι JSON', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, 'ΟΧΙ JSON'));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
  });

  it('MI_EGKYRO_SXIMA όταν η επιτυχής απάντηση δεν έχει σώμα', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => ({
      katastasi: 200,
      kefalides: {},
      teliko_url: URL_ANAMONTE,
    }));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
  });

  it('DIKTYO όταν το HttpPyli κάνει throw, μετά από εξαντλημένες επαναλήψεις', async () => {
    const http = new PylesiPleiromenon();
    const mystika = new FakeMystika();
    await mystika.vale('llm_api_key', KLEIDI);
    const llm = ftiaxe_gemini_llm(http, mystika, new FakeRologi(), new MnimiKatagrafi(), {
      montelo: MONTELO,
      perimeno_ms: async (): Promise<void> => undefined,
    });

    const apotelesma = await llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('DIKTYO');
    expect(http.kliseis).toHaveLength(MEGISTES_EPANALIPSEIS);
  });

  it('MI_YPOSTIRIZOMENO όταν το σχήμα δεν μετατρέπεται σε JSON Schema', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('{}')));

    const apotelesma = await b.llm.parage_json(aitima_json({ sxima: z.object({ imerominia: z.date() }) }));

    expect(kodikos(apotelesma)).toBe('MI_YPOSTIRIZOMENO');
    expect(b.http.kliseis).toHaveLength(0);
  });

  it('MI_YPOSTIRIZOMENO όταν λείπει το llm_api_key', async () => {
    const b = await ftiaxe_periballon(new Date('2026-10-09T10:00:00.000Z'), null);

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('AUTH_APOTYXIA');
    expect(b.http.kliseis).toHaveLength(0);
  });

  it('AUTH_APOTYXIA χωρίς αίτημα όταν το κλειδί είναι κενό', async () => {
    const b = await ftiaxe_periballon(new Date('2026-10-09T10:00:00.000Z'), '   ');

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('AUTH_APOTYXIA');
    expect(b.http.kliseis).toHaveLength(0);
  });
});

describe('retry και backoff', () => {
  it('429 → 429 → 200: επιτυχία με ακριβώς 3 αιτήματα και 2 backoff', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, [
      apantisi(429, '{}'),
      apantisi(429, '{}'),
      apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a', titlos: 'b', tmimata: [] }))),
    ]);

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(apotelesma.ok).toBe(true);
    expect(b.http.kliseis).toHaveLength(3);
    expect(b.anamonos).toHaveLength(2);
    expect(b.anamonos[0]).toBe(BASIKO_ANAMONOS_MS);
    expect(b.anamonos[1]).toBe(BASIKO_ANAMONOS_MS * PARAPOGONH_ANAMONOU);
  });

  it('το backoff είναι εκθετικό με jitter που προέρχεται από το FakeRologi', async () => {
    const a = await ftiaxe_periballon(new Date('2026-10-09T10:00:00.000Z'));
    orise_aponixia(a.http, [apantisi(429, '{}'), apantisi(429, '{}'), apantisi(200, soma_apantisis('{}'))]);
    await a.llm.parage_json(aitima_json());

    const b = await ftiaxe_periballon(new Date('2026-10-09T10:00:00.500Z'));
    orise_aponixia(b.http, [apantisi(429, '{}'), apantisi(429, '{}'), apantisi(200, soma_apantisis('{}'))]);
    await b.llm.parage_json(aitima_json());

    const meros = 500 / MILLISECONDS_PER_SECOND;
    const anamonos_grammi = BASIKO_ANAMONOS_MS * (1 + meros * ANAMONOS_JITTER);
    expect(b.anamonos[0]).toBe(Math.round(anamonos_grammi));
    expect(b.anamonos[0]).not.toBe(a.anamonos[0]);
    expect(b.anamonos[1]).toBe(Math.round(anamonos_grammi * PARAPOGONH_ANAMONOU));
    expect(b.anamonos[1]).toBeGreaterThan(b.anamonos[0] as number);
  });

  it('εξαντλεί τις προσπάθειες σε μόνιμο 429 και δίνει RATE_LIMIT', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(429, '{}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('RATE_LIMIT');
    expect(b.http.kliseis).toHaveLength(MEGISTES_EPANALIPSEIS);
    expect(b.anamonos).toHaveLength(MEGISTES_EPANALIPSEIS - 1);
  });

  it('επαναλαμβάνει σε 5xx και μετά δίνει DIKTYO', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(503, '{}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('DIKTYO');
    expect(b.http.kliseis).toHaveLength(MEGISTES_EPANALIPSEIS);
  });

  it('επαναλαμβάνει σε σφάλμα δικτύου του HttpPyli και μετά δίνει DIKTYO', async () => {
    const b = await ftiaxe_periballon();

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('DIKTYO');
    expect(b.http.kliseis).toHaveLength(MEGISTES_EPANALIPSEIS);
  });

  it('401 → AUTH_APOTYXIA με ακριβώς ένα αίτημα, χωρίς retry', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(401, '{"error":{"message":"bad key"}}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('AUTH_APOTYXIA');
    expect(b.http.kliseis).toHaveLength(1);
    expect(b.anamonos).toHaveLength(0);
  });

  it('403 → AUTH_APOTYXIA χωρίς retry', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(403, '{}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('AUTH_APOTYXIA');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('400 → MI_EGKYRO_SXIMA χωρίς retry', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(400, '{"error":{"message":"bad"}}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('404 → DEN_VRETHIKE χωρίς retry', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(404, '{}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('DEN_VRETHIKE');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('άλλο μη 2xx → AGNOSTO χωρίς retry', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(418, '{}')));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(kodikos(apotelesma)).toBe('AGNOSTO');
    expect(b.http.kliseis).toHaveLength(1);
  });
});

describe('timeout', () => {
  it('TIMEOUT όταν ο caller ακυρώνει ενώ η κλήση εκκρεμεί', async () => {
    const b = await ftiaxe_periballon();
    let emakesi: () => void = () => undefined;
    const amakesi = new Promise<void>((resolve) => {
      emakesi = resolve;
    });
    b.http.orise_apantisi(ANTIPOCHO, () => {
      emakesi();
      return new Promise<HttpApantisi>(() => undefined);
    });
    const controller = new AbortController();

    const pending = b.llm.parage_json(aitima_json({ simatodotis: controller.signal }));
    await amakesi;
    controller.abort();
    const apotelesma = await pending;

    expect(kodikos(apotelesma)).toBe('TIMEOUT');
    expect(b.http.kliseis).toHaveLength(1);
  });

  it('TIMEOUT χωρίς καμία κλήση όταν ο signal έχει ήδη ακυρωθεί', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('{}')));
    const controller = new AbortController();
    controller.abort();

    const apotelesma = await b.llm.parage_json(aitima_json({ simatodotis: controller.signal }));

    expect(kodikos(apotelesma)).toBe('TIMEOUT');
    expect(b.http.kliseis).toHaveLength(0);
  });

  it('δεν επαναλαμβάνει μετά από timeout', async () => {
    const b = await ftiaxe_periballon();
    let emakesi: () => void = () => undefined;
    const amakesi = new Promise<void>((resolve) => {
      emakesi = resolve;
    });
    b.http.orise_apantisi(ANTIPOCHO, () => {
      emakesi();
      return new Promise<HttpApantisi>(() => undefined);
    });
    const controller = new AbortController();

    const pending = b.llm.parage_json(aitima_json({ simatodotis: controller.signal }));
    await amakesi;
    controller.abort();
    await pending;

    expect(b.http.kliseis).toHaveLength(1);
    expect(b.anamonos).toHaveLength(0);
  });
});

describe('parage_keimeno', () => {
  it('επιστρέφει το κείμενο του μοντέλου ντετερμινιστικά', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('Πρώτη απάντηση.')));

    const aitima = {
      systima: 'Είσαι tutor.',
      minimata: [
        { rolos: 'xristis' as const, keimeno: 'Τι είναι οδός;' },
        { rolos: 'montelo' as const, keimeno: 'Μια σειρά.' },
        { rolos: 'xristis' as const, keimeno: 'Εξήγησέ το.' },
      ],
      ekdosi_prompt: 'p4',
      thermokrasia: 0.4,
    };

    const pryti = await b.llm.parage_keimeno(aitima);
    const defteri = await b.llm.parage_keimeno(aitima);

    expect(pryti.ok).toBe(true);
    expect(defteri.ok).toBe(true);
    if (!pryti.ok || !defteri.ok) throw new Error('απέτυχε');
    expect(pryti.timi).toBe('Πρώτη απάντηση.');
    expect(defteri.timi).toBe(pryti.timi);
  });

  it('χτίζει το contents με τα roles user/model και χωρίς responseSchema', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('Οκ.')));

    await b.llm.parage_keimeno({
      systima: 'Είσαι tutor.',
      minimata: [
        { rolos: 'xristis', keimeno: 'Ερώτηση' },
        { rolos: 'montelo', keimeno: 'Απάντηση' },
      ],
      ekdosi_prompt: 'p4',
      thermokrasia: 0.4,
    });

    const soma = lektika_tou_somatos(b.http.kliseis[0] ?? { soma_json: undefined });
    expect(soma['contents']).toEqual([
      { role: 'user', parts: [{ text: 'Ερώτηση' }] },
      { role: 'model', parts: [{ text: 'Απάντηση' }] },
    ]);
    const generationConfig = soma['generationConfig'];
    if (typeof generationConfig !== 'object' || generationConfig === null) {
      throw new Error('λείπει το generationConfig');
    }
    const config = generationConfig as Record<string, unknown>;
    expect(config['temperature']).toBe(0.4);
    expect(config['responseSchema']).toBeUndefined();
    expect(config['responseMimeType']).toBeUndefined();
  });

  it('ενώνει περισσότερα από ένα part κειμένου', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () =>
      apantisi(200, JSON.stringify({ candidates: [{ content: { parts: [{ text: 'αβ' }, { text: 'γδ' }] } }] }))
    );

    const apotelesma = await b.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'γράψε' }],
      ekdosi_prompt: 'p4',
      thermokrasia: 0.1,
    });

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toBe('αβγδ');
  });

  it('δεν στέλνει systemInstruction όταν το systima είναι κενό', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('Οκ.')));

    await b.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'γράψε' }],
      ekdosi_prompt: 'p4',
      thermokrasia: 0.1,
    });

    const soma = lektika_tou_somatos(b.http.kliseis[0] ?? { soma_json: undefined });
    expect(soma['systemInstruction']).toBeUndefined();
  });

  it('MI_EGKYRO_SXIMA όταν δεν υπάρχει candidates στην απάντηση', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, JSON.stringify({ candidates: [] })));

    const apotelesma = await b.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'γράψε' }],
      ekdosi_prompt: 'p4',
      thermokrasia: 0.1,
    });

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
  });

  it('χρησιμοποιεί το όνομα του μοντέλου από τις ρυθμίσεις', async () => {
    const b = await ftiaxe_periballon();
    expect(b.llm.montelo).toBe(MONTELO);
  });
});

describe('μυστικότητα κλειδιού', () => {
  async function trexo_ola_dokimia(apotelesma: Apotelesma<unknown>, b: Periballon): Promise<void> {
    const parapta = JSON.stringify(apotelesma);
    const ilika = JSON.stringify(b.katagrafi.alla());
    for (const minima_katagrafis of b.katagrafi.alla()) {
      expect(minima_katagrafis.minima).not.toContain(KLEIDI);
    }
    expect(parapta).not.toContain(KLEIDI);
    expect(ilika).not.toContain(KLEIDI);
    for (const aitima of b.http.kliseis) {
      expect(aitima.url).not.toContain(KLEIDI);
      expect(JSON.stringify(aitima.soma_json ?? null)).not.toContain(KLEIDI);
    }
  }

  it('δεν εμφανίζεται σε επιτυχία', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () =>
      apantisi(200, soma_apantisis(JSON.stringify({ arxeio_id: 'a', titlos: 'b', tmimata: [] })))
    );

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε 401', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(401, '{"error":{"message":"API key not valid"}}'));

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε 429 που εξαντλείται', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(429, '{}')));

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε 5xx που εξαντλείται', async () => {
    const b = await ftiaxe_periballon();
    orise_aponixia(b.http, Array.from({ length: 10 }, () => apantisi(500, '{}')));

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε άκυρο JSON', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(200, soma_apantisis('ΟΧΙ JSON')));

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε σφάλμα δικτύου', async () => {
    const b = await ftiaxe_periballon();

    await trexo_ola_dokimia(await b.llm.parage_json(aitima_json()), b);
  });

  it('δεν εμφανίζεται σε timeout', async () => {
    const b = await ftiaxe_periballon();
    let emakesi: () => void = () => undefined;
    const amakesi = new Promise<void>((resolve) => {
      emakesi = resolve;
    });
    b.http.orise_apantisi(ANTIPOCHO, () => {
      emakesi();
      return new Promise<HttpApantisi>(() => undefined);
    });
    const controller = new AbortController();

    const pending = b.llm.parage_json(aitima_json({ simatodotis: controller.signal }));
    await amakesi;
    controller.abort();

    await trexo_ola_dokimia(await pending, b);
  });

  it('τα μηνύματα σφάλματος δεν περιέχουν το κλειδί', async () => {
    const b = await ftiaxe_periballon();
    b.http.orise_apantisi(ANTIPOCHO, () => apantisi(401, '{"error":{"message":"API key not valid"}}'));

    const apotelesma = await b.llm.parage_json(aitima_json());

    expect(minima(apotelesma)).not.toContain(KLEIDI);
    expect(minima(apotelesma).length).toBeGreaterThan(0);
  });
});