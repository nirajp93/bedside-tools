# How tools teach: layered depth and visual teaching

One page per tool serves both the shift and the learning. There is no Learn/Work mode and no depth setting.
Principle: as few taps and settings as possible; show the right thing by default.

## The result card (every tool)

Top to bottom:

1. **The answer** and any safety warning, always visible.
2. **One "Why:" line**, always visible with no tap: the reason the entered values raise, one or two
   sentences, chosen by a rule from the tool's own Why text. Omitted when nothing is being recommended. Never
   implies a value that was not entered. The decision table lists which input triggers which line; the audits
   test that mapping.
3. **One "More" disclosure**: details, the full Why in plain language, the evidence tier.

One disclosure per card is the limit. Figure chips and the Learn tab do not count. Reference: `electrolytes`.

## Teach visually, in layers

The work answer stays on top and fast; the teaching sits one tap away. Reference: `calcium`.

1. **A diagram wherever text explains a mechanism or pathophysiology.** Inline SVG drawn for the site (never
   copied), in the shared colour names, labels in `var(--mono)`, readable at phone width. Prefer one diagram
   with switchable states (normal, and what each disorder or drug changes) over several static pictures.
   Anatomical or technique plates may be licensed illustrations saved in `/media/<slug>/`; interactive
   diagrams stay site SVG, and site SVG is the fallback when a plate is inaccurate.
2. **Figure chips.** Under the card a diagram explains, a small chip opens one large figure in a bottom sheet
   (as in `ekg-cath`). Chips appear only when relevant to what was entered.
3. **A Learn tab.** A scroll story for the phone: one idea per screen, each a diagram with one or two lines and
   one thing to tap. Depth goes behind a tap, not into paragraphs.
4. **A workup that narrows.** What to send first, what only after a result is back; tap a result and the
   causes that no longer fit fade, each with a one-line reason.
5. **Trial cards where informative.** Question, design, one-line result with numbers, what it changed,
   citation with DOI, verified against PubMed or the paper. None when no trial changes practice. Say when the
   evidence is weak (single arm, small, surrogate endpoint).
6. **Same engine, same sources.** Nothing in a diagram may contradict a result card. Every diagram label, lab
   pattern and trial number has a source in the decision table and is checked in the content audit. Sheets
   close with one tap and with Escape; everything works offline and with animation turned off.

## Sliders explain themselves

A slider never shows a bare number. Under the result, always visible with no tap:

- **A zone scale** when the value crosses thresholds: a band strip with the active zone named in words.
- **Two to four labelled rows** that change as the value moves: *What is happening* (the physiology at this value),
  *Why the rule* (the rationale for the threshold), *At the bedside* (what to do or watch for).

Rows are computed from the tool's own engine and data, never hand-copied numbers. In the visual kit this is
`zones` on a range and `deep(v)` on a slider; elsewhere `dpHtml(rows)` into a `.dp` block.

## Go deeper

Each Learn chapter ends with one disclosure, **Go deeper: mechanism and rationale**, holding three rows:
*Mechanism* (pathophysiology), *Why it matters* (why practice follows from it), *Common trap*. Text only; it adds no
dose or threshold beyond the tool's own, and every sentence goes through the independent content audit. The text
lives in one `<script id="deeper-data">` block at the end of the tool, keyed by chapter id.

## Legibility floor

- Figure text is at least 10.5 units in a 340 to 360 wide viewBox; page text at least 11 px.
- A label never leaves its figure or sits on another label: re-anchor, wrap onto two lines, or move the caption
  under the figure as page text.
- Dimmed states stay readable (group opacity 0.74 or more); a ruled-out cause greys its name, not its reason.
- Before a pull request, open every tab and sheet at 390 px and check for clipped, overlapping and low-contrast
  text, in light and dark.

