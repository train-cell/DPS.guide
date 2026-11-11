import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dps/core';
import { MnimiApothiki } from '@dps/core/testing';
import type { LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import { me_cache } from '@dps/ai';
import { createAuthorizedCourseLlm, createCourseAnalysisPipeline } from './pipeline-analisis.js';
import { ftiaxe_periballon_test as ftiaxe_periballon } from '../../test-fixtures/ftiaxe-test-periballon.js';
import { generateCourseGuide, generateCourseMap } from './pipeline-analisis.js';

function fakeProvider(): { readonly provider: LlmPyli; readonly calls: ReturnType<typeof vi.fn> } {
  const calls = vi.fn();
  const provider: LlmPyli = {
    montelo: 'provider-model',
    async parage_json<T>(_request: LlmAitimaJson<T>) {
      calls('json');
      return ok('json result' as T);
    },
    async parage_keimeno(_request: LlmAitimaKeimenou) {
      calls('text');
      return ok('text result');
    },
  };
  return { provider, calls };
}

describe('per-course generation approval', () => {
  it('shows the exact Gemini system and user request, then calls the provider only after approval', async () => {
    const { provider, calls } = fakeProvider();
    const authorize = vi.fn(async () => true);
    const llm = createAuthorizedCourseLlm(provider, 'gemini-2.5-flash', 'δημιουργία χάρτη', authorize);
    const request: LlmAitimaJson<string> = {
      systima: 'Only use the supplied course notes.',
      xristis: 'Summarize chapter 4.',
      sxima: { safeParse: (value: unknown) => ({ success: typeof value === 'string', data: value }) } as LlmAitimaJson<string>['sxima'],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    };

    await expect(llm.parage_json(request)).resolves.toEqual({ ok: true, timi: 'json result' });
    expect(authorize).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
      provider: 'gemini',
      purpose: 'δημιουργία χάρτη',
      prompt: 'SYSTEM\nOnly use the supplied course notes.\n\nUSER\nSummarize chapter 4.',
    });
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it('never calls Gemini when a generation is cancelled', async () => {
    const { provider, calls } = fakeProvider();
    const llm = createAuthorizedCourseLlm(provider, 'gemini-2.5-flash', 'οδηγός', async () => false);
    const result = await llm.parage_keimeno({
      systima: 'Use these sources.',
      minimata: [{ rolos: 'xristis', keimeno: 'Course extract' }],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    });
    expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AKYROTHIKE' } });
    expect(calls).not.toHaveBeenCalled();
  });

  it('allows same-device models without invoking the external-send approval flow', async () => {
    const { provider, calls } = fakeProvider();
    const authorize = vi.fn(async () => false);
    const llm = createAuthorizedCourseLlm(provider, 'gemini-local:latest', 'τοπική ανάλυση', authorize, 'ollama');
    const result = await llm.parage_keimeno({
      systima: 'Local request',
      minimata: [{ rolos: 'xristis', keimeno: 'Local course extract' }],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    });
    expect(result).toEqual({ ok: true, timi: 'text result' });
    expect(authorize).not.toHaveBeenCalled();
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it('requires Gemini consent from the explicit provider even for a custom model ID', async () => {
    const { provider, calls } = fakeProvider();
    const authorize = vi.fn(async () => false);
    const llm = createAuthorizedCourseLlm(provider, 'custom-chat-model', 'ανάλυση', authorize, 'gemini');
    const result = await llm.parage_keimeno({
      systima: 'Use the selected course.',
      minimata: [{ rolos: 'xristis', keimeno: 'Course text' }],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    });

    expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AKYROTHIKE' } });
    expect(authorize).toHaveBeenCalledWith(expect.objectContaining({ model: 'custom-chat-model', provider: 'gemini' }));
    expect(calls).not.toHaveBeenCalled();
  });

  it('asks before each distinct uncached generation but reuses encrypted local cache entries', async () => {
    const { provider, calls } = fakeProvider();
    const authorize = vi.fn(async () => true);
    const guarded = createAuthorizedCourseLlm(provider, 'gemini-2.5-flash', 'περίγραμμα', authorize);
    const cached = me_cache(guarded, new MnimiApothiki(), 'course/.spoudes/cache/llm');
    const first: LlmAitimaKeimenou = {
      systima: 'Ground this answer.',
      minimata: [{ rolos: 'xristis', keimeno: 'page one' }],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    };

    await cached.parage_keimeno(first);
    await cached.parage_keimeno(first);
    await cached.parage_keimeno({ ...first, minimata: [{ rolos: 'xristis', keimeno: 'page two' }] });
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(calls).toHaveBeenCalledTimes(2);
  });
});

describe('course analysis pipeline', () => {
  it('απορρίπτει τη σύνδεση LMS χωρίς συγχρονισμό', async () => {
    const periballon = ftiaxe_periballon();
    const llm = createAuthorizedCourseLlm(periballon.llm, 'gemini-2.5-flash', 'χάρτης', async () => false);

    const result = await llm.parage_json({
      systima: 'Use the course notes.',
      xristis: 'Summarize chapter 4.',
      sxima: { safeParse: (value: unknown) => ({ success: typeof value === 'string', data: value }) } as LlmAitimaJson<string>['sxima'],
      ekdosi_prompt: 'test-v1',
      thermokrasia: 0,
    });

    expect(result).toMatchObject({ ok: false, sfalma: { kodikos: 'AKYROTHIKE' } });
  });

  it('δεν ανακτά αρχεία χωρίς συγχρονισμό', async () => {
    const periballon = ftiaxe_periballon();
    const pipeline = createCourseAnalysisPipeline(periballon, 'CS101', 'gemini-2.5-flash', async () => true);

    const map = await generateCourseMap(periballon, 'CS101', 'gemini-2.5-flash', async () => true);
    expect(map.ok).toBe(false);
    if (!map.ok) {
      expect(map.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }

    const guide = await generateCourseGuide(periballon, 'CS101', 'section-1', 'gemini-2.5-flash', async () => true);
    expect(guide.ok).toBe(false);
    if (!guide.ok) {
      expect(guide.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }

    // Η ανάλυση δεν αγγίζει ποτέ το LMS όταν το μάθημα δεν συγχρονίστηκε.
    await expect(pipeline.eclass.syndesi()).resolves.toEqual({
      ok: false,
      sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'Η ανάλυση δεν συνδέεται στο LMS. Συγχρόνισε πρώτα το μάθημα.' },
    });
    await expect(pipeline.eclass.fere_mathimata()).resolves.toEqual({
      ok: false,
      sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'Η ανάλυση δεν ανακτά μαθήματα από το LMS.' },
    });
    await expect(pipeline.eclass.fere_dentro_arxeion()).resolves.toEqual({
      ok: false,
      sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'Η ανάλυση δεν ανακτά αρχεία από το LMS.' },
    });
    await expect(pipeline.katevasma.katevase('https://example.org')).resolves.toEqual({
      ok: false,
      sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: 'Η ανάλυση δεν κατεβάζει αρχεία. Συγχρόνισε πρώτα το μάθημα.' },
    });
  });
});
