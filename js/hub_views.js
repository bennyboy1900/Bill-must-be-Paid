// ============================================================
//  HUB VIEWS: skill tree, forge, collection, achievements
// ============================================================
const VIEW = { x0: 0, y0: 31, x1: W, y1: H - 28 };

// ------------------------------------------------------------
//  SKILL TREE
// ------------------------------------------------------------
class SkillTreeView {
  constructor(hub) {
    this.hub = hub;
    this.G = 40;
    this.cam = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.drag = null;
    this.pop = {};
    this.reveal = {};
    this.shakeN = {};
    this.t = 0;
    this.hover = null;
    this.known = new Set(SKILLS.filter((s) => this.state(s) !== 'hidden').map((s) => s.id));
    this.centroids = {};
    for (const b in BRANCH) {
      const ns = SKILLS.filter((s) => s.b === b);
      if (!ns.length || b === 'root') continue;
      const cx = ns.reduce((a, s) => a + s.x, 0) / ns.length, cy = ns.reduce((a, s) => a + s.y, 0) / ns.length;
      this.centroids[b] = { x: cx, y: cy };
    }
  }
  state(sk) {
    const l = skillLevel(sk.id);
    if (l >= sk.max) return 'max';
    if (l > 0) return 'owned';
    if (skillUnlocked(sk)) return 'avail';
    if (sk.req.some((r) => skillUnlocked(SKILL_BY_ID[r]))) return 'mystery';
    return 'hidden';
  }
  pos(sk) { return { x: Math.round(sk.x * this.G - this.cam.x + W / 2), y: Math.round(sk.y * this.G - this.cam.y + (VIEW.y0 + VIEW.y1) / 2) }; }
  spent() {
    let s = 0;
    for (const id in P.C.skills) { const sk = SKILL_BY_ID[id]; for (let l = 0; l < P.C.skills[id]; l++) s += skillCost(sk, l); }
    return s;
  }
  reset() {
    const refund = Math.floor(this.spent() * 0.75);
    P.C.money += refund;
    P.C.skills = {};
    invalidateStats(); saveGame();
    this.hub.text(W / 2, H / 2, '+' + money(refund), '#9af08a', { big: true, scale: 2 });
    Sound.play('back');
  }
  buy(sk) {
    const price = skillPrice(sk);
    const l = skillLevel(sk.id);
    if (l >= sk.max) return;
    if (P.C.money < price) { Sound.play('error'); this.shakeN[sk.id] = 0.3; return; }
    const before = new Set(SKILLS.filter((s) => this.state(s) === 'avail' || this.state(s) === 'mystery').map((s) => s.id));
    P.C.money -= price;
    P.C.skills[sk.id] = l + 1;
    invalidateStats();
    saveGame();
    this.pop[sk.id] = 0;
    const p = this.pos(sk);
    const col = BRANCH[sk.b].color;
    Sound.play(sk.key || sk.unlockPig ? 'unlock' : 'buy');
    for (let i = 0; i < (sk.key ? 30 : 16); i++) this.hub.parts.push(new Spark(p.x, p.y, i % 2 ? col : '#ffffff', sk.key ? 200 : 130));
    for (let i = 0; i < 6; i++) this.hub.parts.push(new Sparkle(p.x + rand(-14, 14), p.y + rand(-14, 14)));
    this.hub.fx.push(new Ring(p.x, p.y + 6, sk.key ? 50 : 30, col, 0.4, 2));
    this.hub.text(p.x, p.y - 22, '-' + money(price), '#ff9a7a', { life: 0.9 });
    if (sk.unlockPig) {
      UI.toast({ title: 'Neues Schwein freigeschaltet!', text: PIGS[sk.unlockPig].name, icon: Art.pig(sk.unlockPig, 0).canvas, color: '#ff9ac0' });
    } else if (sk.key && l === 0) {
      UI.toast({ title: sk.name, text: 'Schlüssel-Fähigkeit erlernt!', icon: Art.icon(sk.icon), color: col });
    }
    for (const s of SKILLS) {
      const st = this.state(s);
      if ((st === 'avail' || st === 'mystery') && !before.has(s.id)) this.reveal[s.id] = 0;
    }
  }

  draw(ctx, dt) {
    this.t += dt;
    const inView = Input.y > VIEW.y0 && Input.y < VIEW.y1;
    // ---- pan input (drag with inertia, wheel, keys) ----
    if (UI.enabled) {
      if (Input.pressed && inView) this.drag = { sx: Input.x, sy: Input.y, cx: this.cam.x, cy: this.cam.y, moved: false, lx: Input.x, ly: Input.y };
      if (this.drag && Input.down) {
        const dx = Input.x - this.drag.sx, dy = Input.y - this.drag.sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.drag.moved = true;
        if (this.drag.moved) {
          this.cam.x = this.drag.cx - dx; this.cam.y = this.drag.cy - dy;
          this.vel.x = (this.drag.lx - Input.x) / Math.max(dt, 0.001); this.vel.y = (this.drag.ly - Input.y) / Math.max(dt, 0.001);
        }
        this.drag.lx = Input.x; this.drag.ly = Input.y;
      }
      if (Input.wheel) this.cam.y += Input.wheel * 0.4;
      const ks = 260 * dt;
      if (Input.keys['ArrowLeft'] || Input.keys['a']) this.cam.x -= ks;
      if (Input.keys['ArrowRight'] || Input.keys['d']) this.cam.x += ks;
      if (Input.keys['ArrowUp'] || Input.keys['w']) this.cam.y -= ks;
      if (Input.keys['ArrowDown'] || Input.keys['s']) this.cam.y += ks;
    }
    if (!Input.down || !this.drag) {
      this.cam.x += this.vel.x * dt; this.cam.y += this.vel.y * dt;
      const d = Math.exp(-6 * dt); this.vel.x *= d; this.vel.y *= d;
    }
    // clamp to known area
    const vis = SKILLS.filter((s) => this.state(s) !== 'hidden');
    const minX = Math.min(...vis.map((s) => s.x)) * this.G - 120, maxX = Math.max(...vis.map((s) => s.x)) * this.G + 120;
    const minY = Math.min(...vis.map((s) => s.y)) * this.G - 60, maxY = Math.max(...vis.map((s) => s.y)) * this.G + 60;
    const hw = W / 2 - 60, hh = (VIEW.y1 - VIEW.y0) / 2 - 40;
    this.cam.x = clamp(this.cam.x, Math.min(minX + hw, 0), Math.max(maxX - hw, 0));
    this.cam.y = clamp(this.cam.y, Math.min(minY + hh, 0), Math.max(maxY - hh, 0));

    ctx.save();
    ctx.beginPath(); ctx.rect(0, VIEW.y0, W, VIEW.y1 - VIEW.y0); ctx.clip();
    // ---- background: dot grid + glow ----
    ctx.fillStyle = 'rgba(8,4,3,0.72)'; ctx.fillRect(0, VIEW.y0, W, VIEW.y1 - VIEW.y0);
    const ox = ((-this.cam.x % 20) + 20) % 20, oy = ((-this.cam.y % 20) + 20) % 20;
    ctx.fillStyle = 'rgba(200,150,90,0.07)';
    for (let y = VIEW.y0 + oy; y < VIEW.y1; y += 20) for (let x = ox; x < W; x += 20) ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    const root = this.pos(SKILLS[0]);
    const g = ctx.createRadialGradient(root.x, root.y, 5, root.x, root.y, 220);
    g.addColorStop(0, 'rgba(255,190,90,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, VIEW.y0, W, VIEW.y1 - VIEW.y0);
    // branch names
    for (const b in this.centroids) {
      if (!SKILLS.some((s) => s.b === b && this.state(s) !== 'hidden')) continue;
      const c = this.centroids[b];
      const x = Math.round(c.x * this.G - this.cam.x + W / 2), y = Math.round(c.y * this.G - this.cam.y + (VIEW.y0 + VIEW.y1) / 2);
      // only name branches the player has actually reached, mysteries stay mysterious
      const reached = SKILLS.some((s) => s.b === b && ['avail', 'owned', 'max'].includes(this.state(s)));
      if (reached) Font.draw(ctx, BRANCH[b].name.toUpperCase(), x, y - 4, { align: 'center', color: BRANCH[b].color, scale: 2, alpha: 0.14, shadow: null, bold: true });
    }
    // ---- edges ----
    const flow = this.t * 0.8;
    for (const sk of SKILLS) {
      const st = this.state(sk);
      if (st === 'hidden') continue;
      const b = this.pos(sk);
      for (const rid of sk.req) {
        const r = SKILL_BY_ID[rid];
        const rs = this.state(r);
        if (rs === 'hidden' || rs === 'mystery') continue;
        const a = this.pos(r);
        const ro = rs === 'owned' || rs === 'max', no = st === 'owned' || st === 'max';
        if (ro && no) {
          pxLine(ctx, a.x, a.y, b.x, b.y, '#8a5a1e', 3);
          pxLine(ctx, a.x, a.y, b.x, b.y, '#f0b040', 1);
          // energy pulses flowing outward
          for (let k = 0; k < 2; k++) {
            const tt = (flow + k * 0.5 + hash2(sk.x, sk.y) ) % 1;
            const px = lerp(a.x, b.x, tt), py = lerp(a.y, b.y, tt);
            ctx.fillStyle = '#fff4c0'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
            ctx.fillStyle = BRANCH[sk.b].color; ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
          }
        } else if (ro) {
          pxDashLine(ctx, a.x, a.y, b.x, b.y, '#a0783a', 3, 2, -this.t * 14);
        } else {
          pxLine(ctx, a.x, a.y, b.x, b.y, '#2e2219', 1);
        }
      }
    }
    // ---- nodes ----
    let hov = null;
    for (const sk of SKILLS) {
      const st = this.state(sk);
      if (st === 'hidden') continue;
      const p = this.pos(sk);
      if (p.x < -40 || p.x > W + 40 || p.y < VIEW.y0 - 40 || p.y > VIEW.y1 + 40) continue;
      const size = sk.key ? 30 : 24;
      const over = UI.enabled && inView && Math.abs(Input.x - p.x) <= size / 2 + 1 && Math.abs(Input.y - p.y) <= size / 2 + 1;
      if (over) hov = sk;
      this.drawNode(ctx, sk, st, p, size, over, dt);
    }
    ctx.restore();
    this.hover = hov;
    if (hov && (!this.drag || !this.drag.moved)) UI.region('treenode', 0, 0, 0, 0);
    // click
    if (Input.released && this.drag) {
      if (!this.drag.moved && hov && UI.enabled) {
        const st = this.state(hov);
        if (st === 'avail' || st === 'owned') this.buy(hov);
        else if (st === 'mystery') { Sound.play('error'); this.shakeN[hov.id] = 0.3; }
      }
      this.drag = null;
    }
    if (hov && UI.enabled) this.drawTip(ctx, hov);
    // hint
    if (!P.tutorial.tree) {
      Font.draw(ctx, 'Ziehen zum Verschieben · Klicken zum Kaufen', W / 2, VIEW.y1 - 14, { align: 'center', color: '#c8b8a0', alpha: 0.6 + Math.sin(this.t * 3) * 0.3 });
      if (Object.keys(P.C.skills).length > 1) P.tutorial.tree = true;
    }
  }

  drawNode(ctx, sk, st, p, size, over, dt) {
    const col = BRANCH[sk.b].color;
    const lvl = skillLevel(sk.id);
    const afford = (st === 'avail' || st === 'owned') && P.C.money >= skillPrice(sk);
    // animations
    let sc = 1;
    if (this.pop[sk.id] !== undefined) {
      this.pop[sk.id] += dt;
      const t = this.pop[sk.id];
      sc = 1 + Math.sin(Math.min(1, t / 0.35) * Math.PI) * 0.35 * (1 - t / 0.5);
      if (t > 0.5) delete this.pop[sk.id];
    }
    let alpha = 1;
    if (this.reveal[sk.id] !== undefined) {
      this.reveal[sk.id] += dt;
      const t = this.reveal[sk.id];
      sc *= Ease.outBack(Math.min(1, t / 0.4));
      alpha = Math.min(1, t * 3);
      if (t > 0.5) delete this.reveal[sk.id];
    }
    let sx = 0;
    if (this.shakeN[sk.id] > 0) { this.shakeN[sk.id] -= dt; sx = Math.sin(this.t * 80) * 2; }
    if (over) sc *= 1.08;
    const s = Math.round(size * sc);
    const x = p.x + sx, y = p.y - (over ? 1 : 0);
    ctx.globalAlpha = alpha;
    // glow for owned
    if (st === 'owned' || st === 'max') {
      const gr = ctx.createRadialGradient(x, y, 2, x, y, s);
      gr.addColorStop(0, col + '66'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha * (0.7 + Math.sin(this.t * 3 + sk.x) * 0.3);
      ctx.fillStyle = gr; ctx.fillRect(x - s, y - s, s * 2, s * 2);
      ctx.globalAlpha = alpha;
    }
    let fill, border, inner;
    if (st === 'max') { fill = shade(col, 0.5); border = '#ffd040'; inner = shade(col, 0.7); }
    else if (st === 'owned') { fill = shade(col, 0.42); border = col; inner = shade(col, 0.6); }
    else if (st === 'avail') { fill = '#1c1410'; border = afford ? shade(col, 0.85) : '#4a3a30'; inner = '#251a14'; }
    else { fill = '#110b09'; border = '#2e241e'; inner = '#160f0c'; }
    const h = Math.floor(s / 2);
    if (sk.key) {
      // diamond
      const dia = (r, c) => { ctx.fillStyle = c; for (let j = -r; j <= r; j++) { const w = r - Math.abs(j); ctx.fillRect(x - w, y + j, w * 2 + 1, 1); } };
      dia(h + 2, '#0a0504'); dia(h + 1, border); dia(h - 1, fill); dia(h - 4, inner);
      if (st === 'avail' && afford) { ctx.globalAlpha = alpha * (0.4 + Math.sin(this.t * 6) * 0.4); dia(h + 3, col); ctx.globalAlpha = alpha; dia(h + 1, border); dia(h - 1, fill); dia(h - 4, inner); }
    } else {
      ctx.fillStyle = '#0a0504'; ctx.fillRect(x - h - 1, y - h, s + 2, s); ctx.fillRect(x - h, y - h - 1, s, s + 2);
      ctx.fillStyle = border; ctx.fillRect(x - h, y - h, s, s);
      ctx.fillStyle = fill; ctx.fillRect(x - h + 2, y - h + 2, s - 4, s - 4);
      ctx.fillStyle = inner; ctx.fillRect(x - h + 2, y - h + 2, s - 4, 2);
      if (st === 'avail' && afford) {
        ctx.globalAlpha = alpha * (0.35 + Math.sin(this.t * 6) * 0.35);
        ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 1; ctx.strokeRect(x - h - 2.5, y - h - 2.5, s + 5, s + 5);
        ctx.globalAlpha = alpha;
      }
    }
    // icon
    const ic = st === 'mystery' ? Art.icon('question') : st === 'avail' && !afford ? Art.iconGray(sk.icon) : Art.icon(sk.icon);
    ctx.drawImage(ic, Math.round(x - 6), Math.round(y - 6));
    // level pips
    if ((st === 'owned' || st === 'max' || st === 'avail') && sk.max > 1) {
      const txt = `${lvl}/${sk.max}`;
      Font.draw(ctx, txt, x, y + h + 2, { align: 'center', color: st === 'max' ? '#ffd040' : lvl > 0 ? '#ffffff' : '#8a7a6a', shadow: 'outline' });
    } else if (st === 'max') {
      ctx.drawImage(Art.sparkle(Math.floor(this.t * 6 + sk.x) % 5), x + h - 4, y - h - 4);
    }
    ctx.globalAlpha = 1;
  }

  drawTip(ctx, sk) {
    const st = this.state(sk);
    const p = this.pos(sk);
    const col = BRANCH[sk.b].color;
    const lines = [];
    if (st === 'mystery') {
      lines.push({ t: '???', c: '#a8927a' });
      lines.push({ t: 'Kaufe einen verbundenen Skill, um diesen aufzudecken.', c: '#7a6a5a' });
    } else {
      const l = skillLevel(sk.id);
      lines.push({ t: sk.name, c: col });
      lines.push({ t: BRANCH[sk.b].name + (sk.key ? ' · Schlüssel-Skill' : '') + (sk.max > 1 ? `  ·  Stufe ${l}/${sk.max}` : ''), c: '#8a7a6a' });
      if (l > 0) lines.push({ t: 'Aktuell: ' + sk.d(l), c: '#f3e6cf' });
      if (l < sk.max) {
        lines.push({ t: (l > 0 ? 'Nächste: ' : '') + sk.d(l + 1), c: '#9af08a' });
        const price = skillPrice(sk);
        lines.push({ t: 'Kosten: ' + money(price), c: P.C.money >= price ? '#ffe070' : '#ff7a6a' });
      } else lines.push({ t: 'MAXIMAL', c: '#ffd040' });
    }
    UI.tooltip(lines, p.x + 20 > W - 210 ? p.x - 220 : p.x + 20, p.y - 10);
  }
}

// ------------------------------------------------------------
//  FORGE (hammers + enchantments)
// ------------------------------------------------------------
class ForgeView {
  constructor(hub) { this.hub = hub; this.sel = P.hammer; this.t = 0; this.selEnch = null; this.prevSq = 0; this.prevSqv = 0; this.lastPhase = 0; }
  anyAffordable() {
    return HAMMERS.some((h) => !P.hammers.includes(h.id) && P.gems >= h.cost) || ENCHANTS.some((e) => ((P.enchant[e.id] || 0) < e.max) && P.gems >= enchantCost(P.enchant[e.id] || 0));
  }
  draw(ctx, dt) {
    this.t += dt;
    // ---- hammer grid ----
    UI.panel(ctx, 8, 36, 296, 176, { fill: 'rgba(26,17,13,0.92)', border: '#5a4030' });
    Font.draw(ctx, 'HÄMMER', 16, 42, { color: '#e0a84a', bold: true });
    Font.draw(ctx, `${P.hammers.length}/${HAMMERS.length}`, 296, 42, { align: 'right', color: '#8a7a6a' });
    HAMMERS.forEach((h, i) => {
      const x = 14 + (i % 5) * 57, y = 54 + Math.floor(i / 5) * 52;
      const owned = P.hammers.includes(h.id);
      const eq = P.hammer === h.id;
      const r = UI.region('hm_' + h.id, x, y, 54, 49);
      const sel = this.sel === h.id;
      UI.panel(ctx, x, y - (r.hover ? 1 : 0), 54, 49, { fill: sel ? '#3a2a1e' : r.hover ? '#2a1e17' : '#1a120e', border: eq ? '#ffd040' : sel ? '#c8913a' : '#3a2a20', shadow: false });
      const icon = Art.hammerIcon(h.id);
      const lvl = P.hammerLvl[h.id] || 0;
      const stars = hammerStars(lvl);
      if (owned && stars) {
        const gr = ctx.createRadialGradient(x + 30, y + 16, 1, x + 30, y + 16, 22);
        gr.addColorStop(0, HAMMER_STARS[stars - 1].color + '55'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(x + 2, y + 2, 50, 44);
      }
      ctx.drawImage(owned ? icon : Art.tint('hmi' + h.id, icon, 'dark'), x + 3, y - 4 - (r.hover ? 1 : 0), 48, 48);
      if (owned) {
        for (let s = 0; s < 5; s++) { ctx.fillStyle = s < stars ? HAMMER_STARS[stars - 1].color : '#3a2a20'; ctx.fillRect(x + 6 + s * 5, y + 42, 3, 3); }
        Font.draw(ctx, 'Lv' + lvl, x + 50, y + 38, { align: 'right', color: '#c8b8a0', shadow: 'outline' });
        if (eq) Font.draw(ctx, '✓', x + 47, y + 4, { color: '#ffd040' });
      } else {
        Font.draw(ctx, h.cost + '♦', x + 27, y + 38, { align: 'center', color: P.gems >= h.cost ? '#ff9aa0' : '#7a5a5a', shadow: 'outline', bold: true });
      }
      if (r.click) { this.sel = h.id; Sound.play('click'); }
    });
    // ---- enchantments ----
    UI.panel(ctx, 8, 218, 296, 108, { fill: 'rgba(26,17,13,0.92)', border: '#5a4030' });
    Font.draw(ctx, 'VERZAUBERUNGEN', 16, 224, { color: '#c07af0', bold: true });
    Font.draw(ctx, 'gelten für alle Hämmer', 296, 224, { align: 'right', color: '#6a5a4e' });
    ENCHANTS.forEach((e, i) => {
      const x = 14 + (i % 2) * 145, y = 238 + Math.floor(i / 2) * 29;
      const cw = 140, chh = 26;
      const l = P.enchant[e.id] || 0;
      const cost = enchantCost(l);
      const r = UI.region('en_' + e.id, x, y, cw, chh);
      const max = l >= e.max;
      const yo = r.hover ? 1 : 0;
      UI.panel(ctx, x, y - yo, cw, chh, { fill: r.hover ? '#2a1e17' : '#1a120e', border: l ? e.color : '#3a2a20', shadow: false });
      if (l) { ctx.globalAlpha = 0.25 + Math.sin(this.t * 4 + i) * 0.1; ctx.fillStyle = e.color; ctx.fillRect(x + 4, y + 5 - yo, 16, 16); ctx.globalAlpha = 1; }
      ctx.drawImage(l ? Art.icon(e.icon) : Art.iconGray(e.icon), x + 6, y + 7 - yo);
      Font.draw(ctx, Font.fit(e.name, cw - 58), x + 24, y + 5 - yo, { color: l ? '#f3e6cf' : '#a8927a' });
      for (let k = 0; k < e.max; k++) { ctx.fillStyle = k < l ? e.color : '#3a2a20'; ctx.fillRect(x + 24 + k * 7, y + 17 - yo, 5, 3); }
      Font.draw(ctx, max ? 'MAX' : cost + '♦', x + cw - 6, y + 9 - yo, { align: 'right', color: max ? '#ffd040' : P.gems >= cost ? '#ff9aa0' : '#7a5a5a', shadow: 'outline', bold: true });
      if (r.hover) UI.tooltip([{ t: e.name, c: e.color }, l ? 'Aktuell: ' + e.d(l) : 'Noch nicht gelernt', max ? { t: 'MAXIMAL', c: '#ffd040' } : { t: 'Nächste: ' + e.d(l + 1), c: '#9af08a' }, max ? '' : { t: 'Klicken: ' + cost + ' ♦', c: P.gems >= cost ? '#ff9aa0' : '#ff6a5a' }]);
      if (r.click) {
        if (!max && P.gems >= cost) {
          P.gems -= cost; P.enchant[e.id] = l + 1; invalidateStats(); saveGame();
          Sound.play('unlock');
          for (let k = 0; k < 16; k++) this.hub.parts.push(new Spark(x + 14, y + 13, e.color, 150));
          this.hub.fx.push(new Ring(x + cw / 2, y + 13, 40, e.color, 0.4, 2));
          this.hub.text(x + cw / 2, y, e.name + ' ' + (l + 1), e.color, { big: true });
        } else Sound.play('error');
      }
    });
    this.drawDetail(ctx, dt);
  }

  drawDetail(ctx, dt) {
    const h = HAMMER_BY_ID[this.sel];
    const owned = P.hammers.includes(h.id);
    const lvl = P.hammerLvl[h.id] || 0;
    const stars = hammerStars(lvl);
    const x = 312, y = 36, w = 320, hh = 290;
    UI.panel(ctx, x, y, w, hh, { fill: 'rgba(26,17,13,0.95)', border: '#8a6a4a' });
    // ---- preview stage ----
    ctx.fillStyle = '#120b08'; ctx.fillRect(x + 6, y + 6, w - 12, 112);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, 112); ctx.clip();
    // spotlight
    const g = ctx.createRadialGradient(x + w / 2, y + 70, 4, x + w / 2, y + 70, 120);
    g.addColorStop(0, stars ? HAMMER_STARS[stars - 1].color + '40' : 'rgba(255,200,120,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, 120);
    // dummy pig + swinging hammer
    const cyc = (this.t % 1.3) / 1.3;
    let ang;
    if (cyc < 0.65) ang = lerp(-40, 18, Ease.outCubic(cyc / 0.65));
    else if (cyc < 0.78) ang = lerp(18, -40, Ease.inQuad((cyc - 0.65) / 0.13));
    else ang = -40;
    const phase = cyc >= 0.78 ? 1 : 0;
    if (phase && !this.lastPhase) {
      this.prevSqv += 9;
      for (let i = 0; i < 10; i++) this.hub.parts.push(new Spark(x + w / 2 - 6, y + 92, stars ? HAMMER_STARS[stars - 1].color : '#fff4d8', 150));
      this.hub.fx.push(new Ring(x + w / 2 - 6, y + 100, 26, '#fff0d0', 0.25, 1));
    }
    this.lastPhase = phase;
    this.prevSqv += (-300 * this.prevSq - 14 * this.prevSqv) * dt; this.prevSq += this.prevSqv * dt;
    const pig = Art.pig('pink', 0);
    ctx.save(); ctx.translate(x + w / 2 - 6, y + 108); ctx.scale(2 * (1 + this.prevSq), 2 * (1 - this.prevSq));
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 3, 0, 0, TAU); ctx.fill();
    ctx.drawImage(pig.canvas, -pig.ax, -pig.ay);
    ctx.fillStyle = '#fff'; for (const e of pig.eyes) ctx.fillRect(e.x - pig.ax, e.y - pig.ay + 1, 3, 2);
    ctx.fillStyle = '#1a0e0e'; for (const e of pig.eyes) ctx.fillRect(e.x - pig.ax + (phase ? 0 : 1), e.y - pig.ay + (phase ? 2 : 1), phase ? 3 : 2, phase ? 1 : 2);
    ctx.restore();
    const hm = Art.hammer(h.id);
    const L = hm.len * 2, a0 = (-40 * Math.PI) / 180;
    const tx = x + w / 2 - 6, ty = y + 90;
    const px = tx - Math.sin(a0) * L, py = ty + Math.cos(a0) * L;
    const fr = Art.hammerRot(h.id, ang);
    ctx.save(); ctx.translate(px, py); ctx.scale(2, 2);
    if (!owned) ctx.globalAlpha = 0.5;
    ctx.drawImage(owned ? fr.canvas : Art.tint('hr' + h.id + Math.round(ang / 3), fr.canvas, 'dark'), -fr.ox, -fr.oy);
    ctx.restore();
    ctx.restore();
    // ---- info ----
    Font.draw(ctx, h.name, x + 12, y + 126, { color: '#ffe0a0', scale: 2, bold: true });
    for (let s = 0; s < 5; s++) {
      const c = s < stars ? HAMMER_STARS[stars - 1].color : '#3a2a20';
      Font.draw(ctx, '★', x + w - 70 + s * 12, y + 130, { color: c, shadow: 'outline' });
    }
    Font.drawWrapped(ctx, h.desc, x + 12, y + 148, w - 24, { color: '#c8b8a0' });
    // stat bars
    const lvlMul = 1 + 0.15 * lvl;
    const rows = [
      ['Schaden', h.dmg * lvlMul, 4 * 2.5, '#e8503e'],
      ['Tempo', h.rate, 3.2, '#5aa0f0'],
      ['Radius', h.radius, 2, '#6fd65a'],
      ['Krit', 0.05 + h.crit, 0.5, '#ffd040'],
    ];
    rows.forEach(([n, v, mx, c], i) => {
      const yy = y + 172 + i * 13;
      Font.draw(ctx, n, x + 12, yy, { color: '#a8927a' });
      UI.bar(ctx, x + 70, yy + 2, 170, 4, Math.sqrt(v / mx), c);
      Font.draw(ctx, n === 'Krit' ? Math.round(v * 100) + '%' : 'x' + v.toFixed(2), x + w - 12, yy, { align: 'right', color: '#f3e6cf' });
    });
    // star info
    const nextStar = stars < 5 ? HAMMER_STARS[stars] : null;
    if (owned) {
      const txt = nextStar ? `Lv ${(stars + 1) * 5}: ${nextStar.name} – ${nextStar.d}` : 'Alle Sterne erreicht! LEGENDÄR!';
      Font.draw(ctx, txt, x + 12, y + 226, { color: nextStar ? nextStar.color : '#ffd040' });
      // level progress to next star
      UI.bar(ctx, x + 12, y + 238, w - 24, 3, nextStar ? (lvl % 5) / 5 : 1, nextStar ? nextStar.color : '#ffd040');
    }
    // buttons
    const by = y + hh - 34;
    if (!owned) {
      if (UI.button(ctx, 'fg_buy', x + 12, by, w - 24, 24, `Kaufen für ${h.cost} ♦`, { style: P.gems >= h.cost ? 'gold' : 'dark', disabled: P.gems < h.cost })) {
        P.gems -= h.cost; P.hammers.push(h.id); P.hammerLvl[h.id] = 0; P.hammer = h.id;
        invalidateStats(); saveGame();
        Sound.play('unlock');
        for (let i = 0; i < 30; i++) this.hub.parts.push(new Sparkle(x + rand(w), y + rand(120)));
        UI.toast({ title: 'Neuer Hammer!', text: h.name + ' ausgerüstet', icon: Art.icon('hammer'), color: '#ffd040' });
        checkAchievements();
      }
    } else {
      const eq = P.hammer === h.id;
      if (UI.button(ctx, 'fg_eq', x + 12, by, 110, 24, eq ? 'Ausgerüstet' : 'Ausrüsten', { style: eq ? 'ghost' : 'blue', disabled: eq })) {
        P.hammer = h.id; invalidateStats(); saveGame(); Sound.play('buy');
      }
      const maxed = lvl >= HAMMER_MAX_LVL;
      const cost = hammerUpCost(lvl);
      if (UI.button(ctx, 'fg_up', x + 128, by, w - 140, 24, maxed ? 'MAX' : `Schärfen Lv${lvl + 1}  ${cost}♦`, { style: maxed ? 'ghost' : P.gems >= cost ? 'gold' : 'dark', disabled: maxed || P.gems < cost, tip: '+15% Schaden pro Stufe, alle 5 Stufen ein Stern!' })) {
        P.gems -= cost; P.hammerLvl[h.id] = lvl + 1;
        invalidateStats(); saveGame();
        Sound.play('metalhit');
        Sound.play('buy');
        for (let i = 0; i < 18; i++) this.hub.parts.push(new Spark(x + w / 2, y + 80, '#ffb040', 200));
        this.hub.text(x + w / 2, y + 60, 'Lv ' + (lvl + 1), '#ffe0a0', { big: true, scale: 2 });
        if ((lvl + 1) % 5 === 0) {
          const st = HAMMER_STARS[(lvl + 1) / 5 - 1];
          Sound.play('record');
          this.hub.fx.push(new Ring(x + w / 2, y + 70, 120, st.color, 0.6, 3));
          for (let i = 0; i < 40; i++) this.hub.parts.push(new Confetti(x + w / 2, y + 70));
          UI.toast({ title: st.name + '!', text: st.d, icon: Art.icon('star'), color: st.color, life: 4 });
        }
      }
    }
  }
}

// ------------------------------------------------------------
//  COIN CASE ART (static parts cached once)
// ------------------------------------------------------------
const COIN_BOX = { f: 10, div: 4, th: 59, step: 54, cx0: 36, cy: 37 };
let _coinBox = null, _coinGlass = null;
function brassPlate(ctx, x, y, w, h) {
  ctx.fillStyle = '#4a2a0a'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#c8913a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f0c868'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = '#8a5a24'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = '#6a4418'; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + w - 3, y + 2, 1, 1);
}
function coinBoxArt(w, h) {
  if (_coinBox) return _coinBox;
  const L = COIN_BOX;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  // drop shadow + wooden case with grain
  g.fillStyle = '#1a0c06'; g.fillRect(0, 0, w, h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const n = Math.sin(y * 0.55 + Math.sin(x * 0.03 + y * 0.02) * 3 + vnoise(x * 0.05, y * 0.4, 3) * 2);
    g.fillStyle = n > 0.75 ? '#4e2a14' : n < -0.6 ? '#7a4524' : '#663a1e';
    g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#9a6034'; g.fillRect(1, 1, w - 2, 1); g.fillRect(1, 1, 1, h - 2);
  g.fillStyle = '#3a1e0e'; g.fillRect(1, h - 2, w - 2, 1); g.fillRect(w - 2, 1, 1, h - 2);
  // inner bevel of the case
  const ix = L.f, iy = L.f, iw = w - L.f * 2, ih = h - L.f * 2;
  g.fillStyle = '#2a1408'; g.fillRect(ix - 2, iy - 2, iw + 4, ih + 4);
  g.fillStyle = '#8a5230'; g.fillRect(ix - 2, iy + ih, iw + 4, 2); g.fillRect(ix + iw, iy - 2, 2, ih + 4);
  // compartments
  for (let t = 0; t < 4; t++) {
    const ty = iy + t * (L.th + L.div), th = t === 3 ? ih - 3 * (L.th + L.div) : L.th;
    // velvet with fibre noise
    g.fillStyle = '#18203c'; g.fillRect(ix, ty, iw, th);
    for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? 'rgba(120,140,255,0.06)' : 'rgba(0,0,0,0.16)'; g.fillRect(ix + Math.floor(hash2(i, t + 7) * iw), ty + Math.floor(hash2(i, t + 17) * th), 1, 1); }
    // inset shading: dark top/left, soft light bottom/right
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(ix, ty, iw, 3); g.fillRect(ix, ty, 2, th);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(ix, ty + 3, iw, 2);
    g.fillStyle = 'rgba(140,160,255,0.08)'; g.fillRect(ix, ty + th - 1, iw, 1); g.fillRect(ix + iw - 1, ty, 1, th);
    // coin wells
    const wells = RARE_COINS.filter((rc) => rc.r === t + 1).length;
    for (let i = 0; i < wells; i++) {
      const cx = ix + L.cx0 + i * L.step, cy = ty + L.cy;
      g.fillStyle = '#2c3866'; g.beginPath(); g.arc(cx, cy + 1, 16, 0, TAU); g.fill();
      g.fillStyle = '#070a16'; g.beginPath(); g.arc(cx, cy, 15, 0, TAU); g.fill();
      g.fillStyle = '#0e1428'; g.beginPath(); g.arc(cx, cy + 1, 13, 0, TAU); g.fill();
      g.fillStyle = '#141b36'; g.beginPath(); g.arc(cx, cy + 2, 11, 0, TAU); g.fill();
    }
    // wooden divider below
    if (t < 3) {
      const dy = ty + th;
      g.fillStyle = '#6a3c1e'; g.fillRect(ix, dy, iw, L.div);
      g.fillStyle = '#9a6034'; g.fillRect(ix, dy, iw, 1);
      g.fillStyle = '#3a1e0e'; g.fillRect(ix, dy + L.div - 1, iw, 1);
    }
  }
  // brass corner brackets
  const corner = (x, y, fx, fy) => {
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) {
      g.fillStyle = j === 0 ? '#f0c868' : j === 2 ? '#8a5a24' : '#c8913a';
      g.fillRect(x + fx * i, y + fy * j, 1, 1); g.fillRect(x + fx * j, y + fy * i, 1, 1);
    }
    g.fillStyle = '#4a2a0a'; g.fillRect(x + fx * 5, y + fy * 1, 1, 1); g.fillRect(x + fx * 1, y + fy * 5, 1, 1);
  };
  corner(1, 1, 1, 1); corner(w - 2, 1, -1, 1); corner(1, h - 2, 1, -1); corner(w - 2, h - 2, -1, -1);
  // hinges on top, clasp at the front
  for (const hx of [70, w - 90]) brassPlate(g, hx, 2, 20, 6);
  brassPlate(g, w / 2 - 9, h - 8, 18, 7);
  g.fillStyle = '#4a2a0a'; g.fillRect(w / 2 - 1, h - 6, 2, 3);
  return (_coinBox = c);
}
function coinGlassArt(w, h) {
  if (_coinGlass) return _coinGlass;
  const L = COIN_BOX;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const ix = L.f, iy = L.f, iw = w - L.f * 2, ih = h - L.f * 2;
  g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
  // two diagonal reflections across the glass
  for (const [x0, bw, a] of [[60, 34, 0.05], [110, 10, 0.07], [270, 22, 0.04]]) {
    g.fillStyle = `rgba(220,235,255,${a})`;
    g.beginPath(); g.moveTo(ix + x0, iy); g.lineTo(ix + x0 + bw, iy); g.lineTo(ix + x0 + bw - ih * 0.6, iy + ih); g.lineTo(ix + x0 - ih * 0.6, iy + ih); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(ix, iy, iw, 1);
  g.restore();
  return (_coinGlass = c);
}

// ------------------------------------------------------------
//  COLLECTION (coin album + pig dex)
// ------------------------------------------------------------
class CollectionView {
  constructor(hub) { this.hub = hub; this.sub = 'coins'; this.t = 0; this.sel = null; this.selPig = null; }
  draw(ctx, dt) {
    this.t += dt;
    // sub tabs
    const subs = [['coins', 'Münzalbum'], ['dex', 'Schweinedex']];
    subs.forEach(([id, n], i) => {
      if (UI.button(ctx, 'ct_' + id, 10 + i * 96, 36, 92, 18, n, { style: this.sub === id ? 'gold' : 'ghost' })) { this.sub = id; Sound.play('tab'); }
    });
    if (this.sub === 'coins') this.drawCoins(ctx, dt);
    else this.drawDex(ctx, dt);
  }

  drawCoins(ctx, dt) {
    // collector's case: wooden box, velvet compartments per rarity, glass lid
    const ax = 8, ay = 58, aw = 414, ah = 268;
    const L = COIN_BOX;
    ctx.drawImage(coinBoxArt(aw, ah), ax, ay);
    let hovered = null;
    [1, 2, 3, 4].forEach((r, ti) => {
      const coins = RARE_COINS.filter((c) => c.r === r);
      const have = coins.filter((c) => P.collection[c.id]).length;
      const done = have === coins.length;
      const tx = ax + L.f, ty = ay + L.f + ti * (L.th + L.div), tw = aw - L.f * 2;
      if (done) { ctx.fillStyle = 'rgba(154,240,138,0.07)'; ctx.fillRect(tx + 2, ty + 2, tw - 4, L.th - 4); }
      // brass name plate
      const name = RARITY[r].name.toUpperCase();
      const pw = Font.measure(name, 1, true) + 44;
      brassPlate(ctx, tx + 6, ty + 4, pw, 12);
      ctx.fillStyle = '#1a0e06'; ctx.fillRect(tx + 11, ty + 7, 6, 6);
      ctx.fillStyle = RARITY[r].color; ctx.fillRect(tx + 12, ty + 8, 4, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(tx + 12, ty + 8, 1, 1);
      Font.draw(ctx, name, tx + 21, ty + 7, { color: '#3a2008', bold: true, shadow: null });
      Font.draw(ctx, `${have}/${coins.length}`, tx + pw, ty + 7, { align: 'right', color: '#5a3a14', shadow: null });
      Font.draw(ctx, (done ? '✓ ' : '') + 'Set: ' + SET_BONUS[r].d, tx + tw - 8, ty + 7, { align: 'right', color: done ? '#9af08a' : '#6a7298', shadow: null });
      coins.forEach((c, i) => {
        const cx = tx + L.cx0 + i * L.step, cy = ty + L.cy;
        const owned = !!P.collection[c.id];
        const reg = UI.region('coin_' + c.id, cx - 20, cy - 20, 40, 40);
        if (reg.hover) hovered = c;
        if (reg.hover || this.sel === c) {
          ctx.strokeStyle = reg.hover ? '#ffe0a0' : '#c8913a'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy + 1, 17.5, 0, TAU); ctx.stroke();
        }
        if (owned) {
          const spr = Art.rareCoin(c, 20);
          // slow 3D spin in its well, faster when hovered
          const spd = reg.hover ? 5 : 1.2;
          const k = Math.cos(this.t * spd + i * 0.7 + r);
          const sx = Math.max(0.12, Math.abs(k));
          const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
          glow.addColorStop(0, RARITY[r].color + '55'); glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow; ctx.fillRect(cx - 18, cy - 18, 36, 36);
          ctx.save(); ctx.translate(cx, cy - (reg.hover ? 2 : 0)); ctx.scale(sx, 1);
          ctx.drawImage(k < 0 ? Art.tint('rcb' + c.id, spr, 'gold') : spr, -spr.width / 2, -spr.height / 2);
          ctx.restore();
          if (P.collection[c.id] > 1) Font.draw(ctx, 'x' + P.collection[c.id], cx + 18, cy + 9, { align: 'right', color: '#e8e8ff', shadow: 'outline' });
          if (chance(dt * 0.6)) this.hub.parts.push(new Sparkle(cx + rand(-10, 10), cy + rand(-10, 10)));
        } else {
          Font.draw(ctx, '?', cx, cy - 3, { align: 'center', color: '#2c3458', shadow: null, bold: true });
        }
        if (reg.click) { this.sel = c; Sound.play('click'); }
      });
    });
    // glass lid on top of everything
    ctx.drawImage(coinGlassArt(aw, ah), ax, ay);
    const c = hovered || this.sel;
    // detail panel
    const dx = 430, dy = 58, dw = 202, dh = 268;
    UI.panel(ctx, dx, dy, dw, dh, { fill: 'rgba(20,14,12,0.95)', border: '#5a4030' });
    const total = Object.keys(P.collection).length;
    Font.draw(ctx, `Gefunden: ${total}/${RARE_COINS.length}`, dx + 10, dy + 8, { color: '#e0a84a', bold: true });
    UI.bar(ctx, dx + 10, dy + 20, dw - 20, 3, total / RARE_COINS.length, '#e0a84a');
    if (!c) {
      Font.drawWrapped(ctx, 'Seltene Münzen findest du beim Zerschlagen von Sparschweinen. Jede Münze gibt einen dauerhaften Bonus – auch nach dem Bankrott! Fahre über eine Münze für Details.', dx + 10, dy + 34, dw - 20, { color: '#a8927a' });
      Font.draw(ctx, `Fundchance: ${(stats().rareChance * 100).toFixed(2)}%`, dx + 10, dy + dh - 16, { color: '#8a7a6a' });
      return;
    }
    const owned = !!P.collection[c.id];
    const big = Art.rareCoin(c, 44);
    const k = Math.cos(this.t * 1.6);
    // little velvet showcase in a wooden frame
    const sx = dx + 30, sy = dy + 30, sw = dw - 60, sh = 66;
    ctx.fillStyle = '#2a1408'; ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
    ctx.fillStyle = '#6a3c1e'; ctx.fillRect(sx - 3, sy - 3, sw + 6, sh + 6);
    ctx.fillStyle = '#9a6034'; ctx.fillRect(sx - 3, sy - 3, sw + 6, 1);
    ctx.fillStyle = '#18203c'; ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(sx, sy, sw, 3);
    const glow = ctx.createRadialGradient(dx + dw / 2, sy + sh / 2, 4, dx + dw / 2, sy + sh / 2, 46);
    glow.addColorStop(0, owned ? RARITY[c.r].color + '66' : 'rgba(60,60,80,0.3)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(sx, sy, sw, sh);
    ctx.save(); ctx.translate(dx + dw / 2, sy + sh / 2); ctx.scale(Math.max(0.08, Math.abs(k)), 1);
    ctx.drawImage(owned ? (k < 0 ? Art.tint('rcbb' + c.id, big, 'gold') : big) : Art.tint('rcd' + c.id, big, 'dark'), -big.width / 2, -big.height / 2);
    ctx.restore();
    ctx.fillStyle = 'rgba(220,235,255,0.06)';
    ctx.beginPath(); ctx.moveTo(sx + 14, sy); ctx.lineTo(sx + 34, sy); ctx.lineTo(sx + 4, sy + sh); ctx.lineTo(sx - 16 < sx ? sx : sx - 16, sy + sh); ctx.fill();
    // brass name plate
    const nm = owned ? c.name : '???';
    const pw = Math.min(dw - 20, Font.measure(nm, 1, true) + 20);
    brassPlate(ctx, dx + dw / 2 - pw / 2, dy + 98, pw, 13);
    Font.draw(ctx, nm, dx + dw / 2, dy + 101, { align: 'center', color: '#3a2008', bold: true, shadow: null });
    Font.draw(ctx, RARITY[c.r].name, dx + dw / 2, dy + 116, { align: 'center', color: RARITY[c.r].color });
    if (owned) {
      Font.drawWrapped(ctx, '"' + c.desc + '"', dx + dw / 2, dy + 130, dw - 20, { color: '#a8927a', align: 'center' });
      UI.panel(ctx, dx + 10, dy + 176, dw - 20, 24, { fill: '#1a2a1a', border: '#3a6a3a', shadow: false });
      Font.draw(ctx, bonusText(c.bonus), dx + dw / 2, dy + 184, { align: 'center', color: '#9af08a', bold: true });
      Font.draw(ctx, `Gefunden: ${P.collection[c.id]}x`, dx + dw / 2, dy + 210, { align: 'center', color: '#8a7a6a' });
    } else {
      Font.drawWrapped(ctx, 'Noch nicht entdeckt. Zerschlage weiter Schweine! Glück erhöht die Chance auf seltenere Münzen.', dx + dw / 2, dy + 130, dw - 20, { color: '#6a5a5a', align: 'center' });
    }
  }

  drawDex(ctx, dt) {
    const list = PIG_ORDER;
    const cols = 7, cw = 58, ch = 64;
    let hovered = null;
    list.forEach((id, i) => {
      const x = 10 + (i % cols) * (cw + 2), y = 58 + Math.floor(i / cols) * (ch + 3);
      const seen = !!P.dex[id];
      const r = UI.region('dex_' + id, x, y, cw, ch);
      if (r.hover) hovered = id;
      const selected = this.selPig === id;
      UI.panel(ctx, x, y - (r.hover ? 1 : 0), cw, ch, { fill: r.hover || selected ? '#2a1e17' : '#1a120e', border: selected ? '#c8913a' : seen ? '#5a4030' : '#2a201a', shadow: false });
      const fr = r.hover && seen ? 1 + (Math.floor(this.t * 8) % 4) : 0;
      const spr = Art.pig(id, fr);
      const k = Math.min(1, 40 / spr.w * 1.1);
      const bx = x + cw / 2, by = y + ch - 16;
      ctx.save(); ctx.translate(bx, by - (r.hover ? 1 : 0)); ctx.scale(k, k);
      ctx.drawImage(seen ? spr.canvas : Art.pigTint(id, 0, 'dark'), -spr.ax, -spr.ay);
      if (seen) {
        ctx.fillStyle = '#fff';
        for (const e of spr.eyes) ctx.fillRect(e.x - spr.ax, e.y - spr.ay + 1 + (fr === 2 || fr === 4 ? -1 : 0), spr.eyeW, spr.eyeH - 2);
        ctx.fillStyle = '#1a0e0e';
        for (const e of spr.eyes) ctx.fillRect(e.x - spr.ax + 1, e.y - spr.ay + 1 + (fr === 2 || fr === 4 ? -1 : 0), 2, 2);
      }
      ctx.restore();
      Font.draw(ctx, seen ? fmt(P.dex[id]) + 'x' : '???', x + cw / 2, y + ch - 12, { align: 'center', color: seen ? '#c8b8a0' : '#4a3a30', shadow: 'outline' });
      if (r.click) { this.selPig = id; Sound.play(seen ? 'oink' : 'click'); }
    });
    const id = hovered || this.selPig;
    const dx = 430, dy = 58, dw = 202, dh = 268;
    UI.panel(ctx, dx, dy, dw, dh, { fill: 'rgba(20,14,12,0.95)', border: '#5a4030' });
    const found = PIG_ORDER.filter((p) => P.dex[p]).length;
    Font.draw(ctx, `Entdeckt: ${found}/${PIG_ORDER.length}`, dx + 10, dy + 8, { color: '#e0a84a', bold: true });
    UI.bar(ctx, dx + 10, dy + 20, dw - 20, 3, found / PIG_ORDER.length, '#ff9ac0');
    if (!id) { Font.drawWrapped(ctx, 'Hier landet jedes Sparschwein, das du zerschlagen hast. Neue Arten schaltest du im Skillbaum frei.', dx + 10, dy + 34, dw - 20, { color: '#a8927a' }); return; }
    const d = PIGS[id];
    const seen = !!P.dex[id];
    const spr = Art.pig(id, 1 + (Math.floor(this.t * 7) % 4));
    ctx.save(); ctx.translate(dx + dw / 2, dy + 92); ctx.scale(2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 12 * spr.s, 3 * spr.s, 0, 0, TAU); ctx.fill();
    ctx.drawImage(seen ? spr.canvas : Art.pigTint(id, 0, 'dark'), -spr.ax, -spr.ay);
    ctx.restore();
    Font.draw(ctx, seen ? d.name : '???', dx + dw / 2, dy + 104, { align: 'center', color: '#ffffff', bold: true });
    if (seen) {
      Font.drawWrapped(ctx, d.desc, dx + dw / 2, dy + 120, dw - 20, { color: '#a8927a', align: 'center' });
      const sc = pigScale(P.C.billIdx);
      const rows = [['Leben', fmt(d.hp * sc.hp)], ['Wert', money(d.value * sc.value * stats().coinMult)], ['Tempo', d.speed > 40 ? 'schnell' : d.speed > 15 ? 'normal' : d.speed > 0 ? 'langsam' : 'schläft'], ['Zerschlagen', fmt(P.dex[id])]];
      rows.forEach(([a, b], i) => {
        Font.draw(ctx, a, dx + 14, dy + 170 + i * 14, { color: '#8a7a6a' });
        Font.draw(ctx, b, dx + dw - 14, dy + 170 + i * 14, { align: 'right', color: '#f3e6cf' });
      });
    } else {
      const sk = SKILLS.find((s) => s.unlockPig === id);
      const how = sk ? 'Skillbaum: ' + sk.name : id === 'golden' ? 'Skillbaum: Goldschwein' : id === 'diamond' ? 'Skillbaum: Diamantschwein' : 'Spezialschwein';
      Font.drawWrapped(ctx, 'Noch nicht entdeckt.\nFreischaltung: ' + how, dx + dw / 2, dy + 120, dw - 20, { color: '#6a5a5a', align: 'center' });
    }
  }
}

// ------------------------------------------------------------
//  ACHIEVEMENTS
// ------------------------------------------------------------
class AchievementView {
  constructor(hub) { this.hub = hub; this.scroll = 0; this.vs = 0; this.t = 0; this.drag = null; }
  draw(ctx, dt) {
    this.t += dt;
    const done = ACHIEVEMENTS.filter((a) => P.achievements[a.id]).length;
    Font.draw(ctx, `ERFOLGE  ${done}/${ACHIEVEMENTS.length}`, 12, 38, { color: '#e0a84a', bold: true });
    UI.bar(ctx, 140, 41, 200, 3, done / ACHIEVEMENTS.length, '#e0a84a');
    // stats summary on the right of the header
    Font.draw(ctx, `Schweine: ${fmt(P.stats.pigs)}  ·  Runs: ${P.stats.runs}  ·  Jackpots: ${P.stats.jackpots}  ·  Beste Combo: ${P.stats.bestCombo}`, W - 10, 38, { align: 'right', color: '#8a7a6a' });
    const top = 52, bottom = H - 30;
    const rowH = 40;
    const rows = Math.ceil(ACHIEVEMENTS.length / 2);
    const maxScroll = Math.max(0, rows * rowH - (bottom - top) + 6);
    if (UI.enabled) {
      if (Input.wheel) this.vs += Input.wheel * 4;
      if (Input.pressed && Input.y > top && Input.y < bottom) this.drag = { y: Input.y, s: this.scroll };
      if (this.drag && Input.down) { this.scroll = this.drag.s - (Input.y - this.drag.y); this.vs = 0; }
      if (Input.released) this.drag = null;
    }
    this.scroll += this.vs * dt; this.vs *= Math.exp(-8 * dt);
    this.scroll = clamp(this.scroll, 0, maxScroll);
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
    ACHIEVEMENTS.forEach((a, i) => {
      const x = 10 + (i % 2) * 312, y = top + Math.floor(i / 2) * rowH - this.scroll;
      if (y < top - rowH || y > bottom) return;
      const got = !!P.achievements[a.id];
      const [cur, goal] = a.check(P);
      UI.panel(ctx, x, y, 306, rowH - 4, { fill: got ? '#2a2216' : '#1a120e', border: got ? '#c8913a' : '#3a2a20', shadow: false });
      UI.panel(ctx, x + 4, y + 4, 28, 28, { fill: got ? '#4a3420' : '#120c0a', border: got ? '#ffd040' : '#2a201a', shadow: false });
      ctx.drawImage(got ? Art.icon(a.icon) : Art.iconGray(a.icon), x + 12, y + 12);
      Font.draw(ctx, a.name, x + 38, y + 5, { color: got ? '#ffe0a0' : '#c8b8a0', bold: true });
      Font.draw(ctx, a.desc, x + 38, y + 16, { color: '#8a7a6a' });
      Font.draw(ctx, rewardText(a.reward), x + 300, y + 5, { align: 'right', color: got ? '#6a5a4e' : a.reward.pp ? '#c8a0ff' : '#ff9aa0' });
      if (!got) {
        UI.bar(ctx, x + 38, y + 28, 200, 2, Math.min(1, cur / goal), '#a07a3a');
        Font.draw(ctx, `${fmt(Math.min(cur, goal))}/${fmt(goal)}`, x + 300, y + 24, { align: 'right', color: '#6a5a4e' });
      } else Font.draw(ctx, '✓ Erreicht', x + 300, y + 24, { align: 'right', color: '#9af08a' });
    });
    ctx.restore();
    if (maxScroll > 0) {
      const sh = (bottom - top) * ((bottom - top) / (rows * rowH));
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(W - 4, top, 2, bottom - top);
      ctx.fillStyle = '#c8913a'; ctx.fillRect(W - 4, top + (this.scroll / maxScroll) * (bottom - top - sh), 2, sh);
    }
  }
}
