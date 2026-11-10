import { describe, it, expect } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Exetasi, Programma, XartisMathimatos } from '@dps/core';
import { ArgiosLlm, FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, StatheriRologi } from '../testing/voirtheia.js';
import { programma } from '../bhmata/programma.js';
import type { EisodosPipeline } from '../porte.js';
import type { ProodhosMathimatos, RythiseisProgrammatos } from '../bhmata/programma.js';
import {
  ARXEIO_MATHIMATON,
  ARXEIO_RYTHMISEON,
  arxeio_proodhou,
  arxeio_xarti,
} from '../statheroi.js';
import { grapse_json } from '../grammata/apothiki-json.js';

function ftiaxe_eisodos(apothiki: MnimiApothiki, rologi: StatheriRologi): EisodosPipeline {
  return {
    eclass: new FakeEclassPyli(),
    apothiki,
    katevasma: new FakeKatevasmaPyli(apothiki),
    llm: new ArgiosLlm(),
    mystika: { pare: async () => null, vale: async () => undefined, svise: async () => undefined },
    rologi,
    katagrafi: new KatagrafiDiamnemata(),
    riza: '',
  };
}

function xartis_test(enotites: XartisMathimatos['enotites']): XartisMathimatos {
  return { kodikos_mathimatos: 'M1', enotites, ekdosi_prompt: 'p2@1', dimiourgithike: '2026-10-09' };
}

function enotita_test(id: string, lepta: number, seira: number): XartisMathimatos['enotites'][number] {
  return {
    id,
    titlos: `Ενότητα ${id}`,
    piges: [{ arxeio_id: 'arx', apo: 1, eos: 2 }],
    ennoies: [],
    proapaitoumenes: seira > 1 ? [{ enotita_id: `e${seira - 1}`, isxys: 'isxyri' }] : [],
    seira,
    lepta_ektimisi: lepta,
    apodosi_exetasis: null,
  };
}

const RYTHMISEIS_STEREOTYPEDES: RythiseisProgrammatos = {
  exetaseis: [{ kodikos_mathimatos: 'M1', imerominia: '2026-10-20', tropos: 'kleista_vivlia' }],
  arxi_exetastikis: null,
  ana_imera_evdomadas: [120, 120, 120, 120, 120, 60, 0],
  parateropismoi: {},
};

function proodhos_keno(): ProodhosMathimatos {
  return { epilipses_enotiton: [], imerominies_epilipses: {} };
}

/**
 * Γράφει τα αρχεία εισόδου: τα `rythmiseis.json` λαμβάνουν τις ρυθμίσεις
 * προεπιλογής με επιτρέποντες τις αντικαταστάσεις (overriding).
 */
async function these_arxeia(
  apothiki: MnimiApothiki,
  xartis: XartisMathimatos,
  proodhos: ProodhosMathimatos,
  rythmiseis: Record<string, unknown> = {}
): Promise<void> {
  const mathimata = await grapse_json(apothiki, ARXEIO_MATHIMATON, [
    { kodikos: 'M1', titlos: 'Δομές', url: '/M1', epilegmeno: true },
  ]);
  if (!mathimata.ok) throw new Error('aπέτυχε');
  const ry = await grapse_json(
    apothiki,
    ARXEIO_RYTHMISEON,
    { ...RYTHMISEIS_STEREOTYPEDES, ...rythmiseis }
  );
  if (!ry.ok) throw new Error('aπέτυχε');
  const xa = await grapse_json(apothiki, arxeio_xarti('M1'), xartis);
  if (!xa.ok) throw new Error('aπέτυχε');
  const pr = await grapse_json(apothiki, arxeio_proodhou('M1'), proodhos);
  if (!pr.ok) throw new Error('aπέτυχε');
}

describe('programma — καρτα P2 (L04 + ρυθμίσεις → programma.json)', () => {
  it('κλειδώνει τα «σήμερα» από το RologiPyli, όχι από το ρολόι του συστήματος', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres[0]?.imerominia).toBe('2026-10-09');
    expect(apotelestika.meres.at(-1)?.imerominia).toBe('2026-10-20');
  });

  it('η ίδια είσοδος δίνει ακριβώς το ίδιο πρόγραμμα (pure + deterministic)', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1), enotita_test('e2', 200, 2)]), proodhos_keno());
    const p = ftiaxe_eisodos(apothiki, rologi);

    const proti = await programma(p);
    const defteri = await programma(p);

    expect(proti.ok && defteri.ok).toBe(true);
    if (!proti.ok || !defteri.ok) throw new Error('aπέτυχε');
    expect(defteri.timi).toEqual(proti.timi);
  });

  it('η παραλεπόμενη μέρα δεν παράγει πάνω από τη χωρητικότητα', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 10_000, 1)]), proodhos_keno());
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    for (const mera of apotelestika.meres) {
      const lepta = mera.ergasies.reduce((sumiko, e) => sumiko + e.lepta, 0);
      const deiktis = new Date(`${mera.imerominia}T00:00:00.000Z`).getUTCDay();
      const imera = (deiktis + 6) % 7;
      const orio = RYTHMISEIS_STEREOTYPEDES.ana_imera_evdomadas[imera] ?? 0;
      expect(lepta).toBeLessThanOrEqual(orio * 0.8);
    }
  });

  it('οι παράλειπτες μέρες δεν μπαίνουν στο πρόγραμμα', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 10_000, 1)]), proodhos_keno());
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    const imeres = apotelestika.meres.map((m) => m.imerominia);
    expect(imeres).not.toContain('2026-10-11');
    expect(imeres).not.toContain('2026-10-18');
  });

  it('όταν οι λεπτές ξεπερνούν τη χωρητικότητα, προτείνει να αφαιρεθεί ύλη (slack < 0)', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 100_000, 1)]), proodhos_keno());
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.protasi_epiviosis.map((x) => x.kodikos_mathimatos)).toContain('M1');
    expect(apotelestika.slack_ana_mathima['M1']).toBeLessThan(0);
  });

  it('χωρίς ημερομηνία εξέτασης χρησιμοποιεί την arxi_exetastikis και τελειώνει τη νέα ύλη πριν από αυτήν', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    const ARXI = '2026-10-23';
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, exetaseis: [], arxi_exetastikis: ARXI }
    );
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    // Κανένας χρόνος μετά την αρχή εξεταστικής: όλη η νέα ύλη τελειώνει πριν.
    expect(apotelestika.meres.every((m) => m.imerominia <= ARXI)).toBe(true);
    expect(
      apotelestika.meres
        .flatMap((m) => m.ergasies)
        .filter((e) => e.eidos === 'nea_yli')
        .every((e) => e.enotita_id === 'e1')
    ).toBe(true);
    // Υπάρχει πρόγραμμα: η αρχή εξεταστικής χρησιμοποιήθηκε ως deadline.
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('οι επιλυμένες ενότητες αφαιρούνται από τη νέα ύλη', async () => {
    const apothiki = new MnimiApothiki();
    const rologi = new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'));
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1), enotita_test('e2', 300, 2)]), {
      epilipses_enotiton: ['e1'],
      imerominies_epilipses: { e1: '2026-10-09' },
    });
    const p = ftiaxe_eisodos(apothiki, rologi);

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    const nea_yli = apotelestika.meres.flatMap((m) => m.ergasies).filter((e) => e.eidos === 'nea_yli');
    expect(nea_yli.some((e) => e.enotita_id === 'e1')).toBe(false);
    expect(nea_yli.some((e) => e.enotita_id === 'e2')).toBe(true);
  });

  it('χωρίς ρυθμίσεις επιστρέφει DEN_VRETHIKE (ποτέ προεπιλεγμένα ψεύτικα)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.diagrafi(ARXEIO_RYTHMISEON);
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('μη έγκυρες ρυθμίσεις διαθεσιμότητας επιστρέφουν MI_EGKYRO_SXIMA', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, arxi_exetastikis: '2026-10-23', ana_imera_evdomadas: [120, 120, 120] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('ενότητα χωρίς εκτίμηση λεπτών επιστρέφει MI_EGKYRO_SXIMA (τρέξε πρώτα megethi)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([{ ...enotita_test('e1', 300, 1), lepta_ektimisi: null }]),
      proodhos_keno()
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('to mathimata.json λείπει → σφάλμα από το mathimata.json (L348)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.diagrafi(ARXEIO_MATHIMATON);
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('to mathimata.json δεν είναι JSON → MI_EGKYRO_SXIMA (L352)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(ARXEIO_MATHIMATON, 'δεν είναι JSON');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('to mathimata.json δεν είναι λίστα → MI_EGKYRO_SXIMA (L79)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(ARXEIO_MATHIMATON, JSON.stringify({ kodikos: 'M1', epilegmeno: true }));
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δεν υπάρχει επιλεγμένο μάθημα → DEN_VRETHIKE (L89)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(
      ARXEIO_MATHIMATON,
      JSON.stringify([{ kodikos: 'M1', titlos: 'Δομές', url: '/M1', epilegmeno: false }])
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('δεν υπάρχει χάρτης για το μάθημα → σφάλμα (L99)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.diagrafi(arxeio_xarti('M1'));
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('to proodhos.json δεν είναι JSON → σφάλμα (L114)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(arxeio_proodhou('M1'), 'δεν είναι JSON');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('check-in στο μέλλον → MI_EGKYRO_SXIMA (L119, L120)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      { epilipses_enotiton: ['e1'], imerominies_epilipses: { e1: '2026-10-25' } }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('η ενότητα δεν υπάρχει στον χάρτη → DEN_VRETHIKE (L134, ?? 0)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      { epilipses_enotiton: ['ayto-yparkei'], imerominies_epilipses: { 'ayto-yparkei': '2026-10-09' } }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(apotelesma.sfalma.minima).toContain('Άγνωστη ενότητα check-in');
  });

  it('η ημερομηνία ολοκλήρωσης λείπει → χρησιμοποιεί το "σήμερα" (L119)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      { epilipses_enotiton: ['e1'], imerominies_epilipses: {} }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('αποτυχία εγγραφής programma.json → σφάλμα (L163)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    const grapse_keimeno = apothiki.grapse_keimeno.bind(apothiki);
    apothiki.grapse_keimeno = async (diadromi, periexomeno) => {
      if (diadromi.includes('programma.json')) {
        return { ok: false, sfalma: { kodikos: 'DIKTYO', minima: 'δεν γίνεται εγγραφή' } };
      }
      return grapse_keimeno(diadromi, periexomeno);
    };
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
  });

  it('to rythmiseis.json δεν είναι JSON → MI_EGKYRO_SXIMA (L198, L199)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(ARXEIO_RYTHMISEON, 'δεν είναι JSON');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('to rythmiseis.json δεν είναι αντικείμενο → MI_EGKYRO_SXIMA (L201, L202)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(ARXEIO_RYTHMISEON, '42');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('λείπουν οι exetaseis → κενή λίστα (L208 false)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, exetaseis: undefined, arxi_exetastikis: '2026-10-23' }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres[0]?.imerominia).toBe('2026-10-09');
  });

  it('μη έγκυρη εξέταση → MI_EGKYRO_SXIMA (L211, L213)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, exetaseis: [{ kodikos_mathimatos: 'M1' }] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('arxiExetastikis αριθμός → MI_EGKYRO_SXIMA (L222, L227)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, arxiExetastikis: 42 }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('χρησιμοποιεί το templateLepton αν λείπει η ana_imera_evdomadas (L230)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [100, 100, 100, 100, 100, 100, 100],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('χρησιμοποιεί το overridesLepton αν λείπουν οι parateropismoi (L240)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        parateropismoi: undefined,
        overridesLepton: [{ imerominia: '2026-10-09', lepta: 300 }],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('όχι 7 ημέρες στο templateLepton → MI_EGKYRO_SXIMA (L261)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [{ imera: 1, lepta: 120 }],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δεν καλύπτονται όλες οι ημέρες στο templateLepton → MI_EGKYRO_SXIMA (L274)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [
          { imera: 1, lepta: 120 },
          { imera: 2, lepta: 120 },
          { imera: 3, lepta: 120 },
          { imera: 4, lepta: 120 },
          { imera: 5, lepta: 120 },
          { imera: 6, lepta: 120 },
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('templateLepton 7 ημερών πλήρες → L274 true (return lepta)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        // 8 στοιχεία (όχι 7) → 7 έγκυρες `grammes` και οι 7 ημέρες κλειστές
        templateLepton: [
          { imera: 1, lepta: 100 },
          { imera: 2, lepta: 100 },
          { imera: 3, lepta: 100 },
          { imera: 4, lepta: 100 },
          { imera: 5, lepta: 100 },
          { imera: 6, lepta: 60 },
          { imera: 7, lepta: 0 },
          'invalid',
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('templateLepton 7 ημερών έγκυρο → καλύπτει L264-L274', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        // 8 στοιχεία (όχι 7) → πρώτο κλαδί false, 7 έγκυρες `grammes` → L264-L274
        templateLepton: [
          { imera: 1, lepta: 100 },
          { imera: 1, lepta: 100 },
          { imera: 2, lepta: 100 },
          { imera: 3, lepta: 100 },
          { imera: 4, lepta: 100 },
          { imera: 5, lepta: 100 },
          { imera: 6, lepta: 60 },
          'invalid',
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη έγκυρη ημέρα στο templateLepton → MI_EGKYRO_SXIMA (L266)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [
          { imera: 8, lepta: 120 },
          { imera: 2, lepta: 120 },
          { imera: 3, lepta: 120 },
          { imera: 4, lepta: 120 },
          { imera: 5, lepta: 120 },
          { imera: 6, lepta: 120 },
          { imera: 7, lepta: 120 },
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('templateLepton με μη έγκυρη ημέρα → L267 (L266 true)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [
          { imera: 0, lepta: 100 },
          { imera: 2, lepta: 100 },
          { imera: 3, lepta: 100 },
          { imera: 4, lepta: 100 },
          { imera: 5, lepta: 100 },
          { imera: 6, lepta: 100 },
          { imera: 7, lepta: 100 },
          'invalid',
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('templateLepton με αρνητικά λεπτά → L270 (L269 true)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [
          { imera: 1, lepta: -1 },
          { imera: 2, lepta: 100 },
          { imera: 3, lepta: 100 },
          { imera: 4, lepta: 100 },
          { imera: 5, lepta: 100 },
          { imera: 6, lepta: 100 },
          { imera: 7, lepta: 100 },
          'invalid',
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη έγκυρα λεπτά στο templateLepton → MI_EGKYRO_SXIMA (L269)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      {
        ...RYTHMISEIS_STEREOTYPEDES,
        ana_imera_evdomadas: undefined,
        templateLepton: [
          { imera: 1, lepta: -1 },
          { imera: 2, lepta: 120 },
          { imera: 3, lepta: 120 },
          { imera: 4, lepta: 120 },
          { imera: 5, lepta: 120 },
          { imera: 6, lepta: 120 },
          { imera: 7, lepta: 120 },
        ],
      }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη λίστα στις ρυθμίσεις → MI_EGKYRO_SXIMA (L276)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, ana_imera_evdomadas: 42 }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('αριθμός στην ana_imera_evdomadas → MI_EGKYRO_SXIMA (L252)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, ana_imera_evdomadas: 42 }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη αριθμός μέσα στην ana_imera_evdomadas → MI_EGKYRO_SXIMA (L253)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, ana_imera_evdomadas: [120, 'λέξη', 120, 120, 120, 60, 0] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('αρνητικά λεπτά στην ana_imera_evdomadas → MI_EGKYRO_SXIMA (L254)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, ana_imera_evdomadas: [120, -1, 120, 120, 120, 60, 0] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('parateropismoi ως αντικείμενο με αριθμούς → ενώνονται (L302, L303)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: { '2026-10-09': 300, '2026-10-16': 200 } }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('κενές parateropismoi → κενό αντικείμενο (L282, L283)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: undefined }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('parateropismoi ως λίστα → ενώνονται (L285, L287)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: [{ imerominia: '2026-10-09', lepta: 300 }] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('μη έγκυρο entry parateropismoi → παραλείπεται (L287, L288)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: [{ imerominia: '2026-10-09' }] }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('parateropismoi μη αντικείμενο → κενό (L300)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: 'δεν είναι αντικείμενο' }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('parateropismoi με μη αριθμό → παραλείπεται (L302)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(
      apothiki,
      xartis_test([enotita_test('e1', 300, 1)]),
      proodhos_keno(),
      { ...RYTHMISEIS_STEREOTYPEDES, parateropismoi: { '2026-10-09': '300' } }
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('λείπει το proodhos.json → κενό (L316, L317)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.diagrafi(arxeio_proodhou('M1'));
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('to proodhos.json δεν είναι JSON → σφάλμα (L323, L324)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(arxeio_proodhou('M1'), 'δεν είναι JSON');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('to proodhos.json δεν είναι αντικείμενο → κενό (L326, L327)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(arxeio_proodhou('M1'), '42');
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('λείπουν οι epilipses → κενή λίστα (L330)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(arxeio_proodhou('M1'), JSON.stringify({ imerominies_epilipses: {} }));
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('imerominies μη αντικείμενο → κενό (L335)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(
      arxeio_proodhou('M1'),
      JSON.stringify({ epilipses_enotiton: ['e1'], imerominies_epilipses: 42 })
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });

  it('imerominies με μη ημερομηνία → παραλείπεται (L337)', async () => {
    const apothiki = new MnimiApothiki();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    await apothiki.grapse_keimeno(
      arxeio_proodhou('M1'),
      JSON.stringify({ epilipses_enotiton: ['e1'], imerominies_epilipses: { e1: '2026-10-09', e2: 42 } })
    );
    const p = ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z')));

    const apotelesma = await programma(p);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const apotelestika = apotelesma.timi as Programma;
    expect(apotelestika.meres.length).toBeGreaterThan(0);
  });
});

void (0 as unknown as Exetasi);
