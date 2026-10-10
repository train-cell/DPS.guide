import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import { sporse_deigma, KODIKOS_DEIGMATOS, SELIDES_ARX_1, SELIDES_ARX_2 } from './sporse.js';
import {
  DIADROMI_MATHIMATON,
  diadromi_odigou,
  diadromi_xarti,
  fortose_mathimata_apo_apothiki,
  fortose_odigo_apo_apothiki,
  fortose_xartis_apo_apothiki,
} from '../ypiresies/index.js';
import { diadromi_eurethriou, fortose_pdf } from '../provoli-pdf/index.js';

describe('sporse_deigma', () => {
  it('γράφει όλα τα αρχεία του layout §5.3 που διαβάζουν οι οθόνες', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    expect(await apothiki.yparxei('rythmiseis.json')).toBe(true);
    expect(await apothiki.yparxei(DIADROMI_MATHIMATON)).toBe(true);
    expect(await apothiki.yparxei(diadromi_xarti(KODIKOS_DEIGMATOS))).toBe(true);
    expect(await apothiki.yparxei(diadromi_eurethriou(KODIKOS_DEIGMATOS))).toBe(true);
    for (const enotita_id of ['en-1', 'en-2', 'en-3', 'en-4']) {
      expect(await apothiki.yparxei(diadromi_odigou(KODIKOS_DEIGMATOS, enotita_id))).toBe(true);
      expect(
        await apothiki.yparxei(`${KODIKOS_DEIGMATOS}/.spoudes/synomilies/${enotita_id}.jsonl`)
      ).toBe(true);
    }
  });

  it('οι οθόνες διαβάζουν τα σπαρμένα αρχεία ως έτοιμα δεδομένα', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    const mathimata = await fortose_mathimata_apo_apothiki(apothiki);
    expect(mathimata.katastasi).toBe('etimo');

    const xartis = await fortose_xartis_apo_apothiki(apothiki, KODIKOS_DEIGMATOS);
    expect(xartis.katastasi).toBe('etimo');

    const odigos = await fortose_odigo_apo_apothiki(apothiki, KODIKOS_DEIGMATOS, 'en-1');
    expect(odigos.katastasi).toBe('etimo');
  });

  it('τα σπαρμένα PDF είναι έγκυρα PDF με τον αναμενόμενο αριθμό σελίδων', async () => {
    const apothiki = new MnimiApothiki();
    await sporse_deigma(apothiki);

    const arx1 = await fortose_pdf(apothiki, KODIKOS_DEIGMATOS, 'arx-1');
    const arx2 = await fortose_pdf(apothiki, KODIKOS_DEIGMATOS, 'arx-2');
    expect(arx1.ok).toBe(true);
    expect(arx2.ok).toBe(true);
    if (!arx1.ok || !arx2.ok) {
      return;
    }
    const keimeno1 = new TextDecoder('latin1').decode(arx1.timi);
    const keimeno2 = new TextDecoder('latin1').decode(arx2.timi);
    expect(keimeno1.startsWith('%PDF-1.4')).toBe(true);
    expect(keimeno1).toContain(`/Count ${SELIDES_ARX_1}`);
    expect(keimeno2).toContain(`/Count ${SELIDES_ARX_2}`);
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
