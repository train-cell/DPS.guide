import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import {
  sporse_deigma,
  KODIKOS_DEIGMATOS,
  MATHIMATA_DEIGMATOS,
  SELIDES_ARX_1,
  SELIDES_ARX_2,
} from './sporse.js';
import { pare_xarti_mathimatos } from './pseudomata.js';
import {
  DIADROMI_MATHIMATON,
  diadromi_odigou,
  diadromi_xarti,
  fortose_mathimata_apo_apothiki,
  fortose_odigo_apo_apothiki,
  fortose_xartis_apo_apothiki,
} from '../../src/ypiresies/index.js';
import { diadromi_eurethriou, fortose_pdf } from '../../src/provoli-pdf/index.js';
import { fortose_rytheseis } from '../../src/apothiki/index.js';

describe('sporse_deigma', () => {
  it('γράφει όλα τα αρχεία του layout §5.3 που διαβάζουν οι οθόνες για ΟΛΑ τα 4 μαθήματα', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    expect(await apothiki.yparxei('rythmiseis.json')).toBe(true);
    expect(await apothiki.yparxei(DIADROMI_MATHIMATON)).toBe(true);

    const rythmiseis = await fortose_rytheseis(apothiki);
    expect(rythmiseis.mathimataSynch).toEqual(['ΠΛΗ201', 'ΠΛΗ101', 'ΠΛΗ204']);

    for (const kodikos of MATHIMATA_DEIGMATOS) {
      expect(await apothiki.yparxei(diadromi_xarti(kodikos))).toBe(true);
      expect(await apothiki.yparxei(diadromi_eurethriou(kodikos))).toBe(true);
      expect(await apothiki.yparxei(`${kodikos}/arxeia/syntheta/arx-1.pdf`)).toBe(true);
      expect(await apothiki.yparxei(`${kodikos}/arxeia/syntheta/arx-2.pdf`)).toBe(true);

      const xartis = pare_xarti_mathimatos(kodikos);
      for (const enotita of xartis.enotites) {
        expect(await apothiki.yparxei(diadromi_odigou(kodikos, enotita.id))).toBe(true);
        expect(
          await apothiki.yparxei(`${kodikos}/.spoudes/odigoi/${enotita.id}.meta.json`)
        ).toBe(true);
        expect(
          await apothiki.yparxei(`${kodikos}/.spoudes/synomilies/${enotita.id}.jsonl`)
        ).toBe(true);
      }
    }
  });

  it('οι οθόνες διαβάζουν τα σπαρμένα αρχεία ως έτοιμα δεδομένα και για τα 4 μαθήματα', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    const mathimata = await fortose_mathimata_apo_apothiki(apothiki);
    expect(mathimata.katastasi).toBe('etimo');

    for (const kodikos of MATHIMATA_DEIGMATOS) {
      const xartis = await fortose_xartis_apo_apothiki(apothiki, kodikos);
      expect(xartis.katastasi).toBe('etimo');

      const xartisObj = pare_xarti_mathimatos(kodikos);
      for (const enotita of xartisObj.enotites) {
        const odigos = await fortose_odigo_apo_apothiki(apothiki, kodikos, enotita.id);
        expect(odigos.katastasi).toBe('etimo');
        if (odigos.katastasi === 'etimo') {
          expect(odigos.dedomena.titlos).toBe(enotita.titlos);
          expect(Object.keys(odigos.dedomena.tmimata)).toHaveLength(7);
        }
      }
    }
  });

  it('τα σπαρμένα PDF είναι έγκυρα PDF με τον αναμενόμενο αριθμό σελίδων για κάθε μάθημα', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    for (const kodikos of MATHIMATA_DEIGMATOS) {
      const arx1 = await fortose_pdf(apothiki, kodikos, 'arx-1');
      const arx2 = await fortose_pdf(apothiki, kodikos, 'arx-2');
      expect(arx1.ok).toBe(true);
      expect(arx2.ok).toBe(true);
      if (!arx1.ok || !arx2.ok) {
        continue;
      }
      const keimeno1 = new TextDecoder('latin1').decode(arx1.timi);
      const keimeno2 = new TextDecoder('latin1').decode(arx2.timi);
      expect(keimeno1.startsWith('%PDF-1.4')).toBe(true);
      expect(keimeno1).toContain(`/Count ${SELIDES_ARX_1}`);
      expect(keimeno2).toContain(`/Count ${SELIDES_ARX_2}`);
    }
  });

  it('δεν σβήνει ούτε μια υπάρχουσα εγγραφή όταν τρέξει δεύτερη φορά', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);
    await apothiki.grapse_keimeno(`${KODIKOS_DEIGMATOS}/.spoudes/xartis.json`, 'ΙΔΙΑΙΤΕΡΗ-ΤΙΜΗ');
    await sporse_deigma(apothiki);

    const diavase = await apothiki.diavase_keimeno(diadromi_xarti(KODIKOS_DEIGMATOS));
    expect(diavase.ok).toBe(true);
    if (diavase.ok) {
      expect(diavase.timi).toBe('ΙΔΙΑΙΤΕΡΗ-ΤΙΜΗ');
    }
  });
});
