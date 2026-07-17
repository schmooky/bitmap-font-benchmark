# Bitmap Font Benchmark

A test bench for slot-style **bitmap fonts**. Load a real `.fnt` + page atlas,
fire a win-box count-up preset, and read an explicit validation report — the
headline being **"will the tick-up jump?"**

Built with **PixiJS v8**, React, Tailwind + shadcn-style UI (dark monochrome),
GSAP, and a driver.js guided tour. The stage renders on the same pixel grid as
spine-benchmark's `v4` branch.

## What it does

- **Real bitmap fonts from file** — ships the HTJ atlases (`.fnt` + `.webp`) in
  `assets/fonts/htj`, loaded through Pixi's `Assets` pipeline. Nothing is
  rasterised at runtime. Drag-drop your own `.fnt` + `.png/.webp` anywhere to
  validate it too.
- **Tens of win-box presets** across 7 categories: basic tick-ups, currency,
  multipliers, big-win rollups, formatting edge cases, entrance animations, and
  stress/validation probes. Each drives a GSAP count-up with a chosen number
  format (comma, currency, `$`/`€`, multiplier `x`, abbreviated `K/M/B`, WIN
  suffix, thin-space groups, …).
- **Validation**, per font:
  - `0-9 complete` — can it render a counter at all?
  - **Tick-up jump test** — compares every digit's advance width. If they differ,
    the counter will shimmy horizontally as digits cycle; the panel reports the
    worst-case jump in px and the offending digit pair. Mono/tabular digits pass.
  - Per-glyph presence for separators (`, . x $ €`) and letters (`WIN`, `K/M/B`).
  - Any glyph the current preset needs but the font lacks is called out.
- A **guided tour** (driver.js) runs on first visit; replay it via **Guide**.

## Develop

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # → dist/
npm run typecheck
```

## Deploy to Timeweb App Platform (frontend)

Two supported paths — pick one.

### A. Docker app (recommended, most portable)

The repo ships a multi-stage `Dockerfile` (Node build → nginx serve) and
`nginx.conf`. In the Timeweb panel create an **App → Docker**, point it at this
Git repo, and deploy. The container listens on port **80**; the `.fnt` files are
served as `text/plain` and the build/font assets are long-cached.

### B. Frontend (static) app

Create an **App → Frontend**, connect the repo, and set:

| Setting          | Value           |
| ---------------- | --------------- |
| Build command    | `npm run build` |
| Output directory | `dist`          |
| Node version     | 20+             |

Everything is static after build — no server runtime needed. There is no SPA
router, but the Docker path already falls back to `index.html` if you add one.

> **Security note:** if you pasted a Timeweb API token into a chat/terminal to
> set this up, treat it as compromised and **rotate it** in the Timeweb console.
> Deployment here is driven by the Git connection in the panel, not by that
> token.

## Layout

```
src/
  pixi/        Stage, PixelGrid (v4 grid), WinBox (bare bitmap text + GSAP)
  lib/         fonts (load/parse .fnt), presets, formats, validation, tour
  components/  React UI + shadcn-style primitives in components/ui
assets/fonts/  HTJ bitmap-font atlases (.fnt + .webp)
```
