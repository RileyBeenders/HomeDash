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

`--glass-fill` with `backdrop-filter: var(--glass-filter)` (blur `--glass-blur`, saturation `--glass-sat`) and a `--glass-line` hairline. Only on the functional layer: top bar, sheet, toast, popover, page dots, overview strip. Sheets and toasts use `--glass-fill-strong` so text stays solid. A control may turn to glass while it is held (a switch knob), and only then.

Never write the blur out by hand: components use `--glass-filter` so one switch can turn glass off. Keep at most two glass layers on screen at once.

### Refraction

Glass may also bend what is behind its rim, with a faint prism fringe (liquid glass). It is decoration on the functional layer only, never meaning, and only where the browser supports it (Chromium); elsewhere the frosted glass above is the design. Use `/liquid-glass` to build it. It costs more than plain blur, so it counts toward the two-layer limit and turns off in low quality.

### Low quality

`<html data-quality="low">` sets `--glass-filter: none` and makes `--glass-fill` the solid `--glass-fill-strong`. The look is the same without the blur. The page sets it when a device can't hold its frame rate.

## Image ground

The ground can be an opaque photograph or picture, covering the screen (`background-size: cover`, fixed, never scrolling with the page).

- Darken it with `rgba(var(--shade-rgb), var(--image-dim))` laid over the image. `--image-dim` is light by day and heavy by night, which also protects a display that stays on all night.
- Cards and readings stay opaque on top of it; only the functional layer is glass.
- Pick or crop images with calm, low-contrast areas where glass sits. Check text on glass at AA over the brightest and darkest parts of the image.
- Without an image, the ground is `--bg` with the `--ambient` light.
