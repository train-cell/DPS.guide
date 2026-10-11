// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά. Δεν τυπώνει ΠΟΤΕ τιμή token.
import {
  aitima,
  krige_url,
  lekses_kefalides,
  morifi_kyriou,
  onomata_set_cookie,
  onomata_stixion,
  orismata,
  paremvoloi_arxeiou,
  vasiko_url,
  KATHYSTERISI_METAXY_AITIMATON_MS,
} from './lib/sxedias.mjs';

const ORA_MLOGIN = '/mobile/mlogin.php';
const ORA_MTOKEN = '/mobile/mtoken.php';
const ORA_MCOURSES = '/mobile/mcourses.php';
const ORA_MUNITS = '/mobile/munits.php';
const ORA_MPORTFOLIO = '/mobile/mportfolio.php';

const PROTYPOS_TOKEN = /\b([a-z0-9_]*(?:token|key|secret|jwt)[a-z0-9_]*)\s*[=:]\s*"?([A-Za-z0-9._~+/=-]{6,})"?/gi;

function analysise_token(keimeno) {
  const found = [...keimeno.matchAll(new RegExp(PROTYPOS_TOKEN.source, 'gi'))];
  return found.map((m) => ({
    pedio: m[1],
    mikos_timis: (m[2] ?? '').length,
    timi: '<<SCRUBBED>>',
  }));
}

async function main() {
  const args = orismata();
  const riza = vasiko_url();
  const username = typeof args.onoma === 'string' ? args.onoma : process.env.ECLASS_USERNAME;
  const paramaetroi = new URLSearchParams();
  if (typeof username === 'string' && username !== '') {
    paramaetroi.set(typeof args.parametro_onoma === 'string' ? args.parametro_onoma : 'uname', username);
  }
  if (typeof args.token === 'string') {
    paramaetroi.set(typeof args.parametro_token === 'string' ? args.parametro_token : 'token', args.token);
  }
  process.stdout.write('# probe-mobile (⚠️ ΟΛΑ ΤΑ ΠΑΡΑΜΕΤΡΑ/ΠΕΔΙΑ ΕΙΝΑΙ ΕΠΑΛΗΘΕΥΣΗ)\n\n');

  const stichia = [];
  for (const ora of [ORA_MLOGIN, ORA_MTOKEN, ORA_MCOURSES, ORA_MUNITS, ORA_MPORTFOLIO]) {
    const url = `${riza}${ora}${paramaetroi.size > 0 ? `?${paramaetroi.toString()}` : ''}`;
    const apantisi = await aitima(url, {
      kefalides: typeof args.cookie === 'string' ? { cookie: args.cookie } : {},
    });
    stichia.push({
      url,
      katastasi: apantisi.katastasi,
      morfi: morifi_kyriou(apantisi.keimeno),
      megethos: apantisi.bufe.byteLength,
    });
    process.stdout.write(`## ${krige_url(url)}\n`);
    process.stdout.write(`- κατάσταση: ${apantisi.katastasi}\n`);
    process.stdout.write(`- μορφή: ${morifi_kyriou(apantisi.keimeno)}\n`);
    process.stdout.write(`- μέγεθος: ${apantisi.bufe.byteLength} bytes\n`);
    for (const [onoma, timi] of Object.entries(lekses_kefalides(apantisi))) {
      process.stdout.write(`- ${onoma}: ${timi}\n`);
    }
    for (const c of onomata_set_cookie(apantisi)) {
      process.stdout.write(`- Set-Cookie ${c.onoma} (μήκος ${c.mikos_timis}; ${c.attributes.join('; ') || 'χωρίς attributes'})\n`);
    }
    for (const [onoma, timi] of Object.entries(paremvoloi_arxeiou(url))) {
      process.stdout.write(`- παράμετρος ${onoma}=${krige_url(timi)}\n`);
    }
    const tokens = analysise_token(apantisi.keimeno);
    if (tokens.length > 0) {
      process.stdout.write(`- πεδία token (τιμές ΧΩΡΙΣ ΕΚΤΥΠΩΣΗ): ${JSON.stringify(tokens)}\n`);
    }
    if (apantisi.katastasi === 200) {
      process.stdout.write(`- στοιχεία: ${onomata_stixion(apantisi.keimeno).slice(0, 40).join(', ')}\n`);
      process.stdout.write(`- αρχή: ${apantisi.keimeno.slice(0, 400).replace(/\s+/g, ' ')}\n`);
    }
    process.stdout.write('\n');
    await new Promise((lipsi) => setTimeout(lipsi, KATHYSTERISI_METAXY_AITIMATON_MS));
  }

  process.stdout.write('## Σύνοψη\n');
  for (const s of stichia) {
    process.stdout.write(`- ${s.katastasi} ${s.morfi} ${s.megethos}B ${krige_url(s.url)}\n`);
  }
  process.stdout.write(
    '\n⚠️ ΕΠΑΛΗΘΕΥΣΗ: τα ονόματα παραμέτρων/πεδίων/στοιχείων του mobile API ΔΕΝ προέρχονται από τεκμηριωμένη πηγή.\n' +
      'Γράψε στο docs/eclass-protocol.md ΜΟΝΟ ό,τι επιβεβαιώθηκε.\n'
  );
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});