import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MnimiApothiki } from '@dps/core';
import { ftiaxe_periballon_test } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { ParoxeApothekisis, xrisiApothekisis, type ApothikiSyntheseon } from './aperixirto.js';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';

function ProbeApothikis({ capture }: { readonly capture: (value: ApothikiSyntheseon) => void }) {
  const value = xrisiApothekisis();
  capture(value);
  return <span>{value.kodikosMathimatos}</span>;
}

describe('aperixirto', () => {
  it('εκτός Provider εκθέτει ασφαλείς προεπιλογές και λειτουργικές μεθόδους', () => {
    let captured: ApothikiSyntheseon | undefined;
    renderToStaticMarkup(me_periballon_test(<ProbeApothikis capture={(value) => { captured = value; }} />));

    expect(captured?.kodikosMathimatos).toBe('');
    expect(typeof captured?.allaxe_kodiko_mathimatos).toBe('function');
    expect(typeof captured?.allaxe_rytheseis).toBe('function');
  });

  it('ο Provider περιμένει την αρχική φόρτωση πριν εμφανίσει τις οθόνες του', () => {
    const periballon = ftiaxe_periballon_test({ apothiki: new MnimiApothiki() });
    const markup = renderToStaticMarkup(me_periballon_test(
      <ParoxeApothekisis periballon={periballon} kodikosMathimatos="CS101">
        <p>Τοπική εφαρμογή</p>
      </ParoxeApothekisis>,
      periballon,
    ));

    expect(markup).toBe('');
  });
});
