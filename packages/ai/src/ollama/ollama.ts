import type {
  Apotelesma,
  HttpAitima,
  HttpPyli,
  KatagrafiPyli,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
} from '@dps/core';
import { apotyxia, ok } from '@dps/core';

const OLLAMA_TIMEOUT_MS = 180_000;

interface OllamaChatResponse {
  readonly message?: { readonly content?: unknown };
  readonly error?: unknown;
}

/** Ollama adapter for a local desktop browser. It never selects a remote Ollama host. */
export function ftiaxe_ollama_llm(
  http: HttpPyli,
  montelo: string,
  baseUrl: string,
  katagrafi: KatagrafiPyli,
): LlmPyli {
  let endpoint: string;
  try {
    const parsed = new URL(baseUrl);
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
    if (parsed.protocol !== 'http:' || !localHosts.has(parsed.hostname)) {
      throw new Error('Local Ollama only');
    }
    endpoint = `${parsed.origin}/api/chat`;
  } catch {
    throw new Error('Το Ollama επιτρέπεται μόνο στην ίδια συσκευή (localhost).');
  }

  async function complete(
    messages: readonly { readonly role: 'system' | 'user' | 'assistant'; readonly content: string }[],
    temperature: number,
    formatJson: boolean,
    signal?: AbortSignal,
  ): Promise<Apotelesma<string>> {
    const request: HttpAitima = {
      methodos: 'POST',
      url: endpoint,
      kefalides: { 'content-type': 'application/json' },
      soma_json: {
        model: montelo,
        stream: false,
        ...(formatJson ? { format: 'json' } : {}),
        messages,
        options: { temperature },
      },
      akolouthise_anakateuthinseis: false,
      xronos_orio_ms: OLLAMA_TIMEOUT_MS,
      typos_apantisis: 'keimeno',
      ...(signal === undefined ? {} : { simatodotis: signal }),
    };

    const response = await http.aitima(request);
    if (!response.ok) return response;
    if (response.timi.katastasi < 200 || response.timi.katastasi >= 300) {
      katagrafi.proeidopoiisi('llm: το τοπικό Ollama επέστρεψε σφάλμα', {
        montelo,
        katastasi: response.timi.katastasi,
      });
      return apotyxia(
        response.timi.katastasi === 404 ? 'DEN_VRETHIKE' : 'DIKTYO',
        response.timi.katastasi === 404
          ? `Δεν βρέθηκε το μοντέλο Ollama «${montelo}». Κατέβασέ το πρώτα με ollama pull.`
          : `Το τοπικό Ollama επέστρεψε HTTP ${response.timi.katastasi}.`,
      );
    }
    try {
      const parsed: unknown = JSON.parse(response.timi.keimeno ?? '');
      if (typeof parsed !== 'object' || parsed === null || !('message' in parsed)) {
        throw new Error('Missing message');
      }
      const content = (parsed as OllamaChatResponse).message?.content;
      if (typeof content !== 'string') throw new Error('Missing text content');
      return ok(content);
    } catch {
      katagrafi.sfalma('llm: μη αναγνώσιμη απάντηση από το τοπικό Ollama', { montelo });
      return apotyxia('MI_EGKYRO_SXIMA', 'Το Ollama επέστρεψε απάντηση που δεν αναγνωρίζεται.');
    }
  }

  return {
    montelo,
    async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
      return complete(
        [
          ...(a.systima === '' ? [] : [{ role: 'system' as const, content: a.systima }]),
          ...a.minimata.map((message) => ({
            role: message.rolos === 'montelo' ? ('assistant' as const) : ('user' as const),
            content: message.keimeno,
          })),
        ],
        a.thermokrasia,
        false,
        a.simatodotis,
      );
    },
    async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
      const output = await complete(
        [
          {
            role: 'system',
            content: `${a.systima}\nΕπέστρεψε μόνο έγκυρο JSON που ταιριάζει στο ζητούμενο σχήμα.`,
          },
          { role: 'user', content: a.xristis },
        ],
        a.thermokrasia,
        true,
        a.simatodotis,
      );
      if (!output.ok) return output;
      try {
        const parsed: unknown = JSON.parse(output.timi);
        const validated = a.sxima.safeParse(parsed);
        if (!validated.success) {
          katagrafi.sfalma('llm: η απάντηση Ollama δεν ταιριάζει με το ζητούμενο σχήμα', { montelo });
          return apotyxia('MI_EGKYRO_SXIMA', 'Η απάντηση του Ollama δεν ταιριάζει με το ζητούμενο σχήμα.');
        }
        return ok(validated.data);
      } catch {
        return apotyxia('MI_EGKYRO_SXIMA', 'Το Ollama δεν επέστρεψε έγκυρο JSON.');
      }
    },
  };
}
