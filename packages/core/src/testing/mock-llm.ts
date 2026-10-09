import type { LlmPyli, LlmAitimaJson, LlmAitimaKeimenou } from '../contracts/pyles.js';
import type { Apotelesma } from '../contracts/apotelesma.js';
import { ok, apotyxia } from '../helpers.js';

export class MockLlm implements LlmPyli {
  readonly montelo: string;
  private jsonApantiseis = new Map<string, unknown>();
  private keimenoApantiseis = new Map<string, string>();

  constructor(montelo = 'mock-gemini-2.5-flash') {
    this.montelo = montelo;
  }

  orise_json(kleidi: string, dedomena: unknown): void {
    this.jsonApantiseis.set(kleidi, dedomena);
  }

  orise_keimeno(kleidi: string, apantisi: string): void {
    this.keimenoApantiseis.set(kleidi, apantisi);
  }

  async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    const dedomena = this.jsonApantiseis.get(a.xristis);
    if (dedomena !== undefined) {
      const parsed = a.sxima.safeParse(dedomena);
      if (parsed.success) {
        return ok(parsed.data);
      }
      return apotyxia('MI_EGKYRO_SXIMA', `MockLlm validation error: ${parsed.error.message}`, parsed.error);
    }
    return apotyxia('DEN_VRETHIKE', `MockLlm δεν βρέθηκε mocked JSON για: ${a.xristis}`);
  }

  async parage_keimeno(a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    const teleutaio = a.minimata[a.minimata.length - 1]?.keimeno ?? '';
    const apantisi = this.keimenoApantiseis.get(teleutaio);
    if (apantisi !== undefined) {
      return ok(apantisi);
    }
    return ok(`Mocked response for prompt v${a.ekdosi_prompt}`);
  }
}
