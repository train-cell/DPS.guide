import type { Enotita } from '@dps/core';

/** Total estimated study time from the actual course map. */
export function lepita_aristeias(enotites: readonly Enotita[]): number {
  return enotites.reduce((total, unit) => total + (unit.lepta_ektimisi ?? 0), 0);
}

/** Completed share for the actual course map. */
export function pososto_aristeias(enotites: readonly Enotita[], completed: readonly string[]): number {
  if (enotites.length === 0) return 0;
  return completed.filter((id) => enotites.some((unit) => unit.id === id)).length / enotites.length;
}
