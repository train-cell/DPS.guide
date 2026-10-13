import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import { fortose_rytheseis, proedapes_rytheseis } from './apothiki-ypiresies.js';

describe('AI model setting migration', () => {
  it('uses the current Gemini Flash model for fresh settings', () => {
    expect(proedapes_rytheseis().onomaMontelou).toBe('gemini-3.8-flash');
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
});
