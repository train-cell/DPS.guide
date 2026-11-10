import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apotyxia, ok } from '@dps/core';
import type {
  Apotelesma,
  HttpAitima,
  HttpApantisi,
  HttpPyli,
  KatagrafiPyli,
  KodikosSfalmatos,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
} from '@dps/core';
import { ftiaxe_ollama_llm } from '../src/ollama/ollama.js';

const MONTELO = 'llama-3.2';
const BASE_URL = 'http://localhost:11434';

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

class Pylesi implements HttpPyli {
  kliseis: HttpAitima[] = [];
  apantiseis: (HttpApantisi | null)[] = [];
  index = 0;
  apotyxia = false;

  async aitima(a: HttpAitima): Promise<Apotelesma<HttpApantisi>> {
    this.kliseis.push(a);
    if (this.apotyxia) {
      return apotyxia('DEN_VRETHIKE', 'δεν υπάρχει απάντηση');
    }
    const apantisi = this.apantiseis[this.index];
    this.index += 1;
    if (apantisi === undefined) {
      return apotyxia('DEN_VRETHIKE', 'δεν υπάρχει απάντηση');
    }
    return ok(apantisi);
  }
}

function apantisi(katastasi: number, keimeno: string): HttpApantisi {
  return { katastasi, kefalides: {}, teliko_url: BASE_URL + '/api/chat', keimeno };
}

function aitima(a: Partial<LlmAitimaKeimenou> = {}): LlmAitimaKeimenou {
  return {
    systima: a.systima ?? 'Είσαι βοηθός.',
    minimata: [{ rolos: 'xristis', keimeno: 'Περιέγραψε.' }],
    thermokrasia: a.thermokrasia ?? 0.7,
    ...a,
  } as LlmAitimaKeimenou;
}

function kodikos(apotelesma: Apotelesma<unknown>): KodikosSfalmatos {
  if (apotelesma.ok) {
    throw new Error('aytithethike epityxia alla zitithike sfalma');
  }
  return apotelesma.sfalma.kodikos;
}

describe('ftiaxe_ollama_llm — endpoint', () => {
  it('δέχεται το τοπικό URL', () => {
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(new Pylesi(), MONTELO, BASE_URL, katagrafi);
    expect(llm.montelo).toBe(MONTELO);
  });

  it('δεν δέχεται απομακρυσμένο URL', () => {
    expect(() =>
      ftiaxe_ollama_llm(new Pylesi(), MONTELO, 'https://example.org:11434', new MnimiKatagrafi())
    ).toThrow('Το Ollama επιτρέπεται μόνο στην ίδια συσκευή (localhost).');
  });

  it('δεν δέχεται https protocol', () => {
    expect(() =>
      ftiaxe_ollama_llm(new Pylesi(), MONTELO, 'https://localhost:11434', new MnimiKatagrafi())
    ).toThrow('Το Ollama επιτρέπεται μόνο στην ίδια συσκευή (localhost).');
  });

  it('δεν δέχεται μη έγκυρο URL', () => {
    expect(() =>
      ftiaxe_ollama_llm(new Pylesi(), MONTELO, 'όχι url', new MnimiKatagrafi())
    ).toThrow('Το Ollama επιτρέπεται μόνο στην ίδια συσκευή (localhost).');
  });
});

describe('parage_keimeno', () => {
  it('στέλνει το κείμενο του μοντέλου', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'Απάντηση.' } })));
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toBe('Απάντηση.');
    expect(pylesi.kliseis).toHaveLength(1);
    expect(pylesi.kliseis[0]?.soma_json).toEqual({
      model: MONTELO,
      stream: false,
      messages: [
        { role: 'system', content: 'Είσαι βοηθός.' },
        { role: 'user', content: 'Περιέγραψε.' },
      ],
      options: { temperature: 0.7 },
    });
  });

  it('δεν στέλνει μήνυμα συστήματος όταν το systima είναι κενό', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'Απάντηση.' } })));
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    await llm.parage_keimeno(aitima({ systima: '' }));

    expect(pylesi.kliseis[0]?.soma_json?.messages).toEqual([{ role: 'user', content: 'Περιέγραψε.' }]);
  });

  it('κάνει το μοντέλο assistant στα μηνύματα του μοντέλου', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'Απάντηση.' } })));
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    await llm.parage_keimeno(
      aitima({ systima: '', minimata: [{ rolos: 'montelo', keimeno: 'Προηγούμενο.' }] })
    );

    expect(pylesi.kliseis[0]?.soma_json?.messages).toEqual([{ role: 'assistant', content: 'Προηγούμενο.' }]);
  });

  it('περνάει το simatodotis όταν υπάρχει', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'Απάντηση.' } })));
    const controller = new AbortController();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    await llm.parage_keimeno(aitima({ simatodotis: controller.signal }));

    expect(pylesi.kliseis[0]?.simatodotis).toBe(controller.signal);
  });

  it('δεν στέλνει simatodotis όταν δεν υπάρχει', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'Απάντηση.' } })));
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    await llm.parage_keimeno(aitima());

    expect(pylesi.kliseis[0]?.simatodotis).toBeUndefined();
  });

  it('επιστρέφει το σφάλμα του HttpPyli όταν δεν είναι επιτυχές', async () => {
    const pylesi = new Pylesi();
    pylesi.apotyxia = true;
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('DEN_VRETHIKE');
    expect(pylesi.kliseis).toHaveLength(1);
  });

  it('αποτυγχάνει όταν το HTTP είναι εκτός 2xx', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(404, '{}'));
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('DEN_VRETHIKE');
    expect(katagrafi.proeidopoiiseis).toHaveLength(1);
  });

  it('αποτυγχάνει όταν το HTTP είναι 500', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(500, '{}'));
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('DIKTYO');
  });

  it('αποτυγχάνει όταν το κείμενο δεν είναι JSON', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, 'ΟΧΙ JSON'));
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(katagrafi.sfalmata).toHaveLength(1);
  });

  it('αποτυγχάνει όταν λείπει το message', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ error: 'no model' })));
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(katagrafi.sfalmata).toHaveLength(1);
  });

  it('αποτυγχάνει όταν το content δεν είναι string', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 42 } })));
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(katagrafi.sfalmata).toHaveLength(1);
  });

  it('αποτυγχάνει όταν λείπει το κείμενο της απάντησης', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push({ katastasi: 200, kefalides: {}, teliko_url: BASE_URL + '/api/chat' });
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_keimeno(aitima());

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(katagrafi.sfalmata).toHaveLength(1);
  });
});

describe('parage_json', () => {
  it('επιστρέφει την τιμή όταν ταιριάζει με το σχήμα', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(
      apantisi(200, JSON.stringify({ message: { content: JSON.stringify({ arxeio_id: 'a', titlos: 'b' }) } }))
    );
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    const apotelesma = await llm.parage_json(
      {
        systima: 'Είσαι βοηθός.',
        xristis: 'Περιέγραψε.',
        sxima: z.object({ arxeio_id: z.string(), titlos: z.string() }),
        thermokrasia: 0.7,
      } as unknown as LlmAitimaJson<unknown>
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toEqual({ arxeio_id: 'a', titlos: 'b' });
    expect(pylesi.kliseis[0]?.soma_json?.format).toBe('json');
  });

  it('αποτυγχάνει όταν το JSON δεν ταιριάζει με το σχήμα', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(
      apantisi(200, JSON.stringify({ message: { content: JSON.stringify({ arxeio_id: 1, titlos: 'b' }) } }))
    );
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_json(
      {
        systima: 'Είσαι βοηθός.',
        xristis: 'Περιέγραψε.',
        sxima: z.object({ arxeio_id: z.string(), titlos: z.string() }),
        thermokrasia: 0.7,
      } as unknown as LlmAitimaJson<unknown>
    );

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
    expect(katagrafi.sfalmata).toHaveLength(1);
  });

  it('επιστρέφει το σφάλμα του complete όταν δεν είναι επιτυχές', async () => {
    const pylesi = new Pylesi();
    pylesi.apotyxia = true;
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, new MnimiKatagrafi());

    const apotelesma = await llm.parage_json(
      {
        systima: 'Είσαι βοηθός.',
        xristis: 'Περιέγραψε.',
        sxima: z.object({ arxeio_id: z.string(), titlos: z.string() }),
        thermokrasia: 0.7,
      } as unknown as LlmAitimaJson<unknown>
    );

    expect(kodikos(apotelesma)).toBe('DEN_VRETHIKE');
    expect(pylesi.kliseis).toHaveLength(1);
  });

  it('αποτυγχάνει όταν δεν επέστρεψε JSON', async () => {
    const pylesi = new Pylesi();
    pylesi.apantiseis.push(apantisi(200, JSON.stringify({ message: { content: 'ΟΧΙ JSON' } })));
    const katagrafi = new MnimiKatagrafi();
    const llm = ftiaxe_ollama_llm(pylesi, MONTELO, BASE_URL, katagrafi);

    const apotelesma = await llm.parage_json(
      {
        systima: 'Είσαι βοηθός.',
        xristis: 'Περιέγραψε.',
        sxima: z.object({ arxeio_id: z.string(), titlos: z.string() }),
        thermokrasia: 0.7,
      } as unknown as LlmAitimaJson<unknown>
    );

    expect(kodikos(apotelesma)).toBe('MI_EGKYRO_SXIMA');
  });
});
