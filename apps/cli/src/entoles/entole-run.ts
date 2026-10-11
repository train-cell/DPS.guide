import type { Apotelesma } from '@dps/core';
import { ok } from '@dps/core';
import { trekse_oloklirosi } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/**
 * Πλήρης ροή: σύνδεση → μαθήματα → συγχρονισμός → ανάλυση για τα επιλεγμένα μαθήματα.
 * Η ίδια η αλληλουργία ανήκει στο `@dps/pipeline`.
 */
export async function trexe_run(eisodos: EisodosPipeline): Promise<Apotelesma<ExodosEn>> {
  const apotelesma = await trekse_oloklirosi(eisodos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ eidos: 'allh_dedomena', dedomena: apotelesma.timi });
}
