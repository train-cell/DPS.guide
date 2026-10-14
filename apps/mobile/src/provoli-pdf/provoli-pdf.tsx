import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { OloniKatastasis, ProskelesioOmonimas } from '../koinima/index.js';
import { adeio, etimo, fortosi, sfalma, type Katastasi } from '../kathstasi/index.js';
import { xoris_katastasi } from '../kathstasi/index.js';
import type { Sfalma } from '@dps/core';
import { xrisiApothekisis } from '../apothiki/index.js';
import { xrisiPeriballontos } from '../periballon/provolos.js';
import { fortose_pdf, kilise_selida } from './provoli-ypiresies.js';
import { arithmos_selidon, akirose_trexousa_apostoli, stilise_selida } from './pdf-ypiresies.js';
import { PROTI_SELIDA } from './parapompi.js';
import './provoli-pdf.css';

/** Κλίμακα απόδοσης της σελίδας στον καμβά· το CSS τη σμικρύνει στο πλάτος της οθόνης. */
export const KLIMAKA_SELIDAS = 1.5;

/** Ένα φορτωμένο έγγραφο: τα byteof του και ο αριθμός των σελίδων του. */
export interface EgrafoPdf {
  readonly dyadiko: Uint8Array;
  readonly selides: number;
}

/** Οθόνη προβολής PDF: ανοίγει από παραπομπή οδηγού και δείχνει τη ζητούμενη σελίδα. */
export default function ProvoliPdf() {
  const params = useParams<{ arxeioId: string; selida: string }>();
  const navigate = useNavigate();
  const arxeioId = params.arxeioId ?? '';
  const zitoumeni = Number.parseInt(params.selida ?? '', 10);
  const arithmosZitisis = Number.isFinite(zitoumeni) ? zitoumeni : PROTI_SELIDA;

  const periballon = xrisiPeriballontos();
  const { kodikosMathimatos } = xrisiApothekisis();
  const [katastasi, setKatastasi] = useState<Katastasi<EgrafoPdf>>(fortosi<EgrafoPdf>());
  const [trexousa, setTrexousa] = useState(arithmosZitisis);
  const [klimaka, setKlimaka] = useState<number>(KLIMAKA_SELIDAS);
  const [eisagomeniSelida, setEisagomeniSelida] = useState<string>(String(arithmosZitisis));
  const [proseis, setProseis] = useState(0);
  const [sfalmaApostolis, setSfalmaApostolis] = useState<Sfalma | null>(null);
  const kanvasRef = useRef<HTMLCanvasElement>(null);

  const epanalipsi = useCallback(() => {
    setTrexousa(arithmosZitisis);
    setKatastasi(fortosi<EgrafoPdf>());
    setProseis((palies) => palies + 1);
  }, [arithmosZitisis]);

  useEffect(() => {
    let zontas = true;
    void (async () => {
      const dyadiko = await fortose_pdf(periballon.apothiki, kodikosMathimatos, arxeioId);
      if (!zontas) {
        return;
      }
      if (!dyadiko.ok) {
        setKatastasi(sfalma<EgrafoPdf>(dyadiko.sfalma));
        return;
      }
      const selides = await arithmos_selidon(dyadiko.timi);
      if (!zontas) {
        return;
      }
      if (!selides.ok) {
        setKatastasi(sfalma<EgrafoPdf>(selides.sfalma));
        return;
      }
      if (selides.timi < PROTI_SELIDA) {
        setKatastasi(adeio<EgrafoPdf>());
        return;
      }
      setKatastasi(etimo<EgrafoPdf>({ dyadiko: dyadiko.timi, selides: selides.timi }));
      const kathorismeni = kilise_selida(arithmosZitisis, selides.timi);
      setTrexousa(kathorismeni);
      setEisagomeniSelida(String(kathorismeni));
    })();
    return () => {
      zontas = false;
    };
  }, [periballon.apothiki, kodikosMathimatos, arxeioId, arithmosZitisis, proseis]);

  const eggrafo = xoris_katastasi(katastasi);

  useEffect(() => {
    const kanvas = kanvasRef.current;
    if (eggrafo === undefined || kanvas === null) {
      return;
    }
    let akirio = false;
    void (async () => {
      const apotelesma = await stilise_selida(eggrafo.dyadiko, trexousa, kanvas, klimaka);
      if (!akirio) {
        setSfalmaApostolis(apotelesma.ok ? null : apotelesma.sfalma);
      }
    })();
    return () => {
      akirio = true;
      akirose_trexousa_apostoli();
    };
  }, [eggrafo, trexousa, klimaka]);

  useEffect(() => {
    setEisagomeniSelida(String(trexousa));
  }, [trexousa]);

  const metallo = eggrafo !== undefined ? { trexon: trexousa, synolo: eggrafo.selides } : null;

  const megenthinsi = useCallback(() => {
    setKlimaka((palaia) => Math.min(3.0, Number((palaia + 0.25).toFixed(2))));
  }, []);

  const smikrynsi = useCallback(() => {
    setKlimaka((palaia) => Math.max(0.75, Number((palaia - 0.25).toFixed(2))));
  }, []);

  const epanafora_klimakas = useCallback(() => {
    setKlimaka(KLIMAKA_SELIDAS);
  }, []);

  const metavasi_se_selida = useCallback(
    (timiKeimenou: string) => {
      if (metallo === null) {
        return;
      }
      const arithmos = Number.parseInt(timiKeimenou, 10);
      if (Number.isFinite(arithmos)) {
        const neaSelida = kilise_selida(arithmos, metallo.synolo);
        setTrexousa(neaSelida);
        setEisagomeniSelida(String(neaSelida));
      } else {
        setEisagomeniSelida(String(metallo.trexon));
      }
    },
    [metallo]
  );

  const onomaArxeiou = arxeioId.length > 0 ? arxeioId : 'Άγνωστο αρχείο';

  return (
    <div className="provoli-odoni" data-testid="provoli-ekran">
      <ProskelesioOmonimas
        titlos="Προβολή PDF"
        ypokeimeno={onomaArxeiou}
        akseis={
          <IonButton
            size="small"
            fill="outline"
            onClick={() => {
              navigate(-1);
            }}
            data-testid="provoli-epistrofi"
          >
            ← Πίσω
          </IonButton>
        }
      />

      <div className="provoli-ergaleia-mpara" data-testid="provoli-toolbar">
        <div className="provoli-breadcrumb">
          <span className="provoli-breadcrumb-mathima">
            {kodikosMathimatos.length > 0 ? kodikosMathimatos : 'PLI201'}
          </span>
          <span className="provoli-breadcrumb-diaxoristis">/</span>
          <span className="provoli-breadcrumb-arxeio" title={onomaArxeiou}>
            {onomaArxeiou}
          </span>
        </div>

        <div className="provoli-deiktis provoli-pill-badge" data-testid="provoli-selida">
          {metallo !== null ? `Σελίδα ${metallo.trexon} από ${metallo.synolo}` : 'Φόρτωση σελίδας…'}
        </div>

        <div className="provoli-zoom-cluster" role="group" aria-label="Έλεγχος μεγέθυνσης">
          <button
            type="button"
            className="provoli-zoom-koumpi"
            onClick={smikrynsi}
            disabled={klimaka <= 0.75}
            data-testid="provoli-smikrynsi"
            title="Σμίκρυνση"
            aria-label="Σμίκρυνση"
          >
            −
          </button>
          <span className="provoli-zoom-pososto" data-testid="provoli-klimaka-endeixi">
            {Math.round(klimaka * 100)}%
          </span>
          <button
            type="button"
            className="provoli-zoom-koumpi"
            onClick={megenthinsi}
            disabled={klimaka >= 3.0}
            data-testid="provoli-megenthinsi"
            title="Μεγέθυνση"
            aria-label="Μεγέθυνση"
          >
            +
          </button>
          <button
            type="button"
            className="provoli-zoom-fit-koumpi"
            onClick={epanafora_klimakas}
            data-testid="provoli-epanaphora-klimakas"
            title="Προσαρμογή πλάτους"
          >
            Fit
          </button>
        </div>
      </div>

      <OloniKatastasis
        katastasi={katastasi}
        adeioMinima="Το έγγραφο δεν έχει σελίδες."
        epanalipsiMinima="Ξανάφόρτωση"
        epanalipsi={epanalipsi}
      >
        {() => (
          <>
            <div className="provoli-periohos">
              <div className="provoli-vivlio-plaisio">
                <canvas ref={kanvasRef} className="provoli-kanvas" data-testid="provoli-kanvas" />
              </div>
              {sfalmaApostolis !== null && (
                <p className="provoli-sfalma" data-testid="provoli-sfalma-apostolis">
                  {sfalmaApostolis.minima}
                </p>
              )}
            </div>

            <div className="odoni-xeiris provoli-pligi provoli-katw-mpara" data-testid="provoli-docked-bar">
              <IonButton
                size="small"
                fill="outline"
                disabled={metallo === null || metallo.trexon <= PROTI_SELIDA}
                onClick={() => {
                  setTrexousa((trexon) => Math.max(PROTI_SELIDA, trexon - 1));
                }}
                data-testid="provoli-proigoumeno"
              >
                ‹ Προηγούμενη
              </IonButton>

              <form
                className="provoli-metavasi-forma"
                onSubmit={(e) => {
                  e.preventDefault();
                  metavasi_se_selida(eisagomeniSelida);
                }}
              >
                <span className="provoli-metavasi-etiketa">Σελ.</span>
                <input
                  type="number"
                  min={PROTI_SELIDA}
                  max={metallo?.synolo ?? PROTI_SELIDA}
                  value={eisagomeniSelida}
                  onChange={(e) => setEisagomeniSelida(e.target.value)}
                  onBlur={() => metavasi_se_selida(eisagomeniSelida)}
                  className="provoli-metavasi-eisodos"
                  data-testid="provoli-metavasi-selidas"
                  aria-label="Μετάβαση σε σελίδα"
                />
                <span className="provoli-metavasi-synolo">/ {metallo?.synolo ?? '—'}</span>
              </form>

              <IonButton
                size="small"
                disabled={metallo === null || metallo.trexon >= metallo.synolo}
                onClick={() => {
                  setTrexousa((trexon) =>
                    metallo === null ? trexon : Math.min(metallo.synolo, trexon + 1)
                  );
                }}
                data-testid="provoli-epomeno"
              >
                Επόμενη ›
              </IonButton>
            </div>
          </>
        )}
      </OloniKatastasis>
    </div>
  );
}
