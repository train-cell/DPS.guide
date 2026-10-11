// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά, με cookie του browser του.
import {
  akolouthisi,
  cookie_keim,
  grapse_arxeio,
  krige_url,
  lekses_kefalides,
  morifi_kyriou,
  onomata_stixion,
  orismata,
  symvola_schimas,
  vasiko_url,
  KATHYSTERISI_METAXY_AITIMATON_MS,
} from './lib/sxedias.mjs';

const ORA_PORTFOLIO = '/main/portfolio.php';

async function main() {
  const args = orismata();
  const riza = vasiko_url();
  const cookie = cookie_keim();
  const url = `${riza}${ORA_PORTFOLIO}`;

  process.stdout.write('# probe-portfolio\n# GET ' + url + '\n\n');

  const { apantisi, chain } = await akolouthisi(url, { kefalides: { cookie } });
  for (const bima of chain) {
    process.stdout.write(
      `- ${bima.bima}. ${bima.katastasi} ${bima.url}${bima.location === null ? '' : ` → ${bima.location}`}\n`
    );
    for (const c of bima.cookies) {
      process.stdout.write(`     Set-Cookie ${c.onoma} (μήκος ${c.mikos_timis})\n`);
    }
  }
  process.stdout.write(`\n## Απάντηση\n- κατάσταση: ${apantisi.katastasi}\n- μορφή: ${morifi_kyriou(apantisi.keimeno)}\n`);
  for (const [onoma, timi] of Object.entries(lekses_kefalides(apantisi))) {
    process.stdout.write(`- ${onoma}: ${timi}\n`);
  }

  process.stdout.write(`\n## Σύνδεσμοι μαθημάτων (⚠️ heuristic· επιβεβαίωσε τον κώδικα και τον τίτλο)\n`);
  const symvola = symvola_schimas(apantisi.keimeno);
  const mathimata = symvola.filter(
    (s) => /course/i.test(s.href) && !/logout|user|tools|help|calendar/i.test(s.href)
  );
  if (mathimata.length === 0) {
    process.stdout.write('- ΚΑΜΕΝΑ σύνδεσμος course/· η σελίδα μπορεί να είναι άλλη (δες raw)\n');
  }
  for (const mathima of mathimata) {
    process.stdout.write(`- ${krige_url(mathima.href)}\n`);
  }

  process.stdout.write(`\n## Όλοι οι σύνδεσμοι (για πλήρη εικόνα, ${symvola.length})\n`);
  for (const s of symvola.slice(0, 200)) {
    process.stdout.write(`- ${krige_url(s.href)}\n`);
  }

  if (typeof args.dump === 'string') {
    process.stdout.write(`\n## Στοιχεία HTML\n${onomata_stixion(apantisi.keimeno).join(', ')}\n`);
  }

  const diadromi = await grapse_arxeio('portfolio.html', apantisi.keimeno);
  process.stdout.write(`\nΑποθηκεύτηκε το ακαθάριστο: ${diadromi}\n`);
  process.stdout.write(
    'Καθάρισέ το πριν το commit:\n  node scripts/scrub-fixtures.mjs --in ' +
      `${diadromi} --out fixtures/eclass/scrubbed/portfolio.html\n`
  );
  await new Promise((lipsi) => setTimeout(lipsi, KATHYSTERISI_METAXY_AITIMATON_MS));
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});