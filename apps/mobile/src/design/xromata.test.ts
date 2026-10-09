import { describe, it, expect } from 'vitest';
import {
  XROMA_FONTO,
  XROMA_KARTA,
  XROMA_ENTONO,
  XROMA_APOXROMATISMENO,
  XROMATA,
  type OnomaXromatos,
  ypologise_antithesi,
  ELAXISTI_ANTITHESI_AA,
  ELAXISTI_ANTITHESI_AA_MEGALO,
  VIMATA_DIAFANEIAS,
  aspro_diafanes,
  mavro_diafanes,
  einai_epitrepomeno_xroma,
} from './xromata.js';

const EPITREPOMENA_HEX: readonly string[] = [
  XROMA_FONTO,
  XROMA_KARTA,
  XROMA_ENTONO,
  XROMA_APOXROMATISMENO,
];

describe('Xromata - ypochreotika xromata', () => {
  it('DINEI ta akrivi chrimata #0B0B0C / #161618 / #3B82F6 / #9D9DA2', () => {
    expect(XROMA_FONTO).toBe('#0B0B0C');
    expect(XROMA_KARTA).toBe('#161618');
    expect(XROMA_ENTONO).toBe('#3B82F6');
    expect(XROMA_APOXROMATISMENO).toBe('#9D9DA2');
  });

  it('TO XROMATA einai pagomeno (frozen) me ta 4 klidia', () => {
    expect(Object.isFrozen(XROMATA)).toBe(true);
    expect(XROMATA.fonto).toBe(XROMA_FONTO);
    expect(XROMATA.karta).toBe(XROMA_KARTA);
    expect(XROMATA.entono).toBe(XROMA_ENTONO);
    expect(XROMATA.apoxromatismeno).toBe(XROMA_APOXROMATISMENO);
    const onomata: OnomaXromatos[] = ['fonto', 'karta', 'entono', 'apoxromatismeno'];
    expect(Object.keys(XROMATA)).toEqual(onomata);
  });
});

describe('Ypologismos antithesis WCAG 2.1', () => {
  it('Apoxromatismeno keimeno PANO sto background pernaei AA (≥ 4.5)', () => {
    const antithesi = ypologise_antithesi(XROMA_APOXROMATISMENO, XROMA_FONTO);
    expect(antithesi).toBeGreaterThanOrEqual(ELAXISTI_ANTITHESI_AA);
    expect(antithesi).toBeGreaterThanOrEqual(7.2);
    expect(antithesi).toBeLessThan(7.4);
  });

  it('Accent xroma PANO sto background pernaei AA (>= 4.5)', () => {
    const antithesi = ypologise_antithesi(XROMA_ENTONO, XROMA_FONTO);
    expect(antithesi).toBeGreaterThanOrEqual(ELAXISTI_ANTITHESI_AA);
    expect(antithesi).toBeGreaterThanOrEqual(5.3);
    expect(antithesi).toBeLessThan(5.4);
  });

  it('Apoxromatismeno keimeno PANO se karta epifaneia pernaei AA (≥ 4.5)', () => {
    const antithesi = ypologise_antithesi(XROMA_APOXROMATISMENO, XROMA_KARTA);
    expect(antithesi).toBeGreaterThanOrEqual(ELAXISTI_ANTITHESI_AA);
  });

  it('Karta epifaneia einai diaxorismeni apo background (antithesi > 1)', () => {
    const antithesi = ypologise_antithesi(XROMA_KARTA, XROMA_FONTO);
    expect(antithesi).toBeGreaterThan(1.0);
  });

  it('Idio xroma me eauto exei antithesi akrivos 1', () => {
    expect(ypologise_antithesi('#0B0B0C', '#0B0B0C')).toBe(1);
  });

  it('DEXETAI hex xoris dieythinisi kai xoris #', () => {
    expect(ypologise_antithesi('0B0B0C', '#0B0B0C')).toBe(1);
    expect(ypologise_antithesi('#0b0b0c', XROMA_FONTO)).toBe(1);
  });

  it('Ta oria AA einai 4.5 keimeno kai 3 megalo keimeno', () => {
    expect(ELAXISTI_ANTITHESI_AA).toBe(4.5);
    expect(ELAXISTI_ANTITHESI_AA_MEGALO).toBe(3);
  });
});

describe('Oudetera xromata se vimata diafaneias', () => {
  it('TA VIMATA_DIAFANEIAS einai ta 10 kathorismena vimata', () => {
    expect([...VIMATA_DIAFANEIAS]).toEqual([4, 8, 12, 16, 24, 32, 48, 64, 80, 92]);
    expect(Object.isFrozen(VIMATA_DIAFANEIAS)).toBe(true);
  });

  it('aspro_diafanes(12) dinei to kanoniko string', () => {
    expect(aspro_diafanes(12)).toBe('rgb(255 255 255 / 12%)');
    expect(aspro_diafanes(92)).toBe('rgb(255 255 255 / 92%)');
  });

  it('mavro_diafanes(32) dinei to kanoniko string', () => {
    expect(mavro_diafanes(32)).toBe('rgb(0 0 0 / 32%)');
  });

  it('aspro_diafanes / mavro_diafanes PETOUN se mi epitrepomeno pososto', () => {
    expect(() => aspro_diafanes(13)).toThrow();
    expect(() => mavro_diafanes(13)).toThrow();
    expect(() => aspro_diafanes(99)).toThrow();
    expect(() => mavro_diafanes(0)).toThrow();
  });
});

describe('Frouros epitrepomenon xromaton', () => {
  it('DEXETAI ta 4 ypoxreotika hex', () => {
    for (const xroma of EPITREPOMENA_HEX) {
      expect(einai_epitrepomeno_xroma(xroma)).toBe(true);
    }
  });

  it('DEXETAI oudetera rgb se egkekrimeno pososto diafaneias', () => {
    expect(einai_epitrepomeno_xroma('rgb(255 255 255 / 12%)')).toBe(true);
    expect(einai_epitrepomeno_xroma('rgb(0 0 0 / 32%)')).toBe(true);
    expect(einai_epitrepomeno_xroma('rgb(255 255 255 / 64%)')).toBe(true);
    for (const vima of VIMATA_DIAFANEIAS) {
      expect(einai_epitrepomeno_xroma(aspro_diafanes(vima))).toBe(true);
      expect(einai_epitrepomeno_xroma(mavro_diafanes(vima))).toBe(true);
    }
  });

  it('APARNEITAI ochromatika xromata, mi egkekrimena pososta kai onomata', () => {
    expect(einai_epitrepomeno_xroma('#FF0000')).toBe(false);
    expect(einai_epitrepomeno_xroma('#7F8084')).toBe(false);
    expect(einai_epitrepomeno_xroma('red')).toBe(false);
    expect(einai_epitrepomeno_xroma('rgb(255 0 0 / 12%)')).toBe(false);
    expect(einai_epitrepomeno_xroma('rgb(255 255 255 / 99%)')).toBe(false);
    expect(einai_epitrepomeno_xroma('rgb(255 255 255 / 13%)')).toBe(false);
    expect(einai_epitrepomeno_xroma('rgb(17 17 17 / 12%)')).toBe(false);
    expect(einai_epitrepomeno_xroma('')).toBe(false);
    expect(einai_epitrepomeno_xroma('hsl(0 0% 100% / 12%)')).toBe(false);
  });

  it('Kanonikopoiei kefalaia kai kena stin eisodo', () => {
    expect(einai_epitrepomeno_xroma(' #3B82F6 ')).toBe(true);
    expect(einai_epitrepomeno_xroma('  #0b0b0c  ')).toBe(true);
    expect(einai_epitrepomeno_xroma('RGB(255 255 255 / 8%)')).toBe(true);
    expect(einai_epitrepomeno_xroma('rgb(255,255,255,12%)')).toBe(true);
    expect(einai_epitrepomeno_xroma(' #ff0000 ')).toBe(false);
  });

  it('DEN dexetai syntomografia 3-psifiwn hex', () => {
    expect(einai_epitrepomeno_xroma('#fff')).toBe(false);
    expect(einai_epitrepomeno_xroma('#000')).toBe(false);
  });
});
