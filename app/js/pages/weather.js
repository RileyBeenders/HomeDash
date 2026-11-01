// Weather: now, the next hours, the next days. Numbers and icons, no sentences.

import { h, clear, setText } from '../dom.js';
import { icon, weatherKind } from '../icons.js';

export function createWeather() {
  const nowIcon = h('span', { class: 'wx-icon wx-icon-big' });
  const nowTemp = h('span', { class: 'reading' });
  const nowUnit = h('span', { class: 'unit' });
  const nowLabel = h('span', { class: 'wx-label' });
  const place = h('span', { class: 'label' });
  const feels = h('b');
  const humidity = h('b');
  const wind = h('b');
  const updated = h('span', { class: 'wx-updated' });

  const hours = h('div', { class: 'wx-hours' });
  const days = h('div', { class: 'wx-days' });

  const el = h('section', { class: 'page page-weather', 'data-page': 'weather' },
    h('div', { class: 'card wx-card' },
      h('span', { class: 'label-row' }, place, updated),
      h('span', { class: 'wx-now' }, nowIcon, h('span', { class: 'wx-temp' }, nowTemp, nowUnit)),
      nowLabel,
      h('span', { class: 'wx-facts' },
        h('span', { class: 'fact' }, h('small', {}, 'Feels'), feels),
        h('span', { class: 'fact' }, h('small', {}, 'Humidity'), humidity),
        h('span', { class: 'fact' }, h('small', {}, 'Wind'), wind),
      ),
    ),
    h('div', { class: 'card' }, h('span', { class: 'label' }, 'Next hours'), hours),
    h('div', { class: 'card' }, h('span', { class: 'label' }, 'Next days'), days),
  );

  let settings = null;

  function applySettings(next) {
    settings = next;
  }

  function applyWeather(w) {
    clear(hours);
    clear(days);
    if (!w?.ok) {
      nowIcon.innerHTML = icon('cloud');
      setText(nowTemp, '—');
      setText(nowUnit, '');
      setText(nowLabel, w?.reason === 'no-location' ? 'No location' : 'Loading');
      setText(place, w?.reason === 'no-location' ? 'Weather' : 'Weather');
      setText(updated, '');
      for (const b of [feels, humidity, wind]) setText(b, '—');
      return;
    }

    const unit = w.units === 'c' ? '°C' : '°F';
    const kind = weatherKind(w.current.weather_code, w.current.is_day);
    nowIcon.innerHTML = icon(kind.icon);
    setText(nowTemp, Math.round(w.current.temperature_2m));
    setText(nowUnit, unit);
    setText(nowLabel, kind.label);
    setText(place, w.location?.name || 'Weather');
    setText(feels, `${Math.round(w.current.apparent_temperature)}°`);
    setText(humidity, `${Math.round(w.current.relative_humidity_2m)}%`);
    setText(wind, `${Math.round(w.current.wind_speed_10m)} ${w.units === 'c' ? 'km/h' : 'mph'}`);

    const at = new Date(w.fetchedAt);
    const hourCycle = settings?.home?.hourCycle === '24' ? 'h23' : 'h12';
    const tf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hourCycle });
    setText(updated, (w.stale ? 'Stale · ' : '') + tf.format(at));

    // Hours: from the current hour, twelve ahead.
    const hf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', hourCycle });
    const nowHour = new Date();
    nowHour.setMinutes(0, 0, 0);
    const startIdx = Math.max(0, w.hourly.time.findIndex((t) => new Date(t) >= nowHour));
    for (let i = startIdx; i < Math.min(startIdx + 12, w.hourly.time.length); i++) {
      const k = weatherKind(w.hourly.weather_code[i], w.hourly.is_day[i]);
      const rain = w.hourly.precipitation_probability?.[i];
      hours.append(
        h('span', { class: 'wx-hour' },
          h('small', {}, i === startIdx ? 'Now' : hf.format(new Date(w.hourly.time[i]))),
          h('span', { class: 'wx-icon', html: icon(k.icon) }),
          h('b', {}, `${Math.round(w.hourly.temperature_2m[i])}°`),
          h('small', { class: rain >= 20 ? 'rain' : 'rain off' }, rain != null ? `${rain}%` : ''),
        ),
      );
    }

    // Days: today and five more.
    const df = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    const lows = w.daily.temperature_2m_min;
    const highs = w.daily.temperature_2m_max;
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    for (let i = 0; i < w.daily.time.length; i++) {
      const k = weatherKind(w.daily.weather_code[i], true);
      const d = new Date(w.daily.time[i] + 'T12:00:00');
      const l = ((lows[i] - min) / (max - min || 1)) * 100;
      const r = ((highs[i] - min) / (max - min || 1)) * 100;
      const rain = w.daily.precipitation_probability_max?.[i];
      days.append(
        h('span', { class: 'wx-day' },
          h('span', { class: 'wx-day-name' }, i === 0 ? 'Today' : df.format(d)),
          h('span', { class: 'wx-icon', html: icon(k.icon) }),
          h('small', { class: rain >= 20 ? 'rain' : 'rain off' }, rain != null ? `${rain}%` : ''),
          h('b', { class: 'lo' }, `${Math.round(lows[i])}°`),
          h('span', { class: 'wx-bar' }, h('i', { style: { left: `${l}%`, right: `${100 - r}%` } })),
          h('b', { class: 'hi' }, `${Math.round(highs[i])}°`),
        ),
      );
    }
  }

  return { el, applySettings, applyWeather };
}
