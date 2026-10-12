import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Mathima } from '@dps/core';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { fortosi, sfalma } from '../../kathstasi/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { fortose_mathimata_apo_apothiki } from '../../ypiresies/index.js';

/** Ετικέτα που σημαίνει ότι το μάθημα είναι ήδη συγχρονισμένο. */
export const MINIMA_SYNXRONISMENOU = 'Συγχρονισμένο';

/** Υπότιτλος της οθόνης με τα μαθήματα του χρήστη. */
export const YPOKEIMENO_MATHIMATON = 'Τα μαθήματά σου, όπως τα βλέπει το eClass.';

/** Μήνυμα κενής λίστας με οδηγίες, όχι απλώς «τίποτα». */
export const MINIMA_KENOY_LISTAS = 'Δεν έχεις εγγραφεί σε κανένα μάθημα ακόμη. Ξεκίνα από την αρχική σελίδα.';

/** Μήνυμα όταν η λίστα μαθημάτων δεν φορτώθηκε. */
export const MINIMA_SFALMATOS_LISTAS = 'Δεν ήταν δυνατή η φόρτωση των μαθημάτων από το eClass.';

/** Κωδικός σφάλματος δικτύου, κοινός σε όλα τα φορτωτά δεδομένα. */
export const KODIKOS_SFALMATOS_DIKTYOU = 'DIKTYO';

/** Κάρτα ενός μαθήματος που οδηγεί στον χάρτη ενοτήτων του με πλούσια UniStudents μεταδεδομένα. */
export function KartaMathimatos({
  mathima,
  einaiTrexon,
}: {
  readonly mathima: Mathima;
  readonly einaiTrexon?: boolean;
}) {
  const { allaxe_kodiko_mathimatos, kodikosMathimatos } = xrisiApothekisis();
  const energos = einaiTrexon ?? (kodikosMathimatos === mathima.kodikos);

  const akseis = (
    <div className="karta-mathimatos-akseis">
      {energos && <Pilegma entono keimeno="Ενεργό" />}
      {mathima.ects !== undefined && <Pilegma keimeno={`${mathima.ects} ECTS`} />}
      {mathima.epilegmeno ? (
        <Pilegma entono keimeno={MINIMA_SYNXRONISMENOU} />
      ) : (
        <Pilegma keimeno="Εκκρεμεί" />
      )}
    </div>
  );

  const ypokeimeno = [
    mathima.kodikos,
    mathima.examino,
    mathima.kathigitis ? `Καθ.: ${mathima.kathigitis}` : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Link
      to="/xartis"
      data-testid="mathimata-karta"
      className="karta-mathimatos-link"
      onClick={() => {
        allaxe_kodiko_mathimatos(mathima.kodikos);
      }}
    >
      <Karta titlos={mathima.titlos} ypokeimeno={ypokeimeno} akseis={akseis} />
    </Link>
  );
}

/** Λίστα μαθημάτων με φόρτωση, κενό, σφάλμα και δεδομένα πάνω από το OloniKatastasis. */
export default function Mathimata() {
  const periballon = xrisiPeriballontos();
  const { kodikosMathimatos } = xrisiApothekisis();
  const [katastasi, setKatastasi] = useState<Katastasi<readonly Mathima[]>>(fortosi<readonly Mathima[]>());
  const [prospatheies, setProspatheies] = useState(0);
  const [anazitisi, setAnazitisi] = useState('');
  const [filtro, setFiltro] = useState<'ola' | 'sygxronismena' | 'ekkremei'>('ola');

  useEffect(() => {
    let zontas = true;
    void fortose_mathimata_apo_apothiki(periballon.apothiki)
      .then((apothike) => {
        if (zontas) {
          setKatastasi(apothike);
        }
      })
      .catch(() => {
        if (zontas) {
          setKatastasi(sfalma({ kodikos: KODIKOS_SFALMATOS_DIKTYOU, minima: MINIMA_SFALMATOS_LISTAS }));
        }
      });
    return () => {
      zontas = false;
    };
  }, [periballon.apothiki, prospatheies]);

  const epanalipsi = useCallback(() => {
    setKatastasi(fortosi<readonly Mathima[]>());
    setProspatheies((prospathia) => prospathia + 1);
  }, []);

  return (
    <div className="episkefsi" data-testid="mathimata-ekran">
      <ProskelesioOmonimas titlos="Μαθήματα" ypokeimeno={YPOKEIMENO_MATHIMATON} />
      <OloniKatastasis katastasi={katastasi} adeioMinima={MINIMA_KENOY_LISTAS} epanalipsi={epanalipsi}>
        {(mathimata) => {
          const kathara = anazitisi.trim().toLowerCase();
          const filtroMathimata = mathimata.filter((m) => {
            const tairiaseiKeimeno =
              kathara.length === 0 ||
              m.kodikos.toLowerCase().includes(kathara) ||
              m.titlos.toLowerCase().includes(kathara) ||
              (m.kathigitis && m.kathigitis.toLowerCase().includes(kathara));

            if (!tairiaseiKeimeno) {
              return false;
            }

            if (filtro === 'sygxronismena') {
              return m.epilegmeno || m.katastasi_sygxronismou === MINIMA_SYNXRONISMENOU;
            }
            if (filtro === 'ekkremei') {
              return !m.epilegmeno && m.katastasi_sygxronismou !== MINIMA_SYNXRONISMENOU;
            }
            return true;
          });

          return (
            <>
              {mathimata.length > 1 && (
                <div className="mathimata-anazitisi-kouti">
                  <input
                    type="search"
                    className="proedri-travla-gramma"
                    placeholder="🔍 Αναζήτηση μαθήματος (π.χ. ΠΛΗ, Αλγόριθμοι)..."
                    value={anazitisi}
                    onChange={(e) => setAnazitisi(e.target.value)}
                    aria-label="Αναζήτηση μαθήματος"
                  />
                  <div className="kapsoules-filtra-mpara">
                    <button
                      type="button"
                      className={filtro === 'ola' ? 'kapsoula-filtrou energi' : 'kapsoula-filtrou'}
                      onClick={() => setFiltro('ola')}
                    >
                      Όλα ({mathimata.length})
                    </button>
                    <button
                      type="button"
                      className={filtro === 'sygxronismena' ? 'kapsoula-filtrou energi' : 'kapsoula-filtrou'}
                      onClick={() => setFiltro('sygxronismena')}
                    >
                      Συγχρονισμένα
                    </button>
                    <button
                      type="button"
                      className={filtro === 'ekkremei' ? 'kapsoula-filtrou energi' : 'kapsoula-filtrou'}
                      onClick={() => setFiltro('ekkremei')}
                    >
                      Εκκρεμή
                    </button>
                  </div>
                </div>
              )}
              <div className="odoni-lista" data-testid="mathimata-lista">
                {filtroMathimata.length === 0 ? (
                  <Karta
                    titlos="Δεν βρέθηκαν μαθήματα"
                    ypokeimeno="Δεν υπάρχει μάθημα που να ταιριάζει με την αναζήτηση."
                  />
                ) : (
                  filtroMathimata.map((mathima) => (
                    <KartaMathimatos
                      key={mathima.kodikos}
                      mathima={mathima}
                      einaiTrexon={mathima.kodikos === kodikosMathimatos}
                    />
                  ))
                )}
              </div>
            </>
          );
        }}
      </OloniKatastasis>
    </div>
  );
}