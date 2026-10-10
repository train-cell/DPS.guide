import { z } from 'zod';
import type { ZodType } from 'zod';

export type SximaGemini = Record<string, unknown>;

const LEKTIKA_AFIERA_SA = ['$schema'];

const NOMATA_GEMINI: Record<string, string> = {
  string: 'STRING',
  number: 'NUMBER',
  integer: 'INTEGER',
  boolean: 'BOOLEAN',
  array: 'ARRAY',
  object: 'OBJECT',
  null: 'NULL',
};

export const ApantisiGeminiSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string() })),
        }),
      })
    )
    .min(1),
});

export function gemini_sxima<T>(sisma: ZodType<T>): SximaGemini {
  return prosarmoge_odos(z.toJSONSchema(sisma, { target: 'draft-07', io: 'output' }));
}

export function prosarmoge_odos(vrasa: unknown): SximaGemini {
  if (typeof vrasa !== 'object' || vrasa === null || Array.isArray(vrasa)) {
    return {};
  }
  const ypokatanisi = vrasa as Record<string, unknown>;
  const profilis: SximaGemini = {};
  for (const [kleidi, timi] of Object.entries(ypokatanisi)) {
    if (LEKTIKA_AFIERA_SA.includes(kleidi)) {
      continue;
    }
    profilis[kleidi] = kleidi === 'type' ? anag_nomata(timi) : periphereia(timi);
  }
  return profilis;
}

export function pare_keimeno_apantisis(periexomeno: string | undefined): string | null {
  if (periexomeno === undefined) {
    return null;
  }
  let dedomena: unknown;
  try {
    dedomena = JSON.parse(periexomeno);
  } catch {
    return null;
  }
  const checked = ApantisiGeminiSchema.safeParse(dedomena);
  if (!checked.success) {
    return null;
  }
  const meros = checked.data.candidates[0]?.content.parts ?? [];
  return meros.map((m) => m.text).join('');
}

function periphereia(vrasa: unknown): unknown {
  if (Array.isArray(vrasa)) {
    return vrasa.map(periphereia);
  }
  if (typeof vrasa !== 'object' || vrasa === null) {
    return vrasa;
  }
  return prosarmoge_odos(vrasa);
}

function anag_nomata(vrasa: unknown): unknown {
  if (typeof vrasa === 'string') {
    return NOMATA_GEMINI[vrasa] ?? vrasa;
  }
  if (Array.isArray(vrasa)) {
    return vrasa.map((m) => (typeof m === 'string' ? (NOMATA_GEMINI[m] ?? m) : periphereia(m)));
  }
  return periphereia(vrasa);
}