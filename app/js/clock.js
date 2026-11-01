// Clocks. One ticker lines itself up with the wall clock and fires once a
// second; each clock formats the time and writes to the page only when its
// text changed, so a minute clock touches the DOM sixty times an hour.

import { h, setText, clear, reducedMotion } from './dom.js';

const subscribers = new Set();
let timer = 0;

function schedule() {
  clearTimeout(timer);
  const now = Date.now();
  timer = setTimeout(tick, 1000 - (now % 1000) + 2);
}

function tick() {
  const now = new Date();
  for (const fn of subscribers) fn(now);
  schedule();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});

export function onTick(fn) {
  subscribers.add(fn);
  if (subscribers.size === 1) schedule();
  fn(new Date());
  return () => subscribers.delete(fn);
}

// ---------------------------------------------------------------- format

function timeFormatter({ hourCycle, seconds, timeZone }) {
  const opts = {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: hourCycle === '24' ? 'h23' : 'h12',
  };
  if (seconds) opts.second = '2-digit';
  if (timeZone) opts.timeZone = timeZone;
  try {
    return new Intl.DateTimeFormat(undefined, opts);
  } catch {
    delete opts.timeZone;
    return new Intl.DateTimeFormat(undefined, opts);
  }
}

function dateFormatter({ timeZone }, style = 'long') {
  const opts = style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' };
  if (timeZone) opts.timeZone = timeZone;
  try {
    return new Intl.DateTimeFormat(undefined, opts);
  } catch {
    delete opts.timeZone;
    return new Intl.DateTimeFormat(undefined, opts);
  }
}

// Returns { hour, minute, second, period } as strings for a date.
export function timeParts(fmt, date) {
  const out = { hour: '', minute: '', second: '', period: '' };
  for (const p of fmt.formatToParts(date)) {
    if (p.type === 'hour') out.hour = p.value;
    else if (p.type === 'minute') out.minute = p.value;
    else if (p.type === 'second') out.second = p.value;
    else if (p.type === 'dayPeriod') out.period = p.value;
  }
  return out;
}

// ------------------------------------------------------------ text clock

// A plain clock: hours and minutes, optional seconds, a small AM/PM.
export function createTextClock(el, options) {
  const main = h('span', { class: 'time-main' });
  const period = h('span', { class: 'time-period' });
  clear(el).append(main, period);
  let fmt = timeFormatter(options);

  const render = (now) => {
    const p = timeParts(fmt, now);
    setText(main, p.second ? `${p.hour}:${p.minute}:${p.second}` : `${p.hour}:${p.minute}`);
    setText(period, p.period);
  };

  const stop = onTick(render);
  return {
    update(next) {
      Object.assign(options, next);
      fmt = timeFormatter(options);
      render(new Date());
    },
    destroy() {
      stop();
      clear(el);
    },
  };
}

// ------------------------------------------------------------ flip clock

// Split-flap digits. Each tile keeps a still top and bottom half; on a change
// the old top folds down over the fold line and the new bottom folds up behind
// it. Transform only, interruptible, and a plain swap when the device is on
// the low tier or asks for reduced motion.
export function createFlipClock(el, options) {
  const groups = { hour: [], minute: [], second: [] };
  const period = h('span', { class: 'time-period' });
  let fmt = timeFormatter(options);

  function tile() {
    const t = h('span', { class: 'flip' },
      h('b', { class: 'up' }, h('i')),
      h('b', { class: 'down' }, h('i')),
      h('b', { class: 'front' }, h('i')),
      h('b', { class: 'back' }, h('i')),
    );
    t._value = '';
    t.querySelector('.back').addEventListener('animationend', () => finish(t));
    return t;
  }

  function finish(t) {
    t.classList.remove('go');
    t.querySelector('.down i').textContent = t._value;
    t.querySelector('.front i').textContent = t._value;
  }

  function set(t, value) {
    if (t._value === value) return;
    const old = t._value;
    t._value = value;
    const instant = !old || reducedMotion.matches || document.documentElement.dataset.quality === 'low';
    if (t.classList.contains('go')) finish(t);
    t.querySelector('.up i').textContent = value;
    t.querySelector('.back i').textContent = value;
    if (instant) {
      finish(t);
      return;
    }
    t.querySelector('.front i').textContent = old;
    t.querySelector('.down i').textContent = old;
    // Restart the animation even if the class is already there.
    void t.offsetWidth;
    t.classList.add('go');
  }

  function build() {
    clear(el);
    el.classList.add('flip-clock');
    const want = ['hour', 'minute', ...(options.seconds ? ['second'] : [])];
    for (const key of Object.keys(groups)) groups[key] = [];
    want.forEach((key, i) => {
      if (i > 0) el.append(h('span', { class: 'flip-colon', 'aria-hidden': 'true' }, ':'));
      const g = h('span', { class: 'flip-group' }, tile(), tile());
      groups[key] = [...g.children];
      el.append(g);
    });
    el.append(period);
  }

  const render = (now) => {
    const p = timeParts(fmt, now);
    const write = (key, value) => {
      const [a, b] = groups[key];
      if (!a) return;
      const s = value.padStart(2, '0');
      set(a, s[0]);
      set(b, s[1]);
    };
    write('hour', p.hour);
    write('minute', p.minute);
    write('second', p.second);
    setText(period, p.period);
  };

  build();
  const stop = onTick(render);
  return {
    update(next) {
      const rebuild = next.seconds !== undefined && next.seconds !== options.seconds;
      Object.assign(options, next);
      fmt = timeFormatter(options);
      if (rebuild) build();
      render(new Date());
    },
    destroy() {
      stop();
      clear(el);
      el.classList.remove('flip-clock');
    },
  };
}

// A date line under or beside a clock.
export function createDateLine(el, options, style = 'long') {
  let fmt = dateFormatter(options, style);
  const render = (now) => setText(el, fmt.format(now));
  const stop = onTick(render);
  return {
    update(next) {
      Object.assign(options, next);
      fmt = dateFormatter(options, style);
      render(new Date());
    },
    destroy: stop,
  };
}
