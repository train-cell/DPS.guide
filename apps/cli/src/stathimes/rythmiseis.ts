import type { ApothikiPyli } from '@dps/core';

/** Σχετική διαδρομή των ρυθμίσεων στη ρίζα (§5.3, μη-μυστικές). */
export const DIADROMI_RYTHMISEON = 'rythmiseis.json';

/**
 * Εξάγει το μοντέλο από ένα ανεπιτήδευτο αντικείμενο ρυθμίσεων.
 *
 * Ποτέ δεν επιστρέφει default μοντέλο: αν δεν υπάρχει ή δεν είναι μη κενό κείμενο,
 * επιστρέφει `null` ώστε ο καλούντας να αποφασίσει (μοντέλο ορίζεται στις ρυθμίσεις
 * ή με σημαία — ποτέ hardcoded, §7.2).
 */
export function epikyrose_montelo(rythmiseis: unknown): string | null {
  if (typeof rythmiseis !== 'object' || rythmiseis === null || !('montelo' in rythmiseis)) {
    return null;
  }
  const montelo: unknown = (rythmiseis as { montelo: unknown }).montelo;
  if (typeof montelo !== 'string') {
    return null;
  }
  const katharos = montelo.trim();
  return katharos.length > 0 ? katharos : null;
}

/**
 * Διαβάζει το μοντέλο από το `<riza>/rythmiseis.json`.
 *
 * Λείπον ή άθλιο αρχείο → `null` (χωρίς σφάλμα): η απόφαση αν το `null` είναι
 * ασθένεια ή όχι ανήκει στον καλούντα που ξέρει αν η εντολή χρειάζεται LLM.
 */
export async function fere_montelo_apo_ryza(apothiki: ApothikiPyli): Promise<string | null> {
  const gram = await apothiki.diavase_keimeno(DIADROMI_RYTHMISEON);
  if (!gram.ok) {
    return null;
  }
  let dedomena: unknown;
  try {
    dedomena = JSON.parse(gram.timi);
  } catch {
    return null;
  }
  return epikyrose_montelo(dedomena);
}

/**
 * Εξάγει το base_url του eClass από το αντικείμενο ρυθμίσεων.
 */
export function epikyrose_base_url(rythmiseis: unknown): string | null {
  if (typeof rythmiseis !== 'object' || rythmiseis === null || !('base_url' in rythmiseis)) {
    return null;
  }
  const base_url: unknown = (rythmiseis as { base_url: unknown }).base_url;
  if (typeof base_url !== 'string') {
    return null;
  }
  const katharos = base_url.trim();
  return katharos.length > 0 ? katharos : null;
}

/**
 * Διαβάζει το base_url από το `<riza>/rythmiseis.json`.
 */
export async function fere_base_url_apo_ryza(apothiki: ApothikiPyli): Promise<string | null> {
  const gram = await apothiki.diavase_keimeno(DIADROMI_RYTHMISEON);
  if (!gram.ok) {
    return null;
  }
  let dedomena: unknown;
  try {
    dedomena = JSON.parse(gram.timi);
  } catch {
    return null;
  }
  return epikyrose_base_url(dedomena);
}
