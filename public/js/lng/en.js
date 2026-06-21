/* English pack — self-registers into window.AppLang.
   Copy this file, translate the values, change register('xx', …),
   and add a <script> tag in index.html to add a language. */
(function () {
  var L = (window.AppLang = window.AppLang || {
    dicts: {}, order: [],
    register: function (code, meta, dict) { this.dicts[code] = { meta: meta, dict: dict }; if (this.order.indexOf(code) === -1) this.order.push(code); }
  });
  L.register("en", { name: "English", dir: "ltr" }, {
    hero_a11y_title: "CIDR Calculator — convert IPv4 and IPv6 ranges to CIDR blocks",
    hero_title: "From any IP range to the exact CIDR blocks",
    hero_lead: "Paste IPv4 or IPv6 ranges however you have them — two-IP spans, netmask notation, wildcard octets, or existing CIDR — and get the smallest, correctly aligned set of CIDR blocks that covers them. Convert a whole list in one pass.",
    cta_convert: "Convert a range",
    cta_example: "Try an example"
  });
})();
