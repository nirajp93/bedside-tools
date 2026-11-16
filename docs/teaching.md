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
