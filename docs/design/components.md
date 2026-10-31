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

## States every interactive component needs

Default, hover (hover devices only), pressed, focus-visible (`--focus-ring`), disabled (45% opacity, no pointer), and loading where it waits on something.

## Feedback

Feedback belongs in the interface, not in a dialog: a toast, a light changing, a value updating. A sheet is for confirming something that cannot be undone.
