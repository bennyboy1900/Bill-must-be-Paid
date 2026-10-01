// ============================================================
//  RUN SCENE: smashing piggies
// ============================================================
const BOUNDS = { x0: 44, x1: 596, y0: 100, y1: 340 };
const HS = 2; // hammer draw scale
const MONEY_POS = { x: W - 66, y: 15 };
const GEM_POS = { x: W - 94, y: 36 };
const sp = (v) => Math.round(v * Game.k) / Game.k; // sub-pixel snapping => smooth motion with crisp pixels

// ------------------------------------------------------------
//  PIG
// ------------------------------------------------------------
class Pig {
  constructor(run, type, x, y, o = {}) {
    this.run = run;
    this.type = type;
    this.def = PIGS[type];
    this.spr0 = Art.pig(type, 0);
    const sc = pigScale(P.C.billIdx);
    this.maxHp = this.hp = this.def.hp * sc.hp;
    this.value = this.def.value * sc.value;
    this.x = x; this.y = y;
    this.z = o.z !== undefined ? o.z : rand(150, 240);
    this.vz = o.vz || 0;
    this.kx = o.kx || 0; this.ky = o.ky || 0;
    this.face = chance(0.5) ? 1 : -1;
    this.faceVis = this.face;
    this.state = this.z > 0 ? 'drop' : 'idle';
    this.walkPh = 0;
    this.idleT = rand(0.2, 1.2);
    this.tx = x; this.ty = y;
    this.sq = this.z > 0 ? -0.3 : 0; this.sqv = 0;
    this.hitT = 0; this.hurtT = 0; this.blinkT = rand(1, 4);
    this.cracks = []; this.crackStage = 0;
    this.age = 0; this.frozen = 0; this.stun = 0;
    this.s = this.spr0.s;
    this.r = 11 * this.s;
    this.sr = this.s / Art.PIG_SCALE; // relative size (1 = normal pig)
    this.speed = this.def.speed * rand(0.85, 1.15);
    this.seed = randi(0, 100000);
    this.ghostPh = rand(0, TAU);
    this.dead = false;
    this.awake = this.def.behavior !== 'sleep';
    this.leaving = false;
    this.zzzT = 0;
    this.hop = 0;
    this.tremble = 0;
    this.revived = false;
    this.sparkT = 0;
  }
  get visible() {
    if (!this.def.ghost) return true;
    return Math.sin(this.age * 1.4 + this.ghostPh) < 0.45;
  }
  get alive() { return !this.dead && this.state !== 'drop' || (this.state === 'drop' && this.z < 10 && !this.dead); }

  pickTarget(range = 110) {
    for (let i = 0; i < 8; i++) {
      const a = rand(TAU), d = rand(30, range);
      const tx = this.x + Math.cos(a) * d, ty = this.y + Math.sin(a) * d * 0.7;
      if (tx > BOUNDS.x0 && tx < BOUNDS.x1 && ty > BOUNDS.y0 && ty < BOUNDS.y1) { this.tx = tx; this.ty = ty; return; }
    }
    this.tx = clamp(this.x + rand(-60, 60), BOUNDS.x0 + 10, BOUNDS.x1 - 10);
    this.ty = clamp(this.y + rand(-40, 40), BOUNDS.y0 + 10, BOUNDS.y1 - 10);
  }

  kick(sq) { this.sqv += sq; }

  update(dt) {
    const run = this.run;
    this.age += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    // spring for squash & stretch (critically under-damped => juicy wobble)
    let sqTarget = 0;
    if (this.state === 'idle' && !this.frozen) sqTarget = Math.sin(this.age * 3.1 + this.seed) * 0.035; // breathing
    const acc = -300 * (this.sq - sqTarget) - 15 * this.sqv;
    this.sqv += acc * dt;
    this.sq += this.sqv * dt;
    this.sq = clamp(this.sq, -0.5, 0.6);
    // smooth flip when turning around
    this.faceVis = damp(this.faceVis, this.face, 16, dt);

    if (this.frozen > 0) { this.frozen -= dt; if (this.frozen <= 0) run.unfreezePig(this); return; }

    // knockback
    this.x += this.kx * dt; this.y += this.ky * dt;
    const kd = Math.exp(-9 * dt);
    this.kx *= kd; this.ky *= kd;

    if (this.state === 'drop') {
      this.vz -= 1100 * dt;
      this.z += this.vz * dt;
      this.sq = Math.max(-0.28, this.vz / 1600); // stretch while falling
      if (this.z <= 0) {
        this.z = 0;
        const impact = Math.min(1, -this.vz / 600);
        this.vz = 0;
        this.state = 'idle';
        this.sq = 0; this.sqv = 9 * impact + 2; // squash on landing
        run.dust(this.x, this.y, 5 + Math.round(impact * 4), this.s);
        if (impact > 0.4) Sound.play('land', null, 0.06);
      }
      return;
    }
    if (this.stun > 0) { this.stun -= dt; this.state = 'idle'; return; }

    // regeneration (vampires)
    if (this.def.regen && this.age - (this.lastHit || 0) > 1.5 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.def.regen * dt);
      if (chance(dt * 4)) run.parts.push(new FloatHeart(this.x + rand(-8, 8), this.y - 20 * this.s));
    }
    // hop (dancers / landing bounces) / floating astronauts
    if (this.def.behavior === 'float') {
      this.z = 7 + Math.sin(this.age * 2.2 + this.seed) * 4;
      this.vz = 0;
    } else if (this.z > 0 || this.vz !== 0) {
      this.vz -= 900 * dt; this.z += this.vz * dt;
      if (this.z <= 0) { this.z = 0; if (this.vz < -60) this.kick(5); this.vz = 0; }
    }

    const d = this.def;
    // timed escapes / despawns
    if (d.despawn && this.age > d.despawn && !this.leaving) {
      run.poof(this);
      return;
    }
    if (d.escapeTime && this.age > d.escapeTime && !this.leaving && run.S.mafiaBoost < 2 + (this.type === 'mafia' ? 0 : 99)) {
      this.leaving = true;
      this.tx = this.x < W / 2 ? -40 : W + 40;
      this.ty = this.y;
      run.text(this.x, this.y - 28 * this.s, d.taxman ? 'Pfändung!' : 'Tschüss!', '#ff8a6a');
      Sound.play('escape');
    }

    let speed = this.speed;
    let moving = false;
    const hx = run.ham.tx, hy = run.ham.ty;
    const hd = dist(this.x, this.y, hx, hy);

    if (!this.awake) {
      this.zzzT -= dt;
      if (this.zzzT <= 0) { this.zzzT = 1.1; run.parts.push(new Zzz(this.x + this.face * 10 * this.s, this.y - 22 * this.s)); }
    } else if (this.leaving) {
      speed = Math.max(speed, 40) * 1.4;
      moving = true;
    } else if ((d.behavior === 'flee' || (d.behavior === 'sleep' && this.awake)) && hd < 85 && run.state === 'play') {
      // run away from the hammer
      const a = Math.atan2(this.y - hy, this.x - hx) + rand(-0.4, 0.4);
      this.tx = clamp(this.x + Math.cos(a) * 70, BOUNDS.x0, BOUNDS.x1);
      this.ty = clamp(this.y + Math.sin(a) * 50, BOUNDS.y0, BOUNDS.y1);
      speed *= 1.5;
      moving = true;
      this.idleT = 0;
    } else if (this.state === 'idle') {
      this.idleT -= dt;
      if (this.idleT <= 0) {
        this.pickTarget(d.behavior === 'lazy' ? 60 : d.behavior === 'sneaky' ? 160 : 120);
        this.state = 'walk';
        if (d.behavior === 'dance') { this.vz = 120; this.kick(-3); }
      }
    } else moving = true;

    if (moving && this.state !== 'drop') this.state = 'walk';
    if (this.state === 'walk') {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const dd = Math.hypot(dx, dy);
      if (dd < 2 && !this.leaving) {
        this.state = 'idle';
        this.idleT = d.behavior === 'lazy' ? rand(2.5, 6) : d.behavior === 'dance' ? rand(0.1, 0.4) : rand(0.4, 2.2);
        this.kick(2.5); // little settle
      } else {
        let sp2 = speed;
        if (run.slow) sp2 *= 0.5;
        const step = Math.min(dd, sp2 * dt);
        this.x += (dx / dd) * step; this.y += (dy / dd) * step;
        this.walkPh += step / (3.2 * this.s);
        if (Math.abs(dx) > 1.5) {
          const nf = dx > 0 ? 1 : -1;
          if (nf !== this.face) { this.face = nf; this.kick(-2.5); }
        }
        if (d.behavior === 'dance' && this.z === 0 && chance(dt * 2)) { this.vz = rand(80, 140); this.kick(-3); }
        if (d.behavior === 'flee' && speed > 50 && chance(dt * 6)) run.parts.push(new Dust(this.x - this.face * 8 * this.s, this.y, 0.6));
      }
    }
    if (this.leaving) {
      if (this.x < -30 || this.x > W + 30) run.escaped(this);
    } else {
      this.x = clamp(this.x, BOUNDS.x0, BOUNDS.x1);
      this.y = clamp(this.y, BOUNDS.y0, BOUNDS.y1);
    }
    // blinking
    this.blinkT -= dt;
    if (this.blinkT < -0.12) this.blinkT = rand(1.5, 5);
    // burning
    if (this.burn) {
      this.burn.t -= dt; this.burn.tick -= dt;
      if (chance(dt * 18)) run.parts.push(new Fire(this.x + rand(-8, 8) * this.s, this.y - this.z - rand(4, 16) * this.s));
      if (this.burn.tick <= 0) { this.burn.tick = 0.4; run.damage(this, this.burn.dps * 0.4, { crit: false, src: 'burn' }); }
      if (this.burn && this.burn.t <= 0) this.burn = null;
    }
    // low hp tremble
    this.tremble = this.hp / this.maxHp < 0.3 ? 1 : 0;
    // golden sparkle
    if (this.type === 'golden' || this.type === 'diamond' || this.type === 'king') {
      this.sparkT -= dt;
      if (this.sparkT <= 0) { this.sparkT = rand(0.08, 0.25); run.parts.push(new Sparkle(this.x + rand(-12, 12) * this.s, this.y - this.z - rand(4, 22) * this.s)); }
    }
  }

  frame() {
    if (this.state === 'walk' && !this.frozen && this.stun <= 0) return 1 + (Math.floor(this.walkPh) % 4);
    return 0;
  }

  drawShadow(ctx) {
    const k = clamp(1 - this.z / 260, 0.25, 1);
    ctx.fillStyle = 'rgba(10,4,2,0.32)';
    const rx = 11 * this.s * k * (1 + this.sq * 0.6), ry = 3.2 * this.s * k;
    ctx.beginPath();
    ctx.ellipse(sp(this.x), sp(this.y + 1), rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  draw(ctx, run) {
    const fr = this.frame();
    const spr = Art.pig(this.type, fr);
    let alpha = 1;
    if (this.def.ghost) {
      const v = Math.sin(this.age * 1.4 + this.ghostPh);
      alpha = v < 0.45 ? 0.82 : 0.12 + (1 - v) * 0.3;
    }
    if (this.state === 'drop') alpha = Math.min(alpha, clamp(1.3 - this.z / 260, 0.2, 1));
    let sx = (1 + this.sq) * this.faceVis;
    if (Math.abs(sx) < 0.08) sx = 0.08 * Math.sign(this.faceVis || 1);
    const sy = 1 - this.sq;
    let jx = 0;
    if (this.tremble && !this.frozen) jx = Math.sin(this.age * 60) * 0.5;
    if (this.hitT > 0) jx += Math.sin(this.hitT * 120) * 1.2 * (this.hitT / 0.15);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sp(this.x + jx), sp(this.y - this.z));
    ctx.scale(sx, sy);
    const ox = -spr.ax, oy = -spr.ay;
    ctx.drawImage(spr.canvas, ox, oy);
    // cracks
    if (this.cracks.length) {
      const bob = fr === 2 || fr === 4 ? -1 : 0;
      ctx.fillStyle = spr.C.ol;
      for (const c of this.cracks) for (const [x, y] of c) ctx.fillRect(ox + x, oy + y + bob, 1, 1);
      ctx.fillStyle = spr.C.hl;
      for (const c of this.cracks) { const [x, y] = c[0]; ctx.fillRect(ox + x + 1, oy + y + bob - 1, 1, 1); }
    }
    this.drawEyes(ctx, spr, ox, oy, fr, run);
    if (this.hitT > 0) {
      ctx.globalAlpha = alpha * Math.min(1, this.hitT / 0.08);
      ctx.drawImage(Art.pigTint(this.type, fr, 'white'), ox, oy);
    }
    if (this.frozen > 0) {
      ctx.globalAlpha = alpha * Math.min(1, this.frozen * 3) * 0.85;
      ctx.drawImage(Art.pigTint(this.type, fr, 'ice'), ox, oy);
    }
    ctx.restore();
  }

  drawEyes(ctx, spr, ox, oy, fr, run) {
    const st = spr.style;
    const bob = fr === 2 || fr === 4 ? -1 : 0;
    const ew = spr.eyeW, eh = spr.eyeH;
    const dark = '#1a0e0e';
    const E = spr.eyes.map((e) => ({ x: ox + e.x, y: oy + e.y + bob }));
    // pupils look at the hammer (in sprite space, flip by facing)
    const lx = clamp((run.ham.tx - this.x) * Math.sign(this.faceVis || 1) / 40, -1, 1);
    const ly = clamp((run.ham.ty - (this.y - 14)) / 40, -1, 1);
    const sleeping = !this.awake;
    if (st.eyes === 'shades') {
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(E[0].x - 1, E[0].y, E[1].x - E[0].x + ew + 1, 3);
      ctx.fillStyle = '#5a6a8a'; ctx.fillRect(E[0].x, E[0].y, 1, 1); ctx.fillRect(E[1].x, E[1].y, 1, 1);
      return;
    }
    if (st.eyes === 'visor') {
      ctx.fillStyle = '#2a0a0a'; ctx.fillRect(E[0].x - 1, E[0].y, E[1].x - E[0].x + ew + 1, 3);
      const span = E[1].x - E[0].x + ew - 1;
      const p = Math.floor((Math.sin(this.age * 5) * 0.5 + 0.5) * span);
      ctx.fillStyle = '#ff3a3a'; ctx.fillRect(E[0].x - 1, E[0].y + 1, span + 2, 1);
      ctx.fillStyle = '#ffd0d0'; ctx.fillRect(E[0].x + p, E[0].y + 1, 2, 1);
      return;
    }
    for (let i = 0; i < 2; i++) {
      const e = E[i];
      if (this.hurtT > 0) {
        ctx.fillStyle = dark;
        const pts = i === 0 ? [[0, 0], [1, 1], [0, 2]] : [[1, 0], [0, 1], [1, 2]];
        for (const [a, b] of pts) ctx.fillRect(e.x + a + (i === 0 ? 0 : ew - 2), e.y + b, 1, 1);
        continue;
      }
      if (sleeping || st.eyes === 'closed' && !this.awake) {
        ctx.fillStyle = dark;
        ctx.fillRect(e.x, e.y + eh - 2, 1, 1); ctx.fillRect(e.x + 1, e.y + eh - 1, ew - 2, 1); ctx.fillRect(e.x + ew - 1, e.y + eh - 2, 1, 1);
        continue;
      }
      if (st.eyes === 'ninja') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x, e.y + 1, ew, 1);
        ctx.fillStyle = dark; ctx.fillRect(e.x + 1 + Math.round(lx * 0.5), e.y + 1, 1, 1);
        continue;
      }
      if (this.blinkT < 0 && this.frozen <= 0) {
        ctx.fillStyle = dark; ctx.fillRect(e.x, e.y + Math.floor(eh / 2), ew, 1);
        continue;
      }
      if (st.eyes === 'patch' && i === 0) {
        ctx.fillStyle = '#141018';
        ctx.fillRect(e.x - 1, e.y, ew + 1, eh - 1);
        ctx.fillRect(e.x - 3, e.y - 2, 2, 1); ctx.fillRect(e.x - 2, e.y - 1, 1, 1);
        continue;
      }
      if (st.eyes === 'red') {
        ctx.fillStyle = '#ffe8e8';
        ctx.fillRect(e.x, e.y + 1, ew, eh - 2);
        ctx.fillStyle = '#e8102a';
        ctx.fillRect(e.x + clamp(Math.round(1 + lx * 0.6), 0, ew - 2), e.y + 1 + clamp(Math.round(ly * 0.6 + 0.5), 0, eh - 3), 2, 2);
        continue;
      }
      if (st.eyes === 'zombie' && i === 0) {
        ctx.fillStyle = dark;
        ctx.fillRect(e.x, e.y, 1, 1); ctx.fillRect(e.x + 2, e.y, 1, 1); ctx.fillRect(e.x + 1, e.y + 1, 1, 1); ctx.fillRect(e.x, e.y + 2, 1, 1); ctx.fillRect(e.x + 2, e.y + 2, 1, 1);
        continue;
      }
      // white with cut corners (round)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x, e.y + 1, ew, eh - 2);
      ctx.fillRect(e.x + (ew > 3 ? 1 : 0), e.y, ew - (ew > 3 ? 2 : 0), 1);
      ctx.fillRect(e.x + (ew > 3 ? 1 : 0), e.y + eh - 1, ew - (ew > 3 ? 2 : 0), 1);
      // pupil
      const pw = 2;
      const px = e.x + clamp(Math.round((ew - pw) / 2 + lx * (ew - pw) / 2 + 0.01), 0, ew - pw);
      const py = e.y + clamp(Math.round((eh - pw) / 2 + ly * (eh - pw) / 2), 0, eh - pw);
      ctx.fillStyle = st.eyes === 'zombie' ? '#6a2a2a' : dark;
      ctx.fillRect(px, py, pw, pw);
      if (st.lashes) { ctx.fillStyle = dark; ctx.fillRect(e.x - 1, e.y - 1, 1, 1); ctx.fillRect(e.x + ew, e.y - 1, 1, 1); }
    }
    if (st.acc && st.acc.includes('glasses')) {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(E[0].x - 1, E[0].y - 1, E[1].x - E[0].x + ew + 2, 1);
    }
  }

  addCracks(n) {
    const spr = this.spr0;
    for (let k = 0; k < n; k++) {
      let x = 0, y = 0, ok = false;
      for (let t = 0; t < 40 && !ok; t++) {
        x = randi(0, spr.w - 1); y = randi(0, spr.h - 1);
        ok = spr.mask[y * spr.w + x] === 1;
      }
      if (!ok) continue;
      const pts = [];
      let dir = randi(0, 7);
      const L = randi(3, 7) * this.s;
      const D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      for (let i = 0; i < L; i++) {
        if (spr.mask[y * spr.w + x] !== 1) break;
        pts.push([x, y]);
        if (chance(0.35)) dir = (dir + (chance(0.5) ? 1 : 7)) % 8;
        x += D[dir][0]; y += D[dir][1];
      }
      if (pts.length) this.cracks.push(pts);
    }
  }
}

// ------------------------------------------------------------
//  PARTICLES & FX
// ------------------------------------------------------------
class Shard {
  constructor(x, y, z, col, big = false) {
    this.x = x; this.y = y; this.z = z;
    const a = rand(TAU), s = rand(40, big ? 120 : 170);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s * 0.6;
    this.vz = rand(120, 320);
    this.col = col; this.size = big ? randi(2, 4) : randi(1, 2);
    this.life = rand(1.4, 2.4); this.t = 0;
    this.ground = false;
    this.spin = rand(0, 4);
  }
  update(dt) {
    this.t += dt;
    if (!this.ground) {
      this.vz -= 900 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.vz * dt;
      this.spin += dt * 12;
      if (this.z <= 0) {
        this.z = 0;
        if (this.vz < -90) { this.vz = -this.vz * 0.35; this.vx *= 0.5; this.vy *= 0.5; } else { this.ground = true; }
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const a = clamp((this.life - this.t) / 0.5, 0, 1);
    ctx.globalAlpha = a;
    const sz = this.size;
    if (this.z > 1) { ctx.fillStyle = 'rgba(10,4,2,0.3)'; ctx.fillRect(sp(this.x), sp(this.y), sz, 1); }
    ctx.fillStyle = '#1a0e0e';
    const w = sz + (Math.floor(this.spin) % 2 && sz > 1 ? -1 : 0);
    ctx.fillRect(sp(this.x) - 0.5, sp(this.y - this.z) - 0.5, w + 1, sz + 1);
    ctx.fillStyle = this.col;
    ctx.fillRect(sp(this.x), sp(this.y - this.z), w, sz);
    ctx.globalAlpha = 1;
  }
}
class Chunk {
  constructor(c, x, y, face, power = 1) {
    this.c = c; this.face = face;
    this.x = x + c.ox * face; this.y = y; this.z = -c.oy;
    const a = Math.atan2(c.oy * 0.6, c.ox * face) + rand(-0.5, 0.5);
    const sp0 = rand(70, 150) * power;
    this.vx = Math.cos(a) * sp0 + c.ox * face * 4; this.vy = rand(-40, 40) * power;
    this.vz = rand(140, 280) * power;
    this.rot = 0; this.vr = rand(-14, 14);
    this.t = 0; this.life = rand(1.1, 1.6); this.ground = false;
  }
  update(dt) {
    this.t += dt;
    if (!this.ground) {
      this.vz -= 980 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.vz * dt; this.rot += this.vr * dt;
      if (this.z <= 0) {
        this.z = 0;
        if (this.vz < -110) { this.vz *= -0.38; this.vx *= 0.55; this.vy *= 0.55; this.vr *= 0.5; }
        else { this.ground = true; this.vr = 0; }
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const a = clamp((this.life - this.t) / 0.35, 0, 1);
    const cv = this.c.canvas;
    ctx.globalAlpha = a * 0.35;
    ctx.fillStyle = '#0a0402';
    ctx.beginPath(); ctx.ellipse(sp(this.x), sp(this.y), cv.width * 0.4, 2, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(sp(this.x), sp(this.y - this.z - cv.height / 2));
    ctx.rotate(this.rot);
    ctx.scale(this.face, 1);
    ctx.drawImage(cv, -cv.width / 2, -cv.height / 2);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
class Dust {
  constructor(x, y, s = 1, col = '#c8a888') {
    this.x = x + rand(-3, 3); this.y = y + rand(-1, 1);
    this.vx = rand(-30, 30) * s; this.vy = rand(-14, 4) * s;
    this.r = rand(1.5, 3.5) * s; this.t = 0; this.life = rand(0.35, 0.7); this.col = col;
  }
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.92; this.vy *= 0.92; return this.t < this.life; }
  draw(ctx) {
    const k = this.t / this.life;
    ctx.globalAlpha = (1 - k) * 0.7;
    ctx.fillStyle = this.col;
    const r = this.r * (1 + k * 1.4);
    ctx.beginPath(); ctx.arc(sp(this.x), sp(this.y - r * 0.6), r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
}
class Spark {
  constructor(x, y, col = '#ffe070', speed = 160) {
    this.x = x; this.y = y; const a = rand(TAU), s = rand(speed * 0.3, speed);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s - 30; this.t = 0; this.life = rand(0.2, 0.5); this.col = col;
  }
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 300 * dt; this.vx *= 0.95; return this.t < this.life; }
  draw(ctx) {
    ctx.globalAlpha = 1 - this.t / this.life;
    ctx.fillStyle = this.col;
    ctx.fillRect(sp(this.x), sp(this.y), 1, 1);
    ctx.fillRect(sp(this.x - this.vx * 0.015), sp(this.y - this.vy * 0.015), 1, 1);
    ctx.globalAlpha = 1;
  }
}
class Sparkle {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.life = 0.5; }
  update(dt) { this.t += dt; this.y -= 6 * dt; return this.t < this.life; }
  draw(ctx) { const f = Math.min(4, Math.floor((this.t / this.life) * 5)); const c = Art.sparkle(f); ctx.drawImage(c, sp(this.x - 4), sp(this.y - 4)); }
}
class Zzz {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.life = 1.6; }
  update(dt) { this.t += dt; this.y -= 12 * dt; this.x += Math.sin(this.t * 4) * 8 * dt; return this.t < this.life; }
  draw(ctx) { Font.draw(ctx, 'z', sp(this.x), sp(this.y), { color: '#d8e0ff', alpha: 1 - this.t / this.life, shadow: 'outline', shadowColor: '#2a2a4a' }); }
}
class FloatHeart {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.life = 0.8; }
  update(dt) { this.t += dt; this.y -= 18 * dt; return this.t < this.life; }
  draw(ctx) { Font.draw(ctx, '♥', sp(this.x), sp(this.y), { color: '#ff3a5a', alpha: 1 - this.t / this.life, shadow: 'outline' }); }
}
class Confetti {
  constructor(x, y) {
    this.x = x; this.y = y; const a = rand(TAU), s = rand(50, 200);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s - 120; this.t = 0; this.life = rand(1, 1.8);
    this.col = pick(['#ff5a8a', '#ffe04a', '#5ae0ff', '#7af07a', '#c07af0', '#ffffff']); this.ph = rand(TAU);
  }
  update(dt) { this.t += dt; this.vy += 220 * dt; this.vx *= 0.97; this.vy *= 0.97; this.x += this.vx * dt + Math.sin(this.t * 10 + this.ph) * 0.4; this.y += this.vy * dt; return this.t < this.life; }
  draw(ctx) { ctx.globalAlpha = clamp((this.life - this.t) * 2, 0, 1); ctx.fillStyle = this.col; ctx.fillRect(sp(this.x), sp(this.y), Math.sin(this.t * 14 + this.ph) > 0 ? 2 : 1, 2); ctx.globalAlpha = 1; }
}
class Smoke {
  constructor(x, y, col = '#5a4a44', s = 1) { this.x = x + rand(-6, 6) * s; this.y = y + rand(-4, 4) * s; this.vx = rand(-20, 20); this.vy = rand(-40, -10); this.r = rand(3, 6) * s; this.t = 0; this.life = rand(0.5, 1); this.col = col; }
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; return this.t < this.life; }
  draw(ctx) { const k = this.t / this.life; ctx.globalAlpha = (1 - k) * 0.6; ctx.fillStyle = this.col; ctx.beginPath(); ctx.arc(sp(this.x), sp(this.y), this.r * (1 + k), 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
}
class Fire {
  constructor(x, y) { this.x = x; this.y = y; const a = rand(TAU), s = rand(30, 140); this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s * 0.6 - 40; this.t = 0; this.life = rand(0.3, 0.7); }
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.9; this.vy = this.vy * 0.9 - 40 * dt; return this.t < this.life; }
  draw(ctx) {
    const k = this.t / this.life;
    ctx.fillStyle = k < 0.3 ? '#fff4b0' : k < 0.55 ? '#ffb030' : k < 0.8 ? '#e84a2a' : '#5a3a34';
    const r = 4 * (1 - k * 0.5);
    ctx.fillRect(sp(this.x - r / 2), sp(this.y - r / 2), r, r);
  }
}
class Ring {
  constructor(x, y, maxR, col = '#fff0c8', life = 0.3, thick = 1) { this.x = x; this.y = y; this.maxR = maxR; this.col = col; this.t = 0; this.life = life; this.thick = thick; }
  update(dt) { this.t += dt; return this.t < this.life; }
  draw(ctx) {
    const k = Ease.outCubic(this.t / this.life);
    const r = this.maxR * (0.25 + 0.75 * k);
    ctx.globalAlpha = 1 - this.t / this.life;
    ctx.strokeStyle = this.col;
    ctx.lineWidth = this.thick * (1 - k * 0.5) + 0.5;
    ctx.beginPath(); ctx.ellipse(sp(this.x), sp(this.y), r, r * 0.6, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
class Bolt {
  constructor(pts, col = '#8ae8ff', life = 0.22) { this.pts = pts; this.col = col; this.t = 0; this.life = life; this.seg = this.jag(); }
  jag() {
    const out = [];
    for (let i = 0; i < this.pts.length - 1; i++) {
      const [ax, ay] = this.pts[i], [bx, by] = this.pts[i + 1];
      const n = Math.max(2, Math.round(dist(ax, ay, bx, by) / 9));
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const off = j === 0 || j === n ? 0 : rand(-6, 6);
        const nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1;
        out.push([lerp(ax, bx, t) + (nx / L) * off, lerp(ay, by, t) + (ny / L) * off]);
      }
    }
    return out;
  }
  update(dt) { this.t += dt; if (chance(0.5)) this.seg = this.jag(); return this.t < this.life; }
  draw(ctx) {
    ctx.globalAlpha = 1 - (this.t / this.life) * 0.6;
    for (let i = 0; i < this.seg.length - 1; i++) {
      const [a, b] = this.seg[i], [c, d] = this.seg[i + 1];
      pxLine(ctx, a, b, c, d, this.col, 3);
    }
    for (let i = 0; i < this.seg.length - 1; i++) {
      const [a, b] = this.seg[i], [c, d] = this.seg[i + 1];
      pxLine(ctx, a, b, c, d, '#ffffff', 1);
    }
    ctx.globalAlpha = 1;
  }
}
class FloatText {
  constructor(x, y, str, col, o = {}) {
    this.x = x; this.y = y; this.str = str; this.col = col; this.t = 0;
    this.life = o.life || 0.9; this.scale = o.scale || 1; this.vy = o.vy !== undefined ? o.vy : -38;
    this.gradient = o.gradient || null; this.big = !!o.big; this.vx = o.vx || 0;
  }
  update(dt) { this.t += dt; this.y += this.vy * dt * (1 - this.t / this.life); this.x += this.vx * dt; return this.t < this.life; }
  draw(ctx) {
    const t = this.t;
    let k = t < 0.12 ? Ease.outBack(t / 0.12) * 1.15 : t < 0.22 ? lerp(1.15, 1, (t - 0.12) / 0.1) : 1;
    const a = clamp((this.life - t) / 0.25, 0, 1);
    Font.drawScaled(ctx, this.str, sp(this.x), sp(this.y), k, { color: this.col, scale: this.scale, alpha: a, gradient: this.gradient, shadow: this.big ? 'thick' : 'outline' });
  }
}
class Decal {
  constructor(x, y, big) {
    this.x = Math.round(x); this.y = Math.round(y); this.t = 0; this.life = big ? 6 : 3;
    this.pts = [];
    const n = big ? 6 : 3;
    for (let i = 0; i < n; i++) {
      let a = rand(TAU), px = 0, py = 0;
      const L = randi(4, big ? 14 : 7);
      for (let j = 0; j < L; j++) { px += Math.cos(a); py += Math.sin(a) * 0.6; a += rand(-0.5, 0.5); this.pts.push([Math.round(px), Math.round(py)]); }
    }
  }
  update(dt) { this.t += dt; return this.t < this.life; }
  draw(ctx) {
    ctx.globalAlpha = clamp((this.life - this.t) / 1, 0, 0.7);
    ctx.fillStyle = '#140a06';
    for (const [x, y] of this.pts) ctx.fillRect(this.x + x, this.y + y, 1, 1);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
//  LOOT (coins, gems, cash, rare coins)
// ------------------------------------------------------------
class Loot {
  constructor(run, x, y, z, kind, value, o = {}) {
    this.run = run; this.kind = kind; this.value = value; this.o = o;
    this.x = x; this.y = y; this.z = z;
    const a = rand(TAU), s = rand(25, o.spread || 110);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s * 0.65;
    this.vz = rand(130, o.jackpot ? 480 : 300);
    this.state = 'air';
    this.t = 0; this.wait = rand(0.25, 0.7);
    this.spin = rand(0, 6); this.spinV = rand(10, 18);
    this.fvx = 0; this.fvy = 0;
  }
  update(dt) {
    this.t += dt;
    this.spin += this.spinV * dt;
    if (this.state === 'air') {
      this.vz -= 950 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.vz * dt;
      if (this.y < BOUNDS.y0 - 20 || this.y > H - 6) this.vy *= -0.5;
      if (this.x < 10 || this.x > W - 10) this.vx *= -0.5;
      if (this.z <= 0) {
        this.z = 0;
        if (this.vz < -80) { this.vz = -this.vz * 0.42; this.vx *= 0.6; this.vy *= 0.6; if (this.kind !== 'cash') Sound.play('tick', null, 0.03); }
        else { this.vz = 0; this.state = 'ground'; this.spinV *= 0.3; }
      }
    } else if (this.state === 'ground') {
      this.wait -= dt * (this.run.state === 'tired' ? 4 : 1);
      if (this.wait <= 0) { this.state = 'fly'; this.y -= this.z; this.z = 0; this.t = 0; this.fvx = rand(-120, 120); this.fvy = rand(-160, -60); }
    } else if (this.state === 'fly') {
      const tgt = this.kind === 'gem' ? GEM_POS : this.kind === 'rare' ? { x: W / 2, y: 120 } : MONEY_POS;
      const dx = tgt.x - this.x, dy = tgt.y - this.y;
      const d = Math.hypot(dx, dy);
      const acc = 1800 + this.t * 4000;
      this.fvx += (dx / d) * acc * dt; this.fvy += (dy / d) * acc * dt;
      const drag = Math.exp(-4 * dt);
      this.fvx *= drag; this.fvy *= drag;
      this.x += this.fvx * dt; this.y += this.fvy * dt;
      this.spinV = 22;
      if (d < 10 || this.t > 2) { this.run.collect(this); return false; }
    }
    return true;
  }
  sprite() {
    const f = Math.floor(this.spin) % 6;
    if (this.kind === 'coin') return Art.coin(this.o.metal, f);
    if (this.kind === 'cash') return Art.cash();
    if (this.kind === 'gem') return Art.gem(this.o.gem, Math.floor(this.spin / 2));
    if (this.kind === 'rare') return Art.rareCoin(RARE_BY_ID[this.o.id], 12);
    return Art.coin('gold', f);
  }
  draw(ctx) {
    const s = this.sprite();
    if (this.state !== 'fly') {
      ctx.fillStyle = 'rgba(10,4,2,0.3)';
      const k = clamp(1 - this.z / 200, 0.3, 1);
      ctx.fillRect(sp(this.x - (s.width / 2) * k), sp(this.y + 1), Math.max(2, s.width * k), 2);
    }
    if (this.kind === 'rare' || this.kind === 'gem') {
      // glow
      ctx.globalAlpha = 0.35 + Math.sin(this.t * 10) * 0.15;
      ctx.fillStyle = this.kind === 'rare' ? RARITY[RARE_BY_ID[this.o.id].r].color : Art.GEMS[this.o.gem].l;
      ctx.beginPath(); ctx.arc(sp(this.x), sp(this.y - this.z - s.height / 2), s.width * 0.9, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(s, sp(this.x - s.width / 2), sp(this.y - this.z - s.height));
  }
}

// table items: coffee, energy drink, lottery
class Item {
  constructor(run, kind, x, y) {
    this.run = run; this.kind = kind; this.x = x; this.y = y; this.z = 180; this.vz = 0; this.t = 0; this.life = 9; this.sq = 0; this.sqv = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.z > 0) { this.vz -= 1000 * dt; this.z += this.vz * dt; if (this.z <= 0) { this.z = 0; this.sqv = 8; this.run.dust(this.x, this.y, 4, 0.8); } }
    this.sqv += (-300 * this.sq - 14 * this.sqv) * dt; this.sq += this.sqv * dt;
    if (chance(dt * 3)) this.run.parts.push(new Sparkle(this.x + rand(-7, 7), this.y - rand(4, 16)));
    return this.t < this.life;
  }
  sprite() { return this.kind === 'coffee' ? Art.coffeeCup() : this.kind === 'energy' ? Art.energyCan() : Art.lottery(); }
  draw(ctx) {
    const s = this.sprite();
    const blink = this.life - this.t < 2 && Math.floor(this.t * 8) % 2 === 0;
    if (blink) return;
    ctx.fillStyle = 'rgba(10,4,2,0.3)';
    ctx.beginPath(); ctx.ellipse(sp(this.x), sp(this.y), s.width * 0.45, 2.5, 0, 0, TAU); ctx.fill();
    const bobY = this.z === 0 ? Math.sin(this.t * 4) * 1.5 : 0;
    ctx.save();
    ctx.translate(sp(this.x), sp(this.y - this.z - bobY));
    ctx.scale(1 + this.sq * 0.4, 1 - this.sq * 0.4);
    ctx.drawImage(s, -Math.round(s.width / 2), -s.height);
    ctx.restore();
  }
}

class Stone {
  constructor(run, x, y, delay, meteor = false) {
    this.run = run; this.x = x; this.y = y; this.z = meteor ? 420 : 320; this.vz = meteor ? -520 : -420; this.delay = delay; this.meteor = meteor; this.v = randi(0, 5);
    this.t = 0;
  }
  update(dt) {
    if (this.delay > 0) { this.delay -= dt; return true; }
    this.t += dt;
    this.vz -= 600 * dt; this.z += this.vz * dt;
    if (this.meteor && chance(0.8)) this.run.parts.push(new Fire(this.x + rand(-6, 6), this.y - this.z + rand(-4, 4)));
    if (this.z <= 0) { this.run.stoneImpact(this); return false; }
    return true;
  }
  draw(ctx) {
    if (this.delay > 0) return;
    const k = clamp(1 - this.z / 340, 0.1, 1);
    const R = this.meteor ? 46 : 20;
    // target marker
    ctx.globalAlpha = 0.25 + k * 0.4;
    ctx.fillStyle = this.meteor ? '#ff5a2a' : 'rgba(10,4,2,1)';
    ctx.beginPath(); ctx.ellipse(sp(this.x), sp(this.y), R * k, R * 0.6 * k, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    const s = Art.stone(this.v);
    if (this.meteor) {
      ctx.save(); ctx.translate(sp(this.x), sp(this.y - this.z)); ctx.scale(3, 3);
      ctx.drawImage(Art.tint('stone' + this.v, s, 'gold'), -7, -12); ctx.restore();
    } else ctx.drawImage(s, sp(this.x - 7), sp(this.y - this.z - 12));
  }
}

// ------------------------------------------------------------
//  RUN
// ------------------------------------------------------------
class RunScene {
  constructor() {
    invalidateStats();
    this.S = computeStats(P);
    const S = this.S;
    this.maxStamina = S.maxStamina;
    this.stamina = S.maxStamina;
    this.dispStamina = S.maxStamina;
    this.pigs = []; this.loot = []; this.parts = []; this.fx = []; this.texts = []; this.items = []; this.stones = []; this.decals = [];
    this.time = 0; this.state = 'intro'; this.stateT = 0;
    this.spawnT = 0.15; this.initialSpawns = S.maxPigs;
    this.combo = 0; this.comboT = 0; this.comboPop = 0;
    this.ham = { x: W / 2, y: H / 2 + 40, tx: W / 2, ty: H / 2 + 40, phase: 'ready', t: 0, ang: 14, swings: 0, cd: 0, hx: W / 2, hy: H / 2 };
    this.freezeMeter = 0;
    this.partyT = 0; this.discoT = 0; this.frenzyT = 0; this.coffeeT = 0; this.goldRushT = 0; this.frenzyUsed = false;
    this.stoneCD = 2; this.stormT = S.storm || 0;
    this.shakeAmt = 0; this.hitstop = 0; this.flash = 0; this.flashCol = '#ffffff'; this.timeScale = 1;
    this.secondWindUsed = false;
    this.moneyBefore = P.C.money;
    this.dispMoney = P.C.money; this.moneyBump = 0; this.gemBump = 0;
    this.coinStreak = 0; this.coinStreakT = 0;
    this.coffeeDmg = 0;
    this.itemT = 4;
    this.r = { earned: 0, pigs: 0, crits: 0, jackpots: 0, gems: 0, rares: [], maxCombo: 0, swings: 0, escaped: 0, coffee: 0, newPigs: [] };
    this.paused = false;
    this.tut = !P.tutorial.swing;
    this.bill = currentBill();
    this.camX = 0; this.camY = 0;
    this.results = null;
    this.sched = [];
    this.trail = [];
    this.echoes = [];
  }
  later(t, fn) { this.sched.push({ t, fn }); }

  enter() { Sound.Music.play('run'); }

  // ---------------- spawning ----------------
  spawnWeights() {
    const S = this.S;
    const list = [];
    for (const id of PIG_ORDER) {
      const d = PIGS[id];
      if (id === 'golden') { if (S.goldenWeight > 0) list.push([id, 2.2 * S.goldenWeight]); continue; }
      if (id === 'diamond') { if (S.diamondWeight > 0) list.push([id, 0.5 * S.diamondWeight]); continue; }
      if (!S.pigs.has(id) || !d.weight) continue;
      let w = d.weight;
      if (w <= 25) w *= 1 + S.rarePig;
      if (id === 'mafia') w *= S.mafiaBoost;
      list.push([id, w]);
    }
    return list;
  }
  spawnPig(type, x, y, o) {
    if (!type) {
      if (this.goldRushT > 0) type = chance(0.7) ? 'golden' : null;
      if (!type) type = weightedPick(this.spawnWeights(), (e) => e[1])[0];
    }
    if (x === undefined) {
      // avoid spawning directly under the hammer
      for (let i = 0; i < 10; i++) {
        x = rand(BOUNDS.x0 + 20, BOUNDS.x1 - 20); y = rand(BOUNDS.y0 + 10, BOUNDS.y1 - 10);
        if (dist(x, y, this.ham.tx, this.ham.ty) > 50) break;
      }
    }
    if (type === 'pink' && this.S.pigletPacks && chance(0.18)) {
      const n = randi(3, 5);
      for (let i = 0; i < n; i++) this.pigs.push(new Pig(this, 'piglet', x + rand(-16, 16), y + rand(-10, 10), { z: rand(120, 220) }));
      return;
    }
    const p = new Pig(this, type, x, y, o);
    this.pigs.push(p);
    if (!P.dex[type]) this.r.newPigs.includes(type) || this.r.newPigs.push(type);
    if (type === 'golden' || type === 'diamond' || type === 'king') {
      this.text(W / 2, 70, type === 'king' ? 'SEINE MAJESTÄT!' : type === 'diamond' ? 'DIAMANTSCHWEIN!' : 'GOLDSCHWEIN!', '#ffe070', { scale: 2, big: true, life: 1.6, vy: 0, gradient: GOLD_GRAD });
      Sound.play('rare');
    } else if (chance(0.25)) Sound.play('oink', null, 0.4);
    Sound.play('whistle', null, 0.15);
  }

  dust(x, y, n = 5, s = 1) { for (let i = 0; i < n; i++) this.parts.push(new Dust(x, y, s)); }
  text(x, y, str, col, o) { this.texts.push(new FloatText(x, y, str, col, o)); }
  shake(a) { if (P.settings.shake) this.shakeAmt = Math.max(this.shakeAmt, a); }

  // ---------------- core loop ----------------
  update(dt) {
    if (this.paused) return;
    if (this.state === 'results') { this.updateResults(dt); return; }
    // hitstop freezes simulation for a few frames (weighty impacts)
    if (this.hitstop > 0) { this.hitstop -= dt; this.updateHammer(dt * 0.15); return; }
    dt *= this.timeScale;
    this.time += dt;
    this.stateT += dt;
    const S = this.S;

    if (this.state === 'intro' && this.stateT > 1.0) { this.state = 'play'; this.stateT = 0; }

    // spawning
    if (this.state !== 'tired') {
      this.spawnT -= dt;
      const alive = this.pigs.filter((p) => !p.dead).length;
      if (this.spawnT <= 0 && alive < S.maxPigs) {
        this.spawnPig();
        this.spawnT = this.initialSpawns-- > 0 ? 0.12 : (1 / S.spawnRate) * (alive < S.maxPigs / 2 ? 0.45 : 1) * (this.goldRushT > 0 ? 0.35 : 1);
      }
      // items
      this.itemT -= dt;
      if (this.itemT <= 0) {
        this.itemT = 1;
        const x = rand(BOUNDS.x0 + 20, BOUNDS.x1 - 20), y = rand(BOUNDS.y0 + 20, BOUNDS.y1 - 10);
        if (S.coffee && chance(0.05 * S.coffee)) this.items.push(new Item(this, 'coffee', x, y));
        else if (S.energy && chance(0.015)) this.items.push(new Item(this, 'energy', x, y));
        else if (chance(0.006 * Math.sqrt(S.luck))) this.items.push(new Item(this, 'lottery', x, y));
      }
      // storm
      if (S.storm) {
        this.stormT -= dt;
        if (this.stormT <= 0) { this.stormT = S.storm; this.stormStrike(); }
      }
    }

    // stamina
    if (this.state === 'play') {
      this.stamina += (S.regen - S.drain) * dt;
      this.stamina = Math.min(this.maxStamina, this.stamina);
      if (this.stamina <= 0) this.outOfStamina();
    }
    this.dispStamina = damp(this.dispStamina, this.stamina, 12, dt);

    // buffs
    for (const k of ['partyT', 'discoT', 'frenzyT', 'coffeeT', 'goldRushT']) this[k] = Math.max(0, this[k] - dt);
    this.stoneCD = Math.max(0, this.stoneCD - dt);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; this.frenzyUsed = false; } }
    this.comboPop = Math.max(0, this.comboPop - dt * 4);
    this.moneyBump = Math.max(0, this.moneyBump - dt * 5);
    this.gemBump = Math.max(0, this.gemBump - dt * 5);
    this.coinStreakT -= dt; if (this.coinStreakT <= 0) this.coinStreak = 0;
    this.dispMoney = this.dispMoney + (P.C.money - this.dispMoney) * Math.min(1, dt * 10);
    if (Math.abs(this.dispMoney - P.C.money) < 1) this.dispMoney = P.C.money;

    this.updateHammer(dt);
    for (let i = 0; i < this.sched.length; i++) {
      const e = this.sched[i];
      e.t -= dt;
      if (e.t <= 0) { this.sched.splice(i, 1); i--; e.fn(); }
    }
    for (const t of this.trail) t.t += dt;
    this.trail = this.trail.filter((t) => t.t < 0.14);
    for (const e of this.echoes) e.t += dt;
    this.echoes = this.echoes.filter((e) => e.t < 0.35);

    for (const p of this.pigs) p.update(dt);
    this.pigs = this.pigs.filter((p) => !p.dead);
    this.loot = this.loot.filter((l) => l.update(dt));
    this.items = this.items.filter((it) => it.update(dt));
    this.stones = this.stones.filter((s) => s.update(dt));
    this.parts = this.parts.filter((p) => p.update(dt));
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
    this.fx = this.fx.filter((f) => f.update(dt));
    this.texts = this.texts.filter((t) => t.update(dt));
    this.decals = this.decals.filter((d) => d.update(dt));

    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 4);

    if (this.state === 'tired') {
      this.timeScale = Math.min(1, this.timeScale + dt * 0.8);
      for (const l of this.loot) if (l.state === 'ground') l.wait = Math.min(l.wait, 0.05);
      if (this.stateT > 2.2 && this.loot.length === 0) this.finish();
    }
    if (Input.key('Escape') || Input.key('p')) this.paused = true;
  }

  // ---------------- hammer ----------------
  updateHammer(dt) {
    const h = this.ham;
    const S = this.S;
    h.tx = clamp(Input.x, 4, W - 4);
    h.ty = clamp(Input.y, 30, H - 2);
    h.x = damp(h.x, h.tx, 40, dt);
    h.y = damp(h.y, h.ty, 40, dt);
    h.t += dt;
    h.cd -= dt;
    const READY = 14, IMPACT = -40;
    let rate = S.swingRate;
    if (this.frenzyT > 0) rate *= 1.6;
    if (this.discoT > 0) rate *= 1.3;
    if (this.coffeeT > 0) rate *= 1 + S.coffeeSpeed;
    if (S.adrenaline && this.stamina < this.maxStamina * 0.3) rate *= 1 + S.adrenaline;
    const period = 1 / rate;
    const down = Math.min(0.06, period * 0.3);
    if (h.phase === 'down') {
      const k = Ease.inQuad(Math.min(1, h.t / down));
      h.ang = lerp(READY + 8, IMPACT, k);
      if (h.t >= down) { h.phase = 'hold'; h.t = 0; this.impact(h.x, h.y); }
    } else if (h.phase === 'hold') {
      h.ang = IMPACT + Math.sin(h.t * 60) * 2;
      if (h.t >= 0.035) { h.phase = 'up'; h.t = 0; }
    } else if (h.phase === 'up') {
      const upDur = Math.max(0.05, period - down - 0.035);
      const k = Ease.outBack(Math.min(1, h.t / upDur));
      h.ang = lerp(IMPACT, READY, k);
      if (h.t >= upDur) { h.phase = 'ready'; h.t = 0; }
    } else if (h.phase === 'ready') {
      h.ang = damp(h.ang, READY + Math.sin(this.time * 3) * 2, 10, dt);
    } else if (h.phase === 'tired') {
      h.ang = damp(h.ang, 70, 3, dt);
    }
    // trigger swings
    const wantSwing = this.state !== 'tired' && this.state !== 'results' && this.time > 0.35 && (Input.down || Input.pressed) && !this.overHud();
    if (wantSwing && h.phase === 'ready') {
      h.phase = 'down'; h.t = 0;
      Sound.play('swing', null, 0.04);
    }
    if (this.state === 'tired') h.phase = 'tired';
    // remember head positions for the swing smear
    const L = Art.hammer(S.hammer.id).len * HS;
    const a0 = (-40 * Math.PI) / 180, a = (h.ang * Math.PI) / 180;
    const px = h.x - Math.sin(a0) * L, py = h.y + Math.cos(a0) * L;
    h.headX = px + Math.sin(a) * L; h.headY = py - Math.cos(a) * L;
    if (h.phase === 'down' || h.phase === 'hold') this.trail.push({ x: h.headX, y: h.headY, t: 0 });
  }

  overHud() {
    const x = Input.x, y = Input.y;
    if (y < 26 && (x < 210 || x > W - 150)) return true;
    if (this.S.stoneRain && x < 48 && y > H - 52) return true;
    if (x > W - 30 && y < 50 && x < W) return false;
    return false;
  }

  impact(x, y) {
    const S = this.S, h = this.ham;
    h.swings++;
    this.r.swings++;
    this.stamina -= S.swingCost;
    if (this.tut && this.r.swings > 3) { this.tut = false; P.tutorial.swing = true; }
    let R = S.radius;
    let dmg = S.damage * (1 + this.coffeeDmg);
    const hm = S.hammer;
    let stamped = false;
    if (hm.stamp && h.swings % hm.stamp === 0) { R *= 2.4; dmg *= 6; stamped = true; }
    const crit = chance(S.crit);
    if (crit) dmg *= S.critMult;
    const hits = [];
    for (const p of this.pigs) {
      if (p.dead || p.z > 16 || p.leaving && (p.x < 0 || p.x > W)) continue;
      const rx = R + p.r * 0.8, ry = R * 0.62 + p.r * 0.45;
      const dx = (p.x - x) / rx, dy = (p.y - 6 * p.s - y) / ry;
      if (dx * dx + dy * dy <= 1) hits.push(p);
    }
    // items
    for (const it of this.items) {
      if (it.z > 10) continue;
      if (Math.abs(it.x - x) < R + 6 && Math.abs(it.y - 6 - y) < R * 0.6 + 8) { it.t = it.life; this.useItem(it); }
    }
    if (hits.length === 1) dmg *= 1 + S.single;

    // FX
    const big = crit || stamped;
    this.fx.push(new Ring(x, y, R * 1.3, crit ? '#ffd040' : '#fff0d0', big ? 0.35 : 0.22, big ? 2 : 1));
    this.dust(x, y, big ? 9 : 5, big ? 1.4 : 1);
    if (big) this.decals.push(new Decal(x, y, true));
    for (let i = 0; i < (big ? 14 : 5); i++) this.parts.push(new Spark(x, y, crit ? '#ffe070' : '#fff4d8', big ? 220 : 120));
    if (stamped) {
      this.text(x, y - 20, 'BEZAHLT!', '#e83a3a', { scale: 2, big: true, life: 1.2, vy: -10 });
      Sound.play('stamp');
    }
    const snd = hm.sound;
    if (snd) Sound.play(snd, null, 0.04);

    if (!hits.length) {
      Sound.play('thud', null, 0.03);
      this.shake(1);
    } else {
      this.combo++;
      this.comboT = S.comboWindow;
      this.comboPop = 1;
      if (this.combo > this.r.maxCombo) this.r.maxCombo = this.combo;
      if (this.combo % 10 === 0) Sound.play('combo', this.combo);
      if (S.frenzy && this.combo >= 40 && !this.frenzyUsed) {
        this.frenzyUsed = true; this.frenzyT = 6;
        this.text(W / 2, 110, 'RASEREI!', '#ff5a3a', { scale: 3, big: true, life: 1.4, vy: -5, gradient: FIRE_GRAD });
        Sound.play('frenzy');
      }
      for (const p of hits) {
        this.damage(p, dmg, { crit, x, y, src: 'hammer' });
        if (hm.stun) p.stun = Math.max(p.stun, hm.stun);
      }
      // double hit
      const dbl = S.double;
      if (dbl > 0 && chance(dbl)) {
        this.later(0.09, () => {
          for (const p of hits) if (!p.dead) this.damage(p, dmg * 0.8, { crit: false, x, y, src: 'double' });
          this.fx.push(new Ring(x, y, R, '#a0d0ff', 0.2));
          Sound.play('hit', 1.2, 0.02);
        });
      }
      if (hm.ban && chance(hm.ban)) {
        const p = pick(hits.filter((q) => !q.dead));
        if (p) { this.text(p.x, p.y - 30, 'GEBANNT!', '#ff3a3a', { scale: 2, big: true }); this.smash(p, { crit: true, src: 'ban' }); }
      }
      this.shake(crit ? 4 : 2);
      if (crit) {
        this.hitstop = 0.055;
        this.r.crits++;
        this.text(x, y - 34, 'KRIT!', '#ffd040', { scale: 1, big: true, life: 0.7, gradient: GOLD_GRAD });
        Sound.play('crit', null, 0.05);
        if (S.critQuake) this.quake(0.35);
      }
    }
    // crit shockwave (forge enchant)
    if (crit && S.shockwave && hits.length) {
      this.fx.push(new Ring(x, y, 80, '#e8e0ff', 0.4, 3));
      for (const p of this.pigs) if (!p.dead && !hits.includes(p) && dist(p.x, p.y, x, y) < 75) this.damage(p, dmg * S.shockwave, { crit: false, x, y, src: 'shock' });
    }
    // echo: a ghost hammer strikes again
    if (S.echo && chance(S.echo)) {
      this.later(0.25, () => {
        this.echoes.push({ x, y, t: 0 });
        this.fx.push(new Ring(x, y, R * 1.2, '#8ac0ff', 0.25, 2));
        for (const p of this.pigs) {
          if (p.dead || p.z > 16) continue;
          const rx = R + p.r * 0.8, ry = R * 0.62 + p.r * 0.45;
          const dx = (p.x - x) / rx, dy = (p.y - 6 * p.s - y) / ry;
          if (dx * dx + dy * dy <= 1) this.damage(p, dmg * 0.7, { crit: false, x, y, src: 'echo' });
        }
        Sound.play('hit', 1.4, 0.02);
      });
    }
    // lightning
    if (S.lightning > 0 && chance(S.lightning)) this.chainLightning(x, y, dmg / (crit ? S.critMult : 1));
    // freeze buildup: chance grows each swing
    if (S.freeze > 0) {
      this.freezeMeter = Math.min(1, this.freezeMeter + S.freeze);
      if (chance(this.freezeMeter * this.freezeMeter) && this.freezeMeter > 0.15) { this.freezeAll(); this.freezeMeter = 0; }
    }
    // earthquake
    if (S.quakeEvery && h.swings % S.quakeEvery === 0) this.quake(S.quakeDmg);
  }

  damage(p, dmg, o) {
    if (p.dead) return;
    const S = this.S;
    if (p.def.ghost && !p.visible) { if (o.src === 'hammer') this.text(p.x, p.y - 26, 'Huch?', '#c8d8ff', { life: 0.6 }); return; }
    if (p.def.dodge && o.src === 'hammer' && chance(p.def.dodge)) {
      for (let i = 0; i < 8; i++) this.parts.push(new Smoke(p.x, p.y - 8, '#8a8098'));
      p.x = rand(BOUNDS.x0 + 20, BOUNDS.x1 - 20); p.y = rand(BOUNDS.y0 + 10, BOUNDS.y1 - 10);
      for (let i = 0; i < 8; i++) this.parts.push(new Smoke(p.x, p.y - 8, '#8a8098'));
      this.text(p.x, p.y - 30, 'Ausgewichen!', '#c0b0ff', { life: 0.8 });
      Sound.play('swing');
      return;
    }
    if (p.def.armor && !o.crit && o.src !== 'stone') dmg *= p.def.armor;
    if (p.frozen > 0) dmg *= 1 + S.freezeVuln;
    p.hp -= dmg;
    p.hitT = 0.15; p.hurtT = 0.3; p.lastHit = p.age;
    if (o.src === 'hammer' || o.src === 'double' || o.src === 'echo') {
      if (S.vamp) this.stamina = Math.min(this.maxStamina, this.stamina + S.vamp);
      if (S.burn) p.burn = { t: 2, dps: dmg * S.burn, tick: 0.4 };
      if (S.goldTouch) {
        const v = p.value * S.coinMult * S.goldTouch;
        this.loot.push(new Loot(this, p.x, p.y - 8, 8, 'coin', v, { metal: 'gold', spread: 60 }));
      }
    }
    p.kick(o.crit ? 9 : 6);
    if (o.x !== undefined) {
      const a = Math.atan2(p.y - o.y, p.x - o.x);
      const f = (o.crit ? 120 : 70) / p.s;
      p.kx += Math.cos(a) * f; p.ky += Math.sin(a) * f * 0.6;
    }
    if (o.src === 'burn' && p.dead) return;
    if (!p.awake) { p.awake = true; p.speed = 42; this.text(p.x, p.y - 30, '!?', '#ffffff'); Sound.play('oink'); }
    if (P.settings.numbers) {
      const nc = o.crit ? '#ffd040' : o.src === 'lightning' ? '#8ae8ff' : o.src === 'burn' ? '#ff9a4a' : o.src === 'echo' ? '#8ac0ff' : '#ffffff';
      if (o.src !== 'burn' || chance(0.5)) this.text(p.x + rand(-6, 6), p.y - 24 * p.s - p.z, fmt(Math.max(1, Math.round(dmg))), nc, { life: 0.55, vy: -55, scale: 1 });
    }
    // cracks
    const frac = Math.max(0, p.hp / p.maxHp);
    const stage = frac < 0.25 ? 3 : frac < 0.55 ? 2 : frac < 0.85 ? 1 : 0;
    while (p.crackStage < stage) { p.crackStage++; p.addCracks(p.crackStage === 1 ? 1 : 2); for (let i = 0; i < 3; i++) this.parts.push(new Shard(p.x, p.y, 10 * p.s, pick(Art.pigShardColors(p.type)))); }
    if (S.execute && frac < S.execute && frac > 0) { p.hp = 0; this.text(p.x, p.y - 34, 'GNADENSTOSS', '#ff7a7a', { life: 0.7 }); }
    if (p.def.zap && o.src !== 'lightning') this.chainLightning(p.x, p.y - 8, dmg * 0.5, 1, p);
    if (p.hp <= 0) this.smash(p, o);
    else Sound.play(p.def.sound || 'hit', p.def.sound ? undefined : rand(0.9, 1.15), 0.025);
  }

  smash(p, o = {}) {
    if (p.dead) return;
    const S = this.S;
    if (p.def.revive && !p.revived) {
      p.revived = true; p.hp = p.maxHp * 0.5; p.crackStage = 0; p.cracks = [];
      this.text(p.x, p.y - 30, 'Uuurgh...', '#9ab87a');
      p.kick(-8); p.vz = 120;
      Sound.play('oink');
      return;
    }
    p.dead = true;
    this.r.pigs++;
    P.stats.pigs++;
    P.dex[p.type] = (P.dex[p.type] || 0) + 1;
    if (P.dex[p.type] === 1) {
      UI.toast({ title: 'Neu entdeckt!', text: PIGS[p.type].name, icon: Art.pig(p.type, 0).canvas, color: '#ff9ac0' });
    }
    const cx = p.x, cy = p.y - 8 * p.s;
    // value
    let value = p.value * S.coinMult * (1 + this.combo * S.comboCoin);
    if (this.partyT > 0) value *= 1.5;
    if (o.src === 'stone') value *= 1 + S.stoneGold;
    let jackpot = chance(S.jackpotChance);
    if (jackpot) {
      value *= S.jackpotMult;
      this.r.jackpots++; P.stats.jackpots++;
      this.text(W / 2, 92, 'JACKPOT', '#ffb020', { scale: 4, big: true, life: 1.8, vy: -6, gradient: FIRE_GRAD });
      this.text(W / 2 + 70, 118, 'x' + Math.round(S.jackpotMult), '#ffe070', { scale: 2, big: true, life: 1.8, vy: -6, gradient: GOLD_GRAD });
      Sound.play('jackpot');
      this.flash = 0.7; this.flashCol = '#fff0a0';
      this.hitstop = 0.12;
      this.shake(7);
      for (let i = 0; i < 40; i++) this.parts.push(new Confetti(cx, cy));
      for (let i = 0; i < S.jackpotGems; i++) this.loot.push(new Loot(this, cx, cy, 10, 'gem', 1, { gem: pick(['ruby', 'emerald', 'sapphire']), jackpot: true }));
    }
    // coins
    const n = clamp(Math.round(3 + Math.log2(p.def.value + 1) * 1.4), 3, 18) + (jackpot ? 26 : 0);
    const each = value / n;
    for (let i = 0; i < n; i++) {
      const metal = pick(p.def.coins);
      this.loot.push(new Loot(this, cx, cy, 8, metal === 'cash' ? 'cash' : 'coin', each, { metal, jackpot, spread: jackpot ? 200 : 110 }));
    }
    // gems
    let gems = chance(S.gemChance) ? 1 : 0;
    if (p.def.gems) gems += randi(p.def.gems[0], p.def.gems[1]);
    for (let i = 0; i < gems; i++) {
      const g = p.def.diamonds && chance(0.5) ? 'diamond' : weightedPick([['ruby', 60], ['emerald', 25], ['sapphire', 12], ['amethyst', 6], ['diamond', 1.5]], (e) => e[1])[0];
      this.loot.push(new Loot(this, cx, cy, 10, 'gem', { ruby: 1, emerald: 2, sapphire: 3, amethyst: 5, diamond: 10 }[g], { gem: g }));
    }
    // rare coin
    let rc = S.rareChance * (p.def.value > 200 ? 3 : 1) * (p.def.rareBoost || 1);
    if (chance(rc)) {
      const r = weightedPick(RARE_COINS, (c) => RARE_WEIGHTS[c.r] * (c.r >= 3 ? Math.sqrt(S.luck) : 1));
      this.loot.push(new Loot(this, cx, cy, 10, 'rare', 0, { id: r.id }));
      Sound.play('rare');
      for (let i = 0; i < 6; i++) this.parts.push(new Sparkle(cx + rand(-10, 10), cy + rand(-10, 10)));
    }
    // stamina back
    if (S.staminaPerSmash) {
      this.stamina = Math.min(this.maxStamina, this.stamina + S.staminaPerSmash);
    }
    // shards & FX
    const cols = Art.pigShardColors(p.type);
    for (const c of Art.pigChunks(p.type)) this.parts.push(new Chunk(c, p.x, p.y, p.face, jackpot ? 1.6 : 1));
    const nShards = Math.round(10 * p.s * (p.def.fragile ? 1.8 : 1));
    for (let i = 0; i < nShards; i++) this.parts.push(new Shard(cx + rand(-6, 6) * p.s, cy, rand(4, 14) * p.s, pick(cols), i < 5));
    for (let i = 0; i < 6; i++) this.parts.push(new Dust(cx, p.y, 1.3 * p.s));
    this.fx.push(new Ring(cx, p.y, 26 * p.s, '#ffffff', 0.3, 2));
    this.text(cx, cy - 22 * p.s, '+' + fmt(value), jackpot ? '#ffe070' : '#ffe9a8', { life: 1.1, vy: -30, scale: jackpot ? 2 : 1, big: jackpot, gradient: GOLD_GRAD });
    Sound.play('smash', p.sr > 1.2 ? 1.6 : 1, 0.03);
    this.shake(p.sr > 1.2 ? 4 : 2);
    if (p.sr > 1.2 && !jackpot) this.hitstop = Math.max(this.hitstop, 0.05);
    // specials
    if (p.type === 'party') { this.partyT = 5; for (let i = 0; i < 40; i++) this.parts.push(new Confetti(cx, cy)); this.text(cx, cy - 34, 'PARTY! x1.5', '#ff8ad0', { big: true, life: 1.2 }); Sound.play('confetti'); }
    if (p.type === 'disco') { this.discoT = 6; for (let i = 0; i < 30; i++) this.parts.push(new Confetti(cx, cy)); this.text(cx, cy - 34, 'DISCO-FIEBER!', '#c07af0', { big: true, life: 1.2 }); Sound.play('frenzy'); }
    if (p.def.taxman) { this.text(cx, cy - 40, 'Steuern zurück!', '#7af07a', { big: true }); }
    if (p.def.explode || (S.bombChance && chance(S.bombChance))) this.explode(cx, p.y, S.damage * 5, p.s);
    if (p.def.piglets) {
      const k = randi(3, 5);
      for (let i = 0; i < k; i++) {
        const a = rand(TAU);
        this.pigs.push(new Pig(this, 'piglet', cx, p.y, { z: 4, vz: rand(150, 240), kx: Math.cos(a) * 90, ky: Math.sin(a) * 60 }));
      }
      Sound.play('oink');
    }
    if (p.def.split) {
      for (let i = 0; i < 2; i++) this.pigs.push(new Pig(this, p.def.split, cx + (i ? 8 : -8), p.y, { z: 4, vz: rand(180, 260), kx: (i ? 1 : -1) * 90, ky: rand(-30, 30) }));
      this.text(cx, cy - 30, 'HUP HUP!', '#ff4a8a', { big: true });
      Sound.play('squeak'); Sound.play('confetti');
      for (let i = 0; i < 20; i++) this.parts.push(new Confetti(cx, cy));
    }
    if (S.goldRush && chance(S.goldRush)) {
      this.goldRushT = 4;
      this.text(W / 2, 100, 'GOLDRAUSCH!', '#ffe070', { scale: 3, big: true, life: 1.5, gradient: GOLD_GRAD });
      Sound.play('jackpot');
    }
  }

  escaped(p) {
    p.dead = true;
    this.r.escaped++; P.stats.escaped++;
    if (p.def.taxman) {
      const pen = Math.floor(this.r.earned * 0.1);
      if (pen > 0) {
        P.C.money = Math.max(0, P.C.money - pen); this.r.earned -= pen;
        this.text(MONEY_POS.x - 20, MONEY_POS.y + 30, '-' + money(pen) + ' gepfändet', '#ff5a4a', { life: 1.6, vy: 10 });
        Sound.play('error');
      }
    }
  }
  poof(p) {
    p.dead = true;
    for (let i = 0; i < 12; i++) this.parts.push(new Sparkle(p.x + rand(-12, 12), p.y - rand(0, 20)));
    for (let i = 0; i < 6; i++) this.parts.push(new Smoke(p.x, p.y - 8, '#e8e0c0'));
    this.text(p.x, p.y - 30, 'Weg!', '#ffe070');
    Sound.play('escape');
  }

  explode(x, y, dmg, s = 1) {
    Sound.play('explode', null, 0.05);
    this.shake(6);
    this.flash = Math.max(this.flash, 0.4); this.flashCol = '#ffb060';
    this.fx.push(new Ring(x, y, 62, '#ffb030', 0.35, 3));
    this.fx.push(new Ring(x, y, 40, '#fff4b0', 0.25, 2));
    for (let i = 0; i < 26; i++) this.parts.push(new Fire(x, y - 6));
    for (let i = 0; i < 10; i++) this.parts.push(new Smoke(x, y - 10, '#3a2a28', 1.5));
    this.decals.push(new Decal(x, y, true));
    for (const q of this.pigs) {
      if (q.dead || q.z > 20) continue;
      if (dist(q.x, q.y, x, y) < 58) this.later(0.06, () => this.damage(q, dmg, { crit: false, x, y, src: 'bomb' }));
    }
  }

  quake(mult = 1) {
    Sound.play('quake', null, 0.1);
    this.shake(5);
    this.fx.push(new Ring(this.ham.x, this.ham.y, 300, '#e8c890', 0.5, 3));
    for (const p of this.pigs) {
      if (p.dead || p.z > 20) continue;
      p.vz = 140; p.kick(-5);
      this.damage(p, this.S.damage * mult * 0.6, { crit: false, src: 'quake' });
    }
  }

  chainLightning(x, y, baseDmg, jumps, fromPig) {
    const S = this.S;
    jumps = jumps || S.chains + 1;
    const range = S.tesla ? 170 : 95;
    const hit = new Set(fromPig ? [fromPig] : []);
    const pts = [[x, y]];
    let cx = x, cy = y;
    for (let i = 0; i < jumps; i++) {
      let best = null, bd = range;
      for (const p of this.pigs) {
        if (p.dead || hit.has(p) || p.z > 20) continue;
        const d = dist(cx, cy, p.x, p.y - 8);
        if (d < bd) { bd = d; best = p; }
      }
      if (!best) break;
      hit.add(best);
      pts.push([best.x, best.y - 8 * best.s]);
      cx = best.x; cy = best.y - 8;
      const crit = S.lightningCrit && chance(S.crit);
      this.damage(best, baseDmg * S.lightningDmg * (crit ? S.critMult : 1), { crit, src: 'lightning' });
      if (S.tesla) best.stun = Math.max(best.stun, 1);
    }
    if (pts.length > 1) {
      this.fx.push(new Bolt(pts));
      Sound.play('zap', null, 0.06);
      for (const [px, py] of pts) for (let i = 0; i < 4; i++) this.parts.push(new Spark(px, py, '#8ae8ff', 140));
    }
  }
  stormStrike() {
    const targets = this.pigs.filter((p) => !p.dead && p.z < 10);
    if (!targets.length) return;
    const p = pick(targets);
    this.fx.push(new Bolt([[p.x + rand(-30, 30), -10], [p.x + rand(-10, 10), p.y / 2], [p.x, p.y - 8]], '#c8f0ff', 0.3));
    this.flash = Math.max(this.flash, 0.25); this.flashCol = '#c8f0ff';
    Sound.play('zap');
    this.damage(p, this.S.damage * this.S.lightningDmg * 2, { crit: false, x: p.x, y: p.y, src: 'lightning' });
    for (let i = 0; i < 10; i++) this.parts.push(new Spark(p.x, p.y - 8, '#c8f0ff', 200));
  }

  freezeAll() {
    const S = this.S;
    Sound.play('freeze');
    this.flash = 0.6; this.flashCol = '#c8f0ff';
    this.text(W / 2, 110, 'TIEFGEFROREN!', '#bfe8ff', { scale: 2, big: true, life: 1.2, gradient: ICE_GRAD });
    for (const p of this.pigs) {
      if (p.dead) continue;
      p.frozen = S.freezeDur;
      p.kick(4);
      for (let i = 0; i < 4; i++) this.parts.push(new Spark(p.x, p.y - 10, '#e8f8ff', 80));
    }
  }
  unfreezePig(p) {
    p.frozen = 0;
    for (let i = 0; i < 6; i++) this.parts.push(new Shard(p.x, p.y, 8, pick(['#c8f0ff', '#ffffff', '#8ad0f0'])));
    Sound.play('shatterIce', null, 0.08);
  }

  useItem(it) {
    const S = this.S;
    it.dead = true;
    if (it.kind === 'coffee') {
      const amt = 12 * S.coffeeAmt;
      this.stamina = Math.min(this.maxStamina, this.stamina + amt);
      this.coffeeT = 5; this.r.coffee++;
      this.coffeeDmg += S.coffeeAddict;
      this.text(it.x, it.y - 20, '+' + Math.round(amt) + ' Ausdauer', '#ffd8a0', { big: true });
      Sound.play('drink');
      for (let i = 0; i < 10; i++) this.parts.push(new Shard(it.x, it.y, 6, pick(['#ffffff', '#e8e2d8', '#5a3420'])));
    } else if (it.kind === 'energy') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 40);
      this.frenzyT = 6;
      this.text(it.x, it.y - 20, 'ENERGIE!', '#7aff8a', { big: true, scale: 2 });
      Sound.play('frenzy'); Sound.play('drink');
    } else {
      const roll = Math.random();
      if (roll < 0.45) {
        const v = 40 * pigScale(P.C.billIdx).value * S.coinMult;
        for (let i = 0; i < 20; i++) this.loot.push(new Loot(this, it.x, it.y - 6, 6, 'coin', v / 20, { metal: 'gold', spread: 150 }));
        this.text(it.x, it.y - 24, 'GEWINN!', '#ffe070', { big: true, scale: 2, gradient: GOLD_GRAD });
        Sound.play('jackpot');
      } else if (roll < 0.7) {
        const k = randi(3, 8);
        for (let i = 0; i < k; i++) this.loot.push(new Loot(this, it.x, it.y - 6, 6, 'gem', 2, { gem: pick(['emerald', 'sapphire', 'ruby']) }));
        this.text(it.x, it.y - 24, 'Edelsteine!', '#8ae8ff', { big: true });
        Sound.play('gem');
      } else if (roll < 0.85) {
        const r = weightedPick(RARE_COINS, (c) => RARE_WEIGHTS[c.r]);
        this.loot.push(new Loot(this, it.x, it.y - 6, 6, 'rare', 0, { id: r.id }));
        this.text(it.x, it.y - 24, 'Rarität!', '#c07af0', { big: true });
        Sound.play('rare');
      } else {
        this.text(it.x, it.y - 24, 'Niete...', '#a8927a', { big: true });
        Sound.play('error');
      }
      for (let i = 0; i < 12; i++) this.parts.push(new Confetti(it.x, it.y - 6));
    }
  }

  // stone rain ability
  castStones() {
    const S = this.S;
    if (!S.stoneRain || this.stoneCD > 0 || this.state !== 'play') return;
    this.stoneCD = S.stoneCD;
    const targets = this.pigs.filter((p) => !p.dead);
    for (let i = 0; i < S.stones; i++) {
      const p = targets.length ? targets[i % targets.length] : null;
      const x = p ? p.x + rand(-6, 6) : rand(BOUNDS.x0, BOUNDS.x1), y = p ? p.y + rand(-4, 4) : rand(BOUNDS.y0, BOUNDS.y1);
      this.stones.push(new Stone(this, x, y, i * 0.09 + rand(0, 0.05)));
    }
    if (S.meteor) {
      const best = targets.sort((a, b) => b.value - a.value)[0];
      this.stones.push(new Stone(this, best ? best.x : W / 2, best ? best.y : H / 2 + 40, S.stones * 0.09 + 0.3, true));
    }
    Sound.play('whistle');
    this.text(28, H - 60, 'STEINREGEN!', '#d8c8b0', { big: true, life: 0.9 });
  }
  stoneImpact(s) {
    const S = this.S;
    const R = s.meteor ? 60 : 24;
    Sound.play(s.meteor ? 'explode' : 'stone', null, 0.04);
    this.shake(s.meteor ? 8 : 2.5);
    this.fx.push(new Ring(s.x, s.y, R * 1.2, s.meteor ? '#ffb030' : '#d8c8b0', 0.3, s.meteor ? 3 : 1));
    for (let i = 0; i < (s.meteor ? 14 : 6); i++) this.parts.push(new Shard(s.x, s.y, 4, pick(['#8a827a', '#6a625c', '#b0a8a0']), true));
    this.dust(s.x, s.y, s.meteor ? 14 : 5, s.meteor ? 2 : 1);
    this.decals.push(new Decal(s.x, s.y, s.meteor));
    if (s.meteor) { for (let i = 0; i < 30; i++) this.parts.push(new Fire(s.x, s.y - 6)); this.flash = 0.5; this.flashCol = '#ffb060'; }
    const dmg = S.damage * S.stoneDmg * (s.meteor ? 6 : 1);
    for (const p of this.pigs) {
      if (p.dead || p.z > 20) continue;
      const dx = (p.x - s.x) / (R + p.r * 0.6), dy = (p.y - s.y) / (R * 0.62 + p.r * 0.4);
      if (dx * dx + dy * dy <= 1) this.damage(p, dmg, { crit: false, x: s.x, y: s.y, src: 'stone' });
    }
  }

  collect(l) {
    const S = this.S;
    if (l.kind === 'coin' || l.kind === 'cash') {
      P.C.money += l.value;
      this.r.earned += l.value;
      P.stats.moneyTotal += l.value;
      this.moneyBump = 1;
      this.coinStreak++; this.coinStreakT = 0.35;
      Sound.play(l.kind === 'cash' ? 'cash' : 'coin', Math.min(24, Math.floor(this.coinStreak / 2)), 0.035);
      this.parts.push(new Spark(MONEY_POS.x - 30, MONEY_POS.y, '#ffe070', 60));
    } else if (l.kind === 'gem') {
      P.gems += l.value; P.stats.gemsTotal += l.value;
      this.r.gems += l.value;
      this.gemBump = 1;
      Sound.play('gem', null, 0.05);
    } else if (l.kind === 'rare') {
      const c = RARE_BY_ID[l.o.id];
      const had = P.collection[c.id];
      P.collection[c.id] = (had || 0) + 1;
      P.stats.rareFound++;
      this.r.rares.push(c.id);
      for (let i = 0; i < 16; i++) this.parts.push(new Sparkle(l.x + rand(-20, 20), l.y + rand(-20, 20)));
      if (!had) {
        UI.toast({ title: 'Seltene Münze: ' + c.name, text: bonusText(c.bonus) + ' (dauerhaft)', icon: Art.rareCoin(c, 12), color: RARITY[c.r].color, life: 4 });
        Sound.play('achievement');
      } else {
        const g = c.r * 3;
        P.gems += g; P.stats.gemsTotal += g; this.r.gems += g;
        UI.toast({ title: 'Duplikat: ' + c.name, text: `Eingeschmolzen: +${g} ♦`, icon: Art.rareCoin(c, 12), color: RARITY[c.r].color });
      }
    }
  }

  outOfStamina() {
    if (this.S.secondWind > 0 && !this.secondWindUsed) {
      this.secondWindUsed = true;
      this.stamina = this.maxStamina * this.S.secondWind;
      this.text(W / 2, 120, 'ZWEITER ATEM!', '#ff8a8a', { scale: 2, big: true, life: 1.3 });
      Sound.play('record');
      return;
    }
    this.stamina = 0;
    this.state = 'tired'; this.stateT = 0;
    this.timeScale = 0.3;
    Sound.play('tired');
    this.text(W / 2, H / 2 - 20, 'FEIERABEND!', '#ffb050', { scale: 3, big: true, life: 2, vy: -4, gradient: FIRE_GRAD });
    this.text(W / 2, H / 2 + 12, 'Deine Hand ist müde...', '#f3e6cf', { life: 2, vy: -4 });
  }

  // ---------------- run end / results ----------------
  finish() {
    const S = this.S;
    const r = this.r;
    const bonus = Math.floor(r.earned * S.endBonus);
    const interest = Math.floor(this.moneyBefore * S.interest);
    P.C.money += bonus + interest;
    P.stats.runs++;
    P.stats.bestCombo = Math.max(P.stats.bestCombo, r.maxCombo);
    P.stats.bestRun = Math.max(P.stats.bestRun, r.earned + bonus);
    P.C.runs++;
    P.C.earnedCycle += r.earned + bonus + interest;
    P.C.day++;
    P.C.dueDays--;
    saveGame();
    this.state = 'results'; this.stateT = 0;
    this.results = {
      rows: [
        { label: 'Verdient', val: r.earned, money: true, col: '#ffe070' },
        { label: 'Feierabend-Bonus', val: bonus, money: true, col: '#9af08a', hide: !S.endBonus },
        { label: 'Zinsen', val: interest, money: true, col: '#9af08a', hide: !S.interest },
        { label: 'Schweine zerschlagen', val: r.pigs },
        { label: 'Kritische Treffer', val: r.crits },
        { label: 'Beste Combo', val: r.maxCombo },
        { label: 'Jackpots', val: r.jackpots, hide: !r.jackpots, col: '#ffb020' },
        { label: 'Edelsteine', val: r.gems, gem: true, col: '#8ae8ff' },
      ].filter((x) => !x.hide),
      t: 0,
      total: r.earned + bonus + interest,
    };
    this.newAch = checkAchievements();
    Sound.Music.play('menu');
  }
  updateResults(dt) {
    this.results.t += dt;
    this.parts = this.parts.filter((p) => p.update(dt));
    this.texts = this.texts.filter((t) => t.update(dt));
    this.fx = this.fx.filter((f) => f.update(dt));
  }

  // ---------------- drawing ----------------
  draw(ctx) {
    const S = this.S;
    // camera shake
    this.camX = (Math.random() - 0.5) * this.shakeAmt * 2;
    this.camY = (Math.random() - 0.5) * this.shakeAmt * 2;
    ctx.save();
    ctx.translate(this.camX, this.camY);
    ctx.drawImage(Art.table(), 0, 0);
    // disco lights
    if (this.discoT > 0) {
      for (let i = 0; i < 5; i++) {
        const a = this.time * 1.5 + i * 1.3;
        ctx.globalAlpha = 0.12 * Math.min(1, this.discoT);
        ctx.fillStyle = ['#ff5a8a', '#5ae0ff', '#ffe04a', '#7af07a', '#c07af0'][i];
        ctx.beginPath(); ctx.ellipse(W / 2 + Math.cos(a) * 200, H / 2 + Math.sin(a * 1.3) * 100, 70, 40, 0, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    for (const d of this.decals) d.draw(ctx);
    // shadows
    for (const p of this.pigs) p.drawShadow(ctx);
    // ground layer sorted by y
    const layer = [];
    for (const p of this.pigs) layer.push(p);
    for (const it of this.items) layer.push(it);
    for (const l of this.loot) if (l.state !== 'fly') layer.push(l);
    layer.sort((a, b) => a.y - b.y);
    for (const e of layer) e.draw(ctx, this);
    for (const s of this.stones) s.draw(ctx);
    for (const p of this.parts) p.draw(ctx);
    for (const f of this.fx) f.draw(ctx);
    for (const l of this.loot) if (l.state === 'fly') l.draw(ctx);
    if (this.state !== 'results') this.drawHammer(ctx);
    for (const t of this.texts) t.draw(ctx);
    ctx.restore();

    // screen overlays
    if (this.flash > 0) { ctx.globalAlpha = Math.min(0.6, this.flash * 0.6); ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (this.frenzyT > 0) this.vignette(ctx, '#ff4a1a', 0.35 * Math.min(1, this.frenzyT));
    if (this.goldRushT > 0) this.vignette(ctx, '#ffd040', 0.3 * Math.min(1, this.goldRushT));
    if (this.stamina < this.maxStamina * 0.2 && this.state === 'play') this.vignette(ctx, '#c01a1a', 0.15 + Math.sin(this.time * 8) * 0.08);

    this.drawHud(ctx);
    if (this.state === 'intro') this.drawIntro(ctx);
    if (this.tut && this.state === 'play') {
      const a = 0.6 + Math.sin(this.time * 5) * 0.4;
      Font.draw(ctx, Input.isTouch ? 'Tippe & halte, um zuzuschlagen!' : 'Halte die Maustaste gedrückt, um zuzuschlagen!', W / 2, H - 26, { align: 'center', color: '#ffe9a8', shadow: 'outline', alpha: a });
    }
    if (this.state === 'results') this.drawResults(ctx);
    if (this.paused) this.drawPause(ctx);
  }

  vignette(ctx, col, a) {
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, col);
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawHammer(ctx) {
    const h = this.ham, S = this.S;
    const id = S.hammer.id;
    const ham = Art.hammer(id);
    const IMPACT = -40;
    const L = ham.len * HS;
    const a = (IMPACT * Math.PI) / 180;
    // pivot so that the head lands exactly on the cursor at impact
    const px = h.x - Math.sin(a) * L, py = h.y + Math.cos(a) * L;
    // reticle
    if (this.state === 'play' || this.state === 'intro') {
      const R = S.radius;
      const hov = this.pigs.some((p) => !p.dead && Math.abs(p.x - h.tx) < R + p.r && Math.abs(p.y - 6 - h.ty) < R * 0.62 + p.r * 0.5);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = hov ? '#ffd040' : '#f3e6cf';
      ctx.setLineDash([3, 3]); ctx.lineDashOffset = -this.time * 12;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(sp(h.x), sp(h.y), R, R * 0.62, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    // head shadow grows as the hammer comes down
    const down = clamp((14 - h.ang) / 54, 0, 1);
    ctx.fillStyle = `rgba(10,4,2,${0.18 + down * 0.25})`;
    ctx.beginPath(); ctx.ellipse(sp(h.x), sp(h.y + 1), 6 + down * 6, 2 + down * 2.5, 0, 0, TAU); ctx.fill();
    // electric glow for lightning builds
    if (S.lightning > 0.2 || id === 'mjolnir') {
      if (chance(0.3)) this.parts.push(new Spark(h.headX + rand(-12, 12), h.headY + rand(-8, 8), '#8ae8ff', 40));
    }
    // swing smear
    if (this.trail.length > 1) {
      const col = S.burn ? '#ffb060' : S.stars >= 5 ? '#ffe070' : '#fff4e0';
      for (let i = 1; i < this.trail.length; i++) {
        const a1 = this.trail[i - 1], a2 = this.trail[i];
        ctx.globalAlpha = 0.5 * (1 - a2.t / 0.14);
        ctx.strokeStyle = col; ctx.lineWidth = 6 * (1 - a2.t / 0.14) + 1;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sp(a1.x), sp(a1.y)); ctx.lineTo(sp(a2.x), sp(a2.y)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // echo ghost hammers
    for (const e of this.echoes) {
      const ef = Art.hammerRot(id, -40);
      ctx.globalAlpha = 0.45 * (1 - e.t / 0.35);
      ctx.save(); ctx.translate(sp(e.x - Math.sin(a) * L), sp(e.y + Math.cos(a) * L)); ctx.scale(HS, HS);
      ctx.drawImage(Art.tint('ham' + id, ef.canvas, 'ice'), -ef.ox, -ef.oy);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // star aura
    if (S.stars > 0) {
      const col = HAMMER_STARS[S.stars - 1].color;
      const hx = h.headX, hy = h.headY;
      const g = ctx.createRadialGradient(hx, hy, 1, hx, hy, 10 + S.stars * 3);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.time * 6);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 10 + S.stars * 3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      if (S.stars >= 3 && chance(0.25)) this.parts.push(new Sparkle(hx + rand(-10, 10), hy + rand(-8, 8)));
    }
    if (S.burn && chance(0.4)) this.parts.push(new Fire(h.headX + rand(-6, 6), h.headY + rand(-4, 4)));
    const fr = Art.hammerRot(id, h.ang);
    ctx.save(); ctx.translate(sp(px), sp(py)); ctx.scale(HS, HS);
    ctx.drawImage(fr.canvas, -fr.ox, -fr.oy);
    ctx.restore();
  }

  drawHud(ctx) {
    const S = this.S;
    const hg = ctx.createLinearGradient(0, 0, 0, 48);
    hg.addColorStop(0, 'rgba(10,5,3,0.75)'); hg.addColorStop(1, 'rgba(10,5,3,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 48);
    // ---- stamina ----
    const lowSt = this.stamina < this.maxStamina * 0.25;
    Font.draw(ctx, 'Ausdauer:', 8, 6, { color: '#ffffff', shadow: 'outline' });
    Font.draw(ctx, `${Math.max(0, Math.ceil(this.stamina))}/${this.maxStamina}`, 66, 6, { color: lowSt && Math.floor(this.time * 6) % 2 ? '#ff6a5a' : '#f2c66d', shadow: 'outline' });
    const bw = 190;
    UI.bar(ctx, 8, 18, bw, 6, this.dispStamina / this.maxStamina, lowSt ? '#e8503e' : '#f0b030', { segments: 10 });
    if (this.stamina < this.dispStamina - 0.5) {
      ctx.fillStyle = '#fff4c8';
      const x0 = 8 + Math.round((bw * this.stamina) / this.maxStamina);
      ctx.fillRect(x0, 18, Math.max(0, Math.round((bw * this.dispStamina) / this.maxStamina) - (x0 - 8)), 6);
    }
    // buffs
    let bx = 8;
    const buff = (icon, t, max, col) => {
      if (t <= 0) return;
      ctx.drawImage(Art.icon(icon), bx, 30);
      UI.bar(ctx, bx, 44, 12, 2, t / max, col);
      bx += 16;
    };
    buff('star', this.partyT, 5, '#ff8ad0');
    buff('star', this.discoT, 6, '#c07af0');
    buff('fire', this.frenzyT, 6, '#ff5a3a');
    buff('coffee', this.coffeeT, 5, '#c08a54');
    buff('coins', this.goldRushT, 4, '#ffe070');
    if (S.freeze > 0) {
      ctx.drawImage(Art.icon('snow'), 204, 14);
      UI.bar(ctx, 218, 18, 28, 4, this.freezeMeter, '#9ae0ff');
    }

    // ---- money ----
    const bump = this.moneyBump;
    UI.panel(ctx, W - 122, 3, 118, 24, { fill: '#2a1d17', border: '#8a6a4a' });
    ctx.drawImage(Art.coin('gold', Math.floor(this.time * 10) % 6), W - 116, 10);
    Font.drawScaled(ctx, money(this.dispMoney), W - 60, 16, 1 + bump * 0.18, { color: '#ffffff', scale: 1, shadow: 'outline' });
    Font.draw(ctx, '+' + money(this.r.earned), W - 8, 31, { align: 'right', color: '#9af08a', shadow: 'outline' });
    ctx.drawImage(Art.gem('ruby', 0), W - 122, 30);
    Font.drawScaled(ctx, fmt(P.gems), W - 104, 35, 1 + this.gemBump * 0.3, { color: '#ff9aa0', shadow: 'outline' });

    // ---- combo ----
    if (this.combo >= 2) {
      const c = this.combo;
      const col = c >= 100 ? '#ff4a8a' : c >= 50 ? '#ff7a2a' : c >= 25 ? '#ffd040' : '#ffffff';
      const k = 1 + this.comboPop * 0.35;
      Font.drawScaled(ctx, 'x' + c, W - 40, 62, k, { scale: 2, color: col, shadow: 'thick', gradient: c >= 25 ? FIRE_GRAD : null });
      Font.draw(ctx, 'COMBO', W - 40, 76, { align: 'center', color: '#f3e6cf', shadow: 'outline' });
      UI.bar(ctx, W - 62, 88, 44, 2, this.comboT / S.comboWindow, col);
      if (S.comboCoin) Font.draw(ctx, '+' + Math.round(c * S.comboCoin * 100) + '% $', W - 40, 94, { align: 'center', color: '#9af08a', shadow: 'outline' });
    }

    // ---- day / bill ----
    const b = this.bill;
    const info = `Tag ${P.C.day}  ·  ${b.name} ${money(b.amount)}  ·  ${P.C.dueDays <= 1 ? 'fällig HEUTE' : 'in ' + P.C.dueDays + ' Tagen'}`;
    Font.draw(ctx, info, W / 2 + 10, 6, { align: 'center', color: P.C.dueDays <= 1 && P.C.money < b.amount ? '#ff8a6a' : '#c8b8a0', shadow: 'outline' });
    UI.bar(ctx, W / 2 - 50, 18, 120, 3, P.C.money / b.amount, P.C.money >= b.amount ? '#6fd65a' : '#e0a84a');

    // ---- ability ----
    if (S.stoneRain) {
      const x = 8, y = H - 44, s = 36;
      const ready = this.stoneCD <= 0;
      const r = UI.region('stone', x, y, s, s);
      UI.panel(ctx, x, y, s, s, { fill: ready ? '#3a2a20' : '#1a120e', border: ready ? '#e0a84a' : '#5a4a3e' });
      ctx.drawImage(ready ? Art.icon('rock', 2) : Art.iconGray('rock'), ready ? x + 6 : x + 12, ready ? y + 6 : y + 12);
      if (!ready) {
        const f = this.stoneCD / S.stoneCD;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x + 2, y + 2, s - 4, Math.round((s - 4) * f));
        Font.draw(ctx, Math.ceil(this.stoneCD) + '', x + s / 2, y + s / 2 - 4, { align: 'center', color: '#ffffff', shadow: 'outline' });
      } else if (Math.floor(this.time * 2) % 2) {
        ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      }
      if (!Input.isTouch) Font.draw(ctx, 'LEER', x + s / 2, y + s + 1, { align: 'center', color: T.dim, shadow: 'outline' });
      if ((r.click || Input.key(' ')) && ready) this.castStones();
    }
    // pause button
    if (UI.iconButton(ctx, 'pause', W - 150, 4, 20, PAUSE_ICON(), { tip: 'Pause [Esc]' })) this.paused = true;
  }

  drawIntro(ctx) {
    const t = this.stateT;
    const k = t < 0.25 ? Ease.outBack(t / 0.25) : 1;
    const a = clamp((1 - t) * 3, 0, 1);
    Font.drawScaled(ctx, 'TAG ' + P.C.day, W / 2, H / 2 - 30, k, { scale: 3, color: '#ffe9a8', shadow: 'thick', alpha: a, gradient: GOLD_GRAD });
    if (t > 0.45) Font.drawScaled(ctx, 'LOS!', W / 2, H / 2 + 10, Ease.outBack(Math.min(1, (t - 0.45) / 0.2)) * 1, { scale: 2, color: '#ffffff', shadow: 'thick', alpha: a });
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(10,5,4,0.7)'; ctx.fillRect(0, 0, W, H);
    UI.panel(ctx, W / 2 - 90, H / 2 - 70, 180, 140, { fill: '#231713', border: '#c8913a' });
    Font.draw(ctx, 'PAUSE', W / 2, H / 2 - 58, { align: 'center', scale: 2, color: '#ffe9a8', shadow: 'thick' });
    if (UI.button(ctx, 'p_resume', W / 2 - 70, H / 2 - 28, 140, 22, 'Weiter', { style: 'gold', key: 'Escape' }) || Input.key('p')) this.paused = false;
    if (UI.button(ctx, 'p_sound', W / 2 - 70, H / 2 + 2, 140, 22, 'Ton: ' + (Game.muted ? 'AUS' : 'AN'))) Game.toggleMute();
    if (UI.button(ctx, 'p_quit', W / 2 - 70, H / 2 + 32, 140, 22, 'Feierabend machen', { style: 'red' })) { this.paused = false; this.stamina = 0; this.secondWindUsed = true; this.outOfStamina(); }
  }

  drawResults(ctx) {
    const R = this.results;
    const t = R.t;
    ctx.fillStyle = `rgba(10,5,4,${Math.min(0.75, t * 2)})`;
    ctx.fillRect(0, 0, W, H);
    const pw = 300, ph = 64 + R.rows.length * 18 + 50;
    const k = Ease.outBack(Math.min(1, t / 0.4));
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2 + (1 - k) * 60;
    UI.panel(ctx, px, py, pw, ph, { fill: '#231713', border: '#c8913a', glow: true });
    Font.draw(ctx, 'FEIERABEND!', W / 2, py + 10, { align: 'center', scale: 2, color: '#ffd040', shadow: 'thick', gradient: GOLD_GRAD });
    ctx.drawImage(Art.bill(R.total > currentBill().amount * 0.5 ? 'money' : 'tired', false, false), px - 40, py + ph - 70);
    R.rows.forEach((row, i) => {
      const rt = t - 0.4 - i * 0.12;
      if (rt < 0) return;
      const y = py + 38 + i * 18;
      const p = Math.min(1, rt / 0.5);
      if (p < 1) Sound.play('countUp', null, 0.05);
      const v = row.val * Ease.outCubic(p);
      ctx.globalAlpha = Math.min(1, rt * 5);
      Font.draw(ctx, row.label, px + 50, y, { color: '#d8c8b0' });
      Font.draw(ctx, row.money ? money(v) : fmt(Math.round(v)) + (row.gem ? ' ♦' : ''), px + pw - 16, y, { align: 'right', color: row.col || '#ffffff' });
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(px + 50, y + 12, pw - 66, 1);
      ctx.globalAlpha = 1;
    });
    if (this.r.rares.length) {
      let x = px + 50;
      for (const id of this.r.rares.slice(0, 10)) { ctx.drawImage(Art.rareCoin(RARE_BY_ID[id], 12), x, py + ph - 44); x += 16; }
    }
    const done = t > 0.6 + R.rows.length * 0.12;
    if (done && UI.button(ctx, 'res_ok', W / 2 - 60, py + ph - 28, 120, 22, 'Weiter', { style: 'gold', key: ' ', keyLabel: 'LEER' })) {
      Game.goto(new HubScene({ fromRun: true, achievements: this.newAch }));
    }
  }
}

const GOLD_GRAD = ['#fff8c8', '#ffe880', '#ffd040', '#ffc020', '#f0a018', '#e08a10', '#c87010', '#a85a10', '#8a4a10'];
const FIRE_GRAD = ['#fff0a0', '#ffd040', '#ffb020', '#ff9010', '#ff7010', '#f05010', '#d83a10', '#b02a10', '#8a1a10'];
const ICE_GRAD = ['#ffffff', '#e8f8ff', '#c8f0ff', '#a8e4ff', '#88d4f8', '#6ac0f0', '#4aa8e0', '#3a90d0', '#2a78c0'];
let _pauseIcon = null;
function PAUSE_ICON() {
  if (_pauseIcon) return _pauseIcon;
  const g = new Art.PG(10, 10);
  g.rect(2, 1, 2, 8, '#f3e6cf'); g.rect(6, 1, 2, 8, '#f3e6cf');
  g.outline('#1a0e0c');
  return (_pauseIcon = g.canvas());
}
