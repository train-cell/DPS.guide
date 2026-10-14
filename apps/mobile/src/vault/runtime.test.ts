import { beforeEach, describe, expect, it, vi } from 'vitest';
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

import { createProductionPeriballon, type DeviceStorage } from './runtime.js';
import type { VaultSession } from './vault.js';

const customModel = 'lab/custom-chat:latest';
const responseLlm: LlmPyli = {
  montelo: customModel,
  parage_json: async () => ok({} as never),
  parage_keimeno: async () => ok('READY'),
};

function createRuntime(native: boolean, settings: Record<string, unknown>) {
  const apothiki = {
    diavase_keimeno: vi.fn(async () => ok(JSON.stringify(settings))),
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

describe('createProductionPeriballon AI provider dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { hostname: 'localhost' });
    ai.ftiaxeOllama.mockReturnValue(responseLlm);
    ai.ftiaxeGemini.mockReturnValue(responseLlm);
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
});
