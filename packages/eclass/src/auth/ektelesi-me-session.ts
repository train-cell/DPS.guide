import type { Apotelesma, HttpAitima, HttpApantisi } from '@dps/core';
import { apotyxia } from '@dps/core';
import { PROEPILEGMENOS_USER_AGENT } from '../statheres.js';
import { einai_lixi_session } from './anixneusi-session.js';
import type { AuthPerivallon, SyndesiStratigiki } from './typoi.js';

export type EktelestisAitimatos = (
  kefalides: Record<string, string>
) => Promise<Apotelesma<HttpApantisi>>;

/**
 * Εκτελεί ένα HTTP αίτημα με αυτόματη διαχείριση συνεδρίας (session).
 * Αν ανιχνευθεί λήξη συνεδρίας (status 401/403, redirect σε login, φόρμα εισόδου),
 * εκτελείται ΑΚΡΙΒΩΣ ΜΙΑ επανασύνδεση.
 * Αν και η δεύτερη απόπειρα αποτύχει ή δείξει ξανά λήξη, επιστρέφει SESSION_LIXI.
 */
export async function ektelesi_me_session(
  perivallon: AuthPerivallon,
  stratigiki: SyndesiStratigiki,
  aitima: HttpAitima | EktelestisAitimatos
): Promise<Apotelesma<HttpApantisi>> {
  // 1. Έλεγχος αν έχουμε ήδη session cookies. Αν όχι, πραγματοποιούμε αρχική σύνδεση.
  if (!perivallon.cookie_diaxeiristis.exei_session()) {
    const syndesi_res = await stratigiki.syndesi(perivallon);
    if (!syndesi_res.ok) {
      return syndesi_res;
    }
  }

  // 2. Πρώτη εκτέλεση του αιτήματος
  const apantisi_1 = await ektelese_aitima_me_cookies(perivallon, aitima);
  if (!apantisi_1.ok) {
    return apantisi_1;
  }

  // 3. Έλεγχος για λήξη session
  const elegxos_1 = einai_lixi_session(
    apantisi_1.timi.katastasi,
    apantisi_1.timi.teliko_url,
    apantisi_1.timi.keimeno
  );

  if (!elegxos_1.lixi) {
    perivallon.cookie_diaxeiristis.apothikefse_apo_kefalides(apantisi_1.timi.kefalides);
    return apantisi_1;
  }

  // 4. Εντοπίστηκε λήξη session -> ακριβώς ΜΙΑ επανασύνδεση
  perivallon.cookie_diaxeiristis.katharise();
  const epanasyndesi_res = await stratigiki.syndesi(perivallon);
  if (!epanasyndesi_res.ok) {
    return apotyxia(
      'SESSION_LIXI',
      `Η επανασύνδεση απέτυχε μετά από λήξη συνεδρίας (${epanasyndesi_res.sfalma.minima})`,
      epanasyndesi_res.sfalma
    );
  }

  // 5. Επανάληψη του αιτήματος (retry) μετά την επιτυχή επανασύνδεση
  const apantisi_2 = await ektelese_aitima_me_cookies(perivallon, aitima);
  if (!apantisi_2.ok) {
    return apantisi_2;
  }

  // 6. Έλεγχος αν επιμένει η λήξη session (διπλή λήξη -> SESSION_LIXI)
  const elegxos_2 = einai_lixi_session(
    apantisi_2.timi.katastasi,
    apantisi_2.timi.teliko_url,
    apantisi_2.timi.keimeno
  );

  if (elegxos_2.lixi) {
    return apotyxia(
      'SESSION_LIXI',
      `Η συνεδρία eClass έληξε και δεν αποκαταστάθηκε μετά από επανασύνδεση (${elegxos_2.aitia ?? 'άγνωστη αιτία'})`
    );
  }

  perivallon.cookie_diaxeiristis.apothikefse_apo_kefalides(apantisi_2.timi.kefalides);
  return apantisi_2;
}

async function ektelese_aitima_me_cookies(
  perivallon: AuthPerivallon,
  aitima: HttpAitima | EktelestisAitimatos
): Promise<Apotelesma<HttpApantisi>> {
  const kefalides: Record<string, string> = {
    'user-agent': PROEPILEGMENOS_USER_AGENT,
  };

  const cookie = perivallon.cookie_diaxeiristis.pare_kefalida();
  if (cookie) {
    kefalides.cookie = cookie;
  }

  if (typeof aitima === 'function') {
    return aitima(kefalides);
  }

  const enswmatomeno_aitima: HttpAitima = {
    ...aitima,
    kefalides: {
      ...kefalides,
      ...(aitima.kefalides ?? {}),
    },
  };

  return perivallon.http.aitima(enswmatomeno_aitima);
}
