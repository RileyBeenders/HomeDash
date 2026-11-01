# Dashboard

What the dashboard does and the rules every screen follows. Visual rules are in the [design language](../design/index.md); how the dashboard is monitored is in [Performance](performance.md); how to run it is in [Running the server](running.md).

## Guidelines

1. **Fits any screen.** The page adapts to the resolution and orientation of whatever opens it, from a phone to a 1080×1920 wall display. Layout follows the space available, not a device list.
2. **Fluid before fancy.** A smooth screen beats a pretty one. When a device can't keep up, the dashboard gives up effects first, then tells the log. See [Performance](performance.md).
3. **Built for fingers.** Most displays are touch only. Nothing needs a mouse, keyboard, hover or right-click.
4. **Visible scrolling.** A page taller than the screen shows a thick scrollbar on the right that can be grabbed and dragged.
5. **Swipeable pages.** The dashboard is a row of full-screen pages. Swipe sideways to move between them.
6. **A picture behind everything.** An opaque image fills the background. Menus and bars float over it as glass. (Image choice is not built yet; the ground is the plain warm color.)
7. **Few words.** Numbers, short labels and status lights. No sentences on a screen that is read from across a room.
8. **Settings at the top right.** A gear opens the settings for the page you are on.

## Pages

The row is **Calendar · Home · Weather**. Home sits in the middle so each other page is one swipe away.

| Page | Shows |
| --- | --- |
| **Home** | The time, large, with the date under it; then a glance at every other page: the weather now with today's high and low, the next seven days with a dot on busy ones, and today's events. Each glance is a button that scrolls to its page. |
| **Calendar** | The month, today ringed, a dot on days with events, and everything on today. |
| **Weather** | Now, the next twelve hours, the next six days. |

- A page is one screen. It is designed at 9:16 first; a wide screen puts the side content (today's list, the next hours, the week and agenda) to the right of the lead (the month, the weather now, the clock) instead of under it. See [Wide screens add columns](../design/touch-and-displays.md#wide-screens-add-columns-never-width).
- Pages swipe horizontally and snap. Vertical overflow inside a page scrolls on its own; a gesture locks to the axis it starts on.
- On Calendar and Weather the time and date sit small in the top left.
- The display opens on Home after a reload.

### Page dots

A glass pill at the bottom middle: a Home button, then one dot per page. An accent thumb slides under the dots as the pager moves and follows the finger during a swipe. Tap a dot to go to that page, tap the house to go Home.

### Returning home

After 60 seconds without a touch the pager goes back to Home (General → Return home; can be off). Waking from sleep goes Home too, once sleep exists.

**Carousel** (off by default) walks Calendar → Home → Weather → Home → Calendar, one page at a time, while nobody is touching the display. A touch stops it; it starts again after the display has been idle. It never moves while settings are open.

## Settings

The gear opens settings on the page you are on. Settings are a list of areas that open into their own screen, the way a phone's settings app does: on a narrow screen the area slides over the list with a Back control; on a wide screen the list stays as a sidebar. Changes apply at once, on every display that shares them.

| Area | Settings |
| --- | --- |
| **Calendar** | Week starts on Sunday or Monday |
| **Home** | Hours 12 or 24 · Seconds · Clock style, text or flip · Time zone |
| **Weather** | Units °F or °C · Place, typed, turned into coordinates on the server |
| **General** | Theme auto, light or dark · Return home, off to 2 min · Carousel, off to 30 s · Quality auto, high or low |
| **This display** | Name · Same on all displays · Diagnostics: frames, dropped, memory, connection, quality, screen |

Settings are kept on the server and are the same on every display until a display turns **Same on all displays** off; it then keeps its own copy, starting from what it had, and only its own screen changes it.

## Sources

- **Weather** comes through the server from Open-Meteo, refreshed every 15 minutes and kept on disk, so a display shows the last reading, marked stale, when the internet is down. Displays never talk to the internet.
- **Calendar** has no provider yet. The screens show a sample set of events, tagged **Sample**, in the same shape a feed or an account will fill later.

## Wording

- A label is one or two words. A reading is a number and a unit.
- If a screen needs a sentence to explain itself, change the screen.
- Settings may use one short line to say what will happen; dashboard pages don't.

## Open questions

- **Settings access.** On a wall display anyone can tap the gear. Options: leave it open, hide the gear until a deliberate gesture, or ask for a PIN on a shared display.
- **Background image.** Choosing and serving an image per display is designed but not built.
- **Overview strip.** Dropped while there are three pages; it returns when there are enough pages to need it.
- **Scrollbar.** Pages use the browser's scrollbar styled thick. Touch browsers may still draw it thin; a drawn scrollbar is next if real displays need it.
