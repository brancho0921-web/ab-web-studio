// AB Web Studio. El cursor del logo es el hilo: escribe el título, se estira hasta volverse la página
// de las demos, reescribe el nombre de cada demo y sigue al mouse. Sin JavaScript, sin GSAP o con
// movimiento reducido, todo el contenido queda visible y las demos se ven como tarjetas.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger, Lenis } = window;
const root = document.documentElement;
root.classList.add('js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Menú del teléfono
const menuBtn = $('#menu-btn'), nav = $('#nav');
const closeMenu = () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menú'; };
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Cerrar' : 'Menú';
});
$$('a', nav).forEach((a) => a.addEventListener('click', closeMenu));

// Datos de las demos
const DEMOS = [
  { name: 'Sharp Society', kind: 'Barbería', url: 'https://brancho0921-web.github.io/navaja-58-demo/', feats: ['Navaja 3D que acompaña el recorrido', 'Vitrina de cortes con transición de tajo', 'Reserva por WhatsApp con el corte elegido'] },
  { name: 'Ceniza', kind: 'Restaurante', url: 'https://brancho0921-web.github.io/brasa-nativa-demo/', feats: ['Brasas en 3D que se apartan del cursor', 'Carta que se abre como un libro', 'Pedidos con total y dirección por WhatsApp'] },
  { name: 'Molar Studio', kind: 'Clínica dental', url: 'https://brancho0921-web.github.io/lumina-dental-demo/', feats: ['Muela 3D que se abre por capas', 'La caries se cura con el scroll', 'Citas por WhatsApp con día y hora'] },
];

// Videos: solo corren los que se ven
const playIfVisible = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target;
  if (e.isIntersecting && !v.hidden && v.dataset.on !== '0') { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
}), { threshold: 0.2 });
$$('.cards video').forEach((v) => playIfVisible.observe(v));

// ---------- Puntos del inicio: una retícula que respira y se abre alrededor del mouse ----------
(function dots() {
  const canvas = $('.dots'), ctx = canvas.getContext('2d');
  let w, h, dpr, pts = [], mx = -999, my = -999, on = true, raf = 0;
  const gap = () => (innerWidth < 700 ? 26 : 34);
  function resize() {
    dpr = Math.min(devicePixelRatio, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    pts = [];
    const g = gap();
    for (let y = g / 2; y < h; y += g) for (let x = g / 2; x < w; x += g) pts.push(x, y);
  }
  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i], y = pts[i + 1];
      const d = Math.hypot(x - mx, y - my);
      const near = Math.max(0, 1 - d / 180);
      const wave = reduce ? 0 : (Math.sin(x * 0.012 + y * 0.008 - t * 0.0012) + 1) / 2;
      const a = 0.08 + wave * 0.1 + near * 0.6;
      const r = 1 + near * 2.2;
      ctx.fillStyle = `rgba(245,245,244,${a})`;
      ctx.beginPath(); ctx.arc(x + (x - mx) * near * 0.12, y + (y - my) * near * 0.12, r, 0, 6.283); ctx.fill();
    }
    if (on && !reduce) raf = requestAnimationFrame(draw);
  }
  resize(); draw(0);
  addEventListener('resize', () => { resize(); if (reduce) draw(0); });
  if (finePointer) addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on && !reduce) raf = requestAnimationFrame(draw); }).observe(canvas);
})();

// ---------- Escritura ----------
// Parte un título en letras (las palabras no se cortan) y deja un cursor al final
function letters(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars = [];
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) { el.append(' '); return; }
    const word = document.createElement('span');
    word.style.whiteSpace = 'nowrap';
    word.setAttribute('aria-hidden', 'true');
    [...part].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.append(s); chars.push(s); });
    el.append(word);
  });
  const caret = document.createElement('span');
  caret.className = 'type-caret'; caret.setAttribute('aria-hidden', 'true');
  return { chars, caret };
}
async function type(el, { speed = 42 } = {}) {
  const { chars, caret } = letters(el);
  chars.forEach((c) => c.classList.add('is-hidden'));
  chars[0].before(caret);
  await sleep(450);
  for (const c of chars) {
    c.classList.remove('is-hidden');
    c.after(caret);
    // ritmo humano: más pausa después de un espacio o un punto
    const pause = c.textContent === '.' ? 220 : c.parentElement.lastChild === c ? 70 : 0;
    await sleep(speed * (0.6 + Math.random() * 0.8) + pause);
  }
  caret.classList.add('blinking');
  return caret;
}

if (reduce || !gsap || !ScrollTrigger) {
  const { caret } = letters($('#hero-title'));
  $('#hero-title').append(caret);
  caret.classList.add('type-caret', 'blinking');
} else start();

function start() {
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';
  const phone = () => innerWidth <= 900;

  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.4 }); }
    }));
  }

  // Títulos de sección: palabras que suben desde una máscara
  function words(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const out = [];
    const wrap = (text, parent) => text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { parent.append(' '); return; }
      const m = document.createElement('span'); m.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em';
      const i = document.createElement('span'); i.style.display = 'inline-block'; i.textContent = part; i.setAttribute('aria-hidden', 'true');
      m.append(i); parent.append(m); out.push(i);
    });
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); wrap(n.textContent, f); n.replaceWith(f); }
      else { const t = n.textContent; n.textContent = ''; wrap(t, n); }
    });
    return out;
  }
  const enter = (targets, trigger, o = {}) => gsap.fromTo(targets, { y: o.y ?? 40, opacity: 0 }, { y: 0, opacity: 1, duration: o.duration ?? 1, ease, stagger: o.stagger ?? 0.08, scrollTrigger: { trigger, start: o.start ?? 'top 80%', once: true } });
  $$('main h2').forEach((h) => gsap.fromTo(words(h), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease, stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 85%', once: true } }));

  // ---------- Inicio: el título se escribe solo ----------
  gsap.set(['.hero-lead', '.hero-actions'], { opacity: 0, y: 24 });
  gsap.fromTo('.bar', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease, delay: 0.2 });
  const typed = type($('#hero-title'), { speed: phone() ? 34 : 42 }).then((caret) => {
    gsap.to(['.hero-lead', '.hero-actions'], { opacity: 1, y: 0, duration: 1, ease, stagger: 0.12 });
    return caret;
  });

  // La barra cambia de tinta sobre las secciones blancas
  const bar = $('#bar'), lights = $$('.demos, .plans, .process, .faq');
  let onLight = false;
  const tint = () => {
    onLight = lights.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 38 && r.bottom > 38; });
    bar.classList.toggle('on-light', onLight);
    bar.classList.toggle('is-scrolled', scrollY > 40);
  };
  addEventListener('scroll', tint, { passive: true });
  ScrollTrigger.addEventListener('refresh', tint);

  // ---------- Del cursor a la página blanca ----------
  const wipe = $('.wipe');
  let caretBox = null;
  const measure = () => {
    // solo cuando el título terminó de escribirse; mientras tanto la barra sale del centro
    const c = $('#hero-title .type-caret.blinking');
    if (!c) return;
    const r = c.getBoundingClientRect();
    caretBox = { t: r.top, l: r.left, b: innerHeight - r.bottom, r: innerWidth - r.right };
  };
  typed.then(measure);
  addEventListener('resize', () => { caretBox = null; });
  const grow = gsap.parseEase('power3.inOut');
  const heroOut = gsap.timeline({ paused: true }).to('.hero-body', { scale: 0.94, opacity: 0, ease: 'power2.in', duration: 0.7 }).to({}, { duration: 0.3 });
  let heroP = 0;
  // la barra crece desde el cursor; ya completa, cubre solo lo que queda arriba de las demos
  function paintWipe() {
    const demosTop = $('.demos').getBoundingClientRect().top;
    if (heroP <= 0.001 || demosTop <= 0) { wipe.style.visibility = 'hidden'; return; }
    wipe.style.visibility = 'visible';
    if (heroP < 0.999) {
      if (!caretBox) measure();
      const k = 1 - grow(heroP), c = caretBox || { t: innerHeight / 2, r: innerWidth / 2, b: innerHeight / 2, l: innerWidth / 2 };
      wipe.style.clipPath = `inset(${c.t * k}px ${c.r * k}px ${Math.max(c.b * k, innerHeight - demosTop)}px ${c.l * k}px)`;
    } else wipe.style.clipPath = `inset(0px 0px ${Math.max(0, innerHeight - demosTop)}px 0px)`;
  }
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: () => '+=' + innerHeight * (phone() ? 0.7 : 0.9), pin: true, scrub: 0.6, animation: heroOut, refreshPriority: 2,
    onUpdate: (st) => {
      heroP = st.progress;
      paintWipe();
      if (heroP > 0.6) bar.classList.add('on-light'); else tint();
    },
  });
  addEventListener('scroll', paintWipe, { passive: true });

  // ---------- Demos ----------
  gsap.matchMedia().add('(min-width: 901px) and (min-height: 620px)', () => {
    const demos = $('.demos');
    demos.classList.add('has-stage');
    const stage = $('#stage'), name = $('#demo-name');
    const screens = $$('.screen', stage);
    let current = -1, token = 0, stageSeen = false;
    // los videos del escenario cargan y corren solo cuando el escenario está cerca
    const near = new IntersectionObserver(([e]) => {
      stageSeen = e.isIntersecting;
      screens.filter((v) => v.dataset.on === '1').forEach((v) => { if (stageSeen) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); });
    }, { rootMargin: '30% 0px' });
    near.observe(stage);

    async function retype(text, my) {
      const caret = document.createElement('span'); caret.className = 'type-caret';
      name.setAttribute('aria-label', text);
      name.append(caret);
      // borra letra por letra
      while (name.firstChild !== caret) {
        if (my !== token) return;
        const t = name.firstChild;
        if (t.nodeType === 3 && t.textContent.length > 1) t.textContent = t.textContent.slice(0, -1);
        else t.remove();
        await sleep(22);
      }
      for (const ch of text) {
        if (my !== token) return;
        caret.before(ch);
        name.normalize();
        await sleep(48 + Math.random() * 40);
      }
      await sleep(500);
      if (my === token) caret.remove();
    }
    function show(i) {
      if (i === current) return;
      const prev = current; current = i;
      const d = DEMOS[i], my = ++token;
      retype(d.name, my);
      gsap.fromTo(['#demo-kind', '#demo-feats li', '#demo-link'], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease, stagger: 0.05, overwrite: true, onStart: () => {
        $('#demo-kind').textContent = d.kind;
        $$('#demo-feats li').forEach((li, j) => (li.textContent = d.feats[j]));
        $('#demo-link').href = d.url; $('#devices').href = d.url;
      } });
      $$('.demo-tabs button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.go === i)));
      // la pantalla nueva entra con un corte diagonal sobre la anterior
      screens.forEach((v) => {
        const k = +v.dataset.demo;
        if (k === i) {
          v.dataset.on = '1'; v.style.zIndex = 2;
          if (stageSeen) { v.preload = 'auto'; v.play().catch(() => {}); }
          gsap.fromTo(v, { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 120% 100%)' }, { clipPath: 'polygon(-20% 0, 100% 0, 100% 100%, 0% 100%)', duration: prev < 0 ? 0 : 0.9, ease: 'power3.inOut' });
        } else {
          v.dataset.on = '0'; v.style.zIndex = k === prev ? 1 : 0;
          if (k === prev) gsap.delayedCall(0.9, () => { if (current !== k) v.pause(); });
          else v.pause();
        }
      });
      gsap.fromTo('.phone', { y: 30, rotate: 2 }, { y: 0, rotate: 0, duration: 1.1, ease });
    }
    const st = ScrollTrigger.create({
      trigger: stage, start: 'top top', end: () => '+=' + innerHeight * 2.2, pin: true, refreshPriority: 1,
      onUpdate: (s) => show(Math.min(2, Math.floor(s.progress * 3))),
      onEnter: () => show(Math.max(current, 0)),
    });
    show(0);
    $$('.demo-tabs button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.go, y = st.start + (st.end - st.start) * ((i + 0.5) / 3);
      lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
    }));
    // los dispositivos se inclinan un poco con el mouse
    if (finePointer) {
      const dev = $('#devices');
      const rx = gsap.quickTo(dev, 'rotationY', { duration: 0.8, ease: 'power3' }), ry = gsap.quickTo(dev, 'rotationX', { duration: 0.8, ease: 'power3' });
      gsap.set(dev, { transformPerspective: 1400 });
      stage.addEventListener('pointermove', (e) => { rx((e.clientX / innerWidth - 0.5) * 8); ry((e.clientY / innerHeight - 0.5) * -6); });
    }
    gsap.fromTo(['.laptop', '.phone'], { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease, stagger: 0.15, scrollTrigger: { trigger: stage, start: 'top 70%', once: true } });
    return () => { demos.classList.remove('has-stage'); near.disconnect(); screens.forEach((v) => v.pause()); };
  });
  $$('.card').forEach((c) => {
    gsap.fromTo(c, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease, scrollTrigger: { trigger: c, start: 'top 88%', once: true } });
  });
  enter('.demos-head .lead', '.demos-head');

  // ---------- Del clic al WhatsApp ----------
  // la hoja negra entra creciendo desde una tarjeta redondeada
  $$('.flow, .end').forEach((s) => gsap.fromTo(s, { clipPath: 'inset(0% 5% 0% 5% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 20%', scrub: true } }));
  const lines = $('.bubble-text');
  const lineEls = lines.textContent.split('\n').map((t) => { const s = document.createElement('span'); s.style.display = 'block'; s.textContent = t; return s; });
  lines.textContent = ''; lines.append(...lineEls);
  const steps = $$('.fstep');
  const mark = (i) => steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
  gsap.set('.bubble', { opacity: 0, scale: 0.6, transformOrigin: '100% 100%' });
  const flow = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  flow.call(() => mark(0), null, 0)
    .fromTo('.order', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease }, 0)
    .fromTo('.order-list li', { x: -16, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.12, duration: 0.5 }, 0.2)
    .fromTo('.chat', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease }, 2.3)
    .fromTo('.pointer', { x: 140, y: 120, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.9 }, 1)
    .call(() => mark(1), null, 1.6)
    .to('.order-btn', { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 1.9)
    .to('.pointer', { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 }, 1.9)
    .to('.order', { x: () => (phone() ? 20 : 60), y: () => (phone() ? 60 : 90), scale: 0.35, opacity: 0, duration: 0.8, ease: 'power3.in' }, 2.2)
    .to('.pointer', { opacity: 0, duration: 0.3 }, 2.3)
    .call(() => mark(2), null, 2.9)
    .to('.bubble', { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' }, 2.9)
    .fromTo(lineEls, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.4 }, 3.1)
    .fromTo('.ticks', { opacity: 0 }, { opacity: 0.55, duration: 0.3 }, 3.9);
  gsap.matchMedia()
    .add('(min-width: 901px)', () => { ScrollTrigger.create({ trigger: '.flow-inner', start: 'top top', end: () => '+=' + innerHeight * 1.4, pin: true, scrub: 0.6, animation: flow, refreshPriority: 1 }); })
    .add('(max-width: 900px)', () => { flow.pause(0); ScrollTrigger.create({ trigger: '.flow-art', start: 'top 70%', once: true, onEnter: () => flow.play(0) }); });

  // ---------- Planes ----------
  gsap.fromTo('.plan', { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease, stagger: 0.12, scrollTrigger: { trigger: '.plan-grid', start: 'top 80%', once: true } });
  $$('.plan-price b').forEach((b) => {
    const n = { v: 0 }, to = +b.dataset.n;
    gsap.to(n, { v: to, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 85%', once: true }, onUpdate: () => (b.textContent = Math.round(n.v)) });
  });
  enter('.plans-head .lead', '.plans-head');

  // ---------- Proceso: el cursor recorre los 5 días ----------
  const days = $$('.day');
  gsap.matchMedia().add('(min-width: 901px)', () => {
    gsap.set(days, { opacity: 0.25 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.process', start: 'top 55%', end: 'bottom 75%', scrub: 0.6, onUpdate: (s) => days.forEach((d, i) => gsap.to(d, { opacity: s.progress * 5 > i - 0.2 ? 1 : 0.25, duration: 0.3, overwrite: 'auto' })) } });
    tl.fromTo('.track-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0).fromTo('.track-caret', { left: '0%' }, { left: '100%', ease: 'none' }, 0);
  });
  enter(days, '.days', { stagger: 0.1 });
  enter('.faq details', '.faq-list', { y: 24, stagger: 0.06 });

  // ---------- Cierre ----------
  gsap.fromTo('.end-logo', { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.end', start: 'top 85%', end: 'top 15%', scrub: true } });

  // ---------- Cursor propio y botones magnéticos ----------
  if (finePointer) {
    root.classList.add('has-cursor');
    const cur = $('.cursor'), label = $('.cursor-label');
    const x = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' }), y = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
    addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      cur.classList.toggle('is-label', !!t);
      label.textContent = t ? t.dataset.cursor : '';
    });
    document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1, duration: 0.2 }));
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // las secciones fijadas se miden primero; lo demás después, ya con su espacio sumado
  ScrollTrigger.sort();
  addEventListener('load', () => ScrollTrigger.refresh());
}
