// ============================================================
//  Input + immediate-mode pixel UI
// ============================================================
const T = {
  bg: '#140c09', panel: '#231713', panel2: '#33231b', panel3: '#47302a', edge: '#0a0504',
  gold: '#e0a84a', goldL: '#ffd88a', goldD: '#8a5a24', text: '#f3e6cf', dim: '#a8927a', dark: '#5a4a3e',
  red: '#e8503e', redD: '#8a2420', green: '#6fd65a', greenD: '#2a7a30', blue: '#5aa0f0', purple: '#c07af0', cyan: '#5ae0f0',
};

const Input = {
  x: W / 2, y: H / 2, down: false, pressed: false, released: false, wheel: 0,
  keys: {}, keysPressed: {}, isTouch: false, moved: false, lastMove: 0,
  endFrame() { this.pressed = false; this.released = false; this.wheel = 0; this.keysPressed = {}; },
  key(k) { return !!this.keysPressed[k]; },
};

const UI = (() => {
  const anim = {};
  let active = null; // id pressed on
  let hoverId = null, lastHover = null;
  let enabled = true;
  const toasts = [];
  let tip = null;
  let fade = null;

  const A = (id) => anim[id] || (anim[id] = { h: 0, p: 0, t: 0 });
  const inside = (x, y, w, h) => Input.x >= x && Input.y >= y && Input.x < x + w && Input.y < y + h;

  function begin() {
    hoverId = null;
    tip = null;
  }
  function end(dt) {
    if (hoverId && hoverId !== lastHover) Sound.play('hover', null, 0.05);
    lastHover = hoverId;
    if (Input.released) active = null;
    for (const k in anim) {
      const a = anim[k];
      a.h = damp(a.h, a._hov ? 1 : 0, 18, dt);
      a.p = damp(a.p, a._prs ? 1 : 0, 30, dt);
      a._hov = false; a._prs = false;
    }
  }

  // generic interactive region; returns {hover, click, held}
  function region(id, x, y, w, h) {
    const a = A(id);
    const hov = enabled && inside(x, y, w, h);
    if (hov) { hoverId = id; a._hov = true; }
    if (hov && Input.pressed) active = id;
    const held = active === id && Input.down && hov;
    if (held) a._prs = true;
    const click = enabled && hov && Input.released && active === id;
    return { hover: hov, click, held, a };
  }

  // ---------- drawing primitives ----------
  function panel(ctx, x, y, w, h, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const fill = o.fill || T.panel, border = o.border || T.goldD, edge = o.edge || T.edge;
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y + 3, w, h); }
    ctx.fillStyle = edge;
    ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    ctx.fillStyle = border;
    ctx.fillRect(x + 2, y + 1, w - 4, h - 2); ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = shade(fill, 1.12);
    ctx.fillRect(x + 3, y + 2, w - 6, 1);
    ctx.fillStyle = shade(fill, 0.75);
    ctx.fillRect(x + 3, y + h - 3, w - 6, 1);
    if (o.glow) {
      ctx.fillStyle = border;
      ctx.fillRect(x + 3, y + 3, 1, 1); ctx.fillRect(x + w - 4, y + 3, 1, 1);
      ctx.fillRect(x + 3, y + h - 4, 1, 1); ctx.fillRect(x + w - 4, y + h - 4, 1, 1);
    }
  }

  const STYLES = {
    dark: { fill: '#2a1d17', border: '#a87a3a', text: '#f2c66d', hfill: '#3a2a20' },
    gold: { fill: '#d0902e', border: '#ffd88a', text: '#2a1408', hfill: '#e8a83e', tshadow: null },
    red: { fill: '#a02c24', border: '#ff7a5a', text: '#fff0e0', hfill: '#c03a2e' },
    green: { fill: '#2e8a34', border: '#9af08a', text: '#f0fff0', hfill: '#3aa040' },
    blue: { fill: '#2a4a8a', border: '#8ac0ff', text: '#f0f8ff', hfill: '#3a5ea8' },
    ghost: { fill: '#1a120e', border: '#5a4a3e', text: '#a8927a', hfill: '#241a14' },
  };

  function button(ctx, id, x, y, w, h, label, o = {}) {
    const st = STYLES[o.style || 'dark'];
    const dis = !!o.disabled;
    const r = region(id, x, y, w, h);
    const keyHit = o.key && enabled && Input.key(o.key);
    const hv = r.a.h, pr = r.a.p;
    const lift = dis ? 0 : Math.round(hv * 1 - pr * 2);
    const by = Math.round(y - lift);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + 1, y + 3, w, h);
    const fill = dis ? '#2a2420' : hv > 0.5 ? st.hfill : st.fill;
    panel(ctx, x, by, w, h, { fill, border: dis ? '#4a3e36' : hv > 0.5 ? shade(st.border, 1.15) : st.border, shadow: false });
    if (hv > 0.05 && !dis) {
      ctx.fillStyle = `rgba(255,240,200,${0.08 * hv})`;
      ctx.fillRect(x + 2, by + 2, w - 4, Math.floor(h / 2) - 2);
    }
    const sc = o.scale || 1;
    let tx = x + w / 2;
    const ty = by + Math.round(h / 2 - (o.sub ? 9 : 4) * sc) + (o.sub ? 0 : 0);
    if (o.icon) {
      const ic = o.icon;
      const tw = Font.measure(label, sc) + ic.width + 4;
      ctx.drawImage(ic, Math.round(x + w / 2 - tw / 2), Math.round(by + h / 2 - ic.height / 2));
      tx = x + w / 2 + (ic.width + 4) / 2;
    }
    Font.draw(ctx, label, tx, ty, { align: 'center', color: dis ? '#6a5a4e' : st.text, scale: sc, shadow: st.tshadow === null ? null : 'drop' });
    if (o.sub) Font.draw(ctx, o.sub, x + w / 2, ty + 11 * sc, { align: 'center', color: dis ? '#5a4a3e' : o.subColor || shade(st.text, 0.8), shadow: st.tshadow === null ? null : 'drop' });
    if (o.key && o.keyLabel && !Input.isTouch) {
      const kw = Font.measure(o.keyLabel) + 6;
      panel(ctx, x + w - kw - 4, by - 6, kw, 11, { fill: '#120a08', border: '#6a5a4e', shadow: false });
      Font.draw(ctx, o.keyLabel, x + w - kw / 2 - 4, by - 4, { align: 'center', color: T.dim, shadow: null });
    }
    if (o.tip && r.hover) tooltip(o.tip);
    if ((r.click || keyHit) && !dis) { Sound.play(o.sound || 'click'); return true; }
    if ((r.click || keyHit) && dis) { if (o.errSound !== false) Sound.play('error'); if (o.onDisabled) o.onDisabled(); }
    return false;
  }

  // small square icon button
  function iconButton(ctx, id, x, y, size, icon, o = {}) {
    const r = region(id, x, y, size, size);
    const hv = r.a.h;
    panel(ctx, x, y - Math.round(hv), size, size, { fill: o.active ? '#4a3420' : hv > 0.5 ? '#3a2a20' : '#241813', border: o.active ? T.goldL : T.goldD, shadow: true });
    ctx.drawImage(icon, Math.round(x + size / 2 - icon.width / 2), Math.round(y - Math.round(hv) + size / 2 - icon.height / 2));
    if (o.tip && r.hover) tooltip(o.tip);
    if (r.click || (o.key && Input.key(o.key))) { Sound.play('click'); return true; }
    return false;
  }

  function bar(ctx, x, y, w, h, frac, col, o = {}) {
    frac = clamp(frac, 0, 1);
    ctx.fillStyle = T.edge; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = o.bg || '#2a1a14'; ctx.fillRect(x, y, w, h);
    const fw = Math.round(w * frac);
    ctx.fillStyle = col; ctx.fillRect(x, y, fw, h);
    ctx.fillStyle = shade(col, 1.3); ctx.fillRect(x, y, fw, 1);
    ctx.fillStyle = shade(col, 0.7); ctx.fillRect(x, y + h - 1, fw, 1);
    if (o.segments) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 1; i < o.segments; i++) ctx.fillRect(x + Math.round((w * i) / o.segments), y, 1, h); }
  }

  // tooltip: array of strings or {t, c}
  function tooltip(lines, x, y) { tip = { lines: Array.isArray(lines) ? lines : [lines], x, y }; }
  function drawTooltip(ctx) {
    if (!tip) return;
    const lines = tip.lines.map((l) => (typeof l === 'string' ? { t: l } : l));
    const maxW = 200;
    const wrapped = [];
    for (const l of lines) for (const wl of Font.wrap(l.t, maxW, l.s || 1)) wrapped.push({ t: wl, c: l.c, s: l.s || 1 });
    let w = 0;
    for (const l of wrapped) w = Math.max(w, Font.measure(l.t, l.s));
    w += 12;
    const h = wrapped.reduce((a, l) => a + 11 * l.s, 0) + 8;
    let x = tip.x !== undefined ? tip.x : Input.x + 12, y = tip.y !== undefined ? tip.y : Input.y + 12;
    if (x + w > W - 4) x = (tip.x !== undefined ? tip.x : Input.x) - w - 8;
    if (y + h > H - 4) y = H - h - 4;
    x = Math.max(4, x); y = Math.max(4, y);
    panel(ctx, x, y, w, h, { fill: '#160e0b', border: '#c8913a' });
    let yy = y + 5;
    for (const l of wrapped) { Font.draw(ctx, l.t, x + 6, yy, { color: l.c || T.text, scale: l.s }); yy += 11 * l.s; }
  }

  // ---------- toasts ----------
  function toast(o) { toasts.push(Object.assign({ t: 0, life: 3.2 }, o)); }
  let toastMode = 'center';
  function setToastMode(m) { toastMode = m; }
  function drawToasts(ctx, dt) {
    const left = toastMode === 'left';
    let y = left ? 40 : H - 70;
    const maxN = left ? 4 : 4;
    while (toasts.length > maxN) toasts.shift();
    for (let i = 0; i < toasts.length; i++) {
      const t = toasts[i];
      t.t += dt;
      const k = t.t < 0.25 ? Ease.outBack(t.t / 0.25) : t.t > t.life - 0.3 ? 1 - Ease.inQuad((t.t - (t.life - 0.3)) / 0.3) : 1;
      if (left) {
        // compact card in the left column next to the box
        const w = ARENA.x0 - 12;
        const lines = Font.wrap(t.text || '', w - 8);
        const h = 24 + lines.length * 10;
        const x = Math.round(6 - (1 - clamp(k, 0, 1)) * (w + 10));
        ctx.save();
        ctx.globalAlpha = clamp(k, 0, 1);
        panel(ctx, x, y, w, h, { fill: '#1a110d', border: t.color || T.gold, shadow: false });
        if (t.icon) {
          const ic = t.icon, sc = Math.min(1, 14 / ic.width, 14 / ic.height);
          ctx.drawImage(ic, Math.round(x + 5), Math.round(y + 4), ic.width * sc, ic.height * sc);
        }
        const tt = Font.wrap(t.title, w - 26)[0];
        Font.draw(ctx, tt, x + (t.icon ? 22 : 6), y + 6, { color: t.color || T.goldL, shadow: null });
        lines.forEach((l, j) => Font.draw(ctx, l, x + 5, y + 18 + j * 10, { color: T.text, shadow: null }));
        ctx.restore();
        y += (h + 4) * clamp(k, 0, 1);
      } else {
        const w = Math.max(150, Math.max(Font.measure(t.title), Font.measure(t.text || '')) + (t.icon ? 32 : 14));
        const x = Math.round(W / 2 - w / 2);
        const yy = Math.round(y + (1 - k) * 40);
        ctx.save();
        ctx.globalAlpha = clamp(k, 0, 1);
        panel(ctx, x, yy, w, 32, { fill: '#1a110d', border: t.color || T.gold, glow: true });
        if (t.icon) {
          const ic = t.icon;
          const sc = Math.min(1, 20 / ic.width, 22 / ic.height);
          ctx.drawImage(ic, Math.round(x + 15 - (ic.width * sc) / 2), Math.round(yy + 16 - (ic.height * sc) / 2), ic.width * sc, ic.height * sc);
        }
        const tx = x + (t.icon ? 28 : 8);
        Font.draw(ctx, t.title, tx, yy + 6, { color: t.color || T.goldL });
        if (t.text) Font.draw(ctx, t.text, tx, yy + 18, { color: T.text });
        ctx.restore();
        y -= 36 * clamp(k, 0, 1);
      }
      if (t.t > t.life) { toasts.splice(i, 1); i--; }
    }
  }

  // ---------- screen transition (pixel diamond wipe) ----------
  function transition(cb, color = '#0a0504') { if (fade) return; fade = { t: 0, phase: 'out', cb, color }; }
  function drawFade(ctx, dt) {
    if (!fade) return;
    fade.t += dt / 0.32;
    let p;
    if (fade.phase === 'out') {
      p = Math.min(1, fade.t);
      if (fade.t >= 1) { fade.phase = 'in'; fade.t = 0; try { fade.cb && fade.cb(); } catch (e) { console.error(e); } p = 1; }
    } else {
      p = 1 - Math.min(1, fade.t);
      if (fade.t >= 1) { fade = null; return; }
    }
    ctx.fillStyle = fade.color;
    const S = 20;
    for (let y = 0; y < H + S; y += S)
      for (let x = 0; x < W + S; x += S) {
        const d = (x / W) * 0.5 + (y / H) * 0.5;
        const k = clamp(p * 2 - d, 0, 1);
        const r = Math.ceil(k * S * 0.75);
        if (r <= 0) continue;
        // diamond
        for (let j = -r; j <= r; j++) {
          const ww = r - Math.abs(j);
          ctx.fillRect(x - ww, y + j, ww * 2 + 1, 1);
        }
      }
  }
  const fading = () => !!fade;

  return {
    begin, end, region, panel, button, iconButton, bar, tooltip, drawTooltip, toast, drawToasts, setToastMode, transition, drawFade, fading, inside,
    get enabled() { return enabled; }, set enabled(v) { enabled = v; },
    get hoverId() { return hoverId; },
  };
})();
