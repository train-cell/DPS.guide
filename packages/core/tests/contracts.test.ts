import { describe, it, expect } from 'vitest';
import {
  ok,
  apotyxia,
  MathimaSchema,
  EnotitaSchema,
  FakeRologi,
  MnimiApothiki,
  FakeMystika,
  FakeHttp,
  MockLlm,
  ZONE_ORAS,
} from '../src/index.js';

describe('Contracts & Core Smoke Tests', () => {
  it('ok() and apotyxia() produce correct Apotelesma', () => {
    const epityxia = ok(42);
    expect(epityxia.ok).toBe(true);
    if (epityxia.ok) {
      expect(epityxia.timi).toBe(42);
    }

    const sfalma = apotyxia('DIKTYO', 'Αποτυχία δικτύου');
    expect(sfalma.ok).toBe(false);
    if (!sfalma.ok) {
      expect(sfalma.sfalma.kodikos).toBe('DIKTYO');
      expect(sfalma.sfalma.minima).toBe('Αποτυχία δικτύου');
    }
  });

  it('validates Mathima with zod schema', () => {
    const data = {
      kodikos: 'PLI101',
      titlos: 'Εισαγωγή στην Επιστήμη Υπολογιστών',
      url: 'https://thales.cs.unipi.gr/courses/PLI101/',
      epilegmeno: true,
    };
    const parsed = MathimaSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it('validates Enotita with zod schema', () => {
    const data = {
      id: 'enotita-1',
      titlos: 'Άλγεβρα Boole',
      piges: [{ arxeio_id: 'arx-1', apo: 1, eos: 10 }],
      ennoies: ['Πύλες', 'Πίνακες Αληθείας'],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 45,
      apodosi_exetasis: 2.5,
    };
    const parsed = EnotitaSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it('exercises FakeRologi', () => {
    const rologi = new FakeRologi(new Date('2026-10-09T10:00:00.000Z'));
    expect(rologi.tora().toISOString()).toBe('2026-10-09T10:00:00.000Z');
    rologi.proxora_ms(5000);
    expect(rologi.tora().toISOString()).toBe('2026-10-09T10:00:05.000Z');
  });

  it('exercises MnimiApothiki', async () => {
    const storage = new MnimiApothiki();
    const resWrite = await storage.grapse_keimeno('test.txt', 'γειά σου κόσμε');
    expect(resWrite.ok).toBe(true);
    const resRead = await storage.diavase_keimeno('test.txt');
    expect(resRead.ok).toBe(true);
    if (resRead.ok) {
      expect(resRead.timi).toBe('γειά σου κόσμε');
    }
  });

  it('exercises FakeMystika', async () => {
    const mystika = new FakeMystika();
    await mystika.vale('llm_api_key', 'test-key');
    const key = await mystika.pare('llm_api_key');
    expect(key).toBe('test-key');
  });

  it('exercises FakeHttp', async () => {
    const http = new FakeHttp();
    http.orise_apantisi('/api/test', async () => ({
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
  });

  it('exercises MockLlm', async () => {
    const llm = new MockLlm('mock-test-model');
    expect(llm.montelo).toBe('mock-test-model');
    llm.orise_keimeno('Geia', 'Geia sou');
    const res = await llm.parage_keimeno({
      systima: 'test',
      minimata: [{ rolos: 'xristis', keimeno: 'Geia' }],
      ekdosi_prompt: 'p1',
      thermokrasia: 0.5,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi).toBe('Geia sou');
    }
  });

  it('verifies default timezone constant', () => {
    expect(ZONE_ORAS).toBe('Europe/Athens');
  });
});
