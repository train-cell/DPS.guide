import type { ApothikiPyli, LlmAitimaJson, LlmAitimaKeimenou, LlmPyli, RologiPyli } from '@dps/core';
import type { Apotelesma } from '@dps/core';
import { apotyxia } from '@dps/core';
import { analise_metrisi, parastylos_metrisis } from './grammata.js';
import type { MetrisiImeras } from './grammata.js';
import { enose_proorismon } from './kleidi.js';
import { imeras_athinas } from './imeras-athinas.js';
import { KODIKOS_LEIGEI_PROYPOLOGISMO, PROORISMOS_METRISIS } from './statheroi.js';

async function metrisi_apothikismeni(
  apothiki: ApothikiPyli,
  proorismos: string,
  imera: string
): Promise<MetrisiImeras | null> {
  const gram = await apothiki.diavase_keimeno(proorismos);
  if (!gram.ok) {
    return null;
  }
  const metrisi = analise_metrisi(gram.timi);
  if (metrisi === null || metrisi.imeras_athinas !== imera) {
    return null;
  }
  return metrisi;
}

export function me_proypologismo(
  llm: LlmPyli,
  apothiki: ApothikiPyli,
  rologi: RologiPyli,
  orio_klisewn_imeras: number,
  proorismos: string = PROORISMOS_METRISIS
): LlmPyli {
  const montelo = llm.montelo;
  const diadromi = enose_proorismon(proorismos);
  let imera_stored: string | null = null;
  let kliseis_stored = 0;

  async function anagnose_imeras(): Promise<MetrisiImeras> {
    const imera = imeras_athinas(rologi.tora());
    const apo_apothiki = await metrisi_apothikismeni(apothiki, diadromi, imera);
    if (apo_apothiki !== null) {
      imera_stored = apo_apothiki.imeras_athinas;
      kliseis_stored = apo_apothiki.kliseis;
    } else if (imera_stored !== imera) {
      imera_stored = imera;
      kliseis_stored = 0;
    }
    return { imeras_athinas: imera, kliseis: kliseis_stored };
  }

  async function xreose(metrisi: MetrisiImeras): Promise<void> {
    imera_stored = metrisi.imeras_athinas;
    kliseis_stored = metrisi.kliseis;
    await apothiki.grapse_keimeno(diadromi, parastylos_metrisis(metrisi));
  }

  async function proepomeni_ili_eksimerwmeni(): Promise<Apotelesma<MetrisiImeras>> {
    const trexon = await anagnose_imeras();
    const amakromeni: MetrisiImeras = {
      imeras_athinas: trexon.imeras_athinas,
      kliseis: trexon.kliseis + 1,
    };
    if (amakromeni.kliseis > orio_klisewn_imeras) {
      return apotyxia(
        KODIKOS_LEIGEI_PROYPOLOGISMO,
        `Ξεπεράστηκε το ημερήσιο όριο των ${orio_klisewn_imeras} κλήσεων για την ${amakromeni.imeras_athinas}. Ο μετρητής έφτασε τις ${amakromeni.kliseis}.`
      );
    }
    await xreose(amakromeni);
    return { ok: true, timi: amakromeni };
  }

  return {
    montelo,

    async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
      const proepomeni = await proepomeni_ili_eksimerwmeni();
      if (!proepomeni.ok) {
        return proepomeni;
      }
      return llm.parage_json(a);
    },

    async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
      const proepomeni = await proepomeni_ili_eksimerwmeni();
      if (!proepomeni.ok) {
        return proepomeni;
      }
      return llm.parage_keimeno(a);
    },
  };
}