// 缓存名称和版本
const CACHE_NAME = 'usdc-wallet-cache';
const CACHE_VERSION = 'v1.0.0';
const CACHE_PREFIX = `${CACHE_NAME}-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// 安装阶段：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PREFIX)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // 立即激活新的service worker
  self.skipWaiting();
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本的缓存
          if (cacheName.startsWith(CACHE_NAME) && cacheName !== CACHE_PREFIX) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有打开的客户端
  self.clients.claim();
});

// 监听fetch事件，实现离线优先策略
self.addEventListener('fetch', (event) => {
  // 对于API请求，我们使用网络优先策略，避免缓存动态数据
  // 特别处理汇率API，确保总是获取最新数据
  const isApiRequest = event.request.url.includes('/api/') || 
                      event.request.url.includes('/rpc') ||
                      event.request.url.includes('api');
  console.log('event.request.url ', event.request.url, isApiRequest)
  if (isApiRequest) {
    // 完全不缓存策略：API请求总是直接从网络获取，不使用缓存
    event.respondWith(
      fetch(event.request, {
        headers: {
          'Cache-Control': 'no-store' // 禁止缓存
        }
      }).catch(() => {
        // 网络请求失败时直接返回错误响应，不从缓存获取
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  } else {
    // 离线优先策略
    event.respondWith(
      caches.match(event.request).then((response) => {
        // 如果缓存中有匹配的响应，则返回缓存的响应
        if (response) {
          // 同时在后台更新缓存
          fetchAndUpdateCache(event.request);
          return response;
        }
        
        // 如果缓存中没有匹配的响应，则从网络获取
        return fetch(event.request).then((networkResponse) => {
          // 如果响应有效，则缓存一份副本
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_PREFIX).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // 如果网络请求也失败，则返回一个默认的离线页面
          return caches.match('/index.html');
        });
      })
    );
  }
});

// 在后台获取资源并更新缓存
function fetchAndUpdateCache(request) {
  fetch(request).then((response) => {
    if (response && response.status === 200 && response.type === 'basic') {
      const responseToCache = response.clone();
      caches.open(CACHE_PREFIX).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
  }).catch((error) => {
    console.error('Error updating cache:', error);
  });
}

// 监听消息事件，用于检查更新和激活新版本
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    // 检查服务器上的service worker是否有更新
    self.registration.update().then(() => {
      console.log('Service worker update checked');
      event.source.postMessage({ type: 'UPDATE_CHECKED' });
    });
  }
});



// 监听控制器变化事件，通知客户端有更新
self.addEventListener('controllerchange', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'APP_UPDATED' });
    });
  });
});