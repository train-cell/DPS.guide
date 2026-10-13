import { FakeHttp, FakeMystika, FakeRologi, MockLlm, MnimiApothiki } from '@dps/core';
import type { PylesPeriballontos } from '../src/periballon/periballon.js';
import { ftiaxe_periballon } from '../src/periballon/periballon.js';
import { KatagrafiMnimis } from '../src/periballon/katagrafi-mnimis.js';

/** Test-only fixture. Production code must construct all ports explicitly. */
export function ftiaxe_periballon_test(
  overrides: Partial<PylesPeriballontos> = {},
  options: { readonly deigma?: boolean } = {},
) {
  const pyles: PylesPeriballontos = {
    mystika: new FakeMystika(),
    apothiki: new MnimiApothiki(),
    http: new FakeHttp(),
    llm: new MockLlm(),
    rologi: new FakeRologi(),
    katagrafi: new KatagrafiMnimis(),
    ...overrides,
  };
  return ftiaxe_periballon(pyles, { deigma: options.deigma ?? true });
}
