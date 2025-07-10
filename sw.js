// Genshi Studio Service Worker
// Provides offline functionality and caching for the application

const CACHE_NAME = 'genshi-studio-v1'
const STATIC_CACHE_NAME = 'genshi-studio-static-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/genshi-studio/',
  '/genshi-studio/manifest.json',
  '/genshi-studio/favicon.ico',
  '/genshi-studio/index.html'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Install failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed', error)
      })
  )
})

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip POST requests and other non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url)
          return cachedResponse
        }

        // Otherwise fetch from network and cache the response
        return fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse
            }

            // Clone the response as it can only be consumed once
            const responseToCache = networkResponse.clone()

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Caching new response', event.request.url)
                cache.put(event.request, responseToCache)
              })

            return networkResponse
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error)
            
            // If we're trying to fetch the main page and we're offline,
            // return a cached version or a simple offline page
            if (event.request.destination === 'document') {
              return caches.match('/genshi-studio/') || caches.match('/genshi-studio/index.html')
            }
            
            // For other requests, just throw the error
            throw error
          })
      })
  )
})

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Background sync for offline pattern saves (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag)
    
    if (event.tag === 'pattern-sync') {
      event.waitUntil(syncPatterns())
    }
  })
}

// Sync patterns when back online
async function syncPatterns() {
  try {
    // Get pending pattern saves from IndexedDB or localStorage
    // This would integrate with the PatternStorageService
    console.log('Service Worker: Syncing patterns...')
    
    // Implementation would depend on the pattern storage system
    // For now, just log that sync is attempted
    return Promise.resolve()
  } catch (error) {
    console.error('Service Worker: Pattern sync failed', error)
    throw error
  }
}

// Notification handling for pattern sharing (if supported)
if ('showNotification' in self.registration) {
  self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.notification)
    
    event.notification.close()
    
    // Handle notification click - could open a specific pattern or page
    event.waitUntil(
      clients.openWindow('/genshi-studio/')
    )
  })
}

console.log('Service Worker: Script loaded')