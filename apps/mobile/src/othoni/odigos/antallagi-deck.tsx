import { useCallback, useState } from 'react';
import {
  exagwgi_kryptografimenou_paketou,
  eisagwgi_kryptografimenou_paketou,
  type PaketoKartonPayload,
} from '@dps/core';

/**
 * Ιδιότητες component ανταλλαγής κρυπτογραφημένων πακέτων καρτών.
 */
export interface AntallagiDeckProps {
  /** Το τρέχον επιλεγμένο πακέτο καρτών του χρήστη (προαιρετικό για εξαγωγή). */
  readonly trexwnPaketo?: PaketoKartonPayload;
  /** Callback επιτυχούς εισαγωγής νέου πακέτου καρτών. */
  readonly onEisagwgiEpityxis?: (paketo: PaketoKartonPayload) => void;
  /** Callback διαχείρισης σφάλματος. */
  readonly onSfalma?: (minimaSfalmatos: string) => void;
  /** Αρχικό payload εισαγωγής (π.χ. από QR code scan). */
  readonly arxikoPayloadEisagwgis?: string;
  /** Αρχικό κλειδί (π.χ. για αυτοματισμούς ή δοκιμές). */
  readonly arxikoKleidi?: string;
}

/**
 * Component Peer-to-Peer Encrypted Study Decks (Ανταλλαγή Πακέτων Μελέτης).
 *
 * Συμμορφώνεται 100% με τον Κανόνα D11 (zero inline styles, zero raw hex).
 * Χρησιμοποιεί αυστηρά CSS custom properties (var(--xroma-...)).
 */
export function AntallagiDeck({
  trexwnPaketo,
  onEisagwgiEpityxis,
  onSfalma,
  arxikoPayloadEisagwgis = '',
  arxikoKleidi = '',
}: AntallagiDeckProps) {
  // Κατάσταση εξαγωγής
  const [kleidiExagwgis, setKleidiExagwgis] = useState<string>(arxikoKleidi);
  const [eksagomenoPayload, setEksagomenoPayload] = useState<string>('');
  const [seExagwgi, setSeExagwgi] = useState<boolean>(false);

  // Κατάσταση εισαγωγής
  const [eiserxomenoPayload, setEiserxomenoPayload] = useState<string>(arxikoPayloadEisagwgis);
  const [kleidiEisagwgis, setKleidiEisagwgis] = useState<string>(arxikoKleidi);
  const [seEisagwgi, setSeEisagwgi] = useState<boolean>(false);
  const [eisagmenoPaketo, setEisagmenoPaketo] = useState<PaketoKartonPayload | null>(null);

  // Γενική κατάσταση ενημέρωσης & σφαλμάτων
  const [minimaKatastasis, setMinimaKatastasis] = useState<string>('Έτοιμο για εξαγωγή ή εισαγωγή πακέτου.');
  const [sfalma, setSfalma] = useState<string | null>(null);

  // Διαχείριση εξαγωγής
  const ekteleiExagwgi = useCallback(async () => {
    if (!trexwnPaketo) {
      const err = 'Δεν υπάρχει επιλεγμένο πακέτο καρτών για εξαγωγή.';
      setSfalma(err);
      if (onSfalma) onSfalma(err);
      return;
    }

    if (!kleidiExagwgis.trim()) {
      const err = 'Παρακαλούμε εισάγετε ένα μυστικό κλειδί για την κρυπτογράφηση του πακέτου.';
      setSfalma(err);
      if (onSfalma) onSfalma(err);
      return;
    }

    try {
      setSeExagwgi(true);
      setSfalma(null);
      setMinimaKatastasis('Κρυπτογράφηση πακέτου με AES-256-GCM...');

      const encoded = await exagwgi_kryptografimenou_paketou(trexwnPaketo, kleidiExagwgis.trim());
      setEksagomenoPayload(encoded);
      setMinimaKatastasis('Το πακέτο κρυπτογραφήθηκε επιτυχώς! Μπορείτε να αντιγράψετε το κείμενο.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSfalma(`Σφάλμα εξαγωγής: ${msg}`);
      if (onSfalma) onSfalma(msg);
    } finally {
      setSeExagwgi(false);
    }
  }, [trexwnPaketo, kleidiExagwgis, onSfalma]);

  // Διαχείριση εισαγωγής
  const ekteleiEisagwgi = useCallback(async () => {
    if (!eiserxomenoPayload.trim()) {
      const err = 'Παρακαλούμε επικολλήστε το κρυπτογραφημένο πακέτο (Base64 payload).';
      setSfalma(err);
      if (onSfalma) onSfalma(err);
      return;
    }

    if (!kleidiEisagwgis.trim()) {
      const err = 'Παρακαλούμε εισάγετε το μυστικό κλειδί αποκρυπτογράφησης.';
      setSfalma(err);
      if (onSfalma) onSfalma(err);
      return;
    }

    try {
      setSeEisagwgi(true);
      setSfalma(null);
      setMinimaKatastasis('Αποκρυπτογράφηση και επαλήθευση ακεραιότητας SHA-256...');

      const decrypted = await eisagwgi_kryptografimenou_paketou(
        eiserxomenoPayload.trim(),
        kleidiEisagwgis.trim()
      );

      setEisagmenoPaketo(decrypted);
      setMinimaKatastasis(`Το πακέτο "${decrypted.titlos}" εισήχθη επιτυχώς (${decrypted.kartes.length} κάρτες)!`);
      if (onEisagwgiEpityxis) {
        onEisagwgiEpityxis(decrypted);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSfalma(`Σφάλμα εισαγωγής: ${msg}`);
      if (onSfalma) onSfalma(msg);
    } finally {
      setSeEisagwgi(false);
    }
  }, [eiserxomenoPayload, kleidiEisagwgis, onEisagwgiEpityxis, onSfalma]);

  return (
    <div className="antallagi-deck-plaisio">
      <div className="antallagi-deck-kefali">
        <h2 className="antallagi-deck-titlos">Ανταλλαγή Πακέτων Μελέτης (P2P Encrypted)</h2>
        <p className="antallagi-deck-perigrafi">
          Ασφαλής διαμοιρασμός flashcards με κρυπτογράφηση AES-256-GCM χωρίς μεσάζοντες.
        </p>
      </div>

      <div
        className="antallagi-status-plaisio"
        data-testid="antallagi-status"
        aria-live="polite"
      >
        <p className="antallagi-status-keimeno">{minimaKatastasis}</p>
        {sfalma && (
          <p className="antallagi-sfalma-keimeno" role="alert" data-testid="antallagi-error">
            {sfalma}
          </p>
        )}
      </div>

      {/* Ενότητα Εξαγωγής */}
      {trexwnPaketo && (
        <div className="antallagi-kouti antallagi-export-kouti">
          <h3 className="antallagi-kouti-titlos">Εξαγωγή Πακέτου: {trexwnPaketo.titlos}</h3>
          <span className="pilegma">{trexwnPaketo.kartes.length} κάρτες</span>

          <div className="antallagi-pedio-omada">
            <label htmlFor="antallagi-export-pass" className="antallagi-etiketa">
              Μυστικό Κλειδί Κρυπτογράφησης (Password):
            </label>
            <input
              id="antallagi-export-pass"
              type="password"
              className="antallagi-input"
              aria-label="Μυστικό κλειδί εξαγωγής πακέτου"
              placeholder="Εισάγετε ισχυρό κλειδί..."
              value={kleidiExagwgis}
              onChange={(e) => setKleidiExagwgis(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="pilegma pilegma-entono antallagi-koumpi"
            data-testid="antallagi-export-btn"
            disabled={seExagwgi}
            onClick={ekteleiExagwgi}
          >
            {seExagwgi ? 'Κρυπτογράφηση...' : 'Κρυπτογράφηση & Εξαγωγή'}
          </button>

          {eksagomenoPayload && (
            <div className="antallagi-apotelesma-omada">
              <label htmlFor="antallagi-exported-code" className="antallagi-etiketa">
                Κρυπτογραφημένο Payload (Αντιγράψτε ή μοιραστείτε):
              </label>
              <textarea
                id="antallagi-exported-code"
                readOnly
                className="antallagi-textarea"
                aria-label="Κρυπτογραφημένο κείμενο εξαγωγής"
                data-testid="antallagi-exported-payload"
                rows={4}
                value={eksagomenoPayload}
              />
            </div>
          )}
        </div>
      )}

      {/* Ενότητα Εισαγωγής */}
      <div className="antallagi-kouti antallagi-import-kouti">
        <h3 className="antallagi-kouti-titlos">Εισαγωγή Πακέτου Μελέτης</h3>

        <div className="antallagi-pedio-omada">
          <label htmlFor="antallagi-import-payload" className="antallagi-etiketa">
            Κρυπτογραφημένο Payload (Base64 string):
          </label>
          <textarea
            id="antallagi-import-payload"
            className="antallagi-textarea"
            aria-label="Πεδίο επικόλλησης κρυπτογραφημένου πακέτου"
            data-testid="antallagi-import-input"
            rows={4}
            placeholder="Επικολλήστε εδώ το κρυπτογραφημένο πακέτο..."
            value={eiserxomenoPayload}
            onChange={(e) => setEiserxomenoPayload(e.target.value)}
          />
        </div>

        <div className="antallagi-pedio-omada">
          <label htmlFor="antallagi-import-pass" className="antallagi-etiketa">
            Μυστικό Κλειδί Αποκρυπτογράφησης:
          </label>
          <input
            id="antallagi-import-pass"
            type="password"
            className="antallagi-input"
            aria-label="Μυστικό κλειδί αποκρυπτογράφησης"
            data-testid="antallagi-import-key-input"
            placeholder="Εισάγετε το κλειδί που όρισε ο δημιουργός..."
            value={kleidiEisagwgis}
            onChange={(e) => setKleidiEisagwgis(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="pilegma pilegma-entono antallagi-koumpi"
          data-testid="antallagi-import-btn"
          disabled={seEisagwgi}
          onClick={ekteleiEisagwgi}
        >
          {seEisagwgi ? 'Αποκρυπτογράφηση...' : 'Επικύρωση & Εισαγωγή'}
        </button>

        {eisagmenoPaketo && (
          <div className="antallagi-eisagmeno-kouti" data-testid="antallagi-imported-summary">
            <h4 className="antallagi-eisagmeno-titlos">✓ {eisagmenoPaketo.titlos}</h4>
            <p className="antallagi-eisagmeno-metrika">
              Σύνολο καρτών: {eisagmenoPaketo.kartes.length} | Ημερομηνία:{' '}
              {eisagmenoPaketo.dimiourgithike}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
