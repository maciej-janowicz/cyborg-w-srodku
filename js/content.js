/* Cyborg w Środku — złożenie całej treści gry z plików js/content/*.js */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./content/core.js'), [
      require('./content/act1.js'), require('./content/act2.js'), require('./content/act3.js'),
      require('./content/act4.js'), require('./content/act5.js'), require('./content/act6.js')
    ]);
  } else {
    var CM = root.CM = root.CM || {};
    var acts = [];
    for (var i = 1; i <= 6; i++) acts.push((CM.actData || {})[i]);
    CM.content = factory(CM.core, acts);
  }
}(typeof self !== 'undefined' ? self : this, function (core, acts) {
  'use strict';
  var c = {};
  for (var k in core) if (Object.prototype.hasOwnProperty.call(core, k)) c[k] = core[k];
  c.acts = acts;
  c.slots = 5; /* liczba ogniw (zadań) w każdym akcie */
  return c;
}));
