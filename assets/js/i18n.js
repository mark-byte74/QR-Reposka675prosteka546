/* ==========================================================================
 * Menu Codes — i18n framework
 * Vanilla JS · zero dependencies · works on any number of pages.
 *
 * WHAT IT DOES
 *  1. Reads the saved language from localStorage ("mc-lang", default "ar").
 *  2. Applies it to every [data-i18n] (text) and [data-i18n-attr] (attributes).
 *  3. Sets <html lang> and dir (ar → rtl, en → ltr).
 *  4. Builds every WhatsApp button ([data-wa]) as
 *       https://wa.me/<WHATSAPP_NUMBER>?text=<encoded message>
 *     (the message comes from the dictionary via data-wa-text="<key>").
 *  5. Binds #langToggle automatically when present.
 *
 * HTML CONVENTIONS (full reference: _spec/i18n-keys.md)
 *  <h1 data-i18n="index.hero.title">…</h1>
 *  <title data-i18n="index.meta.title">…</title>
 *  <input data-i18n-attr="placeholder:common.search">
 *  <img data-i18n-attr="alt:features.hero.heading">
 *  <a data-wa data-wa-text="contact.body" target="_blank" rel="noopener">…</a>
 *  <button id="langToggle" type="button">EN</button>
 *
 * LOAD ORDER (before </body>, on every page):
 *  <script src="assets/js/dictionary.js"></script>
 *  <script src="assets/js/i18n.js"></script>
 *
 * FADE CSS (opacity only — add to the site stylesheet):
 *  body { transition: opacity .22s ease; }
 *  body.mc-i18n-fade { opacity: 0; }
 *  @media (prefers-reduced-motion: reduce) { body { transition: none; } }
 * ========================================================================== */
(function () {
  'use strict';

  /* ---- 1. WhatsApp number -------------------------------------------------
   * International format, digits only (no "+", no spaces, no dashes).
   */
  // ←←← ضع رقم الواتساب هنا
  const WHATSAPP_NUMBER = "15551234567"; // ← ضع رقم الواتساب هنا

  /* ---- 2. Constants -------------------------------------------------------- */
  var STORE_KEY    = 'mc-lang';
  var DEFAULT_LANG = 'ar';
  var FADE_CLASS   = 'mc-i18n-fade';
  var TOGGLE_ID    = 'langToggle';
  var DIR_BY_LANG  = { ar: 'rtl', en: 'ltr' };

  /* ---- 3. Small helpers ----------------------------------------------------- */
  function getDictionary() {
    if (typeof MC_I18N !== 'undefined' && MC_I18N) return MC_I18N;
    if (typeof window !== 'undefined' && window.MC_I18N) return window.MC_I18N;
    return {};
  }

  function warn(msg) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[mc-i18n] ' + msg);
  }

  function isValidLang(l) { return l === 'ar' || l === 'en'; }

  // Returns the string for key+lang, or null when the key is unknown
  // (unknown keys leave the element untouched — never blank it).
  function t(key, lang) {
    var entry = getDictionary()[key];
    if (!entry) { warn('missing dictionary key "' + key + '" — element left unchanged'); return null; }
    return entry[lang] || entry[DEFAULT_LANG] || null;
  }

  function readStoredLang() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      if (isValidLang(v)) return v;
    } catch (e) { /* storage unavailable — fall through to default */ }
    return DEFAULT_LANG;
  }

  function reducedMotion() {
    return typeof matchMedia === 'function' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function waNumber() { return String(WHATSAPP_NUMBER).replace(/\D/g, ''); }

  /* ---- 4. Apply a language to the DOM --------------------------------------- */
  function applyTexts(lang) {
    // [data-i18n] → text via textContent (no HTML parsing — XSS-safe).
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var el = textEls[i];
      var key = el.getAttribute('data-i18n');
      if (!key) continue;
      var val = t(key, lang);
      if (val === null) continue;
      if (el.textContent !== val) el.textContent = val;
    }
    // [data-i18n-attr] → attributes. Format: "attr:key;attr:key"
    // e.g. data-i18n-attr="placeholder:common.search;title:faq.hero.heading"
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
    if (!num) { warn('WHATSAPP_NUMBER is empty — WhatsApp links not built'); return; }
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
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
  }

  /* ---- 5. The header toggle button ------------------------------------------- */
  function currentLang() {
    var fromDom = document.documentElement.getAttribute('lang');
    return isValidLang(fromDom) ? fromDom : readStoredLang();
  }

  function updateToggleLabel(lang) {
    var btn = document.getElementById(TOGGLE_ID);
    if (!btn) return;
    if (btn.hasAttribute('data-i18n')) return; // label driven by the dictionary
    // Show the *target* language name (framework chrome, not site copy).
    btn.textContent = (lang === 'ar') ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', (lang === 'ar') ? 'Switch to English' : 'التبديل إلى العربية');
  }

  function bindToggle() {
    var btn = document.getElementById(TOGGLE_ID);
    if (!btn || btn.__mcI18nBound) return; // bind once — repeated init() never double-binds
    btn.__mcI18nBound = true;
    btn.addEventListener('click', function () {
      setLang(currentLang() === 'ar' ? 'en' : 'ar');
    });
  }

  /* ---- 6. Swap (with optional fade) ------------------------------------------- */
  var pendingLang = null; // latest request received while a fade is running

  function swap(lang) {
    applyLangToDocument(lang);
    applyTexts(lang);
    applyWhatsApp(lang);
    updateToggleLabel(lang);
    storeLang(lang);
  }

  function setLang(lang, opts) {
    if (!isValidLang(lang)) { warn('invalid language "' + lang + '" — ignored'); return; }
    pendingLang = lang;
    var animate = !(opts && opts.animate === false) && !reducedMotion();
    var body = document.body;
    if (!animate || !body) { pendingLang = null; swap(lang); return; }
    if (body.classList.contains(FADE_CLASS)) return; // fade running — rAF below picks up pendingLang
    body.classList.add(FADE_CLASS);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var target = pendingLang || lang;
        pendingLang = null;
        swap(target);
        void body.offsetWidth; // reflow so the fade-in transition plays
        body.classList.remove(FADE_CLASS);
        if (pendingLang && pendingLang !== target) setLang(pendingLang); // newest request wins
      });
    });
  }

  /* ---- 7. Init ------------------------------------------------------------------ */
  var initialized = false;
  function init() {
    if (initialized) return; // idempotent — safe if called again
    initialized = true;
    bindToggle();
    swap(readStoredLang()); // first paint: instant, no animation
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- 8. Public API -------------------------------------------------------------- */
  var api = {
    setLang: setLang,
    getLang: function () { return currentLang(); },
    t: function (key) { return t(key, currentLang()); },
    refresh: function () { swap(currentLang()); }, // re-apply (e.g. after DOM injection)
    WHATSAPP_NUMBER: WHATSAPP_NUMBER
  };
  if (typeof window !== 'undefined') {
    window.MC = window.MC || {};
    window.MC.i18n = api;
  }
})();
