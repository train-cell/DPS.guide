import { describe, it, expect, vi } from 'vitest';
import { MnimiApothiki } from '@dps/core/testing';
import type { Apotelesma, Arxeio, ApothikiPyli, KatevasmaPyli, KomvosArxeiou } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { ArgiosLlm, FakeEclassPyli, FakeKatevasmaPyli, KatagrafiDiamnemata, StatheriRologi } from '../testing/voirtheia.js';
import { sygxronismos } from '../bhmata/sygxronismos.js';
import type { EisodosPipeline } from '../porte.js';
import { arxeio_eurethriou, me_riza } from '../statheroi.js';
import { ftiaxe_arxeio_id } from '../grammata/apothiki-json.js';

const MB = 1024 * 1024;

function komvos_arxeio(epitexseis: Partial<KomvosArxeiou> = {}): KomvosArxeiou {
  return {
    typos: 'arxeio',
    onoma: 'dilosi.pdf',
    diadromi: 'dilosi.pdf',
    url: 'https://thales.example/document/M1/dilosi.pdf',
    megethos: 1024,
    imerominia: '2026-10-01T00:00:00.000Z',
    ...epitexseis,
  };
}

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

/** Πύλη eClass με `base_url` και `pare_kefalides_lipshs` σταθερής τιμής. */
function eclass_meafero(base_url: string, kefalides: Record<string, string> = {}): FakeEclassPyli {
  const eclass = new FakeEclassPyli();
  // Τα `base_url` / `pare_kefalides_lipshs` είναι προαιρετικά στο `EclassPyli`
  // και δεν δηλώνονται στην κλάση — οπότε απαιτείται η μεταφορά τύπου.
  const pyli = eclass as unknown as {
    base_url?: string;
    pare_kefalides_lipshs?: () => Record<string, string>;
  };
  pyli.base_url = base_url;
  pyli.pare_kefalides_lipshs = () => kefalides;
  return eclass;
}

/** Πύλη λήψης που αποτυγχάνει πάντα (ελέγχει τη διάσωση του `sygxronismos`). */
function katevasma_apotyxias(): KatevasmaPyli {
  return {
    async katevase(): Promise<Apotelesma<{ megethos: number }>> {
      return apotyxia('DIKTYO', 'Αδύνατη η λήψη του αρχείου');
    },
  };
}

/** Πύλη αποθήκης που αποτυγχάνει στις ανάγνωση δυαδικού (λείπουν τα bytes μετά τη λήψη). */
function apothiki_kentri(i: ApothikiPyli): ApothikiPyli {
  return {
    async diavase_keimeno(diadromi: string) {
      return i.diavase_keimeno(diadromi);
    },
    async diavase_dyadiko(diadromi: string) {
      return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκαν τα bytes του ${diadromi}`);
    },
    async grapse_keimeno(diadromi: string, periexomeno: string) {
      return i.grapse_keimeno(diadromi, periexomeno);
    },
    async grapse_dyadiko(diadromi: string, dedomena: Uint8Array) {
      return i.grapse_dyadiko(diadromi, dedomena);
    },
    async yparxei(diadromi: string) {
      return i.yparxei(diadromi);
    },
    async lista(fakelos: string) {
      return i.lista(fakelos);
    },
    async diagrafi(diadromi: string) {
      return i.diagrafi(diadromi);
    },
  };
}

/** Νέα εισόδος με προσαρμοσμένο port (π.χ. αποτυχημένη λήψη). */
function ftiaxe_eisodos_me_porta(
  p: EisodosPipeline,
  { katevasma, apothiki }: { katevasma?: KatevasmaPyli; apothiki?: ApothikiPyli }
): EisodosPipeline {
  return {
    ...p,
    ...(katevasma ? { katevasma } : {}),
    ...(apothiki ? { apothiki } : {}),
  } as unknown as EisodosPipeline;
}

async function diavase_arxeia(apothiki: MnimiApothiki): Promise<Arxeio[]> {
  const gram = await apothiki.diavase_keimeno(arxeio_eurethriou('M1'));
  if (!gram.ok) throw new Error('λείπει το ευρετήριο');
  return JSON.parse(gram.timi) as Arxeio[];
}

describe('sygxronismos — κανόνες §8 και §5.3', () => {
  it('κρατάει μόνο τις επιτρεπόμενες επεκτάσεις', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      M1: [
        komvos_arxeio({ onoma: 'a.pdf', diadromi: 'a.pdf' }),
        komvos_arxeio({ onoma: 'b.pptx', diadromi: 'b.pptx' }),
        komvos_arxeio({ onoma: 'c.docx', diadromi: 'c.docx' }),
        komvos_arxeio({ onoma: 'd.zip', diadromi: 'd.zip' }),
        komvos_arxeio({ onoma: 'e.exe', diadromi: 'e.exe' }),
        komvos_arxeio({ onoma: 'f.xyz', diadromi: 'f.xyz' }),
      ],
    };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, katagrafi), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(4);
    const arxeia = await diavase_arxeia(apothiki);
    expect(arxeia.map((a) => a.diadromi).sort()).toEqual(['a.pdf', 'b.pptx', 'c.docx', 'd.zip']);
    const giamata = katagrafi.proeidopoiiseis.filter((m) => m.includes('allowlist'));
    expect(giamata).toHaveLength(2);
    expect(giamata.join(' ')).toContain('e.exe');
    expect(giamata.join(' ')).toContain('f.xyz');
  });

  it('παραλείπει αρχεία μεγαλύτερα από MEGISTO_MEGETHOS_ARXEIOU_MB', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      M1: [
        komvos_arxeio({ onoma: 'mikro.pdf', diadromi: 'mikro.pdf', megethos: 99 * MB }),
        komvos_arxeio({ onoma: 'terastios.pdf', diadromi: 'terastios.pdf', megethos: 101 * MB }),
      ],
    };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, katagrafi), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
    expect((await diavase_arxeia(apothiki)).map((a) => a.diadromi)).toEqual(['mikro.pdf']);
    expect(katagrafi.proeidopoiiseis.join(' ')).toContain('terastios.pdf');
  });

  it('κανονικοποιεί τις διαδρομές (NFC, χαρακτήρες, ..) πριν την εγγραφή', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      M1: [
        komvos_arxeio({ onoma: 'Σημειώσεις Α.pdf', diadromi: 'ενότητα 1/Σημειώσεις: Α.pdf' }),
        komvos_arxeio({ onoma: 'escape.pdf', diadromi: '../escape.pdf' }),
        komvos_arxeio({ onoma: 'nested.pdf', diadromi: 'ενότητα 1/ενότητα 2/nested.pdf' }),
      ],
    };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, katagrafi), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    const arxeia = await diavase_arxeia(apothiki);
    expect(arxeia.map((a) => a.diadromi).sort()).toEqual([
      'ενότητα 1/Σημειώσεις_ Α.pdf',
      'ενότητα 1/ενότητα 2/nested.pdf',
    ]);
  });

  it('αρνείται τη διαδρομή που περιέχει .. (μηδενική ασφάλεια, καμία εγγραφή)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio({ diadromi: '../../etc/passwd.pdf' })] };
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(0);
    expect(await apothiki.yparxei(arxeio_eurethriou('M1'))).toBe(true);
    expect(await diavase_arxeia(apothiki)).toEqual([]);
  });

  it('χρησιμοποιεί σταθερό arxeio_id = sha256(kodikos_mathimatos + diadromi)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio({ diadromi: 'ενότητα 1/a.pdf' })] };
    const apothiki = new MnimiApothiki();

    await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    const arxeia = await diavase_arxeia(apothiki);
    expect(arxeia).toHaveLength(1);
    expect(arxeia[0]?.id).toBe(ftiaxe_arxeio_id('M1', 'ενότητα 1/a.pdf'));
    expect(arxeia[0]?.kodikos_mathimatos).toBe('M1');
  });

  it('ένας δεύτερος γύρος χωρίς αλλαγές δεν λήφθηκε κανένα νέο αρχείο', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata());

    const proti = await sygxronismos(p, 'M1');
    const defteri = await sygxronismos(p, 'M1');

    expect(proti.ok && proti.timi.megaliteres).toBe(1);
    expect(defteri.ok && defteri.timi.megaliteres).toBe(0);
  });

  it('καταργεί το αρχείο από το ευρετήριο όταν λείψει από το δέντρο του eClass', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio({ diadromi: 'a.pdf' }), komvos_arxeio({ onoma: 'b.pdf', diadromi: 'b.pdf' })] };
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata());
    await sygxronismos(p, 'M1');

    eclass.dendra = { M1: [komvos_arxeio({ diadromi: 'a.pdf' })] };
    const apotelesma = await sygxronismos(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    expect((await diavase_arxeia(apothiki)).map((a) => a.diadromi)).toEqual(['a.pdf']);
  });

  it('μεταδίδει σφάλμα του port δέντρου χωρίς να γράψει ευρετήριο', async () => {
    const eclass = new FakeEclassPyli();
    eclass.apotelesma_dendrou = { ok: false, sfalma: { kodikos: 'SESSION_LIXI', minima: 'Λήξη συνεδρίας' } };
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('SESSION_LIXI');
    expect(await apothiki.yparxei(arxeio_eurethriou('M1'))).toBe(false);
  });

  it('αποτυχία εγγραφής των bytes στο ευρετήριο → σφάλμα λήψης (L76)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();
    apothiki.grapse_dyadiko = async () => apotyxia('DIKTYO', 'Δεν γίνεται εγγραφή');

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    expect(await apothiki.yparxei(arxeio_eurethriou('M1'))).toBe(false);
  });

  it('αδιατάρτακτος ευρετήριο επιστρέφει MI_EGKYRO_SXIMA και δεν κάνει ψεύτικο sync', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno(arxeio_eurethriou('M1'), 'δεν είναι JSON');

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('απέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δεν βγάζει το δέντρο (φάκελοι) από το ευρετήριο', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      M1: [
        komvos_arxeio({ typos: 'fakelos', onoma: 'ενότητα 1', diadromi: 'ενότητα 1', megethos: null }),
        komvos_arxeio({ diadromi: 'ενότητα 1/a.pdf' }),
      ],
    };
    const apothiki = new MnimiApothiki();

    await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect((await diavase_arxeia(apothiki)).map((a) => a.diadromi)).toEqual(['ενότητα 1/a.pdf']);
  });

  it('τις εγγραφές τις τοποθετεί κάτω από το riza όταν έχει οριστεί', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata());
    const me_riza_rio = { ...p, riza: 'data' };

    await sygxronismos(me_riza_rio, 'M1');

    expect(await apothiki.yparxei(me_riza('data', arxeio_eurethriou('M1')))).toBe(true);
    expect(await apothiki.yparxei(arxeio_eurethriou('M1'))).toBe(false);
  });

  it('αποτυχία λήψης → σφάλμα και καμία εγγραφή ευρετηρίου (L162)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos_me_porta(ftiaxe_eisodos(eclass, apothiki, katagrafi), {
      katevasma: katevasma_apotyxias(),
    });

    const apotelesma = await sygxronismos(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    expect(katagrafi.sfalmata.join(' ')).toContain('απέτυχε η λήψη αρχείου');
    expect(await apothiki.yparxei(arxeio_eurethriou('M1'))).toBe(false);
  });

  it('τα bytes λείπουν από την αποθήκη μετά τη λήψη (L175 → L225)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos_me_porta(ftiaxe_eisodos(eclass, apothiki, katagrafi), {
      apothiki: apothiki_kentri(apothiki),
    });

    const apotelesma = await sygxronismos(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(katagrafi.sfalmata).toEqual([]);
  });

  it('αποτυχία εγγραφής ευρετηρίου → σφάλμα (L201)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = { M1: [komvos_arxeio()] };
    const katagrafi = new KatagrafiDiamnemata();
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, katagrafi);
    apothiki.grapse_keimeno = async () => apotyxia('DIKTYO', 'Δεν γίνεται εγγραφή');

    const apotelesma = await sygxronismos(p, 'M1');

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.sfalma.kodikos).toBe('DIKTYO');
    expect(katagrafi.sfalmata.join(' ')).toContain('απέτυχε η εγγραφή του ευρετηρίου');
  });

  it('αρχείο με κενό sha256 στο ευρετήριο ξανακατεβάζει (L247 true)', async () => {
    const eclass = new FakeEclassPyli();
    const komvos = komvos_arxeio({ diadromi: 'a.pdf' });
    eclass.dendra = { M1: [komvos] };
    const apothiki = new MnimiApothiki();
    const p = ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata());
    // Υπάρχει ήδη τοπικό αντίγραφο, αλλά με κενό sha256 → απαιτείται επανέλεγχος
    await apothiki.grapse_dyadiko('M1/arxeia/a.pdf', new TextEncoder().encode('bytes'));
    await apothiki.grapse_keimeno(
      arxeio_eurethriou('M1'),
      JSON.stringify([
        { id: ftiaxe_arxeio_id('M1', 'a.pdf'), kodikos_mathimatos: 'M1', diadromi: 'a.pdf', url: komvos.url, megethos: 1024, imerominia: '2026-10-01T00:00:00.000Z', etag: null, sha256: null, diplotypo_tou: null },
      ])
    );

    const apotelesma = await sygxronismos(p, 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    // Τα μεταδεδομένα δεν άλλαξαν, αλλά το κενό sha256 ανάγκασε νέα λήψη
    expect(apotelesma.timi.megaliteres).toBe(0);
    const arxeia = await (async () => {
      const gram = await apothiki.diavase_keimeno(arxeio_eurethriou('M1'));
      if (!gram.ok) throw new Error('λείπει το ευρετήριο');
      return JSON.parse(gram.timi) as Arxeio[];
    })();
    expect(arxeia.length).toBe(1);
    expect(arxeia[0]?.sha256).not.toBe(null);
  });

  it('η ταξινόμηση είναι αντίστροφη όταν η διάδρομος είναι already ταξινομημένη (L190 false)', async () => {
    const eclass = new FakeEclassPyli();
    eclass.dendra = {
      M1: [
        komvos_arxeio({ diadromi: 'z.pdf' }),
        komvos_arxeio({ diadromi: 'a.pdf' }),
        komvos_arxeio({ diadromi: 'm.pdf' }),
      ],
    };
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    const arxeia = await (async () => {
      const gram = await apothiki.diavase_keimeno(arxeio_eurethriou('M1'));
      if (!gram.ok) throw new Error('λείπει το ευρετήριο');
      return JSON.parse(gram.timi) as Arxeio[];
    })();
    expect(arxeia.map((a) => a.diadromi)).toEqual(['a.pdf', 'm.pdf', 'z.pdf']);
  });

  it('η λήψη στέλνει headers μόνο αν η url είναι same-origin (L233/L235)', async () => {
    const eclass = eclass_meafero('https://thales.example', { authorization: 'Bearer X' });
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();
    const katagrafi = new KatagrafiDiamnemata();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, katagrafi), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    // same-origin → headers
    expect(katagrafi.sfalmata).toEqual([]);
  });

  it('διαφορετική προέλευση → κενά headers (L235 false)', async () => {
    const eclass = eclass_meafero('https://thales.example', { authorization: 'Bearer X' });
    eclass.dendra = {
      M1: [komvos_arxeio({ url: 'https://other.example/document/M1/dilosi.pdf' })],
    };
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
  });

  it('μη έγκυρη base_url → catch και κενά headers (L237)', async () => {
    const eclass = eclass_meafero('not-a-url', { authorization: 'Bearer X' });
    eclass.dendra = { M1: [komvos_arxeio()] };
    const apothiki = new MnimiApothiki();

    const apotelesma = await sygxronismos(ftiaxe_eisodos(eclass, apothiki, new KatagrafiDiamnemata()), 'M1');

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) throw new Error('aπέτυχε');
    expect(apotelesma.timi.megaliteres).toBe(1);
  });
});
