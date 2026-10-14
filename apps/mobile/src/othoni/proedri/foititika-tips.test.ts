import { describe, it, expect } from 'vitest';
import { FOITITIKA_TIPS, pare_tyxaio_tip, pare_tip_imeras } from './foititika-tips.js';

describe('foititika-tips - FOITITIKA_TIPS syllogi', () => {
  it('FOITITIKA_TIPS einai pagomenos pinakas me 8-10 tips', () => {
    expect(Array.isArray(FOITITIKA_TIPS)).toBe(true);
    expect(FOITITIKA_TIPS.length).toBeGreaterThanOrEqual(8);
    expect(FOITITIKA_TIPS.length).toBeLessThanOrEqual(10);
    expect(Object.isFrozen(FOITITIKA_TIPS)).toBe(true);
  });

  it('kathe tip einai mi keno keimeno me simantiko mikos', () => {
    for (const tip of FOITITIKA_TIPS) {
      expect(typeof tip).toBe('string');
      expect(tip.trim().length).toBeGreaterThan(15);
    }
  });

  it('perilamvanei mono akriveis symvoules gia pragmatikes leitourgies', () => {
    const oloToKeimeno = FOITITIKA_TIPS.join(' ');
    expect(oloToKeimeno).toMatch(/συγχρον/i);
    expect(oloToKeimeno).toMatch(/master password/i);
    expect(oloToKeimeno).toMatch(/recovery key/i);
    expect(oloToKeimeno).toMatch(/backup/i);
    expect(oloToKeimeno).toMatch(/Gemini/);
    expect(oloToKeimeno).toMatch(/Ollama/);
    expect(oloToKeimeno).toMatch(/OCR/);
    expect(oloToKeimeno).toMatch(/ειδοποι/);
    expect(oloToKeimeno).toMatch(/eClass/);
    expect(oloToKeimeno).not.toMatch(/80%|secure enclave|hardware-backed|EWMA|23:59|κόκκινο συναγερμό/i);
  });
});

describe('foititika-tips - pare_tyxaio_tip', () => {
  it('epistrefei ena egkyro tip apo ti syllogi', () => {
    const tip = pare_tyxaio_tip();
    expect(FOITITIKA_TIPS).toContain(tip);
  });

  it('epilegei to proto tip otan to tyxaio einai 0', () => {
    const tip = pare_tyxaio_tip(() => 0);
    expect(tip).toBe(FOITITIKA_TIPS[0]);
  });

  it('epilegei to teleftaio tip otan to tyxaio einai konta sto 1', () => {
    const tip = pare_tyxaio_tip(() => 0.9999);
    expect(tip).toBe(FOITITIKA_TIPS[FOITITIKA_TIPS.length - 1]);
  });

  it('periorizei me asfaleia arithmous ektos orion', () => {
    const katoOrio = pare_tyxaio_tip(() => -0.5);
    expect(katoOrio).toBe(FOITITIKA_TIPS[0]);

    const panoOrio = pare_tyxaio_tip(() => 2.5);
    expect(panoOrio).toBe(FOITITIKA_TIPS[FOITITIKA_TIPS.length - 1]);
  });

  it('xeirizetai NaN genitria xoris na spasei', () => {
    const fallback = pare_tyxaio_tip(() => Number.NaN);
    expect(fallback).toBe(FOITITIKA_TIPS[0]);
  });
});

describe('foititika-tips - pare_tip_imeras', () => {
  it('epistrefei to idio tip gia tin idia imerominia (statherotita)', () => {
    const simera = new Date('2026-10-11T12:00:00Z');
    const tip1 = pare_tip_imeras(simera);
    const tip2 = pare_tip_imeras(simera);
    expect(tip1).toBe(tip2);
    expect(FOITITIKA_TIPS).toContain(tip1);
  });

  it('kanei kiklo sta tips se diaforetikes imeres', () => {
    const tips = new Set<string>();
    for (let imera = 1; imera <= 15; imera++) {
      const imerominia = new Date(2026, 9, imera);
      tips.add(pare_tip_imeras(imerominia));
    }
    expect(tips.size).toBeGreaterThan(1);
  });

  it('leitourgei xoris orismata me tin trexousa imerominia', () => {
    const tip = pare_tip_imeras();
    expect(typeof tip).toBe('string');
    expect(FOITITIKA_TIPS).toContain(tip);
  });

  it('xeirizetai mi egkyri imerominia (NaN) xoris na spasei', () => {
    const aori = new Date('mi_egkyri_hmerominia');
    const fallback = pare_tip_imeras(aori);
    expect(fallback).toBe(FOITITIKA_TIPS[0]);
  });
});
