import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  PARAGKES,
  krige_keimeno,
  episkeps_to_scrub,
  skrub_arxeio,
  SYNDESMOI_GNOSTES,
} from '../../../scripts/scrub-fixtures.mjs';

const execFileAsync = promisify(execFile);
const ODO_SCRIPT = path.resolve(import.meta.dirname, '../../../scripts/scrub-fixtures.mjs');

const MYSTIKA = {
  email: 'giorgos.papadopoulos@example.gr',
  am: 'P123456789',
  kodikos: 'Zk7pQ2xR9',
  onoma: 'Giorgos Papadopoulos',
  session: 'a1b2c3d4e5f6a7b8c9d0',
  token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N',
  cookie: 'Xa7b9Kd2',
};

const HTML_PRAKTIKO = `<!DOCTYPE html>
<html><head><title>Σύνδεση</title></head><body>
<form action="/main/login_form.php" method="post">
  <input type="text" name="username" value="${MYSTIKA.onoma}">
  <input type="password" name="password" value="${MYSTIKA.kodikos}">
  <input type="hidden" name="token" value="${MYSTIKA.token}">
  <input type="hidden" name="PHPSESSID" value="${MYSTIKA.session}">
</form>
<p>Επικοινωνία: <a href="mailto:${MYSTIKA.email}">${MYSTIKA.email}</a></p>
<p>ΑΜ: ${MYSTIKA.am}</p>
</body></html>`;

const KEFALIDES_APANTISIS = [
  `Set-Cookie: PHPSESSID=${MYSTIKA.session}; path=/; HttpOnly`,
  `Set-Cookie: eclass_user=${MYSTIKA.cookie}; expires=Wed, 21 Oct 2026 07:28:00 GMT; path=/; HttpOnly; secure`,
  `Cookie: PHPSESSID=${MYSTIKA.session}; eclass_token=${MYSTIKA.cookie}`,
  'Content-Type: text/html; charset=UTF-8',
  'Content-Length: 52428800',
  'ETag: "65f0a1b2c3d4e5"',
  `Location: /main/portfolio.php?sessionid=${MYSTIKA.session}`,
].join('\n');

function gnostes() {
  return {
    onoma: MYSTIKA.onoma,
    email: MYSTIKA.email,
    am: MYSTIKA.am,
    kodikos: MYSTIKA.kodikos,
    user_id: 'u-42',
  };
}

describe('scrub-fixtures — HTML', () => {
  it('afairei cookies, session ids, tokens, email, AM kai kodiko', () => {
    const apotelesma = krige_keimeno(HTML_PRAKTIKO, gnostes());
    for (const mystiko of Object.values(MYSTIKA)) {
      expect(apotelesma).not.toContain(mystiko);
    }
    expect(apotelesma).toContain(PARAGKES.EMAIL);
    expect(apotelesma).toContain(PARAGKES.KODIKOS);
    expect(apotelesma).toContain(PARAGKES.TOKEN);
    expect(apotelesma).toContain(PARAGKES.SESSION_ID);
    expect(apotelesma).toContain(PARAGKES.AM);
  });

  it('krataei ta onomata ton pedion tis formas (xreiazontai gia to protocol doc)', () => {
    const apotelesma = krige_keimeno(HTML_PRAKTIKO, {});
    expect(apotelesma).toContain('name="username"');
    expect(apotelesma).toContain('name="password"');
    expect(apotelesma).toContain('name="token"');
    expect(apotelesma).toContain('action="/main/login_form.php"');
  });

  it('krataei ta megetha stis kefalides (Content-Length den prepei na ginei AM)', () => {
    const keimeno = `${KEFALIDES_APANTISIS}\n${HTML_PRAKTIKO}`;
    const apotelesma = krige_keimeno(keimeno, gnostes());
    expect(apotelesma).toContain('Content-Length: 52428800');
    expect(apotelesma).toContain('"65f0a1b2c3d4e5"');
    expect(apotelesma).toContain('path=/');
    expect(apotelesma).toContain('HttpOnly');
    expect(apotelesma).toContain('expires=Wed, 21 Oct 2026 07:28:00 GMT');
    expect(apotelesma).toContain('Content-Type: text/html; charset=UTF-8');
  });

  it('krataei to onoma tou cookie alla katharizei tin timi', () => {
    const apotelesma = krige_keimeno(KEFALIDES_APANTISIS, {});
    expect(apotelesma).toContain('PHPSESSID');
    expect(apotelesma).toContain(PARAGKES.COOKIE);
    expect(apotelesma).not.toContain(MYSTIKA.session);
    expect(apotelesma).not.toContain(MYSTIKA.cookie);
  });

  it('to apotelesma perna ton elegxo upoloipomenou PII', () => {
    const apotelesma = krige_keimeno(`${KEFALIDES_APANTISIS}\n${HTML_PRAKTIKO}`, gnostes());
    expect(() => episkeps_to_scrub(apotelesma, gnostes())).not.toThrow();
  });

  it('einai idempotent', () => {
    const mia = krige_keimeno(`${KEFALIDES_APANTISIS}\n${HTML_PRAKTIKO}`, gnostes());
    const duo = krige_keimeno(mia, gnostes());
    expect(duo).toBe(mia);
  });

  it('katharizei Bearer tokens', () => {
    const apotelesma = krige_keimeno('Authorization: Bearer abcdef0123456789ABCDEF', {});
    expect(apotelesma).not.toContain('abcdef0123456789ABCDEF');
    expect(apotelesma).toContain('Bearer');
  });

  it('katharizei diefthinseis IP', () => {
    const apotelesma = krige_keimeno('remote_addr: 147.210.55.18', {});
    expect(apotelesma).not.toContain('147.210.55.18');
    expect(apotelesma).toContain(PARAGKES.IP);
  });
});

describe('scrub-fixtures — JSON', () => {
  it('katharizei anadromika kai krataei tin domi', async () => {
    const dedomena = {
      kodikos_mathimatos: 'PLI101',
      mathima: { titlos: 'Προγραμματισμός', archaia: { eisagogi: MYSTIKA.onoma } },
      xrhstes: [{ email: MYSTIKA.email, am: MYSTIKA.am }],
      arithmos: 52428800,
    };
    const apotelesma = await skrub_arxeio(dedomena, gnostes());
    expect(apotelesma).toEqual({
      kodikos_mathimatos: 'PLI101',
      mathima: { titlos: 'Προγραμματισμός', archaia: { eisagogi: PARAGKES.ONOMA_XRISTI } },
      xrhstes: [{ email: PARAGKES.EMAIL, am: PARAGKES.AM }],
      arithmos: 52428800,
    });
  });

  it('antikathastisei tin timi se kleidia pou einai kathara mystika', async () => {
    const apotelesma = await skrub_arxeio({ xrhstis: 'test', password: 'hunter2' }, {});
    expect(apotelesma).toEqual({ xrhstis: 'test', password: PARAGKES.KODIKOS });
  });
});

describe('scrub-fixtures — epitirisi PII', () => {
  it('APOTYCHANEI an meinemail', () => {
    expect(() => episkeps_to_scrub(`<a href="mailto:${MYSTIKA.email}">x</a>`, {})).toThrow(/email/);
  });

  it('APOTYCHANEI an meinει AM', () => {
    expect(() => episkeps_to_scrub('ΑΜ: 123456789', {})).toThrow(/ΑΜ/i);
  });

  it('APOTYCHANEI an meinει session id', () => {
    expect(() => episkeps_to_scrub('Set-Cookie: PHPSESSID=abc123def456; path=/', {})).toThrow(
      /session|cookie/i
    );
  });

  it('APOTYCHANEI an meinει gnwsti mystiki timi', () => {
    expect(() => episkeps_to_scrub('leaked top-secret here', { kodikos: 'top-secret' })).toThrow();
  });

  it('perna gia katharo keimeno', () => {
    expect(() => episkeps_to_scrub('<p>Προγραμματισμός και Βασικές Αρχές</p>', {})).not.toThrow();
  });

  it('leei poia kategoria emeine', () => {
    try {
      episkeps_to_scrub(`email ${MYSTIKA.email}`, {});
      throw new Error('anametonthaia eksairesi');
    } catch (sfalma) {
      expect(sfalma.message).toContain(MYSTIKA.email);
      expect(sfalma.message).toContain('email');
    }
  });
});

describe('scrub-fixtures — CLI', () => {
  it('katharizei archeio raw -> scrubbed', async () => {
    const fakelos = await fs.mkdtemp(path.join(os.tmpdir(), 'dps-scrub-'));
    const raw = path.join(fakelos, 'portfolio.html');
    const scrubbed = path.join(fakelos, 'portfolio.scrubbed.html');
    await fs.writeFile(raw, `${KEFALIDES_APANTISIS}\n${HTML_PRAKTIKO}`, 'utf8');

    const { stdout } = await execFileAsync(process.execPath, [
      ODO_SCRIPT,
      '--in',
      raw,
      '--out',
      scrubbed,
      '--onoma',
      MYSTIKA.onoma,
      '--am',
      MYSTIKA.am,
      '--email',
      MYSTIKA.email,
      '--kodikos',
      MYSTIKA.kodikos,
    ]);

    const keimeno = await fs.readFile(scrubbed, 'utf8');
    expect(keimeno).not.toContain(MYSTIKA.session);
    expect(keimeno).not.toContain(MYSTIKA.email);
    expect(stdout).not.toContain(MYSTIKA.kodikos);
    expect(stdout).not.toContain(MYSTIKA.email);
    expect(stdout).not.toContain(MYSTIKA.session);
    await fs.rm(fakelos, { recursive: true, force: true });
  });

  it('APOTYCHANEI (exit 1) se archeio me akoma PII kai den gryfei tipota', async () => {
    const fakelos = await fs.mkdtemp(path.join(os.tmpdir(), 'dps-scrub-'));
    const raw = path.join(fakelos, 'raw.html');
    const eksodos = path.join(fakelos, 'out.html');
    await fs.writeFile(raw, `<p>${MYSTIKA.email}</p>`, 'utf8');
    await expect(
      execFileAsync(process.execPath, [ODO_SCRIPT, '--verify-only', raw])
    ).rejects.toThrow();
    await expect(fs.access(eksodos)).rejects.toThrow();
    await fs.rm(fakelos, { recursive: true, force: true });
  });

  it('den typonei tis mystikes times apo to perivallon', async () => {
    const fakelos = await fs.mkdtemp(path.join(os.tmpdir(), 'dps-scrub-'));
    const raw = path.join(fakelos, 'raw.html');
    const eksodos = path.join(fakelos, 'out.html');
    await fs.writeFile(raw, `<p>login: ${MYSTIKA.onoma}</p>`, 'utf8');
    const perivallon = {
      ...process.env,
      [SYNDESMOI_GNOSTES.ONOMA]: MYSTIKA.onoma,
      [SYNDESMOI_GNOSTES.KODIKOS]: MYSTIKA.kodikos,
      [SYNDESMOI_GNOSTES.EMAIL]: MYSTIKA.email,
    };
    const { stdout } = await execFileAsync(
      process.execPath,
      [ODO_SCRIPT, '--in', raw, '--out', eksodos],
      { env: perivallon }
    );
    const keimeno = await fs.readFile(eksodos, 'utf8');
    expect(keimeno).toContain(PARAGKES.ONOMA_XRISTI);
    expect(keimeno).not.toContain(MYSTIKA.onoma);
    expect(stdout).not.toContain(MYSTIKA.kodikos);
    expect(stdout).not.toContain(MYSTIKA.email);
    await fs.rm(fakelos, { recursive: true, force: true });
  });
});

describe('scrub-fixtures — kanones', () => {
  it('i eksagogi einai kathari: kanena placeholder den einai adio', () => {
    for (const [onoma, timi] of Object.entries(PARAGKES)) {
      expect(timi).toMatch(/^<<.+>>$/);
      expect(onoma).toMatch(/^[A-Z_]+$/);
    }
  });
});