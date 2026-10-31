# Design language

How every screen looks, moves and responds. Values live in [`tokens.css`](../assets/tokens.css); the [live style guide](../assets/style-guide.html) shows them working.

## Principles

1. **Two layers.** The *functional layer* (bars, sheets, toasts, popovers) floats on glass. The *content layer* (cards, rows, readings) is opaque. Glass under a reading hurts legibility, so it never goes there.
2. **One accent.** Warm accent for the single primary action, selection and links. A cool counterpoint for secondary data. Status colors mean status and nothing else.
3. **Quiet depth.** A hairline and a soft shadow separate a card from the ground. No heavy borders, no gradients on surfaces.
4. **Motion answers, never performs.** Things arrive from 12px below, presses give under a finger, nothing bounces. Faster pulses mean more urgent.
5. **Touch first.** 44px targets (56px on a wall screen), 8px apart, hover is an extra and never the only signal.
6. **Readable from a distance.** Big numbers are tabular and heavy; labels are small but never below AA contrast.
7. **Works offline.** System fonts, no CDN, no external requests.
8. **Scales to every device.** Fluid type and `auto-fill` grids from a phone to a portrait wall display.

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
