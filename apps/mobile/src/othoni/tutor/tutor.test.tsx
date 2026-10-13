import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockLlm, apotyxia } from '@dps/core';
import type { LlmPyli } from '@dps/core';
import TutorChat, {
  APANTISI_YPARXEIS_STO_YLIKO,
  DRASEIS_TUTOR,
  apantisi_me_llm_i_topika,
  xairetisma_tutor,
} from './tutor.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';

const TUTOR_SOURCE = readFileSync(fileURLToPath(new URL('./tutor.tsx', import.meta.url)), 'utf8');

function tutorMarkup(path: string): string {
  return renderToStaticMarkup(me_periballon_test(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tutor" element={<TutorChat />} />
      </Routes>
    </MemoryRouter>
  ));
}

describe('tutor — πραγματική παραγωγή βασισμένη στο τοπικό υλικό', () => {
  it('εμφανίζει ασφαλές μήνυμα όταν δεν υπάρχουν εξαγμένα αποσπάσματα και δεν καλεί LLM', async () => {
    const llm = new MockLlm();
    const spy = vi.spyOn(llm, 'parage_keimeno');
    const periballon = ftiaxe_periballon_test({ llm });
    const answer = await apantisi_me_llm_i_topika('Πες μου κάτι', periballon, 'CS101', null, [], '  ');
    expect(answer.keimeno).toBe(APANTISI_YPARXEIS_STO_YLIKO);
    expect(spy).not.toHaveBeenCalled();
  });

  it('στέλνει στον επιλεγμένο provider μόνο τα δοθέντα αποσπάσματα και το σχετικό ιστορικό', async () => {
    const llm = new MockLlm('test-only');
    llm.orise_keimeno('Τι λέει η πηγή?', 'Απάντηση με παραπομπή [[arx-1: σ. 8]]');
    const spy = vi.spyOn(llm, 'parage_keimeno');
    const periballon = ftiaxe_periballon_test({ llm });
    const sourceText = '[[arx-1: σ. 8]]\nΗ στοίβα ακολουθεί LIFO.';
    const answer = await apantisi_me_llm_i_topika(
      'Τι λέει η πηγή?', periballon, 'CS101', null,
      [{ rolos: 'xristis', keimeno: 'Προηγούμενη ερώτηση' }], sourceText,
    );
    expect(answer.keimeno).toBe('Απάντηση με παραπομπή [[arx-1: σ. 8]]');
    expect(spy).toHaveBeenCalledTimes(1);
    const request = spy.mock.calls[0]?.[0];
    expect(request?.systima).toContain(sourceText);
    expect(request?.systima).toContain('Μην επινοείς παραπομπές');
    expect(request?.minimata).toEqual([
      { rolos: 'xristis', keimeno: 'Προηγούμενη ερώτηση' },
      { rolos: 'xristis', keimeno: 'Τι λέει η πηγή?' },
    ]);
  });

  it('επιστρέφει σαφές σφάλμα provider αντί να παράγει demo απάντηση', async () => {
    const llm = new MockLlm();
    vi.spyOn(llm, 'parage_keimeno').mockResolvedValue(apotyxia('DIKTYO', 'Ο provider δεν είναι διαθέσιμος'));
    const periballon = ftiaxe_periballon_test({ llm });
    await expect(apantisi_me_llm_i_topika(
      'Ερώτηση', periballon, 'CS101', null, [], '[[arx-1: σ. 2]]\nΠηγή',
    )).rejects.toThrow('Ο provider δεν είναι διαθέσιμος');
  });

  it('οι γρήγορες ενέργειες είναι prompts προς το πραγματικό υλικό και δεν περιέχουν canned answers', () => {
    expect(DRASEIS_TUTOR).toHaveLength(4);
    expect(DRASEIS_TUTOR.every((action) => action.prompt.trim().length > 0)).toBe(true);
    expect(DRASEIS_TUTOR.every((action) => /(?:υλικ|πηγ)/i.test(action.prompt))).toBe(true);
    expect(TUTOR_SOURCE).not.toContain('Grounded Reasoning ανά μάθημα');
    expect(TUTOR_SOURCE).not.toContain('Μεταβλητή είναι ένα όνομα που δεσμεύει θέση στη μνήμη');
  });

  it('το αρχικό μήνυμα δεν επινοεί περιεχόμενο και αναφέρεται μόνο στο τοπικά φορτωμένο υλικό', () => {
    const greeting = xairetisma_tutor(null, 'CS101');
    expect(greeting.keimeno).toContain('CS101');
    expect(greeting.keimeno).toContain('τεκμηριώνεται σε αυτό');
    expect(greeting.keimeno).not.toContain('undefined');
  });
});

describe('tutor — opt-in Gemini και επιβεβαίωση', () => {
  it('κρατά συναίνεση χωριστά ανά μάθημα και ζητά νέο διάλογο επιβεβαίωσης σε κάθε δημιουργία', () => {
    expect(TUTOR_SOURCE).toContain('read_course_gemini_opt_in');
    expect(TUTOR_SOURCE).toContain("from '../../ypiresies/ai-policy.js'");
    expect(TUTOR_SOURCE).toContain('setPendingQuestion({ text: question, gemini: geminiSelected });');
    expect(TUTOR_SOURCE).toContain('if (pendingQuestion.gemini && !consentGivenInDialog)');
    expect(TUTOR_SOURCE).toContain('role="alertdialog" aria-modal="true"');
    expect(TUTOR_SOURCE).toContain('Επιβεβαίωση και αποστολή στο Gemini');
    expect(TUTOR_SOURCE).toContain('το σχετικό απόσπασμα των τοπικών αρχείων, η ερώτηση και έως 10 προηγούμενα μηνύματα');
  });

  it('η οθόνη χωρίς αποθηκευμένο μάθημα δείχνει φόρτωση/οδηγίες και όχι demo μαθήματα', () => {
    const markup = tutorMarkup('/tutor?enotita=en-2');
    expect(markup).toContain('data-testid="tutor-ekran"');
    expect(markup).toContain('Φόρτωση τοπικών δεδομένων');
    expect(markup).not.toContain('ΠΛΗ201');
    expect(markup).not.toContain('Mocked response');
  });

  it('περιλαμβάνει τα UI controls της συνομιλίας και δεν απαιτεί μη υλοποιημένα test ids', () => {
    for (const testid of ['tutor-ekran', 'tutor-imerologia', 'tutor-paixidi', 'tutor-apomilosi']) {
      expect(TUTOR_SOURCE).toContain(`data-testid="${testid}"`);
    }
    expect(TUTOR_SOURCE).toContain('aria-label="Ερώτηση για τον tutor"');
    expect(TUTOR_SOURCE).toContain('disabled={sending || input.trim() ===');
  });
});

describe('tutor — τύποι και import contract', () => {
  it('χρησιμοποιεί typed provider και δεν εισάγει mock content στο production source', () => {
    const _typeCheck: LlmPyli = new MockLlm();
    expect(_typeCheck.montelo).toBe('mock-gemini-2.5-flash');
    expect(TUTOR_SOURCE).not.toContain("from '../../../test-fixtures");
    expect(TUTOR_SOURCE).not.toContain('MockLlm');
    expect(TUTOR_SOURCE).not.toContain('as any');
  });
});
