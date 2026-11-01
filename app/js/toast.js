// A toast says what happened and goes away. It never asks for anything.

import { h } from './dom.js';
import { glass, unglass } from './glass.js';

let host = null;

export function toast(text, kind = 'idle') {
  host ||= document.getElementById('toasts');
  const el = h('div', { class: 'toast', role: 'status' }, h('i', { class: `light ${kind}` }), h('span', {}, text));
  host.append(el);
  glass(el);
  const remove = () => {
    unglass(el);
    el.remove();
  };
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 600);
  }, 3200);
}
