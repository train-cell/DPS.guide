// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { OraEidopoiseonProps } from './ora-eidopoiseon.js';
import RythisiesEidopoiseon from './rythisies-eidopoiseon.js';
import type { KatastasiSfalmatos } from '../kathstasi/index.js';

/** Κρατάει τα props που δέχεται το παρουσιαστικό. */
const captured: Record<string, unknown> = {};

/**
 * Δοκίμιο μόνο για τα προστατευτικά guards. Όταν λείπει η πύλα `EidopoiisiYpiresies`
 * η οθόνη δεν καλεί τίποτα· τα guards επιστρέφουν νωρίς.
 */
vi.mock('./ora-eidopoiseon.js', () => ({
  OraEidopoiseon: (props: OraEidopoiseonProps) => {
    Object.assign(captured, props);
    return <div data-testid="eidopoiseis-ekran" />;
  },
}));

describe('RythisiesEidopoiseon — guards χωρίς πύλα', () => {
  afterEach(() => {
    cleanup();
    Object.keys(captured).forEach((k) => delete captured[k]);
  });

  it('η fortose επιστρέφει νωρίς όταν λείπει η πύλα', async () => {
    const { container } = render(
      <MemoryRouter>
        <RythisiesEidopoiseon
          arxikiKatastasi={{ katastasi: 'sfalma', sfalma: { kodikos: 'X', minima: 'σφάλμα' } } as KatastasiSfalmatos}
        />
      </MemoryRouter>
    );
    expect(container.querySelector('[data-testid="eidopoiseis-ekran"]')).not.toBeNull();
    await (captured.epanalipsi as () => void)();
    expect(captured.katastasi).not.toBeNull();
  });

  it('η dokimi, η akiro_oles και η zitise_adeia επιστρέφουν νωρίς όταν λείπει η πύλα', async () => {
    const { container } = render(
      <MemoryRouter>
        <RythisiesEidopoiseon />
      </MemoryRouter>
    );
    expect(container.querySelector('[data-testid="eidopoiseis-ekran"]')).not.toBeNull();
    await (captured.dokimi as () => void)();
    await (captured.akiro_oles as () => void)();
    await (captured.zitise_adeia as () => void)();
  });
});
