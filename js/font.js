// ============================================================
//  Bitmap pixel font (5x7 caps, lowercase with descenders)
//  Text is rendered once into cached canvases.
//  Inline colors:  "Zahl {#e04a3a}sofort{/} bitte"
// ============================================================
const Font = (() => {
  const G = {
    A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
    B: '####./#...#/#...#/####./#...#/#...#/####.',
    C: '.###./#...#/#..../#..../#..../#...#/.###.',
    D: '####./#...#/#...#/#...#/#...#/#...#/####.',
    E: '#####/#..../#..../####./#..../#..../#####',
    F: '#####/#..../#..../####./#..../#..../#....',
    G: '.###./#...#/#..../#.###/#...#/#...#/.####',
    H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    I: '###/.#./.#./.#./.#./.#./###',
    J: '..###/...#./...#./...#./#..#./#..#./.##..',
    K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
    L: '#..../#..../#..../#..../#..../#..../#####',
    M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
    N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    P: '####./#...#/#...#/####./#..../#..../#....',
    Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
    R: '####./#...#/#...#/####./#.#../#..#./#...#',
    S: '.####/#..../#..../.###./....#/....#/####.',
    T: '#####/..#../..#../..#../..#../..#../..#..',
    U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
    X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
    Z: '#####/....#/...#./..#../.#.../#..../#####',
    'Ä': '.#.#./...../.###./#...#/#####/#...#/#...#',
    'Ö': '.#.#./.###./#...#/#...#/#...#/#...#/.###.',
    'Ü': '.#.#./...../#...#/#...#/#...#/#...#/.###.',
    a: '...../...../.###./....#/.####/#...#/.####',
    b: '#..../#..../####./#...#/#...#/#...#/####.',
    c: '..../..../.###/#.../#.../#.../.###',
    d: '....#/....#/.####/#...#/#...#/#...#/.####',
    e: '...../...../.###./#...#/#####/#..../.###.',
    f: '..##/.#../####/.#../.#../.#../.#..',
    g: '...../...../.####/#...#/#...#/.####/....#/#...#/.###.',
    h: '#..../#..../####./#...#/#...#/#...#/#...#',
    i: '#/./#/#/#/#/#',
    j: '..#/.../..#/..#/..#/..#/..#/#.#/.#.',
    k: '#.../#.../#..#/#.#./##../#.#./#..#',
    l: '#./#./#./#./#./#./.#',
    m: '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
    n: '..../..../###./#..#/#..#/#..#/#..#',
    o: '..../..../.##./#..#/#..#/#..#/.##.',
    p: '..../..../###./#..#/#..#/#..#/###./#.../#...',
    q: '..../..../.###/#..#/#..#/#..#/.###/...#/...#',
    r: '..../..../#.##/##../#.../#.../#...',
    s: '..../..../.###/#.../.##./...#/###.',
    t: '.#../.#../####/.#../.#../.#../..##',
    u: '..../..../#..#/#..#/#..#/#..#/.###',
    v: '...../...../#...#/#...#/#...#/.#.#./..#..',
    w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
    x: '..../..../#..#/#..#/.##./#..#/#..#',
    y: '..../..../#..#/#..#/#..#/.###/...#/#..#/.##.',
    z: '..../..../####/...#/..#./.#../####',
    'ä': '.#.#./...../.###./....#/.####/#...#/.####',
    'ö': '.#.#/..../.##./#..#/#..#/#..#/.##.',
    'ü': '.#.#/..../#..#/#..#/#..#/#..#/.###',
    'ß': '.##./#..#/#..#/###./#..#/#..#/#.#.',
    0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
    1: '..#../.##../..#../..#../..#../..#../.###.',
    2: '.###./#...#/....#/...#./..#../.#.../#####',
    3: '####./....#/....#/.###./....#/....#/####.',
    4: '...#./..##./.#.#./#..#./#####/...#./...#.',
    5: '#####/#..../####./....#/....#/#...#/.###.',
    6: '.###./#..../#..../####./#...#/#...#/.###.',
    7: '#####/....#/...#./..#../..#../..#../..#..',
    8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
    9: '.###./#...#/#...#/.####/....#/....#/.###.',
    '.': './././././././#',
    ',': '../../../../../.#/.#/#.',
    '!': '#/#/#/#/#/./#',
    '?': '.###./#...#/....#/...#./..#../...../..#..',
    ':': '././#/././#/.',
    ';': '../../.#/../../.#/.#/#.',
    '-': '..../..../..../####/..../..../....',
    '+': '...../..#../..#../#####/..#../..#../.....',
    '*': '...../#.#.#/.###./#####/.###./#.#.#/.....',
    '/': '....#/....#/...#./..#../.#.../#..../#....',
    '%': '##..#/##..#/...#./..#../.#.../#..##/#..##',
    '$': '..#../.####/#.#../.###./..#.#/####./..#..',
    '(': '.#/#./#./#./#./#./.#',
    ')': '#./.#/.#/.#/.#/.#/#.',
    '[': '##/#./#./#./#./#./##',
    ']': '##/.#/.#/.#/.#/.#/##',
    '<': '...#/..#./.#../#.../.#../..#./...#',
    '>': '#.../.#../..#./...#/..#./.#../#...',
    '=': '..../..../####/..../####/..../....',
    '#': '.#.#./#####/.#.#./.#.#./.#.#./#####/.#.#.',
    '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
    '_': '...../...../...../...../...../...../#####',
    "'": '#/#/./././././.',
    '"': '#.#/#.#/.../.../.../.../...',
    '@': '.###./#...#/#.###/#.#.#/#.###/#..../.###.',
    '^': '..#../.###./#.#.#/..#../..#../..#../..#..',
    '→': '...../..#../...#./#####/...#./..#../.....',
    '←': '...../..#../.#.../#####/.#.../..#../.....',
    '↓': '..#../..#../..#../..#../#.#.#/.###./..#..',
    '·': './././#/././.',
    '♦': '...../..#../.###./#####/.###./..#../.....',
    '♥': '...../.#.#./#####/#####/.###./..#../.....',
    '★': '..#../..#../#####/.###./.#.#./#...#/.....',
    '×': '...../...../#...#/.#.#./..#../.#.#./#...#',
    '∞': '...../...../.#.#./#.#.#/.#.#./...../.....',
    '♪': '..##./..#.#/..#../..#../###../###../.....',
    '|': '#/#/#/#/#/#/#/#/#',
    '✓': '...../....#/...##/#.##./###../.#.../.....',
    '~': '...../...../.#..#/#.##./...../...../.....',
  };
  const ALIAS = { '„': '"', '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-', 'é': 'e', 'è': 'e', 'á': 'a', 'à': 'a', 'ó': 'o', 'ñ': 'n' };
  const ROWS = 9;
  const glyphs = {};
  for (const k in G) {
    const rows = G[k].split('/');
    const w = rows[0].length;
    const bits = [];
    for (let y = 0; y < ROWS; y++) {
      const r = rows[y] || '';
      bits.push([]);
      for (let x = 0; x < w; x++) bits[y].push(r[x] === '#');
    }
    glyphs[k] = { w, bits };
  }
  glyphs[' '] = { w: 3, bits: Array.from({ length: ROWS }, () => []) };

  const getGlyph = (ch) => glyphs[ch] || glyphs[ALIAS[ch]] || glyphs[ch.toUpperCase()] || glyphs['?'];

  // parse inline color markup into segments
  function parse(text, color) {
    const segs = [];
    let cur = color;
    const re = /\{(#[0-9a-fA-F]{3,6}|\/)\}/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ t: text.slice(last, m.index), c: cur });
      cur = m[1] === '/' ? color : m[1];
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ t: text.slice(last), c: cur });
    return segs;
  }
  const stripMarkup = (t) => t.replace(/\{(#[0-9a-fA-F]{3,6}|\/)\}/g, '');

  function measure(text, scale = 1, bold = false) {
    text = stripMarkup(String(text));
    let w = 0;
    for (const ch of text) w += getGlyph(ch).w + 1 + (bold && ch !== ' ' ? 1 : 0);
    return Math.max(0, w - 1) * scale;
  }

  const cache = new Map();
  function render(text, o) {
    const key = text + '|' + o.color + '|' + o.scale + '|' + o.shadow + '|' + o.shadowColor + '|' + (o.gradient ? o.gradient.join(',') : '') + (o.bold ? '|b' : '');
    let c = cache.get(key);
    if (c) return c;
    if (cache.size > 2500) cache.clear();
    const segs = parse(text, o.color);
    let tw = 0;
    const B = o.bold ? 1 : 0;
    for (const s of segs) for (const ch of s.t) tw += getGlyph(ch).w + 1 + (ch !== ' ' ? B : 0);
    tw = Math.max(1, tw - 1);
    const pad = o.shadow ? 1 : 0;
    const gw = tw + pad * 2 + (o.shadow === 'drop' ? 0 : 0), gh = ROWS + pad * 2;
    const grid = new Array(gw * gh).fill(null);
    let x = pad;
    for (const s of segs) {
      for (const ch of s.t) {
        const g = getGlyph(ch);
        for (let yy = 0; yy < ROWS; yy++)
          for (let xx = 0; xx < g.w; xx++)
            if (g.bits[yy][xx]) {
              const col = o.gradient && s.c === o.color ? o.gradient[Math.min(o.gradient.length - 1, yy)] : s.c;
              grid[(yy + pad) * gw + x + xx] = col;
              // bold: thicken strokes but never close 1px gaps (keeps m, w, M readable)
              if (B && !(xx + 2 < g.w && !g.bits[yy][xx + 1] && g.bits[yy][xx + 2])) grid[(yy + pad) * gw + x + xx + 1] = col;
            }
        x += g.w + 1 + (ch !== ' ' ? B : 0);
      }
    }
    const out = grid.slice();
    if (o.shadow === 'outline' || o.shadow === 'thick') {
      for (let yy = 0; yy < gh; yy++)
        for (let xx = 0; xx < gw; xx++) {
          if (grid[yy * gw + xx]) continue;
          let n = false;
          for (let dy = -1; dy <= 1 && !n; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const X = xx + dx, Y = yy + dy;
              if (X >= 0 && Y >= 0 && X < gw && Y < gh && grid[Y * gw + X]) { n = true; break; }
            }
          if (n) out[yy * gw + xx] = o.shadowColor;
        }
    } else if (o.shadow === 'drop') {
      for (let yy = gh - 1; yy >= 1; yy--)
        for (let xx = gw - 1; xx >= 1; xx--)
          if (!grid[yy * gw + xx] && grid[(yy - 1) * gw + xx - 1]) out[yy * gw + xx] = o.shadowColor;
    }
    const sc = o.scale;
    const extraDrop = o.shadow === 'thick' ? 1 : 0;
    c = makeCanvas(gw * sc, (gh + extraDrop) * sc);
    const cx = c.getContext('2d');
    if (extraDrop) {
      // second, offset outline layer gives a chunky 3D look
      cx.fillStyle = o.shadowColor;
      for (let i = 0; i < out.length; i++) if (out[i]) cx.fillRect((i % gw) * sc, (Math.floor(i / gw) + 1) * sc, sc, sc);
    }
    for (let i = 0; i < out.length; i++) {
      if (!out[i]) continue;
      cx.fillStyle = out[i];
      cx.fillRect((i % gw) * sc, Math.floor(i / gw) * sc, sc, sc);
    }
    c.pad = pad * sc;
    cache.set(key, c);
    return c;
  }

  // draw text. y = top of capital letters
  function draw(ctx, text, x, y, opts = {}) {
    text = String(text);
    const o = {
      color: opts.color || '#f3e6cf',
      scale: opts.scale || 1,
      shadow: opts.shadow === undefined ? 'drop' : opts.shadow,
      shadowColor: opts.shadowColor || '#120a08',
      gradient: opts.gradient || null,
      bold: opts.bold !== undefined ? !!opts.bold : (opts.scale || 1) >= 2,
    };
    const c = render(text, o);
    let dx = x - c.pad;
    const w = c.width - c.pad * 2;
    if (opts.align === 'center') dx = x - w / 2 - c.pad;
    else if (opts.align === 'right') dx = x - w - c.pad;
    const a = opts.alpha === undefined ? 1 : opts.alpha;
    if (a <= 0) return w;
    if (a < 1) { ctx.save(); ctx.globalAlpha *= a; }
    ctx.drawImage(c, Math.round(dx), Math.round(y - c.pad));
    if (a < 1) ctx.restore();
    return w;
  }

  // draw centered at (x,y) with an extra scale factor (for pop animations)
  function drawScaled(ctx, text, x, y, k, opts = {}) {
    const o = {
      color: opts.color || '#f3e6cf', scale: opts.scale || 1,
      shadow: opts.shadow === undefined ? 'outline' : opts.shadow,
      shadowColor: opts.shadowColor || '#120a08', gradient: opts.gradient || null, bold: opts.bold !== undefined ? !!opts.bold : (opts.scale || 1) >= 2 || !!opts.big,
    };
    const c = render(String(text), o);
    const w = c.width * k, h = c.height * k;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.drawImage(c, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
    ctx.restore();
  }

  function wrap(text, maxW, scale = 1, bold = false) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      // keep color markup across wrapped lines
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (measure(test, scale, bold) > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    // carry color state across lines
    let open = null;
    return out.map((l) => {
      const pre = open ? '{' + open + '}' : '';
      const re = /\{(#[0-9a-fA-F]{3,6}|\/)\}/g;
      let m;
      while ((m = re.exec(l))) open = m[1] === '/' ? null : m[1];
      return pre + l;
    });
  }

  function drawWrapped(ctx, text, x, y, maxW, opts = {}) {
    const sc = opts.scale || 1;
    const lh = (opts.lineHeight || 11) * sc;
    const lines = wrap(text, maxW, sc, !!opts.bold);
    lines.forEach((l, i) => draw(ctx, l, x, y + i * lh, opts));
    return lines.length * lh;
  }

  return { draw, drawScaled, measure, wrap, drawWrapped, LINE: 11 };
})();
