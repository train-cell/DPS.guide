// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { DokimastikiExetasi } from './dokimastiki-exetasi.js';
import type { ApotelesmaExetasis, AutoelegchosErwtisi } from '../../ypiresies/exetasi-simulator.js';

vi.mock('../../ypiresies/exetasi-simulator.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/exetasi-simulator.js')>();
  return {
    ...actual,
    ftiaxe_dokimastiki_exetasi: vi.fn(),
    vathmologise_exetasi: vi.fn(),
  };
});

const { ftiaxe_dokimastiki_exetasi, vathmologise_exetasi } =
  await import('../../ypiresies/exetasi-simulator.js');

const erwtiseis: AutoelegchosErwtisi[] = [
  { id: 1, ennoia: 'Αλγόριθμοι', erwtisi: 'Τι είναι το P vs NP;', epiloges: ['Α', 'Β', 'Γ'] },
  { id: 2, ennoia: 'Δομές Δεδομένων', erwtisi: 'Πότε είναι σταθερό το height;', epiloges: ['Α', 'Β', 'Γ'] },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe('DokimastikiExetasi — αλληλεπίδραση (RTL)', () => {
  it('δείχνει την κατάσταση αναμονής με κουμπί έναρξης', () => {
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} />
    );
    expect(container.textContent).toContain('Προσομοίωση Διαγωνίσματος');
    expect(container.textContent).toContain('Ερωτήσεις: 2');
    expect(container.textContent).toContain('Διάρκεια: 10 λεπτά');
    expect(container.querySelector('[data-testid="odigos-start-mock-exam"]')).not.toBeNull();
  });

  it('Ξεκινάει την εξέταση όταν πατηθεί η έναρξη', async () => {
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    const onOloklirosi = vi.fn();
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} onOloklirosi={onOloklirosi} />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-countdown"]')).not.toBeNull());
    expect(container.textContent).toContain('Ερώτηση 1 από 2');
    expect(container.querySelector('[data-testid="exetasi-countdown"]')).not.toBeNull();
  });

  it('επιλέγει απάντηση και δείχνει το μετρητή', async () => {
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} deuteroleptaDiarkeias={60} />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-countdown"]')).not.toBeNull());
    const input = container.querySelector('input[name="erwtisi-1"]') as HTMLInputElement;
    fireEvent.click(input);
    expect(container.querySelector('.exetasi-epilogi-label.epilegmeno')).not.toBeNull();
    expect(container.textContent).toContain('01:00');
  });

  it('υποβάλλει και δείχνει αποτελέσματα', async () => {
    const apotelesma: ApotelesmaExetasis = {
      teliko_skor: 100,
      epitixia: true,
      sostes_apantiseis: 2,
      synolo_erwtiseon: 2,
      lathos_apantiseis: 0,
      analysi_ana_ennoia: { 'Αλγόριθμοι': { pososto: 100, sostes: 1, synolo: 1 } },
      analytikes_apantiseis: [
        { id: 1, erwtisi: 'Τι είναι το P vs NP;', apantisi_xristi: 'Α', einai_sosto: true, sosti_apantisi: 'Α' },
      ],
    };
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    (vathmologise_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(apotelesma);
    const onOloklirosi = vi.fn();
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} onOloklirosi={onOloklirosi} />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-countdown"]')).not.toBeNull());
    const input = container.querySelector('input[name="erwtisi-1"]') as HTMLInputElement;
    fireEvent.click(input);
    const inputs = container.querySelectorAll('input[name="erwtisi-2"]');
    if (inputs.length) fireEvent.click(inputs[0]);
    const submit = container.querySelector('[data-testid="exetasi-ypovoli"]');
    fireEvent.click(submit!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull());
    expect(container.textContent).toContain('100%');
    expect(container.textContent).toContain('Επιτυχής Επίδοση');
    expect(onOloklirosi).toHaveBeenCalledWith(apotelesma);
  });

  it('δεν χρειάζεται επανάληψη με αποτελέσματα αναμονής', async () => {
    const apotelesma: ApotelesmaExetasis = {
      teliko_skor: 50,
      epitixia: false,
      sostes_apantiseis: 1,
      synolo_erwtiseon: 2,
      lathos_apantiseis: 1,
      analysi_ana_ennoia: {},
      analytikes_apantiseis: [],
    };
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    (vathmologise_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(apotelesma);
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} arxikoStadio='olokliromeno' arxikesApantiseis={{ 1: 'Α' }} />
    );
    expect(container.textContent).toContain('50%');
    expect(container.textContent).toContain('Χρειάζεται Επανάληψη');
    expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull();
  });

  it('Υποβάλλει αμέσως όταν ο χρόνος είναι 0 από την αρχή', async () => {
    const onOloklirosi = vi.fn();
    const { container } = render(
      <DokimastikiExetasi
        kodikosMathimatos='CS101'
        erwtiseis={erwtiseis}
        deuteroleptaDiarkeias={0}
        onOloklirosi={onOloklirosi}
      />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull());
    expect(onOloklirosi).toHaveBeenCalled();
  });

  it('Κατεβάζει το χρονομετρητή μέχρι το 1 και υποβάλλει', async () => {
    const onOloklirosi = vi.fn();
    const { container } = render(
      <DokimastikiExetasi
        kodikosMathimatos='CS101'
        erwtiseis={erwtiseis}
        deuteroleptaDiarkeias={2}
        onOloklirosi={onOloklirosi}
      />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(
      () => expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull(),
      { timeout: 3000 }
    );
    expect(onOloklirosi).toHaveBeenCalled();
  });

  it('Ξαναεκκινεί την εξέταση από το κουμπί νέας προσομοίωσης', async () => {
    const apotelesma: ApotelesmaExetasis = {
      teliko_skor: 100,
      epitixia: true,
      sostes_apantiseis: 2,
      synolo_erwtiseon: 2,
      lathos_apantiseis: 0,
      analysi_ana_ennoia: {},
      analytikes_apantiseis: [],
    };
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    (vathmologise_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(apotelesma);
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} arxikoStadio='olokliromeno' />
    );
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull());
    expect(container.textContent).toContain('Νέα Προσομοίωση');
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.textContent).toContain('Έναρξη Προσομοίωσης Διαγωνίσματος'));
    expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).toBeNull();
  });

  it('Υποβάλλει χωρίς onOloklirosi', async () => {
    const apotelesma: ApotelesmaExetasis = {
      teliko_skor: 100,
      epitixia: true,
      sostes_apantiseis: 2,
      synolo_erwtiseon: 2,
      lathos_apantiseis: 0,
      analysi_ana_ennoia: {},
      analytikes_apantiseis: [
        { id: 1, erwtisi: 'Τι είναι το P vs NP;', apantisi_xristi: 'Α', einai_sosto: true, sosti_apantisi: 'Α' },
      ],
    };
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    (vathmologise_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(apotelesma);
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} deuteroleptaDiarkeias={60} />
    );
    fireEvent.click(container.querySelector('[data-testid="odigos-start-mock-exam"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-countdown"]')).not.toBeNull());
    const input = container.querySelector('input[name="erwtisi-1"]') as HTMLInputElement;
    fireEvent.click(input);
    const submit = container.querySelector('[data-testid="exetasi-ypovoli"]');
    fireEvent.click(submit!);
    await waitFor(() => expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull());
    expect(container.textContent).toContain('100%');
  });

  it('Δείχνει λάθος απαντήσεις με κενή επιλογή χρήστη', async () => {
    const apotelesma: ApotelesmaExetasis = {
      teliko_skor: 50,
      epitixia: false,
      sostes_apantiseis: 1,
      synolo_erwtiseon: 2,
      lathos_apantiseis: 1,
      analysi_ana_ennoia: {},
      analytikes_apantiseis: [
        { id: 1, erwtisi: 'Τι είναι το P vs NP;', apantisi_xristi: '', einai_sosto: false, sosti_apantisi: 'Α' },
        { id: 2, erwtisi: 'Πότε είναι σταθερό το height;', apantisi_xristi: 'Γ', einai_sosto: true, sosti_apantisi: 'Γ' },
      ],
    };
    (ftiaxe_dokimastiki_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      erwtiseis,
      xronos_lepta: 10,
    });
    (vathmologise_exetasi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(apotelesma);
    const { container } = render(
      <DokimastikiExetasi kodikosMathimatos='CS101' erwtiseis={erwtiseis} arxikoStadio='olokliromeno' />
    );
    expect(container.querySelector('[data-testid="exetasi-apotelesmata"]')).not.toBeNull();
    expect(container.querySelector('.exetasi-apantisi-kouti.lathos')).not.toBeNull();
    expect(container.querySelector('.exetasi-apantisi-kouti.sosto')).not.toBeNull();
    expect(container.textContent).toContain('(Καμία επιλογή)');
    expect(container.textContent).toContain('✗');
    expect(container.textContent).toContain('✓');
    expect(container.textContent).toContain('Σωστή απάντηση: Α');
  });
});
