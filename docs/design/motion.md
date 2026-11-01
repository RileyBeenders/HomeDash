# Motion

Motion answers a touch or explains a change. It never performs, and nothing overshoots.

## Curves

| Token | Value | Job |
| --- | --- | --- |
| `--ease` | `ease` | Hover and color changes |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entering, leaving, answering a press |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Something on screen moving elsewhere |
| `--ease-breathe` | `cubic-bezier(0.37, 0, 0.63, 1)` | Indicator lights |

## Durations

| Token | Time | Use |
| --- | --- | --- |
| `--dur-press` | 140ms | Press scale |
| `--dur-fast` | 150ms | Color, small state |
| `--dur-normal` | 200ms | Hover, toggles |
| `--dur-slow` | 300ms | Sheets, toasts, pane changes |
| `--dur-slower` | 500ms | Card entrance |

## Baselines

| Moment | Animation |
| --- | --- |
| Press | `scale(0.97)` (`0.94` for icon buttons), released with `--ease-out` |
| Entrance | Fade and rise `--enter-rise` (12px), `--dur-slower`, `--ease-out` |
| Stagger | `--stagger` (80ms) per item, capped at 5 steps |
| Sheet | Scale from 95% and fade, `--dur-slow`; scrim fades in 200ms |
| Toast | Rise 8px and fade, `--dur-slow` |
| Switch | Knob slides 20px, `--dur-normal`, `--ease-out` |
| Segmented thumb | Background and shadow, `--dur-normal` |
| Page swipe | Follows the finger, snaps with `--dur-slow` `--ease-out`. Carousel advance uses `--dur-slower` `--ease-in-out`. |
| Page dots | Active dot swaps to the wide shape and accent color; color eases, `--dur-normal` |
| Hover lift | `translateY(-2px)` plus `--shadow-hover`, hover devices only |

## Status pulses

A light rises and falls, it never blinks. Faster means more urgent.

| Token | Period | Meaning |
| --- | --- | --- |
| `--pulse-rare` | 6s | Ambient, barely there |
| `--pulse-calm` | 2.4s | All is well |
| `--pulse-busy` | 1.6s | Working |
| `--pulse-urgent` | 0.9s | Needs a person |

## Rules

- Animate `transform` and `opacity` only.
- Never animate something the user does dozens of times a day; keep it under 150ms or skip it.
- Everything must be interruptible: retarget, don't restart.
- Honor `prefers-reduced-motion`: tokens collapse to near-zero, pulses stop, state is shown by shape or text instead.
- Wall displays run for days: no looping decorative animation.

For building motion, use `/animate`; for critique, `/review-animations`.
