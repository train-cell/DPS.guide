import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as GeventoPedomati } from 'react';
import { Link } from 'react-router-dom';
import type { Enotita, XartisMathimatos } from '@dps/core';
import { xrisiApothekisis } from '../../apothiki/index.js';
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

/** Κείμενο του κουμπιού σήμανσης όσο η ενότητα δεν έχει ολοκληρωθεί. */
export const KEIMENO_STOXOU = 'Σημείωση ως ολοκληρωμένη';

/** Κείμενο του κουμπιού σήμανσης όταν η ενότητα έχει ολοκληρωθεί. */
export const KEIMENO_TELIOU = 'Ολοκληρώθηκε';

/** Ιδιότητες των μπλοκ της οθόνης Σήμερα, που παίρνουν έτοιμες ενότητες. */
export interface SimeraEnotitesProps {
  readonly enotites: readonly Enotita[];
}

/** Δακτύλιος προόδου μαθήματος: συνολικά λεπτά μελέτης και ποσοστό από τις αποθηκευμένες ολοκληρώσεις. */
export function MetrikesSimeras({ enotites }: SimeraEnotitesProps) {
  const apothiki = xrisiApothekisis();
  const telies = apothiki.proodhos.aristeiesEnotiton;
  const synolika_leqta = lepita_aristeias(enotites);
  const pososto = pososto_aristeias(enotites, telies);

  return (
    <div data-testid="simera-daiktylos">
      <Karta
        titlos="Πρόοδος μαθήματος"
        ypokeimeno={`${synolika_leqta} λεπτά αναμένουν στο σύνολο του μαθήματος`}
        stoixeia={
          <div className="karta-metrika">
            <MetrikosRing
              pososto={pososto}
              ypokeimeno={`${telies.length} από ${enotites.length} ολοκληρωμένες ενότητες`}
              ariaEtiketa="Πρόοδος μαθήματος"
            />
          </div>
        }
      />
    </div>
  );
}

/** Ιδιότητες μιας ενότητας-στόχου στην οθόνη Σήμερα. */
export interface StoxoiEnotitasProps {
  readonly enotita: Enotita;
  readonly tetagmeni: boolean;
  readonly allaxe_telia: (id: string) => Promise<void>;
}

/** Ενότητα-στόχος με τον δεσμό προς τον οδό μελέτης και το κουμπί σήμανσης ολοκλήρωσης. */
export function StoxosEnotitas({ enotita, tetagmeni, allaxe_telia }: StoxoiEnotitasProps) {
  const simaProspatheias = useCallback(
    async (gevento: GeventoPedomati<HTMLButtonElement>): Promise<void> => {
      gevento.preventDefault();
      await allaxe_telia(enotita.id);
    },
    [allaxe_telia, enotita.id]
  );

  return (
    <div className="simera-stoxos" data-testid="simera-stochos">
      <Link to={`/odigos/${enotita.id}`} className="simera-stoxos-titlos">
        {enotita.titlos}
      </Link>
      <div className="odoni-xeiris">
        <Pilegma
          keimeno={
            enotita.lepta_ektimisi === null
              ? LEPTA_CHORIS_EKTIMISI
              : `${enotita.lepta_ektimisi} λεπτά`
          }
        />
        <button
          type="button"
          className={`pilegma${tetagmeni ? ' pilegma-entono' : ''}`}
          aria-pressed={tetagmeni}
          data-testid="simera-telos"
          onClick={simaProspatheias}
        >
          {tetagmeni ? KEIMENO_TELIOU : KEIMENO_STOXOU}
        </button>
      </div>
    </div>
  );
}

/** Λίστα «Στοχοί σήμερα» με τις πρώτες ενότητες του χάρτη, σημεισμένες από την αποθηκευμένη πρόοδο. */
export function StochoiSimeras({ enotites }: SimeraEnotitesProps) {
  const apothiki = xrisiApothekisis();
  const telies = apothiki.proodhos.aristeiesEnotiton;

  const stoichia = enotites.slice(0, PLITOS_STOCHOIS).map((enotita) => (
    <StoxosEnotitas
      key={enotita.id}
      enotita={enotita}
      tetagmeni={telies.includes(enotita.id)}
      allaxe_telia={apothiki.allaxe_telia}
    />
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
  const [proseis, set_proseis] = useState(0);

  const epanalipsi = useCallback(() => {
    set_katastasi(fortosi<XartisMathimatos>());
    set_proseis((palies) => palies + 1);
  }, []);

  useEffect(() => {
    let zontas = true;
    void fortose_xartis().then((fortotiki) => {
      if (zontas) {
        set_katastasi(fortotiki);
      }
    });
    return () => {
      zontas = false;
    };
  }, [proseis]);

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