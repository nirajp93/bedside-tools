# Checks

Two checks run on every pull request (`.github/workflows/checks.yml`). Both must pass before merging.

## Standards check: `node scripts/check-standards.mjs`

Reads every `<slug>/index.html`, the home page and the shared files, in a few seconds, with no dependencies.
Errors (fail the run):

- `/theme.js` missing from `<head>`, or after the first `<style>`
- the `:root` colour line missing or changed; hardcoded colours anywhere else; `var(--name)` that neither the
  tool nor `theme.js` defines
- theme code in the tool (`prefers-color-scheme`, theme storage, a toggle); fonts named or declared
- anything loaded from another site; a `/media/`, `/icons/` or `/fonts/` file referenced but not in the repo
- footer missing, or missing the disclaimer sentence, **Last reviewed**, sources, or the exact privacy line;
  a footer dropdown built in the tool
- no "← bedside.tools" link
- author-identifying text in any served file
- page over 300 KB
- a tool folder with no home-page entry; a `live: true` entry with no folder; duplicate slugs

Warnings: page over 200 KB, emoji, a folder whose entry is not `live: true`, an entry with no `sections`.

## Page check: `node scripts/check-pages.mjs [slug ...]`

Opens the home page and every tool in headless Chromium at 390 px and 1100 px, light and dark:

- script errors, console errors, failed requests, requests to another site (errors)
- sideways scroll (error)
- every search anchor listed in the home page's `sections` exists once the page has run (error)
- controls under 44 px tall (warning)
- a first-screen screenshot of each, attached to the run as "screenshots"

Then offline: loads the home page, waits for the service worker to save every live tool, goes offline and
opens each tool; each must load from the saved copy without errors.

Locally: `npm i --no-save playwright@1 && npx playwright install chromium`, or set `CHROME_PATH` to an
installed Chrome.

## Known findings: `scripts/standards-baseline.json`

Findings listed there are reported as "known" and do not fail the run, so a rule can be added before every
older tool meets it. New findings still fail. When a known finding is fixed, the check reports it as "fixed";
remove it from the list in the same pull request. Add to the list only when the owner decides a finding can
wait.

## Weekly link check (`.github/workflows/links.yml`)

Checks every outside link in the tools on Monday mornings (and on demand). 403 and 429 count as reachable
because journals block automated requests. Never blocks a merge; broken links open or update one issue,
"Broken source links".
