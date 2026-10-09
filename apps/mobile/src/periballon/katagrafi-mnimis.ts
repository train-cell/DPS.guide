import type { KatagrafiPyli } from '@dps/core';

/** Τα τρία επιτρεπτά επίπεδα μιας εγγραφής καταγραφής. */
export type EpipedoKatagrafis = 'pliroforia' | 'proeidopoiisi' | 'sfalma';

/** Μια αμετάβλητη εγγραφή που κρατιέται μόνο στη μνήμη της εφαρμογής. */
export interface EggrafiKatagrafis {
  readonly epipedo: EpipedoKatagrafis;
  readonly minima: string;
  readonly dedomena?: Record<string, unknown>;
}

/** Καταγραφή που φυλακιώνει τις εγγραφές σε πίνακα μνήμης και δεν γράφει ποτέ σε console. */
export class KatagrafiMnimis implements KatagrafiPyli {
  private eggrafes: EggrafiKatagrafis[] = [];

  /** Καταγράφει ενημερωτικό μήνυμα με τη σειρά κλήσης. */
  pliroforia(minima: string, dedomena?: Record<string, unknown>): void {
    this.prosthiki('pliroforia', minima, dedomena);
  }

  /** Καταγράφει προειδοποίηση με τη σειρά κλήσης. */
  proeidopoiisi(minima: string, dedomena?: Record<string, unknown>): void {
    this.prosthiki('proeidopoiisi', minima, dedomena);
  }

  /** Καταγράφει σφάλμα με τη σειρά κλήσης. */
  sfalma(minima: string, dedomena?: Record<string, unknown>): void {
    this.prosthiki('sfalma', minima, dedomena);
  }

  /** Επιστρέφει αντίγραφο των εγγραφών ώστε η αλλοίωσή του να μην πειράζει την εσωτερική κατάσταση. */
  pare_eggrafes(): readonly EggrafiKatagrafis[] {
    return [...this.eggrafes];
  }

  /** Σβήνει όλες τις εγγραφές που έχουν συσσωρευτεί στη μνήμη. */
  katharise(): void {
    this.eggrafes = [];
  }

  private prosthiki(
    epipedo: EpipedoKatagrafis,
    minima: string,
    dedomena?: Record<string, unknown>
  ): void {
    if (dedomena === undefined) {
      this.eggrafes.push({ epipedo, minima });
      return;
    }
    this.eggrafes.push({ epipedo, minima, dedomena });
  }
}
