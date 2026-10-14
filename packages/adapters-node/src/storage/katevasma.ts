/** Υλοποίηση `KatevasmaPyli` πάνω στο global `fetch` του Node 22+, με
 *  `redirect: 'manual'` και χειροκίνητο βρόχο ανακατευθύνσεων (βλ. `anakateuthinsi.ts`).
 *
 *  Το `fetch` του Node βασίζεται εσωτερικά στο Undici. Δεν υπάρχει ρητό Undici
 *  dependency: όλη η μετατροπή του response stream σε Node stream είναι απομονωμένη
 *  στη `katevase_reuma`.
 *
 *  ΑΤΟΜΙΚΟΤΗΤΑ: το σώμα ροής γράφεται σε προσωρινό αρχείο (`<proorismos>.tmp-<uuid>`)
 *  και μετονομάζεται ατομικά στο τελικό μόνο μετά την πλήρη λήψη. Κάθε αποτυχία
 *  αφήνει πίσω ΜΟΝΟ το τελικό αρχείο ή τίποτα — ποτέ μερικό αρχείο.
 *
 *  ΜΗΔΕΝΙΣΜΟΣ ΜΥΣΤΙΚΩΝ: τα μηνύματα σφάλματος δεν περιέχουν ποτέ URL, query,
 *  κεφαλίδες ή σώμα· μόνο τον κωδικό κατάστασης όπου χρειάζεται. */

import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Apotelesma, KatevasmaPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { karnikopoise_diadromi } from './diadromes.js';
import { CookieJar, parse_set_cookies } from '../http/cookie-jar.js';
import { MEGISTES_ANAKATEUTHINSEIS, apofasi_anakateuthinsis } from '../http/anakateuthinsi.js';

const ELAXISTOS_KODIKOS_EPITYXIAS = 200;
const MEGESTOS_KODIKOS_EPITYXIAS = 299;
const MEGISTES_EPANALIPSEIS_DIAGRAFIS = 5;
const KATHYSTERISI_EPANALIPSIS_MS = 50;

/** Παράθυρο επιτυχίας: κάθε 2xx κατάσταση είναι αποδεκτή λήψη. */
function einai_epityxis_katastasi(katastasi: number): boolean {
  return katastasi >= ELAXISTOS_KODIKOS_EPITYXIAS && katastasi <= MEGESTOS_KODIKOS_EPITYXIAS;
}

/** Αναγνώριση σφάλματος ακύρωσης από το AbortSignal του `fetch`/ροής. */
function einai_akyrosi(sfalma: unknown): boolean {
  return sfalma instanceof Error && sfalma.name === 'AbortError';
}

/** Εύρεση υπάρχουσας κεφαλίδας `Cookie` με ανεπιτήρητη κεφαλαία. */
function pare_kefalida_cookie(kefalides: Record<string, string>): string | undefined {
  for (const [kleidi, timi] of Object.entries(kefalides)) {
    if (kleidi.toLowerCase() === 'cookie') {
      return timi;
    }
  }
  return undefined;
}

/** Συνθέτει τις κεφαλίδες του αιτήματος: οι κεφαλίδες του καλούντα μένουν ως έχουν
 *  και προστίθενται τα cookies που συλλέχθηκαν από τα ενδιάμεσα 30x. */
function synthese_kefalidon(
  basika: Record<string, string>,
  zakari: CookieJar,
  trexon: URL
): Record<string, string> {
  const kefalides: Record<string, string> = { ...basika };
  const cookies_zakari = zakari.kefalida_gia(trexon);
  if (cookies_zakari !== '') {
    const yparxon = pare_kefalida_cookie(basika);
    kefalides['Cookie'] =
      yparxon === undefined ? cookies_zakari : `${yparxon}; ${cookies_zakari}`;
  }
  return kefalides;
}

/** Μετατροπή του web σώματος της απάντησης σε Node Readable — το ΜΟΝΟ σημείο
 *  transport coupling, απομονωμένο για μελλοντική μετάβαση σε `undici`. */
function katevase_reuma(soma: unknown): Readable {
  return Readable.fromWeb(soma as Parameters<typeof Readable.fromWeb>[0]);
}

function perimene_kleisimo(reuma: ReturnType<typeof createWriteStream>): Promise<void> {
  if (reuma.closed) {
    return Promise.resolve();
  }
  return new Promise<void>((lysi) => {
    reuma.once('close', () => lysi());
  });
}

/** Ροή σώματος → προσωρινό αρχείο· επιστρέφει το πλήθος γραμμένων bytes.
 *  Αδειάζει (drain) το σώμα των ενδιάμεσων 30x πριν την επόμενη ανακατεύθυνση. */
async function katevase_soma(apantisi: Response, prosorinos: string): Promise<number> {
  if (apantisi.body === null) {
    await writeFile(prosorinos, new Uint8Array());
    return 0;
  }
  let megethos = 0;
  const katagrafi = createWriteStream(prosorinos);
  try {
    const metritis = new Transform({
      transform(tmima: Uint8Array, _kodikopoihsi, epanaklisi): void {
        megethos += tmima.length;
        epanaklisi(null, tmima);
      },
    });
    await pipeline(katevase_reuma(apantisi.body), metritis, katagrafi);
    return megethos;
  } finally {
    await perimene_kleisimo(katagrafi);
  }
}

/** Απελευθέρωση του σώματος μιας ενδιάμεσης απάντησης (30x/σφάλμα) χωρίς ανάγνωση. */
async function akyrose_soma(apantisi: Response): Promise<void> {
  await apantisi.body?.cancel().catch(() => undefined);
}

export class NodeKatevasmaPyli implements KatevasmaPyli {
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
    const telikos = path.join(this.riza, karnikis.timi);
    const prosorinos = `${telikos}.tmp-${randomUUID()}`;

    if (simatodotis?.aborted) {
      return apotyxia('AKYROTHIKE', 'Η λήψη ακυρώθηκε πριν από την εκκίνησή της');
    }

    let trexon: URL;
    try {
      trexon = new URL(url);
    } catch {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το URL της λήψης δεν είναι έγκυρο');
    }

    const zakari = new CookieJar();
    try {
      await mkdir(path.dirname(telikos), { recursive: true });

      let apantisi: Response | undefined;
      for (let ana = 0; ; ana += 1) {
        const trexousa = await fetch(trexon.href, {
          method: 'GET',
          headers: synthese_kefalidon(kefalides, zakari, trexon),
          redirect: 'manual',
          signal: simatodotis ?? null,
        });

        zakari.val_se_ola(parse_set_cookies(trexousa.headers.getSetCookie(), trexon));

        const apofasi = apofasi_anakateuthinsis(
          'GET',
          trexousa.status,
          trexousa.headers.get('location'),
          trexon.href
        );

        if (apofasi.eidos === 'telos') {
          apantisi = trexousa;
          break;
        }
        if (ana >= MEGISTES_ANAKATEUTHINSEIS) {
          await akyrose_soma(trexousa);
          return apotyxia(
            'DIKTYO',
            `Υπέρβαση μέγιστου αριθμού ανακατευθύνσεων (${MEGISTES_ANAKATEUTHINSEIS})`
          );
        }
        await akyrose_soma(trexousa);
        trexon = new URL(apofasi.url);
      }

      if (!einai_epityxis_katastasi(apantisi.status)) {
        await akyrose_soma(apantisi);
        return apotyxia('DEN_VRETHIKE', `Η λήψη απέτυχε με κατάσταση ${apantisi.status}`);
      }

      const megethos = await katevase_soma(apantisi, prosorinos);
      await rename(prosorinos, telikos);
      return ok({ megethos });
    } catch (sfalma) {
      if (simatodotis?.aborted || einai_akyrosi(sfalma)) {
        return apotyxia('AKYROTHIKE', 'Η λήψη ακυρώθηκε από τον καλούντα');
      }
      return apotyxia('DIKTYO', 'Αποτυχία δικτύου κατά τη λήψη', sfalma);
    } finally {
      await rm(prosorinos, {
        force: true,
        recursive: true,
        maxRetries: MEGISTES_EPANALIPSEIS_DIAGRAFIS,
        retryDelay: KATHYSTERISI_EPANALIPSIS_MS,
      }).catch(() => undefined);
    }
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_katevasma_pyli(riza: string): NodeKatevasmaPyli {
  return new NodeKatevasmaPyli(riza);
}
