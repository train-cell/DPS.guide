import type { Mathima } from '@dps/core';
import { VASIKO_URL_ECLASS } from '../statheres.js';

export interface StoixeioFakelou {
  onoma: string;
  url: string;
  rel_path: string;
}

export interface StoixeioArxeiou {
  onoma: string;
  url: string;
  rel_path: string;
  megethos: number | null;
  imerominia: string | null;
}

export interface ApotelesmaParsingFakelou {
  fakeloi: StoixeioFakelou[];
  arxeia: StoixeioArxeiou[];
}

/**
 * Μετατρέπει αναπαράσταση μεγέθους κειμένου (π.χ. '1.8 MB', '256 KB', '1024') σε bytes.
 */
export function metatropi_megethous_se_bytes(keimeno: string | null | undefined): number | null {
  if (!keimeno) return null;
  const katharo = keimeno.trim();
  if (katharo === '' || katharo === '-') return null;

  const match = /^([\d.,]+)\s*(bytes?|b|kb|k|mb|m|gb|g)?$/i.exec(katharo);
  if (!match || !match[1]) return null;

  const arithmos = parseFloat(match[1].replace(',', '.'));
  if (Number.isNaN(arithmos)) return null;

  const monada = (match[2] ?? 'b').toLowerCase();
  if (monada.startsWith('g')) return Math.round(arithmos * 1024 * 1024 * 1024);
  if (monada.startsWith('m')) return Math.round(arithmos * 1024 * 1024);
  if (monada.startsWith('k')) return Math.round(arithmos * 1024);
  return Math.round(arithmos);
}

/**
 * Αναλύει το HTML του portfolio για εξαγωγή της λίστας μαθημάτων.
 * Υποστηρίζει τόσο HTML όσο και συνθετικό JSON.
 */
export function analysi_portfolio_html(
  keimeno: string,
  base_url = VASIKO_URL_ECLASS
): Mathima[] {
  const katharo = keimeno.trim();

  // Υποστήριξη συνθετικού JSON αν η απάντηση είναι JSON
  if (katharo.startsWith('[') || katharo.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(katharo);
      if (Array.isArray(parsed)) {
        return parsed as Mathima[];
      }
    } catch {
      // Συνέχεια με HTML parsing
    }
  }

  const base = base_url.replace(/\/+$/, '');
  const mathimata_xartis = new Map<string, Mathima>();

  // Αναζήτηση συνδέσμων προς courses: href="/courses/PLI101/" ή "https://.../courses/PLI101/"
  const protypos_link = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null;

  while ((match = protypos_link.exec(katharo)) !== null) {
    const href = match[1] ?? '';
    const periexomeno = match[2] ?? '';

    // Έλεγχος αν ο σύνδεσμος αφορά μάθημα
    const kodikos_match = /\/courses\/([A-Za-z0-9_-]+)(?:\/|$)/i.exec(href);
    if (!kodikos_match || !kodikos_match[1]) continue;

    const kodikos = kodikos_match[1].toUpperCase();

    // Εξαίρεση συστημικών συνδέσμων
    if (
      kodikos === 'MAIN' ||
      kodikos === 'MODULES' ||
      kodikos === 'INDEX' ||
      /logout|user|tools|help|calendar/i.test(href)
    ) {
      continue;
    }

    if (mathimata_xartis.has(kodikos)) continue;

    // Καθαρισμός τίτλου από τυχόν HTML tags
    const titlos_katharos = periexomeno
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const titlos = titlos_katharos.length > 0 ? titlos_katharos : `Μάθημα ${kodikos}`;
    const url = `${base}/courses/${kodikos}/`;

    mathimata_xartis.set(kodikos, {
      kodikos,
      titlos,
      url,
      epilegmeno: true,
    });
  }

  return [...mathimata_xartis.values()];
}

/**
 * Αναλύει το HTML (ή JSON fixture) ενός φακέλου στο module document του eClass.
 * Επιστρέφει υποφακέλους και αρχεία.
 */
export function analysi_fakelou_html(
  keimeno: string,
  trexousa_url: string,
  trexousa_diadromi = ''
): ApotelesmaParsingFakelou {
  const katharo = keimeno.trim();

  // Υποστήριξη συνθετικού JSON αν η απάντηση είναι JSON
  if (katharo.startsWith('[') || katharo.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(katharo);
      if (Array.isArray(parsed)) {
        const fakeloi: StoixeioFakelou[] = [];
        const arxeia: StoixeioArxeiou[] = [];
        for (const stoixeio of parsed) {
          if (typeof stoixeio !== 'object' || stoixeio === null) continue;
          const s = stoixeio as Record<string, unknown>;
          if (s.typos === 'fakelos') {
            if (s.diadromi !== '') {
              fakeloi.push({
                onoma: String(s.onoma ?? ''),
                url: String(s.url ?? ''),
                rel_path: String(s.diadromi ?? ''),
              });
            }
          } else if (s.typos === 'arxeio') {
            arxeia.push({
              onoma: String(s.onoma ?? ''),
              url: String(s.url ?? ''),
              rel_path: String(s.diadromi ?? ''),
              megethos: typeof s.megethos === 'number' ? s.megethos : null,
              imerominia: typeof s.imerominia === 'string' ? s.imerominia : null,
            });
          }
        }
        return { fakeloi, arxeia };
      }
    } catch {
      // Συνέχεια με HTML parsing
    }
  }

  const fakeloi: StoixeioFakelou[] = [];
  const arxeia: StoixeioArxeiou[] = [];
  const yparxonta_arxeia = new Set<string>();
  const yparxontes_fakeloi = new Set<string>();

  // Πρώτη προσέγγιση: αναζήτηση γραμμών πίνακα (tr) για εύρεση μεγέθους και ημερομηνίας
  const protypos_tr = /<tr\b[^>]*>(.*?)<\/tr>/gis;
  let tr_match: RegExpExecArray | null;

  while ((tr_match = protypos_tr.exec(katharo)) !== null) {
    const grammi = tr_match[1] ?? '';
    const protypos_a = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
    const a_match = protypos_a.exec(grammi);
    if (!a_match || !a_match[1]) continue;

    const href = a_match[1];
    const keimeno_link = (a_match[2] ?? '').replace(/<[^>]+>/g, '').trim();
    if (!keimeno_link || href.startsWith('#') || href.startsWith('javascript:')) continue;

    // Εξαγωγή κελιών td
    const td_matches = [...grammi.matchAll(/<td\b[^>]*>(.*?)<\/td>/gis)].map((m) =>
      (m[1] ?? '').replace(/<[^>]+>/g, '').trim()
    );

    const full_url = επιλυση_url(href, trexousa_url);

    // Έλεγχος αν είναι αρχείο (έχει επέκταση αρχείου)
    const onoma_arxeiou = keimeno_link;
    if (/\.[a-zA-Z0-9]{2,5}$/i.test(onoma_arxeiou) || /\.[a-zA-Z0-9]{2,5}$/i.test(href)) {
      const rel_path = `${trexousa_diadromi}${onoma_arxeiou}`;
      if (!yparxonta_arxeia.has(rel_path)) {
        yparxonta_arxeia.add(rel_path);

        // Προσπάθεια εύρεσης μεγέθους και ημερομηνίας από τα υπόλοιπα κελιά
        let megethos: number | null = null;
        let imerominia: string | null = null;

        for (const td of td_matches) {
          if (megethos === null) {
            const parsed_m = metatropi_megethous_se_bytes(td);
            if (parsed_m !== null) {
              megethos = parsed_m;
              continue;
            }
          }
          if (imerominia === null && /\d{2,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{4}-\d{2}-\d{2}/.test(td)) {
            imerominia = td;
          }
        }

        arxeia.push({
          onoma: onoma_arxeiou,
          url: full_url,
          rel_path,
          megethos,
          imerominia,
        });
      }
    } else if (
      (grammi.includes('fa-folder') ||
        grammi.includes('directory') ||
        href.includes('openDir') ||
        href.endsWith('/')) &&
      !href.includes('parent') &&
      keimeno_link !== '..'
    ) {
      // Υποφάκελος
      const onoma_fakelou = keimeno_link.replace(/\/+$/, '');
      const rel_path = `${trexousa_diadromi}${onoma_fakelou}/`;
      if (!yparxontes_fakeloi.has(rel_path)) {
        yparxontes_fakeloi.add(rel_path);
        fakeloi.push({
          onoma: onoma_fakelou,
          url: full_url,
          rel_path,
        });
      }
    }
  }

  // Δεύτερη προσέγγιση: αν δεν βρέθηκαν γραμμές πίνακα, αναζήτηση απλών συνδέσμων <a>
  if (arxeia.length === 0 && fakeloi.length === 0) {
    const protypos_a = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
    let match: RegExpExecArray | null;

    while ((match = protypos_a.exec(katharo)) !== null) {
      const href = match[1] ?? '';
      const keimeno_link = (match[2] ?? '').replace(/<[^>]+>/g, '').trim();
      if (!keimeno_link || href.startsWith('#') || href.startsWith('javascript:')) continue;
      if (keimeno_link === '..' || href.includes('parentDir')) continue;

      const full_url = επιλυση_url(href, trexousa_url);

      if (/\.[a-zA-Z0-9]{2,5}$/i.test(keimeno_link) || /\.[a-zA-Z0-9]{2,5}$/i.test(href)) {
        const onoma = keimeno_link.includes('.') ? keimeno_link : href.slice(href.lastIndexOf('/') + 1);
        const rel_path = `${trexousa_diadromi}${onoma}`;
        if (!yparxonta_arxeia.has(rel_path)) {
          yparxonta_arxeia.add(rel_path);
          arxeia.push({
            onoma,
            url: full_url,
            rel_path,
            megethos: null,
            imerominia: null,
          });
        }
      } else if (
        href.includes('openDir=') ||
        (href.includes('/document/') && href.endsWith('/')) ||
        href.includes('dir=')
      ) {
        const onoma = keimeno_link.replace(/\/+$/, '');
        const rel_path = `${trexousa_diadromi}${onoma}/`;
        if (!yparxontes_fakeloi.has(rel_path)) {
          yparxontes_fakeloi.add(rel_path);
          fakeloi.push({
            onoma,
            url: full_url,
            rel_path,
          });
        }
      }
    }
  }

  return { fakeloi, arxeia };
}

function επιλυση_url(href: string, base: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
