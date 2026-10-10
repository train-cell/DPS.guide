import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  ODOS_KLEIDIOU,
  arxeio_kleidiou,
  einai_aitima_keimenou,
  enose_proorismon,
  katharise_arxi,
  kleidi_aitimatos,
  kleidi_json,
  kleidi_keimenou,
  kanonikos_ilogos,
  typos_aitimatos,
  PROORISMOS_KACHE_LLM,
} from '../src/cache/index.js';
import type { AilakiaAitimatosJson, AilakiaAitimatosKeimenou } from '../src/cache/index.js';

const MONTELO = 'mock-flash-1';

const KLEIDI_JSON_FIXTURE = '8d1e8a4a44685c5eadb36aaa006f5e538935920aa47c0124a7f4466affd04c6c';
const KLEIDI_KEIMENOU_FIXTURE = 'de105f5080417d4c25fc16c4712e3e5573574a514e17676cd577528c955bbdbf';

const CANONIKOS_JSON_FIXTURE = JSON.stringify([
  ODOS_KLEIDIOU,
  MONTELO,
  'p1@1',
  ['json', 'sistima-perigrammatos', 'perigramma|arx-1|1-3'],
]);

const CANONIKOS_KEIMENOU_FIXTURE = JSON.stringify([
  ODOS_KLEIDIOU,
  MONTELO,
  'p4@1',
  [
    'keimeno',
    'sistima-tutor',
    [
      ['xristis', 'erotisi-tutor-1'],
      ['montelo', 'apantisi-tutor-1'],
    ],
  ],
]);

const aitima_json_fixture: AilakiaAitimatosJson = {
  systima: 'sistima-perigrammatos',
  xristis: 'perigramma|arx-1|1-3',
  ekdosi_prompt: 'p1@1',
};

const aitima_keimenou_fixture: AilakiaAitimatosKeimenou = {
  systima: 'sistima-tutor',
  minimata: [
    { rolos: 'xristis', keimeno: 'erotisi-tutor-1' },
    { rolos: 'montelo', keimeno: 'apantisi-tutor-1' },
  ],
  ekdosi_prompt: 'p4@1',
};

function node_crypto(keimeno: string): string {
  return createHash('sha256').update(keimeno, 'utf8').digest('hex');
}

describe('kanonikos_ilogos', () => {
  it('γράφει τον κανονικό καταρτισμό JSON του αιτήματος με τεκμηριωμένη σειρά πεδίων', () => {
    expect(kanonikos_ilogos(MONTELO, aitima_json_fixture)).toBe(CANONIKOS_JSON_FIXTURE);
  });

  it('γράφει τον κανονικό καταρτισμό του αιτήματος κειμένου με τα μηνύματα στη σειρά τους', () => {
    expect(kanonikos_ilogos(MONTELO, aitima_keimenou_fixture)).toBe(CANONIKOS_KEIMENOU_FIXTURE);
  });

  it('ξεχωρίζει τα δύο είδη αιτήματος', () => {
    expect(typos_aitimatos(aitima_json_fixture)).toBe('json');
    expect(typos_aitimatos(aitima_keimenou_fixture)).toBe('keimeno');
    expect(einai_aitima_keimenou(aitima_keimenou_fixture)).toBe(true);
    expect(einai_aitima_keimenou(aitima_json_fixture)).toBe(false);
  });
});

describe('kleidi', () => {
  it('δίνει το γνωστό κλειδί του fixture JSON, επιβεβαιωμένο με το node:crypto', () => {
    expect(node_crypto(CANONIKOS_JSON_FIXTURE)).toBe(KLEIDI_JSON_FIXTURE);
    expect(kleidi_json(MONTELO, aitima_json_fixture)).toBe(KLEIDI_JSON_FIXTURE);
  });

  it('δίνει το γνωστό κλειδί του fixture κειμένου, επιβεβαιωμένο με το node:crypto', () => {
    expect(node_crypto(CANONIKOS_KEIMENOU_FIXTURE)).toBe(KLEIDI_KEIMENOU_FIXTURE);
    expect(kleidi_keimenou(MONTELO, aitima_keimenou_fixture)).toBe(KLEIDI_KEIMENOU_FIXTURE);
  });

  it('αλλάζει κλειδί όταν αλλάζει το ekdosi_prompt', () => {
    const allagmeni: AilakiaAitimatosJson = { ...aitima_json_fixture, ekdosi_prompt: 'p1@2' };
    expect(kleidi_json(MONTELO, allagmeni)).not.toBe(KLEIDI_JSON_FIXTURE);
  });

  it('αλλάζει κλειδί όταν αλλάζει το montelo', () => {
    expect(kleidi_json('mock-flash-2', aitima_json_fixture)).not.toBe(KLEIDI_JSON_FIXTURE);
  });

  it('αλλάζει κλειδί όταν αλλάζει το xristis', () => {
    const allagmeni: AilakiaAitimatosJson = { ...aitima_json_fixture, xristis: 'perigramma|arx-2|1-3' };
    expect(kleidi_json(MONTELO, allagmeni)).not.toBe(KLEIDI_JSON_FIXTURE);
  });

  it('αλλάζει κλειδί όταν αλλάζει το systima', () => {
    const allagmeni: AilakiaAitimatosJson = { ...aitima_json_fixture, systima: 'allo-systima' };
    expect(kleidi_json(MONTELO, allagmeni)).not.toBe(KLEIDI_JSON_FIXTURE);
  });

  it('αλλάζει κλειδί όταν αλλάζει η σειρά ή το περιεχόμενο των μηνυμάτων', () => {
    const allagmeni: AilakiaAitimatosKeimenou = {
      ...aitima_keimenou_fixture,
      minimata: [...aitima_keimenou_fixture.minimata].reverse(),
    };
    expect(kleidi_keimenou(MONTELO, allagmeni)).not.toBe(KLEIDI_KEIMENOU_FIXTURE);

    const allagmeni_keimeno: AilakiaAitimatosKeimenou = {
      ...aitima_keimenou_fixture,
      minimata: [{ rolos: 'xristis', keimeno: 'erotisi-tutor-2' }],
    };
    expect(kleidi_keimenou(MONTELO, allagmeni_keimeno)).not.toBe(KLEIDI_KEIMENOU_FIXTURE);
  });

  it('ξεχωρίζει το ρόλο του μηνύματος από το περιεχόμενό του', () => {
    const allagmeni: AilakiaAitimatosKeimenou = {
      ...aitima_keimenou_fixture,
      minimata: [
        { rolos: 'montelo', keimeno: 'erotisi-tutor-1' },
        { rolos: 'xristis', keimeno: 'apantisi-tutor-1' },
      ],
    };
    expect(kleidi_keimenou(MONTELO, allagmeni)).not.toBe(KLEIDI_KEIMENOU_FIXTURE);
  });

  it('είναι ντετερμινιστική: η ίδια είσοδος δύο φορές δίνει το ίδιο κλειδί', () => {
    expect(kleidi_aitimatos(MONTELO, aitima_json_fixture)).toBe(
      kleidi_aitimatos(MONTELO, aitima_json_fixture)
    );
    expect(kleidi_json(MONTELO, aitima_json_fixture)).toBe(
      kleidi_json(MONTELO, { ...aitima_json_fixture })
    );
  });

  it('κανονικοποιεί NFC και CRLF ώστε η ίδια σημασιολογία δίνει το ίδιο κλειδί', () => {
    const me_crlf: AilakiaAitimatosJson = { ...aitima_json_fixture, xristis: 'γραμμή1\r\nγραμμή2' };
    const me_lf: AilakiaAitimatosJson = { ...aitima_json_fixture, xristis: 'γραμμή1\nγραμμή2' };
    expect(kleidi_json(MONTELO, me_crlf)).toBe(kleidi_json(MONTELO, me_lf));
    expect(katharise_arxi('a\r\nb')).toBe('a\nb');
    expect(katharise_arxi('á')).toBe('á');
  });
});

describe('arxeio_kleidiou', () => {
  it('χτίζει τη διαδρομή του §5.3', () => {
    expect(arxeio_kleidiou(KLEIDI_JSON_FIXTURE)).toBe(
      `${PROORISMOS_KACHE_LLM}/${KLEIDI_JSON_FIXTURE}.json`
    );
  });

  it('δέχεται προσαρμοσμένο πρόγραμμα και δεν δημιουργεί διπλή κάλωστα', () => {
    expect(arxeio_kleidiou(KLEIDI_JSON_FIXTURE, 'PLI101/.spoudes/cache/llm')).toBe(
      `PLI101/.spoudes/cache/llm/${KLEIDI_JSON_FIXTURE}.json`
    );
    expect(enose_proorismon('cache/llm/')).toBe('cache/llm');
    expect(enose_proorismon('cache/llm')).toBe('cache/llm');
  });
});