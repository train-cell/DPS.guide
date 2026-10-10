import type { ApothikiPyli, LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import type { Apotelesma } from '@dps/core';
import { ok } from '@dps/core';
import { z } from 'zod';
import { analise_arxeio, parastylos_arxeio } from './grammata.js';
import type { ArkeioLlm, TyposAitimatos } from './grammata.js';
import { arxeio_kleidiou, kleidi_json, kleidi_keimenou } from './kleidi.js';
import { imeras_athinas } from './imeras-athinas.js';
import {
  ODOS_KLEIDIOU,
  PROORISMOS_KACHE_LLM,
  TYPOS_JSON,
  TYPOS_KEIMENOU,
} from './statheroi.js';

const SximaKeimenou = z.string();

async function diavase_arxeio(
  apothiki: ApothikiPyli,
  diadromi: string,
  kleidi: string
): Promise<ArkeioLlm | null> {
  const gram = await apothiki.diavase_keimeno(diadromi);
  if (!gram.ok) {
    return null;
  }
  const arkeio = analise_arxeio(gram.timi);
  if (arkeio === null || arkeio.hash !== kleidi) {
    return null;
  }
  return arkeio;
}

async function grapse_arxeio(
  apothiki: ApothikiPyli,
  diadromi: string,
  kleidi: string,
  montelo: string,
  ekdosi_prompt: string,
  typos: TyposAitimatos,
  timi: unknown
): Promise<void> {
  const arkeio: ArkeioLlm = {
    odos_kleidiou: ODOS_KLEIDIOU,
    hash: kleidi,
    montelo,
    ekdosi_prompt,
    typos_aitimatos: typos,
    imeras_athinas: imeras_athinas(new Date()),
    timi,
  };
  await apothiki.grapse_keimeno(diadromi, parastylos_arxeio(arkeio));
}

export function me_cache(
  llm: LlmPyli,
  apothiki: ApothikiPyli,
  proorismos: string = PROORISMOS_KACHE_LLM
): LlmPyli {
  const montelo = llm.montelo;

  return {
    montelo,

    async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
      const kleidi = kleidi_json(montelo, a);
      const diadromi = arxeio_kleidiou(kleidi, proorismos);
      const arkeio = await diavase_arxeio(apothiki, diadromi, kleidi);
      if (arkeio !== null && arkeio.typos_aitimatos === TYPOS_JSON) {
        const parsed = a.sxima.safeParse(arkeio.timi);
        if (parsed.success) {
          return ok(parsed.data);
        }
      }
      const apotelesma = await llm.parage_json(a);
      if (!apotelesma.ok) {
        return apotelesma;
      }
      await grapse_arxeio(
        apothiki,
        diadromi,
        kleidi,
        montelo,
        a.ekdosi_prompt,
        TYPOS_JSON,
        apotelesma.timi
      );
      return apotelesma;
    },

    async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
      const kleidi = kleidi_keimenou(montelo, a);
      const diadromi = arxeio_kleidiou(kleidi, proorismos);
      const arkeio = await diavase_arxeio(apothiki, diadromi, kleidi);
      if (arkeio !== null && arkeio.typos_aitimatos === TYPOS_KEIMENOU) {
        const parsed = SximaKeimenou.safeParse(arkeio.timi);
        if (parsed.success) {
          return ok(parsed.data);
        }
      }
      const apotelesma = await llm.parage_keimeno(a);
      if (!apotelesma.ok) {
        return apotelesma;
      }
      await grapse_arxeio(
        apothiki,
        diadromi,
        kleidi,
        montelo,
        a.ekdosi_prompt,
        TYPOS_KEIMENOU,
        apotelesma.timi
      );
      return apotelesma;
    },
  };
}