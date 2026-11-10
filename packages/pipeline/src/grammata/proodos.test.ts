import { describe, expect, it, vi } from 'vitest';
import { minima_sfalmatos, proodos } from './proodos.js';
import type { Apotelesma } from '@dps/core';

describe('proodos — events προόδου', () => {
  it('χωρίς παρατηρητή είναι no-op (L47 false)', () => {
    const katagrafi = { pliroforia: vi.fn(), sfalma: vi.fn() };
    const report = proodos({ katagrafi }, undefined, 'odigos', 1);
    report(1, 'ο οδηγός παράχθηκε');
    expect(katagrafi.pliroforia).toHaveBeenCalledWith('odigos: ο οδηγός παράχθηκε', { olokliromena: 1, synolo: 1 });
    expect(katagrafi.sfalma).not.toHaveBeenCalled();
  });

  it('με παρατηρητή καλείει τον callback (L47 true)', () => {
    const katagrafi = { pliroforia: vi.fn(), sfalma: vi.fn() };
    const parastypotis = vi.fn();
    const report = proodos({ katagrafi }, parastypotis, 'odigos', 1);
    report(1, 'ο οδηγός παράχθηκε');
    expect(parastypotis).toHaveBeenCalledTimes(1);
    expect(parastypotis).toHaveBeenCalledWith({
      vhima: 'odigos',
      synolo: 1,
      olokliromena: 1,
      minima: 'ο οδηγός παράχθηκε',
      oloklirothike: true,
    });
  });

  it('σε αποτυχία γράφει στο sfalma και oloklirothike false', () => {
    const katagrafi = { pliroforia: vi.fn(), sfalma: vi.fn() };
    const report = proodos({ katagrafi }, undefined, 'odigos', 1);
    report(0, 'απέτυχε', false);
    expect(katagrafi.sfalma).toHaveBeenCalledWith('odigos: απέτυχε', { olokliromena: 0, synolo: 1 });
    expect(katagrafi.pliroforia).not.toHaveBeenCalled();
  });
});

describe('minima_sfalmatos', () => {
  it('επιτυχία', () => {
    expect(minima_sfalmatos({ ok: true, timi: {} } as unknown as Apotelesma<unknown>)).toBe('ολοκληρώθηκε');
  });

  it('αποτυχία', () => {
    const res = { ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'Δεν υπάρχει διαδίκτυο' } };
    expect(minima_sfalmatos(res as unknown as Apotelesma<unknown>)).toBe('DIKTYO: Δεν υπάρχει διαδίκτυο');
  });
});
