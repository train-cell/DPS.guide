import type { Apotelesma, ApothikiPyli, Mathima } from '@dps/core';
import { MathimaSchema, apotyxia } from '@dps/core';

/** Σχετική διαδρομή του καταλόγου μαθημάτων (§5.3). */
export const DIADROMI_MATHIMATON = 'mathimata.json';

/** Περιορισμός: το `unknown` πρέπει να είναι πίνακας, χωρίς `any`. */
function einai_pinakas(timi: unknown): timi is unknown[] {
  return Array.isArray(timi);
}

/**
 * Διαβάζει το `mathimata.json` μέσω του port αποθήκευσης και επικυρώνει κάθε
 * στοιχείο με το παγωμένο σχήμα του core.
 *
 * Άθλιο ή άγνωστο περιεχόμενο → `MI_EGKYRO_SXIMA`, ποτέ κενή λίστα «χωρίς μαθήματα».
 */
export async function fere_mathimata_apo_ryza(
  apothiki: ApothikiPyli
): Promise<Apotelesma<Mathima[]>> {
  const gram = await apothiki.diavase_keimeno(DIADROMI_MATHIMATON);
  if (!gram.ok) {
    return gram;
  }
  let dedomena: unknown;
  try {
    dedomena = JSON.parse(gram.timi);
  } catch {
    return apotyxia('MI_EGKYRO_SXIMA', `Το αρχείο ${DIADROMI_MATHIMATON} δεν είναι έγκυρο JSON`);
  }
  if (!einai_pinakas(dedomena)) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το αρχείο ${DIADROMI_MATHIMATON} δεν περιέχει λίστα μαθημάτων`);
  }
  const mathimata: Mathima[] = [];
  for (const [thesi, stoixeio] of dedomena.entries()) {
    const checked = MathimaSchema.safeParse(stoixeio);
    if (!checked.success) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Μη έγκυρο μάθημα στη θέση ${thesi} του ${DIADROMI_MATHIMATON}`,
        checked.error.issues
      );
    }
    mathimata.push(checked.data);
  }
  return { ok: true, timi: mathimata };
}

/** Μόνο τα μαθήματα με `epilegmeno: true` — αυτά συγχρονίζονται από το CLI. */
export function epilegmena_mathimata(mathimata: readonly Mathima[]): Mathima[] {
  return mathimata.filter((mathima) => mathima.epilegmeno);
}
