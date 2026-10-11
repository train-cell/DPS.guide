import type { ElegxosSessionApotelesma } from './typoi.js';

const PROTYPOS_INPUT_PASSWORD = /<input\b[^>]*\btype\s*=\s*["']?password["']?/i;
const PROTYPOS_ACTION_LOGIN = /action\s*=\s*["']?[^"'>]*(?:login|auth)/i;
const PROTYPOS_LOGIN_URL = /\/(?:main\/login_form\.php|modules\/auth\/|cas\/login)/i;
const PROTYPOS_SFALMA_LOGIN =
  /(?:alert-danger|alert\s+alert-danger|εσφαλμέν(?:ο|α)|λάθος\s+(?:όνομα|κωδικός)|invalid\s+credentials|authentication\s+failed|login_fail|wrong\s+password)/i;

/**
 * Ελέγχει αν το HTML περιέχει φόρμα σύνδεσης (username/password).
 */
export function periexei_forma_sindesis(html: string): boolean {
  if (!html) return false;
  return PROTYPOS_INPUT_PASSWORD.test(html) || PROTYPOS_ACTION_LOGIN.test(html);
}

/**
 * Ελέγχει αν το HTML περιέχει μήνυμα σφάλματος πιστοποίησης.
 */
export function periexei_sfalma_syndesis(html: string): boolean {
  if (!html) return false;
  return PROTYPOS_SFALMA_LOGIN.test(html);
}

/**
 * Ελέγχει αν το URL αντιστοιχεί σε σελίδα σύνδεσης (τοπική ή CAS).
 */
export function einai_anakateuthinsi_login(url: string): boolean {
  if (!url) return false;
  return PROTYPOS_LOGIN_URL.test(url);
}

/**
 * Ελέγχει αν μία απόκριση HTTP υποδηλώνει λήξη της συνεδρίας (session expiration).
 */
export function einai_lixi_session(
  katastasi: number,
  teliko_url: string,
  soma?: string
): ElegxosSessionApotelesma {
  if (katastasi === 401 || katastasi === 403) {
    return { lixi: true, aitia: `HTTP κωδικός κατάστασης ${katastasi}` };
  }

  if (einai_anakateuthinsi_login(teliko_url)) {
    return { lixi: true, aitia: `Ανακατεύθυνση σε σελίδα σύνδεσης: ${teliko_url}` };
  }

  if (soma && periexei_forma_sindesis(soma)) {
    return { lixi: true, aitia: 'Εντοπίστηκε φόρμα σύνδεσης στο περιεχόμενο της απόκρισης' };
  }

  return { lixi: false };
}
