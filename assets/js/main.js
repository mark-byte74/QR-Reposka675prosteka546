/* ==========================================================================
 * Menu Codes — main.js
 * Vanilla JS · interactions only (language switching lives in i18n.js).
 * Header scroll state · mobile nav · accordion · reveal-on-scroll ·
 * page fade between internal pages. All animation: transform/opacity.
 * ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = function () {
    return typeof matchMedia === 'function' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ---- 1. Page entry -------------------------------------------------------- */
  document.body.classList.add('mc-enter');

  /* ---- 2. Header scroll state (passive + rAF-throttled) ---------------------- */
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

  /* ---- 3. Mobile nav --------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobileNav');
  function setNav(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
  }

  /* ---- 4. Accordion ------------------------------------------------------------ */
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

  /* ---- 5. Reveal on scroll ------------------------------------------------------ */
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
    // No IO support — show everything immediately.
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-visible'); });
  }

  /* ---- 6. Footer language shortcut (mirrors #langToggle) ------------------------- */
  var altToggles = document.querySelectorAll('[data-lang-toggle-alt]');
  var menuBtn = document.querySelector('.nav-toggle');
  function currentLangSafe() {
    return (window.MC && MC.i18n) ? MC.i18n.getLang() : 'ar';
  }
  function refreshAltLabels() {
    var lang = currentLangSafe();
    Array.prototype.forEach.call(altToggles, function (b) {
      b.textContent = (lang === 'ar') ? 'English version' : 'النسخة العربية';
    });
    if (menuBtn) menuBtn.setAttribute('aria-label', lang === 'ar' ? 'القائمة' : 'Menu');
  }
  Array.prototype.forEach.call(altToggles, function (b) {
    b.addEventListener('click', function () {
      if (window.MC && MC.i18n) {
        var next = MC.i18n.getLang() === 'ar' ? 'en' : 'ar';
        MC.i18n.setLang(next);
        // Labels refresh after the language fade completes.
        setTimeout(refreshAltLabels, 300);
      }
    });
  });
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () { setTimeout(refreshAltLabels, 300); });
  }
  refreshAltLabels();

  /* ---- 7. Page fade between internal pages ---------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    // Internal .html pages only; skip new-tab / modified / download clicks.
    if (!/\.html(#.*)?$/.test(href)) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reducedMotion()) return;
    e.preventDefault();
    document.body.classList.add('mc-leave');
    setTimeout(function () { window.location.href = href; }, 230);
  });
})();
