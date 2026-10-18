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
      if (card) card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
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



    if (!href || /^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reducedMotion()) return;
    e.preventDefault();
    document.body.classList.add('mc-leave');
    setTimeout(function () { window.location.href = href; }, 230);
  });
})();
