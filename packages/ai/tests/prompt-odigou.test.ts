import { describe, it, expect } from 'vitest';
import {
  prompt_odigou,
  EKDOSI_PROMPT_P3,
  ENOTITES_ODIGOU,
  ELAXISTES_EROTISEIS_AUTOELGXOU,
  MEGISTES_EROTISEIS_AUTOELGXOU,
} from '../src/prompts/index.js';
import { ftiaxe_enotita, ftiaxe_selides } from './voitheia.js';

function eisodos_odigou() {
  return {
    enotita: ftiaxe_enotita(),
    selides: ftiaxe_selides([1, 2, 3], (i) => `Κείμενο σελίδας ${i + 1}: λίστες και δένδρα.`),
  };
}

describe('prompt_odigou (P3)', () => {
  it('επιστρέφει αίτηση με έκδοση prompt p3 και σχήμα φακέλου markdown + παραπομπές', () => {
    const aitisi = prompt_odigou(eisodos_odigou());
    expect(aitisi.ekdosi_prompt).toBe('p3@1');
    expect(aitisi.ekdosi_prompt).toBe(EKDOSI_PROMPT_P3);

    const egkyro = aitisi.sisma.safeParse({
      markdown: '## 🎯 Στόχοι\nΚείμενο.',
      parapompes: [{ arxeio_id: 'arx-1', selida: 4 }],
    });
    expect(egkyro.success).toBe(true);

    const akyro = aitisi.sisma.safeParse({
      markdown: '## 🎯 Στόχοι\nΚείμενο.',
      parapompes: [{ arxeio_id: 'arx-1', selida: '4' }],
    });
    expect(akyro.success).toBe(false);
  });

  it('το sistima περιέχει όλες τις 7 υποχρεωτικές ενότητες με την ίδια σειρά', () => {
    const { sistima } = prompt_odigou(eisodos_odigou());
    const theseis = ENOTITES_ODIGOU.map((e) => sistima.indexOf(e));
    for (const these of theseis) {
      expect(these).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < theseis.length; i++) {
      const proigoumeno = theseis[i - 1];
      const trexon = theseis[i];
      if (proigoumeno === undefined || trexon === undefined) continue;
      expect(trexon).toBeGreaterThan(proigoumeno);
    }
  });

  it('το sistima περιέχει τους κανόνες του λυμένου παραδείγματος', () => {
    const { sistima } = prompt_odigou(eisodos_odigou());
    expect(sistima).toContain('Δεν υπάρχει λυμένο παράδειγμα στο υλικό');
    expect(sistima).toContain('πηγή');
    expect(sistima).toContain('⚠️ μη επαληθευμένο');
  });

  it('το sistima περιέχει τους κανόνες των παραπομπών', () => {
    const { sistima } = prompt_odigou(eisodos_odigou());
    expect(sistima).toContain('[[arxeio_id:σελίδα]]');
    expect(sistima).toContain('παράγραφος');
  });

  it('το sistima καθορίζει 3 έως 5 ερωτήσεις αυτοελέγχου με κρυφές απαντήσεις', () => {
    const { sistima } = prompt_odigou(eisodos_odigou());
    expect(sistima).toContain(
      `από ${ELAXISTES_EROTISEIS_AUTOELGXOU} έως ${MEGISTES_EROTISEIS_AUTOELGXOU} ερωτήσεις`
    );
    const protipo = new RegExp(
      `${ELAXISTES_EROTISEIS_AUTOELGXOU}[\\s\\S]*${MEGISTES_EROTISEIS_AUTOELGXOU} ερωτήσεις`
    );
    expect(sistima).toMatch(protipo);
  });

  it('το xristis περιέχει τον τίτλο και τον κωδικό της ενότητας καθώς και σελίδες με δείκτες', () => {
    const { xristis } = prompt_odigou(eisodos_odigou());
    expect(xristis).toContain('enotita-1');
    expect(xristis).toContain('Δομές δεδομένων');
    const deiktes = [...xristis.matchAll(/\[σ\.(\d+)\]/g)].map((m) => Number(m[1]));
    expect(deiktes).toEqual([1, 2, 3]);
  });

  it('το xristis περιέχει τις επιτρεπόμενες σελίδες των πηγών της ενότητας', () => {
    const { xristis } = prompt_odigou(eisodos_odigou());
    expect(xristis).toContain('arx-1');
    expect(xristis).toContain('arx-2');
    expect(xristis).toContain('από 1 έως 10');
    expect(xristis).toContain('από 3 έως 5');
  });

  it('το sistima περιέχει κανόνες ύφους (ELI5, θεωρία, παγίδες)', () => {
    const { sistima } = prompt_odigou(eisodos_odigou());
    expect(sistima).toContain('ELI5');
    expect(sistima).toContain('Μην επινοείς');
  });

  it('είναι ντετερμινιστικό για πανομοιότυπη είσοδο', () => {
    expect(prompt_odigou(eisodos_odigou())).toEqual(prompt_odigou(eisodos_odigou()));
  });

  it('snapshot P3', () => {
    const aitisi = prompt_odigou(eisodos_odigou());
    expect({
      ekdosi_prompt: aitisi.ekdosi_prompt,
      sistima: aitisi.sistima,
      xristis: aitisi.xristis,
    }).toMatchSnapshot();
  });
});
