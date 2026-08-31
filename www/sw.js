/**
 * sw.js — Service Worker Offline & Cache Manager Switch Bénin 🇧🇯 (v4.0)
 */

const CACHE_NAME = "switch-benin-v4.5";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/assets/switch.css",
  "/assets/switch.config.js",
  "/assets/switch.router.js",
  "/assets/switch.engine.js",
  "/assets/switch.security.js",
  "/tableau_de_bord_mis_jour/code.html",
  "/tableau_de_bord_agent/code.html",
  "/tableau_de_bord_agent_mixte/code.html",
  "/catalogue_produits_services/code.html",
  "/caisse_marchand_pos/code.html",
  "/carnet_de_dettes_marchand/code.html",
  "/param_tres_et_profil_hybride/code.html",
  "/scanner_qr_code/code.html"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    !["http:", "https:"].includes(requestUrl.protocol) ||
    requestUrl.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch (error) {
        const cached = await caches.match(event.request);

        if (cached instanceof Response) {
          return cached;
        }

        return new Response("Réseau indisponible (hors ligne)", {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })()
  );
});
