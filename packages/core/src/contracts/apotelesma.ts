export type KodikosSfalmatos =
  | 'AUTH_APOTYXIA'
  | 'SESSION_LIXI'
  | 'DIKTYO'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'MI_EGKYRO_SXIMA'
  | 'DEN_VRETHIKE'
  | 'MI_YPOSTIRIZOMENO'
  | 'PROYPOLOGISMOS'
  | 'AKYROTHIKE'
  | 'AGNOSTO';

export interface Sfalma {
  kodikos: KodikosSfalmatos;
  minima: string;
  aitia?: unknown;
}

export type Apotelesma<T> =
  | { ok: true; timi: T }
  | { ok: false; sfalma: Sfalma };
