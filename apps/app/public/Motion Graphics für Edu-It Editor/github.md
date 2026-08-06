repo: zweitsprache/eduit
branch: main
path: apps/app

## Last sync
date: 2026-08-06T12:54:45Z

### Updated in this project
- Built the Edu-It Editor tutorial motion piece from the real editor layout (left sidebar, sticky toolbar, A4 canvas, right sidebar).
- Skeleton block palette modal mirrors the real insert-block palette (search, icon/label/description rows, category chip).
- Element types (Multiple-Choice, Wortgitter, Domino, Lernkarten, Verbtabelle) and CEFR levels A1.1–B1.2 taken from the block registry and level enums.
- Right-sidebar "Lösungen anzeigen" switch and toolbar PDF export follow the editor's own controls.

## Screen map
| Screen / scene | Repo files |
| --- | --- |
| Editor shell (scenes Oberflaeche, Elemente, Niveau, Loesungsblatt) | apps/app/src/app/editor/page.tsx |
| Block palette modal (scene Elemente) | apps/app/src/components/editor/custom-blocks/insert-block-palette.tsx |
| Element glyphs (scene Typen, mosaic) | apps/app/src/components/editor/custom-blocks/registry.ts, mcq-node.tsx, domino-node.tsx, learning-cards-node.tsx, german-verb-table-node.tsx |
| Sprachniveau chips (scene Niveau) | apps/app/src/app/editor/page.tsx (ADDITIONAL_WORKSHEET_LEVELS), apps/app/src/components/editor/occupation-portrait-ai-modal.tsx |
| Lösungen / PDF (scene Loesungsblatt) | apps/app/src/app/editor/page.tsx (showSolutions, exportPDF) |
