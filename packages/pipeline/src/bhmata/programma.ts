/**
 * Κάρτα P2: σύνδεση του scheduler του frozen core (L04) με τις ρυθμίσεις
 * (`rythmiseis.json`, §5.3) → `programma.json`.
 *
 * Ο κανόνας 50/50 (D4) είναι εδώ σε απόλυτη ισχύ: το `ftiaxe_programma` του core
 * είναι **καθαρά συνάρτηση** της εισόδου. Η ροή κάνει ΜΟΝΟ μετάφραση
 * (ροθμίσεις + πρόοδος + χάρτες → `EisodosProgrammatos`) και ΕΓΓΡΑΦΗ του
 * αποτελέσματος. Καμία κλήση LLM, καμία δική μας εκτίμηση λεπτών.
 *
 * ΤΥΠΟΙ: τα `RythiseisProgrammatos`/`ProodhosMathimatos` είναι ΔΙΚΑ ΜΑΣ μοντέλα
 * (μοντέλο ορίσματος package· ΠΟΤΕ import από `apps/mobile`, βλ. κάρτα P2).
 * Η εικόνα τους αντιγράφεται από το `rythmiseis.json`/`proodhos.json` της
 * εφαρμογής (§5.3), ώστε τα αρχεία να είναι συμβατά και προς τα δύο.
 */

import type { Apotelesma, Exetasi } from '@dps/core';
import { ExetasiSchema, apotyxia, ok } from '@dps/core';
import { ftiaxe_programma } from '@dps/core/src/programma/index.js';
import type {
  Checkin,
  Diathesimotita,
  EisodosProgrammatos,
  MathimaProgrammatos,
  Programma,
} from '@dps/core/src/programma/index.js';
import type { EisodosPipeline } from '../porte.js';
import {
  ARXEIO_MATHIMATON,
  ARXEIO_RYTHMISEON,
  arxeio_proodhou,
  me_riza,
} from '../statheroi.js';
import { diavase_xarti, grapse_json } from '../grammata/apothiki-json.js';

/** Αναγνωριστικός αριθμός ημέρας εβδομάδας κατά ISO: 1 = Δευτέρα … 7 = Κυριακή. */
export type ArithmosImeras = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Μία γραμμή του εβδομαδιαίου προτύπου λεπτών (όπως το γράφει η εφαρμογή, §5.3). */
export interface GrammiTemplate {
  readonly imera: ArithmosImeras;
  readonly lepta: number;
}

/** Εξαίρεση λεπτών για συγκεκριμένη ημερομηνία. */
export interface ParateropismosLepton {
  readonly imerominia: string;
  readonly lepta: number;
}

/** Το μέρος του `rythmiseis.json` που αφορά το πρόγραμμα. */
export interface RythiseisProgrammatos {
  readonly exetaseis: readonly Exetasi[];
  readonly arxi_exetastikis: string | null;
  readonly ana_imera_evdomadas: readonly number[];
  readonly parateropismoi: Readonly<Record<string, number>>;
}

/** Το μέρος του `proodhos.json` ενός μαθήματος. */
export interface ProodhosMathimatos {
  readonly epilipses_enotiton: readonly string[];
  /** Ημερομηνίες ολοκλήρωσης ανά ενότητα· απαιτούνται για deterministic χρονολόγιο. */
  readonly imerominies_epilipses: Readonly<Record<string, string>>;
}

/** Αρχείο προγράμματος στη ρίζα (§4 βήμα 10· θέση που σημειώνει η κάρτα P2). */
export const ARXEIO_PROGRAMMATOS = 'programma.json';

/** Βήμα 10: `rythmiseis.json` + χάρτες + πρόοδος → `programma.json` (deterministic). */
export async function programma(p: EisodosPipeline): Promise<Apotelesma<Programma>> {
  const rythmiseis = await diavase_rythmiseis(p);
  if (!rythmiseis.ok) {
    return rythmiseis;
  }

  const mathimata = await diavase_arxio_json(p, ARXEIO_MATHIMATON);
  if (!mathimata.ok) {
    return mathimata;
  }
  if (!Array.isArray(mathimata.timi)) {
    p.katagrafi.sfalma('programma: το mathimata.json δεν είναι λίστα');
    return apotyxia('MI_EGKYRO_SXIMA', 'Το mathimata.json δεν είναι λίστα μαθημάτων');
  }

  const episkeptes = mathimata.timi.filter(
    (m): m is { kodikos: string } =>
      typeof m === 'object' && m !== null && 'kodikos' in m && typeof m.kodikos === 'string' && 'epilegmeno' in m && m.epilegmeno === true
  );

  if (episkeptes.length === 0) {
    p.katagrafi.sfalma('programma: δεν υπάρχει επιλεγμένο μάθημα');
    return apotyxia('DEN_VRETHIKE', 'Δεν υπάρχει επιλεγμένο μάθημα για πρόγραμμα μελέτης');
  }

  const eisodosMathimata: MathimaProgrammatos[] = [];
  const checkins: Checkin[] = [];

  for (const mathima of episkeptes) {
    const xartis = await diavase_xarti(p.apothiki, p.riza, mathima.kodikos);
    if (!xartis.ok) {
      p.katagrafi.sfalma('programma: ο χάρτης του μαθήματος δεν διαβάστηκε', {
        kodikos_mathimatos: mathima.kodikos,
      });
      return xartis;
    }

    const exetasi = rythmiseis.timi.exetaseis.find((e) => e.kodikos_mathimatos === mathima.kodikos) ?? null;
    eisodosMathimata.push({
      kodikos_mathimatos: mathima.kodikos,
      enotites: xartis.timi.enotites,
      imerominia_exetasis: exetasi === null || exetasi === undefined ? null : exetasi.imerominia,
    });

    const proodhos = await diavase_proodhos(p, mathima.kodikos);
    if (!proodhos.ok) {
      return proodhos;
    }
    const simera =imerominia_simera(p);
    for (const enotita_id of proodhos.timi.epilipses_enotiton) {
      const imerominia = proodhos.timi.imerominies_epilipses[enotita_id] ?? simera;
      if (imerominia > simera) {
        p.katagrafi.sfalma('programma: check-in στο μέλλον', {
          kodikos_mathimatos: mathima.kodikos,
          enotita_id,
        });
        return apotyxia(
          'MI_EGKYRO_SXIMA',
          `Το check-in της ενότητας «${enotita_id}» είναι στο μέλλον (${imerominia} > ${simera})`
        );
      }
      const enotita = xartis.timi.enotites.find((e) => e.id === enotita_id);
      checkins.push({
        enotita_id,
        imerominia,
        pragmatika_lepta: enotita?.lepta_ektimisi ?? 0,
        oloklirothike: true,
      });
    }
  }

  const diathesimotita: Diathesimotita = {
    ana_imera_evdomadas: [...rythmiseis.timi.ana_imera_evdomadas],
    overrides: { ...rythmiseis.timi.parateropismoi },
  };

  const eisodos: EisodosProgrammatos = {
    mathimata: eisodosMathimata,
    diathesimotita,
    checkins,
    simera: imerominia_simera(p),
    arxi_exetastikis: rythmiseis.timi.arxi_exetastikis,
  };

  const apotelestika = ftiaxe_programma(eisodos);
  if (!apotelestika.ok) {
    p.katagrafi.sfalma('programma: ο scheduler του core απέτυχε', {
      kodikos: apotelestika.sfalma.kodikos,
      minima: apotelestika.sfalma.minima,
    });
    return apotelestika;
  }

  const grapse = await grapse_json(p.apothiki, me_riza(p.riza, ARXEIO_PROGRAMMATOS), apotelestika.timi);
  if (!grapse.ok) {
    p.katagrafi.sfalma('programma: απέτυχε η εγγραφή του προγράμματος', {
      kodikos: grapse.sfalma.kodikos,
    });
    return grapse;
  }

  p.katagrafi.pliroforia('programma: το πρόγραμμα μελέτης παράχθηκε', {
    meres: apotelestika.timi.meres.length,
    mathimata: eisodosMathimata.length,
  });
  return ok(apotelestika.timi);
}

/** «Σήμερα» σε ημερολογιακή ημερομηνία Europe/Athens, από το `RologiPyli`. */
function imerominia_simera(p: EisodosPipeline): string {
  return p.rologi.tora().toISOString().slice(0, 10);
}

/** Αναγνώζει και επικυρώνει το `rythmiseis.json` (μόνο το μέρος του προγράμματος). */
async function diavase_rythmiseis(p: EisodosPipeline): Promise<Apotelesma<RythiseisProgrammatos>> {
  const gram = await p.apothiki.diavase_keimeno(me_riza(p.riza, ARXEIO_RYTHMISEON));
  if (!gram.ok) {
    p.katagrafi.sfalma('programma: οι ρυθμίσεις δεν διαβάστηκαν', {
      kodikos: gram.sfalma.kodikos,
    });
    return apotyxia(
      'DEN_VRETHIKE',
      'Λείπει το rythmiseis.json· το πρόγραμμα δεν παράγεται με προεπιλεγμένα (ψεύτικα) δεδομένα'
    );
  }
  let anagnosmeno: unknown;
  try {
    anagnosmeno = JSON.parse(gram.timi);
  } catch (aitia) {
    p.katagrafi.sfalma('programma: το rythmiseis.json δεν είναι έγκυρο JSON');
    return apotyxia('MI_EGKYRO_SXIMA', 'Το rythmiseis.json δεν είναι έγκυρο JSON', aitia);
  }
  if (typeof anagnosmeno !== 'object' || anagnosmeno === null) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το rythmiseis.json δεν είναι αντικείμενο');
  }

  const antikeimeno = anagnosmeno as Record<string, unknown>;
  const exetaseis: Exetasi[] = [];
  const pareExetaseis = antikeimeno['exetaseis'];
  if (Array.isArray(pareExetaseis)) {
    for (const stoixeio of pareExetaseis) {
      const exetasi = ExetasiSchema.safeParse(stoixeio);
      if (!exetasi.success) {
        p.katagrafi.sfalma('programma: μη έγκυρη εξέταση στις ρυθμίσεις');
        return apotyxia('MI_EGKYRO_SXIMA', 'Μία εξέταση στο rythmiseis.json δεν ταιριάζει με το σχήμα', exetasi.error);
      }
      exetaseis.push(exetasi.data);
    }
  }

  // Και τα δύο γράμματα δεκτά: το αρχείο το γράφει η εφαρμογή (P1, camelCase)
  // και η ροή το αποθηκεύει snake_case (D9)· η ανάγνωση δεν κρίνει το σχήμα του αρχείου.
  const arxiExetastikis = antikeimeno['arxiExetastikis'] ?? antikeimeno['arxi_exetastikis'];
  if (
    arxiExetastikis !== undefined &&
    arxiExetastikis !== null &&
    typeof arxiExetastikis !== 'string'
  ) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η αρχή εξεταστικής πρέπει να είναι ημερομηνία ή null');
  }

  const anaImera = antikeimeno['ana_imera_evdomadas'] ?? antikeimeno['templateLepton'];
  const leptaAnaImera = lepta_ana_imera(anaImera);
  if (leptaAnaImera === null) {
    p.katagrafi.sfalma('programma: η εβδομαδιαία διαθεσιμότητα δεν έχει 7 έγκυρες τιμές');
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Οι ρυθμίσεις χρειάζονται εβδομαδιαία διαθεσιμότητα 7 ημερών με μη αρνητικά λεπτά'
    );
  }

  const parateropismoi = parateropismoi_imeron(antikeimeno['parateropismoi'] ?? antikeimeno['overridesLepton']);

  return ok({
    exetaseis,
    arxi_exetastikis: (arxiExetastikis ?? null) as string | null,
    ana_imera_evdomadas: leptaAnaImera,
    parateropismoi,
  });
}

/** Διαβάζει επτά ημερών λεπτά είτε ως `number[]` (0=Δευτέρα) είτε ως `templateLepton`. */
function lepta_ana_imera(timi: unknown): number[] | null {
  if (Array.isArray(timi) && timi.length === 7) {
    const lepta = timi.map((v) => (typeof v === 'number' ? v : Number.NaN));
    return lepta.every((l) => Number.isFinite(l) && l >= 0) ? lepta : null;
  }
  if (Array.isArray(timi)) {
    const grammes = timi.filter(
      (g): g is { imera: number; lepta: number } =>
        typeof g === 'object' && g !== null && 'imera' in g && 'lepta' in g
    );
    if (grammes.length !== 7) {
      return null;
    }
    const lepta = new Array<number>(7).fill(Number.NaN);
    for (const grammi of grammes) {
      if (!Number.isInteger(grammi.imera) || grammi.imera < 1 || grammi.imera > 7) {
        return null;
      }
      if (typeof grammi.lepta !== 'number' || !Number.isFinite(grammi.lepta) || grammi.lepta < 0) {
        return null;
      }
      lepta[grammi.imera - 1] = grammi.lepta;
    }
    return lepta.every((l) => Number.isFinite(l)) ? lepta : null;
  }
  return null;
}

/** Εξαιρέσεις λεπτών ανά ημερομηνία, είτε ως map είτε ως λίστα. */
function parateropismoi_imeron(timi: unknown): Record<string, number> {
  const apotelestes: Record<string, number> = {};
  if (timi === undefined || timi === null) {
    return apotelestes;
  }
  if (Array.isArray(timi)) {
    for (const stoixeio of timi) {
      if (
        typeof stoixeio === 'object' &&
        stoixeio !== null &&
        'imerominia' in stoixeio &&
        'lepta' in stoixeio &&
        typeof stoixeio.imerominia === 'string' &&
        typeof stoixeio.lepta === 'number'
      ) {
        apotelestes[stoixeio.imerominia] = stoixeio.lepta;
      }
    }
    return apotelestes;
  }
  if (typeof timi === 'object') {
    for (const [imerominia, lepta] of Object.entries(timi)) {
      if (typeof lepta === 'number') {
        apotelestes[imerominia] = lepta;
      }
    }
  }
  return apotelestes;
}

/** Αναγνώζει το `proodhos.json` ενός μαθήματος (προεπιλεγμένα κενά, όχι ψεύτικα). */
async function diavase_proodhos(
  p: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<ProodhosMathimatos>> {
  const gram = await p.apothiki.diavase_keimeno(me_riza(p.riza, arxeio_proodhou(kodikos_mathimatos)));
  if (!gram.ok) {
    return ok({ epilipses_enotiton: [], imerominies_epilipses: {} });
  }
  let anagnosmeno: unknown;
  try {
    anagnosmeno = JSON.parse(gram.timi);
  } catch (aitia) {
    p.katagrafi.sfalma('programma: το proodhos.json δεν είναι έγκυρο JSON', { kodikos_mathimatos });
    return apotyxia('MI_EGKYRO_SXIMA', `Το proodhos.json του μαθήματος ${kodikos_mathimatos} δεν είναι έγκυρο JSON`, aitia);
  }
  if (typeof anagnosmeno !== 'object' || anagnosmeno === null) {
    return ok({ epilipses_enotiton: [], imerominies_epilipses: {} });
  }
  const antikeimeno = anagnosmeno as Record<string, unknown>;
  const epilipses = Array.isArray(antikeimeno['epilipses_enotiton'])
    ? antikeimeno['epilipses_enotiton'].filter((v): v is string => typeof v === 'string')
    : [];
  const imerominies = antikeimeno['imerominies_epilipses'];
  const imerominiesEpilipses: Record<string, string> = {};
  if (typeof imerominies === 'object' && imerominies !== null) {
    for (const [enotita_id, timi] of Object.entries(imerominies)) {
      if (typeof timi === 'string') {
        imerominiesEpilipses[enotita_id] = timi;
      }
    }
  }
  return ok({ epilipses_enotiton: epilipses, imerominies_epilipses: imerominiesEpilipses });
}

/** Απλή ανάγνωση JSON χωρίς σχήμα (χρησιμοποιείται μόνο για τη λίστα μαθημάτων). */
async function diavase_arxio_json(p: EisodosPipeline, diadromi: string): Promise<Apotelesma<unknown>> {
  const gram = await p.apothiki.diavase_keimeno(me_riza(p.riza, diadromi));
  if (!gram.ok) {
    p.katagrafi.sfalma('programma: το mathimata.json δεν διαβάστηκε', { kodikos: gram.sfalma.kodikos });
    return gram;
  }
  try {
    return ok(JSON.parse(gram.timi) as unknown);
  } catch (aitia) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το mathimata.json δεν είναι έγκυρο JSON', aitia);
  }
}

/** Επανεξαγωγή: το σχήμα της ενότητας, για τους καλούντες που θέλουν να το ελέγξουν. */
export type { Programma as ProgrammaMeletis };