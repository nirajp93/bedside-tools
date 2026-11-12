/* bedside.tools offline copy.
   Registered by /theme.js on every page, so tools add nothing of their own.
   - Pages and site files: try the network first (so a pushed change shows at once), and fall back to the
     saved copy when offline or when the connection stalls for more than a few seconds.
   - Every page opened is saved as it is visited; the home page also saves every live tool (see index.html).
   - Fonts: saved on first use.
   Nothing a visitor types is ever saved here: only GET requests for the site's own files and its fonts. */
var CACHE = 'bt-offline';
var SHELL = ['/', '/theme.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
var STALL_MS = 3000;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(u, { cache: 'no-cache' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('bt-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* A response that followed a redirect cannot be replayed for a page load, so store a clean copy. */
function clean(res) {
  if (!res.redirected) return res;
  return res.blob().then(function (body) { return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }); });
}
function save(key, res) {
  return Promise.resolve(clean(res)).then(function (r) { return caches.open(CACHE).then(function (c) { return c.put(key, r); }); }).catch(function () {});
}
function saved(req, isPage) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit || !isPage) return hit;
      var u = new URL(req.url);
      if (u.pathname.slice(-1) === '/') return hit;
      return c.match(u.pathname + '/'); // /afib and /afib/ are the same page
    });
  });
}
function notSaved() {
  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Offline · bedside.tools</title><script src="/theme.js"></scr' + 'ipt>' +
    '<style>:root{--bg:#FBFBFA; --card:#FFFFFF; --ink:#111113; --muted:#55555D; --line:#ECECEE; --accent:#2B4BDB; --warn:#9A3B00; --warnbg:#FFF6EC}' +
    'body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:16px;line-height:1.5}' +
    'main{max-width:520px;margin:0 auto;padding:48px 20px}h1{font-size:22px;margin:0 0 8px}p{color:var(--muted);margin:0 0 20px}' +
    'a{display:inline-flex;align-items:center;min-height:44px;color:var(--accent);font-weight:500}</style></head>' +
    '<body><main><h1>Not saved for offline yet</h1><p>This page has not been opened on this device with a connection, so there is no saved copy. Reconnect and open it once, or open the home page while online to save every tool.</p>' +
    '<a href="/">← bedside.tools</a></main></body></html>';
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (FONT_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res.ok) c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate';
  var key = url.origin + url.pathname;
  var net = fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res.ok) e.waitUntil(save(res.redirected ? res.url.split('?')[0] : key, res.clone()));
    return Promise.resolve(clean(res));
  });
  var fallback = function () { return saved(req, isPage).then(function (hit) { return hit || (isPage ? notSaved() : Response.error()); }); };

  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var finish = function (r) { if (!done) { done = true; resolve(r); } };
    // Slow connection: after a few seconds show the saved copy if there is one, and keep updating in the background.
    var timer = setTimeout(function () { saved(req, isPage).then(function (hit) { if (hit) finish(hit); }); }, STALL_MS);
    net.then(function (res) {
      clearTimeout(timer);
      if (res.ok || !isPage) return finish(res);
      // Server error page: prefer a saved copy of the real page if one exists.
      return saved(req, isPage).then(function (hit) { finish(res.status >= 500 && hit ? hit : res); });
    }, function () { clearTimeout(timer); fallback().then(finish); });
    e.waitUntil(net.catch(function () {}));
  }));
});
