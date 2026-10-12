import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Mathima } from '@dps/core';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { fortosi, sfalma } from '../../kathstasi/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
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
export function KartaMathimatos({ mathima }: { readonly mathima: Mathima }) {
  const akseis = (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
    <Link to="/xartis" data-testid="mathimata-karta" style={{ textDecoration: 'none' }}>
      <Karta titlos={mathima.titlos} ypokeimeno={ypokeimeno} akseis={akseis} />
    </Link>
  );
}

/** Λίστα μαθημάτων με φόρτωση, κενό, σφάλμα και δεδομένα πάνω από το OloniKatastasis. */
export default function Mathimata() {
  const periballon = xrisiPeriballontos();
  const [katastasi, setKatastasi] = useState<Katastasi<readonly Mathima[]>>(fortosi<readonly Mathima[]>());
  const [prospatheies, setProspatheies] = useState(0);

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
        {(mathimata) => (
          <div className="odoni-lista" data-testid="mathimata-lista">
            {mathimata.map((mathima) => (
              <KartaMathimatos key={mathima.kodikos} mathima={mathima} />
            ))}
          </div>
        )}
      </OloniKatastasis>
    </div>
  );
}