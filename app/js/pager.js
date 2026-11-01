// The row of full-screen pages. A finger swipes it with native scroll-snap;
// the program moves it with a tween that reads its duration and curve from the
// motion tokens, so a tap on a widget and a swipe feel like the same thing.

import { cssMs, cssEase } from './dom.js';

export function createPager(el, { onProgress, onSettle } = {}) {
  let tween = null;
  let settleTimer = 0;
  let lastIndex = -1;

  const width = () => el.clientWidth || 1;
  const progress = () => el.scrollLeft / width();
  const index = () => Math.round(progress());
  const count = () => el.children.length;

  function report() {
    onProgress?.(progress());
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const i = index();
      if (i !== lastIndex) {
        lastIndex = i;
        el.children[i]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        onSettle?.(i);
      }
    }, 80);
  }

  el.addEventListener('scroll', report, { passive: true });
  // A finger takes over from any program-driven move.
  el.addEventListener('pointerdown', cancel, { passive: true });
  el.addEventListener('touchstart', cancel, { passive: true });

  // Keep the current page under the finger when the screen size changes.
  let resizing = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizing);
    resizing = requestAnimationFrame(() => {
      const i = lastIndex < 0 ? index() : lastIndex;
      el.scrollLeft = i * width();
    });
  }).observe(el);

  function cancel() {
    if (tween) cancelAnimationFrame(tween);
    tween = null;
    el.style.scrollSnapType = '';
  }

  // Move to page i with the given tokens (defaults: carousel/retarget motion).
  function goTo(i, { dur = '--dur-slower', ease = '--ease-in-out' } = {}) {
    const target = Math.max(0, Math.min(count() - 1, i)) * width();
    cancel();
    const from = el.scrollLeft;
    const distance = target - from;
    if (Math.abs(distance) < 1) return;
    const ms = cssMs(dur);
    if (ms < 20) {
      el.scrollLeft = target;
      return;
    }
    const curve = cssEase(ease);
    const start = performance.now();
    el.style.scrollSnapType = 'none';
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      el.scrollLeft = from + distance * curve(t);
      if (t < 1) tween = requestAnimationFrame(step);
      else {
        tween = null;
        el.style.scrollSnapType = '';
      }
    };
    tween = requestAnimationFrame(step);
  }

  function jump(i) {
    cancel();
    el.scrollLeft = Math.max(0, Math.min(count() - 1, i)) * width();
    lastIndex = i;
    onProgress?.(progress());
    onSettle?.(i);
  }

  return { goTo, jump, index, progress, count, el };
}
