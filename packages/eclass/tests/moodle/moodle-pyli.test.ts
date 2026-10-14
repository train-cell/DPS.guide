import { describe, expect, it, vi } from 'vitest';
import type { Apotelesma, HttpAitima, HttpApantisi, HttpPyli } from '@dps/core';
import { ok } from '@dps/core';
import { MoodlePyli } from '../../src/moodle/moodle-pyli.js';

function httpWith(handler: (request: HttpAitima) => HttpApantisi): {
  readonly http: HttpPyli;
  readonly aitima: ReturnType<typeof vi.fn<(request: HttpAitima) => Promise<Apotelesma<HttpApantisi>>>>;
} {
  const aitima = vi.fn(async (request: HttpAitima): Promise<Apotelesma<HttpApantisi>> => ok(handler(request)));
  return { http: { aitima }, aitima };
}

describe('MoodlePyli authentication and REST transport', () => {
  it('sends Web Services tokens in the POST body, never in the URL', async () => {
    const { http, aitima } = httpWith((request) => ({
      katastasi: 200,
      kefalides: {},
      teliko_url: request.url,
      keimeno: JSON.stringify({ sitename: 'Moodle' }),
    }));
    const connector = new MoodlePyli({
      http,
      base_url: 'https://moodle.example.edu',
      username: '',
      password: '',
      webservice_token: 'test-only-secret-token',
    });

    const result = await connector.syndesi();

    expect(result.ok).toBe(true);
    expect(aitima).toHaveBeenCalledTimes(1);
    const request = aitima.mock.calls[0]?.[0];
    expect(request?.methodos).toBe('POST');
    expect(request?.url).toBe('https://moodle.example.edu/webservice/rest/server.php');
    expect(request?.url).not.toContain('test-only-secret-token');
    expect(request?.soma_forma).toEqual({
      wstoken: 'test-only-secret-token',
      wsfunction: 'core_webservice_get_site_info',
      moodlewsrestformat: 'json',
    });
  });

  it('keeps the Web Services endpoint under a Moodle subdirectory', async () => {
    const { http, aitima } = httpWith((request) => ({
      katastasi: 200,
      kefalides: {},
      teliko_url: request.url,
      keimeno: JSON.stringify({ sitename: 'Moodle' }),
    }));
    const connector = new MoodlePyli({
      http,
      base_url: 'https://moodle.example.edu/courses/',
      username: '',
      password: '',
      webservice_token: 'test-only-secret-token',
    });

    await connector.syndesi();

    expect(aitima.mock.calls[0]?.[0].url).toBe('https://moodle.example.edu/courses/webservice/rest/server.php');
  });

  it('logs in through the standard form and discovers courses with the authenticated session', async () => {
    const { http, aitima } = httpWith((request) => {
      if (request.methodos === 'GET' && request.url.endsWith('/login/index.php')) {
        return {
          katastasi: 200,
          kefalides: { 'set-cookie': 'MoodleSession=before; path=/' },
          teliko_url: request.url,
          keimeno: '<form action="/login/index.php"><input type="hidden" name="logintoken" value="nonce"><input name="username"><input name="password"><button type="submit" name="loginbtn" value="Log in">Log in</button></form>',
        };
      }
      if (request.methodos === 'POST') {
        return {
          katastasi: 200,
          kefalides: { 'set-cookie': 'MoodleSession=authenticated; path=/' },
          teliko_url: 'https://moodle.example.edu/my/',
          keimeno: 'Welcome',
        };
      }
      return {
        katastasi: 200,
        kefalides: {},
        teliko_url: request.url,
        keimeno: '<a href="/course/view.php?id=42">Αλγόριθμοι</a>',
      };
    });
    const connector = new MoodlePyli({
      http,
      base_url: 'https://moodle.example.edu',
      username: 'student',
      password: ' password with spaces ',
    });

    const login = await connector.syndesi();
    const courses = await connector.fere_mathimata();

    expect(login.ok).toBe(true);
    expect(courses).toMatchObject({
      ok: true,
      timi: [{ kodikos: '42', titlos: 'Αλγόριθμοι', epilegmeno: true }],
    });
    const formRequest = aitima.mock.calls.find(([request]) => request.methodos === 'POST')?.[0];
    expect(formRequest?.soma_forma).toMatchObject({
      username: 'student',
      password: ' password with spaces ',
      logintoken: 'nonce',
      loginbtn: 'Log in',
    });
    expect(aitima.mock.calls.some(([request]) => request.url.includes('MoodleSession=authenticated'))).toBe(false);
  });

  it('reports SSO-only login as unsupported with an actionable message', async () => {
    const { http } = httpWith((request) => ({
      katastasi: 200,
      kefalides: {},
      teliko_url: request.url,
      keimeno: '<a href="/auth/saml2/login.php">University SSO</a>',
    }));
    const connector = new MoodlePyli({
      http,
      base_url: 'https://moodle.example.edu',
      username: 'student',
      password: 'password',
    });

    const result = await connector.syndesi();

    expect(result).toMatchObject({
      ok: false,
      sfalma: { kodikos: 'MI_YPOSTIRIZOMENO', minima: expect.stringContaining('SSO') },
    });
  });
});
