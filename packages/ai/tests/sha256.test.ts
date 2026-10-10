import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256_heks } from '../src/cache/sha256.js';

const HASH_KENAKOU = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HASH_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const HASH_LEONTOU =
  'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
const HASH_NIST_ALPHABET =
  '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1';

function node_crypto(keimeno: string): string {
  return createHash('sha256').update(keimeno, 'utf8').digest('hex');
}

describe('sha256_heks', () => {
  it('δίνει το γνωστό άδειο διάνυσμα', () => {
    expect(sha256_heks('')).toBe(HASH_KENAKOU);
  });

  it('δίνει το γνωστό διάνυσμα του abc', () => {
    expect(sha256_heks('abc')).toBe(HASH_ABC);
  });

  it('δίνει το γνωστό διάνυσμα της πρότασης του αλφάβητου', () => {
    expect(sha256_heks('The quick brown fox jumps over the lazy dog')).toBe(HASH_LEONTOU);
  });

  it('δίνει το γνωστό διάνυσμα του NIST για τη σειρά abcdefghijklmnopqrstuvwxyz', () => {
    expect(sha256_heks('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      HASH_NIST_ALPHABET
    );
  });

  it('κάλυπτει τα όρια του padding γύρω από τα 55/56/63/64/65 bytes', () => {
    const mikres = [55, 56, 63, 64, 65, 119, 120, 127, 128];
    for (const mikos of mikres) {
      expect(sha256_heks('a'.repeat(mikos))).toBe(node_crypto('a'.repeat(mikos)));
    }
  });

  it('συμφωνεί με το node:crypto για κείμενο πολλών μπλοκ', () => {
    const megalo = 'Το κείμενο της ύλης. '.repeat(5000);
    expect(megalo.length).toBeGreaterThan(100000);
    expect(sha256_heks(megalo)).toBe(node_crypto(megalo));
  });

  it('συμφωνεί με το node:crypto για ελληνικούς χαρακτήρες με τόνους', () => {
    const imerominies = ['Αθήνα', 'Αθηνα', 'Πειραιάς', 'Σαββάτου 12 Οκτωβρίου 2026'];
    for (const lexi of imerominies) {
      expect(sha256_heks(lexi)).toBe(node_crypto(lexi));
    }
  });

  it('συμφωνεί με το node:crypto για emoji και συνδυαστικούς χαρακτήρες', () => {
    const symbola = ['👶 ELI5', '⚠️ παγίδες', 'κλειδί 🔑 δοκιμή'];
    for (const lexi of symbola) {
      expect(sha256_heks(lexi)).toBe(node_crypto(lexi));
    }
  });

  it('συμφωνεί με το node:crypto για τυχαία δυαδικά μέσω base64', () => {
    const ypokrypta = [
      'eyJhIjogMX0=',
      'AAAAAAAA',
      '//////8=',
      'eyJ4IjoxfX0=' + 'A'.repeat(100),
    ];
    for (const lexi of ypokrypta) {
      expect(sha256_heks(lexi)).toBe(node_crypto(lexi));
    }
  });

  it('δίνει 64 πεζά ψηφία', () => {
    const apotelesma = sha256_heks('οποιαδήποτε είσοδος');
    expect(apotelesma).toHaveLength(64);
    expect(apotelesma).toMatch(/^[0-9a-f]{64}$/);
  });

  it('είναι ντετερμινιστική: η ίδια είσοδος δύο φορές δίνει το ίδιο hash', () => {
    const eisodos = '["dps.llm.cache.v1","mock-flash-1","p1@1",["json","s","u"]]';
    expect(sha256_heks(eisodos)).toBe(sha256_heks(eisodos));
  });

  it('διαχωρίζει είσοδους που διαφέρουν σε έναν χαρακτήρα', () => {
    expect(sha256_heks('abc')).not.toBe(sha256_heks('abd'));
    expect(sha256_heks('ab')).not.toBe(sha256_heks('ba'));
  });
});