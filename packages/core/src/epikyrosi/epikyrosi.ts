import type { Apotelesma } from '../contracts/apotelesma.js';
import type {
  Parapompi,
  Perigramma,
  Pigi,
  Tmima,
  XartisMathimatos,
} from '../contracts/montela.js';
import { PerigrammaSchema, XartisMathimatosSchema } from '../contracts/montela.js';
import { apotyxia, ok } from '../helpers.js';
import { ANOXI_EPIKALYPSIS_SELIDON } from '../statheres.js';

/** Υποχρεωτικές ενότητες οδηγού (§7.1 P3): αρκεί ο τίτλος να περιέχει το κλειδί. */
const YPOXREOTIKES_ENOTITES_ODIGOU = [
  'Στόχοι',
  'ELI5',
  'Θεωρία',
  'Λυμένο παράδειγμα',
  'Παγίδες',
  'Συνδέσεις',
  'Αυτοέλεγχος',
] as const;

/** Μορφή παραπομπής `[[arxeio_id:σελίδα]]` (§7.1 P3). */
const PATTERN_PARAPOMPIS = /\[\[([^:[\]]+):(\d+)\]\]/g;

/** Επικυρωμένο περίγραμμα με τις επισκευές και τις προειδοποιήσεις τους. */
export interface EpikyromenoPerigramma {
  perigramma: Perigramma;
  proeidopoiiseis: string[];
}

/** Επικυρωμένος χάρτης μαθήματος. */
export interface EpikyromenosXartis {
  xartis: XartisMathimatos;
}

/** Επικυρωμένος οδηγός: οι παραπομπές του σε σειρά εμφάνισης. */
export interface EpikyromenosOdigos {
  parapompes: Parapompi[];
}

/**
 * Επικυρώνει και επισκευάζει ένα περίγραμμα αρχείου.
 *
 * Επισκευές (με προειδοποίηση): clamp εκτός ορίων, ταξινόμηση, συγχώνευση
 * επικαλύψεων μεγαλύτερων από `ANOXI_EPIKALYPSIS_SELIDON`. Σφάλμα σε άκυρο
 * σχήμα, μη έγκυρο πλήθος σελίδων και ανεστραμμένα εύρη.
 */
export function epikyrose_perigramma(
  raw: unknown,
  arithmos_selidon: number
): Apotelesma<EpikyromenoPerigramma> {
  if (!Number.isInteger(arithmos_selidon) || arithmos_selidon <= 0) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το πλήθος σελίδων πρέπει να είναι θετικός ακέραιος.');
  }
  const parsed = PerigrammaSchema.safeParse(raw);
  if (!parsed.success) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Το περίγραμμα δεν έχει έγκυρο σχήμα.');
  }

  const proeidopoiiseis: string[] = [];
  const diorthomena: Tmima[] = [];
  for (const tmima of parsed.data.tmimata) {
    const apo = Math.max(1, Math.min(tmima.selides.apo, arithmos_selidon));
    const eos = Math.max(1, Math.min(tmima.selides.eos, arithmos_selidon));
    if (apo !== tmima.selides.apo || eos !== tmima.selides.eos) {
      proeidopoiiseis.push(
        `Clamp εύρους «${tmima.titlos}» [${tmima.selides.apo}, ${tmima.selides.eos}] σε [${apo}, ${eos}].`
      );
    }
    if (apo > eos) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Ανεστραμμένο εύρος «${tmima.titlos}» [${apo}, ${eos}].`
      );
    }
    diorthomena.push({ ...tmima, selides: { apo, eos } });
  }

  diorthomena.sort((a, b) => a.selides.apo - b.selides.apo || a.selides.eos - b.selides.eos);

  const synenomena: Tmima[] = [];
  for (const tmima of diorthomena) {
    const teleutaio = synenomena[synenomena.length - 1];
    if (teleutaio === undefined) {
      synenomena.push(tmima);
      continue;
    }
    const epikalypsi = teleutaio.selides.eos - tmima.selides.apo + 1;
    if (epikalypsi > ANOXI_EPIKALYPSIS_SELIDON) {
      const enomena_ennoies = [...new Set([...teleutaio.ennoies, ...tmima.ennoies])].sort();
      const enomena_proap = [...new Set([...teleutaio.proapaitoumena, ...tmima.proapaitoumena])].sort();
      teleutaio.selides = {
        apo: teleutaio.selides.apo,
        eos: Math.max(teleutaio.selides.eos, tmima.selides.eos),
      };
      teleutaio.ennoies = enomena_ennoies;
      teleutaio.proapaitoumena = enomena_proap;
      proeidopoiiseis.push(
        `Συγχώνευση «${teleutaio.titlos}» με «${tmima.titlos}» (επικάλυψη ${epikalypsi} σελίδων).`
      );
    } else {
      synenomena.push(tmima);
    }
  }

  return ok({
    perigramma: { ...parsed.data, tmimata: synenomena },
    proeidopoiiseis,
  });
}

/**
 * Επικυρώνει έναν χάρτη μαθήματος έναντι των περιγραμμάτων του.
 *
 * Έλεγχοι: έγκυρο σχήμα, μοναδικά ids, οι πηγές δείχνουν γνωστά αρχεία με
 * έγκυρα εύρη, τα προαπαιτούμενα δείχνουν υπάρχουσες ενότητες. Χωρίς επισκευές.
 */
export function epikyrose_xarti(
  raw: unknown,
  perigrammata: Perigramma[]
): Apotelesma<EpikyromenosXartis> {
  const parsed = XartisMathimatosSchema.safeParse(raw);
  if (!parsed.success) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Ο χάρτης δεν έχει έγκυρο σχήμα.');
  }

  const gnwsta_arxeia = new Set(perigrammata.map((p) => p.arxeio_id));
  const ids = new Set<string>();
  for (const enotita of parsed.data.enotites) {
    if (ids.has(enotita.id)) {
      return apotyxia('MI_EGKYRO_SXIMA', `Διπλότυπο id ενότητας «${enotita.id}».`);
    }
    ids.add(enotita.id);
  }

  for (const enotita of parsed.data.enotites) {
    for (const pigi of enotita.piges) {
      if (!gnwsta_arxeia.has(pigi.arxeio_id)) {
        return apotyxia('DEN_VRETHIKE', `Άγνωστο αρχείο πηγής «${pigi.arxeio_id}».`);
      }
      if (!Number.isInteger(pigi.apo) || !Number.isInteger(pigi.eos) || pigi.apo < 1 || pigi.eos < pigi.apo) {
        return apotyxia('MI_EGKYRO_SXIMA', `Μη έγκυρο εύρος πηγής [${pigi.apo}, ${pigi.eos}].`);
      }
    }
    for (const proap of enotita.proapaitoumenes) {
      if (!ids.has(proap.enotita_id)) {
        return apotyxia('DEN_VRETHIKE', `Άγνωστο προαπαιτούμενο «${proap.enotita_id}».`);
      }
    }
  }

  return ok({ xartis: parsed.data });
}

/**
 * Επικυρώνει έναν οδηγό μελέτης.
 *
 * Έλεγχοι: παρουσία και των 7 υποχρεωτικών ενοτήτων (§7.1 P3) και ότι κάθε
 * παραπομπή `[[arxeio_id:σελίδα]]` βρίσκεται εντός των επιτρεπόμενων πηγών.
 */
export function epikyrose_odigo(
  markdown: unknown,
  epitrepomenes: Pigi[]
): Apotelesma<EpikyromenosOdigos> {
  if (typeof markdown !== 'string') {
    return apotyxia('MI_EGKYRO_SXIMA', 'Ο οδηγός πρέπει να είναι κείμενο Markdown.');
  }

  const grammikes = markdown.split('\n');
  const kefalides = grammikes
    .filter((g) => g.trimStart().startsWith('#'))
    .map((g) => g.replace(/^#+\s*/, ''));
  const leipei = YPOXREOTIKES_ENOTITES_ODIGOU.filter(
    (enotita) => !kefalides.some((k) => k.includes(enotita))
  );
  if (leipei.length > 0) {
    return apotyxia('MI_EGKYRO_SXIMA', `Λείπουν ενότητες οδηγού: ${leipei.join(', ')}.`);
  }

  const parapompes: Parapompi[] = [];
  for (const match of markdown.matchAll(PATTERN_PARAPOMPIS)) {
    const arxeio_id = match[1] ?? '';
    const selida = Number.parseInt(match[2] ?? '', 10);
    const entos = epitrepomenes.some(
      (p) => p.arxeio_id === arxeio_id && p.apo <= selida && selida <= p.eos
    );
    if (!entos) {
      return apotyxia('DEN_VRETHIKE', `Παραπομπή εκτός πηγών [[${arxeio_id}:${selida}]].`);
    }
    parapompes.push({ arxeio_id, selida });
  }

  return ok({ parapompes });
}
