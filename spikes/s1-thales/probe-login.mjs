// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά, με δικά του credentials.
import {
  aitima,
  grapse_arxeio,
  krige_url,
  lekses_kefalides,
  onomata_set_cookie,
  paremvoloi_formas,
  paremvoloi_arxeiou,
  pedia_schimas,
  symvola_schimas,
  vasiko_url,
} from './lib/sxedias.mjs';

const ORA_SYNDEISIS = '/main/login_form.php';

async function main() {
  const riza = vasiko_url();
  const url = `${riza}${ORA_SYNDEISIS}`;
  process.stdout.write(`# probe-login\n# GET ${url}\n\n`);

  const apantisi = await aitima(url);
  process.stdout.write(`## Απάντηση\n`);
  process.stdout.write(`- κατάσταση: ${apantisi.katastasi}\n`);
  process.stdout.write(`- final URL: ${krige_url(apantisi.teliko_url)}\n`);
  for (const [onoma, timi] of Object.entries(lekses_kefalides(apantisi))) {
    process.stdout.write(`- ${onoma}: ${timi}\n`);
  }
  const cookies = onomata_set_cookie(apantisi);
  process.stdout.write(`- Set-Cookie (ΟΝΟΜΑΤΑ ΜΟΝΟ, χωρίς τιμές): ${cookies.map((c) => c.onoma).join(', ') || 'κανένα'}\n`);
  for (const cookie of cookies) {
    process.stdout.write(`  - ${cookie.onoma} (μήκος τιμής ${cookie.mikos_timis}; ${cookie.attributes.join('; ')})\n`);
  }

  const keimeno = apantisi.keimeno;
  process.stdout.write(`\n## Φόρμες\n`);
  for (const forma of paremvoloi_formas(keimeno)) {
    process.stdout.write(`- action=${forma.action ?? '(κανένα)'} method=${forma.method}\n`);
  }

  process.stdout.write(`\n## Πεδία φόρμας (όνομα, τύπος, τιμή μόνο αν δεν είναι μυστική)\n`);
  const pedia = pedia_schimas(keimeno);
  if (pedia.length === 0) {
    process.stdout.write('- κανένα <input>\n');
  }
  for (const pedio of pedia) {
    process.stdout.write(`- name=${pedio.onoma ?? '(κανένα)'} type=${pedio.typos} id=${pedio.epistemes ?? '-'} value=${pedio.timi ?? '-'}\n`);
  }

  process.stdout.write(`\n## Σύνδεσμοι (ενδιαφέρουν: CAS / auth)\n`);
  for (const symvolo of symvola_schimas(keimeno)) {
    if (/cas|auth|sso|login|modules/i.test(symvolo.href)) {
      process.stdout.write(`- ${symvolo.href}\n`);
    }
  }

  process.stdout.write(`\n## Παράμετροι URL\n`);
  for (const [onoma, timi] of Object.entries(paremvoloi_arxeiou(apantisi.teliko_url))) {
    process.stdout.write(`- ${onoma}=${krige_url(timi)}\n`);
  }

  const diadromi = await grapse_arxeio('login_form.html', keimeno);
  process.stdout.write(`\nΑποθηκεύτηκε το ακαθάριστο: ${diadromi}\n`);
  process.stdout.write(
    `Καθάρισε το πριν το commit:\n  node scripts/scrub-fixtures.mjs --in ${diadromi} --out fixtures/eclass/scrubbed/login_form.html\n`
  );
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});