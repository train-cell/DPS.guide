import { Capacitor } from '@capacitor/core';
import type {
  ApothikiPyli,
  HttpPyli,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
  MystikaPyli,
} from '@dps/core';
import { apotyxia } from '@dps/core';
import {
  CapacitorApothiki,
  CapacitorHttpPyli,
  CapacitorMystikaPyli,
} from '@dps/adapters-capacitor';
import type { Periballon } from '../periballon/periballon.js';
import { ftiaxe_periballon } from '../periballon/periballon.js';
import { KatagrafiMnimis } from '../periballon/katagrafi-mnimis.js';
import { IndexedDbApothiki } from './indexeddb-apothiki.js';
import { BrowserHttpPyli } from './browser-http.js';
import { ApothikiMystikaPyli, EncryptedMystikaPyli } from './vault.js';
import type { VaultSession } from './vault.js';
import { migrateGeminiModel, PROEPILOGI_GEMINI_MONTELO } from '../ypiresies/ai-models.js';

const GEMINI_MODEL = PROEPILOGI_GEMINI_MONTELO;

function isOllamaModel(model: string): boolean {
  return /^(llama|mistral|deepseek|qwen|gemma|phi|codellama)([.:\d-]|$)/i.test(model.trim());
}

function isGeminiModel(model: string): boolean {
  return /^gemini-[\w.-]+$/i.test(model.trim());
}

function isLoopbackPage(): boolean {
  if (typeof location === 'undefined') return false;
  return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
}

function unsupportedLlm(model: string, message: string): LlmPyli {
  return {
    montelo: model,
    async parage_json<T>(_request: LlmAitimaJson<T>) {
      return apotyxia('MI_YPOSTIRIZOMENO', message);
    },
    async parage_keimeno(_request: LlmAitimaKeimenou) {
      return apotyxia('MI_YPOSTIRIZOMENO', message);
    },
  };
}

export interface DeviceStorage {
  readonly apothiki: ApothikiPyli;
  readonly mystika: MystikaPyli;
  readonly native: boolean;
}

/** Device-local raw storage. The vault wraps it before any application data is read or written. */
export function createDeviceStorage(): DeviceStorage {
  const native = Capacitor.isNativePlatform();
  if (native) {
    return {
      apothiki: new CapacitorApothiki('DPS.guide'),
      mystika: new CapacitorMystikaPyli(),
      native: true,
    };
  }
  const apothiki = new IndexedDbApothiki();
  return { apothiki, mystika: new ApothikiMystikaPyli(apothiki), native: false };
}

/** Composes only real device adapters after the user unlocks the encrypted vault. */
export function createProductionPeriballon(
  device: DeviceStorage,
  session: VaultSession,
): Periballon {
  const apothiki = session.storage;
  const mystika = new EncryptedMystikaPyli(device.mystika, session.dataKey);
  const http: HttpPyli = device.native ? new CapacitorHttpPyli() : new BrowserHttpPyli();
  const rologi = { tora: () => new Date() };
  const katagrafi = new KatagrafiMnimis();
  let activeModel = GEMINI_MODEL;
  const llm: LlmPyli = {
    get montelo() { return activeModel; },
    async parage_json<T>(request: LlmAitimaJson<T>) {
      const provider = await chooseLlm();
      return provider.parage_json(request);
    },
    async parage_keimeno(request: LlmAitimaKeimenou) {
      const provider = await chooseLlm();
      return provider.parage_keimeno(request);
    },
  };

  async function chooseLlm(): Promise<LlmPyli> {
    const saved = await apothiki.diavase_keimeno('rythmiseis.json');
    let model = GEMINI_MODEL;
    let ollamaUrl = 'http://localhost:11434';
    if (saved.ok) {
      try {
        const settings: unknown = JSON.parse(saved.timi);
        if (typeof settings === 'object' && settings !== null) {
          const record = settings as { onomaMontelou?: unknown; urlOllama?: unknown };
          if (typeof record.onomaMontelou === 'string' && record.onomaMontelou.trim()) {
            model = migrateGeminiModel(record.onomaMontelou.trim());
          }
          if (typeof record.urlOllama === 'string' && record.urlOllama.trim()) ollamaUrl = record.urlOllama.trim();
        }
      } catch {
        // Invalid settings fail closed to the documented Gemini default.
      }
    }
    activeModel = model;
    if (isGeminiModel(model)) {
      const { ftiaxe_gemini_llm } = await import('@dps/ai');
      return ftiaxe_gemini_llm(http, mystika, rologi, katagrafi, { montelo: model });
    }
    if (!isOllamaModel(model)) {
      return unsupportedLlm(model, 'Ο αποθηκευμένος πάροχος δεν υποστηρίζεται. Επίλεξε Gemini ή τοπικό Ollama στις ρυθμίσεις AI.');
    }
    if (device.native) {
      return unsupportedLlm(model, 'Το Ollama υποστηρίζεται μόνο σε Windows/macOS στον ίδιο υπολογιστή.');
    }
    if (!isLoopbackPage()) {
      return unsupportedLlm(model, 'Για χρήση από κινητό επίλεξε Gemini ή απενεργοποίησε την AI. Το Ollama παραμένει μόνο στον ίδιο υπολογιστή.');
    }
    try {
      const { ftiaxe_ollama_llm } = await import('@dps/ai');
      return ftiaxe_ollama_llm(http, model, ollamaUrl, katagrafi);
    } catch (reason) {
      return unsupportedLlm(model, reason instanceof Error ? reason.message : 'Η ρύθμιση Ollama δεν είναι έγκυρη.');
    }
  }
  return ftiaxe_periballon({ apothiki, mystika, http, llm, rologi, katagrafi });
}
