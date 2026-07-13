/* ============================================================
   RAIVO — shared front-end behavior across all pages.
   Every init() below feature-detects its DOM and no-ops if the
   markup isn't present, so one file serves every page.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- header scroll state + reading progress ---------------- */
  function initHeaderScroll() {
    const header = document.querySelector('[data-header]');
    const progress = document.querySelector('[data-progress-bar]');
    if (!header && !progress) return;
    const onScroll = () => {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
      if (progress) {
        const doc = document.documentElement;
        const max = (doc.scrollHeight - window.innerHeight) || 1;
        const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
        progress.style.width = pct + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- mobile burger menu ---------------- */
  function initMobileMenu() {
    const burger = document.querySelector('[data-burger]');
    const panel = document.querySelector('[data-mobile-menu]');
    if (!burger || !panel) return;
    const setOpen = (open) => {
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    };
    burger.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveals(root) {
    const scope = root || document;
    const revealTargets = [
      '.service-breadcrumb',
      '.service-hero .rv-eyebrow',
      '.service-hero h1',
      '.service-hero-card',
      '.service-section-head',
      '.service-card',
      '.service-related-card',
      '.service-cta-card',
      '.service-faq .rv-faq-item'
    ];
    revealTargets.forEach((selector) => {
      scope.querySelectorAll(selector).forEach((el) => {
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      });
    });
    const els = Array.from(scope.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    if (!els.length) return;
    const reveal = (el) => el.classList.add('is-revealed');
    let io;
    try {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach((el) => io.observe(el));
    } catch (err) { /* IO unsupported */ }
    const revealInView = () => {
      els.forEach((el) => {
        if (el.classList.contains('is-revealed')) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < vh * 0.95 && r.bottom > 0) reveal(el);
      });
    };
    requestAnimationFrame(revealInView);
    window.addEventListener('scroll', revealInView, { passive: true });
    setTimeout(() => els.forEach(reveal), 1200);
  }

  /* ---------------- accordions (FAQ items, stack tools) ---------------- */
  function initAccordions() {
    document.querySelectorAll('[data-accordion]').forEach((container) => {
      const single = container.getAttribute('data-accordion') === 'single';
      const items = Array.from(container.querySelectorAll('[data-accordion-item]'));
      items.forEach((item) => {
        const toggle = item.querySelector('[data-accordion-toggle]');
        if (!toggle) return;
        toggle.addEventListener('click', () => {
          const isOpen = item.getAttribute('data-open') === 'true';
          if (single && !isOpen) {
            items.forEach((other) => {
              other.setAttribute('data-open', 'false');
              other.classList.remove('is-open');
              const t = other.querySelector('[data-accordion-toggle]');
              if (t) t.setAttribute('aria-expanded', 'false');
            });
          }
          const next = !isOpen;
          item.setAttribute('data-open', String(next));
          item.classList.toggle('is-open', next);
          toggle.setAttribute('aria-expanded', String(next));
        });
      });
    });
  }

  /* ---------------- tubelight nav: sliding highlight + scroll-spy ---------------- */
  function initTubelightNav() {
    const nav = document.querySelector('[data-tubelight]');
    const hl = document.querySelector('[data-nav-highlight]');
    if (!nav || !hl) return;
    const items = Array.from(nav.querySelectorAll('[data-nav-item]'));
    if (!items.length) return;
    const sectionIds = items.map((i) => i.dataset.section);
    let activeId = sectionIds[0];
    let suppressSpy = false;
    let spyTimer;

    function position(animate, targetId) {
      const target = targetId || activeId;
      const active = items.find((i) => i.dataset.section === target) || items[0];
      const navRect = nav.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      if (!animate) hl.style.transition = 'none';
      hl.style.width = r.width + 'px';
      hl.style.transform = 'translateX(' + (r.left - navRect.left) + 'px)';
      items.forEach((i) => i.classList.toggle('is-active', i === active));
      if (!animate) { void hl.offsetWidth; hl.style.transition = ''; }
    }

    function goTo(id) {
      activeId = id;
      suppressSpy = true;
      clearTimeout(spyTimer);
      spyTimer = setTimeout(() => { suppressSpy = false; }, 1000);
      position(true, id);
    }

    items.forEach((item) => {
      item.addEventListener('click', () => goTo(item.dataset.section));
    });
    document.querySelectorAll('[data-mobile-nav-item]').forEach((item) => {
      item.addEventListener('click', () => goTo(item.dataset.section));
    });

    const onScroll = () => {
      let cur = sectionIds[0];
      const probe = window.scrollY + 150;
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= probe) cur = id;
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = sectionIds[sectionIds.length - 1];
      if (suppressSpy) return;
      if (cur !== activeId) { activeId = cur; position(true, cur); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => position(false));
    requestAnimationFrame(() => position(false));
    setTimeout(() => position(false), 400);
    setTimeout(() => position(false), 1300);
    onScroll();
  }

  /* ---------------- "Pourquoi" background growth chart ---------------- */
  function initGrowthChart() {
    const chart = document.querySelector('[data-chart]');
    if (!chart) return;
    const draw = () => chart.classList.add('is-drawn');
    let io;
    try {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { draw(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(chart);
    } catch (err) { draw(); }
    setTimeout(draw, 2600);
  }

  /* ---------------- method timeline progress-on-scroll ---------------- */
  function initMethodTimeline() {
    const nodes = document.querySelectorAll('[data-step-node]');
    if (!nodes.length) return;
    const lines = document.querySelectorAll('[data-step-line]');
    const update = () => {
      const threshold = (window.innerHeight || 0) * 0.7;
      nodes.forEach((el) => el.classList.toggle('is-active', el.getBoundingClientRect().top < threshold));
      lines.forEach((el) => el.classList.toggle('is-active', el.getBoundingClientRect().top < threshold));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------- Tally embed (contact form) ---------------- */
  function initTallyEmbed() {
    const iframes = document.querySelectorAll('iframe[data-tally-src]');
    if (!iframes.length) return;
    const load = () => {
      if (window.Tally && typeof window.Tally.loadEmbeds === 'function') {
        window.Tally.loadEmbeds();
      }
      document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach((el) => { el.src = el.dataset.tallySrc; });
    };
    const src = 'https://tally.so/widgets/embed.js';
    if (window.Tally) {
      load();
    } else if (!document.querySelector('script[src="' + src + '"]')) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = load;
      s.onerror = load;
      document.body.appendChild(s);
    } else {
      load();
    }
    setTimeout(load, 1500);
  }

  /* ---------------- blog: per-article SEO (title, meta, OG, BlogPosting JSON-LD) ---------------- */
  function initBlogSeo() {
    const titleEl = document.querySelector('title');
    const descEl = document.querySelector('meta[name="description"]');
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    const ogTypeEl = document.querySelector('meta[property="og:type"]');
    if (!titleEl) return function () {};

    const defaults = {
      title: document.title,
      description: descEl ? descEl.getAttribute('content') : '',
      ogTitle: ogTitleEl ? ogTitleEl.getAttribute('content') : '',
      ogDescription: ogDescEl ? ogDescEl.getAttribute('content') : '',
      ogType: ogTypeEl ? ogTypeEl.getAttribute('content') : 'website'
    };
    let jsonldEl = null;

    return function applySeo(articleEl) {
      if (!articleEl) {
        titleEl.textContent = defaults.title;
        if (descEl) descEl.setAttribute('content', defaults.description);
        if (ogTitleEl) ogTitleEl.setAttribute('content', defaults.ogTitle);
        if (ogDescEl) ogDescEl.setAttribute('content', defaults.ogDescription);
        if (ogTypeEl) ogTypeEl.setAttribute('content', defaults.ogType);
        if (jsonldEl) { jsonldEl.remove(); jsonldEl = null; }
        return;
      }
      const h1 = articleEl.querySelector('h1');
      const catEl = articleEl.querySelector('.blog-article-cat');
      const leadEl = articleEl.querySelector('.blog-lead');
      const dateEl = articleEl.querySelector('time.date');
      const title = h1 ? h1.textContent.trim() : defaults.title;
      const category = catEl ? catEl.textContent.trim() : '';
      const description = leadEl ? leadEl.textContent.replace(/\s+/g, ' ').trim() : defaults.description;
      const publishedDate = dateEl ? dateEl.getAttribute('datetime') : null;
      const pageTitle = title + ' – Blog RAIVO';
      const articleId = articleEl.getAttribute('data-blog-article');
      const url = 'https://raivo.fr/blog.html#' + articleId;

      titleEl.textContent = pageTitle;
      if (descEl) descEl.setAttribute('content', description);
      if (ogTitleEl) ogTitleEl.setAttribute('content', pageTitle);
      if (ogDescEl) ogDescEl.setAttribute('content', description);
      if (ogTypeEl) ogTypeEl.setAttribute('content', 'article');

      const data = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: description,
        articleSection: category,
        author: { '@type': 'Person', name: 'Raphaël Poirier' },
        publisher: { '@type': 'Organization', name: 'RAIVO' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url: url
      };
      // datePublished/dateModified: read from the visible <time datetime="...">
      // in the article header. Left out entirely if that element is missing,
      // rather than guessing a date.
      if (publishedDate) {
        data.datePublished = publishedDate;
        data.dateModified = publishedDate;
      }
      if (!jsonldEl) {
        jsonldEl = document.createElement('script');
        jsonldEl.type = 'application/ld+json';
        jsonldEl.id = 'blogpost-jsonld';
        document.head.appendChild(jsonldEl);
      }
      jsonldEl.textContent = JSON.stringify(data);
    };
  }

  /* ---------------- blog: hash-based index/article routing ---------------- */
  function initBlogRouter() {
    const root = document.querySelector('[data-blog-root]');
    if (!root) return;
    const indexView = root.querySelector('[data-blog-index]');
    const articles = Array.from(root.querySelectorAll('[data-blog-article]'));
    if (!articles.length) return;
    const applySeo = initBlogSeo();

    function sync() {
      const hash = (window.location.hash || '').replace(/^#/, '');
      const match = articles.find((a) => a.dataset.blogArticle === hash);
      if (indexView) indexView.style.display = match ? 'none' : '';
      articles.forEach((a) => { a.style.display = (a === match) ? '' : 'none'; });
      applySeo(match || null);
      window.scrollTo(0, 0);
      initReveals(root);
      const onScroll = document._raivoBlogScroll;
      if (onScroll) onScroll();
    }

    root.querySelectorAll('[data-blog-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.dataset.blogLink;
        window.history.pushState(null, '', id ? '#' + id : window.location.pathname);
        sync();
      });
    });

    window.addEventListener('hashchange', sync);
    sync();
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileMenu();
    initTubelightNav();
    initAccordions();
    initGrowthChart();
    initMethodTimeline();
    initTallyEmbed();
    initBlogRouter();
    initReveals();
  });
})();
