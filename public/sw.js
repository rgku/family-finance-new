const CACHE_NAME = 'famflow-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;
  
  // API requests - network only
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('.supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ 
          error: 'Offline', 
          message: 'No connection available' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Static assets - cache first
  if (event.request.url.includes('/_next/static/') ||
      event.request.url.includes('/_next/image/') ||
      event.request.url.match(/\.(js|css|png|jpg|svg|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
    return;
  }
  
  // HTML pages - network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML responses
        if (response && response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            return cachedResponse;
          }
          
          // If no cached version, return offline page
          console.log('[SW] No cached version, returning offline response');
          return new Response(`
            <!DOCTYPE html>
            <html lang="pt-PT">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - FamFlow</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                  }
                  .container {
                    text-align: center;
                    max-width: 400px;
                  }
                  h1 {
                    font-size: 2em;
                    margin-bottom: 10px;
                  }
                  p {
                    color: #94a3b8;
                    line-height: 1.6;
                  }
                  .icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="icon">📵</div>
                  <h1>Sem Ligação</h1>
                  <p>Não foi possível conectar à internet. Verifica a tua conexão e tenta novamente.</p>
                  <p style="margin-top: 20px; font-size: 0.9em;">
                    Os teus dados estão guardados localmente e serão sincronizados quando voltares a estar online.
                  </p>
                </div>
              </body>
            </html>
          `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
  );
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
      event.waitUntil(
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('[SW] Background sync completed:', data);
          })
          .catch((error) => {
            console.error('[SW] Background sync failed:', error);
          })
      );
    }
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  
  const options = {
    body: data?.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data?.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data?.title || 'FamFlow', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('[SW] Service Worker loaded');
