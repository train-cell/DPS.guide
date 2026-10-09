import type { KleidiMystikou, MystikaPyli, Sfalma } from '@dps/core';

/** Μήνυμα αποτυχίας για μυστικό που δεν βρέθηκε (χωρίς την τιμή του). */
function sfalma_den_vrethike(k: KleidiMystikou): Sfalma {
  return { kodikos: 'DEN_VRETHIKE', minima: `Το μυστικό δεν βρέθηκε: ${k}` };
}

/**
 * MystikaPyli στη μνήμη — για tests και fakes.
 *
 * Προσοχή: τα μυστικά ζουν στη RAM της διεργασίας· ποτέ για production χρήση.
 */
export class MnimiMystika implements MystikaPyli {
  private mystika = new Map<KleidiMystikou, string>();

  async pare(k: KleidiMystikou): Promise<string | null> {
    return this.mystika.get(k) ?? null;
  }

  async vale(k: KleidiMystikou, timi: string): Promise<void> {
    this.mystika.set(k, timi);
  }

  async svise(k: KleidiMystikou): Promise<void> {
    if (!this.mystika.delete(k)) {
      throw { sfalma: sfalma_den_vrethike(k) };
    }
  }
}
