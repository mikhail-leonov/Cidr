/* =========================================================================
   CIDR Calculator — page logic (public/js/app.js)
   ALL JavaScript for the page lives here (no inline scripts in index.html):
     1. i18n bootstrap (safe no-op until elements opt in with data-i18n)
     2. calculator wiring (form, Enter-to-convert, copy, shareable URL)
     3. hero call-to-action buttons
   Depends on public/js/cidr.js (window.CIDR) and the js/lng/*.js packs.
   ========================================================================= */
(function (global) {
  "use strict";

  /* ---------------- 1. i18n ---------------- */
  var FALLBACK = "en", cur = FALLBACK;
  function reg() { return global.AppLang || { dicts: {}, order: [] }; }
  function dict(c) { var r = reg(); return (r.dicts[c] && r.dicts[c].dict) || {}; }
  function langs() { var r = reg(); return (r.order && r.order.length) ? r.order : Object.keys(r.dicts); }
  function t(key, vars) {
    var d = dict(cur), en = dict(FALLBACK);
    var s = (d[key] != null) ? d[key] : (en[key] != null ? en[key] : key);
    if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : "{" + k + "}"; });
    return s;
  }
  function pickLang() {
    var saved = null; try { saved = localStorage.getItem("cidr_lang"); } catch (e) {}
    var a = langs();
    if (saved && a.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (a.indexOf(nav) !== -1) return nav;
    return a.indexOf(FALLBACK) !== -1 ? FALLBACK : (a[0] || FALLBACK);
  }
  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (n) { n.innerHTML = t(n.getAttribute("data-i18n-html")); });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (n) { n.setAttribute("placeholder", t(n.getAttribute("data-i18n-ph"))); });
    document.querySelectorAll("[data-i18n-title]").forEach(function (n) { n.setAttribute("title", t(n.getAttribute("data-i18n-title"))); });
  }
  global.AppI18n = {
    t: t,
    setLang: function (c) {
      cur = (langs().indexOf(c) !== -1) ? c : FALLBACK;
      try { localStorage.setItem("cidr_lang", cur); } catch (e) {}
      document.documentElement.setAttribute("lang", cur);
      applyI18n();
    }
  };

  /* ---------------- 2 + 3. calculator + hero ---------------- */
  var EXAMPLE = "187.17.2.2 - 192.11.4.29";

  function initCalculator() {
    var form = document.getElementById("form");
    var input = document.getElementById("range");
    var output = document.getElementById("holdtext");
    var wise = document.getElementById("wise");
    var copyBtn = document.getElementById("copyBtn");
    var calc = document.getElementById("calculator");
    if (!form || !input || !output || !wise || !global.CIDR) return;

    function run() {
      var text = input.value.trim();
      if (!text) { output.value = ""; if (copyBtn) copyBtn.classList.add("d-none"); return; }
      var results = global.CIDR.convert(text, { wise: wise.checked });
      output.value = global.CIDR.toText(results);
      if (copyBtn) copyBtn.classList.toggle("d-none", !output.value);
      // keep the URL shareable: ?range=…&wise=on
      var qs = new URLSearchParams();
      qs.set("range", text);
      if (wise.checked) qs.set("wise", "on");
      history.replaceState(null, "", "?" + qs.toString());
      output.focus(); output.select();
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });

    // Enter converts; Shift+Enter inserts a newline
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(output.value).then(function () {
          copyBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Copied';
          setTimeout(function () { copyBtn.innerHTML = '<i class="bi bi-clipboard-check me-1"></i>Copy'; }, 1200);
        });
      });
    }

    // hero call-to-action buttons
    function scrollToCalc() { if (calc) calc.scrollIntoView({ behavior: "smooth", block: "start" }); }
    var ctaConvert = document.getElementById("ctaConvert");
    var ctaExample = document.getElementById("ctaExample");
    if (ctaConvert) ctaConvert.addEventListener("click", function () { scrollToCalc(); setTimeout(function () { input.focus(); }, 300); });
    if (ctaExample) ctaExample.addEventListener("click", function () { input.value = EXAMPLE; run(); scrollToCalc(); });

    // restore state from the query string (deep links work without a server)
    var params = new URLSearchParams(location.search);
    if (params.get("wise") === "on") wise.checked = true;
    var r = params.get("range");
    if (r) { input.value = r; run(); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    cur = pickLang();
    document.documentElement.setAttribute("lang", cur);
    applyI18n();
    initCalculator();
  });
})(typeof window !== "undefined" ? window : globalThis);
