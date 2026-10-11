import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EDOSI = process.env.SPOUDES_EDOSI ?? '0.1.0';
export const XRONOS_ORIO_MS = Number(process.env.SPOUDES_XRONOS_ORIO_MS ?? 20000);
export const KATHYSTERISI_METAXY_AITIMATON_MS = 500;
export const MEGISTES_ANAKATEUTHINSEIS = 5;
export const VASIKO_PROTIREDEF = 'https://thales.cs.unipi.gr';
export const FAKELOS_RAW = 'fixtures/eclass/raw';

export const KEFALIDES_ASFALEIS = [
  'content-type',
  'content-length',
  'content-disposition',
  'last-modified',
  'etag',
  'location',
  'expires',
  'set-cookie-names',
];

export class SfalmaProbe extends Error {
  constructor(minima) {
    super(minima);
    this.name = 'SfalmaProbe';
  }
}

const PROTYPOS_MYSTIKES_PARAM = /\b(sessionid|session_id|token|access_token|uid|user_id|PHPSESSID)=([^&;]+)/gi;

export function vasiko_url() {
  return (process.env.ECLASS_BASE_URL ?? VASIKO_PROTIREDEF).replace(/\/+$/, '');
}

export function to_rizomonos(timi) {
  return String(timi).replace(/^.*?(?:\/main\/|\/modules\/|\/courses\/|\/)/, '');
}

export function krige_url(url) {
  return String(url).replace(PROTYPOS_MYSTIKES_PARAM, '$1=<<SCRUBBED>>');
}

export function cookie_keim() {
  const timi = process.env.ECLASS_COOKIE;
  if (typeof timi !== 'string' || timi.trim() === '') {
    throw new SfalmaProbe(
      'Λείπει το ECLASS_COOKIE. Αντιγράψε το Cookie header από τον browser σου (owner only).'
    );
  }
  return timi.trim();
}

export function perisodika_sindesis() {
  const onoma = process.env.ECLASS_USERNAME ?? process.env.SPOUDES_USER;
  const kodikos = process.env.ECLASS_PASSWORD ?? process.env.SPOUDES_PASS;
  if (!onoma || !kodikos) {
    throw new SfalmaProbe('Λείπει ECLASS_USERNAME/ECLASS_PASSWORD (ή SPOUDES_USER/SPOUDES_PASS).');
  }
  return { onoma, kodikos };
}

export function user_agent() {
  return `spoudes/${EDOSI} (+spike s1-thales)`;
}

export function cho(nr) {
  return new Promise((lipsi) => setTimeout(lipsi, nr));
}

export async function aitima(url, epiloges = {}) {
  const kefalides = {
    'user-agent': user_agent(),
    accept: '*/*',
    ...(epiloges.kefalides ?? {}),
  };
  const parastasi = {
    method: epiloges.methodos ?? 'GET',
    headers: kefalides,
    redirect: epiloges.akolouthise === true ? 'follow' : 'manual',
    signal: AbortSignal.timeout(XRONOS_ORIO_MS),
  };
  if (epiloges.soma_forma !== undefined) {
    parastasi.body = new URLSearchParams(epiloges.soma_forma);
    kefalides['content-type'] = 'application/x-www-form-urlencoded';
  }
  if (epiloges.soma_dyadiko !== undefined) {
    parastasi.body = epiloges.soma_dyadiko;
  }

  const ap = await fetch(url, parastasi);
  const bufe = Buffer.from(await ap.arrayBuffer());
  return {
    katastasi: ap.status,
    kefalides: ap.headers,
    teliko_url: ap.url,
    bufe,
    keimeno: bufe.toString('utf8'),
  };
}

export function onomata_set_cookie(apantisi) {
  const zires = apantisi.kefalides.getSetCookie?.() ?? [];
  if (Array.isArray(zires) && zires.length > 0) {
    return zires.map(krige_cookie_ena);
  }
  const enia = apantisi.kefalides.get('set-cookie');
  return typeof enia === 'string' && enia !== '' ? [krige_cookie_ena(enia)] : [];
}

export function pliro_cookie_jar(apantisi, jar) {
  const zires = apantisi.kefalides.getSetCookie?.() ?? [];
  const raw = zires.length > 0 ? zires : typeof apantisi.kefalides.get('set-cookie') === 'string' ? [apantisi.kefalides.get('set-cookie')] : [];
  for (const zira of raw) {
    const merides = String(zira).split(';').map((m) => m.trim());
    const prwti = merides[0] ?? '';
    const thesi = prwti.indexOf('=');
    if (thesi > 0) {
      jar.set(prwti.slice(0, thesi), prwti.slice(thesi + 1));
    }
  }
  return jar;
}

export function keimeno_cookie(jar) {
  return [...jar.entries()].map(([onoma, timi]) => `${onoma}=${timi}`).join('; ');
}

function krige_cookie_ena(zira) {
  const merides = zira.split(';').map((m) => m.trim());
  const prwti = merides[0] ?? '';
  const thesi = prwti.indexOf('=');
  const onoma = thesi < 0 ? prwti : prwti.slice(0, thesi);
  const timi = thesi < 0 ? '' : prwti.slice(thesi + 1);
  return {
    onoma,
    mikos_timis: timi.length,
    attributes: merides.slice(1),
  };
}

export function lekses_kefalides(apantisi, onomata = KEFALIDES_ASFALEIS) {
  const apotelesma = {};
  for (const onoma of onomata) {
    const timi = apantisi.kefalides.get(onoma);
    if (timi !== null && timi !== undefined && timi !== '') {
      apotelesma[onoma] = timi;
    }
  }
  if (apotelesma.location !== undefined) {
    apotelesma.location = krige_url(apotelesma.location);
  }
  return apotelesma;
}

export async function akolouthisi(url, epiloges = {}, chain = []) {
  const jar = epiloges.jar ?? new Map();
  let trexomeno = url;
  for (let bima = 0; bima <= MEGISTES_ANAKATEUTHINSEIS; bima += 1) {
    const kefalides = { ...(epiloges.kefalides ?? {}) };
    if (jar.size > 0) {
      kefalides.cookie = keimeno_cookie(jar);
    }
    const apantisi = await aitima(trexomeno, { ...epiloges, kefalides });
    const cookies = onomata_set_cookie(apantisi);
    pliro_cookie_jar(apantisi, jar);
    chain.push({
      bima: bima + 1,
      katastasi: apantisi.katastasi,
      url: krige_url(trexomeno),
      location: lekses_kefalides(apantisi, ['location']).location ?? null,
      cookies,
      content_type: apantisi.kefalides.get('content-type') ?? null,
    });
    if (apantisi.katastasi >= 300 && apantisi.katastasi < 400) {
      const epomeni = apantisi.kefalides.get('location');
      if (typeof epomeni !== 'string' || epomeni === '') {
        return { apantisi, chain, jar };
      }
      trexomeno = new URL(epomeni, trexomeno).toString();
      if (bima < MEGISTES_ANAKATEUTHINSEIS) {
        await cho(KATHYSTERISI_METAXY_AITIMATON_MS);
      }
      continue;
    }
    return { apantisi, chain, jar };
  }
  throw new SfalmaProbe('Πολλές ανακατευθύνσεις — σταμάτησε για ασφάλεια.');
}

const PROTYPOS_FORMA = /<form\b([^>]*)>/gi;
const PROTYPOS_PEDIO = /<input\b([^>]*)>/gi;
const PROTYPOS_GRAMMI = /<(?:a|button)\b([^>]*)>/gi;
const PROTYPOS_SYMBOLEION = /([\w-]+)\s*=\s*"([^"]*)"/g;
const PROTYPOS_MYSTIKES_PEDIO = /(?:pass|token|secret|session|csrf|authenticity)/i;

export function paremvoloi_formas(keimeno) {
  const forms = [];
  for (const match of keimeno.matchAll(PROTYPOS_FORMA)) {
    forms.push({
      action: attribute(match[1], 'action'),
      method: (attribute(match[1], 'method') ?? 'get').toLowerCase(),
    });
  }
  return forms;
}

export function pedia_schimas(keimeno) {
  const pedia = [];
  for (const match of keimeno.matchAll(PROTYPOS_PEDIO)) {
    const onoma = attribute(match[1], 'name');
    const typos = (attribute(match[1], 'type') ?? 'text').toLowerCase();
    pedia.push({
      onoma,
      typos,
      epistemes: attribute(match[1], 'id'),
      timi: onoma !== null && PROTYPOS_MYSTIKES_PEDIO.test(onoma) ? '<<SCRUBBED>>' : attribute(match[1], 'value'),
    });
  }
  return pedia;
}

export function symvola_schimas(keimeno) {
  const symvola = [];
  for (const match of keimeno.matchAll(PROTYPOS_GRAMMI)) {
    const href = attribute(match[1], 'href');
    if (href !== null && href !== '') {
      symvola.push({ href: krige_url(href) });
    }
  }
  return symvola;
}

export function attribute(imeres, onoma) {
  const protypos = new RegExp(`\\b${onoma}\\s*=\\s*"([^"]*)"`, 'i');
  const protypos2 = new RegExp(`\\b${onoma}\\s*=\\s*'([^']*)'`, 'i');
  const found = protypos.exec(imeres) ?? protypos2.exec(imeres);
  if (found === null) {
    const xoris = new RegExp(`\\b${onoma}\\s*=\\s*([^\\s"'>]+)`, 'i').exec(imeres);
    return xoris === null ? null : xoris[1];
  }
  return found[1];
}

export function paremvoloi_arxeiou(url) {
  const parsed = new URL(url);
  return Object.fromEntries(parsed.searchParams.entries());
}

export function onomata_stixion(html) {
  const onomata = new Set();
  for (const match of html.matchAll(/<\/?([a-zA-Z][\w:-]*)/g)) {
    onomata.add(match[1]);
  }
  return [...onomata].slice(0, 60);
}

export function morifi_kyriou(html) {
  const kathari = html.trimStart();
  if (kathari.startsWith('{') || kathari.startsWith('[')) {
    return 'JSON';
  }
  if (kathari.startsWith('<')) {
    return onomata_stixion(kathari).includes('rss') || kathari.includes('<rss') ? 'RSS/XML' : 'HTML/XML';
  }
  return 'άγνωστο';
}

export function periexei_forma_sindesis(keimeno) {
  return /action\s*=\s*["']?[^"'>]*login/i.test(keimeno) || /name\s*=\s*["']?password/i.test(keimeno);
}

export async function grapse_arxeio(nazom, periexomeno) {
  const riza = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)), FAKELOS_RAW);
  await fs.mkdir(riza, { recursive: true });
  const diadromi = path.join(riza, nazom);
  await fs.writeFile(diadromi, periexomeno, 'utf8');
  return diadromi;
}

export function orismata(argv = process.argv.slice(2)) {
  const apotelesma = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const epomeni = argv[i + 1];
    if (epomeni === undefined || epomeni.startsWith('--')) {
      apotelesma[arg.slice(2)] = true;
      continue;
    }
    apotelesma[arg.slice(2)] = epomeni;
    i += 1;
  }
  return apotelesma;
}

export function tikkei(timi) {
  return typeof timi === 'string' && timi !== '' ? timi : undefined;
}