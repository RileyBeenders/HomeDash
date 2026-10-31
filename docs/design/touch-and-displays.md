# Touch and displays

The same interface runs on a phone, a tablet and a portrait wall display driven by a small computer.

## Targets

| Token | Size | Where |
| --- | --- | --- |
| `--hit-min` | 44px | Everywhere |
| `--hit-kiosk` | 56px | Wall and kiosk screens |
| `--hit-gap` | 8px | Space between adjacent targets |

A glyph may be 20px; the tappable area around it is what counts.

## Portrait wall display

- Design at 9:16 first; wider layouts add columns, they don't change the order.
- One thing leads: a single hero reading or action per screen.
- Primary action sits low, where a hand lands. Destructive actions sit away from it.
- No hover, no right-click, no hold-to-reveal. Everything is a tap.
- Cursor hidden, text selection off, pull-to-refresh and pinch-zoom off.
- Layout holds for days: no layout shift, no looping decorative motion, no burn-in static bright edges (dark palette by default at night).
- Recover alone: a screen that loses its server shows a calm "reconnecting" state and retries.

## Phones

- `viewport-fit=cover` and `env(safe-area-inset-*)` padding.
- Use `100dvh`, never `100vh`.
- Inputs 16px or larger.
- `touch-action: manipulation` on controls; `-webkit-tap-highlight-color: transparent`.
- Hover styles wrapped in `@media (hover: hover)`.

## Layout

`grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr))` for card grids; fluid type tokens for everything else. Test at 375, 768, 1080×1920 and 1920×1080.

Use `/mobile-native` when building or reviewing any of this.
