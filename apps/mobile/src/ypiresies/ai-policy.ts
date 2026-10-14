import type { ApothikiPyli } from '@dps/core';

/** Opaque path segment so a portal-provided course id cannot escape its vault folder. */
export function safe_course_segment(courseCode: string): string {
  const bytes = new TextEncoder().encode(courseCode.trim() || '_unknown');
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function course_ai_policy_path(courseCode: string): string {
  return `${safe_course_segment(courseCode)}/.spoudes/rytheseis-ai.json`;
}

export async function read_course_gemini_opt_in(storage: ApothikiPyli, courseCode: string): Promise<boolean> {
  const stored = await storage.diavase_keimeno(course_ai_policy_path(courseCode));
  if (!stored.ok) return false;
  try {
    const value: unknown = JSON.parse(stored.timi);
    return typeof value === 'object' && value !== null && 'version' in value && value.version === 1 &&
      'geminiOptIn' in value && value.geminiOptIn === true;
  } catch {
    return false;
  }
}

export async function write_course_gemini_opt_in(
  storage: ApothikiPyli,
  courseCode: string,
  enabled: boolean,
): Promise<void> {
  const saved = await storage.grapse_keimeno(
    course_ai_policy_path(courseCode),
    JSON.stringify({ version: 1, geminiOptIn: enabled, updatedAt: new Date().toISOString() }),
  );
  if (!saved.ok) throw new Error(saved.sfalma.minima);
}
