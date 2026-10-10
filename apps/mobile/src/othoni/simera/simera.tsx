import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Enotita, XartisMathimatos } from '@dps/core';
import {
  Karta,
  MetrikosRing,
  OloniKatastasis,
  Pilegma,
  ProskelesioOmonimas,
} from '../../koinima/index.js';
import { fortosi, type Katastasi } from '../../kathstasi/index.js';
import { fortose_xartis, lepita_aristeias, pososto_aristeias } from '../../pseudomata/index.js';

/** Πόσες ενότητες του χάρτη προτείνονται ως στόχοι της ημέρας. */
const PLITOS_STOCHOIS = 3;

/** Κείμενο πότε η ενότητα δεν έχει εκτιμώμενη διάρκεια. */
const LEPTA_CHORIS_EKTIMISI = 'χωρίς εκτίμηση';

/** Οι ενότητες με ολοκληρωμένη μελέτη· κενές όσο δεν υπάρχει ακόμη κράτηση προόδου. */
const ARISTEIES_ENOTITON: readonly string[] = Object.freeze([]);

/** Ιδιότητες των μπλοκ της οθόνης Σήμερα, που παίρνουν έτοιμες ενότητες. */
export interface SimeraEnotitesProps {
  readonly enotites: readonly Enotita[];
}

/** Δακτύλιος προόδου μαθήματος: συνολικά λεπτά μελέτης και ποσοστό ολοκλήρωσης. */
export function MetrikesSimeras({ enotites }: SimeraEnotitesProps) {
  const synolika_leqta = lepita_aristeias(enotites);
  const pososto = pososto_aristeias(enotites, ARISTEIES_ENOTITON);

  return (
    <div data-testid="simera-daiktylos">
      <Karta
        titlos="Πρόοδος μαθήματος"
        ypokeimeno={`${synolika_leqta} λεπτά αναμένουν στο σύνολο του μαθήματος`}
        stoixeia={
          <div className="karta-metrika">
            <MetrikosRing
              pososto={pososto}
              ypokeimeno="ολοκληρωμένες ενότητες"
              ariaEtiketa="Πρόοδος μαθήματος"
            />
          </div>
        }
      />
    </div>
  );
}

/** Λίστα «Στοχοί σήμερα» με τις πρώτες ενότητες του χάρτη, δεσμένες στον οδό μελέτης τους. */
export function StochoiSimeras({ enotites }: SimeraEnotitesProps) {
  const stoichia = enotites.slice(0, PLITOS_STOCHOIS).map((enotita) => (
    <Link
      key={enotita.id}
      to={`/odigos/${enotita.id}`}
      className="simera-stoxos"
      data-testid="simera-stochos"
    >
      <span className="simera-stoxos-titlos">{enotita.titlos}</span>
      <Pilegma
        keimeno={
          enotita.lepta_ektimisi === null
            ? LEPTA_CHORIS_EKTIMISI
            : `${enotita.lepta_ektimisi} λεπτά`
        }
      />
    </Link>
  ));

  return (
    <div data-testid="simera-stoxoi">
      <Karta titlos="Στοχοί σήμερα" stoixeia={stoichia} />
    </div>
  );
}

/** Οθόνη «Σήμερα»: η αρχική καρτέλα με πρόοδο μαθήματος και τους στόχους της ημέρας. */
export function Simera() {
  const [katastasi, set_katastasi] = useState<Katastasi<XartisMathimatos>>(
    fortosi<XartisMathimatos>()
  );

  const epanalipsi = useCallback(() => {
    set_katastasi(fortosi<XartisMathimatos>());
    void fortose_xartis().then((fortotiki) => set_katastasi(fortotiki));
  }, []);

  useEffect(() => {
    epanalipsi();
  }, [epanalipsi]);

  return (
      <div className="odoni-lista" data-testid="simera-ekran">
        <ProskelesioOmonimas
          titlos="Σήμερα"
          ypokeimeno="Η πρόοδός σου στο μάθημα, με μία ματιά"
        />
        <OloniKatastasis
          katastasi={katastasi}
          adeioMinima="Δεν υπάρχουν ενότητες για να προτείνουμε σήμερα."
          epanalipsi={epanalipsi}
        >
          {(xartis) => (
            <>
              <MetrikesSimeras enotites={xartis.enotites} />
              <StochoiSimeras enotites={xartis.enotites} />
            </>
          )}
        </OloniKatastasis>
      </div>
  );
}

export default Simera;
