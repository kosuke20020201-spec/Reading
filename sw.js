// キャッシュしないシンプルなService Worker
// HTMLとJSは常にネットワークから取得

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // 全キャッシュ削除
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

// キャッシュなし・全てネットワークから取得
self.addEventListener('fetch', e => {
  if (e.request.url.includes('anthropic.com')) return;
  if (e.request.url.includes('script.google.com')) return;
  if (!e.request.url.startsWith('http')) return;
  // 何もしない = ブラウザ標準の動作（常にネットワーク）
});
