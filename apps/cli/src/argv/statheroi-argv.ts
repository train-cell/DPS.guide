/** Σταθερές του αναλυτή argv και της βοήθειας του CLI. */

/** Ρίζα αποθήκευσης όταν δεν δίνεται `--riza` (§5.3: CLI = `./data/`). */
export const RIZA_PROEDROPIA = './data';

export const SEMA_RIZA = '--riza';
export const SEMA_MONTELO = '--montelo';
export const SEMA_JSON = '--json';
export const SEMA_VOITHEIA = '--help';
export const SEMA_VOITHEIA_MIKRI = '-h';

/** Τα ίδια ονόματα χωρίς το πρόθεμα `--` (τα token που δίνει ο χρήστης). */
export const ONOMA_SEMEIAS_RIZA = 'riza';
export const ONOMA_SEMEIAS_MONTELO = 'montelo';
export const ONOMA_SEMEIAS_JSON = 'json';
export const ONOMA_SEMEIAS_VOITHEIA = 'help';

/** Διαχωριστικό σημαιών/ορισμάτων. */
export const TELOS_ORIARGON = '--';
export const PROSFOLI_SIMIOLOU = '--';
export const SYMBOLO_SIMIO = '-';
export const SYMBOLO_ISTOTIMIAS = '=';
export const ARKIKO_MIKROS_SIMIOLOU = 1;

/** Κωδικός σφάλματος για λανθασμένη είσοδο χρήστη (δεν υπάρχει ειδικός στο enum). */
export const KODIKOS_LANTHASMENIS_EISODOU = 'MI_EGKYRO_SXIMA';

/** Πλάτος στήλης ονόματος εντολής στη βοήθεια. */
export const PLATOS_ONDOMATOS_ENTOLIS = 18;

/** Κωδικοί εξόδου διεργασίας (0 = επιτυχία, 1 = σφάλμα/χρήση). */
export const KODIKOS_EXODOU_OK = 0;
export const KODIKOS_EXODOU_SFALMA = 1;
