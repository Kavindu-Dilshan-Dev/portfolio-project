/* ===========================================================
   UI interactions: nav, scroll reveal, typed role, tilt cards,
   scroll progress, active section highlighting.
   =========================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Current year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Light / dark theme toggle (persisted in localStorage) ---- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  let theme = root.getAttribute('data-theme') || 'dark';
  function applyTheme(t) {
    theme = t;
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
    if (themeBtn) themeBtn.textContent = t === 'light' ? '☀️' : '🌙';
    if (typeof window.__updateSceneTheme === 'function') window.__updateSceneTheme(t);
  }
  applyTheme(theme); // sync icon + scene on load
  if (themeBtn) {
    themeBtn.addEventListener('click', () => applyTheme(theme === 'light' ? 'dark' : 'light'));
  }

  /* ---- Sticky nav background + scroll progress ---- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
      })
    );
  }

  /* ---- Scroll-reveal via IntersectionObserver ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---- Active nav link based on section in view ---- */
  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('id');
            navAnchors.forEach((a) =>
              a.classList.toggle('active', a.getAttribute('href') === '#' + id)
            );
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Typewriter for the hero role ---- */
  const typedEl = document.getElementById('typed');
  if (typedEl) {
    const phrases = [
      'QA Automation Engineer',
      'Aspiring SDET',
      'AI-Augmented Testing',
      'Playwright · Rest Assured · Appium',
      'Quality from Code to Cloud',
    ];
    if (reduceMotion) {
      typedEl.textContent = phrases[0];
    } else {
      let pi = 0, ci = 0, deleting = false;
      const tick = () => {
        const word = phrases[pi];
        typedEl.textContent = word.slice(0, ci);
        if (!deleting && ci < word.length) {
          ci++; setTimeout(tick, 70);
        } else if (!deleting && ci === word.length) {
          deleting = true; setTimeout(tick, 1600);
        } else if (deleting && ci > 0) {
          ci--; setTimeout(tick, 35);
        } else {
          deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 250);
        }
      };
      tick();
    }
  }

  /* ---- 3D tilt + glow on project cards ---- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach((card) => {
      const MAX = 9; // degrees
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * MAX * 2;
        const ry = (px - 0.5) * MAX * 2;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }
})();
