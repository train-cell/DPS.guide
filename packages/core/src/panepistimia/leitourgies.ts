import type {
  Panepistimio,
  OroiFiltrarismatosPanepistimion,
} from './typoi.js';
import { LISTA_PANEPISTIMION } from './katastasi.js';

/**
 * Επιστρέφει τη λίστα με όλα τα εγγεγραμμένα πανεπιστήμια.
 */
export function fere_ola_ta_panepistimia(): readonly Panepistimio[] {
  return LISTA_PANEPISTIMION;
}

/**
 * Αναζητά πανεπιστήμιο με βάση το αναγνωριστικό (id).
 */
export function vres_panepistimio_apo_id(id: string): Panepistimio | undefined {
  const katharo = id.trim().toLowerCase();
  if (katharo.length === 0) {
    return undefined;
  }
  return LISTA_PANEPISTIMION.find((p) => p.id.toLowerCase() === katharo);
}

/**
 * Εξάγει το hostname και το καθαρισμένο URL για συγκρίσεις.
 */
function kanonikopoiisi_url(urlStr: string): { katharo_url: string; hostname: string } | null {
  const trimmed = urlStr.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  const meProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(meProtocol);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const katharo_url = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${pathname}`;
    return {
      katharo_url,
      hostname: parsed.hostname,
    };
  } catch {
    const xwrisProtocol = trimmed.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const slashIndex = xwrisProtocol.indexOf('/');
    const hostname = slashIndex === -1 ? xwrisProtocol : xwrisProtocol.slice(0, slashIndex);
    if (hostname.length === 0) {
      return null;
    }
    return {
      katharo_url: `https://${xwrisProtocol}`,
      hostname,
    };
  }
}

/**
 * Αναζητά πανεπιστήμιο με βάση το URL.
 * Υποστηρίζει:
 * - Πλήρες URL πύλης (π.χ. 'https://thales.cs.unipi.gr')
 * - URL με κατάληξη διαδρομής (π.χ. 'https://thales.cs.unipi.gr/courses/PLI101/')
 * - Σκέτο όνομα τομέα (π.χ. 'thales.cs.unipi.gr')
 * - Παραλλαγές πεζών/κεφαλαίων και trailing slashes.
 */
export function vres_panepistimio_apo_url(url: string): Panepistimio | undefined {
  const eisodos = kanonikopoiisi_url(url);
  if (!eisodos) {
    return undefined;
  }

  // 1. Έλεγχος ταύτισης πλήρους κανονικοποιημένου URL
  for (const panepistimio of LISTA_PANEPISTIMION) {
    const norm = kanonikopoiisi_url(panepistimio.base_url);
    if (norm && norm.katharo_url === eisodos.katharo_url) {
      return panepistimio;
    }
  }

  // 2. Έλεγχος αν το δοθέν URL ξεκινά με το base_url του πανεπιστημίου
  for (const panepistimio of LISTA_PANEPISTIMION) {
    const norm = kanonikopoiisi_url(panepistimio.base_url);
    if (norm && eisodos.katharo_url.startsWith(norm.katharo_url)) {
      return panepistimio;
    }
  }

  // 3. Έλεγχος ταύτισης hostname (π.χ. αν διαφέρει το πρωτόκολλο ή η θύρα)
  for (const panepistimio of LISTA_PANEPISTIMION) {
    const norm = kanonikopoiisi_url(panepistimio.base_url);
    if (norm && norm.hostname === eisodos.hostname) {
      return panepistimio;
    }
  }

  return undefined;
}

/**
 * Αφαιρεί τόνους και μετατρέπει σε πεζά για ανθεκτική αναζήτηση στα ελληνικά.
 */
function katharise_keimeno_anazitisis(keimeno: string): string {
  return keimeno
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Φιλτράρει τα πανεπιστήμια με βάση όρους αναζήτησης, γεωγραφική περιοχή ή κατηγορία σπουδών.
 */
export function filtrare_panepistimia(
  oroi: OroiFiltrarismatosPanepistimion
): readonly Panepistimio[] {
  const anazitisiKathari = oroi.anazitisi ? katharise_keimeno_anazitisis(oroi.anazitisi) : '';

  return LISTA_PANEPISTIMION.filter((p) => {
    if (oroi.perioxh && p.perioxh !== oroi.perioxh) {
      return false;
    }

    if (oroi.kategoria && p.kategoria !== oroi.kategoria) {
      return false;
    }

    if (anazitisiKathari.length > 0) {
      const pedia = [
        p.id,
        p.onoma,
        p.syntomi_onomasia,
        p.tmima,
        p.poli,
        p.base_url,
      ].map(katharise_keimeno_anazitisis);

      const tairiazei = pedia.some((pedio) => pedio.includes(anazitisiKathari));
      if (!tairiazei) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Δημιουργεί προσαρμοσμένο αντικείμενο Panepistimio για πύλη που δεν υπάρχει στον προκαθορισμένο κατάλογο.
 */
export function ftiaxe_prosarmogi_panepistimiou(
  base_url: string,
  onoma?: string
): Panepistimio {
  const eisodos = kanonikopoiisi_url(base_url);
  const katharoUrl = eisodos ? eisodos.katharo_url : base_url.trim().replace(/\/+$/, '');
  const hostname = eisodos ? eisodos.hostname : 'custom';
  const idSlug = 'custom_' + hostname.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const telikoOnoma =
    onoma && onoma.trim().length > 0 ? onoma.trim() : `Προσαρμοσμένο (${hostname})`;

  return {
    id: idSlug,
    onoma: telikoOnoma,
    syntomi_onomasia: 'CUSTOM',
    tmima: 'Προσαρμοσμένο Τμήμα',
    poli: 'Ειδική',
    perioxh: 'eidiko',
    kategoria: 'geniko',
    base_url: katharoUrl,
    typos_lms: 'custom',
    typos_auth: 'topiki',
    xromata: {
      vasiko: '#4a5568',
      tonismeno: '#718096',
    },
    syntomo_eikonidio: 'custom',
  };
}
