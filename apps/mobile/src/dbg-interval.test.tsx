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

vi.mock('./ypiresies/pipeline-analisis.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ypiresies/pipeline-analisis.js')>();
  return {
    ...actual,
    generateCourseMap: vi.fn(),
  };
});
import { writeFileSync } from 'node:fs';

describe('debug intervals', () => {
  afterEach(cleanup);
  it('dump during generation', async () => {
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
    const html = result.baseElement.innerHTML;
    const dump = {
      hasProodos: html.includes('xartis-proodos-analisis'),
      hasPosonto: html.includes('xartis-proodos-posonto'),
      proodosText: (result.baseElement.querySelector('[data-testid="xartis-proodos-posonto"]') as HTMLElement)?.textContent,
      html: html.slice(html.indexOf('proodos-analisis-plaisio') - 100, html.indexOf('proodos-analisis-plaisio') + 1200),
    };
    writeFileSync('/tmp/dbg-interval.json', JSON.stringify(dump, null, 2));
    await new Promise((r) => setTimeout(r, 4000));
    const html2 = result.baseElement.innerHTML;
    const dump2 = {
      hasProodos: html2.includes('xartis-proodos-analisis'),
      hasPosonto: html2.includes('xartis-proodos-posonto'),
      proodosText: (result.baseElement.querySelector('[data-testid="xartis-proodos-posonto"]') as HTMLElement)?.textContent,
      enotita: html2.includes('xartis-enotita'),
    };
    writeFileSync('/tmp/dbg-interval2.json', JSON.stringify(dump2, null, 2));
  });
});
