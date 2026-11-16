#!/usr/bin/env node
/* bedside.tools page check: opens every tool in a real browser and checks what a static read cannot.

   For every tool and the home page, at phone (390 px) and desktop (1100 px) width, in light and dark:
     - no script errors, no failed requests, no request to another site
     - the page does not scroll sideways
     - a screenshot of the first screen, saved to screenshots/ for review
   At phone width, light:
     - every search anchor the home page lists for the tool exists once the page has run
     - buttons, selects, text inputs, tabs and disclosures are at least 44 px tall (warning)
   Offline: opens the home page, lets the service worker save the live tools, goes offline and opens each
   tool again; each must load from the saved copy without errors.

   Needs: npm i -D playwright (CI installs it). Run from the repo root:
     node scripts/check-pages.mjs [slug ...]
   Set CHROME_PATH to use an installed Chrome instead of Playwright's download. */
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'screenshots');
const WIDTHS = [[390, 844, 'phone'], [1100, 900, 'desktop']];
const SCHEMES = ['light', 'dark'];
const SKIP = new Set(['.git', '.github', 'docs', 'scripts', 'fonts', 'icons', 'media', 'node_modules', 'screenshots']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.txt': 'text/plain' };

const only = process.argv.slice(2);
const slugs = readdirSync(ROOT).filter(d => !SKIP.has(d) && !d.startsWith('.') && statSync(join(ROOT, d)).isDirectory() &&
  existsSync(join(ROOT, d, 'index.html')) && (!only.length || only.includes(d))).sort();

/* Home page TOOLS list, for the search anchors. */
function homeTools() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const s = html.indexOf('const TOOLS = [');
  let i = html.indexOf('[', s), d = 0, q = null;
  for (; i < html.length; i++) { const c = html[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') q = c; else if (c === '[') d++; else if (c === ']' && --d === 0) break; }
  return vm.runInNewContext(html.slice(html.indexOf('[', s), i + 1));
}
const tools = new Map(homeTools().map(t => [t.slug, t]));

/* A static server that behaves like GitHub Pages for this site (/slug → /slug/, folders → index.html). */
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }).end(); return; }
    f = join(f, 'index.html');
  }
  if (!existsSync(f)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const findings = [];
const add = (level, where, msg) => findings.push({ level, where, msg });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function visit(path, label, width, height, scheme, extra) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: 1,
    serviceWorkers: 'block' });  // the offline pass below tests the worker; here, every request is a real one
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('script error: ' + e.message.split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  page.on('requestfailed', r => errs.push(`request failed: ${r.url().replace(BASE, '')} (${r.failure()?.errorText})`));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push(`HTTP ${r.status()}: ${r.url().replace(BASE, '')}`); });
  page.on('request', r => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) errs.push('request to another site: ' + u.slice(0, 100)); });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const tag = `${label} @${width} ${scheme}`;
  for (const e of [...new Set(errs)]) add('error', tag, e);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) add('error', tag, `scrolls sideways by ${over} px`);
  await page.screenshot({ path: join(OUT, `${label.replace(/\W+/g, '_')}-${width}-${scheme}.png`) });
  if (extra) await extra(page, tag);
  await ctx.close();
}

async function phoneChecks(page, tag, slug) {
  const t = tools.get(slug);
  const anchors = (t?.sections || []).map(s => s[1]).filter(Boolean);
  if (anchors.length) {
    const missing = await page.evaluate(ids => ids.filter(id => !document.getElementById(id)), anchors);
    if (missing.length) add('error', tag, `home search jumps to missing anchor(s): ${missing.map(a => '#' + a).join(', ')}`);
  }
  const small = await page.evaluate(() => {
    const sel = 'button, select, summary, [role=button], [role=tab], input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range])';
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;   // not on screen now
      if (el.closest('.bt-theme')) continue;   // the shared light/dark control comes from theme.js; checked once, below
      if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${Math.round(r.height)}px`);
    }
    return out;
  });
  if (small.length) {
    const counts = {}; for (const s of small) counts[s] = (counts[s] || 0) + 1;
    add('warn', tag, `${small.length} control(s) under 44 px tall: ` + Object.entries(counts).slice(0, 5).map(([k, n]) => n > 1 ? `${k} ×${n}` : k).join('; '));
  }
}

for (const [w, h, name] of WIDTHS) for (const scheme of SCHEMES) await visit('/', 'home', w, h, scheme);
{ // the shared light/dark control, from theme.js, appears on every page
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + `/${slugs[0] || ''}`, { waitUntil: 'load' });
  const h = await page.evaluate(() => { const b = document.querySelector('.bt-theme button'); return b ? Math.round(b.getBoundingClientRect().height || parseFloat(getComputedStyle(b).height)) : null; });
  if (h && h < 44) add('warn', 'theme.js', `light/dark control buttons are ${h} px tall (under 44 px) on every page`);
  await ctx.close();
}
for (const slug of slugs) for (const [w, h] of WIDTHS) for (const scheme of SCHEMES)
  await visit(`/${slug}/`, slug, w, h, scheme, w === 390 && scheme === 'light' ? (p, tag) => phoneChecks(p, tag, slug) : null);

/* Offline: the home page saves every live tool; then each must open with no connection. */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
  const live = [...tools.values()].filter(t => t.live).map(t => t.slug).filter(s => slugs.includes(s));
  const deadline = Date.now() + 30000;
  let saved = [];
  while (Date.now() < deadline) {
    saved = await page.evaluate(async () => { const out = [];
      for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname);
      return out; });
    if (live.every(s => saved.includes(`/${s}/`))) break;
    await page.waitForTimeout(500);
  }
  const notSaved = live.filter(s => !saved.includes(`/${s}/`));
  if (notSaved.length) add('error', 'offline', `the home page did not save: ${notSaved.join(', ')}`);
  await ctx.setOffline(true);
  for (const slug of live.filter(s => !notSaved.includes(s))) {
    const errs = [];
    const onErr = e => errs.push(e.message.split('\n')[0]);
    page.on('pageerror', onErr);
    try { await page.goto(`${BASE}/${slug}/`, { waitUntil: 'load', timeout: 15000 }); }
    catch (e) { errs.push('did not load: ' + e.message.split('\n')[0]); }
    const title = await page.title().catch(() => '');
    if (/^Offline/.test(title)) errs.push('showed the "not saved for offline" page');
    page.off('pageerror', onErr);
    for (const e of errs) add('error', `${slug} offline`, e);
  }
  await ctx.close();
}

await browser.close();
server.close();

/* Known findings (scripts/standards-baseline.json, "pages") warn instead of failing until fixed. */
let knownPages = [];
try { knownPages = JSON.parse(readFileSync(join(ROOT, 'scripts', 'standards-baseline.json'), 'utf8')).pages || []; } catch { /* none */ }
for (const f of findings) if (f.level === 'error' && knownPages.includes(`${f.where} | ${f.msg}`)) f.level = 'known';
const fixedPages = knownPages.filter(k => !findings.some(f => `${f.where} | ${f.msg}` === k));
for (const k of fixedPages) findings.push({ level: 'fixed', where: k, msg: '(remove from scripts/standards-baseline.json)' });

/* Report */
const lines = findings.sort((a, b) => (a.level > b.level ? 1 : -1) || a.where.localeCompare(b.where))
  .map(f => `${{ error: 'ERROR', known: 'known', warn: 'warn ', fixed: 'fixed' }[f.level]}  ${f.where}  ${f.msg}`);
const count = l => findings.filter(f => f.level === l).length;
const errors = count('error');
const summary = `${slugs.length} tools + home page at ${WIDTHS.map(w => w[0] + ' px').join(' and ')}, light and dark, then offline: ${errors} new error(s), ${count('known')} known, ${count('warn')} warning(s), ${count('fixed')} fixed. Screenshots in screenshots/.`;
console.log(lines.join('\n') + (lines.length ? '\n\n' : '') + summary);
writeFileSync(join(OUT, 'report.json'), JSON.stringify({ summary, findings }, null, 2));
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Page check\n\n${summary}\n\n` + (lines.length ? '```\n' + lines.join('\n') + '\n```\n' : ''));
process.exit(errors ? 1 : 0);
