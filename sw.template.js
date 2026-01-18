const CACHE_NAME = 'nemesis-__CACHE_VERSION__'

const STATIC_ASSETS = [
  // Core
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/icon.png',

  // CSS modules
  '/css/base.css',
  '/css/backgrounds.css',
  '/css/title.css',
  '/css/crt.css',
  '/css/dialogue.css',
  '/css/header.css',
  '/css/avatar.css',
  '/css/panels.css',
  '/css/pages.css',
  '/css/connection.css',
  '/css/wallet.css',
  '/css/battle.css',
  '/css/bridge.css',
  '/css/edit-mode.css',
  '/css/utils.css',
  '/css/responsive.css',

  // Fonts
  '/fonts/Quicksand/Quicksand-VariableFont_wght.woff2',
  '/fonts/Cinzel/Cinzel-VariableFont_wght.woff2',

  // Nemesis-chan sprites
  '/nemesis-chan/concerned.png',
  '/nemesis-chan/excited.png',
  '/nemesis-chan/happy.png',
  '/nemesis-chan/inquisitive.png',
  '/nemesis-chan/intro.png',
  '/nemesis-chan/kawaii.png',
  '/nemesis-chan/loss.png',
  '/nemesis-chan/pleased.png',
  '/nemesis-chan/sly.png',
  '/nemesis-chan/talkative.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API routes - always go to network for live data
  if (url.pathname.startsWith('/v1/')) return

  // Skip WebSocket upgrade requests
  if (request.headers.get('Upgrade') === 'websocket') return

  // Skip cross-origin requests
  if (url.origin !== location.origin) return

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached

      return fetch(request).then(response => {
        // Only cache successful same-origin responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => {
        // Offline fallback
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
