import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { MnimiApothiki, apotyxia, ok } from '@dps/core';
import type {
  ApothikiPyli,
  Apotelesma,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
} from '@dps/core';
import {
  PROORISMOS_KACHE_LLM,
  analise_arxeio,
  kleidi_json,
  kleidi_keimenou,
  me_cache,
} from '../src/cache/index.js';
import type { AilakiaAitimatosJson, AilakiaAitimatosKeimenou } from '../src/cache/index.js';

const MONTELO = 'mock-flash-1';
const EKDOSI_PROMPT = 'p1@1';
const XRISTIS = 'perigramma|arx-1|1-3';

const SximaTmima = z.object({
  titlos: z.string(),
  typos: z.enum(['theoria', 'algorithmos', 'paradeigma']),
  ennoies: z.array(z.string()),
});

const SximaPerigramma = z.object({
  arxeio_id: z.string(),
  titlos: z.string(),
  tmimata: z.array(SximaTmima),
});

type Perigramma = z.infer<typeof SximaPerigramma>;

const PERIGRAMMA: Perigramma = {
  arxeio_id: 'arx-1',
  titlos: 'Δομές δεδομένων και αναζητήσεις',
  tmimata: [{ titlos: 'Λίστες και στοίβες', typos: 'theoria', ennoies: ['λίστα', 'στοίβα'] }],
};

class ArithmitikoLlm implements LlmPyli {
  readonly montelo: string;
  kliseis: string[] = [];
  apantiseisJson: Apotelesma<unknown>[] = [];
  apantiseisKeimenou: Apotelesma<string>[] = [];

  constructor(montelo: string = MONTELO) {
    this.montelo = montelo;
  }

  private epomeni<T>(antistoichi: Apotelesma<T>[], i: number): Apotelesma<T> {
    const trexon = antistoichi[Math.min(i, antistoichi.length - 1)];
    if (trexon === undefined) {
      throw new Error('το script απαντήσεων εξαντλήθηκε');
    }
    return trexon;
  }

  async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    const i = this.kliseis.length;
    this.kliseis.push(`json:${a.ekdosi_prompt}`);
    return this.epomeni(this.apantiseisJson, i) as Apotelesma<T>;
  }

  async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    const i = this.kliseis.length;
    this.kliseis.push(`keimeno:${a.ekdosi_prompt}`);
    return this.epomeni(this.apantiseisKeimenou, i);
  }
}

class ApothikiPlegmaria implements ApothikiPyli {
  private inner = new MnimiApothiki();

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    return this.inner.diavase_keimeno(diadromi);
  }

  async grapse_keimeno(): Promise<Apotelesma<void>> {
    return apotyxia('MI_EGKYRO_SXIMA', 'δεν γράφεται');
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    return this.inner.diavase_dyadiko(diadromi);
  }

  async grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    return this.inner.grapse_dyadiko(diadromi, dedomena);
  }

  async yparxei(diadromi: string): Promise<boolean> {
    return this.inner.yparxei(diadromi);
  }

  async lista(fakelos: string): Promise<Apotelesma<string[]>> {
    return this.inner.lista(fakelos);
  }

  async diagrafi(diadromi: string): Promise<Apotelesma<void>> {
    return this.inner.diagrafi(diadromi);
  }
}

function aitima_json(epitexseis: Partial<AilakiaAitimatosJson> = {}): LlmAitimaJson<Perigramma> {
  return {
    systima: epitexseis.systima ?? 'sistima-perigrammatos',
    xristis: epitexseis.xristis ?? XRISTIS,
    sxima: SximaPerigramma,
    ekdosi_prompt: epitexseis.ekdosi_prompt ?? EKDOSI_PROMPT,
    thermokrasia: 0.2,
  };
}

function aitima_keimenou(
  epitexseis: Partial<AilakiaAitimatosKeimenou> = {}
): LlmAitimaKeimenou {
  return {
    systima: epitexseis.systima ?? 'sistima-tutor',
    minimata: epitexseis.minimata ?? [{ rolos: 'xristis', keimeno: 'erotisi-tutor-1' }],
    ekdosi_prompt: epitexseis.ekdosi_prompt ?? 'p4@1',
    thermokrasia: 0.4,
  };
}

function diadromi_json(epitexseis: Partial<AilakiaAitimatosJson> = {}): string {
  return `${PROORISMOS_KACHE_LLM}/${kleidi_json(MONTELO, aitima_json(epitexseis))}.json`;
}

function diadromi_keimenou(epitexseis: Partial<AilakiaAitimatosKeimenou> = {}): string {
  return `${PROORISMOS_KACHE_LLM}/${kleidi_keimenou(MONTELO, aitima_keimenou(epitexseis))}.json`;
}

async function periexomeno(apothiki: MnimiApothiki, diadromi: string): Promise<string> {
  const gram = await apothiki.diavase_keimeno(diadromi);
  if (!gram.ok) {
    throw new Error(`λείπει το αρχείο ${diadromi}`);
  }
  return gram.timi;
}

describe('me_cache', () => {
  it('καταργεί το montelo από το τυλιγμένο LlmPyli', () => {
    const llm = me_cache(new ArithmitikoLlm(), new MnimiApothiki());
    expect(llm.montelo).toBe(MONTELO);
  });

  it('στο πρώτο κλικ χτυπά το εσωτερικό LLM και στο δεύτερο την αποθήκευση', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];
    const llm = me_cache(inner, apothiki);

    const proti = await llm.parage_json(aitima_json());
    const defteri = await llm.parage_json(aitima_json());

    expect(proti.ok).toBe(true);
    expect(defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('απέτυχε');
    expect(proti.timi).toEqual(PERIGRAMMA);
    expect(defteri.timi).toEqual(PERIGRAMMA);
    expect(inner.kliseis).toHaveLength(1);
  });

  it('αποθηκεύει την τιμή και το επιθεωρήσιμο πλαίσιο κάτω από το hash', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    await me_cache(inner, apothiki).parage_json(aitima_json());

    const arkeio = analise_arxeio(await periexomeno(apothiki, diadromi_json()));
    expect(arkeio).not.toBeNull();
    if (arkeio === null) throw new Error('απέτυχε');
    expect(arkeio.hash).toBe(kleidi_json(MONTELO, aitima_json()));
    expect(arkeio.montelo).toBe(MONTELO);
    expect(arkeio.ekdosi_prompt).toBe(EKDOSI_PROMPT);
    expect(arkeio.typos_aitimatos).toBe('json');
    expect(arkeio.imeras_athinas).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(arkeio.timi).toEqual(PERIGRAMMA);
  });

  it('χρησιμοποιεί το ίδιο αρχείο και για παραγγελία κειμένου', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisKeimenou = [ok('Πρώτη απάντηση.')];
    const llm = me_cache(inner, apothiki);

    const proti = await llm.parage_keimeno(aitima_keimenou());
    const defteri = await llm.parage_keimeno(aitima_keimenou());

    expect(proti.ok).toBe(true);
    expect(defteri.ok && defteri.timi).toBe('Πρώτη απάντηση.');
    expect(inner.kliseis).toHaveLength(1);
    const arkeio = analise_arxeio(await periexomeno(apothiki, diadromi_keimenou()));
    expect(arkeio?.typos_aitimatos).toBe('keimeno');
    expect(arkeio?.timi).toBe('Πρώτη απάντηση.');
  });

  it('διαφορετικό ekdosi_prompt δίνει διαφορετικό κλειδί και καλεί ξανά το εσωτερικό LLM', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];
    const llm = me_cache(inner, apothiki);

    await llm.parage_json(aitima_json({ ekdosi_prompt: 'p1@1' }));
    await llm.parage_json(aitima_json({ ekdosi_prompt: 'p1@2' }));

    expect(inner.kliseis).toEqual(['json:p1@1', 'json:p1@2']);
    expect(await apothiki.yparxei(diadromi_json({ ekdosi_prompt: 'p1@1' }))).toBe(true);
    expect(await apothiki.yparxei(diadromi_json({ ekdosi_prompt: 'p1@2' }))).toBe(true);
  });

  it('διαφορετικό montelo δίνει διαφορετικό κλειδί και καλεί ξανά το εσωτερικό LLM', async () => {
    const apothiki = new MnimiApothiki();
    const innerPrtos = new ArithmitikoLlm(MONTELO);
    innerPrtos.apantiseisJson = [ok(PERIGRAMMA)];
    const innerAllos = new ArithmitikoLlm('mock-flash-2');
    innerAllos.apantiseisJson = [ok(PERIGRAMMA)];

    await me_cache(innerPrtos, apothiki).parage_json(aitima_json());
    const allos = await me_cache(innerAllos, apothiki).parage_json(aitima_json());
    const allosDefteri = await me_cache(innerAllos, apothiki).parage_json(aitima_json());

    expect(allos.ok && allosDefteri.ok).toBe(true);
    expect(innerPrtos.kliseis).toHaveLength(1);
    expect(innerAllos.kliseis).toHaveLength(1);
    const diadromiAllou = `${PROORISMOS_KACHE_LLM}/${kleidi_json('mock-flash-2', aitima_json())}.json`;
    expect(diadromiAllou).not.toBe(diadromi_json());
    expect(await apothiki.yparxei(diadromi_json())).toBe(true);
    expect(await apothiki.yparxei(diadromiAllou)).toBe(true);
  });

  it('διαφορετικό xristis δίνει διαφορετικό κλειδί και καλεί ξανά το εσωτερικό LLM', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];
    const llm = me_cache(inner, apothiki);

    await llm.parage_json(aitima_json({ xristis: 'perigramma|arx-1|1-3' }));
    await llm.parage_json(aitima_json({ xristis: 'perigramma|arx-2|1-3' }));

    expect(inner.kliseis).toHaveLength(2);
  });

  it('χρησιμοποιεί το δοθέν πρόγραμμα αντί για το προεπιλεγμένο', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];
    const allo = 'PLI101/.spoudes/cache/llm';

    await me_cache(inner, apothiki, allo).parage_json(aitima_json());

    expect(await apothiki.yparxei(diadromi_json())).toBe(false);
    expect(await apothiki.yparxei(`${allo}/${kleidi_json(MONTELO, aitima_json())}.json`)).toBe(true);
  });

  it('επιστρέφει την απάντηση του μοντέλου όταν η εγγραφή στην αποθήκευση αποτυγχάνει', async () => {
    const apothiki = new ApothikiPlegmaria();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    const proti = await me_cache(inner, apothiki).parage_json(aitima_json());
    const defteri = await me_cache(inner, apothiki).parage_json(aitima_json());

    expect(proti.ok).toBe(true);
    expect(defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('απέτυχε');
    expect(proti.timi).toEqual(PERIGRAMMA);
    expect(defteri.timi).toEqual(PERIGRAMMA);
    expect(inner.kliseis).toHaveLength(2);
  });
});

describe('me_cache σε σφάλμα του εσωτερικού LLM', () => {
  it('μεταδίδει το σφάλμα χωρίς να γράψει τίποτα στην αποθήκευση', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [apotyxia('RATE_LIMIT', '429 από το Gemini')];

    const apotelesma = await me_cache(inner, apothiki).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('RATE_LIMIT');
    expect(apotelesma.sfalma.minima).toBe('429 από το Gemini');
    expect(await apothiki.yparxei(diadromi_json())).toBe(false);
  });

  it('δεν προσφέρει ποτέ παλιό ή ψεύτικο σφάλμα ως επιτυχία', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [apotyxia('TIMEOUT', 'ξεπέρασε ο χρόνος'), ok(PERIGRAMMA)];
    const llm = me_cache(inner, apothiki);

    const proti = await llm.parage_json(aitima_json());
    const defteri = await llm.parage_json(aitima_json());

    expect(proti.ok).toBe(false);
    expect(defteri.ok).toBe(true);
    if (!defteri.ok) throw new Error('απέτυχε');
    expect(defteri.timi).toEqual(PERIGRAMMA);
    expect(inner.kliseis).toHaveLength(2);
  });

  it('μεταδίδει και το σφάλμα της κλήσης κειμένου χωρίς να αποθηκεύσει', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    inner.apantiseisKeimenou = [apotyxia('AUTH_APOTYXIA', 'κακό κλειδί')];

    const apotelesma = await me_cache(inner, apothiki).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    expect(await apothiki.yparxei(diadromi_keimenou())).toBe(false);
  });
});

describe('me_cache με κατεστραμμένο αρχείο', () => {
  const XRISTIS_ΧΑΛΑΣΜΕΝΟ = 'x'.repeat(64);

  async function kachestro_arxeio(periexomenoArxeiou: string): Promise<MnimiApothiki> {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ }), periexomenoArxeiou);
    return apothiki;
  }

  function arkeio_xeirourgio(): Record<string, unknown> {
    return {
      odos_kleidiou: 'dps.llm.cache.v1',
      hash: kleidi_json(MONTELO, aitima_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ })),
      montelo: MONTELO,
      ekdosi_prompt: EKDOSI_PROMPT,
      typos_aitimatos: 'json',
      imeras_athinas: '2026-10-09',
      timi: { arxeio_id: 'arx-1' },
    };
  }

  it('αγνοεί περιεχόμενο που δεν είναι JSON και ξανακαλεί το εσωτερικό LLM', async () => {
    const apothiki = await kachestro_arxeio('δεν είναι JSON');
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    const apotelesma = await me_cache(inner, apothiki).parage_json(
      aitima_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ })
    );

    expect(apotelesma.ok).toBe(true);
    expect(inner.kliseis).toHaveLength(1);
  });

  it('αγνοεί αρχείο με λάθος hash', async () => {
    const arkeio = arkeio_xeirourgio();
    arkeio['hash'] = 'b'.repeat(64);
    const apothiki = await kachestro_arxeio(JSON.stringify(arkeio));
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    await me_cache(inner, apothiki).parage_json(aitima_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ }));

    expect(inner.kliseis).toHaveLength(1);
  });

  it('αγνοεί αρχείο που δεν περνά το σχήμα του πλαισίου', async () => {
    const apothiki = await kachestro_arxeio(JSON.stringify({ hash: 'a'.repeat(64), timi: 1 }));
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    await me_cache(inner, apothiki).parage_json(aitima_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ }));

    expect(inner.kliseis).toHaveLength(1);
  });

  it('αγνοεί τιμή JSON που δεν ταιριάζει με το ζητούμενο σχήμα', async () => {
    const apothiki = await kachestro_arxeio(JSON.stringify(arkeio_xeirourgio()));
    const inner = new ArithmitikoLlm();
    inner.apantiseisJson = [ok(PERIGRAMMA)];

    await me_cache(inner, apothiki).parage_json(aitima_json({ xristis: XRISTIS_ΧΑΛΑΣΜΕΝΟ }));

    expect(inner.kliseis).toHaveLength(1);
  });

  it('αγνοεί αρχείο που δηλώνει parage_json όταν ζητήθηκε parage_keimeno', async () => {
    const arkeio = arkeio_xeirourgio();
    arkeio['hash'] = kleidi_keimenou(MONTELO, aitima_keimenou());
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(diadromi_keimenou(), JSON.stringify(arkeio));
    const inner = new ArithmitikoLlm();
    inner.apantiseisKeimenou = [ok('Πραγματική απάντηση.')];

    const apotelesma = await me_cache(inner, apothiki).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok && apotelesma.timi).toBe('Πραγματική απάντηση.');
    expect(inner.kliseis).toHaveLength(1);
  });

  it('αγνοεί τιμή κειμένου που δεν είναι string', async () => {
    const apothiki = new MnimiApothiki();
    const arkeio = {
      odos_kleidiou: 'dps.llm.cache.v1',
      hash: kleidi_keimenou(MONTELO, aitima_keimenou()),
      montelo: MONTELO,
      ekdosi_prompt: 'p4@1',
      typos_aitimatos: 'keimeno',
      imeras_athinas: '2026-10-09',
      timi: 42,
    };
    await apothiki.grapse_keimeno(diadromi_keimenou(), JSON.stringify(arkeio));
    const inner = new ArithmitikoLlm();
    inner.apantiseisKeimenou = [ok('Πραγματική απάντηση.')];

    const apotelesma = await me_cache(inner, apothiki).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok && apotelesma.timi).toBe('Πραγματική απάντηση.');
    expect(inner.kliseis).toHaveLength(1);
  });

  it('σερβίρει έγκυρο αρχείο χωρίς να καλέσει το εσωτερικό LLM', async () => {
    const apothiki = new MnimiApothiki();
    const arkeio = {
      odos_kleidiou: 'dps.llm.cache.v1',
      hash: kleidi_keimenou(MONTELO, aitima_keimenou()),
      montelo: MONTELO,
      ekdosi_prompt: 'p4@1',
      typos_aitimatos: 'keimeno',
      imeras_athinas: '2026-10-09',
      timi: 'Από το αρχείο.',
    };
    await apothiki.grapse_keimeno(diadromi_keimenou(), JSON.stringify(arkeio));
    const inner = new ArithmitikoLlm();

    const apotelesma = await me_cache(inner, apothiki).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok && apotelesma.timi).toBe('Από το αρχείο.');
    expect(inner.kliseis).toHaveLength(0);
  });
});