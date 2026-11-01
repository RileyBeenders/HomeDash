// Calendar events. No provider is connected yet, so this returns a sample set
// generated around today, marked sample:true so the screen can say so. A feed
// or an account link later fills the same shape:
//   { id, title, start, end, allDay, color, sample }
// with start and end as ISO strings in local time.

const SAMPLE_DAY = [
  { title: 'Dentist', at: [10, 0], mins: 45, color: 'counter' },
  { title: 'Call with Sam', at: [14, 30], mins: 30, color: 'accent' },
  { title: 'Gym', at: [18, 0], mins: 60, color: 'ok' },
];

const SAMPLE_WEEK = [
  { offset: 1, title: 'Groceries', at: [17, 0], mins: 60, color: 'counter' },
  { offset: 2, title: 'Trash out', allDay: true, color: 'warn' },
  { offset: 3, title: 'Lunch with Ana', at: [12, 0], mins: 90, color: 'accent' },
  { offset: 5, title: 'Movie night', at: [19, 30], mins: 120, color: 'counter' },
  { offset: -2, title: 'Oil change', at: [9, 0], mins: 60, color: 'ok' },
  { offset: 9, title: 'Birthday', allDay: true, color: 'accent' },
  { offset: 12, title: 'Plumber', at: [8, 0], mins: 120, color: 'warn' },
];

export function eventsBetween(from, to) {
  const today = startOfDay(new Date());
  const items = [];
  for (const e of SAMPLE_DAY) items.push(make(today, e));
  for (const e of SAMPLE_WEEK) items.push(make(addDays(today, e.offset), e));
  return items
    .filter((e) => Date.parse(e.end) > from.getTime() && Date.parse(e.start) < to.getTime())
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function make(day, e) {
  const start = new Date(day);
  const end = new Date(day);
  if (e.allDay) end.setDate(end.getDate() + 1);
  else {
    start.setHours(e.at[0], e.at[1], 0, 0);
    end.setTime(start.getTime() + e.mins * 60_000);
  }
  return {
    id: `sample-${e.title.toLowerCase().replace(/\W+/g, '-')}-${day.toISOString().slice(0, 10)}`,
    title: e.title,
    start: local(start),
    end: local(end),
    allDay: Boolean(e.allDay),
    color: e.color,
    sample: true,
  };
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ISO without a zone suffix, so the display reads it as wall-clock time.
function local(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
