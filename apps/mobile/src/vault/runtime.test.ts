import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import type { ApothikiPyli, LlmPyli, MystikaPyli } from '@dps/core';
import { ok } from '@dps/core';

const ai = vi.hoisted(() => ({
  ftiaxeGemini: vi.fn(),
  ftiaxeOllama: vi.fn(),
}));

vi.mock('@dps/ai', () => ({
  ftiaxe_gemini_llm: ai.ftiaxeGemini,
  ftiaxe_ollama_llm: ai.ftiaxeOllama,
}));

import { createProductionPeriballon, createDeviceStorage, type DeviceStorage } from './runtime.js';
import { PROEPILOGI_GEMINI_MONTELO } from '../ypiresies/ai-models.js';
import type { VaultSession } from './vault.js';

const customModel = 'lab/custom-chat:latest';
const responseLlm: LlmPyli = {
  montelo: customModel,
  parage_json: async () => ok({} as never),
  parage_keimeno: async () => ok('READY'),
};

function createRuntimeWith(
  diavase_keimeno: (path: string) => Promise<unknown>,
  native: boolean,
) {
  const apothiki = {
    diavase_keimeno,
  } as unknown as ApothikiPyli;
  const mystika: MystikaPyli = {
    pare: async () => null,
    vale: async () => undefined,
    svise: async () => undefined,
  };
  const device: DeviceStorage = { apothiki, mystika, native };
  const session = {
    storage: apothiki,
    dataKey: {} as CryptoKey,
  } as unknown as VaultSession;
  return createProductionPeriballon(device, session);
}

function createRuntime(native: boolean, settings: Record<string, unknown>) {
  return createRuntimeWith(
    async () => ok(JSON.stringify(settings)),
    native,
  );
}

describe('createProductionPeriballon AI provider dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { hostname: 'localhost' });
    ai.ftiaxeOllama.mockReturnValue(responseLlm);
    ai.ftiaxeGemini.mockReturnValue(responseLlm);
  });

  it('συνθέτει device storage χωρίς native πλατφόρμα', () => {
    const device = createDeviceStorage();
    expect(device.native).toBe(false);
    expect(device.apothiki).toBeDefined();
    expect(device.mystika).toBeDefined();
  });

  it('συνθέτει device storage με native πλατφόρμα', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const device = createDeviceStorage();
    expect(device.native).toBe(true);
    expect(device.apothiki).toBeDefined();
    expect(device.mystika).toBeDefined();
  });

  it('dispatches an explicitly selected custom Ollama model on localhost', async () => {
    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
      urlOllama: 'http://localhost:11434',
    });

    await expect(periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@1',
      thermokrasia: 0,
    })).resolves.toEqual(ok('READY'));

    expect(periballon.llm.montelo).toBe(customModel);

    expect(ai.ftiaxeOllama).toHaveBeenCalledOnce();
    expect(ai.ftiaxeOllama.mock.calls[0]?.[1]).toBe(customModel);
    expect(ai.ftiaxeOllama.mock.calls[0]?.[2]).toBe('http://localhost:11434');
    expect(ai.ftiaxeGemini).not.toHaveBeenCalled();
  });

  it('rejects Ollama on native devices without loading its adapter', async () => {
    const periballon = createRuntime(true, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
    });

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@1',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('μόνο σε Windows/macOS');
    }
    expect(ai.ftiaxeOllama).not.toHaveBeenCalled();
    expect(ai.ftiaxeGemini).not.toHaveBeenCalled();
  });

  it('επιστρέφει Gemini όταν επιλέγεται ρητά ο παρόχος του', async () => {
    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'gemini',
    });

    await expect(periballon.llm.parage_json({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@2',
      thermokrasia: 0,
    })).resolves.toEqual(ok({} as never));

    expect(ai.ftiaxeGemini).toHaveBeenCalledOnce();
    expect(ai.ftiaxeOllama).not.toHaveBeenCalled();
  });

  it('απορρίπτει το Ollama εκτός localhost χωρίς να φορτώνει τον adapter', async () => {
    vi.stubGlobal('location', { hostname: 'example.com' });

    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
    });

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@3',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('από κινητό');
    }
    expect(ai.ftiaxeOllama).not.toHaveBeenCalled();
    expect(ai.ftiaxeGemini).not.toHaveBeenCalled();
  });

  it('δεν έχει location οπότε δεν είναι loopback', async () => {
    vi.unstubAllGlobals();

    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
    });

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@4',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('από κινητό');
    }
  });

  it('απορρίπτει ορισμένα μοντέλα με parage_json σε native συσκευή', async () => {
    const periballon = createRuntime(true, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
    });

    const result = await periballon.llm.parage_json({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@5',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('μόνο σε Windows/macOS');
    }
    expect(ai.ftiaxeOllama).not.toHaveBeenCalled();
    expect(ai.ftiaxeGemini).not.toHaveBeenCalled();
  });

  it('δέχεται και ρίπτει Error ο Ollama adapter', async () => {
    ai.ftiaxeOllama.mockImplementation(() => {
      throw new Error('δεν συνδέεται');
    });

    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
      urlOllama: 'http://localhost:11434',
    });

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@6',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('δεν συνδέεται');
    }
  });

  it('δέχεται και σφάλμα συμβολοσειράς ο Ollama adapter', async () => {
    ai.ftiaxeOllama.mockImplementation(() => {
      throw 'δεν συνδέεται';
    });

    const periballon = createRuntime(false, {
      onomaMontelou: customModel,
      paroxosLlm: 'ollama',
      urlOllama: 'http://localhost:11434',
    });

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@7',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.sfalma.minima).toContain('δεν είναι έγκυρη');
    }
  });

  it('αγνοεί τη ρύθμιση όταν δεν βρεθεί το αρχείο ρυθμίσεων', async () => {
    const periballon = createRuntimeWith(
      async () => ({ ok: false, sfalma: { kodikos: 'DEN_VRETHIKE', minima: 'δεν βρέθηκε' } } as never),
      false,
    );

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@8',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.timi).toBe('READY');
    expect(ai.ftiaxeGemini).toHaveBeenCalledOnce();
    expect(periballon.rologi.tora()).toBeDefined();
  });

  it('αγνοεί τις ρυθμίσεις όταν δεν είναι αντικείμενο', async () => {
    const periballon = createRuntimeWith(
      async () => ok('όχι αντικείμενο'),
      false,
    );

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@9',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(true);
    expect(ai.ftiaxeGemini).toHaveBeenCalledOnce();
  });

  it('αγνοεί το onomaMontelou όταν δεν είναι έγκυρη συμβολοσειρά', async () => {
    const periballon = createRuntimeWith(
      async () => ok(JSON.stringify({ onomaMontelou: null, paroxosLlm: 'ollama' })),
      false,
    );

    const result = await periballon.llm.parage_keimeno({
      systima: '',
      minimata: [{ rolos: 'xristis', keimeno: 'Summarize this lesson.' }],
      ekdosi_prompt: 'runtime-provider-test@10',
      thermokrasia: 0,
    });

    expect(result.ok).toBe(true);
    expect(ai.ftiaxeOllama).toHaveBeenCalledOnce();
    // το άκυρο onomaMontelou μένει το προεπιλεγμένο μοντέλο
    expect(ai.ftiaxeOllama.mock.calls[0]?.[1]).toBe(PROEPILOGI_GEMINI_MONTELO);
  });
});
