/* bedside.tools offline copy.
   Registered by /theme.js on every page, so tools add nothing of their own.
   - Pages and site files: the saved copy is shown at once and a fresh copy is fetched behind it, so opening a
     tool or going back never waits on the hospital's signal. When the fresh copy of a page differs, the page
     is told; /theme.js reloads it if nothing has been touched yet, otherwise the change shows next time.
     A page with no saved copy comes from the network.
   - Every page opened is saved as it is visited; the home page also saves every live tool (see index.html).
   - Fonts: the site's own two files in /fonts/, saved when this worker installs.
   Nothing a visitor types is ever saved here: only GET requests for the site's own files and its fonts. */
var CACHE = 'bt-offline';
var SHELL = ['/', '/theme.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/fonts/atkinson-hyperlegible-next.woff2', '/fonts/atkinson-hyperlegible-mono.woff2'];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

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
/* Has the page changed? Compared by the server's own version stamp, never by reading the page. */
function stamp(res) {
  var h = res.headers;
  return h.get('etag') || h.get('last-modified') || h.get('content-length') || '';
}
function tell(id, path) {
  if (!id) return;
  return self.clients.get(id).then(function (c) { if (c) c.postMessage({ bt: 'page-updated', path: path }); }).catch(function () {});
}
function notSaved() {
  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Offline · bedside.tools</title><script src="/theme.js"></scr' + 'ipt>' +
    '<style>:root{--bg:#FBFBFA; --card:#FFFFFF; --ink:#111113; --muted:#55555D; --line:#ECECEE; --accent:#2B4BDB; --warn:#9A3B00; --warnbg:#FFF6EC}' +
    'body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.5}' +
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
  var stored = null; // resolves once the fresh copy is in the cache
  var net = fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res.ok) { stored = save(res.redirected ? res.url.split('?')[0] : key, res.clone()); e.waitUntil(stored); }
    return Promise.resolve(clean(res));
  });
  var fallback = function () { return saved(req, isPage).then(function (hit) { return hit || (isPage ? notSaved() : Response.error()); }); };

  e.respondWith(saved(req, isPage).then(function (hit) {
    if (hit) {
      // Saved copy first: the page opens at once, whatever the signal. The fresh copy is fetched behind it.
      e.waitUntil(net.then(function (res) {
        if (!isPage || !res.ok || !stored || stamp(hit) === stamp(res)) return;
        return stored.then(function () { return tell(e.resultingClientId || e.clientId, url.pathname); });
      }).catch(function () {}));
      return hit;
    }
    // Nothing saved yet: the network, or the "not saved" page when there is no connection.
    return net.then(function (res) { return res; }, function () { return fallback(); });
  }));
});
