const CACHE_NAME = 'nsp-v1'
const RUNTIME_CACHE = 'nsp-runtime-v1'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets as needed
]

const API_CACHE = 'nsp-api-v1'
const CRITICAL_APIS = [
  '/api/v1/alerts',
  '/api/v1/users/me',
  '/api/v1/system/status',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - network interception
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Skip non-GET requests for now (can be extended)
  if (request.method !== 'GET') {
    return
  }

  event.respondWith(handleRequest(request, url))
})

async function handleRequest(request, url) {
  try {
    // Try network first (Network First strategy)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful network responses
      if (shouldCacheRequest(url)) {
        const cache = await caches.open(RUNTIME_CACHE)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
    
    // Network failed, try cache
    const cachedResponse = await getCachedResponse(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Nothing in cache, return offline page
    return getOfflineResponse()
  } catch (error) {
    console.error('Service Worker: Fetch error', error)
    
    // Try cache as fallback
    const cachedResponse = await getCachedResponse(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    return getOfflineResponse()
  }
}

function shouldCacheRequest(url) {
  // Cache static assets
  if (url.pathname === '/' || url.pathname.includes('/icons/')) {
    return true
  }
  
  // Cache API responses
  if (CRITICAL_APIS.some(api => url.pathname.startsWith(api))) {
    return true
  }
  
  // Don't cache dynamic content or admin APIs
  if (url.pathname.includes('/admin/') || 
      url.pathname.includes('/upload') ||
      url.pathname.includes('/export')) {
    return false
  }
  
  return true
}

async function getCachedResponse(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  return cache.match(request)
}

function getOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'No network connection available',
      cached: false
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
      }
    }
  )
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'alert-sync') {
    event.waitUntil(syncOfflineAlerts())
  }
})

async function syncOfflineAlerts() {
  try {
    // Get cached offline alerts
    const cache = await caches.open(API_CACHE)
    const cachedAlerts = await cache.match('/offline-alerts')
    
    if (cachedAlerts) {
      const alerts = await cachedAlerts.json()
      
      // Try to sync each alert
      for (const alert of alerts) {
        try {
          const response = await fetch('/api/v1/alerts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(alert),
          })
          
          if (response.ok) {
            // Remove from offline queue
            await cache.delete('/offline-alerts')
            console.log('Service Worker: Synced offline alert', alert.id)
          }
        } catch (error) {
          console.error('Service Worker: Failed to sync alert', alert.id, error)
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync error', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event)
  
  const options = {
    body: event.data?.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    tag: event.data?.tag || 'default',
    data: event.data?.data,
    requireInteraction: event.data?.requireInteraction || false,
    actions: event.data?.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(
      event.data?.title || 'National Security Platform',
      options
    )
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event)
  
  event.notification.close()
  
  // Open app to relevant page
  if (event.action) {
    // Handle specific action
    self.clients.openWindow(event.action)
  } else {
    // Open main app
    self.clients.openWindow('/')
  }
})

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_CLEANUP') {
    cleanupOldCache()
  }
})

async function cleanupOldCache() {
  try {
    const cacheNames = await caches.keys()
    const currentCache = await caches.open(RUNTIME_CACHE)
    
    for (const cacheName of cacheNames) {
      if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
        await caches.delete(cacheName)
      }
    }
    
    // Clean old entries from current cache (older than 7 days)
    const requests = await currentCache.keys()
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    
    for (const request of requests) {
      const response = await currentCache.match(request)
      if (response) {
        const dateHeader = response.headers.get('date')
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime()
          if (responseDate < sevenDaysAgo) {
            await currentCache.delete(request)
          }
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Cache cleanup error', error)
  }
}

// Periodic cleanup (run daily)
setInterval(cleanupOldCache, 24 * 60 * 60 * 1000)

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      event.ports[0].postMessage({ success: true })
      break
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ 
        version: '1.0.0',
        cacheName: CACHE_NAME 
      })
      break
      
    case 'CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status)
      })
      break
      
    default:
      console.log('Service Worker: Unknown message type', type)
  }
})

async function getCacheStatus() {
  try {
    const cache = await caches.open(RUNTIME_CACHE)
    const requests = await cache.keys()
    
    return {
      size: requests.length,
      entries: requests.length,
      cacheName: CACHE_NAME,
      lastModified: Date.now()
    }
  } catch (error) {
    return {
      size: 0,
      entries: 0,
      cacheName: CACHE_NAME,
      lastModified: Date.now(),
      error: error.message
    }
  }
}