# Color

Two palettes with the same token names. Light is a warm paper; dark is a warm charcoal, never pure black. Follow the system, allow an override with `data-theme="light|dark"`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#f6f1ea` | `#1b1714` | Page ground |
| `--bg-raised` | `#fffdf9` | `#26211d` | Cards, rows, sheets |
| `--bg-sunken` | `#ede6dc` | `#141110` | Wells, tracks, fields |
| `--text` | `#26211c` | `#f4ede4` | Primary text |
| `--text-dim` | `#5a5046` | `#c6bbad` | Secondary text |
| `--text-faint` | `#6f6355` | `#a89d8f` | Labels |
| `--accent` | `#b3411c` | `#f2916a` | Primary action, links, selection |
| `--counter` | `#26666a` | `#72c7c9` | Secondary emphasis, data |
| `--ok` | `#1f7a47` | `#6fd29b` | Good |
| `--warn` | `#8f5400` | `#f2bb52` | Needs attention |
| `--bad` | `#b3261e` | `#ff8f86` | Problem, destructive |

## Rules

- Text on `--bg` and `--bg-raised` is AA (4.5:1) or better in both palettes. Smallest ratio is `--ok` on light at 4.75:1.
- Text on the accent fill uses `--accent-on`.
- Status colors are never themed or reused for decoration, so "red" always means a problem.
- Never rely on color alone for status: pair it with a label, icon or position.
- Shadows are cast in a warm shade (`--shade-rgb`), not black, so they read as depth rather than a smudge.

## Checking a change

Compute the contrast ratio of each text token against `--bg` and `--bg-raised` before changing a value. Anything under 4.5:1 for text, or 3:1 for a symbol or large text, is rejected.
