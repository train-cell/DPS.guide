import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import { fortose_rytheseis, proedapes_rytheseis } from './apothiki-ypiresies.js';

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
});
