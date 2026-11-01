// Hand-drawn inline icons, one stroke weight, no icon font and no emoji.
// Every icon is a 24-unit box drawn with currentColor.

const WRAP = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>';
const MOON = '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>';
const CLOUD = '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 12.1 3.5 3.5 0 0 0 7 18Z"/>';
const CLOUD_SMALL = '<path d="M9 19h9a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.9 13.3 3 3 0 0 0 9 19Z"/>';

export const ICONS = {
  house: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  warning: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4M12 16.8v.2"/>',

  sun: SUN,
  moon: MOON,
  cloud: CLOUD,
  cloudSun: '<circle cx="8" cy="8" r="3"/><path d="M8 2.5v1.5M2.5 8H4M4.1 4.1l1.1 1.1M11.9 4.1l-1.1 1.1"/>' + CLOUD_SMALL,
  cloudMoon: '<path d="M11 8.6A4 4 0 0 1 5.6 3.4 4 4 0 1 0 11 8.6Z"/>' + CLOUD_SMALL,
  fog: '<path d="M5 9h12M3 13h18M6 17h12"/>',
  drizzle: '<path d="M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 9.1 3.5 3.5 0 0 0 7 15Z"/><path d="M9 18v1.5M13 18v1.5M17 18v1.5"/>',
  rain: '<path d="M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 8.1 3.5 3.5 0 0 0 7 14Z"/><path d="m9 17-1 3M13 17l-1 3M17 17l-1 3"/>',
  snow: '<path d="M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 8.1 3.5 3.5 0 0 0 7 14Z"/><path d="M9 17.5v.2M13 19.5v.2M17 17.5v.2M11 20.5v.2M15 16.5v.2"/>',
  storm: '<path d="M7 13h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 7.1 3.5 3.5 0 0 0 7 13Z"/><path d="m12.5 13-2 4h3l-2 4"/>',
  wind: '<path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 14h15a2.5 2.5 0 1 1-2.5 2.5M3 19h8a2 2 0 1 1-2 2"/>',
  drop: '<path d="M12 3.5s-6 6.4-6 10.5a6 6 0 0 0 12 0c0-4.1-6-10.5-6-10.5Z"/>',
  thermometer: '<path d="M10 4.5a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0Z"/><path d="M12 10v6"/>',
};

export function icon(name, extra = '') {
  return WRAP(ICONS[name] || ICONS.cloud, extra);
}

// WMO weather code (as Open-Meteo reports it) to an icon and a short label.
export function weatherKind(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return { icon: isDay ? 'sun' : 'moon', label: 'Clear' };
  if (c === 1) return { icon: isDay ? 'sun' : 'moon', label: 'Mostly clear' };
  if (c === 2) return { icon: isDay ? 'cloudSun' : 'cloudMoon', label: 'Partly cloudy' };
  if (c === 3) return { icon: 'cloud', label: 'Overcast' };
  if (c === 45 || c === 48) return { icon: 'fog', label: 'Fog' };
  if (c >= 51 && c <= 57) return { icon: 'drizzle', label: 'Drizzle' };
  if (c >= 61 && c <= 67) return { icon: 'rain', label: 'Rain' };
  if (c >= 71 && c <= 77) return { icon: 'snow', label: 'Snow' };
  if (c >= 80 && c <= 82) return { icon: 'rain', label: 'Showers' };
  if (c === 85 || c === 86) return { icon: 'snow', label: 'Snow showers' };
  if (c >= 95) return { icon: 'storm', label: 'Thunderstorm' };
  return { icon: 'cloud', label: 'Cloudy' };
}
