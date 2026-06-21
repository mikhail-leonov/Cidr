/* =========================================================================
   CIDR Calculator landing — i18n bootstrap (public/js/app.js)
   Language packs in js/lng/*.js self-register into window.AppLang before this
   file runs. The current landing markup carries no [data-i18n] attributes, so
   this is a safe no-op until you opt elements in (see README, Optional i18n).
   ========================================================================= */
(function () {
  "use strict";
  var FALLBACK = "en", cur = FALLBACK;
  function reg() { return window.AppLang || { dicts: {}, order: [] }; }
  function dict(c) { var r = reg(); return (r.dicts[c] && r.dicts[c].dict) || {}; }
  function langs() { var r = reg(); return (r.order && r.order.length) ? r.order : Object.keys(r.dicts); }
  function t(key, vars) {
    var d = dict(cur), en = dict(FALLBACK);
    var s = (d[key] != null) ? d[key] : (en[key] != null ? en[key] : key);
    if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : "{" + k + "}"; });
    return s;
  }
  function pick() {
    var saved = null; try { saved = localStorage.getItem("cidr_lang"); } catch (e) {}
    var a = langs();
    if (saved && a.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (a.indexOf(nav) !== -1) return nav;
    return a.indexOf(FALLBACK) !== -1 ? FALLBACK : (a[0] || FALLBACK);
  }
  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (n) { n.innerHTML = t(n.getAttribute("data-i18n-html")); });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (n) { n.setAttribute("placeholder", t(n.getAttribute("data-i18n-ph"))); });
    document.querySelectorAll("[data-i18n-title]").forEach(function (n) { n.setAttribute("title", t(n.getAttribute("data-i18n-title"))); });
  }
  window.AppI18n = { t: t, setLang: function (c) { cur = (langs().indexOf(c) !== -1) ? c : FALLBACK; try { localStorage.setItem("cidr_lang", cur); } catch (e) {} document.documentElement.setAttribute("lang", cur); apply(); } };
  document.addEventListener("DOMContentLoaded", function () { cur = pick(); document.documentElement.setAttribute("lang", cur); apply(); });
})();
