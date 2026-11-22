/* =========================================================
   memories.js: Scene 3, "Our Memories"
   A chronological slideshow. One photo at a time, like album pages.

   - Photo list, dates and captions: js/content.js  (Story.content.memories)
   - Photos keep their own shape (no stretching, no cropping)
   - Plays by itself; she can also swipe, tap the arrows, or use arrow keys
   - Holding a finger on a photo pauses it
   - Only the photos about to be shown are downloaded (kind to mobile data)
   ========================================================= */
(function () {
  'use strict';

  const Story = window.Story;
  const C = Story.content;
  const MEMORIES = C.memories;

  const SLIDE_MS = 5500;      // how long each photo stays before moving on
  const SWIPE_PX = 40;        // how far a finger must travel to count as a swipe

  let area, dateEl, captionEl, textEl, fillEl, countEl, prevBtn, nextBtn, nextLabel;
  let slides = [];            // { el, img }
  let index = -1;
  let timer = 0;
  let active = false;         // true while this scene is on screen
  let textTimer = 0;

  /* ---------- Build ---------- */

  function buildSlides() {
    MEMORIES.forEach(function (m, i) {
      const el = document.createElement('figure');
      el.className = 'slide';
      el.style.setProperty('--tilt', (i % 2 ? 0.6 : -0.6) + 'deg');   // tiny album-page tilt
      el.style.setProperty('--drift', (i % 2 ? 1.5 : -1.5) + '%');    // which way the photo drifts

      const frame = document.createElement('div');
      frame.className = 'print slide-print';

      const win = document.createElement('div');
      win.className = 'slide-window';

      const img = document.createElement('img');
      img.alt = m.caption || 'A photo of us';
      img.decoding = 'async';
      img.draggable = false;
      img.dataset.src = m.src;          // real download starts in load()

      win.appendChild(img);
      frame.appendChild(win);
      el.appendChild(frame);
      area.appendChild(el);
      slides.push({ el: el, img: img });
    });
  }

  // Start downloading photo i (does nothing if already started)
  function load(i) {
    const s = slides[i];
    if (s && !s.img.src) s.img.src = s.img.dataset.src;
  }

  // Resolves when photo i is ready to show (or after 4s, so it never gets stuck)
  function ready(i) {
    const img = slides[i].img;
    load(i);
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(function (resolve) {
      const done = function () { clearTimeout(t); resolve(); };
      const t = setTimeout(resolve, 4000);
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  /* ---------- Show a slide ---------- */

  function show(i, instant) {
    if (i < 0 || i >= slides.length || i === index) return;
    const target = i;
    stopTimer();

    ready(target).then(function () {
      if (!active && !instant) return;
      index = target;

      slides.forEach(function (s, n) {
        s.el.classList.toggle('is-current', n === index);
        s.el.classList.toggle('is-past', n < index);     // past pages rest to the left
      });

      setText(MEMORIES[index], instant);
      fillEl.style.transform = 'scaleX(' + (index + 1) / slides.length + ')';
      countEl.textContent = (index + 1) + ' / ' + slides.length;

      const last = index === slides.length - 1;
      prevBtn.disabled = index === 0;
      nextBtn.classList.toggle('is-continue', last);
      nextBtn.setAttribute('aria-label', last ? C.memoriesContinue : 'Next photo');

      // get the next two photos ready in the background
      load(index + 1);
      load(index + 2);

      if (active && !last) startTimer();
    });
  }

  function setText(m, instant) {
    clearTimeout(textTimer);
    const apply = function () {
      dateEl.textContent = m.date || '';
      captionEl.textContent = m.caption || '';
      textEl.classList.remove('is-changing');
    };
    if (instant) { apply(); return; }
    textEl.classList.add('is-changing');           // fade the old words out...
    textTimer = setTimeout(apply, 350);            // ...then bring the new ones in
  }

  function next() {
    if (index >= slides.length - 1) { Story.next(); return; }   // last photo: on to the birthday scene
    show(index + 1);
  }

  function prev() { show(index - 1); }

  /* ---------- Autoplay ---------- */

  function startTimer() {
    stopTimer();
    timer = setTimeout(function () {
      if (index < slides.length - 1) show(index + 1);   // autoplay stops on the last photo
    }, SLIDE_MS);
  }

  function stopTimer() { clearTimeout(timer); timer = 0; }

  /* ---------- Touch: swipe to move, hold to pause ---------- */

  function setupGestures() {
    let startX = 0, startY = 0, down = false;

    area.addEventListener('pointerdown', function (e) {
      down = true; startX = e.clientX; startY = e.clientY;
      stopTimer();                                   // holding a photo pauses the show
    });

    const end = function (e) {
      if (!down) return;
      down = false;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) { if (index < slides.length - 1) show(index + 1); else startIfNeeded(); }
        else if (index > 0) show(index - 1);
        else startIfNeeded();
      } else {
        startIfNeeded();
      }
    };
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', function () { down = false; startIfNeeded(); });
  }

  function startIfNeeded() {
    if (active && index < slides.length - 1) startTimer();
  }

  /* ---------- Keep photos fitted to the space available ---------- */

  function fit() {
    area.style.setProperty('--slide-w', area.clientWidth + 'px');
    area.style.setProperty('--slide-h', area.clientHeight + 'px');
  }

  /* ---------- Register with the scene manager ---------- */

  Story.register('memories', {
    init: function () {
      area = document.getElementById('slides');
      textEl = document.getElementById('memory-text');
      dateEl = document.getElementById('memory-date');
      captionEl = document.getElementById('memory-caption');
      fillEl = document.getElementById('memory-fill');
      countEl = document.getElementById('memory-count');
      prevBtn = document.getElementById('memory-prev');
      nextBtn = document.getElementById('memory-next');
      nextLabel = document.getElementById('memory-next-label');

      document.getElementById('memory-heading').textContent = C.memoriesHeading;
      nextLabel.textContent = C.memoriesContinue;

      buildSlides();
      if (!slides.length) return;

      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);
      setupGestures();

      document.addEventListener('keydown', function (e) {
        if (!active) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopTimer(); else startIfNeeded();
      });

      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(area);
      window.addEventListener('resize', fit);

      // fetch the first two photos early so the scene opens without a wait
      load(0);
      load(1);
    },

    enter: function () {
      Story.fx.start({ count: 24 });
      if (!slides.length) return;
      active = true;
      fit();
      index = -1;
      show(0, true);
    },

    leave: function () {
      active = false;
      stopTimer();
    }
  });
})();
