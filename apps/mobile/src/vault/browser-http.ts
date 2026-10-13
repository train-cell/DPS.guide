import type { Apotelesma, HttpAitima, HttpApantisi, HttpPyli } from '@dps/core';
import { apotyxia } from '@dps/core';
import { anakateuthinsi, CookieJar } from '@dps/adapters-capacitor';
import { getLocalBridgeToken } from './local-bridge-client.js';

interface BridgeEnvelope {
  readonly methodos: string;
  readonly url: string;
  readonly kefalides: Record<string, string>;
  readonly soma: string | null;
}

function decodeHeaderMap(value: string | null): Record<string, readonly string[]> {
  if (value === null) return {};
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const headers: Record<string, readonly string[]> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (Array.isArray(entry) && entry.every((item) => typeof item === 'string')) {
        headers[key] = entry;
      }
    }
    return headers;
  } catch {
    return {};
  }
}

/** Same-origin bridge adapter for browser LMS, Gemini and local Ollama traffic. */
export class BrowserHttpPyli implements HttpPyli {
  private readonly cookieJar = new CookieJar();

  async aitima(request: HttpAitima): Promise<Apotelesma<HttpApantisi>> {
    const isLoopbackPage =
      typeof location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (!isLoopbackPage) {
      return apotyxia(
        'MI_YPOSTIRIZOMENO',
        'Η browser έκδοση υποστηρίζει συγχρονισμό μόνο στο localhost του υπολογιστή. Σε iPhone ή Android χρησιμοποίησε την εγκατεστημένη native εφαρμογή, η οποία συνδέεται απευθείας με το LMS.'
      );
    }
    let body: string | null = null;
    if (request.soma_forma !== undefined) body = new URLSearchParams(request.soma_forma).toString();
    else if (request.soma_json !== undefined) body = JSON.stringify(request.soma_json);
    const token = getLocalBridgeToken();
    if (token === null) {
      return apotyxia('DIKTYO', 'Ο browser δεν έχει συνδεθεί με το localhost bridge. Πληκτρολόγησε τον pairing code από το terminal στις Ρυθμίσεις ή στο onboarding.');
    }

    return anakateuthinsi(
      {
        methodos: request.methodos,
        url: request.url,
        kefalides: { ...request.kefalides },
        soma: body,
        akolouthise: request.akolouthise_anakateuthinseis,
        xronos_orio_ms: request.xronos_orio_ms,
        typos: request.typos_apantisis,
        simatodotis: request.simatodotis,
      },
      async (outgoing, signal) => {
        if (!token) {
          throw new Error('Το τοπικό HTTPS bridge δεν είναι έτοιμο. Κάνε επαναφόρτωση της σελίδας.');
        }
        const envelope: BridgeEnvelope = {
          methodos: outgoing.methodos,
          url: outgoing.url,
          kefalides: outgoing.kefalides,
          soma: typeof outgoing.soma === 'string'
            ? outgoing.soma
            : outgoing.soma instanceof URLSearchParams
              ? outgoing.soma.toString()
              : null,
        };
        const response = await fetch('/__dps_bridge/http', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-dps-bridge-token': token,
          },
          body: JSON.stringify(envelope),
          signal,
          cache: 'no-store',
        });
        const rawStatus = response.headers.get('x-dps-target-status');
        if (rawStatus === null) {
          throw new Error('Το τοπικό HTTPS bridge δεν επέστρεψε απάντηση LMS.');
        }
        const targetHeaders = decodeHeaderMap(response.headers.get('x-dps-target-headers'));
        const targetUrl = response.headers.get('x-dps-target-url') ?? outgoing.url;
        const targetStatus = Number(rawStatus);
        const bytes = new Uint8Array(await response.arrayBuffer());
        return {
          url: targetUrl,
          katastasi: targetStatus,
          kefalides: targetHeaders,
          keimeno: async () => new TextDecoder().decode(bytes),
          dyadiko: async () => bytes,
        };
      },
      this.cookieJar,
    ).catch(() => apotyxia(
      request.simatodotis?.aborted ? 'AKYROTHIKE' : 'DIKTYO',
      'Η σύνδεση μέσω του τοπικού HTTPS bridge απέτυχε. Έλεγξε ότι ο υπολογιστής είναι διαθέσιμος.',
    ));
  }
}
