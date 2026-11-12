/* bedside.tools shared theme.
   Every page loads this once, in <head>:  <script src="/theme.js"></script>
   It follows the system light/dark setting unless the visitor picked Light or Dark,
   and that choice is remembered across every tool on the site.
   Pages only need to use the shared colour names: --bg --card --ink --muted --line --accent --accent-ink --warn --warnbg */
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

  var DARK = '--bg:#0F0F11;--card:#1A1A1E;--ink:#F2F2F3;--muted:#A6A6AE;--line:#2A2A30;--accent:#AFBEFF;--accent-ink:#0F0F11;--warn:#FFB877;--warnbg:#3A2A14;color-scheme:dark';
  var css =
    ':root{--accent-ink:#FFFFFF;color-scheme:light}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + DARK + '}}' +
    ':root[data-theme="dark"]{' + DARK + '}' +
    '.bt-theme{display:inline-grid;grid-template-columns:repeat(3,auto);gap:4px;padding:4px;margin-top:8px;background:var(--line);border-radius:12px}' +
    '.bt-theme button{height:36px;min-width:60px;padding:0 12px;border:0;border-radius:9px;background:transparent;font:inherit;font-size:13px;font-weight:500;color:var(--muted);cursor:pointer}' +
    '.bt-theme button[aria-pressed="true"]{background:var(--card);color:var(--ink);font-weight:600}';
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  if (sysDark.addEventListener) sysDark.addEventListener('change', paint);
  // Another tab changed the theme: follow it.
  window.addEventListener('storage', function (e) { if (e.key === KEY) { apply(saved()); paint(); } });
})();
