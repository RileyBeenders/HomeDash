# Shape and depth

## Corners

Concentric: a control inside a container takes the next step down.

| Token | Size | Use |
| --- | --- | --- |
| `--radius-xl` | 28px | Sheets, screen frames |
| `--radius-lg` | 22px | Cards, panels |
| `--radius` | 16px | Rows, groups, toasts |
| `--radius-sm` | 11px | Fields, inner tiles |
| `--radius-xs` | 7px | Tags, small chips |
| `--radius-full` | pill | Buttons, segmented controls, switches |

## Spacing

4-8-12-16-24-32-48-72 (`--space-1` to `--space-8`). Gap between cards is `--gap` (16px). Keep content `--safe-x` (24px) from screen edges, plus `env(safe-area-inset-*)`.

## Wide layout

| Token | Size | Use |
| --- | --- | --- |
| `--col-max` | 55rem | Widest a lead column grows |
| `--side-min`, `--side-max` | 20rem, 30rem | Range of a side column |
| `--cell-max` | 4.5rem | Tallest a grid cell (a day) grows |

In rem, so a kiosk screen's type scale grows them with the type. How they are used is in [Touch and displays](touch-and-displays.md#wide-screens-add-columns-never-width).

## Depth

| Level | Token | Use |
| --- | --- | --- |
| Flat | none | Ground |
| Soft | `--shadow-soft` | Pills, thumbs |
| Default | `--shadow-default` | Cards |
| Hover | `--shadow-hover` | A card being pointed at (hover devices only) |
| Elevated | `--shadow-elevated` | Sheets, popovers, toasts |
| Carved | `--inset` | Fields, tracks, wells |

## Glass

Every box is glass: cards, widgets, bars, pills, toasts, sheets and the groups inside settings. The recipe, in tokens:

- `--glass-sheen` (a lit upper half) over `--glass-fill`, a clear tint of the theme, 62% in light and 58% in dark
- `backdrop-filter: var(--glass-filter)` (blur `--glass-blur`, saturation `--glass-sat`)
- a `--glass-line` hairline
- `--glass-specular`: a bright top edge, a soft inner glow at the bottom and a 1px inner border, in `box-shadow` ahead of the depth shadow
- `--shadow-glass` for a card, `--shadow-elevated` for a sheet or toast

The theme tints the glass (`--glass-fill` comes from the palette), so a palette changes the boxes and not only the accent. Sheets and toasts use `--glass-fill-strong` (88%) because they carry text over anything. Only small physical parts stay opaque: flip tiles, switch knobs and fields.

Never write the blur out by hand: components use `--glass-filter` so one switch can turn glass off.

### Refraction

Glass bends what is behind its rim, with a faint prism fringe (liquid glass), built on the module in `app/js/vendor/liquid-glass.js` and `app/js/glass.js`; use `/liquid-glass` for a new box. It is decoration, never meaning, and only where the browser supports it (Chromium); elsewhere the frosted glass above is the design.

- Every box is refracted while it is on or next to the screen, and not otherwise. Large boxes are refracted too, because a wide card on a portrait wall screen is the main case; the quality tier is what keeps a weak display smooth.
- A card uses scale -140, chroma 8 and a rim band of a tenth of its smaller side; a small pill needs more (scale -150, rim band a fifth of its height) or the bend is lost.
- Over a plain ground there is nothing to bend, so glass carries the sheen and specular to read as glass on its own. A picture ground shows it best.
- Text on glass must be AA over the worst backdrop. That is why the fill is 58–62% and not the 18–32% of a bare demo.

### Low quality

`<html data-quality="low">` sets `--glass-filter: none` and makes `--glass-fill` the solid `--glass-fill-strong`. The look is the same without the blur. The page sets it when a device can't hold its frame rate.

## Image ground

The ground can be an opaque photograph or picture, covering the screen (`background-size: cover`, fixed, never scrolling with the page).

- Darken it with `rgba(var(--shade-rgb), var(--image-dim))` laid over the image. `--image-dim` is light by day and heavy by night, which also protects a display that stays on all night.
- Boxes on top of it are glass, so the picture shows through and bends at their rims.
- Pick or crop images with calm, low-contrast areas where glass sits. Check text on glass at AA over the brightest and darkest parts of the image.
- Without an image, the ground is `--bg` with the `--ambient` light.

### Built-in grounds

| Ground | Is | Where |
| --- | --- | --- |
| Plain | `--bg` and `--ambient` | tokens |
| Meadow, Ridge | Drawn landscapes, hand-written SVG, no photographs | `app/grounds/` |
| Sky, Sunset, Fern | Vertical gradients: `--ground-sky`, `--ground-sunset`, `--ground-fern` | tokens |

- `data-ground="<name>"` on `<html>` picks one; none means Plain. Any element can carry its own, so a settings tile shows its own picture.
- A picture is deep at the top and light at the horizon, with its clouds and sun kept away from where the clock sits. `--ground-top-dim` shades the top further, and `--image-dim` shades all of it.
- Text sitting straight on a picture (the clock, the date, the corner clock, the gear) uses `--ground-fg` and `--ground-fg-dim`, white, which is AA over the shaded top. Anything else goes on a card.
- Landscapes are drawn to be cropped: wide, with the horizon low, so a portrait screen keeps the middle slice and a wide one the whole. Keep a new one free of detail in the top third.
- No photographs ship with the product. A picture of the household is data and belongs on the device, not in the repository.
