# Typography

System faces only, so nothing downloads and it works offline on small hardware.

| Token | Job |
| --- | --- |
| `--font-display` | Headings, navigation, buttons, big readings |
| `--font-text` | Sentences and labels |
| `--font-mono` | Code and values that must line up |

## Scale

Fluid, with a floor, so a phone and a wall display both read comfortably.

| Token | Min → max | Use |
| --- | --- | --- |
| `--text-xs` | 12 → 13px | Labels, captions |
| `--text-sm` | 13 → 15px | Controls, secondary text |
| `--text-md` | 15 → 17px | Body |
| `--text-lg` | 18 → 22px | Section headings |
| `--text-xl` | 24 → 34px | Page headings |
| `--text-hero` | 40 → 80px | The one big reading on a screen |

## Rules

- Body line height 1.5; headings 1.15.
- Numbers that change use `font-variant-numeric: tabular-nums` so they hold their width while they tick.
- Labels: small caps style (uppercase, +0.08em tracking, 600 weight), `--text-faint`.
- Maximum measure about 60 characters.
- Weights: 500 controls, 600 emphasis, 650-700 headings and readings. Nothing lighter than 400.
- Inputs are at least 16px to stop phones zooming the page.
