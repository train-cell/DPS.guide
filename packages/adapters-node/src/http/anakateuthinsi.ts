/** Αγνός βρόχος ανακατευθύνσεων: μηδενικό δίκτυο, μηδενικό I/O.
 *  Παίρνει μια «εκδότρια» αιτημάτων (function) και αναπαράγει χειροκίνητα τη ροή
 *  των 30x, ώστε να συλλέγονται τα `Set-Cookie` ΟΛΩΝ των ενδιάμεσων αποκρίσεων
 *  πριν από την επόμενη ανακατεύθυνση — απαραίτητο για τη ροή CAS.
 *  Το επόμενο αίτημα στέλνει τα cookies του jar για τον ίδιο (ή υπο-)domain.
 *  Δεν καταπίνει errors: κάθε αποτυχία επιστρέφει `apotyxia` με ανάλογο κωδικό. */

import type { Apotelesma, HttpApantisi } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { CookieJar, parse_set_cookies } from './cookie-jar.js';

export const MEGISTES_ANAKATEUTHINSEIS = 10;

const KODIKI_301 = 301;
const KODIKI_302 = 302;
const KODIKI_303 = 303;
const KODIKI_307 = 307;
const KODIKI_308 = 308;

/** 301/302/303: με GET/HEAD διατηρείται η μέθοδο, με POST γίνεται GET και χάνεται το σώμα. */
const ANAKATEUTHINSEIS_ME_METHODO_GET: readonly number[] = [KODIKI_301, KODIKI_302, KODIKI_303];
/** 307/308: διατηρείται η μέθοδος ΚΑΙ το σώμα του αιτήματος. */
const ANAKATEUTHINSEIS_ME_MONIMO_METHODO: readonly number[] = [KODIKI_307, KODIKI_308];

const TOULAXISTON_XRONOS_ORIOU_MS = 0;

export type MethodosAitimatos = 'GET' | 'POST' | 'HEAD';

export type TyposApantisisLoop = 'keimeno' | 'dyadiko';

export interface AitimaProsEkdoti {
  readonly methodos: MethodosAitimatos;
  readonly url: string;
  readonly kefalides: Record<string, string>;
  readonly soma: BodyInit | null;
}

export interface ApantisiEkdoti {
  readonly url: string;
  readonly katastasi: number;
  /** Κεφαλίδες ως multi-map· πολλαπλές τιμές (π.χ. Set-Cookie) διατηρούνται. */
  readonly kefalides: Record<string, readonly string[]>;
  keimeno(): Promise<string>;
  dyadiko(): Promise<Uint8Array>;
}

export type EkdotisAitimaton = (
  aitima: AitimaProsEkdoti,
  sima: AbortSignal
) => Promise<ApantisiEkdoti>;

export interface BasikaAnakateuthinsis {
  readonly methodos: MethodosAitimatos;
  readonly url: string;
  readonly kefalides: Record<string, string>;
  readonly soma: BodyInit | null;
  readonly akolouthise: boolean;
  readonly xronos_orio_ms: number;
  readonly typos: TyposApantisisLoop;
  readonly simatodotis: AbortSignal | undefined;
}

export type ApofasiAnakateuthinsis =
  | { readonly eidos: 'telos' }
  | {
      readonly eidos: 'senenxisi';
      readonly methodos: MethodosAitimatos;
      readonly url: string;
      readonly kratima_somatos: boolean;
    };

/** Πίνακας αποφάσεων ανακατεύθυνσης (καθαρή συνάρτηση, χωρίς δίκτυο). */
export function apofasi_anakateuthinsis(
  methodos: MethodosAitimatos,
  katastasi: number,
  thesi: string | null,
  vasi: string
): ApofasiAnakateuthinsis {
  if (thesi === null) {
    return { eidos: 'telos' };
  }
  let stoxos: URL;
  try {
    stoxos = new URL(thesi, vasi);
  } catch {
    return { eidos: 'telos' };
  }
  if (ANAKATEUTHINSEIS_ME_MONIMO_METHODO.includes(katastasi)) {
    return { eidos: 'senenxisi', methodos, url: stoxos.href, kratima_somatos: true };
  }
  if (ANAKATEUTHINSEIS_ME_METHODO_GET.includes(katastasi)) {
    const nea_methodos: MethodosAitimatos =
      methodos === 'GET' || methodos === 'HEAD' ? methodos : 'GET';
    return { eidos: 'senenxisi', methodos: nea_methodos, url: stoxos.href, kratima_somatos: false };
  }
  return { eidos: 'telos' };
}

interface SinedrioSimatos {
  readonly sima: AbortSignal;
  readonly exei_apotyxei_timeout: () => boolean;
  readonly exei_akyrothei: () => boolean;
  apodesmeusi(): void;
}

/** Συνδυάζει το εξωτερικό σήμα ακύρωσης με το εσωτερικό χρονικό όριο:
 *  οποιοδήποτε abort νωρίτερα τερματίζει το τρέχον αίτημα. */
function syndyasmos_simaton(
  exoteriko: AbortSignal | undefined,
  xronos_orio_ms: number
): SinedrioSimatos {
  const elegktis = new AbortController();
  let time_out = false;
  let akyrothike = false;
  const xronometris =
    xronos_orio_ms > TOULAXISTON_XRONOS_ORIOU_MS
      ? setTimeout(() => {
          time_out = true;
          elegktis.abort();
        }, xronos_orio_ms)
      : undefined;

  const se_akyrosi_exoterikou = (): void => {
    akyrothike = true;
    elegktis.abort();
  };

  if (exoteriko !== undefined) {
    if (exoteriko.aborted) {
      akyrothike = true;
      elegktis.abort();
    } else {
      exoteriko.addEventListener('abort', se_akyrosi_exoterikou, { once: true });
    }
  }

  return {
    sima: elegktis.signal,
    exei_apotyxei_timeout: () => time_out,
    exei_akyrothei: () => akyrothike,
    apodesmeusi: () => {
      if (xronometris !== undefined) {
        clearTimeout(xronometris);
      }
      if (exoteriko !== undefined) {
        exoteriko.removeEventListener('abort', se_akyrosi_exoterikou);
      }
    },
  };
}

function pare_kefalida(kefalides: Record<string, string>, onoma: string): string | undefined {
  for (const [kleidi, timi] of Object.entries(kefalides)) {
    if (kleidi.toLowerCase() === onoma) {
      return timi;
    }
  }
  return undefined;
}

function dimiourgise_kefalides(
  basika: BasikaAnakateuthinsis,
  zakari: CookieJar,
  trexon: URL
): Record<string, string> {
  const kefalides: Record<string, string> = { ...basika.kefalides };
  const zakari_cookies = zakari.kefalida_gia(trexon);
  if (zakari_cookies !== '') {
    const yparxon = pare_kefalida(basika.kefalides, 'cookie');
    kefalides['Cookie'] = yparxon === undefined ? zakari_cookies : `${yparxon}; ${zakari_cookies}`;
  }
  return kefalides;
}

async function dimiourgise_teliki_apantisi(
  apantisi: ApantisiEkdoti,
  trexon: URL,
  kefalides: Record<string, string>,
  typos: TyposApantisisLoop
): Promise<Apotelesma<HttpApantisi>> {
  const teliko_url = apantisi.url === '' ? trexon.href : apantisi.url;
  try {
    if (typos === 'dyadiko') {
      return ok({
        katastasi: apantisi.katastasi,
        kefalides,
        teliko_url,
        dyadiko: await apantisi.dyadiko(),
      });
    }
    return ok({
      katastasi: apantisi.katastasi,
      kefalides,
      teliko_url,
      keimeno: await apantisi.keimeno(),
    });
  } catch (sfalma) {
    return apotyxia('DIKTYO', 'Αποτυχία ανάγνωσης του σώματος της απάντησης', sfalma);
  }
}

export async function anakateuthinsi(
  basika: BasikaAnakateuthinsis,
  ekdotis: EkdotisAitimaton,
  zakari: CookieJar
): Promise<Apotelesma<HttpApantisi>> {
  if (basika.simatodotis?.aborted === true) {
    return apotyxia('AKYROTHIKE', 'Το αίτημα ακυρώθηκε πριν από την εκτέλεσή του');
  }

  let trexon: URL;
  try {
    trexon = new URL(basika.url);
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το URL του αιτήματος δεν είναι έγκυρο');
  }

  let methodos = basika.methodos;
  let soma = basika.soma;

  for (let ana = 0; ; ana += 1) {
    const sinero = syndyasmos_simaton(basika.simatodotis, basika.xronos_orio_ms);
    try {
      const apantisi = await ekdotis(
        {
          methodos,
          url: trexon.href,
          kefalides: dimiourgise_kefalides(basika, zakari, trexon),
          soma,
        },
        sinero.sima
      );

      // Τα ενδιάμεσα Set-Cookie συλλέγονται ΠΑΝΤΑ πριν την επόμενη ανακατεύθυνση.
      zakari.val_se_ola(parse_set_cookies(apantisi.kefalides['set-cookie'] ?? [], trexon));

      const kefalides_sen_morphi_record: Record<string, string> = {};
      for (const [kleidi, times] of Object.entries(apantisi.kefalides)) {
        kefalides_sen_morphi_record[kleidi] = times.join(', ');
      }

      const apofasi = apofasi_anakateuthinsis(
        methodos,
        apantisi.katastasi,
        apantisi.kefalides['location']?.[0] ?? null,
        trexon.href
      );

      if (!basika.akolouthise || apofasi.eidos === 'telos') {
        return await dimiourgise_teliki_apantisi(
          apantisi,
          trexon,
          kefalides_sen_morphi_record,
          basika.typos
        );
      }

      if (ana >= MEGISTES_ANAKATEUTHINSEIS) {
        return apotyxia(
          'DIKTYO',
          `Υπέρβαση μέγιστου αριθμού ανακατευθύνσεων (${MEGISTES_ANAKATEUTHINSEIS})`
        );
      }

      methodos = apofasi.methodos;
      trexon = new URL(apofasi.url);
      if (!apofasi.kratima_somatos) {
        soma = null;
      }
    } catch (sfalma) {
      if (sinero.exei_apotyxei_timeout()) {
        return apotyxia('TIMEOUT', 'Το αίτημα υπέρβαγε το επιτρεπτό χρονικό όριο');
      }
      if (sinero.exei_akyrothei()) {
        return apotyxia('AKYROTHIKE', 'Το αίτημα ακυρώθηκε από τον καλούντα');
      }
      return apotyxia('DIKTYO', 'Αποτυχία δικτύου κατά την εκτέλεση του αιτήματος', sfalma);
    } finally {
      sinero.apodesmeusi();
    }
  }
}
