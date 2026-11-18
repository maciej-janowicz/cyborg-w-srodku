'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../js/content.js');
const U = require('../js/util.js');
const E = require('../js/engine.js');
const { canon, wrong } = require('./helpers.js');

test('kod sesji: odwracalny, odporny na literówki i pomyłki znaków', () => {
  const start = Date.UTC(2026, 10, 24, 9, 15, 0); // 24 XI 2026, 10:15 CET
  const code = E.encodeSession(start);
  assert.equal(code.length, 6);
  const d = E.decodeSession(code);
  assert.equal(d.startMs, start);
  assert.equal(E.decodeSession(code.toLowerCase()).startMs, start);
  assert.equal(E.decodeSession(E.fmtSessionCode(code)).startMs, start);
  // pomyłka znaku — suma kontrolna musi to wychwycić (dla każdej pozycji, każdej innej litery)
  let caught = 0, total = 0;
  for (let i = 0; i < 6; i++) {
    for (const ch of U.B32) {
      if (ch === code[i]) continue;
      const bad = code.slice(0, i) + ch + code.slice(i + 1);
      total++;
      const r = E.decodeSession(bad);
      if (r === null) caught++;
    }
  }
  assert.ok(caught / total > 0.95, 'wykrywalność pomyłek: ' + caught + '/' + total);
  assert.equal(E.decodeSession('12345'), null);
  assert.equal(E.decodeSession(''), null);
  assert.equal(E.decodeSession(null), null);
  // Crockford: O→0, I/L→1
  const withZero = E.encodeSession(Date.UTC(2026, 0, 1));
  assert.equal(E.decodeSession(withZero.replace(/0/g, 'o')).startMs, Date.UTC(2026, 0, 1));
});

test('kod sesji: zaokrąglenie do pełnej minuty i zakres', () => {
  const s = Date.UTC(2026, 10, 24, 9, 15, 29);
  assert.equal(E.decodeSession(E.encodeSession(s)).startMs, Date.UTC(2026, 10, 24, 9, 15, 0));
  assert.throws(() => E.encodeSession(Date.UTC(2025, 0, 1)));
});

test('fazy: granice prologu, aktów i finału', () => {
  assert.equal(E.phaseAt(-5).kind, 'before');
  assert.equal(E.phaseAt(-5).left, 5);
  assert.equal(E.phaseAt(0).kind, 'prolog');
  assert.equal(E.phaseAt(149).kind, 'prolog');
  let p = E.phaseAt(150);
  assert.equal(p.kind, 'act'); assert.equal(p.index, 0); assert.equal(p.phase, 'work');
  assert.equal(p.workDur, 310); assert.equal(p.left, 310);
  p = E.phaseAt(150 + 309);
  assert.equal(p.phase, 'work'); assert.equal(p.left, 1);
  p = E.phaseAt(150 + 310);
  assert.equal(p.phase, 'reveal'); assert.equal(p.left, 50);
  p = E.phaseAt(150 + 360);
  assert.equal(p.index, 1); assert.equal(p.phase, 'work');
  // ostatni akt kończy się w 2400 s
  p = E.phaseAt(2399); assert.equal(p.index, 5); assert.equal(p.phase, 'reveal');
  p = E.phaseAt(2400); assert.equal(p.kind, 'finale'); assert.equal(p.phase, 'accuse'); assert.equal(p.left, 150);
  p = E.phaseAt(2550); assert.equal(p.phase, 'unmask');
  assert.equal(E.phaseAt(2699).kind, 'finale');
  assert.equal(E.phaseAt(2700).kind, 'after');
  // każda sekunda ma fazę, a lewy czas jest dodatni
  for (let t = 0; t < 2700; t++) { const q = E.phaseAt(t); assert.ok(q.left > 0, 't=' + t); }
});

test('liczba zakończonych aktów', () => {
  assert.equal(E.actsEndedAt(0), 0);
  assert.equal(E.actsEndedAt(150 + 309), 0);
  assert.equal(E.actsEndedAt(150 + 310), 1);
  assert.equal(E.actsEndedAt(2399), 6);
  assert.equal(E.actsEndedAt(2699), 6);
});

test('podział ogniw: każde ogniwo ma dokładnie jednego właściciela, dla zespołów 1–5', () => {
  for (let n = 1; n <= 5; n++) {
    const seen = [];
    for (let pos = 0; pos < n; pos++) {
      const s = E.slotsFor(pos, n);
      assert.ok(s.length >= 1, 'n=' + n + ' pos=' + pos + ' nie ma zadań');
      s.forEach((j) => { assert.equal(E.ownerOf(j, n), pos); seen.push(j); });
    }
    assert.deepEqual(seen.sort(), [0, 1, 2, 3, 4], 'n=' + n);
  }
  assert.equal(E.roleOf(0).id, 'bond');
  assert.equal(E.roleOf(4).id, 'kornacka');
});

test('sejf: właściwe cyfry otwierają, inne nie', () => {
  content.acts.forEach((a, i) => {
    const d = E.safeDigits(content, i);
    assert.equal(d.length, 5);
    assert.equal(E.checkSafe(content, i, d), true);
    const bad = d.slice(); bad[2] = (bad[2] + 1) % 10;
    assert.equal(E.checkSafe(content, i, bad), false);
    assert.equal(E.checkSafe(content, i, d.slice(0, 4)), false);
    assert.equal(E.checkSafe(content, i, null), false);
  });
  // kody sejfów różnią się między aktami (nie da się otworzyć cudzym kodem)
  const codes = content.acts.map((a, i) => E.safeDigits(content, i).join(''));
  assert.equal(new Set(codes).size, 6);
});

test('punktacja aktu: bonus za czas, kara za pomyłki, minimum', () => {
  assert.equal(E.actPoints({ mode: 'live', workFrac: 1, wrong: 0 }), 160);
  assert.equal(E.actPoints({ mode: 'live', workFrac: 0.5, wrong: 0 }), 130);
  assert.equal(E.actPoints({ mode: 'live', workFrac: 0, wrong: 0 }), 100);
  assert.equal(E.actPoints({ mode: 'live', workFrac: 1, wrong: 3 }), 130);
  assert.equal(E.actPoints({ mode: 'live', workFrac: 0, wrong: 20 }), 40);
  assert.equal(E.actPoints({ mode: 'solo', workFrac: 0.9, wrong: 1 }), 120);
  assert.equal(E.actPoints({ mode: 'live', workFrac: 5, wrong: 0 }), 160); // przycięcie
  assert.equal(E.maxActPoints(), 160);
});

test('punktacja finału', () => {
  const live = (p, f) => E.finalPoints(content, p, { mode: 'live', workFrac: f });
  assert.equal(live({ who: true, how: true, fix: true }, 1), 290);
  assert.equal(live({ who: true, how: true, fix: true }, 0), 250);
  assert.equal(live({ who: false, how: true, fix: true }, 1), 100);
  assert.equal(live({ who: false, how: false, fix: false }, 1), 0);
  assert.equal(E.finalPoints(content, { who: true, how: false, fix: false }, { mode: 'solo' }), 170);
  assert.equal(E.maxTotal(content), 1250);
});

test('stan: nowy stan, zachowanie ogniw, honor i wynik', () => {
  const st = E.newState({ mode: 'live', sessionCode: 'ABCDEF', startMs: 0, team: 3, size: 4, pos: 2 });
  assert.equal(st.acts.length, 6);
  assert.equal(E.totalScore(st), 0);
  const s = E.slotState(st, 0, 2);
  assert.equal(E.honorFor(s), 0);
  s.solved = true;
  assert.equal(E.honorFor(s), 10);
  s.wrong = 2; s.hints = 1;
  assert.equal(E.honorFor(s), 4);
  s.wrong = 9; s.hints = 9;
  assert.equal(E.honorFor(s), 2);
  s.assisted = true;
  assert.equal(E.honorFor(s), 0);
  assert.equal(E.cooldownMs(1), 2000);
  assert.equal(E.cooldownMs(9), 10000);
  st.acts[0].safe = { opened: true, wrong: 0, pts: 150, at: 1 };
  st.final = { submitted: true, who: 'wilson', how: 0, fix: 0, pts: 200, ok: { who: true, how: true, fix: false }, at: 1 };
  assert.equal(E.totalScore(st), 350);
  const solo = E.newState({ mode: 'solo', size: 4, pos: 3 });
  assert.equal(solo.size, 1); assert.equal(solo.pos, 0);
});

test('raport: zapis i odczyt są wzajemnie odwrotne, a sfałszowanie wykrywane', () => {
  const st = E.newState({ mode: 'live', sessionCode: 'ABCDEF', startMs: Date.UTC(2026, 10, 24, 9, 0), team: 7, size: 5, pos: 0 });
  [150, 132, 0, 118, 160, 100].forEach((p, i) => { if (p) st.acts[i].safe = { opened: true, wrong: 0, pts: p, at: 1 }; });
  st.final = { submitted: true, who: 'wilson', how: 0, fix: 0, pts: 273, ok: { who: true, how: true, fix: true }, at: 1 };
  const r = E.buildReport(st);
  const code = E.encodeReport(r);
  assert.equal(code.length, 31);
  const d = E.decodeReport(code);
  assert.equal(d.team, 7); assert.equal(d.size, 5);
  assert.deepEqual(d.acts, [150, 132, 0, 118, 160, 100]);
  assert.deepEqual(d.safes, [true, true, false, true, true, true]);
  assert.equal(d.final, 273);
  assert.equal(d.total, 150 + 132 + 118 + 160 + 100 + 273);
  assert.equal(d.safeCount, 5);
  assert.equal(d.sessionMin, r.sessionMin);
  assert.ok(d.who && d.how && d.fix);
  // odporność na spacje, małe litery i grupowanie
  assert.equal(E.decodeReport(U.groups(code.toLowerCase(), 5)).total, d.total);
  // każda zmiana pojedynczego znaku powinna być wykryta
  let ok = 0, tot = 0;
  for (let i = 0; i < code.length - 1; i++) { // ostatni znak ma bity wypełniające
    for (const ch of U.B32) {
      if (ch === code[i]) continue;
      tot++;
      if (E.decodeReport(code.slice(0, i) + ch + code.slice(i + 1)) === null) ok++;
    }
  }
  assert.ok(ok / tot > 0.9999, 'wykrywalność: ' + ok + '/' + tot);
  assert.equal(E.decodeReport('ABC'), null);
  assert.equal(E.decodeReport(''), null);
});

test('symulacja: zespół rozwiązuje wszystko i dostaje komplet punktów', () => {
  const st = E.newState({ mode: 'live', sessionCode: 'ABCDEF', startMs: 0, team: 1, size: 5, pos: 0 });
  for (let a = 0; a < 6; a++) {
    for (let j = 0; j < 5; j++) {
      assert.equal(E.evaluate(content.acts[a].questions[j], canon(content.acts[a].questions[j])), true);
      E.slotState(st, a, j).solved = true;
    }
    assert.equal(E.allSlotsSolved(st, a), true);
    st.acts[a].safe = { opened: true, wrong: 0, pts: E.actPoints({ mode: 'live', workFrac: 1, wrong: 0 }), at: 1 };
  }
  const f = content.finale;
  const ok = { who: content.culprit === 'wilson', how: true, fix: true };
  assert.ok(ok.who);
  st.final = { submitted: true, who: 'wilson', how: f.how.correct, fix: f.fix.correct, ok: ok, at: 1,
    pts: E.finalPoints(content, ok, { mode: 'live', workFrac: 1 }) };
  assert.equal(E.totalScore(st), E.maxTotal(content));
});

test('util: tasowanie jest deterministyczne i jest permutacją', () => {
  const a = [1, 2, 3, 4, 5, 6, 7];
  assert.deepEqual(U.shuffle(a, 'x'), U.shuffle(a, 'x'));
  assert.deepEqual(U.shuffle(a, 'x').slice().sort(), a);
  assert.notDeepEqual(U.shuffle(a, 'x'), U.shuffle(a, 'y'));
  assert.equal(U.fmtClock(125), '2:05');
  assert.equal(U.fmtClock(0), '0:00');
  assert.equal(U.fmtClock(59.2), '1:00');
  assert.equal(U.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  const bytes = [0, 1, 2, 250, 255, 128, 7];
  assert.deepEqual(U.b32ToBytes(U.bytesToB32(bytes)).slice(0, bytes.length), bytes);
});

test('magazyn: działa także bez localStorage', () => {
  const s = U.makeStore(null);
  assert.equal(s.persistent, false);
  s.set('k', { a: 1 });
  assert.deepEqual(s.get('k'), { a: 1 });
  s.del('k');
  assert.equal(s.get('k'), null);
  const broken = { setItem() { throw new Error('zablokowane'); }, removeItem() {}, getItem() { return null; } };
  const s2 = U.makeStore(broken);
  assert.equal(s2.persistent, false);
  s2.set('x', 5); assert.equal(s2.get('x'), 5);
});
