// Home: the clock leads, and under it a glance at every other page. Each
// widget is a button that scrolls the pager to its page.

import { h, clear, setText } from '../dom.js';
import { icon, weatherKind } from '../icons.js';
import { createTextClock, createFlipClock, createDateLine } from '../clock.js';
import { eventsOn, addDays, startOfDay, sameDay, isSample, timeFormatter } from '../calendar-data.js';

const AGENDA_MAX = 5;

export function createHome({ go }) {
  const time = h('div', { class: 'time', role: 'timer', 'aria-live': 'off' });
  const date = h('div', { class: 'date' });

  // Weather
  const wxIcon = h('span', { class: 'wx-icon' });
  const wxTemp = h('span', { class: 'reading' });
  const wxUnit = h('span', { class: 'unit' });
  const wxLabel = h('span', { class: 'wx-label' });
  const wxRange = h('span', { class: 'wx-range' });
  const weather = h('button', { class: 'card widget widget-weather', type: 'button', onclick: () => go('weather'), 'aria-label': 'Weather' },
    h('span', { class: 'label' }, 'Weather'),
    h('span', { class: 'wx-now' }, wxIcon, h('span', { class: 'wx-temp' }, wxTemp, wxUnit)),
    h('span', { class: 'wx-meta' }, wxLabel, wxRange),
  );

  // Week strip
  const weekCells = h('span', { class: 'week' });
  const week = h('button', { class: 'card widget widget-week', type: 'button', onclick: () => go('calendar'), 'aria-label': 'Calendar' },
    h('span', { class: 'label' }, 'This week'),
    weekCells,
  );

  // Agenda
  const agendaTag = h('span', { class: 'tag' }, 'Sample');
  const agendaList = h('span', { class: 'agenda' });
  const agenda = h('button', { class: 'card widget widget-agenda', type: 'button', onclick: () => go('calendar'), 'aria-label': 'Today' },
    h('span', { class: 'label-row' }, h('span', { class: 'label' }, 'Today'), agendaTag),
    agendaList,
  );

  const el = h('section', { class: 'page page-home', 'data-page': 'home' },
    h('div', { class: 'hero' }, time, date),
    weather,
    week,
    agenda,
  );

  let clock = null;
  let dateLine = null;
  let settings = null;

  function applySettings(next) {
    settings = next;
    const opts = { hourCycle: next.home.hourCycle, seconds: next.home.seconds, timeZone: next.home.timeZone };
    const wantFlip = next.home.clockStyle === 'flip';
    time.classList.toggle('seconds', Boolean(next.home.seconds));
    if (!clock || clock.flip !== wantFlip) {
      clock?.destroy();
      clock = wantFlip ? createFlipClock(time, { ...opts }) : createTextClock(time, { ...opts });
      clock.flip = wantFlip;
    } else clock.update(opts);
    if (!dateLine) dateLine = createDateLine(date, { timeZone: next.home.timeZone });
    else dateLine.update({ timeZone: next.home.timeZone });
    renderEvents();
  }

  function applyWeather(w) {
    if (!w?.ok) {
      wxIcon.innerHTML = icon('cloud');
      setText(wxTemp, '—');
      setText(wxUnit, '');
      setText(wxLabel, w?.reason === 'no-location' ? 'No location' : 'Loading');
      setText(wxRange, '');
      return;
    }
    const kind = weatherKind(w.current.weather_code, w.current.is_day);
    wxIcon.innerHTML = icon(kind.icon);
    setText(wxTemp, Math.round(w.current.temperature_2m));
    setText(wxUnit, w.units === 'c' ? '°C' : '°F');
    setText(wxLabel, kind.label + (w.stale ? ' · stale' : ''));
    setText(wxRange, `H ${Math.round(w.daily.temperature_2m_max[0])}°  L ${Math.round(w.daily.temperature_2m_min[0])}°`);
  }

  function renderEvents() {
    if (!settings) return;
    const today = startOfDay(new Date());
    const fmt = timeFormatter(settings);

    // Week strip: today first, so the eye lands on it.
    clear(weekCells);
    const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const busy = eventsOn(d).length > 0;
      weekCells.append(
        h('span', { class: 'week-day' + (i === 0 ? ' today' : ''), 'aria-current': i === 0 ? 'date' : null },
          h('small', {}, dayName.format(d)),
          h('b', {}, d.getDate()),
          h('i', { class: busy ? 'dot' : 'dot off' }),
        ),
      );
    }

    // Agenda: what is still to come today, then what already happened.
    const now = new Date();
    const events = eventsOn(today);
    const upcoming = events.filter((e) => e.allDay || e.end > now);
    const list = upcoming.length ? upcoming : events;
    clear(agendaList);
    agendaTag.hidden = !isSample();
    if (!list.length) {
      agendaList.append(h('span', { class: 'agenda-empty' }, 'Nothing today'));
      return;
    }
    list.slice(0, AGENDA_MAX).forEach((e) => {
      const past = !e.allDay && e.end <= now;
      agendaList.append(
        h('span', { class: 'agenda-row' + (past ? ' past' : ''), style: { '--c': `var(--${e.color || 'accent'})` } },
          h('span', { class: 'agenda-time' }, e.allDay ? 'All day' : fmt.format(e.start)),
          h('i', { class: 'agenda-dot' }),
          h('span', { class: 'agenda-title' }, e.title),
        ),
      );
    });
    if (list.length > AGENDA_MAX) agendaList.append(h('span', { class: 'agenda-more' }, `+${list.length - AGENDA_MAX}`));
  }

  // Rebuild the strip and list when the day turns.
  let lastDay = startOfDay(new Date());
  setInterval(() => {
    const today = startOfDay(new Date());
    if (!sameDay(today, lastDay)) {
      lastDay = today;
      renderEvents();
    }
  }, 60_000);

  return { el, applySettings, applyWeather, renderEvents };
}
