#!/usr/bin/env node
/**
 * Patch του iOS Info.plist ώστε ο φάκελος Documents/ να είναι ορατό στο Files app.
 * Προσθέτει/διορθώνει τα UIFileSharingEnabled και LSSupportsOpeningDocumentsInPlace.
 * Τρέχει απευθείας με node στο macOS runner: node scripts/ios/patch-plist.mjs <path-to-Info.plist>
 */
import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const KLEIDIA = ['UIFileSharingEnabled', 'LSSupportsOpeningDocumentsInPlace'];
const TIMI_TRUE = '<true/>';
const ESOXI = '\t';
const MNYMA_XRISIS = 'Χρήση: node scripts/ios/patch-plist.mjs <path-to-Info.plist>';

/**
 * Regex για την τιμή που ακολουθεί ένα <key>: αυτοκλειόμενη (<false/>, <true/>,
 * <string/>) ή ανοιχτή/κλειστή στο ίδιο σημείο (<string>en</string>).
 */
function typos_timis(kleydi) {
  return new RegExp(`(<key>${kleydi}</key>)(\\s*)<(?:[a-zA-Z][^>]*\\s*/>|[a-zA-Z][^>]*>[^<]*</[a-zA-Z][^>]*>)`);
}

/** Ενημερώνει ένα key: διορθώνει την τιμή, ή την εισάγει αν λείπει τελείως. */
function enimerose_kleydi(keimeno, kleydi, yn) {
  const typos = typos_timis(kleydi);
  if (typos.test(keimeno)) {
    return keimeno.replace(typos, `$1$2${TIMI_TRUE}`);
  }
  const kleidi = `<key>${kleydi}</key>`;
  if (keimeno.includes(kleidi)) {
    // το key υπάρχει χωρίς αναγνωρίσιμη τιμή: μπήχ' την τιμή αμέσως μετά (όχι διπλό key)
    return keimeno.replace(kleidi, `${kleidi}${yn}${ESOXI}${TIMI_TRUE}`);
  }
  const kleise = keimeno.lastIndexOf('</dict>');
  const neo_block = `${ESOXI}${kleidi}${yn}${ESOXI}${TIMI_TRUE}${yn}`;
  return keimeno.slice(0, kleise) + neo_block + keimeno.slice(kleise);
}

/**
 * Καθαρό patch: παίρνει το πλήρες XML περιεχόμενο και επιστρέφει το τροποποιημένο.
 * Idempotent — δεύτερη κλήση επιστρέφει ίδιο αποτέλεσμα.
 */
export function patch_plist(keimeno) {
  if (keimeno.lastIndexOf('</dict>') === -1) {
    throw new Error('Άκυρο Info.plist: δεν βρέθηκε </dict> στο περιεχόμενο.');
  }
  const yn = keimeno.includes('\r\n') ? '\r\n' : '\n';
  let neo = keimeno;
  for (const kleydi of KLEIDIA) {
    neo = enimerose_kleydi(neo, kleydi, yn);
  }
  return neo;
}

/** Ελέγχει ότι η διαδρομή είναι υπαρκτό αρχείο και γυρίζει την απόλυτη μορφή της. */
function elenxos_arxeiou(diadromi) {
  const pliri = path.resolve(diadromi);
  if (!existsSync(pliri)) {
    console.error(`Το αρχείο δεν βρέθηκε: ${diadromi}`);
    process.exit(1);
  }
  if (!statSync(pliri).isFile()) {
    console.error(`Η διαδρομή δεν είναι αρχείο: ${diadromi}`);
    process.exit(1);
  }
  return pliri;
}

/** Ατομική εγγραφή (tmp + rename) με το ίδιο pattern όπως ο L10 storage adapter. */
async function grapse_atomika(pliri, periexomeno) {
  const prosorino = `${pliri}.tmp-${randomUUID()}`;
  try {
    await writeFile(prosorino, periexomeno, 'utf8');
    await rename(prosorino, pliri);
  } finally {
    await rm(prosorino, { force: true });
  }
}

async function kentriko() {
  const diadromi = process.argv[2];
  if (diadromi === undefined || diadromi.length === 0) {
    console.error(MNYMA_XRISIS);
    process.exit(1);
  }
  const pliri = elenxos_arxeiou(diadromi);

  const keimeno = await readFile(pliri, 'utf8');
  await grapse_atomika(pliri, patch_plist(keimeno));
  console.log(`[OK] Το Info.plist ενημερώθηκε: ${diadromi} (${KLEIDIA.join(', ')})`);
}

/** Τρέχει μόνο όταν καλείται απευθείας από τη γραμμή εντολών, όχι σε import από tests. */
function trexei_kateutheian() {
  const script = process.argv[1];
  if (script === undefined) {
    return false;
  }
  return import.meta.url === pathToFileURL(script).href;
}

if (trexei_kateutheian()) {
  await kentriko();
}
