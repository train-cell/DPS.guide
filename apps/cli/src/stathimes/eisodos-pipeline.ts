import {
  KeyringMystika,
  NodeKatevasmaPyli,
  NodeFetchHttpPyli,
  NodeFsApothiki,
} from '@dps/adapters-node';
import type { Apotelesma, ApothikiPyli, EclassPyli, HttpPyli, LlmPyli, MystikaPyli } from '@dps/core';
import { apotyxia } from '@dps/core';
import { DpsEclassPyli, TopikiSyndesi } from '@dps/eclass';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ParastatesEntolhs } from '../entoles/grammatikopoio-entolhs.js';
import { MiYpostirimenoEclassPyli } from './eclass-eksodon.js';
import { KonsoladaKatagrafi } from './katagrafi-konsolada.js';
import { MiOrismenoMonteloLlmPyli } from './llm-choris-montelou.js';
import { SystemaRologi } from './rologi-systimatos.js';
import {
  fere_base_url_apo_ryza,
} from './rythmiseis.js';

export { DIADROMI_RYTHMISEON } from './rythmiseis.js';

/** Το stderr του CLI — τα logs πάνε εδώ, ώστε το stdout `--json` να είναι καθαρό. */
function kathisteriki_konsolis(grammi: string): void {
  process.stderr.write(`${grammi}\n`);
}

/**
 * Επιλύει το EclassPyli port:
 * 1. Πραγματική EclassPyli (DpsEclassPyli) όταν παρέχονται credentials και base_url.
 * 2. MiYpostirimenoEclassPyli όταν λείπουν τα στοιχεία σύνδεσης.
 */
export async function lise_eclass(
  apothiki: ApothikiPyli,
  http: HttpPyli,
  mystika: MystikaPyli
): Promise<EclassPyli> {
  const onoma = await mystika.pare('eclass_onoma_xristi');
  const kodikos = await mystika.pare('eclass_kodikos');
  const base_url = (await fere_base_url_apo_ryza(apothiki)) ?? process.env.ECLASS_BASE_URL ?? null;
  if (onoma !== null && kodikos !== null && base_url !== null) {
    const stratigiki = new TopikiSyndesi({
      onoma_xristi: onoma,
      kodikos: kodikos,
      base_url,
    });
    return new DpsEclassPyli({
      http,
      stratigiki,
      base_url,
    });
  }

  return new MiYpostirimenoEclassPyli();
}

/**
 * Στήνει την `EisodosPipeline` με τα Node adapters (§4: ports → adapters).
 *
 * - `eclass`: πραγματική DpsEclassPyli αν υπάρχουν credentials/base_url, αλλιώς σαφές unsupported error.
 * - `apothiki`/`katevasma`: fs, δεμένα στη ρίζα που δίνεται με `--riza`.
 * - `llm`: fail-closed placeholder. Το βοηθητικό CLI δεν διαθέτει το per-course
 *   Gemini opt-in και την επιβεβαίωση του ακριβούς prompt που απαιτεί η εφαρμογή.
 * - `mystika`: Windows Credential Manager με fallback στις μεταβλητές περιβάλλοντος.
 */
export async function dimiourgise_eisodos(
  parastates: ParastatesEntolhs
): Promise<Apotelesma<EisodosPipeline>> {
  if (parastates.xreiazetai_llm) {
    return apotyxia(
      'MI_YPOSTIRIZOMENO',
      'Η δημιουργία AI δεν είναι διαθέσιμη από το CLI, επειδή λείπει η συναίνεση ανά μάθημα και η επιβεβαίωση του ακριβούς prompt. Χρησιμοποίησε την εφαρμογή DPS.guide.'
    );
  }

  const apothiki = new NodeFsApothiki(parastates.riza);
  const http = new NodeFetchHttpPyli();
  const mystika = new KeyringMystika();
  const rologi = new SystemaRologi();
  const katagrafi = new KonsoladaKatagrafi(kathisteriki_konsolis);

  const llm: LlmPyli = new MiOrismenoMonteloLlmPyli();

  const eclass = await lise_eclass(apothiki, http, mystika);

  return {
    ok: true,
    timi: {
      eclass,
      apothiki,
      katevasma: new NodeKatevasmaPyli(parastates.riza),
      llm,
      mystika,
      rologi,
      katagrafi,
      // The Node adapters are already rooted at --riza; pipeline paths stay relative.
      riza: '',
    },
  };
}
