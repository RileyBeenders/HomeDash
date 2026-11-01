// Settings: a grouped list that opens into one screen per page and per system
// area, the way a phone's settings app does. On a narrow screen the detail
// slides over the list; on a wide one the list stays as a sidebar. The gear
// opens straight to the page you are on.

import { h, clear, setText } from './dom.js';
import { icon } from './icons.js';
import { state, patchSettings, patchDisplay, setLocation, loadUpdate, checkUpdate, displayId, on } from './state.js';
import { toast } from './toast.js';

const WIDE = matchMedia('(min-width: 768px)');

// The palettes in docs/assets/themes.css, in the order they are offered.
export const PALETTES = [['ember', 'Ember'], ['harbor', 'Harbor'], ['moss', 'Moss'], ['graphite', 'Graphite'], ['rose', 'Rose']];

// What can sit behind everything: plain, two drawn landscapes in app/grounds,
// and three gradients in the tokens. Plain is the page's own color.
export const GROUNDS = [['plain', 'Plain'], ['meadow', 'Meadow'], ['ridge', 'Ridge'], ['sky', 'Sky'], ['sunset', 'Sunset'], ['fern', 'Fern']];

const SECTIONS = [
  { group: 'Pages', items: [
    { id: 'calendar', title: 'Calendar' },
    { id: 'home', title: 'Home' },
    { id: 'weather', title: 'Weather' },
  ] },
  { group: 'System', items: [
    { id: 'general', title: 'General' },
    { id: 'theme', title: 'Theme' },
    { id: 'display', title: 'This display' },
    { id: 'updates', title: 'Updates' },
  ] },
];

export function createSettings({ onOpen, onClose }) {
  const dialog = document.getElementById('settings');
  const listBody = h('div', { class: 's-body' });
  const detailBody = h('div', { class: 's-body' });
  const detailTitle = h('h2', { class: 's-title' });
  const panes = h('div', { class: 's-panes', 'data-view': 'list' },
    h('div', { class: 's-pane s-list' },
      h('header', { class: 's-nav' }, h('h2', {}, 'Settings'), h('button', { class: 'btn quiet done', type: 'button', onclick: close }, 'Done')),
      listBody,
    ),
    h('div', { class: 's-pane s-detail' },
      h('header', { class: 's-nav' },
        h('button', { class: 'btn quiet back', type: 'button', onclick: () => setView('list'), html: icon('chevronLeft') + '<span>Settings</span>' }),
        detailTitle,
        h('button', { class: 'btn quiet done wide-only', type: 'button', onclick: close }, 'Done'),
      ),
      detailBody,
    ),
  );
  dialog.append(panes);
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  let current = 'home';
  let readouts = [];
  let readoutTimer = 0;

  function setView(view) {
    panes.dataset.view = view;
  }

  function open(section = 'home') {
    current = section;
    renderList();
    renderDetail(section);
    setView(WIDE.matches ? 'both' : 'detail');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('settings-open');
    clearInterval(readoutTimer);
    readoutTimer = setInterval(() => readouts.forEach((fn) => fn()), 1000);
    onOpen?.();
  }

  function close() {
    if (dialog.open) dialog.close();
    document.body.classList.remove('settings-open');
    clearInterval(readoutTimer);
    onClose?.();
  }

  WIDE.addEventListener('change', () => {
    if (dialog.open) setView(WIDE.matches ? 'both' : 'detail');
  });

  // Rebuild controls when settings change elsewhere (another display, or the
  // server confirming), so the screen never shows a stale value.
  on('settings', () => {
    if (dialog.open) renderDetail(current);
  });

  // ------------------------------------------------------------- list

  function renderList() {
    clear(listBody);
    for (const g of SECTIONS) {
      listBody.append(group(g.group, g.items.map((item) =>
        h('button', {
          class: 's-row link' + (item.id === current ? ' active' : ''),
          type: 'button',
          'aria-current': item.id === current ? 'page' : null,
          onclick: () => {
            current = item.id;
            renderList();
            renderDetail(item.id);
            setView(WIDE.matches ? 'both' : 'detail');
          },
        }, h('span', { class: 's-row-title' }, item.title), h('span', { class: 'chev', html: icon('chevronRight') })),
      )));
    }
  }

  // ----------------------------------------------------------- detail

  function renderDetail(section) {
    const s = state.settings;
    if (!s) return;
    readouts = [];
    clear(detailBody);
    setText(detailTitle, SECTIONS.flatMap((g) => g.items).find((i) => i.id === section)?.title || '');

    switch (section) {
      case 'home':
        detailBody.append(
          group('Time', [
            rowSeg('Hours', 'home.hourCycle', [['12', '12 h'], ['24', '24 h']]),
            rowSwitch('Seconds', 'home.seconds'),
            rowSeg('Style', 'home.clockStyle', [['text', 'Text'], ['flip', 'Flip']]),
          ]),
          group('Time zone', [rowSelect('Zone', 'home.timeZone', timeZones())]),
        );
        break;

      case 'calendar':
        detailBody.append(
          group('Week', [rowSeg('Starts on', 'calendar.weekStart', [[0, 'Sunday'], [1, 'Monday']])]),
          group('Calendars', [rowNote('No calendars connected yet. Sample events are shown.')]),
        );
        break;

      case 'weather':
        detailBody.append(
          group('Units', [rowSeg('Temperature', 'weather.units', [['f', '°F'], ['c', '°C']])]),
          group('Location', [
            rowField('Place', s.weather.location?.name || '', 'Town or city', async (value) => {
              const r = await setLocation(value).catch(() => ({ ok: false, reason: 'error' }));
              if (!r.ok) toast(r.reason === 'not-found' ? 'Place not found' : 'Could not look that up', 'bad');
              else toast(r.location ? `Weather set to ${r.location.name}` : 'Location cleared', 'ok');
            }),
          ]),
        );
        break;

      case 'general':
        detailBody.append(
          group('Pages', [
            rowSeg('Return home', 'general.idleReturn', [[0, 'Off'], [30, '30 s'], [60, '60 s'], [120, '2 min']]),
            rowSeg('Carousel', 'general.carousel', [[0, 'Off'], [10, '10 s'], [20, '20 s'], [30, '30 s']]),
          ]),
          group('Performance', [rowSeg('Quality', 'general.quality', [['auto', 'Auto'], ['high', 'High'], ['low', 'Low']])]),
        );
        break;

      case 'theme':
        detailBody.append(
          group('Mode', [rowSeg('Mode', 'general.theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']])]),
          group('Palette', [tilePicker('Palette', 'general.palette', PALETTES, (id) => h('span', { class: 'palette-view', 'data-palette': id, 'aria-hidden': 'true' },
            h('i', { class: 'palette-card' }), h('i', { class: 'palette-accent' }), h('i', { class: 'palette-counter' })))]),
          group('Ground', [tilePicker('Ground', 'general.ground', GROUNDS, (id) => h('span', { class: 'ground-view', 'data-ground': id, 'aria-hidden': 'true' }))]),
          group('', [rowNote('Auto follows the device. Status colors stay the same in every palette. A ground sits behind the cards; text sitting straight on it turns white.')]),
        );
        break;

      case 'updates':
        renderUpdates();
        break;

      case 'display': {
        const d = state.display;
        detailBody.append(
          group('Name', [
            rowField('Name', d.name, 'Hallway', (value) => patchDisplay({ name: value })),
            rowReadout('Id', () => displayId),
          ]),
          group('Settings', [
            rowSwitchRaw('Same on all displays', !d.own, (checked) => patchDisplay({ own: !checked })),
          ]),
          group('Diagnostics', [
            rowReadout('Frames', () => (state.perf ? `${state.perf.fps} fps · p95 ${state.perf.p95} ms` : '—')),
            rowReadout('Dropped', () => (state.perf ? `${state.perf.dropped}%` : '—')),
            rowReadout('Memory', () => (state.perf?.heapMb ? `${state.perf.heapMb} MB` : 'n/a')),
            rowReadout('Connection', () => state.connection),
            rowReadout('Quality', () => state.tier),
            rowReadout('Screen', () => `${innerWidth}×${innerHeight} @${devicePixelRatio}`),
          ]),
        );
        break;
      }
    }
  }

  // ---------------------------------------------------------- updates

  // The server decides everything about updating; this page only shows it and
  // asks for a check. The channel is chosen on the host PC (data/update.json).
  function renderUpdates() {
    const body = h('div', { class: 's-sections' });
    detailBody.append(body);
    let info = null;
    let failed = false;

    const draw = () => {
      clear(body);
      if (!info) {
        body.append(group('Updates', [rowNote(failed ? 'The server did not answer.' : 'Loading…')]));
        return;
      }
      const status = updateStatus(info);
      body.append(
        group('Status', [h('div', { class: 's-row' }, h('i', { class: 'light ' + status.light, 'aria-hidden': 'true' }), h('span', { class: 's-row-title' }, status.text))]),
        group('Version', [
          rowValue('Channel', channelName(info)),
          rowValue('Running', [info.version, info.running?.describe].filter(Boolean).join(' · ') || '—'),
          rowValue('Last check', info.lastCheck ? ago(info.lastCheck.at) : 'Not yet'),
          rowValue('Next check', info.nextCheck && info.channel === 'stable' ? clockTime(info.nextCheck) : '—'),
        ]),
        group('', [row('Check for updates', h('button', {
          class: 'btn primary',
          type: 'button',
          disabled: info.checking,
          onclick: check,
        }, info.checking ? 'Checking…' : 'Check now'))]),
        group('', [rowNote('The channel is set on the host PC. A server on Stable updates itself when no display has been touched for a few minutes.')]),
      );
    };

    const refresh = async () => {
      try {
        info = await loadUpdate();
        failed = false;
      } catch {
        failed = true;
      }
      if (alive()) draw();
      return info;
    };

    const alive = () => dialog.open && current === 'updates' && body.isConnected;

    const check = async () => {
      try {
        info = await checkUpdate();
      } catch {
        toast('Could not reach the server', 'bad');
        return;
      }
      draw();
      // The check runs on the server; read the answer when it is done.
      for (let i = 0; i < 90 && alive(); i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (!(await refresh())?.checking) break;
      }
    };

    draw();
    refresh();
  }

  function updateStatus(info) {
    if (info.checking) return { light: 'busy', text: 'Checking…' };
    if (!info.valid) return { light: 'bad', text: 'data/update.json is not valid, so nothing updates' };
    const lu = info.lastUpdate;
    if (lu?.status === 'rolled-back') return { light: 'bad', text: `Update ${(info.rejected?.commit || lu.to || '').slice(0, 7)} did not start and was rolled back` };
    if (lu?.status === 'stopped' || lu?.status === 'failed') return { light: 'bad', text: lu.message };
    if (info.waiting) return { light: 'busy', text: `Update ${info.waiting.commit.slice(0, 7)} installs when displays are idle` };
    const c = info.lastCheck;
    if (!c) return { light: 'idle', text: 'Not checked yet' };
    if (c.outcome === 'up-to-date') return { light: 'ok', text: 'Up to date' };
    if (c.outcome === 'error') return { light: 'bad', text: c.message };
    return { light: 'idle', text: c.message };
  }

  function channelName(info) {
    if (info.channel === 'version') return `Version lock ${info.ref}`;
    if (info.channel === 'branch') return `Branch lock ${info.ref}`;
    return 'Stable';
  }

  function ago(iso) {
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function clockTime(iso) {
    return new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  }

  // ------------------------------------------------------------- rows

  function rowValue(label, text) {
    return row(label, h('span', { class: 's-value' }, text));
  }

  function group(label, rows) {
    return h('div', { class: 's-group' }, label ? h('span', { class: 'label' }, label) : null, h('div', { class: 's-rows' }, rows));
  }

  function row(label, control, cls = '') {
    return h('div', { class: 's-row ' + cls }, h('span', { class: 's-row-title' }, label), control);
  }

  function rowSeg(label, path, options) {
    const value = String(get(path));
    const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
    for (const [v, text] of options) {
      seg.append(h('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(v) === value ? 'true' : 'false',
        onclick: () => {
          for (const b of seg.children) b.setAttribute('aria-checked', b.textContent === text ? 'true' : 'false');
          set(path, v);
        },
      }, text));
    }
    return row(label, seg, options.length > 2 ? 'stack' : '');
  }

  // One tile per choice, each drawn as itself so the choice is what you see.
  // The check says which is on, so color is never the only sign.
  function tilePicker(label, path, items, view) {
    const current = get(path);
    const grid = h('div', { class: 'palettes', role: 'radiogroup', 'aria-label': label });
    for (const [id, name] of items) {
      grid.append(h('button', {
        class: 'palette',
        type: 'button',
        role: 'radio',
        'aria-checked': id === current ? 'true' : 'false',
        onclick: () => {
          for (const b of grid.children) b.setAttribute('aria-checked', b.dataset.id === id ? 'true' : 'false');
          set(path, id);
        },
        'data-id': id,
      }, view(id), h('span', { class: 'palette-name' }, name, h('span', { class: 'palette-check', html: icon('check') }))));
    }
    return h('div', { class: 's-row palette-row' }, grid);
  }

  function rowSwitch(label, path) {
    return rowSwitchRaw(label, Boolean(get(path)), (checked) => set(path, checked));
  }

  function rowSwitchRaw(label, checked, onChange) {
    const id = 'sw-' + label.toLowerCase().replace(/\W+/g, '-');
    const input = h('input', { type: 'checkbox', id, checked, onchange: (e) => onChange(e.target.checked) });
    const sw = h('label', { class: 'switch', for: id }, input, h('span', { class: 'track' }), h('span', { class: 'knob' }));
    return h('label', { class: 's-row', for: id }, h('span', { class: 's-row-title' }, label), sw);
  }

  function rowSelect(label, path, options) {
    const value = String(get(path) ?? '');
    const select = h('select', { class: 'field', 'aria-label': label, onchange: (e) => set(path, e.target.value) });
    for (const [v, text] of options) select.append(h('option', { value: v, selected: String(v) === value }, text));
    return row(label, select, 'stack');
  }

  function rowField(label, value, placeholder, onCommit) {
    const input = h('input', { class: 'field', type: 'text', value, placeholder, 'aria-label': label, autocomplete: 'off', enterkeyhint: 'done' });
    let last = value;
    const commit = () => {
      const v = input.value.trim();
      if (v === last) return;
      last = v;
      onCommit(v);
    };
    input.addEventListener('change', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });
    return row(label, input, 'stack');
  }

  function rowReadout(label, getter) {
    const value = h('span', { class: 's-value' }, getter());
    readouts.push(() => setText(value, getter()));
    return row(label, value);
  }

  function rowNote(text) {
    return h('div', { class: 's-row note' }, h('span', { class: 's-note' }, text));
  }

  // ---------------------------------------------------------- helpers

  function get(path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), state.settings);
  }

  function set(path, value) {
    const keys = path.split('.');
    const patch = {};
    let cur = patch;
    keys.forEach((k, i) => {
      cur[k] = i === keys.length - 1 ? value : {};
      cur = cur[k];
    });
    patchSettings(patch).catch(() => toast('Could not save', 'bad'));
  }

  function timeZones() {
    let zones = [];
    try {
      zones = Intl.supportedValuesOf('timeZone');
    } catch {
      zones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
    }
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return [['', `Device (${device})`], ...zones.map((z) => [z, z.replace(/_/g, ' ')])];
  }

  return { open, close, isOpen: () => dialog.open };
}
