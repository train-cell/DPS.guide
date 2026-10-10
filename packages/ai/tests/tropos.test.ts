import { describe, it, expect } from 'vitest';
import type { TroposExetasis } from '@dps/core';
import {
  EKDOSI_TROPOY,
  TROPOI_EXETASIS,
  enotita_tropou,
  odos_tropou,
} from '../src/prompts/tropos/index.js';

const TROPOI: readonly TroposExetasis[] = [
  'anoixta_vivlia',
  'kleista_vivlia',
  'polapli_epilogi_arnitiki',
  'ergasia',
];

const GNORISMATA: Record<TroposExetasis, string> = {
  anoixta_vivlia: 'ανοικτά βιβλία',
  kleista_vivlia: 'αυτούσια',
  polapli_epilogi_arnitiki: 'ΔΕΝ ισχύει',
  ergasia: 'κριτήρια επιλογής',
};

describe('T4 tropos εξέτασης & ύφος', () => {
  it('η λίστα TROPOI_EXETASIS ταιριάζει ακριβώς με το enum του contract', () => {
    expect([...TROPOI_EXETASIS].sort()).toEqual([...TROPOI].sort());
    for (const tropos of TROPOI_EXETASIS) {
      expect(TROPOI).toContain(tropos);
    }
  });

  it.each(TROPOI)('οδηγίες μη κενές και ντετερμινιστικές για %s', (tropos) => {
    const prwto = odos_tropou(tropos);
    const deftero = odos_tropou(tropos);

    expect(prwto.ok).toBe(true);
    if (!prwto.ok) {
      return;
    }
    expect(prwto.timi.length).toBeGreaterThanOrEqual(2);
    for (const grammi of prwto.timi) {
      expect(grammi.trim().length).toBeGreaterThan(0);
      expect(grammi).toBe(grammi.trim());
    }
    expect(deftero).toEqual(prwto);
  });

  it.each(TROPOI)('κοινοί κανόνες (50/50, μην επινοείς) σε κάθε τρόπο: %s', (tropos) => {
    const apotelesma = odos_tropou(tropos);
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    const keimeno = apotelesma.timi.join('\n');
    expect(keimeno).toContain('50/50');
    expect(keimeno).toContain('Μην επινοείς');
    expect(keimeno).toContain('Δεν υπάρχει στο υλικό');
  });

  it('κάθε τρόπος έχει δικό του χαρακτηριστικό γνώρισμα', () => {
    for (const tropos of TROPOI) {
      const apotelesma = odos_tropou(tropos);
      expect(apotelesma.ok).toBe(true);
      if (!apotelesma.ok) {
        continue;
      }
      expect(apotelesma.timi.join('\n')).toContain(GNORISMATA[tropos]);
    }
  });

  it('άγνωστος τρόπος → σφάλμα MI_EGKYRO_SXIMA, ποτέ ψεύτικο περιεχόμενο', () => {
    const apotelesma = odos_tropou('mi_egkyros_tropos' as TroposExetasis);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima.length).toBeGreaterThan(0);
    expect('timi' in apotelesma).toBe(false);
  });

  it('enotita_tropou τυλίγει τις οδηγίες σε ενότητα με τίτλο, τρόπο και κοινούς κανόνες', () => {
    const apotelesma = enotita_tropou('kleista_vivlia');
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toContain('Τρόπος εξέτασης');
    expect(apotelesma.timi).toContain('kleista_vivlia');
    expect(apotelesma.timi).toContain('50/50');
    expect(apotelesma.timi.endsWith('\n')).toBe(true);
  });

  it('η έκδοση T4 είναι σταθερή συμβολική τιμή', () => {
    expect(EKDOSI_TROPOY).toBe('tropos@1');
  });
});
