// Calendar: a month grid with today ringed and a dot on days with events,
// and under it everything on today.

import { h, clear, setText } from '../dom.js';
import { icon } from '../icons.js';
import { eventsOn, ensureRange, addDays, startOfDay, sameDay, isSample, timeFormatter } from '../calendar-data.js';

export function createCalendar() {
  const title = h('h2', { class: 'cal-title' });
  const grid = h('div', { class: 'cal-grid', role: 'grid' });
  const list = h('div', { class: 'agenda agenda-full' });
  const tag = h('span', { class: 'tag' }, 'Sample');
  const listTitle = h('span', { class: 'label' }, 'Today');

  const prev = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous month', html: icon('chevronLeft'), onclick: () => shift(-1) });
  const next = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next month', html: icon('chevronRight'), onclick: () => shift(1) });
  const todayBtn = h('button', { class: 'btn quiet', type: 'button', onclick: () => show(new Date()) }, 'Today');

  const el = h('section', { class: 'page page-calendar', 'data-page': 'calendar' },
    h('div', { class: 'card cal-card' },
      h('div', { class: 'cal-head' }, prev, title, next, todayBtn),
      grid,
    ),
    h('div', { class: 'card' },
      h('span', { class: 'label-row' }, listTitle, tag),
      list,
    ),
  );

  let settings = null;
  let shown = startOfDay(new Date()); // any day in the month on screen
  shown.setDate(1);

  function shift(n) {
    const d = new Date(shown);
    d.setMonth(d.getMonth() + n);
    show(d);
  }

  async function show(day) {
    shown = startOfDay(day);
    shown.setDate(1);
    const from = addDays(shown, -7);
    const to = addDays(shown, 45);
    await ensureRange(from, to).catch(() => {});
    render();
  }

  function render() {
    if (!settings) return;
    const weekStart = Number(settings.calendar.weekStart) || 0;
    const today = startOfDay(new Date());
    setText(title, new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(shown));
    todayBtn.hidden = shown.getMonth() === today.getMonth() && shown.getFullYear() === today.getFullYear();

    clear(grid);
    const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, ((weekStart + i) - today.getDay() + 7) % 7);
      grid.append(h('span', { class: 'cal-wd', role: 'columnheader' }, dayName.format(d)));
    }

    const first = new Date(shown);
    const lead = (first.getDay() - weekStart + 7) % 7;
    const start = addDays(first, -lead);
    const month = shown.getMonth();
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== month) break;
      const count = eventsOn(d).length;
      grid.append(
        h('span', {
          class: 'cal-day' + (d.getMonth() !== month ? ' other' : '') + (sameDay(d, today) ? ' today' : ''),
          role: 'gridcell',
          'aria-current': sameDay(d, today) ? 'date' : null,
          'aria-label': count ? `${d.getDate()}, ${count} events` : null,
        },
          h('b', {}, d.getDate()),
          h('i', { class: count ? 'dot' : 'dot off' }),
        ),
      );
    }

    // Today's list.
    const fmt = timeFormatter(settings);
    const events = eventsOn(today);
    tag.hidden = !isSample();
    clear(list);
    if (!events.length) list.append(h('span', { class: 'agenda-empty' }, 'Nothing today'));
    const now = new Date();
    for (const e of events) {
      const past = !e.allDay && e.end <= now;
      list.append(
        h('span', { class: 'agenda-row' + (past ? ' past' : ''), style: { '--c': `var(--${e.color || 'accent'})` } },
          h('span', { class: 'agenda-time' }, e.allDay ? 'All day' : `${fmt.format(e.start)}–${fmt.format(e.end)}`),
          h('i', { class: 'agenda-dot' }),
          h('span', { class: 'agenda-title' }, e.title),
        ),
      );
    }
  }

  function applySettings(next) {
    settings = next;
    render();
  }

  return { el, applySettings, render, show };
}
