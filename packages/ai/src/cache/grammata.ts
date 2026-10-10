import { z } from 'zod';
import { ODOS_KLEIDIOU } from './statheroi.js';

export const MORFH_HEXAD = /^[0-9a-f]{64}$/;
export const MORFH_IMERAS = /^\d{4}-\d{2}-\d{2}$/;

export const TyposAitimatosSchema = z.enum(['json', 'keimeno']);
export type TyposAitimatos = z.infer<typeof TyposAitimatosSchema>;

export const ArkeioLlmSchema = z.object({
  odos_kleidiou: z.literal(ODOS_KLEIDIOU),
  hash: z.string().regex(MORFH_HEXAD),
  montelo: z.string(),
  ekdosi_prompt: z.string(),
  typos_aitimatos: TyposAitimatosSchema,
  imeras_athinas: z.string().regex(MORFH_IMERAS),
  timi: z.unknown(),
});
export type ArkeioLlm = z.infer<typeof ArkeioLlmSchema>;

export const MetrisiImerasSchema = z.object({
  imeras_athinas: z.string().regex(MORFH_IMERAS),
  kliseis: z.number().int().nonnegative(),
});
export type MetrisiImeras = z.infer<typeof MetrisiImerasSchema>;

export function parastylos_arxeio(arkeio: ArkeioLlm): string {
  return `${JSON.stringify(arkeio, null, 2)}\n`;
}

export function parastylos_metrisis(metrisi: MetrisiImeras): string {
  return `${JSON.stringify(metrisi, null, 2)}\n`;
}

export function analise_arxeio(periexomeno: string): ArkeioLlm | null {
  let anagnosmeno: unknown;
  try {
    anagnosmeno = JSON.parse(periexomeno);
  } catch {
    return null;
  }
  const checked = ArkeioLlmSchema.safeParse(anagnosmeno);
  return checked.success ? checked.data : null;
}

export function analise_metrisi(periexomeno: string): MetrisiImeras | null {
  let anagnosmeno: unknown;
  try {
    anagnosmeno = JSON.parse(periexomeno);
  } catch {
    return null;
  }
  const checked = MetrisiImerasSchema.safeParse(anagnosmeno);
  return checked.success ? checked.data : null;
}