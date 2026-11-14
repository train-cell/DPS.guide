import type { PoreiaArithmetikis } from './sxedio.js';

export interface EisodosSygrisisArithmetikis {
  apantisi_mafis: string;
  anamomeni_timi: string | null;
  yliko: string;
}

export interface SugkrisiArithmetikis {
  poreia: PoreiaArithmetikis;
  anamomeni: string | null;
  apantisi_mafis: string | null;
}

const ARITHMIKO = /^[+-]?(\d+(\.\d+)?|\.\d+)$/u;

const KENAKOI = /[\s\u00a0\u2009]/gu;

const MERA_GIA_DIASTIMATA = /\s+/gu;

const ORIO_ARITHMOU = /(?<![\d.,])/u;

const TELOS_ARITHMOU = /(?![\d,]|\.\d)/u;

const MINUS = '-';

export function kanonikopoie_arithmo(keimeno: string): string | null {
  const xerismeno = keimeno.normalize('NFC').replace(KENAKOI, '').replace(/−/gu, '-').replace(',', '.');
  if (!ARITHMIKO.test(xerismeno)) {
    return null;
  }
  const arge = xerismeno.startsWith(MINUS) ? MINUS : '';
  const xwris_yalon = xerismeno.replace(/^[+-]/u, '');
  const meros = xwris_yalon.split('.');
  const akolytho = meros[0] ?? '';
  const ok_dekadikos = akolytho.length === 0 ? '0' : akolytho.replace(/^0+(?=\d)/u, '');
  const dekadika = (meros[1] ?? '').replace(/0+$/u, '');
  const timi = dekadika.length === 0 ? ok_dekadikos : `${ok_dekadikos}.${dekadika}`;
  return arge === MINUS && timi !== '0' ? `${arge}${timi}` : timi;
}

export function einai_arithmetiki_apantisi(keimeno: string): boolean {
  return kanonikopoie_arithmo(keimeno) !== null;
}

export function pericharei_sto_yliko(yliko: string, anamomeni: string): boolean {
  const yliko_kanoniko = yliko.normalize('NFC').replace(MERA_GIA_DIASTIMATA, ' ');
  for (const ypofiro_timi of [anamomeni, anamomeni.replace('.', ',')]) {
    if (
      new RegExp(`${ORIO_ARITHMOU.source}${ypofiro_timi}${TELOS_ARITHMOU.source}`, 'u').test(
        yliko_kanoniko
      )
    ) {
      return true;
    }
  }
  return false;
}

export function sugkrise_arithmetika(eisodos: EisodosSygrisisArithmetikis): SugkrisiArithmetikis {
  const apantisi_mafis = kanonikopoie_arithmo(eisodos.apantisi_mafis);
  if (eisodos.anamomeni_timi === null) {
    return { poreia: 'den_epalythevomene', anamomeni: null, apantisi_mafis };
  }
  const anamomeni = kanonikopoie_arithmo(eisodos.anamomeni_timi);
  if (anamomeni === null || !pericharei_sto_yliko(eisodos.yliko, anamomeni)) {
    return { poreia: 'den_epalythevomene', anamomeni, apantisi_mafis };
  }
  if (apantisi_mafis === null) {
    return { poreia: 'den_epalythevomene', anamomeni, apantisi_mafis: null };
  }
  return {
    poreia: apantisi_mafis === anamomeni ? 'sosto' : 'lathos',
    anamomeni,
    apantisi_mafis,
  };
}