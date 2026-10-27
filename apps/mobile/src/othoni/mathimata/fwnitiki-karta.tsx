import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ypologise_fwnitiki_omoiotita,
  type ApotelesmaFwnitikisOmoiotitas,
} from '@dps/core';
import { FwnitikiExetasiYpiresia } from '../../ypiresies/fwnitiki-exetasi.js';

/**
 * Ιδιότητες component φωνητικής κάρτας μελέτης.
 */
export interface FwnitikiKartaProps {
  readonly erwtisi: string;
  readonly stoxosApantisi: string;
  readonly lexeisKleidia?: readonly string[];
  readonly ennoia?: string;
  readonly arxikiApantisi?: string;
  readonly onEpityxia?: (apotelesma: ApotelesmaFwnitikisOmoiotitas) => void;
  readonly onApotyxia?: (apotelesma: ApotelesmaFwnitikisOmoiotitas) => void;
  readonly fwnitikiYpiresia?: FwnitikiExetasiYpiresia;
}

/**
 * Component φωνητικής εξέτασης κάρτας flashcard.
 *
 * Συμμορφώνεται 100% με τον Κανόνα D11 (zero inline styles, zero raw hex).
 * Παρέχει πλήρη προσβασιμότητα (aria-label, aria-live="polite", semantically correct roles).
 */
export function FwnitikiKarta({
  erwtisi,
  stoxosApantisi,
  lexeisKleidia = [],
  ennoia,
  arxikiApantisi,
  onEpityxia,
  onApotyxia,
  fwnitikiYpiresia,
}: FwnitikiKartaProps) {
  const [apantisi, setApantisi] = useState<string>(arxikiApantisi ?? '');
  const [einaiSeAkroasi, setEinaiSeAkroasi] = useState<boolean>(false);
  const [katastasiMinima, setKatastasiMinima] = useState<string>(() => {
    if (arxikiApantisi) return 'Η απάντηση αξιολογήθηκε.';
    return 'Πατήστε το μικρόφωνο για να εκφωνήσετε την απάντησή σας.';
  });
  const [sfalma, setSfalma] = useState<string | null>(null);

  const ypiresia = useMemo(() => {
    return fwnitikiYpiresia ?? new FwnitikiExetasiYpiresia({ glwssa: 'el-GR' });
  }, [fwnitikiYpiresia]);

  // Υπολογισμός αποτελέσματος αν υπάρχει απάντηση
  const apotelesma: ApotelesmaFwnitikisOmoiotitas | null = useMemo(() => {
    if (!apantisi || apantisi.trim() === '') return null;
    return ypologise_fwnitiki_omoiotita(apantisi, stoxosApantisi, lexeisKleidia);
  }, [apantisi, stoxosApantisi, lexeisKleidia]);

  // Καθαρισμός κατά το unmount
  useEffect(() => {
    return () => {
      ypiresia.stamata();
    };
  }, [ypiresia]);

  const diaxeirisiAxiologisis = useCallback(
    (telikiApantisi: string) => {
      if (!telikiApantisi.trim()) return;
      const res = ypologise_fwnitiki_omoiotita(telikiApantisi, stoxosApantisi, lexeisKleidia);
      if (res.epityxia) {
        setKatastasiMinima(`Επιτυχής απάντηση! Ομοιότητα: ${res.posostoOmoiotitas}%.`);
        if (onEpityxia) onEpityxia(res);
      } else {
        setKatastasiMinima(`Η απάντηση χρειάζεται βελτίωση. Ομοιότητα: ${res.posostoOmoiotitas}%.`);
        if (onApotyxia) onApotyxia(res);
      }
    },
    [stoxosApantisi, lexeisKleidia, onEpityxia, onApotyxia]
  );

  const enallagiAkroasis = useCallback(() => {
    setSfalma(null);

    if (einaiSeAkroasi) {
      ypiresia.stamata();
      setEinaiSeAkroasi(false);
      setKatastasiMinima('Η φωνητική καταγραφή σταμάτησε.');
      if (apantisi) {
        diaxeirisiAxiologisis(apantisi);
      }
      return;
    }

    const xekinise = ypiresia.xekina(
      (keimeno, einaiTeliko) => {
        setApantisi(keimeno);
        if (einaiTeliko) {
          setKatastasiMinima('Η φωνητική απάντηση καταγράφηκε επιτυχώς.');
          setEinaiSeAkroasi(false);
          diaxeirisiAxiologisis(keimeno);
        } else {
          setKatastasiMinima('Ακούω... συνεχίστε την εκφώνηση.');
        }
      },
      (sfalmaMsg) => {
        setEinaiSeAkroasi(false);
        setSfalma(sfalmaMsg);
        setKatastasiMinima('Παρουσιάστηκε σφάλμα κατά τη φωνητική αναγνώριση.');
      }
    );

    if (xekinise) {
      setEinaiSeAkroasi(true);
      setKatastasiMinima('Ακρόαση σε εξέλιξη... μιλήστε στο μικρόφωνο.');
    } else {
      setEinaiSeAkroasi(false);
    }
  }, [einaiSeAkroasi, ypiresia, apantisi, diaxeirisiAxiologisis]);

  return (
    <div className="fwnitiki-karta-plaisio">
      <div className="fwnitiki-karta-kefali">
        {ennoia && <span className="pilegma">{ennoia}</span>}
        <h3 className="fwnitiki-karta-erwtisi">{erwtisi}</h3>
      </div>

      <div className="fwnitiki-karta-xeirismos">
        <button
          type="button"
          className={`fwnitiki-mic-koumpi ${einaiSeAkroasi ? 'fwnitiki-mic-energopoihmeno' : ''}`}
          data-testid="fwnitiki-mic-btn"
          aria-label="Έναρξη φωνητικής απάντησης"
          onClick={enallagiAkroasis}
        >
          <span className="fwnitiki-mic-eikonidio" aria-hidden="true">
            {einaiSeAkroasi ? '⏹️' : '🎙️'}
          </span>
          <span>{einaiSeAkroasi ? 'Διακοπή Ακρόασης' : 'Εκφώνηση Απάντησης'}</span>
        </button>

        <div
          className="fwnitiki-katastasi-plaisio"
          data-testid="fwnitiki-katastasi"
          aria-live="polite"
        >
          <p className="fwnitiki-katastasi-keimeno">{katastasiMinima}</p>
          {sfalma && <p className="fwnitiki-sfalma-keimeno">{sfalma}</p>}
        </div>
      </div>

      {apantisi && (
        <div className="fwnitiki-apantisi-proepiskopisi">
          <span className="fwnitiki-apantisi-etiketa">Καταγεγραμμένη Απάντηση:</span>
          <p className="fwnitiki-apantisi-keimeno">{apantisi}</p>
        </div>
      )}

      {apotelesma && (
        <div className="fwnitiki-apotelesmata-plaisio">
          {apotelesma.epityxia ? (
            <span
              className="fwnitiki-badge fwnitiki-badge-epityxia"
              data-testid="fwnitiki-badge-epityxia"
              role="status"
            >
              ✓ Επιτυχία ({apotelesma.posostoOmoiotitas}%)
            </span>
          ) : (
            <span
              className="fwnitiki-badge fwnitiki-badge-apotyxia"
              data-testid="fwnitiki-badge-apotyxia"
              role="status"
            >
              ✗ Προσπάθησε ξανά ({apotelesma.posostoOmoiotitas}%)
            </span>
          )}

          {apotelesma.vretheisanLexeis.length > 0 && (
            <div className="fwnitiki-lexeis-kleidia">
              <span className="fwnitiki-lexeis-titlos">Λέξεις-κλειδιά που εντοπίστηκαν:</span>
              <div className="fwnitiki-lexeis-list">
                {apotelesma.vretheisanLexeis.map((lexi) => (
                  <span key={lexi} className="pilegma pilegma-entono">
                    {lexi}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
