import type {
  Apotelesma,
  EclassPyli,
  HttpAitima,
  KatevasmaPyli,
  Mathima,
} from '@dps/core';
import { MEGISTO_MEGETHOS_ARXEIOU_MB, apotyxia, ok } from '@dps/core';
import { DpsEclassPyli, MoodlePyli, TopikiSyndesi } from '@dps/eclass';
import { anakalypsi, exagogi, syndesi, sygxronismos } from '@dps/pipeline';
import { createLocalOcrPort } from './topiko-ocr.js';
import type { Periballon } from '../periballon/periballon.js';
import { fortose_rytheseis, grapse_rytheseis } from '../apothiki/apothiki-ypiresies.js';

export interface ParametroiSyndesisEclass {
  readonly periballon: Periballon;
  readonly base_url: string;
  readonly onoma_xristi: string;
  readonly kodikos: string;
  readonly panepistimio_id: string;
  readonly lms?: 'auto' | 'open-eclass' | 'moodle' | 'unsupported';
  readonly webservice_token?: string;
}

const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_DOWNLOAD_BYTES = MEGISTO_MEGETHOS_ARXEIOU_MB * 1024 * 1024;

/** Signs in, discovers real courses, downloads supported files and indexes them via @dps/pipeline. */
export async function syndesi_kai_anaktisi_mathimaton(
  input: ParametroiSyndesisEclass,
): Promise<Apotelesma<readonly Mathima[]>> {
  const username = input.onoma_xristi.trim();
  const password = input.kodikos;
  const baseUrl = input.base_url.trim().replace(/\/+$/, '');
  let normalizedBase: URL;
  try {
    normalizedBase = new URL(baseUrl);
    if (normalizedBase.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το LMS πρέπει να έχει έγκυρη διεύθυνση HTTPS.');
  }

  if (!username && !password && !input.webservice_token?.trim()) {
    return apotyxia('AUTH_APOTYXIA', 'Συμπλήρωσε διαπιστευτήρια LMS ή ένα Moodle Web Services token.');
  }

  let connectorType = input.lms ?? 'auto';
  if (connectorType === 'auto') {
    const openEclass = await input.periballon.http.aitima({
      methodos: 'GET', url: `${baseUrl}/main/login_form.php`, akolouthise_anakateuthinseis: true,
      xronos_orio_ms: 15_000, typos_apantisis: 'keimeno',
    });
    if (openEclass.ok && openEclass.timi.katastasi >= 200 && openEclass.timi.katastasi < 400 &&
        openEclass.timi.keimeno?.length && /(?:login_form\.php|name\s*=\s*["'](?:uname|username)["'])/i.test(openEclass.timi.keimeno) &&
        new URL(openEclass.timi.teliko_url).origin === normalizedBase.origin) {
      connectorType = 'open-eclass';
    } else {
      const moodle = await input.periballon.http.aitima({
        methodos: 'GET', url: `${baseUrl}/login/index.php`, akolouthise_anakateuthinseis: true,
        xronos_orio_ms: 15_000, typos_apantisis: 'keimeno',
      });
      if (moodle.ok && moodle.timi.katastasi >= 200 && moodle.timi.katastasi < 400 &&
          moodle.timi.keimeno?.length && /(?:logintoken|page-login-index|moodle|name\s*=\s*["']username["'])/i.test(moodle.timi.keimeno) &&
          new URL(moodle.timi.teliko_url).origin === normalizedBase.origin) {
        connectorType = 'moodle';
      } else {
        return apotyxia('MI_YPOSTIRIZOMENO', 'Δεν αναγνωρίστηκε Open eClass ή Moodle standard login. Το SSO και τα custom portals δεν υποστηρίζονται.');
      }
    }
  }
  if (connectorType === 'unsupported') {
    return apotyxia('MI_YPOSTIRIZOMENO', 'Αυτό το portal δεν έχει υποστηριζόμενο Moodle ή Open eClass connector.');
  }
  if (connectorType !== 'moodle' && (!username || !password.trim())) {
    return apotyxia('AUTH_APOTYXIA', 'Συμπλήρωσε όνομα χρήστη και κωδικό πρόσβασης.');
  }
  if (connectorType === 'moodle' && !input.webservice_token?.trim() && (!username || !password.trim())) {
    return apotyxia('AUTH_APOTYXIA', 'Συμπλήρωσε Moodle username/password ή ένα προαιρετικό Web Services token.');
  }
  let rawEclass: EclassPyli;
  if (connectorType === 'moodle') {
    rawEclass = new MoodlePyli({
      http: input.periballon.http,
      base_url: baseUrl,
      username,
      password,
      ...(input.webservice_token?.trim() ? { webservice_token: input.webservice_token.trim() } : {}),
    });
  } else if (connectorType === 'open-eclass') {
    rawEclass = new DpsEclassPyli({
      http: input.periballon.http,
      stratigiki: new TopikiSyndesi({ onoma_xristi: username, kodikos: password, base_url: baseUrl }),
      base_url: baseUrl,
    });
  } else {
    return apotyxia('MI_YPOSTIRIZOMENO', 'Επίλεξε ένα αναγνωρισμένο Open eClass ή Moodle portal.');
  }
  const katevasma: KatevasmaPyli = {
    async katevase(url, destination, headers, signal) {
      let fileUrl: URL;
      try {
        fileUrl = new URL(url);
        if (fileUrl.protocol !== 'https:' || fileUrl.origin !== normalizedBase.origin) {
          return apotyxia('MI_YPOSTIRIZOMENO', 'Το LMS επέστρεψε αρχείο εκτός της ασφαλούς διεύθυνσής του.');
        }
      } catch {
        return apotyxia('MI_EGKYRO_SXIMA', 'Το LMS επέστρεψε μη έγκυρη διεύθυνση αρχείου.');
      }
      const request: HttpAitima = {
        methodos: 'GET',
        url: fileUrl.href,
        kefalides: headers,
        akolouthise_anakateuthinseis: true,
        xronos_orio_ms: DOWNLOAD_TIMEOUT_MS,
        typos_apantisis: 'dyadiko',
        ...(signal ? { simatodotis: signal } : {}),
      };
      const response = await input.periballon.http.aitima(request);
      if (!response.ok) return response;
      const bytes = response.timi.dyadiko;
      if (response.timi.katastasi < 200 || response.timi.katastasi >= 300 || bytes === undefined) {
        return apotyxia('DIKTYO', 'Το LMS δεν επέστρεψε το αρχείο.');
      }
      if (bytes.byteLength > MAX_DOWNLOAD_BYTES) {
        return apotyxia('MI_EGKYRO_SXIMA', 'Το ληφθέν αρχείο ξεπερνά το όριο των 100 MB.');
      }
      const saved = await input.periballon.apothiki.grapse_dyadiko(destination, bytes);
      return saved.ok ? ok({ megethos: bytes.byteLength }) : saved;
    },
  };
  const pipeline = {
    eclass: rawEclass,
    apothiki: input.periballon.apothiki,
    katevasma,
    ocr: createLocalOcrPort(),
    llm: input.periballon.llm,
    mystika: input.periballon.mystika,
    rologi: input.periballon.rologi,
    katagrafi: input.periballon.katagrafi,
    riza: '',
  };

  const auth = await syndesi(pipeline);
  if (!auth.ok) return auth;
  const discovery = await anakalypsi(pipeline);
  if (!discovery.ok) return discovery;
  if (discovery.timi.length === 0) {
    return apotyxia('DEN_VRETHIKE', 'Δεν βρέθηκαν εγγεγραμμένα μαθήματα στο LMS.');
  }

  const synced: string[] = [];
  for (const course of discovery.timi) {
    const result = await sygxronismos(pipeline, course.kodikos);
    if (!result.ok) {
      return apotyxia(
        result.sfalma.kodikos,
        `Ο συγχρονισμός του μαθήματος ${course.kodikos} απέτυχε: ${result.sfalma.minima}`,
      );
    }
    const extracted = await exagogi(pipeline, course.kodikos);
    if (!extracted.ok) {
      return apotyxia(
        extracted.sfalma.kodikos,
        `Τα αρχεία του μαθήματος ${course.kodikos} αποθηκεύτηκαν, αλλά η εξαγωγή κειμένου απέτυχε: ${extracted.sfalma.minima}`,
      );
    }
    synced.push(course.kodikos);
  }

  const settings = await fortose_rytheseis(input.periballon.apothiki);
  const savedSettings = await grapse_rytheseis(input.periballon.apothiki, {
    ...settings,
    baseUrl,
    panepistimioId: input.panepistimio_id,
    mathimataSynch: synced,
  });
  if (!savedSettings.ok) return savedSettings;
  if (connectorType === 'moodle' && input.webservice_token?.trim()) {
    await input.periballon.mystika.vale('moodle_webservice_token', input.webservice_token.trim());
  } else {
    await input.periballon.mystika.svise('moodle_webservice_token');
  }
  return ok(discovery.timi);
}

/** Re-authenticates with credentials from the encrypted device vault and refreshes LMS courses/files. */
export async function epanasygxronise_mathimata_apo_apothiki(
  periballon: Periballon,
): Promise<Apotelesma<readonly Mathima[]>> {
  const settings = await fortose_rytheseis(periballon.apothiki);
  const [username, password, savedBaseUrl, universityId, webserviceToken] = await Promise.all([
    periballon.mystika.pare('eclass_onoma_xristi'),
    periballon.mystika.pare('eclass_kodikos'),
    periballon.mystika.pare('eclass_base_url'),
    periballon.mystika.pare('eclass_panepistimio_id'),
    periballon.mystika.pare('moodle_webservice_token'),
  ]);
  const baseUrl = settings.baseUrl.trim() || savedBaseUrl?.trim() || '';
  if (!baseUrl) {
    return apotyxia('AUTH_APOTYXIA', 'Δεν υπάρχει αποθηκευμένη διεύθυνση LMS. Συνδέσου ξανά από την αρχική οθόνη.');
  }
  if ((!username?.trim() || !password?.trim()) && !webserviceToken?.trim()) {
    return apotyxia('AUTH_APOTYXIA', 'Δεν υπάρχουν αποθηκευμένα στοιχεία σύνδεσης. Συνδέσου ξανά από την αρχική οθόνη.');
  }
  return syndesi_kai_anaktisi_mathimaton({
    periballon,
    base_url: baseUrl,
    onoma_xristi: username ?? '',
    kodikos: password ?? '',
    panepistimio_id: settings.panepistimioId ?? universityId ?? 'custom',
    lms: 'auto',
    ...(webserviceToken?.trim() ? { webservice_token: webserviceToken.trim() } : {}),
  });
}
