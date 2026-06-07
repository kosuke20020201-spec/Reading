const CACHE = 'reading-log-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時に基本ファイルをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先・オフライン時のみキャッシュ使用
self.addEventListener('fetch', e => {
  // Anthropic APIとGoogle Fontsはスルー
  if (e.request.url.includes('anthropic.com')) return;
  if (e.request.url.includes('script.google.com')) return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功したらキャッシュに保存して返す
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // オフラインならキャッシュから返す
        return caches.match(e.request);
      })
  );
});
