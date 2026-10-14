/**
 * Βήμα 3 (§4): συγχρονισμός αρχείων ενός μαθήματος.
 *
 * Το `EclassPyli.fere_dentro_arxeion` δίνει το ΔΕΝΔΡΟ (ονόματα, μεγέθη, ημερομηνίες),
 * όχι τα bytes. Η λήψη ανήκει στον adapter L15/L10. Ο ρόλος της ροής είναι:
 *   1. φιλτράρισμα κατά τους κανόνες του §8 (allowlist, `MEGISTO_MEGETHOS_ARXEIOU_MB`),
 *   2. κανονικοποίηση διαδρομών (§5.3) και μεταφορά του δυαδικού στην κανονική θέση
 *      `arxeia/<διαδρομή>` μέσω του `KatevasmaPyli` και `ApothikiPyli`,
 *   3. δέλτα έναντι του `eurethrio-arxeion.json` (μέγεθος / ημερομηνία),
 *   4. sha256 περιεχομένου και εντοπισμός διπλότυπων (`diplotypo_tou`).
 *
 * ΠΟΤΕ δεν επινοείται περιεχόμενο: αποτυχία λήψης ή απουσία byte αποτυγχάνει
 * ολόκληρο το sync και δεν γράφεται ευρετήριο που θα δήλωνε ψευδώς ολοκλήρωση.
 */

import type { Apotelesma, Arxeio, KomvosArxeiou } from '@dps/core';
import { EPITREPOMENES_EPEKTASEIS, MEGISTO_MEGETHOS_ARXEIOU_MB, apotyxia, ok } from '@dps/core';
import { sha256_heks } from '@dps/ai';
import type { EisodosPipeline, Metriti } from '../porte.js';
import { BYTES_ANA_MEGA, arxeio_eurethriou, diadromi_arxeiou, me_riza } from '../statheroi.js';
import { diavase_arxeia, ftiaxe_arxeio_id, grapse_arxeia } from '../grammata/apothiki-json.js';
import { ektekseven_arxeio, karnikopoiese_diadromi } from '../grammata/diadromes.js';

/** Ανώτατο επιτρεπόμενο μέγεθος αρχείου σε bytes (`MEGISTO_MEGETHOS_ARXEIOU_MB` του core). */
const ORIO_MEGETHOUS_ARXEIOU = MEGISTO_MEGETHOS_ARXEIOU_MB * BYTES_ANA_MEGA;

/** Μορφή hex του περιεχομένου, ώστε να μπορεί να τραφεί στο `sha256_heks`. */
function hex_arxeiou(dedomena: Uint8Array): string {
  let hex = '';
  for (const byte of dedomena) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/** Δείκτης περιεχομένου ενός αρχείου (sha256 του περιεχομένου, §4 βήμα 4). */
export function hash_periexomenou(dedomena: Uint8Array): string {
  return sha256_heks(hex_arxeiou(dedomena));
}

/** Επιστρέφει `true` αν η επέκταση είναι στην allowlist του §8. */
function epitrepeta_epiteksi(epiteksi: string): boolean {
  return (EPITREPOMENES_EPEKTASEIS as readonly string[]).includes(epiteksi);
}

/** Υποψήφιο αρχείο μετά τους κανόνες §8 και την κανονικοποίηση §5.3. */
interface ArnitikoArxeio {
  /** Κανονικοποιημένη διαδρομή μέσα στο μάθημα. */
  readonly diadromi: string;
  /** Η διαδρομή όπως τη δίνε το eClass (πριν την κανονικοποίηση). */
  readonly diadromi_apothikis: string;
  readonly url: string;
  readonly megethos: number | null;
  readonly imerominia: string | null;
}

function originale_arxeia(komvoi: readonly KomvosArxeiou[]): {
  dekta: ArnitikoArxeio[];
  proeidopoiiseis: string[];
} {
  const dekta: ArnitikoArxeio[] = [];
  const proeidopoiiseis: string[] = [];
  for (const komvos of komvoi) {
    if (komvos.typos !== 'arxeio') {
      continue;
    }
    const kanoniki = karnikopoiese_diadromi(komvos.diadromi);
    if (!kanoniki.ok) {
      proeidopoiiseis.push(`Παραλείφθηκε το «${komvos.diadromi}»: ${kanoniki.sfalma.minima}`);
      continue;
    }
    const epiteksi = ektekseven_arxeio(kanoniki.timi);
    if (!epitrepeta_epiteksi(epiteksi)) {
      proeidopoiiseis.push(
        `Παραλείφθηκε το «${kanoniki.timi}»: η επέκταση «${epiteksi}» δεν είναι στην allowlist`
      );
      continue;
    }
    if (komvos.megethos !== null && komvos.megethos > ORIO_MEGETHOUS_ARXEIOU) {
      proeidopoiiseis.push(
        `Παραλείφθηκε το «${kanoniki.timi}»: ${komvos.megethos} bytes ξεπερνούν το όριο των ${MEGISTO_MEGETHOS_ARXEIOU_MB} MB`
      );
      continue;
    }
    dekta.push({
      diadromi: kanoniki.timi,
      diadromi_apothikis: komvos.diadromi,
      url: komvos.url,
      megethos: komvos.megethos,
      imerominia: komvos.imerominia,
    });
  }
  return { dekta, proeidopoiiseis };
}

/**
 * Βήμα 3: δέλτα του δέντρου αρχείων → `eurethrio-arxeion.json`.
 * `megaliteres` = πόσα αρχεία είναι νέα ή άλλαξαν μεταδεδομένα σε σχέση με το
 * προηγούμενο ευρετήριο (δηλαδή όσα χρειάζονται νέα κλήση λήψης από τον adapter).
 */
export async function sygxronismos(
  p: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<Metriti>> {
  const dendro = await p.eclass.fere_dentro_arxeion(kodikos_mathimatos);
  if (!dendro.ok) {
    p.katagrafi.sfalma('sygxronismos: το δέντρο αρχείων δεν διαβάστηκε', {
      kodikos: dendro.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return dendro;
  }

  // Πρώτος γύρος: το ευρετήριο δεν υπάρχει ακόμα → κενή λίστα, όχι σφάλμα.
  // Υπάρχον αλλά χαλασμένο ευρετήριο → MI_EGKYRO_SXIMA (ποτέ ψεύτικο «κενό sync»).
  const diadromiEurethriou = me_riza(p.riza, arxeio_eurethriou(kodikos_mathimatos));
  let palio: Arxeio[] = [];
  if (await p.apothiki.yparxei(diadromiEurethriou)) {
    const diavase = await diavase_arxeia(p.apothiki, p.riza, kodikos_mathimatos);
    if (!diavase.ok) {
      p.katagrafi.sfalma('sygxronismos: το ευρετήριο αρχείων δεν διαβάστηκε', {
        kodikos: diavase.sfalma.kodikos,
        kodikos_mathimatos,
      });
      return diavase;
    }
    palio = diavase.timi;
  }

  const { dekta, proeidopoiiseis } = originale_arxeia(dendro.timi);
  for (const proeidopoiisi of proeidopoiiseis) {
    p.katagrafi.proeidopoiisi(`sygxronismos: ${proeidopoiisi}`, { kodikos_mathimatos });
  }

  const palia_ana_diadromi = new Map(palio.map((arxeio) => [arxeio.diadromi, arxeio]));
  const nea: Arxeio[] = [];
  let megaliteres = 0;

  for (const arnitiko of dekta) {
    const proigoumeno = palia_ana_diadromi.get(arnitiko.diadromi);
    const allaxeMetadomes =
      proigoumeno === undefined ||
      proigoumeno.megethos !== arnitiko.megethos ||
      proigoumeno.imerominia !== arnitiko.imerominia;
    if (allaxeMetadomes) {
      megaliteres += 1;
    }

    const telikos = diadromi_arxeiou(kodikos_mathimatos, arnitiko.diadromi);
    const telikiDiadromi = me_riza(p.riza, telikos);
    const prepeiNaKatevasei =
      allaxeMetadomes ||
      !(await p.apothiki.yparxei(telikiDiadromi)) ||
      proigoumeno?.sha256 === null;
    if (prepeiNaKatevasei) {
      const headers = kefalides_lipshs_ana_url(p.eclass, arnitiko.url);
      const download = await p.katevasma.katevase(
        arnitiko.url,
        telikiDiadromi,
        headers,
      );
      if (!download.ok) {
        p.katagrafi.sfalma('sygxronismos: απέτυχε η λήψη αρχείου', {
          kodikos: download.sfalma.kodikos,
          kodikos_mathimatos,
          diadromi: arnitiko.diadromi,
        });
        return apotyxia(
          download.sfalma.kodikos,
          `Δεν ήταν δυνατή η λήψη του αρχείου «${arnitiko.diadromi}». ${download.sfalma.minima}`,
        );
      }
    }
    const periexomeno = await topothetes_to_pedio(p, arnitiko, telikos);
    if (!periexomeno.ok) return periexomeno;

    nea.push({
      id: ftiaxe_arxeio_id(kodikos_mathimatos, arnitiko.diadromi),
      kodikos_mathimatos,
      diadromi: arnitiko.diadromi,
      url: arnitiko.url,
      megethos: arnitiko.megethos,
      imerominia: arnitiko.imerominia,
      etag: null,
      sha256: periexomeno.timi,
      diplotypo_tou: null,
    });
  }

  nea.sort((a, b) => (a.diadromi < b.diadromi ? -1 : a.diadromi > b.diadromi ? 1 : 0));

  const diplotypa = simeios_tautotitas(nea);
  for (const [id, diplotypo] of diplotypa) {
    const arxeio = nea.find((a) => a.id === id);
    if (arxeio !== undefined) {
      arxeio.diplotypo_tou = diplotypo;
    }
  }

  const grapse = await grapse_arxeia(p.apothiki, p.riza, kodikos_mathimatos, nea);
  if (!grapse.ok) {
    p.katagrafi.sfalma('sygxronismos: απέτυχε η εγγραφή του ευρετηρίου', {
      kodikos: grapse.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return grapse;
  }

  p.katagrafi.pliroforia('sygxronismos: ο κατάλογος αρχείων ενημερώθηκε', {
    kodikos_mathimatos,
    megaliteres,
    synolo: nea.length,
  });
  return ok({ megaliteres });
}

/** Διαβάζει τα πραγματικά bytes και επιστρέφει το hash τους. */
async function topothetes_to_pedio(
  p: EisodosPipeline,
  arnitiko: ArnitikoArxeio,
  telikos: string
): Promise<Apotelesma<string>> {
  const diadromi_riza = me_riza(p.riza, telikos);
  const gram = await p.apothiki.diavase_dyadiko(diadromi_riza);
  if (!gram.ok) {
    return apotyxia('DEN_VRETHIKE', `Δεν βρέθηκαν τα ληφθέντα bytes του «${arnitiko.diadromi}».`);
  }
  return ok(hash_periexomenou(gram.timi));
}

/** Authentication headers are attached only to a connector's own origin. */
function kefalides_lipshs_ana_url(eclass: EisodosPipeline['eclass'], url: string): Record<string, string> {
  if (eclass.base_url === undefined || eclass.pare_kefalides_lipshs === undefined) return {};
  try {
    if (new URL(eclass.base_url).origin !== new URL(url).origin) return {};
    return eclass.pare_kefalides_lipshs();
  } catch {
    return {};
  }
}

/** Εντοπίζει τα διπλότυπα περιεχομένου και επιστρέφει `arxeio_id -> id του πρώτου ισοδύναμου`. */
function simeios_tautotitas(arxeia: Arxeio[]): Map<string, string> {
  const protos_me_hash = new Map<string, string>();
  const diplotypa = new Map<string, string>();
  for (const arxeio of arxeia) {
    if (arxeio.sha256 === null) {
      continue;
    }
    const protos = protos_me_hash.get(arxeio.sha256);
    if (protos === undefined) {
      protos_me_hash.set(arxeio.sha256, arxeio.id);
      continue;
    }
    diplotypa.set(arxeio.id, protos);
  }
  return diplotypa;
}
