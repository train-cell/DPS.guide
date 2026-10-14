import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Server } from 'node:http';
import type { ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { localBridgePlugin } from '../../bridge/local-bridge.js';

type BridgeHandler = (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;

interface RunningBridge {
  readonly baseUrl: string;
  readonly origin: string;
  readonly pairingCode: string;
  readonly server: Server;
}

let bridge: RunningBridge;

async function startBridge(): Promise<RunningBridge> {
  const routes = new Map<string, BridgeHandler>();
  const logs: string[] = [];
  const server = createServer((request, response) => {
    const route = [...routes.entries()].find(([prefix]) => request.url?.startsWith(prefix))?.[1];
    if (route === undefined) {
      response.writeHead(404).end();
      return;
    }
    void route(request, response);
  });
  const fakeViteServer = {
    middlewares: { use: (path: string, handler: BridgeHandler) => routes.set(path, handler) },
    httpServer: server,
    config: { logger: { info: (message: string) => logs.push(message) } },
  } as unknown as ViteDevServer;
  localBridgePlugin().configureServer?.(fakeViteServer);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Bridge test server did not bind a TCP port');
  const pairingCode = logs.join('\n').match(/pairing code: ([0-9A-F]{16})/)?.[1];
  if (pairingCode === undefined) throw new Error('Bridge did not log its pairing code after startup');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { baseUrl, origin: baseUrl, pairingCode, server };
}

async function closeServer(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function pair(): Promise<string> {
  const response = await fetch(`${bridge.baseUrl}/__dps_bridge/pair`, {
    method: 'POST',
    headers: { Origin: bridge.origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: bridge.pairingCode }),
  });
  expect(response.status).toBe(200);
  const payload: unknown = await response.json();
  expect(payload).toMatchObject({ token: expect.any(String) });
  return (payload as { token: string }).token;
}

function bridgeRequest(token: string | null, body: unknown, origin = bridge.origin): RequestInit {
  return {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(token === null ? {} : { 'x-dps-bridge-token': token }),
    },
    body: JSON.stringify(body),
  };
}

describe('local localhost bridge', () => {
  beforeEach(async () => { bridge = await startBridge(); });
  afterEach(async () => { await closeServer(bridge.server); });

  it('requires same-origin pairing and the server-start code before issuing a session token', async () => {
    const crossOrigin = await fetch(`${bridge.baseUrl}/__dps_bridge/pair`, {
      method: 'POST',
      headers: { Origin: 'http://attacker.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: bridge.pairingCode }),
    });
    expect(crossOrigin.status).toBe(403);

    const wrongCode = await fetch(`${bridge.baseUrl}/__dps_bridge/pair`, {
      method: 'POST',
      headers: { Origin: bridge.origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '0000000000000000' }),
    });
    expect(wrongCode.status).toBe(403);

    const token = await pair();
    expect(token).toHaveLength(43);
  });

  it('requires the memory token, same origin, an allowed method, and a safe target', async () => {
    const token = await pair();
    const envelope = { methodos: 'GET', url: 'http://127.0.0.1:1/', kefalides: {}, soma: null };
    const noToken = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(null, envelope));
    expect(noToken.status).toBe(403);

    const wrongOrigin = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(token, envelope, 'http://attacker.invalid'));
    expect(wrongOrigin.status).toBe(403);

    const insecureTarget = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(token, {
      ...envelope,
      url: 'http://example.com/',
    }));
    expect(insecureTarget.status).toBe(400);

    const unsupportedMethod = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(token, {
      ...envelope,
      methodos: 'DELETE',
    }));
    expect(unsupportedMethod.status).toBe(400);
  });

  it('forwards a paired request to loopback and preserves the upstream status and body', async () => {
    const upstream = createServer((_request, response) => {
      response.writeHead(201, { 'content-type': 'application/json' });
      response.end('{"models":[]}');
    });
    await new Promise<void>((resolve, reject) => {
      upstream.once('error', reject);
      upstream.listen(0, '127.0.0.1', resolve);
    });
    try {
      const address = upstream.address();
      if (address === null || typeof address === 'string') throw new Error('Upstream test server did not bind a TCP port');
      const response = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(await pair(), {
        methodos: 'GET',
        url: `http://127.0.0.1:${address.port}/api/tags`,
        kefalides: {},
        soma: null,
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get('x-dps-target-status')).toBe('201');
      expect(await response.text()).toBe('{"models":[]}');
    } finally {
      await closeServer(upstream);
    }
  });

  it('caps streamed responses even when the upstream omits Content-Length', async () => {
    const upstream = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/octet-stream' });
      response.end(Buffer.alloc(101 * 1024 * 1024));
    });
    await new Promise<void>((resolve, reject) => {
      upstream.once('error', reject);
      upstream.listen(0, '127.0.0.1', resolve);
    });
    try {
      const address = upstream.address();
      if (address === null || typeof address === 'string') throw new Error('Upstream test server did not bind a TCP port');
      const response = await fetch(`${bridge.baseUrl}/__dps_bridge/http`, bridgeRequest(await pair(), {
        methodos: 'GET',
        url: `http://127.0.0.1:${address.port}/large`,
        kefalides: {},
        soma: null,
      }));
      expect(response.status).toBe(413);
      expect(await response.json()).toMatchObject({ error: expect.stringContaining('100 MB') });
    } finally {
      await closeServer(upstream);
    }
  });

  it('rate limits repeated invalid pairing codes', async () => {
    const attempts = await Promise.all(Array.from({ length: 6 }, () => fetch(`${bridge.baseUrl}/__dps_bridge/pair`, {
      method: 'POST',
      headers: { Origin: bridge.origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '0000000000000000' }),
    })));
    expect(attempts.slice(0, 5).map(({ status }) => status)).toEqual([403, 403, 403, 403, 403]);
    expect(attempts[5]?.status).toBe(429);
  });
});
