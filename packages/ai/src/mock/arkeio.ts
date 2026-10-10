import type { ArkeioLlm } from '../cache/grammata.js';
import type { AilakiaPithou } from '../cache/kleidi.js';
import { typos_aitimatos } from '../cache/kleidi.js';
import { ODOS_KLEIDIOU } from '../cache/statheroi.js';

export interface ArkeioProsopas {
  montelo: string;
  kleidi: string;
  aitima: AilakiaPithou;
  timi: unknown;
  imeras_athinas: string;
}

export function arkeio_prosopa(dedomena: ArkeioProsopas): ArkeioLlm {
  return {
    odos_kleidiou: ODOS_KLEIDIOU,
    hash: dedomena.kleidi,
    montelo: dedomena.montelo,
    ekdosi_prompt: dedomena.aitima.ekdosi_prompt,
    typos_aitimatos: typos_aitimatos(dedomena.aitima),
    imeras_athinas: dedomena.imeras_athinas,
    timi: dedomena.timi,
  };
}