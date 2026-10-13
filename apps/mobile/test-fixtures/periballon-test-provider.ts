import { createElement } from 'react';
import type { ReactNode } from 'react';
import { ParoxosPeriballontos } from '../src/periballon/provolos.js';
import type { Periballon } from '../src/periballon/periballon.js';
import { ftiaxe_periballon_test } from './ftiaxe-test-periballon.js';

/** Wraps test-rendered screens in explicitly test-only runtime ports. */
export function me_periballon_test(
  children: ReactNode,
  periballon: Periballon = ftiaxe_periballon_test(),
) {
  return createElement(ParoxosPeriballontos, { periballon, children });
}
