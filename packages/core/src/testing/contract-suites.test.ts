import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ok, apotyxia } from '../helpers.js';
import { apothiki_contract, mystika_contract, sfalma, tora } from './contract-suites.js';
import { FakeHttp } from './fake-http.js';
import { FakeMystika } from './fake-mystika.js';
import { FakeRologi } from './fake-rologi.js';
import { MockLlm } from './mock-llm.js';
import { MnimiApothiki } from './mnimi-apothiki.js';

describe('apothiki_contract', () => {
  it('holds for MnimiApothiki', async () => {
    await apothiki_contract(new MnimiApothiki());
  });
});

describe('mystika_contract', () => {
  it('holds for FakeMystika', async () => {
    await mystika_contract(new FakeMystika() as unknown as Parameters<typeof mystika_contract>[0]);
  });
});

describe('FakeHttp', () => {
  it('returns the scripted response and records the request', async () => {
    const http = new FakeHttp();
    http.orise_apantisi('/api/test', () => ({
      katastasi: 200,
      kefalides: { 'content-type': 'application/json' },
      teliko_url: 'https://example.com/api/test',
      keimeno: '{"status":"ok"}',
    }));

    const res = await http.aitima({
      methodos: 'GET',
      url: 'https://example.com/api/test',
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 5000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.katastasi).toBe(200);
      expect(res.timi.keimeno).toBe('{"status":"ok"}');
    }
    expect(http.kliseis).toHaveLength(1);
    expect(http.kliseis[0]?.methodos).toBe('GET');
  });

  it('matches a handler by substring of the URL', async () => {
    const http = new FakeHttp();
    http.orise_apantisi('login_form.php', () => ({
      katastasi: 200,
      kefalides: {},
      teliko_url: 'https://thales/main/login_form.php',
    }));

    const res = await http.aitima({
      methodos: 'POST',
      url: 'https://thales/main/login_form.php?next=1',
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: 1000,
      typos_apantisis: 'keimeno',
    });
    expect(res.ok).toBe(true);
  });

  it('maps a throwing handler to a DIKTYO error with the cause', async () => {
    const http = new FakeHttp();
    http.orise_apantisi('/spaei', () => {
      throw new Error('σφάλμα χειριστή');
    });

    const res = await http.aitima({
      methodos: 'GET',
      url: 'https://example.com/spaei',
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 1000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DIKTYO');
      expect(res.sfalma.aitia).toBeInstanceOf(Error);
    }
  });

  it('fails with DEN_VRETHIKE when no handler matches', async () => {
    const http = new FakeHttp();
    const res = await http.aitima({
      methodos: 'GET',
      url: 'https://example.com/agnosto',
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 1000,
      typos_apantisis: 'keimeno',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });
});

describe('FakeRologi', () => {
  it('starts at the injected instant and never leaks its internal Date', () => {
    const arxiko = new Date('2026-10-12T08:00:00.000Z');
    const rologi = new FakeRologi(arxiko);
    expect(rologi.tora().toISOString()).toBe('2026-10-12T08:00:00.000Z');

    arxiko.setUTCFullYear(1999);
    expect(rologi.tora().toISOString()).toBe('2026-10-12T08:00:00.000Z');
  });

  it('advances by milliseconds', () => {
    const rologi = new FakeRologi(new Date('2026-10-12T08:00:00.000Z'));
    rologi.proxora_ms(3_600_000);
    expect(rologi.tora().toISOString()).toBe('2026-10-12T09:00:00.000Z');
  });

  it('sets an absolute instant', () => {
    const rologi = new FakeRologi();
    rologi.theste_xrono(new Date('2026-11-01T00:00:00.000Z'));
    expect(rologi.tora().toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });
});

describe('MockLlm', () => {
  const sxima = z.object({ titlos: z.string() });

  it('exposes the model name', () => {
    expect(new MockLlm('montelo-x').montelo).toBe('montelo-x');
    expect(new MockLlm().montelo).toBe('mock-gemini-2.5-flash');
  });

  it('replays a scripted JSON answer after validating it', async () => {
    const llm = new MockLlm();
    llm.orise_json('k', { titlos: 'Βαλμένο' });
    const res = await llm.parage_json({
      systima: 'σύστημα',
      xristis: 'k',
      sxima,
      ekdosi_prompt: 'v1',
      thermokrasia: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.titlos).toBe('Βαλμένο');
    }
  });

  it('rejects a scripted answer that fails the schema', async () => {
    const llm = new MockLlm();
    llm.orise_json('k', { lathos: 1 });
    const res = await llm.parage_json({
      systima: 'σύστημα',
      xristis: 'k',
      sxima,
      ekdosi_prompt: 'v1',
      thermokrasia: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('never invents an answer when nothing is scripted', async () => {
    const res = await new MockLlm().parage_json({
      systima: 'σύστημα',
      xristis: 'άγνωστο',
      sxima,
      ekdosi_prompt: 'v1',
      thermokrasia: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('replays a scripted text answer', async () => {
    const llm = new MockLlm();
    llm.orise_keimeno('ερώτηση', 'απάντηση');
    const res = await llm.parage_keimeno({
      systima: 'σύστημα',
      minimata: [
        { rolos: 'xristis', keimeno: 'πρώτο' },
        { rolos: 'xristis', keimeno: 'ερώτηση' },
      ],
      ekdosi_prompt: 'v1',
      thermokrasia: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('απάντηση');
    }
  });

  it('falls back to the prompt version for unscripted text', async () => {
    const res = await new MockLlm().parage_keimeno({
      systima: 'σύστημα',
      minimata: [],
      ekdosi_prompt: 'v7',
      thermokrasia: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('Mocked response for prompt vv7');
    }
  });
});

describe('βοηθοί checks', () => {
  it('tora returns the value on success', () => {
    expect(tora(ok(7))).toBe(7);
  });

  it('tora throws with the failure code on error', () => {
    expect(() => tora(apotyxia('DIKTYO', 'δεν υπάρχει'))).toThrow(/DIKTYO/);
  });

  it('sfalma passes when the code matches', () => {
    expect(() => sfalma(apotyxia('DEN_VRETHIKE', 'x'), 'DEN_VRETHIKE')).not.toThrow();
  });

  it('sfalma reports a successful result as a contract breach', () => {
    expect(() => sfalma(ok(1), 'DEN_VRETHIKE')).toThrow();
  });
});

describe('helpers', () => {
  it('wraps values and failures', () => {
    expect(ok(1)).toEqual({ ok: true, timi: 1 });
    expect(apotyxia('DIKTYO', 'μύνημα')).toEqual({ ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'μύνημα' } });
  });
});
