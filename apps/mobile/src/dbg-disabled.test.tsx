// @vitest-environment jsdom
import { describe, it, afterEach, expect } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import XartisEnotiton from './othoni/xartis/xartis.js';
import { ParoxeApothekisis } from './apothiki/aperixirto.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../test-fixtures/ftiaxe-test-periballon.js';
import { pseudos_xartis, pseudos_mathimata } from '../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../test-fixtures/periballon-test-provider.js';
import { writeFileSync } from 'node:fs';

describe('debug disabled click', () => {
  afterEach(cleanup);
  it('click disabled button', async () => {
    const apothiki = new MnimiApothiki();
    await apothiki.grapse_keimeno('mathimata.json', JSON.stringify(pseudos_mathimata().slice(0, 1)));
    const periballon = ftiaxe_periballon_test({ apothiki });
    const result = render(
      me_periballon_test(
        <ParoxeApothekisis periballon={periballon} kodikosMathimatos="ΠΛΗ201">
          <MemoryRouter initialEntries={['/xartis']}>
            <Routes>
              <Route path="/xartis" element={<XartisEnotiton />} />
            </Routes>
          </MemoryRouter>
        </ParoxeApothekisis>,
        periballon
      )
    );
    await waitFor(() => expect(result.queryAllByTestId('xartis-dimiourgia').length).toBeGreaterThan(0), { timeout: 2000 });
    const button = result.getByTestId('xartis-dimiourgia');
    const state = { disabled: button.disabled, text: button.textContent };
    fireEvent.click(button);
    const state2 = { disabled: button.disabled, text: button.textContent };
    writeFileSync('/tmp/dbg-disabled.json', JSON.stringify({ state, state2 }));
  });
});
