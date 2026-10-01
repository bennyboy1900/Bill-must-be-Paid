// ============================================================
//  Sound: all effects + music are synthesized with WebAudio
// ============================================================
const Sound = (() => {
  let ctx = null, master, sfxBus, musicBus, comp, noiseBuf;
  let sfxVol = 0.7, musicVol = 0.45, muted = false;
  const lastPlay = {};
  let voices = 0;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.15;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol;
    musicBus = ctx.createGain(); musicBus.gain.value = musicVol * 0.5;
    sfxBus.connect(comp); musicBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Music._start();
  }

  const now = () => (ctx ? ctx.currentTime : 0);

  function env(g, t, a, peak, dec, sustain = 0) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t + a + dec);
  }

  function tone(o) {
    if (!ctx) return;
    const t = now() + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.slide || o.dur));
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.vibAmt || 8;
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + o.dur + 0.05);
    }
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    env(g, t, o.a || 0.004, o.v || 0.2, o.dur);
    osc.start(t);
    osc.stop(t + o.dur + 0.1);
    voices++;
    osc.onended = () => voices--;
  }

  function noise(o) {
    if (!ctx) return;
    const t = now() + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter();
    f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    env(g, t, o.a || 0.002, o.v || 0.3, o.dur);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.dur + 0.1);
  }

  const R = (a, b) => a + Math.random() * (b - a);

  const SFX = {
    click() { tone({ f: 880, f2: 1320, dur: 0.05, type: 'square', v: 0.08 }); },
    hover() { tone({ f: 1500, dur: 0.025, type: 'square', v: 0.025 }); },
    back() { tone({ f: 660, f2: 440, dur: 0.07, type: 'square', v: 0.07 }); },
    tab() { tone({ f: 520, f2: 780, dur: 0.06, type: 'triangle', v: 0.12 }); noise({ f: 4000, dur: 0.04, v: 0.05 }); },
    error() { tone({ f: 140, dur: 0.12, type: 'square', v: 0.1, lp: 900 }); tone({ f: 110, dur: 0.14, type: 'square', v: 0.1, lp: 900, delay: 0.09 }); },
    swing() { noise({ f: 900, f2: 2600, dur: 0.09, v: 0.06, q: 2 }); },
    thud() {
      tone({ f: 150, f2: 45, dur: 0.14, type: 'sine', v: 0.45 });
      noise({ ft: 'lowpass', f: 700, dur: 0.07, v: 0.25 });
    },
    hit(p = 1) {
      tone({ f: 170 * p, f2: 60, dur: 0.1, type: 'sine', v: 0.4 });
      noise({ f: R(2500, 3500) * p, dur: 0.05, v: 0.22, q: 3 });
      tone({ f: R(1700, 2100) * p, dur: 0.05, type: 'triangle', v: 0.07 });
    },
    woodhit() { tone({ f: R(300, 340), f2: 180, dur: 0.08, type: 'triangle', v: 0.3 }); noise({ f: 900, dur: 0.06, v: 0.2, q: 4 }); },
    metalhit() {
      tone({ f: R(780, 840), dur: 0.35, type: 'square', v: 0.07, lp: 3000 });
      tone({ f: R(1230, 1300), dur: 0.3, type: 'sine', v: 0.08 });
      noise({ f: 5000, dur: 0.05, v: 0.15, q: 2 });
    },
    smash(big = 1) {
      tone({ f: 120, f2: 40, dur: 0.22, type: 'sine', v: 0.5 });
      noise({ f: 3000, f2: 1200, dur: 0.28 * big, v: 0.35, q: 0.8 });
      for (let i = 0; i < 5; i++) tone({ f: R(2200, 4200), dur: 0.05, type: 'triangle', v: 0.06, delay: 0.03 + i * R(0.02, 0.05) });
    },
    crit() {
      tone({ f: 90, f2: 35, dur: 0.3, type: 'sine', v: 0.6 });
      tone({ f: 440, f2: 880, dur: 0.12, type: 'sawtooth', v: 0.1, lp: 3000 });
      noise({ ft: 'lowpass', f: 1500, dur: 0.18, v: 0.35 });
      tone({ f: 1760, dur: 0.18, type: 'square', v: 0.05, delay: 0.04 });
    },
    coin(i = 0) {
      const k = Math.pow(1.0595, Math.min(i, 24));
      tone({ f: 1318 * k, dur: 0.05, type: 'square', v: 0.05 });
      tone({ f: 1975 * k, dur: 0.12, type: 'square', v: 0.045, delay: 0.045 });
    },
    cash() { tone({ f: 980, dur: 0.06, type: 'triangle', v: 0.1 }); tone({ f: 1470, dur: 0.1, type: 'triangle', v: 0.08, delay: 0.05 }); },
    gem() {
      tone({ f: 2093, dur: 0.25, type: 'sine', v: 0.12 });
      tone({ f: 3136, dur: 0.3, type: 'sine', v: 0.08, delay: 0.06 });
      tone({ f: 4186, dur: 0.35, type: 'sine', v: 0.05, delay: 0.12 });
    },
    rare() {
      [1046, 1318, 1568, 2093, 2637].forEach((f, i) => tone({ f, dur: 0.18, type: 'square', v: 0.06, delay: i * 0.06 }));
      tone({ f: 4186, dur: 0.6, type: 'sine', v: 0.07, delay: 0.3, vib: 7, vibAmt: 30 });
    },
    jackpot() {
      const seq = [523, 659, 784, 1046, 784, 1046, 1318, 1568];
      seq.forEach((f, i) => tone({ f, dur: 0.12, type: 'square', v: 0.09, delay: i * 0.07 }));
      tone({ f: 2093, dur: 0.6, type: 'triangle', v: 0.12, delay: 0.56, vib: 6, vibAmt: 20 });
      for (let i = 0; i < 12; i++) tone({ f: 1318 * Math.pow(1.0595, i), dur: 0.06, type: 'square', v: 0.035, delay: 0.3 + i * 0.05 });
    },
    zap() {
      tone({ f: R(80, 120), dur: 0.2, type: 'sawtooth', v: 0.12, vib: 60, vibAmt: 300, lp: 4000 });
      noise({ f: 6000, f2: 2000, dur: 0.18, v: 0.18, q: 1 });
    },
    freeze() {
      for (let i = 0; i < 6; i++) tone({ f: 2400 + i * 300, dur: 0.2, type: 'sine', v: 0.05, delay: i * 0.04 });
      noise({ ft: 'highpass', f: 5000, dur: 0.5, v: 0.12 });
    },
    shatterIce() { for (let i = 0; i < 6; i++) tone({ f: R(3000, 6000), dur: 0.06, type: 'triangle', v: 0.05, delay: i * 0.025 }); },
    stone() { tone({ f: 90, f2: 30, dur: 0.25, type: 'sine', v: 0.5 }); noise({ ft: 'lowpass', f: 900, dur: 0.2, v: 0.35 }); },
    whistle() { tone({ f: 2200, f2: 700, dur: 0.45, type: 'sine', v: 0.04 }); },
    explode() {
      tone({ f: 70, f2: 25, dur: 0.6, type: 'sine', v: 0.7 });
      noise({ ft: 'lowpass', f: 2500, f2: 200, dur: 0.7, v: 0.6 });
    },
    quake() { tone({ f: 50, f2: 30, dur: 0.6, type: 'sine', v: 0.6 }); noise({ ft: 'lowpass', f: 400, dur: 0.6, v: 0.5 }); },
    buy() {
      tone({ f: 523, dur: 0.06, type: 'square', v: 0.08 });
      tone({ f: 784, dur: 0.06, type: 'square', v: 0.08, delay: 0.05 });
      tone({ f: 1046, dur: 0.12, type: 'square', v: 0.08, delay: 0.1 });
    },
    unlock() {
      [392, 523, 659, 784, 1046].forEach((f, i) => tone({ f, dur: 0.14, type: 'square', v: 0.07, delay: i * 0.055 }));
    },
    pay() {
      noise({ f: 3000, dur: 0.04, v: 0.2, q: 2 });
      tone({ f: 2637, dur: 0.5, type: 'triangle', v: 0.14, delay: 0.06 });
      tone({ f: 3520, dur: 0.6, type: 'triangle', v: 0.1, delay: 0.12 });
      tone({ f: 200, f2: 120, dur: 0.1, type: 'square', v: 0.1, lp: 1200 });
    },
    stamp() { tone({ f: 110, f2: 50, dur: 0.18, type: 'sine', v: 0.6 }); noise({ ft: 'lowpass', f: 1200, dur: 0.12, v: 0.4 }); },
    card() { noise({ f: 1500, f2: 4000, dur: 0.12, v: 0.12, q: 1.5 }); },
    paper() { noise({ f: 2500, f2: 1200, dur: 0.18, v: 0.1, q: 0.7 }); },
    bankrupt() {
      [392, 370, 349, 330].forEach((f, i) =>
        tone({ f, dur: i === 3 ? 1.1 : 0.32, type: 'sawtooth', v: 0.12, lp: 1400, delay: i * 0.36, vib: i === 3 ? 5 : 0, vibAmt: 9 }));
    },
    record() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f, dur: 0.16, type: 'square', v: 0.07, delay: i * 0.08 }));
      tone({ f: 1568, dur: 0.5, type: 'triangle', v: 0.1, delay: 0.42 });
    },
    tired() {
      noise({ ft: 'lowpass', f: 1200, f2: 300, dur: 0.6, v: 0.25 });
      tone({ f: 220, f2: 130, dur: 0.5, type: 'triangle', v: 0.08 });
    },
    plop() { tone({ f: 280, f2: 620, dur: 0.07, type: 'sine', v: 0.15 }); },
    land() { tone({ f: 140, f2: 70, dur: 0.07, type: 'sine', v: 0.18 }); },
    oink() {
      const p = R(0.85, 1.25);
      tone({ f: 330 * p, f2: 230 * p, dur: 0.16, type: 'sawtooth', v: 0.08, lp: 1100, q: 5, vib: 30, vibAmt: 25 });
      tone({ f: 300 * p, f2: 200 * p, dur: 0.12, type: 'sawtooth', v: 0.06, lp: 900, q: 5, delay: 0.17 });
    },
    squeak() { tone({ f: R(1400, 1800), f2: R(2200, 2800), dur: 0.08, type: 'square', v: 0.06, lp: 3500 }); },
    pan() { tone({ f: 520, dur: 0.5, type: 'triangle', v: 0.15, vib: 9, vibAmt: 6 }); tone({ f: 1312, dur: 0.4, type: 'sine', v: 0.06 }); },
    drink() { for (let i = 0; i < 4; i++) tone({ f: R(300, 500), f2: R(600, 900), dur: 0.05, type: 'sine', v: 0.12, delay: i * 0.08 }); },
    combo(n) { tone({ f: 600 + n * 4, f2: 1200 + n * 6, dur: 0.12, type: 'square', v: 0.06 }); },
    frenzy() { [659, 784, 988, 1318].forEach((f, i) => tone({ f, dur: 0.1, type: 'sawtooth', v: 0.07, lp: 4000, delay: i * 0.05 })); },
    escape() { tone({ f: 900, f2: 300, dur: 0.3, type: 'square', v: 0.05, lp: 2000 }); },
    confetti() { for (let i = 0; i < 8; i++) tone({ f: R(1200, 2600), dur: 0.05, type: 'square', v: 0.03, delay: i * 0.03 }); noise({ f: 4000, dur: 0.15, v: 0.15 }); },
    tick() { tone({ f: 2000, dur: 0.015, type: 'square', v: 0.03 }); },
    countUp() { tone({ f: R(1400, 1600), dur: 0.02, type: 'square', v: 0.025 }); },
    type() { tone({ f: R(500, 640), dur: 0.02, type: 'square', v: 0.025, lp: 2000 }); },
    achievement() {
      [784, 988, 1175, 1568].forEach((f, i) => tone({ f, dur: 0.14, type: 'triangle', v: 0.12, delay: i * 0.07 }));
    },
  };

  function play(name, arg, throttle = 0.02) {
    if (!ctx || muted || !SFX[name]) return;
    const t = performance.now() / 1000;
    if (lastPlay[name] && t - lastPlay[name] < throttle) return;
    if (voices > 90) return;
    lastPlay[name] = t;
    try { SFX[name](arg); } catch (e) { /* ignore */ }
  }

  // ---------------- MUSIC ----------------
  const Music = (() => {
    let track = null, step = 0, nextT = 0, timer = null, wanted = null;
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // chords as midi roots + intervals; 16 steps per bar
    const TRACKS = {
      menu: {
        bpm: 84,
        chords: [[57, [0, 3, 7, 10]], [62, [0, 4, 7, 10]], [55, [0, 4, 7, 11]], [60, [0, 4, 7, 11]], [53, [0, 4, 7, 11]], [59, [0, 3, 6, 10]], [52, [0, 4, 7, 10]], [57, [0, 3, 7, 10]]],
        lead: [
          [76, -1, -1, 74, -1, 72, -1, -1, 69, -1, -1, -1, 72, -1, 74, -1],
          [74, -1, -1, 72, -1, 69, -1, 66, -1, -1, -1, -1, -1, -1, -1, -1],
          [71, -1, -1, 74, -1, 79, -1, -1, 78, -1, 76, -1, 74, -1, -1, -1],
          [76, -1, -1, -1, 72, -1, -1, -1, -1, -1, 67, -1, 69, -1, 71, -1],
          [72, -1, -1, 69, -1, 72, -1, -1, 77, -1, 76, -1, 74, -1, -1, -1],
          [74, -1, 72, -1, 71, -1, 69, -1, 71, -1, 72, -1, 74, -1, -1, -1],
          [68, -1, -1, 71, -1, 74, -1, -1, 76, -1, -1, -1, 74, -1, 71, -1],
          [69, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        ],
        swing: 0.18, drums: 'brush', leadType: 'triangle', leadVol: 0.05,
      },
      run: {
        bpm: 128,
        chords: [[50, [0, 3, 7]], [46, [0, 4, 7]], [48, [0, 4, 7]], [45, [0, 4, 7]]],
        lead: [
          [74, -1, 77, -1, 81, -1, 79, 77, -1, 74, -1, 72, 74, -1, -1, -1],
          [70, -1, 74, -1, 77, -1, 74, 72, -1, 70, -1, 69, 70, -1, 72, -1],
          [72, -1, 76, -1, 79, -1, 76, 79, -1, 84, -1, 83, 81, -1, 79, -1],
          [81, -1, 79, -1, 76, -1, 73, -1, 76, -1, 73, -1, 69, -1, -1, -1],
        ],
        swing: 0, drums: 'beat', leadType: 'square', leadVol: 0.035,
      },
      sad: {
        bpm: 66,
        chords: [[57, [0, 3, 7]], [53, [0, 4, 7]], [55, [0, 4, 7]], [52, [0, 4, 7]]],
        lead: [
          [72, -1, -1, -1, 71, -1, 69, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          [69, -1, -1, -1, 67, -1, 65, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          [67, -1, -1, -1, 65, -1, 64, -1, 62, -1, -1, -1, -1, -1, -1, -1],
          [64, -1, -1, -1, -1, -1, -1, -1, 68, -1, -1, -1, -1, -1, -1, -1],
        ],
        swing: 0, drums: 'none', leadType: 'triangle', leadVol: 0.06,
      },
    };

    function play(name) {
      wanted = name;
      if (!ctx) return;
      if (track === name) return;
      track = name; step = 0; nextT = ctx.currentTime + 0.1;
    }
    function stop() { track = null; wanted = null; }

    function note(f, t, dur, type, v, lp) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      let n = o;
      if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
      n.connect(g); g.connect(musicBus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function drum(kind, t, v = 1) {
      if (kind === 'kick') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        o.connect(g); g.connect(musicBus);
        g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
      } else {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf;
        const f = ctx.createBiquadFilter();
        f.type = kind === 'hat' ? 'highpass' : 'bandpass';
        f.frequency.value = kind === 'hat' ? 7000 : kind === 'brush' ? 3000 : 1800;
        const g = ctx.createGain();
        s.connect(f); f.connect(g); g.connect(musicBus);
        const d = kind === 'hat' ? 0.04 : kind === 'brush' ? 0.12 : 0.14;
        g.gain.setValueAtTime((kind === 'hat' ? 0.12 : kind === 'brush' ? 0.06 : 0.25) * v, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.start(t, Math.random()); s.stop(t + d + 0.02);
      }
    }

    function schedule() {
      if (!ctx) return;
      if (wanted && wanted !== track) play(wanted);
      if (!track) return;
      const T = TRACKS[track];
      const spb = 60 / T.bpm / 4;
      while (nextT < ctx.currentTime + 0.25) {
        const bar = Math.floor(step / 16) % T.chords.length;
        const s = step % 16;
        let t = nextT + (s % 2 === 1 ? T.swing * spb : 0);
        const [root, iv] = T.chords[bar];
        // bass
        if (T.drums === 'beat') {
          if (s % 2 === 0) note(mtof(root - 12 + (s % 8 === 6 ? 12 : 0)), t, spb * 1.6, 'triangle', 0.22);
        } else if (s % 4 === 0 || (T.drums === 'brush' && s === 10)) {
          const walk = [0, 7, 12, 7][Math.floor(s / 4)] || 0;
          note(mtof(root - 12 + walk), t, spb * 3.5, 'triangle', 0.22);
        }
        // chords
        if (T.drums === 'beat' ? (s === 2 || s === 6 || s === 10 || s === 14) : (s === 0 || s === 6 || (s === 11 && bar % 2 === 0))) {
          for (const i of iv) note(mtof(root + i + 12), t, spb * (T.drums === 'beat' ? 1.2 : 3), T.drums === 'beat' ? 'square' : 'triangle', T.drums === 'beat' ? 0.018 : 0.035, 1800);
        }
        // lead
        const ln = T.lead[bar % T.lead.length][s];
        if (ln > 0) note(mtof(ln), t, spb * 2.6, T.leadType, T.leadVol, 3200);
        // drums
        if (T.drums === 'beat') {
          if (s % 4 === 0) drum('kick', t);
          if (s % 8 === 4) drum('snare', t);
          if (s % 2 === 0) drum('hat', t, s % 4 === 2 ? 1 : 0.5);
        } else if (T.drums === 'brush') {
          if (s % 4 === 2) drum('brush', t);
          if (s % 8 === 0) drum('kick', t, 0.5);
          if (s % 2 === 1) drum('hat', t, 0.3);
        }
        nextT += spb;
        step++;
      }
    }
    function _start() {
      if (timer) return;
      timer = setInterval(schedule, 50);
      if (wanted) play(wanted);
    }
    return { play, stop, _start };
  })();

  function setSfx(v) { sfxVol = v; if (sfxBus) sfxBus.gain.value = v; }
  function setMusic(v) { musicVol = v; if (musicBus) musicBus.gain.value = v * 0.5; }
  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 1; }

  return { init, play, Music, setSfx, setMusic, setMuted, get ready() { return !!ctx; } };
})();
