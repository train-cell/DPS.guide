import { describe, it, expect } from 'vitest';
import { kopse_se_kommatia } from '../src/prompts/index.js';
import { MAX_SELIDES_ANA_KLISI, MAX_XARAKTIRES_ANA_KLISI } from '@dps/core';
import type { Selida } from '@dps/core';

function ftiaxe_selida(arithmos: number, keimeno: string, arxeio_id = 'arx-1'): Selida {
  return { arxeio_id, arithmos, keimeno, lekseis: 0, xoris_keimeno: keimeno.length === 0 };
}

function ftiaxe_selides(arithmoi: number[], megethos = 10): Selida[] {
  return arithmoi.map((arithmos) => ftiaxe_selida(arithmos, 'σ'.repeat(megethos)));
}

describe('kopse_se_kommatia', () => {
  it('επιστρέφει κενό πίνακα για κενή είσοδο', () => {
    expect(kopse_se_kommatia([])).toEqual([]);
  });

  it('κρατάει μέχρι MAX_SELIDES_ANA_KLISI σελίδες ανά κομμάτι στο ακριβές όριο', () => {
    const selides = ftiaxe_selides(
      Array.from({ length: MAX_SELIDES_ANA_KLISI }, (_, i) => i + 1)
    );
    const kommatia = kopse_se_kommatia(selides);
    expect(kommatia).toHaveLength(1);
    expect(kommatia[0]).toHaveLength(MAX_SELIDES_ANA_KLISI);
  });

  it('σπάει σε νέο κομμάτι όταν ξεπεραστεί το όριο σελίδων', () => {
    const selides = ftiaxe_selides(
      Array.from({ length: MAX_SELIDES_ANA_KLISI + 3 }, (_, i) => i + 1)
    );
    const kommatia = kopse_se_kommatia(selides);
    expect(kommatia).toHaveLength(2);
    expect(kommatia[0]).toHaveLength(MAX_SELIDES_ANA_KLISI);
    expect(kommatia[1]).toHaveLength(3);
  });

  it('κρατάει μέχρι MAX_XARAKTIRES_ANA_KLISI χαρακτήρες ανά κομμάτι', () => {
    const misa = MAX_XARAKTIRES_ANA_KLISI / 2;
    const selides = [ftiaxe_selida(1, 'α'.repeat(misa)), ftiaxe_selida(2, 'β'.repeat(misa))];
    const kommatia = kopse_se_kommatia(selides);
    expect(kommatia).toHaveLength(1);
    expect(kommatia[0]?.map((s) => s.arithmos)).toEqual([1, 2]);
  });

  it('δεν σπάει ποτέ μια μεμονωμένη σελίδα που ξεπερνάει το όριο χαρακτήρων', () => {
    const selides = [
      ftiaxe_selida(1, 'α'.repeat(10)),
      ftiaxe_selida(2, 'β'.repeat(MAX_XARAKTIRES_ANA_KLISI + 1)),
      ftiaxe_selida(3, 'γ'.repeat(10)),
    ];
    const kommatia = kopse_se_kommatia(selides);
    expect(kommatia).toHaveLength(3);
    expect(kommatia[0]?.map((s) => s.arithmos)).toEqual([1]);
    expect(kommatia[1]?.map((s) => s.arithmos)).toEqual([2]);
    expect(kommatia[1]?.[0]?.keimeno).toHaveLength(MAX_XARAKTIRES_ANA_KLISI + 1);
    expect(kommatia[2]?.map((s) => s.arithmos)).toEqual([3]);
  });

  it('προσθέτει σειρά που θα ξεπερνούσε το όριο χαρακτήρων σε επόμενο κομμάτι', () => {
    const ena_trito = MAX_XARAKTIRES_ANA_KLISI / 3 + 1;
    const selides = [
      ftiaxe_selida(1, 'α'.repeat(ena_trito)),
      ftiaxe_selida(2, 'β'.repeat(ena_trito)),
      ftiaxe_selida(3, 'γ'.repeat(ena_trito)),
    ];
    const kommatia = kopse_se_kommatia(selides);
    expect(kommatia.map((k) => k.length)).toEqual([2, 1]);
  });

  it('είναι ντετερμινιστικό: ανακατεμένη είσοδος δίνει τα ίδια κομμάτια με την ταξινομημένη', () => {
    const selides = ftiaxe_selides(
      Array.from({ length: MAX_SELIDES_ANA_KLISI + 5 }, (_, i) => i + 1),
      5
    );
    const anakanike = [...selides].reverse();
    const apo_taxinomimeni = kopse_se_kommatia(selides);
    const apo_anakanike = kopse_se_kommatia(anakanike);
    expect(apo_anakanike).toEqual(apo_taxinomimeni);
    expect(apo_taxinomimeni.map((k) => k.length)).toEqual([MAX_SELIDES_ANA_KLISI, 5]);
    expect(apo_taxinomimeni[0]?.[0]?.arithmos).toBe(1);
  });
});
