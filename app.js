/* Karen Khashkhashyan · portfolio behaviour
   i18n → work grid (tabs, filters) → reels → case study → timeline → motion.
   Motion uses GSAP (ScrollTrigger, Flip) and Lenis from assets/vendor; the page works without them. */
(() => {
  'use strict';

  const I18N = window.I18N;
  const PROJECTS = window.PROJECTS;
  const LANGS = ['en', 'hy', 'ru'];
  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

  const gsap = window.gsap;
  const hasGsap = Boolean(gsap && window.ScrollTrigger && window.Flip);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger, Flip);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionOK = () => hasGsap && !reducedMotion.matches;

  const bySlug = Object.fromEntries(PROJECTS.map((p, i) => [p.slug, { p, i }]));
  const isSportsbook = (p) => p.category === 'sportsbook';
  const GAMES = PROJECTS.filter((p) => !isSportsbook(p));

  /* ---------------- i18n ---------------- */

  let lang = 'en';
  const t = (key, vars) => {
    let s = I18N[lang]?.[key] ?? I18N.en[key] ?? '';
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    return s;
  };
  const text = (v) => (v == null ? '' : typeof v === 'string' ? v : v[lang] ?? v.en);
  const englishOnly = (v) => typeof v === 'string' && lang !== 'en';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = (html) => html.split(/<br\s*\/?>/i).map((l) => `<span class="ln"><span class="ln-i">${l}</span></span>`).join('');

  const CATEGORY_KEY = { 'bet-on': 'catBetOn', table: 'catTable', slots: 'catSlots', betshop: 'catBetshop', sportsbook: 'catSportsbook' };
  const PLATFORM_KEY = { online: 'platformOnline', retail: 'platformRetail', web: 'platformWeb' };
  const SCREEN_KEY = { online: 'desktopScreen', retail: 'platformRetail', web: 'platformWeb' };
  const img = (p, name) => `assets/img/${p.slug}/${name}.webp`;

  function applyStaticText() {
    $$('[data-t]').forEach((el) => {
      const s = t(el.dataset.t);
      if (s) el.innerHTML = el.hasAttribute('data-lines') ? lines(s) : s;
    });
    $$('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tAria)));
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  function setLang(next, { initial = false } = {}) {
    lang = LANGS.includes(next) ? next : 'en';
    root.lang = lang;
    applyStaticText();
    translateFilters();
    translateCards();
    translateTimeline();
    markHits(false);
    if (dialog.open) {
      const top = dialog.scrollTop;
      renderCase(caseIndex);
      dialog.scrollTop = top;
    } else {
      document.title = t('siteTitle');
    }
    moveTabIndicator(false);
    if (!initial) buildStory();
    try { localStorage.setItem('portfolio-language', lang); } catch { /* private mode */ }
    if (!initial && hasGsap) ScrollTrigger.refresh();
    if (!initial && motionOK()) gsap.fromTo('main', { opacity: 0.35 }, { opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'opacity' });
  }

  /* ---------------- work grid ---------------- */

  const grid = $('[data-grid]');
  const filtersEl = $('[data-filters]');
  const tabsEl = $('.tabs');
  const CATS = ['all', 'bet-on', 'table', 'slots', 'betshop'];
  const state = { group: 'games', category: 'all' };
  const ARROW = '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6m0 0H7m7 0v7"/></svg>';

  function cardHTML(p) {
    const wide = isSportsbook(p);
    const sizes = wide ? '(min-width: 700px) 46vw, 92vw' : '(min-width: 1200px) 30vw, (min-width: 700px) 46vw, 92vw';
    return `<li class="card" data-slug="${p.slug}" data-category="${p.category}">
      <a class="card-link" href="#work/${p.slug}" data-case="${p.slug}">
        <div class="card-media">
          <img class="card-cover" src="${img(p, 'cover-640')}" srcset="${img(p, 'cover-320')} 320w, ${img(p, 'cover-640')} 640w, ${img(p, 'cover-1280')} 1280w"
            sizes="${sizes}" width="1280" height="${wide ? 720 : 900}" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async">
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(p.name)}${ARROW}</h3>
          <p class="card-meta" data-card-meta></p>
          ${p.summary ? '<p class="card-summary" data-card-summary></p>' : ''}
        </div>
      </a>
    </li>`;
  }

  function translateCards() {
    $$('.card', grid).forEach((card) => {
      const { p } = bySlug[card.dataset.slug];
      $('[data-card-meta]', card).textContent = `${p.genre || t(CATEGORY_KEY[p.category])} · ${t(PLATFORM_KEY[p.platform])}`;
      const summary = $('[data-card-summary]', card);
      if (summary) summary.innerHTML = text(p.summary);
    });
  }

  function renderFilters() {
    filtersEl.innerHTML = CATS.map((c) => {
      const n = c === 'all' ? GAMES.length : GAMES.filter((p) => p.category === c).length;
      return `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === state.category}"><span data-chip-label></span><span class="count">${n}</span></button>`;
    }).join('');
    $('[data-count="games"]').textContent = GAMES.length;
    $('[data-count="sportsbooks"]').textContent = PROJECTS.length - GAMES.length;
  }

  function translateFilters() {
    $$('.chip', filtersEl).forEach((b) => {
      $('[data-chip-label]', b).textContent = b.dataset.cat === 'all' ? t('all') : t(CATEGORY_KEY[b.dataset.cat]);
    });
  }

  function moveTabIndicator(animate) {
    const tab = $(`.tab[data-group="${state.group}"]`);
    const indicator = $('.tabs-indicator');
    const x = tab.offsetLeft;
    const width = tab.offsetWidth;
    if (animate && motionOK()) gsap.to(indicator, { x, width, duration: 0.45, ease: 'expo.out' });
    else {
      indicator.style.transform = `translateX(${x}px)`;
      indicator.style.width = `${width}px`;
    }
  }

  const shouldShow = (p) => (state.group === 'sportsbooks'
    ? isSportsbook(p)
    : !isSportsbook(p) && (state.category === 'all' || p.category === state.category));

  let filterRun = 0;
  async function applyFilter({ animate = true } = {}) {
    const run = ++filterRun;
    const cards = $$('.card', grid);
    const animated = animate && motionOK();

    $$('.chip', filtersEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.category)));
    $$('.tab', tabsEl).forEach((tab) => {
      const on = tab.dataset.group === state.group;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    $('[data-panel]').setAttribute('aria-labelledby', `tab-${state.group}`);
    moveTabIndicator(animate);

    const leaving = cards.filter((c) => !c.hidden && !shouldShow(bySlug[c.dataset.slug].p));
    if (animated && leaving.length) {
      await gsap.to(leaving, { opacity: 0, y: 12, duration: 0.18, ease: 'power1.in' });
      if (run !== filterRun) return;
    }

    const flipState = animated ? Flip.getState(cards.filter((c) => !c.hidden)) : null;
    grid.dataset.group = state.group;
    filtersEl.hidden = state.group !== 'games';
    cards.forEach((c) => { c.hidden = !shouldShow(bySlug[c.dataset.slug].p); });
    if (hasGsap) gsap.set(leaving, { clearProps: 'opacity,transform' });

    const work = $('#work');
    if (work.getBoundingClientRect().top < -80) scrollToElement(work, { immediate: !animated });

    if (flipState) {
      const visible = cards.filter((c) => !c.hidden);
      Flip.from(flipState, {
        targets: visible,
        duration: 0.6,
        ease: 'expo.out',
        onEnter: (els) => {
          els.forEach((el) => { el.dataset.revealed = '1'; });
          return gsap.fromTo(els, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04, clearProps: 'transform' });
        },
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else if (hasGsap) {
      cards.forEach((c) => { if (!c.hidden) gsap.set(c, { opacity: 1, clearProps: 'transform' }); });
      ScrollTrigger.refresh();
    }
  }

  filtersEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.dataset.cat === state.category) return;
    state.category = chip.dataset.cat;
    applyFilter();
  });

  function selectGroup(group, focus) {
    if (group === state.group) return;
    state.group = group;
    applyFilter();
    if (focus) $(`.tab[data-group="${group}"]`).focus();
  }
  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) selectGroup(tab.dataset.group);
  });
  tabsEl.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const groups = ['games', 'sportsbooks'];
    const i = groups.indexOf(state.group);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + 2) % 2;
    selectGroup(groups[next], true);
  });

  // Hovering a card loads the interface screen that slides over the key art.
  grid.addEventListener('pointerover', (e) => {
    if (!finePointer.matches || root.classList.contains('has-fx')) return;
    const link = e.target.closest('.card-link');
    const media = link && $('.card-media', link);
    if (!media || $('.card-screen', media)) return;
    const screen = new Image();
    screen.className = 'card-screen';
    screen.alt = '';
    screen.decoding = 'async';
    screen.addEventListener('load', () => screen.classList.add('is-ready'), { once: true });
    screen.src = img(bySlug[link.dataset.case].p, 'desktop-960');
    media.append(screen);
  });

  /* ---------------- reels ---------------- */

  const machine = $('[data-machine]');
  const spinButton = $('[data-spin]');
  const FIRST_LANDING = ['fortune-ronaldinho', 'rockbet', 'tornado-roulette'];
  const shuffled = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const reels = $$('.reel', machine).map((el) => ({ el, order: shuffled(GAMES), strip: null, y: 0, k: 0 }));
  let tileH = 0;
  let pitch = 0;
  let windowH = 0;
  let loop = 0;
  let spinning = false;

  function buildReels() {
    reels.forEach((rs) => {
      const tiles = [...rs.order, ...rs.order].map((p) => `<button class="tile" type="button" tabindex="-1" aria-hidden="true" data-case="${p.slug}">
          <img src="${img(p, 'cover-320')}" width="320" height="225" alt="" decoding="async">
        </button>`).join('');
      rs.el.innerHTML = `<div class="reel-strip">${tiles}</div>`;
      rs.strip = rs.el.firstElementChild;
    });
  }

  function measureReels() {
    const tile = $('.tile', machine);
    tileH = tile.getBoundingClientRect().height;
    pitch = tileH + (parseFloat(getComputedStyle(tile).marginBottom) || 0);
    windowH = reels[0].el.clientHeight;
    loop = GAMES.length * pitch;
  }

  // The strip holds the list twice; any offset maps into [-loop, 0).
  const wrapY = (y) => (((y % loop) + loop) % loop) - loop;
  const centerY = (k) => windowH / 2 - tileH / 2 - k * pitch;
  const paint = (rs) => { rs.strip.style.transform = `translate3d(0, ${wrapY(rs.y).toFixed(2)}px, 0)`; };
  const place = (rs, k) => { rs.k = k; rs.y = centerY(k); paint(rs); };

  function clearHits() {
    machine.classList.remove('is-landed');
    $$('.tile.is-hit', machine).forEach((tile) => {
      tile.classList.remove('is-hit');
      tile.tabIndex = -1;
      tile.setAttribute('aria-hidden', 'true');
      tile.removeAttribute('aria-label');
    });
  }

  function markHits(pulse) {
    if (!loop || spinning || !machine.classList.contains('is-landed')) return;
    const hits = reels.map((rs) => {
      const j = Math.round((windowH / 2 - tileH / 2 - wrapY(rs.y)) / pitch);
      return rs.strip.children[Math.max(0, Math.min(rs.strip.children.length - 1, j))];
    });
    $$('.tile.is-hit', machine).forEach((tile) => {
      if (hits.includes(tile)) return;
      tile.classList.remove('is-hit');
      tile.tabIndex = -1;
      tile.setAttribute('aria-hidden', 'true');
    });
    hits.forEach((tile) => {
      tile.classList.add('is-hit');
      tile.tabIndex = 0;
      tile.removeAttribute('aria-hidden');
      tile.setAttribute('aria-label', t('openCase', { name: bySlug[tile.dataset.case].p.name }));
    });
    if (pulse && motionOK()) {
      gsap.fromTo(hits, { scale: 1 }, { scale: 1.04, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.07 });
    }
  }

  /* Reel motion follows Edgar's Shining Pop V2 reel (reel-view.ts, view-config.ts):
     an 85ms wind-up of 12% of a tile, then ONE travel tween: 10% speed-up, 56% cruise, 34% stop.
     The stop curve S(u) = 2u + (p-1)u² - 2pu³ + pu⁴ (p = 3.4) overshoots about 17% of a tile and
     settles inside the same tween (a separate settle tween reads as "settles after a delay").
     Reels rest 110ms apart; on impact the column dips 5px and its tiles squash bottom-up.
     Pressing Spin again quick-stops: 18ms stagger, 100ms cubic-out. */
  const REEL = { windup: 0.085, windupTiles: 0.12, travel: 0.62, stagger: 0.11, tiles: 14, tilesPerReel: 2, accel: 0.1, stop: 0.34, p: 3.4, blurPx: 2.2 };
  const cruise = 1 / (1 - REEL.accel / 2 - REEL.stop / 2);
  const stopCurve = (u) => 2 * u + (REEL.p - 1) * u * u - 2 * REEL.p * u ** 3 + REEL.p * u ** 4;
  const reelEase = (t) => {
    const { accel: a, stop: c } = REEL;
    if (t <= a) return (cruise * t * t) / (2 * a);
    if (t <= 1 - c) return cruise * (a / 2 + t - a);
    return cruise * (a / 2 + 1 - a - c) + ((cruise * c) / 2) * stopCurve((t - (1 - c)) / c);
  };
  // Speed relative to cruise; zero at rest, so the stop frame is always crisp.
  const reelSpeed = (t) => {
    const { accel: a, stop: c, p } = REEL;
    if (t <= a) return t / a;
    if (t <= 1 - c) return 1;
    const u = (t - (1 - c)) / c;
    return Math.max(0, (2 + 2 * (p - 1) * u - 6 * p * u * u + 4 * p * u ** 3) / 2);
  };
  const IMPACT = 1 - REEL.stop + REEL.stop * 0.54; // S(u) first reaches rest at u ≈ 0.54
  const centerIndexAt = (y) => ((Math.round((windowH / 2 - tileH / 2 - wrapY(y)) / pitch) % GAMES.length) + GAMES.length) % GAMES.length;

  function impact(rs) {
    gsap.timeline()
      .to(rs.el, { y: 5, duration: 0.034, ease: 'power3.out' })
      .to(rs.el, { y: 0, duration: 0.056, ease: 'sine.out', clearProps: 'transform' });
    const center = Math.round((windowH / 2 - tileH / 2 - wrapY(rs.y)) / pitch);
    [center + 1, center, center - 1].forEach((j, n) => {
      const tile = rs.strip.children[j];
      if (!tile) return;
      gsap.timeline({ delay: n * 0.04 })
        .to(tile, { scaleX: 1.04, scaleY: 0.945, duration: 0.07, ease: 'quad.out', transformOrigin: '50% 100%' })
        .to(tile, { scaleX: 0.988, scaleY: 1.03, duration: 0.09, ease: 'quad.out' })
        .to(tile, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'quad.out', clearProps: 'transform' });
    });
  }

  function runReel(rs, r, target, { delay = 0, pace = 1 } = {}) {
    const y0 = rs.y - REEL.windupTiles * pitch;
    const distance = target - y0;
    const travel = (REEL.travel + r * REEL.stagger) * pace;
    const windup = REEL.windup * pace;
    const blur = finePointer.matches;
    const clock = { t: 0 };
    rs.target = target;
    return new Promise((resolve) => {
      rs.resolve = resolve;
      rs.tl = gsap.timeline({ delay, onComplete: () => { rs.tl = null; resolve(); } })
        .to(rs, { y: y0, duration: windup, ease: 'power1.out', onUpdate: () => paint(rs) })
        .to(clock, {
          t: 1,
          duration: travel,
          ease: 'none',
          onUpdate: () => {
            rs.y = y0 + distance * reelEase(clock.t);
            paint(rs);
            if (!blur) return;
            const b = REEL.blurPx * Math.max(0, (reelSpeed(clock.t) - 0.35) / 0.65);
            rs.strip.style.filter = b > 0.1 ? `blur(${b.toFixed(2)}px)` : '';
          },
        })
        .call(() => impact(rs), null, windup + travel * IMPACT);
    });
  }

  function quickStop() {
    reels.forEach((rs, r) => {
      if (!rs.tl) return;
      rs.tl.kill();
      rs.tl = null;
      rs.strip.style.filter = '';
      gsap.to(rs, {
        y: rs.target, duration: 0.1, delay: r * 0.018, ease: 'power3.out',
        onUpdate: () => paint(rs),
        onComplete: () => { impact(rs); rs.resolve(); },
      });
    });
  }

  // Land a fixed number of tiles away (reel 1 = 14, each next reel +2); skip a tile if a project is already on the line.
  function plan(r, rs, taken) {
    for (let extra = 0; extra < GAMES.length; extra++) {
      const target = rs.y + (REEL.tiles + r * REEL.tilesPerReel + extra) * pitch;
      const k = centerIndexAt(target);
      if (!taken.has(rs.order[k].slug)) {
        taken.add(rs.order[k].slug);
        return { k, target };
      }
    }
    return { k: centerIndexAt(rs.y), target: rs.y };
  }

  function celebrate() {
    const hits = $$('.tile.is-hit', machine);
    gsap.timeline({ delay: 0.3 })
      .fromTo(hits, { scale: 1 }, { scale: 1.06, duration: 0.24, ease: 'power3.out', stagger: 0.055 })
      .to(hits, { scale: 1, duration: 0.32, ease: 'power2.inOut', stagger: 0.055, clearProps: 'transform' })
      .fromTo(hits, { '--sheen': '-120%' }, { '--sheen': '120%', duration: 0.9, ease: 'power2.inOut', stagger: 0.08 }, 0.08);
  }

  function land(announce) {
    spinning = false;
    spinButton.removeAttribute('aria-busy');
    machine.classList.add('is-landed');
    markHits(false);
    if (motionOK()) celebrate();
    if (announce) $('[data-landed]').textContent = t('landed', { names: reels.map((rs) => rs.order[rs.k].name).join(', ') });
  }

  function spin({ picks = null, delay = 0, pace = 1, announce = true } = {}) {
    if (!loop) return;
    if (spinning) { if (motionOK()) quickStop(); return; }
    spinning = true;
    spinButton.setAttribute('aria-busy', 'true');
    clearHits();
    const taken = new Set();
    const runs = reels.map((rs, r) => {
      if (picks) {
        // Start the requested number of tiles above the pick, so the normal travel lands on it.
        const k = rs.order.findIndex((p) => p.slug === picks[r]);
        rs.y = centerY(k) + loop * 4 - (REEL.tiles + r * REEL.tilesPerReel) * pitch;
        paint(rs);
      }
      const { k, target } = plan(r, rs, taken);
      rs.k = k;
      if (motionOK()) return runReel(rs, r, target, { delay, pace });
      if (!hasGsap) { place(rs, k); return Promise.resolve(); }
      return gsap.to(rs.strip, { opacity: 0, duration: 0.12 }).then(() => {
        place(rs, k);
        return gsap.to(rs.strip, { opacity: 1, duration: 0.12 });
      });
    });
    Promise.all(runs).then(() => land(announce));
  }

  spinButton.addEventListener('click', () => spin());

  /* ---------------- case study ---------------- */

  const dialog = $('#case');
  const caseBody = $('[data-case-body]', dialog);
  const progressBar = $('[data-case-progress]', dialog);
  let caseIndex = -1;
  let caseOrigin = null;
  let openedIndex = -1;
  let caseViaPush = false;
  let closing = false;

  const onScreen = (r) => r && r.width > 0 && r.bottom > 0 && r.top < innerHeight;

  function caseHTML(p, i, loSrc) {
    const langAttr = (v) => (englishOnly(v) ? ' lang="en"' : '');
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const category = p.genre ? `${t(CATEGORY_KEY[p.category])} · ${p.genre}` : t(CATEGORY_KEY[p.category]);
    const facts = [['company', p.company], ['category', category], ['platform', t(PLATFORM_KEY[p.platform])], ['discipline', p.role]];
    const linkLabel = p.link.kind === 'figma' ? t('figma') : t('play', { name: p.name });
    const sourceNote = lang !== 'en' && [p.intro, p.problem, p.contribution, p.validation].some((v) => typeof v === 'string');
    const heading = (key) => t(key === 'validation' && p.validationLabel === 'review' ? 'review' : key);

    return `
      <div class="case-cover"><img class="cover-lo" src="${loSrc || img(p, 'cover-640')}" alt=""><img class="cover-hi" src="${img(p, 'cover-1280')}" alt="" decoding="async"></div>
      <header class="case-head">
        <div class="case-main" data-reveal>
          ${p.headline ? `<p class="case-name">${esc(p.name)}</p>` : ''}
          <h2 class="display case-title" id="case-title" tabindex="-1">${p.headline ? text(p.headline) : esc(p.name)}</h2>
          <p class="case-lead"${langAttr(p.intro)}>${text(p.intro)}</p>
          ${sourceNote ? `<p class="source-note">${t('sourceNote')}</p>` : ''}
        </div>
        <div class="case-side" data-reveal>
          <dl class="case-facts">${facts.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          <a class="btn btn-primary" href="${esc(p.link.href)}" target="_blank" rel="noopener noreferrer external">
            <span>${esc(linkLabel)}</span>
            <svg class="icon icon-out" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6m0 0H7m7 0v7"/></svg>
          </a>
        </div>
      </header>
      <section class="case-screens${p.mobile === false ? ' is-single' : ''}" data-reveal>
        <figure class="shot shot-desktop">
          <img src="${img(p, 'desktop')}" alt="${esc(p.desktopAlt)}" loading="lazy" decoding="async">
          <figcaption>${t(SCREEN_KEY[p.platform])}</figcaption>
        </figure>
        ${p.mobile === false ? '' : `<figure class="shot shot-mobile">
          <img src="${img(p, 'mobile')}" alt="${esc(p.mobileAlt)}" loading="lazy" decoding="async">
          <figcaption>${t('finalScreen')}</figcaption>
        </figure>`}
      </section>
      <section class="case-story">
        ${['problem', 'contribution', 'validation'].map((key) => `
          <div class="story-row">
            <h3>${heading(key)}</h3>
            <div class="prose"${langAttr(p[key])}>${text(p[key])}</div>
          </div>`).join('')}
      </section>
      <footer class="case-next">
        <a class="next-link" href="#work/${next.slug}" data-case-goto="${next.slug}">
          <span>
            <span class="next-label">${t('nextProject')}<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m0 0-5-5m5 5-5 5"/></svg></span>
            <span class="display next-name">${esc(next.name)}</span>
          </span>
          <span class="next-media"><img src="${img(next, 'cover-640')}" alt="" loading="lazy" decoding="async"></span>
        </a>
      </footer>`;
  }

  function renderCase(i, loSrc) {
    caseIndex = i;
    const p = PROJECTS[i];
    caseBody.innerHTML = caseHTML(p, i, loSrc);
    const hi = $('.cover-hi', caseBody);
    if (hi.complete && hi.naturalWidth) hi.classList.add('is-loaded');
    else hi.addEventListener('load', () => hi.classList.add('is-loaded'), { once: true });
    $('[data-case-index]', dialog).textContent = String(i + 1).padStart(2, '0');
    $('[data-case-total]', dialog).textContent = `/${PROJECTS.length}`;
    $('[data-case-crumb]', dialog).textContent = `${p.name} · ${t(CATEGORY_KEY[p.category])}`;
    document.title = `${p.name} · ${t('siteTitle')}`;
  }

  const setProgress = () => {
    const max = dialog.scrollHeight - dialog.clientHeight;
    progressBar.style.setProperty('--p', max > 0 ? (dialog.scrollTop / max).toFixed(4) : '0');
  };
  dialog.addEventListener('scroll', setProgress, { passive: true });

  /* Shared-element flight: the clicked cover image (card or reel tile) flies into the case cover and
     back on close. The flyer lives inside the dialog so it renders in the top layer. */
  const caseBar = $('.case-bar', dialog);
  let flight = null;

  function makeFlyer(rect, src, radius) {
    const flyer = document.createElement('div');
    flyer.className = 'case-flyer';
    flyer.innerHTML = `<img src="${src}" alt="">`;
    gsap.set(flyer, { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: radius });
    dialog.append(flyer);
    return flyer;
  }
  const sourceImage = (el) => el?.querySelector?.('img')?.currentSrc || '';

  function openCase(slug, { from = null, push = true } = {}) {
    const entry = bySlug[slug];
    if (!entry) return;
    if (dialog.open) { stepTo(entry.i, 1); return; }
    caseOrigin = from;
    openedIndex = entry.i;
    caseViaPush = push;
    renderCase(entry.i, sourceImage(from));
    if (push) history.pushState({ case: slug }, '', `#work/${slug}`);
    lockScroll(true);
    dialog.showModal();
    dialog.scrollTop = 0;
    setProgress();
    $('#case-title', dialog).focus({ preventScroll: true });
    if (!motionOK()) return;

    flight?.progress(1);
    const rect = from?.getBoundingClientRect();
    const reveals = $$('[data-reveal]', dialog);
    if (!onScreen(rect) || !sourceImage(from)) {
      flight = gsap.timeline()
        .fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' })
        .fromTo($('.case-cover', dialog), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
        .fromTo(reveals, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'opacity,transform' }, 0.25);
      return;
    }
    const cover = $('.case-cover', dialog);
    const target = cover.getBoundingClientRect();
    const flyer = makeFlyer(rect, sourceImage(from), 14);
    gsap.set(cover, { opacity: 0 });
    gsap.set(dialog, { '--case-bg': 0 });
    gsap.set([caseBar, ...reveals], { opacity: 0 });
    flight = gsap.timeline({ onComplete: () => { flight = null; } })
      .to(flyer, { left: target.left, top: target.top, width: target.width, height: target.height, borderRadius: 0, '--fade': 1, duration: 0.85, ease: 'expo.inOut' }, 0)
      .to(dialog, { '--case-bg': 1, duration: 0.55, ease: 'power2.inOut' }, 0.12)
      .set(cover, { opacity: 1 }, 0.85)
      .call(() => flyer.remove(), null, 0.85)
      .to(caseBar, { opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'opacity' }, 0.55)
      .fromTo(reveals, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'opacity,transform' }, 0.62);
  }

  // Next/previous: the text fades, the new cover wipes in over a ghost of the old one, no empty frames.
  function stepTo(i, dir) {
    if (i === caseIndex || closing) return;
    const slug = PROJECTS[i].slug;
    history.replaceState(caseViaPush ? { case: slug } : null, '', `#work/${slug}`);
    const swap = () => {
      renderCase(i);
      dialog.scrollTop = 0;
      setProgress();
      $('#case-title', dialog).focus({ preventScroll: true });
    };
    if (!motionOK()) { swap(); return; }
    flight?.progress(1);
    const oldCover = $('.case-cover', dialog);
    const oldRect = oldCover.getBoundingClientRect();
    const coverInView = oldRect.bottom > 80;
    flight = gsap.timeline({ onComplete: () => { flight = null; } })
      .to($$('.case-head, .case-screens, .case-story, .case-next', dialog), { opacity: 0, y: -14, duration: 0.16, ease: 'power1.in' })
      .add(() => {
        const ghost = coverInView ? makeFlyer(oldRect, sourceImage(oldCover), 0) : null;
        if (ghost) { ghost.classList.add('is-ghost'); gsap.set(ghost, { '--fade': 1 }); }
        swap();
        const cover = $('.case-cover', dialog);
        const edge = dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
        gsap.timeline({ onComplete: () => ghost?.remove() })
          .fromTo(cover, { clipPath: edge }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.out', clearProps: 'clipPath' }, 0)
          .fromTo($$('img', cover), { scale: 1.1, xPercent: 5 * dir }, { scale: 1, xPercent: 0, duration: 1, ease: 'expo.out', clearProps: 'transform' }, 0)
          .to(ghost, { xPercent: -10 * dir, opacity: 0.35, duration: 0.75, ease: 'expo.out' }, 0)
          .fromTo($$('[data-reveal]', dialog), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, clearProps: 'opacity,transform' }, 0.12);
      });
  }
  const stepCase = (delta) => stepTo((caseIndex + delta + PROJECTS.length) % PROJECTS.length, delta);

  function requestClose() {
    if (!dialog.open || closing) return;
    if (caseViaPush && history.state?.case) history.back();
    else {
      history.replaceState(null, '', `${location.pathname}${location.search}#work`);
      closeCase();
    }
  }

  function closeCase() {
    if (!dialog.open || closing) return;
    closing = true;
    const slug = PROJECTS[caseIndex].slug;
    const card = $(`.card[data-slug="${slug}"]:not([hidden]) .card-media`, grid);
    const originStillValid = caseIndex === openedIndex && onScreen(caseOrigin?.getBoundingClientRect());
    lockScroll(false);
    const finish = () => {
      $$('.case-flyer', dialog).forEach((f) => f.remove());
      dialog.close();
      if (hasGsap) gsap.set([dialog, caseBar, caseBody], { clearProps: 'opacity,--case-bg' });
      closing = false;
    };
    if (!motionOK()) { finish(); return; }
    flight?.progress(1);

    const target = originStillValid ? caseOrigin : card;
    const cover = $('.case-cover', dialog);
    const coverRect = cover.getBoundingClientRect();
    const coverInView = coverRect.bottom > innerHeight * 0.3;
    if (target && coverInView && !originStillValid && !onScreen(target.getBoundingClientRect())) {
      scrollToElement(target, { immediate: true, center: true });
    }
    const rect = target?.getBoundingClientRect();
    caseOrigin = target || caseOrigin;

    const content = [caseBar, ...$$('.case-head, .case-screens, .case-story, .case-next', dialog)];
    if (!coverInView || !onScreen(rect)) {
      // Deep in the case: text out first, then the dark sheet, so copy never floats over the page.
      gsap.timeline({ onComplete: finish })
        .to([...content, cover], { opacity: 0, duration: 0.16, ease: 'power1.in' })
        .to(dialog, { '--case-bg': 0, duration: 0.26, ease: 'power2.out' });
      return;
    }
    const flyer = makeFlyer(coverRect, sourceImage(cover), 0);
    gsap.set(flyer, { '--fade': 1 });
    gsap.set(cover, { opacity: 0 });
    gsap.timeline({ onComplete: finish })
      .to(content, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0)
      .to(dialog, { '--case-bg': 0, duration: 0.5, ease: 'power2.inOut' }, 0.08)
      .to(flyer, { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: 14, '--fade': 0, duration: 0.75, ease: 'expo.inOut' }, 0);
  }

  dialog.addEventListener('close', () => {
    document.title = t('siteTitle');
    const focusTarget = caseOrigin?.closest?.('a, button') || caseOrigin;
    focusTarget?.focus?.({ preventScroll: true });
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') stepCase(1);
    if (e.key === 'ArrowLeft') stepCase(-1);
  });

  addEventListener('popstate', () => {
    const slug = location.hash.startsWith('#work/') ? decodeURIComponent(location.hash.slice(6)) : null;
    if (slug && bySlug[slug]) {
      if (dialog.open) stepTo(bySlug[slug].i, 1);
      else openCase(slug, { push: false });
    } else if (dialog.open) closeCase();
  });

  /* ---------------- scrolling ---------------- */

  let lenis = null;
  const header = $('.site-header');

  function lockScroll(on) {
    root.classList.toggle('is-locked', on);
    if (lenis) (on ? lenis.stop() : lenis.start());
  }

  function scrollToElement(el, { immediate = false, center = false } = {}) {
    const rect = el.getBoundingClientRect();
    const offset = center ? -(innerHeight - rect.height) / 2 : -(header.offsetHeight + 12);
    if (lenis) {
      lenis.scrollTo(el === document.body ? 0 : el, { offset: el === document.body ? 0 : offset, immediate, force: true });
      return;
    }
    const top = el === document.body ? 0 : rect.top + scrollY + offset;
    scrollTo({ top, behavior: immediate || reducedMotion.matches ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = e.target.closest('[data-case], [data-case-goto], [data-case-step], [data-case-close], a[href^="#"]');
    if (!el || el.classList.contains('skip')) return;

    if (el.hasAttribute('data-case-step')) { stepCase(Number(el.dataset.caseStep)); return; }
    if (el.hasAttribute('data-case-close')) { requestClose(); return; }
    if (el.hasAttribute('data-case-goto')) { e.preventDefault(); stepTo(bySlug[el.dataset.caseGoto].i, 1); return; }
    if (el.hasAttribute('data-case')) {
      e.preventDefault();
      openCase(el.dataset.case, { from: $('.card-media', el) || el });
      return;
    }
    const id = decodeURIComponent(el.getAttribute('href').slice(1));
    if (id.startsWith('work/')) { e.preventDefault(); openCase(id.slice(5), { from: el }); return; }
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollToElement(target);
  });

  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    if (y > lastY + 4 && y > innerHeight * 0.7 && !header.contains(document.activeElement)) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 80) header.classList.remove('is-hidden');
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const navLinks = $$('.nav a');
  const NAV_FOR = { top: '', work: '#work', about: '#about', principles: '#about', profile: '#about', experience: '#about', contact: '#contact' };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute('aria-current', String(a.hash === NAV_FOR[entry.target.id])));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(NAV_FOR).forEach((id) => spy.observe(document.getElementById(id)));

  /* ---------------- about + experience ---------------- */

  function buildOdometers() {
    $$('.odo').forEach((el) => {
      const value = el.dataset.odo;
      el.innerHTML = `<span class="sr-only">${value}</span>${[...value].map((d) => `<span class="odo-col" aria-hidden="true" data-digit="${d}">${Array.from({ length: 20 }, (_, n) => `<span>${n % 10}</span>`).join('')}</span>`).join('')}`;
      $$('.odo-col', el).forEach((col) => {
        const y = -(10 + Number(col.dataset.digit)) * 5;
        if (hasGsap) gsap.set(col, { yPercent: y });
        else col.style.transform = `translateY(${y}%)`;
      });
    });
  }

  const monthIndex = (s) => { const [y, m] = s.split('-').map(Number); return y * 12 + m - 1; };
  const today = new Date();
  const nowMonth = today.getFullYear() * 12 + today.getMonth();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtMonth(s) {
    const [y, m] = s.split('-').map(Number);
    return lang === 'en' ? `${MONTHS[m - 1]} ${y}` : `${String(m).padStart(2, '0')}.${y}`;
  }
  function fmtLength(months) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y && `${y} ${t(y === 1 ? 'yr' : 'yrs')}`, m && `${m} ${t(m === 1 ? 'mo' : 'mos')}`].filter(Boolean).join(' ');
  }

  function renderTimeline() {
    const jobs = $$('.job');
    const start = Math.min(...jobs.map((j) => monthIndex(j.dataset.start)));
    const end = nowMonth + 1;
    const span = end - start;
    jobs.forEach((job) => {
      const s = monthIndex(job.dataset.start);
      const e = job.dataset.end ? monthIndex(job.dataset.end) + 1 : end;
      job.style.setProperty('--start', ((s - start) / span).toFixed(4));
      job.style.setProperty('--span', ((e - s) / span).toFixed(4));
      if (job.dataset.project) {
        const company = $('.job-company', job);
        company.innerHTML = `<a href="#work/${job.dataset.project}">${company.innerHTML}</a>`;
      }
    });
    const years = [];
    for (let y = Math.ceil(start / 12); y * 12 < end; y++) years.push(y);
    $('[data-axis]').innerHTML = `<span></span><span></span><div class="axis-track">${years.map((y) => `<span class="axis-year" style="left:${(((y * 12 - start) / span) * 100).toFixed(2)}%">${y}</span>`).join('')}</div>`;
  }

  function translateTimeline() {
    $$('[data-date]').forEach((el) => { el.textContent = fmtMonth(el.dataset.date); });
    $$('.job').forEach((job) => {
      const e = job.dataset.end ? monthIndex(job.dataset.end) : nowMonth;
      $('[data-length]', job).textContent = fmtLength(e - monthIndex(job.dataset.start) + 1);
    });
  }

  /* ---------------- contact ---------------- */

  $$('[data-copy]').forEach((button) => {
    let timer;
    button.addEventListener('click', async () => {
      const label = $('[data-copy-label]', button);
      const status = $('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
      } catch {
        const range = document.createRange();
        range.selectNodeContents($('.email-link'));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        return;
      }
      label.textContent = t('copied');
      status.textContent = t('copied');
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = t('copyEmail'); status.textContent = ''; }, 1800);
    });
  });

  $$('[data-lang]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.lang !== lang) setLang(button.dataset.lang);
  }));

  /* ---------------- manifesto + principles ---------------- */

  // Wrap every word of an element in .w spans (keeps <em> and other inline tags).
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    return $$('.w', el);
  }

  function demoCrash(el) {
    const mult = $('[data-mult]', el);
    const cash = $('[data-cashout]', el);
    const label = $('.crash-cashout small', el);
    const state = { p: 0 };
    const render = () => {
      const m = Math.exp(state.p * 1.25);
      mult.textContent = m.toFixed(2);
      if (!el.classList.contains('is-cashed')) cash.textContent = (10 * m).toFixed(2);
      el.style.setProperty('--draw', (1 - state.p).toFixed(4));
      el.style.setProperty('--progress', state.p.toFixed(4));
    };
    return gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.2 })
      .call(() => { el.classList.remove('is-cashed', 'is-crashed'); label.textContent = 'Cash out'; })
      .fromTo(state, { p: 0 }, { p: 1, duration: 3.4, ease: 'power1.in', onUpdate: render })
      .call(() => { el.classList.add('is-cashed'); label.textContent = 'Cashed out'; }, null, 2.6)
      .fromTo($('.crash-cashout', el), { scale: 1 }, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }, 2.6)
      .call(() => el.classList.add('is-crashed'), null, 3.4)
      .fromTo(mult, { x: 0 }, { x: 5, duration: 0.05, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 3.4)
      .to({}, { duration: 1.2 });
  }

  function demoReach(el) {
    const panel = $('.phone-panel', el);
    const phone = $('.phone', el);
    const drop = () => phone.clientHeight * 0.93 - panel.offsetTop - panel.offsetHeight;
    return gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.3 })
      .call(() => el.classList.remove('is-reachable'))
      .set(panel, { y: 0, opacity: 1 })
      .to(panel, { x: 3, duration: 0.07, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.7)
      .to(panel, { y: drop, duration: 1.2, ease: 'expo.inOut' }, 1.4)
      .call(() => el.classList.add('is-reachable'), null, 2.3)
      .to($('.phone-bet', el), { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }, 2.9)
      .to(panel, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 4.4);
  }

  function demoSystem(el) {
    const imgs = $$('.skins img', el);
    const label = $('[data-skin-label]', el);
    const skins = [
      { skin: '#10302b', a: '#f5b301', b: '#e5231b' },
      { skin: '#2a0d3d', a: '#ff4fa3', b: '#3aa0ff' },
      { skin: '#2b1a0b', a: '#f3b106', b: '#f05a0a' },
    ];
    const tl = gsap.timeline({ repeat: -1, paused: true, onStart: () => $('.skins', el).classList.add('is-live') });
    skins.forEach((s, i) => {
      tl.call(() => {
        imgs.forEach((im, j) => im.classList.toggle('is-on', j === i));
        label.textContent = imgs[i].dataset.skinName;
      })
        .to(el, { '--skin': s.skin, '--skin-a': s.a, '--skin-b': s.b, duration: 0.6, ease: 'power2.inOut' }, '<')
        .fromTo($('.dock-spin', el), { scale: 1, rotate: 0 }, { scale: 1.1, rotate: 180, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' }, '<0.25')
        .to({}, { duration: 1.9 });
    });
    return tl;
  }

  let storyMedia = null;
  function buildStory() {
    storyMedia?.revert();
    storyMedia = null;
    if (!motionOK()) return;
    storyMedia = gsap.matchMedia();
    storyMedia.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899.98px)' }, (ctx) => {
      const { wide } = ctx.conditions;
      const words = $$('[data-words]').flatMap((el) => {
        el.innerHTML = t(el.dataset.t);
        return splitWords(el);
      });
      gsap.timeline({
        scrollTrigger: wide
          ? { trigger: '.manifesto', start: 'top top', end: '+=120%', scrub: 0.5, pin: true, anticipatePin: 1 }
          : { trigger: '.manifesto', start: 'top 75%', end: 'bottom 70%', scrub: 0.5 },
      })
        .fromTo(words, { opacity: 0.36 }, { opacity: 1, ease: 'none', stagger: 0.1 })
        .fromTo('.mission', { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 1.2 });

      const panels = $$('.principle');
      const loops = [demoCrash($('.demo-crash')), demoReach($('.demo-reach')), demoSystem($('.demo-system'))];
      let current = -1;
      const activate = (i) => {
        if (i === current) return;
        current = i;
        loops.forEach((tl, n) => (n === i ? tl.play() : tl.pause()));
      };

      if (wide) {
        // Pinned stack: each principle rests on screen, then the next one slides up over it.
        const list = $('.principle-list');
        list.classList.add('is-stacked');
        gsap.set(panels.slice(1), { yPercent: 100 });
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: list, start: 'top top', end: `+=${panels.length * 110}%`, pin: true, scrub: 0.6, anticipatePin: 1,
            onUpdate: (self) => activate(Math.min(panels.length - 1, Math.floor(self.progress * panels.length * 0.999 + 0.12))),
            onLeave: () => activate(-1),
            onLeaveBack: () => activate(-1),
            onEnter: () => activate(0),
            onEnterBack: () => activate(panels.length - 1),
          },
        });
        panels.slice(1).forEach((panel, i) => {
          tl.to({}, { duration: 0.6 })
            .to(panel, { yPercent: 0, duration: 1 })
            .to($('.principle-inner', panels[i]), { scale: 0.92, opacity: 0.18, duration: 1 }, '<');
        });
        tl.to({}, { duration: 0.6 });
      } else {
        panels.forEach((panel, i) => {
          gsap.from($$('.principle-title, .principle-text, .demo', panel), {
            y: 48, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: panel, start: 'top 72%', once: true },
          });
          ScrollTrigger.create({
            trigger: panel, start: 'top 60%', end: 'bottom 40%',
            onToggle: (self) => { if (self.isActive) activate(i); else if (current === i) activate(-1); },
          });
        });
      }
      return () => {
        loops.forEach((tl) => tl.kill());
        $('.principle-list').classList.remove('is-stacked');
      };
    });
  }

  /* ---------------- WebGL reel-stop hover ----------------
     Hovering a card spins its key art like a reel: the art smears down with an RGB split and the
     interface screen lands in its place on the same V2 stop curve as the hero reels. Leaving spins
     the art back in. One shared canvas, drawn only while a tween runs; desktop pointers only.
     Without WebGL the CSS wipe of .card-screen stays as the fallback. */
  function initReelHover() {
    if (!motionOK() || !finePointer.matches || (navigator.deviceMemory && navigator.deviceMemory < 4)) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!gl) return;

    const vert = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
    const frag = `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D uA, uB;
      uniform vec4 uFitA, uFitB;
      uniform float uShift, uSpeed;
      vec3 strip(float s, float x) {
        float k = mod(floor(s), 2.0);
        vec2 local = vec2(x, fract(s));
        vec2 a = local * uFitA.xy + uFitA.zw;
        vec2 b = local * uFitB.xy + uFitB.zw;
        return k < 0.5 ? texture2D(uA, a).rgb : texture2D(uB, b).rgb;
      }
      void main() {
        float s = uv.y + uShift;
        float split = 0.035 * uSpeed;
        float blur = 0.16 * uSpeed;
        vec3 col = vec3(0.0);
        for (int i = 0; i < 7; i++) {
          float o = (float(i) / 6.0 - 0.5) * blur;
          col.r += strip(s + o + split, uv.x).r;
          col.g += strip(s + o, uv.x).g;
          col.b += strip(s + o - split, uv.x).b;
        }
        col /= 7.0;
        float seam = smoothstep(0.0, 0.02, fract(s)) * (1.0 - smoothstep(0.98, 1.0, fract(s)));
        gl_FragColor = vec4(col * mix(0.55, 1.0, mix(1.0, seam, min(uSpeed * 2.0, 1.0))), 1.0);
      }`;
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(['uA', 'uB', 'uFitA', 'uFitB', 'uShift', 'uSpeed'].map((n) => [n, gl.getUniformLocation(prog, n)]));
    gl.uniform1i(u.uA, 0);
    gl.uniform1i(u.uB, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const textures = [0, 1].map((unit) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    });

    let lost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; root.classList.remove('has-fx'); canvas.remove(); });
    root.classList.add('has-fx');

    // object-fit: cover as a uv scale + offset
    const fit = (img, aspect) => {
      const ia = img.naturalWidth / img.naturalHeight;
      return ia > aspect ? [aspect / ia, 1, (1 - aspect / ia) / 2, 0] : [1, ia / aspect, 0, (1 - ia / aspect) / 2];
    };
    const screens = new Map();
    const screenFor = (p) => {
      if (!screens.has(p.slug)) {
        const im = new Image();
        im.decoding = 'async';
        im.src = img(p, 'desktop-960');
        screens.set(p.slug, im.decode().then(() => im).catch(() => null));
      }
      return screens.get(p.slug);
    };

    const state = { shift: 0, speed: 0 };
    let active = null;
    let tween = null;
    let heading = 0;
    const release = () => { canvas.remove(); active = null; state.shift = 0; heading = 0; };
    const draw = () => {
      gl.uniform1f(u.uShift, state.shift);
      gl.uniform1f(u.uSpeed, state.speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    async function enter(link) {
      const media = $('.card-media', link);
      const cover = $('.card-cover', link);
      const p = bySlug[link.dataset.case].p;
      if (lost || !cover.complete || !cover.naturalWidth) return;
      screenFor(p);
      if (active === media) {
        if (heading !== 1) spinTo(1); // re-entered while leaving
        return;
      }
      const screen = await screenFor(p);
      if (!screen || !link.matches(':hover')) return;
      tween?.kill();
      active = media;
      const rect = media.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const aspect = rect.width / rect.height;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cover);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[1]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, screen);
      gl.uniform4fv(u.uFitA, fit(cover, aspect));
      gl.uniform4fv(u.uFitB, fit(screen, aspect));
      state.shift = 0;
      state.speed = 0;
      draw();
      media.append(canvas);
      spinTo(1);
    }

    function spinTo(target) {
      tween?.kill();
      heading = target;
      const from = state.shift;
      const clock = { t: 0 };
      tween = gsap.to(clock, {
        t: 1,
        duration: target === 1 ? 0.8 : 0.6,
        ease: 'none',
        onUpdate: () => {
          state.shift = from + (target - from) * reelEase(clock.t);
          state.speed = Math.min(1, reelSpeed(clock.t));
          draw();
        },
        onComplete: () => {
          state.speed = 0;
          if (target === 1) draw();
          else release();
        },
      });
    }

    function leave(link) {
      if (!active || active !== $('.card-media', link)) return;
      spinTo(state.shift < 0.5 ? 0 : 2);
    }

    grid.addEventListener('pointerover', (e) => {
      const link = e.target.closest('.card-link');
      if (link && !link.contains(e.relatedTarget)) enter(link);
    });
    grid.addEventListener('pointerout', (e) => {
      const link = e.target.closest('.card-link');
      if (link && !link.contains(e.relatedTarget)) leave(link);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && active) { tween?.kill(); release(); }
    });
  }

  /* ---------------- motion ---------------- */

  function initLenis() {
    if (!motionOK() || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function initCursor() {
    if (!motionOK() || !finePointer.matches) return;
    const cursor = $('.cursor');
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    let shown = false;
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const over = Boolean(e.target.closest('.card-media, .tile.is-hit')) && !dialog.open;
      if (over === shown) return;
      shown = over;
      gsap.to(cursor, { opacity: over ? 1 : 0, scale: over ? 1 : 0.5, duration: over ? 0.3 : 0.2, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  function intro() {
    if (!root.classList.contains('intro')) return;
    if (!motionOK()) { root.classList.remove('intro'); return; }
    gsap.set('[data-intro]', { opacity: 1 });
    gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => root.classList.remove('intro') })
      .from(header, { yPercent: -60, opacity: 0, duration: 1 }, 0)
      .from('.hero-id', { y: 20, opacity: 0, duration: 1 }, 0.05)
      .from('.hero-title .ln-i', { yPercent: 118, duration: 1.25, stagger: 0.1 }, 0.1)
      .from('.hero-intro', { y: 18, duration: 1.1 }, 0.2)
      .from('.hero-actions > *', { y: 20, opacity: 0, duration: 1, stagger: 0.07 }, 0.44)
      .from(machine, { y: 48, opacity: 0, duration: 1.2 }, 0.16);
  }

  function scrollMotion() {
    if (!motionOK()) return;

    $$('.section-title, .contact-title').forEach((title) => {
      gsap.from($$('.ln-i', title), { yPercent: 118, duration: 1.25, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: title, start: 'top 88%', once: true } });
    });

    $$('.tabs, .profile-body > *, .timeline, .contact-kicker, .contact-email, .contact-links').forEach((el) => {
      gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    const cards = $$('.card', grid);
    gsap.set(cards, { opacity: 0, y: 56 });
    ScrollTrigger.batch(cards, {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => {
        const fresh = batch.filter((c) => !c.dataset.revealed);
        fresh.forEach((c) => { c.dataset.revealed = '1'; });
        gsap.to(fresh, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: 'auto', clearProps: 'transform' });
        gsap.fromTo(fresh.map((c) => $('.card-media', c)), { clipPath: 'inset(9% 9% 9% 9% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: 'expo.out', stagger: 0.08, clearProps: 'clipPath' });
      },
    });

    gsap.to('.machine-window', { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    gsap.from('.job-bar', { scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: { each: 0.14, from: 'end' }, scrollTrigger: { trigger: '.timeline', start: 'top 80%', once: true } });

    $$('.odo').forEach((odo, i) => {
      gsap.from($$('.odo-col', odo), { yPercent: 0, duration: 1.8, ease: 'expo.out', stagger: 0.12, delay: i * 0.1, scrollTrigger: { trigger: odo, start: 'top 90%', once: true } });
    });

    gsap.fromTo('.contact-bg',
      { clipPath: 'inset(5% 4% 5% 4% round 48px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 35%', scrub: 0.6 } });
  }

  /* ---------------- boot ---------------- */

  grid.innerHTML = PROJECTS.map(cardHTML).join('');
  renderFilters();
  buildReels();
  buildOdometers();
  renderTimeline();

  let savedLang = null;
  try { savedLang = localStorage.getItem('portfolio-language'); } catch { /* private mode */ }
  setLang(new URLSearchParams(location.search).get('lang') || savedLang || 'en', { initial: true });
  applyFilter({ animate: false });

  measureReels();
  reels.forEach((rs) => place(rs, Math.floor(Math.random() * GAMES.length)));

  initLenis();
  if (!motionOK()) {
    $('.demo-reach').classList.add('is-static', 'is-reachable');
    $('.demo-crash').classList.add('is-cashed');
  }
  // Below-the-fold motion is wired after the first frame so it never delays the hero.
  const afterFirstFrame = () => {
    initCursor();
    scrollMotion();
    buildStory();
    initReelHover();
    if (hasGsap) ScrollTrigger.refresh();
  };
  requestAnimationFrame(() => (window.requestIdleCallback ? requestIdleCallback(afterFirstFrame, { timeout: 500 }) : setTimeout(afterFirstFrame, 60)));

  let resizeFrame = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      moveTabIndicator(false);
      if (spinning) return;
      measureReels();
      reels.forEach((rs) => place(rs, rs.k));
      markHits(false);
    });
  });

  const start = () => {
    intro();
    if (motionOK()) spin({ picks: FIRST_LANDING, delay: 0.35, pace: 1.5, announce: false });
    else {
      reels.forEach((rs, r) => place(rs, rs.order.findIndex((p) => p.slug === FIRST_LANDING[r])));
      land(false);
    }
    const deep = location.hash.startsWith('#work/') && decodeURIComponent(location.hash.slice(6));
    if (deep && bySlug[deep]) openCase(deep, { push: false });
  };
  requestAnimationFrame(start);
})();
