const CACHE_NAME = 'nemesis-__CACHE_VERSION__'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/icon.png',
  '/fonts/Quicksand/Quicksand-VariableFont_wght.woff2',
  '/fonts/Cinzel/Cinzel-VariableFont_wght.woff2',
  '/nemesis-chan/concerned.png',
  '/nemesis-chan/excited.png',
  '/nemesis-chan/happy.png',
  '/nemesis-chan/inquisitive.png',
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
  
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== location.origin) return
  
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
