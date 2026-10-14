/** Supported AI providers. The provider remains explicit when model IDs are user-defined. */
export type IdParoxouAi = 'gemini' | 'ollama';

/** Infers the provider for settings created before provider IDs were stored in the vault. */
export function entopise_paroxo_montelou(onomaMontelou: string, apothikevmenosParoxos?: unknown): IdParoxouAi {
  if (apothikevmenosParoxos === 'gemini' || apothikevmenosParoxos === 'ollama') {
    return apothikevmenosParoxos;
  }

  const mikro = onomaMontelou.trim().toLowerCase();
  if (/^gemini-[\w.-]+$/.test(mikro)) return 'gemini';
  if (/^(llama|mistral|deepseek|qwen|gemma|phi|codellama)([.:\d-]|$)/.test(mikro)) return 'ollama';
  return 'gemini';
}
