/**
 * Tests του `CapacitorEidopoiiseis` (κάρτα P3).
 *
 * ZERO NETWORK: ο `@capacitor/local-notifications` δεν εισάγεται στο πακέτο — ο
 * προσαρμογέας δουλεύει πάνω στη δομική πύλα `EidopoiiseisPugi`, οπότε το τεστ δίνει
 * ένα ψεύτικο αντικείμενο (ίδια αρχή με τα mocks του `@capacitor/filesystem` στο
 * `tests/apothiki.test.ts`, χωρίς καμία κυβερνοασφάλεια).
 *
 * ΜΗΔΕΝ PII: κανένα σώμα ειδοποίησης, κανένας κωδικός, κανένα token στα μηνύματα
 * σφάλματος ή στην καταγραφή.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { FakeRologi, MEGISTOS_ARITHMOS_EIDOPOIISEON } from '@dps/core';
import type { Apotelesma, KatagrafiPyli } from '@dps/core';
import { CapacitorEidopoiiseis } from './eidopoiiseis.js';
import { arithmos_apok_stable, TYPOI_ENDYSEON } from './typoi.js';
import type { AntilogoiGRAMMAT, EidopoiiseisPugi } from './typoi.js';

/** Σταθερό «τώρα» για τα τεστ: μια ώρα πριν την προγραμματισμένη ημερομηνία. */
const TORA = new Date('2026-11-20T17:00:00.000Z');
const IMI = new Date('2026-11-20T18:00:00.000Z');

/** Ψεύτικο plugin: κρατάει τις εκκρεμείς ειδοποιήσεις στη μνήμη, με δυνατότητα βλάβης. */
function psefthiko_pugi() {
  const kliseis: string[] = [];
  const proedres: AntilogoiGRAMMAT[] = [];
  const zotiko = {
    kliseis,
    proedres,
    adia: 'granted' as 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale',
    sfalma: null as Error | null,
    sfalma_periousis: false,
  };
  const pugi: EidopoiiseisPugi = {
    async checkPermissions() {
      kliseis.push('checkPermissions');
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      return { display: zotiko.adia };
    },
    async requestPermissions() {
      kliseis.push('requestPermissions');
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      return { display: zotiko.adia };
    },
    async schedule(o) {
      kliseis.push(`schedule:${o.notifications.length}`);
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      proedres.push(...o.notifications);
      return { notifications: o.notifications.map((n) => ({ id: n.id })) };
    },
    async cancel(o) {
      kliseis.push(`cancel:${o.notifications.map((n) => n.id).join(',')}`);
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      for (const n of o.notifications) {
        const theseis = proedres.findIndex((p) => p.id === n.id);
        if (theseis >= 0) proedres.splice(theseis, 1);
      }
    },
    async cancelAll() {
      kliseis.push('cancelAll');
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      proedres.length = 0;
    },
    async getPending() {
      kliseis.push('getPending');
      if (zotiko.sfalma_periousis) throw zotiko.sfalma ?? new Error('getPending');
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
      return { notifications: [...proedres] };
    },
    async registerActionTypes() {
      kliseis.push('registerActionTypes');
      if (zotiko.sfalma !== null) throw zotiko.sfalma;
    },
  };
  return { pugi, zotiko };
}

/** Καταγραφή κλήσεων, για να ελεγχθεί ότι δεν γράφεται ποτέ σώμα/τίτλος/κλειδί. */
function katagrafiPsefthiki(): KatagrafiPyli & { readonly minimata: string[] } {
  const minimata: string[] = [];
  return {
    minimata,
    pliroforia: (m) => minimata.push(m),
    proeidopoiisi: (m) => minimata.push(m),
    sfalma: (m) => minimata.push(m),
  };
}

interface AitimEidopoiseis {
  readonly kleidiEnotitas: string;
  readonly titlos: string;
  readonly soma: string;
  readonly otan: Date;
}

function aitima(
  kleidiEnotitas: string,
  soma = 'Διάβασε τη θεωρία της ενότητας'
): AitimEidopoiseis {
  return { kleidiEnotitas, titlos: `Υπενθύμιση: ${kleidiEnotitas}`, soma, otan: IMI };
}

/** Νέος προσαρμογέας με σταθερό ρολόι, ώστε τα τεστ να μην εξαρτώνται από το πραγματικό «τώρα». */
function neos(zotiko: ReturnType<typeof psefthiko_pugi>, katagrafi?: KatagrafiPyli) {
  return new CapacitorEidopoiiseis(zotiko.pugi, new FakeRologi(TORA), katagrafi);
}

function kodikos(a: Apotelesma<unknown>): string {
  return a.ok ? 'ok' : a.sfalma.kodikos;
}

describe('CapacitorEidopoiiseis — άδεια (D7)', () => {
  it('zitise_adia επιστρέφει granted όταν έχει δοθεί', async () => {
    const z = psefthiko_pugi();
    expect(await neos(z).zitise_adia()).toEqual({ ok: true, timi: 'granted' });
  });

  it('zitise_adia με denied είναι απάντηση, όχι σφάλμα', async () => {
    const z = psefthiko_pugi();
    z.zotiko.adia = 'denied';
    expect(await neos(z).zitise_adia()).toEqual({ ok: true, timi: 'denied' });
  });

  it('zitisi_adias ρωτά το plugin και επιστρέφει την κατάσταση', async () => {
    const z = psefthiko_pugi();
    z.zotiko.adia = 'prompt';
    expect(await neos(z).zitisi_adias()).toEqual({ ok: true, timi: 'prompt' });
    expect(z.zotiko.kliseis).toEqual(['requestPermissions']);
  });

  it('άδεια denied σε προγραμματισμό → AKYROTHIKE, όχι ψευδής επιτυχία', async () => {
    const z = psefthiko_pugi();
    z.zotiko.adia = 'denied';
    expect(kodikos(await neos(z).programmatise([aitima('en-1')]))).toBe('AKYROTHIKE');
  });

  it('άδεια prompt σε προγραμματισμό → AKYROTHIKE και δεν ζητά άδεια κρυφά', async () => {
    const z = psefthiko_pugi();
    z.zotiko.adia = 'prompt';
    expect(kodikos(await neos(z).programmatise([aitima('en-1')]))).toBe('AKYROTHIKE');
    expect(z.zotiko.kliseis).not.toContain('requestPermissions');
  });
});

describe('CapacitorEidopoiiseis — προγραμματισμός', () => {
  it('προγραμματίζει με τίτλο, σώμα και ημερομηνία στο options του plugin', async () => {
    const z = psefthiko_pugi();
    expect(kodikos(await neos(z).programmatise([aitima('en-1')]))).toBe('ok');
    expect(z.zotiko.proedres).toHaveLength(1);
    const proedr = z.zotiko.proedres[0];
    expect(proedr?.title).toBe('Υπενθύμιση: en-1');
    expect(proedr?.body).toBe('Διάβασε τη θεωρία της ενότητας');
    expect(proedr?.schedule?.at?.toISOString()).toBe(IMI.toISOString());
  });

  it('μεταφέρει το κλειδί της ενότητας στο extra, χωρίς PII', async () => {
    const z = psefthiko_pugi();
    await neos(z).programmatise([aitima('en-42')]);
    expect(z.zotiko.proedres[0]?.extra).toEqual({ kleidiEnotitas: 'en-42' });
  });

  it('πολλαπλές ενότητες σε μία πρόσκληση, με σταθερή σειρά', async () => {
    const z = psefthiko_pugi();
    const a = await neos(z).programmatise([aitima('en-1'), aitima('en-2'), aitima('en-3')]);
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.timi.map((p) => p.kleidiEnotitas)).toEqual(['en-1', 'en-2', 'en-3']);
    expect(z.zotiko.kliseis).toContain('schedule:3');
  });

  it('κενή λίστα → MI_EGKYRO_SXIMA χωρίς να κληθεί το plugin', async () => {
    const z = psefthiko_pugi();
    expect(kodikos(await neos(z).programmatise([]))).toBe('MI_EGKYRO_SXIMA');
    expect(z.zotiko.kliseis.some((k) => k.startsWith('schedule'))).toBe(false);
  });

  it('χρόνος στο παρελθόν → MI_EGKYRO_SXIMA, χωρίς κλήση στο plugin', async () => {
    const z = psefthiko_pugi();
    const a = await neos(z).programmatise([
      { ...aitima('en-1'), otan: new Date('2020-01-01T00:00:00.000Z') },
    ]);
    expect(kodikos(a)).toBe('MI_EGKYRO_SXIMA');
    expect(z.zotiko.kliseis.some((k) => k.startsWith('schedule'))).toBe(false);
  });

  it('άκυρος τίτλος → MI_EGKYRO_SXIMA', async () => {
    const z = psefthiko_pugi();
    expect(kodikos(await neos(z).programmatise([{ ...aitima('en-1'), titlos: '   ' }]))).toBe(
      'MI_EGKYRO_SXIMA'
    );
  });

  it('η ίδια είσοδος δίνει ακριβώς την ίδια έξοδο (deterministic)', async () => {
    const z = psefthiko_pugi();
    const proti = await neos(z).programmatise([aitima('en-7')]);
    const deuteri = await neos(z).programmatise([aitima('en-7')]);
    expect(deuteri).toEqual(proti);
  });

  it('δύο διαφορετικές ενότητες παίρνουν διαφορετικό id', async () => {
    const z = psefthiko_pugi();
    await neos(z).programmatise([aitima('en-1'), aitima('en-2')]);
    const [prima, deftera] = z.zotiko.proedres;
    expect(prima?.id).not.toBe(deftera?.id);
  });

  it('επαναπρογραμματισμός της ίδιας ενότητας κρατάει το ίδιο id', async () => {
    const z = psefthiko_pugi();
    const a = await neos(z).programmatise([aitima('en-5')]);
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.timi[0]?.id).toBe(arithmos_apok_stable('en-5'));
  });
});

describe('CapacitorEidopoiiseis — όριο 60 προγραμματισμένων', () => {
  it('δεν ξεπερνά το MEGISTOS_ARITHMOS_EIDOPOIISEON και μετά δίνει PROYPOLOGISMOS', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    for (let i = 0; i < MEGISTOS_ARITHMOS_EIDOPOIISEON; i += 1) {
      expect(kodikos(await e.programmatise([aitima(`en-${i}`)]))).toBe('ok');
    }
    expect(kodikos(await e.programmatise([aitima('en-extra')]))).toBe('PROYPOLOGISMOS');
  });

  it('η ελεγκτική κλήση δεν περνά από το plugin όταν ξεπεράσει το όριο', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    const polles = Array.from({ length: MEGISTOS_ARITHMOS_EIDOPOIISEON + 1 }, (_, i) =>
      aitima(`en-${i}`)
    );
    expect(kodikos(await e.programmatise(polles))).toBe('PROYPOLOGISMOS');
    expect(z.zotiko.proedres).toHaveLength(0);
  });
});

describe('CapacitorEidopoiiseis — ακύρωση και λίστα', () => {
  it('akiro αφαιρεί μόνο τη ζητούμενη ενότητα', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    await e.programmatise([aitima('en-1'), aitima('en-2')]);
    expect(kodikos(await e.akiro('en-1'))).toBe('ok');
    const amakri = await e.lista_programmatismenon();
    expect(amakri.ok).toBe(true);
    if (amakri.ok) expect(amakri.timi.map((p) => p.kleidiEnotitas)).toEqual(['en-2']);
  });

  it('akiro άγνωστης ενότητας → DEN_VRETHIKE', async () => {
    const z = psefthiko_pugi();
    expect(kodikos(await neos(z).akiro('den-yparktei'))).toBe('DEN_VRETHIKE');
  });

  it('akiro_ol αδειάζει ολόκληρη τη λίστα', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    await e.programmatise([aitima('en-1'), aitima('en-2')]);
    expect(kodikos(await e.akiro_ol())).toBe('ok');
    const amakri = await e.lista_programmatismenon();
    expect(amakri.ok).toBe(true);
    if (amakri.ok) expect(amakri.timi).toHaveLength(0);
  });

  it('metra_programmatismenon μετρά τις εκκρεμείς', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    await e.programmatise([aitima('en-1'), aitima('en-2')]);
    expect(await e.metra_programmatismenon()).toEqual({ ok: true, timi: 2 });
  });

  it('η λίστα είναι ταξινομημένη κατά κλειδί ενότητας, όχι κατά id', async () => {
    const z = psefthiko_pugi();
    const e = neos(z);
    await e.programmatise([aitima('en-z'), aitima('en-a'), aitima('en-m')]);
    const l = await e.lista_programmatismenon();
    expect(l.ok).toBe(true);
    if (l.ok) expect(l.timi.map((p) => p.kleidiEnotitas)).toEqual(['en-a', 'en-m', 'en-z']);
  });

  it('κενή λίστα είναι etimo με [] — όχι σφάλμα', async () => {
    const z = psefthiko_pugi();
    expect(await neos(z).lista_programmatismenon()).toEqual({ ok: true, timi: [] });
  });
});

describe('CapacitorEidopoiiseis — σφάλμα plugin → MI_YPOSTIRIZOMENO, ΠΟΤΕ throw', () => {
  const scenaria: readonly {
    readonly onoma: string;
    readonly trexe: (e: CapacitorEidopoiiseis) => Promise<Apotelesma<unknown>>;
  }[] = [
    { onoma: 'zitise_adia', trexe: (e) => e.zitise_adia() },
    { onoma: 'zitisi_adias', trexe: (e) => e.zitisi_adias() },
    { onoma: 'programmatise', trexe: (e) => e.programmatise([aitima('en-1')]) },
    { onoma: 'akiro', trexe: (e) => e.akiro('en-1') },
    { onoma: 'akiro_ol', trexe: (e) => e.akiro_ol() },
    { onoma: 'lista_programmatismenon', trexe: (e) => e.lista_programmatismenon() },
    { onoma: 'metra_programmatismenon', trexe: (e) => e.metra_programmatismenon() },
    { onoma: 'katasthise_typois_endyseon', trexe: (e) => e.katasthise_typois_endyseon() },
  ];

  for (const { onoma, trexe } of scenaria) {
    it(`${onoma}: μη διαθέσιμο plugin → MI_YPOSTIRIZOMENO χωρίς throw`, async () => {
      const z = psefthiko_pugi();
      z.zotiko.sfalma = new Error('plugin unavailable');
      const a = await trexe(neos(z));
      expect(a.ok).toBe(false);
      if (!a.ok) expect(a.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
    });
  }

  it('getPending που αποτυγχάνει → MI_YPOSTIRIZOMENO, όχι κενή λίστα-ψεύτης', async () => {
    const z = psefthiko_pugi();
    z.zotiko.sfalma_periousis = true;
    expect(kodikos(await neos(z).lista_programmatismenon())).toBe('MI_YPOSTIRIZOMENO');
  });

  it('καμία μέθοδος δεν πετάει όταν το plugin κάνει reject με μη-Error', async () => {
    const z = psefthiko_pugi();
    z.zotiko.sfalma = 'plain string' as unknown as Error;
    expect(kodikos(await neos(z).zitise_adia())).toBe('MI_YPOSTIRIZOMENO');
  });
});

describe('CapacitorEidopoiiseis — D7: κανένα μυστικό, κανένα PII', () => {
  let katagrafi: ReturnType<typeof katagrafiPsefthiki>;

  beforeEach(() => {
    katagrafi = katagrafiPsefthiki();
  });

  it('σώμα με ύποψη κωδικού απορρίπτεται, χωρίς κλήση στο plugin', async () => {
    const z = psefthiko_pugi();
    const a = await neos(z, katagrafi).programmatise([aitima('en-1', 'Ο κωδικός σου είναι hunter2')]);
    expect(kodikos(a)).toBe('MI_EGKYRO_SXIMA');
    expect(z.zotiko.kliseis.some((k) => k.startsWith('schedule'))).toBe(false);
  });

  it('σώμα με ύποψη token, API key, Authorization ή cookie απορρίπτεται', async () => {
    const z = psefthiko_pugi();
    const somata = [
      'βάλε το api_key: AIzaSyABCDEF',
      'Authorization: Bearer abc.def.ghi',
      'cookie: session=xyz123',
      'password = p@ssw0rd',
      'llm_api_key: 12345',
    ];
    for (const soma of somata) {
      expect(kodikos(await neos(z).programmatise([aitima('en-1', soma)]))).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('το μήνυμα σφάλματος δεν περιέχει ποτέ το σώμα', async () => {
    const z = psefthiko_pugi();
    const a = await neos(z).programmatise([aitima('en-1', 'Ο κωδικός σου είναι hunter2')]);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.sfalma.minima).not.toContain('hunter2');
  });

  it('η καταγραφή μετρά μόνο πλήθος, ποτέ σώμα, τίτλο ή κλειδί ενότητας', async () => {
    const z = psefthiko_pugi();
    const e = neos(z, katagrafi);
    await e.programmatise([aitima('en-9', 'Διάβασε τη θεωρία')]);
    await e.akiro_ol();
    const katrach = katagrafi.minimata.join(' | ');
    expect(katrach).not.toContain('Διάβασε τη θεωρία');
    expect(katrach).not.toContain('Υπενθύμιση');
    expect(katrach).not.toContain('en-9');
    for (const minima of katagrafi.minimata) {
      expect(minima).toMatch(/^eidopoiiseis: \d+$/);
    }
  });
});

describe('CapacitorEidopoiiseis — action types (P3)', () => {
  it('καταχωρεί τα action types μελέτη/επανάληψη/σήμερα', async () => {
    const z = psefthiko_pugi();
    expect(kodikos(await neos(z).katasthise_typois_endyseon())).toBe('ok');
    expect(z.zotiko.kliseis).toContain('registerActionTypes');
  });

  it('τα action types έχουν σταθερά ids και ελληνικούς τίτλους', () => {
    for (const typos of TYPOI_ENDYSEON) {
      expect(typos.id).toMatch(/^dps-\w+$/);
      expect(typos.actions.length).toBeGreaterThan(0);
      for (const endysi of typos.actions) {
        expect(endysi.title.length).toBeGreaterThan(0);
      }
    }
  });
});