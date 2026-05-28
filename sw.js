const CACHE_NAME = 'reading-notes-v1';
const ASSETS = [
  './',
  './index.html', // あなたのHTMLファイル名に合わせて変更してください
  './manifest.json',
  './icon-192.png'
];

// インストール時に初期アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワークリクエストの処理（ここでエラー対策を行っています）
self.addEventListener('fetch', (event) => {
  // 【超重要】リクエストのURLが http または https で始まる場合のみキャッシュ処理を行う
  // これにより、エラーの原因だった chrome-extension:// などの特殊な通信を完全に無視します
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // キャッシュがあればそれを返しつつ、バックグラウンドで最新版を取得して更新
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* オフライン時は無視 */});
        
        return cachedResponse;
      }

      // キャッシュがなければネットワークから取得
      return fetch(event.request).then((networkResponse) => {
        // 正常なレスポンスかつ、Apps Script(GAS)へのPOST通信（リダイレクト等）以外の通常リクエストをキャッシュ
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
