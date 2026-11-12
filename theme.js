/* bedside.tools shared theme.
   Every page loads this once, in <head>:  <script src="/theme.js"></script>
   It follows the system light/dark setting unless the visitor picked Light or Dark,
   and that choice is remembered across every tool on the site.
   Pages only need to use the shared colour names: --bg --card --ink --muted --line --accent --accent-ink --warn --warnbg
   Extra names any tool may use (light and dark both set here): --fill (subtle panel), --ok --okbg, --bad --badbg,
   --scrim (overlay behind a sheet), --ecg-paper --ecg-grid --ecg-grid5 --ecg-ink (ECG tracings),
   --hrt-surface --hrt-muscle --hrt-cavity --hrt-art --hrt-vein --hrt-cor --hrt-node --hrt-risk --hrt-line (heart drawings).
   It also collapses each page's footer text (disclaimer, privacy, last reviewed, sources) into a
   "Disclaimers and sources" dropdown, so tools write a plain <footer> and get the same control.
   It also makes every page installable and available offline: it adds the manifest and home-screen icon
   links and registers /sw.js, so tools add nothing of their own for that either.
   It also remembers, on this device only, which tool was last open and what was on screen in it, so the
   home page can offer "Continue". Tools add nothing for this; a section is recognised by its id. */
(function () {
  var KEY = 'bt-theme';
  var root = document.documentElement;
  var sysDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };

  function saved() {
    try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (e) { return 'auto'; }
  }
  function apply(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode);
  }
  apply(saved()); // before first paint

  var DARK = '--bg:#0F0F11;--card:#1A1A1E;--ink:#F2F2F3;--muted:#A6A6AE;--line:#2A2A30;--accent:#AFBEFF;--accent-ink:#0F0F11;--warn:#FFB877;--warnbg:#3A2A14;--fill:#232328;--ok:#8FD694;--okbg:#16301A;--bad:#FF9B93;--badbg:#3A1A18;--scrim:rgba(0,0,0,.6);--ecg-paper:#1D1718;--ecg-grid:#3A2A2B;--ecg-grid5:#5C3A3B;--ecg-ink:#F2F2F3;--hrt-surface:#B4756A;--hrt-muscle:#96564C;--hrt-cavity:#33201E;--hrt-art:#C4584D;--hrt-vein:#5E82AD;--hrt-cor:#5E0F0A;--hrt-node:#F2C744;--hrt-risk:#BDB4FF;--hrt-line:#E9C9C2;color-scheme:dark';
  var css =
    ':root{--accent-ink:#FFFFFF;--fill:#F2F2F0;--ok:#2E7D32;--okbg:#EAF4EB;--bad:#B3261E;--badbg:#FBEAE8;--scrim:rgba(17,17,19,.5);--ecg-paper:#FFF8F6;--ecg-grid:#F3C9C4;--ecg-grid5:#E59A92;--ecg-ink:#111113;--hrt-surface:#EBB7AA;--hrt-muscle:#CF8173;--hrt-cavity:#F6D9D2;--hrt-art:#D9675B;--hrt-vein:#8FB0D6;--hrt-cor:#9E1B14;--hrt-node:#F2C744;--hrt-risk:#3F3A78;--hrt-line:#5A2A22;color-scheme:light}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + DARK + '}}' +
    ':root[data-theme="dark"]{' + DARK + '}' +
    '.bt-theme{display:inline-grid;grid-template-columns:repeat(3,auto);gap:4px;padding:4px;margin-top:8px;background:var(--line);border-radius:12px}' +
    '.bt-theme button{height:36px;min-width:60px;padding:0 12px;border:0;border-radius:9px;background:transparent;font:inherit;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer}' +
    '.bt-theme button[aria-pressed="true"]{background:var(--card);color:var(--ink);font-weight:600}' +
    '.disc{border:0;padding:0;margin:0}' +
    '.disc summary{min-height:44px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;line-height:1.4;letter-spacing:0;text-transform:none;color:var(--ink);cursor:pointer;list-style:none}' +
    '.disc summary::-webkit-details-marker{display:none}' +
    '.disc summary::before{content:none}' +
    '.disc summary::after{content:"";width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .15s}' +
    '.disc[open] summary::after{transform:rotate(225deg) translateY(-2px)}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function paint() {
    var mode = root.getAttribute('data-theme') || 'auto';
    var dark = mode === 'dark' || (mode === 'auto' && sysDark.matches);
    var buttons = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-theme-set') === mode));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0F0F11' : '#FBFBFA');
  }
  function set(mode) {
    try { if (mode === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
    apply(mode);
    paint();
  }

  function ready() {
    // Footer disclaimers, privacy note and sources are collapsed into one dropdown on every page.
    // A page that already has its own <details class="disc"> in the footer is left alone.
    var foot = document.querySelector('footer');
    if (foot && !foot.querySelector('details.disc')) {
      var disc = document.createElement('details');
      disc.className = 'disc';
      var sum = document.createElement('summary');
      sum.textContent = 'Disclaimers and sources';
      disc.appendChild(sum);
      while (foot.firstChild) disc.appendChild(foot.firstChild);
      foot.appendChild(disc);
    }
    // Pages without their own theme control get one at the end of the footer.
    if (!document.querySelector('[data-theme-set]')) {
      var host = document.querySelector('footer') || document.body;
      var group = document.createElement('div');
      group.className = 'bt-theme';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Theme');
      ['auto', 'light', 'dark'].forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-theme-set', m);
        b.textContent = m.charAt(0).toUpperCase() + m.slice(1);
        group.appendChild(b);
      });
      host.appendChild(group);
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-theme-set],[data-theme-flip]') : null;
      if (!t) return;
      if (t.hasAttribute('data-theme-set')) set(t.getAttribute('data-theme-set'));
      else set((root.getAttribute('data-theme') || (sysDark.matches ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark');
    });
    paint();
  }
  // Installable app and offline copy, the same on every page.
  function headTag(tag, key, val, attr, to) {
    if (document.head.querySelector(tag + '[' + key + '="' + val + '"]')) return;
    var el = document.createElement(tag);
    el.setAttribute(key, val);
    el.setAttribute(attr, to);
    document.head.appendChild(el);
  }
  headTag('link', 'rel', 'manifest', 'href', '/manifest.webmanifest');
  headTag('link', 'rel', 'apple-touch-icon', 'href', '/icons/apple-touch-icon.png');
  headTag('link', 'rel', 'icon', 'href', '/icons/icon-192.png');
  headTag('meta', 'name', 'theme-color', 'content', '#FBFBFA');
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

  // Last-opened tool for the home page's "Continue" banner. Saved on this device only (key bt-last):
  // the tool's slug and the ids of the elements that had reached the top of the screen when the page was left.
  var slug = location.pathname.split('/')[1] || '';
  if (slug && slug.indexOf('.') < 0) {
    var remember = function () {
      try {
        var ids = [], els = document.querySelectorAll('[id]'), mid = 140; // px from the top: a section counts once its start has reached the top of the screen
        for (var i = 0; i < els.length; i++) {
          if (!els[i].getClientRects().length) continue;
          var top = Math.round(els[i].getBoundingClientRect().top);
          if (top < mid) ids.push([els[i].id, top, i]);
        }
        // Furthest down the page last; of two side by side, the first one last (the home page reads from the end).
        ids.sort(function (a, b) { return a[1] - b[1] || b[2] - a[2]; });
        localStorage.setItem('bt-last', JSON.stringify({ s: slug, ids: ids.slice(-40).map(function (x) { return x[0]; }) }));
      } catch (e) {}
    };
    window.addEventListener('pagehide', remember);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') remember(); });
    window.addEventListener('load', remember);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  if (sysDark.addEventListener) sysDark.addEventListener('change', paint);
  // Another tab changed the theme: follow it.
  window.addEventListener('storage', function (e) { if (e.key === KEY) { apply(saved()); paint(); } });
})();
