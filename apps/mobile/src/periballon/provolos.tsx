import { createContext, useContext } from 'react';
import type { Periballon } from './periballon.js';

const PeriballonSunexo = createContext<Periballon | null>(null);

/** Ιδιότητες του παρόχου περιβάλλοντος. */
export interface ParoxosProps {
  readonly children: React.ReactNode;
  /** Το έτοιμο runtime της εφαρμογής· τα tests περνούν test-only fixtures. */
  readonly periballon?: Periballon;
}

/** Παρέχει το περιβάλλον πυλών σε ολόκληρη την εφαρμογή. */
export function ParoxosPeriballontos({ children, periballon }: ParoxosProps) {
  return <PeriballonSunexo.Provider value={periballon ?? null}>{children}</PeriballonSunexo.Provider>;
}

/** Πρόσβαση στο production runtime ή σαφές σφάλμα αν παραλείφθηκε ο provider. */
export function xrisiPeriballontos(): Periballon {
  const periballon = useContext(PeriballonSunexo);
  if (periballon === null) throw new Error('Λείπει το production Periballon provider.');
  return periballon;
}

/** Optional context read for components that also accept explicit test ports. */
export function xrisiPeriballontosProairetika(): Periballon | null {
  return useContext(PeriballonSunexo);
}
