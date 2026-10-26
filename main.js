/* Noyau commun du motion : scroll fluide, titres masqués, apparitions, compteurs.
   Tout ce qui est propre au site est dans la partie "SITE" plus bas. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* accordéon : fonctionne même sans animation */
  $$('.acc__h').forEach(b => b.addEventListener('click', () => {
    const a = b.closest('.acc'), open = !a.classList.contains('is-open');
    a.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  }));

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || reduce) {
    root.classList.remove('js'); window.__ready = true; return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const desktop = matchMedia('(min-width:901px)').matches;
    const hover = matchMedia('(hover:hover)').matches;

    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { duration: 1.3, offset: 0 });
    }));

    /* barre du haut, progression, lien actif */
    const top = $('[data-top]'), prog = $('[data-progress]');
    const links = $$('[data-nav] a[href^="#"]');
    const secs = links.map(a => $(a.getAttribute('href')));
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        if (top) top.classList.toggle('is-solid', self.scroll() > 24);
        if (prog) gsap.set(prog, { scaleX: self.progress });
        const line = innerHeight * 0.4;
        secs.forEach((s, i) => {
          if (!s) return;
          const r = s.getBoundingClientRect();
          links[i].classList.toggle('is-active', r.top <= line && r.bottom >= line);
        });
      }
    });

    /* titres : lignes masquées */
    $$('[data-split]').forEach(el => {
      const d = parseFloat(el.dataset.delay || 0);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          return gsap.from(self.lines, { yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: d,
            scrollTrigger: { trigger: el, start: 'top 90%' } });
        }
      });
    });

    /* apparitions par lots */
    const items = $$('[data-r]');
    gsap.set(items, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true })
    });

    /* compteurs */
    $$('[data-count]').forEach(el => {
      const end = parseInt(el.dataset.count, 10), o = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 1.8, delay: 0.3, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });

    /* boutons magnétiques */
    if (hover) $$('.btn').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', e => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
      btn.addEventListener('mouseleave', () => { x(0); y(0); });
    });

    /* ===== SITE ===== */
    /* paragraphe : les mots se révèlent au fil du défilement */
    const sc = $('[data-scrub]');
    if (sc) {
      SplitText.create(sc, { type: 'words', wordsClass: 'w', onSplit(self) {
        gsap.set(sc, { visibility: 'visible' });
        return gsap.fromTo(self.words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: sc, start: 'top 82%', end: 'bottom 48%', scrub: true } });
      }});
    }
    /* portrait en arche : il se lève, puis flotte légèrement */
    gsap.from('.arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 18px 18px)', duration: 1.5, ease: 'expo.inOut', delay: 0.3 });
    gsap.from('.arch img', { scale: 1.3, duration: 1.9, ease: 'power3.out', delay: 0.3 });
    gsap.from('.badge', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)', delay: 1.3 });
    if (desktop) gsap.to('.hero__ph', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    /* deux métiers : les cartes arrivent en s'empilant */
    $$('.metiers__list article').forEach((a, i) => gsap.from(a, { y: 80, rotate: i ? 1.2 : -1.2, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: a, start: 'top 88%' } }));
    /* barres de langue */
    $$('.lang i').forEach(i => ScrollTrigger.create({ trigger: i, start: 'top 95%', once: true,
      onEnter: () => gsap.fromTo(i, { '--p': 0 }, { '--p': 1, duration: 1.4, ease: 'power3.out' }) }));
    /* ===== FIN SITE ===== */
  });

  const refresh = () => ScrollTrigger.refresh();
  addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.__ready = true;
})();
