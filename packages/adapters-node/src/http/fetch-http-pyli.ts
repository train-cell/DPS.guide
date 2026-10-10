/** Υλοποίηση `HttpPyli` πάνω στο GLOBAL fetch του Node 22 (undici-based), με
 *  `redirect: 'manual'` και χειροκίνητο βρόχο (βλ. `anakateuthinsi.ts`).
 *
 *  ΑΠΟΦΑΣΗ TRANSPORT (με βάση το πλάνο και το docs/requests/E-L10-01 #3):
 *  «Το πλάνο (§6.3 και κάρτα L11) ορίζει `undici` + `tough-cookie` για τα
 *  adapters-node. Τα dependencies εγκαθίστανται ΜΟΝΟ στο W0. Ζητάμε προσθήκη
 *  `undici` (για `KatevasmaPyli` L10 και `HttpPyli` L11).» — το dependency είναι
 *  ακόμη pending, οπότε οδηγούμαστε με το native fetch (undici εσωτερικά). Το
 *  transport παραμένει ΜΕΜΟΝΩΜΕΝΟ: ολόκληρο το `fetch`/`Headers` βρίσκεται σε αυτό
 *  το αρχείο (συναρτήσεις `ekdotis_fetch` και `se_polla_kefalides`), ώστε η
 *  αντικατάσταση με `undici` να απαιτεί αλλαγή σε ένα μόνο σημείο. Η λογική
 *  ανακατευθύνσεων, το cookie jar και τα μηνύματα σφαλμάτων παραμένουν αναλλοίωτα.
 *
 *  ΜΗΔΕΝΙΣΜΟΣ ΜΥΣΤΙΚΩΝ: τα cookies δεν εμφανίζονται ποτέ σε μηνύματα σφάλματος ή
 *  καταγραφές· μόνο ως δεδομένα απάντησης (`HttpApantisi`). */

import type { Apotelesma, HttpAitima, HttpApantisi, HttpPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { anakateuthinsi, type EkdotisAitimaton } from './anakateuthinsi.js';
import { CookieJar } from './cookie-jar.js';

const TYPOS_PERIEXOMENOU_FORMA = 'application/x-www-form-urlencoded';
const TYPOS_PERIEXOMENOU_JSON = 'application/json';
const KEFALIDA_CONTENT_TYPE = 'content-type';

interface SomaAitimatos {
  readonly soma: string | null;
  readonly typos_periexomenou: string | undefined;
}

/** Σώμα αιτήματος: `soma_forma` → x-www-form-urlencoded, `soma_json` → JSON.
 *  Τα δύο μαζί απορρίπτονται· σε GET/HEAD δεν αποστέλλεται σώμα ποτέ. */
function dimiourgia_somatos(a: HttpAitima): Apotelesma<SomaAitimatos> {
  const exei_forma = a.soma_forma !== undefined;
  const exei_json = a.soma_json !== undefined;
  if (exei_forma && exei_json) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Δόθηκαν ταυτόχρονα soma_forma και soma_json');
  }
  if (a.methodos === 'GET' || a.methodos === 'HEAD') {
    return ok({ soma: null, typos_periexomenou: undefined });
  }
  if (a.soma_forma !== undefined) {
    return ok({
      soma: new URLSearchParams(a.soma_forma).toString(),
      typos_periexomenou: TYPOS_PERIEXOMENOU_FORMA,
    });
  }
  if (a.soma_json !== undefined) {
    return ok({ soma: JSON.stringify(a.soma_json), typos_periexomenou: TYPOS_PERIEXOMENOU_JSON });
  }
  return ok({ soma: null, typos_periexomenou: undefined });
}

/** Μετατροπή `Headers` σε multi-map ώστε ο βρόχος να μην εξαρτάται από το `Headers`.
 *  Τα πολλαπλά `Set-Cookie` διαβάζονται με `getSetCookie()` (Node 22+). */
function se_polla_kefalides(kefalides: Headers): Record<string, readonly string[]> {
  const apotelesma: Record<string, string[]> = {};
  for (const timi of kefalides.getSetCookie()) {
    prosthiki_kefalidas(apotelesma, 'set-cookie', timi);
  }
  kefalides.forEach((timi, kleidi) => {
    if (kleidi.toLowerCase() === 'set-cookie') {
      return;
    }
    prosthiki_kefalidas(apotelesma, kleidi, timi);
  });
  return apotelesma;
}

function prosthiki_kefalidas(
  kefalides: Record<string, string[]>,
  kleidi: string,
  timi: string
): void {
  const yparxon = kefalides[kleidi];
  if (yparxon === undefined) {
    kefalides[kleidi] = [timi];
    return;
  }
  yparxon.push(timi);
}

/** Η ΕΝΑΡΓΗ ΣΗΜΕΙΑ ΑΛΛΑΓΗΣ TRANSPORT: όλο το `fetch` είναι εδώ.
 *  `redirect: 'manual'` ώστε οι ενδιάμεσες 30x να είναι ορατές στον βρόχο. */
const ekdotis_fetch: EkdotisAitimaton = async (aitima, sima) => {
  const apantisi = await fetch(aitima.url, {
    method: aitima.methodos,
    headers: aitima.kefalides,
    body: aitima.soma,
    redirect: 'manual',
    signal: sima,
  });
  return {
    url: apantisi.url,
    katastasi: apantisi.status,
    kefalides: se_polla_kefalides(apantisi.headers),
    keimeno: () => apantisi.text(),
    dyadiko: async () => new Uint8Array(await apantisi.arrayBuffer()),
  };
};

export class NodeFetchHttpPyli implements HttpPyli {
  /** Το jar είναι προσβάσιμο για έλεγχο/διάγνωση και μπορεί να μοιραστεί ανά
   *  συνεδρία (π.χ. όλες οι κλήσεις ενός συνδέσμου eClass). */
  readonly cookie_jar: CookieJar;

  constructor(jar?: CookieJar) {
    this.cookie_jar = jar ?? new CookieJar();
  }

  async aitima(a: HttpAitima): Promise<Apotelesma<HttpApantisi>> {
    const soma = dimiourgia_somatos(a);
    if (!soma.ok) {
      return soma;
    }
    const kefalides: Record<string, string> = { ...a.kefalides };
    if (soma.timi.typos_periexomenou !== undefined) {
      kefalides[KEFALIDA_CONTENT_TYPE] = soma.timi.typos_periexomenou;
    }
    return anakateuthinsi(
      {
        methodos: a.methodos,
        url: a.url,
        kefalides,
        soma: soma.timi.soma,
        akolouthise: a.akolouthise_anakateuthinseis,
        xronos_orio_ms: a.xronos_orio_ms,
        typos: a.typos_apantisis,
        simatodotis: a.simatodotis,
      },
      ekdotis_fetch,
      this.cookie_jar
    );
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_http_pyli(jar?: CookieJar): NodeFetchHttpPyli {
  return new NodeFetchHttpPyli(jar);
}
