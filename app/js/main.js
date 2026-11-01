// Boot: build the pages, the dots, the corner clock and the gear; load the
// settings; keep the pager returning to Home when nobody is touching it.

import { h } from './dom.js';
import { icon } from './icons.js';
import { createPager } from './pager.js';
import { createHome } from './pages/home.js';
import { createCalendar } from './pages/calendar.js';
import { createWeather } from './pages/weather.js';
import { createSettings } from './settings.js';
import { startPerf } from './perf.js';
import { createTextClock, createDateLine } from './clock.js';
import { refreshEvents } from './calendar-data.js';
import { state, loadSettings, loadWeather, connect, on, isKiosk, pingActivity } from './state.js';

// Home sits in the middle so each other page is one swipe away.
const PAGES = ['calendar', 'home', 'weather'];
const HOME = PAGES.indexOf('home');

if (isKiosk) {
  document.body.classList.add('kiosk');
  document.documentElement.dataset.kiosk = '';
}

// ----------------------------------------------------------------- pages

const pagerEl = document.getElementById('pager');
const pages = {
  calendar: createCalendar(),
  home: createHome({ go: (name) => go(name) }),
  weather: createWeather(),
};
for (const name of PAGES) pagerEl.append(pages[name].el);

let pager = null;

function go(name, opts) {
  pager?.goTo(PAGES.indexOf(name), opts);
}

// ------------------------------------------------------------------ dots

const dotsEl = document.getElementById('dots');
const homeBtn = h('button', { class: 'dots-home', type: 'button', 'aria-label': 'Home', html: icon('house'), onclick: () => go('home') });
const dotBtns = PAGES.map((name, i) =>
  h('button', { class: 'dot', type: 'button', 'aria-label': name[0].toUpperCase() + name.slice(1), onclick: () => go(name) }, h('i')),
);
const thumb = h('span', { class: 'thumb', 'aria-hidden': 'true' });
dotsEl.append(homeBtn, h('span', { class: 'dots-sep' }), ...dotBtns, thumb);

function placeThumb(progress) {
  const i = Math.max(0, Math.min(PAGES.length - 1, Math.floor(progress)));
  const f = progress - i;
  const a = dotBtns[i];
  const b = dotBtns[Math.min(PAGES.length - 1, i + 1)];
  const center = (btn) => btn.offsetLeft + btn.offsetWidth / 2;
  const x = center(a) + (center(b) - center(a)) * f - thumb.offsetWidth / 2;
  thumb.style.transform = `translateX(${x}px)`;
}

// ---------------------------------------------------------- corner clock

const corner = document.getElementById('corner');
const cornerClock = createTextClock(corner.querySelector('.corner-time'), { hourCycle: '12', seconds: false, timeZone: '' });
const cornerDate = createDateLine(corner.querySelector('.corner-date'), { timeZone: '' }, 'short');

function onProgress(progress) {
  placeThumb(progress);
  // The small clock fades in as Home leaves the screen. Opacity only.
  const away = Math.min(1, Math.abs(progress - HOME) * 2);
  corner.style.opacity = away;
  corner.style.pointerEvents = away > 0.5 ? '' : 'none';
}

function onSettle(i) {
  dotBtns.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  homeBtn.setAttribute('aria-current', i === HOME ? 'true' : 'false');
}

// Everything the pager reports to is built; now it can move.
pager = createPager(pagerEl, { onProgress, onSettle });
pager.jump(HOME);

// --------------------------------------------------------------- settings

const settings = createSettings({ onOpen: () => interaction(), onClose: () => interaction() });
const gear = document.getElementById('gear');
gear.innerHTML = icon('gear');
gear.addEventListener('click', () => settings.open(PAGES[pager.index()]));

// Pages other than Home start below the corner clock, whatever size it is.
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--corner-h', `${Math.ceil(entry.contentRect.height)}px`);
}).observe(corner);

const perf = startPerf({ onTier: () => {} });

on('settings', (s) => {
  document.documentElement.dataset.theme = s.general.theme === 'auto' ? '' : s.general.theme;
  if (!document.documentElement.dataset.theme) delete document.documentElement.dataset.theme;
  perf.setQuality(s.general.quality);
  for (const name of PAGES) pages[name].applySettings(s);
  cornerClock.update({ hourCycle: s.home.hourCycle, seconds: false, timeZone: s.home.timeZone });
  cornerDate.update({ timeZone: s.home.timeZone });
  idle.seconds = Number(s.general.idleReturn) || 0;
  idle.carousel = Number(s.general.carousel) || 0;
  interaction();
});

on('weather', (w) => {
  pages.home.applyWeather(w);
  pages.weather.applyWeather(w);
});

on('calendar', () => {
  pages.home.renderEvents();
  pages.calendar.render();
});

on('connection', (c) => {
  document.getElementById('link').hidden = c !== 'offline';
});

// ------------------------------------------------------------------ idle

// After a while without a touch the pager goes back to Home; with the
// carousel on it then walks Calendar → Home → Weather → Home and back, one
// page at a time, until someone touches the screen.
const idle = { seconds: 60, carousel: 0, timer: 0, walk: 0, dir: 1 };

function interaction() {
  pingActivity();
  clearTimeout(idle.timer);
  clearInterval(idle.walk);
  idle.walk = 0;
  if (idle.seconds > 0) idle.timer = setTimeout(onIdle, idle.seconds * 1000);
}

function onIdle() {
  if (settings.isOpen()) return interaction();
  go('home');
  if (idle.carousel > 0) idle.walk = setInterval(walk, idle.carousel * 1000);
}

function walk() {
  if (settings.isOpen()) return;
  const i = pager.index();
  let next = i + idle.dir;
  if (next < 0 || next >= PAGES.length) {
    idle.dir = -idle.dir;
    next = i + idle.dir;
  }
  pager.goTo(next);
}

for (const type of ['pointerdown', 'touchstart', 'keydown', 'wheel']) {
  document.addEventListener(type, interaction, { passive: true, capture: true });
}

// A hook for the sleep hardware that comes later: waking goes Home.
window.homedash = { goHome: () => go('home'), onSleep: () => pager.jump(HOME), onWake: () => pager.jump(HOME) };

// ------------------------------------------------------------------ boot

(async () => {
  try {
    await loadSettings();
  } catch {
    document.getElementById('link').hidden = false;
  }
  connect();
  loadWeather().catch(() => {});
  refreshEvents().catch(() => {});
  // Refresh the events around midnight and every hour in between.
  setInterval(() => refreshEvents().catch(() => {}), 60 * 60_000);
})();
