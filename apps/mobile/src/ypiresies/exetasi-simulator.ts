/**
 * Μηχανή Προσομοίωσης Διαγωνίσματος (Mock Exam Simulator).
 *
 * Επιλέγει ερωτήσεις προτεραιοποιώντας θέματα υψηλής απόδοσης (high-yield)
 * και βαθμολογεί την επίδοση του φοιτητή με ανάλυση ανά έννοια.
 */

/**
 * Ερώτηση αυτοελέγχου (πηγή για τη δημιουργία της προσομοίωσης).
 */
export interface AutoelegchosErwtisi {
  readonly erwtisi: string;
  readonly apantisi: string;
  readonly ennoia: string;
  readonly enotita_id?: string | undefined;
  readonly epiloges?: readonly string[];
}

/**
 * Ερώτηση δοκιμαστικής εξέτασης με μοναδικό αριθμό/id και επιλογές πολλαπλής επιλογής.
 */
export interface ErwtisiExetasis {
  readonly id: number;
  readonly erwtisi: string;
  readonly apantisi: string;
  readonly ennoia: string;
  readonly enotita_id?: string | undefined;
  readonly epiloges: readonly string[];
  readonly apodosi_score: number;
}

/**
 * Δοκιμαστική εξέταση (Mock Exam).
 */
export interface DokimastikiExetasi {
  readonly kodikos_mathimatos: string;
  readonly erwtiseis: readonly ErwtisiExetasis[];
  readonly xronos_lepta: number;
  readonly dimiourgithike: string;
}

/**
 * Ανάλυση επίδοσης ανά έννοια.
 */
export interface AnalysiEnnoias {
  readonly synolo: number;
  readonly sostes: number;
  readonly pososto: number;
}

/**
 * Αναλυτική καταγραφή απάντησης ανά ερώτηση.
 */
export interface AnalytikiApantisi {
  readonly id: number;
  readonly erwtisi: string;
  readonly sosti_apantisi: string;
  readonly apantisi_xristi: string;
  readonly einai_sosto: boolean;
  readonly ennoia: string;
}

/**
 * Αποτέλεσμα βαθμολόγησης της δοκιμαστικής εξέτασης.
 */
export interface ApotelesmaExetasis {
  readonly teliko_skor: number; // 0-100
  readonly synolo_erwtiseon: number;
  readonly sostes_apantiseis: number;
  readonly lathos_apantiseis: number;
  readonly epitixia: boolean; // π.χ. skor >= 50
  readonly analysi_ana_ennoia: Readonly<Record<string, AnalysiEnnoias>>;
  readonly analytikes_apantiseis: readonly AnalytikiApantisi[];
}

/** Τυπικές εναλλακτικές επιλογές (distractors) όταν δεν επαρκούν οι πηγές. */
const TYPIKES_DISTRACTORS: readonly string[] = [
  'Όλα τα παραπάνω',
  'Κανένα από τα παραπάνω',
  'Ισχύει μόνο υπό ειδικές συνθήκες',
  'Δεν προκύπτει από τη θεωρία',
];

/**
 * Παράγει 4 επιλογές για μία ερώτηση πολλαπλής επιλογής.
 */
function paragogi_epilogon(
  sosti_apantisi: string,
  dothises_epiloges?: readonly string[],
  alles_apantiseis: readonly string[] = [],
  seed = 0
): readonly string[] {
  if (dothises_epiloges && dothises_epiloges.length >= 2) {
    if (!dothises_epiloges.includes(sosti_apantisi)) {
      return [sosti_apantisi, ...dothises_epiloges.slice(0, 3)];
    }
    return dothises_epiloges;
  }

  const epilogesSet = new Set<string>();
  epilogesSet.add(sosti_apantisi);

  // Προσθήκη απαντήσεων από άλλες ερωτήσεις
  for (const apantisi of alles_apantiseis) {
    if (apantisi.trim() !== '' && apantisi !== sosti_apantisi) {
      epilogesSet.add(apantisi);
      if (epilogesSet.size >= 4) break;
    }
  }

  // Αν υπολείπονται, προσθήκη τυπικών distractors
  for (const typiki of TYPIKES_DISTRACTORS) {
    if (epilogesSet.size >= 4) break;
    if (typiki !== sosti_apantisi) {
      epilogesSet.add(typiki);
    }
  }

  const pinakas = Array.from(epilogesSet);
  // Ντετερμινιστική αναδιάταξη με βάση το seed
  return pinakas.sort((a, b) => {
    const hashA = (a.length * 31 + seed) % 17;
    const hashB = (b.length * 31 + seed) % 17;
    return hashA - hashB || a.localeCompare(b);
  });
}

/**
 * Δημιουργεί μία δοκιμαστική εξέταση, προτεραιοποιώντας ερωτήσεις υψηλής απόδοσης.
 *
 * @param kodikos_mathimatos Κωδικός μαθήματος (π.χ. 'HY-100')
 * @param erwtiseis Διαθέσιμο σύνολο ερωτήσεων αυτοελέγχου
 * @param apodosi Χάρτης απόδοσης ενοτήτων/εννοιών (π.χ. από παλιά θέματα)
 * @param orio_erwtiseon Μέγιστος αριθμός ερωτήσεων εξέτασης (προεπιλογή: 5)
 */
export function ftiaxe_dokimastiki_exetasi(
  kodikos_mathimatos: string,
  erwtiseis: AutoelegchosErwtisi[],
  apodosi?: Record<string, number>,
  orio_erwtiseon = 5
): DokimastikiExetasi {
  const alles_apantiseis = erwtiseis.map((e) => e.apantisi);

  // Υπολογισμός σκορ απόδοσης για κάθε ερώτηση
  const erwtiseisMeVaros = erwtiseis.map((e, index) => {
    let score = 0;
    if (apodosi) {
      if (e.enotita_id && apodosi[e.enotita_id] !== undefined) {
        score = apodosi[e.enotita_id] ?? 0;
      } else if (apodosi[e.ennoia] !== undefined) {
        score = apodosi[e.ennoia] ?? 0;
      }
    }
    return { e, score, arxiki_thesi: index };
  });

  // Ταξινόμηση: υψηλότερη απόδοση πρώτα, σταθερότητα θέσης σε ισοβαθμία
  erwtiseisMeVaros.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.arxiki_thesi - b.arxiki_thesi;
  });

  const orio = Math.max(1, orio_erwtiseon);
  const epilegmenes = erwtiseisMeVaros.slice(0, orio);

  const telikesErwtiseis: ErwtisiExetasis[] = epilegmenes.map((item, index) => {
    const id = index + 1;
    const epiloges = paragogi_epilogon(
      item.e.apantisi,
      item.e.epiloges,
      alles_apantiseis,
      id
    );
    return {
      id,
      erwtisi: item.e.erwtisi,
      apantisi: item.e.apantisi,
      ennoia: item.e.ennoia,
      ...(item.e.enotita_id !== undefined ? { enotita_id: item.e.enotita_id } : {}),
      epiloges,
      apodosi_score: item.score,
    };
  });

  const xronos_lepta = Math.max(5, telikesErwtiseis.length * 2);

  return {
    kodikos_mathimatos,
    erwtiseis: telikesErwtiseis,
    xronos_lepta,
    dimiourgithike: new Date().toISOString(),
  };
}

/**
 * Κανονικοποιεί κείμενο για σύγκριση (πεζά, χωρίς περιττά κενά και χωρίς τόνους).
 */
function kanonikopoiisi_keimenou(keimeno: string): string {
  return keimeno
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Βαθμολογεί μία δοκιμαστική εξέταση συγκρίνοντας τις απαντήσεις του χρήστη.
 *
 * @param exetasi Η δοκιμαστική εξέταση
 * @param apantiseis Οι επιλεγμένες απαντήσεις (χάρτης question id -> επιλογή)
 */
export function vathmologise_exetasi(
  exetasi: DokimastikiExetasi,
  apantiseis: Record<number, string>
): ApotelesmaExetasis {
  const synolo = exetasi.erwtiseis.length;
  if (synolo === 0) {
    return {
      teliko_skor: 0,
      synolo_erwtiseon: 0,
      sostes_apantiseis: 0,
      lathos_apantiseis: 0,
      epitixia: false,
      analysi_ana_ennoia: {},
      analytikes_apantiseis: [],
    };
  }

  let sostes = 0;
  const analytikes: AnalytikiApantisi[] = [];
  const ennoiesStats = new Map<string, { synolo: number; sostes: number }>();

  for (const q of exetasi.erwtiseis) {
    const apantisiXristi = apantiseis[q.id]?.trim() ?? '';
    const einaiSosto =
      apantisiXristi !== '' &&
      kanonikopoiisi_keimenou(apantisiXristi) === kanonikopoiisi_keimenou(q.apantisi);


    if (einaiSosto) {
      sostes++;
    }

    const prev = ennoiesStats.get(q.ennoia) ?? { synolo: 0, sostes: 0 };
    ennoiesStats.set(q.ennoia, {
      synolo: prev.synolo + 1,
      sostes: prev.sostes + (einaiSosto ? 1 : 0),
    });

    analytikes.push({
      id: q.id,
      erwtisi: q.erwtisi,
      sosti_apantisi: q.apantisi,
      apantisi_xristi: apantisiXristi,
      einai_sosto: einaiSosto,
      ennoia: q.ennoia,
    });
  }

  const lathos = synolo - sostes;
  const teliko_skor = Math.round((sostes / synolo) * 100);
  const epitixia = teliko_skor >= 50;

  const analysi_ana_ennoia: Record<string, AnalysiEnnoias> = {};
  for (const [ennoia, stats] of ennoiesStats.entries()) {
    const pososto = stats.synolo > 0 ? Math.round((stats.sostes / stats.synolo) * 100) : 0;
    analysi_ana_ennoia[ennoia] = {
      synolo: stats.synolo,
      sostes: stats.sostes,
      pososto,
    };
  }

  return {
    teliko_skor,
    synolo_erwtiseon: synolo,
    sostes_apantiseis: sostes,
    lathos_apantiseis: lathos,
    epitixia,
    analysi_ana_ennoia,
    analytikes_apantiseis: analytikes,
  };
}
