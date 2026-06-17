// Service Worker mínimo: cachea solo la shell de la app para que abra rápido.
// No cachea llamadas a la API (siempre necesita conexión para guardar/consultar).
const CACHE_NAME = "aforo-shell-v2";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a la API del backend (siempre deben ir a la red)
  if (url.pathname.startsWith("/aforo/")) {
    return;
  }

  // Network-first: siempre intenta traer la versión más nueva primero.
  // Si no hay conexión, recién ahí usa lo que tenga cacheado.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
