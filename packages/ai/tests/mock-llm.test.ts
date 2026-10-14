import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import { ArkeioLlmSchema, kleidi_json, kleidi_keimenou, me_cache } from '../src/cache/index.js';
import {
  arkeio_prosopa,
  grapse_arxeio_prosopa,
  fortisi_me_apothiki,
  MockLlmArchiou,
} from '../src/mock/index.js';

const AKR = dirname(fileURLToPath(import.meta.url));
const FAKELOS_FIXTURES = join(AKR, '..', '..', '..', 'fixtures', 'llm');

const MONTELO = 'mock-flash-1';
const KLEIDI_JSON = '8d1e8a4a44685c5eadb36aaa006f5e538935920aa47c0124a7f4466affd04c6c';
const KLEIDI_KEIMENOU = 'de105f5080417d4c25fc16c4712e3e5573574a514e17676cd577528c955bbdbf';

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

const TITLOS_PIGI = 'Δομές δεδομένων και αναζητήσεις';
const APANISI_KEIMENOU = '👶 Η δυαδική αναζήτηση μοιάζει με το να κάνεις «μισό μισό» ψάξιμο σε μια ταξινομημένη σείρα.';

function fortisi_node(kleidi: string): Promise<string | null> {
  try {
    return Promise.resolve(readFileSync(join(FAKELOS_FIXTURES, `${kleidi}.json`), 'utf8'));
  } catch {
    return Promise.resolve(null);
  }
}

class PleresLlm implements LlmPyli {
  readonly montelo = MONTELO;
  kliseis = 0;

  async parage_json<T>(_a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    this.kliseis += 1;
    return { ok: true, timi: { arxeio_id: 'ΠΛΑΣΤΟ', titlos: 'ΠΛΑΣΤΟ', tmimata: [] } as unknown as T };
  }

  async parage_keimeno(_a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    this.kliseis += 1;
    return { ok: true, timi: 'ΠΛΑΣΤΗ ΑΠΑΝΤΗΣΗ' };
  }
}

function aitima_json(): LlmAitimaJson<z.infer<typeof SximaPerigramma>> {
  return {
    systima: 'sistima-perigrammatos',
    xristis: 'perigramma|arx-1|1-3',
    sxima: SximaPerigramma,
    ekdosi_prompt: 'p1@1',
    thermokrasia: 0.2,
  };
}

function aitima_keimenou(): LlmAitimaKeimenou {
  return {
    systima: 'sistima-tutor',
    minimata: [
      { rolos: 'xristis', keimeno: 'erotisi-tutor-1' },
      { rolos: 'montelo', keimeno: 'apantisi-tutor-1' },
    ],
    ekdosi_prompt: 'p4@1',
    thermokrasia: 0.4,
  };
}

describe('fixtures/llm', () => {
  it('ο κανονικός καταρτισμός των fixtures δίνει ακριβώς τα ονόματα των αρχείων', () => {
    expect(kleidi_json(MONTELO, aitima_json())).toBe(KLEIDI_JSON);
    expect(kleidi_keimenou(MONTELO, aitima_keimenou())).toBe(KLEIDI_KEIMENOU);
  });

  it('τα αρχεία των fixtures ικανοποιούν το ίδιο πλαίσιο με την αποθήκευση', () => {
    for (const kleidi of [KLEIDI_JSON, KLEIDI_KEIMENOU]) {
      const periexomeno = readFileSync(join(FAKELOS_FIXTURES, `${kleidi}.json`), 'utf8');
      expect(ArkeioLlmSchema.safeParse(JSON.parse(periexomeno)).success).toBe(true);
    }
  });
});

describe('MockLlmArchiou επανάληψη', () => {
  it('επαναπαίζει το fixture JSON με το χειρογραφημένο περιεχόμενο, αυτούριο', async () => {
    const mock = new MockLlmArchiou(MONTELO, fortisi_node);

    const apotelesma = await mock.parage_json(aitima_json());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.arxeio_id).toBe('arx-1');
    expect(apotelesma.timi.titlos).toBe(TITLOS_PIGI);
    expect(apotelesma.timi.tmimata).toHaveLength(3);
    expect(apotelesma.timi.tmimata[0]?.ennoies).toEqual(['λίστα', 'στοίβα', 'δυαδική δενδρική λίστα']);
    expect(apotelesma.timi.tmimata[1]?.typos).toBe('algorithmos');
    expect(apotelesma.timi.tmimata[2]?.titlos).toBe('Παράδειγμα αναζήτησης σε ταξινομημένο πίνακα');
  });

  it('επαναπαίζει το fixture κειμένου με το χειρογραφημένο περιεχόμενο, αυτούριο', async () => {
    const mock = new MockLlmArchiou(MONTELO, fortisi_node);

    const apotelesma = await mock.parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.startsWith(APANISI_KEIMENOU)).toBe(true);
    expect(apotelesma.timi).toContain('[[arx-1:12]]');
    expect(apotelesma.timi.endsWith('Αυτοελέγχος: αν το n είναι τέλειο δύναμη του 2, μετά από k βήματα μένουν n/2^k στοιχεία.')).toBe(true);
  });

  it('το ίδιο fixture σερβίρει και την αποθήκευση χωρίς να καλέσει το αληθινό LLM', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      `cache/llm/${KLEIDI_JSON}.json`,
      readFileSync(join(FAKELOS_FIXTURES, `${KLEIDI_JSON}.json`), 'utf8')
    );
    const real = new PleresLlm();

    const apotelesma = await me_cache(real, apothiki).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.titlos).toBe(TITLOS_PIGI);
    expect(real.kliseis).toBe(0);
  });

  it('διαβάζει τα fixtures μέσω ενός ApothikiPyli με το fortisi_me_apothiki', async () => {
    const apothiki = new MnimiApothiki();
    const fortisis = fortisi_me_apothiki(apothiki, 'fixtures/llm');
    for (const kleidi of [KLEIDI_JSON, KLEIDI_KEIMENOU]) {
      await apothiki.grapse_keimeno(
        `fixtures/llm/${kleidi}.json`,
        readFileSync(join(FAKELOS_FIXTURES, `${kleidi}.json`), 'utf8')
      );
    }
    const mock = new MockLlmArchiou(MONTELO, fortisis);

    expect((await mock.parage_json(aitima_json())).ok).toBe(true);
    expect((await mock.parage_keimeno(aitima_keimenou())).ok).toBe(true);
    expect(await fortisis('δεν-υπάρχει')).toBeNull();
  });
});

describe('MockLlmArchiou χωρίς fixture', () => {
  function allo(): LlmAitimaJson<z.infer<typeof SximaPerigramma>> {
    return { ...aitima_json(), xristis: 'perigramma|arx-999|1-9' };
  }

  it('δίνει ρητό σφάλμα DEN_VRETHIKE και ποτέ επινοημένη απάντηση', async () => {
    const mock = new MockLlmArchiou(MONTELO, fortisi_node);

    const apotelesma = await mock.parage_json(allo());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(apotelesma.sfalma.minima).toContain('.json');
    expect(apotelesma.sfalma.minima).toContain(kleidi_json(MONTELO, allo()));
  });

  it('δεν επιστρέφει κενή συμβολική σειρά όταν λείπει το fixture κειμένου', async () => {
    const mock = new MockLlmArchiou(MONTELO, fortisi_node);

    const apotelesma = await mock.parage_keimeno({
      ...aitima_keimenou(),
      minimata: [{ rolos: 'xristis', keimeno: 'άγνωστη-ερώτηση' }],
    });

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

it('δεν επιστρέφει την τιμή του πραγματικού LLM που κάλλισε από κάτω', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      `fixtures/llm/${kleidi_json(MONTELO, aitima_json())}.json`,
      readFileSync(join(FAKELOS_FIXTURES, `${KLEIDI_JSON}.json`), 'utf8')
    );
    const fortisis = fortisi_me_apothiki(apothiki, 'fixtures/llm');
    const mock = new MockLlmArchiou(MONTELO, fortisis);

    const apotelesma = await mock.parage_json(allo());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    const arxeia = await apothiki.lista('fixtures/llm');
    expect(arxeia.ok).toBe(true);
    if (!arxeia.ok) throw new Error('απέτυχε');
    expect(arxeia.timi).toEqual([`fixtures/llm/${KLEIDI_JSON}.json`]);
  });

  it('καταργεί το montelo από το LlmPyli', () => {
    expect(new MockLlmArchiou('mock-flash-9', fortisi_node).montelo).toBe('mock-flash-9');
  });
});

describe('MockLlmArchiou με χαλασμένο fixture', () => {
  const KENAKO = 'f'.repeat(64);

  function mock_me(periexomeno: string | null): MockLlmArchiou {
    return new MockLlmArchiou(MONTELO, async () => periexomeno);
  }

  it('καταργεί περιεχόμενο που δεν είναι JSON', async () => {
    const mock = mock_me('δεν είναι JSON');

    const apotelesma = await mock.parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('καταργεί πλαίσιο με λάθος hash', async () => {
    const periexomeno = JSON.stringify(
      arkeio_prosopa({
        montelo: MONTELO,
        kleidi: KENAKO,
        aitima: aitima_json(),
        timi: { arxeio_id: 'arx-1', titlos: 'x', tmimata: [] },
        imeras_athinas: '2026-10-09',
      })
    );
    const mock = mock_me(periexomeno);

    const apotelesma = await mock.parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain(KENAKO);
  });

  it('καταργεί fixture γραμμένο για άλλο μοντέλο', async () => {
    const periexomeno = JSON.stringify(
      arkeio_prosopa({
        montelo: 'mock-flash-2',
        kleidi: kleidi_json(MONTELO, aitima_json()),
        aitima: aitima_json(),
        timi: { arxeio_id: 'arx-1', titlos: 'x', tmimata: [] },
        imeras_athinas: '2026-10-09',
      })
    );

    const apotelesma = await mock_me(periexomeno).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('καταργεί τιμή JSON που δεν ταιριάζει με το ζητούμενο σχήμα', async () => {
    const periexomeno = JSON.stringify(
      arkeio_prosopa({
        montelo: MONTELO,
        kleidi: kleidi_json(MONTELO, aitima_json()),
        aitima: aitima_json(),
        timi: { arxeio_id: 'arx-1' },
        imeras_athinas: '2026-10-09',
      })
    );

    const apotelesma = await mock_me(periexomeno).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('καταργεί fixture JSON όταν ζητήθηκε κείμενο', async () => {
    const periexomeno = JSON.stringify({
      odos_kleidiou: 'dps.llm.cache.v1',
      hash: kleidi_keimenou(MONTELO, aitima_keimenou()),
      montelo: MONTELO,
      ekdosi_prompt: 'p4@1',
      typos_aitimatos: 'json',
      imeras_athinas: '2026-10-09',
      timi: { arxeio_id: 'arx-1', titlos: 'x', tmimata: [] },
    });

    const apotelesma = await mock_me(periexomeno).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('parage_keimeno');
  });

  it('καταργεί fixture κειμένου όταν ζητήθηκε JSON', async () => {
    const periexomeno = JSON.stringify({
      odos_kleidiou: 'dps.llm.cache.v1',
      hash: kleidi_json(MONTELO, aitima_json()),
      montelo: MONTELO,
      ekdosi_prompt: 'p1@1',
      typos_aitimatos: 'keimeno',
      imeras_athinas: '2026-10-09',
      timi: 'κείμενο',
    });

    const apotelesma = await mock_me(periexomeno).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('parage_json');
  });

  it('καταργεί τιμή κειμένου που δεν είναι string', async () => {
    const periexomeno = JSON.stringify(
      arkeio_prosopa({
        montelo: MONTELO,
        kleidi: kleidi_keimenou(MONTELO, aitima_keimenou()),
        aitima: aitima_keimenou(),
        timi: 42,
        imeras_athinas: '2026-10-09',
      })
    );

    const apotelesma = await mock_me(periexomeno).parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('εγγραφή fixture', () => {
  it('το grapse_arxeio_prosopa παράγει αρχείο που ξαναδιαβάζεται από τον ίδιο mock', async () => {
    const timi = { arxeio_id: 'arx-7', titlos: 'Μετρημένα', tmimata: [] };
    const arkeio = grapse_arxeio_prosopa({
      montelo: MONTELO,
      kleidi: kleidi_json(MONTELO, aitima_json()),
      aitima: aitima_json(),
      timi,
      imeras_athinas: '2026-10-09',
    });

    const apotelesma = await new MockLlmArchiou(MONTELO, async () => arkeio).parage_json(aitima_json());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toEqual(timi);
  });

  it('το fortisi_me_apothiki διορθώνει τη λεζάντα στο τέλος', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      `fixtures/llm/${KLEIDI_JSON}.json`,
      readFileSync(join(FAKELOS_FIXTURES, `${KLEIDI_JSON}.json`), 'utf8')
    );

    const mock = new MockLlmArchiou(MONTELO, fortisi_me_apothiki(apothiki, 'fixtures/llm/'));

    expect((await mock.parage_json(aitima_json())).ok).toBe(true);
  });

  it('καταγράφει το σωστό τύπο αιτήματος για κείμενο', () => {
    const arkeio = arkeio_prosopa({
      montelo: MONTELO,
      kleidi: kleidi_keimenou(MONTELO, aitima_keimenou()),
      aitima: aitima_keimenou(),
      timi: 'Απάντηση',
      imeras_athinas: '2026-10-09',
    });

    expect(arkeio.typos_aitimatos).toBe('keimeno');
    expect(arkeio.ekdosi_prompt).toBe('p4@1');
    expect(arkeio.odos_kleidiou).toBe('dps.llm.cache.v1');
  });
});
