import { describe, it, expect } from 'vitest';
import { FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, StatheriRologi, ArgiosLlm } from '../testing/voirtheia.js';
import { MnimiApothiki } from '@dps/core';
import type { Mathima } from '@dps/core';
import { syndesi } from '../bhmata/syndesi.js';
import { anakalypsi } from '../bhmata/anakalypsi.js';
import type { EisodosPipeline } from '../porte.js';
import { ARXEIO_MATHIMATON } from '../statheroi.js';

function ftiaxe_eisodos(
  eclass: FakeEclassPyli,
  apothiki: MnimiApothiki,
  katagrafi: KatagrafiDiamnemata
): EisodosPipeline {
  return {
    eclass,
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: new ArgiosLlm(),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi: new StatheriRologi(),
    katagrafi,
    riza: '',
  };
}

function ftiaxe_mathima(epitexseis: Partial<Mathima> = {}): Mathima {
  return { kodikos: 'M1', titlos: 'Δομές Δεδομένων', url: '/course/M1', epilegmeno: true, ...epitexseis };
}

describe('syndesi', () => {
  it('καλεί τον port σύνδεσης και επιστρέφει επιτυχία', async () => {
    const eclass = new FakeEclassPyli();
    const katagrafi = new KatagrafiDiamnemata();

    const apotelesma = await syndesi(ftiaxe_eisodos(eclass, new MnimiApothiki(), katagrafi));

    expect(apotelesma).toEqual({ ok: true, timi: undefined });
    expect(eclass.kliseis_syndesis).toBe(1);
  });

  it('μεταδίδει το AUTH_APOTYXIA του port χωρίς προσπάθεια επανάληψης', async () => {
    const eclass = new FakeEclassPyli();
    eclass.apotelesma_syndesis = { ok: false, sfalma: { kodikos: 'AUTH_APOTYXIA', minima: 'Λάθος κωδικός' } };
    const katagrafi = new KatagrafiDiamnemata();

    const apotelesma = await syndesi(ftiaxe_eisodos(eclass, new MnimiApothiki(), katagrafi));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('AUTH_APOTYXIA');
    expect(apotelesma.sfalma.minima).toBe('Λάθος κωδικός');
    expect(eclass.kliseis_syndesis).toBe(1);
    expect(katagrafi.sfalmata).toHaveLength(1);
  });

  it('μεταδίδει το SESSION_LIXI όταν λήξει η συνεδρία', async () => {
    const eclass = new FakeEclassPyli();
    eclass.apotelesma_syndesis = { ok: false, sfalma: { kodikos: 'SESSION_LIXI', minima: 'Λήξη συνεδρίας' } };

    const apotelesma = await syndesi(ftiaxe_eisodos(eclass, new MnimiApothiki(), new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
  });

  it('μεταδίδει το DIKTYO όταν πέσει το δίκτυο', async () => {
    const eclass = new FakeEclassPyli();
    eclass.apotelesma_syndesis = { ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'Αποτυχία δικτύου' } };

    const apotelesma = await syndesi(ftiaxe_eisodos(eclass, new MnimiApothiki(), new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('καταγράφει πληροφορία στην επιτυχή σύνδεση', async () => {
    const katagrafi = new KatagrafiDiamnemata();

    await syndesi(ftiaxe_eisodos(new FakeEclassPyli(), new MnimiApothiki(), katagrafi));

    expect(katagrafi.plirofories).toEqual(['syndesi: σύνδεση με το eClass επιτυχής']);
  });
});

describe('anakalypsi', () => {
  it('γράφει τα μαθήματα στο mathimata.json της ρίζας', async () => {
    const eclass = new FakeEclassPyli();
    eclass.mathimata = [ftiaxe_mathima(), ftiaxe_mathima({ kodikos: 'M2', titlos: 'Αλγόριθμοι', epilegmeno: false })];
    const apothiki = new MnimiApothiki();

    const apotelesma = await anakalypsi(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi).toHaveLength(2);
    const gram = await apothiki.diavase_keimeno(ARXEIO_MATHIMATON);
    expect(gram.ok && JSON.parse(gram.timi)).toEqual(eclass.mathimata);
  });

  it('διατηρεί τις επιλογές του χρήστη (epilegmeno) όταν ξανατρέχει', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(
      ARXEIO_MATHIMATON,
      JSON.stringify([ftiaxe_mathima({ kodikos: 'M1', epilegmeno: true }), ftiaxe_mathima({ kodikos: 'M2', titlos: 'Αλγόριθμοι', epilegmeno: false })])
    );
    const eclass = new FakeEclassPyli();
    // Το eClass επιστρέφει τα μαθήματα χωρίς επιλογή· η ροή δεν πρέπει να χαθεί.
    eclass.mathimata = [ftiaxe_mathima({ epilegmeno: false }), ftiaxe_mathima({ kodikos: 'M2', titlos: 'Αλγόριθμοι', epilegmeno: false })];

    const apotelesma = await anakalypsi(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.find((m) => m.kodikos === 'M1')?.epilegmeno).toBe(true);
    expect(apotelesma.timi.find((m) => m.kodikos === 'M2')?.epilegmeno).toBe(false);
  });

  it('είναι idempotent: δεύτερη εκτέλεση δίνει τα ίδια δεδομένα', async () => {
    const eclass = new FakeEclassPyli();
    eclass.mathimata = [ftiaxe_mathima()];
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata());

    const proti = await anakalypsi(p);
    const defteri = await anakalypsi(p);

    expect(proti.ok && defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('απέτυχε');
    expect(defteri.timi).toEqual(proti.timi);
  });

  it('μεταδίδει σφάλμα του port χωρίς να γράψει αρχείο', async () => {
    const eclass = new FakeEclassPyli();
    eclass.apotelesma_mathimaton = { ok: false, sfalma: { kodikos: 'SESSION_LIXI', minima: 'Λήξη συνεδρίας' } };
    const apothiki = new MnimiApothiki();

    const apotelesma = await anakalypsi(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(await apothiki.yparxei(ARXEIO_MATHIMATON)).toBe(false);
  });

  it('αδιατάρτακτος JSON στο mathimata.json επιστρέφει MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(ARXEIO_MATHIMATON, 'δεν είναι JSON');

    const apotelesma = await anakalypsi(ftiaxe_eisodos(new FakeEclassPyli(), apothiki, new KatagrafiDiamnemata()));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});
