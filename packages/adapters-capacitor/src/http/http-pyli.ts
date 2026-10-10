/** Υλοποίηση `HttpPyli` πάνω στο `CapacitorHttp` (native), με ΧΕΙΡΟΚΙΝΗΤΟ
 *  βρόχο ανακατευθύνσεων (βλ. `anakateuthinsi.ts`) ώστε να συλλέγονται τα
 *  `Set-Cookie` ΟΛΩΝ των ενδιάμεσων 30x (CAS ροή).
 *
 *  VERIFIED NATIVE FACTS (iOS 8.5.3 + Android 8.5.3, 2026-10-10):
 *
 *  1. `disableRedirects: true` υποστηρίζεται και στα δύο platforms
 *     (iOS: `CapacitorUrlRequest.getUrlSession` → delegate με
 *     `completionHandler(nil)` στο `willPerformHTTPRedirection`· Android:
 *     `setInstanceFollowRedirects(!disableRedirects)`) → το plugin επιστρέφει
 *     την ΑΚΡΙΒΗ 30x απόκριση και ο βρόχος εποπτεύει κάθε hop.
 *  2. Οι κεφαλίδες επιστρέφονται ως ΕΠΙΠΕΔΟ map (`Record<string,string>`) με
 *     πολλαπλές τιμές joined με `", "` (iOS: `lowerCaseHeaderDictionary`·
 *     Android: `TextUtils.join(", ", values)`) → για πολλαπλά `Set-Cookie`
 *     χρειάζεται νόμιμος διαχωρισμός (`spase_set_cookie_joined`), γιατί τα
 *     κόμματα του `Expires` (π.χ. «Wed, 21 Oct») δεν είναι διαχωριστικά.
 *  3. Δυαδικά δεδομένα: `data` επιστρέφεται base64 string (iOS:
 *     `data.base64EncodedString()`· Android: `readStreamAsBase64` → Android
 *     ΤΥΛΙΓΕΙ η γραμμή στους 76 χαρακτήρες → αφαίρεση whitespace πριν atob).
 *  4. `responseType: 'text'` με content-type JSON επιστρέφει PARSED object
 *     (verified: `tryParseJson`/`parseJSON` ανεξάρτητα από responseType) →
 *     επανασεριαλίζεται σε JSON για το `keimeno()`.
 *  5. Χρονικά όρια: `connectTimeout ?? readTimeout` (ms). Το δικό μας όριο
 *     εφαρμόζεται στο JavaScript-based `syndyasmos_simaton` (πρωτοβάθμιο)·
 *     στα native περνάει με περιθώριο ώστε να επικρατήσει πάντα το δικό μας
 *     (ντετερμινιστικό mapping TIMEOUT).
 *  6. Το plugin ΔΕΝ δέχεται AbortSignal → μετά την εκκίνηση ενός αιτήματος
 *     η ακύρωση είναι best-effort (το native συνεχίζει· εφαρμόζεται το
 *     `AKYROTHIKE` στο loop). Όχι σιωπηλό fallback: καταγράφεται στο report.
 *
 *  ΜΗΔΕΝΙΣΜΟΣ ΜΥΣΤΙΚΩΝ: τα cookies δεν εμφανίζονται ποτέ σε μηνύματα
 *  σφάλματος ή καταγραφές. */

import { CapacitorHttp, type HttpResponse, type HttpResponseType } from '@capacitor/core';
import type { Apotelesma, HttpAitima, HttpApantisi, HttpPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { anakateuthinsi, type EkdotisAitimaton, type TyposApantisisLoop } from './anakateuthinsi.js';
import { CookieJar } from './cookie-jar.js';

const TYPOS_PERIEXOMENOU_FORMA = 'application/x-www-form-urlencoded';
const TYPOS_PERIEXOMENOU_JSON = 'application/json';
const KEFALIDA_CONTENT_TYPE = 'content-type';
/** Περιθώριο (ms) πάνω από το δικό μας χρονικό όριο: τα native timeouts
 *  πρέπει να μην τερματίσουν ΠΟΤΕ πριν τον εσωτερικό μας χρονομετρητή. */
const PERITHORIO_XRONIKOU_ORIOU_MS = 1000;

interface SomaAitimatos {
  readonly soma: string | null;
  readonly typos_periexomenou: string | undefined;
}

/** Σώμα αιτήματος: `soma_forma` → x-www-form-urlencoded, `soma_json` → JSON.
 *  Τα δύο μαζί απορρίπτονται· σε GET/HEAD δεν αποστέλλεται σώμα ποτέ.
 *  (MIRROR του `dimiourgia_somatos` του NodeFetchHttpPyli.) */
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
    return ok({
      soma: JSON.stringify(a.soma_json),
      typos_periexomenou: TYPOS_PERIEXOMENOU_JSON,
    });
  }
  return ok({ soma: null, typos_periexomenou: undefined });
}

/** Ένα τμήμα ξεκινά νέο `Set-Cookie` μόνο αν έχει `name=` πριν από `;` ή `,`.
 *  Τα τμήματα που δεν ταιριάζουν (π.χ. «21 Oct 2015 07:28:00 GMT» μετά από
 *  «Expires=Wed») είναι συνέχεια του προηγούμενου cookie και επανασυνδέονται. */
const ENARKTIRIO_COOKIE = /^[^;,=]+=/;

/** Διαχωρισμός joined string πολλαπλών `Set-Cookie` (verified native: τα δύο
 * platforms κάνουν join με `", "`) σε ΑΥΤΟΤΕΛΗ ωμές τιμές, διατηρώντας
 * ανέπαφα τα κόμματα των ημερομηνιών (`Expires=Wed, 21 Oct 2015 07:28:00 GMT`).
 * Τα τμήματα καθαρίζονται στις άκρες: το join αφήνει κενό πριν το επόμενο
 * `name=`, και το RFC 6265 αγνοεί περιττό κενό γύρω από την τιμή. */
export function spase_set_cookie_joined(timi: string): string[] {
  const tmimata = timi.split(',');
  const apotelesmata: string[] = [];
  let trexon: string | undefined;
  for (const tmima of tmimata) {
    if (trexon === undefined || ENARKTIRIO_COOKIE.test(tmima.trim())) {
      if (trexon !== undefined) {
        apotelesmata.push(trexon.trim());
      }
      trexon = tmima;
      continue;
    }
    trexon = `${trexon},${tmima}`;
  }
  if (trexon !== undefined) {
    apotelesmata.push(trexon.trim());
  }
  return apotelesmata;
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

/** Επίπεδο map κεφαλίδων (verified native) → multi-map του βρόχου, με νόμιμο
 *  διαχωρισμό πολλαπλών `Set-Cookie`. */
function se_polla_kefalides(kefalides: Record<string, string>): Record<string, readonly string[]> {
  const apotelesma: Record<string, string[]> = {};
  for (const [kleidi, timi] of Object.entries(kefalides)) {
    if (kleidi.toLowerCase() === 'set-cookie') {
      for (const ksekhorismeno of spase_set_cookie_joined(timi)) {
        prosthiki_kefalidas(apotelesma, kleidi, ksekhorismeno);
      }
      continue;
    }
    prosthiki_kefalidas(apotelesma, kleidi, timi);
  }
  return apotelesma;
}

/** Το `data` του plugin ως string: text → string· JSON content-type →
 *  parsed object (verified native fact 4) → επανασεριαλίζεται. */
function dedomena_se_keimeno(dedomena: unknown): string {
  if (typeof dedomena === 'string') {
    return dedomena;
  }
  if (dedomena === undefined || dedomena === null) {
    return '';
  }
  return JSON.stringify(dedomena);
}

/** Δυαδικά: το plugin επιστρέφει base64 string (verified native fact 3). */
function dedomena_se_dyadiko(dedomena: unknown): Uint8Array {
  const vasi = dedomena_se_keimeno(dedomena);
  // Το Android τυλίγει τη γραμμή στους 76 χαρακτήρες → καθαρισμός whitespace.
  return apo_base64(vasi);
}

function apo_base64(vasi: string): Uint8Array {
  const katharo = vasi.replace(/\s+/g, '');
  const duadiko = atob(katharo);
  const dedomena = new Uint8Array(duadiko.length);
  for (let theseis = 0; theseis < duadiko.length; theseis += 1) {
    dedomena[theseis] = duadiko.charCodeAt(theseis);
  }
  return dedomena;
}

/** Η ΕΝΑΡΓΗ ΣΗΜΕΙΑ ΑΛΛΑΓΗΣ TRANSPORT: όλη η επικοινωνία με το native plugin.
 *  Η παράμερος `typos` (ζητούμενος τύπος απόκρισης) είναι κλειστή στο
 *  closure γιατί το native υλοποιεί τον τύπο στο αίτημα, όχι στην ανάγνωση.
 *
 *  - `disableRedirects: true` → οι ενδιάμεσες 30x είναι ορατές στο loop
 *    (verified native fact 1).
 *  - Τα native timeouts λαμβάνουν περιθώριο: πρωτοβάθμιος χρονομετρητής είναι
 *    ο εσωτερικός (verified native fact 5). */
const ekdotis_capacitor = (
  typos: TyposApantisisLoop,
  xronos_orio_ms: number
): EkdotisAitimaton => {
  const epitrepomeno_orios = xronos_orio_ms > 0 ? xronos_orio_ms + PERITHORIO_XRONIKOU_ORIOU_MS : undefined;
  const typos_apantisis: HttpResponseType = typos === 'dyadiko' ? 'arraybuffer' : 'text';
  return async (aitima, _sima) => {
    const apantisi: HttpResponse = await CapacitorHttp.request({
      url: aitima.url,
      method: aitima.methodos,
      headers: { ...aitima.kefalides },
      ...(aitima.soma !== null ? { data: aitima.soma } : {}),
      responseType: typos_apantisis,
      disableRedirects: true,
      ...(epitrepomeno_orios !== undefined
        ? { connectTimeout: epitrepomeno_orios, readTimeout: epitrepomeno_orios }
        : {}),
    });
    const dedomena = apantisi.data;
    return {
      url: apantisi.url,
      katastasi: apantisi.status,
      kefalides: se_polla_kefalides(apantisi.headers),
      keimeno: () => Promise.resolve(dedomena_se_keimeno(dedomena)),
      dyadiko: () => Promise.resolve(dedomena_se_dyadiko(dedomena)),
    };
  };
};

export class CapacitorHttpPyli implements HttpPyli {
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
      ekdotis_capacitor(a.typos_apantisis, a.xronos_orio_ms),
      this.cookie_jar
    );
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_http_pyli(jar?: CookieJar): CapacitorHttpPyli {
  return new CapacitorHttpPyli(jar);
}
