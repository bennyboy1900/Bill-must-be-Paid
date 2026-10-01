// ============================================================
//  GAME DATA / CONTENT
// ============================================================

// ---------------- PIGS ----------------
// behavior: wander | lazy | flee | sleep | escape | still | dance | sneaky
const PIGS = {
  pink: { name: 'Rosa Sparschwein', desc: 'Der Klassiker. Ehrlich, rund, voller Kleingeld.', hp: 3, value: 6, speed: 16, behavior: 'wander', weight: 100, coins: ['copper', 'copper', 'silver'], unlock: null },
  piglet: { name: 'Ferkel', desc: 'Klein, schnell, hat Taschengeld.', hp: 1, value: 3, speed: 30, behavior: 'flee', weight: 0, coins: ['copper'], unlock: 'never' },
  dots: { name: 'Pünktchen', desc: 'Trägt immer einen Partyhut. Mehr Münzen, dickere Haut.', hp: 7, value: 18, speed: 17, behavior: 'wander', weight: 60, coins: ['silver', 'copper'], unlock: 'P2' },
  wood: { name: 'Holzschwein', desc: 'Handgeschnitzt. Faul. Sehr robust.', hp: 16, value: 42, speed: 7, behavior: 'lazy', weight: 40, coins: ['silver', 'silver', 'gold'], unlock: 'P4', sound: 'woodhit' },
  runner: { name: 'Flitzer', desc: 'Läuft vor dem Hammer weg. Sportlich und gut bezahlt.', hp: 5, value: 36, speed: 62, behavior: 'flee', weight: 30, coins: ['silver', 'gold'], unlock: 'P5' },
  sleepy: { name: 'Schlafmütze', desc: 'Pennt. Wacht beim ersten Treffer auf und rennt.', hp: 12, value: 58, speed: 0, behavior: 'sleep', weight: 25, coins: ['silver', 'gold'], unlock: 'P6' },
  porcelain: { name: 'Porzellanschwein', desc: 'Omas Erbstück. Zerbricht beim ersten Schlag.', hp: 1, value: 30, speed: 12, behavior: 'wander', weight: 30, coins: ['silver', 'gold'], unlock: 'P7', fragile: true },
  party: { name: 'Partyschwein', desc: 'Zerschlagen startet eine Party: x1.5 Münzen für 5s!', hp: 9, value: 36, speed: 20, behavior: 'dance', weight: 20, coins: ['silver', 'gold', 'copper'], unlock: 'P8' },
  mafia: { name: 'Schwarzgeld-Schwein', desc: 'Voller Bargeld, das es nie gab. Haut nach 7s ab!', hp: 26, value: 190, speed: 22, behavior: 'escape', weight: 12, coins: ['cash'], unlock: 'P9', escapeTime: 7 },
  bomb: { name: 'Bombenschwein', desc: 'Explodiert und reißt Nachbarn mit.', hp: 6, value: 32, speed: 16, behavior: 'wander', weight: 18, coins: ['silver'], unlock: 'PA', explode: true },
  mama: { name: 'Mama-Schwein', desc: 'Hinterlässt 3-5 Ferkel.', hp: 36, value: 72, speed: 9, behavior: 'wander', weight: 15, coins: ['silver', 'gold'], unlock: 'PB', piglets: true },
  safe: { name: 'Tresorschwein', desc: 'Gepanzert: Nur Krits richten vollen Schaden an.', hp: 85, value: 400, speed: 5, behavior: 'lazy', weight: 10, coins: ['gold', 'gold', 'silver'], unlock: 'PC', armor: 0.5, sound: 'metalhit' },
  crystal: { name: 'Kristallschwein', desc: 'Lässt garantiert Edelsteine fallen.', hp: 18, value: 26, speed: 14, behavior: 'wander', weight: 10, coins: ['silver'], unlock: 'PD', gems: [3, 6] },
  robo: { name: 'Robo-Schwein', desc: 'Treffer erzeugen Blitze, die Nachbarn schocken.', hp: 32, value: 145, speed: 24, behavior: 'wander', weight: 10, coins: ['silver', 'black'], unlock: 'PE', sound: 'metalhit', zap: true },
  ghost: { name: 'Geisterschwein', desc: 'Wird zeitweise unsichtbar und unverwundbar.', hp: 15, value: 115, speed: 18, behavior: 'wander', weight: 10, coins: ['platinum'], unlock: 'PF', ghost: true },
  zombie: { name: 'Zombieschwein', desc: 'Steht einmal wieder auf. Uuurgh... Münzen...', hp: 20, value: 60, speed: 10, behavior: 'wander', weight: 12, coins: ['copper', 'silver'], unlock: 'PZ', revive: true },
  disco: { name: 'Discoschwein', desc: 'Zerschlagen: Disco-Fieber, +30% Tempo für 6s.', hp: 16, value: 95, speed: 18, behavior: 'dance', weight: 9, coins: ['gold', 'silver'], unlock: 'PS' },
  ninja: { name: 'Ninjaschwein', desc: 'Weicht 40% der Schläge aus. Pfff!', hp: 9, value: 130, speed: 40, behavior: 'sneaky', weight: 8, coins: ['black', 'gold'], unlock: 'PN', dodge: 0.4 },
  tax: { name: 'Finanzamt-Schwein', desc: 'Pfändet 10% deiner Run-Einnahmen, wenn es entkommt!', hp: 45, value: 260, speed: 12, behavior: 'escape', weight: 7, coins: ['cash', 'gold'], unlock: 'PT', escapeTime: 10, taxman: true },
  pirate: { name: 'Piratenschwein', desc: 'Arrr! Hat eine Schatzkarte verschluckt: lässt Dublonen regnen.', hp: 22, value: 150, speed: 26, behavior: 'wander', weight: 9, coins: ['gold', 'gold', 'copper'], unlock: 'PR', rareBoost: 4 },
  astro: { name: 'Astronautenschwein', desc: 'Schwebt in Schwerelosigkeit. Münzen fliegen extra hoch.', hp: 26, value: 170, speed: 14, behavior: 'float', weight: 8, coins: ['platinum', 'silver'], unlock: 'PX' },
  vampire: { name: 'Vampirschwein', desc: 'Regeneriert Leben, wenn du es in Ruhe lässt. Hau drauf!', hp: 30, value: 160, speed: 20, behavior: 'wander', weight: 8, coins: ['black', 'silver'], unlock: 'PV', regen: 0.12 },
  clown: { name: 'Clownschwein', desc: 'HUP! Zerbricht in zwei Mini-Clowns.', hp: 14, value: 70, speed: 22, behavior: 'dance', weight: 12, coins: ['gold', 'silver', 'copper'], unlock: 'PL', split: 'clownjr', sound: 'squeak' },
  clownjr: { name: 'Mini-Clown', desc: 'Hup.', hp: 4, value: 30, speed: 34, behavior: 'flee', weight: 0, coins: ['silver'], unlock: 'never', sound: 'squeak' },
  bailiff: { name: 'Gerichtsvollzieher', desc: 'Kommt am letzten Tag vor der Fälligkeit. Trägt 25% deiner Rechnung bei sich – aber nur 20 Sekunden lang!', hp: 140, value: 0, speed: 14, behavior: 'escape', weight: 0, coins: ['cash', 'gold'], unlock: 'never', escapeTime: 20, boss: true, sound: 'metalhit' },
  king: { name: 'Königsschwein', desc: 'Seine Majestät. Ein ganzer Staatsschatz.', hp: 240, value: 2200, speed: 10, behavior: 'wander', weight: 2, coins: ['gold', 'platinum', 'cash'], unlock: 'PK', gems: [2, 4] },
  golden: { name: 'Goldschwein', desc: 'Pures Gold mit Flügeln. Verschwindet nach 8s!', hp: 14, value: 320, speed: 64, behavior: 'flee', weight: 0, coins: ['gold'], unlock: 'L4', despawn: 8 },
  diamond: { name: 'Diamantschwein', desc: 'Das seltenste Schwein der Welt. Flieht nach 10s.', hp: 110, value: 1500, speed: 34, behavior: 'flee', weight: 0, coins: ['platinum', 'gold'], unlock: 'LX', despawn: 10, gems: [4, 8], diamonds: true },
};
const PIG_ORDER = ['pink', 'dots', 'wood', 'runner', 'sleepy', 'porcelain', 'party', 'mafia', 'bomb', 'mama', 'safe', 'crystal', 'robo', 'ghost', 'zombie', 'disco', 'ninja', 'tax', 'clown', 'vampire', 'pirate', 'astro', 'bailiff', 'king', 'golden', 'diamond', 'piglet', 'clownjr'];

// ---------------- HAMMERS ----------------
const HAMMERS = [
  { id: 'wood', name: 'Holzhammer', desc: 'Ausgewogen. Ehrliche Arbeit.', cost: 0, dmg: 1, rate: 1, radius: 1, crit: 0, critMult: 0 },
  { id: 'baguette', name: 'Baguette', desc: 'Knusprig! +20% Krit, schnell, wenig Schaden.', cost: 15, dmg: 0.55, rate: 1.4, radius: 1.15, crit: 0.2, critMult: 0.5 },
  { id: 'claw', name: 'Klauenhammer', desc: 'Präzise: +15% Krit, +100% Krit-Schaden, kleiner Radius.', cost: 25, dmg: 1.15, rate: 1, radius: 0.72, crit: 0.15, critMult: 1 },
  { id: 'rubber', name: 'Gummihammer', desc: 'Ultraschnell mit großem Radius, aber weniger Schaden.', cost: 35, dmg: 0.6, rate: 1.75, radius: 1.35, crit: 0, critMult: 0 },
  { id: 'tenderizer', name: 'Fleischklopfer', desc: '30% Chance, doppelt zuzuschlagen.', cost: 50, dmg: 0.8, rate: 1.2, radius: 1, crit: 0, critMult: 0, double: 0.3 },
  { id: 'sledge', name: 'Vorschlaghammer', desc: 'Langsam. Brutal. Betäubt getroffene Schweine.', cost: 70, dmg: 2.9, rate: 0.5, radius: 1.45, crit: 0, critMult: 0.5, stun: 1.2 },
  { id: 'pan', name: 'Bratpfanne', desc: 'BONG! Riesiger Radius und +15% Münzwert.', cost: 90, dmg: 0.9, rate: 0.9, radius: 1.9, crit: 0, critMult: 0, coin: 0.15, sound: 'pan' },
  { id: 'squeaky', name: 'Quietschehammer', desc: 'Winzig, irre schnell. Combo-Fenster +0.6s.', cost: 110, dmg: 0.32, rate: 3.2, radius: 1.15, crit: 0, critMult: 0, combo: 0.6, sound: 'squeak' },
  { id: 'ice', name: 'Eishammer', desc: 'Jeder Schlag baut Frost auf und friert alle Schweine ein.', cost: 140, dmg: 1, rate: 1, radius: 1.1, crit: 0, critMult: 0, freeze: 0.07 },
  { id: 'golden', name: 'Goldhammer', desc: '+45% Münzwert, Goldschweine doppelt so häufig.', cost: 170, dmg: 1, rate: 1, radius: 1, crit: 0.05, critMult: 0, coin: 0.45, golden: 2 },
  { id: 'pickaxe', name: 'Spitzhacke', desc: 'Schürfer: x2.5 Edelsteine, solider Schaden.', cost: 200, dmg: 1.4, rate: 0.9, radius: 0.85, crit: 0.05, critMult: 0, gems: 2.5 },
  { id: 'stamp', name: 'BEZAHLT-Stempel', desc: 'Jeder 8. Schlag stempelt mit 6x Schaden & riesigem Radius.', cost: 240, dmg: 1.1, rate: 1, radius: 1, crit: 0, critMult: 0, stamp: 8 },
  { id: 'mjolnir', name: 'Mjölnir', desc: '35% Blitzchance pro Schlag, +2 Kettenblitze.', cost: 300, dmg: 1.3, rate: 0.9, radius: 1.1, crit: 0, critMult: 0, lightning: 0.35, chains: 2 },
  { id: 'crystal', name: 'Kristallhammer', desc: '+25% Krit, +150% Krit-Schaden, x1.5 Glück.', cost: 380, dmg: 1.2, rate: 1, radius: 1, crit: 0.25, critMult: 1.5, luck: 1.5 },
  { id: 'banhammer', name: 'Banhammer', desc: 'Gigantisch. 5% Chance, ein Schwein sofort zu bannen.', cost: 600, dmg: 4, rate: 0.6, radius: 1.6, crit: 0.05, critMult: 1, ban: 0.05 },
];
const HAMMER_BY_ID = Object.fromEntries(HAMMERS.map((h) => [h.id, h]));
const hammerUpCost = (lvl) => Math.round(4 * Math.pow(1.24, lvl) + lvl * 2);
const HAMMER_MAX_LVL = 25;
// every 5 levels a hammer earns a star with a big bonus + visual aura
const HAMMER_STARS = [
  { name: '★1 Geschärft', d: '+10% Krit-Chance', color: '#ffffff', a: (s) => (s.crit += 0.1) },
  { name: '★2 Gehärtet', d: '+25% Radius', color: '#6fdc5a', a: (s) => (s.radiusPct += 0.25) },
  { name: '★3 Ausbalanciert', d: '+30% Schlagtempo', color: '#5aa0f0', a: (s) => (s.speedPct += 0.3) },
  { name: '★4 Veredelt', d: 'x2 Münzwert', color: '#c07af0', a: (s) => (s.coinMore *= 2) },
  { name: '★5 LEGENDÄR', d: 'x2.5 Schaden + Aura', color: '#ffd040', a: (s) => (s.dmgMore *= 2.5) },
];
const hammerStars = (lvl) => Math.min(5, Math.floor(lvl / 5));

// enchantments are bought in the forge with gems and apply to every hammer
const ENCHANTS = [
  { id: 'flame', name: 'Flammenschlag', icon: 'fire', color: '#ff7a2a', max: 5, d: (l) => `Treffer setzen Schweine in Brand: ${l * 25}% Schaden/s für 2s`, a: (s, l) => (s.burn += 0.25 * l) },
  { id: 'vamp', name: 'Vampirschlag', icon: 'heart', color: '#e8304a', max: 5, d: (l) => `Jeder Treffer heilt ${(l * 0.15).toFixed(2)} Ausdauer (max. 1 Balken/Run)`, a: (s, l) => (s.vamp += 0.15 * l) },
  { id: 'echo', name: 'Echo', icon: 'wave', color: '#8ac0ff', max: 5, d: (l) => `${l * 10}% Chance: ein Geisterhammer schlägt nochmal zu`, a: (s, l) => (s.echo += 0.1 * l) },
  { id: 'goldtouch', name: 'Goldener Schlag', icon: 'coin', color: '#ffd040', max: 5, d: (l) => `Jeder Treffer schlägt Münzen heraus (${l * 4}% Wert)`, a: (s, l) => (s.goldTouch += 0.04 * l) },
  { id: 'shock', name: 'Schockwelle', icon: 'radius', color: '#e8e0ff', max: 5, d: (l) => `Krits lösen eine Schockwelle aus (${l * 40}% Schaden)`, a: (s, l) => (s.shockwave += 0.4 * l) },
  { id: 'jeweler', name: 'Juwelier', icon: 'gem', color: '#5ae0f0', max: 5, d: (l) => `+${l * 20}% Edelsteinchance`, a: (s, l) => (s.gemPct += 0.2 * l) },
];
const enchantCost = (lvl) => Math.round(18 * Math.pow(2, lvl));
// completing every coin of a rarity grants a set bonus
const SET_BONUS = {
  1: { d: '+15% Münzwert', a: (s) => (s.coinPct += 0.15) },
  2: { d: '+20% Schaden', a: (s) => (s.dmgPct += 0.2) },
  3: { d: '+30 Ausdauer & +10% Krit', a: (s) => { s.staminaFlat += 30; s.crit += 0.1; } },
  4: { d: 'x2 Münzwert & x1.5 Schaden', a: (s) => { s.coinMore *= 2; s.dmgMore *= 1.5; } },
};

// ---------------- SKILL TREE ----------------
const BRANCH = {
  root: { name: 'Ursprung', color: '#f2c66d' },
  red: { name: 'Griffkraft', color: '#e0503e' },
  blue: { name: 'Handgelenk', color: '#4a8ad8' },
  stone: { name: 'Steinregen', color: '#b0a08c' },
  elec: { name: 'Elektro', color: '#3ad0e8' },
  ice: { name: 'Frost', color: '#9ae0ff' },
  luck: { name: 'Glück', color: '#f0c840' },
  green: { name: 'Gier', color: '#5cc85c' },
  pink: { name: 'Schweinezucht', color: '#f08ab0' },
  gym: { name: 'Fitnessstudio', color: '#f0903a' },
  coffee: { name: 'Koffein', color: '#c08a54' },
};

const pct = (v) => Math.round(v * 100) + '%';
const SKILLS = [
  // root
  { id: 'OO', b: 'root', x: 0, y: 0, req: [], name: 'Fester Griff', icon: 'fist', max: 5, cost: 8, grow: 1.75, key: true, d: (l) => `+${l} Grundschaden`, a: (s, l) => (s.dmgFlat += l) },

  // ---- red: grip strength ----
  { id: 'R1', b: 'red', x: 0, y: -1, req: ['OO'], name: 'Knöchelhart', icon: 'fist', max: 10, cost: 30, grow: 1.6, d: (l) => `+${l * 15}% Schaden`, a: (s, l) => (s.dmgPct += 0.15 * l) },
  { id: 'R2', b: 'red', x: -1, y: -2, req: ['R1'], name: 'Präzision', icon: 'crit', max: 10, cost: 70, grow: 1.55, d: (l) => `+${l * 2}% Krit-Chance`, a: (s, l) => (s.crit += 0.02 * l) },
  { id: 'R3', b: 'red', x: 1, y: -2, req: ['R1'], name: 'Wucht', icon: 'fist', max: 10, cost: 90, grow: 1.6, d: (l) => `+${l * 2} Grundschaden`, a: (s, l) => (s.dmgFlat += 2 * l) },
  { id: 'R4', b: 'red', x: -1, y: -3, req: ['R2'], name: 'Kritische Masse', icon: 'crit', max: 8, cost: 260, grow: 1.6, d: (l) => `+${l * 30}% Krit-Schaden`, a: (s, l) => (s.critMult += 0.3 * l) },
  { id: 'R5', b: 'red', x: 1, y: -3, req: ['R3'], name: 'Eisenfaust', icon: 'fist', max: 10, cost: 380, grow: 1.6, d: (l) => `+${l * 25}% Schaden`, a: (s, l) => (s.dmgPct += 0.25 * l) },
  { id: 'RK', b: 'red', x: 0, y: -4, req: ['R4', 'R5'], name: 'Henker', icon: 'skull', max: 3, cost: 1400, grow: 3, key: true, d: (l) => `Schweine unter ${l * 8}% LP zerbrechen sofort`, a: (s, l) => (s.execute = Math.max(s.execute, 0.08 * l)) },
  { id: 'R6', b: 'red', x: -1, y: -5, req: ['RK'], name: 'Schwachstelle', icon: 'crit', max: 10, cost: 3800, grow: 1.6, d: (l) => `+${l * 3}% Krit-Chance`, a: (s, l) => (s.crit += 0.03 * l) },
  { id: 'R7', b: 'red', x: 1, y: -5, req: ['RK'], name: 'Titanfaust', icon: 'fist', max: 10, cost: 5500, grow: 1.6, d: (l) => `+${l * 50}% Schaden`, a: (s, l) => (s.dmgPct += 0.5 * l) },
  { id: 'RX', b: 'red', x: 0, y: -6, req: ['R6', 'R7'], name: 'Vernichter', icon: 'skull', max: 1, cost: 28000, grow: 1, key: true, d: () => `+150% Krit-Schaden, Krits erschüttern den Tisch`, a: (s) => { s.critMult += 1.5; s.critQuake = true; } },
  { id: 'R8', b: 'red', x: 0, y: -7, req: ['RX'], name: 'Gottesfaust', icon: 'fist', max: 20, cost: 90000, grow: 1.7, d: (l) => `x${(Math.pow(1.3, l)).toFixed(2)} Schaden`, a: (s, l) => (s.dmgMore *= Math.pow(1.3, l)) },

  // ---- blue: wrist (speed / radius) ----
  { id: 'B1', b: 'blue', x: -1, y: 0, req: ['OO'], name: 'Lockeres Handgelenk', icon: 'speed', max: 10, cost: 25, grow: 1.6, d: (l) => `+${l * 8}% Schlagtempo`, a: (s, l) => (s.speedPct += 0.08 * l) },
  { id: 'B2', b: 'blue', x: -2, y: -1, req: ['B1'], name: 'Weiter Schwung', icon: 'radius', max: 8, cost: 60, grow: 1.6, d: (l) => `+${l * 8}% Radius`, a: (s, l) => (s.radiusPct += 0.08 * l) },
  { id: 'B3', b: 'blue', x: -2, y: 1, req: ['B1'], name: 'Doppelschlag', icon: 'hammer', max: 8, cost: 140, grow: 1.6, d: (l) => `${l * 5}% Chance, doppelt zu treffen`, a: (s, l) => (s.double += 0.05 * l) },
  { id: 'B4', b: 'blue', x: -3, y: 0, req: ['B2', 'B3'], name: 'Turbo-Gelenk', icon: 'speed', max: 10, cost: 380, grow: 1.6, d: (l) => `+${l * 10}% Schlagtempo`, a: (s, l) => (s.speedPct += 0.1 * l) },
  { id: 'BK', b: 'blue', x: -4, y: 0, req: ['B4'], name: 'Erdbeben', icon: 'wave', max: 3, cost: 1200, grow: 2.5, key: true, d: (l) => `Jeder ${[0, 12, 9, 6][l]}. Schlag erschüttert den ganzen Tisch`, a: (s, l) => (s.quakeEvery = [0, 12, 9, 6][l]) },
  { id: 'B5', b: 'blue', x: -5, y: -1, req: ['BK'], name: 'Riesenhammer', icon: 'radius', max: 8, cost: 3000, grow: 1.6, d: (l) => `+${l * 12}% Radius`, a: (s, l) => (s.radiusPct += 0.12 * l) },
  { id: 'B6', b: 'blue', x: -5, y: 1, req: ['BK'], name: 'Nachbeben', icon: 'wave', max: 5, cost: 3500, grow: 1.7, d: (l) => `+${l * 60}% Bebenschaden`, a: (s, l) => (s.quakeDmg += 0.6 * l) },
  { id: 'B7', b: 'blue', x: -6, y: 0, req: ['B5', 'B6'], name: 'Wirbelwind', icon: 'speed', max: 10, cost: 14000, grow: 1.6, d: (l) => `+${l * 15}% Schlagtempo`, a: (s, l) => (s.speedPct += 0.15 * l) },
  { id: 'BX', b: 'blue', x: -7, y: 0, req: ['B7'], name: 'Raserei', icon: 'fire', max: 1, cost: 60000, grow: 1, key: true, d: () => `Combo 40+ löst Raserei aus: +60% Tempo für 6s`, a: (s) => (s.frenzy = true) },

  // ---- stone rain (NW) ----
  { id: 'SK', b: 'stone', x: -2, y: -2, req: ['R2', 'B2'], name: 'Steinregen', icon: 'rock', max: 1, cost: 300, grow: 1, key: true, d: () => `Fähigkeit [Leertaste]: Felsen regnen auf die Schweine`, a: (s) => (s.stoneRain = true) },
  { id: 'S1', b: 'stone', x: -3, y: -3, req: ['SK'], name: 'Mehr Steine', icon: 'rock', max: 8, cost: 650, grow: 1.6, d: (l) => `+${l * 2} Steine pro Regen`, a: (s, l) => (s.stones += 2 * l) },
  { id: 'S2', b: 'stone', x: -2, y: -4, req: ['SK'], name: 'Schwere Brocken', icon: 'rock', max: 10, cost: 800, grow: 1.6, d: (l) => `+${l * 40}% Steinschaden`, a: (s, l) => (s.stoneDmg += 0.4 * l * 3) },
  { id: 'S3', b: 'stone', x: -4, y: -4, req: ['S1'], name: 'Wolkenbruch', icon: 'hourglass', max: 8, cost: 2000, grow: 1.6, d: (l) => `-${l * 8}% Abklingzeit`, a: (s, l) => (s.stoneCD *= 1 - 0.08 * l) },
  { id: 'S4', b: 'stone', x: -3, y: -5, req: ['S2', 'S3'], name: 'Goldklumpen', icon: 'coins', max: 5, cost: 4500, grow: 1.7, d: (l) => `Von Steinen zerschlagene Schweine: +${l * 30}% Münzen`, a: (s, l) => (s.stoneGold += 0.3 * l) },
  { id: 'SX', b: 'stone', x: -4, y: -6, req: ['S4'], name: 'Meteor', icon: 'meteor', max: 1, cost: 40000, grow: 1, key: true, d: () => `Jeder Steinregen endet mit einem gewaltigen Meteor`, a: (s) => (s.meteor = true) },

  // ---- ice (far NW) ----
  { id: 'IK', b: 'ice', x: -6, y: -2, req: ['B5', 'S3'], name: 'Tiefkühltruhe', icon: 'snow', max: 1, cost: 5000, grow: 1, key: true, d: () => `Jeder Schlag baut Frost auf: friert alle Schweine 2.5s ein`, a: (s) => (s.freeze += 0.05) },
  { id: 'I1', b: 'ice', x: -7, y: -3, req: ['IK'], name: 'Kälteeinbruch', icon: 'snow', max: 5, cost: 9000, grow: 1.7, d: (l) => `+${l * 20}% Frostaufbau`, a: (s, l) => (s.freezePct += 0.2 * l) },
  { id: 'I2', b: 'ice', x: -6, y: -4, req: ['IK'], name: 'Permafrost', icon: 'ice', max: 5, cost: 9000, grow: 1.7, d: (l) => `+${(l * 0.5).toFixed(1)}s Frostdauer`, a: (s, l) => (s.freezeDur += 0.5 * l) },
  { id: 'I3', b: 'ice', x: -7, y: -5, req: ['I1', 'I2'], name: 'Splitterfrost', icon: 'ice', max: 8, cost: 20000, grow: 1.6, d: (l) => `Gefrorene Schweine nehmen +${l * 25}% Schaden`, a: (s, l) => (s.freezeVuln += 0.25 * l) },

  // ---- electric (NE) ----
  { id: 'EK', b: 'elec', x: 2, y: -3, req: ['R3', 'L2'], name: 'Elektro-Hammer', icon: 'bolt', max: 1, cost: 450, grow: 1, key: true, d: () => `8% Chance auf Kettenblitze pro Schlag`, a: (s) => (s.lightning += 0.08) },
  { id: 'E1', b: 'elec', x: 3, y: -4, req: ['EK'], name: 'Hochspannung', icon: 'bolt', max: 10, cost: 900, grow: 1.55, d: (l) => `+${l * 3}% Blitzchance`, a: (s, l) => (s.lightning += 0.03 * l) },
  { id: 'E2', b: 'elec', x: 2, y: -5, req: ['EK'], name: 'Kettenreaktion', icon: 'chain', max: 6, cost: 1200, grow: 1.8, d: (l) => `+${l} Kettensprünge`, a: (s, l) => (s.chains += l) },
  { id: 'E3', b: 'elec', x: 4, y: -5, req: ['E1'], name: 'Starkstrom', icon: 'bolt', max: 10, cost: 2600, grow: 1.6, d: (l) => `+${l * 40}% Blitzschaden`, a: (s, l) => (s.lightningDmg += 0.4 * l) },
  { id: 'E4', b: 'elec', x: 3, y: -6, req: ['E2', 'E3'], name: 'Gewitter', icon: 'bolt', max: 5, cost: 7000, grow: 1.8, d: (l) => `Alle ${[0, 4, 3.2, 2.5, 1.9, 1.4][l]}s schlägt ein Blitz ein`, a: (s, l) => (s.storm = [0, 4, 3.2, 2.5, 1.9, 1.4][l]) },
  { id: 'E5', b: 'elec', x: 5, y: -6, req: ['E3'], name: 'Supraleiter', icon: 'crit', max: 1, cost: 15000, grow: 1, d: () => `Blitze können kritisch treffen`, a: (s) => (s.lightningCrit = true) },
  { id: 'EX', b: 'elec', x: 4, y: -7, req: ['E4', 'E5'], name: 'Tesla-Spule', icon: 'bolt', max: 1, cost: 50000, grow: 1, key: true, d: () => `Blitze betäuben 1s und springen doppelt so weit`, a: (s) => (s.tesla = true) },

  // ---- luck (NE / E) ----
  { id: 'L1', b: 'luck', x: 2, y: -1, req: ['G1', 'R1'], name: 'Glückspfennig', icon: 'clover', max: 10, cost: 60, grow: 1.6, d: (l) => `+${l * 15}% Chance auf seltene Münzen`, a: (s, l) => (s.rarePct += 0.15 * l) },
  { id: 'L2', b: 'luck', x: 3, y: -2, req: ['L1'], name: 'Edelsteinader', icon: 'gem', max: 10, cost: 150, grow: 1.6, d: (l) => `+${l * 15}% Edelsteinchance`, a: (s, l) => (s.gemPct += 0.15 * l) },
  { id: 'L3', b: 'luck', x: 4, y: -1, req: ['L1'], name: 'Jackpot-Riecher', icon: 'star', max: 10, cost: 240, grow: 1.6, d: (l) => `+${l * 25}% Jackpot-Chance`, a: (s, l) => (s.jackpotPct += 0.25 * l) },
  { id: 'L4', b: 'luck', x: 4, y: -3, req: ['L2'], name: 'Goldschwein', icon: 'pig', max: 5, cost: 900, grow: 1.9, d: (l) => `Goldschweine erscheinen (${l}x Häufigkeit)`, a: (s, l) => (s.goldenWeight += l) },
  { id: 'LK', b: 'luck', x: 5, y: -2, req: ['L2', 'L3'], name: 'Vierblättriges Kleeblatt', icon: 'clover', max: 1, cost: 3200, grow: 1, key: true, d: () => `x2 Glück: seltene Münzen, Edelsteine, Jackpots`, a: (s) => (s.luck *= 2) },
  { id: 'L5', b: 'luck', x: 6, y: -1, req: ['LK'], name: 'Goldrausch', icon: 'coins', max: 3, cost: 8000, grow: 2.2, d: (l) => `${l * 2}% Chance: Goldrausch (alle Spawns 4s golden)`, a: (s, l) => (s.goldRush += 0.02 * l) },
  { id: 'L6', b: 'luck', x: 6, y: -3, req: ['LK'], name: 'Mega-Jackpot', icon: 'star', max: 8, cost: 9000, grow: 1.6, d: (l) => `+${l * 50}% Jackpot-Größe`, a: (s, l) => (s.jackpotMult += 5 * l) },
  { id: 'LX', b: 'luck', x: 7, y: -2, req: ['L5', 'L6'], name: 'Diamantschwein', icon: 'gem', max: 1, cost: 80000, grow: 1, key: true, d: () => `Das legendäre Diamantschwein kann erscheinen`, a: (s) => (s.diamondWeight += 1) },

  // ---- green: greed ----
  { id: 'G1', b: 'green', x: 1, y: 0, req: ['OO'], name: 'Kleingeld', icon: 'coin', max: 15, cost: 20, grow: 1.5, d: (l) => `+${l * 12}% Münzwert`, a: (s, l) => (s.coinPct += 0.12 * l) },
  { id: 'G2', b: 'green', x: 2, y: 0, req: ['G1'], name: 'Sparstrumpf', icon: 'percent', max: 5, cost: 120, grow: 2, d: (l) => `+${l * 2}% Zinsen auf Erspartes pro Tag`, a: (s, l) => (s.interest += 0.02 * l) },
  { id: 'G3', b: 'green', x: 3, y: 0, req: ['G2'], name: 'Silberstreif', icon: 'coins', max: 10, cost: 320, grow: 1.6, d: (l) => `+${l * 20}% Münzwert`, a: (s, l) => (s.coinPct += 0.2 * l) },
  { id: 'G4', b: 'green', x: 4, y: 1, req: ['G3'], name: 'Bonuszahlung', icon: 'bag', max: 10, cost: 900, grow: 1.6, d: (l) => `+${l * 5}% Feierabend-Bonus auf Run-Einnahmen`, a: (s, l) => (s.endBonus += 0.05 * l) },
  { id: 'GK', b: 'green', x: 5, y: 0, req: ['G3', 'G4'], name: 'Combo-Kasse', icon: 'chain', max: 1, cost: 2400, grow: 1, key: true, d: () => `Jeder Combo-Treffer: +2% Münzwert (stapelbar)`, a: (s) => (s.comboCoin += 0.02) },
  { id: 'G5', b: 'green', x: 6, y: 1, req: ['GK'], name: 'Combo-Meister', icon: 'chain', max: 5, cost: 5000, grow: 1.7, d: (l) => `+${(l * 0.3).toFixed(1)}s Combo-Fenster`, a: (s, l) => (s.comboWindow += 0.3 * l) },
  { id: 'G6', b: 'green', x: 7, y: 0, req: ['GK'], name: 'Goldader', icon: 'coins', max: 10, cost: 9000, grow: 1.6, d: (l) => `+${l * 35}% Münzwert`, a: (s, l) => (s.coinPct += 0.35 * l) },
  { id: 'GX', b: 'green', x: 8, y: 0, req: ['G5', 'G6'], name: 'Midas', icon: 'crown', max: 1, cost: 45000, grow: 1, key: true, d: () => `x2 Münzwert`, a: (s) => (s.coinMore *= 2) },
  { id: 'G7', b: 'green', x: 9, y: 0, req: ['GX'], name: 'Inflation', icon: 'percent', max: 20, cost: 150000, grow: 1.7, d: (l) => `x${Math.pow(1.25, l).toFixed(2)} Münzwert`, a: (s, l) => (s.coinMore *= Math.pow(1.25, l)) },

  // ---- pink: pig breeding (SE) ----
  { id: 'P1', b: 'pink', x: 1, y: 1, req: ['OO'], name: 'Mehr Schweine', icon: 'piggyPlus', max: 8, cost: 35, grow: 1.7, d: (l) => `+${l} max. Schweine auf dem Tisch`, a: (s, l) => (s.maxPigs += l) },
  { id: 'P2', b: 'pink', x: 2, y: 2, req: ['P1'], name: 'Pünktchen', icon: 'pig', max: 1, cost: 60, grow: 1, unlockPig: 'dots', d: () => `Schaltet Pünktchen-Schweine frei`, a: (s) => s.pigs.add('dots') },
  { id: 'P3', b: 'pink', x: 3, y: 2, req: ['P2'], name: 'Schnellzucht', icon: 'hourglass', max: 10, cost: 150, grow: 1.6, d: (l) => `+${l * 15}% Spawnrate`, a: (s, l) => (s.spawnPct += 0.15 * l) },
  { id: 'P4', b: 'pink', x: 2, y: 3, req: ['P2'], name: 'Holzschwein', icon: 'pig', max: 1, cost: 220, grow: 1, unlockPig: 'wood', d: () => `Schaltet Holzschweine frei`, a: (s) => s.pigs.add('wood') },
  { id: 'P5', b: 'pink', x: 4, y: 2, req: ['P3'], name: 'Flitzer', icon: 'pig', max: 1, cost: 450, grow: 1, unlockPig: 'runner', d: () => `Schaltet Flitzer frei`, a: (s) => s.pigs.add('runner') },
  { id: 'P6', b: 'pink', x: 3, y: 3, req: ['P3', 'P4'], name: 'Schlafmütze', icon: 'pig', max: 1, cost: 600, grow: 1, unlockPig: 'sleepy', d: () => `Schaltet Schlafmützen frei`, a: (s) => s.pigs.add('sleepy') },
  { id: 'P7', b: 'pink', x: 4, y: 3, req: ['P5', 'P6'], name: 'Porzellan', icon: 'pig', max: 1, cost: 1100, grow: 1, unlockPig: 'porcelain', d: () => `Schaltet Porzellanschweine frei`, a: (s) => s.pigs.add('porcelain') },
  { id: 'P8', b: 'pink', x: 2, y: 4, req: ['P4'], name: 'Partyschwein', icon: 'pig', max: 1, cost: 1300, grow: 1, unlockPig: 'party', d: () => `Schaltet Partyschweine frei`, a: (s) => s.pigs.add('party') },
  { id: 'P9', b: 'pink', x: 5, y: 3, req: ['P5'], name: 'Schwarzgeld', icon: 'bag', max: 1, cost: 2200, grow: 1, unlockPig: 'mafia', d: () => `Schaltet Schwarzgeld-Schweine frei`, a: (s) => s.pigs.add('mafia') },
  { id: 'PA', b: 'pink', x: 3, y: 4, req: ['P6', 'P8'], name: 'Bombenschwein', icon: 'bomb', max: 1, cost: 2600, grow: 1, unlockPig: 'bomb', d: () => `Schaltet Bombenschweine frei`, a: (s) => s.pigs.add('bomb') },
  { id: 'PB', b: 'pink', x: 4, y: 4, req: ['P7', 'PA'], name: 'Mama-Schwein', icon: 'heart', max: 1, cost: 4000, grow: 1, unlockPig: 'mama', d: () => `Schaltet Mama-Schweine frei`, a: (s) => s.pigs.add('mama') },
  { id: 'PC', b: 'pink', x: 5, y: 4, req: ['P9', 'PB'], name: 'Tresorschwein', icon: 'lock', max: 1, cost: 7500, grow: 1, unlockPig: 'safe', d: () => `Schaltet Tresorschweine frei`, a: (s) => s.pigs.add('safe') },
  { id: 'PD', b: 'pink', x: 3, y: 5, req: ['PA'], name: 'Kristallschwein', icon: 'gem', max: 1, cost: 6000, grow: 1, unlockPig: 'crystal', d: () => `Schaltet Kristallschweine frei`, a: (s) => s.pigs.add('crystal') },
  { id: 'PE', b: 'pink', x: 5, y: 5, req: ['PC'], name: 'Robo-Schwein', icon: 'bolt', max: 1, cost: 12000, grow: 1, unlockPig: 'robo', d: () => `Schaltet Robo-Schweine frei`, a: (s) => s.pigs.add('robo') },
  { id: 'PF', b: 'pink', x: 4, y: 5, req: ['PB'], name: 'Geisterschwein', icon: 'eye', max: 1, cost: 10000, grow: 1, unlockPig: 'ghost', d: () => `Schaltet Geisterschweine frei`, a: (s) => s.pigs.add('ghost') },
  { id: 'PG', b: 'pink', x: 6, y: 4, req: ['PC'], name: 'Edelzucht', icon: 'piggyPlus', max: 10, cost: 9000, grow: 1.6, d: (l) => `Seltene Schweine +${l * 20}% häufiger`, a: (s, l) => (s.rarePig += 0.2 * l) },
  { id: 'PS', b: 'pink', x: 2, y: 5, req: ['P8', 'PD'], name: 'Discoschwein', icon: 'star', max: 1, cost: 14000, grow: 1, unlockPig: 'disco', d: () => `Schaltet Discoschweine frei`, a: (s) => s.pigs.add('disco') },
  { id: 'PZ', b: 'pink', x: 6, y: 5, req: ['PE', 'PG'], name: 'Zombieschwein', icon: 'skull', max: 1, cost: 16000, grow: 1, unlockPig: 'zombie', d: () => `Schaltet Zombieschweine frei`, a: (s) => s.pigs.add('zombie') },
  { id: 'PN', b: 'pink', x: 3, y: 6, req: ['PD', 'PF'], name: 'Ninjaschwein', icon: 'eye', max: 1, cost: 25000, grow: 1, unlockPig: 'ninja', d: () => `Schaltet Ninjaschweine frei`, a: (s) => s.pigs.add('ninja') },
  { id: 'PT', b: 'pink', x: 5, y: 6, req: ['PE', 'PF'], name: 'Finanzamt', icon: 'calendar', max: 1, cost: 30000, grow: 1, unlockPig: 'tax', d: () => `Schaltet Finanzamt-Schweine frei (riskant!)`, a: (s) => s.pigs.add('tax') },
  { id: 'PL', b: 'pink', x: 7, y: 5, req: ['PG', 'PZ'], name: 'Clownschwein', icon: 'star', max: 1, cost: 20000, grow: 1, unlockPig: 'clown', d: () => `Schaltet Clownschweine frei`, a: (s) => s.pigs.add('clown') },
  { id: 'PR', b: 'pink', x: 7, y: 4, req: ['PG'], name: 'Piratenschwein', icon: 'skull', max: 1, cost: 24000, grow: 1, unlockPig: 'pirate', d: () => `Schaltet Piratenschweine frei (mehr seltene Münzen)`, a: (s) => s.pigs.add('pirate') },
  { id: 'PV', b: 'pink', x: 2, y: 6, req: ['PS', 'PN'], name: 'Vampirschwein', icon: 'heart', max: 1, cost: 32000, grow: 1, unlockPig: 'vampire', d: () => `Schaltet Vampirschweine frei`, a: (s) => s.pigs.add('vampire') },
  { id: 'PX', b: 'pink', x: 6, y: 6, req: ['PZ', 'PT'], name: 'Astronautenschwein', icon: 'star', max: 1, cost: 40000, grow: 1, unlockPig: 'astro', d: () => `Schaltet Astronautenschweine frei`, a: (s) => s.pigs.add('astro') },
  { id: 'PK', b: 'pink', x: 4, y: 7, req: ['PN', 'PT'], name: 'Königsschwein', icon: 'crown', max: 1, cost: 75000, grow: 1, key: true, unlockPig: 'king', d: () => `Seine Majestät erscheint auf dem Tisch`, a: (s) => s.pigs.add('king') },

  // ---- gym: stamina (S) ----
  { id: 'A1', b: 'gym', x: 0, y: 1, req: ['OO'], name: 'Liegestütze', icon: 'dumbbell', max: 10, cost: 25, grow: 1.55, d: (l) => `+${l * 5} max. Ausdauer`, a: (s, l) => (s.staminaFlat += 5 * l) },
  { id: 'A2', b: 'gym', x: 0, y: 2, req: ['A1'], name: 'Ausdauertraining', icon: 'heart', max: 8, cost: 90, grow: 1.6, d: (l) => `-${l * 5}% Ausdauerkosten pro Schlag`, a: (s, l) => (s.costPct -= 0.05 * l) },
  { id: 'A3', b: 'gym', x: -1, y: 3, req: ['A2'], name: 'Proteinshake', icon: 'drink', max: 10, cost: 260, grow: 1.6, d: (l) => `+${l * 10} max. Ausdauer`, a: (s, l) => (s.staminaFlat += 10 * l) },
  { id: 'A4', b: 'gym', x: 1, y: 3, req: ['A2'], name: 'Bankdrücken', icon: 'dumbbell', max: 10, cost: 380, grow: 1.6, d: (l) => `+${l * 8}% max. Ausdauer`, a: (s, l) => (s.staminaPct += 0.08 * l) },
  { id: 'AK', b: 'gym', x: 0, y: 4, req: ['A3', 'A4'], name: 'Zweiter Atem', icon: 'heart', max: 3, cost: 1500, grow: 2.5, key: true, d: (l) => `Einmal pro Run: bei 0 Ausdauer +${l * 20}% zurück`, a: (s, l) => (s.secondWind = Math.max(s.secondWind, 0.2 * l)) },
  { id: 'A5', b: 'gym', x: -1, y: 5, req: ['AK'], name: 'Erholungs-Schlag', icon: 'heart', max: 10, cost: 3200, grow: 1.6, d: (l) => `+${(l * 0.2).toFixed(1)} Ausdauer pro zerschlagenem Schwein (max. 1 Balken/Run)`, a: (s, l) => (s.staminaPerSmash += 0.2 * l) },
  { id: 'A6', b: 'gym', x: 1, y: 5, req: ['AK'], name: 'Marathon', icon: 'dumbbell', max: 10, cost: 3800, grow: 1.6, d: (l) => `+${l * 15} max. Ausdauer`, a: (s, l) => (s.staminaFlat += 15 * l) },
  { id: 'AX', b: 'gym', x: 0, y: 6, req: ['A5', 'A6'], name: 'Eiserner Wille', icon: 'fist', max: 1, cost: 30000, grow: 1, key: true, d: () => `Ausdauer sinkt nur noch halb so schnell mit der Zeit`, a: (s) => (s.drain *= 0.5) },

  // ---- coffee (SW) ----
  { id: 'C1', b: 'coffee', x: -1, y: 1, req: ['OO'], name: 'Espresso', icon: 'coffee', max: 10, cost: 40, grow: 1.6, d: (l) => `+${(l * 0.04).toFixed(2)} Ausdauer/s Regeneration`, a: (s, l) => (s.regen += 0.04 * l) },
  { id: 'C2', b: 'coffee', x: -2, y: 2, req: ['C1'], name: 'Kaffeetasse', icon: 'coffee', max: 5, cost: 180, grow: 1.9, d: (l) => `Kaffeetassen erscheinen (${l}x), +12 Ausdauer`, a: (s, l) => (s.coffee += l) },
  { id: 'C3', b: 'coffee', x: -3, y: 2, req: ['C2'], name: 'Doppelter Espresso', icon: 'coffee', max: 5, cost: 650, grow: 1.7, d: (l) => `Kaffee gibt +${l * 50}% Ausdauer`, a: (s, l) => (s.coffeeAmt += 0.5 * l) },
  { id: 'C4', b: 'coffee', x: -2, y: 3, req: ['C2'], name: 'Koffeinschock', icon: 'speed', max: 5, cost: 800, grow: 1.7, d: (l) => `Nach Kaffee: +${l * 15}% Tempo für 5s`, a: (s, l) => (s.coffeeSpeed += 0.15 * l) },
  { id: 'CK', b: 'coffee', x: -3, y: 4, req: ['C3', 'C4'], name: 'Energy-Drink', icon: 'drink', max: 1, cost: 4000, grow: 1, key: true, d: () => `Seltene Energy-Drinks: +40 Ausdauer & Raserei`, a: (s) => (s.energy = true) },
  { id: 'C5', b: 'coffee', x: -4, y: 3, req: ['C3'], name: 'Koffeinsucht', icon: 'coffee', max: 5, cost: 6000, grow: 1.7, d: (l) => `Jeder Kaffee: +${l * 2}% Schaden für den Rest des Runs`, a: (s, l) => (s.coffeeAddict += 0.02 * l) },
  { id: 'C6', b: 'coffee', x: -4, y: 5, req: ['CK', 'C5'], name: 'Barista-Lizenz', icon: 'coffee', max: 10, cost: 20000, grow: 1.6, d: (l) => `+${(l * 0.1).toFixed(1)} Ausdauer/s Regeneration`, a: (s, l) => (s.regen += 0.1 * l) },
];
// deeper nodes get progressively pricier so the tree stays meaningful late game
for (const sk of SKILLS) if (sk.cost >= 600) sk.cost = Math.round(sk.cost * (1 + Math.log10(sk.cost / 600) * 2.5));
const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const skillCost = (sk, lvl) => Math.round(sk.cost * Math.pow(sk.grow, lvl));

// ---------------- PERKS (choose one after each paid bill) ----------------
// rarity: 1 common, 2 rare, 3 epic
const PERKS = [
  { id: 'freeze', name: 'Tiefkühltruhe', icon: 'snow', r: 2, max: 3, d: (l) => `Treffer bauen Frost auf: alle Schweine frieren ${(2 + l * 0.5).toFixed(1)}s ein`, a: (s, l) => { s.freeze += 0.04 + 0.01 * l; s.freezeDur += 0.5 * l - 0.5; } },
  { id: 'recovery', name: 'Erholungs-Schlag', icon: 'heart', r: 1, max: 5, d: (l) => `+${(l * 0.5).toFixed(1)} Ausdauer pro Schwein (max. 1 Balken/Run)`, a: (s, l) => (s.staminaPerSmash += 0.5 * l) },
  { id: 'interest', name: 'Zinssatz', icon: 'percent', r: 1, max: 4, d: (l) => `${l * 5}% deines Ersparten als Bonus pro Tag`, a: (s, l) => (s.interest += 0.05 * l) },
  { id: 'golden', name: 'Goldene Stunde', icon: 'coins', r: 1, max: 10, d: (l) => `+${l * 15}% Münzwert`, a: (s, l) => (s.coinPct += 0.15 * l) },
  { id: 'double', name: 'Doppelschlag', icon: 'hammer', r: 1, max: 5, d: (l) => `${l * 10}% Chance, doppelt zu treffen`, a: (s, l) => (s.double += 0.1 * l) },
  { id: 'execute', name: 'Gnadenstoß', icon: 'skull', r: 2, max: 3, d: (l) => `Schweine unter ${l * 10}% LP zerbrechen sofort`, a: (s, l) => (s.execute = Math.max(s.execute, 0.1 * l)) },
  { id: 'radius', name: 'Großer Schwung', icon: 'radius', r: 1, max: 5, d: (l) => `+${l * 12}% Radius`, a: (s, l) => (s.radiusPct += 0.12 * l) },
  { id: 'coffee', name: 'Kaffeepause', icon: 'coffee', r: 1, max: 3, d: (l) => `Kaffeetassen erscheinen auf dem Tisch (${l}x)`, a: (s, l) => (s.coffee += l) },
  { id: 'wind', name: 'Zweiter Atem', icon: 'heart', r: 2, max: 2, d: (l) => `Einmal pro Run bei 0 Ausdauer: +${l * 35}% zurück`, a: (s, l) => (s.secondWind = Math.max(s.secondWind, 0.35 * l)) },
  { id: 'jackpot', name: 'Jackpot-Jäger', icon: 'star', r: 2, max: 3, d: (l) => `x${l + 1} Jackpot-Chance`, a: (s, l) => (s.jackpotMore *= l + 1) },
  { id: 'magnet', name: 'Schweinemagnet', icon: 'magnet', r: 1, max: 5, d: (l) => `+${l} max. Schweine, +${l * 20}% Spawnrate`, a: (s, l) => { s.maxPigs += l; s.spawnPct += 0.2 * l; } },
  { id: 'penny', name: 'Glückspfennig', icon: 'clover', r: 1, max: 3, d: (l) => `+${l * 50}% seltene Münzen`, a: (s, l) => (s.rarePct += 0.5 * l) },
  { id: 'gemhunter', name: 'Edelsteinsucher', icon: 'gem', r: 1, max: 3, d: (l) => `+${l * 40}% Edelsteinchance`, a: (s, l) => (s.gemPct += 0.4 * l) },
  { id: 'refund', name: 'Steuerrückerstattung', icon: 'bag', r: 2, max: 3, d: (l) => `${l * 10}% jeder bezahlten Rechnung zurück`, a: (s, l) => (s.billRefund += 0.1 * l) },
  { id: 'discount', name: 'Rabattkarte', icon: 'card', r: 1, max: 3, d: (l) => `Skillbaum ${l * 8}% günstiger`, a: (s, l) => (s.skillDiscount += 0.08 * l) },
  { id: 'delay', name: 'Zahlungsaufschub', icon: 'calendar', r: 3, max: 2, d: (l) => `Neue Rechnungen: +${l} Tag Frist`, a: (s, l) => (s.dueBonus += l) },
  { id: 'critchance', name: 'Kritisches Denken', icon: 'crit', r: 1, max: 5, d: (l) => `+${l * 5}% Krit-Chance`, a: (s, l) => (s.crit += 0.05 * l) },
  { id: 'brutal', name: 'Brutale Wucht', icon: 'fist', r: 1, max: 5, d: (l) => `+${l * 40}% Krit-Schaden`, a: (s, l) => (s.critMult += 0.4 * l) },
  { id: 'combo', name: 'Combo-Künstler', icon: 'chain', r: 2, max: 3, d: (l) => `+${(l * 0.4).toFixed(1)}s Combo-Fenster, +${l}% Münzen pro Combo`, a: (s, l) => { s.comboWindow += 0.4 * l; s.comboCoin += 0.01 * l; } },
  { id: 'quake', name: 'Erdbeben', icon: 'wave', r: 2, max: 3, d: (l) => `Jeder ${[0, 10, 8, 6][l]}. Schlag trifft alle Schweine`, a: (s, l) => (s.quakeEvery = s.quakeEvery ? Math.min(s.quakeEvery, [0, 10, 8, 6][l]) : [0, 10, 8, 6][l]) },
  { id: 'blackmarket', name: 'Schwarzmarkt', icon: 'bag', r: 3, max: 1, d: () => `Schwarzgeld-Schweine erscheinen (auch ohne Skill), x2 häufiger`, a: (s) => { s.pigs.add('mafia'); s.mafiaBoost = 2; } },
  { id: 'adrenaline', name: 'Adrenalin', icon: 'fire', r: 2, max: 2, d: (l) => `Unter 30% Ausdauer: +${l * 40}% Tempo`, a: (s, l) => (s.adrenaline += 0.4 * l) },
  { id: 'thrifty', name: 'Sparfuchs', icon: 'arrow', r: 1, max: 3, d: (l) => `-${l * 10}% Ausdauerkosten pro Schlag`, a: (s, l) => (s.costPct -= 0.1 * l) },
  { id: 'goldrush', name: 'Goldrausch', icon: 'coins', r: 3, max: 2, d: (l) => `${l * 3}% Chance pro Schwein: Goldrausch!`, a: (s, l) => (s.goldRush += 0.03 * l) },
  { id: 'bombs', name: 'Bombenstimmung', icon: 'bomb', r: 2, max: 3, d: (l) => `${l * 5}% Chance: Schweine explodieren beim Zerbrechen`, a: (s, l) => (s.bombChance += 0.05 * l) },
  { id: 'morning', name: 'Morgenkaffee', icon: 'coffee', r: 1, max: 5, d: (l) => `+${l * 10} max. Ausdauer`, a: (s, l) => (s.staminaFlat += 10 * l) },
  { id: 'lightning', name: 'Kettenblitz', icon: 'bolt', r: 2, max: 3, d: (l) => `+${l * 8}% Blitzchance pro Schlag`, a: (s, l) => (s.lightning += 0.08 * l) },
  { id: 'stoneperk', name: 'Felsenfest', icon: 'rock', r: 2, max: 3, d: (l) => `Steinregen freigeschaltet, +${l * 3} Steine`, a: (s, l) => { s.stoneRain = true; s.stones += 3 * l; } },
  { id: 'piggybank', name: 'Sparschwein-Sparschwein', icon: 'pig', r: 3, max: 1, d: () => `Ferkel erscheinen in Rudeln (3-5 auf einmal)`, a: (s) => (s.pigletPacks = true) },
  { id: 'overtime', name: 'Überstunden', icon: 'hourglass', r: 2, max: 3, d: (l) => `Ausdauer sinkt ${l * 20}% langsamer`, a: (s, l) => (s.drainPct -= 0.2 * l) },
  { id: 'sniper', name: 'Präzisionsschlag', icon: 'eye', r: 2, max: 3, d: (l) => `Einzeltreffer: +${l * 60}% Schaden`, a: (s, l) => (s.single += 0.6 * l) },
  { id: 'gemrain', name: 'Juwelenregen', icon: 'gem', r: 3, max: 2, d: (l) => `Jackpots regnen ${l * 5} Edelsteine`, a: (s, l) => (s.jackpotGems += 5 * l) },
];
const PERK_BY_ID = Object.fromEntries(PERKS.map((p) => [p.id, p]));
const RARITY = {
  1: { name: 'Gewöhnlich', color: '#c8b89a' },
  2: { name: 'Selten', color: '#5ab0ff' },
  3: { name: 'Episch', color: '#c07af0' },
  4: { name: 'Legendär', color: '#ff9a3a' },
};

// ---------------- BILLS ----------------
const BILLS = [
  { name: 'Handyrechnung', q: 'Ich telefoniere doch gar nicht so viel...' },
  { name: 'Stromrechnung', q: 'Wer hat das Licht angelassen? Ach, ich.' },
  { name: 'Internet', q: 'Ohne WLAN keine Katzenvideos. Das ist ein Grundrecht!' },
  { name: 'Wasserrechnung', q: 'Ab jetzt dusche ich kalt. Und kurz. Und selten.' },
  { name: 'Rundfunkbeitrag', q: 'Ich hab nicht mal einen Fernseher!' },
  { name: 'Fitnessstudio-Abo', q: 'Ich war da genau einmal. Im Januar.' },
  { name: 'Mietzahlung', q: 'Mein Vermieter lächelt nie. Niemals.' },
  { name: 'Autoversicherung', q: 'Mein Auto ist älter als ich.' },
  { name: 'Zahnarzt', q: 'Die Wurzelbehandlung war es wert. Nicht.' },
  { name: 'Streaming-Abos', q: 'Elf Abos. Ich schaue nur eins.' },
  { name: 'Kreditkarte', q: 'Wer hat das alles gekauft?! ...Oh.' },
  { name: 'Tierarzt', q: 'Für Mr. Whiskers. Jeden Cent wert.' },
  { name: 'Steuernachzahlung', q: 'Das Finanzamt vergisst nie.' },
  { name: 'Heizkosten', q: 'Drei Pullover sind auch eine Heizung.' },
  { name: 'Hochzeitsgeschenk', q: 'Meine Cousine heiratet. Zum dritten Mal.' },
  { name: 'Dachreparatur', q: 'Es regnet ins Wohnzimmer. Sehr gemütlich.' },
  { name: 'Studienkredit', q: 'Mein Philosophie-Diplom zahlt sich aus. Irgendwann.' },
  { name: 'Anwaltskosten', q: 'Ich sag nur: Gartenzwerg-Affäre.' },
  { name: 'Sportwagen-Leasing', q: 'Midlife-Crisis? Ich? Niemals.' },
  { name: 'Yacht-Liegeplatz', q: 'Ich habe keine Yacht. Nur den Liegeplatz.' },
  { name: 'Privatjet-Wartung', q: 'Wie ist DAS denn passiert?' },
  { name: 'Schlossrenovierung', q: 'Erbe von Tante Gertrud. Mit Schulden.' },
  { name: 'Fußballverein', q: 'Ich hab aus Versehen einen Verein gekauft.' },
  { name: 'Inselsteuer', q: 'Meine Insel. Meine Steuern. Mein Problem.' },
  { name: 'Mondgrundstück', q: 'Der Mond ist teurer als gedacht.' },
  { name: 'Raumstation-Miete', q: 'Houston, wir haben eine Rechnung.' },
  { name: 'Staatsschulden', q: 'Wieso schulde ICH die Staatsschulden?!' },
  { name: 'Zeitmaschinen-Reparatur', q: 'Ich habe sie gestern schon bezahlt. Glaube ich.' },
  { name: 'Paralleluniversum-Gebühr', q: 'Mein anderes Ich hat auch Schulden.' },
  { name: 'Rechnung des Universums', q: 'Ist das... die letzte?' },
];
function niceRound(n) {
  if (n < 100) return Math.round(n / 5) * 5;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / (mag * 5)) * mag * 5;
}
function billInfo(i) {
  const base = BILLS[i % BILLS.length];
  const loop = Math.floor(i / BILLS.length);
  const amount = niceRound(30 * Math.pow(1.62, Math.min(i, 10)) * Math.pow(1.85, clamp(i - 10, 0, 6)) * Math.pow(2.1, Math.max(0, i - 16)));
  const days = i < 2 ? 2 : i % 3 === 2 ? 3 : 2;
  return {
    index: i,
    name: base.name + (loop > 0 ? ' ' + ['II', 'III', 'IV', 'V', 'VI', 'VII'][Math.min(5, loop - 1)] : ''),
    q: base.q,
    amount,
    days,
    acct: String(1000 + ((i * 7919) % 9000)),
  };
}

// ---------------- PRESTIGE: RINGS & BRACELETS ----------------
const RINGS = [
  { id: 'kiss', name: 'Kuss des Todes', desc: 'Erhöht die Krit-Chance.', stat: 'Krit-Chance', val: '+35%', cost: 6, band: '#f5c542', skull: true, a: (s) => (s.crit += 0.35) },
  { id: 'signet', name: 'Siegelring', desc: 'Dein Wort ist Gold wert.', stat: 'Münzwert', val: '+50%', cost: 6, band: '#f5c542', gem: '#2a3a8a', a: (s) => (s.coinPct += 0.5) },
  { id: 'endur', name: 'Ring der Ausdauer', desc: 'Für lange Nächte.', stat: 'Max. Ausdauer', val: '+40', cost: 8, band: '#c8d0da', gem: '#e8903a', a: (s) => (s.staminaFlat += 40) },
  { id: 'fistring', name: 'Schlagring', desc: 'Nicht ganz legal.', stat: 'Grundschaden', val: '+3, +20%', cost: 8, band: '#9aa4b0', a: (s) => { s.dmgFlat += 3; s.dmgPct += 0.2; } },
  { id: 'snake', name: 'Schlangenring', desc: 'Flink wie eine Natter.', stat: 'Schlagtempo', val: '+20%', cost: 9, band: '#6aa04a', gem: '#e83a4a', a: (s) => (s.speedPct += 0.2) },
  { id: 'heir', name: 'Erbstück', desc: 'Von Opa Bill senior.', stat: 'Startkapital', val: '$150', cost: 9, band: '#d6874a', gem: '#3ad06a', a: (s) => (s.startMoney += 150) },
  { id: 'ruby', name: 'Rubinring', desc: 'Funkelt verdächtig.', stat: 'Edelsteine', val: 'x2', cost: 10, band: '#f5c542', gem: '#e83a4a', a: (s) => (s.gemMore *= 2) },
  { id: 'clover', name: 'Kleeblattring', desc: 'Glück ist eine Entscheidung.', stat: 'Glück', val: 'x1.5', cost: 14, band: '#c8d0da', gem: '#3ad06a', a: (s) => (s.luck *= 1.5) },
  { id: 'giant', name: 'Riesenring', desc: 'Passt eigentlich nur Riesen.', stat: 'Radius', val: '+30%', cost: 15, band: '#7a8490', gem: '#b05ae8', a: (s) => (s.radiusPct += 0.3) },
  { id: 'coffeering', name: 'Kaffeering', desc: 'Riecht nach Espresso.', stat: 'Regeneration', val: '+0.3/s', cost: 16, band: '#8a5a3a', gem: '#3a2014', a: (s) => (s.regen += 0.3) },
  { id: 'comboring', name: 'Combo-Ring', desc: 'Im Rhythmus bleiben.', stat: 'Combo', val: '+0.6s, +1%', cost: 16, band: '#c8d0da', gem: '#3a7ae8', a: (s) => { s.comboWindow += 0.6; s.comboCoin += 0.01; } },
  { id: 'pigring', name: 'Schweinering', desc: 'Ein Ring für alle Schweine.', stat: 'Schweine', val: '+3, +40% Spawn', cost: 20, band: '#f49ab0', gem: '#ffffff', a: (s) => { s.maxPigs += 3; s.spawnPct += 0.4; } },
  { id: 'stonering', name: 'Steinring', desc: 'Schwer wie ein Fels.', stat: 'Steinregen', val: 'Freigeschaltet', cost: 22, band: '#8a827a', gem: '#5a524c', a: (s) => { s.stoneRain = true; s.stones += 2; } },
  { id: 'thunder', name: 'Donnerring', desc: 'Kribbelt ein wenig.', stat: 'Blitzchance', val: '+12%', cost: 25, band: '#c8d0da', gem: '#5ad0ff', a: (s) => (s.lightning += 0.12) },
  { id: 'frost', name: 'Frostring', desc: 'Eiskalt.', stat: 'Frostaufbau', val: '+5%/Schlag', cost: 25, band: '#a8e8ff', gem: '#ffffff', a: (s) => (s.freeze += 0.05) },
  { id: 'jackring', name: 'Jackpot-Ring', desc: 'Der Hauptgewinn wartet.', stat: 'Jackpot-Chance', val: 'x3', cost: 30, band: '#f5c542', gem: '#ff9a3a', a: (s) => (s.jackpotMore *= 3) },
  { id: 'wedding', name: 'Ehering', desc: 'Treue zahlt sich aus.', stat: 'Perk-Auswahl', val: '+1 Karte', cost: 35, band: '#f5c542', gem: '#ffffff', a: (s) => (s.perkChoices += 1) },
  { id: 'banker', name: 'Bankiersring', desc: 'Geld arbeitet für dich.', stat: 'Zinsen', val: '+5%/Tag', cost: 35, band: '#c8d0da', gem: '#2a8a3a', a: (s) => (s.interest += 0.05) },
  { id: 'time', name: 'Zeitring', desc: 'Die Uhr tickt langsamer.', stat: 'Frist', val: '+1 Tag', cost: 40, band: '#b8f0ec', gem: '#3a7ae8', a: (s) => (s.dueBonus += 1) },
  { id: 'discount', name: 'Rabattring', desc: 'Immer ein Schnäppchen.', stat: 'Skillkosten', val: '-25%', cost: 40, band: '#c8d0da', gem: '#e8c040', a: (s) => (s.skillDiscount += 0.25) },
];
const BRACELETS = [
  { id: 'greed', name: 'Armband der Gier', desc: 'Mehr. Immer mehr.', stat: 'Münzwert', val: 'x2', cost: 25, band: '#f5c542', gem: '#3ad06a', a: (s) => (s.coinMore *= 2) },
  { id: 'titan', name: 'Titan-Armband', desc: 'Schwer, aber mächtig.', stat: 'Schaden / Ausdauer', val: 'x1.6 / +25', cost: 25, band: '#9aa4b0', gem: '#4a4a58', a: (s) => { s.dmgMore *= 1.6; s.staminaFlat += 25; } },
  { id: 'lucky', name: 'Glücksarmband', desc: 'Klimpert glücklich.', stat: 'Seltene Münzen / Edelst.', val: 'x3 / x2', cost: 40, band: '#c8d0da', gem: '#3ad06a', a: (s) => { s.rareMore *= 3; s.gemMore *= 2; } },
  { id: 'midas', name: 'Midas-Armband', desc: 'Alles wird zu Gold.', stat: 'Goldschweine / Jackpot', val: 'x3 / +100%', cost: 50, band: '#f5c542', gem: '#ff9a3a', a: (s) => { s.goldenWeight += 2; s.goldenMore *= 3; s.jackpotMult += 10; } },
  { id: 'chronos', name: 'Chronos-Armband', desc: 'Zeit ist Geld.', stat: 'Frist / Tempo', val: '+1 Tag / +15%', cost: 60, band: '#b8f0ec', gem: '#b05ae8', a: (s) => { s.dueBonus += 1; s.speedPct += 0.15; } },
];
const RING_SLOTS = 5, BRACELET_SLOTS = 2;

// ---------------- RARE COINS (collection) ----------------
const RARE_COINS = [
  // common (1)
  { id: 'pfennig', name: 'Alter Pfennig', r: 1, color: '#c87a3a', symbol: 'one', bonus: ['coin', 0.03], desc: 'Aus Omas Portemonnaie.' },
  { id: 'kronkorken', name: 'Kronkorken-Taler', r: 1, color: '#d0d4dc', symbol: 'star', rim: 'notch', bonus: ['stamina', 3], desc: 'Kein Geld. Aber hübsch.' },
  { id: 'arcade', name: 'Arcade-Token', r: 1, color: '#e8c040', symbol: 'q', bonus: ['speed', 0.02], desc: 'Noch ein Spiel...' },
  { id: 'schoko', name: 'Schokotaler', r: 1, color: '#e0b040', symbol: 'heart', bonus: ['stamina', 3], desc: 'Leicht angeschmolzen.' },
  { id: 'knopf', name: 'Hosenknopf', r: 1, color: '#7a5a3a', symbol: 'eye', bonus: ['coin', 0.03], desc: 'Ist das überhaupt Geld?' },
  { id: 'waschsalon', name: 'Waschsalon-Münze', r: 1, color: '#9aa4b0', symbol: 'wave', bonus: ['dmg', 0.03], desc: 'Riecht nach Weichspüler.' },
  { id: 'einkauf', name: 'Einkaufswagen-Chip', r: 1, color: '#e83a4a', symbol: 'dollar', bonus: ['speed', 0.02], desc: 'Unbezahlbar am Samstag.' },
  // rare (2)
  { id: 'silberdollar', name: 'Silberdollar', r: 2, color: '#d8e0ea', symbol: 'dollar', bonus: ['coin', 0.06], desc: 'Aus dem Wilden Westen.' },
  { id: 'denar', name: 'Römischer Denar', r: 2, color: '#c8d0d8', symbol: 'crown', bonus: ['dmg', 0.06], desc: 'Caesar hat ihn verloren.' },
  { id: 'dublone', name: 'Piratendublone', r: 2, color: '#f0c040', symbol: 'skull', bonus: ['crit', 0.03], desc: 'Arrr! Verfluchtes Gold.' },
  { id: 'kleeblatt', name: 'Glücksmünze', r: 2, color: '#6ac85a', symbol: 'clover', bonus: ['luck', 0.08], desc: 'Bringt Glück. Angeblich.' },
  { id: 'brunnen', name: 'Wunschbrunnen-Münze', r: 2, color: '#8ad0f0', symbol: 'swirl', bonus: ['gems', 0.1], desc: 'Jemandes Wunsch. Jetzt deiner.' },
  { id: 'anker', name: 'Seemanns-Taler', r: 2, color: '#5a8ad8', symbol: 'anchor', bonus: ['stamina', 8], desc: 'Hat sieben Meere gesehen.' },
  // epic (3)
  { id: 'drachme', name: 'Goldene Drachme', r: 3, color: '#ffd040', symbol: 'sun', bonus: ['coin', 0.12], desc: 'Glänzt wie die Sonne Athens.' },
  { id: 'mond', name: 'Mondmünze', r: 3, color: '#c8c0f0', symbol: 'moon', bonus: ['crit', 0.05], desc: 'Fiel eines Nachts vom Himmel.' },
  { id: 'pixel', name: 'Pixel-Coin', r: 3, color: '#ff8a3a', symbol: 'bitcoin', bonus: ['speed', 0.06], desc: '8 Bit. 100% echt.' },
  { id: 'zeitreise', name: 'Zeitreise-Münze', r: 3, color: '#3ad0b0', symbol: 'inf', bonus: ['stamina', 15], desc: 'Geprägt im Jahr 3024.' },
  { id: 'koban', name: 'Shogun-Koban', r: 3, color: '#f0b030', symbol: 'sword', bonus: ['dmg', 0.12], desc: 'Ehrenvolles Gold.' },
  { id: 'maya', name: 'Maya-Sonnenscheibe', r: 3, color: '#e8a040', symbol: 'flower', bonus: ['luck', 0.15], desc: 'Prophezeit Reichtum.' },
  // legendary (4)
  { id: 'midas', name: 'Midas-Münze', r: 4, color: '#ffe060', symbol: 'crown', bonus: ['coin', 0.25], desc: 'Alles, was sie berührt...' },
  { id: 'billsdollar', name: 'Bills erster Dollar', r: 4, color: '#7ad06a', symbol: 'pig', bonus: ['dmg', 0.25], desc: 'Den hat er mit 6 verdient. Rasen gemäht.' },
  { id: 'schroedinger', name: 'Schrödingers Münze', r: 4, color: '#b07ae8', symbol: 'cat', bonus: ['crit', 0.1], desc: 'Gleichzeitig Kopf und Zahl.' },
  { id: 'kosmos', name: 'Kosmischer Taler', r: 4, color: '#5a6ae8', symbol: 'star', bonus: ['luck', 0.3], desc: 'Aus dem Herzen einer Supernova.' },
  { id: 'yinyang', name: 'Taler des Gleichgewichts', r: 4, color: '#e8e8e8', symbol: 'yin', bonus: ['stamina', 30], desc: 'Schulden und Guthaben vereint.' },
];
const RARE_BY_ID = Object.fromEntries(RARE_COINS.map((c) => [c.id, c]));
const RARE_WEIGHTS = { 1: 60, 2: 28, 3: 10, 4: 2.5 };
const BONUS_NAMES = { coin: 'Münzwert', dmg: 'Schaden', crit: 'Krit-Chance', luck: 'Glück', gems: 'Edelsteine', stamina: 'Ausdauer', speed: 'Tempo' };
function bonusText(b) {
  const [k, v] = b;
  if (k === 'stamina') return `+${v} ${BONUS_NAMES[k]}`;
  return `+${Math.round(v * 100)}% ${BONUS_NAMES[k]}`;
}

// ---------------- ACHIEVEMENTS ----------------
// check(P) receives persistent save, returns [current, goal]
const ACHIEVEMENTS = [
  { id: 'smash1', name: 'Erster Schlag', desc: 'Zerschlage dein erstes Sparschwein.', icon: 'hammer', check: (P) => [P.stats.pigs, 1], reward: { gems: 3 } },
  { id: 'smash100', name: 'Schweinebeseitiger', desc: 'Zerschlage 100 Sparschweine.', icon: 'pig', check: (P) => [P.stats.pigs, 100], reward: { gems: 10 } },
  { id: 'smash1000', name: 'Porzellan-Apokalypse', desc: 'Zerschlage 1.000 Sparschweine.', icon: 'pig', check: (P) => [P.stats.pigs, 1000], reward: { pp: 5 } },
  { id: 'smash10000', name: 'Schweine-Schreck', desc: 'Zerschlage 10.000 Sparschweine.', icon: 'skull', check: (P) => [P.stats.pigs, 10000], reward: { pp: 20 } },
  { id: 'bill1', name: 'Zahlungsfähig', desc: 'Bezahle deine erste Rechnung.', icon: 'calendar', check: (P) => [P.record, 1], reward: { gems: 5 } },
  { id: 'bill5', name: 'Pünktlich wie die Bank', desc: 'Bezahle Rechnung #5.', icon: 'calendar', check: (P) => [P.record, 5], reward: { gems: 15 } },
  { id: 'bill10', name: 'Schuldenfrei?', desc: 'Bezahle Rechnung #10.', icon: 'calendar', check: (P) => [P.record, 10], reward: { pp: 5 } },
  { id: 'bill15', name: 'Finanzgenie', desc: 'Bezahle Rechnung #15.', icon: 'bag', check: (P) => [P.record, 15], reward: { pp: 10 } },
  { id: 'bill20', name: 'Großverdiener', desc: 'Bezahle Rechnung #20.', icon: 'crown', check: (P) => [P.record, 20], reward: { pp: 20 } },
  { id: 'bill30', name: 'Universum bezahlt', desc: 'Bezahle Rechnung #30.', icon: 'star', check: (P) => [P.record, 30], reward: { pp: 50 } },
  { id: 'run1k', name: 'Guter Tag', desc: 'Verdiene $1.000 in einem Run.', icon: 'coins', check: (P) => [P.stats.bestRun, 1000], reward: { gems: 5 } },
  { id: 'run100k', name: 'Sehr guter Tag', desc: 'Verdiene $100K in einem Run.', icon: 'coins', check: (P) => [P.stats.bestRun, 1e5], reward: { pp: 5 } },
  { id: 'run10m', name: 'Der beste Tag', desc: 'Verdiene $10M in einem Run.', icon: 'crown', check: (P) => [P.stats.bestRun, 1e7], reward: { pp: 15 } },
  { id: 'combo25', name: 'Im Rhythmus', desc: 'Erreiche eine 25er Combo.', icon: 'chain', check: (P) => [P.stats.bestCombo, 25], reward: { gems: 5 } },
  { id: 'combo100', name: 'Combo-König', desc: 'Erreiche eine 100er Combo.', icon: 'chain', check: (P) => [P.stats.bestCombo, 100], reward: { gems: 20 } },
  { id: 'combo300', name: 'Unaufhaltsam', desc: 'Erreiche eine 300er Combo.', icon: 'fire', check: (P) => [P.stats.bestCombo, 300], reward: { pp: 10 } },
  { id: 'crit500', name: 'Kritiker', desc: 'Lande 500 kritische Treffer.', icon: 'crit', check: (P) => [P.stats.crits, 500], reward: { gems: 10 } },
  { id: 'jackpot1', name: 'JACKPOT!', desc: 'Knacke deinen ersten Jackpot.', icon: 'star', check: (P) => [P.stats.jackpots, 1], reward: { gems: 10 } },
  { id: 'jackpot25', name: 'Glückspilz', desc: 'Knacke 25 Jackpots.', icon: 'star', check: (P) => [P.stats.jackpots, 25], reward: { pp: 5 } },
  { id: 'rare1', name: 'Sammler', desc: 'Finde eine seltene Münze.', icon: 'coin', check: (P) => [Object.keys(P.collection).length, 1], reward: { gems: 5 } },
  { id: 'rare12', name: 'Numismatiker', desc: 'Finde 12 verschiedene seltene Münzen.', icon: 'coins', check: (P) => [Object.keys(P.collection).length, 12], reward: { pp: 8 } },
  { id: 'rareall', name: 'Komplette Sammlung', desc: 'Finde alle seltenen Münzen.', icon: 'crown', check: (P) => [Object.keys(P.collection).length, RARE_COINS.length], reward: { pp: 40 } },
  { id: 'bankrupt', name: 'Pleite', desc: 'Geh zum ersten Mal bankrott.', icon: 'skull', check: (P) => [P.cycle - 1, 1], reward: { gems: 10 } },
  { id: 'cycle5', name: 'Stehaufmännchen', desc: 'Starte Zyklus 5.', icon: 'heart', check: (P) => [P.cycle, 5], reward: { pp: 10 } },
  { id: 'golden', name: 'Gold gefunden', desc: 'Zerschlage ein Goldschwein.', icon: 'pig', check: (P) => [P.dex.golden || 0, 1], reward: { gems: 10 } },
  { id: 'king', name: 'Königsmord', desc: 'Zerschlage das Königsschwein.', icon: 'crown', check: (P) => [P.dex.king || 0, 1], reward: { pp: 10 } },
  { id: 'diamond', name: 'Unbezahlbar', desc: 'Zerschlage das Diamantschwein.', icon: 'gem', check: (P) => [P.dex.diamond || 0, 1], reward: { pp: 25 } },
  { id: 'dexall', name: 'Schweinedex', desc: 'Entdecke alle Schweinearten.', icon: 'eye', check: (P) => [PIG_ORDER.filter((p) => P.dex[p]).length, PIG_ORDER.length], reward: { pp: 30 } },
  { id: 'hammer3', name: 'Werkzeugkiste', desc: 'Besitze 3 Hämmer.', icon: 'hammer', check: (P) => [P.hammers.length, 3], reward: { gems: 10 } },
  { id: 'hammer8', name: 'Baumarkt-Profi', desc: 'Besitze 8 Hämmer.', icon: 'hammer', check: (P) => [P.hammers.length, 8], reward: { pp: 10 } },
  { id: 'hammerall', name: 'Hammerzeit', desc: 'Besitze alle Hämmer.', icon: 'crown', check: (P) => [P.hammers.length, HAMMERS.length], reward: { pp: 30 } },
  { id: 'gems500', name: 'Schatzkammer', desc: 'Sammle insgesamt 500 Edelsteine.', icon: 'gem', check: (P) => [P.stats.gemsTotal, 500], reward: { pp: 8 } },
  { id: 'rings5', name: 'Herr der Ringe', desc: 'Besitze 5 Ringe.', icon: 'ring', check: (P) => [P.rings.length, 5], reward: { gems: 25 } },
  { id: 'escape', name: 'Die sind weg!', desc: 'Lass 10 Schweine entkommen.', icon: 'arrow', check: (P) => [P.stats.escaped, 10], reward: { gems: 5 } },
  { id: 'tired100', name: 'Muskelkater', desc: 'Spiele 100 Runs.', icon: 'dumbbell', check: (P) => [P.stats.runs, 100], reward: { pp: 10 } },
];

// ---------------- DAILY EVENTS ----------------
// rolled for each new day; modify the final run stats
const EVENTS = [
  { id: 'sale', name: 'Schweine-Schlussverkauf', d: '+60% Spawnrate, +2 Schweine', icon: 'piggyPlus', color: '#f08ab0', a: (s) => { s.spawnRate *= 1.6; s.maxPigs += 2; } },
  { id: 'lucky', name: 'Glückstag', d: 'x3 Jackpots, x2 Raritäten', icon: 'clover', color: '#6fdc5a', a: (s) => { s.jackpotChance = Math.min(0.3, s.jackpotChance * 3); s.rareChance *= 2; } },
  { id: 'heat', name: 'Hitzewelle', d: '-25% Ausdauer, +50% Münzen', icon: 'fire', color: '#ff7a2a', a: (s) => { s.maxStamina = Math.round(s.maxStamina * 0.75); s.coinMult *= 1.5; } },
  { id: 'goldfever', name: 'Goldfieber', d: 'Goldschweine tauchen auf!', icon: 'coins', color: '#ffd040', a: (s) => { s.goldenWeight += 3; } },
  { id: 'coffee', name: 'Kaffee-Lieferung', d: 'Überall Kaffeetassen', icon: 'coffee', color: '#c08a54', a: (s) => { s.coffee += 4; } },
  { id: 'storm', name: 'Gewitterfront', d: 'Blitze alle 2 Sekunden', icon: 'bolt', color: '#5ae0f0', a: (s) => { s.storm = s.storm ? Math.min(s.storm, 2) : 2; } },
  { id: 'gems', name: 'Edelstein-Fund', d: 'x3 Edelsteinchance', icon: 'gem', color: '#ff9aa0', a: (s) => { s.gemChance = Math.min(0.8, s.gemChance * 3); } },
  { id: 'audit', name: 'Steuerprüfung', d: 'Finanzamt da! +80% Münzen', icon: 'calendar', color: '#c8b89a', a: (s) => { s.pigs = new Set(s.pigs); s.pigs.add('tax'); s.coinMult *= 1.8; } },
  { id: 'piglets', name: 'Ferkel-Invasion', d: 'Ferkel kommen in Rudeln', icon: 'pig', color: '#f9b2c4', a: (s) => { s.pigletPacks = true; s.spawnRate *= 1.3; } },
  { id: 'focus', name: 'Konzentrierter Tag', d: '+25% Krit-Chance', icon: 'crit', color: '#ffe070', a: (s) => { s.crit = Math.min(1, s.crit + 0.25); } },
  { id: 'gym', name: 'Gut geschlafen', d: '+40% Ausdauer', icon: 'heart', color: '#ff8a8a', a: (s) => { s.maxStamina = Math.round(s.maxStamina * 1.4); } },
];
const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// ---------------- BILL'S LINES ----------------
const LINES = {
  hub: [
    'Noch ein Schwein, dann hör ich auf. Versprochen.',
    'Mein Bankberater weint, wenn er mich sieht.',
    'Die Schweine schauen mich so vorwurfsvoll an...',
    'Wer braucht schon ein Sparkonto, wenn man Sparschweine hat?',
    'Ich rieche Kleingeld.',
    'Heute fühlt sich nach Jackpot an!',
    'Mama sagte, ich soll sparen. Hab ich ja. In Schweinen.',
    'Meine Hand tut weh. Egal. Rechnungen warten nicht.',
    'Ein Schwein am Tag hält den Gerichtsvollzieher fern.',
    'Kaffee. Hammer. Schweine. Das ist mein Leben jetzt.',
    'Ich sollte wirklich ein Budget machen. Morgen.',
    'Schon mal versucht, mit einem Schwein zu verhandeln?',
  ],
  dueSoon: ['Die {bill} ist morgen fällig! Hilfe!', 'Morgen ist Zahltag. Ich schwitze.', 'Nur noch ein Tag... konzentrier dich, Bill!'],
  dueNow: ['Heute ist Zahltag. Jetzt oder nie!', 'Die {bill} muss JETZT bezahlt werden!'],
  cantPay: ['Das... reicht nicht. Oh nein. Oh nein nein nein.'],
  paid: ['BEZAHLT! Was für ein Gefühl!', 'Weg damit! Nächste Rechnung, bitte.', 'Schuldenfrei! ...für etwa fünf Minuten.', 'Ha! Nimm das, Kapitalismus!'],
  record: ['Neuer Rekord! Das gibt Vermächtnispunkte!'],
  rich: ['Ich bin REICH! ...zumindest bis zur nächsten Rechnung.', 'So viel Geld! Ich kauf mir... nichts. Rechnungen.'],
  bankrupt: ['Bankrott. Schon wieder.', 'Alles weg. Aber hey... ich hab noch meine Ringe.', 'Neustart. Diesmal mach ich alles richtig!'],
  intro: [
    'Hi. Ich bin Bill.',
    'Ich habe Rechnungen. Viele Rechnungen.',
    'Aber ich habe auch Sparschweine. SEHR viele Sparschweine.',
    'Also: Hammer in die Hand und los geht\'s!',
  ],
};
