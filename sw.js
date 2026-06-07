const CACHE = 'reading-log-v3';
const ASSETS = [
  './reading-log.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap'
];

// インストール：アセットを事前キャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // 即座に新SWを有効化
  );
});

// アクティベート：古いキャッシュを全削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // 全タブを即座に新SWに切り替え
  );
});

// フェッチ：HTMLは常にネットワーク優先、他はキャッシュ優先
self.addEventListener('fetch', e => {
  // Anthropic API はキャッシュしない
  if (e.request.url.includes('anthropic.com')) return;

  // HTMLファイルはネットワーク優先（更新をすぐ反映）
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // オフラインならキャッシュから
    );
    return;
  }

  // その他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});
