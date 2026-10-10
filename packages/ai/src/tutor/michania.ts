import type {
  Apotelesma,
  Enotita,
  KatagrafiPyli,
  KodikosSfalmatos,
  LlmPyli,
  Parapompi,
} from '@dps/core';
import { apotyxia } from '@dps/core';
import { prompt_tutor } from '../prompts/tutor.js';
import type { LeitourgiaTutor } from '../prompts/tutor.js';
import { einai_arithmetiki_apantisi, sugkrise_arithmetika } from './arithmetiki.js';
import type { SugkrisiArithmetikis } from './arithmetiki.js';
import { ektelese_ergaleio, kanonikopoie_imeronomeni, onoma_zitisis } from './ergaleia.js';
import type { ApotelesmaErgaleiou, ErgaleiaTutor, ErotisiAskisis } from './ergaleia.js';
import { ApantisiTutorSchema } from './sxedio.js';
import type { ApantisiTutor } from './sxedio.js';
import {
  FRASIS_ANESTIXTORI,
  FRASIS_DEN_MPORO_EPALITHEUSO,
  FRASIS_KATHODIGISI_ASKISIS,
  FRASEIS_TELEIAS_LUSIS,
  KODIKOS_YPERORIAS_KALLES,
  MEGISTES_KALLES_ERGALEION,
  PARAGMA_SYGKRISIS,
  PLIO_MESOI_ISTORIKOU,
  PROSFASIS_ERGALEION,
  PROSFASIS_SYGKRISIS,
  THERMOKRASIA_TUTOR,
} from './statheres.js';

export interface MinimaIstorikou {
  rolos: 'xristis' | 'montelo';
  keimeno: string;
}

export interface EisodosStrih {
  enotita: Enotita;
  odigos: string;
  istorico: MinimaIstorikou[];
  leitourgia: LeitourgiaTutor;
  erotisi: string;
  xekimena_erotisi?: ErotisiAskisis | null;
}

export interface KalliErgaleiou {
  onoma_zitisis: string;
  ektelestike: boolean;
  parapompi: Parapompi | null;
}

export interface EgesErgaleiou {
  onoma_zitisis: string;
  kodikos: KodikosSfalmatos;
  minima: string;
}

export interface StrihTutor {
  apantisi: string;
  parapompes: Parapompi[];
  istorico: MinimaIstorikou[];
  symkrisi_arithmetikis: SugkrisiArithmetikis | null;
  kalles_ergaleion: KalliErgaleiou[];
  ereges_ergaleion: EgesErgaleiou[];
  xekimena_erotisi: ErotisiAskisis | null;
}

export interface EisodosMichania {
  llm: LlmPyli;
  ergaleia: ErgaleiaTutor;
  katagrafi: KatagrafiPyli;
  thermokrasia?: number;
  simatodotis?: AbortSignal;
}

export interface MichaniaTutor {
  strih(eisodos: EisodosStrih): Promise<Apotelesma<StrihTutor>>;
}

const SIMBOLA_EROTISIS = ['?', '\u037E'];

export function zitisei_teleia_lusi(erotisi: string): boolean {
  const kanoniki = kanonikopoie_imeronomeni(erotisi);
  return FRASEIS_TELEIAS_LUSIS.some((frasi) => kanoniki.includes(frasi));
}

export function pram_ena_erotisi(keimeno: string): string {
  let thesi = -1;
  for (const simvolo of SIMBOLA_EROTISIS) {
    const vrethi = keimeno.indexOf(simvolo);
    if (vrethi >= 0 && (thesi < 0 || vrethi < thesi)) {
      thesi = vrethi;
    }
  }
  if (thesi < 0) {
    return keimeno.trim();
  }
  return keimeno.slice(0, thesi + 1).trim();
}

export function perigraphi_symkrisis(symkrisi: SugkrisiArithmetikis): string {
  const anamomeni = symkrisi.anamomeni ?? 'δεν υπάρχει αναμενόμενη τιμή στο υλικό';
  const apantisi = symkrisi.apantisi_mafis ?? 'δεν αναγνωρίστηκε αριθμητική απάντηση';
  return `- αναμενόμενη τιμή: ${anamomeni} · απάντηση μαθητή: ${apantisi} · πόρισμα: ${symkrisi.poreia}`;
}

function pare_ma_terma(minimata: MinimaIstorikou[]): MinimaIstorikou[] {
  if (minimata.length <= PLIO_MESOI_ISTORIKOU) {
    return [...minimata];
  }
  return minimata.slice(minimata.length - PLIO_MESOI_ISTORIKOU);
}

function prosfasi_ergaleion(minimata: MinimaIstorikou[]): string {
  if (minimata.length === 0) {
    return '';
  }
  return `${PROSFASIS_ERGALEION}\n${minimata.map((m) => `- ${m.keimeno}`).join('\n')}\n`;
}

function prosfasi_symkrisis(symkrisi: SugkrisiArithmetikis | null): string {
  if (symkrisi === null) {
    return '';
  }
  return `${PROSFASIS_SYGKRISIS}\n${perigraphi_symkrisis(symkrisi)}\n${PARAGMA_SYGKRISIS}\n`;
}

function zitisi_grammenis(apotelesma: ApotelesmaErgaleiou): string {
  return `Αποτέλεσμα εργαλείου ${apotelesma.onoma}: ${apotelesma.keimeno}`;
}

export function ftiaxe_michania_tutor(eisodos: EisodosMichania): MichaniaTutor {
  const llm = eisodos.llm;
  const ergaleia = eisodos.ergaleia;
  const katagrafi = eisodos.katagrafi;
  const thermokrasia = eisodos.thermokrasia ?? THERMOKRASIA_TUTOR;
  const simatodotis = eisodos.simatodotis;

  async function strih(eisodosStrih: EisodosStrih): Promise<Apotelesma<StrihTutor>> {
    const symkrisi = anamomeni_symkrisi(eisodosStrih);
    const istoriko = pare_ma_terma(eisodosStrih.istorico);
    const minima_ergaleion: MinimaIstorikou[] = [];
    const kalles_ergaleion: KalliErgaleiou[] = [];
    const ereges_ergaleion: EgesErgaleiou[] = [];
    let nea_erotisi: ErotisiAskisis | null = null;
    let ekteleseis = 0;

    for (;;) {
      const aitisi = prompt_tutor({
        enotita: eisodosStrih.enotita,
        odigos: eisodosStrih.odigos,
        istorico: [...istoriko, ...minima_ergaleion],
        leitourgia: eisodosStrih.leitourgia,
        erotisi: eisodosStrih.erotisi,
      });
      const apantisi = await llm.parage_json<ApantisiTutor>({
        systima: aitisi.sistima,
        xristis:
          aitisi.xristis + prosfasi_ergaleion(minima_ergaleion) + prosfasi_symkrisis(symkrisi),
        sxima: ApantisiTutorSchema,
        ekdosi_prompt: aitisi.ekdosi_prompt,
        thermokrasia,
        ...(simatodotis === undefined ? {} : { simatodotis }),
      });
      if (!apantisi.ok) {
        katagrafi.sfalma('tutor: η απάντηση του μοντέλου απέτυχε', { enotita: eisodosStrih.enotita.id });
        return apantisi;
      }
      if (apantisi.timi.ergaleio === undefined) {
        const teliko = teliki_strih(apantisi.timi, eisodosStrih, symkrisi);
        katagrafi.pliroforia('tutor: στροφή ολοκληρώθηκε', {
          enotita: eisodosStrih.enotita.id,
          leitourgia: eisodosStrih.leitourgia,
          kalles_ergaleion: ekteleseis,
        });
        return {
          ok: true,
          timi: {
            apantisi: teliko.apantisi,
            parapompes: teliko.parapompes,
            istorico: [
              ...eisodosStrih.istorico,
              { rolos: 'xristis', keimeno: eisodosStrih.erotisi },
              { rolos: 'montelo', keimeno: teliko.apantisi },
            ],
            symkrisi_arithmetikis: symkrisi,
            kalles_ergaleion,
            ereges_ergaleion,
            xekimena_erotisi: nea_erotisi,
          },
        };
      }
      if (ekteleseis >= MEGISTES_KALLES_ERGALEION) {
        katagrafi.proeidopoiisi('tutor: στάση στο όριο κλήσεων εργαλείων', {
          enotita: eisodosStrih.enotita.id,
          orio: MEGISTES_KALLES_ERGALEION,
        });
        return apotyxia(
          KODIKOS_YPERORIAS_KALLES,
          `Το μοντέλο ζήτησε περισσότερες από ${MEGISTES_KALLES_ERGALEION} κλήσεις εργαλείων σε μία στροφή`
        );
      }
      ekteleseis += 1;
      const onoma = onoma_zitisis(apantisi.timi.ergaleio);
      const apotelesma = ektelese_ergaleio(ergaleia, apantisi.timi.ergaleio);
      if (!apotelesma.ok) {
        ereges_ergaleion.push({
          onoma_zitisis: onoma,
          kodikos: apotelesma.sfalma.kodikos,
          minima: apotelesma.sfalma.minima,
        });
        minima_ergaleion.push({
          rolos: 'montelo',
          keimeno: `Σφάλμα εργαλείου ${onoma}: ${apotelesma.sfalma.minima}`,
        });
        katagrafi.sfalma('tutor: αποτυχία εργαλείου', {
          enotita: eisodosStrih.enotita.id,
          ergaleio: onoma,
          kodikos: apotelesma.sfalma.kodikos,
        });
        continue;
      }
      kalles_ergaleion.push({
        onoma_zitisis: onoma,
        ektelestike: true,
        parapompi: apotelesma.timi.parapompi,
      });
      minima_ergaleion.push({ rolos: 'montelo', keimeno: zitisi_grammenis(apotelesma.timi) });
      if (apotelesma.timi.erotisi !== null) {
        nea_erotisi = apotelesma.timi.erotisi;
      }
    }
  }

  return { strih };
}

function anamomeni_symkrisi(eisodos: EisodosStrih): SugkrisiArithmetikis | null {
  const xekimena = eisodos.xekimena_erotisi;
  if (xekimena === undefined || xekimena === null) {
    return null;
  }
  if (!einai_arithmetiki_apantisi(eisodos.erotisi)) {
    return null;
  }
  return sugkrise_arithmetika({
    apantisi_mafis: eisodos.erotisi,
    anamomeni_timi: xekimena.apantisi_dekdomeni,
    yliko: eisodos.odigos,
  });
}

interface TelikiStrih {
  apantisi: string;
  parapompes: Parapompi[];
}

function teliki_strih(
  apantisi: ApantisiTutor,
  eisodos: EisodosStrih,
  symkrisi: SugkrisiArithmetikis | null
): TelikiStrih {
  let keimeno = apantisi.apantisi;
  let parapompes = [...apantisi.parapompes];

  if (!apantisi.exexigmeni) {
    return { apantisi: FRASIS_ANESTIXTORI, parapompes: [] };
  }
  if (symkrisi !== null && symkrisi.poreia === 'den_epalythevomene') {
    return { apantisi: FRASIS_DEN_MPORO_EPALITHEUSO, parapompes: [] };
  }
  if (
    eisodos.leitourgia === 'kathodigisi_askisis' &&
    apantisi.apantisi_teleia_lusi === true &&
    !zitisei_teleia_lusi(eisodos.erotisi)
  ) {
    return { apantisi: FRASIS_KATHODIGISI_ASKISIS, parapompes: [] };
  }
  if (eisodos.leitourgia === 'exetasi_me') {
    keimeno = pram_ena_erotisi(keimeno);
  }
  if (parapompes.length === 0) {
    const xekimena = eisodos.xekimena_erotisi;
    if (xekimena !== undefined && xekimena !== null) {
      parapompes = [xekimena.parapompi];
    }
  }
  return { apantisi: keimeno, parapompes };
}