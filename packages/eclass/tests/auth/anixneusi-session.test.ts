/**
 * Tests των συναρτήσεων ανίχνευσης λήξης συνεδρίας (`anixneusi-session`).
 *
 * Καθαρές συναρτήσεις χωρίς δίκτυο· ελέγχονται οι ακραίες περιπτώσεις
 * (κενό HTML, άκυρο URL) και οι κλάδοι επιστροφής `lixi`.
 *
 * ZERO PII: καμία πραγματική πιστοποίηση, μόνο σταθερά HTML πρότυπα.
 */

import { describe, expect, it } from 'vitest';
import {
  einai_anakateuthinsi_login,
  einai_lixi_session,
  periexei_forma_sindesis,
  periexei_sfalma_syndesis,
} from '../../src/auth/anixneusi-session.js';

describe('anixneusi-session', () => {
  it(' periexei_forma_sindesis: κενό → false', () => {
    expect(periexei_forma_sindesis('')).toBe(false);
    expect(periexei_forma_sindesis(undefined as never)).toBe(false);
  });

  it(' periexei_forma_sindesis: φόρμα σύνδεσης → true', () => {
    expect(periexei_forma_sindesis('<input type="password" name="password">')).toBe(true);
    expect(periexei_forma_sindesis('<form action="/main/login_form.php">')).toBe(true);
    expect(periexei_forma_sindesis('<div>καμία φόρμα</div>')).toBe(false);
  });

  it(' periexei_sfalma_syndesis: κενό → false', () => {
    expect(periexei_sfalma_syndesis('')).toBe(false);
    expect(periexei_sfalma_syndesis(undefined as never)).toBe(false);
  });

  it(' periexei_sfalma_syndesis: μήνυμα σφάλματος → true', () => {
    expect(periexei_sfalma_syndesis('<div class="alert-danger">Εσφαλμένο όνομα</div>')).toBe(true);
    expect(periexei_sfalma_syndesis('<div>όλα καλά</div>')).toBe(false);
  });

  it(' einai_anakateuthinsi_login: κενό → false', () => {
    expect(einai_anakateuthinsi_login('')).toBe(false);
    expect(einai_anakateuthinsi_login(undefined as never)).toBe(false);
  });

  it(' einai_anakateuthinsi_login: URL login → true', () => {
    expect(einai_anakateuthinsi_login('https://example.com/main/login_form.php')).toBe(true);
    expect(einai_anakateuthinsi_login('https://example.com/cas/login')).toBe(true);
    expect(einai_anakateuthinsi_login('https://example.com/kefito/')).toBe(false);
  });

  it(' einai_lixi_session: HTTP 401 → lixi', () => {
    expect(einai_lixi_session(401, 'https://example.com/')).toEqual({
      lixi: true,
      aitia: 'HTTP κωδικός κατάστασης 401',
    });
    expect(einai_lixi_session(403, 'https://example.com/')).toEqual({
      lixi: true,
      aitia: 'HTTP κωδικός κατάστασης 403',
    });
  });

  it(' einai_lixi_session: ανακατεύθυνση σε login → lixi', () => {
    expect(einai_lixi_session(200, 'https://example.com/main/login_form.php')).toEqual({
      lixi: true,
      aitia: 'Ανακατεύθυνση σε σελίδα σύνδεσης: https://example.com/main/login_form.php',
    });
  });

  it(' einai_lixi_session: φόρμα σύνδεσης στο σώμα → lixi', () => {
    expect(einai_lixi_session(200, 'https://example.com/kefito/', '<input type="password">')).toEqual({
      lixi: true,
      aitia: 'Εντοπίστηκε φόρμα σύνδεσης στο περιεχόμενο της απόκρισης',
    });
  });

  it(' einai_lixi_session: καμία ένδειξη → false', () => {
    expect(einai_lixi_session(200, 'https://example.com/kefito/', '<div>όλα καλά</div>')).toEqual({
      lixi: false,
    });
  });
});
