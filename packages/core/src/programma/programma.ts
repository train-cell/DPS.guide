import type { Apotelesma } from '../contracts/apotelesma.js';
import type { Enotita } from '../contracts/montela.js';
import { topologiki_taxinomisi } from '../grafos/grafos.js';
import { apotyxia, ok } from '../helpers.js';
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

const PATTERN_IMEROMINIAS = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLIS_ANA_IMERA = 86_400_000;

/** Μετατρέπει `YYYY-MM-DD` σε UTC millis ή null αν δεν είναι έγκυρη ημέρα. */
function parse_imerominia(imerominia: string): number | null {
  const match = PATTERN_IMEROMINIAS.exec(imerominia);
  if (match === null) {
    return null;
  }
  const etos = Number.parseInt(match[1] ?? '', 10);
  const minas = Number.parseInt(match[2] ?? '', 10);
  const imera = Number.parseInt(match[3] ?? '', 10);
  const millis = Date.UTC(etos, minas - 1, imera);
  const elegxos = new Date(millis);
  if (
    elegxos.getUTCFullYear() !== etos ||
    elegxos.getUTCMonth() !== minas - 1 ||
    elegxos.getUTCDate() !== imera
  ) {
    return null;
  }
  return millis;
}

/** Μορφοποιεί UTC millis σε `YYYY-MM-DD` (ημερολογιακό, απρόσβλητο από DST). */
function iso_apo_millis(millis: number): string {
  return new Date(millis).toISOString().slice(0, 10);
}

/** Προσθέτει ημέρες σε ημερομηνία (ημερολογιακά, όχι 24ωρα). */
function add_imeres(imerominia: string, imeres: number): string {
  const millis = parse_imerominia(imerominia) ?? 0;
  return iso_apo_millis(millis + imeres * MILLIS_ANA_IMERA);
}

/** Δείκτης ημέρας εβδομάδας με 0 = Δευτέρα (Europe/Athens ημερολόγιο). */
function deiktis_evdomadas(imerominia: string): number {
  const millis = parse_imerominia(imerominia) ?? 0;
  return (new Date(millis).getUTCDay() + 6) % 7;
}

interface KatastasiEnotitas {
  kleidi: string;
  kodikos_mathimatos: string;
  enotita: Enotita;
  deadline: string;
  ypoloipo: number;
}

interface EkremisEpanlipsi {
  due: string;
  deadline: string;
  kleidi: string;
  lepta: number;
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
  const simera_ms = parse_imerominia(eisodos.simera);
  if (simera_ms === null) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία «σήμερα».');
  }
  let arxi_ms: number | null = null;
  if (eisodos.arxi_exetastikis !== null) {
    arxi_ms = parse_imerominia(eisodos.arxi_exetastikis);
    if (arxi_ms === null) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη αρχή εξεταστικής.');
    }
  }

  const template = eisodos.diathesimotita.ana_imera_evdomadas;
  if (template.length !== 7 || template.some((l) => !Number.isFinite(l) || l < 0)) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Η διαθεσιμότητα θέλει 7 μη αρνητικές τιμές.');
  }
  for (const [imerominia, lepta] of Object.entries(eisodos.diathesimotita.overrides)) {
    if (parse_imerominia(imerominia) === null || !Number.isFinite(lepta) || lepta < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρο override «${imerominia}».`);
    }
  }

  if (eisodos.mathimata.length === 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Απαιτείται τουλάχιστον ένα μάθημα.');
  }

  const monades = new Map<string, KatastasiEnotitas>();
  const deadlines: string[] = [];
  for (const mathima of eisodos.mathimata) {
    let deadline = mathima.imerominia_exetasis;
    if (deadline !== null && parse_imerominia(deadline) === null) {
      return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρη εξέταση μαθήματος «${mathima.kodikos_mathimatos}».`);
    }
    if (deadline === null) {
      deadline = eisodos.arxi_exetastikis;
    }
    if (deadline === null) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Χωρίς deadline το μάθημα «${mathima.kodikos_mathimatos}».`
      );
    }
    deadlines.push(deadline);

    const taxinomisi = topologiki_taxinomisi(mathima.enotites);
    if (!taxinomisi.ok) {
      return taxinomisi;
    }
    const seira_ids = taxinomisi.timi;
    const seira_deikti = new Map(seira_ids.map((id, i) => [id, i]));
    const taksinomimenes = [...mathima.enotites].sort(
      (a, b) => (seira_deikti.get(a.id) ?? 0) - (seira_deikti.get(b.id) ?? 0)
    );
    for (const enotita of taksinomimenes) {
      if (monades.has(enotita.id)) {
        return apotyxia('MI_EGKYRO_SXIMA', `Διπλότυπο id ενότητας «${enotita.id}» σε μαθήματα.`);
      }
      const lepta = enotita.lepta_ektimisi;
      if (lepta === null || !Number.isFinite(lepta) || lepta < 0) {
        return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρα λεπτά ενότητας «${enotita.id}».`);
      }
      monades.set(enotita.id, {
        kleidi: enotita.id,
        kodikos_mathimatos: mathima.kodikos_mathimatos,
        enotita,
        deadline,
        ypoloipo: lepta,
      });
    }
  }

  for (const checkin of eisodos.checkins) {
    const katastasi = monades.get(checkin.enotita_id);
    if (katastasi === undefined) {
      return apotyxia('DEN_VRETHIKE', `Άγνωστη ενότητα check-in «${checkin.enotita_id}».`);
    }
    if (parse_imerominia(checkin.imerominia) === null) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρη ημερομηνία check-in.');
    }
    if (!Number.isFinite(checkin.pragmatika_lepta) || checkin.pragmatika_lepta < 0) {
      return apotyxia('MI_EGKYRO_SXIMA', 'Μη έγκυρα λεπτά check-in.');
    }
    if (checkin.oloklirothike) {
      katastasi.ypoloipo = 0;
    } else {
      katastasi.ypoloipo = Math.max(0, katastasi.ypoloipo - checkin.pragmatika_lepta);
    }
  }

  const xorikotita = (imerominia: string): number => {
    const override = eisodos.diathesimotita.overrides[imerominia];
    const lepta = override ?? template[deiktis_evdomadas(imerominia)] ?? 0;
    return lepta * POSOSTO_XORITIKOTITAS;
  };

  const ekremeis: EkremisEpanlipsi[] = [];
  const checkins_ana_enotita = new Map<string, string[]>();
  for (const checkin of eisodos.checkins) {
    const lista = checkins_ana_enotita.get(checkin.enotita_id) ?? [];
    lista.push(checkin.imerominia);
    checkins_ana_enotita.set(checkin.enotita_id, lista);
  }
  const vale_epanalipseis = (katastasi: KatastasiEnotitas, vasi: string): void => {
    const ektimisi = katastasi.enotita.lepta_ektimisi ?? 0;
    if (ektimisi <= 0) {
      return;
    }
    for (const offset of OFFSETS_EPANALIPSIS) {
      const due = add_imeres(vasi, offset);
      if (due >= eisodos.simera && due <= katastasi.deadline) {
        const lepta = ektimisi * KLASMA_EPANALIPSIS;
        ekremeis.push({ due, deadline: katastasi.deadline, kleidi: katastasi.kleidi, lepta, ypoloipo: lepta });
      }
    }
  };
  for (const katastasi of monades.values()) {
    if (katastasi.ypoloipo > 0) {
      continue;
    }
    const imerominies = checkins_ana_enotita.get(katastasi.kleidi) ?? [];
    if (imerominies.length === 0) {
      continue;
    }
    const teleutaia = [...imerominies].sort().at(-1) ?? eisodos.simera;
    vale_epanalipseis(katastasi, teleutaia);
  }

  const mathimata_me_seira = [...eisodos.mathimata].sort((a, b) =>
    a.imerominia_exetasis === b.imerominia_exetasis
      ? a.kodikos_mathimatos.localeCompare(b.kodikos_mathimatos)
      : (a.imerominia_exetasis ?? eisodos.arxi_exetastikis ?? '').localeCompare(
          b.imerominia_exetasis ?? eisodos.arxi_exetastikis ?? ''
        )
  );
  const deiktes = new Map<string, number>(mathimata_me_seira.map((m) => [m.kodikos_mathimatos, 0]));
  const taksi_ana_mathima = new Map<string, KatastasiEnotitas[]>();
  for (const mathima of mathimata_me_seira) {
    const taxinomisi = topologiki_taxinomisi(mathima.enotites);
    if (!taxinomisi.ok) {
      return taxinomisi;
    }
    const seira_deikti = new Map(taxinomisi.timi.map((id, i) => [id, i]));
    const lista = mathima.enotites
      .map((e) => monades.get(e.id))
      .filter((k): k is KatastasiEnotitas => k !== undefined)
      .sort((a, b) => (seira_deikti.get(a.kleidi) ?? 0) - (seira_deikti.get(b.kleidi) ?? 0));
    taksi_ana_mathima.set(mathima.kodikos_mathimatos, lista);
  }

  const megisto_deadline = [...deadlines].sort().at(-1) ?? eisodos.simera;
  const meres: MeraProgrammatos[] = [];
  let imera = eisodos.simera;
  while (imera <= megisto_deadline) {
    const cap = xorikotita(imera);
    let ypoloipo_meras = cap;
    const ergasies: ErgasiaImaras[] = [];

    const ofeilomenes = ekremeis
      .filter((e) => e.ypoloipo > 0 && e.due <= imera)
      .sort((a, b) =>
        a.due === b.due
          ? a.deadline === b.deadline
            ? a.kleidi.localeCompare(b.kleidi)
            : a.deadline.localeCompare(b.deadline)
          : a.due.localeCompare(b.due)
      );
    for (const epan of ofeilomenes) {
      if (ypoloipo_meras <= 0) {
        break;
      }
      const katastasi = monades.get(epan.kleidi);
      if (katastasi === undefined) {
        continue;
      }
      const topothetisi = Math.min(epan.ypoloipo, ypoloipo_meras);
      ergasies.push({
        eidos: 'epanalipsi',
        kodikos_mathimatos: katastasi.kodikos_mathimatos,
        enotita_id: epan.kleidi,
        titlos: katastasi.enotita.titlos,
        lepta: topothetisi,
      });
      epan.ypoloipo -= topothetisi;
      ypoloipo_meras -= topothetisi;
    }

    const nea_epitrepetai = arxi_ms === null || imera < (eisodos.arxi_exetastikis ?? '');
    if (nea_epitrepetai && ypoloipo_meras > 0) {
      let proodos = true;
      while (ypoloipo_meras > 0 && proodos) {
        proodos = false;
        for (const mathima of mathimata_me_seira) {
          if (ypoloipo_meras <= 0) {
            break;
          }
          const deadline = mathima.imerominia_exetasis ?? eisodos.arxi_exetastikis ?? '';
          if (imera > deadline) {
            continue;
          }
          const lista = taksi_ana_mathima.get(mathima.kodikos_mathimatos) ?? [];
          let deiktis = deiktes.get(mathima.kodikos_mathimatos) ?? 0;
          while (deiktis < lista.length && (lista[deiktis]?.ypoloipo ?? 0) <= 0) {
            deiktis += 1;
          }
          deiktes.set(mathima.kodikos_mathimatos, deiktis);
          const trexousa = lista[deiktis];
          if (trexousa === undefined) {
            continue;
          }
          const topothetisi = Math.min(trexousa.ypoloipo, ypoloipo_meras);
          ergasies.push({
            eidos: 'nea_yli',
            kodikos_mathimatos: mathima.kodikos_mathimatos,
            enotita_id: trexousa.kleidi,
            titlos: trexousa.enotita.titlos,
            lepta: topothetisi,
          });
          trexousa.ypoloipo -= topothetisi;
          ypoloipo_meras -= topothetisi;
          proodos = true;
          if (trexousa.ypoloipo <= 0) {
            deiktes.set(mathima.kodikos_mathimatos, deiktis + 1);
            vale_epanalipseis(trexousa, imera);
          }
        }
      }
    }

    if (ypoloipo_meras > 0) {
      const epomeno = mathimata_me_seira.find(
        (m) => imera <= (m.imerominia_exetasis ?? eisodos.arxi_exetastikis ?? '')
      );
      if (epomeno !== undefined) {
        const lista = taksi_ana_mathima.get(epomeno.kodikos_mathimatos) ?? [];
        const prota = [...lista].sort((a, b) => {
          const aa = a.enotita.apodosi_exetasis ?? -1;
          const bb = b.enotita.apodosi_exetasis ?? -1;
          return bb === aa ? a.kleidi.localeCompare(b.kleidi) : bb - aa;
        })[0];
        if (prota !== undefined) {
          ergasies.push({
            eidos: 'epanalipsi',
            kodikos_mathimatos: epomeno.kodikos_mathimatos,
            enotita_id: prota.kleidi,
            titlos: prota.enotita.titlos,
            lepta: ypoloipo_meras,
          });
          ypoloipo_meras = 0;
        }
      }
    }

    if (ergasies.length > 0) {
      meres.push({ imerominia: imera, ergasies });
    }
    imera = add_imeres(imera, 1);
  }

  const slack_ana_mathima: Record<string, number> = {};
  const protasi_epiviosis: ProtasiEpiviosis[] = [];
  for (const mathima of eisodos.mathimata) {
    const deadline = mathima.imerominia_exetasis ?? eisodos.arxi_exetastikis ?? '';
    let diathesima = 0;
    let imera_iter = eisodos.simera;
    while (imera_iter <= deadline) {
      diathesima += xorikotita(imera_iter);
      imera_iter = add_imeres(imera_iter, 1);
    }
    let apaitoumena = 0;
    const ypopshfies: YpopshfiaEnotita[] = [];
    for (const enotita of mathima.enotites) {
      const katastasi = monades.get(enotita.id);
      void katastasi;
      const arxiki = enotita.lepta_ektimisi ?? 0;
      const checkins = eisodos.checkins.filter((c) => c.enotita_id === enotita.id);
      const olokliro = checkins.some((c) => c.oloklirothike);
      const mereos = checkins.filter((c) => !c.oloklirothike).reduce((s, c) => s + c.pragmatika_lepta, 0);
      const ypoloipo_arxiko = olokliro ? 0 : Math.max(0, arxiki - mereos);
      apaitoumena += ypoloipo_arxiko * (1 + OFFSETS_EPANALIPSIS.length * KLASMA_EPANALIPSIS);
      if (ypoloipo_arxiko > 0) {
        ypopshfies.push({
          enotita_id: enotita.id,
          titlos: enotita.titlos,
          apodosi_exetasis: enotita.apodosi_exetasis,
          lepta: ypoloipo_arxiko,
        });
      }
    }
    const slack = diathesima - apaitoumena;
    slack_ana_mathima[mathima.kodikos_mathimatos] = slack;
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
      protasi_epiviosis.push({ kodikos_mathimatos: mathima.kodikos_mathimatos, ypopshfies });
    }
  }
  protasi_epiviosis.sort((a, b) => a.kodikos_mathimatos.localeCompare(b.kodikos_mathimatos));

  return ok({ meres, slack_ana_mathima, protasi_epiviosis });
}
