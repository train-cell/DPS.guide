import type { Apotelesma, HttpPyli } from '@dps/core';
import type { CookieDiaxeiristis } from './cookie-diaxeiristis.js';

export interface AuthPerivallon {
  readonly http: HttpPyli;
  readonly base_url: string;
  readonly cookie_diaxeiristis: CookieDiaxeiristis;
}

export interface SyndesiStratigiki {
  syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>>;
}

export interface StoixeiaTopikisSyndesis {
  readonly onoma_xristi: string;
  readonly kodikos: string;
  readonly base_url?: string;
}

export interface StoixeiaCasSyndesis {
  readonly onoma_xristi: string;
  readonly kodikos: string;
  readonly base_url?: string;
  readonly cas_url?: string;
}

export interface ElegxosSessionApotelesma {
  readonly lixi: boolean;
  readonly aitia?: string;
}
