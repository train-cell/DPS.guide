// ΜΗΝ ΤΡΕΧΕΤΑΙ ΑΠΟ AGENT — μόνο ο owner, τοπικά. Κατεβάζει ΕΝΑ αρχείο, χωρίς να το αποθηκεύσει.
import {
  aitima,
  cookie_keim,
  grapse_arxeio,
  krige_url,
  lekses_kefalides,
  morifi_kyriou,
  onomata_set_cookie,
  orismata,
  symvola_schimas,
  vasiko_url,
  KATHYSTERISI_METAXY_AITIMATON_MS,
} from './lib/sxedias.mjs';

const KANDIDA_DIADROMES = [
  '/courses/{KODIKOS}/document/',
  '/courses/{KODIKOS}/modules/document/',
  '/modules/document/?course={KODIKOS}',
];

async function main() {
  const args = orismata();
  const kodikos = typeof args.mathima === 'string' ? args.mathima : undefined;
  if (kodikos === undefined) {
    throw new Error('Χρειάζεται --mathima <ΚΩΔΙΚΟΣ_ΜΑΘΗΜΑΤΟΣ>.');
  }
  const riza = vasiko_url();
  const kefalides = { cookie: cookie_keim() };
  process.stdout.write(`# probe-document για το μάθημα ${kodikos}\n\n`);

  let vrya = typeof args.url === 'string' ? args.url : undefined;
  if (vrya === undefined) {
    process.stdout.write('## Ανακάλυψη URL ρίζας εγγράφων (⚠️ επαλήθευση)\n');
    for (const kandidatos of KANDIDA_DIADROMES) {
      const diadromi = `${riza}${kandidatos.replace('{KODIKOS}', kodikos)}`;
      const apantisi = await aitima(diadromi, { kefalides });
      process.stdout.write(`- ${apantisi.katastasi} ${krige_url(diadromi)}\n`);
      if (apantisi.katastasi === 200 && apantisi.bufe.byteLength > 0) {
        vrya = diadromi;
        process.stdout.write(`  ✓ πιθανή ρίζα (${morifi_kyriou(apantisi.keimeno)}, ${apantisi.bufe.byteLength} bytes)\n`);
        break;
      }
      await new Promise((lipsi) => setTimeout(lipsi, KATHYSTERISI_METAXY_AITIMATON_MS));
    }
    if (vrya === undefined) {
      throw new Error('Καμία 200 από τις υποψήφιες διαδρομές. Δώσε --url <πλήρης URL> για να προχωρήσει.');
    }
  }

  process.stdout.write(`\n## Βήμα 1 — ρίζα εγγράφων\n`);
  const riza_eg = await aitima(vrya, { kefalides });
  process.stdout.write(`- ${riza_eg.katastasi} ${krige_url(vrya)}\n`);
  for (const [onoma, timi] of Object.entries(lekses_kefalides(riza_eg))) {
    process.stdout.write(`- ${onoma}: ${timi}\n`);
  }
  for (const c of onomata_set_cookie(riza_eg)) {
    process.stdout.write(`- Set-Cookie ${c.onoma} (μήκος ${c.mikos_timis})\n`);
  }
  const symvola = symvola_schimas(riza_eg.keimeno);
  process.stdout.write(`- σύνδεσμοι: ${symvola.length}\n`);
  for (const s of symvola.slice(0, 100)) {
    process.stdout.write(`  · ${krige_url(s.href)}\n`);
  }

  const ypofakelos = symvola.find((s) => /\//.test(s.href.split('document/')[1] ?? '') && !/\.[a-z0-9]{2,5}$/i.test(s.href));
  if (ypofakelos === undefined) {
    process.stdout.write('\n## Βήμα 2 — δεν βρέθηκε υποφάκελος, παραλείπεται\n');
  } else {
    process.stdout.write(`\n## Βήμα 2 — υποφάκελος ${krige_url(ypofakelos.href)}\n`);
    const yp = await aitima(new URL(ypofakelos.href, vrya).toString(), { kefalides });
    process.stdout.write(`- ${yp.katastasi} (${yp.bufe.byteLength} bytes)\n`);
    for (const s of symvola_schimas(yp.keimeno).slice(0, 100)) {
      process.stdout.write(`  · ${krige_url(s.href)}\n`);
    }
    await new Promise((lipsi) => setTimeout(lipsi, KATHYSTERISI_METAXY_AITIMATON_MS));
  }

  process.stdout.write('\n## Βήμα 3 — ένα αρχείο (headers + πρώτοι 64 bytes, χωρίς αποθήκευση)\n');
  const arxeio = symvola.find((s) => /\.(pdf|pptx?|docx?|zip|txt|png|jpe?g)$/i.test(s.href));
  if (arxeio === undefined) {
    process.stdout.write('- ΚΑΜΕΝΑ αρχείο με γνωστή επέκταση στη ρίζα\n');
  } else {
    const url_arxeiou = new URL(arxeio.href, vrya).toString();
    const kefalida = await aitima(url_arxeiou, { kefalides, methodos: 'HEAD' });
    process.stdout.write(`- HEAD ${krige_url(url_arxeiou)}\n`);
    process.stdout.write(`- κατάσταση: ${kefalida.katastasi}\n`);
    for (const onoma of ['content-type', 'content-length', 'content-disposition', 'last-modified', 'etag']) {
      process.stdout.write(`- ${onoma}: ${kefalida.kefalides.get(onoma) ?? '(λείπει)'}\n`);
    }
    const merikos = await aitima(url_arxeiou, { kefalides });
    process.stdout.write(`- GET κατάσταση: ${merikos.katastasi}· ${merikos.bufe.byteLength} bytes\n`);
    process.stdout.write(`- content-type: ${merikos.kefalides.get('content-type') ?? '(λείπει)'}\n`);
    process.stdout.write(`- content-length: ${merikos.kefalides.get('content-length') ?? '(λείπει)'}\n`);
    process.stdout.write(`- last-modified: ${merikos.kefalides.get('last-modified') ?? '(λείπει)'}\n`);
    process.stdout.write(`- etag: ${merikos.kefalides.get('etag') ?? '(λείπει)'}\n`);
    process.stdout.write(`- content-disposition: ${merikos.kefalides.get('content-disposition') ?? '(λείπει)'}\n`);
    process.stdout.write(`- χρειάζεται Cookie header για το download: ${merikos.katastasi === 200 ? 'όχι' : 'ΝΑΙ'}\n`);
  }

  const diadromi = await grapse_arxeio('document.html', riza_eg.keimeno);
  process.stdout.write(`\nΑποθηκεύτηκε το ακαθάριστο: ${diadromi}\n`);
  process.stdout.write(
    'Καθάρισέ το πριν το commit:\n  node scripts/scrub-fixtures.mjs --in ' +
      `${diadromi} --out fixtures/eclass/scrubbed/document.html\n`
  );
}

main().catch((sfalma) => {
  process.stderr.write(`✗ ${sfalma instanceof Error ? sfalma.message : String(sfalma)}\n`);
  process.exitCode = 1;
});