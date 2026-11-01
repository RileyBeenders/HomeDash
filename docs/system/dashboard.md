# Dashboard

What the dashboard does and the rules every screen follows. Planned, not yet built. Visual rules are in the [design language](../design/index.md); how the dashboard is monitored is in [Performance](performance.md).

## Guidelines

1. **Fits any screen.** The page adapts to the resolution and orientation of whatever opens it, from a phone to a 1080×1920 wall display. Layout follows the space available, not a device list.
2. **Fluid before fancy.** A smooth screen beats a pretty one. When a device can't keep up, the dashboard gives up effects first, then tells the log. See [Performance](performance.md).
3. **Built for fingers.** Most displays are touch only. Nothing needs a mouse, keyboard, hover or right-click.
4. **Visible scrolling.** A page taller than the screen shows a thick scrollbar on the right that can be grabbed and dragged.
5. **Swipeable pages.** The dashboard is a row of full-screen pages. Swipe sideways to move between them.
6. **A picture behind everything.** An opaque image fills the background. Menus and bars float over it as glass.
7. **Few words.** Numbers, short labels and status lights. No sentences on a screen that is read from across a room.
8. **Settings at the top right.** A gear opens the settings that change how this display runs.

## Pages

- A page is one screen. It is designed at 9:16 first, and wider screens add columns without changing the order.
- Pages swipe horizontally and snap to the page. Vertical overflow inside a page scrolls on its own; a gesture locks to the axis it starts on.
- A row of dots at the bottom shows where you are. Tapping the dots opens the **overview**: a glass strip of small page previews, tap one to jump to it.
- **Carousel mode** advances through the pages on a timer, for a display nobody is touching. A touch pauses it, and it resumes after the display has been idle for a while. It never advances while a sheet is open.
- The first page is the one the display opens on after a reload.

## Background

- One opaque image per display or for all displays, chosen in settings. It is served from the server, resized to the screen, and never loaded from the internet.
- A dimming layer sits over the image so glass and text stay readable on any picture. At night the dimming deepens, which also protects against burn-in on a display that never turns off.
- Cards and readings stay opaque. Only the floating layer (page dots, overview, settings, toasts) is glass.

## Settings

The gear sits top right, with a 56px target on kiosk screens. It opens a sheet; changes apply immediately.

| Setting | Options | Applies to |
| --- | --- | --- |
| Theme | Auto, light, dark, scheduled | This display |
| Background | Choose image, dimming | This display |
| Pages | Order, show or hide each | This display |
| Carousel | Off, or seconds per page | This display |
| Quality | Auto, high, low | This display |
| Display name | Free text, shown in the log | This display |
| Diagnostics | Frame rate, memory, connection | This display |
| Update schedule | Day and time | All displays |
| Log level | Info, warning, error | All displays |

Settings are kept on the server per display, so a reloaded or replaced screen comes back the same.

## Wording

- A label is one or two words. A reading is a number and a unit.
- If a screen needs a sentence to explain itself, change the screen.
- Settings and sheets may use one short line to say what will happen; dashboard pages don't.

## Open questions

- **Settings access.** On a wall display anyone can tap the gear. Options: leave it open, hide the gear until a deliberate gesture, or ask for a PIN on a shared display.
- **Stage-style windows.** The plan is pages plus an overview strip. Resizable overlapping windows are a larger build and are left out until the pages work.
- **Icons.** A small set of hand-drawn inline SVG icons is needed (gear, dots, status); no icon font and no emoji.
- **What goes on the pages.** Clock and date, weather, calendar, home controls and host status are candidates. The first page is decided in the design phase.
