# CIDR Calculator

Convert arbitrary IPv4 and IPv6 ranges into the **minimal, correctly aligned list of CIDR blocks** that covers them — and see the start–end range each block expands to. Runs **entirely in the browser** with plain JavaScript. No server, no backend, no PHP.

IPv4 and IPv6 are handled with `BigInt`, so the same range-to-CIDR algorithm works for both.

---

## Features

- **IPv4 and IPv6**, auto-detected by the presence of `:`.
- Flexible input shapes:
  - **Two-IP ranges** — `187.17.2.2 - 192.11.4.29`
  - **Wildcard / octet ranges** — `127.1.10-31.*`
  - **Netmask notation** — `10.0.0.0/255.255.255.0` (mapped to `/24`)
  - **Existing CIDR** — `192.168.1.0/24`, `2001:db8::/32`
- **Batch conversion** — many ranges at once, separated by commas, semicolons, new lines, or "and".
- **"Wise" toggle** — normalizes `.1-254` octets to `.*` (full `0-255`).
- Per-entry validation with clear error messages; each result lists every CIDR and its `start - end` range.
- **Shareable links** — the current range is reflected in the URL (`?range=…&wise=on`), and the calculator restores from it on load.

---

## Project structure

```
Cidr/
├── index.html                   Single page: hero + calculator (no inline JS)
├── README.md
└── public/
    ├── css/
    │   ├── app.css              Styles (hero, Fraunces heading hooks)
    │   └── bootstrap/bootstrap.min.css   ← placeholder (CDN fallback; vendor real file)
    ├── fonts/common/fraunces.css         ← placeholder (CDN fallback; self-host)
    ├── icons/common/bootstrap-icons.css  ← placeholder (CDN fallback; vendor real file)
    └── js/
        ├── cidr.js              Conversion engine (IPv4 + IPv6, BigInt) — the core
        ├── app.js               ALL page logic: i18n + calculator wiring + hero buttons
        ├── bootstrap/bootstrap.min.js    ← placeholder (vendor real bundle)
        └── lng/
            ├── en.js            English strings
            └── ru.js            Russian strings
```

The entire app is a **single HTML file**; every line of JavaScript lives in `public/js/`. There is no build step and no server requirement — it's static HTML/CSS/JS.

---

## Running it

Open `index.html` directly, or serve the folder over HTTP:

```bash
# any static server works, e.g.
npx serve .
# or
python -m http.server 8000
```

`index.html` reads `?range=` (and `?wise=on`) from the URL on load, so deep links restore straight into a result. The hero's "Convert a range" and "Try an example" buttons scroll to the calculator (and the example prefills and runs).

### Using the API directly

`public/js/cidr.js` exposes a small API on `window.CIDR` (and as a CommonJS module for Node):

```js
const results = CIDR.convert("187.17.2.2 - 192.11.4.29", { wise: false });
// results: [{ input, error, cidrs: [{ cidr, start, end }, …] }]
console.log(CIDR.toText(results)); // formatted text for the output box
```

---

## Third-party assets (placeholders)

To keep this archive self-contained without redistributing large libraries, four vendored files are **placeholders that fall back to a CDN** so the pages render immediately:

| File | Replace with | Source |
|------|--------------|--------|
| `public/css/bootstrap/bootstrap.min.css` | Bootstrap 5 CSS | https://github.com/twbs/bootstrap/releases |
| `public/js/bootstrap/bootstrap.min.js` | Bootstrap 5 JS bundle | (same) |
| `public/icons/common/bootstrap-icons.css` | Bootstrap Icons | https://github.com/twbs/icons/releases |
| `public/fonts/common/fraunces.css` | Self-hosted Fraunces | https://fonts.google.com/specimen/Fraunces |

For production or offline use, drop the real files in and remove the CDN `@import` fallbacks. The calculator's own logic (`cidr.js`) has **no third-party dependencies** and works offline regardless.

---

## Notes on the conversion

The engine produces the **smallest set of aligned CIDR blocks** that exactly covers each input range, using a standard largest-aligned-block walk over `BigInt` addresses. Reversed ranges (end before start) are sorted automatically; out-of-range octets, malformed CIDRs, and unparseable tokens are reported per entry rather than silently dropped.
