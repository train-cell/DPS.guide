import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { odigos } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/**
 * Βήμα 8 (§4): lazy παραγωγή οδηγού ενότητας. Ο οδηγός γράφεται από το pipeline
 * στο `odigoi/<enotita_id>.md` (+ `.meta.json`) της ενότητας· εδώ τυπώνουμε τα
 * μεταδεδομένα (μοντέλο, παραπομπές, προειδποιήσεις).
 */
export async function trexe_odigos(
  eisodos: EisodosPipeline,
  ori_arg: readonly string[]
): Promise<Apotelesma<ExodosEn>> {
  const enotita_id = ori_arg[0];
  if (enotita_id === undefined) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Λείπει το υποχρεωτικό όρισμα: ENOTITA_ID');
  }
  const apotelesma = await odigos(eisodos, enotita_id);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ eidos: 'odigos', meta: apotelesma.timi });
}
