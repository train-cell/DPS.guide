// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά. Μία μόνο προσπάθεια σύνδεσης ανά εκτέλεση.
import {
  akolouthisi,
  aitima,
  grapse_arxeio,
  krige_url,
  lekses_kefalides,
  paremvoloi_arxeiou,
  pedia_schimas,
  perisodika_sindesis,
  symvola_schimas,
  vasiko_url,
  XRONOS_ORIO_MS,
} from './lib/sxedias.mjs';

const ORA_SYNDEISIS = '/main/login_form.php';

async function main() {
  process.stdout.write(
    '# probe-syndesi (⚠️ ΜΙΑ ΜΟΝΟ ΠΡΟΣΠΑΘΕΙΑ — λάθος κωδικός = καμία επανάληψη, §8)\n\n'
  );
  const { onoma, kodikos } = perisodika_sindesis();
  const riza = vasiko_url();

  process.stdout.write(`## Βήμα 1 — GET ${ORA_SYNDEISIS} (ανακάλυψη πεδίων)\n`);
  const arxiki = await aitima(riza + ORA_SYNDEISIS);
  process.stdout.write(`- κατάσταση: ${arxiki.katastasi}\n`);
  const pedia = pedia_schimas(arxiki.keimeno);
  process.stdout.write(`- πεδία: ${pedia.map((p) => `${p.onoma}:${p.typos}`).join(', ') || 'κανένα'}\n`);
  for (const symvolo of symvola_schimas(arxiki.keimeno)) {
    if (/cas|auth|sso/i.test(symvolo.href)) {
      process.stdout.write(`- CAS/SSO σύνδεσμος: ${symvolo.href}\n`);
    }
  }
  for (const [onoma_para, timi] of Object.entries(paremvoloi_arxeiou(arxiki.teliko_url))) {
    process.stdout.write(`- παράμετρος ${onoma_para}=${krige_url(timi)}\n`);
  }

  const pedio_kodikou = pedia.find((p) => p.typos === 'password');
  const pedio_onomatos =
    pedia.find((p) => p.typos !== 'password' && p.onoma !== null && p.typos !== 'hidden') ??
    pedia.find((p) => p.onoma !== null);
  if (pedio_kodikou === undefined || pedio_onomatos === undefined) {
    throw new Error('Δεν βρέθηκαν πεδία username/password — σταμάτησα ΠΡΙΝ το POST.');
  }

  const soma = { [pedio_onomatos.onoma]: onoma, [pedio_kodikou.onoma]: kodikos };
  for (const pedio of pedia) {
    if (pedio.typos === 'hidden' && pedio.onoma !== null && typeof pedio.timi === 'string') {
      soma[pedio.onoma] = pedio.timi;
    }
  }

  process.stdout.write(`\n## Βήμα 2 — POST ${ORA_SYNDEISIS} (ΜΙΑ προσπάθεια)\n`);
  process.stdout.write(`- πεδία POST: ${Object.keys(soma).join(', ')} (τιμές κωδικού/username: ΧΩΡΙΣ ΕΚΤΥΠΩΣΗ)\n`);

  const { apantisi, chain } = await akolouthisi(riza + ORA_SYNDEISIS, {
    methodos: 'POST',
    soma_forma: soma,
  });

  process.stdout.write(`\n## Βήμα 3 — καταγραφή 30x και Set-Cookie (ΟΝΟΜΑΤΑ ΜΟΝΟ)\n`);
  for (const bima of chain) {
    process.stdout.write(
      `- ${bima.bima}. ${bima.katastasi} ${bima.url}${bima.location === null ? '' : ` → ${bima.location}`}\n`
    );
    for (const cookie of bima.cookies) {
      process.stdout.write(
        `     Set-Cookie ${cookie.onoma} (μήκος ${cookie.mikos_timis}; ${cookie.attributes.join('; ') || 'χωρίς attributes'})\n`
      );
    }
  }
  for (const [kefalida, timi] of Object.entries(lekses_kefalides(apantisi))) {
    process.stdout.write(`- ${kefalida}: ${timi}\n`);
  }
  const epanodosi = apantisi.keimeno.includes(pedio_kodikou.onoma);
  process.stdout.write(
    `- η τελική σελίδα ξαναδείχνει φόρμα σύνδεσης: ${epanodosi ? 'ΝΑΙ → πιθανόν λάθος κωδικός' : 'ΟΧΙ → πιθανόν επιτυχία'}\n`
  );
  process.stdout.write(`- User-Agent: spoudes/…· χρονικό όριο ${XRONOS_ORIO_MS} ms\n`);
  process.stdout.write('- Καμία τιμή cookie ή κωδικού δεν εκτυπώθηκε.\n');

  const diadromi = await grapse_arxeio('syndesi-teliki.html', apantisi.keimeno);
  process.stdout.write(`\nΑποθηκεύτηκε το ακαθάριστο: ${diadromi}\n`);
  process.stdout.write(
    'Καθάρισέ το πριν το commit:\n  node scripts/scrub-fixtures.mjs --in ' +
      `${diadromi} --out fixtures/eclass/scrubbed/syndesi-teliki.html\n`
  );
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});