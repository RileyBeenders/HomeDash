# Accessibility

- **Contrast**: text AA (4.5:1), large text and symbols 3:1, in both palettes.
- **Not by color alone**: status always has a label, shape or position as well.
- **Focus**: `:focus-visible` shows `--focus-ring` (a 2px accent ring with a gap). Never `outline: none` without a replacement.
- **Targets**: 44px minimum, see [Touch and displays](touch-and-displays.md).
- **Reduced motion**: `prefers-reduced-motion: reduce` collapses durations, stops pulses and entrance rises; changes still happen, instantly.
- **Semantics**: real `<button>`, `<dialog>`, `<nav>`, labels tied to inputs; tabs use `role="tablist"` with `aria-selected`.
- **Text size**: type is in `rem` and fluid, so browser text scaling works.
- **Keyboard**: every action reachable and visible; Escape closes sheets.
- **Language**: plain, specific, no jargon in the interface.
