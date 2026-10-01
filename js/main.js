// ============================================================
//  MAIN: canvas, loop, input, modals
// ============================================================
const Game = {
  k: 3,
  canvas: null,
  ctx: null,
  scene: null,
  modal: null,
  muted: false,
  shakeAmt: 0,
  time: 0,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    loadGame();
    Sound.setSfx(P.settings.sfx);
    Sound.setMusic(P.settings.music);
    this.muted = !!P.settings.muted;
    Sound.setMuted(this.muted);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    this.scene = new TitleScene();
    this.scene.enter && this.scene.enter();
    // warm up sprite caches so the first run doesn't hitch
    setTimeout(() => {
      for (const id of Object.keys(Art.PIG_STYLES)) for (let f = 0; f < Art.PIG_FRAMES; f++) Art.pig(id, f);
      Art.table();
    }, 50);
    let last = performance.now();
    const loop = (ts) => {
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
      last = ts;
      for (let i = 0; i < (this.speed || 1); i++) this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.addEventListener('beforeunload', () => saveGame());
    setInterval(() => { P.stats.playTime += 10; saveGame(); }, 10000);
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = window.innerWidth, ch = window.innerHeight;
    const scale = Math.min(cw / W, ch / H);
    const cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
    this.k = Math.max(1, Math.round(scale * dpr));
    this.canvas.width = W * this.k;
    this.canvas.height = H * this.k;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.ctx.imageSmoothingEnabled = false;
  },

  bindInput() {
    const c = this.canvas;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      Input.x = ((e.clientX - r.left) / r.width) * W;
      Input.y = ((e.clientY - r.top) / r.height) * H;
    };
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.init();
      Input.isTouch = e.pointerType === 'touch';
      pos(e);
      Input.down = true; Input.pressed = true;
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    c.addEventListener('pointermove', (e) => { pos(e); Input.moved = true; if (e.pointerType !== 'touch') Input.isTouch = false; });
    const up = (e) => { pos(e); if (Input.down) Input.released = true; Input.down = false; };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => { e.preventDefault(); Input.wheel += e.deltaY; }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      Sound.init();
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (!Input.keys[e.key]) Input.keysPressed[e.key] = true;
      Input.keys[e.key] = true;
      if (e.key === 'm' || e.key === 'M') this.toggleMute();
      if (e.key === 'f' || e.key === 'F') this.fullscreen();
    });
    window.addEventListener('keyup', (e) => { Input.keys[e.key] = false; });
    window.addEventListener('blur', () => {
      Input.down = false; Input.keys = {};
      if (this.scene instanceof RunScene && this.scene.state === 'play') this.scene.paused = true;
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  },

  frame(dt) {
    const ctx = this.ctx;
    this.time += dt;
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    UI.begin();
    if (!this.modal && !UI.fading()) this.scene.update(dt);
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 25);
    ctx.save();
    if (this.shakeAmt > 0 && P.settings.shake) ctx.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt);
    UI.enabled = !this.modal && !UI.fading();
    try { this.scene.draw(ctx, dt); } catch (e) { console.error(e); }
    ctx.restore();
    UI.enabled = !UI.fading();
    if (this.modal) this.drawModal(ctx, dt);
    UI.drawTooltip(ctx);
    UI.drawToasts(ctx, dt);
    UI.drawFade(ctx, dt);
    UI.end(dt);
    Input.endFrame();
  },

  goto(scene) {
    UI.transition(() => {
      this.scene = scene;
      scene.enter && scene.enter();
    });
  },
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); },
  toggleMute() {
    this.muted = !this.muted;
    P.settings.muted = this.muted;
    Sound.setMuted(this.muted);
    saveGame();
  },
  fullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } catch (e) { /* not supported */ }
  },
  confirm(text, yes) { this.modal = { type: 'confirm', text, yes, t: 0 }; Sound.play('card'); },
  openSettings() { this.modal = { type: 'settings', t: 0 }; Sound.play('card'); },

  drawModal(ctx, dt) {
    const m = this.modal;
    m.t += dt;
    ctx.fillStyle = `rgba(8,4,3,${Math.min(0.7, m.t * 3)})`;
    ctx.fillRect(0, 0, W, H);
    const k = Ease.outBack(Math.min(1, m.t / 0.25));
    if (m.type === 'confirm') {
      const w = 280, lines = Font.wrap(m.text, w - 24), h = lines.length * 11 + 64;
      const x = W / 2 - w / 2, y = H / 2 - h / 2 + (1 - k) * 30;
      UI.panel(ctx, x, y, w, h, { fill: '#231713', border: '#c8913a', glow: true });
      lines.forEach((l, i) => Font.draw(ctx, l, W / 2, y + 14 + i * 11, { align: 'center', color: '#f3e6cf' }));
      if (UI.button(ctx, 'm_no', x + 16, y + h - 34, 116, 22, 'Abbrechen', { style: 'dark', key: 'Escape' })) this.modal = null;
      else if (UI.button(ctx, 'm_yes', x + w - 132, y + h - 34, 116, 22, 'Ja', { style: 'red', key: 'Enter' })) { this.modal = null; m.yes(); }
      return;
    }
    if (m.type === 'settings') {
      const w = 260, h = 214;
      const x = W / 2 - w / 2, y = H / 2 - h / 2 + (1 - k) * 30;
      UI.panel(ctx, x, y, w, h, { fill: '#231713', border: '#c8913a', glow: true });
      Font.draw(ctx, 'EINSTELLUNGEN', W / 2, y + 10, { align: 'center', color: '#ffe0a0', scale: 2 });
      let yy = y + 40;
      const slider = (id, label, val, set) => {
        Font.draw(ctx, label, x + 16, yy, { color: '#c8b8a0' });
        const sx = x + 100, sw = 120;
        const r = UI.region(id, sx - 4, yy - 4, sw + 8, 16);
        if (r.held || (r.hover && Input.pressed)) { val = clamp((Input.x - sx) / sw, 0, 1); set(val); }
        ctx.fillStyle = '#120a08'; ctx.fillRect(sx, yy + 3, sw, 4);
        ctx.fillStyle = '#e0a84a'; ctx.fillRect(sx, yy + 3, Math.round(sw * val), 4);
        UI.panel(ctx, sx + sw * val - 4, yy, 8, 10, { fill: '#ffd88a', border: '#8a5a24', shadow: false });
        Font.draw(ctx, Math.round(val * 100) + '%', x + w - 12, yy, { align: 'right', color: '#8a7a6a' });
        yy += 22;
      };
      slider('s_sfx', 'Effekte', P.settings.sfx, (v) => { P.settings.sfx = v; Sound.setSfx(v); if (Math.random() < 0.2) Sound.play('coin', 4); });
      slider('s_mus', 'Musik', P.settings.music, (v) => { P.settings.music = v; Sound.setMusic(v); });
      const toggle = (id, label, val, set) => {
        if (UI.button(ctx, id, x + 16, yy, w - 32, 18, label + ': ' + (val ? 'AN' : 'AUS'), { style: val ? 'dark' : 'ghost' })) set(!val);
        yy += 24;
      };
      toggle('s_mute', 'Ton', !this.muted, () => this.toggleMute());
      toggle('s_shake', 'Bildschirmwackeln', P.settings.shake, (v) => (P.settings.shake = v));
      toggle('s_num', 'Schadenszahlen', P.settings.numbers, (v) => (P.settings.numbers = v));
      if (UI.button(ctx, 's_close', W / 2 - 60, y + h - 30, 120, 22, 'Schließen', { style: 'gold', key: 'Escape' })) { this.modal = null; saveGame(); }
      Font.draw(ctx, 'M = Ton · F = Vollbild', W / 2, y + h - 44, { align: 'center', color: '#6a5a4e' });
    }
  },
};

window.addEventListener('load', () => Game.init());
