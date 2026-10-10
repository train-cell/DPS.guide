import type {
  Apotelesma,
  HttpAitima,
  HttpApantisi,
  HttpPyli,
  KatagrafiPyli,
  KodikosSfalmatos,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
  MystikaPyli,
  RologiPyli,
} from '@dps/core';
import { LLM_TIMEOUT_MS, MEGISTES_EPANALIPSEIS, apotyxia, ok } from '@dps/core';
import {
  ANAMONOS_JITTER,
  BASIKO_ANAMONOS_MS,
  GEMINI_BASE_URL,
  GEMINI_EDOS,
  GEMINI_KEFALIDA_TYPOS,
  GEMINI_KLEIDI_KEFALIDA,
  GEMINI_MORFO_KLEIDI,
  GEMINI_STHIMA_APANTHISI,
  GEMINI_STHIMA_PROSFONE,
  GEMINI_TYPOS_KEIMENOU_JSON,
  KODIKOS_2XX_MAX,
  KODIKOS_2XX_MIN,
  KODIKOS_400,
  KODIKOS_401,
  KODIKOS_403,
  KODIKOS_404,
  KODIKOS_429,
  KODIKOS_500,
  MILLISECONDS_PER_SECOND,
  PARAPOGONH_ANAMONOU,
} from './statheroi.js';
import { gemini_sxima, pare_keimeno_apantisis } from './sxedio.js';
import type { SximaGemini } from './sxedio.js';

export interface EisodosGemini {
  montelo: string;
  base_url?: string;
  perimeno_ms?: (ms: number) => Promise<void>;
}

interface ZaxariaKlisis {
  periexomena: unknown[];
  systima: string;
  thermokrasia: number;
  simatodotis: AbortSignal | undefined;
  sisma: SximaGemini | null;
}

interface Xronologio {
  simatodotis: AbortSignal;
  apokopi: () => void;
}

export function perimeno_realis(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function gemini_url(base_url: string, montelo: string): string {
  const vasis = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;
  return `${vasis}${GEMINI_EDOS}/models/${encodeURIComponent(montelo)}:generateContent`;
}

export function anamonos_ms(epanalipsi: number, rologi: RologiPyli): number {
  const vasis = BASIKO_ANAMONOS_MS * PARAPOGONH_ANAMONOU ** (epanalipsi - 1);
  const meros = rologi.tora().getMilliseconds() / MILLISECONDS_PER_SECOND;
  return Math.round(vasis * (1 + meros * ANAMONOS_JITTER));
}

export function ftiaxe_gemini_llm(
  http: HttpPyli,
  mystika: MystikaPyli,
  rologi: RologiPyli,
  katagrafi: KatagrafiPyli,
  eisodos: EisodosGemini
): LlmPyli {
  const montelo = eisodos.montelo;
  const perimeno = eisodos.perimeno_ms ?? perimeno_realis;
  const url = gemini_url(eisodos.base_url ?? GEMINI_BASE_URL, montelo);

  async function anamonos_kai_perimeno(epanalipsi: number): Promise<boolean> {
    if (epanalipsi >= MEGISTES_EPANALIPSEIS) {
      return false;
    }
    const anamonos = anamonos_ms(epanalipsi, rologi);
    katagrafi.proeidopoiisi('llm: επανάληψη με backoff', { montelo, epanalipsi, anamonos_ms: anamonos });
    await perimeno(anamonos);
    return true;
  }

  async function klisi(zaxaria: ZaxariaKlisis): Promise<Apotelesma<string>> {
    const kleidi = await mystika.pare(GEMINI_MORFO_KLEIDI);
    if (kleidi === null || kleidi.trim().length === 0) {
      katagrafi.sfalma('llm: λείπει το κλειδί API του Gemini', { montelo });
      return apotyxia('AUTH_APOTYXIA', 'Δεν βρέθηκε κλειδί Gemini στα μυστικά (llm_api_key)');
    }

    const xronologio = arxizise_xrono(zaxaria.simatodotis);
    const aitima: HttpAitima = {
      methodos: 'POST',
      url,
      kefalides: {
        [GEMINI_KLEIDI_KEFALIDA]: kleidi,
        [GEMINI_KEFALIDA_TYPOS]: GEMINI_TYPOS_KEIMENOU_JSON,
      },
      soma_json: ftiaxe_soma(zaxaria),
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: LLM_TIMEOUT_MS,
      typos_apantisis: 'keimeno',
      simatodotis: xronologio.simatodotis,
    };

    try {
      let telos: KodikosSfalmatos = 'AGNOSTO';
      let minima = 'Άγνωστο σφάλμα από το Gemini';
      for (let epanalipsi = 1; epanalipsi <= MEGISTES_EPANALIPSEIS; epanalipsi += 1) {
        const apantisi = await stelto(http, aitima, xronologio.simatodotis);

        if (!apantisi.ok) {
          if (xronologio.simatodotis.aborted) {
            return apotyxia('TIMEOUT', 'Το αίτημα προς το Gemini διέκοψε το όριο χρόνου');
          }
          telos = 'DIKTYO';
          minima = 'Η κλήση στο Gemini απέτυχε σε επίπεδο σύνδεσης';
          if (!(await anamonos_kai_perimeno(epanalipsi)) || xronologio.simatodotis.aborted) {
            break;
          }
          continue;
        }

        const apantisi_ili = apantisi.timi;
        if (apantisi_ili.katastasi >= KODIKOS_2XX_MIN && apantisi_ili.katastasi < KODIKOS_2XX_MAX) {
          const keimeno = pare_keimeno_apantisis(apantisi_ili.keimeno);
          if (keimeno === null) {
            katagrafi.sfalma('llm: μη αναγνώσιμη απάντηση Gemini', {
              montelo,
              katastasi: apantisi_ili.katastasi,
            });
            return apotyxia('MI_EGKYRO_SXIMA', 'Η απάντηση του Gemini δεν είναι αναγνώσιμη');
          }
          katagrafi.pliroforia('llm: επιτυχής κλήση', {
            montelo,
            katastasi: apantisi_ili.katastasi,
            epanalipseis: epanalipsi,
          });
          return ok(keimeno);
        }

katagrafi.sfalma('llm: σφάλμα HTTP από το Gemini', {
            montelo,
            katastasi: apantisi_ili.katastasi,
            epanalipseis: epanalipsi,
          });

        if (apantisi_ili.katastasi === KODIKOS_401 || apantisi_ili.katastasi === KODIKOS_403) {
          return apotyxia('AUTH_APOTYXIA', 'Το Gemini απέρριψε το κλειδί API', {
            katastasi: apantisi_ili.katastasi,
          });
        }
        if (apantisi_ili.katastasi === KODIKOS_400) {
          return apotyxia('MI_EGKYRO_SXIMA', 'Το Gemini απέρριψε το σώμα του αιτήματος', {
            katastasi: apantisi_ili.katastasi,
          });
        }
        if (apantisi_ili.katastasi === KODIKOS_404) {
          return apotyxia('DEN_VRETHIKE', 'Το Gemini δεν βρήκε το ζητούμενο μοντέλο', {
            katastasi: apantisi_ili.katastasi,
            montelo,
          });
        }

        if (apantisi_ili.katastasi === KODIKOS_429) {
          telos = 'RATE_LIMIT';
          minima = 'Εξαντλήθηκε το όριο κλήσεων του Gemini';
        } else if (apantisi_ili.katastasi >= KODIKOS_500) {
          telos = 'DIKTYO';
          minima = 'Το Gemini επέστρεψε προσωρινό σφάλμα σέρβερ';
        } else {
          return apotyxia('AGNOSTO', `Μη αναμενόμενος κωδικός HTTP από το Gemini: ${apantisi_ili.katastasi}`, {
            katastasi: apantisi_ili.katastasi,
          });
        }

        if (!(await anamonos_kai_perimeno(epanalipsi)) || xronologio.simatodotis.aborted) {
          break;
        }
      }
      return apotyxia(telos, minima, { montelo, epanalipseis: MEGISTES_EPANALIPSEIS });
    } finally {
      xronologio.apokopi();
    }
  }

  return {
    montelo,
    async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
      let sisma: SximaGemini;
      try {
        sisma = gemini_sxima(a.sxima);
      } catch {
        katagrafi.sfalma('llm: το σχήμα δεν μετατρέπεται σε JSON Schema', { montelo });
        return apotyxia('MI_YPOSTIRIZOMENO', 'Το ζητούμενο σχήμα δεν μετατρέπεται σε JSON Schema');
      }
      const periexomena: unknown[] = [{ role: GEMINI_STHIMA_PROSFONE, parts: [{ text: a.xristis }] }];
      const trexo = await klisi({
        periexomena,
        systima: a.systima,
        thermokrasia: a.thermokrasia,
        simatodotis: a.simatodotis,
        sisma,
      });
      if (!trexo.ok) {
        return trexo;
      }
      let dedomena: unknown;
      try {
        dedomena = JSON.parse(trexo.timi);
      } catch {
        return apotyxia('MI_EGKYRO_SXIMA', 'Η απάντηση του Gemini δεν είναι έγκυρο JSON');
      }
      const checked = a.sxima.safeParse(dedomena);
      if (!checked.success) {
        katagrafi.sfalma('llm: η απάντηση δεν ταιριάζει με το ζητούμενο σχήμα', { montelo });
        return apotyxia('MI_EGKYRO_SXIMA', 'Η απάντηση του Gemini δεν ταιριάζει με το ζητούμενο σχήμα', {
          proleimata: checked.error.issues,
        });
      }
      return ok(checked.data);
    },
    async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
      const periexomena: unknown[] = a.minimata.map((m) => ({
        role: m.rolos === 'montelo' ? GEMINI_STHIMA_APANTHISI : GEMINI_STHIMA_PROSFONE,
        parts: [{ text: m.keimeno }],
      }));
      return klisi({
        periexomena,
        systima: a.systima,
        thermokrasia: a.thermokrasia,
        simatodotis: a.simatodotis,
        sisma: null,
      });
    },
  };
}

function ftiaxe_soma(zaxaria: ZaxariaKlisis): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = { temperature: zaxaria.thermokrasia };
  if (zaxaria.sisma !== null) {
    generationConfig['responseMimeType'] = GEMINI_TYPOS_KEIMENOU_JSON;
    generationConfig['responseSchema'] = zaxaria.sisma;
  }
  const soma: Record<string, unknown> = {
    contents: zaxaria.periexomena,
    generationConfig,
  };
  if (zaxaria.systima.length > 0) {
    soma['systemInstruction'] = { parts: [{ text: zaxaria.systima }] };
  }
  return soma;
}

function arxizise_xrono(xristi: AbortSignal | undefined): Xronologio {
  const controller = new AbortController();
  const apokopies: (() => void)[] = [];
  if (xristi !== undefined) {
    const forward = (): void => {
      controller.abort();
    };
    if (xristi.aborted) {
      controller.abort();
    } else {
      xristi.addEventListener('abort', forward, { once: true });
      apokopies.push(() => {
        xristi.removeEventListener('abort', forward);
      });
    }
  }
  const xronologio = setTimeout(() => {
    controller.abort();
  }, LLM_TIMEOUT_MS);
  apokopies.push(() => {
    clearTimeout(xronologio);
  });
  return {
    simatodotis: controller.signal,
    apokopi: () => {
      for (const apokopi of apokopies) {
        apokopi();
      }
    },
  };
}

async function stelto(
  http: HttpPyli,
  aitima: HttpAitima,
  simatodotis: AbortSignal
): Promise<Apotelesma<HttpApantisi>> {
  const apokopievres: (() => void)[] = [];
  const apostrofou = new Promise<'ABORT'>((resolve) => {
    const onAbort = (): void => {
      resolve('ABORT');
    };
    apokopievres.push(() => {
      simatodotis.removeEventListener('abort', onAbort);
    });
    simatodotis.addEventListener('abort', onAbort, { once: true });
  });
  try {
    const apantisi: Apotelesma<HttpApantisi> | 'ABORT' = simatodotis.aborted
      ? 'ABORT'
      : await Promise.race([http.aitima(aitima), apostrofou]);
    if (apantisi === 'ABORT') {
      return apotyxia('TIMEOUT', 'Το αίτημα προς το Gemini διέκοψε το όριο χρόνου');
    }
    return apantisi;
  } catch (err) {
    return apotyxia('DIKTYO', 'Η κλήση στο Gemini απέτυχε σε επίπεδο σύνδεσης', {
      onoma: err instanceof Error ? err.name : typeof err,
    });
  } finally {
    for (const apokopi of apokopievres) {
      apokopi();
    }
  }
}