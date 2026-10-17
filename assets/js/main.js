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
      var open = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });


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


  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');



    if (!href || /^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reducedMotion()) return;
    e.preventDefault();
    document.body.classList.add('mc-leave');
    setTimeout(function () { window.location.href = href; }, 230);
  });
})();
