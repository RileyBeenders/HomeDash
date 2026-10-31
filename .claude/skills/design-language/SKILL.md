---
name: design-language
description: Load this project's design language (tokens, color, type, shape, motion, components, touch rules) before building or changing any UI. Use whenever a screen, component, style or animation is created or edited, or when asked "does this match the design language".
---

# Design language

The visual rules for every screen live in `docs/design/` and the values in `docs/assets/tokens.css`. The live reference is `docs/assets/style-guide.html`.

## Steps

1. Read `docs/design/index.md` for the principles, then only the pages the task touches: `color.md`, `typography.md`, `shape-and-depth.md`, `motion.md`, `components.md`, `touch-and-displays.md`, `accessibility.md`
2. Use tokens from `docs/assets/tokens.css` for every color, size, radius, duration and curve. Never hard-code a value that has a token. If a needed value has no token, propose one and add it to the tokens file and its docs page rather than inlining it
3. Build in both light and dark, at 375px, 768px, and a 1080×1920 portrait screen
4. Check: one primary action per surface, glass only on the functional layer, targets at least 44px, hover wrapped in `@media (hover: hover)`, reduced motion honored, status never by color alone
5. If the design language itself must change, update `tokens.css`, the matching `docs/design/` page and `style-guide.html` together, and re-check text contrast (AA)

## Never

- Name the product inside the design language pages or tokens. They describe a look, not a project
- Add purple-blue gradients, glow on everything, emoji icons, bouncing motion or looping decorative animation
- Use a CDN, web font or any external request
