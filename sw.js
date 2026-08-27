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
  // Always fetch fresh network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
