(function () {
  'use strict';


  var CONFIG = {
    WHATSAPP_NUMBER: "15551234567",
    SITE_DOMAIN: ""
  };


  var LANG_KEY     = 'mc-lang';
  var THEME_KEY    = 'mc-theme';
  var DEFAULT_LANG = 'en';
  var FADE_CLASS   = 'mc-i18n-fade';
  var TOGGLE_ID    = 'langToggle';
  var THEME_ID     = 'themeToggle';
  var FORM_ID      = 'quoteForm';
  var DIR_BY_LANG  = { ar: 'rtl', en: 'ltr' };


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

  function reducedMotion() {
    return typeof matchMedia === 'function' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;
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


  var THEME_LABEL = {
    ar: { toDark: 'التبديل إلى المظهر الداكن', toLight: 'التبديل إلى المظهر الفاتح' },
    en: { toDark: 'Switch to dark theme',       toLight: 'Switch to light theme' }
  };

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateThemeToggle(theme, lang) {
    var btn = document.getElementById(THEME_ID);
    if (!btn) return;
    var labels = THEME_LABEL[isValidLang(lang) ? lang : DEFAULT_LANG];
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.setAttribute('aria-label', theme === 'dark' ? labels.toLight : labels.toDark);
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {  }
    updateThemeToggle(theme, currentLang());
  }

  function bindThemeToggle() {
    var btn = document.getElementById(THEME_ID);
    if (!btn || btn.__mcThemeBound) return;
    btn.__mcThemeBound = true;
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }


  var pendingLang = null;

  function swap(lang) {
    applyLangToDocument(lang);
    applyTexts(lang);
    applyWhatsApp(lang);
    updateToggleLabels(lang);
    updateThemeToggle(currentTheme(), lang);
    storeLang(lang);
  }

  function setLang(lang, opts) {
    if (!isValidLang(lang)) { warn('invalid language "' + lang + '" — ignored'); return; }
    pendingLang = lang;
    var animate = !(opts && opts.animate === false) && !reducedMotion();
    var body = document.body;
    if (!animate || !body) { pendingLang = null; swap(lang); return; }
    if (body.classList.contains(FADE_CLASS)) return;
    body.classList.add(FADE_CLASS);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var target = pendingLang || lang;
        pendingLang = null;
        swap(target);
        void body.offsetWidth;
        body.classList.remove(FADE_CLASS);
        if (pendingLang && pendingLang !== target) setLang(pendingLang);
      });
    });
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

  function setFieldError(f, on) {
    if (!f.input) return;
    if (on) {
      f.input.setAttribute('aria-invalid', 'true');
      if (f.error) f.error.hidden = false;
    } else {
      f.input.removeAttribute('aria-invalid');
      if (f.error) f.error.hidden = true;
    }
  }

  function bindQuoteForm() {
    var form = document.getElementById(FORM_ID);
    if (!form || form.__mcFormBound) return;
    form.__mcFormBound = true;
    var fields = fieldEls(form);


    for (var i = 0; i < FORM_FIELDS.length; i++) {
      (function (f) {
        if (f.input) f.input.addEventListener('input', function () { setFieldError(f, false); });
      })(fields[FORM_FIELDS[i]]);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lang = currentLang();
      var values = {};
      var firstBad = null;
      for (var j = 0; j < FORM_FIELDS.length; j++) {
        var name = FORM_FIELDS[j];
        var f = fields[name];
        var v = f.input ? f.input.value.trim() : '';
        var bad = !v;
        setFieldError(f, bad);
        if (bad && !firstBad) firstBad = f;
        values[name] = v;
      }
      if (firstBad) {
        if (firstBad.input) firstBad.input.focus();
        return;
      }
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
    });
  }


  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    var toggles = allLangToggles();
    for (var i = 0; i < toggles.length; i++) bindToggle(toggles[i]);
    bindThemeToggle();
    bindQuoteForm();
    swap(readStoredLang());




    document.documentElement.setAttribute('data-i18n-ready', '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  var api = {
    setLang: setLang,
    getLang: function () { return currentLang(); },
    setTheme: setTheme,
    getTheme: function () { return currentTheme(); },
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
