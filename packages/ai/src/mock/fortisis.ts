import type { ApothikiPyli } from '@dps/core';
import type { FortisisArchiou } from './mock-llm.js';

export function fortisi_me_apothiki(apothiki: ApothikiPyli, fakelos: string): FortisisArchiou {
  const proorismos = fakelos.endsWith('/') ? fakelos.slice(0, -1) : fakelos;
  return async (kleidi: string): Promise<string | null> => {
    const apotelesma = await apothiki.diavase_keimeno(`${proorismos}/${kleidi}.json`);
    return apotelesma.ok ? apotelesma.timi : null;
  };
}