/* =========================================================
   content.js: EVERY WORD on the site lives here.
   Edit the text between the quotes, save, refresh. Nothing else to touch.
   (These are drafts. Change anything so it sounds like you.)
   ========================================================= */
(function () {
  'use strict';

  const Story = window.Story = window.Story || {};

  Story.content = {

    her: {
      fullName: 'Nicolah Juliene Miranda Espiritu',
      nickname: 'Iyah',
      birthday: '2005-11-24'            // she turns 21 on November 24, 2026
    },

    /* ---------- Scene 1: the two of us in front of the museum ---------- */
    opening: {
      eyebrow: 'For Iyah',
      title: 'Two people, one story',
      hint: 'Bring us together',
      hintSub: 'Drag us closer',
      joinedDate: 'April 19, 2026',
      joinedLine: 'Where our story began.',
      button: 'Continue',
      herLabel: 'Her. Drag toward him, or press Enter to step closer.',
      himLabel: 'Him. Drag toward her, or press Enter to step closer.'
    },

    /* ---------- Scene 2: the bouquet ---------- */
    flower: {
      caption: 'The first flowers I ever gave you.',
      sub: 'April 19, 2026',
      button: 'Continue'
    },

    /* ---------- Scene 4: the greeting ---------- */
    greeting: {
      eyebrow: 'November 24',
      title: 'Happy Birthday, My Love',
      subtitle: 'For Iyah, on her twenty-first',
      button: 'Click here for your message'
    },

    /* ---------- Scene 5: the letter (one string = one paragraph) ---------- */
    letter: {
      salutation: 'To Iyah,',
      paragraphs: [
        'Happy 21st birthday, baby!',

        'It’s been 8 months since the first time we met. Back then, we were just two strangers: someone who was looking for love and someone who just wanted a friend.',

        'And because I almost ignored it, I guess that was when the plot twist you’ve been waiting for finally began.',

        'I still remember those times when we were just starting. I would get anxious, wondering if you’d ever get tired of the way I communicated with you. I’d think, “Will another boring conversation make her lose interest in replying to me?” Because back then, I already liked you. I felt that there was something between us, a connection that brought me so much joy, especially whenever you laughed at my silly jokes.',

        'I also still remember that afternoon when I bought you flowers and waited for you at McDonald’s. I was really nervous at that time. And when I finally saw you in your black dress, I was trying my best not to let my nervousness show. Though I know you probably noticed anyway.',

        'You were so beautiful on our first date that you made me stutter. All I could do was awkwardly hug you and tell you how pretty you looked. I honestly didn’t know what else to say. And that very moment became one of my core memories.',

        'Fast forward to today, as I’m writing this letter, I’m about to celebrate your special day with you, not just as someone who likes you, not just as a friend, but as your boyfriend. And honestly, I couldn’t be happier.',

        'Thank you for being patient with me, with loving me, and with us.',

        'Thank you for being careful with what we have and for always treating our relationship with love and care.',

        'Thank you for being the best friend I can turn to when times get tough and for always being by my side.',

        'Thank you for making me feel safe whenever I’m with you and for making me feel like I never have to be anyone else.',

        'And most importantly, thank you for choosing me, every single day.',

        'Today is about you. The person you are and the person you’re continuing to become. I hope this year is kind to you. I hope you get everything you’ve been working and wishing for. And I hope I get to be right there beside you, cheering the loudest for every little and big victory you achieve.',

        'They say that choosing someone to spend your future with is a gamble, a risk you’re willing to take. But if there’s one thing I want you to know, it’s that I’m willing to take that risk with you. And I’ll do everything I can to make sure that choosing us will always be worth it. I want to be someone who makes you feel that you made the right choice, someone who will keep choosing you through every season of life.',

        'Happy 21st birthday, Iyah ko.',

        'I love you so much, and I’m so grateful that out of all the people we could have been, we became us.'
      ],
      signoff: 'Always yours,',
      signature: 'Ybrahim'
    },

    /* ---------- Scene 6: closing (lines appear one at a time) ---------- */
    closing: {
      intro: 'Thank you, Iyah',
      lines: [
        'for being patient with me, and with us',
        'for how carefully you hold what we have',
        'for always being by my side',
        'for loving me',
        'for being where I feel safe'
      ],
      photo: 'assets/memories/11-c.jpg', // the picture of you two shown at the end (pick any)
      final: 'Happy birthday, Iyah. I’m so grateful that I get to share this story with you.',
      replay: 'Replay our story'
    },

    /* ---------- Scene 3: memories, in story order ----------
       Captions are DRAFT guesses from what is in each picture,
       so rewrite them in your own words. To add a photo later: save it
       as a .jpg in assets/memories/ and add one line here, in order. */
    memoriesHeading: 'Our memories',
    memoriesContinue: 'Continue',
    memories: [
      { src: 'assets/memories/01-first-date-b.jpg', date: 'April 19, 2026',     caption: 'The photobooth, the flowers, and you.' },
      { src: 'assets/memories/01-first-date-a.jpg', date: 'April 19, 2026',     caption: 'First date. Already being ourselves.' },
      { src: 'assets/memories/02-a.jpg',            date: 'May 4, 2026',        caption: 'Date two.' },
      { src: 'assets/memories/02-b.jpg',            date: 'May 4, 2026',        caption: 'Us, apparently. You look cute there.' },
      { src: 'assets/memories/03-a.jpg',            date: 'June 13, 2026',      caption: 'We look so cute together.' },
      { src: 'assets/memories/03-b.jpg',            date: 'June 13, 2026',      caption: 'Peace signs.' },
      { src: 'assets/memories/04-a.jpg',            date: 'June 27, 2026',      caption: 'Caught on your little pink camera.' },
      { src: 'assets/memories/04-b.jpg',            date: 'June 27, 2026',      caption: 'Mirror picture hehe' },
      { src: 'assets/memories/05-a.jpg',            date: 'July 31, 2026',      caption: 'Three thumbs up.' },
      { src: 'assets/memories/05-b.jpg',            date: 'July 31, 2026',      caption: 'It\u2019s our pet on TikTok hehe' },
      { src: 'assets/memories/06-a.jpg',            date: 'August 11, 2026',    caption: 'Welcome to Siyibullee!!' },
      { src: 'assets/memories/06-b.jpg',            date: 'August 11, 2026',    caption: 'Full and happy.' },
      { src: 'assets/memories/07-a.jpg',            date: 'August 17, 2026',    caption: 'My favorite place to be.' },
      { src: 'assets/memories/07-b.jpg',            date: 'August 17, 2026',    caption: 'Movie plus cuddles.' },
      { src: 'assets/memories/08-a.jpg',            date: 'September 17, 2026', caption: 'Pancakes!!!' },
      { src: 'assets/memories/08-b.jpg',            date: 'September 17, 2026', caption: 'Syempre ikaw lang ang aking iibigin, ang aking hahanapin.' },
      { src: 'assets/memories/09-a.jpg',            date: 'September 30, 2026', caption: 'Arcade date.' },
      { src: 'assets/memories/09-b.jpg',            date: 'September 30, 2026', caption: 'Our two bunnies.' },
      { src: 'assets/memories/10-a.jpg',            date: 'October 21, 2026',   caption: 'Painting with you.' },
      { src: 'assets/memories/10-b.jpg',            date: 'October 21, 2026',   caption: 'Being kupal with you is one of my favorite things.' },
      { src: 'assets/memories/11-a.jpg',            date: 'November 18, 2026', caption: 'Our latest date.' },
      { src: 'assets/memories/11-b.jpg',            date: 'November 18, 2026', caption: 'Candles, tulips, and us.' },
      { src: 'assets/memories/11-c.jpg',            date: 'November 18, 2026', caption: 'My favorite picture of us so far.' }
    ]
  };
})();
