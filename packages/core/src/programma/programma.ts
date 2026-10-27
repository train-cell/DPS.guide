import type { Apotelesma } from '../contracts/apotelesma.js';
import type { Enotita } from '../contracts/montela.js';
import { topologiki_taxinomisi } from '../grafos/grafos.js';
import { apotyxia, ok } from '../helpers.js';
import type { MeriImorominias } from '../imeres/index.js';
import { add_imeres, iso_apo_meri, parse_meri } from '../imeres/index.js';
import { POSOSTO_XORITIKOTITAS } from '../statheres.js';

/** Offsets επανάληψης από την πρώτη μελέτη (§9 L04: +1/+3/+7 ημέρες). */
const OFFSETS_EPANALIPSIS = [1, 3, 7];

/** Κόστος επανάληψης ως κλάσμα της εκτίμησης (υπόθεση εκκίνησης). */
const KLASMA_EPANALIPSIS = 0.5;

/** Μάθημα με τις ενότητές του και την ημερομηνία εξέτασης (null = άγνωστη). */
export interface MathimaProgrammatos {
  kodikos_mathimatos: string;
  enotites: Enotita[];
  imerominia_exetasis: string | null;
}

/** Λεπτά ανά ημέρα εβδομάδας (δείκτης 0 = Δευτέρα) + overrides ανά ημερομηνία. */
export interface Diathesimotita {
  ana_imera_evdomadas: number[];
  overrides: Record<string, number>;
}

/** Καταγραφή μελέτης: ολοκληρωμένη ή μερική. */
export interface Checkin {
  enotita_id: string;
  imerominia: string;
  pragmatika_lepta: number;
  oloklirothike: boolean;
}

/** Είσοδος scheduler: όλα ημερολόγια Europe/Athens σε `YYYY-MM-DD`. */
export interface EisodosProgrammatos {
  mathimata: MathimaProgrammatos[];
  diathesimotita: Diathesimotita;
  checkins: Checkin[];
  simera: string;
  arxi_exetastikis: string | null;
}

/** Είδος εργασίας ημέρας: νέα ύλη ή επανάληψη. */
export type EidosErgasias = 'nea_yli' | 'epanalipsi';

/** Μία εργασία ημέρας (επιτρέπεται τμηματική, με `lepta` μέρος της ενότητας). */
export interface ErgasiaImaras {
  eidos: EidosErgasias;
  kodikos_mathimatos: string;
  enotita_id: string;
  titlos: string;
  lepta: number;
}

/** Ημέρα προγράμματος με τις εργασίες της σε σειρά εκτέλεσης. */
export interface MeraProgrammatos {
  imerominia: string;
  ergasies: ErgasiaImaras[];
}

/** Υποψήφια ενότητα προς αφαίρεση (πρόταση επιβίωσης, δεν εφαρμόζεται). */
export interface YpopshfiaEnotita {
  enotita_id: string;
  titlos: string;
  apodosi_exetasis: number | null;
  lepta: number;
}

/** Πρόταση επιβίωσης ανά μάθημα, ταξινομημένη από τη χαμηλότερη απόδοση. */
export interface ProtasiEpiviosis {
  kodikos_mathimatos: string;
  ypopshfies: YpopshfiaEnotita[];
}

/** Πρόγραμμα: ημέρες, slack ανά μάθημα και προτάσεις επιβίωσης. */
export interface Programma {
  meres: MeraProgrammatos[];
  slack_ana_mathima: Record<string, number>;
  protasi_epiviosis: ProtasiEpiviosis[];
}

export type ProgrammaMeletis = Programma;

/** Δείκτης ημέρας εβδομάδας με 0 = Δευτέρα (Europe/Athens ημερολόγιο). */
function deiktis_evdomadas(meri: MeriImorominias): number {
  const millis = Date.UTC(meri.etos, meri.minas - 1, meri.imera);
  return (new Date(millis).getUTCDay() + 6) % 7;
}

/** Εσωτερική κατάσταση ενότητας: υπόλοιπο λεπτών και τελευταία μελέτη. */
interface KatastasiEnotitas {
  kodikos_mathimatos: string;
  enotita: Enotita;
  deadline: string;
  /** Επικυρωμένη εκτίμηση λεπτών (ποτέ null εδώ· ελέγχεται στην είσοδο). */
  ektimisi: number;
  ypoloipo: number;
  teleutaia_meleti: string | null;
}

/** Μάθημα με επιλυμένο deadline και ενότητες σε τοπολογική σειρά. */
interface GrammiMathimatos {
  kodikos_mathimatos: string;
  deadline: string;
  lista: KatastasiEnotitas[];
  deiktis: number;
}

/** Εκκρεμής επανάληψη με αναφορά στην ενότητα (χωρίς lookups). */
interface EkremisEpanlipsi {
  due: string;
  deadline: string;
  katastasi: KatastasiEnotitas;
  ypoloipo: number;
}

/**
 * Χτίζει ημερήσιο πρόγραμμα μελέτης (pure, deterministic).
 *
 * Κανόνες (§9 L04): χωρητικότητα ημέρας = λεπτά × 0.8· reviews +1/+3/+7 που
 * χρεώνονται πρώτα· νέα ύλη με EDF ανάμεσα στα μαθήματα και τοπολογική σειρά
 * μέσα στο μάθημα· όλη η νέα ύλη πριν την `arxi_exetastikis`· κενά εξετάσεων
 * σε επανάληψη· καμία μέρα πάνω από τη χωρητικότητα· slack < 0 → πρόταση
 * επιβίωσης (χωρίς εφαρμογή). Οι ημερομηνίες είναι ημερολογιακές ημέρες
 * Europe/Athens, απρόσβλητες από αλλαγές ώρας.
 */
export function ftiaxe_programma(eisodos: EisodosProgrammatos): Apotelesma<Programma> {
  const meri_simera = parse_meri(eisodos.simera);
  if (meri_simera === null) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία «σήμερα».');
  }
  let arxi: string | null = null;
  if (eisodos.arxi_exetastikis !== null) {
    if (parse_meri(eisodos.arxi_exetastikis) === null) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη αρχή εξεταστικής.');
    }
    arxi = eisodos.arxi_exetastikis;
  }

  const template = eisodos.diathesimotita.ana_imera_evdomadas;
  if (template.length !== 7 || template.some((l) => !Number.isFinite(l) || l < 0)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαθεσιμότητα θέλει 7 μη αρνητικές τιμές.');
  }
  const evdomada = template as [number, number, number, number, number, number, number];
  for (const [imerominia, lepta] of Object.entries(eisodos.diathesimotita.overrides)) {
    if (parse_meri(imerominia) === null || !Number.isFinite(lepta) || lepta < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρο override «${imerominia}».`);
    }
  }

  if (eisodos.mathimata.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαιτείται τουλάχιστον ένα μάθημα.');
  }

  const monades = new Map<string, KatastasiEnotitas>();
  const grammes: GrammiMathimatos[] = [];
  for (const mathima of eisodos.mathimata) {
    let deadline = mathima.imerominia_exetasis;
    if (deadline !== null && parse_meri(deadline) === null) {
      return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρη εξέταση μαθήματος «${mathima.kodikos_mathimatos}».`);
    }
    if (deadline === null) {
      deadline = arxi;
    }
    if (deadline === null) {
      return apotyxia('MI_EGKYRO_SXIMA', `Χωρίς deadline το μάθημα «${mathima.kodikos_mathimatos}».`);
    }
    const teliko_deadline: string = deadline;

    const taxinomisi = topologiki_taxinomisi(mathima.enotites);
    if (!taxinomisi.ok) {
      return taxinomisi;
    }
    const seira_ids = taxinomisi.timi;
    const kata_id = new Map(mathima.enotites.map((e) => [e.id, e] as const));
    const lista: KatastasiEnotitas[] = [];
    for (const id of seira_ids) {
      // Η ταξινόμηση επιστρέφει μετάθεση των ids εισόδου, οπότε η εύρεση πετυχαίνει πάντα.
      const enotita = kata_id.get(id) as Enotita;
      const lepta = enotita.lepta_ektimisi;
      if (lepta === null || !Number.isFinite(lepta) || lepta < 0) {
        return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρα λεπτά ενότητας «${id}».`);
      }
      if (monades.has(id)) {
        return apotyxia('MI_EGKYRO_SXIMA', `Διπλότυπο id ενότητας «${id}» σε μαθήματα.`);
      }
      const katastasi: KatastasiEnotitas = {
        kodikos_mathimatos: mathima.kodikos_mathimatos,
        enotita,
        deadline: teliko_deadline,
        ektimisi: lepta,
        ypoloipo: lepta,
        teleutaia_meleti: null,
      };
      monades.set(id, katastasi);
      lista.push(katastasi);
    }
    grammes.push({ kodikos_mathimatos: mathima.kodikos_mathimatos, deadline: teliko_deadline, lista, deiktis: 0 });
  }
  grammes.sort((a, b) =>
    a.deadline === b.deadline
      ? a.kodikos_mathimatos.localeCompare(b.kodikos_mathimatos)
      : a.deadline.localeCompare(b.deadline)
  );

  for (const checkin of eisodos.checkins) {
    const katastasi = monades.get(checkin.enotita_id);
    if (katastasi === undefined) {
      return apotyxia('DEN_VRETHIKE', `Άγνωστη ενότητα check-in «${checkin.enotita_id}».`);
    }
    const meri_checkin = parse_meri(checkin.imerominia);
    if (meri_checkin === null) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία check-in.');
    }
    if (checkin.imerominia > eisodos.simera) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Το check-in δεν μπορεί να είναι στο μέλλον.');
    }
    if (!Number.isFinite(checkin.pragmatika_lepta) || checkin.pragmatika_lepta < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρα λεπτά check-in.');
    }
    if (checkin.oloklirothike) {
      katastasi.ypoloipo = 0;
    } else {
      katastasi.ypoloipo = Math.max(0, katastasi.ypoloipo - checkin.pragmatika_lepta);
    }
    if (katastasi.teleutaia_meleti === null || katastasi.teleutaia_meleti < checkin.imerominia) {
      katastasi.teleutaia_meleti = checkin.imerominia;
    }
  }

  const xorikotita = (meri: MeriImorominias): number => {
    const iso = iso_apo_meri(meri);
    const override = eisodos.diathesimotita.overrides[iso];
    // Ο δείκτης είναι 0–6 εκ κατασκευής και η 7άδα επικυρωμένη.
    const lepta_evdomadas = evdomada[deiktis_evdomadas(meri)] as number;
    const lepta = override === undefined ? lepta_evdomadas : override;
    return lepta * POSOSTO_XORITIKOTITAS;
  };

  const ekremeis: EkremisEpanlipsi[] = [];
  const vale_epanalipseis = (katastasi: KatastasiEnotitas, vasi: MeriImorominias): void => {
    if (katastasi.ektimisi <= 0) {
      return;
    }
    for (const offset of OFFSETS_EPANALIPSIS) {
      const due = add_imeres(vasi, offset);
      if (due >= eisodos.simera && due <= katastasi.deadline) {
        ekremeis.push({ due, deadline: katastasi.deadline, katastasi, ypoloipo: katastasi.ektimisi * KLASMA_EPANALIPSIS });
      }
    }
  };
  for (const katastasi of monades.values()) {
    if (katastasi.ypoloipo > 0 || katastasi.teleutaia_meleti === null) {
      continue;
    }
    // Η ημερομηνία check-in ελέγχθηκε κατά την είσοδο, οπότε είναι πάντα έγκυρη.
    const vasi = parse_meri(katastasi.teleutaia_meleti);
    if (vasi === null) {
      throw new Error(`Akyri imerominia teleutaias meletis: ${katastasi.teleutaia_meleti}`);
    }
    vale_epanalipseis(katastasi, vasi);
  }

  const megisto_deadline = grammes.map((g) => g.deadline).sort().at(-1) as string;
  const meres: MeraProgrammatos[] = [];
  let meri = meri_simera;
  let imera = eisodos.simera;
  while (imera <= megisto_deadline) {
    let ypoloipo_meras = xorikotita(meri);
    const ergasies: ErgasiaImaras[] = [];

    const ofeilomenes = ekremeis
      .filter((e) => e.ypoloipo > 0 && e.due <= imera)
      .sort((a, b) =>
        a.due === b.due
          ? a.deadline === b.deadline
            ? a.katastasi.enotita.id.localeCompare(b.katastasi.enotita.id)
            : a.deadline.localeCompare(b.deadline)
          : a.due.localeCompare(b.due)
      );
    for (const epan of ofeilomenes) {
      if (ypoloipo_meras <= 0) {
        break;
      }
      const topothetisi = Math.min(epan.ypoloipo, ypoloipo_meras);
      ergasies.push({
        eidos: 'epanalipsi',
        kodikos_mathimatos: epan.katastasi.kodikos_mathimatos,
        enotita_id: epan.katastasi.enotita.id,
        titlos: epan.katastasi.enotita.titlos,
        lepta: topothetisi,
      });
      epan.ypoloipo -= topothetisi;
      ypoloipo_meras -= topothetisi;
    }

    const nea_epitrepetai = arxi === null || imera < arxi;
    if (nea_epitrepetai && ypoloipo_meras > 0) {
      let proodos = true;
      while (ypoloipo_meras > 0 && proodos) {
        proodos = false;
        for (const grammi of grammes) {
          if (ypoloipo_meras <= 0 || imera > grammi.deadline) {
            continue;
          }
          while (grammi.deiktis < grammi.lista.length && (grammi.lista[grammi.deiktis] as KatastasiEnotitas).ypoloipo <= 0) {
            grammi.deiktis += 1;
          }
          const trexousa = grammi.lista[grammi.deiktis];
          if (trexousa === undefined) {
            continue;
          }
          const topothetisi = Math.min(trexousa.ypoloipo, ypoloipo_meras);
          ergasies.push({
            eidos: 'nea_yli',
            kodikos_mathimatos: grammi.kodikos_mathimatos,
            enotita_id: trexousa.enotita.id,
            titlos: trexousa.enotita.titlos,
            lepta: topothetisi,
          });
          trexousa.ypoloipo -= topothetisi;
          ypoloipo_meras -= topothetisi;
          proodos = true;
          if (trexousa.ypoloipo <= 0) {
            grammi.deiktis += 1;
            vale_epanalipseis(trexousa, meri);
          }
        }
      }
    }

    if (ypoloipo_meras > 0) {
      const epomeni = grammes.find((g) => imera <= g.deadline);
      if (epomeni !== undefined) {
        // Επανάληψη μόνο για ενότητες με υλικό που έχουν ήδη μελετηθεί πρώτη φορά
        // και έχουν εκκρεμές υπόλοιπο· η εργασία χρεώνεται στο υπόλοιπο, όχι ως
        // φανταστική επανάληψη άμελετης ενότητας.
        const me_yliko = epomeni.lista.filter(
          (k) => k.ektimisi > 0 && k.ypoloipo > 0 && k.teleutaia_meleti !== null
        );
        if (me_yliko.length > 0) {
          const me_apodosi = [...me_yliko].sort((a, b) => {
            const aa = a.enotita.apodosi_exetasis ?? -1;
            const bb = b.enotita.apodosi_exetasis ?? -1;
            return bb === aa ? a.enotita.id.localeCompare(b.enotita.id) : bb - aa;
          });
          const prota = me_apodosi[0] as KatastasiEnotitas;
          const topothetisi = Math.min(prota.ypoloipo, ypoloipo_meras);
          ergasies.push({
            eidos: 'epanalipsi',
            kodikos_mathimatos: epomeni.kodikos_mathimatos,
            enotita_id: prota.enotita.id,
            titlos: prota.enotita.titlos,
            lepta: topothetisi,
          });
          prota.ypoloipo -= topothetisi;
        }
      }
    }

    if (ergasies.length > 0) {
      meres.push({ imerominia: imera, ergasies });
    }
    const epomenoMeri = parse_meri(add_imeres(meri, 1));
    if (epomenoMeri === null) {
      throw new Error(`Apotyxia ypologismou epomenis imeras apo: ${imera}`);
    }
    meri = epomenoMeri;
    imera = iso_apo_meri(meri);
  }

  const slack_ana_mathima = new Map<string, number>();
  const protasi_epiviosis: ProtasiEpiviosis[] = [];
  for (const grammi of grammes) {
    let diathesima = 0;
    let meri_iter = meri_simera;
    let iter = eisodos.simera;
    while (iter <= grammi.deadline) {
      diathesima += xorikotita(meri_iter);
      const epomenoMeriIter = parse_meri(add_imeres(meri_iter, 1));
      if (epomenoMeriIter === null) {
        throw new Error(`Apotyxia ypologismou epomenis imeras apo: ${iter}`);
      }
      meri_iter = epomenoMeriIter;
      iter = iso_apo_meri(meri_iter);
    }
    let apaitoumena = 0;
    const ypopshfies: YpopshfiaEnotita[] = [];
    for (const katastasi of grammi.lista) {
      const arxiki = katastasi.ektimisi;
      const checkins = eisodos.checkins.filter((c) => c.enotita_id === katastasi.enotita.id);
      const olokliro = checkins.some((c) => c.oloklirothike);
      const merika = checkins.filter((c) => !c.oloklirothike).reduce((s, c) => s + c.pragmatika_lepta, 0);
      const ypoloipo_arxiko = olokliro ? 0 : Math.max(0, arxiki - merika);
      apaitoumena += ypoloipo_arxiko * (1 + OFFSETS_EPANALIPSIS.length * KLASMA_EPANALIPSIS);
      if (ypoloipo_arxiko > 0) {
        ypopshfies.push({
          enotita_id: katastasi.enotita.id,
          titlos: katastasi.enotita.titlos,
          apodosi_exetasis: katastasi.enotita.apodosi_exetasis,
          lepta: ypoloipo_arxiko,
        });
      }
    }
    const slack = diathesima - apaitoumena;
    slack_ana_mathima.set(grammi.kodikos_mathimatos, slack);
    if (slack < 0) {
      ypopshfies.sort((a, b) => {
        const aa = a.apodosi_exetasis ?? -1;
        const bb = b.apodosi_exetasis ?? -1;
        if (aa !== bb) {
          return aa - bb;
        }
        if (a.lepta !== b.lepta) {
          return b.lepta - a.lepta;
        }
        return a.enotita_id.localeCompare(b.enotita_id);
      });
      protasi_epiviosis.push({ kodikos_mathimatos: grammi.kodikos_mathimatos, ypopshfies });
    }
  }
  protasi_epiviosis.sort((a, b) => a.kodikos_mathimatos.localeCompare(b.kodikos_mathimatos));

  return ok({
    meres,
    slack_ana_mathima: Object.fromEntries(slack_ana_mathima),
    protasi_epiviosis,
  });
}
