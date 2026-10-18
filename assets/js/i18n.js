(function () {
  'use strict';

  var CONFIG = {
    WHATSAPP_NUMBER: "+447721382912",
    EMAIL: "",
    TURNSTILE_SITE_KEY: "0x4AAAAAAFZ5zwplvZLWBhAV",
    SITE_DOMAIN: "menu.codes"
  };


  var LANG_KEY     = 'mc-lang';
  var DEFAULT_LANG = 'en';
  var TOGGLE_ID    = 'langToggle';
  var FORM_ID      = 'quoteForm';
  var DIR_BY_LANG  = { ar: 'rtl', en: 'ltr' };

  var reducedMotion = window.MC.reducedMotion;

  function getDictionary() {
    if (typeof MC_I18N !== 'undefined' && MC_I18N) return MC_I18N;
    if (typeof window !== 'undefined' && window.MC_I18N) return window.MC_I18N;
    return {};
  }

  function warn(msg) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[mc-i18n] ' + msg);
  }

  function isValidLang(l) { return l === 'ar' || l === 'en'; }



  function t(key, lang) {
    var entry = getDictionary()[key];
    if (!entry) { warn('missing dictionary key "' + key + '" — element left unchanged'); return null; }
    return entry[lang] || entry[DEFAULT_LANG] || null;
  }


  function readStoredLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (isValidLang(v)) return v;
    } catch (e) {  }
    return DEFAULT_LANG;
  }

  function waNumber() { return String(CONFIG.WHATSAPP_NUMBER).replace(/\D/g, ''); }


  function applyTexts(lang) {

    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var el = textEls[i];
      var key = el.getAttribute('data-i18n');
      if (!key) continue;
      var val = t(key, lang);
      if (val === null) continue;
      if (el.textContent !== val) el.textContent = val;
    }

    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrEls.length; j++) {
      var node = attrEls[j];
      var spec = node.getAttribute('data-i18n-attr') || '';
      var pairs = spec.split(';');
      for (var k = 0; k < pairs.length; k++) {
        var raw = pairs[k].trim();
        if (!raw) continue;
        var colon = raw.indexOf(':');
        var attr = colon === -1 ? '' : raw.slice(0, colon).trim();
        var akey = colon === -1 ? '' : raw.slice(colon + 1).trim();
        if (!attr || !akey) { warn('bad data-i18n-attr pair "' + raw + '" — skipped'); continue; }
        var aval = t(akey, lang);
        if (aval === null) continue;
        if (node.getAttribute(attr) !== aval) node.setAttribute(attr, aval);
      }
    }
  }

  function turnstileKey() { return String(CONFIG.TURNSTILE_SITE_KEY || '').trim(); }

  function setCaptchaError(show) {
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var err = form.querySelector('[data-captcha-error]');
    if (err) err.hidden = !show;
  }

  function setSubmitEnabled(on) {
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = !on;
  }

  function initTurnstile() {
    var key = turnstileKey();
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var slot = form.querySelector('[data-turnstile]');
    if (!slot) return;
    form.__mcTsSlot = slot;
    if (!key) { slot.setAttribute('hidden', ''); setSubmitEnabled(true); return; }
    slot.removeAttribute('hidden');
    setSubmitEnabled(false);
    var render = function () {
      if (!window.turnstile) return;
      try {
        slot.innerHTML = '';
        slot.__mcWidgetId = window.turnstile.render(slot, {
          sitekey: key,
          theme: 'dark',
          language: currentLang(),
          callback: function () { setCaptchaError(false); setSubmitEnabled(true); },
          'expired-callback': function () { setCaptchaError(true); setSubmitEnabled(false); }
        });
      } catch (e) { warn('turnstile render failed'); }
    };
    if (window.turnstile) { render(); return; }
    if (slot.__mcTsLoading) return;
    slot.__mcTsLoading = true;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.onload = render;
    document.head.appendChild(s);
  }

  function turnstileToken() {
    var form = document.getElementById(FORM_ID);
    var slot = form && form.__mcTsSlot;
    if (!slot || slot.__mcWidgetId === undefined) return '';
    try { return window.turnstile.getResponse(slot.__mcWidgetId) || ''; }
    catch (e) { return ''; }
  }

  function resetTurnstile() {
    var form = document.getElementById(FORM_ID);
    var slot = form && form.__mcTsSlot;
    if (!slot || slot.__mcWidgetId === undefined) return;
    try { window.turnstile.reset(slot.__mcWidgetId); } catch (e) {}
  }

  function applyEmail() {
    var email = String(CONFIG.EMAIL || '').trim();
    var sections = document.querySelectorAll('[data-email-section]');
    var i, s;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      for (i = 0; i < sections.length; i++) sections[i].setAttribute('hidden', '');
      return;
    }
    for (i = 0; i < sections.length; i++) {
      s = sections[i];
      s.removeAttribute('hidden');
      var link = s.querySelector('[data-email-link]');
      if (link) link.setAttribute('href', 'mailto:' + email);
      var txt = s.querySelector('[data-email-text]');
      if (txt) txt.textContent = email;
    }
    var notes = document.querySelectorAll('[data-email-hide]');
    for (i = 0; i < notes.length; i++) notes[i].setAttribute('hidden', '');
  }

  function applyWhatsApp(lang) {
    var num = waNumber();
    if (!num) { warn('CONFIG.WHATSAPP_NUMBER is empty — WhatsApp links not built'); return; }
    var links = document.querySelectorAll('[data-wa]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = 'https://wa.me/' + num;
      var textKey = a.getAttribute('data-wa-text');
      if (textKey) {
        var msg = t(textKey, lang);
        if (msg) href += '?text=' + encodeURIComponent(msg);
      }
      if (a.getAttribute('href') !== href) a.setAttribute('href', href);
    }
  }

  function applyLangToDocument(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', DIR_BY_LANG[lang]);
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'ar' ? 'ar_AR' : 'en_US');
  }

  function applySeoUrls() {
    var domain = String(CONFIG.SITE_DOMAIN || '').replace(/\/+$/, '');
    if (domain) {
      if (domain.indexOf('://') < 0) domain = 'https://' + domain;
    } else if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.protocol.indexOf('http') === 0) {
      domain = window.location.origin.replace(/\/+$/, '');
    } else {
      return;
    }
    var els = document.querySelectorAll('[data-abs-url]');
    var resolver = document.createElement('a');
    for (var i = 0; i < els.length; i++) {
      var attr = els[i].getAttribute('data-abs-url');
      var val = els[i].getAttribute(attr) || '';
      if (!val || val.indexOf('://') >= 0) continue;
      resolver.href = val;
      els[i].setAttribute(attr, domain + resolver.pathname + resolver.search + resolver.hash);
    }
  }

  function storeLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {  }
  }


  function currentLang() {
    var fromDom = document.documentElement.getAttribute('lang');
    return isValidLang(fromDom) ? fromDom : readStoredLang();
  }


  function allLangToggles() {
    var list = [];
    var main = document.getElementById(TOGGLE_ID);
    if (main) list.push(main);
    var alts = document.querySelectorAll('[data-lang-toggle-alt]');
    for (var i = 0; i < alts.length; i++) list.push(alts[i]);
    return list;
  }

  function updateToggleLabels(lang) {
    var label = (lang === 'ar') ? 'EN' : 'عربي';
    var toggles = allLangToggles();
    for (var i = 0; i < toggles.length; i++) {
      if (toggles[i].textContent !== label) toggles[i].textContent = label;
    }
  }

  function bindToggle(btn) {
    if (!btn || btn.__mcI18nBound) return;
    btn.__mcI18nBound = true;
    btn.addEventListener('click', function () {
      setLang(currentLang() === 'ar' ? 'en' : 'ar');
    });
  }


  var fadeBusy = false;

  function animateToggle(fadeClass, apply) {
    var body = document.body;
    if (reducedMotion() || !body) { apply(); return; }
    if (fadeBusy) return;
    fadeBusy = true;
    body.classList.add(fadeClass);
    setTimeout(function () {
      apply();
      setTimeout(function () {
        body.classList.remove(fadeClass);
        fadeBusy = false;
      }, 180);
    }, 120);
  }

  function applyFaqSchema(lang) {
    var node = document.getElementById('mcFaqSchema');
    if (!node) return;
    var entities = [];
    for (var n = 1; n <= 16; n++) {
      var q = t('pages.faq.items.' + n + '.q', lang);
      var a = t('pages.faq.items.' + n + '.a', lang);
      if (!q || !a) continue;
      entities.push({ '@type': 'Question', 'name': q, 'acceptedAnswer': { '@type': 'Answer', 'text': a } });
    }
    if (!entities.length) return;
    node.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': lang, 'mainEntity': entities });
  }

  function swap(lang) {
    applyLangToDocument(lang);
    applyTexts(lang);
    applyFaqSchema(lang);
    applyWhatsApp(lang);
    applyEmail();
    initTurnstile();
    updateMsgStrength();
    updateToggleLabels(lang);
    storeLang(lang);
  }

  function setLang(lang, opts) {
    if (!isValidLang(lang)) { warn('invalid language "' + lang + '" — ignored'); return; }
    if (opts && opts.animate === false) { swap(lang); return; }
    animateToggle('language-fading', function () { swap(lang); });
  }


  var FORM_FIELDS = ['name', 'phone', 'business_name', 'message'];

  function fieldEls(form) {
    var ids = { name: 'qName', phone: 'qPhone', business_name: 'qBusiness', message: 'qMsg' };
    var out = {};
    for (var i = 0; i < FORM_FIELDS.length; i++) {
      var f = FORM_FIELDS[i];
      out[f] = {
        input: form.querySelector('#' + ids[f]),
        error: form.querySelector('#' + ids[f] + 'Err')
      };
    }
    return out;
  }

  var MSG_STRENGTH_WORDS = [null, 'weak', 'fair', 'good', 'excellent'];

  function msgStrengthLevel(v) {
    var len = String(v || '').trim().length;
    if (!len) return 0;
    if (len < 10) return 1;
    if (len < 30) return 2;
    if (len < 80) return 3;
    return 4;
  }

  function updateMsgStrength() {
    var form = document.getElementById(FORM_ID);
    if (!form) return;
    var wrap = form.querySelector('[data-msg-strength]');
    var fill = form.querySelector('[data-msg-strength-fill]');
    var txt = form.querySelector('[data-msg-strength-text]');
    var input = form.querySelector('#qMsg');
    if (!wrap || !input) return;
    var lvl = msgStrengthLevel(input.value);
    if (!lvl) { wrap.setAttribute('hidden', ''); return; }
    wrap.removeAttribute('hidden');
    if (fill) {
      fill.style.width = (lvl * 25) + '%';
      fill.setAttribute('data-level', String(lvl));
    }
    if (txt) {
      var label = t('pages.contact.form.strength.label', currentLang());
      var word = t('pages.contact.form.strength.' + MSG_STRENGTH_WORDS[lvl], currentLang());
      txt.textContent = (label ? label + ': ' : '') + (word || '');
    }
  }

  function validateField(name, v) {
    if (!v) return 'empty';
    if (name === 'name' || name === 'business_name') {
      if (v.length < 2 || !/[^\d\s\-_.,!@#$%^&*()+=[\]{};':"\\|<>/?~`]/.test(v)) return 'invalid';
    }
    if (name === 'phone') {
      var digits = v.replace(/\D/g, '');
      if (!/^[+\d(][\d\s\-.()]*$/.test(v) || digits.length < 7 || digits.length > 15) return 'invalid';
    }
    if (name === 'message') {
      if (v.length < 10) return 'invalid';
    }
    return null;
  }

  function setFieldError(f, fieldName, errKind, lang) {
    if (!f.input) return;
    if (errKind) {
      var key = 'pages.contact.form.fields.' + fieldName + '.' + errKind + '_error';
      if (f.error) {
        f.error.setAttribute('data-i18n', key);
        var msg = t(key, lang || currentLang());
        if (msg) f.error.textContent = msg;
        f.error.hidden = false;
      }
      f.input.setAttribute('aria-invalid', 'true');
    } else {
      f.input.removeAttribute('aria-invalid');
      if (f.error) f.error.hidden = true;
    }
  }

  function bindQuoteForm() {
    var form = document.getElementById(FORM_ID);
    if (!form || form.__mcFormBound) return;
    form.__mcFormBound = true;
    form.__mcFormT = Date.now();
    var fields = fieldEls(form);


    for (var i = 0; i < FORM_FIELDS.length; i++) {
      (function (fname) {
        var fld = fields[fname];
        if (fld.input) fld.input.addEventListener('input', function () { setFieldError(fld, fname, null); });
      })(FORM_FIELDS[i]);
    }
    if (fields.message && fields.message.input) {
      fields.message.input.addEventListener('input', updateMsgStrength);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('[data-hp]');
      if (hp && hp.value) return;
      if (window.MC && MC.isBot && MC.isBot()) return;
      if (Date.now() - (form.__mcFormT || 0) < 3000) return;
      var lang = currentLang();
      var values = {};
      var firstBad = null;
      for (var j = 0; j < FORM_FIELDS.length; j++) {
        var name = FORM_FIELDS[j];
        var f = fields[name];
        var v = f.input ? f.input.value.trim() : '';
        var errKind = validateField(name, v);
        setFieldError(f, name, errKind, lang);
        if (errKind && !firstBad) firstBad = f;
        values[name] = v;
      }
      if (firstBad) {
        if (firstBad.input) firstBad.input.focus();
        return;
      }
      if (turnstileKey() && !turnstileToken()) {
        setCaptchaError(true);
        var slot = form.__mcTsSlot;
        if (slot && slot.scrollIntoView) slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      setCaptchaError(false);
      var tpl = t('pages.contact.form.template', lang);
      if (!tpl) { warn('form template key missing — aborting'); return; }


      var encoded = tpl.split(/(\{name\}|\{phone\}|\{business\}|\{message\})/g).map(function (chunk) {
        if (chunk === '{name}')          return encodeURIComponent(values.name);
        if (chunk === '{phone}')         return encodeURIComponent(values.phone);
        if (chunk === '{business}')      return encodeURIComponent(values.business_name);
        if (chunk === '{message}')       return encodeURIComponent(values.message);
        return encodeURIComponent(chunk);
      }).join('');
      var url = 'https://wa.me/' + waNumber() + '?text=' + encoded;
      window.open(url, '_blank', 'noopener');
      resetTurnstile();
    });
  }


  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    var toggles = allLangToggles();
    for (var i = 0; i < toggles.length; i++) bindToggle(toggles[i]);
    bindQuoteForm();
    swap(readStoredLang());
    applySeoUrls();

    document.documentElement.setAttribute('data-i18n-ready', '');
    if (!reducedMotion() && document.body) {
      document.body.classList.remove('mc-enter');
      void document.body.offsetWidth;
      document.body.classList.add('mc-enter');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  var api = {
    setLang: setLang,
    getLang: function () { return currentLang(); },
    t: function (key) { return t(key, currentLang()); },
    refresh: function () { swap(currentLang()); },
    CONFIG: CONFIG
  };
  if (typeof window !== 'undefined') {
    window.MC = window.MC || {};
    window.MC.i18n = api;
    window.MC.config = CONFIG;
  }
})();
