/** `KatevasmaPyli` πάνω στο `@capacitor/file-transfer` (`FileTransfer.downloadFile`).
 *
 *  ΑΠΟΦΑΣΗ COOKIES: σε αντίθεση με το `NodeKatevasmaPyli`, ο Capacitor εκδότης
 *  δεν τρέχει δικό του βρόχο ανακατευθύνσεων — το native στέλνει τα cookies που
 *  έχει ήδη αποθηκεύσει (verified: Android `HttpURLConnection` με ενεργό
 *  `CookieHandler`; iOS `IONFLTRManager` → `URLSession`). Το port δέχεται ρητή
 *  κεφαλίδα `Cookie` μέσα στα `kefalides` (ο caller τη γεμίζει από το `CookieJar`
 *  του `CapacitorHttpPyli`) — έτσι η λήψη ταυτίζεται με την ενεργή συνεδρία.
 *
 *  ΜΗΔΕΝΙΣΜΟΣ ΜΥΣΤΙΚΩΝ: ποτέ URL/query/κεφαλίδες στα μηνύματα — μόνο ο κωδικός
 *  κατάστασης HTTP και η σχετική διαδρομή.
 *
 *  ΑΚΥΡΩΣΗ: το `FileTransfer.downloadFile` ΔΕΝ δέχεται AbortSignal και δεν
 *  εκθέτει cancel (verified `definitions.d.ts@2.0.6`: μόνο `downloadFile`
 *  options) → προ-ακυρωμένο σήμα → `AKYROTHIKE` πριν την εκκίνηση· μετά την
 *  εκκίνηση η ακύρωση είναι best-effort (το native συνεχίζει, το αποτέλεσμα
 *  απορρίπτεται). Καταγράφεται ως γνωστό όριο, όχι ως σιωπηλό fallback.
 *
 *  ΠΛΗΡΕΣ PATH: το plugin απαιτεί πλήρες `file://` URI (verified native
 *  `FileTransferPlugin.swift`: `URL(string: path)`) → λαμβάνεται μέσω
 *  `Filesystem.getUri` (verified: pure URL construction, δουλεύει και για
 *  ανύπαρκτο αρχείο). */

import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import type { Apotelesma, KatevasmaPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { karnikopoise_diadromi } from './diadromes.js';

const MEGISTI_TIMI_TIMEOUT_MS = 600000;

interface SfalmaFileTransfer {
  readonly data?: {
    readonly httpStatus?: unknown;
  };
}

/** Σβήνει το μερικό αρχείο που άφησε πίσω μια αποτυχημένη λήψη (best-effort). */
async function svise_prosrino(pliri: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: pliri, directory: Directory.Documents });
  } catch {
    // δεν υπήρχε — δεν εμποδίζει την αποτυχία
  }
}

/** HTTP status από το native rejection (verified: `FileTransferError.httpStatus`
 *  στο `error.data` — «use the FileTransferError interface available at error.data»). */
function kodikos_katastasis_apo_sfalma(sfalma: unknown): number | undefined {
  if (typeof sfalma !== 'object' || sfalma === null) {
    return undefined;
  }
  const dedomena = (sfalma as SfalmaFileTransfer).data;
  if (dedomena === null || dedomena === undefined) {
    return undefined;
  }
  const katastasi = dedomena.httpStatus;
  return typeof katastasi === 'number' ? katastasi : undefined;
}

/** Διαβάζει τη σήμανση ακύρωσης. Συνάρτηση (και όχι inline `=== true`) γιατί
 *  μετά τον πρώτο έλεγχο ο TypeScript στενεύει τον τύπο (`false | undefined`),
 *  ενώ το σήμα μπορεί ν' ακυρωθεί ασύγχρονα πάνω στη διάρκεια της λήψης. */
function einai_akyromeno(simatodotis: AbortSignal | undefined): boolean {
  return simatodotis?.aborted === true;
}

export class CapacitorKatevasmaPyli implements KatevasmaPyli {
  constructor(private readonly riza: string) {}

  async katevase(
    url: string,
    proorismos: string,
    kefalides: Record<string, string>,
    simatodotis?: AbortSignal
  ): Promise<Apotelesma<{ megethos: number }>> {
    const karnikis = karnikopoise_diadromi(proorismos);
    if (!karnikis.ok) {
      return karnikis;
    }
    const sxetiki = karnikis.timi;
    const pliri = this.riza === '' ? sxetiki : `${this.riza}/${sxetiki}`;

    if (einai_akyromeno(simatodotis)) {
      return apotyxia('AKYROTHIKE', 'Η λήψη ακυρώθηκε πριν από την εκκίνησή της');
    }

    let url_elegxos: URL;
    try {
      url_elegxos = new URL(url);
    } catch {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το URL της λήψης δεν είναι έγκυρο');
    }
    // Έλεγχος πρωτοκόλλου: το FileTransfer δέχεται μόνο http(s).
    if (url_elegxos.protocol !== 'http:' && url_elegxos.protocol !== 'https:') {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το URL της λήψης δεν είναι http/https');
    }

    try {
      await Filesystem.mkdir({
        path: pliri,
        directory: Directory.Documents,
        recursive: true,
      });

      // Το native στέλνει τη ροή ΑΠΕΥΘΕΙΑΣ στον προορισμό (χωρίς temp) — αν η
      // λήψη αποτύχει στη μέση μένει μερικό αρχείο. Σε αποτυχία HTTP σβήνεται
      // (best-effort): ένα κομμένο αρχείο χειρότερο από κανένα.
      const arxeio = await Filesystem.getUri({
        path: pliri,
        directory: Directory.Documents,
      });

      await FileTransfer.downloadFile({
        url,
        path: arxeio.uri,
        headers: { ...kefalides },
        method: 'GET',
        connectTimeout: MEGISTI_TIMI_TIMEOUT_MS,
        readTimeout: MEGISTI_TIMI_TIMEOUT_MS,
      });

      if (einai_akyromeno(simatodotis)) {
        return apotyxia('AKYROTHIKE', 'Η λήψη ακυρώθηκε από τον καλούντα');
      }

      const statistiko = await Filesystem.stat({ path: pliri, directory: Directory.Documents });
      return ok({ megethos: statistiko.size });
    } catch (sfalma) {
      if (einai_akyromeno(simatodotis)) {
        return apotyxia('AKYROTHIKE', 'Η λήψη ακυρώθηκε από τον καλούντα');
      }
      const katastasi = kodikos_katastasis_apo_sfalma(sfalma);
      if (katastasi !== undefined) {
        await svise_prosrino(pliri);
        return apotyxia('DEN_VRETHIKE', `Η λήψη απέτυχε με κατάσταση ${katastasi}`);
      }
      return apotyxia('DIKTYO', 'Αποτυχία δικτύου κατά τη λήψη', sfalma);
    }
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_katevasma_pyli(riza: string): CapacitorKatevasmaPyli {
  return new CapacitorKatevasmaPyli(riza);
}
