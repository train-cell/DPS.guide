import type { Apotelesma, Enotita, Parapompi, Selida } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { ErgoAlithioAkrimaSchema } from './sxedio.js';
import type { ErgoAlithio } from './sxedio.js';

export interface PerigraphiEnnoia {
  enotita_id: string;
  ennoia: string;
  keimeno: string;
  parapompi: Parapompi;
}

export interface ErotisiAskisis {
  enotita_id: string;
  erotisi: string;
  apantisi_dekdomeni: string | null;
  parapompi: Parapompi;
}

export interface UlikoTutor {
  enotites: Enotita[];
  selides: Selida[];
  perigrafies: PerigraphiEnnoia[];
  erotiseis: ErotisiAskisis[];
}

export interface ApotelesmaErgaleiou {
  onoma: ErgoAlithio;
  keimeno: string;
  parapompi: Parapompi | null;
  erotisi: ErotisiAskisis | null;
}

export interface AnoixeSelidaZitima {
  arxeio_id: string;
  selida: number;
}

export interface VresEnnoiaZitima {
  ennoia: string;
}

export interface FtiaxeErotisiZitima {
  enotita_id: string;
}

export interface ErgaleiaTutor {
  anoixe_selida(orismata: AnoixeSelidaZitima): Apotelesma<ApotelesmaErgaleiou>;
  vres_ennoia(orismata: VresEnnoiaZitima): Apotelesma<ApotelesmaErgaleiou>;
  ftiaxe_erotisi(orismata: FtiaxeErotisiZitima): Apotelesma<ApotelesmaErgaleiou>;
}

export function kanonikopoie_imeronomeni(keimeno: string): string {
  return keimeno.normalize('NFC').replace(/\s+/gu, ' ').trim().toLowerCase();
}

export function ftiaxe_ergaleia_tutor(uliko: UlikoTutor): ErgaleiaTutor {
  function yparxei_enotita(enotita_id: string): boolean {
    return uliko.enotites.some((enotita) => enotita.id === enotita_id);
  }

  return {
    anoixe_selida({ arxeio_id, selida }: AnoixeSelidaZitima): Apotelesma<ApotelesmaErgaleiou> {
      const selidi = uliko.selides.find(
        (s) => s.arxeio_id === arxeio_id && s.arithmos === selida
      );
      if (selidi === undefined) {
        return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκε η σελίδα ${selida} του αρχείου ${arxeio_id}`);
      }
      if (selidi.xoris_keimeno) {
        return apotyxia(
          'DEN_VRETHIKE',
          `Η σελίδα ${selida} του αρχείου ${arxeio_id} δεν έχει κείμενο`
        );
      }
      return ok({
        onoma: 'anoixe_selida',
        keimeno: selidi.keimeno,
        parapompi: { arxeio_id, selida },
        erotisi: null,
      });
    },

    vres_ennoia({ ennoia }: VresEnnoiaZitima): Apotelesma<ApotelesmaErgaleiou> {
      const wanted = kanonikopoie_imeronomeni(ennoia);
      const perigrafia = uliko.perigrafies.find(
        (p) => kanonikopoie_imeronomeni(p.ennoia) === wanted
      );
      if (perigrafia === undefined) {
        return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκε ορισμός για την έννοια «${ennoia}»`);
      }
      if (!yparxei_enotita(perigrafia.enotita_id)) {
        return apotyxia(
          'DEN_VRETHIKE',
          `Ο ορισμός της έννοιας «${ennoia}» δεν αντιστοιχεί σε ενότητα της ύλης`
        );
      }
      return ok({
        onoma: 'vres_ennoia',
        keimeno: perigrafia.keimeno,
        parapompi: perigrafia.parapompi,
        erotisi: null,
      });
    },

    ftiaxe_erotisi({ enotita_id }: FtiaxeErotisiZitima): Apotelesma<ApotelesmaErgaleiou> {
      if (!yparxei_enotita(enotita_id)) {
        return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκε η ενότητα ${enotita_id} στη χάρτη`);
      }
      const erotisi = uliko.erotiseis.find((e) => e.enotita_id === enotita_id);
      if (erotisi === undefined) {
        return apotyxia(
          'DEN_VRETHIKE',
          `Δεν υπάρχει διαθέσιμη ερώτηση άσκησης για την ενότητα ${enotita_id}`
        );
      }
      return ok({
        onoma: 'ftiaxe_erotisi',
        keimeno: erotisi.erotisi,
        parapompi: erotisi.parapompi,
        erotisi,
      });
    },
  };
}

export function ektelese_ergaleio(ergaleia: ErgaleiaTutor, zitisi: unknown): Apotelesma<ApotelesmaErgaleiou> {
  const akrima = ErgoAlithioAkrimaSchema.safeParse(zitisi);
  if (!akrima.success) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρο αίτημα εργαλείου από το μοντέλο', {
      onoma: onoma_zitisis(zitisi),
      proleimata: akrima.error.issues,
    });
  }
  const ergo = akrima.data;
  if (ergo.onoma === 'anoixe_selida') {
    return ergaleia.anoixe_selida(ergo.arguments);
  }
  if (ergo.onoma === 'vres_ennoia') {
    return ergaleia.vres_ennoia(ergo.arguments);
  }
  return ergaleia.ftiaxe_erotisi(ergo.arguments);
}

export function onoma_zitisis(zitisi: unknown): string {
  if (typeof zitisi === 'object' && zitisi !== null && 'onoma' in zitisi) {
    if (typeof zitisi.onoma === 'string') {
      return zitisi.onoma;
    }
  }
  return 'άγνωστο';
}