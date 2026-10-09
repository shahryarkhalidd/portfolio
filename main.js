/* =========================================================
   Shahryar Khalid | Portfolio interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const isDesktop = () => window.innerWidth > 900;
  const body = document.body;

  /* ---------------- Live clock (Lahore) ---------------- */
  (() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const els = $$('[data-clock]');
    const tick = () => { const s = fmt.format(new Date()); els.forEach((e) => (e.textContent = s)); };
    tick(); setInterval(tick, 1000);
  })();

  /* ---------------- Particle field ---------------- */
  const field = window.Field ? new window.Field($('#field')) : null;
  const fx = !reduced && window.FX ? new window.FX($('#fx')) : null;

  /* ---------------- Fallback without GSAP ---------------- */
  if (!window.gsap || !window.ScrollTrigger) {
    $('.preloader')?.remove();
    field?.setShape('sphere', { x: 0, y: 0, scale: 1, alpha: 0.6 });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Text splitting ---------------- */
  function splitChars(el) {
    const label = el.textContent.trim();
    const nodes = [...el.childNodes];
    const chars = [];
    el.textContent = '';
    nodes.forEach((n) => {
      if (n.nodeType !== 3) { el.appendChild(n); return; }
      const words = n.textContent.split(/(\s+)/);
      words.forEach((word) => {
        if (!word) return;
        if (/^\s+$/.test(word)) { el.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.setAttribute('aria-hidden', 'true');
        [...word].forEach((ch) => {
          const c = document.createElement('span');
          c.className = 'c';
          c.textContent = ch;
          w.appendChild(c);
          chars.push(c);
        });
        el.appendChild(w);
      });
    });
    if (!el.closest('[aria-label]')) el.setAttribute('aria-label', label);
    return chars;
  }

  function splitWords(el) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'word';
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  }

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  };

  /* ---------------- Scroll velocity ---------------- */
  let velocity = 0, smoothVel = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => { velocity = self.getVelocity(); field?.setVelocity(velocity); fx?.setVelocity(velocity); },
  });
  gsap.ticker.add(() => {
    velocity *= 0.9;
    smoothVel += (velocity - smoothVel) * 0.12;
  });

  /* ---------------- Anchor links ---------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      closeMenu();
      scrollTo(target);
    });
  });

  /* ---------------- Mobile menu ---------------- */
  const burger = $('.nav__burger');
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    $('.menu').setAttribute('aria-hidden', 'true');
    lenis?.start();
  }
  burger.addEventListener('click', () => {
    if (body.classList.contains('menu-open')) return closeMenu();
    body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    $('.menu').setAttribute('aria-hidden', 'false');
    lenis?.stop();
  });

  /* ---------------- Text scramble ---------------- */
  class Scramble {
    constructor(el) { this.el = el; this.chars = '!-_\\/[]{}=+*^?#01ABCDEF'; this.raf = 0; }
    set(text) {
      const old = this.el.textContent;
      const len = Math.max(old.length, text.length);
      this.queue = [];
      for (let i = 0; i < len; i++) {
        const start = Math.floor(Math.random() * 16);
        this.queue.push({ from: old[i] || '', to: text[i] || '', start, end: start + Math.floor(Math.random() * 18) + 4 });
      }
      cancelAnimationFrame(this.raf);
      this.frame = 0;
      return new Promise((res) => { this.done = res; this.update(); });
    }
    update() {
      let out = '', complete = 0;
      for (const q of this.queue) {
        if (this.frame >= q.end) { complete++; out += q.to; }
        else if (this.frame >= q.start) {
          if (!q.ch || Math.random() < 0.3) q.ch = this.chars[Math.floor(Math.random() * this.chars.length)];
          out += `<span class="scr">${q.ch}</span>`;
        } else out += q.from;
      }
      this.el.innerHTML = out;
      if (complete === this.queue.length) this.done();
      else { this.frame++; this.raf = requestAnimationFrame(() => this.update()); }
    }
  }

  // role cycler
  const roleEl = $('.scramble[data-roles]');
  if (roleEl) {
    const roles = JSON.parse(roleEl.dataset.roles);
    const sc = new Scramble(roleEl);
    let idx = 0;
    const next = () => { idx = (idx + 1) % roles.length; sc.set(roles[idx]).then(() => setTimeout(next, 2400)); };
    if (!reduced) setTimeout(next, 4800);
  }
  // nav hover scramble
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent;
    const sc = new Scramble(el);
    el.addEventListener('pointerenter', () => sc.set(text));
  });

  /* ---------------- Custom cursor ---------------- */
  if (finePointer && !reduced) {
    body.classList.add('has-cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const cursor = $('.cursor');
    window.addEventListener('pointermove', (e) => {
      if (!cursor.classList.contains('is-ready')) { gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); cursor.classList.add('is-ready'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    window.addEventListener('pointerdown', () => body.classList.add('cursor-down'));
    window.addEventListener('pointerup', () => body.classList.remove('cursor-down'));
    $$('a, button, [data-cursor], .chips li, .cert').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        body.classList.add('cursor-hover');
        if (el.dataset.cursor) { label.textContent = el.dataset.cursor; body.classList.add('cursor-label'); }
      });
      el.addEventListener('pointerleave', () => body.classList.remove('cursor-hover', 'cursor-label'));
    });
  }

  /* ---------------- Magnetic elements ---------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------- Spotlight + tilt ---------------- */
  $$('[data-tilt], [data-spot]').forEach((el) => {
    const tilt = el.hasAttribute('data-tilt') && finePointer && !reduced;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      if (tilt) gsap.to(el, { rotateY: (px - 0.5) * 14, rotateX: (0.5 - py) * 14, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
    });
    if (tilt) el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }));
  });

  /* ---------------- Copy email ---------------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1800);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); showToast('Email copied ✓'); }
    catch { showToast(b.dataset.copy); }
  }));

  /* ---------------- Simulated stream monitor ---------------- */
  (() => {
    const tp = $('[data-feed="tp"]'), lat = $('[data-feed="lat"]'), lag = $('[data-feed="lag"]');
    const line = $('.feed__spark polyline');
    if (!tp) return;
    const pts = Array.from({ length: 40 }, () => 20 + Math.random() * 10);
    let v = 12480;
    const fmt = new Intl.NumberFormat('en-US');
    const draw = () => line.setAttribute('points', pts.map((p, i) => `${(i / (pts.length - 1)) * 200},${40 - p}`).join(' '));
    draw();
    if (reduced) return;
    setInterval(() => {
      v = Math.max(8000, Math.min(18000, v + (Math.random() - 0.5) * 1400));
      tp.textContent = fmt.format(Math.round(v));
      lat.textContent = Math.round(34 + Math.random() * 22);
      lag.textContent = Math.random() < 0.8 ? 0 : Math.round(Math.random() * 40);
      pts.shift(); pts.push(((v - 8000) / 10000) * 30 + 5);
      draw();
    }, 650);
  })();

  /* ---------------- Field views per section ---------------- */
  const VIEWS = {
    sphere: { d: { x: 0.22, y: -0.04, scale: 1.05, alpha: 1, tilt: 0.3 }, m: { x: 0, y: -0.12, scale: 0.85, alpha: 0.75, tilt: 0.3 } },
    helix: { d: { x: 0, y: 0, scale: 1.25, alpha: 0.5, tilt: 0.15 }, m: { x: 0, y: 0, scale: 0.9, alpha: 0.35, tilt: 0.15 } },
    knot: { d: { x: 0.2, y: 0.12, scale: 0.95, alpha: 0.55, tilt: 0.5 }, m: { x: 0, y: 0, scale: 0.8, alpha: 0.35, tilt: 0.5 } },
    wave: { d: { x: 0, y: 0.18, scale: 1.25, alpha: 0.4, tilt: 0.55 }, m: { x: 0, y: 0.1, scale: 1, alpha: 0.3, tilt: 0.55 } },
    cube: { d: { x: 0.28, y: 0, scale: 0.85, alpha: 0.55, tilt: 0.45 }, m: { x: 0, y: 0, scale: 0.75, alpha: 0.35, tilt: 0.45 } },
    galaxy: { d: { x: 0.18, y: 0.02, scale: 1.15, alpha: 0.9, tilt: 0.7 }, m: { x: 0, y: -0.1, scale: 0.9, alpha: 0.6, tilt: 0.7 } },
  };
  let activeShapeSection = null;
  const applyField = (sec) => {
    if (!field || !sec) return;
    activeShapeSection = sec;
    const name = sec.dataset.shape;
    field.setShape(name, VIEWS[name][isDesktop() ? 'd' : 'm']);
  };
  window.addEventListener('resize', () => applyField(activeShapeSection));

  /* ---------------- Preloader ---------------- */
  function preloader() {
    return new Promise((resolve) => {
      const pre = $('.preloader');
      if (!pre || reduced) { pre?.remove(); resolve(); return; }
      lenis?.stop();
      window.scrollTo(0, 0);
      const num = $('.preloader__num'), bar = $('.preloader__bar span');
      const counter = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => { pre.remove(); lenis?.start(); },
      });
      tl.to($$('.preloader__log p'), { opacity: 1, duration: 0.25, stagger: 0.4, ease: 'none' }, 0.2)
        .to(counter, {
          v: 100, duration: 2.1, ease: 'power3.inOut',
          onUpdate: () => {
            num.textContent = String(Math.round(counter.v)).padStart(3, '0');
            bar.style.transform = `scaleX(${counter.v / 100})`;
          },
        }, 0)
        .to('.preloader__inner', { yPercent: -8, opacity: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
        .to('.preloader__curtain--b', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.15')
        .to('.preloader__curtain--a', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.85')
        .add(resolve, '-=0.75');
    });
  }

  /* ---------------- Hero intro ---------------- */
  const heroChars = $$('.hero__title [data-split-chars]').map((el) => splitChars(el));
  const heroFades = $$('[data-hero-fade]');
  if (!reduced) {
    gsap.set(heroChars.flat(), { yPercent: 115, rotate: 6 });
    gsap.set(heroFades, { y: 40, opacity: 0 });
    gsap.set('.nav', { yPercent: -120 });
    gsap.set('.hero__badge', { scale: 0, rotate: -90 });
  }

  function heroIntro() {
    applyField($('.hero'));
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => $('.hero__title').classList.add('is-free') });
    tl.to(heroChars[0], { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.045 }, 0)
      .to(heroChars[1], { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.045 }, 0.15)
      .to(heroFades, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'power3.out' }, 0.35)
      .to('.nav', { yPercent: 0, duration: 1.2, ease: 'power3.out' }, 0.5)
      .to('.hero__badge', { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.5)' }, 0.8);
  }

  /* ---------------- Scroll-driven scenes ---------------- */
  function scenes() {
    // progress bar
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // nav: hide on scroll down, active link
    const nav = $('.nav');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        nav.classList.toggle('is-hidden', self.direction === 1 && y > 400 && !body.classList.contains('menu-open'));
      },
    });
    // rotating badge reacts to scroll velocity
    const badge = $('.hero__badge svg');
    if (badge) {
      let rot = 0;
      gsap.ticker.add(() => { rot += 0.25 + Math.abs(smoothVel) * 0.004; badge.style.transform = `rotate(${rot}deg)`; });
    }

    // hero scroll-out: the name shatters into 3D fragments
    const shatter = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    if (!reduced) {
      shatter.fromTo(heroChars.flat(), {
        x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1, transformPerspective: 700,
      }, {
        x: () => gsap.utils.random(-window.innerWidth * 0.45, window.innerWidth * 0.45),
        y: () => gsap.utils.random(-window.innerHeight * 0.9, -window.innerHeight * 0.15),
        z: () => gsap.utils.random(-400, 420),
        rotationX: () => gsap.utils.random(-220, 220),
        rotationY: () => gsap.utils.random(-220, 220),
        opacity: 0,
        ease: 'power2.in',
        stagger: { each: 0.012, from: 'random' },
        immediateRender: false,
      }, 0);
    }
    shatter
      .fromTo('.hero__mid', { y: 0, opacity: 1, filter: 'blur(0px)' }, { y: -140, opacity: 0, filter: 'blur(8px)', ease: 'none', immediateRender: false }, 0)
      .to('.hero__top', { y: -60, opacity: 0, ease: 'none' }, 0)
      .to('.hero__badge', { scale: 2.4, rotate: 180, opacity: 0, ease: 'power1.in' }, 0);

    // marquee driven by scroll velocity
    $$('.marquee__row').forEach((row) => {
      const track = $('.marquee__track', row);
      track.innerHTML += track.innerHTML; // duplicate for seamless loop
      const dir = parseFloat(row.dataset.dir) || 1;
      let x = 0, sign = 1;
      gsap.ticker.add((_, delta) => {
        const half = track.scrollWidth / 2;
        if (!half) return;
        if (Math.abs(velocity) > 20) sign = velocity > 0 ? 1 : -1;
        const speed = (reduced ? 0 : 70) + Math.min(Math.abs(smoothVel) * 0.35, 1600);
        x -= dir * sign * speed * (delta / 1000);
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        const skew = gsap.utils.clamp(-12, 12, smoothVel * -0.006 * dir);
        track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
      });
    });

    // generic reveals
    gsap.set('[data-reveal]', { y: 60, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.1, overwrite: 'auto' }),
    });

    // about: each word decodes out of binary as you scroll
    const words = splitWords($('.about__text')).map((w) => {
      const text = w.textContent;
      const txt = document.createElement('span');
      const bin = document.createElement('span');
      txt.className = 'word__txt'; txt.textContent = text;
      bin.className = 'word__bin'; bin.setAttribute('aria-hidden', 'true');
      w.textContent = '';
      w.append(txt, bin);
      return { el: w, text, txt, bin, fit: 1, state: -1 };
    });
    // digits are wider than most letters: scale each word's binary so it fits the word's width
    const fitBinary = () => words.forEach((w) => {
      const prev = w.bin.textContent;
      w.bin.textContent = '0'.repeat(w.text.length);
      const bw = w.bin.offsetWidth, tw = w.txt.offsetWidth;
      w.bin.textContent = prev;
      w.fit = bw ? Math.min(1, tw / bw) : 1;
    });
    const binLen = (w, n) => Math.max(1, Math.floor(n * w.fit));
    const WINDOW = 6;
    const noise = (n) => { let o = ''; for (let k = 0; k < n; k++) o += Math.random() < 0.5 ? '0' : '1'; return o; };
    const decode = (p) => {
      const head = p * (words.length + WINDOW);
      words.forEach((w, i) => {
        const local = gsap.utils.clamp(0, 1, (head - i) / WINDOW);
        if (local <= 0) {
          if (w.state !== 0) { w.state = 0; w.bin.textContent = noise(binLen(w, w.text.length)); w.el.classList.add('is-decoding', 'is-encoded'); w.el.style.opacity = 0.22; }
        } else if (local >= 1) {
          if (w.state !== 2) { w.state = 2; w.el.classList.remove('is-decoding', 'is-encoded'); w.el.style.opacity = 1; }
        } else {
          w.state = 1;
          const shown = Math.floor(local * w.text.length);
          w.bin.textContent = w.text.slice(0, shown) + (shown < w.text.length ? noise(binLen(w, w.text.length - shown)) : '');
          w.el.classList.add('is-decoding');
          w.el.classList.remove('is-encoded');
          w.el.style.opacity = 0.4 + local * 0.6;
        }
      });
    };
    fitBinary();
    if (reduced) decode(1);
    else {
      decode(0);
      const aboutST = ScrollTrigger.create({
        trigger: '.about__text', start: 'top 80%', end: 'bottom 45%',
        onUpdate: (self) => decode(self.progress),
        onLeave: () => decode(1),
        onLeaveBack: () => decode(0),
      });
      document.fonts.ready.then(() => { fitBinary(); words.forEach((w) => { w.state = -1; }); decode(aboutST.progress); });
    }

    const mm = gsap.matchMedia();

    // --- Experience: horizontal pinned pipeline (desktop) ---
    mm.add('(min-width: 901px)', () => {
      const track = $('.pipeline__track');
      const distance = () => track.scrollWidth - window.innerWidth;
      const st = { trigger: '.pipeline', start: 'top top', end: () => `+=${distance()}`, scrub: 1, pin: '.pipeline__pin', invalidateOnRefresh: true, anticipatePin: 1 };
      const tween = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: st });

      gsap.to('.pipeline__rail-fill', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.pipeline', start: 'top top', end: () => `+=${distance()}`, scrub: 1 },
      });

      $$('.job, .panel--end').forEach((panel) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 78%', toggleActions: 'play none none reverse' },
        });
        tl.from($('.job__node', panel), { scale: 0, duration: 0.8, ease: 'back.out(3)' })
          .from(panel.querySelectorAll('.job__stage, .job__role, .job__co, .h-lg, .btn'), { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.1)
          .from(panel.querySelectorAll('.job__list li'), { x: 60, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0.25)
          .from(panel.querySelectorAll('.tags span'), { y: 20, opacity: 0, scale: 0.8, duration: 0.6, stagger: 0.04, ease: 'back.out(2)' }, 0.45);

        const year = $('.job__year', panel);
        if (year) {
          gsap.fromTo(year, { xPercent: 40 }, {
            xPercent: -40, ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        }
      });
    });

    // --- Experience: vertical (mobile) ---
    mm.add('(max-width: 900px)', () => {
      // start the vertical rail below the intro so it doesn't cut through the heading
      const rail = $('.pipeline__rail'), intro = $('.panel--intro');
      const placeRail = () => { rail.style.top = `${intro.offsetTop + intro.offsetHeight}px`; };
      placeRail();
      ScrollTrigger.addEventListener('refreshInit', placeRail);

      gsap.fromTo('.pipeline__rail-fill', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.pipeline', start: 'top 60%', end: 'bottom 60%', scrub: true },
      });
      $$('.job, .panel--end').forEach((panel) => {
        gsap.from(panel.children, {
          y: 40, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out',
          scrollTrigger: { trigger: panel, start: 'top 82%' },
        });
      });

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', placeRail);
        rail.style.top = '';
      };
    });

    // split headings assemble from letters scattered in 3D space
    // (created after the pinned section so their positions include the pin spacing)
    $$('[data-split-chars-scroll]').forEach((el) => {
      const chars = splitChars(el);
      chars.forEach((c, i) => c.style.setProperty('--ci', i));
      if (reduced) return;
      el.classList.add('assemble');
      gsap.fromTo(chars, {
        x: () => gsap.utils.random(-320, 320),
        y: () => gsap.utils.random(-220, 260),
        z: () => gsap.utils.random(-600, 300),
        rotationX: () => gsap.utils.random(-180, 180),
        rotationY: () => gsap.utils.random(-180, 180),
        rotation: () => gsap.utils.random(-60, 60),
        scale: () => gsap.utils.random(0.3, 2.2),
        opacity: 0,
        transformPerspective: 700,
      }, {
        x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 1, opacity: 1,
        ease: 'power3.out',
        stagger: { each: 0.025, from: 'random' },
        scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 55%', scrub: 1 },
      });
    });

    // --- Work: stacking cards ---
    const cards = $$('.card');
    cards.forEach((c, i) => c.style.setProperty('--i', i));
    mm.add('(min-width: 901px)', () => {
      cards.forEach((card, i) => {
        const inner = $('.card__inner', card);
        gsap.from(inner, {
          y: 120, rotateX: -18, opacity: 0, duration: 1.3, ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 95%' },
        });
        if (i === cards.length - 1) return;
        // dim + shrink only while the next card slides over this one
        const shade = document.createElement('div');
        shade.className = 'card__shade';
        inner.appendChild(shade);
        const st = {
          trigger: cards[i + 1], scrub: true,
          start: 'top 65%',
          end: () => `top ${Math.round(window.innerHeight * 0.11 + (i + 1) * 18)}px`,
        };
        gsap.fromTo(shade, { opacity: 0 }, { opacity: 0.55, ease: 'none', scrollTrigger: st });
        gsap.fromTo(inner, { scale: 1 }, { scale: 0.92 + i * 0.01, ease: 'none', immediateRender: false, scrollTrigger: { ...st } });
      });
    });
    mm.add('(max-width: 900px)', () => {
      cards.forEach((card) => gsap.from($('.card__inner', card), {
        y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%' },
      }));
    });

    // flow diagrams build themselves: node flips in, link draws down, next node...
    cards.forEach((card) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 72%', toggleActions: 'play none none reverse' } });
      $$('.flow > *', card).forEach((part) => {
        if (part.classList.contains('flow__link')) {
          tl.from(part, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.28, ease: 'power2.inOut' });
        } else {
          tl.from(part, { rotationX: -100, y: -20, opacity: 0, scale: 0.7, transformPerspective: 600, transformOrigin: '50% 0%', duration: 0.5, ease: 'back.out(2)' }, '-=0.04');
        }
      });
      tl.from($('.card__metric b', card), { scale: 0.4, opacity: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' }, 0.2);
    });

    // --- Stack rows ---
    $$('.srow').forEach((row) => {
      const st = (start, end) => ({ trigger: row, start, end, scrub: 1 });
      gsap.from($('.srow__line', row), { scaleX: 0, ease: 'none', scrollTrigger: st('top 98%', 'top 60%') });
      gsap.from($('.srow__cat', row), { x: -160, opacity: 0, skewX: 20, ease: 'power2.out', scrollTrigger: st('top 95%', 'top 62%') });
      if (reduced) return;
      gsap.from($$('.chips li', row), {
        x: () => gsap.utils.random(-window.innerWidth * 0.4, window.innerWidth * 0.4),
        y: () => gsap.utils.random(120, 480),
        rotation: () => gsap.utils.random(-140, 140),
        scale: () => gsap.utils.random(0.2, 1.8),
        opacity: 0,
        ease: 'power3.out',
        stagger: { each: 0.03, from: 'random' },
        scrollTrigger: st('top 100%', 'top 52%'),
      });
    });
    gsap.from('.srow__line--last', { scaleX: 0, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: '.srow__line--last', start: 'top 95%' } });

    // --- Contact headline: masked lines rise with scroll ---
    $$('.contact__line > span').forEach((s) => {
      gsap.fromTo(s, { yPercent: 110, rotate: 4 }, {
        yPercent: 0, rotate: 0, ease: 'none',
        scrollTrigger: { trigger: '.contact__title', start: 'top 95%', end: 'top 45%', scrub: 1 },
      });
    });
    gsap.from('.contact__actions > *, .contact__links a', {
      y: 50, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact__actions', start: 'top 90%' },
    });

    // --- Contact portal opens behind the headline ---
    if (!reduced) {
      gsap.fromTo('.contact__portal', { scale: 0, rotate: -120 }, {
        scale: 1, rotate: 0, ease: 'none',
        scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: 1 },
      });
      gsap.to('.contact__portal i:nth-child(1)', { rotate: 360, duration: 24, repeat: -1, ease: 'none' });
      gsap.to('.contact__portal i:nth-child(2)', { rotate: -360, duration: 60, repeat: -1, ease: 'none' });
    }

    // --- Jelly: big type bends with scroll speed ---
    if (!reduced) {
      const skewY = gsap.quickSetter($$('.about__text, .work__head, .stack__head, .contact__title, .footer__big'), 'skewY', 'deg');
      const skewX = gsap.quickSetter($$('.pipeline .panel'), 'skewX', 'deg');
      gsap.ticker.add(() => {
        skewY(gsap.utils.clamp(-7, 7, smoothVel * -0.0035));
        skewX(isDesktop() ? gsap.utils.clamp(-10, 10, smoothVel * -0.004) : 0);
      });
    }

    // --- Footer giant name ---
    gsap.from('.footer__big', {
      yPercent: 60, letterSpacing: '0.05em', ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });

    // created after the pinned section so their positions include the pin spacing
    $$('.nav__links a').forEach((a) => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => a.classList.toggle('is-active', self.isActive),
      });
    });

    // particle shape per section
    $$('[data-shape]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => self.isActive && applyField(sec),
      });
    });


    // refresh once fonts are ready (sizes change)
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------- Boot ---------------- */
  if (reduced) {
    scenes();
    heroIntro();
  } else {
    scenes();
    preloader().then(heroIntro);
  }
})();
