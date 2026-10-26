import { describe, it, expect, beforeEach } from 'vitest';
import {
  katagrapse_tilemetria,
  xronometrise,
  pare_tilemetria_arxeio,
  katharise_tilemetria,
  eksagoge_tilemetrias_json,
  scrub_eyaisthita_dedomena,
  MEGISTO_ORIO_EGGRAFON,
} from './tilemetria.js';

describe('tilemetria — Structured Logging & Observability Engine', () => {
  beforeEach(() => {
    katharise_tilemetria();
  });

  it('καταγράφει συμβάντα με timestamp, επίπεδο και μήνυμα', () => {
    const eggrafi = katagrapse_tilemetria('info', 'Δοκιμαστικό μήνυμα', { xristis: 'test_user' });
    expect(eggrafi.epipedo).toBe('info');
    expect(eggrafi.minima).toBe('Δοκιμαστικό μήνυμα');
    expect(eggrafi.metadedomena).toEqual({ xristis: 'test_user' });
    expect(eggrafi.timestamp).toBeDefined();

    const arxeio = pare_tilemetria_arxeio();
    expect(arxeio).toHaveLength(1);
    expect(arxeio[0]?.minima).toBe('Δοκιμαστικό μήνυμα');
  });

  it('διατηρεί κυκλικό buffer με μέγιστο όριο εγγραφών', () => {
    for (let i = 0; i < MEGISTO_ORIO_EGGRAFON + 50; i++) {
      katagrapse_tilemetria('debug', `Μήνυμα ${i}`);
    }
    const arxeio = pare_tilemetria_arxeio();
    expect(arxeio).toHaveLength(MEGISTO_ORIO_EGGRAFON);
    expect(arxeio[arxeio.length - 1]?.minima).toBe(`Μήνυμα ${MEGISTO_ORIO_EGGRAFON + 49}`);
  });

  it('xronometrise μετράει τη διάρκεια εκτέλεσης σε ms', async () => {
    const { apotelesma, diarkeiaMs } = await xronometrise('ypologismos_test', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 42;
    });

    expect(apotelesma).toBe(42);
    expect(diarkeiaMs).toBeGreaterThanOrEqual(15);

    const arxeio = pare_tilemetria_arxeio();
    const telefteo = arxeio[arxeio.length - 1];
    expect(telefteo?.minima).toContain('ypologismos_test');
    expect(telefteo?.diarkeiaMs).toBe(diarkeiaMs);
  });

  it('αποκρύπτει (scrubbing) ευαίσθητα πεδία όπως passwords, tokens και API keys', () => {
    const akatharto = {
      onoma: 'foititis',
      kodikos: 'superSecret123!',
      token: 'jwt_secret_token_abc',
      apiKey: 'ai_llm_key_xyz',
      nested: {
        pass: 'nested_secret',
        auth: 'bearer 999',
      },
    };

    const katharo = scrub_eyaisthita_dedomena(akatharto) as Record<string, unknown>;
    expect(katharo.onoma).toBe('foititis');
    expect(katharo.kodikos).toBe('[REDACTED]');
    expect(katharo.token).toBe('[REDACTED]');
    expect(katharo.apiKey).toBe('[REDACTED]');

    const nested = katharo.nested as Record<string, unknown>;
    expect(nested.pass).toBe('[REDACTED]');
    expect(nested.auth).toBe('[REDACTED]');
  });

  it('εξάγει έγκυρο JSON report για διάγνωση προβλημάτων', () => {
    katagrapse_tilemetria('info', 'LMS Sync εκκίνησε');
    katagrapse_tilemetria('warn', 'Αργή απόκριση δικτύου', { latency: 1500 });
    katagrapse_tilemetria('error', 'Σφάλμα parsing αρχείου', { arxeio: 'slides.pdf' });

    const json = eksagoge_tilemetrias_json();
    const parsed: unknown = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed as unknown[]).length).toBe(3);
  });
});
