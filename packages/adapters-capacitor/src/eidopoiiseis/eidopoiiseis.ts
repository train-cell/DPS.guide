/**
 * `CapacitorEidopoiiseis` — προσαρμογέας τοπικών ειδοποιήσεων (κάρτα P3).
 *
 * D7 (δωρεάν Apple ID): ΜΟΝΟ τοπικές ειδοποιήσεις. Δεν υπάρχει push, δεν υπάρχει
 * διακομιστής, δεν αποστέλλεται τίποτα. Το plugin είναι το `@capacitor/local-notifications`
 * (έκδοση 8.3.1, επαληθευμένη από τα `.d.ts`) και δίνεται ως εξάρτηση, επειδή το
 * πακέτο δεν το δηλώνει στο `package.json` του (κανόνας lane: κανένα config).
 * Η σύνδεση γίνεται στο `apps/mobile` — βλ. `docs/requests/G-01.md`.
 *
 * ΚΑΝΟΝΕΣ ΠΟΥ ΤΗΡΟΥΝΤΑΙ ΕΔΩ:
 *  - ΠΟΤΕ throw: κάθε δημόσια μέθοδος επιστρέφει `Apotelesma`. Οποιαδήποτε βλάβη του
 *    plugin γίνεται `MI_YPOSTIRIZOMENO`. Δεν υπάρχει ψευδής επιτυχία ούτε ψευδής
 *    κενή λίστα (§3.9).
 *  - ΜΗΔΕΝ ΜΥΣΤΙΚΑ: κανένας κωδικός, API key, token ή cookie δεν περνά σε σώμα
 *    ειδοποίησης. Το σώμα ελέγχεται πριν το προγραμματισμό και απορρίπτεται με
 *    `MI_EGKYRO_SXIMA` αν μοιάζει για μυστικό.
 *  - ΜΗΔΕΝ PII ΣΤΗΝ ΚΑΤΑΓΡΑΦΗ: η `KatagrafiPyli` παίρνει μόνο αριθμούς πόσων
 *    ειδοποιήσεων αγγίχτηκαν — ποτέ τίτλο, σώμα ή κλειδί ενότητας.
 *  - ΜΗΔΕΝ ΜΑΓΙΚΑ ΝΟΜΕΡΑ: το όριο των 60 έρχεται από το `MEGISTOS_ARITHMOS_EIDOPOIISEON`
 *    του `@dps/core` (60 < 64, το όριο των pending του iOS).
 */

import { MEGISTOS_ARITHMOS_EIDOPOIISEON, apotyxia, ok } from '@dps/core';
import type { Apotelesma, KatagrafiPyli, RologiPyli } from '@dps/core';
import {
  EXTRA_KLEIDI_ENOTITAS,
  TYPOI_ENDYSEON,
  arithmos_apok_stable,
  kleidiEnotitas_apo_extra,
} from './typoi.js';
import type {
  AitimEidopoiseis,
  EidopoiiseisPugi,
  EidopoiisiGRAMMAT,
  EidopoiisiProgrammatismeni,
  KatastasiAdieas,
} from './typoi.js';

/** Ρολόι που χρησιμοποιείται όταν ο καλών δεν περνά `RologiPyli` (παραγωγή μόνο). */
const ROLOGI_ORIOS: RologiPyli = { tora: () => new Date() };

/**
 * Λέξεις-κλειδιά που δεν επιτρέπονται στο σώμα ειδοποίησης (D7).
 * Είναι πρόθεμα/μέρος λέξης, όχι ακριβείς φράσεις, για να πιάνονται και οι μορφές
 * `κωδικός`, `κωδικού`, `api-key`, `API_KEY`, `bearer` κ.λπ.
 */
const APORRYPTA_LEXEIS: readonly string[] = [
  'password',
  'passwd',
  'κωδικ',
  'api[-_ ]?key',
  'apikey',
  'token',
  'bearer',
  'authorization',
  'cookie',
  'session=',
  'secret',
  'llm_api_key',
];

/** Επιστρέφει το κείμενο σε μορφή που ελέγχεται· μηδενικό `any`. */
function kleimeno(s: string): string {
  return s.toLowerCase();
}

/** Αν το κείμενο υποψιάζεται μυστικό — D7: δεν περνά στο σώμα της ειδοποίησης. */
function lei_ypopsia_mystikou(s: string): boolean {
  const k = kleimeno(s);
  return APORRYPTA_LEXEIS.some((l) => new RegExp(l).test(k));
}

/** Μηνύματα σφάλματος χωρίς το περιεχόμενο του χρήστη — μόνο το τι απέτυχε. */
function akro_sfalmata(perichmeno: string): Apotelesma<never> {
  return apotyxia('MI_YPOSTIRIZOMENO', `Απέτυχε ${perichmeno} στην εφαρμογή`);
}

/** Εξαγωγή του id του plugin από μια εγγραφή, ή null αν δεν είναι ακέραιο. */
function id_apo_arithmo(timi: unknown): number | null {
  return typeof timi === 'number' && Number.isInteger(timi) ? timi : null;
}

export class CapacitorEidopoiiseis {
  private readonly pugi: EidopoiiseisPugi;
  private readonly rologi: RologiPyli;
  private readonly katagrafi: KatagrafiPyli | undefined;
  /** Αντιστοιχίζει το κλειδί κάθε ενότητας στο id του plugin, όσο ζει ο προσαρμογέας. */
  private readonly arithmoiEnotiton = new Map<string, number>();

  constructor(pugi: EidopoiiseisPugi, rologi: RologiPyli = ROLOGI_ORIOS, katagrafi?: KatagrafiPyli) {
    this.pugi = pugi;
    this.rologi = rologi;
    this.katagrafi = katagrafi;
  }

  /** Καταγραφή με ΜΟΝΟ πλήθος· ποτέ κείμενο χρήστη (μηδενικό PII). */
  private katagrafse(stathmos: 'pliroforia' | 'proeidopoiisi', arithmos: number): void {
    this.katagrafi?.[stathmos](`eidopoiiseis: ${arithmos}`);
  }

  /** Σταθερό id για την ενότητα· το ίδιο κλειδί δίνει πάντα το ίδιο id. */
  private id_ek(kleidiEnotitas: string): number {
    const yparxei = this.arithmoiEnotiton.get(kleidiEnotitas);
    if (yparxei !== undefined) {
      return yparxei;
    }
    const neos = arithmos_apok_stable(kleidiEnotitas);
    this.arithmoiEnotiton.set(kleidiEnotitas, neos);
    return neos;
  }

  /**
   * Ζητά την άδεια εμφάνισης τοπικών ειδοποιήσεων από το σύστημα.
   * Η `denied` είναι νόμιμη απάντηση του χρήστη, όχι σφάλμα → επιστρέφεται ως `ok`.
   */
  async zitise_adia(): Promise<Apotelesma<KatastasiAdieas>> {
    try {
      const apotelesma = await this.pugi.checkPermissions();
      return ok(apotelesma.display);
    } catch {
      return akro_sfalmata('η άδεια ειδοποιήσεων');
    }
  }

  /**
   * Ζητά από τον χρήστη να επιτρέψει τις ειδοποιήσεις (iOS εμφανίζει το διάλογο).
   * Καλείται μόνο από κόμβο του χρήστη — ποτέ αυτόματα κατά το προγραμματισμό.
   */
  async zitisi_adias(): Promise<Apotelesma<KatastasiAdieas>> {
    try {
      const apotelesma = await this.pugi.requestPermissions();
      return ok(apotelesma.display);
    } catch {
      return akro_sfalmata('το αίτημα άδειας ειδοποιήσεων');
    }
  }

  /** Ελέγχει αν η άδεια είναι `granted`· μη `granted` = `AKYROTHIKE` (χωρίς προγραμματισμό). */
  private async proedoria_adias(): Promise<Apotelesma<true>> {
    const adia = await this.zitise_adia();
    if (!adia.ok) {
      return adia;
    }
    if (adia.timi !== 'granted') {
      return apotyxia('AKYROTHIKE', 'Οι ειδοποιήσεις δεν είναι ενεργοποιημένες στη συσκευή');
    }
    return ok(true);
  }

  /** Επικύρωση μιας αίτησης πριν τη μετατροπή σε options του plugin. */
  private epikyrose(aitima: AitimEidopoiseis): Apotelesma<EidopoiisiGRAMMAT> {
    if (aitima.kleidiEnotitas.trim() === '') {
      return apotyxia('MI_EGKYRO_SXIMA', 'Λείπει το κλειδί της ενότητας');
    }
    if (aitima.titlos.trim() === '' || aitima.soma.trim() === '') {
      return apotyxia('MI_EGKYRO_SXIMA', 'Ο τίτλος και το σώμα της υπενθύμισης είναι υποχρεωτικά');
    }
    if (!(aitima.otan instanceof Date) || Number.isNaN(aitima.otan.getTime())) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Η ημερομηνία της υπενθύμισης δεν είναι έγκυρη');
    }
    if (aitima.otan.getTime() <= this.rologi.tora().getTime()) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Η υπενθύμιση πρέπει να είναι μελλοντική');
    }
    if (lei_ypopsia_mystikou(aitima.titlos) || lei_ypopsia_mystikou(aitima.soma)) {
      // Το μήνυμα δεν παριχνά το σώμα — μόνο το γεγονός ότι απορρίφθηκε (D7).
      return apotyxia('MI_EGKYRO_SXIMA', 'Το κείμενο της υπενθύμισης φαίνεται να περιέχει μυστικό');
    }
    return ok({
      title: aitima.titlos,
      body: aitima.soma,
      id: this.id_ek(aitima.kleidiEnotitas),
      schedule: { at: aitima.otan },
      extra: { [EXTRA_KLEIDI_ENOTITAS]: aitima.kleidiEnotitas },
    });
  }

  /**
   * Προγραμματίζει υπενθυμίσεις ενοτήτων.
   * Ποτέ ξεπερνά το `MEGISTOS_ARITHMOS_EIDOPOIISEON` (60) εκκρεμείς ειδοποιήσεις:
   * το iOS κρατάει 64, άρα κρατάμε περιθώριο. Πέρα από το όριο → `PROYPOLOGISMOS`.
   */
  async programmatise(
    aitimais: readonly AitimEidopoiseis[]
  ): Promise<Apotelesma<EidopoiisiProgrammatismeni[]>> {
    if (aitimais.length === 0) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Δεν δόθηκε καμία ενότητα για υπενθύμιση');
    }
    const adia = await this.proedoria_adias();
    if (!adia.ok) {
      return adia;
    }

    const proedres: EidopoiisiGRAMMAT[] = [];
    for (const aitima of aitimais) {
      const epikyrosi = this.epikyrose(aitima);
      if (!epikyrosi.ok) {
        return epikyrosi;
      }
      proedres.push(epikyrosi.timi);
    }

    const amakres = await this.lista_programmatismenon();
    if (!amakres.ok) {
      return amakres;
    }
    const neesKlidiEnotitas = new Set(proedres.map((p) => kleidiEnotitas_apo_extra(p.extra)));
    const yparxein = amakres.timi.filter((p) => neesKlidiEnotitas.has(p.kleidiEnotitas)).length;
    const filtres = proedres.length - yparxein;
    if (amakres.timi.length + filtres > MEGISTOS_ARITHMOS_EIDOPOIISEON) {
      return apotyxia(
        'PROYPOLOGISMOS',
        `Οι ειδοποιήσεις δεν μπορούν να ξεπεράσουν τις ${MEGISTOS_ARITHMOS_EIDOPOIISEON}`
      );
    }

    try {
      const apotelesma = await this.pugi.schedule({ notifications: proedres });
      const meiontai: EidopoiisiProgrammatismeni[] = [];
      for (const aitima of aitimais) {
        const grammati = proedres[meiontai.length];
        if (grammati === undefined) {
          break;
        }
        meiontai.push({
          kleidiEnotitas: aitima.kleidiEnotitas,
          titlos: grammati.title,
          soma: grammati.body,
          otan: grammati.schedule?.at ?? null,
          id: grammati.id,
        });
      }
      void apotelesma;
      this.katagrafse('pliroforia', meiontai.length);
      return ok(meiontai);
    } catch {
      this.katagrafse('proeidopoiisi', 0);
      return akro_sfalmata('ο προγραμματισμός της υπενθύμισης');
    }
  }

  /**
   * Ακυρώνει την υπενθύμιση μιας ενότητας.
   * Ενότητα που δεν είναι προγραμματισμένη → `DEN_VRETHIKE` (όχι ψευδής επιτυχία).
   */
  async akiro(kleidiEnotitas: string): Promise<Apotelesma<void>> {
    const amakres = await this.lista_programmatismenon();
    if (!amakres.ok) {
      return amakres;
    }
    const erevma = amakres.timi.find((p) => p.kleidiEnotitas === kleidiEnotitas);
    if (erevma === undefined) {
      return apotyxia('DEN_VRETHIKE', 'Δεν υπάρχει προγραμματισμένη υπενθύμιση για αυτή την ενότητα');
    }
    try {
      await this.pugi.cancel({ notifications: [{ id: erevma.id }] });
      this.katagrafse('pliroforia', 1);
      return ok(undefined);
    } catch {
      this.katagrafse('proeidopoiisi', 0);
      return akro_sfalmata('η ακύρωση της υπενθύμισης');
    }
  }

  /** Ακυρώνει όλες τις εκκρεμείς ειδοποιήσεις. */
  async akiro_ol(): Promise<Apotelesma<void>> {
    const amakres = await this.lista_programmatismenon();
    if (!amakres.ok) {
      return amakres;
    }
    try {
      await this.pugi.cancelAll();
      this.katagrafse('proeidopoiisi', amakres.timi.length);
      return ok(undefined);
    } catch {
      this.katagrafse('proeidopoiisi', 0);
      return akro_sfalmata('η ακύρωση όλων των υπενθυμίσεων');
    }
  }

  /**
   * Οι εκκρεμείς ειδοποιήσεις, ταξινομημένες κατά κλειδί ενότητας.
   * Μια εγγραφή χωρίς αναγνώσιμο `extra` παρακάμπτεται αντί να επιστρέψει ψευδή εγγραφή.
   */
  async lista_programmatismenon(): Promise<Apotelesma<EidopoiisiProgrammatismeni[]>> {
    try {
      const apotelesma = await this.pugi.getPending();
      const tamia: EidopoiisiProgrammatismeni[] = [];
      for (const antilogos of apotelesma.notifications) {
        const kleidiEnotitas = kleidiEnotitas_apo_extra(antilogos.extra);
        const id = id_apo_arithmo(antilogos.id);
        if (kleidiEnotitas === null || id === null) {
          continue;
        }
        tamia.push({
          kleidiEnotitas,
          titlos: antilogos.title,
          soma: antilogos.body,
          otan: antilogos.schedule?.at ?? null,
          id,
        });
      }
      tamia.sort((a, b) => (a.kleidiEnotitas < b.kleidiEnotitas ? -1 : 1));
      return ok(tamia);
    } catch {
      return akro_sfalmata('η ανάγνωση των προγραμματισμένων ειδοποιήσεων');
    }
  }

  /** Πόσες ειδοποιήσεις είναι προγραμματισμένες. */
  async metra_programmatismenon(): Promise<Apotelesma<number>> {
    const amakres = await this.lista_programmatismenon();
    if (!amakres.ok) {
      return amakres;
    }
    return ok(amakres.timi.length);
  }

  /**
   * Καταχωρεί τα action types της εφαρμογής (μελέτη / επανάληψη / σήμερα).
   * Οι ενέργειες της iOS εκτελούνται εντός της εφαρμογής· αν δεν υπάρχει JS bridge σε
   * background, η εφαρμογή ξανασχεδιάζει την επόμενη ημέρα (fallback, βλ. κάρτα P3).
   */
  async katasthise_typois_endyseon(): Promise<Apotelesma<number>> {
    try {
      await this.pugi.registerActionTypes({ types: TYPOI_ENDYSEON });
      this.katagrafse('pliroforia', TYPOI_ENDYSEON.length);
      return ok(TYPOI_ENDYSEON.length);
    } catch {
      this.katagrafse('proeidopoiisi', 0);
      return akro_sfalmata('η καταχώριση των ενεργειών ειδοποίησης');
    }
  }
}

/** Συντομευτική δημιουργία για τα σημεία σύνδεσης. */
export function dimiourgise_eidopoiseis(
  pugi: EidopoiiseisPugi,
  rologi?: RologiPyli,
  katagrafi?: KatagrafiPyli
): CapacitorEidopoiiseis {
  return new CapacitorEidopoiiseis(pugi, rologi, katagrafi);
}