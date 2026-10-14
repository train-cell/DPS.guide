import { describe, expect, it } from 'vitest';
import { entopise_paroxo_montelou } from './ai-providers.js';

describe('AI provider settings', () => {
  it('keeps the saved provider for an arbitrary user-defined model ID', () => {
    expect(entopise_paroxo_montelou('lab/custom-chat:latest', 'ollama')).toBe('ollama');
    expect(entopise_paroxo_montelou('custom-model', 'gemini')).toBe('gemini');
  });

  it('infers a provider for legacy model-only settings', () => {
    expect(entopise_paroxo_montelou('gemini-3.8-flash')).toBe('gemini');
    expect(entopise_paroxo_montelou('qwen3.5:9b')).toBe('ollama');
    expect(entopise_paroxo_montelou('deepseek-coder:6.7b')).toBe('ollama');
    expect(entopise_paroxo_montelou('unrecognized-old-model')).toBe('gemini');
  });
});
