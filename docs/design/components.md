# Components

All of these are live in the [style guide](../assets/style-guide.html).

| Component | Spec |
| --- | --- |
| **Primary button** | Accent fill, `--accent-on` text, pill, 44px min. One per surface. |
| **Secondary button** | `--bg-raised`, `--line-strong` border, pill. |
| **Quiet button** | Text only in `--accent`, tint on hover. Third action in a row. |
| **Danger** | Secondary shape with `--bad` text; destructive actions go through a sheet. |
| **Segmented control** | Sunken track, raised thumb, 38px segments. For 2-4 mutually exclusive views. |
| **Switch** | 52×32, knob 24px, accent track when on. Label sits beside it and is tappable. |
| **Card** | `--bg-raised`, 1px `--line`, `--radius-lg`, `--shadow-default`, 24px padding. |
| **Reading** | `--text-hero`, display face, tabular numerals, unit smaller and `--text-dim`. |
| **Status light** | 20px dot with a soft ring, pulse per meaning, always paired with a text label. |
| **Toast** | Glass strong, `--radius`, bottom corner, never asks for anything, auto-dismisses. |
| **Sheet** | Native `<dialog>`, glass strong, `--radius-xl`, says what will happen before the button that does it. Escape, backdrop and Cancel do nothing. |
| **Field** | Sunken well, 1px `--line`, 44px min, 16px text. |
| **Scrollbar** | Always visible on the right when the page overflows. `--scrollbar-w` (24px) wide, `--bg-sunken` track, `--text-faint` thumb, thumb at least `--scrollbar-thumb-min` long, pill ends. Draggable with a finger. Hidden when nothing overflows. |
| **Pager** | Full-screen pages in a row, `scroll-snap-type: x mandatory`, one page per swipe. Vertical scroll inside a page is independent; a gesture locks to its starting axis. |
| **Page dots** | Glass pill at the bottom: a Home button (house icon), a hairline, then `--pager-dot` dots with a `--hit-min` target each. An accent thumb `--pager-dot-active` wide slides under the dots with the pager, `transform` only. Tap a dot to go there, the house to go Home. |
| **Overview strip** | Glass strip of small page previews, current page ringed in `--accent`. For when there are more pages than dots can show; not used at three. |
| **Settings gear** | Quiet icon button, top right, `--hit-kiosk` target on kiosk screens, opens settings on the current page. Not glass, not a primary action. |
| **Widget** | A card that is a button: opaque, full width, press scale, opens its page. Its label names the page. |
| **Week strip** | Seven cells, today first and ringed in `--accent` on `--accent-soft`, a dot under days with events. |
| **Agenda row** | Time in `--text-dim` tabular, a 10px color dot, the title in the display face. Past rows at 55% opacity. |
| **Flip clock** | Split-flap digits: opaque `--bg-raised` tiles 0.68em wide and 1.08em tall in the clock's size, `--radius-sm`, a `--line` fold. The digit is 0.8em so it never touches the tile edge. Only a changed digit folds; low quality and reduced motion swap instead. |
| **Corner clock** | Time in `--text-xl` and the date in `--text-sm` at the top left of any page that isn't Home; fades in as Home leaves the screen. |
| **Settings list** | Grouped rows on `--bg-raised` with `--radius` and `--line` hairlines between rows; a row is at least `--hit-min`. A link row ends in a chevron; a control row holds a segmented control, switch, select or field; a readout row shows a mono value. |
| **Settings nav** | Bar above a settings screen: Back on the left (narrow screens), the title, Done on the right. |
| **Reconnecting pill** | Glass pill at the top middle with a busy light and one word, shown while the server link is down. |

## States every interactive component needs

Default, hover (hover devices only), pressed, focus-visible (`--focus-ring`), disabled (45% opacity, no pointer), and loading where it waits on something.

## Feedback

Feedback belongs in the interface, not in a dialog: a toast, a light changing, a value updating. A sheet is for confirming something that cannot be undone.
