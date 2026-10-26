import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ftiaxe_dokimastiki_exetasi,
  vathmologise_exetasi,
  type ApotelesmaExetasis,
  type AutoelegchosErwtisi,
  type DokimastikiExetasi as DokimastikiExetasiData,
} from '../../ypiresies/exetasi-simulator.js';

/**
 * Στάδιο κατάστασης της προσομοίωσης διαγωνίσματος.
 */
export type StadioExetasis = 'anamoni' | 'se_exelixi' | 'olokliromeno';

/**
 * Ιδιότητες component δοκιμαστικής εξέτασης.
 */
export interface DokimastikiExetasiProps {
  readonly kodikosMathimatos: string;
  readonly erwtiseis: readonly AutoelegchosErwtisi[];
  readonly apodosi?: Record<string, number>;
  readonly orioErwtiseon?: number;
  readonly arxikoStadio?: StadioExetasis;
  readonly arxikesApantiseis?: Record<number, string>;
  readonly deuteroleptaDiarkeias?: number;
  readonly onOloklirosi?: (apotelesma: ApotelesmaExetasis) => void;
}

/**
 * Μορφοποιεί δευτερόλεπτα σε μορφή MM:SS.
 */
export function morfopoiisi_antistrofis_metrisis(defterolepta: number): string {
  const d = Math.max(0, Math.floor(defterolepta));
  const lepta = Math.floor(d / 60);
  const ypoloipo = d % 60;
  return `${String(lepta).padStart(2, '0')}:${String(ypoloipo).padStart(2, '0')}`;
}

/**
 * Component δοκιμαστικής εξέτασης (Mock Exam Simulator).
 *
 * Συμμορφώνεται 100% με τον κανόνα D11 (dark-only tokens, zero inline styles, zero raw hex).
 */
export function DokimastikiExetasi({
  kodikosMathimatos,
  erwtiseis,
  apodosi,
  orioErwtiseon = 5,
  arxikoStadio = 'anamoni',
  arxikesApantiseis = {},
  deuteroleptaDiarkeias,
  onOloklirosi,
}: DokimastikiExetasiProps) {
  const [stadio, setStadio] = useState<StadioExetasis>(arxikoStadio);
  const [apantiseis, setApantiseis] = useState<Record<number, string>>(arxikesApantiseis);

  // Δημιουργία δοκιμαστικής εξέτασης
  const exetasi: DokimastikiExetasiData = useMemo(() => {
    return ftiaxe_dokimastiki_exetasi(
      kodikosMathimatos,
      [...erwtiseis],
      apodosi,
      orioErwtiseon
    );
  }, [kodikosMathimatos, erwtiseis, apodosi, orioErwtiseon]);

  const synolikaDefterolepta = deuteroleptaDiarkeias ?? exetasi.xronos_lepta * 60;
  const [apomenonXronos, setApomenonXronos] = useState<number>(synolikaDefterolepta);

  const [apotelesma, setApotelesma] = useState<ApotelesmaExetasis | null>(() => {
    if (arxikoStadio === 'olokliromeno') {
      return vathmologise_exetasi(exetasi, arxikesApantiseis);
    }
    return null;
  });

  // Υποβολή και βαθμολόγηση
  const ypovoli = useCallback(() => {
    const vathmologisi = vathmologise_exetasi(exetasi, apantiseis);
    setApotelesma(vathmologisi);
    setStadio('olokliromeno');
    if (onOloklirosi) {
      onOloklirosi(vathmologisi);
    }
  }, [exetasi, apantiseis, onOloklirosi]);

  // Χρονόμετρο αντίστροφης μέτρησης
  useEffect(() => {
    if (stadio !== 'se_exelixi') {
      return;
    }
    if (apomenonXronos <= 0) {
      ypovoli();
      return;
    }
    const timerId = setInterval(() => {
      setApomenonXronos((palio) => {
        if (palio <= 1) {
          clearInterval(timerId);
          ypovoli();
          return 0;
        }
        return palio - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [stadio, apomenonXronos, ypovoli]);

  const xekiniseExetasi = () => {
    setApomenonXronos(synolikaDefterolepta);
    setApantiseis({});
    setApotelesma(null);
    setStadio('se_exelixi');
  };

  const epanekkinisi = () => {
    setApomenonXronos(synolikaDefterolepta);
    setApantiseis({});
    setApotelesma(null);
    setStadio('anamoni');
  };

  // 1. Κατάσταση αναμονής (Idle / Start button)
  if (stadio === 'anamoni') {
    return (
      <div className="exetasi-plaisio">
        <div className="exetasi-kefali">
          <h3 className="exetasi-titlos">Προσομοίωση Διαγωνίσματος</h3>
          <span className="pilegma">{kodikosMathimatos}</span>
        </div>
        <p className="exetasi-erwtisi-keimeno">
          Δοκιμάστε τις γνώσεις σας σε συνθήκες πραγματικής εξέτασης. Επιλέγονται
          κατά προτεραιότητα θέματα υψηλής απόδοσης.
        </p>
        <div className="exetasi-metriseis-grammi">
          <span>Ερωτήσεις: {exetasi.erwtiseis.length}</span>
          <span>Διάρκεια: {exetasi.xronos_lepta} λεπτά</span>
        </div>
        <button
          type="button"
          className="pilegma pilegma-entono odigos-start-mock-exam"
          data-testid="odigos-start-mock-exam"
          onClick={xekiniseExetasi}
        >
          Έναρξη Προσομοίωσης Διαγωνίσματος
        </button>
      </div>
    );
  }

  // 2. Κατάσταση ολοκλήρωσης (Results / Alert)
  if (stadio === 'olokliromeno' && apotelesma !== null) {
    return (
      <div
        className="exetasi-apotelesmata"
        data-testid="exetasi-apotelesmata"
        role="alert"
        aria-live="assertive"
      >
        <div className="exetasi-apotelesmata-kefali">
          <h3 className="exetasi-apotelesmata-titlos">Αποτελέσματα Προσομοίωσης</h3>
          <div className="exetasi-skor-emvlima">
            <span className="exetasi-skor-arithmos">{apotelesma.teliko_skor}%</span>
            <span className="exetasi-skor-katastasi">
              {apotelesma.epitixia ? 'Επιτυχής Επίδοση' : 'Χρειάζεται Επανάληψη'}
            </span>
          </div>
        </div>

        <div className="exetasi-metriseis-grammi">
          <span>
            Σωστές: {apotelesma.sostes_apantiseis} από {apotelesma.synolo_erwtiseon}
          </span>
          <span>Λάθος: {apotelesma.lathos_apantiseis}</span>
        </div>

        <div className="exetasi-analysi-ennoion">
          <h4 className="exetasi-titlos">Ανάλυση ανά Έννοια</h4>
          {Object.entries(apotelesma.analysi_ana_ennoia).map(([ennoia, stats]) => (
            <div key={ennoia} className="exetasi-ennoia-grammi">
              <span className="exetasi-ennoia-onoma">{ennoia}</span>
              <span className="exetasi-ennoia-pososto">
                {stats.pososto}% ({stats.sostes}/{stats.synolo})
              </span>
            </div>
          ))}
        </div>

        <div className="exetasi-analytikes-apantiseis">
          <h4 className="exetasi-titlos">Αναλυτικές Απαντήσεις</h4>
          {apotelesma.analytikes_apantiseis.map((a) => (
            <div
              key={a.id}
              className={`exetasi-apantisi-kouti ${a.einai_sosto ? 'sosto' : 'lathos'}`}
            >
              <p className="exetasi-erwtisi-keimeno">
                <strong>Ερώτηση {a.id}:</strong> {a.erwtisi}
              </p>
              <p className="exetasi-erwtisi-deiktis">
                Απάντησή σας: {a.apantisi_xristi || '(Καμία επιλογή)'}{' '}
                {a.einai_sosto ? '✓' : '✗'}
              </p>
              {!a.einai_sosto && (
                <p className="exetasi-erwtisi-deiktis">
                  Σωστή απάντηση: {a.sosti_apantisi}
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="pilegma pilegma-entono odigos-start-mock-exam"
          data-testid="odigos-start-mock-exam"
          onClick={epanekkinisi}
        >
          Νέα Προσομοίωση
        </button>
      </div>
    );
  }

  // 3. Κατάσταση εξέλιξης (Exam In-Progress)
  return (
    <div className="exetasi-plaisio">
      <div className="exetasi-kefali">
        <div>
          <h3 className="exetasi-titlos">Προσομοίωση Διαγωνίσματος</h3>
          <span className="pilegma">{kodikosMathimatos}</span>
        </div>
        <div
          className="exetasi-countdown"
          data-testid="exetasi-countdown"
          role="timer"
          aria-label={`Υπολειπόμενος χρόνος: ${morfopoiisi_antistrofis_metrisis(apomenonXronos)}`}
        >
          ⏱️ {morfopoiisi_antistrofis_metrisis(apomenonXronos)}
        </div>
      </div>

      <div className="exetasi-analytikes-apantiseis">
        {exetasi.erwtiseis.map((q) => {
          return (
            <div key={q.id} className="exetasi-erwtisi-kouti">
              <div className="exetasi-erwtisi-kefali">
                <span className="exetasi-erwtisi-deiktis">
                  Ερώτηση {q.id} από {exetasi.erwtiseis.length}
                </span>
                <span className="pilegma">{q.ennoia}</span>
              </div>
              <p className="exetasi-erwtisi-keimeno">{q.erwtisi}</p>
              <div
                className="exetasi-epiloges-omada"
                role="radiogroup"
                aria-label={`Επιλογές για ερώτηση ${q.id}`}
              >
                {q.epiloges.map((epilogi) => {
                  const epilegmeno = apantiseis[q.id] === epilogi;
                  return (
                    <label
                      key={epilogi}
                      className={`exetasi-epilogi-label ${epilegmeno ? 'epilegmeno' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`erwtisi-${q.id}`}
                        value={epilogi}
                        checked={epilegmeno}
                        onChange={() => {
                          setApantiseis((prev) => ({
                            ...prev,
                            [q.id]: epilogi,
                          }));
                        }}
                        className="exetasi-epilogi-radio"
                        data-testid="exetasi-epilogi"
                      />
                      <span className="exetasi-epilogi-keimeno">{epilogi}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="pilegma pilegma-entono exetasi-ypovoli-koumpi"
        data-testid="exetasi-ypovoli"
        onClick={ypovoli}
      >
        Υποβολή Διαγωνίσματος
      </button>
    </div>
  );
}
