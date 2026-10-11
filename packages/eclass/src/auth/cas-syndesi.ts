import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import {
  PATH_CAS,
  PROEPILEGMENOS_USER_AGENT,
  PROEPILEGMENO_TIMEOUT_MS,
  VASIKO_URL_ECLASS,
} from '../statheres.js';
import {
  periexei_forma_sindesis,
  periexei_sfalma_syndesis,
} from './anixneusi-session.js';
import type { AuthPerivallon, StoixeiaCasSyndesis, SyndesiStratigiki } from './typoi.js';

interface CasFormasPedia {
  action: string;
  pedio_xristi: string;
  pedio_kodikou: string;
  krifa_pedia: Record<string, string>;
}

export class CasSyndesi implements SyndesiStratigiki {
  private readonly onoma_xristi: string;
  private readonly kodikos: string;
  private readonly oristheis_base_url: string | undefined;
  private readonly oristheis_cas_url: string | undefined;

  constructor(stoixeia: StoixeiaCasSyndesis) {
    this.onoma_xristi = stoixeia.onoma_xristi;
    this.kodikos = stoixeia.kodikos;
    this.oristheis_base_url = stoixeia.base_url;
    this.oristheis_cas_url = stoixeia.cas_url;
  }

  async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
    if (!this.onoma_xristi || !this.kodikos) {
      return apotyxia('AUTH_APOTYXIA', 'Κενό όνομα χρήστη ή κωδικός πρόσβασης');
    }

    const base = (this.oristheis_base_url ?? perivallon.base_url ?? VASIKO_URL_ECLASS).replace(
      /\/+$/,
      ''
    );
    const cas_enarksi = this.oristheis_cas_url ?? `${base}${PATH_CAS}`;

    // Βήμα 1: GET στη σελίδα CAS (ακολουθεί ανακατευθύνσεις μέχρι τη φόρμα CAS)
    const kefalides_get: Record<string, string> = {
      'user-agent': PROEPILEGMENOS_USER_AGENT,
    };
    const yparxon_cookie = perivallon.cookie_diaxeiristis.pare_kefalida();
    if (yparxon_cookie) {
      kefalides_get.cookie = yparxon_cookie;
    }

    const apantisi_forma = await perivallon.http.aitima({
      methodos: 'GET',
      url: cas_enarksi,
      kefalides: kefalides_get,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: PROEPILEGMENO_TIMEOUT_MS,
      typos_apantisis: 'keimeno',
    });

    if (!apantisi_forma.ok) {
      return apantisi_forma;
    }

    perivallon.cookie_diaxeiristis.apothikefse_apo_kefalides(apantisi_forma.timi.kefalides);

    const html_formas = apantisi_forma.timi.keimeno ?? '';
    const teliko_url_formas = apantisi_forma.timi.teliko_url;
    const stoixeia_formas = this.analysi_cas_formas(html_formas, teliko_url_formas);

    // Βήμα 2: POST στη φόρμα CAS (ΜΙΑ ΜΟΝΟ ΠΡΟΣΠΑΘΕΙΑ - ΠΟΤΕ RETRY ΣΕ ΛΑΘΟΣ ΚΩΔΙΚΟ)
    const soma_forma: Record<string, string> = {
      ...stoixeia_formas.krifa_pedia,
      [stoixeia_formas.pedio_xristi]: this.onoma_xristi,
      [stoixeia_formas.pedio_kodikou]: this.kodikos,
    };

    const kefalides_post: Record<string, string> = {
      'user-agent': PROEPILEGMENOS_USER_AGENT,
    };
    const neo_cookie = perivallon.cookie_diaxeiristis.pare_kefalida();
    if (neo_cookie) {
      kefalides_post.cookie = neo_cookie;
    }

    const apantisi_login = await perivallon.http.aitima({
      methodos: 'POST',
      url: stoixeia_formas.action,
      soma_forma,
      kefalides: kefalides_post,
      akolouthise_anakateuthinseis: true,
      xronos_orio_ms: PROEPILEGMENO_TIMEOUT_MS,
      typos_apantisis: 'keimeno',
    });

    if (!apantisi_login.ok) {
      return apantisi_login;
    }

    perivallon.cookie_diaxeiristis.apothikefse_apo_kefalides(apantisi_login.timi.kefalides);

    const katastasi = apantisi_login.timi.katastasi;
    const soma_apantisis = apantisi_login.timi.keimeno ?? '';

    // Έλεγχος αποτυχίας CAS
    if (katastasi === 401 || katastasi === 403) {
      return apotyxia('AUTH_APOTYXIA', `Αποτυχία CAS πιστοποίησης: HTTP ${katastasi}`);
    }

    if (periexei_sfalma_syndesis(soma_apantisis) || periexei_forma_sindesis(soma_apantisis)) {
      return apotyxia(
        'AUTH_APOTYXIA',
        'Αποτυχία CAS πιστοποίησης: εσφαλμένο όνομα χρήστη ή κωδικός πρόσβασης'
      );
    }

    return ok(undefined);
  }

  private analysi_cas_formas(html: string, fallback_action: string): CasFormasPedia {
    let action = fallback_action;
    const match_action = /<form\b[^>]*\baction\s*=\s*["']([^"']+)["']/i.exec(html);
    if (match_action && match_action[1]) {
      const act = match_action[1];
      if (act.startsWith('http')) {
        action = act;
      } else if (act.startsWith('/')) {
        const u = new URL(fallback_action);
        action = `${u.origin}${act}`;
      } else {
        const u = new URL(fallback_action);
        action = new URL(act, u).toString();
      }
    }

    let pedio_kodikou = 'password';
    let pedio_xristi = 'username';
    const krifa_pedia: Record<string, string> = {};

    const protypos_input = /<input\b([^>]*)>/gi;
    let match: RegExpExecArray | null;

    while ((match = protypos_input.exec(html)) !== null) {
      const tag = match[1] ?? '';
      const typos = (this.pare_idiotita(tag, 'type') ?? 'text').toLowerCase();
      const onoma = this.pare_idiotita(tag, 'name');
      const timi = this.pare_idiotita(tag, 'value') ?? '';

      if (!onoma) continue;

      if (typos === 'password') {
        pedio_kodikou = onoma;
      } else if (typos === 'hidden') {
        krifa_pedia[onoma] = timi;
      } else if (typos === 'text' && (pedio_xristi === 'username' || onoma.includes('user'))) {
        pedio_xristi = onoma;
      }
    }

    return { action, pedio_xristi, pedio_kodikou, krifa_pedia };
  }

  private pare_idiotita(tag: string, onoma: string): string | null {
    const protypos = new RegExp(`\\b${onoma}\\s*=\\s*["']([^"']*)["']`, 'i');
    const vrethi = protypos.exec(tag);
    if (vrethi && vrethi[1] !== undefined) {
      return vrethi[1];
    }
    const xoris = new RegExp(`\\b${onoma}\\s*=\\s*([^\\s"'>]+)`, 'i').exec(tag);
    return xoris && xoris[1] !== undefined ? xoris[1] : null;
  }
}
