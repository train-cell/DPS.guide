import { createContext, useContext } from 'react';
import type { Periballon } from './periballon.js';
import { ftiaxe_periballon } from './periballon.js';

const PeriballonSunexo = createContext<Periballon | null>(null);

/** Το τυχόν σταθερό περιβάλλον πυλών για οθόνες που αποδίδονται χωρίς Provider. */
let orioPeriballontos: Periballon | null = null;

/** Επιστρέφει το σταθερό εφεδρικό περιβάλλον, ώστε η ταυτότητά του να μην αλλάζει ανά render. */
function periballonXorisProvolo(): Periballon {
  orioPeriballontos ??= ftiaxe_periballon();
  return orioPeriballontos;
}

/** Ιδιότητες του παρόχου περιβάλλοντος. */
export interface ParoxosProps {
  readonly children: React.ReactNode;
  /** Προαιρετικό έτοιμο περιβάλλον (tests)· προεπιλογή το ψεύτικο περιβάλλον πυλών. */
  readonly periballon?: Periballon;
}

/** Παρέχει το περιβάλλον πυλών σε ολόκληρη την εφαρμογή. */
export function ParoxosPeriballontos({ children, periballon }: ParoxosProps) {
  return <PeriballonSunexo.Provider value={periballon ?? periballonXorisProvolo()}>{children}</PeriballonSunexo.Provider>;
}

/** Πρόσβαση στο περιβάλλον· χωρίς Provider επιστρέφει σταθερό ψεύτικο περιβάλλον (ποτέ null). */
export function xrisiPeriballontos(): Periballon {
  return useContext(PeriballonSunexo) ?? periballonXorisProvolo();
}
