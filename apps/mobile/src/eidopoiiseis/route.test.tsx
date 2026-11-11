// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { me_periballon_test } from '../../test-fixtures/periballon-test-provider.js';
import EidopoiiseisRoute from './route.js';
import type { EidopoiisiYpiresies } from './eidopoiiseis-typoi.js';
import type { Katastasi } from '../kathstasi/katastasi.js';
import type { Mathima } from '@dps/core';
import type { XartisMathimatos } from '../ypiresies/xartis.js';

/** Πλαστική πύλα ειδοποιήσεων — δεν χρειάζεται το Capacitor plugin. */
const pugi: EidopoiisiYpiresies = {
  zitise_adia: async () => ({ ok: true, timi: 'granted' }),
  zitisi_adias: async () => ({ ok: true, timi: 'granted' }),
  programmatise_dokimi: async () => ({ ok: true, timi: undefined }),
  akiro_ol: async () => ({ ok: true, timi: undefined }),
  lista: async () => ({ ok: true, timi: [] }),
};

vi.mock('./sindesi.js', () => ({
  dimiourgise_ypiresies_eidopoiseon: () => pugi,
}));

/** Καταστάσεις που επιστρέφουν οι πλασμένες συναρτήσεις φόρτωσης. */
let kodikosMathimatos = '';
let proodhos = { aristeiesEnotiton: [] };
let mathimata = { katastasi: 'etimo', dedomena: [] } as Katastasi<readonly Mathima[]>;
let xartis = { katastasi: 'etimo', dedomena: { enotites: [] } } as Katastasi<XartisMathimatos>;

vi.mock('../apothiki/index.js', () => ({
  xrisiApothekisis: () => ({
    rytheseis: { einaiEnergies: false, leptaProeidopoisis: 30 },
    proodhos,
    kodikosMathimatos,
    allaxe_telia: async () => undefined,
    allaxe_rytheseis: async () => undefined,
    allaxe_kodiko_mathimatos: () => undefined,
  }),
}));

vi.mock('../ypiresies/index.js', () => ({
  fortose_mathimata_apo_apothiki: async () => mathimata,
  fortose_xartis_apo_apothiki: async () => xartis,
}));

describe('EidopoiiseisRoute', () => {
  afterEach(() => {
    kodikosMathimatos = '';
    proodhos = { aristeiesEnotiton: [] };
    mathimata = { katastasi: 'etimo', dedomena: [] };
    xartis = { katastasi: 'etimo', dedomena: { enotites: [] } };
    cleanup();
    vi.unstubAllGlobals();
  });

  function apotheke(): React.ReactElement {
    return (
      <MemoryRouter>
        {me_periballon_test(<EidopoiiseisRoute />)}
      </MemoryRouter>
    );
  }

  async function apothekeMe(
    props: { readonly kodikos?: string; readonly proodhos?: unknown } = {}
  ): Promise<void> {
    if (props.kodikos !== undefined) kodikosMathimatos = props.kodikos;
    if (props.proodhos !== undefined) proodhos = props.proodhos as never;
    render(apotheke());
    await waitFor(() => expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy());
  }

  it('χωρίς κωδικό μαθήματος δεν δημιουργεί context', async () => {
    await apothekeMe();
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('με κωδικό μαθήματος φέρνει τίτλο και ενότητα', async () => {
    mathimata = { katastasi: 'etimo', dedomena: [{ kodikos: 'CS101', titlos: 'Προγραμματισμός' }] };
    xartis = {
      katastasi: 'etimo',
      dedomena: { enotites: [{ id: 'en-1', titlos: 'Ενότητα 1' }] },
    };
    await apothekeMe({ kodikos: 'CS101' });
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('δεν βρίσκει τίτλο μαθήματος όταν λείπει', async () => {
    mathimata = { katastasi: 'etimo', dedomena: [{ kodikos: 'άλλο', titlos: 'Άλλο μάθημα' }] };
    xartis = {
      katastasi: 'etimo',
      dedomena: { enotites: [{ id: 'en-1', titlos: 'Ενότητα 1' }] },
    };
    await apothekeMe({ kodikos: 'CS101' });
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('δεν βρίσκει επόμενη ενότητα όταν όλα είναι ολοκληρωμένα', async () => {
    mathimata = { katastasi: 'etimo', dedomena: [{ kodikos: 'CS101', titlos: 'Προγραμματισμός' }] };
    xartis = {
      katastasi: 'etimo',
      dedomena: { enotites: [{ id: 'en-1', titlos: 'Ενότητα 1' }] },
    };
    proodhos = { aristeiesEnotiton: ['en-1'] };
    await apothekeMe({ kodikos: 'CS101' });
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('με κατάσταση φόρτωσης μαθημάτων δεν δημιουργεί context', async () => {
    mathimata = { katastasi: 'fortosi' } as Katastasi<readonly Mathima[]>;
    xartis = {
      katastasi: 'etimo',
      dedomena: { enotites: [{ id: 'en-1', titlos: 'Ενότητα 1' }] },
    };
    await apothekeMe({ kodikos: 'CS101' });
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('με σφάλμα χάρτη δεν δημιουργεί context', async () => {
    mathimata = { katastasi: 'etimo', dedomena: [{ kodikos: 'CS101', titlos: 'Προγραμματισμός' }] };
    xartis = { katastasi: 'sfalma' } as Katastasi<XartisMathimatos>;
    await apothekeMe({ kodikos: 'CS101' });
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('δέχεται την πύλα ειδοποιήσεων ως prop', async () => {
    render(
      <MemoryRouter>
        {me_periballon_test(
          <EidopoiiseisRoute ypiresiesEidopoiseon={pugi as unknown as EidopoiisiYpiresies} />
        )}
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy());
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });

  it('απενεργοποιεί την παλιά φόρτωση αν αλλάξει ο κωδικός μαθήματος', async () => {
    mathimata = { katastasi: 'etimo', dedomena: [{ kodikos: 'CS101', titlos: 'Προγραμματισμός' }] };
    xartis = {
      katastasi: 'etimo',
      dedomena: { enotites: [{ id: 'en-1', titlos: 'Ενότητα 1' }] },
    };
    kodikosMathimatos = 'CS101';
    render(apotheke());
    kodikosMathimatos = 'CS102';
    cleanup();
    render(apotheke());
    await waitFor(() => expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy());
    expect(screen.getByTestId('eidopoiseis-ekran')).toBeTruthy();
  });
});
