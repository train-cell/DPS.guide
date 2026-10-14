/** `ApothikiPyli` πάνω στο `@capacitor/filesystem` (Directory.Data).
 *
 *  MIRROR του `NodeFsApothiki` — ίδια δημόσια API, ίδια μηνύματα, ίδιοι κωδικοί
 *  σφαλμάτων. Όλες οι διαδρομές περνούν από `karnikopoise_diadromi` (§5.3).
 *
 *  ΑΤΟΜΙΚΟΤΗΤΑ: `writeFile` σε `<proorismos>.tmp-<id>` → `rename` στον τελικό.
 *  Το iOS `rename` ΔΕΝ κάνει overwrite (verified: `service.renameItem` →
 *  FileManager.moveItem αποτυγχάνει αν ο προορισμός υπάρχει), οπότε ΣΒΗΝΕΤΑΙ
 *  πρώτα ο προορισμός (best-effort) πριν το rename — αλλιώς το atomic rename
 *  θα απέτυχε σε κάθε επανεγγραφή.
 *
 *  ΚΩΔΙΚΟΙ ΣΦΑΛΜΑΤΩΝ PLUGIN (verified native, `FilesystemError.swift`):
 *  - `OS-PLUG-FILE-0008` = fileNotFound
 *  - `OS-PLUG-FILE-0006` = invalidPath
 *  - `OS-PLUG-FILE-0010` = directoryAlreadyExists
 *  - `OS-PLUG-FILE-0013` = operationFailed
 *
 *  ΜΗΔΕΝΙΣΜΟΣ ΜΥΣΤΙΚΩΝ: στα μηνύματα μόνο η ΣΧΕΤΙΚΗ διαδρομή — ποτέ απόλυτη. */

import {
  Directory,
  Encoding,
  Filesystem,
  type FileInfo,
} from '@capacitor/filesystem';
import type { Apotelesma, ApothikiPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { karnikopoise_diadromi } from './diadromes.js';

/** Κωδικός plugin για «το αρχείο δεν βρέθηκε» (verified: FilesystemError.code 8). */
const KODIKOS_DEN_VRETHIKE = 'OS-PLUG-FILE-0008';
/** Κωδικός plugin για άκυρη διαδρομή (verified: FilesystemError.code 6). */
const KODIKOS_AKYRI_DIADROMI = 'OS-PLUG-FILE-0006';
/** Μέγεθος τμήματος για την κωδικοποίηση base64 (χιλιάδες bytes ανά String.fromCharCode). */
const TMIMA_BASE64 = 0x8000;

interface SfalmaMeKodiko {
  readonly code?: unknown;
}

/** Ανάγνωση του κωδικού σφάλματος του plugin — ποτέ το raw μήνυμα στα logs. */
function kodikos_plugin(sfalma: unknown): string | undefined {
  if (typeof sfalma !== 'object' || sfalma === null) {
    return undefined;
  }
  const kodikos = (sfalma as SfalmaMeKodiko).code;
  return typeof kodikos === 'string' ? kodikos : undefined;
}

/** Δευτερεύων εντοπισμός «δεν βρέθηκε» από το τεκμηριωμένο native μήνυμα
 *  (το Android μπορεί να μην επιστρέφει τον ίδιο κωδικό· verified iOS μήνυμα). */
function einai_den_vrethike(sfalma: unknown): boolean {
  return (
    sfalma instanceof Error &&
    (sfalma.message.includes('does not exist') || sfalma.message.includes('File not found'))
  );
}

/** Βέλος αναγνώρισης directory αντί για αρχείο (verified: `FileInfo.type`). */
function einai_fakelos(statistiko: FileInfo): boolean {
  return statistiko.type === 'directory';
}

/** Εύρεση υπάρχοντος αρχείου: `stat` και τύπος `file` (verified `FileInfo.type`). */
async function yparxei_arxeio(pliri: string): Promise<boolean> {
  try {
    const statistiko = await Filesystem.stat({ path: pliri, directory: Directory.Data });
    return !einai_fakelos(statistiko);
  } catch {
    return false;
  }
}

/** Διαγραφή αρχείου αγνοώντας την απουσία του (best-effort πριν το rename). */
async function svise_an_yparxei(pliri: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: pliri, directory: Directory.Data });
  } catch {
    // ο προορισμός δεν υπήρχε — δεν εμποδίζει το rename
  }
}

/** Τυχαίο id για το προσωρινό αρχείο· `crypto.randomUUID` στο WebView
 *  (verified διαθέσιμο στα secure contexts) με εφεδρικό fallback. */
function tixaio_id(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** `Uint8Array` → base64 (χωρίς εξαρτήσεις· το plugin γράφει binary μόνο ως base64 —
 *  verified `WriteFileOptions.encoding` doc: χωρίς encoding = base64 decode before write). */
export function se_base64(dedomena: Uint8Array): string {
  let duadiko = '';
  for (let thesi = 0; thesi < dedomena.length; thesi += TMIMA_BASE64) {
    duadiko += String.fromCharCode(...dedomena.subarray(thesi, thesi + TMIMA_BASE64));
  }
  return btoa(duadiko);
}

/** base64 → `Uint8Array`. Το Android `readStreamAsBase64` τυλίγει τη γραμμή
 *  στους 76 χαρακτήρες (verified native `Base64.DEFAULT`) → αφαιρείται κάθε
 *  whitespace πριν το `atob`. Το iOS `base64EncodedString` δεν τυλίγει. */
export function apo_base64(vasi: string): Uint8Array {
  const katharo = vasi.replace(/\s+/g, '');
  const duadiko = atob(katharo);
  const dedomena = new Uint8Array(duadiko.length);
  for (let theseis = 0; theseis < duadiko.length; theseis += 1) {
    dedomena[theseis] = duadiko.charCodeAt(theseis);
  }
  return dedomena;
}

export class CapacitorApothiki implements ApothikiPyli {
  constructor(private readonly riza: string) {}

  /** Λογική πλήρης διαδρομή (riza + σχετική) — αυτή περνά στο plugin ως `path`. */
  private pliri_diadromi(diadromi: string): Apotelesma<string> {
    const karnikis = karnikopoise_diadromi(diadromi);
    if (!karnikis.ok) {
      return karnikis;
    }
    const sxetiki = karnikis.timi;
    if (this.riza === '') {
      return ok(sxetiki);
    }
    return ok(`${this.riza}/${sxetiki}`);
  }

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { timi: pliri } = topikes;
    try {
      const apotelesma = await Filesystem.readFile({
        path: pliri,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      if (typeof apotelesma.data !== 'string') {
        return apotyxia('AGNOSTO', 'Η ανάγνωση δεν επέστρεψε κείμενο');
      }
      return ok(apotelesma.data);
    } catch (sfalma) {
      const kodikos = kodikos_plugin(sfalma);
      if (kodikos === KODIKOS_DEN_VRETHIKE || einai_den_vrethike(sfalma)) {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${pliri}`);
      }
      if (kodikos === KODIKOS_AKYRI_DIADROMI) {
        return apotyxia('MI_EGKYRO_SXIMA', `Η διαδρομή είναι φάκελος: ${pliri}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${pliri}`, kodikos);
    }
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { timi: pliri } = topikes;
    try {
      // Χωρίς encoding το plugin επιστρέφει base64 (verified `ReadFileOptions.encoding` doc).
      const apotelesma = await Filesystem.readFile({
        path: pliri,
        directory: Directory.Data,
      });
      if (typeof apotelesma.data !== 'string') {
        return apotyxia('AGNOSTO', 'Η ανάγνωση δεν επέστρεψε δυαδικά δεδομένα');
      }
      return ok(apo_base64(apotelesma.data));
    } catch (sfalma) {
      const kodikos = kodikos_plugin(sfalma);
      if (kodikos === KODIKOS_DEN_VRETHIKE || einai_den_vrethike(sfalma)) {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${pliri}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${pliri}`, kodikos);
    }
  }

  async grapse_keimeno(diadromi: string, periexomeno: string): Promise<Apotelesma<void>> {
    const dedomena = new TextEncoder().encode(periexomeno);
    return this.grapse_atomika(diadromi, dedomena, Encoding.UTF8);
  }

  async grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    return this.grapse_atomika(diadromi, dedomena, undefined);
  }

  private async grapse_atomika(
    diadromi: string,
    dedomena: Uint8Array,
    encoding: Encoding | undefined
  ): Promise<Apotelesma<void>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const pliri = topikes.timi;
    const prosorino = `${pliri}.tmp-${tixaio_id()}`;
    try {
      // Το mkdir αφορά μόνο τον γονικό φάκελο. Αν περάσει το πλήρες όνομα
      // αρχείου, το plugin δημιουργεί directory εκεί και το writeFile αποτυγχάνει.
      const teleia = pliri.lastIndexOf('/');
      const goneas = teleia >= 0 ? pliri.slice(0, teleia) : '';
      if (goneas !== '') {
        await Filesystem.mkdir({
          path: goneas,
          directory: Directory.Data,
          recursive: true,
        });
      }
      await Filesystem.writeFile({
        path: prosorino,
        directory: Directory.Data,
        data: encoding === undefined ? se_base64(dedomena) : new TextDecoder().decode(dedomena),
        ...(encoding !== undefined ? { encoding } : {}),
      });
      await svise_an_yparxei(pliri);
      await Filesystem.rename({
        from: prosorino,
        to: pliri,
        directory: Directory.Data,
      });
      return ok(undefined);
    } catch (sfalma) {
      return apotyxia('AGNOSTO', `Απέτυχε η εγγραφή: ${pliri}`, kodikos_plugin(sfalma));
    } finally {
      await svise_an_yparxei(prosorino);
    }
  }

  async yparxei(diadromi: string): Promise<boolean> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return false;
    }
    return yparxei_arxeio(topikes.timi);
  }

  async lista(fakelos: string): Promise<Apotelesma<string[]>> {
    const topikes = this.pliri_diadromi(fakelos);
    if (!topikes.ok) {
      return topikes;
    }
    const arxeia = await this.pernigai_fakelo(topikes.timi);
    if (!arxeia.ok) {
      return arxeia;
    }
    return ok(arxeia.timi.sort());
  }

  /** Αναδρομικό περπάτημα — το `readdir` του plugin ΔΕΝ είναι recursive
   *  (verified: «Return a list of files from the directory (not recursive)»). */
  private async pernigai_fakelo(pliri_fakelos: string): Promise<Apotelesma<string[]>> {
    let eggrafes: FileInfo[];
    try {
      const apotelesma = await Filesystem.readdir({
        path: pliri_fakelos,
        directory: Directory.Data,
      });
      eggrafes = apotelesma.files;
    } catch (sfalma) {
      const kodikos = kodikos_plugin(sfalma);
      if (kodikos === KODIKOS_DEN_VRETHIKE || einai_den_vrethike(sfalma)) {
        return ok([]);
      }
      return apotyxia(
        'AGNOSTO',
        `Απέτυχε η ανάγνωση του φακέλου: ${pliri_fakelos}`,
        kodikos
      );
    }
    const apotelesmata: string[] = [];
    for (const eggrafi of eggrafes) {
      if (eggrafi.type === 'directory') {
        const ypokatalogos = await this.pernigai_fakelo(`${pliri_fakelos}/${eggrafi.name}`);
        if (!ypokatalogos.ok) {
          return ypokatalogos;
        }
        apotelesmata.push(...ypokatalogos.timi);
        continue;
      }
      if (eggrafi.type === 'file') {
        apotelesmata.push(`${pliri_fakelos}/${eggrafi.name}`);
      }
    }
    return ok(apotelesmata);
  }

  async diagrafi(diadromi: string): Promise<Apotelesma<void>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const pliri = topikes.timi;
    try {
      await Filesystem.deleteFile({ path: pliri, directory: Directory.Data });
      return ok(undefined);
    } catch (sfalma) {
      const kodikos = kodikos_plugin(sfalma);
      if (kodikos === KODIKOS_DEN_VRETHIKE || einai_den_vrethike(sfalma)) {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν υπάρχει: ${pliri}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η διαγραφή: ${pliri}`, kodikos);
    }
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_apothiki_pyli(riza: string): CapacitorApothiki {
  return new CapacitorApothiki(riza);
}
