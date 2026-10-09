import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as xromata from './xromata.js';
import {
  XROMA_FONTO,
  XROMA_KARTA,
  XROMA_ENTONO,
  XROMA_APOXROMATISMENO,
  VIMATA_DIAFANEIAS,
  aspro_diafanes,
  mavro_diafanes,
  DIASTIMA_1,
  DIASTIMA_2,
  DIASTIMA_3,
  DIASTIMA_4,
  DIASTIMA_5,
  DIASTIMA_6,
  GRAMMATOSEIRA_MIKRO,
  GRAMMATOSEIRA_MESO,
  GRAMMATOSEIRA_MEGALO,
  GRAMMATOSEIRA_TITLOS,
  GRAMMATOSEIRA_OIKOGENEIA,
  GRAMMATOSEIRA_GRAMMI_MIKRI,
  GRAMMATOSEIRA_GRAMMI_KANONIKI,
  GRAMMATOSEIRA_BAROS_KANONIKO,
  GRAMMATOSEIRA_BAROS_ENTONO,
  AKTINA_MIKRO,
  AKTINA_MESO,
  AKTINA_KAPSOULA,
  DIARKEIA_GRIGORI,
  DIARKEIA_MESI,
  DIARKEIA_ARGI,
} from './xromata.js';

const CSS = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf8');

const EPITREPOMENA_HEX: readonly string[] = [
  XROMA_FONTO,
  XROMA_KARTA,
  XROMA_ENTONO,
  XROMA_APOXROMATISMENO,
];

const EPITREPOMENA_HEX_MIKRA: ReadonlySet<string> = new Set(EPITREPOMENA_HEX.map((hex) => hex.toLowerCase()));

const EPITREPOMENES_TIMES: ReadonlySet<string> = new Set(
  [
    ...EPITREPOMENA_HEX,
    ...VIMATA_DIAFANEIAS.flatMap((vima) => [aspro_diafanes(vima), mavro_diafanes(vima)]),
  ].map((timi) => timi.toLowerCase()),
);

interface DilosiMetavlitis {
  readonly onoma: string;
  readonly timi: string;
}

function pare_diloseis_xromaton(css: string): DilosiMetavlitis[] {
  const diloseis: DilosiMetavlitis[] = [];
  for (const tairiasma of css.matchAll(/--(xroma-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, onoma, timi] = tairiasma;
    if (onoma === undefined || timi === undefined) continue;
    diloseis.push({ onoma, timi: timi.trim() });
  }
  return diloseis;
}

interface Antikatoptrisi {
  readonly metavliti: string;
  readonly timi: number;
  readonly monada: string;
}

const ANTIKATOPTRIZMENA: ReadonlyMap<string, Antikatoptrisi> = new Map<string, Antikatoptrisi>([
  ['DIASTIMA_1', { metavliti: '--diastima-1', timi: DIASTIMA_1, monada: 'px' }],
  ['DIASTIMA_2', { metavliti: '--diastima-2', timi: DIASTIMA_2, monada: 'px' }],
  ['DIASTIMA_3', { metavliti: '--diastima-3', timi: DIASTIMA_3, monada: 'px' }],
  ['DIASTIMA_4', { metavliti: '--diastima-4', timi: DIASTIMA_4, monada: 'px' }],
  ['DIASTIMA_5', { metavliti: '--diastima-5', timi: DIASTIMA_5, monada: 'px' }],
  ['DIASTIMA_6', { metavliti: '--diastima-6', timi: DIASTIMA_6, monada: 'px' }],
  ['GRAMMATOSEIRA_MIKRO', { metavliti: '--grammatoseira-mikro', timi: GRAMMATOSEIRA_MIKRO, monada: 'px' }],
  ['GRAMMATOSEIRA_MESO', { metavliti: '--grammatoseira-meso', timi: GRAMMATOSEIRA_MESO, monada: 'px' }],
  ['GRAMMATOSEIRA_MEGALO', { metavliti: '--grammatoseira-megalo', timi: GRAMMATOSEIRA_MEGALO, monada: 'px' }],
  ['GRAMMATOSEIRA_TITLOS', { metavliti: '--grammatoseira-titlos', timi: GRAMMATOSEIRA_TITLOS, monada: 'px' }],
  ['GRAMMATOSEIRA_GRAMMI_MIKRI', { metavliti: '--grammatoseira-grammi-mikri', timi: GRAMMATOSEIRA_GRAMMI_MIKRI, monada: '' }],
  ['GRAMMATOSEIRA_GRAMMI_KANONIKI', { metavliti: '--grammatoseira-grammi-kanoniki', timi: GRAMMATOSEIRA_GRAMMI_KANONIKI, monada: '' }],
  ['GRAMMATOSEIRA_BAROS_KANONIKO', { metavliti: '--grammatoseira-baros-kanoniko', timi: GRAMMATOSEIRA_BAROS_KANONIKO, monada: '' }],
  ['GRAMMATOSEIRA_BAROS_ENTONO', { metavliti: '--grammatoseira-baros-entono', timi: GRAMMATOSEIRA_BAROS_ENTONO, monada: '' }],
  ['AKTINA_MIKRO', { metavliti: '--aktina-mikro', timi: AKTINA_MIKRO, monada: 'px' }],
  ['AKTINA_MESO', { metavliti: '--aktina-meso', timi: AKTINA_MESO, monada: 'px' }],
  ['AKTINA_KAPSOULA', { metavliti: '--aktina-kapsoula', timi: AKTINA_KAPSOULA, monada: 'px' }],
  ['DIARKEIA_GRIGORI', { metavliti: '--diarkeia-grigori', timi: DIARKEIA_GRIGORI, monada: 'ms' }],
  ['DIARKEIA_MESI', { metavliti: '--diarkeia-mesi', timi: DIARKEIA_MESI, monada: 'ms' }],
  ['DIARKEIA_ARGI', { metavliti: '--diarkeia-argi', timi: DIARKEIA_ARGI, monada: 'ms' }],
]);

const EKTOS_CSS: readonly string[] = ['ELAXISTI_ANTITHESI_AA', 'ELAXISTI_ANTITHESI_AA_MEGALO'];

describe('tokens.css - xromatika tokens', () => {
  it('ola ta #rrggbb einai ena apo ta tessara ypochreotika hex', () => {
    const tairesies = CSS.match(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g) ?? [];
    expect(tairesies.length).toBeGreaterThan(0);
    const ektos = tairesies.filter((hex) => !EPITREPOMENA_HEX_MIKRA.has(hex.toLowerCase()));
    expect(ektos, `Mi epitrepomena hex: ${ektos.join(', ')}`).toEqual([]);
  });

  it('ola ta rgb() einai aspro i mavro se egkekrimeno pososto diafaneias', () => {
    const tairesies = CSS.match(/rgb\([^)]*\)/g) ?? [];
    expect(tairesies.length).toBeGreaterThan(0);
    const ektos = tairesies.filter((timi) => !xromata.einai_epitrepomeno_xroma(timi));
    expect(ektos, `Mi epitrepomena rgb: ${ektos.join(', ')}`).toEqual([]);
  });

  it('ola ta --xroma-* proerchontai apo to xromata.ts', () => {
    const diloseis = pare_diloseis_xromaton(CSS);
    expect(diloseis.length).toBeGreaterThanOrEqual(4);
    for (const dilosi of diloseis) {
      expect(
        EPITREPOMENES_TIMES.has(dilosi.timi.toLowerCase()),
        `To --${dilosi.onoma} exei mi epitrepomeni timi: ${dilosi.timi}`,
      ).toBe(true);
    }
  });

  it('kathe ena apo ta tessera ypochreotika hex exei antistoixo custom property', () => {
    for (const hex of EPITREPOMENA_HEX) {
      const vrethike = pare_diloseis_xromaton(CSS).some(
        (dilosi) => dilosi.timi.toLowerCase() === hex.toLowerCase(),
      );
      expect(vrethike, `Leipei custom property me timi ${hex}`).toBe(true);
    }
  });
});

describe('tokens.css - dark-only (kanonas D11)', () => {
  it('DEN periexei katholou prefer-color-scheme light', () => {
    expect(CSS).not.toMatch(/prefers-color-scheme\s*:\s*light/);
  });

  it('DEN periexei data-theme light', () => {
    expect(CSS).not.toMatch(/data-theme\s*=\s*["']?light/);
  });

  it('DEN periexei @media, @import i url()', () => {
    expect(CSS).not.toMatch(/@media/);
    expect(CSS).not.toMatch(/@import/);
    expect(CSS).not.toMatch(/url\(/);
  });

  it('exei akrivos ena plok :root', () => {
    const plokes = CSS.match(/:root/g) ?? [];
    expect(plokes).toHaveLength(1);
  });
});

describe('tokens.css - antikatoptrisis arithmitikon statherwn', () => {
  it('kathe timi DIASTIMA_N emfanizetai sto keimeno tou CSS', () => {
    for (const timi of [DIASTIMA_1, DIASTIMA_2, DIASTIMA_3, DIASTIMA_4, DIASTIMA_5, DIASTIMA_6]) {
      expect(CSS.includes(`${timi}px`), `Leipei i timi ${timi}px`).toBe(true);
    }
  });

  it('kathe arithmitiki stathera exei antistoixo CSS property me tin idia timi', () => {
    for (const [stathera, { metavliti, timi, monada }] of ANTIKATOPTRIZMENA) {
      const motivo = new RegExp(`${metavliti}\\s*:\\s*${timi}${monada}`);
      expect(
        motivo.test(CSS),
        `To ${stathera} = ${timi}${monada} leipei apo ${metavliti}`,
      ).toBe(true);
    }
  });

  it('i stoiva grammatoseiron tou xromata.ts einai sto CSS', () => {
    expect(CSS.includes(GRAMMATOSEIRA_OIKOGENEIA), 'I stoiva grammatoseiron leipei').toBe(true);
  });

  it('kathe arithmitiki stathera tou xromata.ts einai i antikatoptrizemeni i ektos CSS', () => {
    const arithmitikes = Object.entries(xromata)
      .filter(([, timi]) => typeof timi === 'number')
      .map(([onoma]) => onoma)
      .sort();
    const antistoichismenes = [...ANTIKATOPTRIZMENA.keys()].sort();
    expect(arithmitikes).toEqual([...antistoichismenes, ...EKTOS_CSS].sort());
  });
});
