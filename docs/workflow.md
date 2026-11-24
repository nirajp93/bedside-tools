# How a tool is built, checked and published

The owner approves; nothing reaches `main` without that approval.

## In a conversation (three approvals)

1. **Brief.** Find or write the tool's brief (slug, inputs, outputs, Why panel, sources). Confirm the current
   edition of every named guideline by search; use the newer edition if there is one and say so.
2. **Decision table (approval 1).** Before any interface work: every threshold, dose, cutoff and branch the
   tool will encode, each with its source. Also every diagram (what it shows, states, interaction, where its
   chip appears, source), the workup rows (what to send, what each result keeps and removes), every trial card,
   and which input triggers which "Why:" line. Clinical errors are caught here, not in code.
3. **Design variants (approval 2).** Two or three versions of the key screen at phone width, light and dark,
   as private previews. Variants differ in layout and flow, not in the shared colours or fonts. Skip only when
   copying the structure of an existing tool of the same shape, and say which.
4. **Build on a branch.** One `index.html` to [standards.md](standards.md), in the chosen variant.
5. **Independent content audit.** A separate agent that has seen only the finished `index.html` extracts every
   number and branch, re-derives each from the named primary source by fetching it, runs the logic on at least
   three worked examples with known answers, and checks every diagram label, lab pattern and trial figure.
   Result: a table of matches / does not match / could not be verified. Fix mismatches and re-audit them.
   If no separate agent is available, say the audit was not independent.
6. **Design audit.** Run the checks ([checks.md](checks.md)); look at the screenshots in light and dark at
   phone, ~1100 px and desktop width; confirm offline. List anything that fails.
7. **Final preview (approval 3).** A private preview of the exact build with `theme.js` inlined, with both
   audit reports and everything that could not be verified. Any later change goes back through 5–7 for the
   parts it touches.
8. **Go live.** After approval: commit `<slug>/index.html` and the home-page entry on a branch, open a pull
   request, merge only when the owner says so. In `index.html`'s `TOOLS`, set `live: true`, list `sections`,
   and add the slug to any fitting rotation in `SHIFTS`.

## Scheduled (unattended) builds

Two nightly builds take the next queued tool. Differences from the above: the decision table is checked by a
separate agent instead of approved; no design variants (reuse a chosen layout: read-down cards as in `dka`,
three tabs as in `afib`, read-the-input-first as in `rhythm`, tabbed topics with Practice as in `ekg-cath`);
the final preview is the one approval. The pull request leads with **Decide before merging** and
**Not verified**.

Hold (draft pull request + issue `needs input: <slug>`) instead of offering for merge when a dose or threshold
could not be verified, when the build needs a change to site standards, or when sources conflict with no
defensible default. Builds pause while four or more tools are waiting for approval. Never merge or push
`main`.

## Upkeep

Every live tool is re-audited (steps 5 and 6) quarterly and whenever a named guideline publishes a new
edition. A re-audit first confirms each source's current edition, reports every number that no longer
matches, and updates **Last reviewed** only after the owner approves the changes through a final preview.

## Pull requests

- Branch names: `<slug>-tool` for a new tool, `<slug>-<change>` for a change.
- Both checks must pass. A new finding is fixed, not added to the baseline, unless the owner decides
  otherwise.
- The description says what changed, links or summarises the decision table and audits it relies on, and
  lists anything not verified.
