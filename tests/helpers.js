'use strict';
/* Pomocnik testów: poprawna odpowiedź w formacie, który przyjmuje evaluate(). */
function canon(q) {
  switch (q.kind) {
    case 'choice': return q.correct;
    case 'multi': case 'lines': return q.correct.slice();
    case 'order': return q.items.map(function (_, i) { return i; });
    case 'assign': return q.correct.slice();
  }
  throw new Error('nieznany rodzaj pytania: ' + q.kind);
}
/* Celowo błędna odpowiedź. */
function wrong(q) {
  switch (q.kind) {
    case 'choice': return (q.correct + 1) % q.options.length;
    case 'multi': return q.correct.length > 1 ? q.correct.slice(1) : q.options.map(function (_, i) { return i; });
    case 'lines': return q.correct.length > 1 ? q.correct.slice(1) : q.selectable.filter(function (i) { return q.correct.indexOf(i) < 0; }).slice(0, 1);
    case 'order': { var a = q.items.map(function (_, i) { return i; }); a.reverse(); return a; }
    case 'assign': return q.correct.map(function (b) { return (b + 1) % q.buckets.length; });
  }
}
module.exports = { canon: canon, wrong: wrong };
