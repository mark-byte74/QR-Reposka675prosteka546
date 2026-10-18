(function () {
  'use strict';

  var reducedMotion = function () {
    return typeof matchMedia === 'function' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  function i18nT(key, fallback) {
    if (window.MC && MC.i18n) {
      var v = MC.i18n.t(key);
      if (v) return v;
    }
    return fallback;
  }


  document.body.classList.add('mc-enter');

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
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  } else {

    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-visible'); });
  }


  var altToggles = document.querySelectorAll('[data-lang-toggle-alt]');
  Array.prototype.forEach.call(altToggles, function (b) {
    b.addEventListener('click', function () {
      if (window.MC && MC.i18n) {
        MC.i18n.setLang(MC.i18n.getLang() === 'ar' ? 'en' : 'ar');
      }
    });
  });




  if (!reducedMotion() && window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    var spotlightCards = document.querySelectorAll('.feature-card, .pair, .option-card');
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


  var heavyGo = null;

  function anchorTargetY(el) {
    var h = head ? head.offsetHeight : 0;
    var y = el.getBoundingClientRect().top + (window.scrollY || 0) - h - 10;
    return Math.max(0, y);
  }

  (function initHeavyScroll(){
    if (reducedMotion()) return;
    var docEl = document.documentElement;
    var fine = typeof matchMedia === 'function' && matchMedia('(pointer:fine)').matches;
    var target = window.scrollY || 0, current = target;
    var rafId = 0, flingId = 0, vel = 0;
    function maxScroll(){ return Math.max(0, docEl.scrollHeight - window.innerHeight); }
    function stopFling(){ if (flingId){ cancelAnimationFrame(flingId); flingId = 0; } vel = 0; }
    function frame(){
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.4){
        window.scrollTo(0, Math.round(target));
        current = target; rafId = 0; return;
      }
      window.scrollTo(0, Math.round(current));
      rafId = requestAnimationFrame(frame);
    }
    function kick(){ if (!rafId) rafId = requestAnimationFrame(frame); }
    function glide(){
      flingId = requestAnimationFrame(function step(){
        vel *= 0.94;
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
    });
  })();
})();
