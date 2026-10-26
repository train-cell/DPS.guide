import type {
  ApotelesmaAnazitisis,
  EggrafoEurethriou,
  EurethrioKeimenou,
} from './typoi.js';

/** Παράμετρος κορεσμού συχνότητας όρου BM25 (k1). */
export const BM25_K1 = 1.2;

/** Παράμετρος κανονικοποίησης μήκους εγγράφου BM25 (b). */
export const BM25_B = 0.75;

/** Συντελεστής βαρύτητας για όρους που εμφανίζονται στον τίτλο. */
export const VAROS_TITLOU = 2.0;

/** Ελάχιστο μήκος όρου για αναζήτηση προθέματος (prefix search). */
export const ELAXISTO_MIKOS_PREFIX = 3;

/** Συντελεστής βαρύτητας για ταυτίσεις προθέματος έναντι πλήρους ταύτισης. */
export const VAROS_PREFIX_MATCH = 0.75;

/** Συντελεστής βαρύτητας για ταυτίσεις κοινής ρίζας (stemming). */
export const VAROS_RIZAS_MATCH = 0.85;

/**
 * Καθαρίζει και κανονικοποιεί κείμενο για ανθεκτική αναζήτηση.
 * Αφαιρεί ελληνικούς τόνους και διακριτικά, μετατρέπει σε πεζά,
 * εξισώνει το τελικό σίγμα 'ς' με 'σ' και αφαιρεί περιττά κενά.
 */
export function katharise_keimeno_anazitisis(keimeno: string): string {
  return keimeno
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .replace(/·/g, ' ')
    .trim();
}

/**
 * Εξάγει τη βασική ρίζα μίας ελληνικής λέξης αφαιρώντας κοινές κλιτικές καταλήξεις.
 */
export function pare_riza_lexis(oros: string): string {
  if (oros.length < 4) {
    return oros;
  }
  const riza = oros.replace(
    /(ματων|ισσα|ηδων|ματα|ων|ουσ|εισ|ησ|εσ|ασ|οσ|οι|ου|ιο|ια|α|η|ο|υ|ε|ι)$/,
    ''
  );
  return riza.length >= 3 ? riza : oros;
}

/**
 * Διαχωρίζει το κείμενο σε tokens (λέξεις/όρους) αφαιρώντας σημεία στίξης.
 */
export function tokenise_keimeno(keimeno: string): string[] {
  const katharo = katharise_keimeno_anazitisis(keimeno);
  if (katharo.length === 0) {
    return [];
  }
  return katharo
    .split(/[^\p{L}\p{N}]+/gu)
    .filter((token) => token.length > 0);
}

/**
 * Δημιουργεί ένα νέο, κενό ευρετήριο κειμένου.
 */
export function ftiaxe_eurethrio_keimenou(): EurethrioKeimenou {
  return {
    eggrafa: new Map(),
    antistrafoEurethrio: new Map(),
    mikosEggrafon: new Map(),
    synolikoMikos: 0,
  };
}

/**
 * Διαγράφει ένα έγγραφο από το ευρετήριο αν υπάρχει.
 * Επιστρέφει true αν διαγράφηκε, αλλιώς false.
 */
export function diagrapse_eggrafo_eurethriou(
  eurethrio: EurethrioKeimenou,
  eggrafoId: string
): boolean {
  if (!eurethrio.eggrafa.has(eggrafoId)) {
    return false;
  }

  const mikos = eurethrio.mikosEggrafon.get(eggrafoId) ?? 0;
  eurethrio.synolikoMikos = Math.max(0, eurethrio.synolikoMikos - mikos);
  eurethrio.mikosEggrafon.delete(eggrafoId);
  eurethrio.eggrafa.delete(eggrafoId);

  for (const [oros, docMap] of eurethrio.antistrafoEurethrio.entries()) {
    if (docMap.has(eggrafoId)) {
      docMap.delete(eggrafoId);
      if (docMap.size === 0) {
        eurethrio.antistrafoEurethrio.delete(oros);
      }
    }
  }

  return true;
}

/**
 * Προσθέτει ή ανανεώνει ένα έγγραφο στο ευρετήριο.
 * Υπολογίζει τα tokens τίτλου και περιεχομένου και ενημερώνει το ανεστραμμένο ευρετήριο.
 */
export function prosthese_eggrafo_eurethriou(
  eurethrio: EurethrioKeimenou,
  eggrafo: EggrafoEurethriou
): EurethrioKeimenou {
  if (eurethrio.eggrafa.has(eggrafo.id)) {
    diagrapse_eggrafo_eurethriou(eurethrio, eggrafo.id);
  }

  const tokensTitlou = eggrafo.titlos ? tokenise_keimeno(eggrafo.titlos) : [];
  const tokensKeimenou = tokenise_keimeno(eggrafo.keimeno);

  const syxnotitesOron = new Map<string, number>();

  for (const token of tokensKeimenou) {
    syxnotitesOron.set(token, (syxnotitesOron.get(token) ?? 0) + 1.0);
  }

  for (const token of tokensTitlou) {
    syxnotitesOron.set(token, (syxnotitesOron.get(token) ?? 0) + VAROS_TITLOU);
  }

  const mikos = Math.max(1, tokensKeimenou.length + tokensTitlou.length);

  eurethrio.eggrafa.set(eggrafo.id, eggrafo);
  eurethrio.mikosEggrafon.set(eggrafo.id, mikos);
  eurethrio.synolikoMikos += mikos;

  for (const [oros, tf] of syxnotitesOron.entries()) {
    let docMap = eurethrio.antistrafoEurethrio.get(oros);
    if (!docMap) {
      docMap = new Map<string, number>();
      eurethrio.antistrafoEurethrio.set(oros, docMap);
    }
    docMap.set(eggrafo.id, tf);
  }

  return eurethrio;
}

/**
 * Υπολογίζει την τιμή IDF (Inverse Document Frequency) με τη μορφή Lucene BM25.
 */
export function ypologise_idf_bm25(arithmosEggrafon: number, eggrafaMeTonOro: number): number {
  if (arithmosEggrafon <= 0 || eggrafaMeTonOro <= 0) {
    return 0;
  }
  return Math.log(1 + (arithmosEggrafon - eggrafaMeTonOro + 0.5) / (eggrafaMeTonOro + 0.5));
}

/**
 * Υπολογίζει το BM25 score για έναν όρο σε ένα συγκεκριμένο έγγραφο.
 */
export function ypologise_oro_bm25(
  tf: number,
  mikosEggrafou: number,
  mesoMikosEggrafon: number,
  idf: number
): number {
  if (tf <= 0 || idf <= 0) {
    return 0;
  }
  const kanonikoMikos = mesoMikosEggrafon > 0 ? mikosEggrafou / mesoMikosEggrafon : 1.0;
  const arithmitis = tf * (BM25_K1 + 1);
  const paronomastis = tf + BM25_K1 * (1 - BM25_B + BM25_B * kanonikoMikos);
  return idf * (arithmitis / paronomastis);
}

interface EggrafoVathmologiaEsoteriki {
  score: number;
  tairiasmenoiOroi: Set<string>;
}

/**
 * Εκτελεί τοπική αναζήτηση πλήρους κειμένου στο ευρετήριο.
 * Χρησιμοποιεί κατάταξη BM25-lite, υποστήριξη τόνων και προθεμάτων,
 * και επιστρέφει αποτελέσματα ταξινομημένα κατά συνάφεια.
 */
export function anazitise_keimeno(
  eurethrio: EurethrioKeimenou,
  erwtima: string,
  orio = 10
): ApotelesmaAnazitisis[] {
  if (orio <= 0) {
    return [];
  }

  const queryTokens = tokenise_keimeno(erwtima);
  if (queryTokens.length === 0 || eurethrio.eggrafa.size === 0) {
    return [];
  }

  const arithmosEggrafon = eurethrio.eggrafa.size;
  const mesoMikos = Math.max(1, eurethrio.synolikoMikos / arithmosEggrafon);
  const monadikoiQueryTokens = Array.from(new Set(queryTokens));
  const pinakasVathmon = new Map<string, EggrafoVathmologiaEsoteriki>();

  function pare_i_ftiaxe_esoteriko(id: string): EggrafoVathmologiaEsoteriki {
    let stoixeio = pinakasVathmon.get(id);
    if (!stoixeio) {
      stoixeio = { score: 0, tairiasmenoiOroi: new Set<string>() };
      pinakasVathmon.set(id, stoixeio);
    }
    return stoixeio;
  }

  for (const q of monadikoiQueryTokens) {
    const qRiza = pare_riza_lexis(q);
    const docMapExact = eurethrio.antistrafoEurethrio.get(q);
    const docsTairiasmenaApoExact = new Set<string>();

    if (docMapExact && docMapExact.size > 0) {
      const idf = ypologise_idf_bm25(arithmosEggrafon, docMapExact.size);
      for (const [eggrafoId, tf] of docMapExact.entries()) {
        const mikosEggrafou = eurethrio.mikosEggrafon.get(eggrafoId) ?? mesoMikos;
        const vathmos = ypologise_oro_bm25(tf, mikosEggrafou, mesoMikos, idf);
        const st = pare_i_ftiaxe_esoteriko(eggrafoId);
        st.score += vathmos;
        st.tairiasmenoiOroi.add(q);
        docsTairiasmenaApoExact.add(eggrafoId);
      }
    }

    // Έλεγχος ρίζας και προθέματος αν το query token έχει αρκετό μήκος
    if (q.length >= ELAXISTO_MIKOS_PREFIX || qRiza.length >= ELAXISTO_MIKOS_PREFIX) {
      for (const [oros, docMapOrou] of eurethrio.antistrafoEurethrio.entries()) {
        if (oros === q) {
          continue;
        }

        const orosRiza = pare_riza_lexis(oros);
        let syntelestis = 0;

        if (orosRiza === qRiza && qRiza.length >= ELAXISTO_MIKOS_PREFIX) {
          syntelestis = VAROS_RIZAS_MATCH;
        } else if (q.length >= ELAXISTO_MIKOS_PREFIX && oros.startsWith(q)) {
          syntelestis = VAROS_PREFIX_MATCH;
        } else if (qRiza.length >= ELAXISTO_MIKOS_PREFIX && oros.startsWith(qRiza)) {
          syntelestis = 0.65;
        }

        if (syntelestis > 0) {
          const idfTerm = ypologise_idf_bm25(arithmosEggrafon, docMapOrou.size);
          for (const [eggrafoId, tf] of docMapOrou.entries()) {
            const telikosSyntelestis = docsTairiasmenaApoExact.has(eggrafoId)
              ? syntelestis * 0.4
              : syntelestis;
            const mikosEggrafou = eurethrio.mikosEggrafon.get(eggrafoId) ?? mesoMikos;
            const vathmos =
              ypologise_oro_bm25(tf, mikosEggrafou, mesoMikos, idfTerm) * telikosSyntelestis;
            const st = pare_i_ftiaxe_esoteriko(eggrafoId);
            st.score += vathmos;
            st.tairiasmenoiOroi.add(oros);
          }
        }
      }
    }
  }

  const apotelesmata: ApotelesmaAnazitisis[] = [];

  for (const [eggrafoId, dedomena] of pinakasVathmon.entries()) {
    if (dedomena.score <= 0) {
      continue;
    }
    const eggrafo = eurethrio.eggrafa.get(eggrafoId);
    if (!eggrafo) {
      continue;
    }

    apotelesmata.push({
      eggrafoId,
      vathmologia: Math.round(dedomena.score * 10000) / 10000,
      eggrafo,
      tairiasmenoiOroi: Array.from(dedomena.tairiasmenoiOroi).sort(),
    });
  }

  // Ταξινόμηση κατά φθίνουσα βαθμολογία με ντετερμινιστικό tie-breaking στο id
  apotelesmata.sort((a, b) => {
    if (b.vathmologia !== a.vathmologia) {
      return b.vathmologia - a.vathmologia;
    }
    return a.eggrafoId.localeCompare(b.eggrafoId);
  });

  return apotelesmata.slice(0, orio);
}
