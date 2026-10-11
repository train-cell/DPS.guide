// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά, με cookie του browser του.
import {
  aitima,
  cookie_keim,
  krige_url,
  lekses_kefalides,
  morifi_kyriou,
  onomata_stixion,
  orismata,
  vasiko_url,
  KATHYSTERISI_METAXY_AITIMATON_MS,
} from './lib/sxedias.mjs';

const KANDIDA_RSS = [
  '/courses/{KODIKOS}/modules/announcements/rss.php',
  '/modules/announcements/rss.php?course={KODIKOS}',
  '/modules/announcements/rss.php?c={KODIKOS}',
];

async function main() {
  const args = orismata();
  const kodikos = typeof args.mathima === 'string' ? args.mathima : undefined;
  if (kodikos === undefined) {
    throw new Error('Χρειάζεται --mathima <ΚΩΔΙΚΟΣ_ΜΑΘΗΜΑΤΟΣ>.');
  }
  const riza = vasiko_url();
  const kefalides = { cookie: cookie_keim() };
  process.stdout.write(`# probe-rss για το μάθημα ${kodikos} (⚠️ επαλήθευση)\n\n`);

  for (const kandidatos of KANDIDA_RSS) {
    const diadromi = `${riza}${kandidatos.replace('{KODIKOS}', kodikos)}`;
    const apantisi = await aitima(diadromi, { kefalides });
    process.stdout.write(`## ${krige_url(diadromi)}\n`);
    process.stdout.write(`- κατάσταση: ${apantisi.katastasi}\n`);
    process.stdout.write(`- μορφή: ${morifi_kyriou(apantisi.keimeno)}\n`);
    process.stdout.write(`- μέγεθος: ${apantisi.bufe.byteLength} bytes\n`);
    for (const [onoma, timi] of Object.entries(lekses_kefalides(apantisi))) {
      process.stdout.write(`- ${onoma}: ${timi}\n`);
    }
    if (apantisi.katastasi === 200) {
      process.stdout.write(`- στοιχεία: ${onomata_stixion(apantisi.keimeno).slice(0, 40).join(', ')}\n`);
      const proedroi = apantisi.keimeno.slice(0, 400).replace(/\s+/g, ' ');
      process.stdout.write(`- αρχή περιεχομένου: ${proedroi}\n`);
      process.stdout.write(
        '- τίτλοι/στοιχεία <item>: ' +
          `${(apantisi.keimeno.match(/<item[\s>]/gi) ?? []).length}· χρειάζεται token: ${/token=/i.test(kandidatos) ? 'ναι' : 'άγνωστο'}\n`
      );
    }
    process.stdout.write('\n');
    await new Promise((lipsi) => setTimeout(lipsi, KATHYSTERISI_METAXY_AITIMATON_MS));
  }

  process.stdout.write(
    'Σημείωση: το RSS σε κλειστό μάθημα και το αν χρειάζεται token είναι ⚠️ επαλήθευση· γράψε το αποτέλεσμα στο docs/eclass-protocol.md\n'
  );
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});