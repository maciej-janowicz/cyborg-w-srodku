/* Cyborg w Środku — aplikacja gracza (telefon). */
(function () {
  'use strict';
  var CM = window.CM, U = CM.util, E = CM.engine, C = CM.content, ui = CM.ui;
  var h = ui.h, inline = ui.inline;

  var store = U.makeStore((function () { try { return window.localStorage; } catch (e) { return null; } }()));
  var rootEl = document.getElementById('app');
  var params = new URLSearchParams(location.search);

  var S = null;                         /* stan gracza */
  var clockOffset = 0;                  /* korekta zegara względem serwera, ms */
  var view = {
    route: 'home', tab: null, lastSig: null, navigated: false,
    drafts: {}, fb: {}, cool: {}, safe: {}, safeSel: {}, safeFb: {}, acc: { who: null, how: null, fix: null },
    pending: null, hilite: false, clock: { state: 'brak', off: 0 }, prefill: '', celebrate: null, open: {}
  };

  function now() { return Date.now() + clockOffset; }
  function tSec() { return (now() - S.startMs) / 1000; }
  function keyFor(st) { return st.mode === 'solo' ? 'cm1:s:solo' : 'cm1:s:' + st.sessionCode; }
  function save() { if (!S) return; store.set(keyFor(S), S); store.set('cm1:last', keyFor(S)); }
  function isCaptain() { return S.mode === 'solo' || S.pos === 0; }
  function myRole() { return E.roleOf(S.pos); }
  function teamName() { return S.mode === 'solo' ? 'Tryb treningowy' : 'Zespół ' + C.teams[S.team - 1]; }

  /* ---------- fazy ---------- */

  function phase() {
    if (S.mode === 'solo') {
      var sp = S.solo;
      if (sp.phase === 'accuse' || sp.phase === 'unmask') return { kind: 'finale', phase: sp.phase, left: null };
      return { kind: 'act', index: sp.idx, phase: sp.phase, left: null };
    }
    return E.phaseAt(tSec());
  }
  function sig(ph) { return ph.kind + ':' + (ph.index === undefined ? '' : ph.index) + ':' + (ph.phase || ''); }

  function actsEnded() {
    if (S.mode === 'solo') {
      if (S.solo.phase === 'accuse' || S.solo.phase === 'unmask') return 6;
      return S.solo.idx + (S.solo.phase === 'reveal' ? 1 : 0);
    }
    return E.actsEndedAt(tSec());
  }
  function clueUnlocked(i) { return i < actsEnded() || S.acts[i].safe.opened; }

  function curFrac(ph) { return S.mode === 'live' ? E.workFrac(ph) : 0; }

  function defaultTab(ph) {
    if (ph.kind === 'act') return ph.phase === 'work' ? 'brief' : 'reveal';
    if (ph.kind === 'finale' || ph.kind === 'after') return ph.phase === 'accuse' ? 'accuse' : 'unmask';
    return null;
  }
  function tabsFor(ph) {
    if (ph.kind === 'before' || ph.kind === 'prolog') return [];
    if (ph.kind === 'act' && ph.phase === 'work') return [['brief', '📋', 'Odprawa'], ['work', '🔎', 'Śledztwo'], ['safe', '🔐', 'Sejf'], ['dossier', '📁', 'Teczka']];
    if (ph.kind === 'act') return [['reveal', '📖', 'Rozwiązanie'], ['brief', '📋', 'Odprawa'], ['dossier', '📁', 'Teczka']];
    if (ph.phase === 'accuse') return [['accuse', '⚖️', 'Oskarżenie'], ['dossier', '📁', 'Teczka']];
    return [['unmask', '🎭', 'Rozstrzygnięcie'], ['dossier', '📁', 'Teczka'], ['report', '📊', 'Raport']];
  }

  /* ---------- zegar ---------- */

  function syncClock() {
    if (params.has('nosync') || !window.fetch) return Promise.resolve();
    var t0 = Date.now();
    return fetch('ping.txt?_=' + t0, { cache: 'no-store' }).then(function (r) {
      var t1 = Date.now();
      var d = r.headers.get('Date');
      if (!d) throw new Error('brak nagłówka Date');
      var server = new Date(d).getTime();
      var off = server + (t1 - t0) / 2 - t1;
      if (!isFinite(off) || Math.abs(off) > 6 * 3600 * 1000 || (t1 - t0) > 6000) throw new Error('niewiarygodny wynik');
      /* nagłówek Date ma rozdzielczość 1 s — drobnych różnic (<1,5 s) nie korygujemy */
      clockOffset = Math.abs(off) < 1500 ? 0 : off;
      view.clock = { state: 'ok', off: off };
    }).catch(function () { view.clock = { state: 'brak', off: 0 }; });
  }

  /* ---------- ekran startowy ---------- */

  function homeScreen() {
    var last = store.get('cm1:last');
    var saved = last ? store.get(last) : null;
    if (saved && (saved.v !== 1 || !saved.acts || saved.acts.length !== E.ACTS)) saved = null;

    var input = h('input', { type: 'text', class: 'inp code', id: 'code', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', maxlength: '9', placeholder: 'np. 3FQ-8ZA', 'aria-label': 'Kod sesji' });
    input.value = view.prefill || '';
    var err = h('p', { class: 'err', role: 'alert' });
    function join() {
      var d = E.decodeSession(input.value);
      if (!d) { err.textContent = 'Nieprawidłowy kod sesji. Kod ma 6 znaków (cyfry i litery); proszę sprawdzić, czy nic się nie pomyliło.'; return; }
      if (now() - d.startMs > 60 * 60000) { err.textContent = 'Ta sesja zakończyła się (start: ' + fmtTime(d.startMs) + '). Można zagrać samodzielnie w trybie treningowym.'; return; }
      var existing = store.get('cm1:s:' + d.code);
      if (existing && existing.v === 1) { S = existing; view.route = 'game'; view.lastSig = null; render(); return; }
      view.pending = { mode: 'live', sessionCode: d.code, startMs: d.startMs, team: null, size: 5, pos: 0, nick: '' };
      view.route = 'setup'; render();
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') join(); });
    if (view.prefill) { view.prefill = ''; }

    return h('div', { class: 'page home' },
      h('header', { class: 'hero' },
        h('div', { class: 'hero-i', 'aria-hidden': 'true', text: '🕵️' }),
        h('h1', { text: C.meta.title }),
        h('p', { class: 'hero-s', text: C.meta.subtitle }),
        h('p', { class: 'hero-c', text: C.meta.course })),
      saved ? ui.card('Gra w toku', '▶️', [
        h('p', null, saved.mode === 'solo' ? 'Masz rozpoczętą grę w trybie treningowym.' : 'Masz rozpoczętą grę: ' + 'Zespół ' + C.teams[saved.team - 1] + ' (sesja ' + E.fmtSessionCode(saved.sessionCode) + ').'),
        h('button', { class: 'btn primary block', type: 'button', text: 'Wracam do gry', onclick: function () { S = saved; view.route = 'game'; view.lastSig = null; render(); } })
      ]) : null,
      ui.card('Dołączam do sesji', '🔑', [
        h('p', null, 'Kod sesji poda prowadzący (lub dostaną Państwo link). Zespół (2–5 osób) siedzi razem — każdy telefon pokazuje inne dowody.'),
        h('label', { class: 'lbl', for: 'code', text: 'Kod sesji' }), input, err,
        h('button', { class: 'btn primary block', type: 'button', text: 'Dołączam', onclick: join })
      ]),
      ui.card('Gram samodzielnie', '🎯', [
        h('p', null, 'Tryb treningowy: bez zegara i bez zespołu, wszystkie ogniwa na jednym telefonie. Dobry do powtórki po wykładzie.'),
        h('button', { class: 'btn block', type: 'button', text: 'Zaczynam trening', onclick: function () {
          var ex = store.get('cm1:s:solo');
          if (ex && ex.v === 1) {
            ui.modal('Trening w toku', 'Na tym telefonie jest już rozpoczęty trening. Zacząć od nowa?', [
              { label: 'Zaczynam od nowa', cls: 'primary', onclick: startSolo }, { label: 'Wracam do poprzedniego', onclick: function () { S = ex; view.route = 'game'; view.lastSig = null; render(); } }]);
          } else startSolo();
        } })
      ]),
      h('footer', { class: 'foot' },
        h('button', { class: 'lnk', type: 'button', text: 'Jak działa gra', onclick: showRules }),
        ' · ', h('a', { href: 'host.html', text: 'Panel prowadzącego' }),
        h('p', { class: 'ver', text: 'v' + C.meta.version + ' · ' + C.meta.author })));
  }

  function fmtTime(ms) {
    var d = new Date(ms);
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }

  function startSolo() {
    S = E.newState({ mode: 'solo', createdAt: now() });
    view.drafts = {}; view.fb = {}; view.cool = {}; view.safe = {}; view.acc = { who: null, how: null, fix: null };
    save(); view.route = 'game'; view.lastSig = null; render();
  }

  function showRules() {
    var last = C.prolog[C.prolog.length - 1];
    ui.modal('Jak działa gra', ui.blocks(last.blocks), [{ label: 'Rozumiem', cls: 'primary' }]);
  }

  /* ---------- wybór zespołu i roli ---------- */

  function setupScreen() {
    var p = view.pending;
    var err = h('p', { class: 'err', role: 'alert' });
    var teams = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Numer zespołu' });
    C.teams.forEach(function (name, i) {
      teams.appendChild(h('button', { type: 'button', class: 'chip' + (p.team === i + 1 ? ' on' : ''), role: 'radio', 'aria-checked': p.team === i + 1 ? 'true' : 'false',
        onclick: function () { p.team = i + 1; render(); } }, h('b', { text: String(i + 1) }), ' ', name));
    });
    var sizes = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Liczebność zespołu' });
    [2, 3, 4, 5].forEach(function (n) {
      sizes.appendChild(h('button', { type: 'button', class: 'seg-b' + (p.size === n ? ' on' : ''), role: 'radio', 'aria-checked': p.size === n ? 'true' : 'false', text: String(n),
        onclick: function () { p.size = n; if (p.pos >= n) p.pos = 0; render(); } }));
    });
    var roles = h('div', { class: 'roles', role: 'radiogroup', 'aria-label': 'Rola' });
    for (var i = 0; i < p.size; i++) {
      (function (pos) {
        var r = C.roles[pos];
        roles.appendChild(h('button', { type: 'button', class: 'role' + (p.pos === pos ? ' on' : ''), role: 'radio', 'aria-checked': p.pos === pos ? 'true' : 'false', onclick: function () { p.pos = pos; render(); } },
          h('span', { class: 'role-i', 'aria-hidden': 'true', text: r.icon }),
          h('span', { class: 'role-t' }, h('b', { text: r.name + (pos === 0 ? ' · kapitan' : '') }), h('small', { text: r.blurb }))));
      }(i));
    }
    function done() {
      if (!p.team) { err.textContent = 'Proszę wybrać numer zespołu — wszyscy w zespole wybierają ten sam.'; return; }
      if (p.edit && S) {
        /* zmiana zespołu lub roli w trakcie: postęp (ogniwa, sejfy) zostaje */
        S.team = p.team; S.size = p.size; S.pos = p.pos;
        save(); view.route = 'game'; view.lastSig = null; render(); return;
      }
      S = E.newState({ mode: 'live', sessionCode: p.sessionCode, startMs: p.startMs, team: p.team, size: p.size, pos: p.pos, createdAt: now() });
      view.drafts = {}; view.fb = {}; view.cool = {}; view.safe = {}; view.acc = { who: null, how: null, fix: null };
      save(); view.route = 'game'; view.lastSig = null; render();
    }
    return h('div', { class: 'page' },
      h('button', { class: 'lnk back', type: 'button', text: '‹ Wróć', onclick: function () { view.route = p.edit ? 'game' : 'home'; render(); } }),
      h('h2', { text: 'Zespół i rola' }),
      h('p', { class: 'muted', text: 'Sesja ' + E.fmtSessionCode(p.sessionCode) + ' · start o ' + fmtTime(p.startMs) }),
      ui.card('1. Numer zespołu', null, [h('p', null, 'Wszyscy z jednego stołu wybierają ten sam numer.'), teams]),
      ui.card('2. Ilu Państwa jest w zespole?', null, [sizes, h('p', { class: 'muted', text: 'Najlepiej 4–5 osób. Większe grupy proszę podzielić na dwa zespoły.' })]),
      ui.card('3. Moja rola', null, [h('p', null, 'Każdy wybiera inną rolę. Rola 1 (Bond) to kapitan — jako jedyny otwiera sejf i składa oskarżenie.'), roles]),
      err,
      h('button', { class: 'btn primary block', type: 'button', text: 'Gotowe — wchodzę do gry', onclick: done }));
  }

  /* ---------- układ gry ---------- */

  function timerText(ph) {
    if (ph.left === null || ph.left === undefined) return '';
    if (ph.kind === 'before') return 'Start za ' + U.fmtClock(ph.left);
    if (ph.kind === 'prolog') return 'Akt I za ' + U.fmtClock(ph.left);
    if (ph.kind === 'act' && ph.phase === 'work') return U.fmtClock(ph.left);
    if (ph.kind === 'act') return (ph.index === E.ACTS - 1 ? 'Finał za ' : 'Dalej za ') + U.fmtClock(ph.left);
    if (ph.kind === 'finale' && ph.phase === 'accuse') return U.fmtClock(ph.left);
    if (ph.kind === 'finale') return 'Koniec za ' + U.fmtClock(ph.left);
    return 'Koniec gry';
  }

  function topbar(ph) {
    var title, icon;
    if (ph.kind === 'act') { var a = C.acts[ph.index]; icon = a.icon; title = 'Akt ' + a.roman + ' · ' + a.title; }
    else if (ph.kind === 'finale' || ph.kind === 'after') { icon = '⚖️'; title = C.finale.title; }
    else { icon = '📜'; title = 'Prolog'; }
    var role = myRole();
    var urgent = ph.left !== null && ph.left !== undefined && ph.left < 60 && ph.phase === 'work';
    return h('header', { class: 'top' },
      h('div', { class: 'top-1' },
        h('div', { class: 'top-t' }, h('span', { 'aria-hidden': 'true', text: icon + ' ' }), title),
        S.mode === 'live' ? h('div', { class: 'timer' + (urgent ? ' urgent' : ''), 'data-timer': '1', 'aria-live': 'off', text: timerText(ph) }) : null),
      h('div', { class: 'top-2' },
        h('span', { class: 'who', text: role.icon + ' ' + role.name + (isCaptain() && S.mode === 'live' ? ' (kapitan)' : '') + ' · ' + teamName() }),
        h('span', { class: 'honor', title: 'Honor osobisty', text: '🎖 ' + E.totalHonor(S) }),
        h('button', { class: 'menu', type: 'button', 'aria-label': 'Menu', text: '⋯', onclick: showMenu })),
      ph.phase === 'work' && ph.workDur ? h('div', { class: 'prog', 'aria-hidden': 'true' }, h('i', { 'data-prog': '1', style: { width: (100 * (1 - ph.left / ph.workDur)).toFixed(1) + '%' } })) : null);
  }

  function tabbar(tabs) {
    return h('nav', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
      return h('button', { type: 'button', role: 'tab', class: 'tab' + (view.tab === t[0] ? ' on' : ''), 'aria-selected': view.tab === t[0] ? 'true' : 'false',
        onclick: function () { view.tab = t[0]; view.navigated = true; render(); } },
        h('span', { class: 'tab-i', 'aria-hidden': 'true', text: t[1] }), h('span', { class: 'tab-t', text: t[2] }));
    }));
  }

  function gameScreen() {
    var ph = phase();
    var sg = sig(ph);
    if (view.lastSig !== sg) { view.lastSig = sg; view.tab = defaultTab(ph); view.navigated = false; }
    var tabs = tabsFor(ph);
    if (tabs.length && !tabs.some(function (t) { return t[0] === view.tab; })) view.tab = tabs[0][0];
    var main = h('main', { class: 'main', id: 'main' });
    main.appendChild(content(ph));
    return h('div', { class: 'game' + (tabs.length ? ' has-tabs' : '') }, topbar(ph), main, tabs.length ? tabbar(tabs) : null);
  }

  function content(ph) {
    if (ph.kind === 'before' || ph.kind === 'prolog') return prologScreen(ph);
    if (view.tab === 'dossier') return dossierTab(ph);
    if (ph.kind === 'act') {
      if (view.tab === 'brief') return briefTab(ph.index, ph);
      if (view.tab === 'work') return workTab(ph.index, ph);
      if (view.tab === 'safe') return safeTab(ph.index, ph);
      return revealTab(ph.index, ph);
    }
    if (view.tab === 'accuse') return accuseTab(ph);
    if (view.tab === 'report') return reportTab(ph);
    return unmaskTab(ph);
  }

  /* ---------- prolog ---------- */

  function prologScreen(ph) {
    var role = myRole();
    var box = h('section', { class: 'card hero-card' },
      h('div', { class: 'big-timer', 'data-timer': '1', text: S.mode === 'live' ? timerText(ph) : '' }),
      h('p', null, ph.kind === 'before'
        ? 'Zespół siada razem, każdy sprawdza, że ma właściwą rolę. Gra rusza o ' + fmtTime(S.startMs) + '.'
        : 'Pierwszy akt zaraz się zacznie. Proszę doczytać prolog — a potem do dzieła.'),
      h('p', { class: 'chip-line' }, h('span', { class: 'pill', text: teamName() }), ' ', h('span', { class: 'pill', text: role.icon + ' ' + role.name + (isCaptain() ? ' · kapitan' : '') })),
      h('button', { class: 'lnk', type: 'button', text: 'Zmień zespół lub rolę', onclick: changeSetup }));
    var out = h('div', { class: 'page' }, box);
    C.prolog.forEach(function (c) { out.appendChild(ui.card(c.title, c.icon, ui.blocks(c.blocks))); });
    out.appendChild(ui.card('Podejrzani', '👥', [h('p', null, 'Sześć osób z tej historii mogło stać za atakiem. Z każdym aktem odkryją Państwo kolejny dowód; podejrzanych oglądają Państwo w zakładce Teczka.')]));
    return out;
  }

  function changeSetup() {
    view.pending = { mode: 'live', sessionCode: S.sessionCode, startMs: S.startMs, team: S.team, size: S.size, pos: S.pos, nick: '', edit: true };
    view.route = 'setup';
    render();
  }

  /* ---------- odprawa ---------- */

  function briefTab(i) {
    var a = C.acts[i];
    var out = h('div', { class: 'page' });
    out.appendChild(h('p', { class: 'setting' }, inline(a.setting)));
    a.briefing.forEach(function (c) { out.appendChild(ui.card(c.title, c.icon, ui.blocks(c.blocks))); });
    var ph = phase();
    if (ph.phase === 'work') out.appendChild(h('button', { class: 'btn primary block', type: 'button', text: 'Przechodzę do śledztwa ›', onclick: function () { view.tab = 'work'; view.navigated = true; render(); } }));
    return out;
  }

  /* ---------- śledztwo ---------- */

  function mySlots() { return E.slotsFor(S.pos, S.size); }

  function workTab(i, ph) {
    var a = C.acts[i];
    var slots = mySlots();
    var solvedAll = slots.every(function (j) { return E.slotState(S, i, j).solved; });
    var out = h('div', { class: 'page' });
    out.appendChild(h('p', { class: 'lead' },
      S.mode === 'solo' ? 'Trening: do rozwiązania jest pięć ogniw. Po wszystkich otwiera się sejf.'
        : 'Pana/Pani ogniwa w tym akcie: ' + slots.map(function (j) { return (j + 1); }).join(' i ') + ' z 5. Cyfrę z każdego ogniwa proszę podyktować kapitanowi.'));
    slots.forEach(function (j) { out.appendChild(questionCard(i, j, ph)); });
    if (solvedAll) {
      out.appendChild(h('section', { class: 'card done' },
        h('h3', { class: 'card-h', text: '✔ Ogniwa rozwiązane' }),
        h('p', null, S.mode === 'solo' ? 'Wszystkie cyfry zdobyte. Można otworzyć sejf.' : (isCaptain() ? 'Proszę zebrać cyfry od zespołu i wpisać je w zakładce Sejf.' : 'Proszę podyktować cyfry kapitanowi (' + C.roles[0].name + ') i pomóc reszcie zespołu.')),
        h('button', { class: 'btn primary block', type: 'button', text: 'Przechodzę do sejfu ›', onclick: function () { view.tab = 'safe'; view.navigated = true; render(); } })));
      out.appendChild(quickCard(i));
    }
    if (S.mode === 'solo') out.appendChild(h('button', { class: 'btn ghost block', type: 'button', text: 'Pomijam akt (pokaż rozwiązanie)', onclick: function () { S.solo.phase = 'reveal'; save(); render(); } }));
    return out;
  }

  var FB_WRONG = [
    'To jeszcze nie to. Proszę przyjrzeć się dowodowi jeszcze raz.',
    'Znowu nie. Czy odprawa podpowiada coś w tej sprawie?',
    'Nadal nie. Romarty chętnie podpowie — kosztuje to 2 punkty Honoru.',
    'Jeszcze nie. Proszę przeczytać pytanie bardzo uważnie, każde słowo ma znaczenie.',
    'Wciąż nie. Romarty może ujawnić rozwiązanie, ale to już bez Honoru.'
  ];

  function questionCard(i, j, ph) {
    var q = C.acts[i].questions[j];
    var ss = E.slotState(S, i, j);
    var role = E.roleOf(S.pos);
    var card = h('section', { class: 'card q' + (ss.solved ? ' solved' : ''), id: 'q-' + q.id });
    card.appendChild(h('div', { class: 'q-head' },
      h('span', { class: 'q-no', text: 'Ogniwo ' + (j + 1) + ' z 5' }),
      h('span', { class: 'q-role', text: role.icon + ' ' + role.name }),
      ss.solved ? h('span', { class: 'q-ok', text: '✔' }) : null));
    card.appendChild(h('h4', { class: 'q-title', text: q.title }));

    if (ss.solved) {
      var ev = ui.evidence(q, false);
      if (q.kind === 'lines') q.correct.forEach(function (ci) { ev.lineEls[ci].classList.add('good'); });
      card.appendChild(h('details', { class: 'ev-det' }, h('summary', { text: 'Pokaż dowód' }), ev.el));
      card.appendChild(h('div', { class: 'digit-box' },
        h('div', { class: 'digit-l', text: ss.assisted ? 'Cyfra (ujawniona przez Romarty’ego)' : 'Twoja cyfra' }),
        h('div', { class: 'digit' + (view.celebrate === q.id ? ' pop' : ''), text: String(q.digit), 'aria-label': 'Cyfra ' + q.digit }),
        h('div', { class: 'digit-s', text: S.mode === 'solo' ? 'Zapamiętana — sejf otworzy się automatycznie.' : 'Proszę podyktować kapitanowi: ogniwo ' + (j + 1) + ' → ' + q.digit })));
      card.appendChild(h('div', { class: 'why' }, h('b', { text: 'Dlaczego? ' }), inline(q.explain)));
      if (view.celebrate === q.id) view.celebrate = null;
      return card;
    }

    var draft = view.drafts[q.id] || (view.drafts[q.id] = {});
    var submitBtn, fbEl = h('div', { class: 'fb', 'aria-live': 'polite' });
    var w = ui.widget(q, draft, function () { fbEl.textContent = ''; });
    if (!w.ownsEvidence) card.appendChild(ui.evidence(q, false).el);
    card.appendChild(h('p', { class: 'ask' }, inline(q.ask)));
    card.appendChild(w.el);

    submitBtn = h('button', { class: 'btn primary', type: 'button', 'data-cool': q.id, text: 'Sprawdzam' });
    submitBtn.addEventListener('click', function () {
      if ((view.cool[q.id] || 0) > now()) return;
      if (!w.ready()) { fbEl.textContent = 'Proszę najpierw wskazać odpowiedź.'; return; }
      if (E.evaluate(q, w.get())) {
        ss.solved = true; save(); ui.vibrate(70); view.celebrate = q.id; render();
      } else {
        ss.wrong++; save();
        view.cool[q.id] = now() + E.cooldownMs(ss.wrong);
        view.fb[q.id] = FB_WRONG[Math.min(ss.wrong - 1, FB_WRONG.length - 1)];
        ui.vibrate([90, 60, 90]); render();
      }
    });

    var controls = h('div', { class: 'row' }, submitBtn);
    if (ss.hints < 2) {
      controls.appendChild(h('button', { class: 'btn', type: 'button', text: 'Podpowiedź Romarty’ego', onclick: function () {
        ss.hints++; save(); render();
      } }));
    }
    card.appendChild(controls);
    if (view.fb[q.id]) fbEl.textContent = view.fb[q.id];
    card.appendChild(fbEl);
    for (var k = 0; k < ss.hints; k++) {
      card.appendChild(h('div', { class: 'hintbox' }, h('b', { text: 'Romarty szepcze: ' }), inline(q.hints[k])));
    }
    if (ss.wrong >= 3 && ss.hints >= 1) {
      card.appendChild(h('button', { class: 'btn ghost block', type: 'button', text: 'Romarty ujawnia rozwiązanie (bez Honoru)', onclick: function () {
        ss.solved = true; ss.assisted = true; save(); render();
      } }));
    }
    refreshCoolButton(submitBtn);
    return card;
  }

  function refreshCoolButton(btn) {
    var id = btn.getAttribute('data-cool');
    var left = Math.ceil(((view.cool[id] || 0) - now()) / 1000);
    if (left > 0) { btn.disabled = true; btn.textContent = 'Za ' + left + ' s'; }
    else { btn.disabled = false; btn.textContent = btn.getAttribute('data-label') || 'Sprawdzam'; }
  }

  /* ---------- Targ Kornackiej (szybka seria) ---------- */

  function quickCard(i) {
    var a = C.acts[i], qk = S.acts[i].quick;
    var card = h('section', { class: 'card quick' }, h('h3', { class: 'card-h' }, h('span', { class: 'card-i', text: '🧺' }), 'Targ Kornackiej'));
    if (qk.done || qk.i >= a.quick.length) {
      card.appendChild(h('p', null, 'Seria zakończona: ' + qk.ok + ' z ' + a.quick.length + ' poprawnych. (Honor osobisty: +' + (qk.ok * 3) + ')'));
      if (view.fb['quick' + i]) card.appendChild(h('p', { class: 'muted', text: view.fb['quick' + i] }));
      return card;
    }
    var it = a.quick[qk.i];
    card.appendChild(h('p', { class: 'muted', text: 'Dla niecierpliwych, na czas oczekiwania. Pytanie ' + (qk.i + 1) + ' z ' + a.quick.length + ' — prawda czy fałsz? (+3 Honoru za trafną odpowiedź)' }));
    card.appendChild(h('p', { class: 'ask' }, inline(it.t)));
    var fb = h('div', { class: 'fb', 'aria-live': 'polite' });
    function ans(v) {
      var ok = v === it.a;
      if (ok) qk.ok++;
      view.fb['quick' + i] = (ok ? '✔ Tak. ' : '✖ Niestety nie. ') + it.why;
      qk.i++; if (qk.i >= a.quick.length) qk.done = true;
      save(); ui.vibrate(ok ? 50 : [60, 40, 60]); render();
    }
    card.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', text: 'Prawda', onclick: function () { ans(true); } }),
      h('button', { class: 'btn', type: 'button', text: 'Fałsz', onclick: function () { ans(false); } })));
    if (view.fb['quick' + i]) { fb.textContent = view.fb['quick' + i]; }
    card.appendChild(fb);
    return card;
  }

  /* ---------- sejf ---------- */

  function safeTab(i, ph) {
    var a = C.acts[i], sf = S.acts[i].safe;
    var out = h('div', { class: 'page' });
    var slotOwners = [];
    for (var j = 0; j < E.SLOTS; j++) slotOwners.push(E.roleOf(E.ownerOf(j, S.size)));

    if (sf.opened) {
      out.appendChild(h('section', { class: 'card done' },
        h('h3', { class: 'card-h', text: '🔓 Sejf otwarty' }),
        h('p', null, 'Zespół zdobył ' + sf.pts + ' pkt za ten akt.'),
        h('div', { class: 'code-line', text: E.safeDigits(C, i).join(' ') })));
      out.appendChild(clueCard(i));
      out.appendChild(h('p', { class: 'muted', text: 'Pozostali członkowie zespołu zobaczą dowód po zakończeniu aktu — warto im go przekazać wcześniej.' }));
      return out;
    }

    if (S.mode === 'live' && !isCaptain()) {
      out.appendChild(ui.card('Sejf obsługuje kapitan', '🔐', [
        h('p', null, 'Kapitan (' + C.roles[0].icon + ' ' + C.roles[0].name + ') wpisuje cyfry wszystkich ogniw. Proszę podyktować mu swoje.'),
        h('div', { class: 'owned' }, mySlots().map(function (j) {
          var ss = E.slotState(S, i, j);
          return h('div', { class: 'owned-i' }, h('span', { text: 'Ogniwo ' + (j + 1) }), h('b', { class: 'digit sm', text: ss.solved ? String(C.acts[i].questions[j].digit) : '?' }));
        })),
        mySlots().every(function (j) { return E.slotState(S, i, j).solved; }) ? null : h('p', { class: 'muted', text: 'Znak zapytania oznacza, że ogniwo nie jest jeszcze rozwiązane (zakładka Śledztwo).' })
      ]));
      return out;
    }

    /* tryb solo: cyfry zbierają się same */
    if (S.mode === 'solo') {
      var all = E.allSlotsSolved(S, i);
      out.appendChild(ui.card('Sejf', '🔐', [
        h('div', { class: 'safe-slots' }, E.safeDigits(C, i).map(function (d, j) {
          var ss = E.slotState(S, i, j);
          return h('div', { class: 'slot' + (ss.solved ? ' full' : '') }, h('span', { class: 'slot-r', text: slotOwners[j].icon }), h('span', { class: 'slot-d', text: ss.solved ? String(d) : '·' }));
        })),
        h('p', { class: 'muted', text: all ? 'Wszystkie cyfry zdobyte.' : 'Brakuje cyfr — proszę rozwiązać pozostałe ogniwa.' }),
        h('button', { class: 'btn primary block', type: 'button', disabled: !all, text: 'Otwieram sejf', onclick: function () { openSafe(i, ph); } })
      ]));
      return out;
    }

    /* kapitan w sesji na żywo: klawiatura */
    var ent = view.safe[i] || (view.safe[i] = [null, null, null, null, null]);
    var sel = view.safeSel[i] === undefined ? 0 : view.safeSel[i];
    var slotsEl = h('div', { class: 'safe-slots', role: 'group', 'aria-label': 'Cyfry sejfu' }, ent.map(function (d, j) {
      return h('button', { type: 'button', class: 'slot' + (sel === j ? ' sel' : '') + (d !== null ? ' full' : ''), 'aria-label': 'Ogniwo ' + (j + 1) + (d !== null ? ', cyfra ' + d : ', puste'),
        onclick: function () { view.safeSel[i] = j; render(); } },
        h('span', { class: 'slot-r', 'aria-hidden': 'true', text: slotOwners[j].icon }), h('span', { class: 'slot-d', text: d === null ? '·' : String(d) }));
    }));
    function press(d) {
      var s = view.safeSel[i] === undefined ? 0 : view.safeSel[i];
      if (d === 'back') {
        if (ent[s] !== null) ent[s] = null; else if (s > 0) { s--; ent[s] = null; }
        view.safeSel[i] = s;
      } else {
        ent[s] = d;
        view.safeSel[i] = Math.min(4, s + 1);
      }
      view.safeFb[i] = '';
      render();
    }
    var keys = h('div', { class: 'keypad', role: 'group', 'aria-label': 'Klawiatura sejfu' });
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0].forEach(function (k) {
      keys.appendChild(h('button', { type: 'button', class: 'key' + (k === 'back' ? ' alt' : ''), 'aria-label': k === 'back' ? 'Usuń cyfrę' : String(k), text: k === 'back' ? '⌫' : String(k), onclick: function () { press(k); } }));
    });
    var full = ent.every(function (d) { return d !== null; });
    var cd = Math.ceil(((view.cool['safe' + i] || 0) - now()) / 1000);
    var go = h('button', { class: 'key go', type: 'button', 'data-safecool': String(i), disabled: !full || cd > 0, text: cd > 0 ? String(cd) : '✔', 'aria-label': 'Otwieram sejf',
      onclick: function () {
        if ((view.cool['safe' + i] || 0) > now()) return;
        if (E.checkSafe(C, i, ent)) openSafe(i, ph);
        else {
          sf.wrong++; save();
          view.cool['safe' + i] = now() + Math.min(12000, 3000 * sf.wrong);
          view.safeFb[i] = 'Sejf nie ustępuje. Proszę sprawdzić, czy każdy rozwiązał swoje ogniwo i podał właściwą cyfrę. (Każda pomyłka kosztuje 10 pkt.)';
          ui.vibrate([100, 60, 100]); render();
        }
      } });
    keys.appendChild(go);

    out.appendChild(ui.card('Sejf · ' + a.title, '🔐', [
      h('p', null, 'Proszę zebrać od zespołu cyfry ogniw 1–5 (ikona pokazuje, kto je rozwiązuje) i wpisać je. Można stuknąć w pole, aby je poprawić.'),
      slotsEl, keys,
      h('p', { class: 'err', role: 'alert', text: view.safeFb[i] || '' }),
      sf.wrong ? h('p', { class: 'muted', text: 'Pomyłek: ' + sf.wrong + ' (−' + 10 * sf.wrong + ' pkt)' }) : null
    ]));
    return out;
  }

  function openSafe(i, ph) {
    var sf = S.acts[i].safe;
    sf.opened = true;
    sf.wrong = sf.wrong || 0;
    sf.pts = E.actPoints({ mode: S.mode, workFrac: curFrac(ph), wrong: sf.wrong });
    sf.at = now();
    save(); ui.vibrate(120);
    if (S.mode === 'solo') { S.solo.phase = 'reveal'; save(); }
    render();
  }

  function clueCard(i) {
    var cl = C.acts[i].clue;
    return h('section', { class: 'card clue' }, h('h3', { class: 'card-h' }, h('span', { class: 'card-i', text: '🗂️' }), cl.title), h('p', null, inline(cl.text)));
  }

  /* ---------- rozwiązanie aktu ---------- */

  function debrief(i, startOpen) {
    var a = C.acts[i];
    var out = h('div', { class: 'debrief' });
    out.appendChild(ui.card('Wykład w pigułce', '🎓', [h('ul', null, a.reveal.takeaways.map(function (t) { return h('li', null, inline(t)); }))], 'takeaway'));
    out.appendChild(clueCard(i));
    var det = h('div', { class: 'sol' });
    a.questions.forEach(function (q, j) {
      var d = h('details', { class: 'sol-i', open: startOpen ? '' : null },
        h('summary', null, h('span', { class: 'sol-no', text: String(j + 1) }), h('span', { class: 'sol-t', text: q.title }), h('b', { class: 'sol-d', text: String(q.digit) })),
        h('div', { class: 'sol-b' },
          h('p', { class: 'muted', text: 'Poprawna odpowiedź:' }),
          h('ul', { class: 'good-list' }, E.describeCorrect(q).map(function (t) { return h('li', null, inline(t)); })),
          h('p', null, inline(q.explain))));
      det.appendChild(d);
    });
    out.appendChild(ui.card('Rozwiązania ogniw', '🧩', [h('p', { class: 'muted', text: 'Kod sejfu: ' + E.safeDigits(C, i).join(' ') }), det]));
    return out;
  }

  function revealTab(i, ph) {
    var a = C.acts[i], sf = S.acts[i].safe;
    var out = h('div', { class: 'page' });
    var status;
    if (S.mode === 'solo') status = sf.opened ? '🔓 Sejf otwarty: +' + sf.pts + ' pkt.' : '🔒 Akt pominięty — bez punktów.';
    else if (isCaptain()) status = sf.opened ? '🔓 Sejf otwarty: +' + sf.pts + ' pkt dla zespołu.' : '🔒 Sejf nie został otwarty — 0 pkt za ten akt.';
    else status = 'Wynik sejfu zna kapitan. Rozwiązania poniżej.';
    out.appendChild(h('section', { class: 'card hero-card' },
      h('h2', { text: 'Akt ' + a.roman + ' zamknięty' }), h('p', { class: 'lead', text: status }),
      S.mode === 'live' ? h('div', { class: 'big-timer sm', 'data-timer': '1', text: timerText(ph) }) : null));
    out.appendChild(debrief(i, false));
    out.appendChild(h('p', { class: 'next', text: a.reveal.next }));
    if (S.mode === 'solo') {
      var last = i === E.ACTS - 1;
      out.appendChild(h('button', { class: 'btn primary block', type: 'button', text: last ? 'Przechodzę do finału ›' : 'Następny akt ›', onclick: function () {
        if (last) S.solo.phase = 'accuse'; else { S.solo.idx++; S.solo.phase = 'work'; }
        save(); view.lastSig = null; render(); window.scrollTo(0, 0);
      } }));
    }
    return out;
  }

  /* ---------- teczka ---------- */

  function dossierTab(ph) {
    var out = h('div', { class: 'page' });
    out.appendChild(h('h2', { text: '📁 Teczka sprawy' }));
    var unlocked = [];
    C.acts.forEach(function (a, i) { if (a.clue.attr && clueUnlocked(i)) unlocked.push(a.clue); });

    out.appendChild(h('h3', { class: 'sec', text: 'Zdobyte dowody' }));
    C.acts.forEach(function (a, i) {
      if (clueUnlocked(i)) out.appendChild(clueCard(i));
      else out.appendChild(h('div', { class: 'locked-clue' }, '🔒 Dowód ' + a.roman + ' — dostępny po zamknięciu sejfu lub zakończeniu aktu.'));
    });

    out.appendChild(h('h3', { class: 'sec', text: 'Podejrzani' }));
    out.appendChild(h('label', { class: 'switch' },
      h('input', { type: 'checkbox', checked: view.hilite ? '' : null, onchange: function (e) { view.hilite = e.target.checked; render(); } }),
      ' Podświetl zgodność cech z dowodami'));
    var attrs = C.attributes;
    C.suspects.forEach(function (s) {
      var excluded = !!S.marks[s.id];
      var traits = h('ul', { class: 'traits' }, attrs.map(function (at) {
        var cl = unlocked.filter(function (c) { return c.attr === at.id; })[0];
        var cls = '';
        if (view.hilite && cl) cls = s.traits[at.id] === cl.value ? ' ok' : ' no';
        return h('li', { class: 'trait' + cls }, h('span', { class: 'trait-l', text: at.label }), h('b', { text: s.traits[at.id] }));
      }));
      out.appendChild(h('section', { class: 'card sus' + (excluded ? ' excluded' : '') },
        h('div', { class: 'sus-h' }, h('span', { class: 'sus-e', 'aria-hidden': 'true', text: s.emoji }), h('div', null, h('b', { text: s.name }), h('small', { text: s.bio }))),
        traits,
        h('button', { class: 'btn small', type: 'button', 'aria-pressed': excluded ? 'true' : 'false', text: excluded ? '✖ Wykluczony (cofnij)' : 'Wykluczam', onclick: function () { S.marks[s.id] = !excluded; save(); render(); } })));
    });

    var endedN = actsEnded();
    if (endedN > 0) {
      out.appendChild(h('h3', { class: 'sec', text: 'Akta zakończonych aktów' }));
      for (var i = 0; i < endedN && i < E.ACTS; i++) {
        (function (k) {
          out.appendChild(h('details', { class: 'card arch' },
            h('summary', { text: 'Akt ' + C.acts[k].roman + ' · ' + C.acts[k].title }), debrief(k, false)));
        }(i));
      }
    }
    return out;
  }

  /* ---------- finał ---------- */

  function radioList(name, items, cur, onPick, disabled) {
    return h('div', { class: 'opts', role: 'radiogroup' }, items.map(function (it, idx) {
      var on = cur === it.value;
      var b = h('button', { class: 'opt' + (on ? ' on' : '') + (it.excluded ? ' excl' : ''), type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', disabled: disabled ? '' : null,
        onclick: function () { onPick(it.value); } },
        h('span', { class: 'opt-l', 'aria-hidden': 'true', text: it.mark || 'ABCDE'.charAt(idx) }), h('span', { class: 'opt-t' }, it.node));
      return b;
    }));
  }

  function accuseTab(ph) {
    var f = C.finale, fin = S.final;
    var out = h('div', { class: 'page' });
    out.appendChild(h('section', { class: 'card hero-card' }, h('h2', { text: '⚖️ Oskarżenie' }), h('p', null, inline(f.intro)),
      S.mode === 'live' ? h('div', { class: 'big-timer sm', 'data-timer': '1', text: timerText(ph) }) : null));
    if (fin.submitted) {
      out.appendChild(h('section', { class: 'card done' }, h('h3', { class: 'card-h', text: '✔ Oskarżenie złożone' }),
        h('p', null, 'Rozstrzygnięcie pojawi się, gdy skończy się czas na oskarżenia.'),
        S.mode === 'solo' ? h('button', { class: 'btn primary block', type: 'button', text: 'Pokaż rozstrzygnięcie ›', onclick: function () { S.solo.phase = 'unmask'; save(); view.lastSig = null; render(); } }) : null));
      return out;
    }
    var acc = view.acc;
    var sus = C.suspects.map(function (s) {
      return { value: s.id, mark: s.emoji, excluded: !!S.marks[s.id], node: h('span', null, h('b', { text: s.name }), h('small', { class: 'blk', text: s.bio })) };
    });
    var how = f.how.options.map(function (t, k) { return { value: k, node: inline(t) }; });
    var fix = f.fix.options.map(function (t, k) { return { value: k, node: inline(t) }; });
    var cap = isCaptain();
    out.appendChild(ui.card('1. Kto jest Człowiekiem-w-Środku?', '👤', [h('p', { class: 'muted', text: 'Proszę wykorzystać wszystkie dowody z teczki.' }), radioList('who', sus, acc.who, function (v) { acc.who = v; render(); }, false)]));
    out.appendChild(ui.card('2. ' + f.how.ask, '🛠️', [radioList('how', how, acc.how, function (v) { acc.how = v; render(); }, false)]));
    out.appendChild(ui.card('3. ' + f.fix.ask, '🧱', [radioList('fix', fix, acc.fix, function (v) { acc.fix = v; render(); }, false)]));
    if (!cap) out.appendChild(h('p', { class: 'muted', text: 'Oskarżenie składa kapitan (' + C.roles[0].name + '). Tu można naradzać się i zaznaczać własne typy.' }));
    else {
      var ready = acc.who !== null && acc.how !== null && acc.fix !== null;
      out.appendChild(h('button', { class: 'btn primary block', type: 'button', disabled: ready ? null : '', text: 'Składam oskarżenie', onclick: function () {
        ui.modal('Składamy oskarżenie?', 'Czy cały zespół się zgadza? Oskarżenie można złożyć tylko jeden raz.', [
          { label: 'Tak, składam', cls: 'primary', onclick: submitAccusation }, { label: 'Jeszcze się naradzimy' }]);
      } }));
      if (!ready) out.appendChild(h('p', { class: 'muted', text: 'Proszę wypełnić wszystkie trzy części.' }));
    }
    return out;
  }

  function submitAccusation() {
    var f = C.finale, acc = view.acc, ph = phase();
    var ok = { who: acc.who === C.culprit, how: acc.how === f.how.correct, fix: acc.fix === f.fix.correct };
    S.final = { submitted: true, who: acc.who, how: acc.how, fix: acc.fix, ok: ok, at: now(),
      pts: E.finalPoints(C, ok, { mode: S.mode, workFrac: curFrac(ph) }) };
    if (S.mode === 'solo') S.solo.phase = 'unmask';
    save(); ui.vibrate(120); view.lastSig = null; render();
  }

  function unmaskTab(ph) {
    var f = C.finale, u = f.unmask, fin = S.final;
    var culprit = C.suspects.filter(function (s) { return s.id === C.culprit; })[0];
    var out = h('div', { class: 'page' });
    out.appendChild(h('section', { class: 'card hero-card' }, h('h2', { text: '🎭 ' + u.title }),
      h('p', { class: 'lead' }, h('b', { text: culprit.emoji + ' ' + culprit.name }), ' — to on stał za atakiem.'),
      u.paras.map(function (p) { return h('p', null, inline(p)); }),
      h('blockquote', { class: 'voice' }, h('div', { class: 'voice-who', text: u.quote.who }), h('div', { text: '„' + u.quote.text + '”' }))));
    if (isCaptain()) {
      if (fin.submitted) {
        var rows = [
          ['Kto: ' + C.suspects.filter(function (s) { return s.id === fin.who; })[0].name, fin.ok.who],
          ['Jak', fin.ok.how], ['Co by zapobiegło', fin.ok.fix]];
        out.appendChild(ui.card('Wynik oskarżenia', '📋', [
          h('ul', { class: 'res' }, rows.map(function (r) { return h('li', { class: r[1] ? 'ok' : 'no' }, (r[1] ? '✔ ' : '✖ ') + r[0]); })),
          h('p', null, 'Punkty za finał: ', h('b', { text: String(fin.pts) }))]));
      } else {
        out.appendChild(ui.card('Oskarżenie', '📋', [h('p', null, 'Oskarżenie nie zostało złożone w terminie — 0 pkt za finał.')]));
      }
      out.appendChild(ui.card('Wynik zespołu', '🏆', [h('p', { class: 'score' }, h('b', { text: String(E.totalScore(S)) }), ' / ' + E.maxTotal(C) + ' pkt')]));
    } else {
      out.appendChild(ui.card('Wynik zespołu', '🏆', [h('p', null, 'Wynik zna kapitan. Raport dla prowadzącego jest w zakładce Raport (na telefonie kapitana).')]));
    }
    out.appendChild(ui.card('Czego dowiedzieliśmy się o serwerach WWW', '🎓', [h('ul', null, f.recap.map(function (t) { return h('li', null, inline(t)); }))], 'takeaway'));
    out.appendChild(ui.card('Co dalej', '➡️', [h('p', null, inline(u.cliff))]));
    if (S.mode === 'solo') out.appendChild(h('button', { class: 'btn block', type: 'button', text: 'Zagraj od nowa', onclick: function () { store.del('cm1:s:solo'); startSolo(); } }));
    return out;
  }

  /* ---------- raport ---------- */

  function reportTab(ph) {
    var out = h('div', { class: 'page' });
    out.appendChild(h('h2', { text: '📊 Raport dla prowadzącego' }));
    if (S.mode === 'solo') {
      out.appendChild(ui.card('Twój wynik', '🏆', [h('p', { class: 'score' }, h('b', { text: String(E.totalScore(S)) }), ' / ' + E.maxTotal(C) + ' pkt (tryb treningowy — bez raportu).')]));
      return out;
    }
    if (!isCaptain()) {
      out.appendChild(ui.card('Raport składa kapitan', '🧑‍✈️', [h('p', null, 'Raport z wynikiem zespołu pokazuje telefon kapitana (' + C.roles[0].name + '). Proszę mu przypomnieć, żeby pokazał kod prowadzącemu.')]));
      return out;
    }
    var rep = E.buildReport(S), code = E.encodeReport(rep);
    var url = new URL('host.html#r=' + code, location.href).href;
    out.appendChild(ui.card('Wynik zespołu', '🏆', [
      h('p', { class: 'score' }, h('b', { text: String(E.totalScore(S)) }), ' / ' + E.maxTotal(C) + ' pkt'),
      h('table', { class: 'tbl' }, h('tbody', null,
        C.acts.map(function (a, i) { return h('tr', null, h('th', { scope: 'row', text: 'Akt ' + a.roman }), h('td', { text: S.acts[i].safe.opened ? String(S.acts[i].safe.pts) : '0' })); }),
        h('tr', null, h('th', { scope: 'row', text: 'Finał' }), h('td', { text: String(S.final.submitted ? S.final.pts : 0) }))))]));
    out.appendChild(ui.card('Proszę pokazać prowadzącemu', '📱', [
      h('p', null, 'Prowadzący zeskanuje kod aparatem telefonu albo otworzy link. Kod aktualizuje się, gdy zmienia się wynik — proszę pokazać najnowszy.'),
      ui.qrSvg(url, 4),
      h('p', { class: 'rep-code', text: U.groups(code, 5) }),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', text: 'Kopiuję kod', onclick: function () { ui.copyText(code); } }),
        h('button', { class: 'btn', type: 'button', text: 'Udostępniam link', onclick: function () { ui.share({ title: 'Raport zespołu — ' + C.meta.title, text: teamName() + ': ' + E.totalScore(S) + ' pkt', url: url }); } }))]));
    return out;
  }

  /* ---------- menu ---------- */

  function showMenu() {
    var body = h('div', null,
      h('p', { class: 'muted', text: S.mode === 'solo' ? 'Tryb treningowy.' : 'Sesja ' + E.fmtSessionCode(S.sessionCode) + ' · ' + teamName() + ' · zespół ' + S.size + '-osobowy' }),
      S.mode === 'live' ? h('p', { class: 'muted', text: view.clock.state === 'ok' ? 'Zegar zsynchronizowany z serwerem (różnica ' + (view.clock.off / 1000).toFixed(1) + ' s).' : 'Zegar telefonu (brak synchronizacji z serwerem — proszę sprawdzić, czy czas w telefonie jest ustawiony automatycznie).' }) : null,
      h('p', { class: 'muted', text: store.persistent ? 'Postęp zapisuje się na tym telefonie.' : 'Uwaga: ta przeglądarka nie zapisuje danych — odświeżenie strony zgubi postęp.' }));
    ui.modal('Menu', body, [
      { label: 'Zasady gry', onclick: function () { setTimeout(showRules, 0); } },
      S.mode === 'live' ? { label: 'Zmieniam zespół lub rolę', onclick: function () { setTimeout(changeSetup, 0); } } : null,
      { label: 'Kończę grę i czyszczę dane', onclick: function () {
        setTimeout(function () {
          ui.modal('Na pewno?', 'Postęp na tym telefonie zostanie usunięty.', [
            { label: 'Usuwam', cls: 'primary', onclick: function () { store.del(keyFor(S)); store.del('cm1:last'); S = null; view.route = 'home'; render(); } }, { label: 'Anuluję' }]);
        }, 0);
      } },
      { label: 'Zamykam', cls: 'primary' }
    ].filter(Boolean));
  }

  /* ---------- pętla ---------- */

  function render() {
    var keep = window.scrollY;
    var prevSig = view.lastSig, prevTab = view.tab, prevRoute = rootEl.getAttribute('data-route');
    var scr;
    if (view.route === 'home') scr = homeScreen();
    else if (view.route === 'setup') scr = setupScreen();
    else scr = gameScreen();
    rootEl.textContent = '';
    rootEl.appendChild(scr);
    rootEl.setAttribute('data-route', view.route);
    if (prevRoute === view.route && prevSig === view.lastSig && prevTab === view.tab) window.scrollTo(0, keep);
    else window.scrollTo(0, 0);
    updateLive();
  }

  function updateLive() {
    if (view.route !== 'game' || !S) return;
    var ph = phase();
    var t = timerText(ph);
    Array.prototype.forEach.call(document.querySelectorAll('[data-timer]'), function (el) { el.textContent = t; });
    var tm = document.querySelector('.timer');
    if (tm) tm.classList.toggle('urgent', ph.phase === 'work' && ph.left !== null && ph.left < 60);
    var pr = document.querySelector('[data-prog]');
    if (pr && ph.workDur) pr.style.width = (100 * (1 - ph.left / ph.workDur)).toFixed(1) + '%';
    Array.prototype.forEach.call(document.querySelectorAll('[data-cool]'), refreshCoolButton);
    var sc = document.querySelector('[data-safecool]');
    if (sc) {
      var i = parseInt(sc.getAttribute('data-safecool'), 10);
      var left = Math.ceil(((view.cool['safe' + i] || 0) - now()) / 1000);
      var ent = view.safe[i] || [];
      var full = ent.length === 5 && ent.every(function (d) { return d !== null; });
      if (left > 0) { sc.disabled = true; sc.textContent = String(left); }
      else { sc.disabled = !full; sc.textContent = '✔'; }
    }
  }

  function tick() {
    if (view.route !== 'game' || !S) return;
    var ph = phase(), sg = sig(ph);
    if (sg !== view.lastSig) { render(); return; }
    if (S.mode === 'live' && ph.kind === 'act' && ph.phase === 'work' && view.tab === 'brief' && !view.navigated && (ph.workDur - ph.left) >= 75) {
      view.tab = 'work'; render(); return;
    }
    updateLive();
  }

  function parseHash() {
    var hsh = location.hash.replace(/^#/, '');
    if (!hsh) return;
    var m = /^j=([^&]+)/.exec(hsh);
    if (m) view.prefill = decodeURIComponent(m[1]);
    history.replaceState(null, '', location.pathname + location.search);
  }

  function wake() {
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').catch(function () {}); } catch (e) { /* nic */ }
  }

  function init() {
    parseHash();
    var last = store.get('cm1:last');
    var saved = last ? store.get(last) : null;
    if (saved && saved.v === 1 && saved.acts && saved.acts.length === E.ACTS && !view.prefill) {
      /* wznowienie gry bez ekranu startowego, jeśli sesja jeszcze trwa */
      if (saved.mode === 'solo' || (Date.now() - saved.startMs) < 75 * 60000) { S = saved; view.route = 'game'; }
    }
    if (view.prefill) {
      var d = E.decodeSession(view.prefill);
      var ex = d ? store.get('cm1:s:' + d.code) : null;
      if (ex && ex.v === 1) { S = ex; view.route = 'game'; view.prefill = ''; }
    }
    render();
    syncClock().then(function () { if (view.route === 'game') render(); });
    setInterval(tick, 500);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { tick(); wake(); } });
    document.addEventListener('click', wake, { once: true });
    setInterval(function () { syncClock(); }, 5 * 60000);
    if ('serviceWorker' in navigator && location.protocol !== 'file:' && !params.has('nosw')) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* brak SW nie psuje gry */ });
    }
  }

  window.CM.app = { init: init, _state: function () { return S; }, _view: view };
  init();
}());
