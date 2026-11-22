/* =========================================================
   main.js: the scene manager. Loaded LAST.
   Each scene file registers itself:
       Story.register('name', { init(el){}, enter(el){}, leave(){} });
   main.js then runs init() once, and enter()/leave() on every visit.

   Handy while building:  index.html?scene=letter  jumps straight to a scene.
   ========================================================= */
(function () {
  'use strict';

  const TRANSITION_MS = 900; // keep in sync with --t-scene in style.css

  const Story = window.Story = window.Story || {};
  Object.assign(Story, {
    order: ['opening', 'flower', 'memories', 'birthday', 'letter', 'closing'],
    current: null,
    busy: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    // Story.modules and Story.register are created in effects.js (loaded first)

    el: function (name) { return document.getElementById('scene-' + name); },

    go: function (name) {
      if (Story.busy || name === Story.current || Story.order.indexOf(name) === -1) return;
      Story.busy = true;

      const prev = Story.current;
      if (prev) {
        const pe = Story.el(prev);
        const pm = Story.modules[prev];
        if (pm && pm.leave) pm.leave(pe);
        pe.classList.remove('is-active');
        pe.classList.add('is-leaving');
        pe.inert = true;
        pe.setAttribute('aria-hidden', 'true');
      }

      const wait = prev ? (Story.reducedMotion ? 300 : TRANSITION_MS * 0.7) : 0;
      setTimeout(function () {
        if (prev) Story.el(prev).classList.remove('is-leaving');

        const ne = Story.el(name);
        ne.inert = false;
        ne.removeAttribute('aria-hidden');
        ne.classList.add('is-active');
        Story.current = name;
        document.body.dataset.scene = name;

        const nm = Story.modules[name];
        if (nm && nm.enter) nm.enter(ne);

        Story.busy = false;
        document.dispatchEvent(new CustomEvent('story:scene', { detail: { name: name } }));
      }, wait);
    },

    next: function () {
      const i = Story.order.indexOf(Story.current);
      if (i > -1 && i < Story.order.length - 1) Story.go(Story.order[i + 1]);
    },

    replay: function () { Story.go('opening'); }
  });

  /* ---------- Music ----------
     Put the song at the path in data-src on #music (index.html).
     The button only appears once the file has actually loaded,
     so a missing file never shows a broken button. */
  function setupMusic() {
    const audio = document.getElementById('music');
    const btn = document.getElementById('music-toggle');
    if (!audio || !btn) return;

    const src = audio.getAttribute('data-src');
    if (!src) return;

    audio.addEventListener('loadedmetadata', function () { btn.hidden = false; });
    audio.addEventListener('error', function () { btn.hidden = true; });
    audio.preload = 'metadata';
    audio.volume = 0.6;
    audio.src = src;

    // Browsers only allow sound after a touch/click, so start on the first one.
    let started = false;
    function start() {
      if (started) return;
      started = true;
      audio.play().catch(function () { started = false; });
    }
    document.addEventListener('pointerdown', start, { once: true });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) { audio.play().catch(function () {}); btn.classList.remove('is-muted'); }
      else { audio.pause(); btn.classList.add('is-muted'); }
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    if (Story.fx) Story.fx.init();

    Story.order.forEach(function (name) {
      const m = Story.modules[name];
      if (m && m.init) m.init(Story.el(name));
    });

    document.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', Story.next);
    });
    document.querySelectorAll('[data-replay]').forEach(function (b) {
      b.addEventListener('click', Story.replay);
    });

    setupMusic();

    const wanted = new URLSearchParams(location.search).get('scene');
    Story.go(Story.order.indexOf(wanted) > -1 ? wanted : 'opening');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
