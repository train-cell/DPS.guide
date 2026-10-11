import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { trekse_analysi } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/**
 * Σύνθετη ροή «ανάλυση» για ένα μάθημα: exagogi → perigramma → xartis → megeti
 * (§4 βήματα 4–7). Η ορχήστρωση ανήκει στο `@dps/pipeline`· εδώ καλούμε το βήμα και
 * τυπώνουμε το αποτέλεσμα.
 */
export async function trexe_analysi(
  eisodos: EisodosPipeline,
  ori_arg: readonly string[]
): Promise<Apotelesma<ExodosEn>> {
  const kodikos_mathimatos = ori_arg[0];
  if (kodikos_mathimatos === undefined) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Λείπει το υποχρεωτικό όρισμα: KODIKOS');
  }
  const apotelesma = await trekse_analysi(eisodos, kodikos_mathimatos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ eidos: 'xartis', xartis: apotelesma.timi });
}
