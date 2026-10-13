import { describe, expect, it } from 'vitest';
import { MnimiApothiki } from '@dps/core';
import { course_ai_policy_path, read_course_gemini_opt_in, safe_course_segment, write_course_gemini_opt_in } from './ai-policy.js';

describe('course Gemini privacy policy', () => {
  it('encodes portal-controlled course ids as an opaque path segment', () => {
    const segment = safe_course_segment('../../rytheseis.json');
    expect(segment).toMatch(/^[0-9a-f]+$/);
    expect(course_ai_policy_path('../../rytheseis.json')).toBe(`${segment}/.spoudes/rytheseis-ai.json`);
    expect(course_ai_policy_path('../../rytheseis.json')).not.toContain('../');
  });

  it('keeps opt-in separate per course and defaults to denied', async () => {
    const storage = new MnimiApothiki();
    expect(await read_course_gemini_opt_in(storage, 'course-a')).toBe(false);
    await write_course_gemini_opt_in(storage, 'course-a', true);
    expect(await read_course_gemini_opt_in(storage, 'course-a')).toBe(true);
    expect(await read_course_gemini_opt_in(storage, 'course-b')).toBe(false);
    await write_course_gemini_opt_in(storage, 'course-a', false);
    expect(await read_course_gemini_opt_in(storage, 'course-a')).toBe(false);
  });
});
