import { describe, it, expect, beforeEach } from 'vitest';
import {
  katagrapse_tilemetria,
  xronometrise,
  pare_tilemetria_arxeio,
  katharise_tilemetria,
  eksagoge_tilemetrias_json,
  scrub_eyaisthita_dedomena,
  MEGISTO_ORIO_EGGRAFON,
  me_tilemetria,
  paragogi_span_id,
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

  describe('me_tilemetria — Universal Observability Wrapper', () => {
    it('παράγει μοναδικό spanId', () => {
      const id1 = paragogi_span_id();
      const id2 = paragogi_span_id();
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    it('καταγράφει [START] και [SUCCESS] με κοινό spanId και υπολογισμό diarkeiaMs', async () => {
      const apotelesma = await me_tilemetria(
        'fortosi_dedomenon',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 15));
          return { vathmos: 10 };
        },
        { tmima: 'DIT' }
      );

      expect(apotelesma).toEqual({ vathmos: 10 });

      const arxeio = pare_tilemetria_arxeio();
      expect(arxeio).toHaveLength(2);

      const [startLog, successLog] = arxeio;
      expect(startLog?.minima).toBe('[START] fortosi_dedomenon');
      expect(startLog?.epipedo).toBe('info');
      expect(startLog?.metadedomena?.['tmima']).toBe('DIT');
      const spanId = startLog?.metadedomena?.['spanId'];
      expect(typeof spanId).toBe('string');

      expect(successLog?.minima).toBe('[SUCCESS] fortosi_dedomenon');
      expect(successLog?.epipedo).toBe('info');
      expect(successLog?.metadedomena?.['spanId']).toBe(spanId);
      expect(successLog?.metadedomena?.['tmima']).toBe('DIT');
      expect(successLog?.diarkeiaMs).toBeGreaterThanOrEqual(10);
      expect(successLog?.metadedomena?.['diarkeiaMs']).toBe(successLog?.diarkeiaMs);
    });

    it('καταγράφει [START] και [FAIL] με κοινό spanId σε περίπτωση σφάλματος και το αναπαράγει', async () => {
      const sfalmaDokiMis = new Error('Αποτυχία δικτύου eClass');

      await expect(
        me_tilemetria(
          'syndesi_eclass',
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw sfalmaDokiMis;
          },
          { url: 'https://eclass.uoa.gr' }
        )
      ).rejects.toThrow('Αποτυχία δικτύου eClass');

      const arxeio = pare_tilemetria_arxeio();
      expect(arxeio).toHaveLength(2);

      const [startLog, failLog] = arxeio;
      expect(startLog?.minima).toBe('[START] syndesi_eclass');
      expect(failLog?.minima).toBe('[FAIL] syndesi_eclass');
      expect(failLog?.epipedo).toBe('error');

      const spanId = startLog?.metadedomena?.['spanId'];
      expect(typeof spanId).toBe('string');
      expect(failLog?.metadedomena?.['spanId']).toBe(spanId);
      expect(failLog?.metadedomena?.['sfalma']).toBe('Αποτυχία δικτύου eClass');
      expect(failLog?.diarkeiaMs).toBeGreaterThanOrEqual(5);
    });

    it('αφαιρεί αυτόματα ευαίσθητα δεδομένα (scrubbing) από τα μεταδεδομένα στο [START] και [SUCCESS]', async () => {
      await me_tilemetria(
        'syndesi_me_kodiko',
        async () => 'ok',
        {
          xristis: 'student123',
          kodikos: 'mypassword123',
          token: 'bearer-secret-token',
          apiKey: 'key-ai-gemini',
        }
      );

      const arxeio = pare_tilemetria_arxeio();
      expect(arxeio).toHaveLength(2);

      for (const log of arxeio) {
        expect(log.metadedomena?.['xristis']).toBe('student123');
        expect(log.metadedomena?.['kodikos']).toBe('[REDACTED]');
        expect(log.metadedomena?.['token']).toBe('[REDACTED]');
        expect(log.metadedomena?.['apiKey']).toBe('[REDACTED]');
      }
    });
  });
});
