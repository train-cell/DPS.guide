/**
 * Test doubles της ροής (§3 κανόνας 5: μηδέν network, LLM ΜΟΝΟ μέσω MockLlmArchiou,
 * eClass ΜΟΝΟ μέσω του δικού μας FakeEclassPyli — το `packages/mock-eclass` δεν είναι
 * merged στο branch και δεν πρέπει να γίνεται import).
 *
 * Το `LigmaArchiou` ΔΕΝ επινοεί απαντήσεις: στρέφεται στο κανονικό
 * `MockLlmArchiou` του `@dps/ai` και τροφοδοτείται με ηχογραφημένα fixtures, στη σειρά
 * κλήσεων. Όταν η σειρά εξαντλείται, δεν επιστρέφει ψεύτικη απάντηση αλλά ζητάει
 * ρητά το επόμενο fixture (ασφαλής αποτυχία, όπως το ίδιο το `MockLlmArchiou`).
 */

import type {
  Apotelesma,
  EclassPyli,
  KomvosArxeiou,
  Mathima,
  RologiPyli,
} from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import type { ApotelesmaErgaleiou, UlikoTutor } from '@dps/ai';
import { MockLlmArchiou, ODOS_KLEIDIOU, TYPOS_JSON, parastylos_arxeio } from '@dps/ai';
import type { ArkeioLlm } from '@dps/ai';

/** Ονομασία σε ASCII: τα fixtures του `MockLlmArchiou` είναι JSON, όχι αρχεία eClass. */
export const MONTELO_TEST = 'mock-gemini-2.5-flash-test';

/** Ημερομηνία Αθήνας στα σταθερά fixtures, ώστε να μην εξαρτάται από το ρολόι. */
export const IMRAA_THINAS_FIXTURE = '2026-10-09';

/**
 * Πρόγραμματισμένο `EclassPyli`: καταγράφει τις κλήσεις και επιστρέφει
 * προσυμπληρωμένες απαντήσεις. Δεν κάνει καμία επαφή με το δίκτυο.
 */
export class FakeEclassPyli implements EclassPyli {
  apotelesma_syndesis: Apotelesma<void> = ok(undefined);
  mathimata: Mathima[] = [];
  dendra: Record<string, KomvosArxeiou[]> = {};
  apotelesma_mathimaton: Apotelesma<Mathima[]> | null = null;
  apotelesma_dendrou: Apotelesma<KomvosArxeiou[]> | null = null;

  kliseis_syndesis = 0;
  kliseis_mathimata = 0;
  kliseis_dendrou: string[] = [];

  async syndesi(): Promise<Apotelesma<void>> {
    this.kliseis_syndesis += 1;
    return this.apotelesma_syndesis;
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    this.kliseis_mathimata += 1;
    return this.apotelesma_mathimaton ?? ok(this.mathimata);
  }

  async fere_dentro_arxeion(kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    this.kliseis_dendrou.push(kodikos);
    return this.apotelesma_dendrou ?? ok(this.dendra[kodikos] ?? []);
  }
}

/** `RologiPyli` σταθερής ώρας· κανένα ρολόι συστήματος στα tests. */
export class StatheriRologi implements RologiPyli {
  private trexon: Date;

  constructor(arxiko: Date = new Date('2026-10-09T08:00:00.000Z')) {
    this.trexon = new Date(arxiko);
  }

  tora(): Date {
    return new Date(this.trexon);
  }

  theste_xrono(nea: Date): void {
    this.trexon = new Date(nea);
  }
}

/** `KatagrafiPyli` που κρατάει τα μηνύματα, ώστε τα tests να τα ελέγχουν. */
export class KatagrafiDiamnemata {
  plirofories: string[] = [];
  proeidopoiiseis: string[] = [];
  sfalmata: string[] = [];

  pliroforia(minima: string): void {
    this.plirofories.push(minima);
  }

  proeidopoiisi(minima: string): void {
    this.proeidopoiiseis.push(minima);
  }

  sfalma(minima: string): void {
    this.sfalmata.push(minima);
  }
}

/** Ένα ηχογραφημένο fixture LLM, όπως το περιμένει το `MockLlmArchiou`. */
interface ArkeioProsopa {
  timi: unknown;
}

/**
 * Ουρά ηχογραφημένων απαντήσεων που σερβίρονται ΜΕΣΩ του `MockLlmArchiou`.
 *
 * Ο `MockLlmArchiou` ζητάει το fixture ανά κλειδί (hash). Εδώ το κλειδί είναι
 * γνωστό μόνο στον callback, γι' αυτό το fixture χτίζεται εκεί και ταιριάζει
 * υποχρεωτικά το `hash`/`montelo`/`typos_aitimatos` που ζητήθηκαν — δηλαδή
 * περνάει τους ίδιους ελέγχους εγκυρότητας του `@dps/ai`. Όταν δεν υπάρχει
 * επόμενο fixture επιστρέφεται `null` και το `MockLlmArchiou` επιστρέφει σφάλμα
 * `DEN_VRETHIKE` (ποτέ ψεύτικη απάντηση).
 */
export class LigmaArchiou {
  readonly montelo: string;
  /** Ο ίδιος ο `MockLlmArchiou` του `@dps/ai`, όπως ζητάει ο κανόνας 5. */
  readonly llm: MockLlmArchiou;
  /** Πόσες φορές ζητήθηκε πραγματική απάντηση από το `MockLlmArchiou`. */
  fortiseis = 0;

  private oira: ArkeioProsopa[] = [];

  constructor(montelo: string = MONTELO_TEST) {
    this.montelo = montelo;
    this.llm = new MockLlmArchiou(montelo, async (kleidi) => {
      this.fortiseis += 1;
      const epomeno = this.oira.shift();
      if (epomeno === undefined) {
        return null;
      }
      const arkeio: ArkeioLlm = {
        odos_kleidiou: ODOS_KLEIDIOU,
        hash: kleidi,
        montelo,
        ekdosi_prompt: 'test',
        typos_aitimatos: TYPOS_JSON,
        imeras_athinas: IMRAA_THINAS_FIXTURE,
        timi: epomeno.timi,
      };
      return parastylos_arxeio(arkeio);
    });
  }

  /** Ηχογραφεί την επόμενη απάντηση JSON, με τη σειρά των κλήσεων. */
  orise(timi: unknown): this {
    this.oira.push({ timi });
    return this;
  }

  /** Ακυρώνει τις μη καταναλωμένες εγγραφές (για αρχικοποίηση νέου σεναρίου στο ίδιο test). */
  katharize(): this {
    this.oira.length = 0;
    return this;
  }

  /** Πόσα fixtures περιμένουν ακόμα να καταναλωθούν (για asserts). */
  get anamomena(): number {
    return this.oira.length;
  }
}

/** `UlikoTutor` κενό: χωρίς ορισμούς και χωρίς ερωτήσεις άσκησης. */
export function uliko_tutor_keno(): UlikoTutor {
  return { enotites: [], selides: [], perigrafies: [], erotiseis: [] };
}

/** Αποτέλεσμα εργαλείου σταθερό, για τις δοκιμές των βημάτων της ροής. */
export function apotelesma_ergaleiou_stathero(
  onoma: ApotelesmaErgaleiou['onoma'],
  keimeno: string
): Apotelesma<ApotelesmaErgaleiou> {
  return ok({
    onoma,
    keimeno,
    parapompi: null,
    erotisi: null,
  });
}

/** Μη έγκυρο αποτέλεσμα, όταν ένα test θέλει να προκαλέσει σφάλμα σε συνέργειο. */
export function apotelesma_sfalma(kodikos: 'DEN_VRETHIKE' | 'MI_EGKYRO_SXIMA', minima: string): Apotelesma<never> {
  return apotyxia(kodikos, minima);
}

/**
 * `LlmPyli` που δεν καλεί ΠΟΤΕ το μοντέλο: απαντά σφάλμα. Χρησιμοποιείται στα
 * βήματα που δεν επιτρέπεται κλήση LLM (κανόνας 50/50) — αν κληθεί, το test
 * πέφτει με σαφές `DEN_VRETHIKE` αντί να επιστρέψει ψεύτικα δεδομένα.
 */
export class ArgiosLlm {
  readonly montelo = 'mock-llm-ουδέτερο';
  kliseis = 0;

  async parage_json<T>(): Promise<Apotelesma<T>> {
    this.kliseis += 1;
    return apotyxia('DEN_VRETHIKE', 'Το βήμα αυτό δεν επιτρέπεται να καλέσει το μοντέλο');
  }

  async parage_keimeno(): Promise<Apotelesma<string>> {
    this.kliseis += 1;
    return apotyxia('DEN_VRETHIKE', 'Το βήμα αυτό δεν επιτρέπεται να καλέσει το μοντέλο');
  }
}