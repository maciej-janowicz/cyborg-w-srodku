/* Cyborg w Środku — narzędzia pomocnicze (działają w przeglądarce i w Node). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.CM = root.CM || {}; root.CM.util = api; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Alfabet Crocforda (bez I, L, O, U) — kody da się dyktować i przepisywać. */
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Deterministyczne tasowanie: ta sama kolejność na każdym telefonie. */
  function shuffle(arr, seed) {
    var rnd = mulberry32(fnv1a(String(seed)));
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Permutacja indeksów 0..n-1, zawsze różna od tożsamościowej (dla n>1). */
  function shuffledIndices(n, seed) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    var s = shuffle(idx, seed);
    var same = true;
    for (i = 0; i < n; i++) if (s[i] !== i) { same = false; break; }
    if (same && n > 1) s = s.slice(1).concat(s[0]);
    return s;
  }

  function bytesToB32(bytes) {
    var out = '', bits = 0, val = 0;
    for (var i = 0; i < bytes.length; i++) {
      val = (val << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        out += B32.charAt((val >>> (bits - 5)) & 31);
        bits -= 5;
      }
      val &= (1 << bits) - 1;
    }
    if (bits > 0) out += B32.charAt((val << (5 - bits)) & 31);
    return out;
  }

  function b32ToBytes(str) {
    var bytes = [], bits = 0, val = 0;
    for (var i = 0; i < str.length; i++) {
      var idx = B32.indexOf(str.charAt(i));
      if (idx < 0) return null;
      val = (val << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((val >>> (bits - 8)) & 255);
        bits -= 8;
        val &= (1 << bits) - 1;
      }
    }
    return bytes;
  }

  function normalizeCode(s) {
    return String(s || '').toUpperCase()
      .replace(/[\s\-_.]/g, '')
      .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  }

  function groups(s, n) {
    var out = [];
    for (var i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
    return out.join(' ');
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* 125 -> "2:05" */
  function fmtClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return Math.floor(sec / 60) + ':' + pad2(sec % 60);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* Pamięć trwała z awaryjnym zapasem w RAM (tryb prywatny, zablokowane ciasteczka). */
  function makeStore(ls) {
    var mem = {};
    var ok = false;
    try {
      if (ls) { ls.setItem('__cm_t', '1'); ls.removeItem('__cm_t'); ok = true; }
    } catch (e) { ok = false; }
    return {
      persistent: ok,
      get: function (k) {
        try {
          var v = ok ? ls.getItem(k) : (k in mem ? mem[k] : null);
          return v === null || v === undefined ? null : JSON.parse(v);
        } catch (e) { return null; }
      },
      set: function (k, v) {
        var s = JSON.stringify(v);
        try { if (ok) ls.setItem(k, s); else mem[k] = s; } catch (e) { mem[k] = s; }
      },
      del: function (k) {
        try { if (ok) ls.removeItem(k); } catch (e) { /* nic */ }
        delete mem[k];
      }
    };
  }

  return {
    B32: B32, fnv1a: fnv1a, mulberry32: mulberry32, shuffle: shuffle,
    shuffledIndices: shuffledIndices, bytesToB32: bytesToB32, b32ToBytes: b32ToBytes,
    normalizeCode: normalizeCode, groups: groups, pad2: pad2, fmtClock: fmtClock,
    esc: esc, clamp: clamp, makeStore: makeStore
  };
}));
