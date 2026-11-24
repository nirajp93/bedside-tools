#!/usr/bin/env node
/* bedside.tools standards check.
   Reads every tool (<slug>/index.html), the home page and the shared files, and checks the rules in
   docs/standards.md that a script can check. No dependencies; Node 18+.

     node scripts/check-standards.mjs            report, exit 1 on any new error
     node scripts/check-standards.mjs --json     machine-readable report
     node scripts/check-standards.mjs --update-baseline
                                                 accept every current finding as known (writes
                                                 scripts/standards-baseline.json); use only when the
                                                 owner has decided to fix those later

   A finding listed in the baseline is reported as "known" and does not fail the check, so a rule can be
   added before every older tool meets it. New findings fail. When a known finding is fixed, the check
   says so and the baseline entry should be removed. */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, 'scripts', 'standards-baseline.json');
const args = new Set(process.argv.slice(2));

const SIZE_WARN = 200 * 1024;   // a tool page over this gets a warning
const SIZE_MAX = 300 * 1024;    // and over this an error (largest page was 163 KB on 2026-11-16)
const ROOT_LINE = '--bg:#FBFBFA; --card:#FFFFFF; --ink:#111113; --muted:#55555D; --line:#ECECEE; --accent:#2B4BDB; --warn:#9A3B00; --warnbg:#FFF6EC';
const PRIVACY = 'Privacy: everything runs in your browser. Nothing you enter is sent anywhere or stored, and there are no analytics. Do not enter names, record numbers, or dates of birth.';
/* Nothing on the site may identify the author. The names are kept as hashes so this public script does not
   spell them out; every word in a served file is hashed and compared. */
const AUTHOR_HASHES = new Set(['fbe94c75bdef166f','6c929f2ad8d3e411','ce12c78c943055b3','af7a74864494b189']);
const AUTHOR = { test: text => (text.toLowerCase().match(/[a-z0-9]{4,}/g) || [])
  .some(w => AUTHOR_HASHES.has(createHash('sha256').update(w).digest('hex').slice(0, 16))) };
const SKIP_DIRS = new Set(['.git', '.github', 'docs', 'scripts', 'fonts', 'icons', 'media', 'node_modules']);

const findings = [];
const add = (level, where, rule, msg) => findings.push({ level, where, rule, msg });

const read = p => readFileSync(join(ROOT, p), 'utf8');
const slugs = readdirSync(ROOT).filter(d => !SKIP_DIRS.has(d) && !d.startsWith('.') &&
  statSync(join(ROOT, d)).isDirectory() && existsSync(join(ROOT, d, 'index.html'))).sort();

/* Colour and variable names theme.js defines, so a tool may use them without declaring them. */
const theme = read('theme.js');
const themeVars = new Set([...theme.matchAll(/--([a-z0-9-]+)\s*:/gi)].map(m => m[1]));

/* The home page's TOOLS list, evaluated as data. */
function homeTools() {
  const html = read('index.html');
  const start = html.indexOf('const TOOLS = [');
  if (start < 0) { add('error', 'index.html', 'home-tools', 'could not find "const TOOLS = ["'); return []; }
  let i = html.indexOf('[', start), depth = 0, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) break;
  }
  try { return vm.runInNewContext(html.slice(html.indexOf('[', start), i + 1)); }
  catch (e) { add('error', 'index.html', 'home-tools', 'TOOLS list did not parse: ' + e.message); return []; }
}

/* Strip comments so a rule is not tripped by an explanation of it. */
const noComments = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

function checkTool(slug, entry) {
  const file = `${slug}/index.html`;
  const raw = read(file);
  const html = noComments(raw);
  const bytes = Buffer.byteLength(raw);

  // Size budget: the whole tool is one page, cached offline on phones.
  if (bytes > SIZE_MAX) add('error', file, 'size', `${(bytes / 1024).toFixed(0)} KB, over the ${SIZE_MAX / 1024} KB limit`);
  else if (bytes > SIZE_WARN) add('warn', file, 'size', `${(bytes / 1024).toFixed(0)} KB, over ${SIZE_WARN / 1024} KB`);

  // Shared theme: /theme.js in <head>, before the first <style>.
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const themeAt = head.search(/<script\s+src="\/theme\.js"\s*><\/script>/i);
  const styleAt = head.search(/<style/i);
  if (themeAt < 0) add('error', file, 'theme-js', 'no <script src="/theme.js"></script> in <head>');
  else if (styleAt >= 0 && styleAt < themeAt) add('error', file, 'theme-js', '/theme.js must come before the first <style>');

  // The one :root colour line, exactly.
  // (order inside the line does not matter; every name must be there with the standard value)
  const pairs = x => new Set(x.replace(/\s+/g, '').split(';').filter(Boolean).map(v => v.toUpperCase()));
  const want = pairs(ROOT_LINE);
  const rootOk = [...raw.matchAll(/:root\s*\{([^}]*)\}/g)].some(m => { const have = pairs(m[1]); return [...want].every(v => have.has(v)); });
  if (!rootOk) add('error', file, 'root-colours', 'the :root colour line is missing or its values differ from the standard');

  // No theme code in a tool.
  if (/prefers-color-scheme/i.test(html)) add('error', file, 'no-theme-code', 'uses prefers-color-scheme (theme.js handles dark mode)');
  if (/localStorage[^;\n]{0,80}theme|data-theme-set/i.test(html)) add('error', file, 'no-theme-code', 'has its own theme storage or toggle');

  // Fonts come from theme.js only.
  if (/@font-face/i.test(html)) add('error', file, 'fonts', 'declares @font-face');
  if (/--(sans|mono)\s*:/.test(html)) add('error', file, 'fonts', 'declares --sans or --mono');
  const named = [...html.matchAll(/font-family\s*[:=]\s*["']?([^;"'}>]+)/gi)].map(m => m[1].trim())
    .filter(v => !/^(var\(--(sans|mono)\)|inherit)$/i.test(v))
    .filter(v => { const a = v.match(/^var\(--([a-z0-9-]+)\)$/i);   // a local alias such as --serif:var(--sans) is fine
      return !(a && new RegExp(`--${a[1]}\\s*:\\s*var\\(--(sans|mono)\\)`).test(html)); });
  if (named.length) add('error', file, 'fonts', `names a font instead of var(--sans)/var(--mono): ${named[0].slice(0, 60)}`);

  // Hardcoded colours outside the :root line (CSS, inline styles, SVG attributes, JS strings that set them).
  // (a fallback inside var(), as in var(--accent-ink,#fff), is never used because theme.js defines the name)
  const body = html.replace(/:root\s*\{[^}]*\}/, '').replace(/var\(\s*--[a-z0-9-]+\s*,[^)]*\)/gi, 'var()');
  const colourRe = /(?:^|[\s;{"'`(,])(?:color|background(?:-color)?|fill|stroke|stop-color|border(?:-[a-z]+)*|outline(?:-color)?|box-shadow|text-shadow)\s*[:=]\s*["'`]?[^;"'`}<>\n]*?(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black)\b)/gi;
  const hits = [...body.matchAll(colourRe)].map(m => m[1]);
  if (hits.length) add('error', file, 'hardcoded-colour', `${hits.length} hardcoded colour(s), e.g. ${[...new Set(hits)].slice(0, 4).join(', ')}`);

  // Every var(--name) used must be defined by the tool or by theme.js (catches typos that render as nothing).
  const defined = new Set([...html.matchAll(/--([a-z0-9-]+)\s*:/gi)].map(m => m[1]));
  const undef = [...new Set([...html.matchAll(/var\(\s*--([a-z0-9-]+)/gi)].map(m => m[1]))]
    .filter(v => !defined.has(v) && !themeVars.has(v));
  if (undef.length) add('error', file, 'undefined-var', `uses undefined variable(s): ${undef.map(v => '--' + v).join(', ')}`);

  // Offline: no request to another site. Links a reader taps (<a href>) are fine.
  const ext = [...html.matchAll(/<(script|link|img|iframe|audio|video|source)\b[^>]*?\b(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+/gi)]
    .concat([...html.matchAll(/(?:fetch|import)\(\s*["'`](?:https?:)?\/\/[^"'`]+/gi)], [...html.matchAll(/@import|url\(\s*["']?(?:https?:)?\/\//gi)]);
  if (ext.length) add('error', file, 'offline', `loads something from another site: ${ext[0][0].slice(0, 80)}`);

  // Same-site files it loads must exist (media plates, etc.).
  for (const m of html.matchAll(/["'(](\/(?:media|icons|fonts)\/[^"')\s]+)/g))
    if (!existsSync(join(ROOT, m[1]))) add('error', file, 'missing-file', `references ${m[1]}, which is not in the repo`);

  // Footer: plain paragraphs that theme.js collapses; disclaimer, privacy, last reviewed, sources.
  const footer = (html.match(/<footer[\s\S]*?<\/footer>/i) || [''])[0];
  if (!footer) add('error', file, 'footer', 'no <footer> (theme.js puts the light/dark control and disclaimers there)');
  else {
    const text = footer.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    if (!/For education only\. Not a substitute for clinical judgment\./.test(text)) add('error', file, 'footer', 'disclaimer sentence missing or reworded');
    if (!/Last reviewed:?\s*\S/.test(text)) add('error', file, 'footer', 'no "Last reviewed" date');
    if (!/\bSources?\b/.test(text)) add('error', file, 'footer', 'no sources listed');
    if (!text.includes(PRIVACY)) add('error', file, 'privacy-wording',
      /only your light\/dark choice/.test(text) ? 'privacy line has the dropped "only your light/dark choice…" clause' : 'privacy line differs from the standard');
    if (/<details/i.test(footer)) add('error', file, 'footer', 'builds its own footer dropdown (theme.js does this)');
  }

  // Header: back link to the home page.
  if (!/<a\b[^>]*href=["']\/["'][^>]*>\s*←\s*bedside\.tools/i.test(html)) add('error', file, 'header', 'no "← bedside.tools" link to the home page');

  // No author information, anywhere in the file (including comments).
  if (AUTHOR.test(raw)) add('error', file, 'author', 'contains author-identifying text');

  // No emoji.
  if (/\p{Extended_Pictographic}/u.test(html.replace(/[✓✕✗×©®™↔↕]/g, '')))
    add('warn', file, 'emoji', 'contains emoji or pictographic symbols');

  // Home-page entry, and the search anchors it lists.
  const ids = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(m => m[1]));
  if (!entry) add('error', file, 'home-entry', 'no entry in the home page TOOLS list');
  else {
    if (!entry.live) add('warn', file, 'home-entry', 'folder exists but its home entry is not live: true');
    const secs = entry.sections || [];
    if (!secs.length) add('warn', file, 'home-entry', 'home entry lists no sections, so search cannot jump inside the tool');
    // Anchors may also be created by script (tabs); check the raw text for the id string as a fallback.
    // Ids built by script (e.g. 'step-'+s.id) are checked in the browser by scripts/check-pages.mjs.
    const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dynamic = a => { const p = a.includes('-') ? a.slice(0, a.lastIndexOf('-') + 1) : null;
      return p && new RegExp(`${esc(p)}["'\`]\\s*\\+|${esc(p)}\\$\\{`).test(html); };
    const missing = secs.map(s => s[1]).filter(a => a && !ids.has(a) && !dynamic(a) && !new RegExp(`["'\`]${esc(a)}["'\`]`).test(html));
    if (missing.length) add('error', file, 'search-anchor', `home search jumps to missing anchor(s): ${missing.map(a => '#' + a).join(', ')}`);
  }
}

/* --- run --- */
const tools = homeTools();
const bySlug = new Map(tools.map(t => [t.slug, t]));
for (const slug of slugs) checkTool(slug, bySlug.get(slug));
for (const t of tools) if (t.live && !slugs.includes(t.slug)) add('error', 'index.html', 'home-entry', `${t.slug} is live: true but /${t.slug}/index.html does not exist`);
const dup = tools.map(t => t.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dup.length) add('error', 'index.html', 'home-entry', `duplicate slugs: ${[...new Set(dup)].join(', ')}`);

for (const f of ['index.html', 'theme.js', 'sw.js', 'manifest.webmanifest', 'CNAME'])
  if (existsSync(join(ROOT, f)) && AUTHOR.test(read(f))) add('error', f, 'author', 'contains author-identifying text');
for (const f of ['/', '/theme.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/fonts/atkinson-hyperlegible-next.woff2', '/fonts/atkinson-hyperlegible-mono.woff2'])
  if (f !== '/' && !existsSync(join(ROOT, f))) add('error', 'sw.js', 'offline', `offline shell lists ${f}, which is not in the repo`);

/* --- baseline --- */
const key = f => `${f.where} | ${f.rule}`;
let baseline = [];
try { baseline = JSON.parse(readFileSync(BASELINE, 'utf8')).known || []; } catch { /* none yet */ }
const known = new Set(baseline);
if (args.has('--update-baseline')) {
  const keys = [...new Set(findings.filter(f => f.level === 'error').map(key))].sort();
  writeFileSync(BASELINE, JSON.stringify({
    note: 'Errors accepted as known on the date below; each should be fixed and removed. New errors still fail the check.',
    updated: new Date().toISOString().slice(0, 10), known: keys }, null, 2) + '\n');
  console.log(`Baseline written: ${keys.length} known error(s).`);
  process.exit(0);
}
for (const f of findings) if (f.level === 'error' && known.has(key(f))) f.level = 'known';
const fixed = baseline.filter(k => !findings.some(f => key(f) === k));

if (args.has('--json')) { console.log(JSON.stringify({ tools: slugs.length, findings, fixed }, null, 2)); }
else {
  const order = { error: 0, known: 1, warn: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level] || a.where.localeCompare(b.where));
  const tag = { error: 'ERROR', known: 'known', warn: 'warn ' };
  for (const f of findings) console.log(`${tag[f.level]}  ${f.where}  [${f.rule}]  ${f.msg}`);
  for (const k of fixed) console.log(`fixed  ${k}  (remove from scripts/standards-baseline.json)`);
  const n = l => findings.filter(f => f.level === l).length;
  console.log(`\n${slugs.length} tools checked: ${n('error')} new error(s), ${n('known')} known, ${n('warn')} warning(s), ${fixed.length} fixed.`);
}
process.exit(findings.some(f => f.level === 'error') ? 1 : 0);
