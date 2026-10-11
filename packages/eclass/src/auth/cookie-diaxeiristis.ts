/**
 * Διαχειριστής cookies για τη διατήρηση του session στο eClass.
 * Αποθηκεύει cookies από αποκρίσεις HTTP και παράγει την κεφαλίδα Cookie.
 */
export class CookieDiaxeiristis {
  private readonly cookies = new Map<string, string>();

  /**
   * Αποθηκεύει cookies από τις κεφαλίδες μίας απάντησης HTTP.
   * Αναζητά κεφαλίδες τύπου 'set-cookie' (case-insensitive).
   */
  apothikefse_apo_kefalides(kefalides: Record<string, string>): void {
    for (const [kleidi, timi] of Object.entries(kefalides)) {
      if (kleidi.toLowerCase() === 'set-cookie' && timi) {
        this.epeksergasia_set_cookie(timi);
      }
    }
  }

  /**
   * Αποθηκεύει χειροκίνητα ένα cookie.
   */
  apothikefse(onoma: string, timi: string): void {
    if (onoma.trim().length > 0) {
      this.cookies.set(onoma.trim(), timi.trim());
    }
  }

  /**
   * Επιστρέφει την κεφαλίδα Cookie προς αποστολή, ή undefined αν δεν υπάρχουν cookies.
   */
  pare_kefalida(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }
    const tmimata: string[] = [];
    for (const [onoma, timi] of this.cookies.entries()) {
      tmimata.push(`${onoma}=${timi}`);
    }
    return tmimata.join('; ');
  }

  /**
   * Επιστρέφει αντίγραφο των τρεχόντων cookies.
   */
  pare_ola(): ReadonlyMap<string, string> {
    return new Map(this.cookies);
  }

  /**
   * Ελέγχει αν υπάρχει κάποιο session cookie (π.χ. PHPSESSID ή παρόμοιο).
   */
  exei_session(): boolean {
    return this.cookies.size > 0;
  }

  /**
   * Καθαρίζει όλα τα αποθηκευμένα cookies.
   */
  katharise(): void {
    this.cookies.clear();
  }

  private epeksergasia_set_cookie(grammi: string): void {
    // Το Set-Cookie μπορεί να περιέχει πολλαπλά cookies χωρισμένα με \n
    // ή με κόμμα (αν και attributes μπορεί επίσης να έχουν κόμμα σε expires date).
    const grammes = grammi.split(/\r?\n/);
    for (const g of grammes) {
      const merides = g.split(';').map((m) => m.trim());
      const prwti = merides[0];
      if (!prwti) continue;
      const thesi = prwti.indexOf('=');
      if (thesi > 0) {
        const onoma = prwti.slice(0, thesi).trim();
        const timi = prwti.slice(thesi + 1).trim();
        if (onoma.length > 0) {
          this.cookies.set(onoma, timi);
        }
      }
    }
  }
}
