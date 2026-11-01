// Events for the screens. One fetch covers the weeks around today; the month
// view asks for more when it leaves that range. Events arrive as wall-clock
// ISO strings and are kept as Dates.

import { loadCalendar, emit } from './state.js';

const DAY = 86_400_000;
let ranges = []; // [{ from, to, events }]

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function fetchRange(from, to) {
  const { events, source } = await loadCalendar(from, to);
  const parsed = events.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
  ranges = ranges.filter((r) => r.to <= from || r.from >= to); // drop overlaps
  ranges.push({ from, to, events: parsed, source });
  emit('calendar');
}

function covered(from, to) {
  return ranges.some((r) => r.from <= from && r.to >= to);
}

// Today minus a week to six weeks out: enough for Home and the current month.
export async function refreshEvents() {
  const today = startOfDay(new Date());
  ranges = [];
  await fetchRange(addDays(today, -7), addDays(today, 42));
}

export async function ensureRange(from, to) {
  if (!covered(from, to)) await fetchRange(from, to);
}

export function eventsBetween(from, to) {
  const out = [];
  const seen = new Set();
  for (const r of ranges) {
    for (const e of r.events) {
      if (e.end > from && e.start < to && !seen.has(e.id)) {
        seen.add(e.id);
        out.push(e);
      }
    }
  }
  return out.sort((a, b) => a.start - b.start || (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0));
}

export function eventsOn(day) {
  const from = startOfDay(day);
  return eventsBetween(from, new Date(from.getTime() + DAY));
}

export function isSample() {
  return ranges.some((r) => r.source === 'sample');
}

export function timeFormatter(settings) {
  const opts = { hour: 'numeric', minute: '2-digit', hourCycle: settings?.home?.hourCycle === '24' ? 'h23' : 'h12' };
  return new Intl.DateTimeFormat(undefined, opts);
}
