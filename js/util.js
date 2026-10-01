// ============================================================
//  Utilities: math, random, easing, colors, number formatting
// ============================================================
const TAU = Math.PI * 2;
const W = 640, H = 360; // internal pixel resolution
// the wooden box in the middle of the desk where the piggies live
const ARENA = { x0: 106, y0: 40, x1: 534, y1: 352, rim: 7, front: 9 };
const FLOOR = { x0: ARENA.x0 + ARENA.rim, y0: ARENA.y0 + ARENA.rim, x1: ARENA.x1 - ARENA.rim, y1: ARENA.y1 - ARENA.front - ARENA.rim };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const sign = (v) => (v < 0 ? -1 : 1);
// frame-rate independent smoothing
const damp = (cur, target, rate, dt) => lerp(cur, target, 1 - Math.exp(-rate * dt));

function weightedPick(items, wfn) {
  let total = 0;
  for (const it of items) total += Math.max(0, wfn(it));
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, wfn(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

// smooth value noise
function vnoise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(yf));
}

const Ease = {
  linear: (t) => t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inQuad: (t) => t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// ---------- colors ----------
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function shade(hex, f) {
  // f < 1 darker, f > 1 lighter (towards white)
  const [r, g, b] = hexToRgb(hex);
  if (f <= 1) return rgbToHex(r * f, g * f, b * f);
  const t = f - 1;
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
// hue shift helper: darker shades shift towards purple, lighter towards yellow (pixel-art style ramps)
function ramp(hex, f) {
  const base = shade(hex, f);
  if (f < 1) return mix(base, '#2a1640', (1 - f) * 0.35);
  return mix(base, '#fff2b0', (f - 1) * 0.3);
}

// ---------- numbers ----------
const SUFFIX = ['', 'K', 'M', 'Mrd', 'Bio', 'Brd', 'Trio', 'Trd', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  const neg = n < 0;
  n = Math.abs(n);
  let out;
  if (n < 100000) out = String(Math.floor(n));
  else {
    let i = 0;
    let v = n;
    while (v >= 1000 && i < SUFFIX.length - 1) {
      v /= 1000;
      i++;
    }
    out = (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUFFIX[i];
  }
  return (neg ? '-' : '') + out;
}
const money = (n) => '$' + fmt(n);
function fmtPct(v, digits = 0) {
  return (v * 100).toFixed(digits) + '%';
}
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm ' + String(s).padStart(2, '0') + 's';
}

// ---------- canvas helpers ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

// Pixel-perfect primitives on a context (integers only)
function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pxLine(ctx, x0, y0, x1, y1, color, thick = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = color;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const o = Math.floor(thick / 2);
  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(x0 - o, y0 - o, thick, thick);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// dashed line, phase lets it animate ("marching ants")
function pxDashLine(ctx, x0, y0, x1, y1, color, dash = 2, gap = 2, phase = 0) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = color;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, i = Math.floor(phase);
  for (let k = 0; k < 4000; k++) {
    if (((i % (dash + gap)) + (dash + gap)) % (dash + gap) < dash) ctx.fillRect(x0, y0, 1, 1);
    i++;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// ellipse outline using midpoint-like sampling
function pxEllipse(ctx, cx, cy, rx, ry, color, fill = false) {
  ctx.fillStyle = color;
  cx = Math.round(cx); cy = Math.round(cy);
  rx = Math.max(0, Math.round(rx)); ry = Math.max(0, Math.round(ry));
  if (rx === 0 || ry === 0) { ctx.fillRect(cx - rx, cy - ry, rx * 2 + 1, ry * 2 + 1); return; }
  if (fill) {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
    return;
  }
  let prevW = null;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    const nextY = y + 1 <= ry ? Math.round(rx * Math.sqrt(Math.max(0, 1 - ((y + 1) * (y + 1)) / (ry * ry)))) : 0;
    const span = Math.max(1, Math.abs(w - (y < 0 ? nextY : prevW ?? w)));
    if (y < 0) {
      ctx.fillRect(cx - w, cy + y, Math.max(1, Math.min(span, w + 1)), 1);
      ctx.fillRect(cx + w - Math.max(1, Math.min(span, w + 1)) + 1, cy + y, Math.max(1, Math.min(span, w + 1)), 1);
    } else {
      ctx.fillRect(cx - w, cy + y, Math.max(1, Math.min(span, w + 1)), 1);
      ctx.fillRect(cx + w - Math.max(1, Math.min(span, w + 1)) + 1, cy + y, Math.max(1, Math.min(span, w + 1)), 1);
    }
    prevW = w;
  }
}

// 4x4 Bayer matrix for dithering
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));
