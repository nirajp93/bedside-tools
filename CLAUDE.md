# bedside.tools

Single-page clinical education and efficiency tools for internal medicine residents, served from this repo
by GitHub Pages at https://bedside.tools. The site is an installable, offline-capable PWA. Phones first.

## Layout

| Path | What it is |
|---|---|
| `<slug>/index.html` | One tool. Self-contained: inline CSS and JS, no build step, no framework. |
| `index.html` | Home page. Its `TOOLS` list publishes tools (`live: true`) and the `sections` search jumps to. |
| `theme.js` | Every site-wide setting: colours (light and dark), fonts, footer dropdown, PWA links, "Continue". |
| `sw.js` | Offline copy. Registered by `theme.js`; tools add nothing for it. |
| `fonts/`, `icons/`, `media/<slug>/` | The site's own font files, home-screen icons, and figure plates. |
| `docs/` | The rules: read before changing anything. Not published (see `_config.yml`). |
| `scripts/` | The checks CI runs on every pull request. |

## Rules (details in docs/)

- **Standards for every tool:** [docs/standards.md](docs/standards.md). Shared colour names only, `/theme.js`
  first in `<head>`, plain `<footer>`, no outside requests, no author information anywhere.
- **How a tool is built and approved:** [docs/workflow.md](docs/workflow.md). Decision table first; an
  independent content audit against primary sources; a design audit; the owner approves a final preview.
- **How tools teach:** [docs/teaching.md](docs/teaching.md). Answer on top, one "Why:" line, one "More";
  diagrams, figure chips, a Learn tab, a narrowing workup, trial cards.
- **Checks:** [docs/checks.md](docs/checks.md). Run both before opening a pull request.

## Never

- Push to or merge `main`. Work on a branch, open a pull request, and merge only when the owner says so
  after seeing the final preview.
- Ship a dose or threshold not checked against its primary source, or let the build be the only check.
- Put theme, font, dark-mode or offline code inside a tool; it belongs in `theme.js` / `sw.js`.
- Add analytics, accounts, outside fonts, or any network request beyond the site's own files.
- Copy proprietary tables (Sanford, CredibleMeds, UpToDate). Summarise and cite.
- Put the author's name, or anything identifying them, in any file served by the site.

## Where the rest lives

Clinical decision tables, audit records, design records and the build queue are kept in the owner's
Claude project "bedside.tools" (and its build board), not in this repo. A pull request should link or
summarise the records it relies on. If a rule here and a project doc disagree, ask; the newer decision wins
and both should be brought into line.

## Quick commands

```sh
node scripts/check-standards.mjs          # seconds; no dependencies
npm i --no-save playwright@1 && npx playwright install chromium
node scripts/check-pages.mjs [slug ...]   # browser check; screenshots in screenshots/
python3 -m http.server 8000               # preview at http://localhost:8000/<slug>/
```
