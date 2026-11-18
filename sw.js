/* Service worker: sieć najpierw (3 s), potem pamięć podręczna — gra działa po chwilowej utracie sieci. */
var CACHE = 'cm1-v1';
var FILES = ['./', 'index.html', 'host.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/vendor/qrcode.js', 'js/util.js', 'js/content/core.js', 'js/content/act1.js', 'js/content/act2.js', 'js/content/act3.js', 'js/content/act4.js',
  'js/content/act5.js', 'js/content/act6.js', 'js/content.js', 'js/engine.js', 'js/ui.js', 'js/app.js', 'js/host.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.slice(-8) === 'ping.txt') return; /* zegar zawsze z sieci */
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (m) { if (m && !done) { done = true; resolve(m); } });
    }, 3000);
    fetch(req).then(function (r) {
      clearTimeout(timer);
      if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      if (!done) { done = true; resolve(r); }
    }).catch(function () {
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (m) { if (!done) { done = true; resolve(m || Response.error()); } });
    });
  }));
});
