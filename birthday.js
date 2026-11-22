/* =========================================================
   birthday.js: Scenes 4-6: greeting, letter, closing
   All text comes from js/content.js.
   Draft presentation: lines fade in one after another.
   ========================================================= */
(function () {
  'use strict';

  const Story = window.Story;
  const C = Story.content;
  const slow = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Small helper: run steps on a schedule, and cancel them all when the scene is left.
  function Timeline() {
    let ids = [];
    return {
      at: function (ms, fn) { ids.push(setTimeout(fn, slow ? ms : Math.min(ms, 300))); },
      clear: function () { ids.forEach(clearTimeout); ids = []; }
    };
  }

  function p(className, text) {
    const el = document.createElement('p');
    el.className = className;
    el.textContent = text;
    return el;
  }

  /* ---------- Scene 4: greeting ---------- */
  Story.register('birthday', {
    init: function () {
      document.getElementById('greet-eyebrow').textContent = C.greeting.eyebrow;
      document.getElementById('greet-title').textContent = C.greeting.title;
      document.getElementById('greet-subtitle').textContent = C.greeting.subtitle;
      document.getElementById('greet-button').textContent = C.greeting.button;
    },
    enter: function () { Story.fx.start({ count: 40 }); },
    leave: function () {}
  });

  /* ---------- Scene 5: letter ---------- */
  (function () {
    const tl = Timeline();
    let paper, lines = [];

    Story.register('letter', {
      init: function () {
        paper = document.getElementById('letter');
        paper.appendChild(p('letter-salutation line', C.letter.salutation));
        C.letter.paragraphs.forEach(function (text) { paper.appendChild(p('line', text)); });
        paper.appendChild(p('letter-signoff line', C.letter.signoff));
        paper.appendChild(p('letter-signature line', C.letter.signature));
        lines = Array.from(paper.querySelectorAll('.line'));
      },
      enter: function () {
        Story.fx.start({ count: 20 });
        paper.scrollTop = 0;
        lines.forEach(function (el, i) {
          tl.at(700 + i * 900, function () { el.classList.add('is-in'); });
        });
      },
      leave: function () {
        tl.clear();
        // reset after the scene has faded out, so a replay starts fresh
        setTimeout(function () { lines.forEach(function (el) { el.classList.remove('is-in'); }); }, 1000);
      }
    });
  })();

  /* ---------- Scene 6: closing ---------- */
  (function () {
    const tl = Timeline();
    let thanks, end, lines = [];

    Story.register('closing', {
      init: function () {
        thanks = document.getElementById('closing-thanks');
        end = document.getElementById('closing-end');

        thanks.appendChild(p('eyebrow line', C.closing.intro));
        C.closing.lines.forEach(function (text) { thanks.appendChild(p('thanks-line line', text)); });
        lines = Array.from(thanks.querySelectorAll('.line'));

        document.getElementById('closing-photo').src = C.closing.photo;
        document.getElementById('closing-final').textContent = C.closing.final;
        document.getElementById('closing-replay').textContent = C.closing.replay;
      },
      enter: function () {
        Story.fx.start({ count: 44 });
        // 1) the thank-you lines arrive one by one
        lines.forEach(function (el, i) {
          tl.at(700 + i * 1500, function () { el.classList.add('is-in'); });
        });
        // 2) they fade away, 3) the photo and the final line take their place
        const done = 700 + lines.length * 1500 + 2200;
        tl.at(done, function () { thanks.classList.add('is-out'); });
        tl.at(done + 1000, function () { end.classList.add('is-in'); });
      },
      leave: function () {
        tl.clear();
        setTimeout(function () {
          lines.forEach(function (el) { el.classList.remove('is-in'); });
          thanks.classList.remove('is-out');
          end.classList.remove('is-in');
        }, 1000);
      }
    });
  })();
})();
