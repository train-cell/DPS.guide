import type { LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import type { Apotelesma } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { analise_arxeio, parastylos_arxeio } from '../cache/grammata.js';
import type { ArkeioLlm } from '../cache/grammata.js';
import { kleidi_json, kleidi_keimenou } from '../cache/kleidi.js';
import {
  KODIKOS_DEN_VRETHIKE,
  KODIKOS_MI_EGKYRO_SXIMA,
  ODOS_KLEIDIOU,
  TYPOS_JSON,
  TYPOS_KEIMENOU,
} from '../cache/statheroi.js';
import { arkeio_prosopa } from './arkeio.js';
import type { ArkeioProsopas } from './arkeio.js';

export type FortisisArchiou = (kleidi: string) => Promise<string | null>;

export class MockLlmArchiou implements LlmPyli {
  readonly montelo: string;
  private fortisis: FortisisArchiou;

  constructor(montelo: string, fortisis: FortisisArchiou) {
    this.montelo = montelo;
    this.fortisis = fortisis;
  }

  private async fortise(kleidi: string, diadromi: string): Promise<Apotelesma<ArkeioLlm>> {
    const periexomeno = await this.fortisis(kleidi);
    if (periexomeno === null) {
      return apotyxia(
        KODIKOS_DEN_VRETHIKE,
        `Λείπει το fixture LLM ${diadromi}. Ο MockLlmArchiou δεν επιστρέφει ποτέ επινοημένη απάντηση· γράψε το αρχείο με το grapse_arxeio_prosopa.`
      );
    }
    const arkeio = analise_arxeio(periexomeno);
    if (arkeio === null) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Το fixture LLM ${diadromi} δεν αναγνωρίζεται ως ${ODOS_KLEIDIOU}.`
      );
    }
    if (arkeio.hash !== kleidi) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Το fixture LLM ${diadromi} έχει hash ${arkeio.hash} ενώ ζητήθηκε ο κλειδί ${kleidi}. Το αρχείο γράφτηκε για άλλο αίτημα.`
      );
    }
    if (arkeio.montelo !== this.montelo) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Το fixture LLM ${diadromi} γράφτηκε για το μοντέλο ${arkeio.montelo} ενώ ζητήθηκε ${this.montelo}.`
      );
    }
    return ok(arkeio);
  }

  async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    const kleidi = kleidi_json(this.montelo, a);
    const diadromi = `${kleidi}.json`;
    const fortisi = await this.fortise(kleidi, diadromi);
    if (!fortisi.ok) {
      return fortisi;
    }
    if (fortisi.timi.typos_aitimatos !== TYPOS_JSON) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Το fixture LLM ${diadromi} περιέχει parage_keimeno ενώ ζητήθηκε parage_json.`
      );
    }
    const parsed = a.sxima.safeParse(fortisi.timi.timi);
    if (!parsed.success) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Η τιμή του fixture LLM ${diadromi} δεν ταιριάζει με το ζητούμενο σχήμα.`,
        parsed.error
      );
    }
    return ok(parsed.data);
  }

  async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    const kleidi = kleidi_keimenou(this.montelo, a);
    const diadromi = `${kleidi}.json`;
    const fortisi = await this.fortise(kleidi, diadromi);
    if (!fortisi.ok) {
      return fortisi;
    }
    if (fortisi.timi.typos_aitimatos !== TYPOS_KEIMENOU) {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Το fixture LLM ${diadromi} περιέχει parage_json ενώ ζητήθηκε parage_keimeno.`
      );
    }
    const timi = fortisi.timi.timi;
    if (typeof timi !== 'string') {
      return apotyxia(
        KODIKOS_MI_EGKYRO_SXIMA,
        `Η τιμή του fixture LLM ${diadromi} δεν είναι κείμενο.`
      );
    }
    return ok(timi);
  }
}

export function grapse_arxeio_prosopa(dedomena: ArkeioProsopas): string {
  return parastylos_arxeio(arkeio_prosopa(dedomena));
}