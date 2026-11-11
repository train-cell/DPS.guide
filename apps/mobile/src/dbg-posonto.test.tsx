// @vitest-environment jsdom
import { describe, it, afterEach, expect, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import XartisEnotiton from './othoni/xartis/xartis.js';
import { ParoxeApothekisis } from './apothiki/aperixirto.js';
import { MnimiApothiki } from '@dps/core/testing';
import { ftiaxe_periballon_test } from '../test-fixtures/ftiaxe-test-periballon.js';
import { pseudos_xartis, pseudos_mathimata } from '../test-fixtures/pseudomata/index.js';
import { me_periballon_test } from '../test-fixtures/periballon-test-provider.js';
import { generateCourseMap } from './ypiresies/pipeline-analisis.js';
import { writeFileSync } from 'node:fs';

vi.mock('./ypiresies/pipeline-analisis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ypiresies/pipeline-analisis.js')>();
  return { ...actual, generateCourseMap: vi.fn() };
});

describe('debug pososto', () => {
  afterEach(cleanup);
  it('dump', async () => {
    (generateCourseMap as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, timi: pseudos_xartis() }), 5000))
    );
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
    fireEvent.click(result.getByTestId('xartis-gemini-optin'));
    await waitFor(() => expect(result.getByTestId('xartis-dimiourgia').disabled).toBe(false), { timeout: 2000 });
    fireEvent.click(result.getByTestId('xartis-dimiourgia'));
    await waitFor(() => expect(result.queryAllByTestId('xartis-proodos-analisis')).toHaveLength(1), { timeout: 1000 });
    const dump = {
      queryAll_pososto: result.baseElement.querySelectorAll('[data-testid="xartis-proodos-pososto"]').length,
      queryAll_analisis: result.baseElement.querySelectorAll('[data-testid="xartis-proodos-analisis"]').length,
      posostoText: (() => { try { return result.getByTestId('xartis-proodos-pososto').textContent; } catch (e) { return String(e).slice(0, 80); } })(),
      bodyLen: document.body.innerHTML.length,
      bodyHasPososto: document.body.innerHTML.includes('xartis-proodos-pososto'),
    };
    writeFileSync('/tmp/dbg-pososto2.json', JSON.stringify(dump, null, 2));
    await new Promise((r) => setTimeout(r, 2000));
    const dump2 = {
      queryAll_pososto: result.baseElement.querySelectorAll('[data-testid="xartis-proodos-pososto"]').length,
      posostoText: (() => { try { return result.getByTestId('xartis-proodos-pososto').textContent; } catch (e) { return String(e).slice(0, 80); } })(),
      enotita: result.baseElement.querySelectorAll('[data-testid="xartis-enotita"]').length,
    };
    writeFileSync('/tmp/dbg-pososto3.json', JSON.stringify(dump2, null, 2));
  });
});
