import { describe, expect, it, vi, afterEach } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import * as core from '@dps/core';
import {
  allaxe_aristeia,
  fortose_proodho,
  fortose_rytheseis,
  grapse_proodho,
  grapse_rytheseis,
  katagrapse_checkin,
  katagrapse_leitner_apantisi,
  proedapes_proodhou,
  proedapes_rytheseis,
  ypologismos_seri_meletis,
} from './apothiki-ypiresies.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AI model setting migration', () => {
  it('uses the current Gemini Flash model for fresh settings', () => {
    expect(proedapes_rytheseis().onomaMontelou).toBe('gemini-3.8-flash');
    expect(proedapes_rytheseis().paroxosLlm).toBe('gemini');
  });

  it('migrates a previously saved Gemini model when settings are loaded', async () => {
    const storage = new MnimiApothiki();
    const settings = {
      ...proedapes_rytheseis(),
      onomaMontelou: 'gemini-2.5-flash',
    };
    await storage.grapse_keimeno('rythmiseis.json', JSON.stringify(settings));

    const loaded = await fortose_rytheseis(storage);

    expect(loaded.onomaMontelou).toBe('gemini-3.8-flash');
  });

  it('falls back to the default when a saved settings file has no model ID', async () => {
    const storage = new MnimiApothiki();
    await storage.grapse_keimeno('rythmiseis.json', JSON.stringify({}));

    const loaded = await fortose_rytheseis(storage);

    expect(loaded.onomaMontelou).toBe('gemini-3.8-flash');
  });

  it('infers Ollama for old model-only settings and preserves custom IDs with an explicit provider', async () => {
    const storage = new MnimiApothiki();
    await storage.grapse_keimeno('rythmiseis.json', JSON.stringify({ onomaMontelou: 'qwen3.5:9b' }));
    const inferred = await fortose_rytheseis(storage);
    expect(inferred.paroxosLlm).toBe('ollama');

    await storage.grapse_keimeno('rythmiseis.json', JSON.stringify({
      onomaMontelou: 'lab/custom-chat:latest',
      paroxosLlm: 'ollama',
    }));
    const custom = await fortose_rytheseis(storage);
    expect(custom).toMatchObject({ onomaMontelou: 'lab/custom-chat:latest', paroxosLlm: 'ollama' });
  });

  it('falls back to the default when the settings file is not JSON', async () => {
    const storage = new MnimiApothiki();
    await storage.grapse_keimeno('rythmiseis.json', 'όχι json');

    const loaded = await fortose_rytheseis(storage);

    expect(loaded.onomaMontelou).toBe('gemini-3.8-flash');
  });

  it('falls back to the default when the settings file is null', async () => {
    const storage = new MnimiApothiki();
    await storage.grapse_keimeno('rythmiseis.json', 'null');

    const loaded = await fortose_rytheseis(storage);

    expect(loaded.onomaMontelou).toBe('gemini-3.8-flash');
  });

  it('δεν φορτώνει τίποτα όταν λείπει το αρχείο ρυθμίσεων', async () => {
    const storage = new MnimiApothiki();

    const loaded = await fortose_rytheseis(storage);

    expect(loaded).toEqual(proedapes_rytheseis());
  });

  it('δεν φορτώνει τίποτα όταν το αρχείο προόδου είναι null', async () => {
    const storage = new MnimiApothiki();
    await storage.grapse_keimeno('CS101/proodhos.json', 'null');

    const proodhos = await fortose_proodho(storage, 'CS101');

    expect(proodhos).toEqual(proedapes_proodhou());
  });

  it('γράφει ρυθμίσεις', async () => {
    const storage = new MnimiApothiki();
    const rytheseis = { ...proedapes_rytheseis(), onomaMontelou: 'qwen3.5:9b' };
    const apotelesma = await grapse_rytheseis(storage, rytheseis);

    expect(apotelesma.ok).toBe(true);

    const loaded = await fortose_rytheseis(storage);
    expect(loaded.onomaMontelou).toBe('qwen3.5:9b');
  });
});

describe('katagrapse_leitner_apantisi', () => {
  it('επιστρέφει σφάλμα όταν η ημερομηνία είναι μη έγκυρη', async () => {
    const storage = new MnimiApothiki();
    const apotelesma = await katagrapse_leitner_apantisi(storage, 'CS101', 'Μεταβλητές', true, 'invalid');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('επιστρέφει σφάλμα όταν αποτυγχάνει η καταγραφή', async () => {
    const storage = new MnimiApothiki();
    vi.spyOn(core, 'arxikopoiisi_mathisis').mockReturnValue({
      ok: true,
      timi: [],
    } as unknown as core.Apotelesma<core.KatastasiMathisis[]>);

    const apotelesma = await katagrapse_leitner_apantisi(storage, 'CS101', 'Μεταβλητές', true, '2026-10-26');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('επιστρέφει σφάλμα όταν δεν γράφει η αποθήκη', async () => {
    const storage = new MnimiApothiki();
    vi.spyOn(storage, 'grapse_keimeno').mockResolvedValue(
      core.apotyxia<void>('DEN_VRETHIKE', 'Δεν γράφτηκε.')
    );

    const apotelesma = await katagrapse_leitner_apantisi(storage, 'CS101', 'Μεταβλητές', true, '2026-10-26');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('αρχικοποιεί νέα έννοια και καταγράφει σωστή απάντηση στο κουτί 2', async () => {
    const storage = new MnimiApothiki();
    const apotelesma = await katagrapse_leitner_apantisi(
      storage,
      'CS101',
      'Μεταβλητές',
      true,
      '2026-10-26'
    );
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toHaveLength(1);
      expect(apotelesma.timi[0]?.ennoia).toBe('Μεταβλητές');
      expect(apotelesma.timi[0]?.kouti).toBe(2);
      expect(apotelesma.timi[0]?.sosta_seiri).toBe(1);
    }

    const proodhos = await fortose_proodho(storage, 'CS101');
    expect(proodhos.katastasiMathisis).toBeDefined();
    expect(proodhos.katastasiMathisis?.[0]?.kouti).toBe(2);
  });

  it('επαναφέρει την έννοια στο κουτί 1 μετά από λανθασμένη απάντηση', async () => {
    const storage = new MnimiApothiki();
    await katagrapse_leitner_apantisi(storage, 'CS101', 'Μεταβλητές', true, '2026-10-26');
    const apotelesma2 = await katagrapse_leitner_apantisi(
      storage,
      'CS101',
      'Μεταβλητές',
      false,
      '2026-10-26'
    );
    expect(apotelesma2.ok).toBe(true);
    if (apotelesma2.ok) {
      expect(apotelesma2.timi[0]?.kouti).toBe(1);
      expect(apotelesma2.timi[0]?.sosta_seiri).toBe(0);
    }
  });
});

describe('katagrapse_checkin', () => {
  it('αποθηκεύει checkin στο proodhos.json χωρίς να αλλάξει aristeiesEnotiton όταν oloklirothike === false', async () => {
    const storage = new MnimiApothiki();
    const proodhos = await katagrapse_checkin(
      storage,
      'CS101',
      'en-1',
      45,
      false,
      '2026-10-26'
    );
    expect(proodhos.checkins).toBeDefined();
    expect(proodhos.checkins).toHaveLength(1);
    expect(proodhos.checkins?.[0]).toEqual({
      enotita_id: 'en-1',
      imerominia: '2026-10-26',
      pragmatika_lepta: 45,
      oloklirothike: false,
    });
    expect(proodhos.aristeiesEnotiton).not.toContain('en-1');

    const apothikevmeno = await fortose_proodho(storage, 'CS101');
    expect(apothikevmeno.checkins).toHaveLength(1);
  });

  it('ενημερώνει το aristeiesEnotiton όταν oloklirothike === true', async () => {
    const storage = new MnimiApothiki();
    const proodhos = await katagrapse_checkin(
      storage,
      'CS101',
      'en-2',
      60,
      true,
      '2026-10-26'
    );
    expect(proodhos.checkins).toHaveLength(1);
    expect(proodhos.aristeiesEnotiton).toContain('en-2');
  });

  it('διατηρεί προηγούμενα checkins και καταστάσεις μάθησης', async () => {
    const storage = new MnimiApothiki();
    await katagrapse_leitner_apantisi(storage, 'CS101', 'Έννοια Α', true, '2026-10-25');
    await katagrapse_checkin(storage, 'CS101', 'en-1', 30, false, '2026-10-25');
    const proodhos2 = await katagrapse_checkin(storage, 'CS101', 'en-2', 45, true, '2026-10-26');

    expect(proodhos2.checkins).toHaveLength(2);
    expect(proodhos2.katastasiMathisis).toBeDefined();
    expect(proodhos2.katastasiMathisis?.[0]?.ennoia).toBe('Έννοια Α');
    expect(proodhos2.aristeiesEnotiton).toContain('en-2');
  });
});

describe('ypologismos_seri_meletis', () => {
  it('επιστρέφει 0 για κενή λίστα checkins ή μη έγκυρη ημερομηνία', () => {
    expect(ypologismos_seri_meletis([], '2026-10-26')).toBe(0);
    expect(ypologismos_seri_meletis([{ enotita_id: 'en-1', imerominia: '2026-10-26', pragmatika_lepta: 30, oloklirothike: true }], 'invalid')).toBe(0);
  });

  it('επιστρέφει 1 όταν υπάρχει checkin μόνο σήμερα', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-26', pragmatika_lepta: 30, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(1);
  });

  it('επιστρέφει 1 όταν υπάρχει checkin μόνο χθες και σήμερα δεν έχει γίνει ακόμη', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-25', pragmatika_lepta: 30, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(1);
  });

  it('υπολογίζει σωστά συνεχόμενο σερί 3 ημερών με checkin σήμερα', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-24', pragmatika_lepta: 30, oloklirothike: true },
      { enotita_id: 'en-2', imerominia: '2026-10-25', pragmatika_lepta: 45, oloklirothike: false },
      { enotita_id: 'en-3', imerominia: '2026-10-26', pragmatika_lepta: 60, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(3);
  });

  it('υπολογίζει σωστά σερί που σταματάει χθες (συνεχόμενο 2 ημερών, αναμονή για σήμερα)', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-23', pragmatika_lepta: 30, oloklirothike: true },
      { enotita_id: 'en-2', imerominia: '2026-10-24', pragmatika_lepta: 45, oloklirothike: false },
      { enotita_id: 'en-3', imerominia: '2026-10-25', pragmatika_lepta: 60, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(3);
  });

  it('επιστρέφει 0 αν το τελευταίο checkin ήταν προχθές (σπασμένο σερί)', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-24', pragmatika_lepta: 30, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(0);
  });

  it('χειρίζεται πολλαπλά checkins την ίδια ημέρα ως 1 ημέρα σερί', () => {
    const checkins = [
      { enotita_id: 'en-1', imerominia: '2026-10-25', pragmatika_lepta: 20, oloklirothike: false },
      { enotita_id: 'en-2', imerominia: '2026-10-25', pragmatika_lepta: 30, oloklirothike: true },
      { enotita_id: 'en-3', imerominia: '2026-10-26', pragmatika_lepta: 15, oloklirothike: false },
      { enotita_id: 'en-4', imerominia: '2026-10-26', pragmatika_lepta: 45, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(2);
  });

  it('αγνοεί checkins χωρίς ημερομηνία', () => {
    const checkins = [
      { enotita_id: 'en-1', pragmatika_lepta: 30, oloklirothike: true },
    ];
    expect(ypologismos_seri_meletis(checkins, '2026-10-26')).toBe(0);
  });
});

describe('allaxe_aristeia', () => {
  it('προσθέτει ενότητα όταν λείπει', async () => {
    const storage = new MnimiApothiki();
    const proodhos = await allaxe_aristeia(storage, 'CS101', 'en-1', true);

    expect(proodhos.aristeiesEnotiton).toEqual(['en-1']);
  });

  it('προσθέτει και αφαιρεί με σειρά', async () => {
    const storage = new MnimiApothiki();
    const afterAdd = await allaxe_aristeia(storage, 'CS101', 'en-1', true);
    expect(afterAdd.aristeiesEnotiton).toEqual(['en-1']);

    const afterRemove = await allaxe_aristeia(storage, 'CS101', 'en-1', false);
    expect(afterRemove.aristeiesEnotiton).toEqual([]);
  });

  it('διατηρεί τις άλλες ενότητες όταν αφαιρεί', async () => {
    const storage = new MnimiApothiki();
    await grapse_proodho(storage, 'CS101', { aristeiesEnotiton: ['en-1', 'en-2'] });

    const proodhos = await allaxe_aristeia(storage, 'CS101', 'en-1', false);

    expect(proodhos.aristeiesEnotiton).toEqual(['en-2']);
  });

  it('δεν αλλάζει τίποτα όταν η ενότητα υπάρχει και δεν ζητείται αφαίρεση', async () => {
    const storage = new MnimiApothiki();
    await grapse_proodho(storage, 'CS101', { aristeiesEnotiton: ['en-1'] });

    const proodhos = await allaxe_aristeia(storage, 'CS101', 'en-1', true);

    expect(proodhos.aristeiesEnotiton).toEqual(['en-1']);
  });
});
