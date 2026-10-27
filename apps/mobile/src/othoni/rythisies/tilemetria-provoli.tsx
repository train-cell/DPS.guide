import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  eggrafi_akroati_tilemetrias,
  eksagoge_tilemetrias_json,
  katharise_tilemetria,
  pare_tilemetria_arxeio,
  type EpipedoLog,
  type TilemetriaEggrafi,
} from '../../tilemetria/tilemetria.js';

export interface TilemetriaProvoliProps {
  /** Προαιρετικό μέγιστο ύψος λίστας ή περιορισμός αρχικού πλήθους. */
  readonly arxikoFiltroEpipedou?: 'ola' | EpipedoLog;
  /** Callback όταν ο χρήστης εξάγει το αρχείο logs. */
  readonly onEksagwgi?: (json: string) => void;
}

export type FiltroEpipedou = 'ola' | EpipedoLog;

/** Υπολογίζει βασικά στατιστικά από το σύνολο των καταγεγραμμένων εγγραφών. */
export function ypologismos_statistikon_tilemetrias(eggrafes: readonly TilemetriaEggrafi[]) {
  let sfalmata = 0;
  let proeidopoiiseis = 0;
  let athroismaDiarkeias = 0;
  let plithosMetriseon = 0;

  for (const eggrafi of eggrafes) {
    if (eggrafi.epipedo === 'error') {
      sfalmata++;
    } else if (eggrafi.epipedo === 'warn') {
      proeidopoiiseis++;
    }

    if (eggrafi.diarkeiaMs !== undefined) {
      athroismaDiarkeias += eggrafi.diarkeiaMs;
      plithosMetriseon++;
    }
  }

  const mesiDiarkeiaMs = plithosMetriseon > 0
    ? Math.round((athroismaDiarkeias / plithosMetriseon) * 10) / 10
    : 0;

  return {
    synolo: eggrafes.length,
    sfalmata,
    proeidopoiiseis,
    mesiDiarkeiaMs,
  };
}

/**
 * Διαδραστική Κονσόλα Τηλεμετρίας & Ζωντανών Logs (TilemetriaProvoli).
 *
 * Παρέχει πλήρη παρατηρησιμότητα (Observability) στο UI:
 * - Ζωντανή ροή καταγραφών μέσω observer pattern.
 * - Αναζήτηση και φιλτράρισμα ανά επίπεδο (debug, info, warn, error).
 * - Στατιστικά απόδοσης και σφαλμάτων.
 * - Εξαγωγή JSON & αντιγραφή στο πρόχειρο.
 * - 100% συμμόρφωση με τον Κανόνα D11 (0 hex colors, 0 inline styles).
 */
export function TilemetriaProvoli({
  arxikoFiltroEpipedou = 'ola',
  onEksagwgi,
}: TilemetriaProvoliProps) {
  const [eggrafes, setEggrafes] = useState<readonly TilemetriaEggrafi[]>(() => pare_tilemetria_arxeio());
  const [filtro, setFiltro] = useState<FiltroEpipedou>(arxikoFiltroEpipedou);
  const [keimenoAnazitisis, setKeimenoAnazitisis] = useState('');
  const [epilegmenoId, setEpilegmenoId] = useState<string | null>(null);
  const [minimaKatastasis, setMinimaKatastasis] = useState<string | null>(null);

  const anazitisiInputId = useId();

  useEffect(() => {
    // Εγγραφή στον ζωντανό ακροατή τηλεμετρίας
    const apegrafi = eggrafi_akroati_tilemetrias(() => {
      setEggrafes(pare_tilemetria_arxeio());
    });
    return () => {
      apegrafi();
    };
  }, []);

  const statistika = useMemo(() => ypologismos_statistikon_tilemetrias(eggrafes), [eggrafes]);

  const filtrismenesEggrafes = useMemo(() => {
    const kanonikoKeimeno = keimenoAnazitisis.trim().toLowerCase();
    return eggrafes.filter((eggrafi) => {
      const tairiazeiEpipedo = filtro === 'ola' || eggrafi.epipedo === filtro;
      if (!tairiazeiEpipedo) {
        return false;
      }
      if (!kanonikoKeimeno) {
        return true;
      }
      return (
        eggrafi.minima.toLowerCase().includes(kanonikoKeimeno) ||
        eggrafi.id.toLowerCase().includes(kanonikoKeimeno) ||
        (eggrafi.metadedomena && JSON.stringify(eggrafi.metadedomena).toLowerCase().includes(kanonikoKeimeno))
      );
    });
  }, [eggrafes, filtro, keimenoAnazitisis]);

  const xeirismosKatharismou = useCallback(() => {
    katharise_tilemetria();
    setEggrafes([]);
    setEpilegmenoId(null);
    setMinimaKatastasis('Τα logs καθαρίστηκαν.');
  }, []);

  const xeirismosAntigrafis = useCallback(async () => {
    const json = eksagoge_tilemetrias_json();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(json);
        setMinimaKatastasis('Τα logs αντιγράφηκαν στο πρόχειρο!');
        return;
      } catch {
        // Fallback αν αποτύχει το clipboard API
      }
    }
    setMinimaKatastasis('Το JSON εξήχθη.');
  }, []);

  const xeirismosEksagwgis = useCallback(() => {
    const json = eksagoge_tilemetrias_json();
    onEksagwgi?.(json);
    setMinimaKatastasis('Εξαγωγή αρχείου logs έτοιμη.');
  }, [onEksagwgi]);

  return (
    <section
      className="tilemetria-kouti"
      data-testid="tilemetria-provoli"
      role="region"
      aria-label="Κονσόλα Τηλεμετρίας & Logs"
    >
      <header className="tilemetria-kefali">
        <h3 className="tilemetria-titlos">Ζωντανή Κονσόλα Τηλεμετρίας</h3>
        <p className="tilemetria-ypotitlos">
          Πλήρης παρατηρησιμότητα (Observability) και ανάλυση χρόνων εκτέλεσης σε πραγματικό χρόνο.
        </p>
      </header>

      {/* Στατιστικά Cards */}
      <div className="tilemetria-metriseis-grid" data-testid="tilemetria-statistika">
        <div className="tilemetria-metrisi-karta">
          <span className="tilemetria-metrisi-arithmos">{statistika.synolo}</span>
          <span className="tilemetria-metrisi-etiketa">Συμβάντα</span>
        </div>
        <div className="tilemetria-metrisi-karta">
          <span className="tilemetria-metrisi-arithmos tilemetria-error-xroma">{statistika.sfalmata}</span>
          <span className="tilemetria-metrisi-etiketa">Σφάλματα</span>
        </div>
        <div className="tilemetria-metrisi-karta">
          <span className="tilemetria-metrisi-arithmos tilemetria-warn-xroma">{statistika.proeidopoiiseis}</span>
          <span className="tilemetria-metrisi-etiketa">Προειδοποιήσεις</span>
        </div>
        <div className="tilemetria-metrisi-karta">
          <span className="tilemetria-metrisi-arithmos">{statistika.mesiDiarkeiaMs}ms</span>
          <span className="tilemetria-metrisi-etiketa">Μέση Διάρκεια</span>
        </div>
      </div>

      {/* Γραμμή Εργαλείων & Αναζήτηση */}
      <div className="tilemetria-mpara-ergaleion">
        <div className="tilemetria-anazitisi-kouti">
          <label htmlFor={anazitisiInputId} className="tilemetria-anazitisi-etiketa">
            Αναζήτηση
          </label>
          <input
            id={anazitisiInputId}
            type="search"
            className="pilegma tilemetria-anazitisi-pedio"
            placeholder="Αναζήτηση σε μηνύματα, spanId..."
            value={keimenoAnazitisis}
            onChange={(e) => setKeimenoAnazitisis(e.target.value)}
            data-testid="tilemetria-search-input"
            aria-label="Αναζήτηση logs"
          />
        </div>

        {/* Φίλτρα επιπέδου */}
        <div className="kapsoules-filtra-mpara" role="group" aria-label="Φιλτράρισμα επιπέδου logs">
          {(['ola', 'error', 'warn', 'info', 'debug'] as const).map((epipedo) => {
            const einaiEnergou = filtro === epipedo;
            return (
              <button
                key={epipedo}
                type="button"
                className={`kapsoula-filtrou${einaiEnergou ? ' pilegma-entono' : ''}`}
                onClick={() => setFiltro(epipedo)}
                data-testid={`tilemetria-filtro-${epipedo}`}
                aria-pressed={einaiEnergou}
              >
                {epipedo === 'ola' ? 'Όλα' : epipedo.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Κουμπιά ενεργειών */}
      <div className="tilemetria-energeies-mpara">
        <button
          type="button"
          className="pilegma pilegma-entono"
          onClick={xeirismosAntigrafis}
          data-testid="tilemetria-copy-btn"
          aria-label="Αντιγραφή logs στο πρόχειρο"
        >
          Αντιγραφή JSON
        </button>
        <button
          type="button"
          className="pilegma"
          onClick={xeirismosEksagwgis}
          data-testid="tilemetria-export-btn"
          aria-label="Εξαγωγή αρχείου logs"
        >
          Εξαγωγή Logs
        </button>
        <button
          type="button"
          className="pilegma"
          onClick={xeirismosKatharismou}
          data-testid="tilemetria-clear-btn"
          aria-label="Καθαρισμός όλων των logs"
        >
          Καθαρισμός
        </button>
      </div>

      {minimaKatastasis && (
        <div role="status" className="tilemetria-katastasi-minima" data-testid="tilemetria-status-msg">
          {minimaKatastasis}
        </div>
      )}

      {/* Λίστα Καταγραφών */}
      <div
        className="tilemetria-lista-eggrafon"
        role="log"
        aria-live="polite"
        data-testid="tilemetria-log-list"
      >
        {filtrismenesEggrafes.length === 0 ? (
          <div className="tilemetria-keno-minima" data-testid="tilemetria-keno">
            Δεν υπάρχουν εγγραφές τηλεμετρίας για τα επιλεγμένα κριτήρια.
          </div>
        ) : (
          filtrismenesEggrafes.map((eggrafi) => {
            const einaiEpilegmeno = epilegmenoId === eggrafi.id;
            const wra = eggrafi.timestamp.slice(11, 19);
            return (
              <div
                key={eggrafi.id}
                className={`tilemetria-eggrafi-grammi tilemetria-epipedo-${eggrafi.epipedo}`}
                onClick={() => setEpilegmenoId(einaiEpilegmeno ? null : eggrafi.id)}
                data-testid={`tilemetria-row-${eggrafi.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setEpilegmenoId(einaiEpilegmeno ? null : eggrafi.id);
                  }
                }}
                aria-expanded={einaiEpilegmeno}
              >
                <div className="tilemetria-row-kefali">
                  <span className="tilemetria-row-wra">{wra}</span>
                  <span className={`tilemetria-badge badge-${eggrafi.epipedo}`}>
                    {eggrafi.epipedo.toUpperCase()}
                  </span>
                  <span className="tilemetria-row-minima">{eggrafi.minima}</span>
                  {eggrafi.diarkeiaMs !== undefined && (
                    <span className="tilemetria-diarkeia-tag">{eggrafi.diarkeiaMs}ms</span>
                  )}
                </div>

                {einaiEpilegmeno && eggrafi.metadedomena && (
                  <pre
                    className="tilemetria-metadata-pre"
                    data-testid={`tilemetria-meta-${eggrafi.id}`}
                  >
                    {JSON.stringify(eggrafi.metadedomena, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
