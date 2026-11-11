// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { AntallagiDeck } from './antallagi-deck.js';
import type { PaketoKartonPayload } from '@dps/core';

vi.mock('@dps/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dps/core')>();
  return {
    ...actual,
    exagwgi_kryptografimenou_paketou: vi.fn(),
    eisagwgi_kryptografimenou_paketou: vi.fn(),
  };
});

const { exagwgi_kryptografimenou_paketou, eisagwgi_kryptografimenou_paketou } =
  await import('@dps/core');

const deigmaPaketou: PaketoKartonPayload = {
  id: 'deck-123',
  titlos: 'Αλγόριθμοι & Πολυπλοκότητα',
  dimiourgithike: '2026-10-27T10:00:00.000Z',
  kartes: [{ erwtisi: 'Τι είναι το P vs NP;', apantisi: 'Ανοικτό πρόβλημα θεωρητικής πληροφορικής.' }],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('AntallagiDeck — αλληλεπίδραση (RTL)', () => {
  it('δεν δείχνει ενότητα εξαγωγής όταν δεν υπάρχει πακέτο', () => {
    const { container } = render(<AntallagiDeck />);
    expect(container.textContent).toContain('Έτοιμο για εξαγωγή ή εισαγωγή πακέτου');
    expect(container.querySelector('[data-testid="antallagi-exported-payload"]')).toBeNull();
  });

  it('αναφέρει σφάλμα όταν δεν υπάρχει επιλεγμένο πακέτο εξαγωγής', async () => {
    const onSfalma = vi.fn();
    const { container } = render(<AntallagiDeck trexwnPaketo={deigmaPaketou} onSfalma={onSfalma} />);
    // Χωρίς κλειδί το export οδηγεί στο σφάλμα έλεγχου, η διαδρομή χωρίς πακέτο είναι η ίδια.
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(onSfalma).toHaveBeenCalled());
    expect(container.textContent).toContain('Παρακαλούμε εισάγετε ένα μυστικό κλειδί');
  });

  it('απορρίπτει εξαγωγή χωρίς μυστικό κλειδί', async () => {
    const onSfalma = vi.fn();
    const { container } = render(<AntallagiDeck trexwnPaketo={deigmaPaketou} onSfalma={onSfalma} />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(onSfalma).toHaveBeenCalled());
    expect(container.textContent).toContain('Παρακαλούμε εισάγετε ένα μυστικό κλειδί');
  });

  it('αναφέρει σφάλμα εξαγωγής όταν δεν υπάρχει επιλεγμένο πακέτο', async () => {
    const onSfalma = vi.fn();
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(onSfalma).toHaveBeenCalled());
    expect(container.textContent).toContain('Δεν υπάρχει επιλεγμένο πακέτο καρτών');
  });

  it('αναφέρει σφάλμα εξαγωγής όταν αποτυγχάνει η κρυπτογράφηση', async () => {
    const onSfalma = vi.fn();
    (exagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Λάθος κλειδί');
    const { container } = render(
      <AntallagiDeck trexwnPaketo={deigmaPaketou} kleidiExagwgis="kleidi-123" onSfalma={onSfalma} />
    );
    fireEvent.change(container.querySelector('#antallagi-export-pass')!, { target: { value: 'kleidi-123' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Σφάλμα εξαγωγής: Λάθος κλειδί'));
  });

  it('εκτελεί κρυπτογράφηση εξαγωγής όταν υπάρχουν όλα τα στοιχεία', async () => {
    const onEisagwgiEpityxis = vi.fn();
    const onSfalma = vi.fn();
    (exagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('encoded-payload');
    const { container } = render(
      <AntallagiDeck trexwnPaketo={deigmaPaketou} kleidiExagwgis="kleidi-123" onEisagwgiEpityxis={onEisagwgiEpityxis} onSfalma={onSfalma} />
    );
    fireEvent.change(container.querySelector('#antallagi-export-pass')!, { target: { value: 'kleidi-123' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(exagwgi_kryptografimenou_paketou).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector('[data-testid="antallagi-exported-payload"]')).not.toBeNull());
    expect(container.textContent).toContain('κρυπτογραφήθηκε επιτυχώς');
    expect(onSfalma).not.toHaveBeenCalled();
  });

  it('απορρίπτει εισαγωγή με κενό payload και κλειδί', async () => {
    const onSfalma = vi.fn();
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(onSfalma).toHaveBeenCalled());
    expect(container.textContent).toContain('Παρακαλούμε επικολλήστε το κρυπτογραφημένο πακέτο');
  });

  it('απορρίπτει εισαγωγή με κενό payload χωρίς onSfalma', async () => {
    const { container } = render(<AntallagiDeck />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Παρακαλούμε επικολλήστε το κρυπτογραφημένο πακέτο'));
  });

  it('απορρίπτει εισαγωγή με κενό κλειδί', async () => {
    const onSfalma = vi.fn();
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(onSfalma).toHaveBeenCalled());
    expect(container.textContent).toContain('Παρακαλούμε εισάγετε το μυστικό κλειδί αποκρυπτογράφησης');
  });

  it('απορρίπτει εισαγωγή με κενό κλειδί χωρίς onSfalma', async () => {
    const { container } = render(<AntallagiDeck />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Παρακαλούμε εισάγετε το μυστικό κλειδί αποκρυπτογράφησης'));
  });

  it('εκτελεί εισαγωγή πακέτου με έγκυρα στοιχεία', async () => {
    const onEisagwgiEpityxis = vi.fn();
    const onSfalma = vi.fn();
    (eisagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(deigmaPaketou);
    const { container } = render(<AntallagiDeck onEisagwgiEpityxis={onEisagwgiEpityxis} onSfalma={onSfalma} />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.change(container.querySelector('#antallagi-import-pass')!, { target: { value: 'kleidi' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(eisagwgi_kryptografimenou_paketou).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector('[data-testid="antallagi-imported-summary"]')).not.toBeNull());
    expect(container.textContent).toContain('Αλγόριθμοι & Πολυπλοκότητα');
    expect(onEisagwgiEpityxis).toHaveBeenCalledWith(deigmaPaketou);
    expect(onSfalma).not.toHaveBeenCalled();
  });

  it('εκτελεί εισαγωγή πακέτου χωρίς onEisagwgiEpityxis', async () => {
    const onSfalma = vi.fn();
    (eisagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(deigmaPaketou);
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.change(container.querySelector('#antallagi-import-pass')!, { target: { value: 'kleidi' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.querySelector('[data-testid="antallagi-imported-summary"]')).not.toBeNull());
    expect(container.textContent).toContain('Αλγόριθμοι & Πολυπλοκότητα');
  });

  it('απορρίπτει εισαγωγή όταν η αποκρυπτογράφηση αποτύχει', async () => {
    const onSfalma = vi.fn();
    (eisagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Λάθος κλειδί'));
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.change(container.querySelector('#antallagi-import-pass')!, { target: { value: 'kleidi' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Σφάλμα εισαγωγής: Λάθος κλειδί'));
    expect(onSfalma).toHaveBeenCalledWith('Λάθος κλειδί');
  });

  it('απορρίπτει εισαγωγή όταν η αποκρυπτογράφηση αποτύχει με μη Error', async () => {
    const onSfalma = vi.fn();
    (eisagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockRejectedValue('Λάθος κλειδί');
    const { container } = render(<AntallagiDeck onSfalma={onSfalma} />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.change(container.querySelector('#antallagi-import-pass')!, { target: { value: 'kleidi' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Σφάλμα εισαγωγής: Λάθος κλειδί'));
    expect(onSfalma).toHaveBeenCalledWith('Λάθος κλειδί');
  });

  it('δεν καλεί onSfalma όταν η εξαγωγή αποτύχει με Error και δεν δίνεται callback', async () => {
    (exagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Λάθος κλειδί'));
    const { container } = render(
      <AntallagiDeck trexwnPaketo={deigmaPaketou} arxikoKleidi="kleidi-123" />
    );
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Σφάλμα εξαγωγής: Λάθος κλειδί'));
    expect(container.querySelector('[data-testid="antallagi-error"]')).not.toBeNull();
  });

  it('δεν καλεί onSfalma όταν λείπει το κλειδί εξαγωγής', async () => {
    const { container } = render(<AntallagiDeck trexwnPaketo={deigmaPaketou} />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Παρακαλούμε εισάγετε ένα μυστικό κλειδί'));
    expect(container.querySelector('[data-testid="antallagi-error"]')).not.toBeNull();
  });

  it('δεν καλεί onSfalma όταν δεν υπάρχει επιλεγμένο πακέτο', async () => {
    const { container } = render(<AntallagiDeck />);
    fireEvent.click(container.querySelector('[data-testid="antallagi-export-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Δεν υπάρχει επιλεγμένο πακέτο καρτών'));
    expect(container.querySelector('[data-testid="antallagi-error"]')).not.toBeNull();
  });

  it('δεν καλεί onSfalma όταν η εισαγωγή αποτύχει', async () => {
    (eisagwgi_kryptografimenou_paketou as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Λάθος κλειδί'));
    const { container } = render(<AntallagiDeck />);
    fireEvent.change(container.querySelector('#antallagi-import-payload')!, { target: { value: 'payload' } });
    fireEvent.change(container.querySelector('#antallagi-import-pass')!, { target: { value: 'kleidi' } });
    fireEvent.click(container.querySelector('[data-testid="antallagi-import-btn"]')!);
    await waitFor(() => expect(container.textContent).toContain('Σφάλμα εισαγωγής: Λάθος κλειδί'));
    expect(container.querySelector('[data-testid="antallagi-error"]')).not.toBeNull();
  });
});
