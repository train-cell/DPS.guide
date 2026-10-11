#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PARAGKES = {
  EMAIL: '<<EMAIL>>',
  AM: '<<AM>>',
  ONOMA_XRISTI: '<<ONOMA_XRISTI>>',
  KODIKOS: '<<KODIKOS>>',
  USER_ID: '<<USER_ID>>',
  TOKEN: '<<TOKEN>>',
  COOKIE: '<<COOKIE>>',
  SESSION_ID: '<<SESSION_ID>>',
  IP: '<<IP>>',
};

export const SYNDESMOI_GNOSTES = {
  ONOMA: 'ECLASS_FULLNAME',
  ONOMA_XRISTI: 'ECLASS_USERNAME',
  EMAIL: 'ECLASS_EMAIL',
  AM: 'ECLASS_AM',
  KODIKOS: 'ECLASS_PASSWORD',
  USER_ID: 'ECLASS_USER_ID',
};

const ARXIO_ELLIPSIS = '…';
const ELACHISTO_MIKOS_TIMI_GNOSTI = 4;

const PROTYPOS_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PROTYPOS_EMAIL_HTML = /&#0*64;|&#x0*40;/gi;
const PROTYPOS_AM_ETIKETIZED =
  /\b(?:ΑΜ|Α\.Μ\.|am|student[_ ]?id|matriculation[_ ]?id)\s*[:=#]?\s*(\d{8,9})\b/gi;
const PROTYPOS_AM = /(?<!content-length: )(?<!etag["']?\s*[:=]\s*)(?<![\d.,\-:])\d{9}(?![\d.,\-:])/g;
const PROTYPOS_IP = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const PROTYPOS_JWT = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*/g;
const PROTYPOS_BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const PROTYPOS_SESSION = /\b(PHPSESSID|sessionid|session_id|sso_session|JSESSIONID|sid)=([^&\s"'<>]+)/gi;
const PROTYPOS_TOKEN =
  /\b(token|auth_token|access_token|refresh_token|api_key|apikey|jwt|mtoken|oauth_token)=([^&\s"'<>]+)/gi;
const PROTYPOS_USER_ID = /\b(user_id|uid)=([^&\s"'<>]+)/gi;
const PROTYPOS_STOIKXEIA = /\b(username|user|onoma_xristi|login)=([^&\s"'<>]+)/gi;
const PROTYPOS_KODIKOS =
  /\b(password|passwd|pwd|pass|kodikos|κωδικός|κωδικος)=([^&\s"'<>]+)/gi;
const PROTYPOS_SET_COOKIE = /(\bSet-Cookie\s*:\s*)([^=;,\s]+)=([^;,\r\n]*)/gi;
const PROTYPOS_COOKIE_KEFALIDA = /(?<!Set-)\b(Cookie\s*:\s*)([^\r\n]+)/gi;
const PROTYPOS_HEX_SESSION_ID =
  /(?<!etag["']?\s*[:=]\s*)(?<!sha256["']?\s*[:=]\s*)(?<![A-Fa-f0-9])[a-f0-9]{20,}(?![A-Fa-f0-9])/g;

const KLEIDIA_MYSTIKA = [
  [/^(?:password|passwd|pwd|pass|kodikos|κωδικός|κωδικος|secret|credentials)$/i, PARAGKES.KODIKOS],
  [
    /^(?:token|auth_token|access_token|refresh_token|api_key|apikey|jwt|mtoken|oauth_token)$/i,
    PARAGKES.TOKEN,
  ],
  [/^(?:phpsessid|sessionid|session_id|session|sid|cookie|eclass_cookie|eclass_token)$/i, PARAGKES.SESSION_ID],
  [/^(?:user_id|uid)$/i, PARAGKES.USER_ID],
  [/^(?:email|mail|mail_address)$/i, PARAGKES.EMAIL],
  [/^(?:am|student_id|matriculation_id)$/i, PARAGKES.AM],
  [/^(?:user|username|onoma_xristi|login|fullname)$/i, PARAGKES.ONOMA_XRISTI],
];

export class SfalmaScrub extends Error {
  constructor(minima) {
    super(minima);
    this.name = 'SfalmaScrub';
  }
}

function einai_placeholder(timi) {
  return typeof timi === 'string' && timi.startsWith('<<') && timi.endsWith('>>');
}

function antikathist_gnwstes(keimeno, times, placeholder) {
  if (typeof times !== 'string') {
    return keimeno;
  }
  const kathari = times.trim();
  if (kathari.length < ELACHISTO_MIKOS_TIMI_GNOSTI) {
    return keimeno;
  }
  return keimeno.split(kathari).join(placeholder);
}

export function krige_keimeno(keimeno, gnostes = {}) {
  let apotelesma = String(keimeno);

  apotelesma = antikathist_gnwstes(apotelesma, gnostes.kodikos, PARAGKES.KODIKOS);
  apotelesma = antikathist_gnwstes(apotelesma, gnostes.am, PARAGKES.AM);
  apotelesma = antikathist_gnwstes(apotelesma, gnostes.email, PARAGKES.EMAIL);
  apotelesma = antikathist_gnwstes(apotelesma, gnostes.onoma, PARAGKES.ONOMA_XRISTI);
  apotelesma = antikathist_gnwstes(apotelesma, gnostes.user_id, PARAGKES.USER_ID);

  apotelesma = apotelesma.replace(PROTYPOS_SET_COOKIE, (_, kefalida, onoma, _timi) =>
    einai_placeholder(_timi) ? `${kefalida}${onoma}=${_timi}` : `${kefalida}${onoma}=${PARAGKES.COOKIE}`
  );
  apotelesma = apotelesma.replace(PROTYPOS_COOKIE_KEFALIDA, (_, kefalida, zeiri) =>
    `${kefalida}${katharize_zeires(zeiri)}`
  );

  apotelesma = apotelesma.replace(PROTYPOS_SESSION, '$1=' + PARAGKES.SESSION_ID);
  apotelesma = apotelesma.replace(PROTYPOS_TOKEN, '$1=' + PARAGKES.TOKEN);
  apotelesma = apotelesma.replace(PROTYPOS_USER_ID, '$1=' + PARAGKES.USER_ID);
  apotelesma = apotelesma.replace(PROTYPOS_STOIKXEIA, '$1=' + PARAGKES.ONOMA_XRISTI);
  apotelesma = apotelesma.replace(PROTYPOS_KODIKOS, '$1=' + PARAGKES.KODIKOS);
  apotelesma = apotelesma.replace(PROTYPOS_BEARER, '$1 ' + PARAGKES.TOKEN);
  apotelesma = apotelesma.replace(PROTYPOS_JWT, PARAGKES.TOKEN);

  apotelesma = apotelesma.replace(PROTYPOS_EMAIL_HTML, '@');
  apotelesma = apotelesma.replace(PROTYPOS_EMAIL, PARAGKES.EMAIL);

  apotelesma = apotelesma.replace(PROTYPOS_AM_ETIKETIZED, (_match, arithmos) =>
    `${arithmetic_prefix(_match, arithmos)}${PARAGKES.AM}`
  );
  apotelesma = apotelesma.replace(PROTYPOS_AM, PARAGKES.AM);
  apotelesma = apotelesma.replace(PROTYPOS_IP, PARAGKES.IP);
  apotelesma = apotelesma.replace(PROTYPOS_HEX_SESSION_ID, PARAGKES.SESSION_ID);

  return apotelesma;
}

function arithmetic_prefix(olokliro, arithmos) {
  const thesi = olokliro.indexOf(arithmos);
  return thesi < 0 ? '' : olokliro.slice(0, thesi);
}

function katharize_zeires(zeiri) {
  return zeiri
    .split(';')
    .map((zeira) => {
      const parsed = /^(\s*)([^=\s]+)=([^;\s]*)(.*)$/.exec(zeira);
      if (parsed === null) {
        return zeira;
      }
      const prosf = parsed[1] ?? '';
      const onoma = parsed[2] ?? '';
      const timi = parsed[3] ?? '';
      const episkolop = parsed[4] ?? '';
      if (timi === '' || einai_placeholder(timi)) {
        return zeira;
      }
      return `${prosf}${onoma}=${PARAGKES.COOKIE}${episkolop}`;
    })
    .join(';');
}

function skrub_arxi(dedomena, gnostes) {
  if (typeof dedomena === 'string') {
    return krige_keimeno(dedomena, gnostes);
  }
  if (Array.isArray(dedomena)) {
    return dedomena.map((stoixeio) => skrub_arxi(stoixeio, gnostes));
  }
  if (typeof dedomena === 'object' && dedomena !== null) {
    const apotelesma = {};
    for (const [kleidi, timi] of Object.entries(dedomena)) {
      const skribikos = krige_keimeno(kleidi, gnostes);
      const lege = KLEIDIA_MYSTIKA.find(([protypos]) => protypos.test(skribikos));
      apotelesma[skribikos] = lege === undefined ? skrub_arxi(timi, gnostes) : lege[1];
    }
    return apotelesma;
  }
  return dedomena;
}

export async function skrub_arxeio(dedomena, gnostes = {}) {
  return skrub_arxi(dedomena, gnostes);
}

function katigories_leipseon(periexomeno, gnostes = {}) {
  const leaks = [];
  const prosthese = (kategoria, timi) => leaks.push({ kategoria, timi });

  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_EMAIL.source, 'g'))) {
    prosthese('email', match[0]);
  }
  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_AM_ETIKETIZED.source, 'gi'))) {
    prosthese('ΑΜ', match[1] ?? match[0]);
  }
  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_AM.source, 'g'))) {
    prosthese('ΑΜ', match[0]);
  }
  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_HEX_SESSION_ID.source, 'g'))) {
    prosthese('session id', match[0]);
  }
  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_SET_COOKIE.source, 'gi'))) {
    const timi = (match[3] ?? '').trim();
    if (timi !== '' && !einai_placeholder(timi)) {
      prosthese('cookie', `${match[2]}=${timi}`);
    }
  }
  for (const match of periexomeno.matchAll(new RegExp(PROTYPOS_JWT.source, 'g'))) {
    prosthese('token', match[0]);
  }

  for (const [plidio, placeholder] of Object.entries({ ...gnostes })) {
    if (typeof placeholder !== 'string') {
      continue;
    }
    const kathari = placeholder.trim();
    if (kathari.length >= ELACHISTO_MIKOS_TIMI_GNOSTI && periexomeno.includes(kathari)) {
      leaks.push({ kategoria: `γνωστή τιμή (${plidio})`, timi: `${kathari.slice(0, 2)}${ARXIO_ELLIPSIS}` });
    }
  }

  return leaks;
}

export function episkeps_to_scrub(periexomeno, gnostes = {}) {
  const leaks = katigories_leipseon(String(periexomeno), gnostes);
  if (leaks.length === 0) {
    return true;
  }
  const description = leaks
    .map(({ kategoria, timi }) => `${kategoria}: «${timi}»`)
    .join(', ');
  throw new SfalmaScrub(
    `ΜΗ ΑΠΟΔΕΚΤΟ — έμεινε PII στο αποτέλεσμα (${leaks.length}): ${description}`
  );
}

function metrises_periexomenou(periexomeno) {
  const metrises = {};
  for (const placeholder of Object.values(PARAGKES)) {
    const poses = periexomeno.split(placeholder).length - 1;
    if (poses > 0) {
      metrises[placeholder] = poses;
    }
  }
  return metrises;
}

export function parse_orismata(argv) {
  const orismata = { gnostes: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const epomeni = argv[i + 1];
    switch (arg) {
      case '--in':
        orismata.in = epomeni;
        i += 1;
        break;
      case '--out':
        orismata.out = epomeni;
        i += 1;
        break;
      case '--verify-only':
        orismata.verify_only = true;
        break;
      case '--onoma':
        orismata.gnostes.onoma = epomeni;
        i += 1;
        break;
      case '--email':
        orismata.gnostes.email = epomeni;
        i += 1;
        break;
      case '--am':
        orismata.gnostes.am = epomeni;
        i += 1;
        break;
      case '--kodikos':
        orismata.gnostes.kodikos = epomeni;
        i += 1;
        break;
      case '--user-id':
        orismata.gnostes.user_id = epomeni;
        i += 1;
        break;
      case '--help':
      case '-h':
        orismata.help = true;
        break;
      default:
        throw new SfalmaScrub(`Άγνωστη επιλογή: ${arg}`);
    }
  }
  return orismata;
}

function gnostes_apo_perivallon(perivallon) {
  return {
    onoma: perivallon[SYNDESMOI_GNOSTES.ONOMA] ?? perivallon[SYNDESMOI_GNOSTES.ONOMA_XRISTI],
    email: perivallon[SYNDESMOI_GNOSTES.EMAIL],
    am: perivallon[SYNDESMOI_GNOSTES.AM],
    kodikos: perivallon[SYNDESMOI_GNOSTES.KODIKOS],
    user_id: perivallon[SYNDESMOI_GNOSTES.USER_ID],
  };
}

const OXI_MIKRO = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

export async function main(argv = process.argv.slice(2), perivallon = process.env) {
  const orismata = parse_orismata(argv);

  if (orismata.help === true) {
    return [
      'Χρήση:',
      '  node scripts/scrub-fixtures.mjs --in <raw> --out <scrubbed> [γνωστές τιμές]',
      '  node scripts/scrub-fixtures.mjs --verify-only <file>',
      '',
      'Γνωστές τιμές από το περιβάλλον: ' + Object.values(SYNDESMOI_GNOSTES).join(', '),
      'Ή με σημαίες: --onoma --email --am --kodikos --user-id',
    ].join('\n');
  }

  if (typeof orismata.in !== 'string' || orismata.in === '') {
    throw new SfalmaScrub('Λείπει το --in <αρχείο>.');
  }

  const gnostes = { ...gnostes_apo_perivallon(perivallon), ...orismata.gnostes };
  const keimeno = await fs.readFile(orismata.in, 'utf8');

  if (orismata.verify_only === true) {
    episkeps_to_scrub(keimeno, gnostes);
    return `✓ καθαρό: ${orismata.in} (καμία υπολειπόμενη PII)`;
  }

  if (typeof orismata.out !== 'string' || orismata.out === '') {
    throw new SfalmaScrub('Λείπει το --out <αρχείο>.');
  }

  let apotelesma;
  let eidos;
  try {
    apotelesma = JSON.stringify(await skrub_arxeio(JSON.parse(keimeno), gnostes), null, 2);
    eidos = 'JSON';
  } catch {
    apotelesma = krige_keimeno(keimeno, gnostes);
    eidos = 'κείμενο/HTML';
  }

  episkeps_to_scrub(apotelesma, gnostes);

  await fs.writeFile(orismata.out, apotelesma.endsWith('\n') ? apotelesma : `${apotelesma}\n`, 'utf8');

  const metrises = Object.entries(metrises_periexomenou(apotelesma))
    .map(([placeholder, poses]) => `${placeholder}×${poses}`)
    .join(', ');
  return `✓ ${orismata.out} (${eidos}) — αντικαταστάσεις: ${metrises === '' ? 'καμία' : metrises}`;
}

if (OXI_MIKRO) {
  main()
    .then((eksodos) => {
      process.stdout.write(`${eksodos}\n`);
    })
    .catch((sfalma) => {
      process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
      process.exitCode = 1;
    });
}