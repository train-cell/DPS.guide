import type { ApothikiPyli } from '@dps/core';

/** Ποιος έγραψε ένα γράμμα στο ιστορικό της συνομιλίας. */
export type RologosImerrologiou = 'xristis' | 'tutor';

/** Ένα γράμμα της ιστορικής συνομιλίας, είτε ερώτημα είτε απάντηση. */
export interface GrammiImerrologiou {
  readonly rolos: RologosImerrologiou;
  readonly keimeno: string;
}

/** Διαδρομή του ιστορικού συνομιλίας μιας ενότητας στο layout §5.3. */
export function diadromi_synomilias(kodikos_mathimatos: string, enotita_id: string): string {
  return `${kodikos_mathimatos}/.spoudes/synomilies/${enotita_id}.jsonl`;
}

/**
 * Φορτώνει το ιστορικό της συνομιλίας από το JSONL του §5.3. Οι χαλασμένες γραμμές
 * παραλείπονται (ένα κατεστραμμένο γράμμα δεν σκοτώνει τη συνομιλία)· η απουσία
 * αρχείου σημαίνει simply άδειο ιστορικό.
 */
export async function fortose_synomilia_apo_apothiki(
  apothiki: ApothikiPyli,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<readonly GrammiImerrologiou[]> {
  const diavase = await apothiki.diavase_keimeno(
    diadromi_synomilias(kodikos_mathimatos, enotita_id)
  );
  if (!diavase.ok) {
    return [];
  }
  const grammes: GrammiImerrologiou[] = [];
  for (const grammi of diavase.timi.split(/\r?\n/)) {
    if (grammi.trim().length === 0) {
      continue;
    }
    try {
      const anagnose: unknown = JSON.parse(grammi);
      if (
        typeof anagnose === 'object' &&
        anagnose !== null &&
        'rolos' in anagnose &&
        'keimeno' in anagnose &&
        ((anagnose as GrammiImerrologiou).rolos === 'xristis' ||
          (anagnose as GrammiImerrologiou).rolos === 'tutor')
      ) {
        grammes.push(anagnose as GrammiImerrologiou);
      }
    } catch {
      continue;
    }
  }
  return grammes;
}
