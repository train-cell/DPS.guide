import { describe, it, expect } from 'vitest';
import type { TroposExetasis } from '@dps/core';
import type { YfosExigisis } from '../src/prompts/tropos/yfos.js';
import {
  EKDOSI_TROPOY,
  TROPOI_EXETASIS,
  enotita_tropou,
  odos_tropou,
} from '../src/prompts/tropos/index.js';
import {
  YFOS_EXIGISIS,
  YFOS_EXIGISIS_PROEPILOGI,
  TITLOS_YFOS,
  enotita_yfos_exigisis,
  enotita_tropou_tis_xristis,
  enotita_yfos_tis_sistimatos,
  odos_yfos,
} from '../src/prompts/tropos/yfos.js';

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

  it('ενσωματώνει τον τρόπο εξέτασης στο xristis με το φορμάτ ενότητας', () => {
    const prwto = enotita_tropou_tis_xristis('anoixta_vivlia');
    expect(prwto.ok).toBe(true);
    if (!prwto.ok) {
      return;
    }
    expect(prwto.timi).toContain('Τρόπος εξέτασης');
    expect(prwto.timi).toContain('tropos: anoixta_vivlia');
    expect(prwto.timi).toContain('50/50');
    expect(prwto.timi).toContain('Μην επινοείς');
    expect(prwto.timi.endsWith('\n')).toBe(true);
  });

  it('δίνει κενό κείμενο όταν λείπει ο τρόπος', () => {
    expect(enotita_tropou_tis_xristis(undefined).ok).toBe(true);
    if (enotita_tropou_tis_xristis(undefined).ok) {
      expect(enotita_tropou_tis_xristis(undefined).timi).toBe('');
    }
    expect(enotita_tropou_tis_xristis(null).ok).toBe(true);
    if (enotita_tropou_tis_xristis(null).ok) {
      expect(enotita_tropou_tis_xristis(null).timi).toBe('');
    }
  });

  it('δίνει κενό κείμενο όταν λείπει το ύφος', () => {
    expect(enotita_yfos_tis_sistimatos(undefined)).toBe('');
    expect(enotita_yfos_tis_sistimatos(null)).toBe('');
    expect(enotita_yfos_tis_sistimatos('mi_egkyro_yfos' as YfosExigisis)).toBe('');
  });

  it('η επιλογή ύφους ταιριάζει με το enum και είναι αμετάβλητη', () => {
    expect([...YFOS_EXIGISIS].sort()).toEqual(['apla', 'kanoniko', 'texniko']);
    expect(YFOS_EXIGISIS.length).toBe(3);
  });

  it.each(['apla', 'kanoniko', 'texniko'] as const)(
    'οδηγίες ύφους μη κενές και ντετερμινιστικές για %s',
    (yfos) => {
      const prwto = odos_yfos(yfos);
      const deftero = odos_yfos(yfos);

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
    }
  );

  it('ενσωματώνει το ύφος στο systima με τίτλο, κωδικό και οδηγίες', () => {
    const apotelesma = enotita_yfos_exigisis('texniko');
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi).toContain(TITLOS_YFOS);
    expect(apotelesma.timi).toContain('yfos_exigisis: texniko');
    expect(apotelesma.timi).toContain('τεχνικό τύπο');
    expect(apotelesma.timi.endsWith('\n')).toBe(true);
  });

  it('ενσωματώνει το ύφος στις οδηγίες συστήματος P3/P4', () => {
    expect(enotita_yfos_tis_sistimatos('apla')).toContain(TITLOS_YFOS);
    expect(enotita_yfos_tis_sistimatos('apla')).toContain('απλή γλώσσα');
    expect(enotita_yfos_tis_sistimatos(null)).toBe('');
    expect(enotita_yfos_tis_sistimatos(undefined)).toBe('');
  });

  it('δεν υπάρχει default ύφος χωρίς ρύθμιση', () => {
    expect(YFOS_EXIGISIS_PROEPILOGI).toBe('kanoniko');
  });

  it('δίνει σφάλμα όταν το ύφος δεν υπάρχει στο enum', () => {
    const apotelesma = odos_yfos('mi_egkyro_yfos' as YfosExigisis);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('mi_egkyro_yfos');
  });

  it('δίνει σφάλμα η ενότητα ύφους όταν δεν περνάει το ύφος', () => {
    const apotelesma = enotita_yfos_exigisis('mi_egkyro_yfos' as YfosExigisis);
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});
