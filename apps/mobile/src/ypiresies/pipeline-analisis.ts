import type {
  Apotelesma,
  EclassPyli,
  KatevasmaPyli,
  LlmAitimaJson,
  LlmAitimaKeimenou,
  LlmPyli,
} from '@dps/core';
import { apotyxia } from '@dps/core';
import { me_cache } from '@dps/ai';
import { odigos_mathimatos, trekse_analysi } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { OdigosMeta, XartisMathimatos } from '@dps/core';
import type { Periballon } from '../periballon/periballon.js';
import { createLocalOcrPort } from './topiko-ocr.js';
import type { GeminiGenerationRequest } from './ai-generation-approval.js';

export type AuthorizeCourseGeneration = (request: GeminiGenerationRequest) => Promise<boolean>;

function promptForJson<T>(request: LlmAitimaJson<T>): string {
  return `SYSTEM\n${request.systima}\n\nUSER\n${request.xristis}`;
}

function promptForText(request: LlmAitimaKeimenou): string {
  return `SYSTEM\n${request.systima}\n\n${request.minimata.map(({ rolos, keimeno }) => `${rolos.toUpperCase()}\n${keimeno}`).join('\n\n')}`;
}

/** Wraps every uncached provider request in the same per-course Gemini approval policy. */
export function createAuthorizedCourseLlm(
  provider: LlmPyli,
  model: string,
  purpose: string,
  authorize: AuthorizeCourseGeneration,
): LlmPyli {
  async function permit(prompt: string): Promise<Apotelesma<void>> {
    const isGemini = model.toLowerCase().startsWith('gemini-');
    if (!isGemini || await authorize({ model, purpose, prompt })) {
      return { ok: true, timi: undefined };
    }
    return apotyxia('AKYROTHIKE', 'Η αποστολή στο μοντέλο ακυρώθηκε ή δεν εγκρίθηκε.');
  }

  return {
    montelo: model,
    async parage_json<T>(request: LlmAitimaJson<T>) {
      const approved = await permit(promptForJson(request));
      return approved.ok ? provider.parage_json(request) : approved;
    },
    async parage_keimeno(request: LlmAitimaKeimenou) {
      const approved = await permit(promptForText(request));
      return approved.ok ? provider.parage_keimeno(request) : approved;
    },
  };
}

function unavailable<T>(message: string): Apotelesma<T> {
  return apotyxia('MI_YPOSTIRIZOMENO', message);
}

/** A pipeline limited to analysis of already-synced device-local files. */
export function createCourseAnalysisPipeline(
  periballon: Periballon,
  courseCode: string,
  model: string,
  authorize: AuthorizeCourseGeneration,
): EisodosPipeline {
  const eclass: EclassPyli = {
    async syndesi() {
      return unavailable('Η ανάλυση δεν συνδέεται στο LMS. Συγχρόνισε πρώτα το μάθημα.');
    },
    async fere_mathimata() {
      return unavailable('Η ανάλυση δεν ανακτά μαθήματα από το LMS.');
    },
    async fere_dentro_arxeion() {
      return unavailable('Η ανάλυση δεν ανακτά αρχεία από το LMS.');
    },
  };
  const katevasma: KatevasmaPyli = {
    async katevase() {
      return unavailable('Η ανάλυση δεν κατεβάζει αρχεία. Συγχρόνισε πρώτα το μάθημα.');
    },
  };
  const guarded = createAuthorizedCourseLlm(periballon.llm, model, 'ανάλυση και δημιουργία εκπαιδευτικού περιεχομένου', authorize);
  const llm = me_cache(guarded, periballon.apothiki, `${courseCode}/.spoudes/cache/llm`);
  return {
    eclass,
    apothiki: periballon.apothiki,
    katevasma,
    ocr: createLocalOcrPort(),
    llm,
    mystika: periballon.mystika,
    rologi: periballon.rologi,
    katagrafi: periballon.katagrafi,
    riza: '',
  };
}

export async function generateCourseMap(
  periballon: Periballon,
  courseCode: string,
  model: string,
  authorize: AuthorizeCourseGeneration,
): Promise<Apotelesma<XartisMathimatos>> {
  return trekse_analysi(createCourseAnalysisPipeline(periballon, courseCode, model, authorize), courseCode);
}

export async function generateCourseGuide(
  periballon: Periballon,
  courseCode: string,
  sectionId: string,
  model: string,
  authorize: AuthorizeCourseGeneration,
): Promise<Apotelesma<OdigosMeta>> {
  return odigos_mathimatos(
    createCourseAnalysisPipeline(periballon, courseCode, model, authorize),
    courseCode,
    sectionId,
  );
}
