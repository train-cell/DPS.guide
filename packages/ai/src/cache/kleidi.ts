import { sha256_heks } from './sha256.js';
import { ODOS_KLEIDIOU, PROORISMOS_KACHE_LLM, TYPOS_JSON, TYPOS_KEIMENOU } from './statheroi.js';
import type { TyposAitimatos } from './grammata.js';

export interface AilakiaAitimatos {
  systima: string;
  ekdosi_prompt: string;
}

export interface AilakiaAitimatosJson extends AilakiaAitimatos {
  xristis: string;
}

export interface AilakiaAitimatosKeimenou extends AilakiaAitimatos {
  minimata: { rolos: 'xristis' | 'montelo'; keimeno: string }[];
}

export type AilakiaPithou = AilakiaAitimatosJson | AilakiaAitimatosKeimenou;

export function katharise_arxi(arxi: string): string {
  return arxi.normalize('NFC').replace(/\r\n/g, '\n');
}

export function einai_aitima_keimenou(a: AilakiaPithou): a is AilakiaAitimatosKeimenou {
  return 'minimata' in a;
}

export function typos_aitimatos(aitima: AilakiaPithou): TyposAitimatos {
  return einai_aitima_keimenou(aitima) ? TYPOS_KEIMENOU : TYPOS_JSON;
}

export function kanonikos_ilogos(montelo: string, aitima: AilakiaPithou): string {
  const soma = einai_aitima_keimenou(aitima)
    ? [
        TYPOS_KEIMENOU,
        katharise_arxi(aitima.systima),
        aitima.minimata.map((minima) => [minima.rolos, katharise_arxi(minima.keimeno)]),
      ]
    : [TYPOS_JSON, katharise_arxi(aitima.systima), katharise_arxi(aitima.xristis)];
  return JSON.stringify([
    ODOS_KLEIDIOU,
    katharise_arxi(montelo),
    katharise_arxi(aitima.ekdosi_prompt),
    soma,
  ]);
}

export function kleidi_aitimatos(montelo: string, aitima: AilakiaPithou): string {
  return sha256_heks(kanonikos_ilogos(montelo, aitima));
}

export function kleidi_json(montelo: string, aitima: AilakiaAitimatosJson): string {
  return kleidi_aitimatos(montelo, aitima);
}

export function kleidi_keimenou(montelo: string, aitima: AilakiaAitimatosKeimenou): string {
  return kleidi_aitimatos(montelo, aitima);
}

export function enose_proorismon(proorismos: string): string {
  return proorismos.endsWith('/') ? proorismos.slice(0, -1) : proorismos;
}

export function arxeio_kleidiou(kleidi: string, proorismos: string = PROORISMOS_KACHE_LLM): string {
  return `${enose_proorismon(proorismos)}/${kleidi}.json`;
}