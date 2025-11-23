const CACHE_NAME = 'dete-v3.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/design-system.css',
  '/css/components.css',
  '/js/app.js',
  '/js/db.js',
  '/js/router.js',
  '/js/auth.js',
  '/js/sync.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] App shell cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone response for cache
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Return offline page for navigations
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return error for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    console.log('[SW] Syncing pending data...');
    
    // Open IndexedDB
    const db = await openIndexedDB();
    
    // Get pending sync operations
    const pending = await db.sync
      .where('synced')
      .equals(0)
      .toArray();
    
    console.log(`[SW] Found ${pending.length} pending operations`);
    
    // Sync each operation
    for (const operation of pending) {
      try {
        await performSync(operation);
        
        // Mark as synced
        await db.sync.update(operation.id, { synced: 1 });
        
        console.log('[SW] Synced operation:', operation.id);
      } catch (error) {
        console.error('[SW] Sync failed for operation:', operation.id, error);
      }
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DETEDatabase', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function performSync(operation) {
  // Implementation will be in sync.js
  console.log('[SW] Performing sync:', operation);
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push received');
  
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }
  
  const title = data.title || 'DETE Notification';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Message handler (for communication with app)
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});