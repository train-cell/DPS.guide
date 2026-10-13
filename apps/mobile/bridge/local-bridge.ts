import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer, PreviewServer } from 'vite';

const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 105 * 1024 * 1024;
const METHODS = new Set(['GET', 'POST', 'HEAD']);
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const PAIRING_WINDOW_MS = 60_000;
const MAX_PAIRING_ATTEMPTS = 5;

interface BridgeRequest {
  readonly methodos: string;
  readonly url: string;
  readonly kefalides: Record<string, string>;
  readonly soma: string | null;
}

function readJson(request: IncomingMessage, maxBytes = MAX_REQUEST_BYTES): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let length = 0;
    request.on('data', (chunk: Buffer) => {
      length += chunk.byteLength;
      if (length > maxBytes) {
        reject(new Error('request too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown); }
      catch { reject(new Error('invalid json')); }
    });
    request.on('error', reject);
  });
}

function sendError(response: ServerResponse, status: number, message: string): void {
  if (response.headersSent) return;
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify({ error: message }));
}

function isRequest(value: unknown): value is BridgeRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Partial<BridgeRequest>;
  return typeof request.methodos === 'string' && typeof request.url === 'string' &&
    typeof request.kefalides === 'object' && request.kefalides !== null &&
    (typeof request.soma === 'string' || request.soma === null);
}

function originMatches(request: IncomingMessage): boolean {
  const originHeader = request.headers.origin;
  const host = request.headers.host;
  if (typeof originHeader !== 'string' || typeof host !== 'string') return false;
  try {
    const origin = new URL(originHeader);
    return (origin.protocol === 'http:' || origin.protocol === 'https:') && origin.host === host;
  } catch {
    return false;
  }
}

function requestHeaders(source: Record<string, string>): Headers {
  const headers = new Headers();
  const forbidden = new Set(['host', 'content-length', 'connection', 'transfer-encoding', 'accept-encoding']);
  for (const [name, value] of Object.entries(source)) {
    if (!forbidden.has(name.toLowerCase()) && typeof value === 'string') headers.set(name, value);
  }
  return headers;
}

function createHandler(token: string) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'POST' || !originMatches(request)) {
      sendError(response, 403, 'Forbidden');
      return;
    }
    const provided = request.headers['x-dps-bridge-token'];
    const expected = Buffer.from(token);
    const actual = Buffer.from(typeof provided === 'string' ? provided : '');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      sendError(response, 403, 'Bridge token rejected');
      return;
    }
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      sendError(response, 415, 'JSON required');
      return;
    }

    let incoming: unknown;
    try { incoming = await readJson(request); }
    catch { sendError(response, 400, 'Invalid or oversized request'); return; }
    if (!isRequest(incoming) || !METHODS.has(incoming.methodos)) {
      sendError(response, 400, 'Invalid bridge request');
      return;
    }

    let target: URL;
    try {
      target = new URL(incoming.url);
      const isLoopbackHttp = target.protocol === 'http:' && LOOPBACK_HOSTS.has(target.hostname);
      if (target.protocol !== 'https:' && !isLoopbackHttp) throw new Error('HTTPS required');
      if (target.username || target.password || target.hash) throw new Error('Invalid URL');
    } catch {
      sendError(response, 400, 'Only valid HTTPS targets are supported (HTTP is allowed for localhost Ollama)');
      return;
    }

    const controller = new AbortController();
    request.once('aborted', () => controller.abort());
    const timer = setTimeout(() => controller.abort(), 180_000);
    try {
      const headers = requestHeaders(incoming.kefalides);
      const outgoing = await fetch(target, {
        method: incoming.methodos,
        headers,
        ...(incoming.methodos !== 'GET' && incoming.methodos !== 'HEAD' && incoming.soma !== null
          ? { body: incoming.soma }
          : {}),
        redirect: 'manual',
        signal: controller.signal,
      });
      const declaredLength = Number(outgoing.headers.get('content-length') ?? 0);
      if (declaredLength > MAX_RESPONSE_BYTES) {
        await outgoing.body?.cancel();
        sendError(response, 413, 'Response exceeds the 100 MB download limit');
        return;
      }
      const bytes = new Uint8Array(await outgoing.arrayBuffer());
      if (bytes.byteLength > MAX_RESPONSE_BYTES) {
        sendError(response, 413, 'Response exceeds the 100 MB download limit');
        return;
      }
      const targetHeaders: Record<string, string[]> = {};
      outgoing.headers.forEach((value, name) => { targetHeaders[name.toLowerCase()] = [value]; });
      const setCookies = outgoing.headers.getSetCookie?.();
      if (setCookies !== undefined && setCookies.length > 0) targetHeaders['set-cookie'] = setCookies;
      const encodedHeaders = Buffer.from(JSON.stringify(targetHeaders)).toString('base64url');
      response.writeHead(200, {
        'content-type': 'application/octet-stream',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'x-dps-target-status': String(outgoing.status),
        'x-dps-target-url': outgoing.url || target.href,
        'x-dps-target-headers': encodedHeaders,
      });
      response.end(bytes);
    } catch {
      sendError(response, controller.signal.aborted ? 504 : 502, 'Upstream request failed');
    } finally {
      clearTimeout(timer);
    }
  };
}

function createPairHandler(pairingCode: string, token: string) {
  const attempts = new Map<string, { count: number; startedAt: number }>();
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== 'POST' || !originMatches(request)) {
      sendError(response, 403, 'Forbidden');
      return;
    }
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      sendError(response, 415, 'JSON required');
      return;
    }

    const address = request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const prior = attempts.get(address);
    const record = prior && now - prior.startedAt < PAIRING_WINDOW_MS
      ? prior
      : { count: 0, startedAt: now };
    if (record.count >= MAX_PAIRING_ATTEMPTS) {
      attempts.set(address, record);
      sendError(response, 429, 'Too many pairing attempts; wait one minute and try again.');
      return;
    }
    record.count += 1;
    attempts.set(address, record);

    let incoming: unknown;
    try { incoming = await readJson(request, 1024); }
    catch { sendError(response, 400, 'Invalid pairing request'); return; }
    const code = typeof incoming === 'object' && incoming !== null && 'code' in incoming &&
      typeof incoming.code === 'string' ? incoming.code.trim().toUpperCase() : '';
    const expected = Buffer.from(pairingCode);
    const actual = Buffer.from(code);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      sendError(response, 403, 'Pairing code rejected');
      return;
    }
    attempts.delete(address);
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      pragma: 'no-cache',
      'x-content-type-options': 'nosniff',
    });
    response.end(JSON.stringify({ token }));
  };
}

/** Local-only proxy for browser LMS and AI requests; no request body or credentials are logged. */
export function localBridgePlugin(): Plugin {
  const token = randomBytes(32).toString('base64url');
  const pairingCode = randomBytes(8).toString('hex').toUpperCase();
  const handler = createHandler(token);
  const pairHandler = createPairHandler(pairingCode, token);
  const attach = (server: ViteDevServer | PreviewServer): void => {
    server.middlewares.use('/__dps_bridge/pair', pairHandler);
    server.middlewares.use('/__dps_bridge/http', handler);
    server.httpServer?.once('listening', () => {
      server.config.logger.info(`DPS local bridge pairing code: ${pairingCode}`, { clear: false, timestamp: true });
      server.config.logger.info('Enter this code in DPS.guide on devices you trust; it changes on every server start.', { clear: false });
    });
  };
  return {
    name: 'dps-local-bridge',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
