import type { ReactNode } from 'react';
import type { Katastasi } from '../kathstasi/index.js';
import { IonButton, IonSpinner } from '@ionic/react';
import './koinima.css';

/** Ιδιότητες του τριών καταστάσεων wrapper. */
export interface OloniKatastasisProps<T> {
  /** Η τρέχουσα κατάσταση, όπως την παρέδωσε ο loader. */
  readonly katastasi: Katastasi<T>;
  /** Περιεχόμενο όταν η κατάσταση είναι etimo. */
  readonly children: (dedomena: T) => ReactNode;
  /** Μήνυμα όταν η λίστα είναι κενή. */
  readonly adeioMinima?: string;
  /** Κείμενο του κουμπιού επανάληψης σε σφάλμα. */
  readonly epanalipsiMinima?: string;
  /** Επανάληψη φόρτωσης όταν το χρήστη ζητήσει retry. */
  readonly epanalipsi?: () => void;
}

/** Επικεφαλίδα οθόνης με τίτλο και προαιρετικό υπότιτλο. */
export function ProskelesioOmonimas({
  titlos,
  ypokeimeno,
  akseis,
}: {
  readonly titlos: string;
  readonly ypokeimeno?: string;
  readonly akseis?: ReactNode;
}) {
  return (
    <header className="proskelesio">
      {akseis !== undefined && <div className="odoni-xeiris">{akseis}</div>}
      <h1 className="proskelesio-titlos">{titlos}</h1>
      {ypokeimeno !== undefined && <p className="proskelesio-ypokeimeno">{ypokeimeno}</p>}
    </header>
  );
}

/** Εμφανίζει φόρτωση, κενό, σφάλμα ή δεδομένα — ποτέ λευκή οθόνη (κανόνας three-state). */
export function OloniKatastasis<T>({
  katastasi,
  children,
  adeioMinima = 'Δεν υπάρχει τίποτα να δείξουμε ακόμη.',
  epanalipsiMinima = 'Δοκίμασε ξανά',
  epanalipsi,
}: OloniKatastasisProps<T>) {
  if (katastasi.katastasi === 'fortosi') {
    return (
      <div className="katastasi-periochos" data-testid="katastasi-fortosi">
        <IonSpinner name="crescent" aria-label="Φόρτωση" />
        <p className="katastasi-ypokeimeno">Φορτώνει…</p>
      </div>
    );
  }

  if (katastasi.katastasi === 'adeio') {
    return (
      <div className="katastasi-periochos" data-testid="katastasi-adeio">
        <p className="katastasi-mfto">Τίποτα ακόμη</p>
        <p className="katastasi-ypokeimeno">{adeioMinima}</p>
      </div>
    );
  }

  if (katastasi.katastasi === 'sfalma') {
    return (
      <div className="katastasi-periochos" data-testid="katastasi-sfalma">
        <div className="sfalta">
          <p className="sfalta-titlos">⚠ Δεν πήγε καλά</p>
          <p className="sfalta-kodikos">{katastasi.sfalma.kodikos}</p>
          <p className="sfalta-minima">{katastasi.sfalma.minima}</p>
          {epanalipsi !== undefined && (
            <IonButton size="small" onClick={epanalipsi} data-testid="epanalipsi">
              {epanalipsiMinima}
            </IonButton>
          )}
        </div>
      </div>
    );
  }

  return <>{children(katastasi.dedomena)}</>;
}