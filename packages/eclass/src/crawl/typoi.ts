import type {
  ApothikiPyli,
  EclassPyli,
  HttpPyli,
  KatevasmaPyli,
  KatagrafiPyli,
} from '@dps/core';

export interface EpilogesCrawl {
  readonly kathysterisi_ms?: number;
  readonly simatodotis?: AbortSignal;
}

export interface ParametroiSygxronismou {
  readonly kodikos_mathimatos: string;
  readonly eclass: EclassPyli;
  readonly http: HttpPyli;
  readonly apothiki: ApothikiPyli;
  readonly katevasma?: KatevasmaPyli;
  readonly riza?: string;
  readonly katagrafi?: KatagrafiPyli;
  readonly kathysterisi_ms?: number;
  readonly simatodotis?: AbortSignal;
}

export interface ApologismosSygxronismou {
  readonly nea_arxeia: number;
  readonly allagmena_arxeia: number;
  readonly ametavlita_arxeia: number;
  readonly paraleifthikan: number;
  readonly synolo_arxeion: number;
}
