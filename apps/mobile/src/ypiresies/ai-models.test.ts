import { describe, expect, it } from 'vitest';
import {
  GEMINI_MODEL_OPTIONS,
  migrateGeminiModel,
  PROEPILOGI_GEMINI_MONTELO,
} from './ai-models.js';

describe('Gemini model catalog and migration', () => {
  it('offers the current stable Flash model and clearly labels the preview model', () => {
    expect(PROEPILOGI_GEMINI_MONTELO).toBe('gemini-3.8-flash');
    expect(GEMINI_MODEL_OPTIONS).toEqual([
      { id: 'gemini-3.8-flash', titlos: 'Gemini 3.8 Flash' },
      { id: 'gemini-3.1-pro-preview', titlos: 'Gemini 3.1 Pro · preview' },
    ]);
  });

  it('migrates old 2.5 selections and preserves other provider IDs', () => {
    expect(migrateGeminiModel('gemini-2.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateGeminiModel('gemini-2.5-pro')).toBe('gemini-3.1-pro-preview');
    expect(migrateGeminiModel('llama3.2')).toBe('llama3.2');
  });
});
