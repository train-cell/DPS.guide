/**
 * Ενοποιημένη Μηχανή Τηλεμετρίας & Structured Logging για το DPS.guide.
 * Υποστηρίζει Zero-Backend privacy, τοπικό κυκλικό buffer και αυτόματο scrubbing ευαίσθητων δεδομένων.
 */

export type EpipedoLog = 'debug' | 'info' | 'warn' | 'error';

export interface TilemetriaEggrafi {
  readonly id: string;
  readonly timestamp: string;
  readonly epipedo: EpipedoLog;
  readonly minima: string;
  readonly metadedomena?: Readonly<Record<string, unknown>> | undefined;
  readonly diarkeiaMs?: number | undefined;
}

/** Μέγιστος αριθμός καταγεγραμμένων συμβάντων στη μνήμη πριν την κυκλική αντικατάσταση. */
export const MEGISTO_ORIO_EGGRAFON = 500;

/** Μοτίβα κλειδιών που θεωρούνται ευαίσθητα και πρέπει να γίνονται redact. */
const EYAISTHITA_MOTIVA = /password|kodikos|token|secret|key|auth|pass|bearer|credential/i;

let eggrafes: TilemetriaEggrafi[] = [];
let metritisId = 0;

/** Αφαιρεί ευαίσθητες πληροφορίες από αντικείμενα πριν την καταγραφή στα logs. */
export function scrub_eyaisthita_dedomena(dedomena: unknown): unknown {
  if (dedomena === null || typeof dedomena !== 'object') {
    return dedomena;
  }

  if (Array.isArray(dedomena)) {
    return dedomena.map((stoixeio) => scrub_eyaisthita_dedomena(stoixeio));
  }

  const katharismeno: Record<string, unknown> = {};
  for (const [kleidi, timi] of Object.entries(dedomena as Record<string, unknown>)) {
    if (EYAISTHITA_MOTIVA.test(kleidi)) {
      katharismeno[kleidi] = '[REDACTED]';
    } else if (typeof timi === 'object' && timi !== null) {
      katharismeno[kleidi] = scrub_eyaisthita_dedomena(timi);
    } else {
      katharismeno[kleidi] = timi;
    }
  }
  return katharismeno;
}

/** Καταγράφει ένα structured συμβάν στην τηλεμετρία. */
export function katagrapse_tilemetria(
  epipedo: EpipedoLog,
  minima: string,
  metadedomena?: Record<string, unknown>,
  diarkeiaMs?: number
): TilemetriaEggrafi {
  metritisId++;
  const katharaMetadedomena = metadedomena
    ? (scrub_eyaisthita_dedomena(metadedomena) as Record<string, unknown>)
    : undefined;

  const eggrafi: TilemetriaEggrafi = {
    id: `log-${metritisId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    epipedo,
    minima,
    metadedomena: katharaMetadedomena ? Object.freeze(katharaMetadedomena) : undefined,
    diarkeiaMs,
  };

  eggrafes.push(eggrafi);
  if (eggrafes.length > MEGISTO_ORIO_EGGRAFON) {
    eggrafes = eggrafes.slice(-MEGISTO_ORIO_EGGRAFON);
  }

  return eggrafi;
}

/** Χρονομετράει την εκτέλεση μίας σύγχρονης ή ασύγχρονης συνάρτησης και καταγράφει το runtime. */
export async function xronometrise<T>(
  onomaLeitourgias: string,
  energeia: () => Promise<T> | T,
  epipedo: EpipedoLog = 'info'
): Promise<{ apotelesma: T; diarkeiaMs: number }> {
  const arxi = performance.now();
  try {
    const apotelesma = await energeia();
    const diarkeiaMs = Math.round((performance.now() - arxi) * 100) / 100;
    katagrapse_tilemetria(
      epipedo,
      `[Telemetry] Ολοκληρώθηκε: ${onomaLeitourgias} (${diarkeiaMs}ms)`,
      undefined,
      diarkeiaMs
    );
    return { apotelesma, diarkeiaMs };
  } catch (sfalma) {
    const diarkeiaMs = Math.round((performance.now() - arxi) * 100) / 100;
    katagrapse_tilemetria(
      'error',
      `[Telemetry] Αποτυχία: ${onomaLeitourgias} (${diarkeiaMs}ms) - ${sfalma instanceof Error ? sfalma.message : String(sfalma)}`,
      { sfalma: sfalma instanceof Error ? sfalma.stack : String(sfalma) },
      diarkeiaMs
    );
    throw sfalma;
  }
}

/** Επιστρέφει το τρέχον αρχείο καταγραφών. */
export function pare_tilemetria_arxeio(): readonly TilemetriaEggrafi[] {
  return Object.freeze([...eggrafes]);
}

/** Καθαρίζει το αρχείο καταγραφών (χρήσιμο για tests). */
export function katharise_tilemetria(): void {
  eggrafes = [];
  metritisId = 0;
}

/** Εξάγει το ιστορικό τηλεμετρίας σε μορφή JSON. */
export function eksagoge_tilemetrias_json(): string {
  return JSON.stringify(eggrafes, null, 2);
}
