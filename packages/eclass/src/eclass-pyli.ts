import type {
  Apotelesma,
  EclassPyli,
  HttpPyli,
  KomvosArxeiou,
  Mathima,
} from '@dps/core';
import { CookieDiaxeiristis } from './auth/cookie-diaxeiristis.js';
import type { AuthPerivallon, SyndesiStratigiki } from './auth/typoi.js';
import { fere_dentro_arxeion } from './crawl/fere-dentro-arxeion.js';
import { fere_mathimata } from './crawl/fere-mathimata.js';
import { sygxronise_mathima } from './crawl/sygxronise-mathima.js';
import type { ApologismosSygxronismou, ParametroiSygxronismou } from './crawl/typoi.js';
import { VASIKO_URL_ECLASS } from './statheres.js';

export interface DpsEclassEpiloges {
  readonly http: HttpPyli;
  readonly stratigiki: SyndesiStratigiki;
  readonly base_url?: string;
  readonly cookie_diaxeiristis?: CookieDiaxeiristis;
  readonly kathysterisi_ms?: number;
}

/**
 * Πλήρης υλοποίηση του contract EclassPyli για επικοινωνία με το Open eClass.
 * Συνδυάζει τις στρατηγικές πιστοποίησης (L14) και τη διάσχιση/ανάκτηση (L15).
 */
export class DpsEclassPyli implements EclassPyli {
  private readonly perivallon: AuthPerivallon;
  private readonly stratigiki: SyndesiStratigiki;
  private readonly kathysterisi_ms: number;

  constructor(epiloges: DpsEclassEpiloges) {
    const cookie_diaxeiristis = epiloges.cookie_diaxeiristis ?? new CookieDiaxeiristis();
    const base_url = epiloges.base_url ?? VASIKO_URL_ECLASS;

    this.perivallon = {
      http: epiloges.http,
      base_url,
      cookie_diaxeiristis,
    };
    this.stratigiki = epiloges.stratigiki;
    this.kathysterisi_ms = epiloges.kathysterisi_ms ?? 0;
  }

  get cookie_diaxeiristis(): CookieDiaxeiristis {
    return this.perivallon.cookie_diaxeiristis;
  }

  get http(): HttpPyli {
    return this.perivallon.http;
  }

  get base_url(): string {
    return this.perivallon.base_url ?? VASIKO_URL_ECLASS;
  }

  pare_kefalides_lipshs(): Record<string, string> {
    const cookie = this.perivallon.cookie_diaxeiristis.pare_kefalida();
    return cookie == null ? {} : { cookie };
  }

  async syndesi(): Promise<Apotelesma<void>> {
    return this.stratigiki.syndesi(this.perivallon);
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    return fere_mathimata(this.perivallon, this.stratigiki, {
      kathysterisi_ms: this.kathysterisi_ms,
    });
  }

  async fere_dentro_arxeion(kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    return fere_dentro_arxeion(this.perivallon, this.stratigiki, kodikos, {
      kathysterisi_ms: this.kathysterisi_ms,
    });
  }

  async sygxronise(
    parametroi: Omit<ParametroiSygxronismou, 'eclass' | 'http'>
  ): Promise<Apotelesma<ApologismosSygxronismou>> {
    return sygxronise_mathima({
      ...parametroi,
      eclass: this,
      http: this.perivallon.http,
      kathysterisi_ms: parametroi.kathysterisi_ms ?? this.kathysterisi_ms,
    });
  }
}
