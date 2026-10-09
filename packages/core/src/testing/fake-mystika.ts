import type { MystikaPyli, KleidiMystikou } from '../contracts/pyles.js';

export class FakeMystika implements MystikaPyli {
  private mystika = new Map<KleidiMystikou, string>();

  async pare(k: KleidiMystikou): Promise<string | null> {
    return this.mystika.get(k) ?? null;
  }

  async vale(k: KleidiMystikou, timi: string): Promise<void> {
    this.mystika.set(k, timi);
  }

  async svise(k: KleidiMystikou): Promise<void> {
    this.mystika.delete(k);
  }
}
