/** Stable Gemini model used for new installs and migrated settings. */
export const PROEPILOGI_GEMINI_MONTELO = 'gemini-3.8-flash';

/** Gemini models currently offered by the application. Preview models are labeled explicitly. */
export const GEMINI_MODEL_OPTIONS = [
  { id: 'gemini-3.8-flash', titlos: 'Gemini 3.8 Flash' },
  { id: 'gemini-3.1-pro-preview', titlos: 'Gemini 3.1 Pro · preview' },
] as const;

/** Moves saved model selections from IDs that are restricted for new Gemini API users. */
export function migrateGeminiModel(model: string): string {
  if (model === 'gemini-2.5-flash') return PROEPILOGI_GEMINI_MONTELO;
  if (model === 'gemini-2.5-pro') return 'gemini-3.1-pro-preview';
  return model;
}
