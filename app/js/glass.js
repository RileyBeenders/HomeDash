// Liquid glass: the rim of every box bends what is behind it. Decoration only,
// and only where the browser can do it (Chromium); elsewhere the frosted glass
// in the tokens is the design. A box is refracted only while it is on or next
// to the screen, and low quality destroys every instance so the solid fallback
// applies.

const PRESETS = {
  // Cards, toasts, sheets: the module's own tuning, a little more blur behind.
  card: { scale: -140, chroma: 8, border: 0.1, mapBlur: 10, blur: 6, saturate: 1.5 },
  // Small pills: a thick rim band and a strong bulge, or the bend is lost in a
  // 46px bar.
  pill: { scale: -150, chroma: 8, border: 0.22, mapBlur: 6, blur: 1, saturate: 1.3 },
};

const layers = new Map(); // element -> { preset, handle, near }
let low = false;
let supported = true;

// "Near" is on screen or a page away, so a swipe never meets a bare card.
const watcher = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const layer = layers.get(e.target);
    if (layer) layer.near = e.isIntersecting;
  }
  settle();
}, { rootMargin: '0px 100% 0px 100%' });

function wants(el, layer) {
  return !low && supported && layer.near && el.isConnected && el.offsetWidth > 0;
}

function settle() {
  for (const [el, layer] of layers) {
    const on = wants(el, layer);
    if (on && !layer.handle) {
      const handle = window.liquidGlass?.(el, PRESETS[layer.preset]);
      if (handle && !handle.supported) {
        handle.destroy();
        supported = false;
      } else layer.handle = handle || null;
    } else if (!on && layer.handle) {
      layer.handle.destroy();
      layer.handle = null;
    }
  }
}

// Put an element on the refracting glass. Call settleGlass() after showing or
// hiding it.
export function glass(el, preset = 'card') {
  if (layers.has(el)) return;
  layers.set(el, { preset, handle: null, near: false });
  watcher.observe(el);
}

export function unglass(el) {
  layers.get(el)?.handle?.destroy();
  layers.delete(el);
  watcher.unobserve(el);
}

export const settleGlass = settle;

export function setGlassQuality(tier) {
  low = tier === 'low';
  settle();
}
