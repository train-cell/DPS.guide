import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ok } from '@dps/core';
import { FakeRologi, MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import {
  PROORISMOS_METRISIS,
  analise_metrisi,
  imeras_athinas,
  me_proypologismo,
} from '../src/cache/index.js';
import type { MetrisiImeras } from '../src/cache/index.js';

const ORIO = 3;

const SximaArxeio = z.object({ arxeio_id: z.string() });

const XEIMINOS = '2026-01-15T21:30:00.000Z';
const XEIMINOS_MESANYCHTOS = '2026-01-15T22:30:00.000Z';
const THORINOS = '2026-07-15T20:30:00.000Z';
const THORINOS_MESANYCHTOS = '2026-07-15T21:30:00.000Z';

class ArithmitikoLlm implements LlmPyli {
  readonly montelo = 'mock-flash-1';
  kliseis = 0;

  async parage_json<T>(_a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    this.kliseis += 1;
    return ok({ arxeio_id: 'arx-1' } as T);
  }

  async parage_keimeno(_a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    this.kliseis += 1;
    return ok('Απάντηση μοντέλου.');
  }
}

function aitima_keimenou(): LlmAitimaKeimenou {
  return {
    systima: 'sistima-tutor',
    minimata: [{ rolos: 'xristis', keimeno: 'erotisi-tutor-1' }],
    ekdosi_prompt: 'p4@1',
    thermokrasia: 0.4,
  };
}

async function metrisi(apothiki: MnimiApothiki, proorismos = PROORISMOS_METRISIS): Promise<MetrisiImeras | null> {
  const gram = await apothiki.diavase_keimeno(proorismos);
  if (!gram.ok) {
    return null;
  }
  return analise_metrisi(gram.timi);
}

function kodikos(apotelesma: Apotelesma<unknown>): string {
  if (apotelesma.ok) {
    throw new Error('ζητήθηκε σφάλμα αλλά επέστρεψε επιτυχία');
  }
  return apotelesma.sfalma.kodikos;
}

describe('imeras_athinas', () => {
  it('χειμώνα (UTC+2): τα 23:30 UTC είναι Αθήνα 01:30 της ίδιας ημέρας', () => {
    expect(imeras_athinas(new Date(XEIMINOS))).toBe('2026-01-15');
  });

  it('χειμώνα (UTC+2): τα 22:30 UTC είναι Αθήνα 00:30 της επόμενης ημέρας', () => {
    expect(imeras_athinas(new Date(XEIMINOS_MESANYCHTOS))).toBe('2026-01-16');
  });

  it('καλοκαίρι (UTC+3): τα 20:30 UTC είναι Αθήνα 23:30 της ίδιας ημέρας', () => {
    expect(imeras_athinas(new Date(THORINOS))).toBe('2026-07-15');
  });

  it('καλοκαίρι (UTC+3): τα 21:30 UTC είναι Αθήνα 00:30 της επόμενης ημέρας', () => {
    expect(imeras_athinas(new Date(THORINOS_MESANYCHTOS))).toBe('2026-07-16');
  });

  it('δεν χρησιμοποιεί σταθερή μετατόπιση ώρες: η απόκλιση Αθήνας διαφέρει χειμώνα και καλοκαίρι', () => {
    const meriaArchai: string[] = [];
    for (let ora = 0; ora < 24; ora += 1) {
      const zores = String(ora).padStart(2, '0');
      meriaArchai.push(
        `${imeras_athinas(new Date(`2026-01-15T${zores}:30:00.000Z`))}|${imeras_athinas(new Date(`2026-07-15T${zores}:30:00.000Z`))}`
      );
    }

    expect(meriaArchai[20]).toBe('2026-01-15|2026-07-15');
    expect(meriaArchai[21]).toBe('2026-01-15|2026-07-16');
    expect(meriaArchai[22]).toBe('2026-01-16|2026-07-16');
    expect(meriaArchai[23]).toBe('2026-01-16|2026-07-16');

    const ianiaou = meriaArchai.filter((m) => m.startsWith('2026-01-15|')).length;
    const ioulioy = meriaArchai.filter((m) => m.endsWith('|2026-07-15')).length;
    expect(ianiaou).toBe(22);
    expect(ioulioy).toBe(21);
  });
});

describe('me_proypologismo', () => {
  it('καταργεί το montelo και δεν καλεί το εσωτερικό LLM πέρα από το όριο', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, new FakeRologi(new Date(XEIMINOS)), ORIO);

    for (let i = 0; i < ORIO; i += 1) {
      const apotelesma = await llm.parage_keimeno(aitima_keimenou());
      expect(apotelesma.ok).toBe(true);
    }
    const tetarta = await llm.parage_keimeno(aitima_keimenou());

    expect(llm.montelo).toBe('mock-flash-1');
    expect(kodikos(tetarta)).toBe('PROYPOLOGISMOS');
    expect(inner.kliseis).toBe(ORIO);
  });

  it('κρατά τον μετρητή σε αρχείο και τον επαναφέρει στο μηδέν τη νέα μέρα Αθήνας', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(XEIMINOS));
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, rologi, ORIO);

    for (let i = 0; i < ORIO; i += 1) {
      await llm.parage_keimeno(aitima_keimenou());
    }

    const amakromeni = await metrisi(apothiki);
    expect(amakromeni).toEqual({ imeras_athinas: '2026-01-15', kliseis: ORIO });

    rologi.theste_xrono(new Date(XEIMINOS_MESANYCHTOS));
    const metaTaMesANYxta = await llm.parage_keimeno(aitima_keimenou());

    expect(metaTaMesANYxta.ok).toBe(true);
    expect(inner.kliseis).toBe(ORIO + 1);
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-16', kliseis: 1 });
  });

  it('επαναφέρει τον μετρητή και το καλοκαίρι, όταν η Αθήνα περνά σε UTC+3', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(THORINOS));
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, rologi, ORIO);

    for (let i = 0; i < ORIO; i += 1) {
      await llm.parage_keimeno(aitima_keimenou());
    }
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-07-15', kliseis: ORIO });
    expect(kodikos(await llm.parage_keimeno(aitima_keimenou()))).toBe('PROYPOLOGISMOS');

    rologi.theste_xrono(new Date(THORINOS_MESANYCHTOS));
    const metaTaMesaNYxta = await llm.parage_keimeno(aitima_keimenou());

    expect(metaTaMesaNYxta.ok).toBe(true);
    expect(inner.kliseis).toBe(ORIO + 1);
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-07-16', kliseis: 1 });
  });

  it('δεν χρεώνει κλήση που δεν έγινε λόγω ορίου', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, new FakeRologi(new Date(XEIMINOS)), ORIO);

    for (let i = 0; i < ORIO + 5; i += 1) {
      await llm.parage_keimeno(aitima_keimenou());
    }

    expect(inner.kliseis).toBe(ORIO);
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-15', kliseis: ORIO });
  });

  it('ενσωματώνει και την παραγγελία JSON στο ίδιο ημερήσιο όριο', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, new FakeRologi(new Date(XEIMINOS)), 1);

    const proti = await llm.parage_json({
      systima: 's',
      xristis: 'u',
      sxima: SximaArxeio,
      ekdosi_prompt: 'p1@1',
      thermokrasia: 0.2,
    });
    const defteri = await llm.parage_json({
      systima: 's',
      xristis: 'u',
      sxima: SximaArxeio,
      ekdosi_prompt: 'p1@1',
      thermokrasia: 0.2,
    });

    expect(proti.ok && proti.timi.arxeio_id).toBe('arx-1');
    expect(kodikos(defteri)).toBe('PROYPOLOGISMOS');
    expect(inner.kliseis).toBe(1);
  });

  it('μετρά από την αποθήκευση όταν ξεκινά νέα διεργασία', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(XEIMINOS));
    const prtos = new ArithmitikoLlm();
    const deuteros = new ArithmitikoLlm();

    const prtiPyli = me_proypologismo(prtos, apothiki, rologi, ORIO);
    await prtiPyli.parage_keimeno(aitima_keimenou());
    const deuteriPyli = me_proypologismo(deuteros, apothiki, rologi, ORIO);
    await deuteriPyli.parage_keimeno(aitima_keimenou());

    expect(prtos.kliseis).toBe(1);
    expect(deuteros.kliseis).toBe(1);
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-15', kliseis: 2 });
  });

  it('χρησιμοποιεί το δοθέν πρόγραμμα και όχι το προεπιλεγμένο', async () => {
    const apothiki = new MnimiApothiki();
    const allo = 'PLI101/.spoudes/cache/kliseis-imeras.json';
    const llm = me_proypologismo(
      new ArithmitikoLlm(),
      apothiki,
      new FakeRologi(new Date(XEIMINOS)),
      ORIO,
      allo
    );

    await llm.parage_keimeno(aitima_keimenou());

    expect(await metrisi(apothiki, PROORISMOS_METRISIS)).toBeNull();
    expect(await metrisi(apothiki, allo)).toEqual({ imeras_athinas: '2026-01-15', kliseis: 1 });
  });

  it('ξεκινά από μηδέν όταν το αρχείο μετρήσεων είναι άχρηστο', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(XEIMINOS));
    const llm = me_proypologismo(new ArithmitikoLlm(), apothiki, rologi, ORIO);

    await apothiki.grapse_keimeno(PROORISMOS_METRISIS, 'δεν είναι JSON');
    await llm.parage_keimeno(aitima_keimenou());

    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-15', kliseis: 1 });
  });

  it('ξεκινά από μηδέν όταν το αρχείο μετρήσεων δεν περνά το σχήμα', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(XEIMINOS));
    const llm = me_proypologismo(new ArithmitikoLlm(), apothiki, rologi, ORIO);

    await apothiki.grapse_keimeno(
      PROORISMOS_METRISIS,
      JSON.stringify({ imeras_athinas: '2026-01-15', kliseis: -3 })
    );
    await llm.parage_keimeno(aitima_keimenou());

    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-15', kliseis: 1 });
  });

  it('ξεκινά από μηδέν όταν το αρχείο μετρήσεων ανήκει σε άλλη ημέρα', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new FakeRologi(new Date(XEIMINOS));
    const llm = me_proypologismo(new ArithmitikoLlm(), apothiki, rologi, ORIO);

    await apothiki.grapse_keimeno(
      PROORISMOS_METRISIS,
      JSON.stringify({ imeras_athinas: '2026-07-15', kliseis: ORIO })
    );
    const apotelesma = await llm.parage_keimeno(aitima_keimenou());

    expect(apotelesma.ok).toBe(true);
    expect(await metrisi(apothiki)).toEqual({ imeras_athinas: '2026-01-15', kliseis: 1 });
  });

  it('μπλοκάρει αμέσως με όριο μηδέν και δεν γράφει τίποτα', async () => {
    const apothiki = new MnimiApothiki();
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, new FakeRologi(new Date(XEIMINOS)), 0);

    const apotelesma = await llm.parage_keimeno(aitima_keimenou());

    expect(kodikos(apotelesma)).toBe('PROYPOLOGISMOS');
    expect(inner.kliseis).toBe(0);
    expect(await metrisi(apothiki)).toBeNull();
  });

  it('κρατά το όριο όταν η αποθήκευση δεν γράφεται, μέσα στη διεργασία', async () => {
    const apothiki = new ApothikiPlegmaria();
    const inner = new ArithmitikoLlm();
    const llm = me_proypologismo(inner, apothiki, new FakeRologi(new Date(XEIMINOS)), 2);

    const proti = await llm.parage_keimeno(aitima_keimenou());
    const defteri = await llm.parage_keimeno(aitima_keimenou());
    const triti = await llm.parage_keimeno(aitima_keimenou());

    expect(proti.ok).toBe(true);
    expect(defteri.ok).toBe(true);
    expect(kodikos(triti)).toBe('PROYPOLOGISMOS');
    expect(inner.kliseis).toBe(2);
  });
});

class ApothikiPlegmaria {
  private inner = new MnimiApothiki();

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    return this.inner.diavase_keimeno(diadromi);
  }

  async grapse_keimeno(): Promise<Apotelesma<void>> {
    return { ok: false, sfalma: { kodikos: 'MI_EGKYRO_SXIMA', minima: 'δεν γράφεται' } };
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
