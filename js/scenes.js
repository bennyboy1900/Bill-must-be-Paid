// ============================================================
//  MENU SCENES: title, intro, hub (bills tab), perk picker,
//  bankruptcy, prestige ring box
// ============================================================

// ---------- ambience: dust motes drifting in the lamp light ----------
class Ambience {
  constructor(n = 40) {
    this.m = [];
    for (let i = 0; i < n; i++) this.m.push({ x: rand(W), y: rand(H), vx: rand(-4, 4), vy: rand(-6, -1), ph: rand(TAU), s: rand(0.5, 1.5) });
  }
  draw(ctx, dt) {
    for (const m of this.m) {
      m.x += (m.vx + Math.sin(m.ph) * 3) * dt; m.y += m.vy * dt; m.ph += dt;
      if (m.y < -4) { m.y = H + 4; m.x = rand(W); }
      if (m.x < -4) m.x = W + 4; if (m.x > W + 4) m.x = -4;
      const light = clamp(1 - Math.hypot((m.x - 120) / 420, (m.y - 40) / 300), 0.1, 1);
      ctx.globalAlpha = 0.25 * light * (0.6 + 0.4 * Math.sin(m.ph * 2));
      ctx.fillStyle = '#ffe8b0';
      ctx.fillRect(sp(m.x), sp(m.y), m.s, m.s);
    }
    ctx.globalAlpha = 1;
  }
}

function backdrop(ctx, dim = 0.55) {
  ctx.drawImage(Art.table(), 0, 0);
  ctx.fillStyle = `rgba(14,7,5,${dim})`;
  ctx.fillRect(0, 0, W, H);
}

// ---------- Bill talking ----------
class Speech {
  constructor() { this.text = ''; this.shown = 0; this.expr = 'neutral'; this.t = 0; this.lastC = 0; }
  say(text, expr = 'neutral') {
    if (text === this.text) return;
    this.text = text; this.shown = 0; this.expr = expr; this.lastC = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.shown < this.text.length) {
      this.shown = Math.min(this.text.length, this.shown + dt * 42);
      if (Math.floor(this.shown) > this.lastC + 2) { this.lastC = Math.floor(this.shown); Sound.play('type', null, 0.04); }
    }
  }
  get talking() { return this.shown < this.text.length; }
  skip() { this.shown = this.text.length; }
  drawBill(ctx, x, y, scale = 1, expr) {
    const blink = this.t % 3.7 < 0.12;
    const talk = this.talking && Math.floor(this.t * 9) % 2 === 0;
    const img = Art.bill(expr || this.expr, talk, blink);
    const bob = Math.sin(this.t * 2) * 1.2;
    const breathe = 1 + Math.sin(this.t * 2) * 0.008;
    ctx.drawImage(img, sp(x), sp(y + bob), img.width * scale, img.height * scale * breathe);
  }
  drawBubble(ctx, x, y, w, tailX) {
    if (!this.text) return;
    const full = Font.wrap(this.text, w - 14);
    const h = full.length * 11 + 10;
    const shownText = this.text.slice(0, Math.floor(this.shown));
    const lines = Font.wrap(shownText, w - 14);
    UI.panel(ctx, x, y, w, h, { fill: '#f6ead2', border: '#3a2a20', edge: '#1a100c' });
    // tail
    ctx.fillStyle = '#1a100c';
    for (let i = 0; i < 6; i++) ctx.fillRect(tailX - 4 + i, y + h - 1 + i, 9 - i * 1.5, 1);
    ctx.fillStyle = '#f6ead2';
    for (let i = 0; i < 5; i++) ctx.fillRect(tailX - 3 + i, y + h - 2 + i, 7 - i * 1.5, 1);
    lines.forEach((l, i) => Font.draw(ctx, l, x + 7, y + 6 + i * 11, { color: '#3a2418', shadow: null }));
  }
}

// ============================================================
//  TITLE
// ============================================================
class TitleScene {
  constructor() {
    this.t = 0;
    this.amb = new Ambience(50);
    this.walkers = [];
    this.parts = [];
    this.smashT = 2;
    this.speech = new Speech();
    for (let i = 0; i < 5; i++) this.addWalker(rand(W));
  }
  enter() { Sound.Music.play('menu'); }
  addWalker(x) {
    const types = ['pink', 'dots', 'wood', 'runner', 'party', 'golden', 'mafia', 'porcelain', 'clown', 'pirate'];
    const type = pick(types);
    const dir = chance(0.5) ? 1 : -1;
    this.walkers.push({ type, x: x !== undefined ? x : dir > 0 ? -30 : W + 30, y: rand(286, 336), dir, sp: rand(18, 34), ph: rand(10), sq: 0, sqv: 0 });
  }
  update(dt) {
    this.t += dt;
    this.speech.update(dt);
    for (const w of this.walkers) {
      w.x += w.dir * w.sp * dt; w.ph += (w.sp * dt) / 3.2;
      w.sqv += (-300 * w.sq - 15 * w.sqv) * dt; w.sq += w.sqv * dt;
    }
    this.walkers = this.walkers.filter((w) => w.x > -40 && w.x < W + 40 && !w.dead);
    if (this.walkers.length < 6 && chance(dt * 0.8)) this.addWalker();
    this.smashT -= dt;
    if (this.smashT <= 0) {
      this.smashT = rand(2.2, 3.5);
      const vis = this.walkers.filter((w) => w.x > 60 && w.x < W - 60);
      if (vis.length) this.ham = { w: pick(vis), t: 0 };
    }
    if (this.ham) {
      this.ham.t += dt;
      const w = this.ham.w;
      if (this.ham.t > 0.35 && !this.ham.done) {
        this.ham.done = true;
        w.dead = true;
        const cols = Art.pigShardColors(w.type);
        for (let i = 0; i < 16; i++) this.parts.push(new Shard(w.x, w.y - 6, 8, pick(cols), i < 4));
        for (let i = 0; i < 12; i++) this.parts.push(new Spark(w.x, w.y - 10, '#ffe070', 180));
        for (let i = 0; i < 5; i++) this.parts.push(new Dust(w.x, w.y, 1.2));
        this.parts.push(new Ring(w.x, w.y, 30, '#ffffff', 0.3, 2));
        Sound.play('smash', 1, 0.1);
      }
      if (this.ham.t > 0.7) this.ham = null;
    }
    this.parts = this.parts.filter((p) => p.update(dt));
  }
  draw(ctx, dt) {
    backdrop(ctx, 0.35);
    this.amb.draw(ctx, dt);
    // walkers
    const ws = this.walkers.slice().sort((a, b) => a.y - b.y);
    for (const w of ws) {
      const fr = 1 + (Math.floor(w.ph) % 4);
      const spr = Art.pig(w.type, fr);
      ctx.fillStyle = 'rgba(10,4,2,0.3)';
      ctx.beginPath(); ctx.ellipse(sp(w.x), sp(w.y + 1), 11 * spr.s, 3 * spr.s, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(sp(w.x), sp(w.y)); ctx.scale(w.dir, 1);
      ctx.drawImage(spr.canvas, -spr.ax, -spr.ay);
      ctx.fillStyle = '#fff';
      for (const e of spr.eyes) { ctx.fillRect(e.x - spr.ax, e.y - spr.ay + 1 + (fr % 2 === 0 ? -1 : 0), spr.eyeW, spr.eyeH - 2); }
      ctx.fillStyle = '#1a0e0e';
      for (const e of spr.eyes) ctx.fillRect(e.x - spr.ax + 1, e.y - spr.ay + 1 + (fr % 2 === 0 ? -1 : 0), 2, 2);
      ctx.restore();
    }
    for (const p of this.parts) p.draw(ctx);
    if (this.ham) {
      const w = this.ham.w;
      const k = this.ham.t < 0.35 ? Ease.inQuad(this.ham.t / 0.35) : 1 - (this.ham.t - 0.35) / 0.35;
      const ang = lerp(20, -40, clamp(k, 0, 1));
      const L = Art.hammer('wood').len * HS, a0 = (-40 * Math.PI) / 180;
      const px = w.x - Math.sin(a0) * L, py = w.y - 6 + Math.cos(a0) * L;
      const fr = Art.hammerRot('wood', ang);
      ctx.save(); ctx.translate(sp(px), sp(py)); ctx.scale(HS, HS);
      ctx.drawImage(fr.canvas, -fr.ox, -fr.oy);
      ctx.restore();
    }
    // logo
    this.drawLogo(ctx, W / 2, 40);
    // Bill
    this.speech.drawBill(ctx, 26, 168, 2, this.t % 6 < 3 ? 'money' : 'happy');
    // menu
    const bx = W / 2 - 75;
    let y = 170;
    const has = P.stats.runs > 0 || P.C.billIdx > 0 || P.cycle > 1;
    if (UI.button(ctx, 't_play', bx, y, 150, 26, has ? 'Weiterspielen' : 'Spielen', { style: 'gold', key: 'Enter', scale: 1, sub: has ? `Tag ${P.C.day} · Zyklus ${P.cycle}` : null, subColor: '#5a3410' })) {
      Sound.init();
      if (!P.seenIntro) Game.goto(new IntroScene());
      else Game.goto(new HubScene());
    }
    y += 34;
    if (UI.button(ctx, 't_set', bx, y, 150, 22, 'Einstellungen')) Game.openSettings();
    y += 28;
    if (UI.button(ctx, 't_full', bx, y, 150, 22, 'Vollbild')) Game.fullscreen();
    y += 28;
    if (has && UI.button(ctx, 't_new', bx, y, 150, 22, 'Neues Spiel', { style: 'ghost' })) {
      Game.confirm('Wirklich ALLES löschen und neu anfangen? Ringe, Hämmer, Sammlung - alles weg!', () => { resetGame(); invalidateStats(); Game.goto(new TitleScene()); });
    }
    Font.draw(ctx, 'v1.0 · Ein Klon von "Bills Must Be Paid" · Pixel-Edition', W - 6, H - 12, { align: 'right', color: '#7a6a5a', shadow: null });
  }
  drawLogo(ctx, cx, y) {
    const lines = [['BILL', 'MUST'], ['BE', 'PAID!']];
    const sc = 4;
    lines.forEach((words, li) => {
      const text = words.join(' ');
      const w = Font.measure(text, sc, true);
      let x = cx - w / 2;
      let i = 0;
      for (const ch of text) {
        const cw = Font.measure(ch, sc, true);
        if (ch !== ' ') {
          const k = this.t * 3 - i * 0.35 - li * 1.2;
          const appear = clamp(this.t * 2.5 - i * 0.08 - li * 0.4, 0, 1);
          const bounce = Math.sin(k) * 2;
          const s = Ease.outBack(appear);
          if (appear > 0) Font.drawScaled(ctx, ch, x + cw / 2, y + li * 44 + bounce + 14, s, { scale: sc, color: '#ffd040', shadow: 'thick', bold: true, gradient: li === 0 ? GOLD_GRAD : FIRE_GRAD });
        }
        x += cw + sc;
        i++;
      }
    });

  }
}

// ============================================================
//  INTRO (Bill introduces himself)
// ============================================================
class IntroScene {
  constructor() { this.i = 0; this.speech = new Speech(); this.speech.say(LINES.intro[0], 'neutral'); this.t = 0; this.amb = new Ambience(30); }
  enter() { Sound.Music.play('menu'); }
  update(dt) {
    this.t += dt;
    this.speech.update(dt);
    if (Input.pressed || Input.key(' ') || Input.key('Enter')) {
      if (this.speech.talking) this.speech.skip();
      else {
        this.i++;
        if (this.i >= LINES.intro.length) { P.seenIntro = true; saveGame(); Game.goto(new HubScene()); return; }
        this.speech.say(LINES.intro[this.i], ['neutral', 'worried', 'smug', 'angry'][this.i] || 'happy');
      }
    }
  }
  draw(ctx, dt) {
    backdrop(ctx, 0.7);
    this.amb.draw(ctx, dt);
    this.speech.drawBill(ctx, W / 2 - 60, 150, 2);
    this.speech.drawBubble(ctx, W / 2 - 130, 60, 260, W / 2);
    if (!this.speech.talking) Font.draw(ctx, Input.isTouch ? 'Tippen zum Fortfahren' : 'Klicken oder LEERTASTE', W / 2, 30, { align: 'center', color: T.dim, alpha: 0.5 + Math.sin(this.t * 5) * 0.5 });
  }
}

// ============================================================
//  HUB (desk with tabs)
// ============================================================
const TABS = [
  { id: 'bills', name: 'Rechnungen' },
  { id: 'tree', name: 'Skillbaum' },
  { id: 'forge', name: 'Schmiede' },
  { id: 'collection', name: 'Sammlung' },
  { id: 'achievements', name: 'Erfolge' },
];

class HubScene {
  constructor(o = {}) {
    this.tab = o.tab || 'bills';
    this.t = 0;
    this.amb = new Ambience(30);
    this.speech = new Speech();
    this.parts = []; this.texts = []; this.fx = [];
    this.dispMoney = P.C.money;
    this.dispGems = P.gems;
    this.tabX = 0; this.tabW = 0;
    this.overlay = null;
    this.paper = { y: -260, vy: 0, state: 'in', t: 0, rot: 0, x: 0 };
    this.tree = new SkillTreeView(this);
    this.forge = new ForgeView(this);
    this.coll = new CollectionView(this);
    this.ach = new AchievementView(this);
    invalidateStats();
    // pending perk choice survives reloads
    if (P.C.pendingPerks) this.overlay = new PerkPicker(this, P.C.pendingPerks);
    if (o.achievements) for (const a of o.achievements) UI.toast({ title: 'Erfolg: ' + a.name, text: rewardText(a.reward), icon: Art.icon(a.icon), color: '#ffd040', life: 4 });
    if (o.achievements && o.achievements.length) Sound.play('achievement');
    this.billLine(o.fromRun);
  }
  enter() { Sound.Music.play('menu'); }
  billLine(fromRun) {
    const b = currentBill();
    const fill = (s) => s.replace('{bill}', b.name);
    if (P.C.dueDays <= 0) {
      if (P.C.money >= b.amount) this.speech.say(fill(pick(LINES.dueNow)), 'worried');
      else this.speech.say(LINES.cantPay[0] + (Object.keys(P.C.skills).length ? ' ...Moment! Ich könnte Skills verkaufen (75% zurück)!' : ''), 'shocked');
    } else if (P.C.dueDays === 1 && P.C.money < b.amount) this.speech.say(fill(pick(LINES.dueSoon)), 'worried');
    else if (P.C.money >= b.amount * 3 && fromRun) this.speech.say(pick(LINES.rich), 'money');
    else if (fromRun && P.C.money >= b.amount) this.speech.say('Genug Geld für die ' + b.name + '! Bezahlen?', 'happy');
    else this.speech.say(pick(LINES.hub), 'neutral');
  }
  text(x, y, s, c, o) { this.texts.push(new FloatText(x, y, s, c, o)); }

  update(dt) {
    this.t += dt;
    this.speech.update(dt);
    this.parts = this.parts.filter((p) => p.update(dt));
    this.texts = this.texts.filter((p) => p.update(dt));
    this.fx = this.fx.filter((p) => p.update(dt));
    this.dispMoney = damp(this.dispMoney, P.C.money, 9, dt);
    if (Math.abs(this.dispMoney - P.C.money) < 1) this.dispMoney = P.C.money;
    this.dispGems = damp(this.dispGems, P.gems, 9, dt);
    if (Math.abs(this.dispGems - P.gems) < 0.5) this.dispGems = P.gems;
    if (this.overlay && this.overlay.update) this.overlay.update(dt);
  }

  canStartRun() {
    return P.C.dueDays > 0 && !this.overlay && this.paper.state !== 'paid';
  }

  draw(ctx, dt) {
    // the bills tab keeps the cosy desk visible, other tabs get a calmer backdrop
    backdrop(ctx, this.tab === 'bills' ? 0.7 : 0.84);
    this.amb.draw(ctx, dt);
    const ov = !!this.overlay;
    UI.enabled = !ov;
    // tab content
    if (this.tab === 'bills') this.drawBills(ctx, dt);
    else if (this.tab === 'tree') this.tree.draw(ctx, dt);
    else if (this.tab === 'forge') this.forge.draw(ctx, dt);
    else if (this.tab === 'collection') this.coll.draw(ctx, dt);
    else if (this.tab === 'achievements') this.ach.draw(ctx, dt);
    for (const f of this.fx) f.draw(ctx);
    for (const p of this.parts) p.draw(ctx);
    this.drawHeader(ctx, dt);
    this.drawFooter(ctx);
    for (const t of this.texts) t.draw(ctx);
    UI.enabled = true;
    if (this.overlay) this.overlay.draw(ctx, dt);
  }

  drawHeader(ctx, dt) {
    ctx.fillStyle = 'rgba(10,5,4,0.88)';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(0, 30, W, 1);
    // tabs
    let tw = 0;
    const gap = 18;
    for (const t of TABS) tw += Font.measure(t.name, 1, true) + gap;
    let x = W / 2 - tw / 2 - 20;
    for (const t of TABS) {
      const w = Font.measure(t.name, 1, true);
      const r = UI.region('tab_' + t.id, x - 6, 4, w + 12, 22);
      const act = this.tab === t.id;
      if (act) { this.tabX = damp(this.tabX || x, x, 16, dt); this.tabW = damp(this.tabW || w, w, 16, dt); }
      const col = act ? '#ffffff' : r.hover ? '#e8d8c0' : '#9a8670';
      Font.draw(ctx, t.name, x, 11 - (r.hover && !act ? 1 : 0), { color: col, bold: true, shadow: 'drop' });
      // notification dot
      if (t.id === 'tree' && SKILLS.some((s) => skillUnlocked(s) && skillLevel(s.id) < s.max && skillPrice(s) <= P.C.money)) this.dot(ctx, x + w + 3, 8);
      if (t.id === 'forge' && this.forge.anyAffordable()) this.dot(ctx, x + w + 3, 8);
      if (t.id === 'bills' && P.C.money >= currentBill().amount) this.dot(ctx, x + w + 3, 8, '#6fd65a');
      if (r.click && !act) { this.tab = t.id; Sound.play('tab'); }
      x += w + gap;
    }
    ctx.fillStyle = '#ffb030';
    ctx.fillRect(Math.round(this.tabX - 2), 24, Math.round(this.tabW + 4), 2);
    ctx.fillStyle = '#ffe080';
    ctx.fillRect(Math.round(this.tabX - 2), 24, Math.round(this.tabW + 4), 1);
    // day / cycle
    ctx.drawImage(Art.icon('calendar'), 6, 9);
    Font.draw(ctx, `Tag ${P.C.day}`, 21, 7, { color: '#f3e6cf', bold: true });
    Font.draw(ctx, `Zyklus ${P.cycle}`, 21, 17, { color: '#a8927a' });
    // money & gems pills
    UI.panel(ctx, W - 92, 3, 88, 16, { fill: '#2a1d17', border: '#6a4a30' });
    Font.draw(ctx, money(this.dispMoney), W - 10, 7, { align: 'right', color: '#ffffff', bold: true });
    ctx.drawImage(Art.coin('gold', Math.floor(this.t * 8) % 6), W - 88, 6);
    UI.panel(ctx, W - 150, 3, 56, 16, { fill: '#2a1d17', border: '#6a4a30' });
    ctx.drawImage(Art.gem('ruby', Math.floor(this.t * 3) % 4), W - 147, 6);
    Font.draw(ctx, fmt(Math.round(this.dispGems)), W - 99, 7, { align: 'right', color: '#ffb0b8', bold: true });
    if (P.pp > 0 || P.cycle > 1 || P.record > 0) Font.draw(ctx, (P.record > 0 ? `Rekord #${P.record}  ·  ` : '') + `${P.pp} VP`, W - 10, 21, { align: 'right', color: '#c8a0ff' });
  }
  dot(ctx, x, y, col = '#ff4a3a') {
    const a = 0.7 + Math.sin(this.t * 6) * 0.3;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#1a0e0c'; ctx.fillRect(x - 1, y - 1, 5, 5);
    ctx.fillStyle = col; ctx.fillRect(x, y, 3, 3);
    ctx.globalAlpha = 1;
  }

  drawFooter(ctx) {
    ctx.fillStyle = 'rgba(8,4,3,0.85)';
    ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(0, H - 28, W, 1);
    if (UI.button(ctx, 'f_menu', 8, H - 23, 86, 18, 'Hauptmenü', { style: 'ghost' })) Game.goto(new TitleScene());
    if (UI.button(ctx, 'f_set', 100, H - 23, 18, 18, '', { style: 'ghost', icon: GEAR_ICON() })) Game.openSettings();
    // tab specific
    if (this.tab === 'tree') {
      const spent = this.tree.spent();
      if (UI.button(ctx, 'f_reset', 130, H - 23, 120, 18, 'Skills zurücksetzen', { style: 'ghost', disabled: spent <= 0, tip: `Erstattet 75% (${money(Math.floor(spent * 0.75))})` })) {
        Game.confirm(`Alle Skills zurücksetzen? Du bekommst ${money(Math.floor(spent * 0.75))} zurück (75%).`, () => this.tree.reset());
      }
    }
    if (this.tab === 'bills' && P.C.billIdx > 0) {
      if (UI.button(ctx, 'f_bank', 130, H - 23, 120, 18, 'Bankrott erklären', { style: 'ghost', tip: 'Freiwillig neu starten und Vermächtnispunkte ausgeben.' })) {
        Game.confirm('Freiwillig Bankrott anmelden? Geld, Skills, Perks und Hämmer gehen verloren. Ringe, Edelsteine und Sammlung bleiben.', () => Game.goto(new BankruptScene()));
      }
    }
    const due = P.C.dueDays <= 0;
    const label = due ? (P.C.money >= currentBill().amount ? 'Erst bezahlen!' : 'BANKROTT') : 'Weiter';
    const sub = due ? '' : `Tag ${P.C.day} beginnen`;
    if (due && P.C.money < currentBill().amount && !this.overlay) {
      if (UI.button(ctx, 'f_go', W - 140, H - 25, 132, 22, 'Bankrott...', { style: 'red' })) Game.goto(new BankruptScene());
    } else if (UI.button(ctx, 'f_go', W - 140, H - 25, 132, 22, label, { style: 'gold', disabled: !this.canStartRun(), key: ' ', keyLabel: 'LEER', onDisabled: () => { this.tab = 'bills'; } })) {
      Game.goto(new RunScene());
    }
  }

  // ------------------------------------------------------------
  //  BILLS TAB
  // ------------------------------------------------------------
  drawBills(ctx, dt) {
    const b = currentBill();
    const pp = this.paper;
    pp.t += dt;
    // paper physics
    if (pp.state === 'in') {
      pp.vy += (0 - pp.y) * 220 * dt; pp.vy *= Math.exp(-11 * dt); pp.y += pp.vy * dt;
      if (pp.t === dt) Sound.play('paper');
      if (Math.abs(pp.y) < 0.5 && Math.abs(pp.vy) < 5) { pp.state = 'idle'; pp.y = 0; }
    } else if (pp.state === 'paid') {
      if (pp.t > 1.1) { pp.x += (pp.t - 1.1) * 2400 * dt; pp.rot += dt * 0.6; }
      if (pp.t > 1.6) { pp.state = 'gone'; this.onPaperGone(); }
    }
    // Bill
    const expr = P.C.dueDays <= 0 && P.C.money < b.amount ? 'shocked' : pp.state === 'paid' ? 'money' : undefined;
    this.speech.drawBill(ctx, 34, 172, 2, expr);
    this.speech.drawBubble(ctx, 14, 52, 180, 100);
    if (UI.region('billchar', 34, 172, 120, 130).click) { this.billLine(false); Sound.play('oink'); }

    if (pp.state !== 'gone') {
      ctx.save();
      const px = W / 2 - 100 + pp.x, py = 40 + pp.y;
      ctx.translate(px + 100, py + 130); ctx.rotate(pp.rot); ctx.translate(-px - 100, -py - 130);
      this.drawPaper(ctx, px, py, b);
      ctx.restore();
    }
    // buttons
    if (pp.state === 'idle' || pp.state === 'in') {
      const canPay = P.C.money >= b.amount;
      const due = P.C.dueDays <= 0;
      if (UI.button(ctx, 'b_not', W / 2 - 104, 294, 100, 26, 'Noch nicht', { style: 'dark', disabled: due, scale: 1, tip: due ? 'Heute fällig!' : 'Erst noch Schweine zerschlagen.' })) {
        Game.goto(new RunScene());
      }
      if (UI.button(ctx, 'b_pay', W / 2 + 4, 294, 100, 26, 'Bezahlen', { style: canPay ? 'green' : 'dark', disabled: !canPay, tip: canPay ? null : 'Dir fehlen ' + money(b.amount - P.C.money) })) this.payBill();
    }
    // right column: upcoming bills, today's event, perks
    const rx = W - 186, rw = 176;
    let ry = 40;
    UI.panel(ctx, rx, ry, rw, 84, { fill: 'rgba(30,20,16,0.92)', border: '#5a4030' });
    Font.draw(ctx, 'Danach fällig', rx + 8, ry + 6, { color: '#e0a84a', bold: true });
    for (let i = 1; i <= 3; i++) {
      const nb = billInfo(P.C.billIdx + i);
      const y = ry + 20 + (i - 1) * 21;
      const a = i === 1 ? 1 : 0.7;
      Font.draw(ctx, Font.fit(`#${nb.index + 1} ${nb.name}`, rw - 60), rx + 8, y, { color: '#d8c8b0', alpha: a });
      Font.draw(ctx, money(nb.amount), rx + rw - 8, y, { align: 'right', color: '#ff9a7a', alpha: a });
      Font.draw(ctx, `Frist: ${nb.days + stats().dueBonus} Tage`, rx + 8, y + 9, { color: '#7a6a5a', alpha: a });
    }
    ry += 90;
    // today's event
    const ev = P.C.event ? EVENT_BY_ID[P.C.event] : null;
    if (ev) {
      const head = Font.wrap('Heute: ' + ev.name, rw - 34, 1, true), lines = Font.wrap(ev.d, rw - 34);
      const eh = 10 + (head.length + lines.length) * 10;
      UI.panel(ctx, rx, ry, rw, eh, { fill: '#2a2016', border: ev.color });
      ctx.drawImage(Art.icon(ev.icon), rx + 8, ry + Math.round(eh / 2 - 6) + Math.round(Math.sin(this.t * 4)));
      head.forEach((l, i) => Font.draw(ctx, l, rx + 26, ry + 6 + i * 10, { color: ev.color, bold: true }));
      lines.forEach((l, i) => Font.draw(ctx, l, rx + 26, ry + 6 + (head.length + i) * 10, { color: '#d8c8b0' }));
      ry += eh + 6;
    } else {
      UI.panel(ctx, rx, ry, rw, 22, { fill: 'rgba(30,20,16,0.92)', border: '#5a4030' });
      Font.draw(ctx, P.C.day < 3 ? 'Ereignisse ab Tag 3' : 'Heute: ein normaler Tag', rx + 8, ry + 7, { color: '#7a6a5a' });
      ry += 28;
    }
    // perks
    const owned = Object.keys(P.C.perks).filter((k) => P.C.perks[k] > 0);
    const perRow = 8, prow = Math.max(1, Math.ceil(owned.length / perRow));
    const ph = owned.length ? 26 + prow * 21 : 44;
    UI.panel(ctx, rx, ry, rw, ph, { fill: 'rgba(30,20,16,0.92)', border: '#5a4030' });
    Font.draw(ctx, 'Deine Perks', rx + 8, ry + 6, { color: '#e0a84a', bold: true });
    if (owned.length) Font.draw(ctx, String(owned.length), rx + rw - 8, ry + 6, { align: 'right', color: '#7a6a5a' });
    if (!owned.length) Font.drawWrapped(ctx, 'Bezahle Rechnungen, um Perks zu bekommen.', rx + 8, ry + 19, rw - 16, { color: '#7a6a5a' });
    owned.forEach((id, i) => {
      const pk = PERK_BY_ID[id];
      const x = rx + 7 + (i % perRow) * 20.5, y = ry + 19 + Math.floor(i / perRow) * 21;
      const r = UI.region('perk_' + id, x, y, 18, 18);
      UI.panel(ctx, x, y - (r.hover ? 1 : 0), 18, 18, { fill: '#1a110d', border: RARITY[pk.r].color, shadow: false });
      ctx.drawImage(Art.icon(pk.icon), Math.round(x + 3), y + 3 - (r.hover ? 1 : 0));
      if (P.C.perks[id] > 1) Font.draw(ctx, String(P.C.perks[id]), x + 17, y + 11, { align: 'right', color: '#ffffff', shadow: 'outline' });
      if (r.hover) UI.tooltip([{ t: pk.name, c: RARITY[pk.r].color }, `Stufe ${P.C.perks[id]}/${pk.max}`, pk.d(P.C.perks[id])]);
    });
  }

  drawPaper(ctx, x, y, b) {
    const w = 200, h = 246;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 4, y + 5, w, h);
    ctx.fillStyle = '#f4e4c4'; ctx.fillRect(x, y, w, h);
    // paper texture
    for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(160,120,80,0.08)'; ctx.fillRect(x + ((i * 37) % w), y + ((i * 53) % h), 2, 1); }
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = '#a02020'; ctx.fillRect(x, y + h - 3, w, 3);
    const ink = '#2a1a14';
    Font.draw(ctx, b.name, x + 10, y + 10, { color: ink, shadow: null, bold: true });
    Font.draw(ctx, '····' + b.acct, x + w - 10, y + 10, { align: 'right', color: '#7a6a5a', shadow: null });
    Font.draw(ctx, `Rechnung #${b.index + 1}`, x + 10, y + 21, { color: '#8a7a6a', shadow: null });
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x + 8, y + 33, w - 16, 1);
    Font.draw(ctx, 'Fälliger Betrag', x + w / 2, y + 46, { align: 'center', color: '#a83a2a', shadow: null, bold: true });
    Font.draw(ctx, money(b.amount), x + w / 2, y + 60, { align: 'center', color: ink, shadow: null, scale: 3, bold: true });
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x + 8, y + 96, w - 16, 1);
    Font.draw(ctx, 'Fällig in', x + w / 2, y + 106, { align: 'center', color: '#a83a2a', shadow: null, bold: true });
    const dd = P.C.dueDays;
    Font.draw(ctx, dd <= 0 ? 'HEUTE' : dd === 1 ? '1 Tag' : dd + ' Tagen', x + w / 2, y + 120, { align: 'center', color: dd <= 1 ? '#c0392b' : ink, shadow: null, scale: 2, bold: true });
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x + 8, y + 146, w - 16, 1);
    // progress
    const frac = clamp(P.C.money / b.amount, 0, 1);
    Font.draw(ctx, 'Gespart', x + 12, y + 158, { color: '#6a5a4a', shadow: null });
    Font.draw(ctx, money(P.C.money) + ' / ' + money(b.amount), x + w - 12, y + 158, { align: 'right', color: frac >= 1 ? '#2a8a30' : '#6a5a4a', shadow: null });
    ctx.fillStyle = '#c8b090'; ctx.fillRect(x + 12, y + 170, w - 24, 8);
    ctx.fillStyle = frac >= 1 ? '#3aa040' : '#d0902e'; ctx.fillRect(x + 12, y + 170, Math.round((w - 24) * frac), 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 12, y + 170, Math.round((w - 24) * frac), 1);
    const miss = b.amount - P.C.money;
    Font.draw(ctx, miss > 0 ? 'Es fehlen noch ' + money(miss) : 'Genug Geld zum Bezahlen!', x + w / 2, y + 188, { align: 'center', color: miss > 0 ? '#a83a2a' : '#2a8a30', shadow: null, bold: true });
    Font.draw(ctx, '* BITTE UMGEHEND ÜBERWEISEN', x + w / 2, y + 222, { align: 'center', color: '#a8988a', shadow: null });
    // stamps
    if (this.paper.state === 'paid') this.stamp(ctx, x + w / 2, y + 120, 'BEZAHLT', '#2a9a3a', this.paper.t);
    else if (P.C.dueDays <= 0 && P.C.money < b.amount) this.stamp(ctx, x + w / 2, y + 120, 'ÜBERFÄLLIG', '#c0392b', this.t);
  }
  stamp(ctx, cx, cy, text, col, t) {
    const k = t < 0.15 ? 3 - (t / 0.15) * 2 : 1;
    const a = Math.min(1, t * 8);
    ctx.save();
    ctx.globalAlpha = a * 0.85;
    ctx.translate(cx, cy); ctx.rotate(-0.22); ctx.scale(k, k);
    const w = Font.measure(text, 3, true) + 16;
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.strokeRect(-w / 2, -18, w, 36);
    ctx.lineWidth = 1; ctx.strokeRect(-w / 2 + 4, -14, w - 8, 28);
    Font.drawScaled(ctx, text, 0, 0, 1, { scale: 3, color: col, shadow: null, bold: true });
    ctx.restore();
  }

  payBill() {
    const b = currentBill();
    const S = stats();
    P.C.money -= b.amount;
    const refund = Math.floor(b.amount * S.billRefund);
    if (refund) { P.C.money += refund; this.text(W / 2, 200, 'Rückerstattung +' + money(refund), '#9af08a', { big: true }); }
    this.paper.state = 'paid'; this.paper.t = 0;
    Sound.play('stamp');
    setTimeout(() => Sound.play('pay'), 120);
    Game.shake(4);
    for (let i = 0; i < 30; i++) this.parts.push(new Confetti(W / 2, 150));
    for (let i = 0; i < 16; i++) this.parts.push(new Spark(W / 2, 160, '#9af08a', 200));
    this.fx.push(new Ring(W / 2, 160, 80, '#9af08a', 0.4, 2));
    this.text(W / 2, 100, '-' + money(b.amount), '#ff8a6a', { big: true, scale: 2, life: 1.2 });
    const n = b.index + 1;
    if (n > P.record) {
      addPP(n - 0);
      P.record = n;
      setTimeout(() => { UI.toast({ title: 'Neuer Rekord: Rechnung #' + n, text: `+${n} Vermächtnispunkte`, icon: Art.icon('star'), color: '#c8a0ff' }); Sound.play('record'); }, 600);
    }
    this.speech.say(pick(LINES.paid), 'money');
    P.C.pendingPerks = rollPerks(S.perkChoices);
    saveGame();
    checkAchievements().forEach((a) => UI.toast({ title: 'Erfolg: ' + a.name, text: rewardText(a.reward), icon: Art.icon(a.icon), color: '#ffd040' }));
  }
  onPaperGone() {
    this.overlay = new PerkPicker(this, P.C.pendingPerks);
  }
  afterPerk() {
    // next bill
    P.C.billIdx++;
    const nb = currentBill();
    P.C.dueDays = nb.days + stats().dueBonus;
    P.C.pendingPerks = null;
    saveGame();
    invalidateStats();
    this.overlay = null;
    this.paper = { y: -280, vy: 0, state: 'in', t: 0, rot: 0, x: 0 };
    this.speech.say('Oh nein. Die ' + nb.name + '. ' + nb.q, 'worried');
  }
}

let _gear = null;
function GEAR_ICON() {
  if (_gear) return _gear;
  const g = new Art.PG(12, 12);
  g.ell(6, 6, 4.5, 4.5, '#c8b8a0');
  [[6, 0], [6, 11], [0, 6], [11, 6], [2, 2], [10, 2], [2, 10], [10, 10]].forEach(([x, y]) => g.rect(x - (x > 6 ? 1 : 0), y - (y > 6 ? 1 : 0), 2, 2, '#c8b8a0'));
  g.ell(6, 6, 1.8, 1.8, null);
  for (let y = 4; y < 8; y++) for (let x = 4; x < 8; x++) if (Math.hypot(x + 0.5 - 6, y + 0.5 - 6) < 1.8) g.clear(x, y);
  g.outline('#1a0e0c');
  return (_gear = g.canvas());
}

// ============================================================
//  PERK PICKER ("Wähle einen")
// ============================================================
function rollPerks(n) {
  const S = stats();
  const pool = PERKS.filter((p) => (P.C.perks[p.id] || 0) < p.max);
  const out = [];
  const w = (p) => ({ 1: 60, 2: 28, 3: 10 }[p.r]) * (p.r > 1 ? Math.sqrt(S.luck) : 1);
  while (out.length < n && pool.length) {
    const p = weightedPick(pool, w);
    out.push(p.id);
    pool.splice(pool.indexOf(p), 1);
  }
  return out;
}

class PerkPicker {
  constructor(hub, ids) {
    this.hub = hub;
    this.ids = ids && ids.length ? ids : rollPerks(stats().perkChoices);
    this.t = 0; this.chosen = -1; this.chosenT = 0;
    this.hov = this.ids.map(() => 0);
    Sound.play('card');
  }
  update(dt) {
    this.t += dt;
    if (this.chosen >= 0) {
      this.chosenT += dt;
      if (this.chosenT > 0.9) {
        const id = this.ids[this.chosen];
        P.C.perks[id] = (P.C.perks[id] || 0) + 1;
        if (id === 'blackmarket' || id === 'stoneperk') invalidateStats();
        this.hub.afterPerk();
      }
    }
  }
  draw(ctx, dt) {
    const t = this.t;
    ctx.fillStyle = `rgba(8,4,3,${Math.min(0.8, t * 2)})`;
    ctx.fillRect(0, 0, W, H);
    const tk = Ease.outBack(clamp(t / 0.4, 0, 1));
    Font.drawScaled(ctx, 'WÄHLE EINEN', W / 2, 44, tk, { scale: 3, color: '#e0a84a', shadow: 'thick', gradient: GOLD_GRAD });
    const n = this.ids.length;
    const cw = 126, ch = 182, gap = 14;
    const total = n * cw + (n - 1) * gap;
    const x0 = W / 2 - total / 2;
    for (let i = 0; i < n; i++) {
      const pk = PERK_BY_ID[this.ids[i]];
      const lvl = (P.C.perks[pk.id] || 0) + 1;
      const ct = t - 0.25 - i * 0.12;
      if (ct < 0) continue;
      const fly = Ease.outCubic(clamp(ct / 0.35, 0, 1));
      let x = x0 + i * (cw + gap), y = 72 + (1 - fly) * 220;
      // flip: back side first, then reveal
      const flipP = clamp((ct - 0.3) / 0.25, 0, 1);
      const sx = Math.abs(Math.cos(flipP * Math.PI));
      const front = flipP >= 0.5;
      if (front && flipP < 0.6 && !this['f' + i]) { this['f' + i] = true; Sound.play('card'); }
      const r = UI.region('perkcard' + i, x, y, cw, ch);
      if (this.chosen < 0 && front) this.hov[i] = damp(this.hov[i], r.hover ? 1 : 0, 14, dt);
      let lift = this.hov[i] * 8;
      let scale = 1 + this.hov[i] * 0.04;
      let alpha = 1;
      if (this.chosen >= 0) {
        if (this.chosen === i) { scale = 1 + Math.sin(Math.min(1, this.chosenT * 3) * Math.PI) * 0.12; lift = 8; }
        else { y += this.chosenT * this.chosenT * 600; alpha = Math.max(0, 1 - this.chosenT * 2); }
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x + cw / 2, y + ch / 2 - lift);
      ctx.scale(scale * Math.max(0.02, sx), scale);
      ctx.translate(-cw / 2, -ch / 2);
      if (!front) this.drawBack(ctx, cw, ch);
      else this.drawCard(ctx, cw, ch, pk, lvl, this.hov[i], this.chosen === i);
      ctx.restore();
      if (front && r.click && this.chosen < 0 && flipP >= 1) {
        this.chosen = i; this.chosenT = 0;
        Sound.play('unlock');
        for (let k = 0; k < 30; k++) this.hub.parts.push(new Sparkle(x + rand(cw), y + rand(ch)));
        this.hub.fx.push(new Ring(x + cw / 2, y + ch / 2, 120, RARITY[pk.r].color, 0.5, 3));
      }
      if (front && r.hover && Input.key(String(i + 1))) { /* keyboard shortcut handled below */ }
      if (front && Input.key(String(i + 1)) && this.chosen < 0 && flipP >= 1) { this.chosen = i; this.chosenT = 0; Sound.play('unlock'); }
    }
    // reroll for gems
    if (this.chosen < 0 && t > 1) {
      const cost = 5;
      if (UI.button(ctx, 'reroll', W / 2 - 60, H - 40, 120, 22, `Neu mischen  ${cost}♦`, { style: 'dark', disabled: P.gems < cost })) {
        P.gems -= cost;
        this.ids = rollPerks(stats().perkChoices);
        P.C.pendingPerks = this.ids;
        saveGame();
        this.t = 0.25; for (let i = 0; i < 5; i++) this['f' + i] = false;
        Sound.play('card');
      }
    }
  }
  drawBack(ctx, w, h) {
    UI.panel(ctx, 0, 0, w, h, { fill: '#3a1a14', border: '#c8913a' });
    for (let y = 6; y < h - 6; y += 6) for (let x = 6; x < w - 6; x += 6) { ctx.fillStyle = (x + y) % 12 === 0 ? '#5a2a1e' : '#4a2218'; ctx.fillRect(x, y, 3, 3); }
    ctx.drawImage(Art.pig('pink', 0).canvas, w / 2 - 22, h / 2 - 26);
  }
  drawCard(ctx, w, h, pk, lvl, hov, chosen) {
    const rc = RARITY[pk.r].color;
    if (hov > 0.05 || chosen) {
      ctx.save();
      ctx.globalAlpha *= 0.35 * Math.max(hov, chosen ? 1 : 0);
      ctx.fillStyle = rc; ctx.fillRect(-4, -4, w + 8, h + 8);
      ctx.restore();
    }
    UI.panel(ctx, 0, 0, w, h, { fill: '#120b08', border: rc, glow: true });
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(3, 3, w - 6, 20);
    Font.draw(ctx, pk.name, w / 2, 9, { align: 'center', color: '#f0d8b0', bold: Font.measure(pk.name, 1, true) < w - 10 });
    // icon with glow
    const g = ctx.createRadialGradient(w / 2, 60, 2, w / 2, 60, 34);
    g.addColorStop(0, rc + '88'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 26, w, 70);
    ctx.drawImage(Art.icon(pk.icon, 3), w / 2 - 18, 42);
    ctx.fillStyle = '#4a3a2e'; ctx.fillRect(16, 98, w - 32, 1);
    Font.drawWrapped(ctx, pk.d(lvl), w / 2 - 0, 106, w - 14, { color: '#f3e6cf', align: 'center' });
    ctx.fillStyle = '#4a3a2e'; ctx.fillRect(16, h - 26, w - 32, 1);
    Font.draw(ctx, lvl === 1 ? 'NEU' : lvl >= pk.max ? 'MAX' : `STUFE ${lvl}/${pk.max}`, w / 2, h - 20, { align: 'center', color: lvl >= pk.max ? '#ffd040' : '#8a7a6a' });
    Font.draw(ctx, RARITY[pk.r].name, w / 2, h - 10, { align: 'center', color: rc });
  }
}

// ============================================================
//  BANKRUPTCY
// ============================================================
class BankruptScene {
  constructor() {
    this.t = 0; this.speech = new Speech(); this.speech.say(pick(LINES.bankrupt), 'sad');
    this.parts = [];
    this.paid = P.C.billIdx;
    this.days = P.C.day;
    this.earned = P.C.earnedCycle;
  }
  enter() { Sound.Music.play('sad'); Sound.play('bankrupt'); }
  update(dt) {
    this.t += dt; this.speech.update(dt);
    if (this.t > 0.6 && !this.slammed) { this.slammed = true; Sound.play('stamp'); Game.shake(8); for (let i = 0; i < 30; i++) this.parts.push(new Shard(W / 2, 110, 10, pick(['#c0392b', '#8a2020', '#f4e4c4']), i < 8)); }
    this.parts = this.parts.filter((p) => p.update(dt));
    if (chance(dt * 6)) this.parts.push(new Dust(rand(W), H, 1, '#3a2a28'));
  }
  draw(ctx) {
    backdrop(ctx, 0.85);
    for (const p of this.parts) p.draw(ctx);
    const t = this.t;
    const k = t < 0.6 ? 0 : t < 0.75 ? 3 - ((t - 0.6) / 0.15) * 2 : 1;
    if (k > 0) {
      ctx.save(); ctx.translate(W / 2, 100); ctx.rotate(-0.08); ctx.scale(k, k);
      Font.drawScaled(ctx, 'BANKROTT', 0, 0, 1, { scale: 5, color: '#e83a2a', shadow: 'thick', gradient: FIRE_GRAD });
      ctx.restore();
    }
    this.speech.drawBill(ctx, 60, 180, 2, 'sad');
    this.speech.drawBubble(ctx, 40, 130, 170, 110);
    if (t > 1.2) {
      const rows = [['Zyklus', P.cycle], ['Tage überlebt', this.days], ['Rechnungen bezahlt', this.paid], ['Verdient', money(this.earned)], ['Rekord', 'Rechnung #' + P.record], ['Vermächtnispunkte', P.pp + ' VP']];
      UI.panel(ctx, W / 2 - 40, 150, 250, rows.length * 18 + 16, { fill: '#1a110d', border: '#8a4a3a' });
      rows.forEach(([a, b], i) => {
        const a2 = clamp((t - 1.2 - i * 0.15) * 4, 0, 1);
        Font.draw(ctx, a, W / 2 - 30, 160 + i * 18, { color: '#c8b8a0', alpha: a2 });
        Font.draw(ctx, String(b), W / 2 + 200, 160 + i * 18, { align: 'right', color: i === 5 ? '#c8a0ff' : '#ffffff', alpha: a2, bold: i === 5 });
      });
      Font.drawWrapped(ctx, 'Geld, Skills, Perks und Hämmer sind weg. Edelsteine, Verzauberungen, Sammlung und Ringe bleiben. Jeder Zyklus gibt +10% Münzwert.', W / 2 - 40, 290, 260, { color: '#8a7a6a' });
    }
    if (t > 2 && UI.button(ctx, 'bk_go', W - 150, H - 36, 140, 26, 'Zum Schmuckkasten', { style: 'gold', key: ' ', keyLabel: 'LEER' })) Game.goto(new PrestigeScene());
  }
}

// ============================================================
//  PRESTIGE: ring box
// ============================================================
class PrestigeScene {
  constructor() { this.t = 0; this.parts = []; this.fx = []; this.sel = null; this.amb = new Ambience(25); }
  enter() { Sound.Music.play('menu'); }
  update(dt) { this.t += dt; this.parts = this.parts.filter((p) => p.update(dt)); this.fx = this.fx.filter((p) => p.update(dt)); }
  draw(ctx, dt) {
    backdrop(ctx, 0.8);
    this.amb.draw(ctx, dt);
    const bx = W / 2 - 150, by = 34, bw = 300, bh = 300;
    // box lid & body
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx + 6, by + 8, bw, bh);
    UI.panel(ctx, bx, by, bw, bh, { fill: '#5a3420', border: '#2a160c', edge: '#120806' });
    for (let y = by + 4; y < by + bh - 4; y += 3) { ctx.fillStyle = (y * 7) % 5 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,200,150,0.03)'; ctx.fillRect(bx + 3, y, bw - 6, 1); }
    // velvet inside
    const vx = bx + 12, vy = by + 34, vw = bw - 24, vh = 180;
    ctx.fillStyle = '#4a0e18'; ctx.fillRect(vx, vy, vw, vh);
    for (let i = 0; i < 400; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,120,140,0.05)' : 'rgba(0,0,0,0.1)'; ctx.fillRect(vx + hash2(i, 1) * vw, vy + hash2(i, 2) * vh, 1, 1); }
    ctx.fillStyle = '#2a060c'; ctx.fillRect(vx, vy, vw, 2);
    Font.draw(ctx, 'SCHMUCKKASTEN', W / 2, by + 12, { align: 'center', color: '#e0a84a', bold: true, scale: 2 });
    // rings grid
    const cols = 5;
    RINGS.forEach((r, i) => {
      const x = vx + 6 + (i % cols) * 53, y = vy + 4 + Math.floor(i / cols) * 44;
      this.drawJewel(ctx, r, x, y, 48, 38, 'ring');
    });
    // bracelet drawer
    const dy = vy + vh + 6;
    ctx.fillStyle = '#3a0a12'; ctx.fillRect(vx, dy, vw, 56);
    BRACELETS.forEach((r, i) => this.drawJewel(ctx, r, vx + 4 + i * 54, dy + 3, 50, 50, 'bracelet'));
    // equipped summary
    const eq = P.ringsEq.length, eb = P.braceEq.length;
    Font.draw(ctx, `Angelegt: Ringe ${eq}/${RING_SLOTS}  ·  Armbänder ${eb}/${BRACELET_SLOTS}`, W / 2, dy + 62, { align: 'center', color: '#e8c8a0' });
    // PP
    UI.panel(ctx, W - 110, 6, 102, 22, { fill: '#2a1a2a', border: '#8a6ab0' });
    Font.draw(ctx, P.pp + ' VP', W - 16, 12, { align: 'right', color: '#e0c8ff', bold: true });
    ctx.drawImage(Art.icon('star'), W - 104, 11);
    // info
    UI.panel(ctx, W - 176, 40, 168, 118, { fill: 'rgba(20,12,10,0.9)', border: '#5a4030' });
    Font.draw(ctx, 'Info', W - 168, 46, { color: '#e0a84a', bold: true });
    Font.drawWrapped(ctx, 'Vermächtnispunkte (VP) gibt es für neue Rekorde: Bezahlst du eine Rechnung tiefer als je zuvor, erhältst du ihre Nummer in VP (Rechnung #5 = 5 VP).', W - 168, 60, 156, { color: '#d8c8b0' });
    // selected info panel
    const s = this.sel;
    if (!s) {
      UI.panel(ctx, 8, 40, 168, 70, { fill: 'rgba(20,12,10,0.9)', border: '#5a4030' });
      Font.drawWrapped(ctx, 'Fahre über einen Ring oder ein Armband. Klicken kauft bzw. legt an/ab.', 16, 48, 152, { color: '#a8927a' });
    }
    if (s) {
      UI.panel(ctx, 8, 40, 168, 110, { fill: 'rgba(20,12,10,0.95)', border: '#c8913a' });
      ctx.drawImage(s.kind === 'ring' ? Art.ring(s.r) : Art.bracelet(s.r), 16, 50);
      Font.draw(ctx, s.r.name, 44, 52, { color: '#ffe0a0', bold: true });
      Font.drawWrapped(ctx, s.r.desc, 16, 72, 152, { color: '#c8b8a0' });
      Font.draw(ctx, s.r.stat, 16, 104, { color: '#a8927a' });
      Font.draw(ctx, s.r.val, 168, 104, { align: 'right', color: '#9af08a', bold: true });
      const owned = (s.kind === 'ring' ? P.rings : P.bracelets).includes(s.r.id);
      Font.draw(ctx, owned ? 'Besitz · Klicken zum An-/Ablegen' : `Kosten: ${s.r.cost} VP`, 16, 124, { color: owned ? '#8ac0ff' : P.pp >= s.r.cost ? '#9af08a' : '#ff8a6a' });
    }
    for (const f of this.fx) f.draw(ctx);
    for (const p of this.parts) p.draw(ctx);
    // buttons
    if (UI.button(ctx, 'pr_reset', 8, H - 34, 130, 26, 'Punkte zurücksetzen', { style: 'dark', tip: 'Alle Ringe & Armbänder zurückgeben, VP erstattet.' })) {
      let refund = 0;
      for (const id of P.rings) refund += RINGS.find((r) => r.id === id).cost;
      for (const id of P.bracelets) refund += BRACELETS.find((r) => r.id === id).cost;
      P.pp += refund; P.rings = []; P.bracelets = []; P.ringsEq = []; P.braceEq = [];
      saveGame(); Sound.play('back');
    }
    if (UI.button(ctx, 'pr_go', W - 150, H - 34, 142, 26, `Zyklus ${P.cycle + 1} starten`, { style: 'gold' })) this.startCycle();
  }
  drawJewel(ctx, r, x, y, w, h, kind) {
    const owned = (kind === 'ring' ? P.rings : P.bracelets).includes(r.id);
    const eq = (kind === 'ring' ? P.ringsEq : P.braceEq).includes(r.id);
    const reg = UI.region('jw_' + r.id, x, y, w, h);
    if (reg.hover) this.sel = { r, kind };
    const spr = kind === 'ring' ? Art.ring(r) : Art.bracelet(r);
    // cushion slot
    ctx.fillStyle = eq ? '#7a2a3a' : '#3a0810';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 2, w / 2 - 4, h / 2 - 6, 0, 0, TAU); ctx.fill();
    const bob = reg.hover ? -2 - Math.sin(this.t * 6) : 0;
    if (owned) {
      if (eq) {
        const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,220,120,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(spr, sp(x + w / 2 - spr.width / 2), sp(y + h / 2 - spr.height / 2 - 4 + bob));
      if (eq) Font.draw(ctx, 'Angelegt', x + w / 2, y + h - 10, { align: 'center', color: '#ffe0a0' });
      if (eq && chance(0.03)) this.parts.push(new Sparkle(x + rand(w), y + rand(h - 10)));
    } else {
      // not bought yet: grey preview, brighter when affordable
      const afford = P.pp >= r.cost;
      ctx.globalAlpha = afford || reg.hover ? 0.85 : 0.45;
      ctx.drawImage(Art.tint('jwg' + r.id, spr, 'gray'), sp(x + w / 2 - spr.width / 2), sp(y + h / 2 - spr.height / 2 - 4 + bob));
      ctx.globalAlpha = 1;
      Font.draw(ctx, r.cost + ' VP', x + w / 2, y + h - 10, { align: 'center', color: afford ? '#e8c8ff' : '#7a5a6a' });
    }
    if (reg.click) {
      const list = kind === 'ring' ? P.rings : P.bracelets;
      const eql = kind === 'ring' ? P.ringsEq : P.braceEq;
      const slots = kind === 'ring' ? RING_SLOTS : BRACELET_SLOTS;
      if (!owned) {
        if (P.pp >= r.cost) {
          P.pp -= r.cost; list.push(r.id);
          if (eql.length < slots) eql.push(r.id);
          Sound.play('unlock');
          for (let i = 0; i < 14; i++) this.parts.push(new Sparkle(x + rand(w), y + rand(h)));
          this.fx.push(new Ring(x + w / 2, y + h / 2, 30, '#ffe0a0', 0.4, 2));
        } else Sound.play('error');
      } else if (eq) { eql.splice(eql.indexOf(r.id), 1); Sound.play('back'); }
      else if (eql.length < slots) { eql.push(r.id); Sound.play('buy'); this.fx.push(new Ring(x + w / 2, y + h / 2, 26, '#ffe0a0', 0.3, 2)); }
      else { Sound.play('error'); UI.toast({ title: 'Alle Plätze belegt', text: 'Lege zuerst etwas ab.', color: '#ff8a6a' }); }
      saveGame();
      invalidateStats();
      checkAchievements();
    }
  }
  startCycle() {
    P.cycle++;
    // bankruptcy also takes the hammers: back to the plain wooden one
    P.hammers = ['wood'];
    P.hammerLvl = { wood: 0 };
    P.hammer = 'wood';
    P.C = newCycleState(P);
    invalidateStats();
    saveGame();
    checkAchievements();
    Game.goto(new HubScene());
    UI.toast({ title: `Zyklus ${P.cycle}`, text: `Münzwert +${(P.cycle - 1) * 10}% dauerhaft`, icon: Art.icon('star'), color: '#c8a0ff' });
  }
}
