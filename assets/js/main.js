(function () {
  'use strict';

  var reducedMotion = window.MC.reducedMotion;

  function i18nT(key, fallback) {
    if (window.MC && MC.i18n) {
      var v = MC.i18n.t(key);
      if (v) return v;
    }
    return fallback;
  }

  document.body.classList.add('mc-enter');

  (function initBotTrap(){
    var KEY = 'mc_bot';
    function flag(){ try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
    function isFlagged(){ try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
    try {
      if (navigator.webdriver) flag();
      if (/HeadlessChrome|PhantomJS|Nightmare|SlimerJS/i.test(navigator.userAgent || '')) flag();
    } catch (e) {}
    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.hasAttribute && t.hasAttribute('data-hp-link')) { e.preventDefault(); flag(); return; }
        t = t.parentNode;
      }
    }, true);
    window.MC = window.MC || {};
    window.MC.isBot = isFlagged;
  })();

  (function initAmbient(){
    if (reducedMotion()) return;
    var layer = document.createElement('div');
    layer.className = 'mc-ambient';
    layer.setAttribute('aria-hidden', 'true');
    var i, el;
    for (i = 1; i <= 6; i++) {
      el = document.createElement('span');
      el.className = 'mc-orb mc-orb--' + i;
      layer.appendChild(el);
    }
    for (i = 1; i <= 8; i++) {
      el = document.createElement('span');
      el.className = 'mc-bit mc-bit--' + i;
      layer.appendChild(el);
    }
    document.body.appendChild(layer);
  })();

  var head = document.querySelector('.site-head');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (head) head.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobileNav');
  function setNav(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label',
      i18nT(open ? 'aria.nav_close' : 'aria.nav_open', open ? 'Close' : 'Menu'));
    panel.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = panel.querySelector('a.mobile-nav__link');
      if (first) first.focus({ preventScroll: true });
    } else if (panel.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) setNav(false);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('is-open') &&
          !panel.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
  }

  var accButtons = document.querySelectorAll('.acc__button');
  Array.prototype.forEach.call(accButtons, function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc__item');
      if (!item) return;
      var opening = item.getAttribute('data-open') !== 'true';
      if (opening) {
        var container = item.closest('.acc');
        if (container) {
          Array.prototype.forEach.call(container.querySelectorAll('.acc__item[data-open="true"]'), function (other) {
            if (other !== item) {
              other.setAttribute('data-open', 'false');
              var otherBtn = other.querySelector('.acc__button');
              if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            }
          });
        }
      }
      item.setAttribute('data-open', opening ? 'true' : 'false');
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });
  });

  var heavyGo = null;

  function anchorTargetY(el) {
    var h = head ? head.offsetHeight : 0;
    var featNav = document.querySelector('.feat-nav');
    if (featNav) h += featNav.offsetHeight;
    var subnav = document.querySelector('.partner-subnav');
    if (subnav) h += subnav.offsetHeight;
    var y = el.getBoundingClientRect().top + (window.scrollY || 0) - h - 10;
    return Math.max(0, y);
  }

  (function initHeavyScroll(){
    if (reducedMotion()) return;
    var docEl = document.documentElement;
    var fine = typeof matchMedia === 'function' && matchMedia('(pointer:fine)').matches;
    var target = window.scrollY || 0, current = target;
    var rafId = 0, flingId = 0, vel = 0, lastFrame = 0, lastFling = 0;
    function maxScroll(){ return Math.max(0, docEl.scrollHeight - window.innerHeight); }
    function stopFling(){ if (flingId){ cancelAnimationFrame(flingId); flingId = 0; } vel = 0; }
    function frame(now){
      var dt = lastFrame ? now - lastFrame : 16.7;
      lastFrame = now;
      if (!(dt > 0)) dt = 16.7;
      if (dt > 100) dt = 100;
      current += (target - current) * (1 - Math.pow(0.89, dt / 16.7));
      if (Math.abs(target - current) < 0.4){
        window.scrollTo(0, Math.round(target));
        current = target; rafId = 0; return;
      }
      window.scrollTo(0, Math.round(current));
      rafId = requestAnimationFrame(frame);
    }
    function kick(){ if (!rafId){ lastFrame = 0; rafId = requestAnimationFrame(frame); } }
    function glide(){
      lastFling = 0;
      flingId = requestAnimationFrame(function step(now){
        var dt = lastFling ? now - lastFling : 16.7;
        lastFling = now;
        if (!(dt > 0)) dt = 16.7;
        if (dt > 100) dt = 100;
        vel *= Math.pow(0.94, dt / 16.7);
        if (Math.abs(vel) < 0.4){ flingId = 0; vel = 0; target = current = window.scrollY || 0; return; }
        var top = maxScroll();
        var ny = (window.scrollY || 0) + vel;
        if (ny <= 0){ ny = 0; vel = 0; }
        else if (ny >= top){ ny = top; vel = 0; }
        window.scrollTo(0, Math.round(ny));
        target = current = ny;
        flingId = requestAnimationFrame(step);
      });
    }
    function goTo(y){
      y = Math.max(0, Math.min(maxScroll(), y));
      stopFling();
      if (fine){ target = y; kick(); return; }
      window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
    }
    heavyGo = goTo;
    window.addEventListener('scroll', function (){
      if (!rafId && !flingId){ current = target = window.scrollY || 0; }
    }, { passive:true });
    if (fine){
      docEl.style.scrollBehavior = 'auto';
      window.addEventListener('wheel', function (e){
        if (e.ctrlKey || e.metaKey) return;
        var t = e.target;
        if (t && t.closest && t.closest('textarea, select, [data-native-scroll]')) return;
        var dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        var nt = Math.max(0, Math.min(maxScroll(), target + dy));
        if (nt === target) return;
        stopFling();
        target = nt;
        if (e.cancelable) e.preventDefault();
        kick();
      }, { passive:false });
    } else {
      var sX = 0, sY = 0, lY = 0, lT = 0;
      var engaged = false, decided = false, skipTouch = false, tVel = 0;
      function wantsNative(el){
        if (!el || !el.closest) return false;
        if (el.closest('input, textarea, select, [contenteditable], [data-native-scroll]')) return true;
        var p = el.parentElement;
        while (p && p !== docEl){
          var oy = window.getComputedStyle(p).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 4) return true;
          p = p.parentElement;
        }
        return false;
      }
      document.addEventListener('touchstart', function (e){
        stopFling();
        skipTouch = e.touches.length !== 1;
        if (skipTouch) return;
        var t = e.touches[0];
        sX = t.clientX; sY = lY = t.clientY; lT = e.timeStamp || 0;
        engaged = false; decided = false; tVel = 0;
        current = target = window.scrollY || 0;
      }, { passive:true });
      document.addEventListener('touchmove', function (e){
        if (skipTouch || e.touches.length !== 1) return;
        var t = e.touches[0];
        if (!decided){
          if (Math.max(Math.abs(t.clientX - sX), Math.abs(t.clientY - sY)) < 8) return;
          decided = true;
          if (Math.abs(t.clientX - sX) > Math.abs(t.clientY - sY)){ skipTouch = true; return; }
          if (wantsNative(t.target)){ skipTouch = true; return; }
          if (t.clientY > sY && (window.scrollY || 0) <= 0){ skipTouch = true; return; }
          engaged = true;
        }
        if (!engaged) return;
        if (e.cancelable) e.preventDefault();
        var now = e.timeStamp || 0;
        var dy = lY - t.clientY;
        var dt = Math.max(1, now - lT);
        lY = t.clientY; lT = now;
        tVel = tVel * 0.75 + (dy / dt * 16) * 0.25;
        var top = maxScroll();
        var ny = (window.scrollY || 0) + dy;
        if (ny < 0) ny = 0;
        else if (ny > top) ny = top;
        window.scrollTo(0, Math.round(ny));
        target = current = ny;
      }, { passive:false });
      function endTouch(){
        var wasEngaged = engaged;
        engaged = false; decided = false; skipTouch = false;
        if (!wasEngaged){ return; }
        if (Math.abs(tVel) > 3){
          vel = Math.max(-72, Math.min(72, tVel));
          target = current = window.scrollY || 0;
          glide();
        } else {
          target = current = window.scrollY || 0;
        }
      }
      document.addEventListener('touchend', endTouch, { passive:true });
      document.addEventListener('touchcancel', endTouch, { passive:true });
    }
    document.addEventListener('click', function (e){
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      goTo(anchorTargetY(el));
      window.setTimeout(function () {
        var fresh = anchorTargetY(el);
        var off = fresh - (window.scrollY || 0);
        if (Math.abs(off) > 10 && Math.abs(off) < 160) goTo(fresh);
      }, 900);
    });
  })();

  var stepper = document.querySelector('.stepper');
  if (stepper) {
    var stepItems = Array.prototype.slice.call(stepper.querySelectorAll('.stepper__item'));
    var stepBtns = stepItems.map(function (item) { return item.querySelector('.stepper__btn'); });
    var stepCards = stepBtns.map(function (btn) {
      return document.getElementById(btn.getAttribute('data-step-target'));
    });
    function stepsActive(index) {
      stepItems.forEach(function (item, i) {
        item.classList.toggle('is-active', i === index);
        item.classList.toggle('is-complete', i < index);
        if (i === index) { stepBtns[i].setAttribute('aria-current', 'step'); }
        else { stepBtns[i].removeAttribute('aria-current'); }
      });
      stepper.style.setProperty('--fill', stepItems.length > 1 ? (index / (stepItems.length - 1)) : 1);
      stepCards.forEach(function (card, i) {
        if (card) card.classList.toggle('is-active', i === index);
      });
    }
    function stepsGo(index) {
      if (index < 0) index = 0;
      if (index >= stepItems.length) index = stepItems.length - 1;
      stepsActive(index);
      var card = stepCards[index];
      if (!card) return;
      if (typeof heavyGo === 'function') heavyGo(anchorTargetY(card));
      else card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    stepBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { stepsGo(i); });
    });
    stepper.addEventListener('keydown', function (event) {
      var current = stepBtns.indexOf(document.activeElement);
      if (current < 0) return;
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      var next = -1;
      if (event.key === 'ArrowRight') next = rtl ? current - 1 : current + 1;
      else if (event.key === 'ArrowLeft') next = rtl ? current + 1 : current - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = stepItems.length - 1;
      if (next < 0 || next >= stepItems.length) return;
      event.preventDefault();
      stepBtns[next].focus();
      stepsGo(next);
    });
    if ('IntersectionObserver' in window && stepCards.length) {
      var stepSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var i = stepCards.indexOf(entry.target);
            if (i > -1) stepsActive(i);
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      stepCards.forEach(function (card) { if (card) stepSpy.observe(card); });
    }
  }

  var featNav = document.querySelector('.feat-nav');
  if (featNav) {
    var featLinks = Array.prototype.slice.call(featNav.querySelectorAll('.feat-nav__link'));
    var featSections = featLinks.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    }).filter(function (el) { return !!el; });
    var featInner = featNav.querySelector('.feat-nav__inner');
    function featSetActive(link) {
      featLinks.forEach(function (l) {
        var on = l === link;
        l.classList.toggle('is-active', on);
        if (on) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
      if (link && featInner) {
        var r = link.getBoundingClientRect(), ir = featInner.getBoundingClientRect();
        var x = featInner.scrollLeft + (r.left - ir.left) - ir.width / 2 + r.width / 2;
        featInner.scrollTo({ left: x, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
    if ('IntersectionObserver' in window && featSections.length) {
      var featSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = featSections.indexOf(entry.target);
          if (i > -1) featSetActive(featLinks[i]);
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      featSections.forEach(function (sec) { featSpy.observe(sec); });
    } else if (featLinks.length) {
      featSetActive(featLinks[0]);
    }
    var featTicking = false;
    function featEdgeCheck() {
      featTicking = false;
      if (!featSections.length) return;
      var y = window.scrollY || 0;
      var headEl = document.querySelector('.site-head');
      var topPad = (headEl ? headEl.offsetHeight : 0) + featNav.offsetHeight + 40;
      var firstTop = featSections[0].getBoundingClientRect().top + y;
      var lastBottom = featSections[featSections.length - 1].getBoundingClientRect().bottom + y;
      if (y + topPad < firstTop) featSetActive(featLinks[0]);
      else if (y + (window.innerHeight || 0) > lastBottom + 40) featSetActive(featLinks[featLinks.length - 1]);
    }
    function featKick() {
      if (featTicking) return;
      featTicking = true;
      requestAnimationFrame(featEdgeCheck);
    }
    window.addEventListener('scroll', featKick, { passive: true });
    window.addEventListener('resize', featKick);
    featKick();
  }

  var subnav = document.querySelector('.partner-subnav');
  if (subnav) {
    var subLinks = Array.prototype.slice.call(subnav.querySelectorAll('.partner-subnav__link'));
    var subSections = subLinks.map(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return null;
      return document.getElementById(href.slice(1));
    });
    var subInner = subnav.querySelector('.partner-subnav__inner, .partner-subnav > .container') || subnav;
    function subSetActive(link) {
      subLinks.forEach(function (l) {
        var on = l === link;
        l.classList.toggle('is-active', on);
        if (on) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
      if (link && subInner && subInner.scrollTo) {
        var r = link.getBoundingClientRect(), ir = subInner.getBoundingClientRect();
        var x = subInner.scrollLeft + (r.left - ir.left) - ir.width / 2 + r.width / 2;
        subInner.scrollTo({ left: x, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
    if ('IntersectionObserver' in window && subSections.length) {
      var subSpy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = subSections.indexOf(entry.target);
          if (i > -1) subSetActive(subLinks[i]);
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      subSections.forEach(function (sec) { if (sec) subSpy.observe(sec); });
    } else if (subLinks.length) {
      subSetActive(subLinks[0]);
    }
    var subTicking = false;
    function subEdgeCheck() {
      subTicking = false;
      var valid = subSections.filter(function (el) { return !!el; });
      if (!valid.length || !subLinks.length) return;
      var y = window.scrollY || 0;
      var headEl = document.querySelector('.site-head');
      var topPad = (headEl ? headEl.offsetHeight : 0) + subnav.offsetHeight + 40;
      var firstTop = valid[0].getBoundingClientRect().top + y;
      var lastBottom = valid[valid.length - 1].getBoundingClientRect().bottom + y;
      if (y + topPad < firstTop) subSetActive(subLinks[0]);
      else if (y + (window.innerHeight || 0) > lastBottom + 40) subSetActive(subLinks[subLinks.length - 1]);
    }
    function subKick() {
      if (subTicking) return;
      subTicking = true;
      requestAnimationFrame(subEdgeCheck);
    }
    window.addEventListener('scroll', subKick, { passive: true });
    window.addEventListener('resize', subKick);
    subKick();
  }

  var rail = document.querySelector('.steps-rail');
  var railWrap = document.querySelector('.detail-steps');
  if (rail && railWrap) {
    var railCards = Array.prototype.slice.call(railWrap.querySelectorAll('.detail-step'));
    var railPct = rail.querySelector('.rail-progress__pct');
    var railFill = rail.querySelector('.rail-progress__fill');
    var railTicking = false;
    function railUpdate() {
      railTicking = false;
      if (!railCards.length) return;
      var vh = window.innerHeight || 1;
      var y = window.scrollY || 0;
      var top = railWrap.getBoundingClientRect().top + y;
      var span = Math.max(1, railWrap.offsetHeight - vh * 0.2);
      var p = (y + vh * 0.6 - top) / span;
      p = Math.min(1, Math.max(0, p));
      if (railPct) railPct.textContent = Math.round(p * 100) + '%';
      if (railFill) railFill.style.transform = 'scaleY(' + p.toFixed(3) + ')';
    }
    function railKick() {
      if (railTicking) return;
      railTicking = true;
      requestAnimationFrame(railUpdate);
    }
    window.addEventListener('scroll', railKick, { passive: true });
    window.addEventListener('resize', railKick);
    railKick();
  }

  var revealEls = document.querySelectorAll('.reveal');
  var revealFired = false;
  function revealEl(el) {
    if (el.classList.contains('is-visible')) return;
    el.classList.add('is-visible');
    revealFired = true;
    var delayMs = 0;
    try {
      var cs = window.getComputedStyle(el);
      var d = parseFloat(cs.transitionDelay) || 0;
      delayMs = d * 1000;
    } catch (e) {}
    window.setTimeout(function () { el.style.transitionDelay = '0s'; el.classList.add('revealed'); }, delayMs + 750);
  }
  function revealInView() {
    var vh = window.innerHeight || 0;
    Array.prototype.forEach.call(revealEls, function (el) {
      if (el.classList.contains('is-visible')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) revealEl(el);
    });
  }
  if (reducedMotion()) {
    Array.prototype.forEach.call(revealEls, function (el) { revealEl(el); });
  } else if ('IntersectionObserver' in window && revealEls.length) {
    var io;
    try {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealEl(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
    } catch (e) {
      Array.prototype.forEach.call(revealEls, function (el) { revealEl(el); });
    }
    window.addEventListener('load', revealInView);
    window.setTimeout(revealInView, 900);
    var revealTicking = false;
    window.addEventListener('scroll', function () {
      if (revealTicking) return;
      revealTicking = true;
      requestAnimationFrame(function () { revealTicking = false; revealInView(); });
    }, { passive: true });
    window.setTimeout(function () {
      if (!revealFired) Array.prototype.forEach.call(revealEls, function (el) { revealEl(el); });
    }, 5000);
  } else {
    Array.prototype.forEach.call(revealEls, function (el) { revealEl(el); });
  }

  if (!reducedMotion() && window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    var spotlightCards = document.querySelectorAll('.feature-card, .feat, .pair, .option-card');
    Array.prototype.forEach.call(spotlightCards, function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
        card.classList.add('pointer-active');
      }, { passive: true });
      card.addEventListener('pointerleave', function () { card.classList.remove('pointer-active'); });
    });
  }

  if (toggle && panel) {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !panel.classList.contains('is-open')) return;
      var focusable = panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var url = null;
    try { url = new URL(href, window.location.href); } catch (err) { url = null; }
    if (!url) return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    if (reducedMotion()) return;
    e.preventDefault();
    document.body.classList.add('mc-leave');
    window.setTimeout(function () {
      try { window.location.assign(url.href); }
      catch (navErr) { document.body.classList.remove('mc-leave'); }
    }, 160);
  });

  window.addEventListener('pageshow', function () {
    document.body.classList.remove('mc-leave');
  });

  (function initPartnerForm(){
    var form = document.getElementById('partnerForm');
    if (!form || form.__mcPartnerBound) return;
    form.__mcPartnerBound = true;
    form.__mcPartnerT = Date.now();
    var submitBtn = form.querySelector('[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
    var statusEl = document.getElementById('partnerFormStatus');
    var slot = form.querySelector('[data-turnstile]');
    var hp = form.querySelector('[data-hp]');
    function pt(key, fallback) {
      if (window.MC && MC.i18n) {
        var v = MC.i18n.t(key);
        if (v) return v;
      }
      return fallback;
    }
    function curLang() {
      return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
    }
    function cfg(key) {
      try {
        var c = window.MC && MC.config ? MC.config[key] : '';
        return String(c || '').trim();
      } catch (e) { return ''; }
    }
    function endpoint() { return cfg('FORM_ENDPOINT'); }
    function tsKey() { return cfg('TURNSTILE_SITE_KEY'); }
    function setCaptchaError(show) {
      var el = form.querySelector('[data-captcha-error]');
      if (el) el.hidden = !show;
    }
    function setCaptchaLoading(show) {
      var el = form.querySelector('[data-captcha-loading]');
      if (el) el.hidden = !show;
    }
    function setCaptchaFailed(show) {
      var el = form.querySelector('[data-captcha-failed]');
      if (el) el.hidden = !show;
    }
    function setCaptchaHint(show) {
      var el = form.querySelector('[data-captcha-hint]');
      if (el) el.hidden = !show;
    }
    function tsToken() {
      if (!slot || slot.__mcWidgetId === undefined) return '';
      try { return window.turnstile.getResponse(slot.__mcWidgetId) || ''; }
      catch (e) { return ''; }
    }
    function resetTs() {
      if (!slot || slot.__mcWidgetId === undefined) return;
      try { window.turnstile.reset(slot.__mcWidgetId); } catch (e) {}
      updateSubmitState();
    }
    function showStatus(kind, key, fallback) {
      if (!statusEl) return;
      form.__mcPartnerStatus = { kind: kind, key: key, fallback: fallback };
      statusEl.className = 'form__status form__status--' + kind;
      statusEl.textContent = pt(key, fallback);
      statusEl.hidden = false;
    }
    function hideStatus() {
      form.__mcPartnerStatus = null;
      if (statusEl) statusEl.hidden = true;
    }
    var FIELDS = [
      { name: 'full_name', input: form.querySelector('#pName'), error: form.querySelector('#pNameErr') },
      { name: 'company', input: form.querySelector('#pCompany'), error: form.querySelector('#pCompanyErr') },
      { name: 'email', input: form.querySelector('#pEmail'), error: form.querySelector('#pEmailErr') },
      { name: 'country', input: form.querySelector('#pCountry'), error: form.querySelector('#pCountryErr') },
      { name: 'business_type', input: form.querySelector('#pType'), error: form.querySelector('#pTypeErr') },
      { name: 'network', input: form.querySelector('#pNetwork'), error: form.querySelector('#pNetworkErr') },
      { name: 'website', input: form.querySelector('#pWebsite'), error: form.querySelector('#pWebsiteErr') },
      { name: 'additional', input: form.querySelector('#pAdditional'), error: null }
    ];
    function selectedText(input) {
      if (!input || !input.options) return '';
      var opt = input.options[input.selectedIndex];
      return opt ? opt.textContent : '';
    }
    function validateField(name, v) {
      if (name === 'website') {
        if (!v) return null;
        if (!/^https?:\/\//i.test(v)) return 'invalid';
        return null;
      }
      if (name === 'additional') return null;
      if (!v) return 'empty';
      if (name === 'full_name' || name === 'company') {
        if (v.length < 2 || !/[^\d\s\-_.,!@#$%^&*()+=[\]{};':"\\|<>/?~`]/.test(v)) return 'invalid';
      }
      if (name === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'invalid';
      }
      if (name === 'network') {
        if (v.length < 20) return 'invalid';
      }
      return null;
    }
    function setFieldError(f, errKind) {
      if (!f.input) return;
      if (errKind) {
        if (f.error) {
          var key = 'pages.partners.form.fields.' + f.name + '.' + errKind + '_error';
          f.error.setAttribute('data-i18n', key);
          f.error.textContent = pt(key, f.error.textContent);
          f.error.hidden = false;
        }
        f.input.setAttribute('aria-invalid', 'true');
      } else {
        f.input.removeAttribute('aria-invalid');
        if (f.error) f.error.hidden = true;
      }
    }
    function validateAll(showErrors) {
      var values = {};
      var firstBad = null;
      var ok = true;
      for (var i = 0; i < FIELDS.length; i++) {
        var f = FIELDS[i];
        var v = f.input ? f.input.value.trim() : '';
        var errKind = validateField(f.name, v);
        if (showErrors) setFieldError(f, errKind);
        if (errKind) {
          ok = false;
          if (!firstBad) firstBad = f;
        }
        values[f.name] = v;
        if (f.name === 'country') values.country_text = selectedText(f.input);
        if (f.name === 'business_type') values.business_type_text = selectedText(f.input);
      }
      return { ok: ok, firstBad: firstBad, values: values };
    }
    function updateSubmitState() {
      if (!submitBtn) return;
      var enabled = !!endpoint() && (!tsKey() || !!tsToken());
      submitBtn.disabled = !enabled;
      setCaptchaHint(!enabled && !!tsKey());
    }
    var STRENGTH_WORDS = [null, 'weak', 'fair', 'good', 'excellent'];
    function partnerStrengthLevel(v) {
      var len = String(v || '').trim().length;
      if (!len) return 0;
      if (len < 10) return 1;
      if (len < 30) return 2;
      if (len < 80) return 3;
      return 4;
    }
    function updatePartnerStrength() {
      var wrap = form.querySelector('[data-msg-strength]');
      var fill = form.querySelector('[data-msg-strength-fill]');
      var txt = form.querySelector('[data-msg-strength-text]');
      var input = form.querySelector('#pNetwork');
      if (!wrap || !input) return;
      var lvl = partnerStrengthLevel(input.value);
      if (!lvl) { wrap.setAttribute('hidden', ''); return; }
      wrap.removeAttribute('hidden');
      if (fill) {
        fill.style.width = (lvl * 25) + '%';
        fill.setAttribute('data-level', String(lvl));
      }
      if (txt) {
        var label = pt('pages.partners.form.strength.label', 'Message strength');
        var word = pt('pages.partners.form.strength.' + STRENGTH_WORDS[lvl], STRENGTH_WORDS[lvl]);
        txt.textContent = (label ? label + ': ' : '') + (word || '');
      }
    }
    function initTs() {
      var key = tsKey();
      if (!slot) return;
      form.__mcTsSlot = slot;
      if (!key) {
        slot.setAttribute('hidden', '');
        setCaptchaLoading(false);
        setCaptchaFailed(false);
        updateSubmitState();
        return;
      }
      slot.removeAttribute('hidden');
      setCaptchaFailed(false);
      if (slot.__mcWidgetId !== undefined && slot.__mcTsLang === curLang()) {
        setCaptchaLoading(false);
        return;
      }
      updateSubmitState();
      setCaptchaLoading(true);
      var render = function () {
        if (!window.turnstile) return;
        if (slot.__mcWidgetId !== undefined && slot.__mcTsLang === curLang()) {
          setCaptchaLoading(false);
          return;
        }
        try {
          if (slot.__mcWidgetId !== undefined) { try { window.turnstile.remove(slot.__mcWidgetId); } catch (e) {} }
          slot.innerHTML = '';
          slot.__mcWidgetId = window.turnstile.render(slot, {
            sitekey: key,
            theme: 'dark',
            language: curLang(),
            callback: function () { setCaptchaLoading(false); setCaptchaFailed(false); setCaptchaError(false); updateSubmitState(); },
            'expired-callback': function () { setCaptchaLoading(false); setCaptchaError(true); updateSubmitState(); },
            'error-callback': function () { setCaptchaLoading(false); setCaptchaFailed(true); updateSubmitState(); }
          });
          slot.__mcTsLang = curLang();
          if (slot.__mcTsTimer) { clearTimeout(slot.__mcTsTimer); slot.__mcTsTimer = null; }
        } catch (e) { setCaptchaLoading(false); setCaptchaFailed(true); }
      };
      if (window.turnstile) { render(); return; }
      if (slot.__mcTsLoading) return;
      slot.__mcTsLoading = true;
      slot.__mcTsTimer = setTimeout(function () {
        if (slot.__mcWidgetId === undefined && !window.turnstile) { setCaptchaLoading(false); setCaptchaFailed(true); }
      }, 20000);
      var loadScript = function () {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.defer = true;
        s.onload = render;
        s.onerror = function () { slot.__mcTsLoading = false; setCaptchaLoading(false); setCaptchaFailed(true); };
        document.head.appendChild(s);
      };
      if (typeof IntersectionObserver !== 'undefined' && !slot.__mcTsObserved) {
        slot.__mcTsObserved = true;
        var io = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) { io.disconnect(); loadScript(); }
          }
        }, { rootMargin: '400px 0px' });
        io.observe(form);
        return;
      }
      loadScript();
    }
    function reapplyStatus() {
      var st = form.__mcPartnerStatus;
      if (st && statusEl && !statusEl.hidden) statusEl.textContent = pt(st.key, st.fallback);
    }
    var toggles = [];
    var mainToggle = document.getElementById('langToggle');
    if (mainToggle) toggles.push(mainToggle);
    var alts = document.querySelectorAll('[data-lang-toggle-alt]');
    for (var ti = 0; ti < alts.length; ti++) toggles.push(alts[ti]);
    for (var tj = 0; tj < toggles.length; tj++) {
      toggles[tj].addEventListener('click', function () {
        setTimeout(function () { initTs(); reapplyStatus(); updatePartnerStrength(); }, 450);
      });
    }
    if (!endpoint()) {
      showStatus('error', 'pages.partners.form.disabled', 'Partnership applications are not being accepted right now — please check back soon');
    }
    for (var fi = 0; fi < FIELDS.length; fi++) {
      (function (fld) {
        if (!fld.input) return;
        fld.input.addEventListener('input', function () { setFieldError(fld, null); });
        fld.input.addEventListener('change', function () { setFieldError(fld, null); });
        if (fld.name === 'network') fld.input.addEventListener('input', updatePartnerStrength);
      })(FIELDS[fi]);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.__mcPartnerBusy) return;
      if (!endpoint()) {
        showStatus('error', 'pages.partners.form.disabled', 'Partnership applications are not being accepted right now — please check back soon');
        return;
      }
      if (hp && hp.value) return;
      if (window.MC && MC.isBot && MC.isBot()) return;
      if (Date.now() - (form.__mcPartnerT || 0) < 3000) return;
      var res = validateAll(true);
      if (!res.ok) {
        if (res.firstBad && res.firstBad.input) res.firstBad.input.focus();
        return;
      }
      if (tsKey() && !tsToken()) {
        setCaptchaError(true);
        if (slot && slot.scrollIntoView) slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      setCaptchaError(false);
      hideStatus();
      form.__mcPartnerBusy = true;
      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = pt('pages.partners.form.submit.loading', 'Submitting your application…');
      var payload = {
        formType: "partners",
        fullName: res.values.full_name,
        company: res.values.company,
        email: res.values.email,
        country: res.values.country_text,
        businessType: res.values.business_type_text,
        network: res.values.network,
        website: res.values.website,
        additionalInfo: res.values.additional,
        turnstileToken: tsToken(),
        honeypot: hp ? hp.value : ''
      };
      fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      }).then(function (resp) { return resp.text(); }).then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (err) { data = null; }
        form.__mcPartnerBusy = false;
        if (submitLabel) submitLabel.textContent = pt('pages.partners.form.submit', 'Submit Partnership Application');
        if (data && data.ok === true) {
          showStatus('success', 'pages.partners.form.success', 'Application Submitted Successfully! Thank you for your interest in partnering with us. Your application has been received. Our team will review the information and contact you if there is a potential partnership fit.');
          form.reset();
          updatePartnerStrength();
          for (var k = 0; k < FIELDS.length; k++) setFieldError(FIELDS[k], null);
          resetTs();
        } else {
          showStatus('error', 'pages.partners.form.error', 'Something went wrong while preparing your application. Your details are still here — please check your connection and try again');
        }
        updateSubmitState();
      }).catch(function () {
        form.__mcPartnerBusy = false;
        if (submitLabel) submitLabel.textContent = pt('pages.partners.form.submit', 'Submit Partnership Application');
        showStatus('error', 'pages.partners.form.error', 'Something went wrong while preparing your application. Your details are still here — please check your connection and try again');
        updateSubmitState();
      });
    });
    initTs();
    updateSubmitState();
  })();

})();
