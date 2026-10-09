import type { ApothikiPyli } from '../contracts/pyles.js';
import type { Apotelesma } from '../contracts/apotelesma.js';
import { ok, apotyxia } from '../helpers.js';

export class MnimiApothiki implements ApothikiPyli {
  private arxeia = new Map<string, Uint8Array>();

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    const dedomena = this.arxeia.get(diadromi);
    if (!dedomena) {
      return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${diadromi}`);
    }
    const dec = new TextDecoder('utf-8');
    return ok(dec.decode(dedomena));
  }

  async grapse_keimeno(diadromi: string, periexomeno: string): Promise<Apotelesma<void>> {
    const enc = new TextEncoder();
    this.arxeia.set(diadromi, enc.encode(periexomeno));
    return ok(undefined);
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    const dedomena = this.arxeia.get(diadromi);
    if (!dedomena) {
      return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${diadromi}`);
    }
    return ok(new Uint8Array(dedomena));
  }

  async grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    this.arxeia.set(diadromi, new Uint8Array(dedomena));
    return ok(undefined);
  }

  async yparxei(diadromi: string): Promise<boolean> {
    return this.arxeia.has(diadromi);
  }

  async lista(fakelos: string): Promise<Apotelesma<string[]>> {
    const prefix = fakelos.endsWith('/') ? fakelos : `${fakelos}/`;
    const apotelesmata: string[] = [];
    for (const key of this.arxeia.keys()) {
      if (key.startsWith(prefix)) {
        apotelesmata.push(key);
      }
    }
    return ok(apotelesmata);
  }

  async diagrafi(diadromi: string): Promise<Apotelesma<void>> {
    if (!this.arxeia.has(diadromi)) {
      return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν υπάρχει: ${diadromi}`);
    }
    this.arxeia.delete(diadromi);
    return ok(undefined);
  }
}
