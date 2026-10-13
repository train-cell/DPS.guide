let bridgeToken: string | null = null;

export function isLocalBridgePaired(): boolean {
  return bridgeToken !== null;
}

export function getLocalBridgeToken(): string | null {
  return bridgeToken;
}

/** Exchanges the current server-run code for a memory-only browser session token. */
export async function pairLocalBridge(code: string): Promise<void> {
  const normalized = code.replace(/\s+/g, '').toUpperCase();
  if (!/^[0-9A-F]{16}$/.test(normalized)) {
    throw new Error('Ο κωδικός pairing πρέπει να έχει 16 δεκαεξαδικούς χαρακτήρες.');
  }
  const response = await fetch('/__dps_bridge/pair', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: normalized }),
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Έγιναν πολλές προσπάθειες. Περίμενε ένα λεπτό και δοκίμασε ξανά.');
    throw new Error('Ο κωδικός pairing δεν έγινε δεκτός. Έλεγξε το terminal του υπολογιστή.');
  }
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('token' in payload) ||
      typeof payload.token !== 'string' || payload.token.length < 32) {
    throw new Error('Ο τοπικός server επέστρεψε άκυρη απάντηση pairing.');
  }
  bridgeToken = payload.token;
}
