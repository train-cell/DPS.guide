// @vitest-environment jsdom
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { me_periballon_test } from '../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../test-fixtures/ftiaxe-test-periballon.js';
import { MnimiApothiki } from '@dps/core/testing';
import RythmiseisProgrammatos from './programma/programma.js';

describe('dbg2', () => {
  it('dump', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-26T10:00:00.000Z'));
    const apothiki = new MnimiApothiki();
    const periballon = ftiaxe_periballon_test({ apothiki });
    render(
      me_periballon_test(
        <MemoryRouter>
          <RythmiseisProgrammatos />
        </MemoryRouter>,
        periballon
      )
    );
    await waitFor(() => {
      expect(document.body.textContent).toContain('Καμία εξέταση ακόμη. Πρόσθεσε την πρώτη.');
    });
    const add = document.querySelector('[data-testid="programma-exetasi-prosthesi"]');
    if (add) {
      fireEvent.click(add);
    }
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="programma-exetasi"]').length).toBe(1);
    });
    writeFileSync('/tmp/dbg2.html', document.body.innerHTML);
  });
});
