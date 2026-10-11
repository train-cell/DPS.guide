import {
  KeyringMystika,
  NodeFetchHttpPyli,
  NodeFsApothiki,
} from '@dps/adapters-node';
import { ftiaxe_gemini_llm } from '@dps/ai';
import type { Apotelesma, ApothikiPyli, LlmPyli } from '@dps/core';
import { apotyxia } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ParastatesEntolhs } from '../entoles/grammatikopoio-entolhs.js';
import { MiYpostirimenoEclassPyli } from './eclass-eksodon.js';
import { KonsoladaKatagrafi } from './katagrafi-konsolada.js';
import { MiOrismenoMonteloLlmPyli } from './llm-choris-montelou.js';
import { SystemaRologi } from './rologi-systimatos.js';
import { DIADROMI_RYTHMISEON, fere_montelo_apo_ryza } from './rythmiseis.js';

export { DIADROMI_RYTHMISEON };

/** Το stderr του CLI — τα logs πάνε εδώ, ώστε το stdout `--json` να είναι καθαρό. */
function kathisteriki_konsolis(grammi: string): void {
  process.stderr.write(`${grammi}\n`);
}

/**
 * Στήνει την `EisodosPipeline` με τα Node adapters (§4: ports → adapters).
 *
 * - `eclass`: προσωρινά ρητά «μη υλοποιημένο» (λείπει το `packages/eclass`).
 * - `apothiki`/`katevasma`: fs, δεμένα στη ρίζα που δίνεται με `--riza`.
 * - `llm`: Gemini μέσω `HttpPyli` (timeout/retry από §7.2) ΜΟΝΟ αν οριστεί μοντέλο·
 *   το μοντέλο προκύπτει από `--montelo` ή από `<riza>/rythmiseis.json` — ποτέ
 *   hardcoded. Ο cache wrapper του `@dps/ai` δεν εφαρμόζεται εδώ: η cache του LLM
 *   ανήκει στο `@dps/pipeline` (§4 «idempotent βήματα, cache»), γιατί μόνο αυτό
 *   ξέρει τη διαδρομή cache ανά μάθημα (§5.3).
 * - `mystika`: Windows Credential Manager με fallback στις μεταβλητές περιβάλλοντος.
 */
export async function dimiourgise_eisodos(
  parastates: ParastatesEntolhs
): Promise<Apotelesma<EisodosPipeline>> {
  const apothiki = new NodeFsApothiki(parastates.riza);
  const http = new NodeFetchHttpPyli();
  const mystika = new KeyringMystika();
  const rologi = new SystemaRologi();
  const katagrafi = new KonsoladaKatagrafi(kathisteriki_konsolis);

  const montelo = await lise_montelo(parastates, apothiki);
  if (montelo === null && parastates.xreiazetai_llm) {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Δεν έχει οριστεί μοντέλο LLM: δώσε --montelo <ονομα> ' +
        `ή βάλε το πεδίο "montelo" στο <riza>/${DIADROMI_RYTHMISEON}`
    );
  }
  const llm: LlmPyli =
    montelo === null
      ? new MiOrismenoMonteloLlmPyli()
      : ftiaxe_gemini_llm(http, mystika, rologi, katagrafi, { montelo });

  return {
    ok: true,
    timi: {
      eclass: new MiYpostirimenoEclassPyli(),
      apothiki,
      llm,
      mystika,
      rologi,
      katagrafi,
      riza: parastates.riza,
    },
  };
}

/** Προτεραιότητα σημαίας, έπειτα αρχείο ρυθμίσεων, έπειτα καμία τιμή. */
async function lise_montelo(
  parastates: ParastatesEntolhs,
  apothiki: ApothikiPyli
): Promise<string | null> {
  if (parastates.montelo !== null) {
    return parastates.montelo;
  }
  return fere_montelo_apo_ryza(apothiki);
}
