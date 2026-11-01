// A toast says what happened and goes away. It never asks for anything.

import { h } from './dom.js';

let host = null;

export function toast(text, kind = 'idle') {
  host ||= document.getElementById('toasts');
  const el = h('div', { class: 'toast', role: 'status' }, h('i', { class: `light ${kind}` }), h('span', {}, text));
  host.append(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, 3200);
}
