/* Cyborg w Środku — silnik gry: czas, fazy, ocenianie, punktacja, kody raportów.
 * Czysta logika bez DOM — testowana w Node (tests/*.test.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./util.js'), require('./content.js'));
  } else {
    root.CM = root.CM || {};
    root.CM.engine = factory(root.CM.util, root.CM.content);
  }
}(typeof self !== 'undefined' ? self : this, function (U, content) {
  'use strict';

  var EPOCH = Date.UTC(2026, 0, 1);
  var SALT = 'cyborg-w-srodku/v1/lupin+sholmes+bond+kornacka';
  var ACTS = content.acts.length;
  var SLOTS = content.slots;

  /* ---------- kod sesji ---------- */

  function sessionCheck(body) { return U.B32.charAt(U.fnv1a('S' + body + SALT) % 32); }

  function encodeSession(startMs) {
    var min = Math.round((startMs - EPOCH) / 60000);
    if (!(min >= 0 && min < Math.pow(32, 5))) throw new Error('Czas poza zakresem kodu sesji');
    var s = '';
    for (var i = 0; i < 5; i++) { s = U.B32.charAt(min % 32) + s; min = Math.floor(min / 32); }
    return s + sessionCheck(s);
  }

  function decodeSession(code) {
    var c = U.normalizeCode(code);
    if (c.length !== 6) return null;
    var body = c.slice(0, 5);
    if (sessionCheck(body) !== c.charAt(5)) return null;
    var min = 0;
    for (var i = 0; i < 5; i++) {
      var idx = U.B32.indexOf(body.charAt(i));
      if (idx < 0) return null;
      min = min * 32 + idx;
    }
    return { code: c, startMs: EPOCH + min * 60000, startMin: min };
  }

  function fmtSessionCode(c) { return c.slice(0, 3) + '-' + c.slice(3); }

  /* ---------- oś czasu ---------- */

  function buildTimeline(cnt) {
    var t = 0, segs = [];
    segs.push({ kind: 'prolog', start: 0, dur: cnt.prologSec });
    t += cnt.prologSec;
    cnt.acts.forEach(function (a, i) {
      segs.push({ kind: 'act', index: i, start: t, dur: a.durSec, revealSec: a.revealSec });
      t += a.durSec;
    });
    segs.push({ kind: 'finale', start: t, dur: cnt.finale.durSec, revealSec: cnt.finale.unmaskSec });
    t += cnt.finale.durSec;
    return { segs: segs, total: t };
  }

  var TL = buildTimeline(content);

  /* Faza gry w chwili tSec (sekundy od startu; ujemne = przed startem). */
  function phaseAt(tSec, tl) {
    tl = tl || TL;
    if (tSec < 0) return { kind: 'before', left: -tSec };
    if (tSec >= tl.total) return { kind: 'after', left: 0 };
    var seg = null;
    for (var i = 0; i < tl.segs.length; i++) {
      if (tSec >= tl.segs[i].start && tSec < tl.segs[i].start + tl.segs[i].dur) { seg = tl.segs[i]; break; }
    }
    var into = tSec - seg.start, segLeft = seg.dur - into;
    if (seg.kind === 'prolog') return { kind: 'prolog', left: segLeft, dur: seg.dur };
    var workDur = seg.dur - seg.revealSec;
    if (seg.kind === 'act') {
      if (into < workDur) return { kind: 'act', index: seg.index, phase: 'work', left: workDur - into, workDur: workDur, segLeft: segLeft };
      return { kind: 'act', index: seg.index, phase: 'reveal', left: segLeft, workDur: workDur, segLeft: segLeft };
    }
    if (into < workDur) return { kind: 'finale', phase: 'accuse', left: workDur - into, workDur: workDur, segLeft: segLeft };
    return { kind: 'finale', phase: 'unmask', left: segLeft, workDur: workDur, segLeft: segLeft };
  }

  /* Ile aktów już się zakończyło (jest po ich fazie 'reveal'). */
  function actsEndedAt(tSec, tl) {
    tl = tl || TL;
    var n = 0;
    for (var i = 0; i < tl.segs.length; i++) {
      if (tl.segs[i].kind === 'act' && tSec >= tl.segs[i].start + tl.segs[i].dur - tl.segs[i].revealSec) n++;
    }
    return n;
  }

  function workFrac(ph) {
    if (!ph || ph.left === undefined || !ph.workDur) return 0;
    return U.clamp(ph.left / ph.workDur, 0, 1);
  }

  /* ---------- podział ogniw w zespole ---------- */

  function slotsFor(pos, size) {
    var out = [];
    for (var j = 0; j < SLOTS; j++) if (j % size === pos) out.push(j);
    return out;
  }
  function ownerOf(slot, size) { return slot % size; }
  function roleOf(pos) { return content.roles[Math.min(pos, content.roles.length - 1)]; }

  /* ---------- ocenianie odpowiedzi ---------- */

  function sameSet(a, b) {
    if (!Array.isArray(a) || a.length !== b.length) return false;
    var cmp = function (x, y) { return x - y; };
    var s = a.slice().sort(cmp), t = b.slice().sort(cmp);
    for (var i = 0; i < s.length; i++) if (s[i] !== t[i]) return false;
    return true;
  }

  function evaluate(q, ans) {
    switch (q.kind) {
      case 'choice': return ans === q.correct;
      case 'multi':
      case 'lines': return sameSet(ans, q.correct);
      case 'order':
        if (!Array.isArray(ans) || ans.length !== q.items.length) return false;
        for (var i = 0; i < ans.length; i++) if (ans[i] !== i) return false;
        return true;
      case 'assign':
        if (!Array.isArray(ans) || ans.length !== q.correct.length) return false;
        for (var k = 0; k < ans.length; k++) if (ans[k] !== q.correct[k]) return false;
        return true;
      default: return false;
    }
  }

  /* Poprawna odpowiedź jako lista tekstów (do ekranów rozwiązań). */
  function describeCorrect(q) {
    switch (q.kind) {
      case 'choice': return [q.options[q.correct]];
      case 'multi': return q.correct.map(function (i) { return q.options[i]; });
      case 'lines': return q.correct.map(function (i) { return q.evidence.lines[i].replace(/^\s+/, ''); });
      case 'order': return q.items.map(function (it, i) { return (i + 1) + '. ' + it; });
      case 'assign': return q.items.map(function (it, i) { return it + ' → ' + q.buckets[q.correct[i]]; });
      default: return [];
    }
  }

  /* Kolejność wyświetlania (stała dla pytania, taka sama na każdym telefonie). */
  function displayOrder(q) {
    var n, idx = [];
    if (q.kind === 'choice' || q.kind === 'multi') n = q.options.length;
    else if (q.kind === 'order') return U.shuffledIndices(q.items.length, q.id);
    else if (q.kind === 'assign') {
      n = q.items.length;
      for (var i = 0; i < n; i++) idx.push(i);
      return q.buckets.length > 2 ? U.shuffle(idx, q.id + ':items') : idx;
    } else return null;
    for (var j = 0; j < n; j++) idx.push(j);
    return U.shuffle(idx, q.id);
  }

  /* ---------- cyfry sejfu ---------- */

  function safeDigits(cnt, actIdx) {
    return cnt.acts[actIdx].questions.map(function (q) { return q.digit; });
  }

  function checkSafe(cnt, actIdx, entered) {
    var d = safeDigits(cnt, actIdx);
    if (!Array.isArray(entered) || entered.length !== d.length) return false;
    for (var i = 0; i < d.length; i++) if (entered[i] !== d[i]) return false;
    return true;
  }

  /* ---------- punktacja ---------- */

  var ACT_BASE = 100, ACT_BONUS = 60, ACT_PENALTY = 10, ACT_MIN = 40, SOLO_BONUS = 30, SOLO_FINAL_BONUS = 20;

  function actPoints(ctx) {
    var bonus = ctx.mode === 'live' ? Math.round(ACT_BONUS * U.clamp(ctx.workFrac, 0, 1)) : SOLO_BONUS;
    return Math.max(ACT_MIN, ACT_BASE + bonus - ACT_PENALTY * (ctx.wrong || 0));
  }

  function maxActPoints() { return ACT_BASE + ACT_BONUS; }

  function finalPoints(cnt, parts, ctx) {
    var f = cnt.finale, pts = 0;
    if (parts.who) {
      pts += f.pointsWho;
      pts += ctx.mode === 'live' ? Math.round(f.bonusWho * U.clamp(ctx.workFrac, 0, 1)) : SOLO_FINAL_BONUS;
    }
    if (parts.how) pts += f.pointsHow;
    if (parts.fix) pts += f.pointsFix;
    return pts;
  }

  function maxFinalPoints(cnt) {
    var f = cnt.finale;
    return f.pointsWho + f.bonusWho + f.pointsHow + f.pointsFix;
  }

  function maxTotal(cnt) { return ACTS * maxActPoints() + maxFinalPoints(cnt); }

  /* ---------- stan gracza ---------- */

  function emptyAct() {
    return { slots: {}, safe: { opened: false, wrong: 0, pts: 0, at: null }, quick: { i: 0, ok: 0, done: false } };
  }

  function newState(opts) {
    var acts = [];
    for (var i = 0; i < ACTS; i++) acts.push(emptyAct());
    return {
      v: 1,
      mode: opts.mode,                    /* 'live' | 'solo' */
      sessionCode: opts.sessionCode || null,
      startMs: opts.startMs || null,
      team: opts.team || null,            /* 1..16 */
      size: opts.mode === 'solo' ? 1 : (opts.size || 5),
      pos: opts.mode === 'solo' ? 0 : (opts.pos || 0),
      nick: opts.nick || '',
      createdAt: opts.createdAt || 0,
      acts: acts,
      final: { submitted: false, who: null, how: null, fix: null, pts: 0, ok: { who: false, how: false, fix: false }, at: null },
      marks: {},
      solo: { idx: 0, phase: 'work' }     /* tylko tryb solo: 'work' | 'reveal' | 'accuse' | 'unmask' */
    };
  }

  function slotState(st, act, slot) {
    var a = st.acts[act];
    if (!a.slots[slot]) a.slots[slot] = { wrong: 0, hints: 0, solved: false, assisted: false };
    return a.slots[slot];
  }

  function cooldownMs(wrong) { return Math.min(10000, 2000 * wrong); }

  function honorFor(s) {
    if (!s || !s.solved || s.assisted) return 0;
    return Math.max(2, 10 - 2 * Math.min(s.wrong, 4) - 2 * Math.min(s.hints, 2));
  }

  function totalHonor(st) {
    var h = 0;
    st.acts.forEach(function (a) {
      for (var k in a.slots) if (Object.prototype.hasOwnProperty.call(a.slots, k)) h += honorFor(a.slots[k]);
      h += a.quick.ok * 3;
    });
    return h;
  }

  function totalScore(st) {
    var s = 0;
    st.acts.forEach(function (a) { s += a.safe.opened ? a.safe.pts : 0; });
    return s + (st.final.submitted ? st.final.pts : 0);
  }

  /* Czy wszystkie cyfry aktu zostały zdobyte na tym telefonie (tryb solo). */
  function allSlotsSolved(st, act) {
    for (var j = 0; j < SLOTS; j++) {
      var s = st.acts[act].slots[j];
      if (!s || !s.solved) return false;
    }
    return true;
  }

  /* ---------- raport dla prowadzącego ---------- */

  function buildReport(st) {
    return {
      sessionMin: st.startMs ? Math.round((st.startMs - EPOCH) / 60000) : 0,
      team: st.team || 0,
      size: st.size,
      acts: st.acts.map(function (a) { return a.safe.opened ? a.safe.pts : 0; }),
      safes: st.acts.map(function (a) { return !!a.safe.opened; }),
      final: st.final.submitted ? st.final.pts : 0,
      who: !!(st.final.submitted && st.final.ok.who),
      how: !!(st.final.submitted && st.final.ok.how),
      fix: !!(st.final.submitted && st.final.ok.fix)
    };
  }

  function reportChecksum(bytes) {
    var s = 'CM1|' + bytes.join(',');
    var h1 = U.fnv1a(s + SALT);
    var h2 = U.fnv1a(SALT + s.split('').reverse().join(''));
    var h = (h1 ^ Math.imul(h2, 2654435761)) >>> 0;
    return [(h >>> 16) & 255, (h >>> 8) & 255, h & 255];
  }

  function encodeReport(r) {
    var b = [1];
    b.push((r.sessionMin >>> 16) & 255, (r.sessionMin >>> 8) & 255, r.sessionMin & 255);
    b.push(r.team & 255, r.size & 255);
    for (var i = 0; i < ACTS; i++) b.push((r.acts[i] || 0) & 255);
    b.push((r.final >>> 8) & 255, r.final & 255);
    var sf = 0;
    for (i = 0; i < ACTS; i++) if (r.safes[i]) sf |= (1 << i);
    b.push(sf);
    b.push((r.who ? 1 : 0) | (r.how ? 2 : 0) | (r.fix ? 4 : 0));
    var cs = reportChecksum(b);
    b.push(cs[0], cs[1], cs[2]);
    return U.bytesToB32(b);
  }

  function decodeReport(code) {
    var c = U.normalizeCode(code);
    var b = U.b32ToBytes(c);
    var expected = 1 + 3 + 1 + 1 + ACTS + 2 + 1 + 1 + 3;
    if (!b || b.length !== expected || b[0] !== 1) return null;
    var body = b.slice(0, expected - 3), cs = reportChecksum(body);
    if (cs[0] !== b[expected - 3] || cs[1] !== b[expected - 2] || cs[2] !== b[expected - 1]) return null;
    var r = { sessionMin: (b[1] << 16) | (b[2] << 8) | b[3], team: b[4], size: b[5], acts: [], safes: [] };
    for (var i = 0; i < ACTS; i++) { r.acts.push(b[6 + i]); }
    var p = 6 + ACTS;
    r.final = (b[p] << 8) | b[p + 1];
    var sf = b[p + 2], fl = b[p + 3];
    for (i = 0; i < ACTS; i++) r.safes.push(!!(sf & (1 << i)));
    r.who = !!(fl & 1); r.how = !!(fl & 2); r.fix = !!(fl & 4);
    r.total = r.acts.reduce(function (s, x) { return s + x; }, 0) + r.final;
    r.safeCount = r.safes.filter(Boolean).length;
    r.code = c;
    return r;
  }

  /* ---------- dedukcja (do testów i do ewentualnych podpowiedzi) ---------- */

  function suspectsMatching(cnt, clues) {
    return cnt.suspects.filter(function (s) {
      return clues.every(function (cl) { return s.traits[cl.attr] === cl.value; });
    });
  }

  return {
    EPOCH: EPOCH, ACTS: ACTS, SLOTS: SLOTS, TL: TL,
    encodeSession: encodeSession, decodeSession: decodeSession, fmtSessionCode: fmtSessionCode,
    buildTimeline: buildTimeline, phaseAt: phaseAt, actsEndedAt: actsEndedAt, workFrac: workFrac,
    slotsFor: slotsFor, ownerOf: ownerOf, roleOf: roleOf,
    evaluate: evaluate, describeCorrect: describeCorrect, displayOrder: displayOrder,
    safeDigits: safeDigits, checkSafe: checkSafe,
    actPoints: actPoints, maxActPoints: maxActPoints, finalPoints: finalPoints,
    maxFinalPoints: maxFinalPoints, maxTotal: maxTotal,
    newState: newState, slotState: slotState, cooldownMs: cooldownMs,
    honorFor: honorFor, totalHonor: totalHonor, totalScore: totalScore, allSlotsSolved: allSlotsSolved,
    buildReport: buildReport, encodeReport: encodeReport, decodeReport: decodeReport,
    suspectsMatching: suspectsMatching
  };
}));
