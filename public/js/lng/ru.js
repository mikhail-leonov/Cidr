/* Русский языковой пакет — саморегистрируется в window.AppLang. */
(function () {
  var L = (window.AppLang = window.AppLang || {
    dicts: {}, order: [],
    register: function (code, meta, dict) { this.dicts[code] = { meta: meta, dict: dict }; if (this.order.indexOf(code) === -1) this.order.push(code); }
  });
  L.register("ru", { name: "Русский", dir: "ltr" }, {
    hero_a11y_title: "Калькулятор CIDR — преобразование диапазонов IPv4 и IPv6 в блоки CIDR",
    hero_title: "Любой диапазон IP — в точные блоки CIDR",
    hero_lead: "Вставьте диапазоны IPv4 или IPv6 в любом виде — пара IP, маска подсети, октеты с подстановкой или готовый CIDR — и получите наименьший, корректно выровненный набор блоков CIDR, покрывающий их. Преобразуйте целый список за один проход.",
    cta_convert: "Преобразовать диапазон",
    cta_example: "Пример"
  });
})();
