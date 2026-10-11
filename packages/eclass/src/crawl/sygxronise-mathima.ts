import type { Apotelesma, Arxeio } from '@dps/core';
import { ArxeioSchema, apotyxia, ok } from '@dps/core';
import {
  FAKELOS_APOTHIKEFSIS_ARXEION,
  FAKELOS_ESOTERIKON,
  ONOMA_ARXEIOU_EURETHRIOU,
  PROEPILEGMENO_TIMEOUT_MS,
  PROEPILEGMENOS_USER_AGENT,
} from '../statheres.js';
import {
  einai_epitrepomeni_epiktasi,
  ftiaxe_arxeio_id,
  hash_periexomenou,
  kanonikopoiise_diadromi,
  pare_epiktasi,
  ypervainei_orio_megethous,
} from './kanonikopoiisi.js';
import type { ApologismosSygxronismou, ParametroiSygxronismou } from './typoi.js';

function perimene(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Συγχρονίζει τα αρχεία ενός μαθήματος (Delta Sync).
 *
 * Εγγυήσεις κατά το §5.3 και §8:
 * 1. Delta σύγκριση (diadromi, megethos, imerominia/etag) έναντι του eurethrio-arxeion.json.
 * 2. Λήψη μόνο νέων ή τροποποιημένων αρχείων (ή όσων λείπουν τοπικά).
 * 3. Υπολογισμός sha256 μετά τη λήψη και σήμανση diplotypo_tou για διπλότυπα αρχεία.
 * 4. Σταθερό arxeio_id = sha256(kodikos_mathimatos + diadromi).
 * 5. Έλεγχος ορίου μεγέθους (MEGISTO_MEGETHOS_ARXEIOU_MB = 100 MB).
 * 6. Allowlist επεκτάσεων αρχείων.
 * 7. 404 σε αρχείο -> προειδοποίηση και συνέχεια.
 * 8. Διακοπή μέσω AbortSignal -> αποθήκευση προόδου ώστε η επόμενη εκτέλεση να συνεχίσει.
 */
export async function sygxronise_mathima(
  parametroi: ParametroiSygxronismou
): Promise<Apotelesma<ApologismosSygxronismou>> {
  const {
    kodikos_mathimatos,
    eclass,
    http,
    apothiki,
    riza,
    katagrafi,
    kathysterisi_ms = 0,
    simatodotis,
  } = parametroi;

  // 1. Ανάκτηση δέντρου αρχείων
  const dentro_res = await eclass.fere_dentro_arxeion(kodikos_mathimatos);
  if (!dentro_res.ok) {
    katagrafi?.sfalma('Αποτυχία ανάκτησης δέντρου αρχείων', {
      kodikos: dentro_res.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return dentro_res;
  }

  // 2. Προσδιορισμός διαδρομών αποθήκευσης
  const fakelos_mathimatos = riza ? `${riza}/${kodikos_mathimatos}` : kodikos_mathimatos;
  const diadromi_eurethriou = `${fakelos_mathimatos}/${FAKELOS_ESOTERIKON}/${ONOMA_ARXEIOU_EURETHRIOU}`;

  // 3. Ανάγνωση υπάρχοντος eurethrio-arxeion.json
  const palia_arxeia = new Map<string, Arxeio>();
  if (await apothiki.yparxei(diadromi_eurethriou)) {
    const diavasma = await apothiki.diavase_keimeno(diadromi_eurethriou);
    if (!diavasma.ok) {
      katagrafi?.sfalma('Αποτυχία ανάγνωσης ευρετηρίου αρχείων', {
        kodikos_mathimatos,
      });
      return diavasma;
    }

    try {
      const dedomena: unknown = JSON.parse(diavasma.timi);
      if (!Array.isArray(dedomena)) {
        return apotyxia('MI_EGKYRO_SXIMA', 'Το ευρετήριο αρχείων δεν είναι πίνακας');
      }
      for (const stoixeio of dedomena) {
        const parsed = ArxeioSchema.safeParse(stoixeio);
        if (!parsed.success) {
          return apotyxia(
            'MI_EGKYRO_SXIMA',
            `Μη έγκυρη εγγραφή στο ευρετήριο αρχείων: ${parsed.error.message}`
          );
        }
        palia_arxeia.set(parsed.data.diadromi, parsed.data);
      }
    } catch (sfalma) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Σφάλμα ανάλυσης JSON στο ευρετήριο αρχείων: ${String(sfalma)}`
      );
    }
  }

  // 4. Επεξεργασία κόμβων αρχείων
  let nea_arxeia_metritis = 0;
  let allagmena_arxeia_metritis = 0;
  let ametavlita_arxeia_metritis = 0;
  let paraleifthikan_metritis = 0;

  const nea_lista_eurethriou: Arxeio[] = [];

  const komvoi_arxeion = dentro_res.timi.filter((k) => k.typos === 'arxeio');

  for (const komvos of komvoi_arxeion) {
    // Έλεγχος διακοπής
    if (simatodotis?.aborted) {
      // Αποθήκευση της μέχρι τώρα προόδου πριν την έξοδο
      await apothikefse_proodo(apothiki, diadromi_eurethriou, nea_lista_eurethriou, palia_arxeia);
      return apotyxia('AKYROTHIKE', 'Ο συγχρονισμός αρχείων ακυρώθηκε');
    }

    // Κανονικοποίηση διαδρομής κατά το §5.3
    const kanoniki_res = kanonikopoiise_diadromi(komvos.diadromi);
    if (!kanoniki_res.ok) {
      katagrafi?.proeidopoiisi(
        `Παραλείφθηκε αρχείο λόγω μη έγκυρης διαδρομής: «${komvos.diadromi}»`,
        { kodikos_mathimatos }
      );
      paraleifthikan_metritis += 1;
      continue;
    }
    const kanoniki_diadromi = kanoniki_res.timi;

    // Έλεγχος allowlist επεκτάσεων (§8)
    const epiktasi = pare_epiktasi(kanoniki_diadromi);
    if (!einai_epitrepomeni_epiktasi(epiktasi)) {
      katagrafi?.proeidopoiisi(
        `Παραλείφθηκε αρχείο με μη επιτρεπόμενη επέκταση «${epiktasi}» (εκτός allowlist): «${kanoniki_diadromi}»`,
        { kodikos_mathimatos }
      );
      paraleifthikan_metritis += 1;
      continue;
    }

    // Έλεγχος ανώτατου μεγέθους (§8: 100 MB)
    if (ypervainei_orio_megethous(komvos.megethos)) {
      katagrafi?.proeidopoiisi(
        `Παραλείφθηκε αρχείο λόγω υπέρβασης ορίου μεγέθους 100 MB: «${kanoniki_diadromi}» (${komvos.megethos} bytes)`,
        { kodikos_mathimatos }
      );
      paraleifthikan_metritis += 1;
      continue;
    }

    const proigoumeno = palia_arxeia.get(kanoniki_diadromi);
    const topiki_diadromi = `${fakelos_mathimatos}/${FAKELOS_APOTHIKEFSIS_ARXEION}/${kanoniki_diadromi}`;
    const yparxei_topika = await apothiki.yparxei(topiki_diadromi);

    // Delta έλεγχος: αν δεν έχει αλλάξει μέγεθος/ημερομηνία και υπάρχει τοπικά, δεν κατεβάζουμε ξανά
    const einai_ametavlito =
      proigoumeno !== undefined &&
      yparxei_topika &&
      proigoumeno.megethos === komvos.megethos &&
      (proigoumeno.imerominia === komvos.imerominia ||
        (proigoumeno.etag !== null && proigoumeno.etag === komvos.url));

    if (einai_ametavlito && proigoumeno) {
      ametavlita_arxeia_metritis += 1;
      nea_lista_eurethriou.push({
        ...proigoumeno,
        url: komvos.url,
      });
      continue;
    }

    // Λήψη αρχείου (νέο ή τροποποιημένο)
    const lipsi = await http.aitima({
      methodos: 'GET',
      url: komvos.url,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: PROEPILEGMENO_TIMEOUT_MS,
      typos_apantisis: 'dyadiko',
      kefalides: {
        'user-agent': PROEPILEGMENOS_USER_AGENT,
      },
      ...(simatodotis ? { simatodotis } : {}),
    });

    if (!lipsi.ok) {
      katagrafi?.proeidopoiisi(
        `Αποτυχία λήψης αρχείου «${kanoniki_diadromi}»: ${lipsi.sfalma.minima}`,
        { kodikos_mathimatos }
      );
      continue;
    }

    const katastasi = lipsi.timi.katastasi;
    if (katastasi === 404) {
      // 404 -> προειδοποίηση και συνέχεια
      katagrafi?.proeidopoiisi(
        `Το αρχείο «${kanoniki_diadromi}» δεν βρέθηκε (404) στον διακομιστή`,
        { kodikos_mathimatos }
      );
      continue;
    }

    if (katastasi < 200 || katastasi >= 300) {
      katagrafi?.proeidopoiisi(
        `Αποτυχία λήψης αρχείου «${kanoniki_diadromi}»: HTTP ${katastasi}`,
        { kodikos_mathimatos }
      );
      continue;
    }

    const dedomena = lipsi.timi.dyadiko ?? new Uint8Array(0);

    // Αποθήκευση δυαδικού αρχείου
    const grapsimo = await apothiki.grapse_dyadiko(topiki_diadromi, dedomena);
    if (!grapsimo.ok) {
      katagrafi?.sfalma(
        `Αποτυχία αποθήκευσης αρχείου «${kanoniki_diadromi}»: ${grapsimo.sfalma.minima}`,
        { kodikos_mathimatos }
      );
      continue;
    }

    // Υπολογισμός sha256 περιεχομένου
    const sha256 = hash_periexomenou(dedomena);
    const arxeio_id = ftiaxe_arxeio_id(kodikos_mathimatos, kanoniki_diadromi);
    const etag = lipsi.timi.kefalides['etag'] ?? null;

    if (proigoumeno) {
      allagmena_arxeia_metritis += 1;
    } else {
      nea_arxeia_metritis += 1;
    }

    nea_lista_eurethriou.push({
      id: arxeio_id,
      kodikos_mathimatos,
      diadromi: kanoniki_diadromi,
      url: komvos.url,
      megethos: dedomena.byteLength,
      imerominia: komvos.imerominia,
      etag,
      sha256,
      diplotypo_tou: null,
    });

    if (kathysterisi_ms > 0) {
      await perimene(kathysterisi_ms);
    }
  }

  // 5. Εντοπισμός διπλότυπων αρχείων (diplotypo_tou) με βάση το sha256
  const prwto_ana_hash = new Map<string, string>();
  for (const arxeio of nea_lista_eurethriou) {
    if (!arxeio.sha256) continue;
    const prwto_id = prwto_ana_hash.get(arxeio.sha256);
    if (prwto_id === undefined) {
      prwto_ana_hash.set(arxeio.sha256, arxeio.id);
      arxeio.diplotypo_tou = null;
    } else {
      arxeio.diplotypo_tou = prwto_id;
    }
  }

  // 6. Ταξινόμηση και αποθήκευση ευρετηρίου
  nea_lista_eurethriou.sort((a, b) => a.diadromi.localeCompare(b.diadromi));

  const grapse_eurethrio = await apothiki.grapse_keimeno(
    diadromi_eurethriou,
    `${JSON.stringify(nea_lista_eurethriou, null, 2)}\n`
  );

  if (!grapse_eurethrio.ok) {
    katagrafi?.sfalma('Αποτυχία εγγραφής ευρετηρίου αρχείων', {
      kodikos_mathimatos,
    });
    return grapse_eurethrio;
  }

  katagrafi?.pliroforia('Ο συγχρονισμός μαθήματος ολοκληρώθηκε επιτυχώς', {
    kodikos_mathimatos,
    nea: nea_arxeia_metritis,
    allagmena: allagmena_arxeia_metritis,
    ametavlita: ametavlita_arxeia_metritis,
    paraleifthikan: paraleifthikan_metritis,
    synolo: nea_lista_eurethriou.length,
  });

  return ok({
    nea_arxeia: nea_arxeia_metritis,
    allagmena_arxeia: allagmena_arxeia_metritis,
    ametavlita_arxeia: ametavlita_arxeia_metritis,
    paraleifthikan: paraleifthikan_metritis,
    synolo_arxeion: nea_lista_eurethriou.length,
  });
}

async function apothikefse_proodo(
  apothiki: ParametroiSygxronismou['apothiki'],
  diadromi_eurethriou: string,
  nea_lista: Arxeio[],
  palia_arxeia: Map<string, Arxeio>
): Promise<void> {
  const prosorini_lista = [...nea_lista];
  const epeksergasmena = new Set(nea_lista.map((a) => a.diadromi));

  // Προσθήκη όσων παλαιών δεν πρόλαβαν να επεξεργαστούν
  for (const [diadromi, arxeio] of palia_arxeia.entries()) {
    if (!epeksergasmena.has(diadromi)) {
      prosorini_lista.push(arxeio);
    }
  }

  prosorini_lista.sort((a, b) => a.diadromi.localeCompare(b.diadromi));
  await apothiki.grapse_keimeno(
    diadromi_eurethriou,
    `${JSON.stringify(prosorini_lista, null, 2)}\n`
  );
}
