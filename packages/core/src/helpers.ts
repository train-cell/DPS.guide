import type { Apotelesma, KodikosSfalmatos } from './contracts/apotelesma.js';

export function ok<T>(timi: T): Apotelesma<T> {
  return { ok: true, timi };
}

export function apotyxia<T = never>(
  kodikos: KodikosSfalmatos,
  minima: string,
  aitia?: unknown
): Apotelesma<T> {
  return {
    ok: false,
    sfalma: { kodikos, minima, aitia },
  };
}
