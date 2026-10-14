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

async function these_arxeia(
  apothiki: MnimiApothiki,
  xartis: XartisMathimatos,
  proodhos: ProodhosMathimatos,
  rythmiseis: RythiseisProgrammatos = RYTHMISEIS_STEREOTYPEDES
): Promise<void> {
  const mathimata = await grapse_json(apothiki, ARXEIO_MATHIMATON, [
    { kodikos: 'M1', titlos: 'Δομές', url: '/M1', epilegmeno: true },
  ]);
  if (!mathimata.ok) throw new Error('aπέτυχε');
  const ry = await grapse_json(apothiki, ARXEIO_RYTHMISEON, rythmiseis);
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
    if (!apotelesma.ok) throw new Error('απέτυχε');
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
      { ...RYTHMISEIS_STEREOTYPEDES, ana_imera_evdomadas: [120, 120, 120] }
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

  it('δεν καλεί ποτέ το μοντέλο (ο scheduler είναι deterministic)', async () => {
    const apothiki = new MnimiApothiki();
    const argios = new ArgiosLlm();
    await these_arxeia(apothiki, xartis_test([enotita_test('e1', 300, 1)]), proodhos_keno());
    const p: EisodosPipeline = {
      ...ftiaxe_eisodos(apothiki, new StatheriRologi(new Date('2026-10-09T08:00:00.000Z'))),
      llm: argios,
    };

    await programma(p);

    expect(argios.kliseis).toBe(0);
  });
});

void (0 as unknown as Exetasi);
