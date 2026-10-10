import { ZONE_ORAS } from '@dps/core';

const MORFH_ATHINAS = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE_ORAS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function imeras_athinas(paralimpo: Date): string {
  let xronia = '0000';
  let mhnes = '00';
  let imera = '00';
  for (const meros of MORFH_ATHINAS.formatToParts(paralimpo)) {
    if (meros.type === 'year') {
      xronia = meros.value;
    } else if (meros.type === 'month') {
      mhnes = meros.value;
    } else if (meros.type === 'day') {
      imera = meros.value;
    }
  }
  return `${xronia}-${mhnes}-${imera}`;
}