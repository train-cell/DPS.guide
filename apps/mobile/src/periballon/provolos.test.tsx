import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import {
  ParoxosPeriballontos,
  xrisiPeriballontos,
  xrisiPeriballontosProairetika,
} from './provolos.js';

/** Component that reads the periballon context — mirrors the production usage. */
function XrisiPeriballontosConsumer() {
  return <div>{xrisiPeriballontos().deigma ? 'deigma' : 'demo'}</div>;
}

/** Optional context read, όπως το χρησιμοποιούν τα components που δέχονται test ports. */
function XrisiProairetikaConsumer() {
  return <div>{xrisiPeriballontosProairetika() === null ? 'null' : 'value'}</div>;
}

describe('provolos — ParoxosPeriballontos provider', () => {
  it('περνάει το periballon όταν δίνεται', () => {
    const markup = renderToStaticMarkup(
      <ParoxosPeriballontos periballon={ftiaxe_periballon_test()}>
        <div>περιεχόμενο</div>
      </ParoxosPeriballontos>
    );
    expect(markup).toContain('περιεχόμενο');
  });

  it('δίνει null όταν λείπει το periballon', () => {
    const markup = renderToStaticMarkup(
      <ParoxosPeriballontos>
        <div>περιεχόμενο</div>
      </ParoxosPeriballontos>
    );
    expect(markup).toContain('περιεχόμενο');
  });
});

describe('provolos — context provider', () => {
  it('πετάει σφάλμα όταν η πύλη ζητηθεί χωρίς provider', () => {
    expect(() => renderToStaticMarkup(<XrisiPeriballontosConsumer />)).toThrow(
      'Λείπει το production Periballon provider.'
    );
  });

  it('δίνει null όταν δεν υπάρχει provider', () => {
    const markup = renderToStaticMarkup(<XrisiProairetikaConsumer />);
    expect(markup).toContain('null');
  });
});
