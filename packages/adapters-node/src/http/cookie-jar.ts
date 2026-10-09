/** Καθαρή λογική cookie jar — χωρίς δίκτυο και χωρίς I/O, ώστε να δοκιμάζεται μεμονωμένα.
 *  Αποθήκευση ανά host (host → όνομα → Cookie): ομώνυμα cookies διαφορετικών hosts
 *  (π.χ. JSESSIONID του CAS και του eClass) δεν αλληλοεπικαλύπτονται.
 *  Τα cookies αποστέλλονται μόνο σε αιτήματα του ίδιου (ή υπο-)domain με συμβατή διαδρομή,
 *  όπως απαιτεί η ροή CAS όπου η ταυτότητα σπάνε μέσω των ενδιάμεσων 30x. */

const MILLIS_ANA_DEYTEROLEPTO = 1000;
const PROTAXI_MONOPATHIAS = '/';
const TELIKO_SIMEIO_MONOPATHIAS = '/';
const IPV4_MOTIVO = /^\d{1,3}(\.\d{1,3}){3}$/;

export interface Cookie {
  readonly onoma: string;
  readonly timi: string;
  readonly host: string;
  readonly monopathia: string;
  readonly monimos: boolean;
  readonly mexri: number | null;
}

/** Ταίριασμα host κατά RFC 6265: ίδιο host ή υπο-domain.
 *  Για IP (v4/hostname με :) επιτρέπεται μόνο ακριβής ταίριασμα — οι τελείες του
 *  IPv4 δεν σημαίνουν υπο-domain. */
function taftisi_host(host_cookie: string, host_aitimatos: string): boolean {
  if (host_cookie === host_aitimatos) {
    return true;
  }
  if (einai_ip(host_cookie) || einai_ip(host_aitimatos)) {
    return false;
  }
  return host_aitimatos.endsWith(`.${host_cookie}`);
}

function einai_ip(host: string): boolean {
  return IPV4_MOTIVO.test(host) || host.includes(':');
}

/** Ταίριασμα διαδρομής κατά RFC 6265 path-match. */
function taftisi_monopathias(monopathia_cookie: string, monopathia_aitimatos: string): boolean {
  if (monopathia_cookie === monopathia_aitimatos) {
    return true;
  }
  if (!monopathia_aitimatos.startsWith(monopathia_cookie)) {
    return false;
  }
  return (
    monopathia_cookie.endsWith(TELIKO_SIMEIO_MONOPATHIAS) ||
    monopathia_aitimatos[monopathia_cookie.length] === TELIKO_SIMEIO_MONOPATHIAS
  );
}

/** Προκαθορισμένη διαδρομή (RFC 6265 §5.1.4): «/» αν η διαδρομή είναι κενή ή δεν
 *  αρχίζει με «/», διαφορετικά ό,τι προηγείται της τελευταίας «/». */
export function default_path(monopathia: string): string {
  if (monopathia === '' || !monopathia.startsWith(PROTAXI_MONOPATHIAS)) {
    return PROTAXI_MONOPATHIAS;
  }
  const teleftea_kakia = monopathia.lastIndexOf(PROTAXI_MONOPATHIAS);
  if (teleftea_kakia === 0) {
    return PROTAXI_MONOPATHIAS;
  }
  return monopathia.slice(0, teleftea_kakia);
}

/** Μετατρέφει τις ωμές τιμές `Set-Cookie` σε cookies με βάση το URL του αιτήματος.
 *  Χαρακτηριστικά που δεν επηρεάζουν την αποστολή (HttpOnly, SameSite) αγνοούνται·
 *  `Max-Age` υπερισχύει του `Expires` (RFC 6265 §5.2.2/§5.3).
 *  Cookie με `Max-Age<=0` ή `Expires` στο παρελθόν επιστράφεται με `mexri` στο
 *  παρελθόν — το jar το διαγράφει αντί να το αποθηκεύσει. */
export function parse_set_cookies(raw: readonly string[], vasi: URL): Cookie[] {
  const apotelesmata: Cookie[] = [];
  for (const aksia of raw) {
    const tmimata = aksia.split(';');
    const zeugari = tmimata[0]?.trim() ?? '';
    if (zeugari === '') {
      continue;
    }
    const theseis_isou = zeugari.indexOf('=');
    if (theseis_isou < 0) {
      continue;
    }
    const onoma = zeugari.slice(0, theseis_isou).trim();
    if (onoma === '') {
      continue;
    }
    const xaraktiristika = new Map<string, string>();
    for (let theseis = 1; theseis < tmimata.length; theseis += 1) {
      const tmima = tmimata[theseis]?.trim() ?? '';
      if (tmima === '') {
        continue;
      }
      const theseis_isou_xar = tmima.indexOf('=');
      const kleidi = (theseis_isou_xar < 0 ? tmima : tmima.slice(0, theseis_isou_xar))
        .trim()
        .toLowerCase();
      const timi = theseis_isou_xar < 0 ? '' : tmima.slice(theseis_isou_xar + 1).trim();
      xaraktiristika.set(kleidi, timi);
    }

    let host = vasi.hostname;
    const domain = xaraktiristika.get('domain');
    if (domain !== undefined) {
      const katharo = domain.replace(/^\./, '').toLowerCase();
      if (katharo !== '') {
        host = katharo;
      }
    }

    let monopathia = default_path(vasi.pathname);
    const monopathia_xar = xaraktiristika.get('path');
    if (monopathia_xar !== undefined && monopathia_xar.startsWith(PROTAXI_MONOPATHIAS)) {
      monopathia = monopathia_xar;
    }

    let mexri: number | null = null;
    const max_age = xaraktiristika.get('max-age');
    if (max_age !== undefined) {
      const arithmos = Number.parseInt(max_age, 10);
      if (Number.isFinite(arithmos)) {
        mexri = Date.now() + arithmos * MILLIS_ANA_DEYTEROLEPTO;
      }
    } else {
      const expires = xaraktiristika.get('expires');
      if (expires !== undefined) {
        const xronos = Date.parse(expires);
        if (!Number.isNaN(xronos)) {
          mexri = xronos;
        }
      }
    }

    apotelesmata.push({
      onoma,
      timi: zeugari.slice(theseis_isou + 1).trim(),
      host,
      monopathia,
      monimos: xaraktiristika.has('secure'),
      mexri,
    });
  }
  return apotelesmata;
}

export class CookieJar {
  private readonly domes = new Map<string, Map<string, Cookie>>();

  /** Αποθήκευση/ενημέρωση· cookie που έχει ήδη λήξει διαγράφεται αντί να αποθηκευτεί. */
  val(cookie: Cookie): void {
    if (einai_ligmeno(cookie)) {
      this.svise(cookie.onoma, cookie.host);
      return;
    }
    const domi = this.domes.get(cookie.host);
    if (domi === undefined) {
      this.domes.set(cookie.host, new Map([[cookie.onoma, cookie]]));
      return;
    }
    domi.set(cookie.onoma, cookie);
  }

  val_se_ola(cookies: readonly Cookie[]): void {
    for (const cookie of cookies) {
      this.val(cookie);
    }
  }

  pare(onoma: string, host: string): Cookie | undefined {
    return this.domes.get(host)?.get(onoma);
  }

  pare_ola(host: string): Cookie[] {
    const domi = this.domes.get(host);
    return domi === undefined ? [] : [...domi.values()];
  }

  svise(onoma: string, host: string): boolean {
    const domi = this.domes.get(host);
    if (domi === undefined) {
      return false;
    }
    const diagrafike = domi.delete(onoma);
    if (domi.size === 0) {
      this.domes.delete(host);
    }
    return diagrafike;
  }

  /** Cookies κατάλληλα για το URL: ίδιο/υπο-domain, συμβατή διαδρομή, μη ληγμένα,
   *  και τα secure μόνο σε https. Ταξινόμηση: πιο συγκεκριμένη διαδρομή πρώτη. */
  gia_ekpompi(host: string, monopathia: string, asfales: boolean): Cookie[] {
    const apotelesmata: Cookie[] = [];
    for (const [host_cookie, domi] of this.domes) {
      if (!taftisi_host(host_cookie, host)) {
        continue;
      }
      for (const cookie of domi.values()) {
        if (einai_ligmeno(cookie)) {
          continue;
        }
        if (cookie.monimos && !asfales) {
          continue;
        }
        if (!taftisi_monopathias(cookie.monopathia, monopathia)) {
          continue;
        }
        apotelesmata.push(cookie);
      }
    }
    return apotelesmata.sort((a, b) => b.monopathia.length - a.monopathia.length);
  }

  /** Κεφαλίδα `Cookie` για το URL· κενό string αν δεν ταιριάζει τίποτα. */
  kefalida_gia(url: URL): string {
    const monopathia = url.pathname === '' ? PROTAXI_MONOPATHIAS : url.pathname;
    return this.gia_ekpompi(url.hostname, monopathia, url.protocol === 'https:')
      .map((cookie) => `${cookie.onoma}=${cookie.timi}`)
      .join('; ');
  }

  /** Αριθμός αποθηκευμένων cookies (για έλεγχο/διάγνωση). */
  get megethos(): number {
    let synolo = 0;
    for (const domi of this.domes.values()) {
      synolo += domi.size;
    }
    return synolo;
  }

  adeia(): void {
    this.domes.clear();
  }
}

function einai_ligmeno(cookie: Cookie): boolean {
  return cookie.mexri !== null && cookie.mexri <= Date.now();
}
