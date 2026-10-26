/* جوونه | سرویس‌ورکر
   کار آن: بعد از اولین باز شدن اپ، همه‌چیز را روی گوشی نگه می‌دارد تا بدون اینترنت هم کار کند.
   اگر فایل‌های اپ را عوض کردی، عدد VERSION را یکی بالا ببر تا نسخه‌ی قدیمی پاک شود. */
const VERSION = 'jooneh-v3';
const CORE = [
  './', 'index.html', 'style.css', 'app.js', 'manifest.json',
  'data/app.json', 'data/plants.json', 'data/symptoms.json', 'data/finder.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon.png', 'icons/icon.svg',
  'images/pothos.jpg', 'images/snake-plant.jpg', 'images/zz-plant.jpg', 'images/monstera.jpg',
  'images/fiddle-leaf-fig.jpg', 'images/aloe-vera.jpg', 'images/spider-plant.jpg',
  'images/boston-fern.jpg', 'images/pilea.jpg', 'images/echeveria.jpg', 'images/javoone.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* اول از حافظه‌ی گوشی می‌خواند (سریع و آفلاین) و همزمان نسخه‌ی تازه را در پس‌زمینه می‌گیرد. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || (await cache.match('./'));
    return new Response('', { status: 504, statusText: 'offline' });
  })());
});
