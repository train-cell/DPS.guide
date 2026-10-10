/**
 * Apothiki syntheseon - types pou persoun sta synoro. H stasia einai merizomeni me tin
 * epifaneia (React context) kai tha katapontetai mesa sti MnimiApothiki (prototypio)
 * i sti CapacitorFilesystem (paragogi).
 */

/** Οι ρυθμίσεις της εφαρμογής, όπως τις βλέπει η οθόνη ρυθμίσεων. */
export interface Rytheseis {
  /** Διεύθυνση του eClass. */
  readonly baseUrl: string;
  /** Κωδικοί μαθημάτων που συγχρονίζονται. */
  readonly mathimataSynch: readonly string[];
  /** Όνομα μοντέλου AI, από ρύθμιση — όχι hardcoded. */
  readonly onomaMontelou: string;
  /** Αν έχει οριστεί κλειδί LLM· η τιμή του δεν φτάνει ποτέ στην οθόνη. */
  readonly exeiKleidiLlm: boolean;
  /** Θέση αποθήκευσης αρχείων στη συσκευή. */
  readonly onomasApothikefsis: string;
  /** Αν οι τοπικές ειδοποιήσεις είναι ενεργές. */
  readonly einaiEidopoieseis: boolean;
}

/** Η πρόοδος του χρήστη ανά μάθημα. */
export interface Proodhos {
  /** ids ενοτήτων που ο χρήστης έχει ολοκληρώσει. */
  readonly aristeiesEnotiton: readonly string[];
}

/** Θέση του αρχείου ρυθμίσεων, σύμφωνα με το layout §5.3. */
export const DIALOMI_RYTHMSEON = 'rythmiseis.json';

/** Θέση αρχείου προόδου για ένα μάθημα, σύμφωνα με το layout §5.3. */
export function dialomos_proodhou(kodikosMathimatos: string): string {
  return `${kodikosMathimatos}/proodhos.json`;
}