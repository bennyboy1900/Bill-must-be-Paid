// ============================================================
//  Art: procedural pixel-art generation (everything is drawn
//  pixel by pixel, shaded with color ramps and outlined)
// ============================================================
const Art = (() => {
  // ---------- pixel grid ----------
  class PG {
    constructor(w, h) { this.w = w | 0; this.h = h | 0; this.d = new Array(this.w * this.h).fill(null); }
    in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { x = Math.round(x); y = Math.round(y); return this.in(x, y) ? this.d[y * this.w + x] : null; }
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (c && this.in(x, y)) this.d[y * this.w + x] = c; }
    clear(x, y) { x = Math.round(x); y = Math.round(y); if (this.in(x, y)) this.d[y * this.w + x] = null; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    ell(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) this.set(x, y, typeof c === 'function' ? c(x, y, nx, ny) : c);
        }
    }
    tri(ax, ay, bx, by, cx, cy, c) {
      const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
      const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5;
          const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
          const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 >= -0.01 && w1 >= -0.01 && w2 >= -0.01) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
        }
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let i = 0; i < 500; i++) {
        this.set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    strings(x, y, rows, pal) {
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) this.set(x + i, y + j, pal[r[i]]); });
    }
    // outline: col may be a function(x,y) for selective outlines
    outline(col, diag = false) {
      const out = this.d.slice();
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          if (this.d[y * this.w + x]) continue;
          let n = this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1);
          if (!n && diag) n = this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1);
          if (n) out[y * this.w + x] = typeof col === 'function' ? col(x, y) : col;
        }
      this.d = out;
    }
    canvas() {
      const c = makeCanvas(this.w, this.h);
      const cx = c.getContext('2d');
      const id = cx.createImageData(this.w, this.h);
      const memo = {};
      for (let i = 0; i < this.d.length; i++) {
        const col = this.d[i];
        if (!col) continue;
        const rgb = memo[col] || (memo[col] = hexToRgb(col));
        id.data[i * 4] = rgb[0]; id.data[i * 4 + 1] = rgb[1]; id.data[i * 4 + 2] = rgb[2]; id.data[i * 4 + 3] = 255;
      }
      cx.putImageData(id, 0, 0);
      return c;
    }
  }

  const cache = new Map();
  const memo = (key, fn) => { let v = cache.get(key); if (!v) { v = fn(); cache.set(key, v); } return v; };

  // derived silhouettes
  function tinted(canvas, mode) {
    const c = makeCanvas(canvas.width, canvas.height);
    const x = c.getContext('2d');
    x.drawImage(canvas, 0, 0);
    const id = x.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const L = (d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15) / 255;
      if (mode === 'white') { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; }
      else if (mode === 'ice') {
        const t = Math.min(1, L * 1.25);
        d[i] = 60 + t * 175; d[i + 1] = 130 + t * 120; d[i + 2] = 190 + t * 65;
      } else if (mode === 'dark') { d[i] = 20; d[i + 1] = 12; d[i + 2] = 10; }
      else if (mode === 'gold') { const t = Math.min(1, L * 1.3); d[i] = 150 + t * 105; d[i + 1] = 90 + t * 130; d[i + 2] = 20 + t * 60; }
      else if (mode === 'gray') { const v = 40 + L * 90; d[i] = v; d[i + 1] = v * 0.95; d[i + 2] = v * 0.92; }
    }
    x.putImageData(id, 0, 0);
    return c;
  }

  // =========================================================
  //  PALETTE + ICONS (string art)
  // =========================================================
  const PAL = {
    x: '#1b1010', w: '#ffffff', l: '#d8d0c0', k: '#9a9088', K: '#5e5650',
    y: '#ffd84a', Y: '#d0901c', o: '#ff9a3a', O: '#b85a1a', r: '#e84a3a', R: '#902830',
    p: '#f49ab0', P: '#c0607e', g: '#6fdc5a', G: '#2f8a3a', c: '#8ae8ff', C: '#2a8ac0',
    b: '#5a8ae8', B: '#2a3a8a', v: '#b87ae8', V: '#6a3a9a', n: '#b07a44', N: '#6a4020',
    s: '#f2b88e', S: '#c27a5a', m: '#e8e2d8', M: '#3a2a24',
  };

  const ICONS = {
    fist: [
      '............',
      '...xxxxxxx..',
      '..xsSsSsSsx.',
      '..xsSsSsSsx.',
      '.xxssssssssx',
      '.xsSxsssssSx',
      '.xssSssssssx',
      '..xsssssssx.',
      '...xsssssx..',
      '...xrrrrrx..',
      '...xRRRRRx..',
      '...xxxxxxx..'],
    hammer: [
      '..xxxxxx....',
      '.xllkkkkx...',
      'xlkkkkkkKx..',
      'xkkkkkkKKx..',
      '.xKKKKKKx...',
      '..xxxnnx....',
      '....xnnx....',
      '....xnnx....',
      '....xnnx....',
      '....xNNx....',
      '....xNNx....',
      '....xxxx....'],
    crit: [
      '.....xx.....',
      '....xyyx....',
      '.x..xyyx..x.',
      'xyx.xyyx.xyx',
      '.xyxyyyyxyx.',
      '..xyywwyyx..',
      'xxyywwwwyyxx',
      '..xyywwyyx..',
      '.xyxyyyyxyx.',
      'xyx.xyyx.xyx',
      '.x..xYYx..x.',
      '.....xx.....'],
    skull: [
      '...xxxxxx...',
      '..xwwwwwwx..',
      '.xwwwwwwwwx.',
      '.xwxxwwxxwx.',
      '.xwxxwwxxwx.',
      '.xwwwxxwwwx.',
      '..xwwwwwwx..',
      '...xwxwxwx..',
      '...xlxlxlx..',
      '....xxxxx...',
      '............',
      '............'],
    coffee: [
      '...x..x.....',
      '....x..x....',
      '...x..x.....',
      '.xxxxxxxx...',
      '.xwwwwwwxxx.',
      '.xwNNNNwx.x.',
      '.xwwwwwwx.x.',
      '.xwwwwwwxxx.',
      '.xlwwwwlx...',
      '..xllllx....',
      'xxxxxxxxxxx.',
      '.xkkkkkkkx..'],
    dumbbell: [
      '............',
      '............',
      'xx......xx..',
      'xbx....xbx..',
      'xbxx..xxbx..',
      'xbxkxxkxbx..',
      'xbxKkkKxbx..',
      'xbxx..xxbx..',
      'xbx....xbx..',
      'xx......xx..',
      '............',
      '............'],
    speed: [
      '............',
      '.....xxxxx..',
      '...xxwwwwwx.',
      '..xwwwkwwwx.',
      '.xwwwwkwwwwx',
      '.xwwwwkkkkwx',
      '.xwwwwwwwwwx',
      '..xwwwwwwwx.',
      'xx.xxwwwxx..',
      '......xxx...',
      'xxxx........',
      '............'],
    clover: [
      '............',
      '..xx...xx...',
      '.xgGx.xgGx..',
      '.xggGxggGx..',
      '..xgggggx...',
      '.xxgGgGgxx..',
      'xggggxggggx.',
      'xgGGx.xgGGx.',
      '.xxx.x.xxx..',
      '....xGx.....',
      '.....xGx....',
      '......xx....'],
    rock: [
      '............',
      '....xxxx....',
      '...xkllkx...',
      '..xklkkkKx..',
      '.xkkkkkkKKx.',
      '.xkKkkkKKKx.',
      'xkkkkkKKKKKx',
      'xKkkkKKKKKKx',
      '.xKKKKKKKKx.',
      '..xxxxxxxx..',
      '............',
      '............'],
    bolt: [
      '......xxxx..',
      '.....xyyyx..',
      '....xyyyx...',
      '...xyyyx....',
      '..xyyyyxxx..',
      '.xyyyyyyyx..',
      '.xxxxyyyx...',
      '....xyyx....',
      '...xyyx.....',
      '..xyyx......',
      '..xyx.......',
      '..xx........'],
    coin: [
      '............',
      '...xxxxxx...',
      '..xyyyyyYx..',
      '.xyywwyyyYx.',
      '.xywyYYyyYx.',
      '.xyyyYyyyYx.',
      '.xyyyyYyyYx.',
      '.xyyYYyyyYx.',
      '.xyyyyyyYYx.',
      '..xYYYYYYx..',
      '...xxxxxx...',
      '............'],
    coins: [
      '....xxxx....',
      '...xyyyYx...',
      '...xYYYYx...',
      '..xxyyyYxx..',
      '.xyyYYYYyyx.',
      '.xYYYYYYYYx.',
      '.xyyyyyyyYx.',
      '.xYYYYYYYYx.',
      '.xyyyyyyyYx.',
      '.xYYYYYYYYx.',
      '..xxxxxxxx..',
      '............'],
    pig: [
      '............',
      '...x..xx....',
      '..xpxxppxx..',
      '.xppppppppx.',
      'xpppppppxwx.',
      'xpPpppppxxpx',
      'xppppppppPPx',
      'xpppppppppx.',
      '.xPPPPPPPx..',
      '..xpx..xpx..',
      '..xxx..xxx..',
      '............'],
    magnet: [
      '............',
      '..xxxxxxxx..',
      '.xrrrrrrrrx.',
      'xrrRxxxxrrRx',
      'xrRx....xrRx',
      'xrRx....xrRx',
      'xwwx....xwwx',
      'xllx....xllx',
      'xxxx....xxxx',
      '............',
      '............',
      '............'],
    snow: [
      '.....xx.....',
      '..x.xccx.x..',
      '.xcxxccxxcx.',
      '..xccwwccx..',
      '.xxcwccwcxx.',
      'xccwcwwcwccx',
      'xccwcwwcwccx',
      '.xxcwccwcxx.',
      '..xccwwccx..',
      '.xcxxccxxcx.',
      '..x.xccx.x..',
      '.....xx.....'],
    heart: [
      '............',
      '.xxx...xxx..',
      'xrwrx.xrrrx.',
      'xwrrrxrrrRx.',
      'xrrrrrrrrRx.',
      'xrrrrrrrRRx.',
      '.xrrrrrRRx..',
      '..xrrrRRx...',
      '...xrRRx....',
      '....xRx.....',
      '.....x......',
      '............'],
    bomb: [
      '........xy..',
      '.......x.yo.',
      '......x.....',
      '...xxxxx....',
      '..xKKKKKx...',
      '.xKkKKKKKx..',
      '.xKKKKKKKx..',
      '.xKKKKKKKx..',
      '.xKKKKKKKx..',
      '..xKKKKKx...',
      '...xxxxx....',
      '............'],
    gem: [
      '............',
      '...xxxxxx...',
      '..xwcccccx..',
      '.xwccwcccCx.',
      'xxxxxxxxxxxx',
      '.xcccccccCx.',
      '..xccccCCx..',
      '...xcccCx...',
      '....xcCx....',
      '.....xx.....',
      '............',
      '............'],
    hourglass: [
      '.xxxxxxxxx..',
      '.xnnnnnnnx..',
      '..xwwwwwx...',
      '..xwyyywx...',
      '...xwyyx....',
      '....xyx.....',
      '...xwwyx....',
      '..xwwyywx...',
      '..xwyyyyx...',
      '.xnnnnnnnx..',
      '.xxxxxxxxx..',
      '............'],
    radius: [
      '....xxxx....',
      '..xx.oo.xx..',
      '.x..o..o..x.',
      '.x.o....o.x.',
      'x.o..xx..o.x',
      'x.o.xwwx.o.x',
      'x.o.xwwx.o.x',
      'x.o..xx..o.x',
      '.x.o....o.x.',
      '.x..o..o..x.',
      '..xx.oo.xx..',
      '....xxxx....'],
    chain: [
      '............',
      '.xxxx.......',
      'xkllkx......',
      'xkx.xkx.....',
      'xkx.xxxxx...',
      '.xkxxkllkx..',
      '..xkkx.xkx..',
      '...xxx.xkx..',
      '.....xkkx...',
      '.....xxxx...',
      '............',
      '............'],
    wave: [
      '............',
      '............',
      '.....xx.....',
      '....xoox....',
      '...xo..ox...',
      '..xo.xx.ox..',
      '.xo.xyyx.ox.',
      'xo.xyyyyx.ox',
      'xxxxxxxxxxxx',
      'xNNNNNNNNNNx',
      'xxxxxxxxxxxx',
      '............'],
    bag: [
      '....xxxx....',
      '...xnNnx....',
      '....xNx.....',
      '...xnnnx....',
      '..xnnnnnx...',
      '.xnnyynnnx..',
      '.xnyNNnnnx..',
      '.xnnyynnNx..',
      '.xnnnNynNx..',
      '.xnyyNnNNx..',
      '..xNNNNNx...',
      '...xxxxx....'],
    calendar: [
      '..x.....x...',
      '.xxxxxxxxxx.',
      '.xrrrrrrrrx.',
      '.xRRRRRRRRx.',
      '.xwwwwwwwwx.',
      '.xwkwkwkwwx.',
      '.xwwwwwwwwx.',
      '.xwkwrrwkwx.',
      '.xwwwrrwwwx.',
      '.xwwwwwwwwx.',
      '.xxxxxxxxxx.',
      '............'],
    card: [
      '..xxxxxxx...',
      '.xwwwwwwwx..',
      '.xwrwwwwwx..',
      '.xwwwwwwwx..',
      '.xwwwrwwwx..',
      '.xwwrrrwwx..',
      '.xwwwrwwwx..',
      '.xwwwwwwwx..',
      '.xwwwwwrwx..',
      '.xwwwwwwwx..',
      '..xxxxxxx...',
      '............'],
    arrow: [
      '.....xx.....',
      '....xggx....',
      '...xggggx...',
      '..xggggggx..',
      '.xxxxggxxxx.',
      '....xggx....',
      '....xggx....',
      '....xGGx....',
      '....xGGx....',
      '....xxxx....',
      '............',
      '............'],
    ring: [
      '....xxx.....',
      '...xcwcx....',
      '...xcCcx....',
      '..xxxxxxx...',
      '.xyyYYYyyx..',
      'xyYx...xYyx.',
      'xyx.....xYx.',
      'xyx.....xYx.',
      'xyYx...xYYx.',
      '.xYYYYYYYx..',
      '..xxxxxxx...',
      '............'],
    star: [
      '.....xx.....',
      '.....xyx....',
      '....xyyx....',
      'xxxxxyyyxxxx',
      'xyyyyywyyyYx',
      '.xyyyywyyYx.',
      '..xyyyyyYx..',
      '..xyyxxyYx..',
      '.xyyx..xYYx.',
      '.xyx....xYx.',
      '.xx......xx.',
      '............'],
    drink: [
      '....xxxx....',
      '....xkkx....',
      '...xxxxxx...',
      '...xgggGx...',
      '...xgwgGx...',
      '...xgyyGx...',
      '...xyyyYx...',
      '...xgyyGx...',
      '...xgggGx...',
      '...xgggGx...',
      '...xkkkKx...',
      '....xxxx....'],
    question: [
      '....xxxx....',
      '...xwwwwx...',
      '..xwxxxxwx..',
      '..xxx..xwx..',
      '......xwx...',
      '.....xwx....',
      '.....xwx....',
      '.....xxx....',
      '.....xwx....',
      '.....xxx....',
      '............',
      '............'],
    lock: [
      '....xxxx....',
      '...xkxxkx...',
      '...xkx.xkx..',
      '...xkx.xkx..',
      '..xxxxxxxxx.',
      '..xyyyyyyYx.',
      '..xyYxxYyYx.',
      '..xyyxxyyYx.',
      '..xyyxxyyYx.',
      '..xYYYYYYYx.',
      '..xxxxxxxxx.',
      '............'],
    crown: [
      '............',
      '.x...x...x..',
      'xyx.xyx.xyx.',
      'xyyxyyyxyyx.',
      'xyyyyryyyyx.',
      'xyyyrwryyyx.',
      'xYyyyryyyYx.',
      'xYYYYYYYYYx.',
      'xbYrYbYrYbx.',
      'xxxxxxxxxxx.',
      '............',
      '............'],
    eye: [
      '............',
      '............',
      '...xxxxxx...',
      '..xwwwwwwx..',
      '.xwwxxxxwwx.',
      'xwwxbbwbxwwx',
      'xwwxbxxbxwwx',
      '.xwwxxxxwwx.',
      '..xwwwwwwx..',
      '...xxxxxx...',
      '............',
      '............'],
    meteor: [
      'o...........',
      '.o.o........',
      '..oo.o......',
      '.o.ooo......',
      '....oooxxx..',
      '.....xorrRx.',
      '....xorrrRRx',
      '....xrrrRRRx',
      '....xrRRRRRx',
      '.....xRRRRx.',
      '......xxxx..',
      '............'],
    piggyPlus: [
      '........xx..',
      '..x.xx.xgGx.',
      '.xpxppxxggGx',
      'xppppppxxGx.',
      'xpppppxwx...',
      'xpPpppxxpx..',
      'xppppppPPx..',
      'xppppppppx..',
      '.xPPPPPPx...',
      '..xpx.xpx...',
      '..xxx.xxx...',
      '............'],
    percent: [
      '............',
      '.xxx....xx..',
      'xgggx..xgx..',
      'xgxgx.xgx...',
      'xgggxxgx....',
      '.xxxxgx.....',
      '....xgxxxx..',
      '...xgxxgggx.',
      '..xgx.xgxgx.',
      '..xx..xgggx.',
      '.......xxx..',
      '............'],
    fire: [
      '.....x......',
      '....xox.....',
      '...xoox.x...',
      '..xooox.xo..',
      '..xoyoxxoox.',
      '.xooyyooooox',
      '.xoyyyyoyoox',
      'xooyywyyyoox',
      'xooywwwyyoox',
      '.xoyywwyyox.',
      '..xxyyyyxx..',
      '....xxxx....'],
    ice: [
      '....x..x....',
      '...xcxxcx...',
      '..xcwccwcx..',
      '.xcwccccccx.',
      'xcwcccccccCx',
      'xccccccccCCx',
      '.xcccccCCCx.',
      '..xccCCCCx..',
      '...xcCCCx...',
      '....xCCx....',
      '.....xx.....',
      '............'],
  };

  function icon(name, scale = 1) {
    return memo('icon:' + name + ':' + scale, () => {
      const rows = ICONS[name] || ICONS.question;
      const g = new PG(12, 12);
      g.strings(0, 0, rows, PAL);
      let c = g.canvas();
      if (scale > 1) {
        const s = makeCanvas(12 * scale, 12 * scale);
        s.getContext('2d').drawImage(c, 0, 0, 12 * scale, 12 * scale);
        c = s;
      }
      return c;
    });
  }
  const iconGray = (name) => memo('icongray:' + name, () => tinted(icon(name), 'gray'));
  const iconWhite = (name) => memo('iconwhite:' + name, () => tinted(icon(name), 'white'));

  // =========================================================
  //  COINS, GEMS, CASH
  // =========================================================
  const METALS = {
    copper: { b: '#d6874a', l: '#f2b27a', d: '#9a5328', o: '#4a2410' },
    silver: { b: '#c8d0da', l: '#f4f8ff', d: '#8a94a4', o: '#3a3e4a' },
    gold: { b: '#f5c542', l: '#fff0a0', d: '#c4851c', o: '#5a3408' },
    platinum: { b: '#b8f0ec', l: '#ffffff', d: '#6ab8c0', o: '#1e4a52' },
    black: { b: '#4a4a58', l: '#8a8aa0', d: '#2a2a34', o: '#0e0e14' },
  };
  const COIN_SIZES = { copper: 9, silver: 10, gold: 12, platinum: 12, black: 11 };

  function coinFace(metal, size) {
    const m = METALS[metal];
    const g = new PG(size, size);
    const r = size / 2;
    g.ell(r, r, r, r, (x, y, nx, ny) => {
      const d = nx * nx + ny * ny;
      if (d > 0.62) return (nx + ny > 0.3) ? m.d : m.b; // rim
      const l = -nx - ny;
      if (l > 0.8) return m.l;
      return l < -0.9 ? m.d : m.b;
    });
    // engraved $
    if (size >= 8) {
      const cxp = Math.floor(r) - 1, cyp = Math.floor(r) - 2;
      const S = ['.#.', '##.', '.#.', '.##', '.#.'];
      S.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') g.set(cxp + i, cyp + j, m.d); });
    }
    g.set(Math.floor(r) - 2, Math.floor(r) - 2, m.l);
    g.outline(m.o);
    return g;
  }

  // spinning frames: 0..5
  function coin(metal, frame = 0) {
    return memo('coin:' + metal + ':' + frame, () => {
      const size = COIN_SIZES[metal] || 8;
      const face = coinFace(metal, size);
      const widths = [1, 0.75, 0.45, 0.18, 0.45, 0.75];
      const k = widths[frame % 6];
      const W2 = face.w;
      const g = new PG(W2, face.h);
      const m = METALS[metal];
      const nw = Math.max(2, Math.round(W2 * k));
      const off = Math.floor((W2 - nw) / 2);
      if (k < 0.25) {
        // edge-on
        for (let y = 1; y < face.h - 1; y++) { g.set(off, y, m.d); g.set(off + 1, y, m.b); }
        g.outline(m.o);
      } else {
        for (let y = 0; y < face.h; y++)
          for (let x = 0; x < nw; x++) {
            const sx = Math.floor(((x + 0.5) / nw) * W2);
            g.set(off + x, y, face.get(sx, y));
          }
        if (frame % 6 > 3) {
          // back side shows edge thickness on the left
          for (let y = 2; y < face.h - 2; y++) if (g.get(off, y)) g.set(off, y, m.d);
        }
      }
      return g.canvas();
    });
  }

  const GEMS = {
    ruby: { b: '#e83a4a', l: '#ff9aa0', d: '#9a1a2a', o: '#3a0810' },
    emerald: { b: '#3ad06a', l: '#a0ffb8', d: '#1a8a3a', o: '#08301a' },
    sapphire: { b: '#3a7ae8', l: '#a0c8ff', d: '#1a3a9a', o: '#081438' },
    amethyst: { b: '#b05ae8', l: '#e0b0ff', d: '#6a2a9a', o: '#260a3a' },
    diamond: { b: '#c8f4ff', l: '#ffffff', d: '#7ac8e0', o: '#1a4a5a' },
  };
  function gem(kind, frame = 0) {
    return memo('gem:' + kind + ':' + frame, () => {
      const p = GEMS[kind];
      const rows = [
        '..lll..',
        '.lllbb.',
        'lbbbbbd',
        'bbbbbdd',
        '.bbbdd.',
        '..bdd..',
        '...d...',
      ];
      const g = new PG(9, 9);
      g.strings(1, 1, rows, { l: p.l, b: p.b, d: p.d });
      if (frame % 4 === 1) { g.set(2, 3, '#ffffff'); g.set(3, 2, '#ffffff'); }
      if (frame % 4 === 2) g.set(3, 3, '#ffffff');
      g.outline(p.o);
      return g.canvas();
    });
  }

  function cash() {
    return memo('cash', () => {
      const g = new PG(14, 10);
      const pal = { g: '#6fbf5a', G: '#3a8a3a', d: '#2a5a2a', w: '#c8f0a8', y: '#e8d27a' };
      g.strings(1, 1, [
        '.gggggggggg.',
        'gwggGGGGggwg',
        'gggGgyygGggg',
        'ggGgyddygGgg',
        'yyyyyyyyyyyy',
        'ggGgyddygGgg',
        'gwggGGGGggwG',
        'GGGGGGGGGGGd',
      ], pal);
      g.outline('#123018');
      return g.canvas();
    });
  }

  // =========================================================
  //  RARE COLLECTIBLE COINS
  // =========================================================
  const SYMBOLS = {
    crown: ['#.#.#', '#####', '#####'],
    skull: ['.###.', '#.#.#', '#####', '.#.#.'],
    star: ['..#..', '#####', '.###.', '#...#'],
    moon: ['.##..', '#....', '#....', '#....', '.##..'],
    clover: ['.#.#.', '#####', '.###.', '..#..'],
    anchor: ['..#..', '#####', '..#..', '#.#.#', '.###.'],
    sun: ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'],
    heart: ['##.##', '#####', '.###.', '..#..'],
    pig: ['#.#..', '####.', '#####', '.#.#.'],
    eye: ['.###.', '#.#.#', '.###.'],
    bolt: ['..##', '.##.', '####', '.##.', '##..'],
    key: ['##...', '######', '##.#.#'],
    swirl: ['####', '#..#', '#.##', '#...', '####'],
    inf: ['.#.#.', '#.#.#', '.#.#.'],
    dollar: ['.###', '#.#.', '.###', '..##', '###.'],
    one: ['.#.', '##.', '.#.', '.#.', '###'],
    cat: ['#...#', '#####', '#.#.#', '#####'],
    tree: ['..#..', '.###.', '#####', '..#..'],
    sword: ['....#', '...#.', '#.#..', '.#...', '#.#..'],
    q: ['###', '..#', '.#.', '...', '.#.'],
    flower: ['.#.#.', '#####', '.#.#.', '..#..'],
    wave: ['.....', '.#..#', '#.##.', '.....'],
    bitcoin: ['.##.', '#..#', '###.', '#..#', '.##.'],
    yin: ['.##.', '#.##', '##.#', '.##.'],
  };

  function rareCoin(def, size = 14) {
    return memo('rare:' + def.id + ':' + size, () => {
      const base = def.color;
      const m = { b: base, l: shade(base, 1.45), d: shade(base, 0.62), o: shade(base, 0.25) };
      const g = new PG(size + 2, size + 2);
      const r = size / 2;
      g.ell(r + 1, r + 1, r, r, (x, y, nx, ny) => {
        const d = nx * nx + ny * ny;
        if (d > 0.7) {
          if (def.rim === 'notch' && (Math.round(Math.atan2(ny, nx) * 6) % 2 === 0)) return m.d;
          return nx + ny > 0.2 ? m.d : m.l;
        }
        if (d > 0.55) return m.d;
        const l = -nx - ny;
        return l > 0.9 ? m.l : l < -0.8 ? shade(base, 0.82) : m.b;
      });
      const sym = SYMBOLS[def.symbol] || SYMBOLS.q;
      const sw = Math.max(...sym.map((s) => s.length)), sh = sym.length;
      const ox = Math.round(r + 1 - sw / 2), oy = Math.round(r + 1 - sh / 2);
      sym.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { g.set(ox + i, oy + j, def.symColor || m.d); } });
      g.set(Math.round(r - 2), Math.round(r - 2), '#ffffff');
      g.outline(m.o);
      return g.canvas();
    });
  }

  // =========================================================
  //  PIGS
  // =========================================================
  const PIG_SCALE = 1.35;
  const PIG_STYLES = {
    pink: { base: '#f49ab0' },
    piglet: { base: '#f9b2c4', size: 0.62 },
    dots: { base: '#f3e7d3', pattern: 'dots', acc: ['partyhat'] },
    wood: { base: '#b97a45', pattern: 'wood' },
    runner: { base: '#9cd66a', acc: ['headband', 'sneakers'] },
    sleepy: { base: '#b7a3e8', acc: ['nightcap'], eyes: 'closed' },
    porcelain: { base: '#f4f6fb', pattern: 'delft' },
    party: { base: '#ff86c8', pattern: 'confetti', acc: ['partyhat2'] },
    mafia: { base: '#4a4a58', pattern: 'pinstripe', acc: ['fedora', 'chain'], eyes: 'shades' },
    safe: { base: '#8d99a8', pattern: 'metal', acc: ['dial'], size: 1.32 },
    golden: { base: '#f6c535', pattern: 'gold', acc: ['wings'] },
    crystal: { base: '#86e0f0', pattern: 'facets' },
    bomb: { base: '#3a3a48', pattern: 'bomb', acc: ['fuse'] },
    ghost: { base: '#dfe8ff', ghost: true },
    mama: { base: '#f6a3bd', acc: ['bow'], size: 1.3, lashes: true },
    robo: { base: '#a0aebd', pattern: 'robo', acc: ['antenna'], eyes: 'visor' },
    diamond: { base: '#c4f6ff', pattern: 'diamond', size: 1.1 },
    king: { base: '#f2a2b8', acc: ['cape', 'crown'], size: 1.55 },
    zombie: { base: '#9ab87a', pattern: 'zombie', acc: ['bandage'], eyes: 'zombie' },
    disco: { base: '#d0d8e8', pattern: 'disco', acc: ['afro'] },
    ninja: { base: '#2e2a3a', pattern: 'none', acc: ['ninjaband'], eyes: 'ninja' },
    tax: { base: '#c8b89a', pattern: 'paper', acc: ['visor_tax', 'glasses'], size: 1.15 },
    pirate: { base: '#f0a8a0', pattern: 'stripes', acc: ['bandana', 'hook'], eyes: 'patch' },
    astro: { base: '#eef0f8', pattern: 'astro', acc: ['helmet'] },
    vampire: { base: '#a8a0c8', acc: ['vcape'], eyes: 'red' },
    clown: { base: '#fff4ec', pattern: 'clown', acc: ['clownhair', 'rednose'] },
    clownjr: { base: '#fff4ec', pattern: 'clown', acc: ['clownhair', 'rednose'], size: 0.66 },
    bailiff: { base: '#eea4b4', pattern: 'suit', acc: ['bowler', 'briefcase', 'glasses'], size: 1.5, legs: '#30344a', shoes: '#141418' },
  };

  function pigColors(base) {
    return {
      hl: ramp(base, 1.4), li: ramp(base, 1.15), b: base, d: ramp(base, 0.8), dd: ramp(base, 0.63), ol: ramp(base, 0.3), hoof: ramp(base, 0.45),
    };
  }

  function buildPig(id, frame) {
    const st = PIG_STYLES[id] || PIG_STYLES.pink;
    const s = (st.size || 1) * PIG_SCALE;
    const Wd = Math.round(44 * s) + 4, Hd = Math.round(40 * s) + 6;
    const cx = Math.round(Wd / 2 - 2 * s);
    const cy0 = Math.round(Hd - 13 * s - 3);
    // frames: 0 idle, 1-4 walk cycle (contact/up/contact/up)
    const bob = frame === 2 || frame === 4 ? -1 : 0;
    const cy = cy0 + bob;
    const rx = 11.5 * s, ry = 9 * s;
    const C = pigColors(st.base);
    const g = new PG(Wd, Hd);
    const P = (dx, dy) => [cx + dx * s, cy + dy * s];
    const mask = new Uint8Array(Wd * Hd);

    // ---- far legs (darker) ----
    const legW = Math.max(3, Math.round(3.6 * s)), legTop = cy0 + 3 * s, legBot = cy0 + ry + 1.6 * s;
    const lift = (which) => {
      const a = which === 'nb' || which === 'ff';
      if (frame === 1) return a ? 1 * s : 0;
      if (frame === 2) return a ? 2 * s : 0;
      if (frame === 3) return a ? 0 : 1 * s;
      if (frame === 4) return a ? 0 : 2 * s;
      return 0;
    };
    // legs swing forward/back a little while walking
    const swing = (which) => {
      if (!frame) return 0;
      const a = which === 'nb' || which === 'ff';
      const ph = [0, 1, 1, -1, -1][frame];
      return Math.round((a ? ph : -ph) * 0.6 * s);
    };
    const leg = (x0, which, col) => {
      if (st.ghost) return;
      const x = x0 + swing(which);
      const bot = Math.round(legBot - lift(which));
      if (st.legs) col = which === 'fb' || which === 'ff' ? shade(st.legs, 0.75) : st.legs; // trousers
      const hoof = st.shoes || C.hoof;
      for (let y = Math.round(legTop); y <= bot; y++)
        for (let i = 0; i < legW; i++) g.set(x + i, y, y >= bot - Math.max(0, Math.round(s) - 1) ? hoof : col);
    };
    leg(Math.round(cx - 4 * s), 'fb', C.dd);
    leg(Math.round(cx + 6.5 * s), 'ff', C.dd);

    // ---- tail ----
    if (!st.ghost) {
      const wag = [0, -1, 0, 1, 0][frame] || 0;
      const [tx, ty] = [cx - rx + 0.5, cy - 2 * s + wag];
      [[0, 0], [-1, -1], [-2, -1], [-3, 0], [-3, 1], [-2, 2], [-1, 1]].forEach(([dx, dy]) => g.set(tx + dx * s, ty + dy * s + (dx < -1 ? wag * 0.5 : 0), C.d));
      if (s > 1.2) [[-1, 0], [-2, 0]].forEach(([dx, dy]) => g.set(tx + dx * s, ty + dy * s, C.d));
    }
    // ---- cape behind (king) ----
    if (st.acc && st.acc.includes('cape')) {
      g.tri(cx - rx - 3 * s, cy + ry + 1 * s, cx + 2 * s, cy - ry + 2 * s, cx - rx * 0.4, cy + ry + 2 * s, '#b0283a');
      g.tri(cx - rx - 3 * s, cy + ry + 1 * s, cx - rx * 0.2, cy - ry + 1 * s, cx - rx - 1 * s, cy - 2 * s, '#8a1a2a');
    }
    // ---- far ear ----
    g.tri(cx + 0 * s, cy - ry + 2.5 * s, cx + 4.5 * s, cy - ry + 2 * s, cx + 4 * s, cy - ry - 2.5 * s, C.dd);

    // ---- body ----
    const shadeAt = (x, y, nx, ny) => {
      const l = -0.5 * nx - 0.8 * ny;
      const d = nx * nx + ny * ny;
      if (l > 0.62 && d < 0.75) return 'hl';
      if (l > 0.18) return 'li';
      if (ny > 0.66 || l < -0.6) return 'dd';
      if (l < -0.2) return 'd';
      return 'b';
    };
    const pattern = PATTERNS[st.pattern] || null;
    g.ell(cx, cy, rx, ry, (x, y, nx, ny) => {
      mask[y * Wd + x] = 1;
      const t = shadeAt(x, y, nx, ny);
      if (st.ghost && ny > 0.55) {
        // wavy ghost bottom
        const wv = Math.sin((x + frame * 2) * 0.9 / s) * 0.18;
        if (ny > 0.75 + wv) return null;
      }
      if (pattern) {
        const pc = pattern(x - cx, y - cy, nx, ny, t, C, s, frame);
        if (pc) return pc;
      }
      return C[t];
    });
    if (st.ghost) {
      // trailing wisp
      for (let i = 0; i < 4; i++) g.set(cx - rx + 1 + i * 2, cy + ry - 1 + (i % 2) * 1, C.d);
    }
    // specular highlight
    g.set(cx - 5 * s, cy - 5 * s, '#ffffff');
    g.set(cx - 4 * s, cy - 5.5 * s, '#ffffff');
    if (s > 1.2) g.set(cx - 6 * s, cy - 4 * s, C.hl);

    // ---- snout ----
    const snx = cx + rx + 0.3 * s, sny = cy + 1.2 * s;
    g.ell(snx - 1 * s, sny, 2.6 * s, 3.8 * s, C.d);
    g.ell(snx, sny, 2.4 * s, 3.6 * s, (x, y, nx, ny) => (nx * nx + ny * ny > 0.6 ? C.d : ny < -0.25 ? C.hl : C.li));
    g.set(snx, sny - 1.2 * s, C.dd); g.set(snx, sny - 0.4 * s, C.dd);
    g.set(snx, sny + 1.2 * s, C.dd); g.set(snx, sny + 2 * s, C.dd);
    // little mouth
    g.set(cx + rx - 3 * s, cy + 3.6 * s, C.dd);
    g.set(cx + rx - 2 * s, cy + 4 * s, C.dd);

    // ---- near legs ----
    leg(Math.round(cx - 7.5 * s), 'nb', C.d);
    leg(Math.round(cx + 3.5 * s), 'nf', C.d);

    // ---- near ear ----
    const ex = cx + 2.5 * s, ey = cy - ry + 2.6 * s;
    const flop = frame === 2 || frame === 4 ? 1 : 0;
    g.tri(ex, ey, ex + 5.5 * s, ey + 0.5 * s, ex + 6.5 * s, ey - 4.5 * s + flop * s, C.b);
    g.tri(ex + 1.5 * s, ey - 0.2 * s, ex + 4.5 * s, ey, ex + 5.2 * s, ey - 2.8 * s, C.dd);
    g.set(ex + 6 * s, ey - 3.5 * s, C.d);
    g.set(ex + 1 * s, ey - 0.5 * s, C.li);

    // ---- coin slot ----
    const slotY = Math.round(cy - ry + 1.6 * s);
    for (let i = -3; i <= 2; i++) {
      g.set(cx + i * s - 1 * s, slotY, C.ol);
      if (s >= 1.3) g.set(cx + i * s - 1 * s, slotY + 1, C.ol);
      g.set(cx + i * s - 1 * s, slotY + (s >= 1.3 ? 2 : 1), C.hl);
    }
    if (id === 'porcelain' || id === 'diamond' || id === 'king') for (let i = -4; i <= 3; i++) g.set(cx + i * s - 1 * s, slotY - 1, '#f5c542');

    // ---- accessories ----
    for (const a of st.acc || []) if (ACCS[a]) ACCS[a](g, { cx, cy, rx, ry, s, C, frame, ex, ey, legBot, legW, swing, lift, frontLeg: () => leg(Math.round(cx + 3.5 * s), 'nf', C.d) });

    // ---- outline ----
    g.outline(C.ol);

    // eye anchor points (pupils are drawn live so pigs can look around)
    const eyeW = s >= 1.25 ? 4 : 3, eyeH = s >= 1.25 ? 5 : 4;
    const eyes = [
      { x: Math.round(cx + 4 * s), y: Math.round(cy - 4.5 * s) },
      { x: Math.round(cx + 7.5 * s), y: Math.round(cy - 5 * s) },
    ];
    if (s < 1.25) { eyes[0].x = Math.round(cx + 4 * s); eyes[1].x = eyes[0].x + 4; }
    else eyes[1].x = Math.max(eyes[1].x, eyes[0].x + eyeW + 1);
    return {
      canvas: g.canvas(), w: Wd, h: Hd, ax: cx, ay: Math.round(cy0 + ry + 2.6 * s),
      cx, cy, rx, ry, eyes, eyeW, eyeH, mask, C, s, style: st,
    };
  }

  const PATTERNS = {
    suit(u, v, nx, ny, t, C, s) {
      // dark jacket over the back two thirds, pink face stays visible in front
      const edge = 2.5 * s + v * 0.35;
      if (u > edge + 3.2 * s) return null;
      if (u > edge && v > -3 * s) {
        // shirt collar + red tie peeking out of the jacket front
        const tx = edge + 1.6 * s;
        if (Math.abs(u - tx) < 0.9 * s && v > -1.5 * s) return v > 4.5 * s ? '#a01a2a' : '#d0303a';
        return t === 'dd' || t === 'd' ? '#c8c8d4' : '#f4f4f8';
      }
      if (u > edge) return null;
      const J = { hl: '#5e6684', li: '#4a516c', b: '#3a4058', d: '#2e3348', dd: '#23273a' };
      // lapel seam + buttons
      if (Math.abs(u - (edge - 0.6 * s)) < 0.5 && v > -3 * s) return J.dd;
      if (Math.abs(u - (edge - 1.8 * s)) < 0.6 && (Math.abs(v - 2 * s) < 0.6 || Math.abs(v - 5 * s) < 0.6)) return '#c8b070';
      return J[t];
    },
    stripes(u, v, nx, ny, t, C, s) {
      if (((Math.round(v / s) % 4) + 4) % 4 === 0) return t === 'dd' || t === 'd' ? '#2a2a50' : '#3a3a70';
      return null;
    },
    astro(u, v, nx, ny, t, C, s) {
      if (Math.abs(v - 2 * s) < 0.6) return '#8a94a4';
      if (u < -3 * s && u > -8 * s && v > -2 * s && v < 1 * s) return Math.round(u) % 2 ? '#e84a3a' : '#3a6ad0';
      if (Math.abs(u + 1 * s) < 0.6 && v > 2 * s) return '#8a94a4';
      return null;
    },
    clown(u, v, nx, ny, t, C, s) {
      const cell = 5 * s;
      const cxp = Math.round(u / cell), cyp = Math.round(v / cell);
      const dx = u - cxp * cell, dy = v - cyp * cell;
      if (dx * dx + dy * dy < 2.4 * s * s && (cxp + cyp) % 2 === 0) {
        const c = ['#ff4a8a', '#4ab0ff', '#ffd04a', '#6ae06a'][((cxp * 3 + cyp) % 4 + 4) % 4];
        return t === 'dd' ? shade(c, 0.7) : c;
      }
      return null;
    },
    dots(u, v, nx, ny, t, C, s) {
      const cell = 6 * s;
      const row = Math.round(v / (5 * s));
      const off = (row % 2) * cell * 0.5;
      const col = Math.round((u - off) / cell);
      const dx = u - (col * cell + off), dy = v - row * 5 * s;
      if (dx * dx + dy * dy <= 2.1 * s * s) {
        const blue = (row + col) % 2 === 0;
        const base = blue ? '#4a78c0' : '#d0505e';
        return t === 'hl' || t === 'li' ? shade(base, 1.2) : t === 'dd' ? shade(base, 0.65) : t === 'd' ? shade(base, 0.82) : base;
      }
      return null;
    },
    wood(u, v, nx, ny, t, C, s) {
      const n = vnoise(u * 0.18, v * 0.5, 7) * 3;
      const k = Math.sin(v * 0.95 / s + n);
      const knot = Math.hypot(u + 4 * s, (v - 2 * s) * 1.6);
      if (Math.abs(knot - 2.2 * s) < 0.6) return C.dd;
      if (knot < 1.2 * s) return C.d;
      if (k > 0.72) return t === 'hl' ? C.li : t === 'li' ? C.b : C.dd;
      return null;
    },
    delft(u, v, nx, ny, t, C, s) {
      const blue = t === 'dd' || t === 'd' ? '#2a4a98' : '#3a62c0';
      const fl = (fx, fy) => {
        const d = Math.hypot(u - fx * s, v - fy * s);
        const a = Math.atan2(v - fy * s, u - fx * s);
        return (Math.abs(d - 2.6 * s) < 0.55 && Math.cos(a * 5) > -0.2) || d < 0.9 * s;
      };
      if (fl(-4, 1) || fl(4, -1)) return blue;
      if (Math.abs(v - 5 * s) < 0.5) return blue;
      if (Math.abs(v - 6.3 * s) < 0.5 && Math.floor(u / (2 * s)) % 2 === 0) return blue;
      return null;
    },
    confetti(u, v, nx, ny, t, C, s) {
      const h = hash2(Math.round(u), Math.round(v), 31);
      if (h > 0.9) return ['#4ad0ff', '#ffe04a', '#7af07a', '#ffffff', '#a070ff'][Math.floor(h * 100) % 5];
      return null;
    },
    pinstripe(u, v, nx, ny, t, C, s) {
      if (Math.round(u) % 3 === 0) return t === 'dd' ? C.d : C.li;
      return null;
    },
    metal(u, v, nx, ny, t, C, s) {
      const ru = ((Math.round(u) % 7) + 7) % 7, rv = ((Math.round(v) % 6) + 6) % 6;
      if (ru === 0 && rv === 0 && nx * nx + ny * ny < 0.8) return '#eef4fa';
      if (ru === 0 && rv === 1 && nx * nx + ny * ny < 0.8) return C.dd;
      if (Math.round(v) === Math.round(-1 * s)) return C.dd;
      if (Math.round(v) === Math.round(-1 * s) + 1) return C.hl;
      return null;
    },
    gold(u, v, nx, ny, t, C, s, f) {
      const h = hash2(Math.round(u), Math.round(v), 5 + f);
      if (h > 0.965 && t !== 'dd') return '#ffffff';
      if (t === 'dd') return '#b0661a';
      if (t === 'd') return '#e09a26';
      return null;
    },
    facets(u, v, nx, ny, t, C, s) {
      const a = Math.atan2(ny, nx);
      const sec = Math.floor((a + Math.PI) / (Math.PI / 4));
      const pal = ['#a8f0ff', '#6ad0ea', '#4aa8d8', '#8ae0f8', '#c8f8ff', '#5ab8e0', '#3a90c8', '#7ad8f0'];
      const edge = Math.abs(((a + Math.PI) % (Math.PI / 4)) - Math.PI / 8) > Math.PI / 8 - 0.12;
      if (edge && nx * nx + ny * ny > 0.15) return '#e8ffff';
      let c = pal[sec % 8];
      if (t === 'dd') c = shade(c, 0.7);
      return c;
    },
    diamond(u, v, nx, ny, t, C, s, f) {
      const a = Math.atan2(ny, nx);
      const r = Math.sqrt(nx * nx + ny * ny);
      const sec = Math.floor((a + Math.PI) / (Math.PI / 3)) + (r > 0.55 ? 6 : 0);
      const pal = ['#e8fcff', '#b8f0ff', '#90dcf0', '#d0f8ff', '#a0e8fa', '#f4ffff', '#80c8e8', '#a8e4f4', '#c0f0ff', '#90d8ee', '#b0ecfc', '#e0faff'];
      if (Math.abs(r - 0.55) < 0.06) return '#ffffff';
      if (hash2(Math.round(u), Math.round(v), f + 3) > 0.96) return '#ffffff';
      let c = pal[sec % 12];
      if (t === 'dd') c = shade(c, 0.75);
      return c;
    },
    bomb(u, v, nx, ny, t, C, s) {
      const sk = ['.###.', '#.#.#', '#####', '.#.#.'];
      const x0 = Math.round(u + 4 * s), y0 = Math.round(v - 0 * s);
      if (y0 >= 0 && y0 < 4 && x0 >= 0 && x0 < 5 && sk[y0][x0] === '#') return '#e8e8f0';
      return null;
    },
    robo(u, v, nx, ny, t, C, s) {
      if (Math.round(v) === Math.round(1 * s)) return C.dd;
      if (Math.round(u) === Math.round(-3 * s) && v > 1 * s) return C.dd;
      if (u < -5 * s && u > -9 * s && v > 2 * s && v < 6 * s && (Math.round(v) % 2 === 0)) return '#3a3a4a';
      if ((Math.round(u) === Math.round(-8 * s) || Math.round(u) === Math.round(6 * s)) && Math.round(v) === Math.round(-3 * s)) return '#eef4fa';
      return null;
    },
    zombie(u, v, nx, ny, t, C, s) {
      const h = vnoise(u * 0.4, v * 0.4, 11);
      if (h > 0.72) return t === 'dd' || t === 'd' ? '#5a7a4a' : '#7a9a5a';
      if (Math.abs(u + 2 * s) < 0.5 && Math.abs(v) < 4 * s) return '#3a2a2a';
      if (Math.abs(v - 0 * s) < 0.5 && Math.abs(u + 2 * s) < 1.6 * s && Math.round(u) % 2 === 0) return '#3a2a2a';
      return null;
    },
    disco(u, v, nx, ny, t, C, s, f) {
      const gx = Math.floor((u + 20) / 2), gy = Math.floor((v + 20) / 2);
      const h = hash2(gx, gy, 77 + f);
      const pal = ['#ffffff', '#c8d8f0', '#9aa8c8', '#f0a0e0', '#a0e8ff', '#fff0a0'];
      let c = pal[Math.floor(h * 6)];
      if (t === 'dd') c = shade(c, 0.6);
      else if (t === 'd') c = shade(c, 0.8);
      if ((u + 20) % 2 < 1 || (v + 20) % 2 < 1) return shade(c, 0.85);
      return c;
    },
    paper(u, v, nx, ny, t, C, s) {
      if (Math.round(v) % 2 === 0 && Math.abs(u) < 7 * s && v > -4 * s && v < 6 * s && hash2(Math.round(u), Math.round(v), 2) > 0.3) return t === 'dd' ? '#6a6050' : '#8a8070';
      if (Math.abs(u + 5 * s) < 2 && Math.abs(v - 1 * s) < 2) return '#c0392b';
      return null;
    },
  };

  const ACCS = {
    bowler(g, o) {
      const { cx, cy, ry, s } = o;
      const by = Math.round(cy - ry + 2.5 * s);
      for (let x = Math.round(cx - 1 * s); x <= cx + 10 * s; x++) { g.set(x, by, '#141418'); g.set(x, by - 1, '#24242c'); }
      g.ell(cx + 4.5 * s, by - 2 * s, 4.2 * s, 3.6 * s, (x, y, nx, ny) => (ny > 0.4 ? null : -nx - ny > 0.7 ? '#4a4a58' : '#1e1e26'));
    },
    briefcase(g, o) {
      // leather case carried by the near front leg (the leg is drawn on top later)
      const { cx, s, legBot, legW, swing, lift } = o;
      const lx = Math.round(cx + 3.5 * s) + swing('nf') + Math.floor(legW / 2);
      const w = Math.round(11 * s), h = Math.round(7 * s);
      const x0 = lx - Math.floor(w / 2), y0 = Math.round(legBot - lift('nf') - h + 1 * s);
      const ol = '#2a160a';
      // handle loop above the case
      const hw = Math.round(4 * s), hx = lx - Math.floor(hw / 2);
      g.rect(hx, y0 - 3, hw, 1, ol); g.rect(hx, y0 - 2, 1, 2, ol); g.rect(hx + hw - 1, y0 - 2, 1, 2, ol);
      // body with rounded corners + outline
      g.rect(x0 + 1, y0, w - 2, h, ol); g.rect(x0, y0 + 1, w, h - 2, ol);
      g.rect(x0 + 1, y0 + 1, w - 2, h - 2, '#7a4522');
      g.rect(x0 + 1, y0 + 1, w - 2, 1, '#a8642e');
      g.rect(x0 + 1, y0 + h - 2, w - 2, 1, '#55301a');
      // lid seam + brass clasps
      g.rect(x0 + 1, y0 + Math.round(2 * s), w - 2, 1, '#55301a');
      g.rect(x0 + 2, y0 + Math.round(2 * s) - 1, 2, 2, '#f0c040');
      g.rect(x0 + w - 4, y0 + Math.round(2 * s) - 1, 2, 2, '#f0c040');
      o.frontLeg();
    },
    bandana(g, o) {
      const { cx, cy, ry, s, rx } = o;
      const by = Math.round(cy - ry + 3 * s);
      g.ell(cx + 3 * s, by - 1 * s, 7 * s, 3.2 * s, (x, y, nx, ny) => (ny > 0.5 ? null : hash2(x, y, 3) > 0.82 ? '#ffffff' : ny < -0.3 ? '#ff5a4a' : '#d02a2a'));
      [[-5, 0], [-6, 1], [-7, 1], [-6, 2], [-8, 2]].forEach(([dx, dy]) => g.set(cx + dx * s, by + dy * s, '#d02a2a'));
    },
    hook(g, o) {
      const { cx, cy, s, legBot } = o;
      const x = Math.round(cx + 4.5 * s), y = Math.round(legBot - 1);
      g.set(x + 3, y - 2, '#c8d0d8'); g.set(x + 4, y - 3, '#c8d0d8'); g.set(x + 4, y - 4, '#e8eef4'); g.set(x + 3, y - 5, '#c8d0d8');
    },
    helmet(g, o) {
      const { cx, cy, ry, s } = o;
      const hx = cx + 5 * s, hy = cy - 3 * s, R = 8.5 * s;
      for (let a = 0; a < TAU; a += 0.02) {
        const x = hx + Math.cos(a) * R, y = hy + Math.sin(a) * R * 0.95;
        if (!g.get(x, y)) g.set(x, y, a > 3.6 && a < 4.6 ? '#ffffff' : '#a8d8f0');
      }
      g.set(hx - 4 * s, hy - 5 * s, '#ffffff'); g.set(hx - 3 * s, hy - 6 * s, '#ffffff');
      for (let x = Math.round(hx - R); x <= hx + R; x++) g.set(x, Math.round(hy + R * 0.8), '#8a94a4');
    },
    vcape(g, o) {
      const { cx, cy, ry, rx, s } = o;
      // high collar behind head + cape over back
      g.tri(cx - 1 * s, cy - ry + 3 * s, cx + 2 * s, cy - ry - 4 * s, cx + 4 * s, cy - ry + 3 * s, '#c02a3a');
      g.tri(cx - rx * 0.9, cy + ry * 0.4, cx - 1 * s, cy - ry + 3 * s, cx + 1 * s, cy + ry * 0.2, '#1a1424');
      g.tri(cx - rx * 0.7, cy + ry * 0.2, cx - 1.5 * s, cy - ry + 4 * s, cx - 1 * s, cy + 0, '#2e2440');
    },
    clownhair(g, o) {
      const { cx, cy, ry, s } = o;
      const cols = ['#ff4a4a', '#ffb02a', '#ffe04a', '#4ad04a', '#4a9aff', '#b04aff'];
      for (let i = 0; i < 6; i++) g.ell(cx - 6 * s + i * 2.4 * s, cy - ry + 1 * s - Math.sin((i / 5) * Math.PI) * 2 * s, 1.8 * s, 1.8 * s, cols[i]);
    },
    rednose(g, o) {
      const { cx, cy, rx, s } = o;
      g.ell(cx + rx + 1 * s, cy + 1 * s, 2.3 * s, 2.3 * s, (x, y, nx, ny) => (-nx - ny > 0.6 ? '#ff9a9a' : '#e8202a'));
    },
    partyhat(g, o) { hat(g, o, ['#4a78c0', '#f2d24a'], '#d0505e'); },
    partyhat2(g, o) { hat(g, o, ['#a050e0', '#7af0c0'], '#ffe04a'); },
    headband(g, o) {
      const { cx, cy, ry, s, rx } = o;
      const y = Math.round(cy - ry + 3 * s);
      for (let x = Math.round(cx - 1 * s); x <= cx + rx - 1; x++) { g.set(x, y, '#e03a3a'); g.set(x, y + 1, '#a82020'); }
      // flowing tails
      const tx = cx - 1 * s;
      [[-1, 0], [-2, 1], [-3, 1], [-4, 2], [-2, 2], [-3, 3]].forEach(([dx, dy]) => g.set(tx + dx * s, y + dy, '#e03a3a'));
    },
    sneakers(g, o) {
      const { cx, s, legBot, frame, legW } = o;
      const shoe = (x, lifted) => {
        const yb = Math.round(legBot - (lifted ? 1.5 * s : 0));
        for (let i = -1; i < legW + 2; i++) { g.set(x + i, yb, '#ffffff'); g.set(x + i, yb + 1, '#d0d0d8'); }
        g.set(x + 1, yb, '#e03a3a'); g.set(x + 2, yb, '#e03a3a');
      };
      const lf = (a) => (a ? [0, 1, 2, 0, 0][frame] : [0, 0, 0, 1, 2][frame]) * s;
      const sw = (a) => Math.round((a ? 1 : -1) * [0, 1, 1, -1, -1][frame] * 0.6 * s);
      const shoe2 = (x, l) => {
        const yb = Math.round(legBot - l);
        for (let i = -1; i < legW + 2; i++) { g.set(x + i, yb, '#ffffff'); g.set(x + i, yb + 1, '#d0d0d8'); }
        g.set(x + 1, yb, '#e03a3a'); g.set(x + 2, yb, '#e03a3a');
      };
      shoe2(Math.round(cx - 7.5 * s) + sw(true), lf(true));
      shoe2(Math.round(cx + 3.5 * s) + sw(false), lf(false));
    },
    nightcap(g, o) {
      const { cx, cy, ry, s } = o;
      const by = cy - ry + 2.5 * s;
      g.tri(cx - 1 * s, by, cx + 9 * s, by + 1 * s, cx + 1 * s, by - 7 * s, (x, y) => (hash2(x, y, 9) > 0.9 ? '#ffe04a' : (x + y) % 5 === 0 ? '#2a4a98' : '#3b5bb0'));
      g.tri(cx + 1 * s, by - 7 * s, cx - 3 * s, by - 4 * s, cx - 1 * s, by - 2 * s, '#3b5bb0');
      g.ell(cx - 4 * s, by - 3 * s, 1.8 * s, 1.8 * s, '#ffffff');
      for (let x = Math.round(cx - 1 * s); x <= cx + 9 * s; x++) g.set(x, Math.round(by + 1 * s), '#ffffff');
    },
    fedora(g, o) {
      const { cx, cy, ry, s } = o;
      const by = Math.round(cy - ry + 2.5 * s);
      for (let x = Math.round(cx - 3 * s); x <= cx + 11 * s; x++) { g.set(x, by, '#1e1e26'); g.set(x, by - 1, '#2e2e3a'); }
      for (let y = Math.round(by - 6 * s); y < by - 1; y++)
        for (let x = Math.round(cx - 0 * s); x <= cx + 8 * s; x++) g.set(x, y, y < by - 5 * s ? '#3a3a48' : '#26262f');
      for (let x = Math.round(cx - 0 * s); x <= cx + 8 * s; x++) { g.set(x, by - 2, '#c03030'); }
      g.set(cx + 3 * s, by - 6 * s, '#1e1e26');
      g.set(cx + 4 * s, by - 6 * s, '#1e1e26');
    },
    chain(g, o) {
      const { cx, cy, s, rx } = o;
      for (let i = 0; i < 7; i++) g.set(cx + rx - 5 * s - i * 0.6 * s, cy + 3 * s + i * 0.5 * s, i % 2 ? '#ffe070' : '#d09a20');
      g.set(cx + rx - 9 * s, cy + 6.5 * s, '#ffe070');
    },
    dial(g, o) {
      const { cx, cy, s } = o;
      const dx = cx - 3 * s, dy = cy + 2 * s;
      g.ell(dx, dy, 3.2 * s, 3.2 * s, (x, y, nx, ny) => (nx * nx + ny * ny > 0.55 ? '#4a5260' : -nx - ny > 0.5 ? '#e8eef4' : '#b8c2cc'));
      g.set(dx, dy - 2 * s, '#2a2e36'); g.set(dx, dy - 1 * s, '#2a2e36');
      g.set(dx, dy, '#2a2e36');
    },
    wings(g, o) {
      const { cx, cy, ry, s, frame } = o;
      const up = frame === 2 || frame === 4 ? -3 : frame === 0 ? 0 : -1;
      const wx = cx - 3 * s, wy = cy - ry + 1 * s;
      g.tri(wx, wy + 2, wx - 7 * s, wy - 5 * s + up, wx + 3 * s, wy - 1, '#ffffff');
      g.tri(wx - 1, wy + 1, wx - 6 * s, wy - 2 * s + up, wx + 2, wy, '#d8e2f0');
    },
    fuse(g, o) {
      const { cx, cy, ry, s } = o;
      const y0 = cy - ry;
      [[0, 0], [0, -1], [1, -2], [1, -3], [2, -4], [3, -4]].forEach(([dx, dy]) => g.set(cx + 2 * s + dx * s, y0 + dy * s, '#8a6a3a'));
      g.rect(Math.round(cx + 1 * s), Math.round(y0), Math.round(3 * s), 2, '#6a6a7a');
    },
    bow(g, o) {
      const { cx, cy, ry, s } = o;
      const bx = cx + 1 * s, by = cy - ry + 0.5 * s;
      g.tri(bx, by, bx - 5 * s, by - 3.5 * s, bx - 5 * s, by + 2.5 * s, '#e0304a');
      g.tri(bx, by, bx + 5 * s, by - 3.5 * s, bx + 5 * s, by + 2.5 * s, '#e0304a');
      g.set(bx - 3 * s, by - 1 * s, '#ff8090'); g.set(bx + 3 * s, by - 1 * s, '#ff8090');
      g.ell(bx, by, 1.4 * s, 1.4 * s, '#a01a30');
    },
    antenna(g, o) {
      const { cx, cy, ry, s } = o;
      for (let i = 0; i < 6 * s; i++) g.set(cx + 1 * s, cy - ry - i + 1, '#5a6270');
      g.set(cx + 1 * s, cy - ry - 6 * s, '#3a3a4a');
    },
    crown(g, o) {
      const { cx, cy, ry, s } = o;
      const by = Math.round(cy - ry + 1.5 * s), x0 = Math.round(cx + 0 * s), x1 = Math.round(cx + 9 * s);
      for (let y = by - Math.round(3 * s); y <= by; y++) for (let x = x0; x <= x1; x++) g.set(x, y, y === by ? '#c08020' : '#f5c542');
      for (const k of [0, 0.5, 1]) {
        const px = Math.round(lerp(x0, x1, k));
        g.tri(px - 1.5 * s, by - 3 * s, px + 1.5 * s, by - 3 * s, px, by - 7 * s, '#f5c542');
        g.set(px, by - 7 * s, '#fff0a0');
      }
      g.set(lerp(x0, x1, 0.25), by - 1.5 * s, '#e03a4a');
      g.set(lerp(x0, x1, 0.75), by - 1.5 * s, '#3a7ae8');
      g.set(lerp(x0, x1, 0.5), by - 1.5 * s, '#3ad06a');
    },
    cape(g, o) {
      const { cx, cy, ry, rx, s } = o;
      // ermine collar over the body
      for (let x = Math.round(cx - rx * 0.6); x <= cx + 1 * s; x++) {
        const y = Math.round(cy - ry + 2 * s + Math.abs(x - (cx - rx * 0.3)) * 0.15);
        g.set(x, y, '#ffffff'); g.set(x, y + 1, '#e8e8f0');
        if (x % 3 === 0) g.set(x, y + 1, '#1a1a1a');
      }
    },
    bandage(g, o) {
      const { cx, cy, ry, s } = o;
      for (let i = 0; i < 7; i++) { g.set(cx - 2 * s + i * s, cy - ry + 3 * s + i * 0.3 * s, '#f0ead8'); g.set(cx - 2 * s + i * s, cy - ry + 4 * s + i * 0.3 * s, '#c8c0a8'); }
    },
    afro(g, o) {
      const { cx, cy, ry, s } = o;
      g.ell(cx + 2 * s, cy - ry - 1 * s, 7 * s, 5 * s, (x, y, nx, ny) => (hash2(x, y, 4) > 0.7 ? '#5a3020' : -nx - ny > 0.6 ? '#8a5030' : '#3a1e14'));
    },
    ninjaband(g, o) {
      const { cx, cy, ry, s, rx } = o;
      const y = Math.round(cy - 5.5 * s);
      for (let x = Math.round(cx + 0 * s); x <= cx + rx; x++) for (let k = 0; k < 4 * s; k++) g.set(x, y + k - 1 * s, '#c02838');
      [[-1, 0], [-2, -1], [-3, -1], [-4, 0], [-3, 1], [-2, 1], [-5, 1]].forEach(([dx, dy]) => g.set(cx + dx * s, y + dy * s, '#c02838'));
    },
    visor_tax(g, o) {
      const { cx, cy, ry, s } = o;
      const by = Math.round(cy - ry + 2 * s);
      for (let x = Math.round(cx); x <= cx + 12 * s; x++) g.set(x, by, '#3aa05a');
      for (let x = Math.round(cx); x <= cx + 8 * s; x++) g.set(x, by - 1, '#2a7a40');
      for (let x = Math.round(cx); x <= cx + 8 * s; x++) g.set(x, by + 1, '#f0f0f0');
    },
    glasses() { /* drawn live */ },
  };

  function hat(g, o, stripes, pom) {
    const { cx, cy, ry, s } = o;
    const bx0 = cx + 0 * s, bx1 = cx + 7 * s, by = cy - ry + 2 * s, ax = cx + 3 * s, ay = by - 10 * s;
    g.tri(bx0, by, bx1, by, ax, ay, (x, y) => (Math.floor((y - ay) / (2.2 * s)) % 2 ? stripes[0] : stripes[1]));
    g.ell(ax, ay, 1.6 * s, 1.6 * s, pom);
    g.set(ax - 0.5, ay - 0.5, shade(pom, 1.4));
    for (let x = Math.round(bx0); x <= bx1; x++) g.set(x, by, shade(stripes[0], 0.7));
  }

  const PIG_FRAMES = 5;
  function pig(id, frame = 0) {
    return memo('pig:' + id + ':' + frame, () => buildPig(id, frame));
  }
  function pigTint(id, frame, mode) {
    return memo('pigt:' + id + ':' + frame + ':' + mode, () => tinted(pig(id, frame).canvas, mode));
  }

  // the pig sprite cut into jagged chunks that fly apart when smashed
  function pigChunks(id) {
    return memo('chunks:' + id, () => {
      const spr = pig(id, 0);
      const src = spr.canvas.getContext('2d').getImageData(0, 0, spr.w, spr.h).data;
      // bounding box of opaque pixels
      let x0 = spr.w, y0 = spr.h, x1 = 0, y1 = 0;
      for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) if (src[(y * spr.w + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const cols = 3, rows = 2;
      const cw = (x1 - x0 + 1) / cols, ch = (y1 - y0 + 1) / rows;
      const rnd = mulberry32(id.length * 77 + 5);
      // jagged voronoi-ish assignment: each pixel belongs to the nearest jittered cell center
      const centers = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) centers.push([x0 + (c + 0.5) * cw + (rnd() - 0.5) * cw * 0.5, y0 + (r + 0.5) * ch + (rnd() - 0.5) * ch * 0.5]);
      const owner = new Int8Array(spr.w * spr.h).fill(-1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!src[(y * spr.w + x) * 4 + 3]) continue;
        let best = 0, bd = 1e9;
        centers.forEach(([cx, cy], i) => { const d = (x - cx) ** 2 + (y - cy) ** 2 * 1.4 + hash2(x, y, 3) * 6; if (d < bd) { bd = d; best = i; } });
        owner[y * spr.w + x] = best;
      }
      const out = [];
      centers.forEach((c, i) => {
        let bx0 = spr.w, by0 = spr.h, bx1 = -1, by1 = -1;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (owner[y * spr.w + x] === i) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
        if (bx1 < 0) return;
        const w = bx1 - bx0 + 3, h = by1 - by0 + 3;
        const cv = makeCanvas(w, h);
        const cx = cv.getContext('2d');
        const id2 = cx.createImageData(w, h);
        for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
          const o = owner[y * spr.w + x];
          if (o !== i) continue;
          const si = (y * spr.w + x) * 4, di = ((y - by0 + 1) * w + (x - bx0 + 1)) * 4;
          // edge pixels next to another chunk become dark "crack" edges
          const edge = owner[y * spr.w + x + 1] >= 0 && owner[y * spr.w + x + 1] !== i || owner[(y + 1) * spr.w + x] >= 0 && owner[(y + 1) * spr.w + x] !== i;
          id2.data[di] = edge ? src[si] * 0.45 : src[si]; id2.data[di + 1] = edge ? src[si + 1] * 0.4 : src[si + 1]; id2.data[di + 2] = edge ? src[si + 2] * 0.5 : src[si + 2]; id2.data[di + 3] = 255;
        }
        cx.putImageData(id2, 0, 0);
        out.push({ canvas: cv, ox: bx0 - 1 - spr.ax + w / 2, oy: by0 - 1 - spr.ay + h / 2 });
      });
      return out;
    });
  }

  // pixel shards palette for a pig (for breaking particles)
  function pigShardColors(id) {
    const C = pigColors((PIG_STYLES[id] || PIG_STYLES.pink).base);
    return [C.b, C.li, C.d, C.dd, C.hl];
  }

  // =========================================================
  //  HAMMERS
  // =========================================================
  // vertical sprite: head on top, handle down, fist + forearm at the bottom (pivot)
  const HAMMER_STYLES = {
    wood: { head: 'mallet', hc: '#c8955a', handle: '#9a6a3a', len: 20 },
    claw: { head: 'claw', hc: '#9aa4b0', handle: '#2e2e36', grip: '#c03030', len: 20 },
    rubber: { head: 'mallet', hc: '#2e3440', band: '#4a7ad8', handle: '#c8955a', len: 18, big: true },
    sledge: { head: 'block', hc: '#7a8490', handle: '#a8743a', len: 24, big: true },
    tenderizer: { head: 'spiky', hc: '#c0c8d0', handle: '#5a3a24', len: 17 },
    pan: { head: 'pan', hc: '#2a2a30', handle: '#2a2a30', len: 14 },
    squeaky: { head: 'toy', hc: '#e83a4a', band: '#ffd84a', handle: '#3a7ae8', len: 16 },
    golden: { head: 'block', hc: '#f5c542', handle: '#8a1a2a', grip: '#f5c542', len: 20, gem: '#e83a4a' },
    ice: { head: 'ice', hc: '#a8e8ff', handle: '#6ab0d0', len: 20 },
    mjolnir: { head: 'mjolnir', hc: '#8a929c', handle: '#6a4428', grip: '#3a2414', len: 12, big: true },
    crystal: { head: 'crystal', hc: '#c07af0', handle: '#4a2a6a', len: 20 },
    stamp: { head: 'stamp', hc: '#8a5a3a', handle: '#6a4428', len: 14 },
    baguette: { head: 'baguette', hc: '#e0a050', handle: '#e0a050', len: 6 },
    pickaxe: { head: 'pick', hc: '#8a929c', handle: '#9a6a3a', len: 20 },
    banhammer: { head: 'ban', hc: '#3a3a44', handle: '#2a2a30', grip: '#c03030', len: 20, big: true },
  };

  function buildHammer(id) {
    const st = HAMMER_STYLES[id] || HAMMER_STYLES.wood;
    const Wd = 30, Hd = 64;
    const g = new PG(Wd, Hd);
    const hx = 15;
    const pivotY = Hd - 2;
    // forearm (rolled-up shirt sleeve)
    for (let y = pivotY - 9; y <= pivotY; y++) for (let x = hx - 3; x <= hx + 2; x++) g.set(x, y, y > pivotY - 4 ? (x < hx ? '#f0ece4' : '#c8c2b8') : x < hx - 1 ? '#f8c8a0' : x > hx + 1 ? '#c27a5a' : '#f2b88e');
    for (let x = hx - 3; x <= hx + 2; x++) g.set(x, pivotY - 4, '#a8a29a');
    // fist
    const fy = pivotY - 15;
    for (let y = fy; y < fy + 7; y++) for (let x = hx - 4; x <= hx + 3; x++) g.set(x, y, x < hx - 2 ? '#f8c8a0' : x > hx + 1 ? '#c27a5a' : '#f2b88e');
    for (let y = fy + 1; y < fy + 6; y += 2) g.set(hx - 4, y, '#c27a5a');
    g.set(hx + 3, fy, null);
    // handle
    const headY = fy - st.len;
    const hcD = shade(st.handle, 0.7), hcL = shade(st.handle, 1.25);
    for (let y = headY; y < fy; y++) {
      g.set(hx - 1, y, hcL); g.set(hx, y, st.handle); g.set(hx + 1, y, hcD);
      if (st.grip && y > fy - 6) { g.set(hx - 1, y, shade(st.grip, 1.2)); g.set(hx, y, st.grip); g.set(hx + 1, y, shade(st.grip, 0.7)); }
    }
    for (let y = fy + 7; y < fy + 9; y++) { g.set(hx - 1, y, hcL); g.set(hx, y, st.handle); g.set(hx + 1, y, hcD); }
    const H = HEADS[st.head];
    const top = H(g, hx, headY, st);
    // knuckle detail over handle
    for (let x = hx - 3; x <= hx + 2; x += 2) g.set(x, fy, '#f8c8a0');
    g.outline('#1a0e0c');
    const c = g.canvas();
    return { canvas: c, pivotX: hx, pivotY, headX: hx, headY: top, len: pivotY - top };
  }

  const HEADS = {
    mallet(g, hx, hy, st) {
      const w = st.big ? 18 : 15, h = st.big ? 11 : 9;
      const x0 = hx - Math.floor(w / 2), y0 = hy - h + 2;
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) {
          const ty = (y - y0) / h;
          let c = ty < 0.25 ? shade(st.hc, 1.25) : ty > 0.75 ? shade(st.hc, 0.7) : st.hc;
          if (x === x0 || x === x0 + w - 1) c = shade(st.hc, 0.6);
          if (st.band && (x === x0 + 2 || x === x0 + w - 3)) c = st.band;
          if (!st.band && hash2(x, y, 3) > 0.85) c = shade(c, 0.88);
          g.set(x, y, c);
        }
      g.set(x0 + 2, y0 + 1, '#ffffff');
      return y0 + h / 2;
    },
    block(g, hx, hy, st) {
      const w = st.big ? 20 : 15, h = st.big ? 12 : 9;
      const x0 = hx - Math.floor(w / 2), y0 = hy - h + 2;
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) {
          let c = st.hc;
          if (y === y0) c = shade(st.hc, 1.4);
          else if (y < y0 + 3) c = shade(st.hc, 1.15);
          else if (y > y0 + h - 3) c = shade(st.hc, 0.7);
          if (x === x0 || x === x0 + w - 1) c = shade(st.hc, 0.55);
          g.set(x, y, c);
        }
      if (st.gem) { g.rect(hx - 1, y0 + 3, 3, 3, st.gem); g.set(hx - 1, y0 + 3, '#ffffff'); }
      g.set(x0 + 2, y0 + 1, '#ffffff');
      g.set(x0 + 3, y0 + 1, '#ffffff');
      return y0 + h / 2;
    },
    claw(g, hx, hy, st) {
      const y0 = hy - 6;
      for (let y = y0; y < y0 + 6; y++) for (let x = hx - 2; x <= hx + 7; x++) g.set(x, y, y === y0 ? '#e0e6ee' : y > y0 + 3 ? '#6a727e' : st.hc);
      g.rect(hx + 6, y0 - 1, 3, 8, '#b8c0ca');
      // claw (curved prongs to the left)
      [[-3, 1], [-4, 1], [-5, 0], [-6, -1], [-7, -2], [-3, 4], [-4, 4], [-5, 5], [-6, 6], [-7, 7]].forEach(([dx, dy]) => { g.set(hx + dx, y0 + dy, st.hc); g.set(hx + dx, y0 + dy + 1, '#6a727e'); });
      g.set(hx + 7, y0, '#ffffff');
      return y0 + 3;
    },
    spiky(g, hx, hy, st) {
      const y0 = hy - 8;
      for (let y = y0; y < y0 + 8; y++) for (let x = hx - 6; x <= hx + 6; x++) g.set(x, y, y < y0 + 2 ? shade(st.hc, 1.2) : y > y0 + 5 ? shade(st.hc, 0.7) : st.hc);
      for (let y = y0; y < y0 + 8; y += 2) { g.set(hx - 7, y, shade(st.hc, 0.8)); g.set(hx + 7, y, shade(st.hc, 0.8)); g.set(hx - 8, y, shade(st.hc, 0.6)); g.set(hx + 8, y, shade(st.hc, 0.6)); }
      return y0 + 4;
    },
    pan(g, hx, hy, st) {
      const cy = hy - 8;
      g.ell(hx, cy, 10, 9, (x, y, nx, ny) => {
        const d = nx * nx + ny * ny;
        if (d > 0.72) return d > 0.85 ? '#1a1a20' : '#4a4a58';
        return -nx - ny > 0.9 ? '#6a6a7a' : '#2e2e38';
      });
      g.set(hx - 4, cy - 4, '#9a9aa8'); g.set(hx - 3, cy - 5, '#9a9aa8');
      return cy;
    },
    toy(g, hx, hy, st) {
      const y0 = hy - 10;
      for (let y = y0; y < y0 + 10; y++)
        for (let x = hx - 8; x <= hx + 8; x++) {
          const ax = Math.abs(x - hx);
          let c = ax < 3 ? st.band : st.hc;
          if (ax >= 3 && (x - hx + 20) % 3 === 0) c = shade(st.hc, 0.75);
          if (y === y0) c = shade(c, 1.3); else if (y > y0 + 7) c = shade(c, 0.7);
          if (ax > 7 && (y === y0 || y === y0 + 9)) continue;
          g.set(x, y, c);
        }
      g.set(hx - 6, y0 + 1, '#ffffff');
      return y0 + 5;
    },
    ice(g, hx, hy, st) {
      const y0 = hy - 9;
      for (let y = y0; y < y0 + 9; y++) for (let x = hx - 7; x <= hx + 7; x++) {
        const k = (x - hx + y - y0);
        g.set(x, y, k % 6 === 0 ? '#ffffff' : y < y0 + 3 ? '#d8f6ff' : y > y0 + 6 ? '#5ab0d8' : st.hc);
      }
      [[-7, 9], [-5, 10], [-5, 11], [-2, 9], [-2, 10], [3, 9], [6, 9], [6, 10], [6, 11], [6, 12]].forEach(([dx, dy]) => g.set(hx + dx, y0 + dy, '#a8e8ff'));
      [[-6, -1], [-3, -2], [0, -1], [4, -2], [6, -1]].forEach(([dx, dy]) => g.set(hx + dx, y0 + dy, '#e8fcff'));
      return y0 + 4;
    },
    mjolnir(g, hx, hy, st) {
      const y0 = hy - 13;
      for (let y = y0; y < y0 + 13; y++) for (let x = hx - 10; x <= hx + 10; x++) {
        let c = st.hc;
        if (y === y0 || x === hx - 10) c = '#c8d0d8';
        else if (y > y0 + 10 || x === hx + 10) c = '#4a5260';
        if ((x === hx - 3 || x === hx + 3) && y > y0 + 2 && y < y0 + 10) c = '#5ad0ff';
        if (y === y0 + 6 && Math.abs(x - hx) < 4) c = '#5ad0ff';
        g.set(x, y, c);
      }
      // strap
      [[-2, 30], [-3, 32], [-2, 34], [0, 35], [2, 34], [3, 32], [2, 30]].forEach(([dx, dy]) => g.set(hx + dx, y0 + dy, '#3a2414'));
      return y0 + 6;
    },
    crystal(g, hx, hy, st) {
      const y0 = hy - 12;
      g.tri(hx - 9, y0 + 6, hx, y0 - 1, hx + 9, y0 + 6, (x, y) => (x < hx ? '#e0b0ff' : '#c07af0'));
      g.tri(hx - 9, y0 + 6, hx, y0 + 13, hx + 9, y0 + 6, (x, y) => (x < hx ? '#9a4ad0' : '#6a2a9a'));
      g.set(hx - 3, y0 + 3, '#ffffff'); g.set(hx - 4, y0 + 4, '#ffffff');
      return y0 + 6;
    },
    stamp(g, hx, hy, st) {
      // wooden knob + rubber stamp block
      g.ell(hx, hy - 12, 4, 3.5, (x, y, nx, ny) => (-nx - ny > 0.6 ? '#c8955a' : '#8a5a3a'));
      for (let y = hy - 9; y < hy - 1; y++) for (let x = hx - 1; x <= hx + 1; x++) g.set(x, y, '#6a4428');
      for (let y = hy - 3; y < hy + 3; y++) for (let x = hx - 9; x <= hx + 9; x++) g.set(x, y, y === hy - 3 ? '#c8955a' : '#8a5a3a');
      for (let x = hx - 9; x <= hx + 9; x++) { g.set(x, hy + 3, '#c03030'); g.set(x, hy + 4, '#8a1a1a'); }
      return hy;
    },
    baguette(g, hx, hy, st) {
      for (let y = hy - 30; y < hy; y++) for (let x = hx - 3; x <= hx + 3; x++) {
        const ax = Math.abs(x - hx);
        if (ax === 3 && (y < hy - 28 || y > hy - 3)) continue;
        let c = ax < 2 ? '#e8b060' : '#c08030';
        if ((y + 40) % 7 === 0 && ax < 3) c = '#fff0c0';
        g.set(x, y, c);
      }
      return hy - 26;
    },
    pick(g, hx, hy, st) {
      const y0 = hy - 5;
      for (let x = -11; x <= 11; x++) {
        const curve = Math.round((x * x) / 30);
        g.set(hx + x, y0 + curve, '#c8d0d8');
        g.set(hx + x, y0 + curve + 1, st.hc);
        g.set(hx + x, y0 + curve + 2, '#5a626e');
      }
      g.rect(hx - 2, y0 - 1, 5, 5, '#6a727e');
      return y0 + 1;
    },
    ban(g, hx, hy, st) {
      const y0 = hy - 12;
      for (let y = y0; y < y0 + 12; y++) for (let x = hx - 11; x <= hx + 11; x++) {
        let c = y < y0 + 2 ? '#5a5a68' : y > y0 + 9 ? '#22222a' : '#3a3a44';
        g.set(x, y, c);
      }
      // "BAN" letters
      const L = ['##..#..#..#', '###.#.#.#.#', '#.#.###.##.', '###.#.#.#.#'];
      L.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') g.set(hx - 5 + i, y0 + 4 + j, '#ff4a4a'); });
      return y0 + 6;
    },
  };

  function hammer(id) { return memo('ham:' + id, () => buildHammer(id)); }
  // rotated (nearest neighbour) frame, angle in degrees, quantized to 3°
  function hammerRot(id, deg) {
    const q = Math.round(deg / 3) * 3;
    return memo('hamr:' + id + ':' + q, () => {
      const h = hammer(id);
      const R = Math.ceil(Math.hypot(h.canvas.width, h.canvas.height));
      const c = makeCanvas(R * 2, R * 2);
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.translate(R, R);
      x.rotate((q * Math.PI) / 180);
      x.drawImage(h.canvas, -h.pivotX, -h.pivotY);
      return { canvas: c, ox: R, oy: R };
    });
  }
  // a small preview of the hammer (rotated 35°) for menus
  function hammerIcon(id) {
    return memo('hami:' + id, () => {
      const h = hammer(id);
      const c = makeCanvas(48, 48);
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.translate(30, 44);
      x.rotate(-0.6);
      x.drawImage(h.canvas, -h.pivotX, -h.pivotY + 6);
      return c;
    });
  }

  // =========================================================
  //  ITEMS & FX SPRITES
  // =========================================================
  function coffeeCup() {
    return memo('coffee', () => {
      const g = new PG(16, 16);
      g.ell(7, 9, 6, 5, (x, y, nx, ny) => (nx * nx + ny * ny > 0.55 ? (nx + ny > 0 ? '#c8c0b8' : '#ffffff') : -nx - ny > 0.4 ? '#8a5a3a' : '#5a3420'));
      g.set(5, 7, '#d8b090');
      for (let y = 7; y < 12; y++) { g.set(13, y, y === 7 || y === 11 ? '#e8e2d8' : null); }
      g.set(14, 8, '#e8e2d8'); g.set(14, 9, '#e8e2d8'); g.set(14, 10, '#c8c0b8');
      g.outline('#2a1a14');
      return g.canvas();
    });
  }
  function energyCan() {
    return memo('can', () => {
      const g = new PG(12, 16);
      for (let y = 2; y < 15; y++) for (let x = 2; x < 10; x++) {
        let c = x < 4 ? '#7aff8a' : x > 7 ? '#2a9a3a' : '#3ad04a';
        if (y === 2 || y === 14) c = '#c0c8d0';
        if (y > 6 && y < 10 && x > 2 && x < 9) c = (x + y) % 3 === 0 ? '#ffe04a' : '#1a1a1a';
        g.set(x, y, c);
      }
      g.set(5, 1, '#9aa4b0'); g.set(6, 1, '#9aa4b0');
      g.outline('#0a1a0e');
      return g.canvas();
    });
  }
  function lottery() {
    return memo('lotto', () => {
      const g = new PG(18, 12);
      for (let y = 1; y < 11; y++) for (let x = 1; x < 17; x++) {
        let c = '#fff4c8';
        if (y < 3) c = '#e83a4a';
        if (y > 4 && y < 10 && x > 2 && x < 15) c = (x * 3 + y * 7) % 5 === 0 ? '#c0b080' : '#f8e8b0';
        if ((x === 1 || x === 16) && y % 2 === 0) c = null;
        g.set(x, y, c);
      }
      [[4, 6], [7, 7], [10, 6], [13, 8]].forEach(([x, y]) => g.set(x, y, '#3a7ae8'));
      g.outline('#3a2a10');
      return g.canvas();
    });
  }
  function stone(v = 0) {
    return memo('stone:' + v, () => {
      const g = new PG(14, 13);
      const r = mulberry32(v + 3);
      g.ell(7, 6.5, 5.5 + r(), 5 + r() * 0.6, (x, y, nx, ny) => {
        const l = -nx - ny;
        const n = hash2(x, y, v);
        if (l > 0.7) return n > 0.5 ? '#c8c0b8' : '#b0a8a0';
        if (l < -0.6) return '#4a4440';
        return n > 0.75 ? '#6a625c' : '#8a827a';
      });
      g.outline('#1e1a18');
      return g.canvas();
    });
  }
  function sparkle(frame) {
    return memo('spark:' + frame, () => {
      const g = new PG(9, 9);
      const L = [1, 2, 4, 2, 1][frame % 5];
      for (let i = -L; i <= L; i++) { g.set(4 + i, 4, '#fff8c0'); g.set(4, 4 + i, '#fff8c0'); }
      g.set(4, 4, '#ffffff');
      if (L >= 2) { g.set(3, 3, '#ffe880'); g.set(5, 5, '#ffe880'); g.set(5, 3, '#ffe880'); g.set(3, 5, '#ffe880'); }
      return g.canvas();
    });
  }

  // rings & bracelets
  function ring(def) {
    return memo('ring:' + def.id, () => {
      const g = new PG(18, 16);
      const band = def.band || '#f5c542';
      g.ell(9, 10, 7, 4.6, (x, y, nx, ny) => {
        const d = nx * nx + ny * ny;
        if (d < 0.42) return null;
        return ny < 0 ? shade(band, 1.25) : nx > 0.2 ? shade(band, 0.65) : band;
      });
      if (def.gem) {
        g.ell(9, 5, 3.4, 3, (x, y, nx, ny) => (-nx - ny > 0.5 ? shade(def.gem, 1.5) : ny > 0.3 ? shade(def.gem, 0.65) : def.gem));
        g.set(8, 4, '#ffffff');
      }
      if (def.skull) g.strings(6, 2, ['.###.', '#.#.#', '#####', '.#.#.'], { '#': '#f0e8d0' });
      g.outline('#1a0e08');
      return g.canvas();
    });
  }
  function bracelet(def) {
    return memo('brace:' + def.id, () => {
      const g = new PG(26, 14);
      g.ell(13, 7, 11, 5.5, (x, y, nx, ny) => {
        const d = nx * nx + ny * ny;
        if (d < 0.5) return null;
        const bead = Math.round(Math.atan2(ny, nx) * 4) % 2 === 0;
        const c = bead ? def.band || '#c0c8d0' : def.gem || '#e83a4a';
        return ny < -0.3 ? shade(c, 1.3) : ny > 0.4 ? shade(c, 0.7) : c;
      });
      g.outline('#1a0e08');
      return g.canvas();
    });
  }

  // =========================================================
  //  BILL (our hero)
  // =========================================================
  // expr: neutral, happy, worried, sad, shocked, money, angry, tired, smug
  function bill(expr = 'neutral', talk = false, blink = false) {
    return memo('bill:' + expr + ':' + talk + ':' + blink, () => buildBill(expr, talk, blink));
  }
  function buildBill(expr, talk, blink) {
    const Wd = 60, Hd = 66;
    const g = new PG(Wd, Hd);
    const sk = { hl: '#ffd6b4', l: '#f6c09a', b: '#eaa47e', d: '#c87c5a', dd: '#9a5a44' };
    const hair = { l: '#8a5a34', b: '#5e3a22', d: '#3e2414' };
    const cx = 30, cy = 27;
    // shoulders / shirt
    g.ell(cx, 66, 26, 16, (x, y, nx, ny) => (nx < -0.55 ? '#f6f4ee' : nx > 0.45 ? '#bab4aa' : '#e4e0d8'));
    // shirt folds
    for (let y = 54; y < 66; y++) { g.set(cx - 14 + (y % 3), y, '#cfc9be'); g.set(cx + 13 - (y % 2), y, '#a8a298'); }
    // neck
    for (let y = 40; y < 52; y++) for (let x = cx - 6; x <= cx + 5; x++) g.set(x, y, x > cx + 2 ? sk.dd : sk.d);
    // collar
    g.tri(cx - 9, 48, cx, 56, cx - 4, 46, '#ffffff');
    g.tri(cx + 9, 48, cx, 56, cx + 4, 46, '#d8d4cc');
    // loose tie
    g.tri(cx - 3, 52, cx + 3, 52, cx, 56, '#c0392b');
    g.tri(cx - 2, 55, cx + 4, 55, cx + 2, 66, '#c0392b');
    g.line(cx + 2, 56, cx + 3, 65, '#8a2020');
    g.set(cx - 1, 53, '#e86050');
    // pen in pocket
    g.rect(cx + 11, 57, 1, 5, '#3a6ad0'); g.set(cx + 11, 56, '#e0e0e0');
    for (let x = cx + 9; x <= cx + 15; x++) g.set(x, 61, '#bab4aa');
    // ears
    g.ell(cx - 14, cy + 2, 2.5, 4, sk.d); g.ell(cx + 14, cy + 2, 2.5, 4, sk.dd);
    g.set(cx - 14, cy + 2, sk.dd); g.set(cx + 14, cy + 2, '#7a4434');
    // head
    g.ell(cx, cy, 13.5, 15.5, (x, y, nx, ny) => {
      const l = -0.55 * nx - 0.6 * ny;
      if (ny > 0.55 && Math.abs(nx) < 0.85) {
        // stubble zone
        const st = hash2(x, y, 12) > 0.55;
        return st ? (nx > 0.3 ? '#a8705a' : '#c08a70') : nx > 0.4 ? sk.d : sk.b;
      }
      if (l > 0.55) return sk.hl;
      if (l > 0.1) return sk.l;
      if (l < -0.45) return sk.d;
      return sk.b;
    });
    // hair (messy)
    const rnd = mulberry32(42);
    for (let x = cx - 15; x <= cx + 15; x++) {
      const k = (x - cx) / 15;
      const topY = cy - 15 - Math.round(rnd() * 3) + Math.round(Math.abs(k) * 2);
      const botY = cy - 8 - Math.round(Math.cos(k * 1.6) * 3) + (Math.abs(k) > 0.8 ? 10 : 0);
      for (let y = topY; y <= botY; y++) {
        if (Math.abs(k) > 0.92 && y < cy - 8) continue;
        const t = (y - topY) / Math.max(1, botY - topY);
        g.set(x, y, t < 0.3 && k < 0.2 ? hair.l : k > 0.5 || t > 0.8 ? hair.d : hair.b);
      }
    }
    // spikes
    [[-8, -19], [-4, -21], [0, -20], [3, -22], [7, -19], [10, -17], [-11, -16]].forEach(([dx, dy], i) => {
      g.tri(cx + dx - 2, cy - 15, cx + dx + 3, cy - 15, cx + dx, cy + dy, i % 2 ? hair.b : hair.l);
    });
    // fringe strands
    [[-6, -8], [-5, -7], [2, -8], [3, -7], [4, -6]].forEach(([dx, dy]) => g.set(cx + dx, cy + dy, hair.d));
    // eyebrows
    const browY = cy - 4;
    const brows = {
      neutral: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      happy: [[1, 0, 0, 0, 1], [1, 0, 0, 0, 1]],
      worried: [[1, 1, 0, -1, -1], [-1, -1, 0, 1, 1]],
      sad: [[1, 1, 0, -1, -1], [-1, -1, 0, 1, 1]],
      shocked: [[-1, -2, -2, -2, -1], [-1, -2, -2, -2, -1]],
      money: [[0, -1, -1, -1, 0], [0, -1, -1, -1, 0]],
      angry: [[-1, 0, 0, 1, 2], [2, 1, 0, 0, -1]],
      tired: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      smug: [[0, 0, 0, 0, 0], [-1, -2, -2, -1, 0]],
    }[expr] || [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
    for (let i = 0; i < 5; i++) {
      g.set(cx - 9 + i, browY + brows[0][i], hair.d); g.set(cx - 9 + i, browY + brows[0][i] - 1, hair.b);
      g.set(cx + 4 + i, browY + brows[1][i], hair.d); g.set(cx + 4 + i, browY + brows[1][i] - 1, hair.b);
    }
    // eyes
    const eyeY = cy - 1;
    const drawEye = (ex) => {
      if (blink || expr === 'happy') {
        if (expr === 'happy') { g.set(ex, eyeY + 1, '#2a1a14'); g.set(ex + 1, eyeY, '#2a1a14'); g.set(ex + 2, eyeY, '#2a1a14'); g.set(ex + 3, eyeY + 1, '#2a1a14'); }
        else for (let i = 0; i < 4; i++) g.set(ex + i, eyeY + 1, '#2a1a14');
        return;
      }
      if (expr === 'money') {
        g.rect(ex, eyeY - 1, 4, 5, '#ffffff');
        g.strings(ex, eyeY - 1, ['.##.', '##..', '.##.', '..##', '.##.'], { '#': '#2a9a3a' });
        return;
      }
      const h = expr === 'tired' ? 2 : expr === 'shocked' ? 4 : 3;
      g.rect(ex, eyeY + (3 - h), 4, h, '#ffffff');
      const px = expr === 'worried' || expr === 'sad' ? ex : ex + 1;
      const pupil = expr === 'shocked' ? 1 : 2;
      g.rect(px + (expr === 'shocked' ? 1 : 0), eyeY + 1 + (expr === 'shocked' ? 0 : 0), pupil, pupil, '#2a1a14');
      if (expr === 'tired') for (let i = 0; i < 4; i++) g.set(ex + i, eyeY, sk.dd);
    };
    drawEye(cx - 9); drawEye(cx + 4);
    // eye bags
    for (let i = 0; i < 4; i++) { g.set(cx - 9 + i, eyeY + 3, '#c88a7a'); g.set(cx + 4 + i, eyeY + 3, '#c88a7a'); }
    if (expr === 'tired' || expr === 'sad') { g.set(cx - 8, eyeY + 4, '#b07a6a'); g.set(cx + 5, eyeY + 4, '#b07a6a'); }
    // nose (big)
    for (let y = cy; y < cy + 7; y++) { g.set(cx - 1, y, sk.l); g.set(cx, y, sk.b); g.set(cx + 1, y, sk.d); }
    g.set(cx - 2, cy + 6, sk.d); g.set(cx + 2, cy + 6, sk.dd); g.set(cx - 1, cy + 7, sk.dd); g.set(cx, cy + 7, sk.dd); g.set(cx + 1, cy + 7, sk.dd);
    g.set(cx - 1, cy + 1, sk.hl);
    // mouth
    const my = cy + 10;
    const M = '#5a2a22', T = '#ffffff', TG = '#c84a4a';
    const mouths = {
      neutral: () => { for (let i = -3; i <= 3; i++) g.set(cx + i, my, M); },
      happy: () => { for (let i = -4; i <= 4; i++) g.set(cx + i, my + (Math.abs(i) > 2 ? -1 : 0), M); for (let i = -2; i <= 2; i++) g.set(cx + i, my + 1, M); for (let i = -2; i <= 2; i++) g.set(cx + i, my, T); },
      worried: () => { [[-4, 1], [-3, 0], [-2, 0], [-1, 1], [0, 1], [1, 0], [2, 0], [3, 1]].forEach(([dx, dy]) => g.set(cx + dx, my + dy, M)); },
      sad: () => { for (let i = -4; i <= 4; i++) g.set(cx + i, my + (Math.abs(i) > 2 ? 1 : 0), M); },
      shocked: () => { g.ell(cx, my + 1, 2.5, 3, M); g.set(cx, my + 2, TG); },
      money: () => { for (let i = -5; i <= 5; i++) g.set(cx + i, my + (Math.abs(i) > 3 ? -1 : 0), M); for (let i = -3; i <= 3; i++) { g.set(cx + i, my + 1, M); g.set(cx + i, my, T); } for (let i = -2; i <= 2; i++) g.set(cx + i, my + 2, M); },
      angry: () => { for (let i = -4; i <= 4; i++) { g.set(cx + i, my - 1, M); g.set(cx + i, my + 1, M); g.set(cx + i, my, i % 2 ? T : '#e0e0e0'); } },
      tired: () => { for (let i = -2; i <= 3; i++) g.set(cx + i, my + (i > 1 ? 1 : 0), M); },
      smug: () => { for (let i = -3; i <= 4; i++) g.set(cx + i, my - (i > 1 ? 1 : 0), M); },
    };
    (mouths[expr] || mouths.neutral)();
    if (talk) { g.rect(cx - 2, my, 5, 3, M); g.rect(cx - 1, my + 2, 3, 1, TG); g.rect(cx - 2, my, 5, 1, T); }
    // extras
    if (expr === 'worried' || expr === 'shocked') { g.strings(cx + 13, cy - 12, ['.c.', 'ccc', 'cwc', '.c.'], { c: '#7ad0ff', w: '#ffffff' }); }
    if (expr === 'sad') { for (let y = eyeY + 3; y < eyeY + 9; y++) { g.set(cx - 9, y, '#7ad0ff'); g.set(cx + 7, y, '#7ad0ff'); } }
    if (expr === 'angry') g.strings(cx + 9, cy - 16, ['r.r', '.r.', 'r.r'], { r: '#e83a3a' });
    g.outline('#24140e');
    return g.canvas();
  }

  // =========================================================
  //  TABLE BACKGROUND
  // =========================================================
  function table() {
    return memo('table', () => {
      const c = makeCanvas(W, H);
      const x = c.getContext('2d');
      const id = x.createImageData(W, H);
      const d = id.data;
      const RAMP = ['#160b07', '#22120b', '#311a10', '#422416', '#55301c', '#683c22', '#7c4a2a', '#925a32', '#a86c3c', '#bd8048'].map(hexToRgb);
      const plankH = 38;
      for (let py = 0; py < H; py++) {
        const plank = Math.floor((py + 6) / plankH);
        const inPlank = (py + 6) % plankH;
        const tint = (hash2(plank, 0, 3) - 0.5) * 0.12;
        const shiftX = hash2(plank, 1, 3) * 300;
        for (let px = 0; px < W; px++) {
          // grain along x
          const gx = (px + shiftX) / 60;
          const n1 = vnoise(gx, (inPlank + plank * 40) / 3.2, plank);
          const n2 = vnoise(gx * 4, (inPlank + plank * 40) / 1.3, plank + 9);
          let v = 0.52 + (n1 - 0.5) * 0.35 + (n2 - 0.5) * 0.12 + tint;
          // ring knots
          const kx = hash2(plank, 2, 7) * W, ky = plank * plankH + plankH / 2 - 6;
          const kd = Math.hypot((px - kx) / 3, (py - ky));
          if (kd < 9) v -= Math.max(0, Math.sin(kd * 1.6)) * 0.12 * (1 - kd / 9);
          // seams
          if (inPlank === 0) v = 0.08;
          else if (inPlank === 1) v += 0.1;
          else if (inPlank === plankH - 1) v -= 0.12;
          // lamp light (top-left) + vignette
          const lx = (px - 110) / 420, ly = (py - 30) / 300;
          const light = Math.max(0, 1 - Math.sqrt(lx * lx + ly * ly));
          const vx = (px - W / 2) / (W / 2), vy = (py - H / 2) / (H / 2);
          const vig = Math.min(1, Math.pow(Math.max(Math.abs(vx), 0) * 0.8, 3) + Math.pow(Math.abs(vy) * 0.85, 3));
          v = v * (0.55 + light * 0.75) - vig * 0.35;
          const fi = v * (RAMP.length - 1) + (BAYER4[py & 3][px & 3] - 0.5) * 0.9;
          const idx = clamp(Math.round(fi), 0, RAMP.length - 1);
          const col = RAMP[idx];
          const o = (py * W + px) * 4;
          d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
        }
      }
      x.putImageData(id, 0, 0);
      // nails on plank seams
      for (let p = 0; p < 11; p++) {
        const y = p * plankH - 6 + 4;
        for (const nx of [14, W - 16]) { pxRect(x, nx, y, 2, 2, '#2a1a12'); pxRect(x, nx, y, 1, 1, '#9a8a7a'); }
      }
      drawProps(x);
      return c;
    });
  }

  // desk (dimmed) + wooden box with felt floor => the playfield
  function arena() {
    return memo('arena', () => {
      const c = makeCanvas(W, H);
      const x = c.getContext('2d');
      x.drawImage(table(), 0, 0);
      // dim the desk so the box pops
      x.fillStyle = 'rgba(8,4,2,0.62)';
      x.fillRect(0, 0, W, H);
      // calmer side columns for the HUD
      for (const [cx0, cx1] of [[0, ARENA.x0 - 4], [ARENA.x1 + 4, W]]) {
        const g = x.createLinearGradient(cx0 < 10 ? cx1 : cx0, 0, cx0 < 10 ? cx0 : cx1, 0);
        g.addColorStop(0, 'rgba(8,4,2,0.25)'); g.addColorStop(1, 'rgba(8,4,2,0.6)');
        x.fillStyle = g; x.fillRect(cx0, 0, cx1 - cx0, H);
      }
      const A = ARENA, F = FLOOR;
      // drop shadow of the box
      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.fillRect(A.x0 + 4, A.y0 + 6, A.x1 - A.x0, A.y1 - A.y0);
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fillRect(A.x0 - 2, A.y0 + 2, A.x1 - A.x0 + 10, A.y1 - A.y0 + 8);
      const id = x.getImageData(0, 0, W, H);
      const d = id.data;
      const put = (px, py, col) => { const o = (py * W + px) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; };
      const FELT = ['#16301f', '#1b3a26', '#20442c', '#254e32', '#2b5838', '#32633f', '#3a7048'].map(hexToRgb);
      const WOOD = ['#3a1e0e', '#4e2a14', '#64361a', '#7a4422', '#90542a', '#a66634', '#ba783e', '#cc8a4a'].map(hexToRgb);
      // felt floor
      for (let py = F.y0; py < F.y1; py++)
        for (let px = F.x0; px < F.x1; px++) {
          let v = 0.55 + (vnoise(px / 3, py / 3, 21) - 0.5) * 0.18 + (hash2(px, py, 4) - 0.5) * 0.08;
          const lx = (px - 200) / 360, ly = (py - 60) / 300;
          v += Math.max(0, 1 - Math.sqrt(lx * lx + ly * ly)) * 0.35 - 0.12;
          // inner shadow from the rims (light comes from top-left)
          const dt = py - F.y0, dl = px - F.x0, dr = F.x1 - 1 - px, db = F.y1 - 1 - py;
          if (dt < 10) v -= (10 - dt) * 0.045;
          if (dl < 7) v -= (7 - dl) * 0.04;
          if (dr < 3) v -= (3 - dr) * 0.03;
          if (db < 2) v -= 0.05;
          // stitched border
          const inset = 6;
          const onLine = (dt === inset || db === inset) && dl >= inset && dr >= inset || (dl === inset || dr === inset) && dt >= inset && db >= inset;
          if (onLine && (px + py) % 4 < 2) v += 0.28;
          const fi = v * (FELT.length - 1) + (BAYER4[py & 3][px & 3] - 0.5) * 0.9;
          put(px, py, FELT[clamp(Math.round(fi), 0, FELT.length - 1)]);
        }
      // wooden rims
      const wood = (px, py, base, along) => {
        const g = vnoise(along / 26, (along === px ? py : px) / 1.6, 13) * 0.5 + vnoise(along / 6, (along === px ? py : px) / 0.8, 14) * 0.15;
        const fi = (base + (g - 0.32) * 0.45) * (WOOD.length - 1) + (BAYER4[py & 3][px & 3] - 0.5) * 0.8;
        put(px, py, WOOD[clamp(Math.round(fi), 0, WOOD.length - 1)]);
      };
      for (let py = A.y0; py < A.y1; py++)
        for (let px = A.x0; px < A.x1; px++) {
          if (px >= F.x0 && px < F.x1 && py >= F.y0 && py < F.y1) continue;
          const frontFace = py >= A.y1 - A.front;
          if (frontFace) {
            // front face of the box: darker, vertical shading
            const k = (py - (A.y1 - A.front)) / A.front;
            wood(px, py, 0.5 - k * 0.25, px);
          } else {
            const top = py < F.y0, bottom = py >= F.y1;
            const horiz = top || bottom;
            let base = 0.78;
            if (top) base = 0.84 - (py - A.y0) * 0.01;
            else if (bottom) base = 0.9;
            else if (px < F.x0) base = 0.82; else base = 0.66;
            wood(px, py, base, horiz ? px : py);
          }
        }
      x.putImageData(id, 0, 0);
      // edges & highlights
      const ln = (x0, y0, w, h, col) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };
      ln(A.x0, A.y0, A.x1 - A.x0, 1, '#e0a060');
      ln(A.x0, A.y0, 1, A.y1 - A.y0 - A.front, '#d89858');
      ln(A.x0 - 1, A.y0 - 1, A.x1 - A.x0 + 2, 1, '#1a0c06');
      ln(A.x0 - 1, A.y0, 1, A.y1 - A.y0, '#1a0c06');
      ln(A.x1, A.y0, 1, A.y1 - A.y0, '#1a0c06');
      ln(A.x0 - 1, A.y1, A.x1 - A.x0 + 2, 1, '#1a0c06');
      ln(A.x0, A.y1 - A.front, A.x1 - A.x0, 1, '#e8b070');
      ln(A.x0, A.y1 - A.front + 1, A.x1 - A.x0, 1, '#5a2e14');
      // inner lip
      ln(F.x0 - 1, F.y0 - 1, F.x1 - F.x0 + 2, 1, '#2a140a');
      ln(F.x0 - 1, F.y0 - 1, 1, F.y1 - F.y0 + 2, '#2a140a');
      ln(F.x1, F.y0 - 1, 1, F.y1 - F.y0 + 2, '#c88a4a');
      ln(F.x0 - 1, F.y1, F.x1 - F.x0 + 2, 1, '#d89a58');
      // plank joints on the front face
      for (let px = A.x0 + 70; px < A.x1 - 20; px += 92) ln(px, A.y1 - A.front + 2, 1, A.front - 3, '#3a1e0e');
      // brass corner plates with rivets
      const corner = (cx, cy, fx, fy) => {
        for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
          if (i > 4 && j > 4) continue;
          const px = cx + i * fx, py = cy + j * fy;
          x.fillStyle = (i === 0 || j === 0) ? '#fff0a0' : (i + j) % 7 === 0 ? '#c08a28' : '#e0b040';
          x.fillRect(px, py, 1, 1);
        }
        for (const [ri, rj] of [[2, 2], [9, 2], [2, 9]]) { x.fillStyle = '#7a5418'; x.fillRect(cx + ri * fx - (fx < 0 ? 1 : 0), cy + rj * fy - (fy < 0 ? 1 : 0), 2, 2); x.fillStyle = '#fff4c0'; x.fillRect(cx + ri * fx, cy + rj * fy, 1, 1); }
      };
      corner(A.x0, A.y0, 1, 1); corner(A.x1 - 1, A.y0, -1, 1);
      corner(A.x0, A.y1 - 1, 1, -1); corner(A.x1 - 1, A.y1 - 1, -1, -1);
      // brass name plate on the front
      const pw = 64, px0 = Math.round((A.x0 + A.x1) / 2 - pw / 2), py0 = A.y1 - A.front + 1;
      ln(px0, py0, pw, A.front - 2, '#c89a30'); ln(px0, py0, pw, 1, '#fff0a0'); ln(px0, py0 + A.front - 3, pw, 1, '#7a5418');
      Font.draw(x, 'SPARKASSE', (A.x0 + A.x1) / 2, py0, { align: 'center', color: '#5a3a10', shadow: null });
      return c;
    });
  }

  function drawProps(x) {
    const shadow = (px, py, w, h) => { x.fillStyle = 'rgba(10,4,2,0.45)'; x.fillRect(px + 3, py + 3, w, h); };
    // --- stacked papers / overdue notices bottom-left
    const paper = (px, py, w, h, stamp, lines = 6) => {
      shadow(px, py, w, h);
      pxRect(x, px, py, w, h, '#e8dcc0');
      pxRect(x, px, py, w, 1, '#fff4dc');
      pxRect(x, px + w - 1, py, 1, h, '#b8aa90');
      pxRect(x, px, py + h - 1, w, 1, '#b8aa90');
      for (let i = 0; i < lines; i++) pxRect(x, px + 4, py + 8 + i * 5, Math.max(4, w - 10 - (i * 7) % 13), 1, '#a89c84');
      if (stamp) {
        x.save();
        Font.draw(x, stamp, px + 4, py + h - 14, { color: '#c0392b', shadow: null });
        pxRect(x, px + 2, py + h - 16, Font.measure(stamp) + 5, 1, '#c0392b');
        pxRect(x, px + 2, py + h - 4, Font.measure(stamp) + 5, 1, '#c0392b');
        x.restore();
      }
    };
    paper(-6, 262, 66, 64, 'MAHNUNG');
    paper(30, 296, 72, 70, 'ÜBERFÄLLIG', 7);
    paper(-10, 210, 44, 46, null, 5);
    // envelope
    shadow(112, 330, 54, 34);
    pxRect(x, 112, 330, 54, 34, '#d8c8a0');
    pxLine(x, 112, 330, 139, 348, '#a89870'); pxLine(x, 165, 330, 139, 348, '#a89870');
    pxRect(x, 150, 334, 10, 8, '#c0392b'); pxRect(x, 152, 336, 6, 4, '#e86050');

    // --- calculator left
    shadow(4, 120, 34, 50);
    pxRect(x, 4, 120, 34, 50, '#3a3a44'); pxRect(x, 4, 120, 34, 1, '#5a5a68'); pxRect(x, 4, 169, 34, 1, '#22222a');
    pxRect(x, 8, 124, 26, 9, '#8ab07a'); pxRect(x, 8, 124, 26, 1, '#5a7a4a');
    Font.draw(x, '-1337', 32, 125, { color: '#2a3a20', align: 'right', shadow: null });
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
      const col = q === 3 ? '#e08a3a' : r === 0 ? '#9a9aa8' : '#d8d8e0';
      pxRect(x, 8 + q * 7, 137 + r * 8, 5, 5, col); pxRect(x, 8 + q * 7, 141 + r * 8, 5, 1, shade(col, 0.6));
    }

    // --- coin stacks top-left
    const stack = (px, py, n, metal) => {
      const m = METALS[metal];
      x.fillStyle = 'rgba(10,4,2,0.4)'; x.fillRect(px + 2, py + 2, 12, 5);
      for (let i = 0; i < n; i++) {
        const y = py - i * 2;
        pxRect(x, px, y, 12, 3, m.d); pxRect(x, px + 1, y, 10, 1, m.l); pxRect(x, px, y + 2, 12, 1, m.o);
      }
      pxRect(x, px + 1, py - n * 2 + 1, 10, 2, m.b);
    };
    stack(56, 78, 8, 'gold'); stack(70, 82, 5, 'silver'); stack(48, 88, 3, 'copper'); stack(82, 74, 11, 'silver');

    // --- desk lamp base top-left
    x.fillStyle = 'rgba(10,4,2,0.45)'; x.beginPath(); x.ellipse(18, 18, 22, 12, 0, 0, TAU); x.fill();
    pxEllipse(x, 14, 14, 18, 10, '#2a3a2a', true); pxEllipse(x, 14, 12, 15, 7, '#3a5a3a', true); pxEllipse(x, 10, 10, 6, 3, '#5a8a5a', true);
    pxLine(x, 14, 10, 30, -4, '#2a3a2a', 3);

    // --- radio top-right
    const ry = 104;
    shadow(560, ry, 74, 44);
    pxRect(x, 560, ry, 74, 44, '#6a3a24'); pxRect(x, 562, ry + 2, 70, 40, '#8a4e30'); pxRect(x, 562, ry + 2, 70, 1, '#a8643c');
    for (let r = 0; r < 6; r++) for (let q = 0; q < 10; q++) pxRect(x, 566 + q * 4, ry + 6 + r * 5, 2, 2, '#3a2014');
    pxRect(x, 608, ry + 6, 20, 8, '#e8d8a0'); pxRect(x, 616, ry + 6, 1, 8, '#c0392b');
    for (const kx of [610, 622]) { pxEllipse(x, kx, ry + 28, 4, 4, '#2a1a12', true); pxEllipse(x, kx - 1, ry + 27, 2, 2, '#9a8a7a', true); }
    pxLine(x, 566, ry, 540, ry - 22, '#9aa4b0', 1);

    // --- coffee mug bottom-right (top-down)
    x.fillStyle = 'rgba(10,4,2,0.45)'; x.beginPath(); x.ellipse(612, 330, 19, 17, 0, 0, TAU); x.fill();
    pxEllipse(x, 608, 326, 17, 16, '#e8e2d8', true);
    pxEllipse(x, 608, 326, 13, 12, '#b8b0a4', true);
    pxEllipse(x, 608, 327, 12, 11, '#3a2014', true);
    pxEllipse(x, 604, 323, 4, 3, '#5a3420', true);
    pxRect(x, 624, 320, 8, 12, '#e8e2d8'); pxRect(x, 626, 323, 4, 6, '#2a1a10');
    // coffee stain rings
    pxEllipse(x, 566, 300, 13, 11, '#4a2614');
    pxEllipse(x, 572, 278, 12, 10, '#4a2614');

    // --- notepad right side
    shadow(556, 200, 60, 72);
    pxRect(x, 556, 200, 60, 72, '#f4e8b0'); pxRect(x, 556, 200, 60, 6, '#e0c860');
    for (let i = 0; i < 9; i++) pxRect(x, 558, 212 + i * 7, 56, 1, '#c8d0e8');
    pxRect(x, 566, 206, 1, 66, '#e8a0a0');
    Font.draw(x, 'TODO:', 570, 210, { color: '#3a3a80', shadow: null });
    Font.draw(x, 'Miete!', 570, 224, { color: '#3a3a80', shadow: null });
    Font.draw(x, 'Strom', 570, 238, { color: '#3a3a80', shadow: null });
    pxRect(x, 569, 242, 26, 1, '#c0392b');
    Font.draw(x, 'Hilfe', 570, 252, { color: '#3a3a80', shadow: null });

    // --- pencil
    pxLine(x, 520, 300, 546, 270, '#e8b830', 3);
    pxLine(x, 546, 270, 550, 266, '#f0d8b0', 2); pxLine(x, 550, 266, 552, 264, '#2a2a2a', 1);
    pxLine(x, 520, 300, 517, 303, '#e88a9a', 3);

    // --- lottery tickets bottom center
    shadow(300, 342, 38, 22);
    pxRect(x, 300, 342, 38, 22, '#fff4c8'); pxRect(x, 300, 342, 38, 4, '#e83a4a');
    Font.draw(x, 'LOTTO', 304, 350, { color: '#c0392b', shadow: null });
    // sticky note
    shadow(8, 60, 30, 26);
    pxRect(x, 8, 60, 30, 26, '#ffe86a'); pxRect(x, 8, 60, 30, 3, '#f0d040');
    Font.draw(x, 'BILL', 12, 66, { color: '#3a3a80', shadow: null });
    Font.draw(x, 'zahl', 12, 75, { color: '#c0392b', shadow: null });
  }

  return {
    PG, icon, iconGray, iconWhite, ICONS, coin, gem, cash, rareCoin, pig, pigTint, pigShardColors, pigChunks, PIG_STYLES, PIG_FRAMES, PIG_SCALE,
    hammer, hammerRot, hammerIcon, HAMMER_STYLES, coffeeCup, energyCan, lottery, stone, sparkle, ring, bracelet, bill, table, arena,
    METALS, GEMS, tinted,
    tint: (key, canvas, mode) => memo('tint:' + key + ':' + mode, () => tinted(canvas, mode)),
  };
})();
