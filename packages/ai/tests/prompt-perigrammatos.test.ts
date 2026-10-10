import { describe, it, expect } from 'vitest';
import {
  prompt_perigrammatos,
  EKDOSI_PROMPT_P1,
  MAX_ENNOIES_ANA_TMIMA,
} from '../src/prompts/index.js';
import { TyposTmimatosSchema } from '@dps/core';
import { ftiaxe_selides } from './voitheia.js';

function eisodos_perigrammatos() {
  return {
    arxeio_id: 'arx-1',
    titlos: 'Σημειώσεις Δομές Δεδομένων',
    selides: ftiaxe_selides([1, 2, 3], (i) => `Κείμενο σελίδας ${i + 1} με ελληνικό περιεχόμενο.`),
    kommati: { arithmos: 2, synolo: 3 },
  };
}

describe('prompt_perigrammatos (P1)', () => {
  it('επιστρέφει τη δομή αίτησης LLM με έκδοση prompt p1', () => {
    const aitisi = prompt_perigrammatos(eisodos_perigrammatos());
    expect(aitisi.ekdosi_prompt).toBe('p1@1');
    expect(aitisi.ekdosi_prompt).toBe(EKDOSI_PROMPT_P1);
    expect(aitisi.sistima).toBeTypeOf('string');
    expect(aitisi.sistima.length).toBeGreaterThan(0);
    expect(aitisi.xristis).toBeTypeOf('string');
    expect(typeof aitisi.sisma.parse).toBe('function');
  });

  it('το πεδίο xristis φέρει δείκτες [σ.N] με σωστούς αριθμούς και σειρά', () => {
    const aitisi = prompt_perigrammatos(eisodos_perigrammatos());
    const deiktes = [...aitisi.xristis.matchAll(/\[σ\.(\d+)\]/g)].map((m) => Number(m[1]));
    expect(deiktes).toEqual([1, 2, 3]);
    expect(aitisi.xristis).toContain('Κείμενο σελίδας 1');
    expect(aitisi.xristis).toContain('Κείμενο σελίδας 3');
  });

  it('το systima περιέχει όλους τους σκληρούς κανόνες του §7.1', () => {
    const { sistima } = prompt_perigrammatos(eisodos_perigrammatos());
    expect(sistima).toContain('[σ.N]');
    expect(sistima).toContain('ΑΠΟΚΛΕΙΣΤΙΚΑ από τους δείκτες');
    expect(sistima).toContain('Μην επινοείς');
    expect(sistima).toContain(`${MAX_ENNOIES_ANA_TMIMA} έννοιες`);
    expect(sistima).toContain('Perigramma');
    for (const typos of TyposTmimatosSchema.options) {
      expect(sistima).toContain(typos);
    }
  });

  it('το systima δηλώνει ότι το σχήμα εξόδου είναι το περίγραμμα του αρχείου', () => {
    const aitisi = prompt_perigrammatos(eisodos_perigrammatos());
    expect(aitisi.xristis).toContain('κομμάτι 2 από 3');
    expect(aitisi.xristis).toContain('Σημειώσεις Δομές Δεδομένων');
  });

  it('το σχήμα δέχεται περίγραμμα του contract και απορρίπτει άκυρο typos', () => {
    const aitisi = prompt_perigrammatos(eisodos_perigrammatos());
    const egkyro = aitisi.sisma.safeParse({
      arxeio_id: 'arx-1',
      titlos: 'Σημειώσεις',
      tmimata: [
        {
          titlos: 'Θεωρία',
          selides: { apo: 1, eos: 4 },
          typos: 'theoria',
          ennoies: ['a', 'b'],
          proapaitoumena: [],
        },
      ],
    });
    expect(egkyro.success).toBe(true);

    const akyro = aitisi.sisma.safeParse({
      arxeio_id: 'arx-1',
      titlos: 'Σημειώσεις',
      tmimata: [
        {
          titlos: 'Θεωρία',
          selides: { apo: 1, eos: 4 },
          typos: 'apo_xarti',
          ennoies: ['a'],
          proapaitoumena: [],
        },
      ],
    });
    expect(akyro.success).toBe(false);
  });

  it('είναι ντετερμινιστικό για πανομοιότυπη είσοδο', () => {
    const a = prompt_perigrammatos(eisodos_perigrammatos());
    const b = prompt_perigrammatos(eisodos_perigrammatos());
    expect(a).toEqual(b);
    expect(a.xristis).toBe(b.xristis);
    expect(a.sistima).toBe(b.sistima);
  });

  it('snapshot P1', () => {
    const aitisi = prompt_perigrammatos(eisodos_perigrammatos());
    expect({
      ekdosi_prompt: aitisi.ekdosi_prompt,
      sistima: aitisi.sistima,
      xristis: aitisi.xristis,
    }).toMatchSnapshot();
  });
});
