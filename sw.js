// Service Worker — cache hors-ligne complet
const CACHE = 'negociateur-v9';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/ui.js',
  './js/audio.js',
  './js/advice.js',
  './js/campaign.js',
  './js/engine.js',
  './js/pixel.js',
  './js/pixelcut.js',
  './js/pixelplan.js',
  './js/data/plans.js',
  './js/data/generator.js',
  './js/data/cutscenes.js',
  './js/data/cards.js',
  './js/data/terror.js',
  './js/data/skills.js',
  './js/data/options.js',
  './js/data/missions/index.js',
  './js/data/missions/tutoriel.js',
  './js/data/missions/braquage.js',
  './js/data/missions/hopital.js',
  './js/data/missions/secte.js',
  './js/data/missions/prison.js',
  './js/data/missions/ferry.js',
  './assets/icon.svg',
  './assets/icon-maskable.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
