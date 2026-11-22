/* =========================================================
   effects.js: lightweight floating particles (champagne dust)
   One shared canvas (#fx). Scenes call Story.fx.start() / stop().
   - Capped particle count (fewer on phones)
   - DPR capped at 2 to save battery
   - Pauses automatically when the tab is hidden
   - Does nothing if the visitor prefers reduced motion
   ========================================================= */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fx = { running: false };
  let canvas, ctx, w = 0, h = 0, dpr = 1, raf = 0, last = 0, parts = [];
  let opts = { count: 36, color: '201,171,118' };

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function make() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 6,       // px per second
      vy: -(4 + Math.random() * 10),       // drift upward slowly
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8
    };
  }

  function frame(t) {
    if (!fx.running) return;
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.clearRect(0, 0, w, h);

    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += p.speed * dt;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const a = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(p.phase));
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + opts.color + ',' + a.toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  fx.init = function () {
    canvas = document.getElementById('fx');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (fx.running) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  };

  fx.start = function (o) {
    if (reduced || !ctx || fx.running) return;
    opts = Object.assign({}, opts, o || {});
    const mobile = w < 700;
    const n = mobile ? Math.round(opts.count * 0.6) : opts.count;
    parts = Array.from({ length: n }, make);
    fx.running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  fx.stop = function () {
    fx.running = false;
    cancelAnimationFrame(raf);
    if (ctx) ctx.clearRect(0, 0, w, h);
  };

  // This file loads first, so it also creates the scene registry that
  // opening.js, flower.js, etc. use before main.js has run.
  const Story = window.Story = window.Story || {};
  Story.modules = Story.modules || {};
  Story.register = function (name, mod) { Story.modules[name] = mod; };
  Story.fx = fx;
})();
