import { einai_asfales_tmima_diadromis } from '@dps/core';

/** Χτίζει εσωτερικό URL οδηγού μόνο για ασφαλές id ενότητας. */
export function diadromi_odigou(enotita_id: string): string | null {
  if (!einai_asfales_tmima_diadromis(enotita_id)) {
    return null;
  }
  return `/odigos/${encodeURIComponent(enotita_id)}`;
}
