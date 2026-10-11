import type { Apotelesma } from '@dps/core';
import { ok } from '@dps/core';
import { anakalypsi } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/** Βήμα 2 (§4): ανακάλυψη μαθημάτων → `mathimata.json`. */
export async function trexe_mathimata(eisodos: EisodosPipeline): Promise<Apotelesma<ExodosEn>> {
  const apotelesma = await anakalypsi(eisodos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ eidos: 'mathimata', mathimata: apotelesma.timi });
}
