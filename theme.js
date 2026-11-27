/* bedside.tools shared theme.
   Every page loads this once, in <head>:  <script src="/theme.js"></script>
   It follows the system light/dark setting unless the visitor picked Light or Dark,
   and that choice is remembered across every tool on the site.
   Pages only need to use the shared colour names: --bg --card --ink --muted --line --accent --accent-ink --warn --warnbg
   Extra names any tool may use (light and dark both set here): --fill (subtle panel), --ok --okbg, --bad --badbg,
   --scrim (overlay behind a sheet), --ecg-paper --ecg-grid --ecg-grid5 --ecg-ink (ECG tracings),
   --hrt-surface --hrt-muscle --hrt-cavity --hrt-art --hrt-vein --hrt-cor --hrt-node --hrt-risk --hrt-line (heart drawings).
   --us-bg --us-mark --us-ink --us-halo (ultrasound frames: dark in both themes, so marks on them have their own names).
   It also collapses each page's footer text (disclaimer, privacy, last reviewed, sources) into a
   "Disclaimers and sources" dropdown, so tools write a plain <footer> and get the same control.
   It also makes every page installable and available offline: it adds the manifest and home-screen icon
   links and registers /sw.js, so tools add nothing of their own for that either.
   It also remembers, on this device only, which tool was last open and what was on screen in it, so the
   home page can offer "Continue". Tools add nothing for this; a section is recognised by its id.
   It also sets the site's fonts: Atkinson Hyperlegible Next for text and Atkinson Hyperlegible Mono for labels
   and numbers, loaded from /fonts/ (no outside request). Pages use the names --sans and --mono and never
   name a font themselves, so a change here reaches every page.
   It also adds the navigation bar that stays at the top of every tool: Back (one step: the previous tab in
   this tool, or the previous page), the bedside.tools mark (home), and the tool's name once its heading has
   scrolled away (tap: back to the top). Each tab change in a tool is one Back step. The bar's height is the
   name --bt-bar; a tool's own sticky elements use top:var(--bt-bar,0px) so they sit under it.
   It also sets how every control answers a tap: no double-tap zoom delay, a pressed state, no zoom when a
   field is focused on a phone, and a fade on a tab row that scrolls sideways. */
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
  var SLUG = location.pathname.split('/')[1] || '';
  var TOOL = !!SLUG && SLUG.indexOf('.') < 0;
  if (TOOL) root.classList.add('bt-has-bar'); // before first paint, so nothing moves when the bar is added

  var DARK = '--bg:#0F0F11;--card:#1A1A1E;--ink:#F2F2F3;--muted:#A6A6AE;--line:#2A2A30;--accent:#AFBEFF;--accent-ink:#0F0F11;--warn:#FFB877;--warnbg:#3A2A14;--fill:#232328;--body:#34343C;--ok:#8FD694;--okbg:#16301A;--bad:#FF9B93;--badbg:#3A1A18;--scrim:rgba(0,0,0,.6);--ecg-paper:#1D1718;--ecg-grid:#3A2A2B;--ecg-grid5:#5C3A3B;--ecg-ink:#F2F2F3;--hrt-surface:#B4756A;--hrt-muscle:#96564C;--hrt-cavity:#33201E;--hrt-art:#C4584D;--hrt-vein:#5E82AD;--hrt-cor:#5E0F0A;--hrt-node:#F2C744;--hrt-risk:#BDB4FF;--hrt-line:#E9C9C2;--us-bg:#050506;--us-mark:#FFC857;--us-ink:#F2F2F3;--us-halo:#050506;color-scheme:dark';
  var RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  var css =
    '@font-face{font-family:"Atkinson Hyperlegible Next";font-style:normal;font-weight:200 800;font-display:swap;src:url(/fonts/atkinson-hyperlegible-next.woff2) format("woff2");unicode-range:' + RANGE + '}' +
    '@font-face{font-family:"Atkinson Hyperlegible Mono";font-style:normal;font-weight:200 800;font-display:swap;src:url(/fonts/atkinson-hyperlegible-mono.woff2) format("woff2");unicode-range:' + RANGE + '}' +
    ':root{--sans:"Atkinson Hyperlegible Next",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"Atkinson Hyperlegible Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}' +
    ':root{--accent-ink:#FFFFFF;--fill:#F2F2F0;--body:#E3E3E8;--ok:#2E7D32;--okbg:#EAF4EB;--bad:#B3261E;--badbg:#FBEAE8;--scrim:rgba(17,17,19,.5);--ecg-paper:#FFF8F6;--ecg-grid:#F3C9C4;--ecg-grid5:#E59A92;--ecg-ink:#111113;--hrt-surface:#EBB7AA;--hrt-muscle:#CF8173;--hrt-cavity:#F6D9D2;--hrt-art:#D9675B;--hrt-vein:#8FB0D6;--hrt-cor:#9E1B14;--hrt-node:#F2C744;--hrt-risk:#3F3A78;--hrt-line:#5A2A22;--us-bg:#050506;--us-mark:#FFC857;--us-ink:#F2F2F3;--us-halo:#050506;color-scheme:light}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + DARK + '}}' +
    ':root[data-theme="dark"]{' + DARK + '}' +
    '.bt-theme{display:inline-grid;grid-template-columns:repeat(3,auto);gap:4px;padding:4px;margin-top:8px;background:var(--line);border-radius:12px}' +
    '.bt-theme button{height:44px;min-width:60px;padding:0 12px;border:0;border-radius:9px;background:transparent;font:inherit;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer}' +
    '.bt-theme button[aria-pressed="true"]{background:var(--card);color:var(--ink);font-weight:600}' +
    '.disc{border:0;padding:0;margin:0}' +
    '.disc summary{min-height:44px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;line-height:1.4;letter-spacing:0;text-transform:none;color:var(--ink);cursor:pointer;list-style:none}' +
    '.disc summary::-webkit-details-marker{display:none}' +
    '.disc summary::before{content:none}' +
    '.disc summary::after{content:"";width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .15s}' +
    '.disc[open] summary::after{transform:rotate(225deg) translateY(-2px)}' +
    // Taps: no double-tap-zoom wait, no grey flash; the pressed state below is the feedback instead.
    'html{touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%}' +
    // Navigation bar on every tool.
    ':root{--bt-bar:0px}:root.bt-has-bar{--bt-bar:48px}' +
    '.bt-has-bar a.back[href="/"]{display:none}' +
    '.bt-has-bar [id]{scroll-margin-top:calc(var(--bt-bar) + 8px)}' +
    '.bt-bar{position:sticky;top:0;z-index:10;height:48px;box-sizing:border-box;background:var(--bg);border-bottom:1px solid var(--line);font-family:var(--sans)}' +
    '.bt-bar-in{max-width:1120px;height:100%;margin:0 auto;padding:0 6px;display:flex;align-items:center;gap:2px;box-sizing:border-box}' +
    '.bt-bar a,.bt-bar button{height:44px;min-width:44px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:10px;background:transparent;margin:0;padding:0 10px;font:inherit;line-height:1;color:var(--ink);text-decoration:none;cursor:pointer;flex:none}' +
    '.bt-bar .bt-back{font-size:15px;font-weight:500;color:var(--accent);padding:0 10px 0 6px;gap:2px}' +
    '.bt-bar .bt-home{font-size:16px;font-weight:700;letter-spacing:-.01em}' +
    '.bt-mark{width:22px;height:22px;border-radius:7px;background:var(--accent);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.bt-bar .bt-top{margin-left:auto;flex:0 1 auto;min-width:0;font-family:var(--mono);font-size:12px;font-weight:500;color:var(--muted);gap:6px;opacity:0;visibility:hidden;transition:opacity .15s}' +
    '.bt-bar .bt-top.on{opacity:1;visibility:visible}' +
    '.bt-bar .bt-top span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}' +
    '.bt-bar svg{flex:none}' +
    '@media (prefers-reduced-motion:reduce){.bt-bar .bt-top{transition:none}}' +
    '@media print{.bt-bar{display:none}}';
  // Added after the page's own styles (see ready), so one rule reaches every tool whatever it declared.
  var LATE =
    'a:active,button:active,summary:active,[role="tab"]:active,[role="button"]:active,select:active{opacity:.55}' +
    'button,summary,[role="tab"],[role="button"]{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'button,summary,select,[role="tab"],[role="button"],label[for]{cursor:pointer}' +
    // A field under 16px makes a phone zoom the page when it is focused, which moves every button after it.
    '@media (pointer:coarse){input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),select,textarea{font-size:max(16px,1em)!important}}' +
    'h1,h2,h3{text-wrap:balance}p,li,dd,figcaption{text-wrap:pretty}' +
    '.bt-has-bar header h1{font-weight:700}' +
    // A tab row wider than the screen fades at the edge that has more.
    '.bt-more-r{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent)}' +
    '.bt-more-l{-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 36px),transparent)}' +
    '.bt-more-l.bt-more-r{-webkit-mask-image:linear-gradient(to right,transparent,#000 36px,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,transparent,#000 36px,#000 calc(100% - 36px),transparent)}';
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

  /* ---- Navigation bar, Back steps and tab rows (tools only) ---- */
  function mainTabs() {
    var tl = document.querySelector('[role="tablist"]');
    return tl ? Array.prototype.slice.call(tl.querySelectorAll('[role="tab"]')) : [];
  }
  function activeTab(tabs) {
    for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-selected') === 'true') return i;
    return 0;
  }
  function fadeRows() {
    var rows = document.querySelectorAll('[role="tablist"]');
    for (var i = 0; i < rows.length; i++) (function (el) {
      // The row that scrolls may be the list itself or the wrapper inside it.
      var sc = el.scrollWidth > el.clientWidth + 4 ? el : (el.firstElementChild && el.firstElementChild.scrollWidth > el.firstElementChild.clientWidth + 4 ? el.firstElementChild : null);
      if (!sc || sc.__bt) return;
      sc.__bt = 1;
      var upd = function () {
        sc.classList.toggle('bt-more-l', sc.scrollLeft > 4);
        sc.classList.toggle('bt-more-r', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4);
      };
      sc.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    })(rows[i]);
  }
  function nav() {
    var hadPage = false; // was another page of this site open before this one, in this tab?
    try { hadPage = sessionStorage.getItem('bt-in') === '1'; sessionStorage.setItem('bt-in', '1'); } catch (e) {}
    if (!TOOL) return;
    var bar = document.createElement('nav');
    bar.className = 'bt-bar';
    bar.setAttribute('aria-label', 'Site');
    bar.innerHTML = '<div class="bt-bar-in">' +
      '<button type="button" class="bt-back" aria-label="Back one step"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Back</button>' +
      '<a class="bt-home" href="/" aria-label="bedside.tools home"><span class="bt-mark" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>bedside.tools</a>' +
      '<button type="button" class="bt-top" aria-label="Back to the top of this page" tabindex="-1"><span></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);

    // The tool's name appears in the bar once its heading has scrolled away; tapping it returns to the top.
    var top = bar.querySelector('.bt-top'), h1 = document.querySelector('h1');
    top.firstChild.textContent = h1 ? h1.textContent.trim() : document.title;
    var showTop = function (on) { top.classList.toggle('on', on); top.tabIndex = on ? 0 : -1; };
    if (h1 && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { showTop(!en[0].isIntersecting && en[0].boundingClientRect.top < 60); }, { rootMargin: '-48px 0px 0px 0px' }).observe(h1);
    } else {
      window.addEventListener('scroll', function () { showTop(window.scrollY > 160); }, { passive: true });
    }
    top.addEventListener('click', function () {
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    });

    // Each tab change is one Back step, so Back returns to the tab that was open before, then to the page before.
    var depth = 0, auto = false;
    var st = function (i, d) { var o = {}, h = history.state; if (h && typeof h === 'object') for (var k in h) o[k] = h[k]; o.btTab = i; o.btDepth = d; return o; };
    try {
      var tabs0 = mainTabs();
      if (tabs0.length) {
        if (history.state && typeof history.state.btDepth === 'number') depth = history.state.btDepth;
        history.replaceState(st(activeTab(tabs0), depth), '');
        document.addEventListener('click', function (e) {
          if (auto || !e.target.closest) return;
          var t = e.target.closest('[role="tab"]'); if (!t) return;
          var tabs = mainTabs(), i = tabs.indexOf(t); if (i < 0) return;
          var was = activeTab(tabs);
          // After the tool's own handler has run: record the step only if the tab really changed.
          setTimeout(function () {
            var now = activeTab(mainTabs());
            if (now === was) return;
            try { history.replaceState(st(was, depth), ''); depth++; history.pushState(st(now, depth), ''); } catch (err) {}
          }, 0);
        }, true);
        window.addEventListener('popstate', function (e) {
          var s = e.state; if (!s || typeof s.btTab !== 'number') return;
          depth = s.btDepth || 0;
          var tabs = mainTabs();
          if (tabs[s.btTab] && activeTab(tabs) !== s.btTab) { auto = true; try { tabs[s.btTab].click(); } finally { auto = false; } }
        });
      }
    } catch (e) {}
    bar.querySelector('.bt-back').addEventListener('click', function () {
      if (depth > 0 || (hadPage && history.length > 1)) {
        var here = location.href, d = depth;
        history.back();
        // Nothing behind this page after all (opened from a link or the home screen): go home.
        if (d === 0) setTimeout(function () { if (location.href === here && document.visibilityState === 'visible') location.href = '/'; }, 500);
      } else location.href = '/';
    });

    fadeRows();
    window.addEventListener('load', fadeRows);
    // Keep the open tab in view in a row that scrolls.
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[role="tab"]');
      if (t && t.scrollIntoView) setTimeout(function () { try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (err) {} fadeRows(); }, 0);
    });
  }

  function ready() {
    var late = document.createElement('style');
    late.textContent = LATE;
    document.head.appendChild(late);
    try { nav(); } catch (e) {}
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
  // Fetch the two font files early so text does not change face after it appears.
  ['next', 'mono'].forEach(function (f) {
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
    l.href = '/fonts/atkinson-hyperlegible-' + f + '.woff2';
    document.head.appendChild(l);
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
    // Pages open from the saved copy at once. If the site has a newer copy of this page and nothing has been
    // touched yet, show it straight away; otherwise it shows the next time the page is opened.
    var touched = false, t0 = Date.now();
    ['pointerdown', 'keydown', 'input'].forEach(function (t) { window.addEventListener(t, function () { touched = true; }, { capture: true, passive: true }); });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (!e.data || e.data.bt !== 'page-updated' || e.data.path !== location.pathname) return;
      if (touched || Date.now() - t0 > 4000 || window.scrollY > 40) return;
      try {
        var k = 'bt-fresh', last = +sessionStorage.getItem(k) || 0;
        if (Date.now() - last < 15000) return; // never loop
        sessionStorage.setItem(k, String(Date.now()));
      } catch (err) { return; }
      location.reload();
    });
  }

  // Last-opened tool for the home page's "Continue" banner. Saved on this device only (key bt-last):
  // the tool's slug and the ids of the elements that had reached the top of the screen when the page was left.
  var slug = SLUG;
  if (TOOL) {
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
