import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import {
  PATH_LOGIN,
  PROEPILEGMENOS_USER_AGENT,
  PROEPILEGMENO_TIMEOUT_MS,
  VASIKO_URL_ECLASS,
} from '../statheres.js';
import {
  periexei_forma_sindesis,
  periexei_sfalma_syndesis,
  einai_anakateuthinsi_login,
} from './anixneusi-session.js';
import type { AuthPerivallon, StoixeiaTopikisSyndesis, SyndesiStratigiki } from './typoi.js';

interface FormasPedia {
  action: string;
  pedio_xristi: string;
  pedio_kodikou: string;
  pedia_formas: Record<string, string>;
}

export class TopikiSyndesi implements SyndesiStratigiki {
  private readonly onoma_xristi: string;
  private readonly kodikos: string;
  private readonly oristheis_base_url: string | undefined;

  constructor(stoixeia: StoixeiaTopikisSyndesis) {
    this.onoma_xristi = stoixeia.onoma_xristi;
    this.kodikos = stoixeia.kodikos;
    this.oristheis_base_url = stoixeia.base_url;
  }

  async syndesi(perivallon: AuthPerivallon): Promise<Apotelesma<void>> {
    if (!this.onoma_xristi || !this.kodikos) {
      return apotyxia('AUTH_APOTYXIA', 'Κενό όνομα χρήστη ή κωδικός πρόσβασης');
    }

    const base = (this.oristheis_base_url ?? perivallon.base_url ?? VASIKO_URL_ECLASS).replace(
      /\/+$/,
      ''
    );
    const login_url = `${base}${PATH_LOGIN}`;

    // Βήμα 1: GET login_form.php για ανάκτηση τυχόν κρυφών πεδίων και cookies
    const kefalides_get: Record<string, string> = {
      'user-agent': PROEPILEGMENOS_USER_AGENT,
    };
    const yparxon_cookie = perivallon.cookie_diaxeiristis.pare_kefalida();
    if (yparxon_cookie) {
      kefalides_get.cookie = yparxon_cookie;
    }

    const apantisi_forma = await perivallon.http.aitima({
      methodos: 'GET',
      url: login_url,
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
    const stoixeia_formas = this.analysi_formas(html_formas, login_url);

    // Βήμα 2: POST διαπιστευτηρίων (ΜΙΑ ΜΟΝΟ ΠΡΟΣΠΑΘΕΙΑ - ΠΟΤΕ RETRY ΣΕ ΛΑΘΟΣ ΚΩΔΙΚΟ)
    const soma_forma: Record<string, string> = {
      ...stoixeia_formas.pedia_formas,
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
    const teliko_url = apantisi_login.timi.teliko_url;
    const soma_apantisis = apantisi_login.timi.keimeno ?? '';

    // Έλεγχος αποτυχίας πιστοποίησης
    if (katastasi === 401 || katastasi === 403) {
      return apotyxia(
        'AUTH_APOTYXIA',
        `Αποτυχία πιστοποίησης: HTTP κωδικός κατάστασης ${katastasi}`
      );
    }

    if (einai_anakateuthinsi_login(teliko_url)) {
      return apotyxia(
        'AUTH_APOTYXIA',
        `Αποτυχία πιστοποίησης: ανακατεύθυνση στη σελίδα σύνδεσης (${teliko_url})`
      );
    }

    if (periexei_sfalma_syndesis(soma_apantisis) || periexei_forma_sindesis(soma_apantisis)) {
      return apotyxia(
        'AUTH_APOTYXIA',
        'Αποτυχία πιστοποίησης: εσφαλμένο όνομα χρήστη ή κωδικός πρόσβασης'
      );
    }

    return ok(undefined);
  }

  private analysi_formas(html: string, fallback_action: string): FormasPedia {
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

    let pedio_kodikou = 'pass';
    let pedio_xristi = 'uname';
    const pedia_formas: Record<string, string> = {};

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
        pedia_formas[onoma] = timi;
      } else if (typos === 'submit') {
        pedia_formas[onoma] = timi;
      } else if (typos === 'text' && pedio_xristi === 'uname') {
        pedio_xristi = onoma;
      }
    }

    const protypos_button = /<button\b([^>]*)>[\s\S]*?<\/button>/gi;
    for (let button = protypos_button.exec(html); button !== null; button = protypos_button.exec(html)) {
      const tag = button[1] ?? '';
      const typos = (this.pare_idiotita(tag, 'type') ?? 'submit').toLowerCase();
      const onoma = this.pare_idiotita(tag, 'name');
      if (typos === 'submit' && onoma) {
        pedia_formas[onoma] = this.pare_idiotita(tag, 'value') ?? '';
      }
    }

    return { action, pedio_xristi, pedio_kodikou, pedia_formas };
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
