import type { ZodType } from 'zod';
import type { Apotelesma } from './apotelesma.js';
import type { Mathima } from './montela.js';

export interface HttpAitima {
  methodos: 'GET' | 'POST' | 'HEAD';
  url: string;
  kefalides?: Record<string, string>;
  soma_forma?: Record<string, string>;
  soma_json?: unknown;
  akolouthise_anakateuthinseis: boolean;
  xronos_orio_ms: number;
  typos_apantisis: 'keimeno' | 'dyadiko';
  simatodotis?: AbortSignal;
}

export interface HttpApantisi {
  katastasi: number;
  kefalides: Record<string, string>;
  teliko_url: string;
  keimeno?: string;
  dyadiko?: Uint8Array;
}

export interface HttpPyli {
  aitima(a: HttpAitima): Promise<Apotelesma<HttpApantisi>>;
}

export interface KatevasmaPyli {
  katevase(
    url: string,
    proorismos: string,
    kefalides: Record<string, string>,
    simatodotis?: AbortSignal
  ): Promise<Apotelesma<{ megethos: number }>>;
}

export interface ApothikiPyli {
  diavase_keimeno(diadromi: string): Promise<Apotelesma<string>>;
  grapse_keimeno(diadromi: string, periexomeno: string): Promise<Apotelesma<void>>; // atomic
  diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>>;
  grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>>; // atomic
  yparxei(diadromi: string): Promise<boolean>;
  lista(fakelos: string): Promise<Apotelesma<string[]>>;
  diagrafi(diadromi: string): Promise<Apotelesma<void>>;
}

export type KleidiMystikou =
  | 'eclass_onoma_xristi'
  | 'eclass_kodikos'
  | 'eclass_panepistimio_id'
  | 'eclass_base_url'
  | 'moodle_webservice_token'
  | 'llm_api_key'
  | 'vault_biometric_unlock';

export interface MystikaPyli {
  pare(k: KleidiMystikou): Promise<string | null>;
  vale(k: KleidiMystikou, timi: string): Promise<void>;
  svise(k: KleidiMystikou): Promise<void>;
}

export interface LlmAitimaJson<T> {
  systima: string;
  xristis: string;
  sxima: ZodType<T>;
  ekdosi_prompt: string;
  thermokrasia: number;
  simatodotis?: AbortSignal;
}

export interface LlmAitimaKeimenou {
  systima: string;
  minimata: { rolos: 'xristis' | 'montelo'; keimeno: string }[];
  ekdosi_prompt: string;
  thermokrasia: number;
  simatodotis?: AbortSignal;
}

export interface LlmPyli {
  readonly montelo: string;
  parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>>;
  parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>>;
}

export interface RologiPyli {
  tora(): Date;
}

export interface KatagrafiPyli {
  pliroforia(minima: string, dedomena?: Record<string, unknown>): void;
  proeidopoiisi(minima: string, dedomena?: Record<string, unknown>): void;
  sfalma(minima: string, dedomena?: Record<string, unknown>): void;
}

export interface KomvosArxeiou {
  typos: 'fakelos' | 'arxeio';
  onoma: string;
  diadromi: string;
  url: string;
  megethos: number | null;
  imerominia: string | null;
}

export interface EclassPyli {
  syndesi(): Promise<Apotelesma<void>>;
  fere_mathimata(): Promise<Apotelesma<Mathima[]>>;
  fere_dentro_arxeion(kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>>;
  /** Optional connector metadata used only to keep authenticated download headers same-origin. */
  readonly base_url?: string;
  pare_kefalides_lipshs?(): Record<string, string>;
}
