// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BridgePairingCard } from './bridge-pairing.js';
import { pairLocalBridge } from './local-bridge-client.js';

/** Πλαστικό `Capacitor` — η οθόνη εμφανίζεται μόνο σε browser (όχι native). */
const capacitor = vi.hoisted(() => ({ isNativePlatform: () => false }));
vi.mock('@capacitor/core', () => ({ Capacitor: capacitor }));

/** Πλαστικό token: το `paired` ξεκινά συνδεδεμένο, τα τεστ το αλλάζουν. */
let bridgeToken = 'x'.repeat(32);
vi.mock('./local-bridge-client.js', () => ({
  getLocalBridgeToken: () => bridgeToken,
  pairLocalBridge: vi.fn(),
}));

describe('BridgePairingCard', () => {
  afterEach(() => {
    bridgeToken = 'x'.repeat(32);
    pairLocalBridge.mockReset();
    pairLocalBridge.mockResolvedValue(undefined);
    vi.unstubAllGlobals();
    cleanup();
  });

  it('δεν εμφανίζεται όταν η πλατφόρμα είναι native', () => {
    capacitor.isNativePlatform = () => true;
    const { container } = render(<BridgePairingCard />);
    expect(container.innerHTML).toBe('');
  });

  it('δεν εμφανίζεται όταν ο browser δεν τρέχει σε loopback', () => {
    capacitor.isNativePlatform = () => false;
    vi.stubGlobal('location', { hostname: 'example.com' });
    const { container } = render(<BridgePairingCard />);
    expect(container.innerHTML).toBe('');
  });

  it('δεν εμφανίζεται όταν η τοποθεσία δεν είναι loopback', () => {
    vi.stubGlobal('location', { hostname: 'example.com' });
    const { container } = render(<BridgePairingCard />);
    expect(container.innerHTML).toBe('');
  });

  it('δείχνει το πεδίο κωδικού όταν δεν υπάρχει pairing', () => {
    bridgeToken = null;
    render(<BridgePairingCard />);
    expect(screen.getByLabelText('Κωδικός pairing από το terminal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Σύνδεση με τον υπολογιστή' })).toBeTruthy();
    expect(screen.getByText('Άνοιξε το terminal σε αυτόν τον υπολογιστή και πληκτρολόγησε τον κωδικό που εμφανίζει το DPS local bridge.')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('δείχνει ότι ο browser είναι paired', () => {
    render(<BridgePairingCard />);
    expect(screen.getByText('Ο browser είναι paired με τον τρέχοντα localhost server.')).toBeTruthy();
    expect(screen.queryByLabelText('Κωδικός pairing από το terminal')).toBeNull();
  });

  it('στέλνει τον κωδικό και δείχνει επιτυχία', async () => {
    bridgeToken = null;
    render(<BridgePairingCard />);
    const input = screen.getByLabelText('Κωδικός pairing από το terminal');
    fireEvent.change(input, { target: { value: 'A1B2C3D4E5F60718' } });
    const button = screen.getByRole('button', { name: 'Σύνδεση με τον υπολογιστή' });
    await fireEvent.click(button);
    await waitFor(() => expect(screen.getByText('Ο browser είναι paired με τον τρέχοντα localhost server.')).toBeTruthy());
    expect(screen.getByText('Ο browser συνδέθηκε με τον localhost server. Το pairing ισχύει μέχρι την επανεκκίνηση του server.')).toBeTruthy();
    expect(pairLocalBridge).toHaveBeenCalledWith('A1B2C3D4E5F60718');
  });

  it('δείχνει το μήνυμα του σφάλματος όταν είναι Error', async () => {
    bridgeToken = null;
    pairLocalBridge.mockRejectedValue(new Error('Δεν υπήρξε απάντηση.'));
    render(<BridgePairingCard />);
    const input = screen.getByLabelText('Κωδικός pairing από το terminal');
    fireEvent.change(input, { target: { value: 'A1B2C3D4E5F60718' } });
    const button = screen.getByRole('button', { name: 'Σύνδεση με τον υπολογιστή' });
    await fireEvent.click(button);
    await waitFor(() => expect(screen.getByText('Δεν υπήρξε απάντηση.')).toBeTruthy());
    expect(screen.queryByText('Ο browser είναι paired με τον τρέχοντα localhost server.')).toBeNull();
  });

  it('δείχνει το βασικό μήνυμα όταν το σφάλμα δεν είναι Error', async () => {
    bridgeToken = null;
    pairLocalBridge.mockRejectedValue('Μόνο κείμενο');
    render(<BridgePairingCard />);
    const input = screen.getByLabelText('Κωδικός pairing από το terminal');
    fireEvent.change(input, { target: { value: 'A1B2C3D4E5F60718' } });
    const button = screen.getByRole('button', { name: 'Σύνδεση με τον υπολογιστή' });
    await fireEvent.click(button);
    await waitFor(() => expect(screen.getByText('Δεν έγινε pairing με τον τοπικό server.')).toBeTruthy());
    expect(screen.queryByText('Ο browser είναι paired με τον τρέχοντα localhost server.')).toBeNull();
  });
});
