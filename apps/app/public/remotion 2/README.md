# Verbteile – Stamm und Endung (Remotion port)

Pure-module port of the dazit verb animation. 1920×1080, 42 s, 30 fps.

## Files

| File | Purpose |
| --- | --- |
| `src/motion.ts` | Easing, `animate`, `track`, `arrive`, `pulse`. No dependencies at all — not even Remotion. |
| `src/scenes.ts` | `SCENES` cue list + derived `CUES`, `TOTAL_SECONDS`, `DURATION_IN_FRAMES`. Replaces the old `window.OM_SCENES`. |
| `src/VerbParts.tsx` | **The pure renderer.** No hooks, no context, no side effects. Every pixel is a function of `frame`. |
| `src/VerbPartsRemotion.tsx` | Thin adapter that reads `useCurrentFrame()`/`useVideoConfig()` and calls the pure renderer. |
| `src/manifest.ts` | Typed `TemplateManifest` — id, name, aspect ratio, duration, default props, controls, scene map, thumbnail. |
| `src/Root.tsx`, `src/index.ts` | Remotion registration. Not needed if you only import into an editor. |
| `src/exports.ts` | Barrel file — one import site for everything above. |

## Run standalone

```bash
npm install
npm start          # Remotion Studio
npm run render     # out/verbteile.mp4
```

## Import into a video editor

Copy `src/motion.ts`, `src/scenes.ts`, `src/VerbParts.tsx` and `src/manifest.ts` into the editor's template directory. Ignore `Root.tsx`, `index.ts` and `VerbPartsRemotion.tsx` unless the editor is itself Remotion-based.

The renderer's contract:

```tsx
<VerbParts
  frame={frame}            // number — the only time input
  fps={30}
  durationInFrames={1260}
  width={1920}
  height={1080}
  stem="koch"              // user control
  showLogo={true}          // user control
  backgroundColor="#ffffff"
/>
```

All props are optional and defaulted, so `<VerbParts frame={f} />` renders correctly on its own.

Notes on the contract:

- **No globals.** Nothing reads `window`. `support.js`, `x-dc` and `x-import` are gone.
- **No assets.** The dazit wordmark is inlined SVG; `thumbnail` in the manifest is the only external path and it is a plain public URL string you can repoint.
- **Any canvas size.** The 1920×1080 design is letterboxed and scaled by `Math.min(width/1920, height/1080)`, so a 1080×1920 or 1:1 composition still renders correctly.
- **Register the template** by importing `verbPartsTemplate` and pushing it into the editor's template list. Map its fields onto whatever type the adaptor expects — the names were chosen to line up, but the editor's own type is the authority, so widen or rename `TemplateControl` if it disagrees.

## Font

`Root.tsx` loads Encode Sans Semi Condensed via `@remotion/google-fonts` and passes the resulting family down. Outside Remotion, load the font however the host app does and pass `fontFamily`; otherwise it falls back to the system sans and the letter spacing will differ slightly.

## Thumbnail

`manifest.thumbnail` points at `/templates/verbteile-thumbnail.png`, which does not exist yet. Generate one with:

```bash
npx remotion still VerbParts public/templates/verbteile-thumbnail.png --frame=140
```
