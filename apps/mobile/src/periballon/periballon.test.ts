import { describe, it, expect, vi } from 'vitest';
import { FakeMystika, FakeRologi, MockLlm, MnimiApothiki } from '@dps/core/testing';
import { FakeHttp } from '@dps/core/testing';
import { KLEIDIA_PYLON, pare_pyli, type KleidiPyli } from './periballon.js';
import { ftiaxe_periballon_test as ftiaxe_periballon } from '../../test-fixtures/ftiaxe-test-periballon.js';
import {
  KatagrafiMnimis,
  type EggrafiKatagrafis,
  type EpipedoKatagrafis,
} from './katagrafi-mnimis.js';

const IMEROMINIA_SPORAS = '2026-10-09T10:00:00.000Z';

const EPIPEDA: readonly EpipedoKatagrafis[] = ['pliroforia', 'proeidopoiisi', 'sfalma'];

describe('periballon — προεπιλεγμένες πύλες', () => {
  it('χτίζει και τις έξι πύλες με τα ψεύτικα προσαρμογείς', () => {
    const periballon = ftiaxe_periballon();
    expect(periballon.mystika).toBeInstanceOf(FakeMystika);
    expect(periballon.apothiki).toBeInstanceOf(MnimiApothiki);
    expect(periballon.http).toBeInstanceOf(FakeHttp);
    expect(periballon.llm).toBeInstanceOf(MockLlm);
    expect(periballon.rologi).toBeInstanceOf(FakeRologi);
    expect(periballon.katagrafi).toBeInstanceOf(KatagrafiMnimis);
  });

  it('κάθε κλήση παράγει ξεχωριστά στιγμιότυπα κάθε πύλης', () => {
    const prwto = ftiaxe_periballon();
    const deutero = ftiaxe_periballon();
    expect(deutero.mystika).not.toBe(prwto.mystika);
    expect(deutero.apothiki).not.toBe(prwto.apothiki);
    expect(deutero.http).not.toBe(prwto.http);
    expect(deutero.llm).not.toBe(prwto.llm);
    expect(deutero.rologi).not.toBe(prwto.rologi);
    expect(deutero.katagrafi).not.toBe(prwto.katagrafi);
  });

  it('η προεπιλεγμένη αποθήκη είναι εντελώς κενή', async () => {
    const periballon = ftiaxe_periballon();
    const apotelesma = await periballon.apothiki.lista('.');
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toEqual([]);
    }
  });

  it('το προεπιλεγμένο llm εκθέτει συμβολοσειρά montelo', () => {
    const periballon = ftiaxe_periballon();
    expect(typeof periballon.llm.montelo).toBe('string');
    expect(periballon.llm.montelo.length).toBeGreaterThan(0);
  });

  it('το προεπιλεγμένο ρολόι είναι στερεωμένο στην ημερομηνία σποράς', () => {
    const periballon = ftiaxe_periballon();
    expect(periballon.rologi.tora().toISOString()).toBe(IMEROMINIA_SPORAS);
  });
});

describe('periballon — μερικές αντικαταστάσεις', () => {
  it('η αντικατάσταση αντικαθιστά μόνο τη δοσμένη πύλη', () => {
    const mystika = new FakeMystika();
    const periballon = ftiaxe_periballon({ mystika });
    expect(periballon.mystika).toBe(mystika);
    expect(periballon.apothiki).toBeInstanceOf(MnimiApothiki);
    expect(periballon.http).toBeInstanceOf(FakeHttp);
    expect(periballon.llm).toBeInstanceOf(MockLlm);
    const antimenes = KLEIDIA_PYLON.filter((kleidi) => pare_pyli(periballon, kleidi) === mystika);
    expect(antimenes).toEqual(['mystika']);
  });

  it('η αντικατάσταση δεν μεταδίδεται σε άλλο περιβάλλον', () => {
    const mystika = new FakeMystika();
    const allo = ftiaxe_periballon();
    const periballon = ftiaxe_periballon({ mystika });
    expect(allo.mystika).not.toBe(mystika);
    expect(periballon.mystika).toBe(mystika);
  });
});

describe('periballon — me_antikatastasi', () => {
  it('επιστρέφει νέο περιβάλλον και αφήνει τον παραλήπτη αναλλοίωτο', () => {
    const arxiko = ftiaxe_periballon();
    const palio_mystika = arxiko.mystika;
    const neos_mystika = new FakeMystika();
    const neos = arxiko.me_antikatastasi('mystika', neos_mystika);
    expect(neos).not.toBe(arxiko);
    expect(arxiko.mystika).toBe(palio_mystika);
    expect(neos.mystika).toBe(neos_mystika);
    expect(neos.mystika).not.toBe(arxiko.mystika);
  });

  it('διατηρεί την ταυτότητα των πυλών που δεν άγγιξε', () => {
    const arxiko = ftiaxe_periballon();
    const neos = arxiko.me_antikatastasi('apothiki', new MnimiApothiki());
    expect(neos.mystika).toBe(arxiko.mystika);
    expect(neos.http).toBe(arxiko.http);
    expect(neos.llm).toBe(arxiko.llm);
    expect(neos.rologi).toBe(arxiko.rologi);
    expect(neos.katagrafi).toBe(arxiko.katagrafi);
    expect(neos.apothiki).not.toBe(arxiko.apothiki);
  });

  it('το νέο περιβάλλον έχει και τις έξι πύλες μαζί με τον αντιστοιχιστή', () => {
    const neos = ftiaxe_periballon().me_antikatastasi('http', new FakeHttp());
    for (const kleidi of KLEIDIA_PYLON) {
      expect(pare_pyli(neos, kleidi)).toBeDefined();
    }
    expect(typeof neos.me_antikatastasi).toBe('function');
  });

  it('οι αλυσιδωτές αντικαταστάσεις συνθέτουν σωστά', () => {
    const mystika = new FakeMystika();
    const http = new FakeHttp();
    const rologi = new FakeRologi();
    const arxiko = ftiaxe_periballon();
    const neos = arxiko
      .me_antikatastasi('mystika', mystika)
      .me_antikatastasi('http', http)
      .me_antikatastasi('rologi', rologi);
    expect(neos.mystika).toBe(mystika);
    expect(neos.http).toBe(http);
    expect(neos.rologi).toBe(rologi);
    expect(neos.apothiki).toBe(arxiko.apothiki);
    expect(arxiko.mystika).not.toBe(mystika);
  });

  it('απορρίπτει πύλη λάθους τύπου σε επίπεδο τύπου', () => {
    const periballon = ftiaxe_periballon();
    // @ts-expect-error: η πύλη llm δέχεται μόνο LlmPyli
    periballon.me_antikatastasi('llm', new FakeMystika());
    expect(periballon.llm).toBeInstanceOf(MockLlm);
  });

  it('απορρίπτει άγνωστο κλειδί πύλης σε επίπεδο τύπου', () => {
    const periballon = ftiaxe_periballon();
    // @ts-expect-error: το mi_gnwsto δεν ανήκει στα KLEIDIA_PYLON
    periballon.me_antikatastasi('mi_gnwsto', new FakeMystika());
    expect(periballon.mystika).toBeInstanceOf(FakeMystika);
  });
});

describe('periballon — pare_pyli και KLEIDIA_PYLON', () => {
  it('ο pare_pyli επιστρέφει ακριβώς το ίδιο αντικείμενο με την ιδιότητα', () => {
    const periballon = ftiaxe_periballon();
    expect(pare_pyli(periballon, 'http')).toBe(periballon.http);
    expect(pare_pyli(periballon, 'mystika')).toBe(periballon.mystika);
    expect(pare_pyli(periballon, 'apothiki')).toBe(periballon.apothiki);
    expect(pare_pyli(periballon, 'llm')).toBe(periballon.llm);
    expect(pare_pyli(periballon, 'rologi')).toBe(periballon.rologi);
    expect(pare_pyli(periballon, 'katagrafi')).toBe(periballon.katagrafi);
  });

  it('ο κατάλογος κλειδιών έχει τα έξι κλειδιά ταξινομημένα και είναι παγωμένος', () => {
    expect(Object.isFrozen(KLEIDIA_PYLON)).toBe(true);
    expect(KLEIDIA_PYLON).toHaveLength(6);
    expect([...KLEIDIA_PYLON]).toEqual(['apothiki', 'http', 'katagrafi', 'llm', 'mystika', 'rologi']);
  });

  it('ο κατάλογος κλειδιών ταυτίζεται με τα κλειδιά ενός κανονικού περιβάλλοντος', () => {
    const periballon = ftiaxe_periballon();
    for (const kleidi of KLEIDIA_PYLON) {
      expect(Object.hasOwn(periballon, kleidi)).toBe(true);
      expect(pare_pyli(periballon, kleidi)).toBeDefined();
    }
  });

  it('το περιβάλλον εκθέτει ακριβώς τις έξι πύλες, τον αντιστοιχιστή και τη σήμανση δείγματος', () => {
    const periballon = ftiaxe_periballon();
    expect(Object.keys(periballon).sort()).toEqual(
      [...KLEIDIA_PYLON, 'me_antikatastasi', 'deigma'].sort()
    );
  });

  it('η σήμανση δείγματος είναι true από προεπιλογή και false μόνο με ρητή επιλογή', () => {
    expect(ftiaxe_periballon().deigma).toBe(true);
    expect(ftiaxe_periballon(undefined, { deigma: false }).deigma).toBe(false);
  });

  it('η σήμανση δείγματος διατηρείται στις αλυσιδωτές αντικαταστάσεις', () => {
    const periballon = ftiaxe_periballon(undefined, { deigma: false }).me_antikatastasi(
      'rologi',
      new FakeRologi()
    );
    expect(periballon.deigma).toBe(false);
  });
});

describe('periballon — αμεσότυποι έλεγχοι τύπου', () => {
  it('ο αντιστοιχιστής δέχεται μόνο πύλη συμβατή με το κλειδί', () => {
    const periballon = ftiaxe_periballon();
    const kleidi: KleidiPyli = 'rologi';
    periballon.me_antikatastasi(kleidi, new FakeRologi());
    expect(periballon.rologi).toBeInstanceOf(FakeRologi);
  });
});

describe('periballon — end-to-end με τα ψεύτικα προσαρμογείς', () => {
  it('γράφει και διαβάζει από τα μυστικά και την αποθήκη μνήμης', async () => {
    const periballon = ftiaxe_periballon();
    await periballon.mystika.vale('llm_api_key', 'sk-TEST-1');
    const timi = await pare_pyli(periballon, 'mystika').pare('llm_api_key');
    expect(timi).toBe('sk-TEST-1');

    const grapse = await periballon.apothiki.grapse_keimeno('mathimata/a.txt', 'periexomeno');
    expect(grapse.ok).toBe(true);
    const diavase = await periballon.apothiki.diavase_keimeno('mathimata/a.txt');
    expect(diavase.ok).toBe(true);
    if (diavase.ok) {
      expect(diavase.timi).toBe('periexomeno');
    }
    const lista = await periballon.apothiki.lista('mathimata');
    expect(lista.ok).toBe(true);
    if (lista.ok) {
      expect(lista.timi).toEqual(['mathimata/a.txt']);
    }
  });
});

describe('KatagrafiMnimis — εγγραφές στη μνήμη', () => {
  it('κρατάει τις εγγραφές με τη σειρά κλήσης σε όλα τα επίπεδα', () => {
    const katagrafi = new KatagrafiMnimis();
    katagrafi.pliroforia('prwto');
    katagrafi.proeidopoiisi('deutero', { kodikos: 7 });
    katagrafi.sfalma('trito', { aitia: 'DIKTYO' });
    const eggrafes = katagrafi.pare_eggrafes();
    expect(eggrafes).toHaveLength(3);
    expect(eggrafes.map((e) => e.epipedo)).toEqual(EPIPEDA);
    expect(eggrafes.map((e) => e.minima)).toEqual(['prwto', 'deutero', 'trito']);
    expect(eggrafes[1]?.dedomena).toEqual({ kodikos: 7 });
    expect(eggrafes[2]?.dedomena).toEqual({ aitia: 'DIKTYO' });
  });

  it('δεν δημιουργεί καθόλου ιδιότητα dedomena όταν το όρισμα απουσιάζει', () => {
    const katagrafi = new KatagrafiMnimis();
    katagrafi.pliroforia('mono minima');
    katagrafi.proeidopoiisi('akomi minimuma');
    katagrafi.sfalma('teleutaio');
    const eggrafes = katagrafi.pare_eggrafes();
    expect(eggrafes).toHaveLength(3);
    for (const eggrafi of eggrafes) {
      expect(Object.hasOwn(eggrafi, 'dedomena')).toBe(false);
      expect(eggrafi.dedomena).toBeUndefined();
    }
  });

  it('το katharise αδειάζει όλες τις εγγραφές', () => {
    const katagrafi = new KatagrafiMnimis();
    katagrafi.pliroforia('ena');
    katagrafi.sfalma('duo');
    katagrafi.katharise();
    expect(katagrafi.pare_eggrafes()).toEqual([]);
  });

  it('η επιστρεφόμενη λίστα είναι αντίγραφο και δεν επηρεάζει την εσωτερική κατάσταση', () => {
    const katagrafi = new KatagrafiMnimis();
    katagrafi.pliroforia('prwto');
    const antigrafi = katagrafi.pare_eggrafes() as EggrafiKatagrafis[];
    antigrafi.push({ epipedo: 'sfalma', minima: 'kapsimo' });
    antigrafi[0] = { epipedo: 'sfalma', minima: 'allagi' };
    expect(katagrafi.pare_eggrafes()).toHaveLength(1);
    expect(katagrafi.pare_eggrafes()[0]?.minima).toBe('prwto');
    expect(katagrafi.pare_eggrafes()[0]?.epipedo).toBe('pliroforia');
  });
});

describe('KatagrafiMnimis — ασφάλεια: μηδενική έξοδος σε console', () => {
  it('καταγράφει το μυστικό στη μνήμη αλλά δεν το γράφει πουθενά έξω', () => {
    const katagrafi = new KatagrafiMnimis();
    const kataskopeftes = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'debug'),
    ];
    katagrafi.pliroforia('kalidoma', { llm_api_key: 'sk-SECRET-123' });
    katagrafi.proeidopoiisi('proeidopoiisi me mystiko', { llm_api_key: 'sk-SECRET-123' });
    katagrafi.sfalma('sfalma me mystiko', { llm_api_key: 'sk-SECRET-123' });

    const kliseis = kataskopeftes.flatMap((kataskopeftis) =>
      kataskopeftis.mock.calls.map((orismata) => orismata.map((o) => String(o)).join(' '))
    );
    for (const kataskopeftis of kataskopeftes) {
      kataskopeftis.mockRestore();
    }

    const eggrafes = katagrafi.pare_eggrafes();
    expect(eggrafes).toHaveLength(3);
    expect(eggrafes[0]?.dedomena?.llm_api_key).toBe('sk-SECRET-123');
    expect(eggrafes[1]?.dedomena?.llm_api_key).toBe('sk-SECRET-123');
    expect(eggrafes[2]?.dedomena?.llm_api_key).toBe('sk-SECRET-123');

    expect(kliseis).toEqual([]);
    expect(kliseis.some((klisi) => klisi.includes('sk-SECRET-123'))).toBe(false);
  });

  it('το περιβάλλον δεν εκτέλεί την καταγραφή σε console μέσω της πύλης', () => {
    const periballon = ftiaxe_periballon();
    const kataskopeftes = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'debug'),
    ];
    periballon.katagrafi.pliroforia('apo tin pyli', { llm_api_key: 'sk-PORT-1' });
    const kliseis = kataskopeftes.flatMap((kataskopeftis) =>
      kataskopeftis.mock.calls.map((orismata) => orismata.map((o) => String(o)).join(' '))
    );
    for (const kataskopeftis of kataskopeftes) {
      kataskopeftis.mockRestore();
    }
    expect(kliseis).toEqual([]);
  });
});
