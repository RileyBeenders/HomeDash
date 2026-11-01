# Design language

How every screen looks, moves and responds. Values live in [`tokens.css`](../assets/tokens.css); the [live style guide](../assets/style-guide.html) shows them working.

## Principles

1. **Liquid glass.** Every box is clear glass over the ground, tinted by the theme, with a lit rim and a soft deep shadow, and in Chromium the rim bends what is behind it. Text on glass stays AA over the worst backdrop. Only small physical parts (flip tiles, switch knobs, fields) are opaque.
2. **One accent.** Warm accent for the single primary action, selection and links. A cool counterpoint for secondary data. Status colors mean status and nothing else.
3. **Quiet depth.** A lit rim and a soft shadow separate a box from the ground. No heavy borders, no gradients on surfaces beyond the glass sheen.
4. **Motion answers, never performs.** Things arrive from 12px below, presses give under a finger, nothing bounces. Faster pulses mean more urgent.
5. **Touch first.** 44px targets (56px on a wall screen), 8px apart, hover is an extra and never the only signal.
6. **Readable from a distance.** Big numbers are tabular and heavy; labels are small but never below AA contrast.
7. **Works offline.** System fonts, no CDN, no external requests.
8. **Scales to every device.** Fluid type and `auto-fill` grids from a phone to a portrait wall display.
9. **Few words.** A label is one or two words and a reading is a number. A screen that needs a sentence to explain itself gets redesigned.
10. **Fluid first.** Smooth beats pretty. Effects that cost frames, glass blur first, switch off when a device can't keep up.

## Pages

| Page | Covers |
| --- | --- |
| [Color](color.md) | Palettes, contrast, status |
| [Typography](typography.md) | Faces, scale, numbers |
| [Shape and depth](shape-and-depth.md) | Radii, spacing, shadows, glass |
| [Motion](motion.md) | Curves, durations, entrances, pulses |
| [Components](components.md) | Buttons, cards, switches, sheets, toasts |
| [Touch and displays](touch-and-displays.md) | Targets, portrait kiosk, phones |
| [Accessibility](accessibility.md) | Contrast, focus, reduced motion |

## Rules that stop it looking generic

- No purple-blue gradients, no glow on everything, no emoji as icons.
- No identical card grids with identical icon-heading-sentence content; vary scale and weight so one thing leads.
- One primary button per surface.
- Copy is plain and specific. No "Seamless", "Unleash", or exclamation marks.
