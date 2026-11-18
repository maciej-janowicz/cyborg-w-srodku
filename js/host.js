/* Cyborg w Środku — panel prowadzącego (telefon lub laptop). */
(function () {
  'use strict';
  var CM = window.CM, U = CM.util, E = CM.engine, C = CM.content, ui = CM.ui, h = ui.h;
  var store = U.makeStore((function () { try { return window.localStorage; } catch (e) { return null; } }()));
  var root = document.getElementById('host');
  var KEY_SESS = 'cm1:host:session', KEY_REP = 'cm1:host:reports:';
  var offset = 0, session = store.get(KEY_SESS), msg = '', msgOk = true, lastSig = null;

  function now() { return Date.now() + offset; }
  function fmt(ms) { var d = new Date(ms); return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()); }

  function sync() {
    if (!window.fetch || /nosync/.test(location.search)) return Promise.resolve();
    var t0 = Date.now();
    return fetch('ping.txt?_=' + t0, { cache: 'no-store' }).then(function (r) {
      var t1 = Date.now(), d = r.headers.get('Date');
      if (!d) return;
      var off = new Date(d).getTime() + (t1 - t0) / 2 - t1;
      if (isFinite(off) && Math.abs(off) < 6 * 3600 * 1000) offset = Math.abs(off) < 1500 ? 0 : off;
    }).catch(function () { /* zegar telefonu */ });
  }

  function reports() { return (session && store.get(KEY_REP + session.code)) || {}; }

  function addReport(code) {
    var r = E.decodeReport(code);
    if (!r) { msg = 'Nieprawidłowy kod raportu (błąd w przepisaniu lub raport z innej wersji gry).'; msgOk = false; return false; }
    if (!session) { msg = 'Najpierw proszę utworzyć sesję.'; msgOk = false; return false; }
    var cur = E.decodeSession ? null : null;
    var startMin = Math.round((session.startMs - E.EPOCH) / 60000);
    if (r.sessionMin !== startMin) { msg = 'Ten raport pochodzi z innej sesji.'; msgOk = false; return false; }
    var all = reports(), prev = all[r.team];
    var name = C.teams[r.team - 1] || ('#' + r.team);
    if (prev && prev.total > r.total) { msg = 'Zespół ' + name + ': mam już wyższy wynik (' + prev.total + ') — zachowuję go.'; msgOk = true; return true; }
    all[r.team] = r; store.set(KEY_REP + session.code, all);
    msg = 'Zespół ' + name + ': ' + r.total + ' pkt zapisane.'; msgOk = true; return true;
  }

  function createSession(minutes) {
    var startMs = Math.ceil((now() + minutes * 60000) / 60000) * 60000;
    var code = E.encodeSession(startMs);
    session = { code: code, startMs: startMs };
    store.set(KEY_SESS, session); msg = ''; render();
  }

  function joinUrl() { return new URL('index.html#j=' + session.code, location.href).href; }

  function script(ph) {
    if (ph.kind === 'before' || ph.kind === 'prolog') return 'Witam Państwa. Proszę usiąść w zespołach (4–5 osób), otworzyć link lub zeskanować kod i wybrać zespół oraz rolę. Gra trwa 45 minut; ja mówię tylko na początku i na końcu każdego aktu.';
    if (ph.kind === 'act') { var a = C.acts[ph.index]; return ph.phase === 'work' ? a.hostSay.start : a.hostSay.reveal; }
    if (ph.kind === 'finale') return C.finale.hostSay[ph.phase === 'accuse' ? 'accuse' : 'unmask'];
    return 'Dziękuję za grę. Kolejny wykład: FTP.';
  }
  function label(ph) {
    if (ph.kind === 'before') return 'Przed startem';
    if (ph.kind === 'prolog') return 'Prolog';
    if (ph.kind === 'act') return 'Akt ' + C.acts[ph.index].roman + (ph.phase === 'work' ? ' — praca' : ' — rozwiązanie');
    if (ph.kind === 'finale') return ph.phase === 'accuse' ? 'Finał — oskarżenie' : 'Finał — rozstrzygnięcie';
    return 'Koniec';
  }

  function csv() {
    var rows = ['zespol;liczebnosc;' + C.acts.map(function (a) { return 'akt' + a.roman; }).join(';') + ';final;suma;kto;jak;co'];
    ranking().forEach(function (r) {
      rows.push([C.teams[r.team - 1], r.size].concat(r.acts, [r.final, r.total, r.who ? 1 : 0, r.how ? 1 : 0, r.fix ? 1 : 0]).join(';'));
    });
    return rows.join('\n');
  }
  function ranking() {
    var all = reports();
    return Object.keys(all).map(function (k) { return all[k]; }).sort(function (a, b) { return b.total - a.total || a.team - b.team; });
  }

  function render() {
    var out = h('div', { class: 'page' }, h('h1', { text: '🎛️ Panel prowadzącego' }));
    if (!session) {
      out.appendChild(ui.card('Nowa sesja', '🆕', [
        h('p', null, 'Proszę utworzyć sesję i podać studentom kod lub link. Zegar gry jest wspólny dla wszystkich telefonów.'),
        h('div', { class: 'row' },
          [2, 5, 10].map(function (m) { return h('button', { class: 'btn' + (m === 5 ? ' primary' : ''), type: 'button', text: 'Start za ' + m + ' min', onclick: function () { createSession(m); } }); }))]));
      out.appendChild(h('p', { class: 'muted' }, h('a', { href: 'index.html', text: '‹ Wróć do gry' })));
      root.textContent = ''; root.appendChild(out); return;
    }
    var t = (now() - session.startMs) / 1000, ph = E.phaseAt(t), url = joinUrl();
    out.appendChild(ui.card('Sesja ' + E.fmtSessionCode(session.code), '🔑', [
      h('p', { class: 'score' }, 'Start: ', h('b', { text: fmt(session.startMs) })),
      ui.qrSvg(url, 4),
      h('p', { class: 'rep-code', text: url }),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', text: 'Kopiuję link', onclick: function () { ui.copyText(url); } }),
        h('button', { class: 'btn', type: 'button', text: 'Nowa sesja', onclick: function () {
          ui.modal('Nowa sesja?', 'Zebrane raporty tej sesji zostaną w pamięci, ale panel przełączy się na nową.', [
            { label: 'Tak', cls: 'primary', onclick: function () { session = null; store.del(KEY_SESS); render(); } }, { label: 'Nie' }]);
        } }))]));
    out.appendChild(h('section', { class: 'card hero-card' },
      h('div', { class: 'muted', text: label(ph) }),
      h('div', { class: 'big-timer', 'data-clk': '1', text: ph.left ? U.fmtClock(ph.left) : '—' }),
      h('p', { class: 'voice' }, h('span', { class: 'voice-who', text: 'Co powiedzieć' }), script(ph))));

    var inp = h('input', { class: 'inp', type: 'text', placeholder: 'Wklej kod raportu', 'aria-label': 'Kod raportu', autocomplete: 'off', autocapitalize: 'characters' });
    out.appendChild(ui.card('Raporty zespołów', '📥', [
      h('p', { class: 'muted', text: 'Kapitan pokazuje kod QR — proszę zeskanować aparatem (otworzy tę stronę z raportem) albo wkleić kod.' }),
      inp,
      h('button', { class: 'btn primary block', type: 'button', text: 'Dodaję raport', onclick: function () { if (inp.value.trim()) { addReport(inp.value); render(); } } }),
      msg ? h('p', { class: msgOk ? 'muted' : 'err', role: 'status', text: msg }) : null]));

    var rk = ranking();
    var rows = rk.map(function (r, i) {
      return h('tr', null, h('td', { text: String(i + 1) }), h('td', { text: C.teams[r.team - 1] }),
        h('td', { text: String(r.safeCount) + '/6' }), h('td', { text: (r.who ? '✔' : '✖') + (r.how ? '✔' : '✖') + (r.fix ? '✔' : '✖') }), h('th', { scope: 'row', text: String(r.total) }));
    });
    out.appendChild(ui.card('Tablica wyników', '🏆', [
      rk.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, ['#', 'Zespół', 'Sejfy', 'K·J·C', 'Pkt'].map(function (x) { return h('th', { text: x }); }))), h('tbody', null, rows)))
        : h('p', { class: 'muted', text: 'Brak raportów.' }),
      rk.length ? h('button', { class: 'btn block', type: 'button', text: 'Kopiuję CSV', onclick: function () { ui.copyText(csv()); } }) : null,
      h('p', { class: 'muted', text: 'Maksimum: ' + E.maxTotal(C) + ' pkt. K·J·C = kto, jak, co by zapobiegło.' })]));
    root.textContent = ''; root.appendChild(out);
  }

  function tick() {
    if (!session) return;
    var t = (now() - session.startMs) / 1000, ph = E.phaseAt(t);
    var s = ph.kind + (ph.index === undefined ? '' : ph.index) + (ph.phase || '');
    if (s !== lastSig) { lastSig = s; render(); return; }
    var el = document.querySelector('[data-clk]');
    if (el) el.textContent = ph.left ? U.fmtClock(ph.left) : '—';
  }

  function init() {
    var m = /^#r=([^&]+)/.exec(location.hash);
    if (m) { addReport(decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
    render();
    sync().then(render);
    setInterval(tick, 500);
  }
  window.CM.host = { init: init, _addReport: addReport };
  init();
}());
