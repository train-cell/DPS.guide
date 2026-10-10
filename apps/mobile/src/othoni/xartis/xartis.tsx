import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as GeventoPedomati } from 'react';
import { Link } from 'react-router-dom';
import type { Enotita, Proapaitoumeno, XartisMathimatos } from '@dps/core';
import {
  Karta,
  MetrikosRing,
  OloniKatastasis,
  Pilegma,
  ProskelesioOmonimas,
} from '../../koinima/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { fortosi, sfalma } from '../../kathstasi/index.js';
import { fortose_xartis, pososto_aristeias, pseudos_xartis } from '../../pseudomata/index.js';

/** Λεπτά ανά ώρα, για τη μορφοποίηση του χρόνου εκτίμησης. */
export const LEPTA_PER_ORA = 60;

/** Μήνυμα κενού χάρτη, με οδηγίες αντί για σιωπή. */
export const MINIMA_KENOY_XARTI = 'Ο χάρτης δεν έχει ενότητες ακόμη. Επιστρέψτε όταν το eClass θα δημοσιεύσει την ύλη.';

/** Μήνυμα σφάλματος φόρτωσης του χάρτη. */
export const MINIMA_SFALMATOS_XARTI = 'Δεν ήταν δυνατή η φόρτωση του χάρτη του μαθήματος.';

/** Κωδικός σφάλματος δικτύου, κοινός σε όλα τα φορτωτά δεδομένα. */
export const KODIKOS_SFALMATOS_DIKTYOU = 'DIKTYO';

/** Κείμενο της ετικέτας όταν η ενότητα δεν έχει εκτίμηση χρόνου. */
export const CHORIS_ESTIMISI = 'Χωρίς εκτίμηση χρόνου';

/** Μετατρέπει λεπτά σε «ώρες και λεπτά», π.χ. 75 → «1 ζ 15 λ». */
export function stilise_lepta(lepta: number | null): string {
  if (lepta === null) {
    return CHORIS_ESTIMISI;
  }
  const ores = Math.floor(lepta / LEPTA_PER_ORA);
  const ipolipa = lepta % LEPTA_PER_ORA;
  if (ores === 0) {
    return `${ipolipa} λ`;
  }
  if (ipolipa === 0) {
    return `${ores} ζ`;
  }
  return `${ores} ζ ${ipolipa} λ`;
}

/** Μετατρέπει την ισχύ προαπαίτησης σε ελληνική λέξη. */
export function stilise_isxya(isxys: Proapaitoumeno['isxys']): string {
  return isxys === 'isxyri' ? 'ισχυρό' : 'ασθενικό';
}

/** Γράφει τη γραμμή «Προαπαιτείται: <id> (ισχυρό/ασθενικό)» μιας προαπαίτησης. */
export function grammi_proapasitis(proapasiti: Proapaitoumeno): string {
  return `Προαπαιτείται: ${proapasiti.enotita_id} (${stilise_isxya(proapasiti.isxys)})`;
}

/** Ιδιότητες της κάρτας μιας ενότητας του χάρτη. */
export interface KartaEnotitasProps {
  readonly enotita: Enotita;
  readonly tetagmeni: boolean;
  readonly allaxe_telia: (id: string) => void;
}

/** Κάρτα ενότητας: κλικ στην κάρτα ανοίγει τον οδηγό, το κουμπί τη σημειώνει ως ολοκληρωμένη. */
export function KartaEnotitas({ enotita, tetagmeni, allaxe_telia }: KartaEnotitasProps) {
  const simaProspatheias = useCallback(
    (gevento: GeventoPedomati<HTMLButtonElement>) => {
      gevento.preventDefault();
      gevento.stopPropagation();
      allaxe_telia(enotita.id);
    },
    [allaxe_telia, enotita.id]
  );

  return (
    <Link to={`/odigos/${enotita.id}`} data-testid="xartis-enotita">
      <Karta
        titlos={enotita.titlos}
        ypokeimeno={`Σειρά ${enotita.seira} · ${stilise_lepta(enotita.lepta_ektimisi)}`}
        akseis={<Pilegma keimeno={`Σειρά ${enotita.seira}`} entono={tetagmeni} />}
        stoixeia={
          <div>
            <div className="odoni-xeiris">
              {enotita.ennoies.map((ennea) => (
                <Pilegma key={ennea} keimeno={ennea} />
              ))}
            </div>
            <div className="enotita-kartela" data-testid="xartis-proiresi">
              {enotita.proapaitoumenes.length === 0 ? (
                <p className="enotita-xreomeni">Χωρίς προαπαιτούμενες</p>
              ) : (
                enotita.proapaitoumenes.map((proapasiti) => (
                  <p key={proapasiti.enotita_id} className="enotita-xreomeni">
                    {grammi_proapasitis(proapasiti)}
                  </p>
                ))
              )}
            </div>
            <button
              type="button"
              className="pilegma"
              aria-pressed={tetagmeni}
              data-testid="xartis-telegmenos"
              onClick={simaProspatheias}
            >
              {tetagmeni ? 'Ολοκληρώθηκε' : 'Σημείωση ως ολοκληρωμένη'}
            </button>
          </div>
        }
      />
    </Link>
  );
}

/** Ιδιότητες του χάρτη με τις ενότητες και τις ολοκληρωμένες επιλογές. */
export interface OdomosEnotitonProps {
  readonly xartis: XartisMathimatos;
  readonly telies: readonly string[];
  readonly allaxe_telia: (id: string) => void;
}

/** Ο χάρτης του μαθήματος: ενότητες ταξινομημένες κατά σειρά και δακτύλιος προόδου. */
export function OdomosEnotiton({ xartis, telies, allaxe_telia }: OdomosEnotitonProps) {
  const taxinomisi = [...xartis.enotites].sort((prwti, defteri) => prwti.seira - defteri.seira);
  return (
    <div>
      <div className="odoni-lista" data-testid="xartis-lista">
        {taxinomisi.map((enotita) => (
          <KartaEnotitas
            key={enotita.id}
            enotita={enotita}
            tetagmeni={telies.includes(enotita.id)}
            allaxe_telia={allaxe_telia}
          />
        ))}
      </div>
      <div className="simera-stoxos" data-testid="xartis-telos">
        <p className="simera-stoxos-titlos">Πρόοδος μαθήματος</p>
        <MetrikosRing
          pososto={pososto_aristeias(xartis.enotites, telies)}
          ypokeimeno={`${telies.length} από ${xartis.enotites.length} ενότητες`}
          ariaEtiketa="Πρόοδος μαθήματος"
        />
      </div>
    </div>
  );
}

/** Χάρτης ενοτήτων του επιλεγμένου μαθήματος με φόρτωση, κενό, σφάλμα και δεδομένα. */
export default function XartisEnotiton() {
  const [katastasi, setKatastasi] = useState<Katastasi<XartisMathimatos>>(fortosi<XartisMathimatos>());
  const [telies, setTelies] = useState<readonly string[]>([]);
  const [prospatheies, setProspatheies] = useState(0);

  useEffect(() => {
    let zontas = true;
    void fortose_xartis()
      .then((apothike) => {
        if (zontas) {
          setKatastasi(apothike);
        }
      })
      .catch(() => {
        if (zontas) {
          setKatastasi(
            sfalma({ kodikos: KODIKOS_SFALMATOS_DIKTYOU, minima: MINIMA_SFALMATOS_XARTI })
          );
        }
      });
    return () => {
      zontas = false;
    };
  }, [prospatheies]);

  const allaxe_telia = useCallback((id: string) => {
    setTelies((palies) =>
      palies.includes(id) ? palies.filter((telia) => telia !== id) : [...palies, id]
    );
  }, []);

  const epanalipsi = useCallback(() => {
    setKatastasi(fortosi<XartisMathimatos>());
    setProspatheies((prospathia) => prospathia + 1);
  }, []);

  return (
    <div className="episkefsi" data-testid="xartis-ekran">
      <ProskelesioOmonimas titlos="Χάρτης" ypokeimeno={pseudos_xartis().kodikos_mathimatos} />
      <OloniKatastasis katastasi={katastasi} adeioMinima={MINIMA_KENOY_XARTI} epanalipsi={epanalipsi}>
        {(xartis) => (
          <OdomosEnotiton xartis={xartis} telies={telies} allaxe_telia={allaxe_telia} />
        )}
      </OloniKatastasis>
    </div>
  );
}