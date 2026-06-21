# CIDR Calculator

Convert arbitrary IPv4 and IPv6 ranges into the **minimal, correctly aligned list of CIDR blocks** that covers them — and expand CIDR back into its start–end range. Built on the `Lifo\IP` PHP library with BCMath for big-number IPv6 arithmetic. Supports PHP 5.3+ (32- & 64-bit).

This package contains two parts:

- **`php/`** — the working application (`index.php` + helper classes).
- **`index.html` + `public/`** — a one-page marketing landing page that links into the calculator.

---

## Features

- **IPv4 and IPv6**, auto-detected by the presence of `:`.
- Flexible input shapes:
  - **Two-IP ranges** — `187.17.2.2 - 192.11.4.29`
  - **Wildcard / octet ranges** — `127.1.10-31.*`
  - **Netmask notation** — `10.0.0.0/255.255.255.0` (auto-mapped to `/24`)
  - **Existing CIDR** — passed through and validated
- **Batch conversion** — many ranges at once, separated by commas, semicolons, newlines, or "and".
- **"Wise" toggle** — normalizes `.1-254` octets to `.*` (full `0-255`).
- Per-entry validation with explicit `*INCORRECT RANGE*` messages; each result shows `range => CIDR` and `start - end => CIDR`.

---

## Project structure

```
Cidr/
├── index.html                      Landing page (references public/ assets)
├── README.md
├── php/                            The CIDR application
│   ├── index.php                   Main converter page (entry point)
│   ├── bc.class.php                BCMath helpers (big-number math)
│   ├── cidr4.class.php             IPv4 CIDR/range routines
│   ├── cidr6.class.php             IPv6 CIDR/range routines
│   ├── ip.class.php                IP parsing/inflation helpers
│   ├── url.class.php               Query-string helpers
│   ├── utils.class.php             Range detection & parsing utilities
│   └── uuid.class.php              UUID helper
└── public/                         Landing-page assets
    ├── css/
    │   ├── app.css                 Landing styles (hero, Fraunces heading hooks)
    │   └── bootstrap/bootstrap.min.css      ← placeholder (CDN fallback; vendor real file)
    ├── fonts/common/fraunces.css            ← placeholder (CDN fallback; self-host)
    ├── icons/common/bootstrap-icons.css     ← placeholder (CDN fallback; vendor real file)
    └── js/
        ├── app.js                  i18n bootstrap (safe no-op until you add data-i18n)
        ├── bootstrap/bootstrap.min.js       ← placeholder (vendor real bundle)
        └── lng/
            ├── en.js               English strings (incl. hero copy)
            └── ru.js               Russian strings
```

---

## Running it

**The calculator** is PHP and needs a PHP-capable server:

```bash
cd php
php -S localhost:8000
# open http://localhost:8000/index.php
```

`index.php` reads the range from the `?range=` query parameter and from the textarea, so the landing page's "Convert a range" and "Try an example" buttons deep-link straight into it.

**The landing page** (`index.html`) is static — open it directly or serve it over HTTP. It links to `php/index.php` via the CTA buttons (adjust the paths if you deploy the two under different roots).

---

## Third-party assets (placeholders)

To keep this archive self-contained without redistributing large libraries, four vendored files are **placeholders that fall back to a CDN** so the landing page renders immediately:

| File | Replace with | Source |
|------|--------------|--------|
| `public/css/bootstrap/bootstrap.min.css` | Bootstrap 5 CSS | https://github.com/twbs/bootstrap/releases |
| `public/js/bootstrap/bootstrap.min.js` | Bootstrap 5 JS bundle | (same) |
| `public/icons/common/bootstrap-icons.css` | Bootstrap Icons | https://github.com/twbs/icons/releases |
| `public/fonts/common/fraunces.css` | Self-hosted Fraunces | https://fonts.google.com/specimen/Fraunces |

For production or offline use, drop the real files in and remove the CDN `@import` fallbacks. Note that the original `php/index.php` references its own `/assets/...` (Bootstrap + jQuery) layout, which is separate from the landing page's `public/...` assets.

---

## Optional: localize the landing page

The page ships with `app.js` and `en.js` / `ru.js` (which already include the hero strings). To make the copy follow a language switch, add `data-i18n` attributes to the heading, lead, and buttons — e.g. `data-i18n="hero_title"` — and call `AppI18n.setLang('ru')`. Only add the attributes once the keys exist, or the raw key will render.

---

## Credits

CIDR application by Mikhail Leonov. IPv4/IPv6 routines adapted from the `Lifo\IP` library (Jason Morriss) and CIDR4 helpers (Jonavon Wilcox / Carlos Guimarães).
"# Cidr" 
