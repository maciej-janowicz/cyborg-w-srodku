/* Test E2E: zespół 5 telefonów, pełne 45 minut na sztucznym zegarze. Uruchomienie: npm run e2e (serwer na :8099 lub E2E_URL). */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { /* dalej */ } }
const BASE = process.env.E2E_URL || 'http://localhost:8099';
const SHOTS = process.env.E2E_SHOTS || '/tmp/e2e';
const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
let fails = 0; const errs = [];
function ok(c, m) { if (!c) { fails++; console.log('✖', m); } else console.log('✔', m); }

const probe = await (await b.newContext()).newPage();
await probe.goto(BASE + '/index.html?nosync&nosw');
const info = await probe.evaluate(() => {
  const E = CM.engine, C = CM.content;
  const start = E.EPOCH + 60 * 24 * 365 * 60000; // dowolna minuta w przyszłości względem EPOCH
  return { start, code: E.encodeSession(start), acts: C.acts.map(a => a.durSec), prolog: C.prologSec, qs: C.acts.map(a => a.questions) };
});
const T0 = info.start - 30000;
const phones = [];
for (let pos = 0; pos < 5; pos++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('p' + pos + ': ' + e.message));
  await p.clock.install({ time: T0 });
  await p.goto(`${BASE}/index.html?nosync&nosw#j=${info.code}`);
  await p.fill('#code', info.code).catch(() => {});
  await p.click('button:text-is("Dołączam")');
  await p.waitForSelector('.chips');
  await p.click('.chip:nth-child(3)');
  await p.click('.seg-b:has-text("5")');
  await p.click(`.role:nth-child(${pos + 1})`);
  await p.click('text=Gotowe — wchodzę do gry');
  await p.waitForSelector('.game');
  phones.push(p);
}
ok(true, '5 telefonów dołączyło do sesji');
await phones[0].screenshot({ path: SHOTS + '/live-prolog.png' });

async function ff(sec) { await Promise.all(phones.map(p => p.clock.fastForward(sec * 1000))); }
let t = -30; // sekundy względem startu
async function goTo(sec) { await ff(sec - t); t = sec; }

async function solve(p, q) {
  if (q.kind === 'choice') {
    // opcje są mieszane — znajdź po zawartości przez stan szkicu: klikamy aż do trafienia po tekście
    const idx = await p.evaluate(({ q }) => { const d = CM.engine.displayOrder(q); return d.indexOf(q.correct); }, { q });
    await p.click(`#q-${q.id} .opt >> nth=${idx}`);
  } else if (q.kind === 'multi') {
    const ds = await p.evaluate(({ q }) => { const d = CM.engine.displayOrder(q); return q.correct.map(c => d.indexOf(c)); }, { q });
    for (const i of ds) await p.click(`#q-${q.id} .opt >> nth=${i}`);
  } else if (q.kind === 'lines') {
    const nth = await p.evaluate(({ q }) => q.correct.map(c => q.selectable.indexOf(c)), { q });
    for (const i of nth) await p.click(`#q-${q.id} .ln.sel >> nth=${i}`);
  } else if (q.kind === 'order') {
    for (let guard = 0; guard < 40; guard++) {
      const v = await p.evaluate(({ id }) => CM.app._view.drafts[id].v.slice(), { id: q.id });
      const pos = v.findIndex((x, i) => x !== i);
      if (pos < 0) break;
      const from = v.indexOf(pos);
      await p.click(`#q-${q.id} .ord-i >> nth=${from} >> button[aria-label="Przesuń wyżej"]`);
    }
  } else if (q.kind === 'assign') {
    const order = await p.evaluate(({ q }) => CM.engine.displayOrder(q), { q });
    for (let r = 0; r < order.length; r++) {
      const bi = q.correct[order[r]];
      const row = `#q-${q.id} .asg-row >> nth=${r}`;
      if (q.buckets.length <= 3) await p.click(`${row} >> .seg-b >> nth=${bi}`);
      else await p.selectOption(`${row} >> select`, String(bi));
    }
  }
  await p.click(`#q-${q.id} button:has-text("Sprawdzam")`);
}

let total = 0;
for (let a = 0; a < 6; a++) {
  const start = info.prolog + info.acts.slice(0, a).reduce((x, y) => x + y, 0);
  await goTo(start + 3);
  for (let pos = 0; pos < 5; pos++) {
    const p = phones[pos];
    await p.click('.tab:has-text("Śledztwo")');
    for (let j = pos; j < 5; j += 5) { await solve(p, info.qs[a][j]); }
  }
  if (a === 0) await phones[1].screenshot({ path: SHOTS + '/live-solved.png' });
  const cap = phones[0];
  await cap.click('.tab:has-text("Sejf")');
  const digits = await cap.evaluate((a) => CM.engine.safeDigits(CM.content, a), a);
  for (let j = 0; j < 5; j++) await cap.click(`.keypad .key >> text="${digits[j]}"`).catch(async () => { await cap.click(`.keypad .key:text-is("${digits[j]}")`); });
  if (a === 1) await cap.screenshot({ path: SHOTS + '/live-safe.png' });
  await cap.click('.key.go');
  const opened = await cap.evaluate((a) => CM.app._state().acts[a].safe.opened, a);
  ok(opened, 'akt ' + (a + 1) + ': sejf otwarty');
  total += await cap.evaluate((a) => CM.app._state().acts[a].safe.pts, a);
}
// finał
await goTo(info.prolog + info.acts.reduce((x, y) => x + y, 0) + 3);
const cap = phones[0];
await cap.screenshot({ path: SHOTS + '/live-accuse.png' });
const fin = await cap.evaluate(() => ({ c: CM.content.culprit, h: CM.content.finale.how.correct, f: CM.content.finale.fix.correct, s: CM.content.suspects.map(s => s.id) }));
await cap.click(`.card:has-text("Kto jest") .opt >> nth=${fin.s.indexOf(fin.c)}`);
await cap.click(`.card:has-text("Jak") .opt >> nth=${fin.h}`).catch(() => {});
await cap.evaluate((f) => { CM.app._view.acc.how = f.h; CM.app._view.acc.fix = f.f; }, fin);
await cap.evaluate(() => CM.app._view.acc.who = CM.content.culprit);
await cap.evaluate(() => document.querySelector('.tab.on').click());
await cap.click('text=Składam oskarżenie');
await cap.click('.modal .btn.primary');
const f = await cap.evaluate(() => CM.app._state().final);
ok(f.submitted && f.ok.who && f.ok.how && f.ok.fix, 'finał: oskarżenie trafne');
await goTo(info.prolog + info.acts.reduce((x, y) => x + y, 0) + 160);
await cap.click('.tab:has-text("Raport")');
await cap.screenshot({ path: SHOTS + '/live-report.png', fullPage: true });
const code = await cap.evaluate(() => CM.engine.encodeReport(CM.engine.buildReport(CM.app._state())));
const score = await cap.evaluate(() => CM.engine.totalScore(CM.app._state()));
ok(score > 1000, 'wynik zespołu ' + score + ' / 1250');

// panel prowadzącego
const hctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true });
const hp = await hctx.newPage();
hp.on('pageerror', e => errs.push('host: ' + e.message));
await hp.addInitScript(({ s, code }) => { localStorage.setItem('cm1:host:session', JSON.stringify({ code, startMs: s })); }, { s: info.start, code: info.code });
await hp.goto(`${BASE}/host.html?nosync#r=${code}`);
await hp.waitForSelector('.tbl');
const rowTxt = await hp.innerText('.tbl tbody');
ok(rowTxt.includes(String(score)), 'host: raport zespołu na tablicy (' + score + ')');
await hp.screenshot({ path: SHOTS + '/host.png', fullPage: true });
ok(errs.length === 0, 'brak błędów JS ' + JSON.stringify(errs));
await b.close();
console.log(fails ? '✖ BŁĘDY: ' + fails : '✔ E2E zaliczone');
process.exit(fails ? 1 : 0);
