import type { ZodType } from 'zod';

export interface AitisiPrompt<T> {
  sistima: string;
  xristis: string;
  sisma: ZodType<T>;
  ekdosi_prompt: string;
}

export function enotita_se_keimeno(titlos: string, soma: string[]): string {
  return `## ${titlos}\n${soma.join('\n')}\n`;
}
