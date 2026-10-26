/**
 * Τύποι και συμβόλαια για την Τοπική Μηχανή Αναζήτησης Κειμένου (Full-Text Search).
 * 100% pure deterministic TypeScript (50/50 boundary).
 */

export interface EggrafoEurethriou {
  /** Μοναδικό αναγνωριστικό εγγράφου */
  readonly id: string;
  /** Προαιρετικός τίτλος εγγράφου (με αυξημένη βαρύτητα στην κατάταξη) */
  readonly titlos?: string;
  /** Κύριο περιεχόμενο/κείμενο του εγγράφου */
  readonly keimeno: string;
  /** Προαιρετικά πρόσθετα μεταδεδομένα */
  readonly metadedomena?: Readonly<Record<string, unknown>>;
}

export interface ApotelesmaAnazitisis {
  /** Αναγνωριστικό του εγγράφου που ταυτίστηκε */
  readonly eggrafoId: string;
  /** Βαθμολογία συνάφειας (TF-IDF / BM25 score) */
  readonly vathmologia: number;
  /** Το αρχικό έγγραφο */
  readonly eggrafo: EggrafoEurethriou;
  /** Όροι αναζήτησης που ταυτίστηκαν */
  readonly tairiasmenoiOroi: readonly string[];
}

/** Ψευδώνυμο τύπου για συμβατότητα με διάφορες ορθογραφίες. */
export type ApotelemsaAnazitisis = ApotelesmaAnazitisis;

export interface EurethrioKeimenou {
  /** Αποθηκευμένα έγγραφα ανά αναγνωριστικό */
  readonly eggrafa: Map<string, EggrafoEurethriou>;
  /** Ανεστραμμένο ευρετήριο: όρος -> (eggrafoId -> σταθμισμένη συχνότητα όρου tf) */
  readonly antistrafoEurethrio: Map<string, Map<string, number>>;
  /** Μήκος κάθε εγγράφου σε αριθμό tokens */
  readonly mikosEggrafon: Map<string, number>;
  /** Συνολικό άθροισμα λέξεων όλων των εγγράφων */
  synolikoMikos: number;
}
