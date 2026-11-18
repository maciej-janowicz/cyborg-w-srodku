'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../js/content.js');
const E = require('../js/engine.js');

const KINDS = ['choice', 'multi', 'lines', 'order', 'assign'];
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function allStrings(obj, out) {
  out = out || [];
  if (typeof obj === 'string') out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => allStrings(x, out));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => allStrings(x, out));
  return out;
}

test('oś czasu: cała gra trwa dokładnie 45 minut', () => {
  assert.equal(E.TL.total, 45 * 60);
  const sum = content.prologSec + content.acts.reduce((s, a) => s + a.durSec, 0) + content.finale.durSec;
  assert.equal(sum, 2700);
});

test('jest sześć aktów po pięć ogniw', () => {
  assert.equal(content.acts.length, 6);
  content.acts.forEach((a, i) => assert.equal(a.questions.length, 5, 'akt ' + (i + 1)));
});

test('akty: komplet pól, czas pracy i rozwiązania', () => {
  content.acts.forEach((a, i) => {
    ['roman', 'icon', 'title', 'subtitle', 'setting', 'briefing', 'questions', 'clue', 'reveal', 'quick', 'hostSay'].forEach((f) =>
      assert.ok(a[f], 'akt ' + (i + 1) + ' brak pola ' + f));
    assert.ok(a.durSec - a.revealSec >= 240, 'za krótkie okno pracy w akcie ' + (i + 1));
    assert.ok(a.revealSec >= 40 && a.revealSec <= 60, 'czas rozwiązania w akcie ' + (i + 1));
    assert.ok(a.briefing.length >= 3 && a.briefing.length <= 4);
    assert.equal(a.reveal.takeaways.length, 3);
    assert.ok(a.quick.length >= 4);
    assert.ok(a.hostSay.start && a.hostSay.reveal);
  });
});

test('odprawa: da się ją przeczytać w ok. 2 minuty', () => {
  content.acts.forEach((a, i) => {
    const w = allStrings(a.briefing).reduce((s, t) => s + words(t), 0);
    assert.ok(w <= 420, 'akt ' + (i + 1) + ': odprawa ma ' + w + ' słów');
  });
});

test('pytania: poprawność strukturalna', () => {
  const ids = new Set(), titles = new Set();
  content.acts.forEach((a, ai) => {
    const digits = a.questions.map((q) => q.digit);
    assert.ok(new Set(digits).size >= 3, 'za mało różnych cyfr w akcie ' + (ai + 1));
    a.questions.forEach((q, qi) => {
      const where = 'akt ' + (ai + 1) + ' ogniwo ' + (qi + 1);
      assert.ok(!ids.has(q.id), 'duplikat id ' + q.id); ids.add(q.id);
      assert.ok(!titles.has(q.title), 'duplikat tytułu ' + q.title); titles.add(q.title);
      assert.equal(q.id, 'a' + (ai + 1) + 'q' + (qi + 1), where + ': id niezgodne z pozycją');
      assert.ok(Number.isInteger(q.digit) && q.digit >= 0 && q.digit <= 9, where + ': cyfra');
      assert.ok(KINDS.includes(q.kind), where + ': rodzaj');
      assert.ok(q.ask && q.explain, where + ': ask/explain');
      assert.equal(q.hints.length, 2, where + ': dwie podpowiedzi');
      assert.ok(q.evidence && q.evidence.title && q.evidence.lines.length >= 1, where + ': dowód');
      assert.ok(['code', 'note'].includes(q.evidence.kind), where + ': rodzaj dowodu');
      if (q.kind === 'choice') {
        assert.ok(q.options.length >= 4 && q.options.length <= 5, where);
        assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length, where);
        assert.equal(new Set(q.options).size, q.options.length, where + ': powtórzone opcje');
      }
      if (q.kind === 'multi') {
        assert.ok(q.options.length >= 4 && q.correct.length >= 2 && q.correct.length < q.options.length, where);
        q.correct.forEach((i) => assert.ok(i >= 0 && i < q.options.length, where));
        assert.equal(new Set(q.correct).size, q.correct.length, where);
      }
      if (q.kind === 'lines') {
        assert.equal(q.evidence.kind, 'code', where + ': lines wymaga kodu');
        q.selectable.forEach((i) => {
          assert.ok(i >= 0 && i < q.evidence.lines.length, where + ': selectable poza zakresem');
          assert.ok(q.evidence.lines[i].trim().length > 0, where + ': pusta linia do zaznaczenia');
        });
        q.correct.forEach((i) => assert.ok(q.selectable.includes(i), where + ': correct poza selectable'));
        assert.ok(q.selectable.length > q.correct.length, where);
      }
      if (q.kind === 'order') {
        assert.ok(q.items.length >= 3 && q.items.length <= 5, where);
        assert.equal(new Set(q.items).size, q.items.length, where);
      }
      if (q.kind === 'assign') {
        assert.equal(q.correct.length, q.items.length, where);
        q.correct.forEach((b) => assert.ok(b >= 0 && b < q.buckets.length, where));
        assert.ok(q.buckets.length >= 2 && q.items.length >= 5, where);
        assert.equal(new Set(q.items).size, q.items.length, where);
        assert.equal(new Set(q.buckets).size, q.buckets.length, where);
        if (q.buckets.length > 2) {
          // wielokategorie: każde wiadro użyte co najmniej raz
          for (let b = 0; b < q.buckets.length; b++) assert.ok(q.correct.includes(b), where + ': nieużyte wiadro ' + b);
        }
      }
    });
  });
});

test('poprawna odpowiedź jest przyjmowana, błędna odrzucana, a różne rodzaje występują', () => {
  const { canon, wrong } = require('./helpers.js');
  const kinds = new Set();
  content.acts.forEach((a) => a.questions.forEach((q) => {
    kinds.add(q.kind);
    assert.equal(E.evaluate(q, canon(q)), true, q.id + ' poprawna');
    assert.equal(E.evaluate(q, wrong(q)), false, q.id + ' błędna');
    assert.equal(E.evaluate(q, null), false, q.id + ' null');
    assert.equal(E.evaluate(q, undefined), false, q.id + ' undefined');
  }));
  assert.deepEqual([...kinds].sort(), [...KINDS].sort());
});

test('układ wyświetlania nie zdradza odpowiedzi pozycją', () => {
  content.acts.forEach((a) => a.questions.forEach((q) => {
    const o = E.displayOrder(q);
    if (!o) return;
    const n = q.kind === 'order' ? q.items.length : q.kind === 'assign' ? q.items.length : q.options.length;
    assert.deepEqual([...o].sort((x, y) => x - y), [...Array(n).keys()], q.id + ' permutacja');
    if (q.kind === 'order') assert.notDeepEqual(o, [...Array(n).keys()], q.id + ' kolejność nie może być rozwiązaniem');
    if (q.kind === 'choice') {
      // poprawna opcja nie może zawsze wypadać pierwsza
    }
  }));
  // ogólnie: poprawna opcja w pytaniach 'choice' nie powinna zawsze być na pozycji 0
  const pos = [];
  content.acts.forEach((a) => a.questions.forEach((q) => {
    if (q.kind === 'choice') pos.push(E.displayOrder(q).indexOf(q.correct));
  }));
  assert.ok(new Set(pos).size >= 3, 'poprawne odpowiedzi muszą być rozrzucone: ' + pos.join(','));
});

test('dowody: tylko pierwszy akt bez cechy, pozostałe ujawniają po jednej z pięciu cech', () => {
  const attrs = content.attributes.map((a) => a.id);
  content.acts.forEach((a, i) => {
    const cl = a.clue;
    assert.ok(cl.title && cl.text);
    if (i === 0) { assert.equal(cl.attr, null); return; }
    assert.ok(attrs.includes(cl.attr), 'akt ' + (i + 1));
    const attr = content.attributes.find((x) => x.id === cl.attr);
    assert.equal(attr.act, i + 1, 'cecha ' + cl.attr + ' powinna być w akcie ' + attr.act);
    assert.ok(content.suspects.some((s) => s.traits[cl.attr] === cl.value), 'żaden podejrzany nie ma ' + cl.value);
  });
  assert.equal(new Set(content.acts.map((a) => a.clue.attr).filter(Boolean)).size, 5);
});

test('dedukcja: dowody jednoznacznie wskazują winnego i zawężają krąg stopniowo', () => {
  const clues = content.acts.map((a) => a.clue).filter((c) => c.attr);
  const left = E.suspectsMatching(content, clues);
  assert.equal(left.length, 1, 'dokładnie jeden podejrzany pasuje do wszystkich dowodów');
  assert.equal(left[0].id, content.culprit);
  let prev = content.suspects.length;
  const sizes = [prev];
  for (let k = 1; k <= clues.length; k++) {
    const n = E.suspectsMatching(content, clues.slice(0, k)).length;
    assert.ok(n < prev, 'dowód ' + k + ' musi kogoś wykluczyć (było ' + prev + ', jest ' + n + ')');
    prev = n; sizes.push(n);
  }
  assert.equal(sizes[sizes.length - 1], 1);
  // żaden pojedynczy dowód nie wystarcza
  clues.forEach((c) => assert.ok(E.suspectsMatching(content, [c]).length > 1));
  // każdy podejrzany ma komplet cech
  content.suspects.forEach((s) => content.attributes.forEach((a) => assert.ok(s.traits[a.id], s.id + ' brak ' + a.id)));
  assert.equal(new Set(content.suspects.map((s) => s.id)).size, content.suspects.length);
});

test('finał: opcje i punktacja', () => {
  const f = content.finale;
  assert.ok(f.how.options.length >= 4 && f.fix.options.length >= 4);
  assert.ok(f.how.correct < f.how.options.length && f.fix.correct < f.fix.options.length);
  assert.equal(E.maxTotal(content), 6 * 160 + 290);
});

test('role i zespoły', () => {
  assert.equal(content.roles.length, 5);
  assert.ok(content.teams.length >= 12);
  assert.equal(new Set(content.teams).size, content.teams.length);
});

test('redakcja: brak zakazanych słów i podwójnych spacji', () => {
  const all = allStrings(content);
  all.forEach((s) => {
    assert.ok(!/kluczow/i.test(s), 'zakazane słowo "kluczow…": ' + s.slice(0, 60));
    assert.ok(!/Schrödinger–Newton/i.test(s));
    assert.ok(!/\bhint\b|\bscore\b|\bteam\b|\blobby\b/i.test(s), 'anglicyzm: ' + s.slice(0, 60));
  });
});

test('podpowiedzi nie są identyczne i nie zdradzają dosłownie poprawnej opcji', () => {
  content.acts.forEach((a) => a.questions.forEach((q) => {
    assert.notEqual(q.hints[0], q.hints[1], q.id);
    if (q.kind === 'choice') assert.ok(!q.hints.some((h) => h.includes(q.options[q.correct])), q.id + ' hint = odpowiedź');
  }));
});
