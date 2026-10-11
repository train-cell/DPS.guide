import type { KatagrafiPyli } from '@dps/core';

/** Ετικέτες επιπέδων καταγραφής, σε σταθερή σειρά. */
const ETIKETES_EPIPEDON: Record<'pliroforia' | 'proeidopoiisi' | 'sfalma', string> = {
  pliroforia: 'ΠΛΗΡΟΦΟΡΙΑ',
  proeidopoiisi: 'ΠΡΟΕΙΔΟΠΟΙΗΣΗ',
  sfalma: 'ΣΦΑΛΜΑ',
};

/** Μήνυμα όταν τα δεδομένα δεν μπαίνουν σε JSON (κύκλος, BigInt, Error). */
const DEN_SERIIOPOIITHEKE = '[δεν σειριοποιήθηκε]';

/**
 * Μετατροπή των δεδομένων καταγραφής σε JSON χωρίς να πέσει.
 *
 * Τα δεδομένα προέρχονται από adapters και προβλήματα· δεν τα εμπιστευόμαστε για
 * μορφοποίηση (§3.11: καταγραφή χωρίς εκρήξεις).
 */
function serialize(dedomena: Record<string, unknown> | undefined): string | null {
  if (dedomena === undefined) {
    return null;
  }
  try {
    return JSON.stringify(dedomena);
  } catch {
    return DEN_SERIIOPOIITHEKE;
  }
}

/**
 * `KatagrafiPyli` που γράφει στο stderr.
 *
 * Στο stderr (όχι στο stdout) ώστε η έξοδος `--json` να παραμένει καθαρή, μία
 * εγγραφή. Καμία τιμή μυστικού δεν περνά από εδώ — οι προσαρμογές του pipeline
 * καταγράφουν μόνο κωδικούς κατάστασης και ονόματα μοντέλων.
 */
export class KonsoladaKatagrafi implements KatagrafiPyli {
  constructor(private readonly kathisteriki: (grammi: string) => void) {}

  private grapse(
    epipedo: 'pliroforia' | 'proeidopoiisi' | 'sfalma',
    minima: string,
    dedomena: Record<string, unknown> | undefined
  ): void {
    const episkeia = serialize(dedomena);
    this.kathisteriki(`[${ETIKETES_EPIPEDON[epipedo]}] ${episkeia === null ? minima : `${minima} ${episkeia}`}`);
  }

  pliroforia(minima: string, dedomena?: Record<string, unknown>): void {
    this.grapse('pliroforia', minima, dedomena);
  }

  proeidopoiisi(minima: string, dedomena?: Record<string, unknown>): void {
    this.grapse('proeidopoiisi', minima, dedomena);
  }

  sfalma(minima: string, dedomena?: Record<string, unknown>): void {
    this.grapse('sfalma', minima, dedomena);
  }
}
