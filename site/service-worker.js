// Service worker minimo: mette in cache la dashboard (che e' un unico file
// autosufficiente, senza dipendenze esterne salvo il font Google) cosi' che
// si possa riaprire anche senza rete locale, una volta caricata la prima volta.
const CACHE_NAME = 'seriea-analytics-v2';
const ASSETS = [
  './serie_a_analytics.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first per le icone (non cambiano quasi mai). Network-first per la
// pagina HTML e il manifest: cosi', ogni volta che riapri l'app con il
// server locale raggiungibile, vedi SEMPRE l'ultima versione generata dalla
// pipeline. La cache viene usata solo come rete di sicurezza se il server
// locale non e' raggiungibile (es. l'hai chiuso o non sei sulla stessa rete).
const NETWORK_FIRST = ['serie_a_analytics.html', 'manifest.json'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNetworkFirst = NETWORK_FIRST.some((f) => url.pathname.endsWith(f)) || event.request.mode === 'navigate';

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
