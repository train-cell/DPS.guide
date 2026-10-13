import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ApothikiPyli } from '@dps/core';
import { read_course_gemini_opt_in, write_course_gemini_opt_in } from './ai-policy.js';
import './ai-generation-approval.css';

interface PendingGeneration {
  readonly id: number;
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly model: string;
  readonly purpose: string;
  readonly prompt: string;
}

export interface GeminiGenerationRequest {
  readonly model: string;
  readonly purpose: string;
  /** Exact system and user content that is about to be sent to the provider. */
  readonly prompt: string;
}

export interface CourseAiPrivacy {
  readonly optIn: boolean;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly error: string | null;
  readonly setOptIn: (enabled: boolean) => Promise<void>;
  readonly authorizeGeneration: (request: GeminiGenerationRequest) => Promise<boolean>;
  readonly dialog: ReactNode;
}

/** Per-course Gemini opt-in plus a queued confirmation for every uncached generation. */
export function useCourseAiPrivacy(
  storage: ApothikiPyli,
  courseCode: string,
  courseTitle: string,
): CourseAiPrivacy {
  const [optIn, setOptInState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedCourseCode, setLoadedCourseCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<readonly PendingGeneration[]>([]);
  const nextId = useRef(0);
  const optInRef = useRef<{ courseCode: string; enabled: boolean }>({ courseCode: '', enabled: false });
  const resolvers = useRef(new Map<number, (approved: boolean) => void>());

  useEffect(() => {
    let active = true;
    optInRef.current = { courseCode, enabled: false };
    setOptInState(false);
    setLoadedCourseCode(null);
    setLoading(Boolean(courseCode));
    setError(null);
    setPending([]);
    if (!courseCode) {
      setLoadedCourseCode('');
      setLoading(false);
      return () => { active = false; };
    }
    void read_course_gemini_opt_in(storage, courseCode).then((enabled) => {
      if (active) {
        optInRef.current = { courseCode, enabled };
        setOptInState(enabled);
        setLoadedCourseCode(courseCode);
      }
    }).catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Δεν φορτώθηκε η επιλογή Gemini.');
        setLoadedCourseCode(courseCode);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      for (const resolve of resolvers.current.values()) resolve(false);
      resolvers.current.clear();
    };
  }, [storage, courseCode]);

  useEffect(() => () => {
    for (const resolve of resolvers.current.values()) resolve(false);
    resolvers.current.clear();
  }, []);

  const setOptIn = useCallback(async (enabled: boolean): Promise<void> => {
    if (!courseCode) return;
    setSaving(true);
    setError(null);
    try {
      await write_course_gemini_opt_in(storage, courseCode, enabled);
      if (optInRef.current.courseCode === courseCode) {
        optInRef.current = { courseCode, enabled };
        setOptInState(enabled);
      }
      if (!enabled) {
        for (const resolve of resolvers.current.values()) resolve(false);
        resolvers.current.clear();
        setPending([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν αποθηκεύτηκε η επιλογή Gemini.');
      throw reason;
    } finally {
      setSaving(false);
    }
  }, [storage, courseCode]);

  const authorizeGeneration = useCallback((request: GeminiGenerationRequest): Promise<boolean> => {
    if (!request.model.toLowerCase().startsWith('gemini-')) return Promise.resolve(true);
    if (optInRef.current.courseCode !== courseCode || !optInRef.current.enabled) {
      setError('Για Gemini χρειάζεται ρητή συναίνεση για αυτό το μάθημα.');
      return Promise.resolve(false);
    }
    const id = ++nextId.current;
    return new Promise((resolve) => {
      resolvers.current.set(id, resolve);
      setPending((queue) => [...queue, { id, courseCode, courseTitle, ...request }]);
    });
  }, [courseCode, courseTitle]);

  function decide(approved: boolean): void {
    const current = pending[0];
    if (current === undefined) return;
    const resolve = resolvers.current.get(current.id);
    resolvers.current.delete(current.id);
    const stillApproved = approved && optInRef.current.courseCode === current.courseCode && optInRef.current.enabled;
    resolve?.(stillApproved);
    if (approved && !stillApproved) setError('Η συναίνεση Gemini απενεργοποιήθηκε πριν την αποστολή.');
    setPending((queue) => queue.slice(1));
  }

  const current = pending[0]?.courseCode === courseCode ? pending[0] : undefined;
  const dialog = current ? (
    <div className="ai-confirmation-overlay">
      <section role="alertdialog" aria-modal="true" aria-labelledby="ai-confirmation-title" className="ai-confirmation-dialog">
        <h2 id="ai-confirmation-title">Επιβεβαίωση αποστολής στο Gemini</h2>
        <p>Θα σταλεί στην Google μέσω Gemini το παρακάτω περιεχόμενο για το μάθημα «{current.courseTitle || current.courseCode}», για: {current.purpose}.</p>
        <div className="ai-confirmation-content"><pre>{current.prompt}</pre></div>
        <div className="odoni-xeiris">
          <button type="button" className="pilegma" onClick={() => decide(false)}>Ακύρωση</button>
          <button type="button" className="pilegma pilegma-entono" onClick={() => decide(true)}>Επιβεβαίωση και αποστολή</button>
        </div>
        {pending.length > 1 && <p role="status">Υπάρχουν ακόμη {pending.length - 1} επιβεβαιώσεις σε αναμονή.</p>}
      </section>
    </div>
  ) : null;

  return {
    optIn: Boolean(courseCode) && loadedCourseCode === courseCode && optIn,
    loading: Boolean(courseCode) && (loading || loadedCourseCode !== courseCode),
    saving,
    error,
    setOptIn,
    authorizeGeneration,
    dialog,
  };
}
