/* =========================================================
   opening.js: Scene 1, "Two People, One Story"

   A hand-drawn scene: the National Museum of Fine Arts in the
   background, and the two of us standing far apart in front of it.
   She drags either character toward the other. As they get closer
   their arms lift and reach; when the hands are close enough they
   snap together and the scene continues.

   Three ways to bring them together (so nobody gets stuck):
     1. drag a character (touch or mouse)
     2. tap a character: it takes a step closer
     3. keyboard: focus a character, then arrow keys or Enter

   Everything is drawn with SVG inside a 360 x 360 "sheet of paper".
   ========================================================= */
(function () {
  'use strict';

  const Story = window.Story;
  const C = Story.content.opening;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Numbers you can tune ---------- */
  const GROUND = 338;                 // y of their feet on the sheet
  const START = { her: 56, him: 304 };// where each one starts (x)
  const LIMIT = { min: 34, max: 326 };// how far out they can be dragged
  const SIZE = 1.18;                  // how big the two characters are drawn
  const REACH = 30;                   // how far a hand reaches toward the other
  const MEET_GAP = REACH * 2 * SIZE;  // distance between them when hands touch
  const SNAP = 18;                    // "close enough": they pull together from here
  const ARMS_FROM = 215;              // arms start lifting when closer than this

  const INK = '#2b2a28', PAPER = '#fbf6ec', GOLD = '#c9ab76', GRAY = '#8a8780';

  let svg, stage, people = {}, spark;
  let pos = { her: START.her, him: START.him };
  let joined = false, drag = null, raf = 0, tweens = [];

  /* ---------- Small helpers ---------- */

  function S(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const f = function (n) { return n.toFixed(1); };

  // Repeatable "random" so the sketch lines look the same on every visit
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* =========================================================
     The museum (background line art)
     Every straight line is drawn slightly wobbly, and the main
     outlines are drawn twice, like pencil on paper.
     ========================================================= */
  function drawMuseum(parent) {
    const rnd = rng(11);
    const main = [], fine = [];

    function ln(x1, y1, x2, y2, j) {
      j = j == null ? 0.6 : j;
      const r = function () { return (rnd() - 0.5) * 2 * j; };
      return 'M' + f(x1 + r()) + ' ' + f(y1 + r()) +
             'Q' + f((x1 + x2) / 2 + r()) + ' ' + f((y1 + y2) / 2 + r()) +
             ' ' + f(x2 + r()) + ' ' + f(y2 + r());
    }
    const M = function (a, b, c, d) { main.push(ln(a, b, c, d), ln(a, b, c, d, 0.9)); };   // double stroke
    const F = function (a, b, c, d) { fine.push(ln(a, b, c, d, 0.4)); };
    const box = function (x, y, w, h, fn) { fn(x, y, x + w, y); fn(x + w, y, x + w, y + h); fn(x + w, y + h, x, y + h); fn(x, y + h, x, y); };

    // ground the building stands on
    M(4, 262, 356, 262);

    // two side wings
    [14, 238].forEach(function (x0) {
      const x1 = x0 + 108;
      M(x0, 128, x0, 262); M(x1, 128, x1, 262);
      M(x0 - 3, 128, x1 + 3, 128);
      F(x0, 134, x1, 134); F(x0, 182, x1, 182); F(x0, 250, x1, 250);
      F(x0 + 5, 134, x0 + 5, 250); F(x1 - 5, 134, x1 - 5, 250);
      for (let i = 0; i < 4; i++) {
        const wx = x0 + 13 + i * 24;
        box(wx, 146, 11, 24, F); F(wx + 5.5, 146, wx + 5.5, 170); F(wx, 158, wx + 11, 158);
        box(wx, 196, 11, 36, F); F(wx + 5.5, 196, wx + 5.5, 232); F(wx, 208, wx + 11, 208); F(wx, 220, wx + 11, 220);
      }
    });

    // centre block: pediment, attic, frieze
    M(118, 86, 180, 57); M(180, 57, 242, 86); M(118, 86, 242, 86);
    F(129, 84, 180, 62); F(180, 62, 231, 84);
    [158, 167, 175, 185, 193, 202].forEach(function (x, i) {            // little sculpted figures
      const h = 6 + (i === 2 || i === 3 ? 6 : i === 1 || i === 4 ? 3 : 0);
      F(x, 84, x, 84 - h); F(x - 2, 84 - h * 0.6, x + 2, 84 - h * 0.6);
    });
    M(124, 86, 124, 112); M(236, 86, 236, 112);
    M(118, 112, 242, 112); F(120, 116, 240, 116); M(121, 129, 239, 129);

    // six columns
    [128, 141, 163, 190, 212, 225].forEach(function (x) {
      M(x, 135, x, 212); M(x + 7, 135, x + 7, 212);
      F(x + 3.5, 139, x + 3.5, 208);
      F(x - 1.5, 135, x + 8.5, 135); F(x - 1, 132, x + 8, 132); F(x - 1.5, 212, x + 8.5, 212);
    });
    // doorway in the shadow behind them
    box(172, 166, 16, 46, F); F(180, 166, 180, 212);
    for (let y = 172; y < 210; y += 6) F(173, y, 187, y + 2);

    // platform and steps
    M(120, 214, 240, 214); M(117, 220, 243, 220);
    M(117, 220, 97, 262); M(243, 220, 263, 262);
    for (let i = 1; i < 6; i++) { const y = 220 + i * 7, half = 63 + i * 3.4; F(180 - half, y, 180 + half, y); }

    // flagpole and flag
    M(180, 262, 180, 18);
    box(175.5, 251, 9, 11, F);
    main.push('M180 20C171 16 163 28 151 23L151 41C163 46 171 34 180 38');
    fine.push('M180 20L167 29.5L180 38');

    // two lamp posts
    [100, 260].forEach(function (x) { F(x, 262, x, 238); fine.push('M' + (x - 2.4) + ' 236a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0'); });

    const g = S('g', { class: 'museum', fill: 'none', stroke: GRAY, 'stroke-linecap': 'round' }, parent);
    S('path', { d: main.join(''), 'stroke-width': 0.8 }, g);
    S('path', { d: fine.join(''), 'stroke-width': 0.5, opacity: 0.8 }, g);
    const t = S('text', { x: 180, y: 125.4, 'text-anchor': 'middle', 'font-size': 5.4, 'letter-spacing': 1.3,
                          fill: GRAY, stroke: 'none', 'font-family': 'Cormorant Garamond, Georgia, serif' }, g);
    t.textContent = 'FINE · NATIONAL MUSEUM · ARTS';

    // the ground they stand on, in front
    const fg = S('g', { fill: 'none', stroke: GRAY, 'stroke-linecap': 'round', opacity: 0.6 }, parent);
    S('path', { d: ln(16, 341, 344, 341, 0.8) + ln(40, 344.5, 150, 344.5, 0.5) + ln(215, 345, 330, 345, 0.5), 'stroke-width': 0.7 }, fg);
  }

  /* =========================================================
     The characters
     Drawn around (0,0) = the spot between their feet; up is negative y.
     "side" is +1 when the other person is to the right, -1 to the left.
     ========================================================= */

  function personShell(who, label) {
    const g = S('g', { class: 'person person--' + who, tabindex: 0, role: 'button', 'aria-label': label }, svg);
    const sway = S('g', { class: 'sway' }, g);
    S('ellipse', { cx: 0, cy: 1.5, rx: 19, ry: 3.2, fill: '#e2d6bf', opacity: 0.75 }, sway);          // soft shadow
    return { g: g, sway: sway };
  }

  // The reaching arm is redrawn whenever they move
  function makeArm(parent, o) {
    const arm = { o: o };
    if (o.sleeve) {
      arm.sleeveOut = S('path', { fill: 'none', stroke: INK, 'stroke-width': 9.4 }, parent);
      arm.sleeveIn = S('path', { fill: 'none', stroke: PAPER, 'stroke-width': 6.4 }, parent);
      arm.cuff = S('path', { fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, parent);
    }
    arm.line = S('path', { fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round' }, parent);
    arm.ring = S('circle', { class: 'hand-ring', r: 7.5, fill: 'none', stroke: GOLD, 'stroke-width': 1.1, 'stroke-dasharray': '2.6 2.6' }, parent);
    arm.hand = S('circle', { r: 2.9, fill: PAPER, stroke: INK, 'stroke-width': 1.6 }, parent);
    return arm;
  }

  function setArm(arm, t) {
    const o = arm.o;
    const hx = lerp(o.rest[0], o.reach[0], t), hy = lerp(o.rest[1], o.reach[1], t);
    const sx = o.shoulder[0], sy = o.shoulder[1];
    const cx = (sx + hx) / 2 + o.side * 5 * (1 - t), cy = (sy + hy) / 2 + 5 * t;       // the elbow
    if (o.sleeve) {
      const u = 0.4;                                                                    // sleeve covers the first 40%
      const ax = lerp(sx, cx, u), ay = lerp(sy, cy, u);
      const bx = lerp(cx, hx, u), by = lerp(cy, hy, u);
      const px = lerp(ax, bx, u), py = lerp(ay, by, u);
      const d = 'M' + f(sx) + ' ' + f(sy) + 'Q' + f(ax) + ' ' + f(ay) + ' ' + f(px) + ' ' + f(py);
      arm.line.setAttribute('d', 'M' + f(px) + ' ' + f(py) + 'Q' + f(bx) + ' ' + f(by) + ' ' + f(hx) + ' ' + f(hy));
      arm.sleeveOut.setAttribute('d', d);
      arm.sleeveIn.setAttribute('d', d);
      const tx = bx - ax, ty = by - ay, len = Math.hypot(tx, ty) || 1;                  // cuff sits across the sleeve end
      const nx = -ty / len * 4.6, ny = tx / len * 4.6;
      arm.cuff.setAttribute('d', 'M' + f(px + nx) + ' ' + f(py + ny) + 'L' + f(px - nx) + ' ' + f(py - ny));
    } else {
      arm.line.setAttribute('d', 'M' + f(sx) + ' ' + f(sy) + 'Q' + f(cx) + ' ' + f(cy) + ' ' + f(hx) + ' ' + f(hy));
    }
    arm.hand.setAttribute('cx', f(hx)); arm.hand.setAttribute('cy', f(hy));
    arm.ring.setAttribute('cx', f(hx)); arm.ring.setAttribute('cy', f(hy));
  }

  // little gold arrows that say "this way"
  function hintArrows(parent, side) {
    const g = S('g', { class: 'hint hint--' + (side > 0 ? 'right' : 'left'), fill: 'none', stroke: GOLD,
                       'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    [0, 8].forEach(function (dx, i) {
      const x = side * (38 + dx);
      S('path', { d: 'M' + x + ' -112l' + side * 5 + ' 5l' + (-side * 5) + ' 5', opacity: i ? 0.5 : 1 }, g);
    });
  }

  /* ----- Her: long dark hair, black tube dress, black neck scarf with a long tail ----- */
  function drawHer() {
    const p = personShell('her', C.herLabel), g = p.sway;
    const line = { fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round' };

    S('path', { d: 'M-14-141C-20-128-21-108-20-85C-13-90-8-92 0-92C8-92 13-90 20-85C21-108 20-128 14-141Z', fill: INK }, g);   // hair behind
    S('path', Object.assign({ d: 'M-6-54L-7-5M6-54L7-5' }, line), g);                                                       // legs
    S('ellipse', { cx: -9.5, cy: -3, rx: 5.6, ry: 2.8, fill: INK }, g);
    S('ellipse', { cx: 9.5, cy: -3, rx: 5.6, ry: 2.8, fill: INK }, g);

    // outer arm with her little black bag
    S('path', Object.assign({ d: 'M-13-110Q-21-92-18.5-70' }, line), g);
    S('path', { d: 'M-22-67q3.5-6 7 0', fill: 'none', stroke: INK, 'stroke-width': 1.3 }, g);
    S('rect', { x: -24.5, y: -67, width: 12, height: 9.5, rx: 2.2, fill: INK }, g);
    S('circle', { cx: -18.5, cy: -69, r: 2.9, fill: PAPER, stroke: INK, 'stroke-width': 1.6 }, g);

    p.arm = makeArm(g, { side: 1, shoulder: [13, -110], rest: [19, -68], reach: [REACH, -86] });

    S('path', { d: 'M-13-110Q-7-116 0-117Q7-116 13-110L12-107Q0-103-12-107Z', fill: PAPER, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g); // shoulders
    S('path', { d: 'M-12-108Q0-103.5 12-108L10.5-88Q15.5-70 19.5-54Q9-49.5 0-52Q-9-49.5-19.5-54Q-15.5-70-10.5-88Z', fill: INK, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round' }, g); // dress
    S('path', { d: 'M-2.7-124L-2.7-115.5L2.7-115.5L2.7-124Z', fill: PAPER }, g);                                           // neck
    S('path', { d: 'M-2.7-123L-2.7-116M2.7-123L2.7-116', fill: 'none', stroke: INK, 'stroke-width': 1.4 }, g);
    S('path', { class: 'scarf-tail', d: 'M2.5-118C6-108 2.5-97 6.5-82', fill: 'none', stroke: INK, 'stroke-width': 3.1, 'stroke-linecap': 'round' }, g); // scarf tail
    S('circle', { cx: 0, cy: -134, r: 13, fill: PAPER, stroke: INK, 'stroke-width': 1.8 }, g);                              // head
    S('path', { d: 'M0-148C-9-148.5-15-141-14.5-131C-14-127-14-123-15-118C-10.5-126-8-138 0-148Z', fill: INK }, g);        // hair, parted in the middle
    S('path', { d: 'M0-148C9-148.5 15-141 14.5-131C14-127 14-123 15-118C10.5-126 8-138 0-148Z', fill: INK }, g);
    S('circle', { cx: -4.4, cy: -132.5, r: 1.1, fill: INK }, g);
    S('circle', { cx: 4.4, cy: -132.5, r: 1.1, fill: INK }, g);
    S('path', { d: 'M-3-127.4Q0-124.9 3-127.4', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);
    S('path', { d: 'M-3.6-119.6Q0-118 3.6-119.6', fill: 'none', stroke: INK, 'stroke-width': 3.3, 'stroke-linecap': 'round' }, g); // scarf band

    hintArrows(g, 1);
    S('rect', { class: 'hit', x: -34, y: -164, width: 78, height: 176, fill: 'transparent' }, p.g);                        // generous touch area
    return p;
  }

  /* ----- Him: messy dark hair, white jersey tee with black trim, strap, black pants, the bouquet ----- */
  function drawHim() {
    const p = personShell('him', C.himLabel), g = p.sway;
    const line = { fill: 'none', stroke: INK, 'stroke-width': 2.3, 'stroke-linecap': 'round' };

    S('path', { d: 'M-14-80L14-80L13-7L3.6-7L0-57L-3.6-7L-13-7Z', fill: INK, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g); // pants
    S('ellipse', { cx: -9.6, cy: -3.4, rx: 6.3, ry: 3.1, fill: PAPER, stroke: INK, 'stroke-width': 1.5 }, g);
    S('ellipse', { cx: 9.6, cy: -3.4, rx: 6.3, ry: 3.1, fill: PAPER, stroke: INK, 'stroke-width': 1.5 }, g);

    p.arm = makeArm(g, { side: -1, sleeve: true, shoulder: [-15.5, -121], rest: [-22, -76], reach: [-REACH, -86] });

    // outer arm, bent to hold the bouquet
    S('path', { d: 'M15.5-121Q21-112 22.5-106', fill: 'none', stroke: INK, 'stroke-width': 9.4 }, g);
    S('path', { d: 'M15.5-121Q21-112 22.5-106', fill: 'none', stroke: PAPER, 'stroke-width': 6.4 }, g);
    S('path', { d: 'M18.2-104.6L26.8-107.4', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    S('path', Object.assign({ d: 'M22.5-106Q25-97 17-93' }, line), g);

    S('path', { d: 'M-17-124Q-9-128-4.5-127L0-120.5L4.5-127Q9-128 17-124L15.5-78Q0-75.5-15.5-78Z', fill: PAPER, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g); // tee
    S('path', { d: 'M-4.8-127.2L0-120.2L4.8-127.2', fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);                 // striped collar
    S('path', { d: 'M-9-103.5h3M-4.2-103.5h3.4M1-103.5h3', fill: 'none', stroke: INK, 'stroke-width': 2.4 }, g);                                                               // chest lettering
    S('path', { d: 'M-10.5-126.5L13.5-82', fill: 'none', stroke: INK, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);                                                    // bag strap
    S('path', { d: 'M-2.8-134L-2.8-126L2.8-126L2.8-134Z', fill: PAPER }, g);
    S('path', { d: 'M-2.8-133L-2.8-126.5M2.8-133L2.8-126.5', fill: 'none', stroke: INK, 'stroke-width': 1.4 }, g);
    S('circle', { cx: 0, cy: -144, r: 13, fill: PAPER, stroke: INK, 'stroke-width': 1.8 }, g);
    S('path', { d: 'M-13.8-145C-17-155-9.5-162-3-159C0-163 7.5-162 9.5-158C15-158 17-150 13.8-144.5C12-149 9-151.5 6-150.5C3-153-1-152-3-150C-7-152-11.5-150.5-13.8-145Z', fill: INK }, g); // hair
    S('circle', { cx: -4.4, cy: -142, r: 1.1, fill: INK }, g);
    S('circle', { cx: 4.4, cy: -142, r: 1.1, fill: INK }, g);
    S('path', { d: 'M-3-137Q0-134.5 3-137', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);

    // the bouquet: black wrap, purple statice, pale carnations
    const b = S('g', { class: 'mini-bouquet', transform: 'translate(19 -95) rotate(16)' }, g);
    S('path', { d: 'M0 9L-14-13L-8-21L-1-16L6-23L14-12Z', fill: INK, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round' }, b);
    [[-7, -17, 4.2, '#6a54cc'], [3, -19.5, 4.6, '#7c66e0'], [9.5, -13.5, 3.6, '#5b46b5'], [-2, -12, 3.8, '#8b78ea'], [-11, -11.5, 2.8, '#7c66e0']]
      .forEach(function (c) { S('circle', { cx: c[0], cy: c[1], r: c[2], fill: c[3] }, b); });
    [[-1.5, -18.5, 3.1], [-8.5, -12.5, 2.6], [6, -11.5, 2.9]]
      .forEach(function (c) { S('circle', { cx: c[0], cy: c[1], r: c[2], fill: '#fbeee2', stroke: '#e2899a', 'stroke-width': 0.8 }, b); });
    S('circle', { cx: 17, cy: -93, r: 2.9, fill: PAPER, stroke: INK, 'stroke-width': 1.6 }, g);                                                                                 // hand over the wrap

    hintArrows(g, -1);
    S('rect', { class: 'hit', x: -44, y: -174, width: 80, height: 186, fill: 'transparent' }, p.g);
    return p;
  }

  /* =========================================================
     Positions, arms, and the moment they meet
     ========================================================= */

  function render() {
    const gap = pos.him - pos.her;
    let t = clamp((ARMS_FROM - gap) / (ARMS_FROM - MEET_GAP), 0, 1);
    t = t * t * (3 - 2 * t);                                        // ease: arms lift gently, then commit
    people.her.g.setAttribute('transform', 'translate(' + f(pos.her) + ' ' + GROUND + ') scale(' + SIZE + ')');
    people.him.g.setAttribute('transform', 'translate(' + f(pos.him) + ' ' + GROUND + ') scale(' + SIZE + ')');
    setArm(people.her.arm, t);
    setArm(people.him.arm, t);
  }

  function requestRender() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; render(); });
  }

  function move(who, x) {
    if (who === 'her') pos.her = clamp(x, LIMIT.min, pos.him - MEET_GAP);
    else pos.him = clamp(x, pos.her + MEET_GAP, LIMIT.max);
    requestRender();
    if (!joined && pos.him - pos.her <= MEET_GAP + SNAP) join();
  }

  // Smoothly slide a value over time (used for the step-closer tap and the final snap)
  function tween(ms, step, done) {
    const t0 = performance.now();
    const reduced = Story.reducedMotion;
    const tw = { alive: true };
    tweens.push(tw);
    (function tick(now) {
      if (!tw.alive) return;
      let k = reduced ? 1 : clamp((now - t0) / ms, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      step(e);
      if (k < 1) requestAnimationFrame(tick);
      else { tw.alive = false; if (done) done(); }
    })(t0);
  }

  function stopTweens() { tweens.forEach(function (t) { t.alive = false; }); tweens = []; }

  function stepCloser(who) {
    if (joined) return;
    const from = pos[who];
    const room = (pos.him - pos.her) - MEET_GAP;
    const dist = Math.max(room * 0.5, Math.min(room, 34)) * (who === 'her' ? 1 : -1);
    tween(520, function (e) { if (!joined) move(who, from + dist * e); });
  }

  function join() {
    joined = true;
    drag = null;
    svg.classList.add('has-dragged', 'is-joined');
    const a = pos.her, b = pos.him;
    const mid = 180;                                               // they end up centred on the sheet
    tween(760, function (e) {
      pos.her = lerp(a, mid - MEET_GAP / 2, e);
      pos.him = lerp(b, mid + MEET_GAP / 2, e);
      render();
    }, function () {
      spark.setAttribute('transform', 'translate(' + mid + ' ' + f(GROUND - 86 * SIZE) + ')');
      svg.classList.add('celebrate');
      stage.classList.add('is-joined');
      Story.fx.stop();
      Story.fx.start({ count: 48 });
    });
  }

  /* ---------- Dragging (works for touch, mouse and pen) ---------- */

  function svgX(e) {
    const m = svg.getScreenCTM();
    return m ? (e.clientX - m.e) / m.a : 0;
  }

  function setupDrag(who) {
    const g = people[who].g;

    g.addEventListener('pointerdown', function (e) {
      if (joined) return;
      e.preventDefault();
      stopTweens();
      drag = { who: who, id: e.pointerId, offset: svgX(e) - pos[who], x0: e.clientX, moved: false };
      try { g.setPointerCapture(e.pointerId); } catch (err) { /* older browsers: still fine */ }
      g.classList.add('is-dragging');
    });

    g.addEventListener('pointermove', function (e) {
      if (!drag || drag.who !== who || drag.id !== e.pointerId || joined) return;
      if (Math.abs(e.clientX - drag.x0) > 4) {
        drag.moved = true;
        svg.classList.add('has-dragged');
      }
      if (drag.moved) move(who, svgX(e) - drag.offset);
    });

    const end = function (e) {
      if (!drag || drag.who !== who) return;
      const wasTap = !drag.moved;
      drag = null;
      g.classList.remove('is-dragging');
      try { g.releasePointerCapture(e.pointerId); } catch (err) { /* nothing to release */ }
      if (wasTap && e.type === 'pointerup') stepCloser(who);       // a simple tap also works
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);

    g.addEventListener('keydown', function (e) {
      if (joined) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stepCloser(who); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); svg.classList.add('has-dragged'); move(who, pos[who] + 14); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); svg.classList.add('has-dragged'); move(who, pos[who] - 14); }
    });
  }

  function reset() {
    stopTweens();
    joined = false; drag = null;
    pos.her = START.her; pos.him = START.him;
    svg.classList.remove('has-dragged', 'is-joined', 'celebrate');
    stage.classList.remove('is-joined');
    render();
  }

  /* ---------- Register with the scene manager ---------- */

  Story.register('opening', {
    init: function () {
      stage = document.getElementById('opening');
      document.getElementById('open-eyebrow').textContent = C.eyebrow;
      document.getElementById('open-title').textContent = C.title;
      document.getElementById('open-hint-text').textContent = C.hint;
      document.getElementById('open-hint-sub').textContent = C.hintSub;
      document.getElementById('open-date').textContent = C.joinedDate;
      document.getElementById('open-line').textContent = C.joinedLine;
      document.getElementById('open-continue').textContent = C.button;

      svg = S('svg', { viewBox: '0 0 360 360', class: 'opening-svg', role: 'group',
                       'aria-label': 'The two of us in front of the National Museum of Fine Arts' },
              document.getElementById('opening-art'));

      drawMuseum(svg);
      people.her = drawHer();
      people.him = drawHim();

      // the little moment when the hands meet: a soft ring and a small hand-drawn heart
      spark = S('g', { class: 'spark' }, svg);
      S('circle', { class: 'spark-ring', r: 9, fill: 'none', stroke: GOLD, 'stroke-width': 1.2 }, spark);
      S('path', { class: 'spark-heart', d: 'M0-15C-7.5-22-4-29 0-23.5C4-29 7.5-22 0-15Z', fill: 'none', stroke: GOLD,
                  'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 100 }, spark);

      setupDrag('her');
      setupDrag('him');
      render();
    },

    enter: function () {
      reset();
      Story.fx.start({ count: 26 });
    },

    leave: function () {
      stopTweens();
      drag = null;
    }
  });
})();
