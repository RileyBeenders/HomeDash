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

`--glass-fill` with `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat))` and a `--glass-line` hairline. Only on the functional layer: top bar, sheet, toast, popover. Sheets and toasts use `--glass-fill-strong` so text stays solid. A control may turn to glass while it is held (a switch knob), and only then.
