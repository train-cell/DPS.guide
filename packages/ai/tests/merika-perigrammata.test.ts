import { describe, it, expect } from 'vitest';
import { synenose_merika_perigrammata } from '../src/prompts/index.js';
import type { Perigramma } from '@dps/core';

function ftiaxe_tmima(titlos: string, apo: number, eos: number) {
  return {
    titlos,
    selides: { apo, eos },
    typos: 'theoria' as const,
    ennoies: [titlos],
    proapaitoumena: [],
  };
}

function meriko_perigramma(arxeio_id: string, titlos: string, tmimata: Perigramma['tmimata']): Perigramma {
  return { arxeio_id, titlos, tmimata };
}

describe('synenose_merika_perigrammata', () => {
  it('ενώνει δύο μερικά περιγράμματα στη σειρά των κομματιών', () => {
    const aristeo = meriko_perigramma('arx-1', 'Σημειώσεις Δομές', [
      ftiaxe_tmima('Εισαγωγή', 1, 4),
      ftiaxe_tmima('Ορισμοί', 5, 9),
    ]);
    const dexio = meriko_perigramma('arx-1', 'Σημειώσεις Δομές', [
      ftiaxe_tmima('Θεωρία', 10, 14),
      ftiaxe_tmima('Ασκήσεις', 15, 20),
    ]);

    const apotelesma = synenose_merika_perigrammata([aristeo, dexio]);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.arxeio_id).toBe('arx-1');
    expect(apotelesma.timi.titlos).toBe('Σημειώσεις Δομές');
    expect(apotelesma.timi.tmimata.map((t) => t.titlos)).toEqual([
      'Εισαγωγή',
      'Ορισμοί',
      'Θεωρία',
      'Ασκήσεις',
    ]);
    expect(apotelesma.timi.tmimata).toHaveLength(4);
  });

  it('κρατάει ένα μερικό περίγραμμα ως έχει', () => {
    const mono = meriko_perigramma('arx-2', 'Μόνο ένα', [ftiaxe_tmima('Θεωρία', 1, 3)]);
    const apotelesma = synenose_merika_perigrammata([mono]);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi).toEqual(mono);
  });

  it('επιστρέφει MI_EGKYRO_SXIMA για κενή είσοδο', () => {
    const apotelesma = synenose_merika_perigrammata([]);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('κανένα μερικό περίγραμμα');
  });

  it('επιστρέφει MI_EGKYRO_SXIMA όταν το arxeio_id δεν ταιριάζει', () => {
    const prwto = meriko_perigramma('arx-1', 'Σημειώσεις', [ftiaxe_tmima('Θεωρία', 1, 3)]);
    const deftero = meriko_perigramma('arx-2', 'Σημειώσεις', [ftiaxe_tmima('Ασκήσεις', 4, 6)]);

    const apotelesma = synenose_merika_perigrammata([prwto, deftero]);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('επιστρέφει MI_EGKYRO_SXIMA όταν ένα μερικό έχει κενό arxeio_id', () => {
    const me_keno = meriko_perigramma('', 'Χωρίς id', [ftiaxe_tmima('Θεωρία', 1, 3)]);
    const apotelesma = synenose_merika_perigrammata([me_keno]);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});
