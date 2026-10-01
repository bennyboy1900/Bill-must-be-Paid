// ============================================================
//  Persistent state, save/load, stat computation
// ============================================================
const SAVE_KEY = 'bill_must_be_paid_save_v1';

function newCycleState(P) {
  const s = computeStats(P, true);
  const b = billInfo(0);
  return {
    money: s.startMoney,
    day: 1,
    billIdx: 0,
    dueDays: b.days + s.dueBonus,
    skills: {},
    perks: {},
    pendingPerks: null,
    runs: 0,
    earnedCycle: 0,
  };
}

function newSave() {
  const P = {
    v: 1,
    cycle: 1,
    pp: 0,
    ppTotal: 0,
    record: 0,
    gems: 0,
    hammers: ['wood'],
    hammerLvl: { wood: 0 },
    enchant: {},
    hammer: 'wood',
    rings: [], ringsEq: [], bracelets: [], braceEq: [],
    collection: {},
    dex: {},
    achievements: {},
    stats: { pigs: 0, crits: 0, jackpots: 0, bestCombo: 0, bestRun: 0, runs: 0, gemsTotal: 0, moneyTotal: 0, escaped: 0, playTime: 0, rareFound: 0 },
    settings: { sfx: 0.7, music: 0.45, shake: true, numbers: true },
    seenIntro: false,
    tutorial: { swing: false, bill: false, tree: false },
    C: null,
  };
  P.C = newCycleState(P);
  return P;
}

let P = null;

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const fresh = newSave();
      // shallow merge to survive version changes
      P = Object.assign(fresh, data);
      P.stats = Object.assign(fresh.stats, data.stats || {});
      P.settings = Object.assign(fresh.settings, data.settings || {});
      P.tutorial = Object.assign(fresh.tutorial, data.tutorial || {});
      P.enchant = data.enchant || {};
      if (!P.C) P.C = newCycleState(P);
      return true;
    }
  } catch (e) { console.warn('load failed', e); }
  P = newSave();
  return false;
}
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) { /* storage unavailable */ }
}
function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  P = newSave();
}

// ---------------- stats ----------------
function baseStats() {
  return {
    dmgFlat: 0, dmgPct: 0, dmgMore: 1,
    speedPct: 0, radiusPct: 0,
    staminaFlat: 0, staminaPct: 0, costPct: 0, drain: 0.5, drainPct: 0, regen: 0,
    crit: 0.05, critMult: 2, critQuake: false,
    coinPct: 0, coinMore: 1,
    luck: 1, luckPct: 0,
    gemPct: 0, gemMore: 1, rarePct: 0, rareMore: 1, jackpotPct: 0, jackpotMore: 1, jackpotMult: 10, jackpotGems: 0,
    maxPigs: 5, spawnPct: 0, rarePig: 0,
    pigs: new Set(['pink']), goldenWeight: 0, goldenMore: 1, diamondWeight: 0, mafiaBoost: 1, pigletPacks: false,
    execute: 0, double: 0, single: 0,
    quakeEvery: 0, quakeDmg: 1, frenzy: false,
    stoneRain: false, stones: 5, stoneDmg: 3, stoneCD: 16, stoneGold: 0, meteor: false,
    lightning: 0, chains: 2, lightningDmg: 1, storm: 0, lightningCrit: false, tesla: false,
    freeze: 0, freezePct: 0, freezeDur: 2.5, freezeVuln: 0,
    goldRush: 0, bombChance: 0,
    burn: 0, vamp: 0, echo: 0, goldTouch: 0, shockwave: 0,
    interest: 0, endBonus: 0, comboCoin: 0, comboWindow: 1.3,
    coffee: 0, coffeeAmt: 1, coffeeSpeed: 0, energy: false, coffeeAddict: 0,
    secondWind: 0, adrenaline: 0,
    perkChoices: 3, skillDiscount: 0, dueBonus: 0, billRefund: 0, startMoney: 0,
  };
}

function computeStats(PP, prestigeOnly = false) {
  const s = baseStats();
  // prestige items
  for (const id of PP.ringsEq) { const r = RINGS.find((x) => x.id === id); if (r) r.a(s); }
  for (const id of PP.braceEq) { const r = BRACELETS.find((x) => x.id === id); if (r) r.a(s); }
  // collection
  for (const id in PP.collection) {
    const c = RARE_BY_ID[id];
    if (!c) continue;
    const [k, v] = c.bonus;
    if (k === 'coin') s.coinPct += v;
    else if (k === 'dmg') s.dmgPct += v;
    else if (k === 'crit') s.crit += v;
    else if (k === 'luck') s.luckPct += v;
    else if (k === 'gems') s.gemPct += v;
    else if (k === 'stamina') s.staminaFlat += v;
    else if (k === 'speed') s.speedPct += v;
  }
  for (const r of [1, 2, 3, 4]) {
    const all = RARE_COINS.filter((c) => c.r === r);
    if (all.every((c) => PP.collection[c.id])) SET_BONUS[r].a(s);
  }
  for (const e of ENCHANTS) { const l = (PP.enchant || {})[e.id] || 0; if (l) e.a(s, l); }
  {
    const st = hammerStars(PP.hammerLvl[PP.hammer] || 0);
    for (let i = 0; i < st; i++) HAMMER_STARS[i].a(s);
  }
  if (!prestigeOnly && PP.C) {
    for (const id in PP.C.skills) { const sk = SKILL_BY_ID[id]; const l = PP.C.skills[id]; if (sk && l > 0) sk.a(s, l); }
    for (const id in PP.C.perks) { const pk = PERK_BY_ID[id]; const l = PP.C.perks[id]; if (pk && l > 0) pk.a(s, l); }
  }
  const h = HAMMER_BY_ID[PP.hammer] || HAMMERS[0];
  const hl = PP.hammerLvl[PP.hammer] || 0;
  const cycleBonus = 1 + 0.1 * (PP.cycle - 1);
  s.luck *= 1 + s.luckPct;
  if (h.luck) s.luck *= h.luck;
  const F = {
    hammer: h,
    maxStamina: Math.round((40 + s.staminaFlat) * (1 + s.staminaPct)),
    drain: s.drain * Math.max(0, 1 + s.drainPct),
    regen: s.regen,
    swingCost: Math.max(0.25, 1 + s.costPct),
    swingRate: 2.1 * (1 + s.speedPct) * h.rate,
    damage: (1 + s.dmgFlat) * (1 + s.dmgPct) * s.dmgMore * h.dmg * (1 + 0.15 * hl),
    stars: hammerStars(hl),
    burn: s.burn, vamp: s.vamp, echo: s.echo, goldTouch: s.goldTouch, shockwave: s.shockwave,
    radius: 17 * (1 + s.radiusPct) * h.radius,
    crit: Math.min(1, s.crit + h.crit),
    critMult: s.critMult + h.critMult,
    critQuake: s.critQuake,
    coinMult: (1 + s.coinPct) * s.coinMore * (1 + (h.coin || 0)) * cycleBonus,
    luck: s.luck,
    gemChance: Math.min(0.6, 0.03 * (1 + s.gemPct) * s.gemMore * Math.sqrt(s.luck) * (h.gems || 1)),
    rareChance: Math.min(0.2, 0.0045 * (1 + s.rarePct) * s.rareMore * s.luck),
    jackpotChance: Math.min(0.25, 0.004 * (1 + s.jackpotPct) * s.jackpotMore * Math.pow(s.luck, 0.7)),
    jackpotMult: s.jackpotMult,
    jackpotGems: s.jackpotGems,
    maxPigs: s.maxPigs,
    spawnRate: 0.9 * (1 + s.spawnPct),
    rarePig: s.rarePig,
    pigs: s.pigs,
    goldenWeight: s.goldenWeight * s.goldenMore * (h.golden || 1),
    diamondWeight: s.diamondWeight,
    mafiaBoost: s.mafiaBoost,
    pigletPacks: s.pigletPacks,
    execute: s.execute,
    double: Math.min(0.9, s.double + (h.double || 0)),
    single: s.single,
    quakeEvery: s.quakeEvery,
    quakeDmg: s.quakeDmg,
    frenzy: s.frenzy,
    stoneRain: s.stoneRain, stones: s.stones, stoneDmg: s.stoneDmg, stoneCD: Math.max(4, s.stoneCD), stoneGold: s.stoneGold, meteor: s.meteor,
    lightning: Math.min(1, s.lightning + (h.lightning || 0)),
    chains: s.chains + (h.chains || 0),
    lightningDmg: s.lightningDmg, storm: s.storm, lightningCrit: s.lightningCrit, tesla: s.tesla,
    freeze: (s.freeze + (h.freeze || 0)) * (1 + s.freezePct), freezeDur: s.freezeDur, freezeVuln: s.freezeVuln,
    goldRush: s.goldRush, bombChance: s.bombChance,
    interest: s.interest, endBonus: s.endBonus, comboCoin: s.comboCoin, comboWindow: s.comboWindow + (h.combo || 0),
    coffee: s.coffee, coffeeAmt: s.coffeeAmt, coffeeSpeed: s.coffeeSpeed, energy: s.energy, coffeeAddict: s.coffeeAddict,
    secondWind: s.secondWind, adrenaline: s.adrenaline,
    perkChoices: s.perkChoices, skillDiscount: Math.min(0.75, s.skillDiscount), dueBonus: s.dueBonus, billRefund: Math.min(0.5, s.billRefund), startMoney: s.startMoney,
    cycleBonus,
  };
  return F;
}

// ---------------- helpers ----------------
function currentBill() { return billInfo(P.C.billIdx); }
function pigScale(billIdx) {
  return { hp: Math.pow(1.17, billIdx), value: Math.pow(1.11, billIdx) };
}
function skillLevel(id) { return P.C.skills[id] || 0; }
function skillUnlocked(sk) { return sk.req.length === 0 || sk.req.some((r) => skillLevel(r) > 0); }
let _statsCache = null;
function stats() { return _statsCache || (_statsCache = computeStats(P)); }
function invalidateStats() { _statsCache = null; }
function skillPrice(sk) {
  const st = stats();
  return Math.max(1, Math.round(skillCost(sk, skillLevel(sk.id)) * (1 - st.skillDiscount)));
}

function addPP(n) { P.pp += n; P.ppTotal += n; }

// checks all achievements, grants rewards, returns newly earned list
function checkAchievements() {
  const out = [];
  for (const a of ACHIEVEMENTS) {
    if (P.achievements[a.id]) continue;
    const [cur, goal] = a.check(P);
    if (cur >= goal) {
      P.achievements[a.id] = true;
      if (a.reward.gems) { P.gems += a.reward.gems; P.stats.gemsTotal += a.reward.gems; }
      if (a.reward.pp) addPP(a.reward.pp);
      out.push(a);
    }
  }
  if (out.length) saveGame();
  return out;
}
const rewardText = (r) => (r.gems ? `+${r.gems} ♦` : '') + (r.pp ? `+${r.pp} VP` : '');
