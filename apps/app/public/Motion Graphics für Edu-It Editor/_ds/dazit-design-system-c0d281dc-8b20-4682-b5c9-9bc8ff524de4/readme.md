# dazit Design System

Design system for **dazit**, a library of print-ready worksheets, verb tables, declension tables, flashcards, dialogues and reading-comprehension sheets for teachers running DaZ courses (Deutsch als Zweitsprache — German as a second language) with adult learners in Switzerland. The product is a Next.js web app (`dazit.io`): a searchable/filterable document library, per-worksheet detail pages with PDF download (gated behind sign-in), and a lightweight admin surface for editing worksheet metadata.

## Source

Built from the real product codebase, not screenshots:

- **Repo:** [zweitsprache/eduit](https://github.com/zweitsprache/eduit), `apps/dazit/` subtree, `main` branch.
- Read: `globals.css` (the entire visual system lives in one stylesheet — no CSS framework), the homepage, library/detail/legal pages, and every component under `src/components/` (header, footer, worksheet card, filter sidebar, library browser, document gallery, auth panels, inline editors).
- Copied: the `dazit` wordmark and two real worksheet-preview SVGs from `apps/dazit/public/`.

If you have access to the repo, go read it directly for anything this system doesn't cover (the admin metadata editor, the auth backend, API routes) — this system only recreates what's visible in the UI.

## Content fundamentals

- **Language & register:** Swiss High German (`de-CH`) throughout — no `ß`, doubled `s` instead (*Strasse*, not *Straße*). Copy is almost entirely informal **du**-form ("Melde dich an, um auf deine Dokumente zuzugreifen.") with one inconsistency worth knowing about: the filter sidebar's helper text switches to formal **Sie** ("Tipp: Brauchen Sie auch in den Nachbarniveaus…"). Treat du-form as the standard and iron out stray Sie-form copy when you touch it.
- **Tone:** plain and functional, zero marketing language. Headlines state exactly what's on offer — *"1&#8203;284 Arbeits- und Merkblätter, Spiele und Kartensets für DaZ-Kurse mit Erwachsenen"* — and CTAs are bare verbs: *Suchen*, *Anmelden*, *PDF herunterladen*, *Details*. Metadata labels are plain nouns (*Dokumenttyp*, *Niveau*, *Seiten*, *Dateigrösse*), never cute or clever.
- **No emoji, anywhere.** The one non-text glyph in copy is a unicode checkmark flagging included answer keys: *"✓ Mit Lösungsblatt"*. A bare `›` stands in for "continue" on text links (*"Alle neuen Dokumente ›"*).
- **Numbers used sparingly and honestly:** the homepage hero counts up the real total document count on load; cards show real page/download counts. No invented stats.
- A **"Public Beta"** ribbon sits across the hero — the product is transparent about being early.
- Legal pages (Impressum, Datenschutzerklärung, Lizenz- und Nutzungsrecht) use a more formal register appropriate to Swiss legal disclosure, with numbered sections (a circular orange numeral chip per section).

## Visual foundations

- **Color:** one dark neutral (`--navy #15172c`) carries all text and UI ink; one warm accent (`--orange #cc6600`) carries every call-to-action, link hover, active nav state and focus ring. Beyond that, eleven pastel **tint pairs** (background + ink, e.g. `--tint-blue-light-bg` / `-ink`) exist purely to color-code document type and CHE level — they never appear on primary buttons or chrome. The page is almost entirely white; `--soft #f7f7f6` marks one "new this week" band, and one saturated blue (`#4f6899`) bookends the page as the hero and footer background. No gradients anywhere.
- **Type:** a single family, **Encode Sans Semi Condensed**, weights 400–800, does every job — display, body, labels, buttons. There's no secondary/serif face. Large headlines pull tracking tight (`-0.035em`); everything else sits at normal tracking.
- **Spacing:** desktop content sits in a 1540px max-width shell with 46px gutters (24px on tablet, 18px on mobile); card internals use tight, consistent padding (14px worksheet-card body, 26px auth panels). Grids step 3 → 2 → 1 columns as viewport narrows.
- **Imagery:** no photography, no illustration, no pattern/texture. The only imagery is real worksheet previews (scanned/rendered PDF pages) shown inside 16:9 frames. The homepage hero stacks three of these as tilted "paper" cards with soft shadows — the one recurring imagery motif in the whole product.
- **Animation:** deliberately minimal. A 900ms ease-out count-up on the hero stat; 180ms hover transitions (card lifts 2px, shadow deepens); a 220ms drawer slide for mobile filters; a 180ms opacity fade when flipping worksheet-preview pages. No bounce, spring or parallax.
- **Hover states:** cards lift and their shadow deepens; links and outlined buttons switch text/border to orange; the one filled (primary) button darkens (`#cc6600 → #b35a00`). Nothing changes via brightness/opacity tricks except disabled states.
- **Press/active states:** no distinct pressed styling was found (no scale/shrink) — only `:disabled` states (opacity 0.4–0.6, `cursor: not-allowed`/`wait`).
- **Borders vs. shadows:** hairline 1px borders (`--line #d5d6dc`) do most of the separating work in lists, tables and dividers. Shadows are reserved for things that float above content — cards get a very soft, cool navy-tinted shadow (`rgba(24,26,45,.08)`); modals and auth panels get a heavier one (up to 70px blur). Never a hard, dark drop shadow.
- **Radius:** small (5–6px) on inputs/buttons, medium (8–10px) on cards, larger (12–20px) on auth panels and modals, full pill (999px) on tags, toggles and filter chips. Overall crisp and editorial, not the bubbly 16–24px look.
- **Layout rules:** the header is sticky with `backdrop-filter: blur(12px)` over 96%-opacity white — the only two places blur/transparency appear are this header and the modal scrim (`blur(2px)` over a dark overlay). Everything else is opaque.
- **Cards:** the one true card pattern — white fill, 1px hairline border, soft shadow, 8px radius, a tinted 16:9 preview panel inside, lift on hover. Reused for worksheet cards, "new this week" tiles and related-document strips.

## Iconography

The product mixes two icon sets: **`@untitledui/icons`** (the majority — search, filter, download, file, grid, list, close, plus, trash, loading) and **`lucide-react`** for exactly two glyphs (`User`, `Files`). Both are outline-style on a 24px grid with a 1.5–2px stroke and rounded caps, so they read as one system. No icon font, no PNG icon sprites, no emoji.

`@untitledui/icons` isn't reliably loadable in a sandboxed component with no build step, so **this design system substitutes the entire icon set with Lucide** (MIT/ISC-licensed, copied directly rather than hand-drawn) — see `assets/icons/*.svg` for the raw files and `components/icon/Icon.jsx` for the wrapper every other component uses. Lucide itself needed no substitution, since two of its glyphs were already native to the product. **Flag for the team:** if exact Untitled UI glyphs matter for a production handoff, swap `Icon.jsx`'s path data for the real `@untitledui/icons` set.

## Components

No component library existed in the source (dazit's UI is plain CSS classes on markup, not abstracted primitives) — so this system authors a standard set sized to what the product actually uses, with values copied exactly from `globals.css` (never rounded to a framework default):

- **Icon** (`components/icon/`) — the substituted glyph set above.
- **Core** — `Button`, `Badge` (tint pill), `Avatar` (header account trigger).
- **Forms** — `Input` (search field), `Checkbox`, `Switch`, `Select`.
- **Navigation** — `Pagination`.
- **Feedback** — `Modal` (auth-required download gate).
- **Data display** — `WorksheetCard`, the flagship component — type badge, tinted 16:9 preview, excerpt, stats, actions, exactly matching the real library grid card.

### Intentional additions
Every component above stands in for markup the product already has — none are inventions beyond the source's own vocabulary. The one liberty taken: `Icon` is a wrapper the product itself doesn't have (it imports icons directly from two npm packages); it exists here only to make icon substitution swappable in one place.

## UI kit

`ui_kits/dazit-library/` — an interactive click-through recreation of the core product flow: **homepage → library (search/filter/paginate) → worksheet detail → sign-in gate**. Built from the composed components above, matching the real layouts, copy and breakpoints.

## Templates

`templates/worksheet-library/` — a starting-point screen shell (header + filter sidebar + results grid) teams can copy into a new project and fill with their own worksheet data.

## Index

```
styles.css              global stylesheet — @import list only
base.css                resets shared by the whole app
tokens/
  colors.css             navy/orange/tint palette + semantic aliases
  typography.css         Encode Sans Semi Condensed type scale
  fonts.css              @font-face (self-hosted CDN, see note below)
  spacing.css            spacing/content-width scale
  effects.css            radius, shadow, motion tokens
assets/
  logo.svg               dazit wordmark (colors restored — see note below)
  icons/*.svg             raw Lucide source files backing components/icon/Icon.jsx
  sample-worksheet-*.svg  real worksheet-preview SVGs from the product
components/              Icon, Button, Badge, Avatar, Input, Checkbox, Switch,
                         Select, Pagination, Modal, WorksheetCard (see above)
ui_kits/dazit-library/   interactive recreation of the core product flow
templates/worksheet-library/  starting-point screen shell
guidelines/*.card.html   foundation specimen cards (Design System tab)
SKILL.md                 portable Claude Code skill wrapper for this system
github.md                source-repo sync record (repo, last sync, screen map)
```

**Font note:** the product loads Encode Sans Semi Condensed from Google Fonts' dynamic CSS endpoint, which this system can't statically bundle. `tokens/fonts.css` instead declares real `@font-face` rules against the same font's Fontsource CDN mirror — same family, same weights, no substitution needed.

**Logo note:** the copied `dazit.svg` shipped with its fill colors stripped (defined only via external CSS classes in the app). Colors were restored here using the product's own navy/orange tokens — this is not a redesign, just re-attaching the correct fills to the untouched paths.

## Caveats — please help me iterate

- I could not access Figma or any design tool for this project — everything here comes from reading the Next.js codebase. If there's a Figma file with more detail (motion specs, empty/error states, the admin surface), attach it and I'll cross-check.
- `@untitledui/icons` is substituted with Lucide (see Iconography above). Send over the real icon files if pixel-exact glyphs matter.
- The database-backed parts of the product (real worksheet content, search ranking, admin editing, auth) aren't represented — the UI kit uses representative placeholder worksheets.
- I only saw two icons actually rendered from `lucide-react` and none of `@untitledui/icons`' full inventory — the icon substitution list above is my best inference from usage in the code, not a verified 1:1 mapping.

Tell me what's off and I'll tighten it up.
