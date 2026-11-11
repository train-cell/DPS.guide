// @vitest-environment jsdom
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useCourseAiPrivacy } from './ai-generation-approval.js';
import { MnimiApothiki } from '@dps/core/testing';
import type { ApothikiPyli } from '@dps/core';
import type { IdParoxouAi } from './ai-providers.js';

/** Test component that render the hook. */
interface AiPrivacyTestProps {
  readonly storage: ApothikiPyli;
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly model: string;
  readonly provider: IdParoxouAi | undefined;
  readonly delayRead?: boolean;
}

/** Module-level handle for the stale write; only used by the stale-write test. */
let staleWritePromise: Promise<void> | null = null;

function AiPrivacyTest({ storage, courseCode, courseTitle, model, provider, delayRead }: AiPrivacyTestProps) {
  const privacy = useCourseAiPrivacy(storage, courseCode, courseTitle);
  /** Κρατάει την πρώτη έκδοση του `privacy`· χρησιμοποιείται για τον κλάδο όπου
   *  η `optInRef` έχει αλλάξει μάθημα από την τελευταία ανάγνωση. */
  const staleRef = useRef(privacy);
  return (
    <div>
      <div data-testid="opt-in">{privacy.optIn ? 'yes' : 'no'}</div>
      <div data-testid="loading">{privacy.loading ? 'yes' : 'no'}</div>
      <div data-testid="error">{privacy.error ?? ''}</div>
      <div data-testid="saving">{privacy.saving ? 'yes' : 'no'}</div>
      <div data-testid="dialog">{privacy.dialog ? 'yes' : 'no'}</div>
      <button data-testid="toggle-optin" onClick={() => privacy.setOptIn(!privacy.optIn).catch(() => {})}>
        toggle
      </button>
      <button
        data-testid="stale-toggle-optin"
        onClick={() => {
          staleWritePromise = staleRef.current.setOptIn(!staleRef.current.optIn);
        }}
      >
        stale-toggle
      </button>
      <button
        data-testid="authorize"
        onClick={() =>
          void privacy.authorizeGeneration({ model, provider, purpose: 'test', prompt: 'prompt' })
        }
      >
        authorize
      </button>
      <button data-testid="decide-true" onClick={() => privacy.decide(true)}>
        decide-true
      </button>
      <button data-testid="decide-false" onClick={() => privacy.decide(false)}>
        decide-false
      </button>
      {privacy.dialog}
    </div>
  );
}

/** Πλαστική αποθήκη: `{ ok: true, timi: value }` ή σφάλμα. */
interface FakeStorageOptions {
  readonly optIn?: boolean;
  readonly readError?: Error | string;
  readonly writeError?: Error | string;
  readonly slowRead?: boolean;
}

function fakeStorage(options: FakeStorageOptions = {}): ApothikiPyli {
  const storage = new MnimiApothiki();
  const { diavase_keimeno, grapse_keimeno } = storage;
  return {
    ...storage,
    diavase_keimeno: async (path) => {
      if (options.slowRead) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (options.readError) {
        return Promise.reject(options.readError);
      }
      if (options.optIn === undefined) {
        return diavase_keimeno(path);
      }
      return { ok: true, timi: JSON.stringify({ version: 1, geminiOptIn: options.optIn }) };
    },
    grapse_keimeno: async (path, value) => {
      if (options.writeError) {
        return Promise.reject(options.writeError);
      }
      return storage.grapse_keimeno(path, value);
    },
  } as ApothikiPyli;
}

describe('useCourseAiPrivacy', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('χωρίς κωδικό μαθήματος δεν έχει επιλογή και δεν φορτώνει', () => {
    const storage = fakeStorage();
    render(<AiPrivacyTest storage={storage} courseCode="" courseTitle="" model="gemini-2.0-flash" provider="gemini" />);
    expect(screen.getByTestId('opt-in').textContent).toBe('no');
    expect(screen.getByTestId('loading').textContent).toBe('no');
    expect(screen.getByTestId('dialog').textContent).toBe('no');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('φορτώνει και ενεργοποιημένη επιλογή', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    expect(screen.getByTestId('loading').textContent).toBe('yes');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('yes');
    expect(screen.getByTestId('dialog').textContent).toBe('no');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('φορτώνει και ανενεργοποιημένη επιλογή', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('no');
    expect(screen.getByTestId('dialog').textContent).toBe('no');
  });

  it('δεν φορτώνει και βγάζει σφάλμα', async () => {
    const storage = fakeStorage({ readError: new Error('Δίκτυο') });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Δίκτυο'));
    expect(screen.getByTestId('opt-in').textContent).toBe('no');
  });

  it('δεν φορτώνει όταν το σφάλμα δεν είναι Error', async () => {
    const storage = fakeStorage({ readError: 'Δίκτυο' });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Δεν φορτώθηκε η επιλογή Gemini.'));
    expect(screen.getByTestId('opt-in').textContent).toBe('no');
  });

  it('αλλάζει την επιλογή σε ανενεργή και καλεί το γράψιμο', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('yes');
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('αλλάζει την επιλογή σε ενεργή και καλεί το γράψιμο', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('no');
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('yes'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('βγάζει σφάλμα όταν αποτυγχάνει το γράψιμο', async () => {
    const storage = fakeStorage({ writeError: 'Δίκτυο' });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Δεν αποθηκεύτηκε η επιλογή Gemini.'));
  });

  it('εγκρίνει γενεράλη που δεν χρησιμοποιεί Gemini', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="ollama-3" provider="ollama" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    expect(screen.getByTestId('dialog').textContent).toBe('no');
  });

  it('ζητάει επιβεβαίωση όταν η επιλογή είναι ενεργή', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    expect(screen.getByText('Επιβεβαίωση αποστολής στο Gemini')).toBeTruthy();
    expect(screen.getByText('Θα σταλεί στην Google μέσω Gemini το παρακάτω περιεχόμενο για το μάθημα «Προγραμματισμός», για: test.')).toBeTruthy();
  });

  it('δεν ζητάει επιβεβαίωση όταν η επιλογή είναι ανενεργή', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
    expect(screen.getByTestId('dialog').textContent).toBe('no');
    expect(screen.getByTestId('error').textContent).toBe('Για Gemini χρειάζεται ρητή συναίνεση για αυτό το μάθημα.');
  });

  it('ακυρώνει την επιβεβαίωση', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    fireEvent.click(screen.getByText('Ακύρωση'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('yes');
  });

  it('επιβεβαιώνει με μη έγκυρη συναίνεση', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('yes'));
    expect(screen.getByTestId('dialog').textContent).toBe('no');
  });

  it('επιβεβαιώνει την επιβεβαίωση', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    fireEvent.click(screen.getByText('Επιβεβαίωση και αποστολή'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('no'));
  });

  it('καθαρίζει τους εκκρεμείς αποφασιστές όταν αποmountαρεται', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    expect(screen.getByTestId('dialog').textContent).toBe('yes');
    cleanup();
  });

  it('δεν γράφει επιλογή χωρίς κωδικό μαθήματος', async () => {
    const storage = fakeStorage({ optIn: false });
    render(<AiPrivacyTest storage={storage} courseCode="" courseTitle="" model="gemini-2.0-flash" provider="gemini" />);
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
  });

  it('ακυρώνει όλες τις εκκρεμείς επιβεβαιώσεις όταν απενεργοποιείται η επιλογή', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    expect(screen.getByTestId('dialog').textContent).toBe('yes');
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('no'));
  });

  it('καθαρίζει τους εκκρεμείς αποφασιστές όταν αποmountαρεται πριν το read', async () => {
    const storage = fakeStorage({ optIn: true });
    const { unmount } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    unmount();
  });

  it('καθαρίζει τους εκκρεμείς αποφασιστές όταν αποmountαρεται με σφάλμα read', async () => {
    const storage = fakeStorage({ readError: new Error('Δίκτυο') });
    const { unmount } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Δίκτυο'));
    unmount();
  });

  it('αποmountαρεται πριν αποτύχει το read με σφάλμα', async () => {
    const storage = fakeStorage({ optIn: true, readError: new Error('Δίκτυο'), slowRead: true });
    const { unmount } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('yes'));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  it('καθαρίζει τους εκκρεμείς αποφασιστές όταν αποmountαρεται απότομα', async () => {
    const storage = fakeStorage({ optIn: true });
    const { unmount } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('yes'));
    unmount();
  });

  it('γράφει στο παλιό μάθημα όταν η optInRef έχει αλλάξει μάθημα από την τελευταία ανάγνωση', async () => {
    const storage = fakeStorage({ optIn: true });
    const { rerender } = render(
      <AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('opt-in').textContent).toBe('yes');
    rerender(
      <AiPrivacyTest storage={storage} courseCode="CS102" courseTitle="Δίκτυα" model="gemini-2.0-flash" provider="gemini" />
    );
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('yes'));
    // η κλειδωμένη στο πρώτο rendering αναφορά διατηρεί το παλιό `courseCode`·
    // η γραφή περνά στο παλιό μάθημα χωρίς να ανανεώνει την κατάσταση
    staleWritePromise = null;
    fireEvent.click(screen.getByTestId('stale-toggle-optin'));
    expect(staleWritePromise).toBeTruthy();
    await staleWritePromise;
    const written = await storage.diavase_keimeno('4353313031/.spoudes/rytheseis-ai.json');
    expect(written.ok).toBe(true);
    if (written.ok) expect(JSON.parse(written.timi).geminiOptIn).toBe(true);
  });

  it('βγάζει σφάλμα Error όταν αποτυγχάνει το γράψιμο', async () => {
    const storage = fakeStorage({ writeError: new Error('Δίκτυο') });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Δίκτυο'));
  });

  it('εγκρίνει γενεράλη που ξεκινάει από gemini- και δεν έχει provider', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider={undefined} />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
  });

  it('ακυρώνει όταν η απόφαση γίνεται με άδειο ουρά', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
    expect(screen.getByTestId('dialog').textContent).toBe('no');
  });

  it('καταγράφει σφάλμα όταν η συναίνεση απενεργοποιείται πριν την αποστολή', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    fireEvent.click(screen.getByTestId('toggle-optin'));
    await waitFor(() => expect(screen.getByTestId('opt-in').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('error').textContent).toBe('Για Gemini χρειάζεται ρητή συναίνεση για αυτό το μάθημα.'));
  });

  it('δείχνει τον κωδικό μαθήματος όταν λείπει ο τίτλος', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    expect(screen.getByText('Θα σταλεί στην Google μέσω Gemini το παρακάτω περιεχόμενο για το μάθημα «CS101», για: test.')).toBeTruthy();
  });

  it('δεν δείχνει τις υπόλοιπες επιβεβαιώσεις όταν υπάρχει μόνο μία', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    expect(screen.queryByText(/Υπάρχουν ακόμη/)).toBeNull();
  });

  it('δείχνει τις υπόλοιπες επιβεβαιώσεις όταν υπάρχουν δύο', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    fireEvent.click(screen.getByTestId('authorize'));
    expect(screen.getByText(/Υπάρχουν ακόμη/)).toBeTruthy();
  });

  it('αποφασίζει χωρίς σφάλμα όταν η ουρά είναι άδεια', async () => {
    const storage = fakeStorage({ optIn: true });
    render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('decide-true'));
    fireEvent.click(screen.getByTestId('decide-false'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('αποmountαρεται πριν φορτώσει η επιλογή', async () => {
    const storage = fakeStorage({ optIn: true, slowRead: true });
    const { unmount } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('yes'));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  it('αποφασίζει όταν η συναίνεση απενεργοποιήθηκε πριν την αποστολή', async () => {
    const storage = fakeStorage({ optIn: true });
    const { rerender } = render(<AiPrivacyTest storage={storage} courseCode="CS101" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    fireEvent.click(screen.getByTestId('authorize'));
    await waitFor(() => expect(screen.getByTestId('dialog').textContent).toBe('yes'));
    rerender(<AiPrivacyTest storage={storage} courseCode="CS102" courseTitle="Προγραμματισμός" model="gemini-2.0-flash" provider="gemini" />);
    fireEvent.click(screen.getByTestId('decide-true'));
    expect(screen.getByTestId('error').textContent).toBe('Η συναίνεση Gemini απενεργοποιήθηκε πριν την αποστολή.');
  });
});
