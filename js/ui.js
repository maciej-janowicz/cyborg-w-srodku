/* Cyborg w Środku — pomocniki interfejsu: budowanie DOM, bloki treści, widżety zadań. */
(function (root) {
  'use strict';
  var CM = root.CM = root.CM || {};

  /* ---------- DOM ---------- */

  function append(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    if (typeof c === 'string' || typeof c === 'number') { el.appendChild(document.createTextNode(String(c))); return; }
    el.appendChild(c);
  }

  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { el.style[s] = v[s]; });
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  /* **pogrubienie** oraz `kod` — bezpiecznie, bez innerHTML. */
  function inline(text) {
    var frag = document.createDocumentFragment();
    var re = /(\*\*[^*]+\*\*|`[^`]+`)/g, last = 0, m;
    text = String(text);
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var tok = m[0];
      frag.appendChild(tok.charAt(0) === '*' ? h('strong', { text: tok.slice(2, -2) }) : h('code', { text: tok.slice(1, -1) }));
      last = m.index + tok.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function blocks(list) {
    var out = h('div', { class: 'blocks' });
    list.forEach(function (b) {
      if (b.p) out.appendChild(h('p', null, inline(b.p)));
      else if (b.ul) out.appendChild(h('ul', null, b.ul.map(function (li) { return h('li', null, inline(li)); })));
      else if (b.code) out.appendChild(h('pre', { class: 'code' }, h('code', { text: b.code.join('\n') })));
      else if (b.note) out.appendChild(h('p', { class: 'note' }, inline(b.note)));
      else if (b.voice) out.appendChild(h('blockquote', { class: 'voice' }, h('div', { class: 'voice-who', text: b.voice.who }), h('div', null, inline(b.voice.text))));
      else if (b.table) {
        out.appendChild(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, b.table.head.map(function (x) { return h('th', { text: x }); }))),
          h('tbody', null, b.table.rows.map(function (r) {
            return h('tr', null, r.map(function (x, i) { return i === 0 ? h('th', { scope: 'row', text: x }) : h('td', { text: x }); }));
          })))));
      }
    });
    return out;
  }

  function card(title, icon, children, cls) {
    return h('section', { class: 'card ' + (cls || '') },
      title ? h('h3', { class: 'card-h' }, icon ? h('span', { class: 'card-i', 'aria-hidden': 'true', text: icon }) : null, title) : null,
      children);
  }

  /* ---------- dowody ---------- */

  function evidence(q, selectable) {
    var ev = q.evidence;
    var wrap = h('div', { class: 'evidence' }, h('div', { class: 'ev-title', text: ev.title }));
    if (ev.kind === 'note') {
      wrap.appendChild(h('div', { class: 'ev-note' }, ev.lines.map(function (l) { return h('p', null, inline(l)); })));
      return { el: wrap, lineEls: [] };
    }
    var pre = h('div', { class: 'code lines', role: selectable ? 'group' : null, 'aria-label': selectable ? 'Linie dowodu — proszę zaznaczyć właściwe' : null });
    var lineEls = ev.lines.map(function (line, i) {
      var can = selectable && q.selectable.indexOf(i) >= 0;
      var ln = h('div', { class: 'ln' + (can ? ' sel' : ''), role: can ? 'checkbox' : null, 'aria-checked': can ? 'false' : null, tabindex: can ? '0' : null });
      ln.textContent = line === '' ? ' ' : line;
      pre.appendChild(ln);
      return ln;
    });
    wrap.appendChild(pre);
    return { el: wrap, lineEls: lineEls };
  }

  /* ---------- widżety zadań ----------
   * Każdy zwraca { el, get(), ready(), lock(bool) }. Szkic odpowiedzi (draft.v) żyje poza DOM,
   * dzięki czemu ponowne rysowanie ekranu nie gubi zaznaczeń. */

  function widgetChoice(q, draft, onChange) {
    var order = CM.engine.displayOrder(q);
    var list = h('div', { class: 'opts', role: 'radiogroup' });
    var btns = order.map(function (oi, pos) {
      var b = h('button', { class: 'opt', type: 'button', role: 'radio', 'aria-checked': 'false' },
        h('span', { class: 'opt-l', 'aria-hidden': 'true', text: 'ABCDE'.charAt(pos) }), h('span', { class: 'opt-t' }, inline(q.options[oi])));
      b.addEventListener('click', function () {
        if (list.classList.contains('locked')) return;
        draft.v = oi; paint(); onChange();
      });
      list.appendChild(b);
      return b;
    });
    function paint() {
      btns.forEach(function (b, pos) {
        var on = order[pos] === draft.v;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    paint();
    return {
      el: list,
      get: function () { return draft.v === undefined ? null : draft.v; },
      ready: function () { return draft.v !== undefined && draft.v !== null; },
      lock: function (v) { list.classList.toggle('locked', !!v); }
    };
  }

  function widgetMulti(q, draft, onChange) {
    var order = CM.engine.displayOrder(q);
    if (!draft.v) draft.v = [];
    var list = h('div', { class: 'opts', role: 'group' });
    var btns = order.map(function (oi) {
      var b = h('button', { class: 'opt multi', type: 'button', role: 'checkbox', 'aria-checked': 'false' },
        h('span', { class: 'opt-l box', 'aria-hidden': 'true' }), h('span', { class: 'opt-t' }, inline(q.options[oi])));
      b.addEventListener('click', function () {
        if (list.classList.contains('locked')) return;
        var i = draft.v.indexOf(oi);
        if (i >= 0) draft.v.splice(i, 1); else draft.v.push(oi);
        paint(); onChange();
      });
      list.appendChild(b);
      return b;
    });
    function paint() {
      btns.forEach(function (b, pos) {
        var on = draft.v.indexOf(order[pos]) >= 0;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    paint();
    return {
      el: h('div', null, h('p', { class: 'hint-line', text: 'Można zaznaczyć kilka odpowiedzi.' }), list),
      get: function () { return draft.v.slice(); },
      ready: function () { return draft.v.length > 0; },
      lock: function (v) { list.classList.toggle('locked', !!v); }
    };
  }

  function widgetLines(q, draft, onChange) {
    if (!draft.v) draft.v = [];
    var ev = evidence(q, true);
    function paint() {
      ev.lineEls.forEach(function (ln, i) {
        if (q.selectable.indexOf(i) < 0) return;
        var on = draft.v.indexOf(i) >= 0;
        ln.classList.toggle('on', on); ln.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    function toggle(i) {
      if (ev.el.classList.contains('locked')) return;
      var k = draft.v.indexOf(i);
      if (k >= 0) draft.v.splice(k, 1); else draft.v.push(i);
      paint(); onChange();
    }
    ev.lineEls.forEach(function (ln, i) {
      if (q.selectable.indexOf(i) < 0) return;
      ln.addEventListener('click', function () { toggle(i); });
      ln.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(i); } });
    });
    paint();
    return {
      el: ev.el, ownsEvidence: true,
      get: function () { return draft.v.slice(); },
      ready: function () { return draft.v.length > 0; },
      lock: function (v) { ev.el.classList.toggle('locked', !!v); }
    };
  }

  function widgetOrder(q, draft, onChange) {
    if (!draft.v) draft.v = CM.engine.displayOrder(q).slice();
    var list = h('ol', { class: 'ord' });
    function move(pos, d) {
      if (list.classList.contains('locked')) return;
      var t = draft.v[pos]; draft.v[pos] = draft.v[pos + d]; draft.v[pos + d] = t;
      paint(); onChange();
    }
    function paint() {
      list.textContent = '';
      draft.v.forEach(function (it, pos) {
        var up = h('button', { type: 'button', class: 'mv', 'aria-label': 'Przesuń wyżej', disabled: pos === 0, text: '▲' });
        var dn = h('button', { type: 'button', class: 'mv', 'aria-label': 'Przesuń niżej', disabled: pos === draft.v.length - 1, text: '▼' });
        up.addEventListener('click', function () { move(pos, -1); });
        dn.addEventListener('click', function () { move(pos, 1); });
        list.appendChild(h('li', { class: 'ord-i' }, h('span', { class: 'ord-n', text: pos + 1 }), h('span', { class: 'ord-t' }, inline(q.items[it])), h('span', { class: 'ord-b' }, up, dn)));
      });
    }
    paint();
    return {
      el: h('div', null, h('p', { class: 'hint-line', text: 'Strzałkami proszę ustawić właściwą kolejność (pierwsze = najwcześniejsze).' }), list),
      get: function () { return draft.v.slice(); },
      ready: function () { return true; },
      lock: function (v) { list.classList.toggle('locked', !!v); }
    };
  }

  function widgetAssign(q, draft, onChange) {
    if (!draft.v) { draft.v = []; for (var i = 0; i < q.items.length; i++) draft.v.push(null); }
    var order = CM.engine.displayOrder(q);
    var list = h('div', { class: 'asg' });
    var rows = order.map(function (ii) {
      var row = h('div', { class: 'asg-row' }, h('div', { class: 'asg-t' }, inline(q.items[ii])));
      var ctl;
      if (q.buckets.length <= 3) {
        ctl = h('div', { class: 'seg', role: 'radiogroup' });
        q.buckets.forEach(function (bk, bi) {
          var b = h('button', { type: 'button', class: 'seg-b', role: 'radio', 'aria-checked': 'false', text: bk });
          b.addEventListener('click', function () {
            if (list.classList.contains('locked')) return;
            draft.v[ii] = bi; paint(); onChange();
          });
          ctl.appendChild(b);
        });
      } else {
        ctl = h('select', { class: 'pick', 'aria-label': q.items[ii] });
        ctl.appendChild(h('option', { value: '', text: 'wybierz…' }));
        q.buckets.forEach(function (bk, bi) { ctl.appendChild(h('option', { value: String(bi), text: bk })); });
        ctl.addEventListener('change', function () {
          if (list.classList.contains('locked')) { paint(); return; }
          draft.v[ii] = ctl.value === '' ? null : parseInt(ctl.value, 10); paint(); onChange();
        });
      }
      row.appendChild(ctl);
      list.appendChild(row);
      return { ii: ii, ctl: ctl, row: row };
    });
    function paint() {
      rows.forEach(function (r) {
        var v = draft.v[r.ii];
        if (r.ctl.tagName === 'SELECT') r.ctl.value = v === null ? '' : String(v);
        else Array.prototype.forEach.call(r.ctl.children, function (b, bi) {
          b.classList.toggle('on', bi === v); b.setAttribute('aria-checked', bi === v ? 'true' : 'false');
        });
        r.row.classList.toggle('done', v !== null);
      });
    }
    paint();
    return {
      el: list,
      get: function () { return draft.v.slice(); },
      ready: function () { return draft.v.every(function (x) { return x !== null; }); },
      lock: function (v) { list.classList.toggle('locked', !!v); rows.forEach(function (r) { if (r.ctl.tagName === 'SELECT') r.ctl.disabled = !!v; }); }
    };
  }

  function widget(q, draft, onChange) {
    switch (q.kind) {
      case 'choice': return widgetChoice(q, draft, onChange);
      case 'multi': return widgetMulti(q, draft, onChange);
      case 'lines': return widgetLines(q, draft, onChange);
      case 'order': return widgetOrder(q, draft, onChange);
      case 'assign': return widgetAssign(q, draft, onChange);
    }
    throw new Error('Nieznany rodzaj zadania: ' + q.kind);
  }

  /* ---------- różne ---------- */

  function qrSvg(text, cell) {
    var qr = root.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    var wrap = h('div', { class: 'qr', role: 'img', 'aria-label': 'Kod QR' });
    wrap.innerHTML = qr.createSvgTag({ cellSize: cell || 4, margin: 4, scalable: true });
    return wrap;
  }

  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* nic */ } }

  function toast(msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2800);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('Skopiowano'); }, function () { fallback(); });
    }
    return fallback();
    function fallback() {
      var ta = h('textarea', { style: { position: 'fixed', opacity: '0' } });
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Skopiowano'); } catch (e) { toast('Nie udało się skopiować'); }
      document.body.removeChild(ta);
      return Promise.resolve();
    }
  }

  function share(data) {
    if (navigator.share) return navigator.share(data).catch(function () { /* anulowano */ });
    return copyText(data.url || data.text || '');
  }

  /* Okno modalne z przyciskami; zwraca funkcję zamykającą. */
  function modal(title, body, buttons) {
    var back = h('div', { class: 'modal-back', role: 'presentation' });
    var box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h3', { text: title }), h('div', { class: 'modal-body' }, body),
      h('div', { class: 'modal-btns' }, (buttons || []).map(function (b) {
        return h('button', { type: 'button', class: 'btn ' + (b.cls || ''), text: b.label, onclick: function () { if (b.onclick) b.onclick(); if (b.close !== false) close(); } });
      })));
    back.appendChild(box);
    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    document.body.appendChild(back);
    var first = box.querySelector('button'); if (first) first.focus();
    return close;
  }

  CM.ui = {
    h: h, inline: inline, blocks: blocks, card: card, evidence: evidence, widget: widget,
    qrSvg: qrSvg, vibrate: vibrate, toast: toast, copyText: copyText, share: share, modal: modal
  };
}(typeof self !== 'undefined' ? self : this));
