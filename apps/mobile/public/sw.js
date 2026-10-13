const CACHE_NAME = 'dps-guide-shell-v1';
const SHELL_URL = new URL('./', self.registration.scope).href;
async function cacheShellResponse(response) {
  if (!response || !response.ok) return;
  const html = await response.clone().text();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const clean = new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(SHELL_URL, clean);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try { await cacheShellResponse(await fetch(SHELL_URL, { cache: 'no-store' })); }
    finally { await self.skipWaiting(); }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('dps-guide-') && key !== CACHE_NAME) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/__dps_bridge/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        await cacheShellResponse(response);
        return response;
      } catch {
        const cached = await caches.match(SHELL_URL);
        return cached || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/ocr/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/icon.svg') {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
