#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SETTINGS = [
  { key: 'UIFileSharingEnabled', value: '<false/>', type: 'boolean' },
  { key: 'LSSupportsOpeningDocumentsInPlace', value: '<false/>', type: 'boolean' },
  {
    key: 'NSFaceIDUsageDescription',
    value: '<string>Η εφαρμογή χρησιμοποιεί Face ID μόνο όταν επιλέξεις βιομετρικό ξεκλείδωμα του τοπικού vault.</string>',
    type: 'string',
  },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureSetting(plist, setting, newline) {
  const key = escapeRegex(setting.key);
  const matches = [...plist.matchAll(new RegExp(`<key>${key}</key>`, 'g'))];
  if (matches.length > 1) throw new Error(`Duplicate Info.plist key: ${setting.key}`);

  const expected = setting.type === 'boolean' ? '<(?:true|false)\\s*/>' : '<string(?:\\s+[^>]*)?>[\\s\\S]*?<\\/string>';
  const entry = new RegExp(`(<key>${key}</key>\\s*)(${expected})`);
  if (matches.length === 1) {
    if (!entry.test(plist)) throw new Error(`Unexpected value type for Info.plist key: ${setting.key}`);
    return plist.replace(entry, `$1${setting.value}`);
  }

  const close = plist.lastIndexOf('</dict>');
  if (close < 0) throw new Error('Invalid Info.plist: missing closing dictionary.');
  const addition = `\t<key>${setting.key}</key>${newline}\t${setting.value}${newline}`;
  return `${plist.slice(0, close)}${addition}${plist.slice(close)}`;
}

async function configure(plistPath) {
  const absolutePath = path.resolve(plistPath);
  let contents = await readFile(absolutePath, 'utf8');
  if (!contents.includes('<plist') || !contents.includes('</dict>')) {
    throw new Error('Invalid XML Info.plist.');
  }
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  for (const setting of SETTINGS) contents = ensureSetting(contents, setting, newline);

  const temporaryPath = `${absolutePath}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporaryPath, contents, 'utf8');
    await rename(temporaryPath, absolutePath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
  console.log(`Configured private iOS storage in ${path.basename(absolutePath)}.`);
}

const scriptPath = process.argv[1];
if (scriptPath === undefined || import.meta.url !== pathToFileURL(scriptPath).href) {
  throw new Error('Run with: node scripts/ios/configure-private-files.mjs <Info.plist>');
}
const plistPath = process.argv[2];
if (!plistPath) throw new Error('Missing path to Info.plist.');
await configure(plistPath);
