import type { Apotelesma } from '../contracts/apotelesma.js';
import type {
  Enotita,
  Perigramma,
  XartisMathimatos,
} from '../contracts/montela.js';
import { apotyxia, ok } from '../helpers.js';

// Όρια αναζήτησης κύκλων (κανόνας 10: σταθερές στην κορυφή του αρχείου)
const MEGISTOS_ARITHMOS_KYKLON = 500;
const MEGISTA_VIOMATA_ANAZITISIS = 5_000_000;

export type IsxysAkmi = 'isxyri' | 'asthenis';

/** Ακμή προαπαιτούμενης → εξαρτώμενης ενότητας. */
export interface AkmiGrafou {
  apo: string;
  pros: string;
  isxys: IsxysAkmi;
}

/** Τμήμα περιγράμματος που δεν καλύπτεται από πηγές του χάρτη. */
export interface AkalyptoTmima {
  arxeio_id: string;
  titlos: string;
  apo: number;
  eos: number;
}

export interface KalypsiGrafou {
  akalypta_tmimata: AkalyptoTmima[];
}

/** Κύκλος: ακολουθία ids και οι ακμές του (συμπεριλαμβανομένης της κλειστής). */
interface Kiklos {
  ids: string[];
  akmes: AkmiGrafou[];
}

interface Grafima {
  seira: Map<string, number>;
  akmes: Map<string, AkmiGrafou>;
  geitones: Map<string, AkmiGrafou[]>;
}

type TermatismosAnazitisis = 'oloklirothike' | 'orio_kyklon' | 'orio_vimaton';

interface ApotelesmaAnazitisis {
  kykloi: Kiklos[];
  terminatismos: TermatismosAnazitisis;
}

interface DiadromiSelidon {
  apo: number;
  eos: number;
}

function kleidi_akmis(apo: string, pros: string): string {
  return `${apo}->${pros}`;
}

/** Εσωτερική κληρονομιά: όλοι οι κόμβοι του γράφου έχουν καταχώριση γειτόνων. */
function geitonesTou(grafima: Grafima, v: string): AkmiGrafou[] {
  return grafima.geitones.get(v) ?? [];
}

/** Χάρτης γειτόνων (εξερχόμενες ακμές) για όλους τους κόμβους, ταξινομημένος κατά id. */
function ftiaxe_geitones(
  akmes: Map<string, AkmiGrafou>,
  ids: string[]
): Map<string, AkmiGrafou[]> {
  const exerxomenes: Record<string, AkmiGrafou[]> = {};
  for (const akmi of akmes.values()) {
    const lista = exerxomenes[akmi.apo] ?? [];
    lista.push(akmi);
    exerxomenes[akmi.apo] = lista;
  }

  const geitones = new Map<string, AkmiGrafou[]>();
  for (const id of ids) {
    geitones.set(id, exerxomenes[id] ?? []);
  }
  for (const lista of geitones.values()) {
    lista.sort((a, b) => (a.pros < b.pros ? -1 : 1));
  }
  return geitones;
}

/**
 * Χτίζει τον εσωτερικό γράφο από ενότητες.
 * Αποτυγχάνει με MI_EGKYRO_SXIMA σε διπλό id και με DEN_VRETHIKE
 * σε αναφορά προς ανύπαρκτη ενότητα.
 */
function kane_grafima(enotites: Enotita[]): Apotelesma<Grafima> {
  const seira = new Map<string, number>();
  for (const enotita of enotites) {
    if (seira.has(enotita.id)) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Διπλή εγγραφή ενότητας με id «${enotita.id}»`
      );
    }
    seira.set(enotita.id, enotita.seira);
  }

  const akmes = new Map<string, AkmiGrafou>();
  for (const enotita of enotites) {
    for (const proapaitoumeno of enotita.proapaitoumenes) {
      if (!seira.has(proapaitoumeno.enotita_id)) {
        return apotyxia(
          'DEN_VRETHIKE',
          `Η ενότητα «${enotita.id}» αναφέρει ανύπαρκτη προαπαιτούμενη «${proapaitoumeno.enotita_id}»`
        );
      }
      const kleidi = kleidi_akmis(proapaitoumeno.enotita_id, enotita.id);
      const yparxousa = akmes.get(kleidi);
      if (yparxousa === undefined) {
        akmes.set(kleidi, {
          apo: proapaitoumeno.enotita_id,
          pros: enotita.id,
          isxys: proapaitoumeno.isxys,
        });
      } else if (yparxousa.isxys === 'asthenis' && proapaitoumeno.isxys === 'isxyri') {
        yparxousa.isxys = 'isxyri';
      }
    }
  }

  const ids = [...seira.keys()];
  return ok({ seira, akmes, geitones: ftiaxe_geitones(akmes, ids) });
}

/**
 * Τοπολογική ταξινόμηση (Kahn) με σταθερή ισοβαθμία: πρώτα `seira`, μετά `id`.
 * Επιστρέφει MI_EGKYRO_SXIMA όταν ο γράφος περιέχει κύκλο.
 */
export function topologiki_taxinomisi(enotites: Enotita[]): Apotelesma<string[]> {
  const grafimaRes = kane_grafima(enotites);
  if (!grafimaRes.ok) {
    return grafimaRes;
  }
  const { seira, akmes } = grafimaRes.timi;

  const taxinomisi: string[] = [];
  const enapomeinontes = new Map<string, number>();
  for (const [id, seiraTimi] of seira) {
    enapomeinontes.set(id, seiraTimi);
  }

  while (enapomeinontes.size > 0) {
    const vathmoi = new Map<string, number>();
    for (const akmi of akmes.values()) {
      if (!enapomeinontes.has(akmi.apo) || !enapomeinontes.has(akmi.pros)) {
        continue;
      }
      vathmoi.set(akmi.pros, (vathmoi.get(akmi.pros) ?? 0) + 1);
    }

    let epilegmeno: string | undefined;
    let seiraEpilegmenou = 0;
    for (const [id, seiraTimi] of enapomeinontes) {
      if ((vathmoi.get(id) ?? 0) !== 0) {
        continue;
      }
      if (
        epilegmeno === undefined ||
        seiraTimi < seiraEpilegmenou ||
        (seiraTimi === seiraEpilegmenou && id < epilegmeno)
      ) {
        epilegmeno = id;
        seiraEpilegmenou = seiraTimi;
      }
    }

    if (epilegmeno === undefined) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        'Ο γράφος περιέχει κύκλο· η τοπολογική ταξινόμηση είναι αδύνατη'
      );
    }
    enapomeinontes.delete(epilegmeno);
    taxinomisi.push(epilegmeno);
  }

  return ok(taxinomisi);
}

/**
 * Αφαιρεί επαναληπτικά κόμβους με μηδενική είσοδο ή έξοδο.
 * Όσοι μείνουν συμμετέχουν υποχρεωτικά σε κύκλο.
 */
function kyreose_kryo(grafima: Grafima): string[] {
  const apomeinontes = new Set(grafima.seira.keys());

  for (;;) {
    const exodos = new Map<string, number>();
    const eisodoi = new Map<string, number>();
    for (const akmi of grafima.akmes.values()) {
      if (!apomeinontes.has(akmi.apo) || !apomeinontes.has(akmi.pros)) {
        continue;
      }
      exodos.set(akmi.apo, (exodos.get(akmi.apo) ?? 0) + 1);
      eisodoi.set(akmi.pros, (eisodoi.get(akmi.pros) ?? 0) + 1);
    }

    const prosAfairesi: string[] = [];
    for (const id of apomeinontes) {
      if ((exodos.get(id) ?? 0) === 0 || (eisodoi.get(id) ?? 0) === 0) {
        prosAfairesi.push(id);
      }
    }
    if (prosAfairesi.length === 0) {
      return [...apomeinontes].sort();
    }
    for (const id of prosAfairesi) {
      apomeinontes.delete(id);
    }
  }
}

/**
 * Αναζητά κύκλους μέσα στον πυρήνα (κύκλων) με DFS από τον μικρότερο κόμβο.
 * Κάθε κύκλος αναφέρεται μία φορά, ξεκινώντας από τον μικρότερο του κόμβο.
 * Το `proypologismos` μετρά βήματα και μεταφέρεται μεταξύ επαναλήψεων επισκευής.
 */
function anazitisi_kyklon(
  grafima: Grafima,
  proypologismos: { vimata: number }
): ApotelesmaAnazitisis {
  const kores = kyreose_kryo(grafima);
  const kykloi: Kiklos[] = [];
  let eksantlithike = false;

  const dfsApo = (arxi: string, epitrepomenoi: Set<string>): Kiklos | null => {
    const diadromiIds: string[] = [arxi];
    const diadromiAkmon: AkmiGrafou[] = [];
    const episkepmena = new Set<string>([arxi]);

    const apo = (v: string): boolean => {
      for (const akmi of geitonesTou(grafima, v)) {
        proypologismos.vimata += 1;
        if (proypologismos.vimata > MEGISTA_VIOMATA_ANAZITISIS) {
          eksantlithike = true;
          return false;
        }
        if (akmi.pros === arxi) {
          diadromiAkmon.push(akmi);
          return true;
        }
        if (epitrepomenoi.has(akmi.pros) && !episkepmena.has(akmi.pros)) {
          episkepmena.add(akmi.pros);
          diadromiIds.push(akmi.pros);
          diadromiAkmon.push(akmi);
          if (apo(akmi.pros)) {
            return true;
          }
          diadromiIds.pop();
          diadromiAkmon.pop();
          episkepmena.delete(akmi.pros);
        }
      }
      return false;
    };

    return apo(arxi) ? { ids: diadromiIds, akmes: diadromiAkmon } : null;
  };

  for (const [i, arxi] of kores.entries()) {
    const epitrepomenoi = new Set(kores.slice(i + 1));
    const kiklos = dfsApo(arxi, epitrepomenoi);
    if (eksantlithike) {
      return { kykloi, terminatismos: 'orio_vimaton' };
    }
    if (kiklos !== null) {
      kykloi.push(kiklos);
      if (kykloi.length >= MEGISTOS_ARITHMOS_KYKLON) {
        return { kykloi, terminatismos: 'orio_kyklon' };
      }
    }
  }

  return { kykloi, terminatismos: 'oloklirothike' };
}

/**
 * Βρίσκει όλους τους κύκλους του γράφου προαπαιτούμενων.
 * Κάθε κύκλος επιστρέφεται ως λίστα ids με σειρά πορείας, ξεκινώντας
 * από τον μικρότερο κόμβο. Κενή λίστα = απολύτως ακυκλικό γράφος.
 */
export function vres_kyklous(enotites: Enotita[]): Apotelesma<string[][]> {
  const grafimaRes = kane_grafima(enotites);
  if (!grafimaRes.ok) {
    return grafimaRes;
  }
  const anazitisi = anazitisi_kyklon(grafimaRes.timi, { vimata: 0 });
  if (anazitisi.terminatismos === 'orio_vimaton') {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Η αναζήτηση κύκλων ξεπέρασε το όριο βημάτων'
    );
  }
  if (anazitisi.terminatismos === 'orio_kyklon') {
    return apotyxia(
      'MI_EGKYRO_SXIMA',
      'Ο γράφος περιέχει πάρα πολλούς κύκλους'
    );
  }
  return ok(anazitisi.kykloi.map((kiklos) => kiklos.ids));
}

function mikroteri_akmi(a: AkmiGrafou, b: AkmiGrafou): boolean {
  if (a.apo !== b.apo) {
    return a.apo < b.apo;
  }
  return a.pros < b.pros;
}

/**
 * Επιλέγει την ακμή προς αφαίρεση: πρώτα τη λεξικογραφικά μικρότερη
 * ασθενή (asthenis) ακμή του κύκλου· αλλιώς τη λεξικογραφικά μικρότερη ακμή.
 */
function epilekse_akmi_gia_afairesi(
  akmes: [AkmiGrafou, ...AkmiGrafou[]]
): AkmiGrafou {
  const astheneis = akmes.filter((akmi) => akmi.isxys === 'asthenis');
  const protimomenes: [AkmiGrafou, ...AkmiGrafou[]] =
    astheneis.length > 0
      ? (astheneis as [AkmiGrafou, ...AkmiGrafou[]])
      : akmes;

  let mikroteri = protimomenes[0];
  for (const akmi of protimomenes) {
    if (mikroteri_akmi(akmi, mikroteri)) {
      mikroteri = akmi;
    }
  }
  return mikroteri;
}

function afairesi_akmis(grafima: Grafima, akmi: AkmiGrafou): void {
  grafima.akmes.delete(kleidi_akmis(akmi.apo, akmi.pros));
  grafima.geitones = ftiaxe_geitones(grafima.akmes, [...grafima.seira.keys()]);
}

/**
 * Επισκευάζει τους κύκλους αφαιρώντας ακμές μέχρι ο γράφος να γίνει ακυκλικός.
 * Αφαιρεί πρώτα ασθενή ακμή, αλλιώς τη λεξικογραφικά μικρότερη.
 * Επιστρέφει τις αφαιρεθείσες ακμές με τη σειρά αφαίρεσης.
 */
export function episkevi_kyklon(
  enotites: Enotita[]
): Apotelesma<{ afairemenes_akmes: AkmiGrafou[] }> {
  const grafimaRes = kane_grafima(enotites);
  if (!grafimaRes.ok) {
    return grafimaRes;
  }
  const grafima = grafimaRes.timi;

  const afairemenes: AkmiGrafou[] = [];
  const proypologismos = { vimata: 0 };
  for (;;) {
    const anazitisi = anazitisi_kyklon(grafima, proypologismos);
    if (anazitisi.terminatismos !== 'oloklirothike') {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        'Η επισκευή κύκλων ξεπέρασε τα όρια αναζήτησης'
      );
    }
    const protos = anazitisi.kykloi[0];
    if (protos === undefined) {
      return ok({ afairemenes_akmes: afairemenes });
    }
    // Ο κύκλος από την αναζήτηση περιέχει πάντα τουλάχιστον μία ακμή.
    const akmesKiklou = protos.akmes as [AkmiGrafou, ...AkmiGrafou[]];
    const akmi = epilekse_akmi_gia_afairesi(akmesKiklou);
    afairesi_akmis(grafima, akmi);
    afairemenes.push(akmi);
  }
}

/** Ενώνει συμπλεκόμενες ή κολλητές διαδρομές σελίδων. */
function enose_diadromes(diadromes: DiadromiSelidon[]): DiadromiSelidon[] {
  const enomenes: DiadromiSelidon[] = [];
  for (const diadromi of diadromes) {
    const teleutaia = enomenes[enomenes.length - 1];
    if (teleutaia !== undefined && diadromi.apo <= teleutaia.eos + 1) {
      if (diadromi.eos > teleutaia.eos) {
        teleutaia.eos = diadromi.eos;
      }
    } else {
      enomenes.push({ apo: diadromi.apo, eos: diadromi.eos });
    }
  }
  return enomenes;
}

/**
 * Ελέγχει αν κάθε τμήμα των περιγραμμάτων καλύπτεται πλήρως από πηγές
 * (piges) του χάρτη. Επιστρέφει τα μη καλυπτόμενα τμήματα, με σειρά
 * περιγράμματος και τμήματος.
 */
export function elegxos_kalypsis(
  perigrammata: Perigramma[],
  xartis: XartisMathimatos
): Apotelesma<KalypsiGrafou> {
  const pigesAnaArxeio = new Map<string, DiadromiSelidon[]>();
  for (const enotita of xartis.enotites) {
    for (const pigi of enotita.piges) {
      const lista = pigesAnaArxeio.get(pigi.arxeio_id) ?? [];
      lista.push({ apo: pigi.apo, eos: pigi.eos });
      pigesAnaArxeio.set(pigi.arxeio_id, lista);
    }
  }
  for (const lista of pigesAnaArxeio.values()) {
    lista.sort((a, b) => (a.apo !== b.apo ? a.apo - b.apo : a.eos - b.eos));
  }

  const akalypta: AkalyptoTmima[] = [];
  for (const perigramma of perigrammata) {
    const diadromes = enose_diadromes(
      pigesAnaArxeio.get(perigramma.arxeio_id) ?? []
    );
    for (const tmima of perigramma.tmimata) {
      const kalyptomeno = diadromes.some(
        (diadromi) =>
          diadromi.apo <= tmima.selides.apo && tmima.selides.eos <= diadromi.eos
      );
      if (!kalyptomeno) {
        akalypta.push({
          arxeio_id: perigramma.arxeio_id,
          titlos: tmima.titlos,
          apo: tmima.selides.apo,
          eos: tmima.selides.eos,
        });
      }
    }
  }

  return ok({ akalypta_tmimata: akalypta });
}
