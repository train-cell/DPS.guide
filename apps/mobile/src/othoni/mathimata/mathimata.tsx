import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IonButton, IonProgressBar } from '@ionic/react';
import type { Mathima, Arxeio } from '@dps/core';
import { Karta, OloniKatastasis, Pilegma, ProskelesioOmonimas } from '../../koinima/index.js';
import type { Katastasi } from '../../kathstasi/index.js';
import { fortosi, sfalma } from '../../kathstasi/index.js';
import { xrisiPeriballontos } from '../../periballon/index.js';
import { xrisiApothekisis } from '../../apothiki/index.js';
import { fortose_mathimata_apo_apothiki } from '../../ypiresies/index.js';
import { epanasygxronise_mathimata_apo_apothiki } from '../../ypiresies/syndesi-eclass.js';
import { fortose_eurethrio } from '../../provoli-pdf/provoli-ypiresies.js';
import { me_tilemetria } from '../../tilemetria/tilemetria.js';

/** Μετατρέπει μέγεθος byte σε ευανάγνωστη μορφή KB/MB. */
export function morfopoiise_megethos_arxeiou(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return 'Άγνωστο';
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/** Προβολή δέντρου αρχείων μαθήματος με συνδέσμους προς το PDF reader. */
export function DentroArxeionMathimatos({
  mathima,
}: {
  readonly mathima: Mathima;
}) {
  const periballon = xrisiPeriballontos();
  const [arxeia, setArxeia] = useState<readonly Arxeio[]>([]);
  const [fortonei, setFortonei] = useState(true);

  useEffect(() => {
    let active = true;
    void fortose_eurethrio(periballon.apothiki, mathima.kodikos).then((apotelema) => {
      if (active) {
        if (apotelema.ok) {
          setArxeia(apotelema.timi);
        }
        setFortonei(false);
      }
    });
    return () => {
      active = false;
    };
  }, [periballon.apothiki, mathima.kodikos]);

  if (fortonei || arxeia.length === 0) {
    return null;
  }

  return (
    <div className="mathima-dentro-arxeion" data-testid={`mathima-dentro-arxeion-${mathima.kodikos}`}>
      <span className="dentro-arxeion-titlos">Έγγραφα &amp; Αρχεία ({arxeia.length})</span>
      <ul className="dentro-arxeion-lista">
        {arxeia.map((arxeio) => {
          const onomaArxeiou = arxeio.diadromi.split('/').pop() || arxeio.id;
          return (
            <li key={arxeio.id} className="dentro-arxeio-stoixeio">
              <Link
                to={`/provoli/${encodeURIComponent(arxeio.id)}/1`}
                className="dentro-arxeio-link"
                data-testid="arxeio-pdf-link"
              >
                <span className="arxeio-onoma">📄 {onomaArxeiou}</span>
                <span className="arxeio-megethos">{morfopoiise_megethos_arxeiou(arxeio.megethos)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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

/** Στάδια της διαδικασίας συγχρονισμού από το LMS. */
export const STADIA_SYGXRONISMOU: readonly string[] = [
  'Σύνδεση στο LMS & ανάκτηση λίστας μαθημάτων...',
  'Έλεγχος νέων αρχείων & λήψη...',
  'Κρυπτογράφηση & αποθήκευση στο vault...',
];

/** Ιδιότητες προόδου συγχρονισμού. */
export interface ProodosSygxronismouProps {
  readonly stadio?: number;
  readonly pososto?: number;
}

/** Component αναλυτικής προόδου συγχρονισμού με granular feedback και IonProgressBar. */
export function ProodosSygxronismou({
  stadio = 1,
  pososto,
}: ProodosSygxronismouProps) {
  const trexonStadio = Math.max(1, Math.min(STADIA_SYGXRONISMOU.length, stadio));
  const telikoPososto = pososto !== undefined
    ? Math.max(0, Math.min(100, Math.round(pososto)))
    : Math.round((trexonStadio / STADIA_SYGXRONISMOU.length) * 100);
  const trexonKeimeno = STADIA_SYGXRONISMOU[trexonStadio - 1] ?? STADIA_SYGXRONISMOU[0];

  return (
    <div
      className="proodos-sygxronismou-kouti"
      data-testid="mathimata-proodos-sygxronismou"
      role="status"
      aria-live="polite"
    >
      <div className="proodos-sygxronismou-kefali">
        <span className="proodos-sygxronismou-stadio-titlos">
          Στάδιο {trexonStadio} από {STADIA_SYGXRONISMOU.length}
        </span>
        <span className="proodos-sygxronismou-pososto" data-testid="proodos-pososto">
          {telikoPososto}%
        </span>
      </div>

      <div
        className="proodos-sygxronismou-mpara-periexon"
        role="progressbar"
        aria-valuenow={telikoPososto}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={trexonKeimeno}
      >
        <IonProgressBar value={telikoPososto / 100} />
      </div>

      <div className="proodos-sygxronismou-keimeno">
        {trexonKeimeno}
      </div>

      <ul className="proodos-sygxronismou-stadia-lista">
        {STADIA_SYGXRONISMOU.map((titlosStadiou, deiktis) => {
          const arithmos = deiktis + 1;
          const olokliromeno = trexonStadio > arithmos;
          const trexon = trexonStadio === arithmos;
          return (
            <li
              key={titlosStadiou}
              className={`proodos-stadio-stoixeio${olokliromeno ? ' olokliromeno' : ''}${trexon ? ' trexon' : ''}`}
            >
              <span className="proodos-stadio-simio">
                {olokliromeno ? '✓' : arithmos}
              </span>
              <span className="proodos-stadio-titlos">{titlosStadiou}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
  const [sygxronizetai, setSygxronizetai] = useState(false);
  const [stadioSygxronismou, setStadioSygxronismou] = useState(1);
  const [posostoSygxronismou, setPosostoSygxronismou] = useState(20);
  const [minimaSygxronismou, setMinimaSygxronismou] = useState<{
    readonly typos: 'epitychia' | 'sfalma';
    readonly keimeno: string;
  } | null>(null);

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

  const sygxronise = useCallback(async () => {
    setSygxronizetai(true);
    setStadioSygxronismou(1);
    setPosostoSygxronismou(20);
    setMinimaSygxronismou(null);

    const xronodiakoptis = setInterval(() => {
      setPosostoSygxronismou((palio) => {
        if (palio < 50) {
          return palio + 15;
        }
        if (palio < 80) {
          setStadioSygxronismou(2);
          return palio + 15;
        }
        if (palio < 95) {
          setStadioSygxronismou(3);
          return palio + 5;
        }
        return palio;
      });
    }, 350);

    try {
      await me_tilemetria(
        'sygxronismos_mathimaton',
        async () => {
          const result = await epanasygxronise_mathimata_apo_apothiki(periballon);
          if (!result.ok) {
            setMinimaSygxronismou({ typos: 'sfalma', keimeno: result.sfalma.minima });
            return;
          }
          setStadioSygxronismou(3);
          setPosostoSygxronismou(100);
          const refreshed = await fortose_mathimata_apo_apothiki(periballon.apothiki);
          setKatastasi(refreshed);
          setMinimaSygxronismou({
            typos: 'epitychia',
            keimeno: `Ο συγχρονισμός ολοκληρώθηκε για ${result.timi.length} μαθήματα.`,
          });
        },
        { onoma_leitourgias: 'sygxronise' }
      );
    } catch {
      setMinimaSygxronismou({
        typos: 'sfalma',
        keimeno: 'Ο συγχρονισμός απέτυχε. Έλεγξε τη σύνδεση και δοκίμασε ξανά.',
      });
    } finally {
      clearInterval(xronodiakoptis);
      setSygxronizetai(false);
    }
  }, [periballon]);

  const kenoCta = (
    <Link to="/proedri" className="pilegma pilegma-entono" data-testid="mathimata-keno-cta">
      Σύνδεση στο eClass →
    </Link>
  );

  return (
    <div className="episkefsi" data-testid="mathimata-ekran">
      <ProskelesioOmonimas titlos="Μαθήματα" ypokeimeno={YPOKEIMENO_MATHIMATON} />
      <div className="mathimata-sygxronismos" data-testid="mathimata-sygxronismos">
        <IonButton type="button" onClick={() => void sygxronise()} disabled={sygxronizetai}>
          {sygxronizetai ? 'Συγχρονισμός σε εξέλιξη…' : 'Συγχρονισμός από LMS'}
        </IonButton>
        {sygxronizetai && (
          <ProodosSygxronismou
            stadio={stadioSygxronismou}
            pososto={posostoSygxronismou}
          />
        )}
        {minimaSygxronismou !== null && !sygxronizetai && (
          <p role={minimaSygxronismou.typos === 'sfalma' ? 'alert' : 'status'}>
            {minimaSygxronismou.keimeno}
          </p>
        )}
      </div>
      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima={MINIMA_KENOY_LISTAS}
        adeioAksi={kenoCta}
        epanalipsi={epanalipsi}
      >
        {(mathimata) => {
          if (mathimata.length === 0) {
            return (
              <div className="odoni-lista" data-testid="mathimata-lista">
                <div className="mathimata-keno-kouti" data-testid="mathimata-keno-perioxi">
                  <Karta
                    titlos="Δεν υπάρχουν μαθήματα"
                    ypokeimeno={MINIMA_KENOY_LISTAS}
                    akseis={kenoCta}
                  />
                </div>
              </div>
            );
          }

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
                    <div
                      key={mathima.kodikos}
                      className="mathima-kartela"
                      data-testid={`mathima-kartela-${mathima.kodikos}`}
                    >
                      <KartaMathimatos
                        mathima={mathima}
                        einaiTrexon={mathima.kodikos === kodikosMathimatos}
                      />
                      <DentroArxeionMathimatos mathima={mathima} />
                    </div>
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
