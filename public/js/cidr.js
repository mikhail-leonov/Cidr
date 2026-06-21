/* =========================================================================
   CIDR Calculator — conversion engine (public/js/cidr.js)
   Pure client-side JavaScript. No server, no PHP. IPv4 and IPv6 are handled
   with BigInt so the same range -> minimal CIDR list algorithm works for both.

   Public API (window.CIDR):
     CIDR.convert(text, { wise:false }) -> [{ input, error, cidrs:[{cidr,start,end}] }]
     CIDR.version
   ========================================================================= */
(function (global) {
  "use strict";

  /* ---------------- IPv4 ---------------- */
  function v4ToInt(s) {
    var p = String(s).trim().split(".");
    if (p.length !== 4) return null;
    var n = 0n;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(p[i])) return null;
      var v = Number(p[i]);
      if (v > 255) return null;
      n = (n << 8n) + BigInt(v);
    }
    return n;
  }
  function intToV4(n) {
    return [(n >> 24n) & 255n, (n >> 16n) & 255n, (n >> 8n) & 255n, n & 255n]
      .map(function (x) { return x.toString(); }).join(".");
  }

  /* ---------------- IPv6 ---------------- */
  function v6ToInt(s) {
    s = String(s).trim();
    if (s.indexOf(":") === -1) return null;
    // allow an embedded IPv4 tail (e.g. ::ffff:1.2.3.4)
    var m = s.match(/(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (m) {
      var v4 = v4ToInt(m[2]);
      if (v4 === null) return null;
      s = m[1] + ((v4 >> 16n) & 65535n).toString(16) + ":" + (v4 & 65535n).toString(16);
    }
    var halves = s.split("::");
    if (halves.length > 2) return null;
    var split = function (str) { return str === "" ? [] : str.split(":"); };
    var head = split(halves[0]);
    var groups;
    if (halves.length === 2) {
      var tail = split(halves[1]);
      var missing = 8 - (head.length + tail.length);
      if (missing < 1) return null;
      groups = head.concat(new Array(missing).fill("0")).concat(tail);
    } else {
      groups = head;
    }
    if (groups.length !== 8) return null;
    var n = 0n;
    for (var i = 0; i < 8; i++) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(groups[i])) return null;
      n = (n << 16n) + BigInt(parseInt(groups[i], 16));
    }
    return n;
  }
  function intToV6(n) {
    var g = [];
    for (var i = 7; i >= 0; i--) g.push(((n >> BigInt(i * 16)) & 65535n).toString(16));
    // compress the longest run of consecutive zero groups
    var best = -1, bestLen = 0, cur = -1, curLen = 0;
    for (var j = 0; j < 8; j++) {
      if (g[j] === "0") {
        if (cur < 0) { cur = j; curLen = 1; } else { curLen++; }
        if (curLen > bestLen) { bestLen = curLen; best = cur; }
      } else { cur = -1; curLen = 0; }
    }
    if (bestLen > 1) {
      var before = g.slice(0, best).join(":");
      var after = g.slice(best + bestLen).join(":");
      return (before || "") + "::" + (after || "");
    }
    return g.join(":");
  }

  /* ---------------- range -> minimal CIDR list ---------------- */
  function trailingZeros(n) { var c = 0; while ((n & 1n) === 0n) { c++; n >>= 1n; } return c; }
  function floorLog2(n) { var c = -1; while (n > 0n) { c++; n >>= 1n; } return c; }

  // start/end are BigInt, inclusive; bits = 32 (v4) or 128 (v6).
  function rangeToCidrs(start, end, bits) {
    var out = [];
    var cur = start;
    while (cur <= end) {
      var tz = (cur === 0n) ? bits : trailingZeros(cur);
      if (tz > bits) tz = bits;
      var maxByCount = floorLog2(end - cur + 1n);
      var blockBits = Math.min(tz, maxByCount);
      var prefix = bits - blockBits;
      out.push({ first: cur, prefix: prefix, last: cur + (1n << BigInt(blockBits)) - 1n });
      cur += (1n << BigInt(blockBits));
    }
    return out;
  }

  /* ---------------- formatting ---------------- */
  function fmtV4(c) {
    return { cidr: intToV4(c.first) + "/" + c.prefix, start: intToV4(c.first), end: intToV4(c.last) };
  }
  function fmtV6(c) {
    return { cidr: intToV6(c.first) + "/" + c.prefix, start: intToV6(c.first), end: intToV6(c.last) };
  }

  /* ---------------- IPv4 single-token resolver ---------------- */
  // Returns {start,end} BigInt pair, or {error}, or {cidr} for pass-through.
  var DOTTED_MASK_TO_PREFIX = (function () {
    var map = {};
    for (var p = 0; p <= 32; p++) {
      var maskInt = p === 0 ? 0n : ((0xFFFFFFFFn << BigInt(32 - p)) & 0xFFFFFFFFn);
      map[intToV4(maskInt)] = p;
    }
    return map;
  })();

  function resolveV4(tok, wise) {
    if (wise) tok = tok.replace(/\.1-254/g, ".*");

    // already a CIDR?  a.b.c.d/N
    var mC = tok.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
    if (mC) {
      var ip = v4ToInt(mC[1]); var pre = Number(mC[2]);
      if (ip === null || pre > 32) return { error: "Invalid CIDR: " + tok };
      var maskBitsV = 32 - pre;
      var net = (ip >> BigInt(maskBitsV)) << BigInt(maskBitsV);
      return { start: net, end: net + (1n << BigInt(maskBitsV)) - 1n };
    }

    // ip / dotted-netmask  ->  prefix
    var mM = tok.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mM) {
      var pre2 = DOTTED_MASK_TO_PREFIX[mM[2]];
      if (pre2 === undefined) return { error: "Invalid netmask: " + tok };
      var ip2 = v4ToInt(mM[1]); if (ip2 === null) return { error: "Invalid address: " + tok };
      var mb = 32 - pre2;
      var net2 = (ip2 >> BigInt(mb)) << BigInt(mb);
      return { start: net2, end: net2 + (1n << BigInt(mb)) - 1n };
    }

    // two-IP range  a.b.c.d-e.f.g.h
    if (tok.indexOf("-") !== -1) {
      var pair = tok.split("-");
      if (pair.length === 2) {
        var a = v4ToInt(pair[0]), b = v4ToInt(pair[1]);
        if (a !== null && b !== null) {
          if (a > b) { var tmp = a; a = b; b = tmp; }
          return { start: a, end: b };
        }
      }
    }

    // octet form: each octet = N | a-b | *  (e.g. 127.1.10-31.*)
    var segs = tok.split(".");
    if (segs.length === 4) {
      var lo = 0n, hi = 0n, ok = true;
      for (var i = 0; i < 4; i++) {
        var seg = segs[i], a2, b2;
        if (seg === "*" || seg === "") { a2 = 0; b2 = 255; }
        else if (/^\d{1,3}$/.test(seg)) { a2 = b2 = Number(seg); }
        else {
          var r = seg.match(/^(\d{1,3})-(\d{1,3})$/);
          if (!r) { ok = false; break; }
          a2 = Number(r[1]); b2 = Number(r[2]);
        }
        if (a2 > 255 || b2 > 255 || a2 > b2) { ok = false; break; }
        lo = (lo << 8n) + BigInt(a2);
        hi = (hi << 8n) + BigInt(b2);
      }
      if (ok) return { start: lo, end: hi };
    }

    return { error: "Unrecognized IPv4 range: " + tok };
  }

  /* ---------------- IPv6 single-token resolver ---------------- */
  function resolveV6(tok) {
    var mC = tok.match(/^(.+)\/(\d{1,3})$/);
    if (mC && mC[1].indexOf(":") !== -1) {
      var ip = v6ToInt(mC[1]); var pre = Number(mC[2]);
      if (ip === null || pre > 128) return { error: "Invalid IPv6 CIDR: " + tok };
      var mb = 128 - pre;
      var net = (ip >> BigInt(mb)) << BigInt(mb);
      return { start: net, end: net + (1n << BigInt(mb)) - 1n };
    }
    if (tok.indexOf("-") !== -1) {
      var pair = tok.split("-");
      if (pair.length === 2) {
        var a = v6ToInt(pair[0]), b = v6ToInt(pair[1]);
        if (a !== null && b !== null) {
          if (a > b) { var t = a; a = b; b = t; }
          return { start: a, end: b };
        }
      }
    }
    var single = v6ToInt(tok);
    if (single !== null) return { start: single, end: single };
    return { error: "Unrecognized IPv6 range: " + tok };
  }

  /* ---------------- input normalization + batch convert ---------------- */
  function normalize(text) {
    return String(text)
      .replace(/x/gi, "*")          // x as a wildcard digit
      .replace(/\u2013/g, "-")      // en-dash -> hyphen
      .replace(/\band\b/gi, "\n")  // "and" separates ranges
      .replace(/;/g, "\n")
      .replace(/\|/g, "")
      .replace(/\\/g, "")
      .replace(/ /g, "");           // collapse spaces (range hyphens still split)
  }

  function convert(text, opts) {
    opts = opts || {};
    var wise = !!opts.wise;
    var tokens = normalize(text).split(/[\n,]+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });

    var results = [];
    tokens.forEach(function (tok) {
      var isV6 = tok.indexOf(":") !== -1;
      var r = isV6 ? resolveV6(tok) : resolveV4(tok, wise);
      if (r.error) { results.push({ input: tok, error: r.error, cidrs: [] }); return; }
      var bits = isV6 ? 128 : 32;
      if (r.start > r.end) { results.push({ input: tok, error: "Start address is after end: " + tok, cidrs: [] }); return; }
      var blocks = rangeToCidrs(r.start, r.end, bits);
      var cidrs = blocks.map(isV6 ? fmtV6 : fmtV4);
      results.push({ input: tok, error: null, cidrs: cidrs });
    });
    return results;
  }

  // Render results as plain text (matches the tool's textarea output).
  function toText(results) {
    var lines = [];
    results.forEach(function (res) {
      lines.push(res.input + " =>");
      if (res.error) { lines.push("   => " + res.error); }
      else { res.cidrs.forEach(function (c) { lines.push("   => " + c.start + " - " + c.end + " => " + c.cidr); }); }
      lines.push("");
    });
    return lines.join("\n").replace(/\n+$/, "\n");
  }

  var API = { version: "1.0", convert: convert, toText: toText,
    v4ToInt: v4ToInt, intToV4: intToV4, v6ToInt: v6ToInt, intToV6: intToV6 };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  global.CIDR = API;
})(typeof window !== "undefined" ? window : globalThis);
