---
name: liquid-glass
description: Apply the Apple-style liquid glass refraction effect to any web component (cards, navs, modals, buttons). Use when the user asks for liquid glass, glassmorphism with real refraction, iOS 26-style glass, or frosted glass with edge bending.
---

# Liquid Glass Effect

A proven, tuned implementation of Apple-style liquid glass: a real refraction
bulge at the rim plus a chromatic fringe, with a frosted-blur fallback for
Safari and Firefox. **Reuse it — do not re-derive it.**

Source: https://github.com/deepika-builds/liquid-glass
The module lives next to this file: `liquid-glass.js` (drop-in, no dependencies).
API: `liquidGlass(el, { scale, chroma, border, mapBlur, blur, saturate,
radius, fallbackBlur })` returns `{ supported, refresh, destroy }`.

## How to apply to a new component

1. Copy `liquid-glass.js` (in this skill folder) into the target project, or
   reference it with a `<script>` tag.
2. Call `liquidGlass(element)`. Defaults are tuned; tweak `scale` (strength)
   and `chroma` (fringe) to taste. Subtle: -60 / 4. Default: -112 / 6.
   Dramatic: -180.
3. Add the CSS dressing (border-radius, tint gradient, inset highlights, drop
   shadow) so it reads as real glass. See the recipe in `README.md`.
4. In React/Vue: call it inside an effect hook on the ref; `destroy()` on unmount.

## Non-negotiable gotchas

- The SVG `<filter>` MUST set `color-interpolation-filters="sRGB"`. Without it,
  linearRGB remaps the map's neutral gray and the whole backdrop ghosts
  up-and-left. (The module already sets this.)
- Refraction is Chromium-only; Safari/Firefox get the frosted-blur fallback
  automatically. Never make refraction carry meaning.
- Keep the interior legible: refraction belongs at the rim. If content smears,
  lower `scale`, raise `blur`, or increase `border`.
- Avoid the effect on elements larger than ~800px per side (GPU cost), and
  don't regenerate the map for position-only animation — only size changes.

## In this project

Third-party skill from the source above (MIT, see `LICENSE`), kept as published. These rules come from this repo and win over the recipe in the upstream README.

- Load `design-language` first. Every box is glass here: cards, widgets, bars, pills, toasts, settings groups. Only small physical parts (flip tiles, knobs, fields) stay opaque. Call `glass(el)` on each box
- Dress the element with tokens, not the README's hard-coded colors: `--glass-fill` or `--glass-fill-strong`, `--glass-sheen`, `--glass-specular`, `--glass-line`, `--shadow-glass`, `--radius-*`. If the look needs a value with no token (a specular highlight), add the token to `docs/assets/tokens.css` and its docs page first
- The module writes `backdrop-filter` inline, which overrides `--glass-filter`. When the page switches to `data-quality="low"`, call `destroy()` on every instance so the solid fallback in the tokens applies; call `liquidGlass()` again only when the tier returns to high
- Performance rules in `docs/system/performance.md` apply: a box is refracted only while on or next to the screen, the quality tier drops every one when frames slip, no `refresh()` for position-only animation. The upstream advice to avoid boxes over ~800px a side is relaxed on purpose, so a wide card on a portrait wall screen still gets the effect; the tier is the safety
- Refraction is Chromium only and decoration only. Check which browser the wall displays run before relying on it; elsewhere the frosted fallback is the design
- The app's copy is `app/js/vendor/liquid-glass.js`, loaded by `<script>` in `app/index.html`; wire a new surface with `glass(el)` from `app/js/glass.js`, which handles low quality and only refracts boxes near the screen, and call `settleGlass()` after showing or hiding it. A surface needs a see-through fill (`--glass-fill`) or the bend is invisible
- Use `liquid-glass.js` from this folder, copied into the app's static files. No CDN, no external requests
