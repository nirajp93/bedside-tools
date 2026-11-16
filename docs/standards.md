# Standards for every tool

Checked automatically where marked **[checked]** (see [checks.md](checks.md)); the rest are checked in the
design and content audits ([workflow.md](workflow.md)).

## One page, no build

- One self-contained `<slug>/index.html`: inline CSS and JS, no build step, no framework. **[checked: size]**
  Page budget: warning over 200 KB, error over 300 KB.
- The only outside file a tool loads is the site's `/theme.js`, plus its own plates in `/media/<slug>/`
  if it has any. **[checked]**

## Site-wide settings live in theme.js, never in a tool

1. `<script src="/theme.js"></script>` in `<head>`, before the first `<style>`. **[checked]**
2. Light colours declared once on `:root`, exactly these names and values (order free): **[checked]**
   `--bg:#FBFBFA; --card:#FFFFFF; --ink:#111113; --muted:#55555D; --line:#ECECEE; --accent:#2B4BDB; --warn:#9A3B00; --warnbg:#FFF6EC`.
   `theme.js` supplies `--accent-ink` and every dark value, plus the extra names it lists at its top
   (`--fill`, `--ok`/`--okbg`, `--bad`/`--badbg`, `--scrim`, the `--ecg-*` and `--hrt-*` sets).
3. Use only those names for colour everywhere else: no `#fff`, `white`, `black`, hex, `rgb()` or `hsl()` in
   rules, inline styles, SVG fills or JS. `var(--card)` for input and button backgrounds, `var(--accent-ink)`
   for text on accent, `currentColor` for icons. A colour the list lacks goes into `theme.js` (light and dark)
   in the same pull request, not into the tool. **[checked: hardcoded colours, undefined names]**
4. No theme code: no `prefers-color-scheme`, no theme `localStorage`, no toggle. `theme.js` adds the
   Auto / Light / Dark control to the end of the tool's `<footer>`, so every tool needs a `<footer>`. **[checked]**
5. Any new site-wide setting (text size, units) goes in `theme.js`, so one change reaches every tool.

## Fonts

`theme.js` loads Atkinson Hyperlegible Next (text) and Atkinson Hyperlegible Mono (labels, numbers) from
`/fonts/` and defines `--sans` and `--mono`. A tool writes `font-family:var(--sans)` on `body` and
`var(--mono)` for labels and numbers, including SVG text (as a `style`, not an attribute). It never names a
font, declares `--sans`/`--mono`, adds `@font-face`, or links a font service. **[checked]** Characters outside
the Latin subset (≥ ≤ → Δ β, subscripts) fall back to the system font; that is expected.

## Installable and offline

`theme.js` adds the manifest and icons and registers `/sw.js`; the home page saves every `live: true` tool.
A tool adds nothing for this and must work with no connection after one load. **[checked: offline pass]**

## Design

- Match the home page. Cards with 1px borders and 14px radius. No emoji, no gradients. **[checked: emoji]**
- 44 px touch targets. **[checked: warning]**
- Works at phone width (390 px) with no sideways scroll, and at desktop width (including ~1100 px).
  **[checked]**
- Readable in light and dark. **[screenshots on every pull request]**

## Header and footer

- Header: a small "← bedside.tools" link to `/`, the tool name, a one-line purpose. **[checked: link]**
- Footer, as plain paragraphs (theme.js collapses them into one "Disclaimers and sources" dropdown; do not
  build a dropdown in the tool): **[checked]**
  - `For education only. Not a substitute for clinical judgment.`
  - `Last reviewed: <date>`
  - Sources: each named guideline or trial with its year; show each recommendation's evidence tier
    (guideline class/level, or "expert practice").
  - Privacy, exactly:
    `Privacy: everything runs in your browser. Nothing you enter is sent anywhere or stored, and there are no analytics. Do not enter names, record numbers, or dates of birth.`
    (The older wording with "only your light/dark choice is saved on this device" was dropped by the owner;
    do not use it.)

## Privacy

Everything runs in the browser. Nothing entered is sent or stored beyond the page session; no analytics.
Never ask for a name, record number or date of birth. A future "save for later" list is phone-only, stores the
topic name and date on the device only, has no accounts or sync, and requires updating the privacy wording.

## Search anchors

Give each major section or input group an `id`. The home page's `sections` for the tool list
`[label, anchor id, question words]`; every anchor listed must exist once the page has run. **[checked in
the browser]**

## No author information

Nowhere in a served file: header, footer, metadata, comments, alt text. **[checked]**

## Clinical content

- Build to national guidelines. Anything hospital-specific (formulary, protocol numbers, antibiogram) goes in
  a labelled "adjust to your institution" note.
- Safety guards are prominent and on by default (correction-rate limits, potassium-before-insulin gates,
  cross-tolerance dose reductions).
- Practice tab with 5–10 cases where it fits, run through the same engine as the calculator.
- Reuse shapes: score calculator, decision engine, fluid/lab interpreter, card deck, case drill. Copy the
  structure of an existing tool of the same shape rather than inventing one.
- Do not copy proprietary tables or databases; summarise activity and cite.

## Bringing an older tool up to standard

Add the `/theme.js` line, replace hardcoded colours with the shared names, remove its theme code, update the
privacy wording, check light and dark. Do not change clinical content while doing it.
