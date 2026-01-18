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

// Track connection state for recovery detection
let lastKnownState = 'healthy'

// ============================================================================
// Install - Cache all static assets
// ============================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ============================================================================
// Activate - Clean old caches
// ============================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

// ============================================================================
// Fetch - Enhanced with instant error detection
// ============================================================================
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip WebSocket upgrades
  if (request.headers.get('Upgrade') === 'websocket') return

  // Skip cross-origin requests
  if (url.origin !== location.origin) return

  // API routes (/v1/* and /health) - network only with INSTANT error detection
  if (url.pathname.startsWith('/v1/') || url.pathname === '/health') {
    event.respondWith(handleApiRequest(request, url))
    return
  }

  // Static assets - cache first with network fallback
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

// ============================================================================
// API Request Handler - Instant error detection
// ============================================================================
async function handleApiRequest(request, url) {
  try {
    const response = await fetch(request)
    
    // INSTANT detection of 5xx errors
    if (!response.ok && response.status >= 500) {
      broadcastToClients({
        type: 'SERVER_ERROR',
        path: url.pathname,
        status: response.status,
        timestamp: Date.now()
      })
      lastKnownState = 'error'
    } else if (response.ok && lastKnownState !== 'healthy') {
      // Server recovered - broadcast recovery
      broadcastToClients({
        type: 'SERVER_RECOVERED',
        path: url.pathname,
        timestamp: Date.now()
      })
      lastKnownState = 'healthy'
    }
    
    return response
  } catch (error) {
    // INSTANT detection of network failures
    broadcastToClients({
      type: 'NETWORK_ERROR',
      path: url.pathname,
      message: error.message || 'Network request failed',
      timestamp: Date.now()
    })
    lastKnownState = 'error'
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: 'Network error',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// ============================================================================
// Broadcast to all clients
// ============================================================================
async function broadcastToClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(client => {
    client.postMessage(message)
  })
}
