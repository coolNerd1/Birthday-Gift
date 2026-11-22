/* =========================================================
   flower.js: Scene 2, "The Flower Comes to Life"

   The bouquet from the first date, painted piece by piece:
   purple statice, purple asters, pale carnations with pink edges,
   a few green buds, and the black wrapping paper.

   The story of the animation:
     1. one carnation appears somewhere on the empty page
     2. more pieces appear, scattered, drifting
     3. each piece glides to its place and the bouquet gathers
     4. the black paper folds in around it
     5. the bouquet opens up (blooms), then sways very slightly

   How it stays light on phones: every piece is painted ONCE onto a
   small hidden canvas (a "sprite"), then each frame only moves those
   little pictures around. Nothing is re-painted from scratch.
   ========================================================= */
(function () {
  'use strict';

  const Story = window.Story;
  const C = Story.content.flower;

  let canvas, ctx, foot;
  let W = 0, H = 0, DPR = 1, U = 100, CX = 0, CY = 0;   // U = one "bouquet unit" in pixels
  let pieces = [], sprites = null;
  let raf = 0, t0 = 0, running = false, captionShown = false;

  /* ---------- Timeline (milliseconds) ---------- */
  const T = {
    first: 300,          // the first carnation appears
    scatterFrom: 1300,   // the rest start appearing...
    scatterTo: 4300,     // ...until here
    gather: 4700,        // pieces start travelling to their places
    wrap: 7400,          // black paper slides in
    bloom: 9000,         // the bouquet opens
    bloomLen: 1900,
    caption: 10300
  };

  /* ---------- Helpers ---------- */

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  function makeSprite(px, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.translate(px / 2, px / 2);
    draw(g, px / 2 * 0.86);            // leave a margin for soft shadows
    return c;
  }

  /* =========================================================
     Painting the pieces (each runs once)
     ========================================================= */

  // Carnation seen from above: rings of ruffled petals, creamy white with pink edges
  function paintCarnation(g, R, rnd, tone) {
    const tones = {
      white: { light: '#fffdf7', shade: '#f3dfd0', edge: '#e0778f' },
      cream: { light: '#fff6ea', shade: '#f1d6c4', edge: '#dd728b' },
      blush: { light: '#fee9df', shade: '#f0c4b8', edge: '#d76a84' }
    };
    const c = tones[tone] || tones.cream;
    const rings = 5;
    for (let k = 0; k < rings; k++) {
      const rk = R * (1 - k * 0.185);
      const lobes = 10 - k;
      const ph = rnd() * 6.283, ph2 = rnd() * 6.283, amp = 0.1 + rnd() * 0.04;
      g.beginPath();
      for (let i = 0; i <= 90; i++) {
        const th = i / 90 * 6.283;
        const r = rk * (1 + amp * Math.sin(lobes * th + ph)                       // big soft ruffles
                         + amp * 0.38 * Math.sin((2 * lobes + 1) * th + ph2)      // small frills on the edge
                         + amp * 0.5 * Math.sin(3 * th + ph * 2.3));               // keeps it from looking too regular
        const x = Math.cos(th) * r, y = Math.sin(th) * r;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.closePath();
      const grad = g.createRadialGradient(0, 0, rk * 0.35, 0, 0, rk * 1.05);
      grad.addColorStop(0, c.shade);
      grad.addColorStop(0.55, c.light);
      grad.addColorStop(1, c.light);
      // the outer ring casts the flower's shadow on whatever is beneath it
      g.shadowColor = k === 0 ? 'rgba(24, 14, 60, 0.5)' : 'rgba(150, 70, 80, 0.3)';
      g.shadowBlur = R * (k === 0 ? 0.11 : 0.07);
      g.shadowOffsetY = R * (k === 0 ? 0.03 : 0.015);
      g.fillStyle = grad;
      g.fill();
      g.shadowColor = 'transparent';
      g.lineWidth = Math.max(1.2, R * 0.032);        // the pink edge of each petal layer
      g.strokeStyle = c.edge;
      g.globalAlpha = 0.85;
      g.stroke();
      g.globalAlpha = 1;
    }
    // fine pink streaks, like the real petals
    g.strokeStyle = c.edge;
    g.lineWidth = Math.max(1, R * 0.016);
    g.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const th = rnd() * 6.283, r1 = R * (0.3 + rnd() * 0.4), r2 = r1 + R * (0.1 + rnd() * 0.16);
      g.globalAlpha = 0.25 + rnd() * 0.2;
      g.beginPath();
      g.moveTo(Math.cos(th) * r1, Math.sin(th) * r1);
      g.lineTo(Math.cos(th + 0.07) * r2, Math.sin(th + 0.07) * r2);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = c.shade; g.strokeStyle = c.edge; g.lineWidth = Math.max(1, R * 0.02);
    g.beginPath(); g.arc(0, 0, R * 0.09, 0, 6.283); g.fill(); g.stroke();
  }

  // A sprig of statice: lots of tiny purple florets packed together
  function paintStatice(g, R, rnd) {
    const purples = ['#4f3aa6', '#5b46b8', '#6a54cc', '#7a64df', '#8a76ea', '#6347c4'];
    g.fillStyle = 'rgba(52, 38, 118, 0.92)';
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const th = i / 40 * 6.283, r = R * (0.72 + 0.08 * Math.sin(5 * th + 1) + 0.05 * Math.sin(9 * th));
      if (i) g.lineTo(Math.cos(th) * r, Math.sin(th) * r); else g.moveTo(Math.cos(th) * r, Math.sin(th) * r);
    }
    g.fill();
    for (let i = 0; i < 46; i++) {
      const th = rnd() * 6.283, rad = Math.sqrt(rnd()) * R * 0.8;
      const x = Math.cos(th) * rad, y = Math.sin(th) * rad;
      const fr = R * (0.115 + rnd() * 0.07);
      const rot = rnd() * 6.283;
      g.fillStyle = purples[(rnd() * purples.length) | 0];
      g.shadowColor = 'rgba(30, 20, 80, 0.35)';
      g.shadowBlur = R * 0.04;
      g.beginPath();
      for (let p = 0; p < 5; p++) {
        const a = rot + p / 5 * 6.283;
        g.moveTo(x + Math.cos(a) * fr * 0.55 + fr * 0.6, y + Math.sin(a) * fr * 0.55);
        g.arc(x + Math.cos(a) * fr * 0.55, y + Math.sin(a) * fr * 0.55, fr * 0.6, 0, 6.283);
      }
      g.fill();
      g.shadowColor = 'transparent';
      if (rnd() < 0.3) {                         // some florets show their tiny pale centre
        g.fillStyle = '#efe9ff';
        g.beginPath(); g.arc(x, y, fr * 0.28, 0, 6.283); g.fill();
      }
    }
  }

  // Purple aster: thin petals around a yellow centre
  function paintAster(g, R, rnd) {
    const cols = ['#7a45c6', '#8a55d4', '#6f3fbc'];
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 14 : 20, len = R * (layer ? 0.72 : 0.98);
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.283 + rnd() * 0.12 + layer * 0.2;
        g.save();
        g.rotate(a);
        g.fillStyle = cols[(rnd() * cols.length) | 0];
        g.beginPath();
        g.ellipse(len * 0.55, 0, len * 0.46, R * 0.085, 0, 0, 6.283);
        g.fill();
        g.restore();
      }
    }
    g.fillStyle = '#e7c23d';
    g.beginPath(); g.arc(0, 0, R * 0.25, 0, 6.283); g.fill();
    g.fillStyle = '#c9981f';
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.283, r = rnd() * R * 0.17;
      g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, R * 0.035, 0, 6.283); g.fill();
    }
  }

  // A green carnation bud with a hint of pink at the tip
  function paintBud(g, R) {
    g.fillStyle = '#a9c873'; g.strokeStyle = '#6d8d43'; g.lineWidth = Math.max(1, R * 0.05);
    g.beginPath(); g.ellipse(0, R * 0.1, R * 0.42, R * 0.78, 0, 0, 6.283); g.fill(); g.stroke();
    g.fillStyle = '#f3cbc3';
    g.beginPath(); g.ellipse(0, -R * 0.62, R * 0.26, R * 0.22, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#6d8d43';
    g.beginPath(); g.moveTo(-R * 0.2, -R * 0.45); g.lineTo(0, R * 0.2); g.lineTo(R * 0.2, -R * 0.45); g.stroke();
  }

  // Dark leaves and stems underneath, so no paper shows between the flowers
  function paintLeaves(g, R, rnd) {
    g.fillStyle = 'rgba(34, 38, 44, 0.94)';
    g.beginPath();
    for (let i = 0; i <= 30; i++) {
      const th = i / 30 * 6.283, r = R * (0.78 + 0.1 * Math.sin(4 * th + rnd()));
      if (i) g.lineTo(Math.cos(th) * r, Math.sin(th) * r); else g.moveTo(Math.cos(th) * r, Math.sin(th) * r);
    }
    g.fill();
    g.strokeStyle = 'rgba(96, 128, 70, 0.75)'; g.lineWidth = Math.max(1, R * 0.03); g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = rnd() * 6.283, r = R * 0.65;
      g.beginPath(); g.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke();
    }
  }

  function buildSprites() {
    const rnd = rng(2026);
    const s = { carnation: {}, statice: [], aster: [], bud: null, leaves: [] };
    ['white', 'cream', 'blush'].forEach(function (tone) {
      s.carnation[tone] = [0, 1].map(function () { return makeSprite(200, function (g, R) { paintCarnation(g, R, rnd, tone); }); });
    });
    for (let i = 0; i < 4; i++) s.statice.push(makeSprite(170, function (g, R) { paintStatice(g, R, rnd); }));
    for (let i = 0; i < 2; i++) s.aster.push(makeSprite(120, function (g, R) { paintAster(g, R, rnd); }));
    s.bud = makeSprite(80, function (g, R) { paintBud(g, R); });
    for (let i = 0; i < 2; i++) s.leaves.push(makeSprite(220, function (g, R) { paintLeaves(g, R, rnd); }));
    return s;
  }

  /* =========================================================
     Where every piece belongs
     Positions were read off the reference photo (in photo pixels),
     then converted to bouquet units: centre (320, 440), 300 px = 1 unit.
     ========================================================= */

  const px = function (x, y) { return [(x - 320) / 300, (y - 440) / 300]; };

  // [x, y, width in photo px, tone]
  const CARNATIONS = [
    [285, 318, 112, 'white'], [352, 336, 104, 'cream'], [320, 276, 64, 'blush'], [205, 320, 60, 'cream'],
    [150, 328, 66, 'white'], [112, 354, 62, 'cream'], [180, 446, 106, 'white'], [240, 440, 58, 'blush'],
    [458, 386, 84, 'cream'], [492, 456, 96, 'blush'], [398, 522, 52, 'blush'], [272, 546, 52, 'white'],
    [312, 584, 84, 'cream'], [272, 616, 68, 'white'], [366, 634, 78, 'blush']
  ];
  const ASTERS = [[176, 386, 52], [396, 346, 42], [546, 384, 48], [520, 414, 40], [170, 518, 46], [350, 556, 46], [368, 598, 40], [422, 640, 46], [80, 402, 38]];
  const BUDS = [[506, 548, 46, 1.25], [472, 568, 42, 0.95], [448, 488, 40, -0.6]];

  // The black wrapping paper: pointed sheets fanning out behind the flowers,
  // a cone tapering down to where it is held, and one curled fold in front
  const WRAP_BACK = [
    [[-14, 296], [212, 142], [345, 258], [255, 430], [58, 480]],          // top left, the tall point
    [[296, 262], [408, 226], [650, 296], [606, 476], [420, 426]],         // top right
    [[512, 330], [676, 398], [648, 600], [566, 640], [468, 522]],         // right
    [[-10, 300], [60, 278], [142, 522], [104, 640], [-6, 566]],           // left
    [[92, 552], [570, 552], [612, 640], [392, 852], [296, 852], [80, 652]] // the cone underneath
  ];
  const WRAP_FRONT = [[118, 606], [196, 652], [300, 676], [410, 676], [512, 648], [604, 598],   // top edge (curled)
                      [598, 676], [500, 744], [344, 778], [204, 748], [112, 682]];              // lower edge

  function buildPieces() {
    const rnd = rng(77);
    const list = [];
    const add = function (o) { o.phase = rnd() * 6.283; list.push(o); return o; };

    WRAP_BACK.forEach(function (poly, i) { add(wrapPiece(poly, 0, i)); });

    // dark leaves underneath
    [[150, 380], [300, 340], [470, 400], [200, 540], [360, 560], [500, 520], [320, 450]].forEach(function (p, i) {
      const c = px(p[0], p[1]);
      add({ kind: 'leaves', z: 1, x: c[0], y: c[1], size: 250 / 300, rot: rnd() * 6.283, sprite: sprites.leaves[i % 2] });
    });

    // statice fills the whole bouquet shape
    let row = 0;
    for (let y = 262; y <= 640; y += 50, row++) {
      for (let x = 44 + (row % 2) * 28; x <= 604; x += 56) {
        const dx = (x - 320) / 296, dy = (y - 450) / 204;
        if (dx * dx + dy * dy > 1) continue;
        const c = px(x + (rnd() - 0.5) * 22, y + (rnd() - 0.5) * 20);
        add({ kind: 'statice', z: 2, x: c[0], y: c[1], size: (104 + rnd() * 34) / 300, rot: rnd() * 6.283, sprite: sprites.statice[(rnd() * 4) | 0] });
      }
    }
    [[262, 262], [236, 292]].forEach(function (p) {            // the little bump at the top
      const c = px(p[0], p[1]);
      add({ kind: 'statice', z: 2, x: c[0], y: c[1], size: 100 / 300, rot: rnd() * 6.283, sprite: sprites.statice[(rnd() * 4) | 0] });
    });

    ASTERS.forEach(function (a, i) {
      const c = px(a[0], a[1]);
      add({ kind: 'aster', z: 3, x: c[0], y: c[1], size: a[2] * 1.7 / 300, rot: rnd() * 6.283, sprite: sprites.aster[i % 2] });
    });
    BUDS.forEach(function (b) {
      const c = px(b[0], b[1]);
      add({ kind: 'bud', z: 3.5, x: c[0], y: c[1], size: b[2] * 1.3 / 300, rot: b[3], sprite: sprites.bud });
    });
    CARNATIONS.forEach(function (k, i) {
      const c = px(k[0], k[1]);
      add({ kind: 'carnation', z: 4, x: c[0], y: c[1], size: k[2] * 1.12 / 300, rot: rnd() * 6.283, sprite: sprites.carnation[k[3]][i % 2], first: i === 0 });
    });

    add(wrapPiece(WRAP_FRONT, 5, 5, true));

    list.sort(function (a, b) { return a.z - b.z; });
    return list;
  }

  function wrapPiece(poly, z, i, front) {
    let cx = 0, cy = 0;
    poly.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= poly.length; cy /= poly.length;
    const c = px(cx, cy);
    return {
      kind: 'wrap', z: z, x: c[0], y: c[1], size: 1, rot: 0, order: i, front: !!front,
      pts: poly.map(function (p) { return [(p[0] - cx) / 300, (p[1] - cy) / 300]; })
    };
  }

  /* ---------- A fresh, random starting scatter each time the scene opens ---------- */

  function scatter() {
    const flowers = pieces.filter(function (p) { return p.kind !== 'wrap' && p.kind !== 'leaves'; });
    const others = flowers.filter(function (p) { return !p.first; });
    others.sort(function () { return Math.random() - 0.5; });       // random order of appearance

    const halfW = W / 2 / U, top = -CY / U, bottom = (H - CY) / U;
    pieces.forEach(function (p) {
      if (p.kind === 'wrap') {
        const len = Math.hypot(p.x, p.y) || 1;                       // paper waits just off the page
        const far = Math.max(halfW, bottom) + 1.4;
        p.sx = p.x / len * far; p.sy = p.y / len * far + (p.front ? 0.4 : 0);
        p.sr = (Math.random() - 0.5) * 0.9;
        p.appear = T.wrap + p.order * 170;
        p.go = p.appear;
        p.dur = 1350;
      } else {
        if (p.kind === 'leaves') {                                    // leaves never float: they fade in underneath
          p.sx = p.x; p.sy = p.y; p.sr = p.rot;
          p.appear = T.gather + 900 + Math.random() * 700; p.go = p.appear - 2000; p.dur = 1;
          return;
        }
        p.sx = (Math.random() * 2 - 1) * halfW * 0.86;
        p.sy = lerp(top * 0.82, bottom * 0.62, Math.random());
        p.sr = p.rot + (Math.random() - 0.5) * 2.4;
        const layerDelay = { leaves: 0, statice: 200, aster: 1100, bud: 1400, carnation: 1500 }[p.kind];
        p.go = T.gather + layerDelay + Math.random() * (p.kind === 'statice' ? 1300 : 900);
        p.dur = 1500 + Math.random() * 500;
      }
    });
    others.forEach(function (p, i) {
      p.appear = lerp(T.scatterFrom, T.scatterTo, Math.sqrt(i / others.length));   // slow at first, then quicker
    });
    flowers.forEach(function (p) {
      if (p.first) { p.appear = T.first; p.sx = (Math.random() * 2 - 1) * halfW * 0.5; p.sy = lerp(top * 0.5, bottom * 0.3, Math.random()); }
    });
  }

  /* =========================================================
     Drawing a frame
     ========================================================= */

  function frame(now) {
    if (!running) return;
    draw(now - t0);
    raf = requestAnimationFrame(frame);
  }

  function draw(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const bloom = easeOut(clamp01((t - T.bloom) / T.bloomLen));
    const open = lerp(0.9, 1, bloom);                 // the whole bouquet opens up a little

    // soft warm light behind the bouquet as it blooms
    if (bloom > 0) {
      const glow = ctx.createRadialGradient(CX, CY, U * 0.2, CX, CY, U * 1.9);
      glow.addColorStop(0, 'rgba(201, 171, 118, ' + (0.32 * bloom).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(201, 171, 118, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (t < p.appear) continue;

      const alpha = clamp01((t - p.appear) / 700);
      const k = easeInOut(clamp01((t - p.go) / p.dur));              // 0 = scattered, 1 = in place
      const floatT = t * 0.001;

      // scattered: drifting slowly around its random spot
      const fx = p.sx + Math.sin(floatT * 0.55 + p.phase) * 0.05;
      const fy = p.sy + Math.cos(floatT * 0.45 + p.phase * 1.3) * 0.045;
      const fr = p.sr + Math.sin(floatT * 0.4 + p.phase) * 0.18;

      // in place: a tiny sway, like air moving through it
      const sway = p.kind === 'wrap' ? 0 : Math.sin(floatT * 0.8 + p.phase) * 0.012 * bloom;
      const tx = p.x * open + sway, ty = p.y * open;
      const tr = p.rot + Math.sin(floatT * 0.6 + p.phase) * 0.035 * bloom;

      const x = CX + lerp(fx, tx, k) * U;
      const y = CY + lerp(fy, ty, k) * U;
      const r = lerp(fr, tr, k);

      // size: small while floating, full in place; flowers swell a little more as they bloom
      let scale = lerp(0.72, 0.93, k) * lerp(0.6, 1, easeOut(alpha));
      if (p.kind === 'carnation' || p.kind === 'aster') {
        const d = Math.hypot(p.x, p.y);
        const b = easeOut(clamp01((t - T.bloom - d * 320) / (T.bloomLen * 0.8)));   // opens from the middle outward
        scale *= lerp(1, 1.1, b);
      } else {
        scale *= lerp(1, 1.075, bloom);
      }

      ctx.globalAlpha = alpha;
      if (p.kind === 'wrap') drawWrap(p, x, y, r, U * open);
      else {
        const d = p.size * U * scale;
        ctx.setTransform(DPR, 0, 0, DPR, x * DPR, y * DPR);
        ctx.rotate(r);
        ctx.drawImage(p.sprite, -d / 2, -d / 2, d, d);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }
    ctx.globalAlpha = 1;

    if (!captionShown && t >= T.caption) {
      captionShown = true;
      foot.classList.add('is-in');
    }
  }

  function drawWrap(p, x, y, r, unit) {
    const P = p.pts;
    ctx.setTransform(DPR, 0, 0, DPR, x * DPR, y * DPR);
    ctx.rotate(r);
    ctx.beginPath();
    if (p.front) {
      // smooth, slightly wavy outline for the curled front fold
      const n = P.length;
      ctx.moveTo((P[n - 1][0] + P[0][0]) / 2 * unit, (P[n - 1][1] + P[0][1]) / 2 * unit);
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n];
        ctx.quadraticCurveTo(a[0] * unit, a[1] * unit, (a[0] + b[0]) / 2 * unit, (a[1] + b[1]) / 2 * unit);
      }
    } else {
      P.forEach(function (pt, i) {
        if (i) ctx.lineTo(pt[0] * unit, pt[1] * unit); else ctx.moveTo(pt[0] * unit, pt[1] * unit);
      });
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -unit * 0.5, 0, unit * 0.6);
    g.addColorStop(0, p.front ? '#323136' : '#262529');
    g.addColorStop(1, p.front ? '#1a191c' : '#1c1b1e');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(104, 102, 110, 0.55)';   // faint lighter edge, like light catching the paper
    ctx.stroke();
    if (p.front) {                                   // two soft lines that follow the curl
      [0.045].forEach(function (off, j) {
        ctx.beginPath();
        ctx.moveTo(P[0][0] * unit * 0.94, P[0][1] * unit + unit * off);
        for (let i = 1; i < 5; i++) {
          const a = P[i], b = P[i + 1];
          ctx.quadraticCurveTo(a[0] * unit * 0.94, a[1] * unit + unit * off, (a[0] + b[0]) / 2 * unit * 0.94, (a[1] + b[1]) / 2 * unit + unit * off);
        }
        ctx.strokeStyle = 'rgba(130, 128, 138, ' + (j ? 0.22 : 0.42) + ')';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ---------- Sizing ---------- */

  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, box.width); H = Math.max(1, box.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    // The bouquet is about 2.72 units wide and 2.4 units tall (paper included).
    // Fit it into the space that the caption and button leave free.
    const sideBySide = W > H * 1.3 && H < 520;       // phone held sideways: bouquet left, words right
    if (sideBySide) {
      U = Math.min(W * 0.5 / 2.72, (H - 24) / 2.4);
      CX = W * 0.27;
      CY = (H - 2.4 * U) / 2 + 1.02 * U;
    } else {
      const top = 14;
      const room = Math.max(120, H - foot.offsetHeight - 48 - top);
      U = Math.min(W / 2.72, room / 2.4, 250);
      CX = W / 2;
      CY = top + (room - 2.4 * U) / 2 + 1.02 * U;
    }
    if (!running && pieces.length && captionShown) draw(T.caption + 5000);
  }

  // Paint every piece once (does nothing the second time)
  function prepare() {
    if (sprites) return;
    sprites = buildSprites();
    pieces = buildPieces();
  }

  /* ---------- Register with the scene manager ---------- */

  Story.register('flower', {
    init: function () {
      canvas = document.getElementById('flower-canvas');
      ctx = canvas.getContext('2d');
      foot = document.getElementById('flower-foot');
      document.getElementById('flower-caption').textContent = C.caption;
      document.getElementById('flower-sub').textContent = C.sub;
      document.getElementById('flower-continue').textContent = C.button;

      // paint the pieces a moment after the page opens, so Scene 2 starts instantly later
      setTimeout(prepare, 1500);

      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', function () {
        if (!running) return;
        if (document.hidden) cancelAnimationFrame(raf);
        else raf = requestAnimationFrame(frame);
      });
    },

    enter: function () {
      Story.fx.start({ count: 34 });
      prepare();
      captionShown = false;
      foot.classList.remove('is-in');
      resize();
      scatter();

      if (Story.reducedMotion) {                     // no travelling: just show the finished bouquet
        running = false;
        draw(T.caption + 5000);
        return;
      }
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    },

    leave: function () {
      // keep painting for a moment while the scene fades out, then stop
      setTimeout(function () {
        if (Story.current !== 'flower') { running = false; cancelAnimationFrame(raf); }
      }, 1000);
    }
  });
})();
