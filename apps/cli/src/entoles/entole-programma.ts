import type { Apotelesma } from '@dps/core';
import { ok } from '@dps/core';
import { programma } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn } from '../eksodos/exodos-en.js';

/**
 * Βήμα 10 (§4): πρόγραμμα μέχρι τις εξετάσεις (Φάση 2, deterministic στο core).
 *
 * Το `programma` είναι `Apotelesma<unknown>` στο συμβόλαιο του pipeline, οπότε το
 * αποτέλεσμα εκτυπώνεται ως JSON — χωρίς να επιβάλουμε φορή δομή.
 */
export async function trexe_programma(eisodos: EisodosPipeline): Promise<Apotelesma<ExodosEn>> {
  const apotelesma = await programma(eisodos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ eidos: 'allh_dedomena', dedomena: apotelesma.timi });
}
