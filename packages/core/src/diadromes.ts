/** Μέγιστο μήκος αναγνωριστικού που μπορεί να χρησιμοποιηθεί ως ένα URL path segment. */
export const MEGISTO_MIKOS_TMIMATOS_DIADROMIS = 128;

const ASFALIS_XARAKTIRAS_TMIMATOS = /^[\p{L}\p{N}][\p{L}\p{N}\p{M}._-]*$/u;

/** Ελέγχει ότι ένα αναγνωριστικό δεν μπορεί να δημιουργήσει δεύτερο τμήμα ή εξωτερική διαδρομή. */
export function einai_asfales_tmima_diadromis(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MEGISTO_MIKOS_TMIMATOS_DIADROMIS &&
    ASFALIS_XARAKTIRAS_TMIMATOS.test(value)
  );
}
