import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Karta } from '../koinima/index.js';
import { getLocalBridgeToken, pairLocalBridge } from './local-bridge-client.js';

/** One-time terminal code pairing for trusted browsers on the local network. */
export function BridgePairingCard() {
  const [code, setCode] = useState('');
  const [paired, setPaired] = useState(() => getLocalBridgeToken() !== null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (Capacitor.isNativePlatform()) return null;

  async function pair(): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      await pairLocalBridge(code);
      setPaired(true);
      setCode('');
      setMessage('Η συσκευή συνδέθηκε με αυτόν τον τοπικό server. Το pairing ισχύει μέχρι την επανεκκίνηση του server.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Δεν έγινε pairing με τον τοπικό server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Karta
      titlos="Σύνδεση με τον τοπικό υπολογιστή"
      ypokeimeno="Απαιτείται για συγχρονισμό LMS και πρόσβαση στο bridge από browser ή iPhone στο ίδιο δίκτυο."
      stoixeia={
        <div className="odoni-xeiris">
          <p>{paired ? 'Η συσκευή είναι paired με τον τρέχοντα server.' : 'Άνοιξε το terminal του υπολογιστή και πληκτρολόγησε τον κωδικό που εμφανίζει το DPS local bridge.'}</p>
          {!paired && (
            <>
              <label className="odoni-xeiris-zeugos" htmlFor="local-bridge-pairing-code">Κωδικός από το terminal</label>
              <input
                id="local-bridge-pairing-code"
                className="proedri-travla-gramma"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={16}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                aria-label="Κωδικός pairing από το terminal"
              />
              <button type="button" className="pilegma pilegma-entono" disabled={busy || code.trim().length === 0} onClick={() => void pair()}>
                {busy ? 'Σύνδεση…' : 'Σύνδεση με τον υπολογιστή'}
              </button>
            </>
          )}
          {message !== null && <p role="status">{message}</p>}
        </div>
      }
    />
  );
}
