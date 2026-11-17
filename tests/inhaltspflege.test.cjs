'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const BASE = '5a2e9d54898ab0cd59d385a3e8d21213c13050b5';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const baseline = (p) => execFileSync('git', ['show', `${BASE}:${p}`], { cwd: ROOT, encoding: 'utf8' });
const plain = (value) => JSON.parse(JSON.stringify(value));
function originalData() {
  const context = { window: {} };
  vm.runInNewContext(baseline('assets/js/inhalte.js'), context);
  return plain(context.window.ZWEIKLANG);
}

function node() {
  return {
    innerHTML: '', textContent: '', hidden: false, events: [],
    scrollWidth: 0, clientWidth: 0,
    addEventListener(name) { this.events.push(name); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute() {}, removeAttribute() {},
  };
}
function page(data = {}) {
  const selectors = ['[data-repertoire]', '[data-termine-kommend]', '[data-termine-vergangen]',
    '[data-termine-vergangen-box]', '[data-jahr]', '[data-videos]', '[data-galerie]', '[data-steckbriefe]', '[data-anfrage]'];
  const nodes = Object.fromEntries(selectors.map((s) => [s, node()]));
  const document = {
    currentScript: { src: 'https://example.test/zweiklang/assets/js/inhalt-laden.js?v=test' },
    documentElement: { classList: { contains: () => false, remove() {} } },
    querySelector: (s) => nodes[s] || null, querySelectorAll: () => [], addEventListener() {},
  };
  const context = vm.createContext({
    document, URL, AbortController, setTimeout, clearTimeout,
    window: { ZWEIKLANG: plain(data), matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} },
  });
  return { context, nodes };
}
function adapter(p, fetch) {
  assert.ok(fs.existsSync(path.join(ROOT, 'assets/js/inhalt-laden.js')), 'browser adapter missing');
  p.context.fetch = fetch;
  vm.runInContext(read('assets/js/inhalt-laden.js'), p.context);
  return p.context.window.ZWEIKLANG_BEREIT;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const jsonFetch = (data) => async (url) => ({ ok: true, json: async () => plain(data[new URL(url).pathname.split('/').pop().split('.')[0]]) });

// The fixture is the immutable Git baseline, not a second maintained content copy.
test('JSON is the single source for unchanged Termine and Repertoire', () => {
  const original = originalData();
  const context = { window: {} };
  vm.runInNewContext(read('assets/js/inhalte.js'), context);
  for (const key of ['termine', 'repertoire']) {
    assert.ok(fs.existsSync(path.join(ROOT, `content/${key}.json`)), `${key}: JSON missing`);
    assert.deepEqual(JSON.parse(read(`content/${key}.json`)), original[key]);
    assert.equal(Object.hasOwn(context.window.ZWEIKLANG, key), false, `${key}: duplicate data`);
    delete original[key];
  }
  assert.deepEqual(plain(context.window.ZWEIKLANG), original, 'Other content must not change');
});

test('adapter loads both JSON files relative to its script; main waits and preserves baseline output', async () => {
  const original = originalData();
  const expected = page(original);
  vm.runInContext(baseline('assets/js/main.js'), expected.context);
  const p = page();
  vm.runInContext(read('assets/js/inhalte.js'), p.context);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const calls = [];
  const ready = adapter(p, async (url, options) => {
    calls.push([String(url), options]);
    await gate;
    return jsonFetch(original)(url);
  });
  assert.equal(typeof ready?.then, 'function');
  vm.runInContext(read('assets/js/main.js'), p.context);
  await tick();
  assert.equal(p.nodes['[data-repertoire]'].innerHTML, '', 'main must wait');
  assert.equal(p.nodes['[data-jahr]'].textContent, '');
  release();
  await ready;
  await tick();
  assert.deepEqual(calls.map(([url]) => url).sort(), [
    'https://example.test/zweiklang/content/repertoire.json',
    'https://example.test/zweiklang/content/termine.json',
  ]);
  for (const [selector, el] of Object.entries(expected.nodes)) {
    assert.equal(p.nodes[selector].innerHTML, el.innerHTML, selector);
    assert.equal(p.nodes[selector].textContent, el.textContent, selector);
    assert.equal(p.nodes[selector].hidden, el.hidden, selector);
    assert.deepEqual(p.nodes[selector].events, el.events, selector);
  }
});

test('transport failures resolve readiness, show an honest section error and keep other features alive', async (t) => {
  for (const [name, failure] of Object.entries({
    http: async () => ({ ok: false, status: 404, json: async () => [] }),
    network: async () => { throw new Error('offline'); },
    json: async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } }),
  })) {
    await t.test(name, async () => {
      const original = originalData();
      const p = page(original);
      delete p.context.window.ZWEIKLANG.termine;
      delete p.context.window.ZWEIKLANG.repertoire;
      await assert.doesNotReject(async () => await adapter(p, (url) => String(url).endsWith('/termine.json')
        ? failure() : jsonFetch(original)(url)));
      vm.runInContext(read('assets/js/main.js'), p.context);
      await tick();
      assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, 'termine'), false);
      assert.match(p.nodes['[data-termine-kommend]'].innerHTML, /Termine konnten nicht geladen werden/);
      assert.doesNotMatch(p.nodes['[data-termine-kommend]'].innerHTML, /Neue Auftritte sind in Planung/);
      assert.equal(p.nodes['[data-termine-vergangen-box]'].hidden, true);
      assert.match(p.nodes['[data-repertoire]'].innerHTML, /Gefühlvolle Balladen/);
      assert.match(p.nodes['[data-videos]'].innerHTML, /video__knopf/);
      assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
      assert.notEqual(p.nodes['[data-jahr]'].textContent, '');
    });
  }
});

test('Repertoire failure is isolated; successful empty lists retain the existing empty-list output', async () => {
  const p = page(originalData());
  delete p.context.window.ZWEIKLANG.termine;
  delete p.context.window.ZWEIKLANG.repertoire;
  await adapter(p, async (url) => String(url).endsWith('/repertoire.json')
    ? { ok: false, status: 500 } : { ok: true, json: async () => [] });
  vm.runInContext(read('assets/js/main.js'), p.context);
  await tick();
  assert.match(p.nodes['[data-repertoire]'].textContent, /Repertoire konnte nicht geladen werden/);
  assert.match(p.nodes['[data-termine-kommend]'].innerHTML, /Neue Auftritte sind in Planung/);
  const empty = page();
  await adapter(empty, jsonFetch({ termine: [], repertoire: [] }));
  vm.runInContext(read('assets/js/main.js'), empty.context);
  await tick();
  assert.equal(empty.nodes['[data-repertoire]'].innerHTML, '');
  assert.equal(empty.nodes['[data-repertoire]'].textContent, '');
  assert.match(empty.nodes['[data-termine-kommend]'].innerHTML, /Neue Auftritte sind in Planung/);
});

test('validates calendar dates, optional times and absolute safe URLs', async (t) => {
  const valid = { datum: '2028-02-29', titel: 'Test', ort: 'Ort' };
  for (const [label, change] of Object.entries({
    impossibleDay: { datum: '2027-02-29' }, april: { datum: '2026-04-31' },
    month: { datum: '2026-13-01' }, format: { datum: '2026-1-01' }, zeroYear: { datum: '0000-01-01' },
    missingTitle: { titel: '' }, wrongPlace: { ort: null },
    invalidHour: { uhrzeit: '24:00' }, invalidMinute: { uhrzeit: '19:60' }, wrongTime: { uhrzeit: 1900 },
    shortTime: { uhrzeit: '9:00' }, javascript: { link: 'javascript:alert(1)' },
    dataURL: { link: 'data:text/html,test' }, relativeURL: { link: '/test' },
    credentials: { link: 'https://user:pass@example.org/' }, malformedURL: { link: 'https://' },
    obfuscated: { link: 'https://example.org/\nfoo' },
  })) await t.test(label, async () => {
    const p = page();
    await adapter(p, jsonFetch({ termine: [{ ...valid, ...change }], repertoire: [] }));
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, 'termine'), false, label);
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.repertoire), []);
  });
  for (const fields of [{}, { uhrzeit: '', link: '' }, { uhrzeit: '00:00', link: 'http://example.org/' },
    { uhrzeit: '23:59', link: 'https://example.org/event?q=1#x' }]) {
    const p = page();
    const termine = [{ ...valid, ...fields }];
    await adapter(p, jsonFetch({ termine, repertoire: [] }));
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.termine), termine);
  }
});

test('invalid Repertoire shape rejects the whole section, not its valid neighbours', async (t) => {
  for (const [label, repertoire] of Object.entries({
    object: {}, null: null, nullEntry: [null], noName: [{ text: 'Text', songs: [] }],
    emptyName: [{ name: ' ', text: 'Text', songs: [] }], wrongText: [{ name: 'Name', text: 3, songs: [] }],
    wrongSongs: [{ name: 'Name', text: 'Text', songs: 'Song' }],
    wrongSong: [{ name: 'Name', text: 'Text', songs: [42] }],
    emptySong: [{ name: 'Name', text: 'Text', songs: [' '] }],
  })) await t.test(label, async () => {
    const p = page();
    await adapter(p, jsonFetch({ termine: [], repertoire }));
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, 'repertoire'), false);
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.termine), []);
  });
  const p = page();
  const repertoire = [{ name: 'Name', text: 'Text', songs: ['Song – Interpret'] }];
  await adapter(p, jsonFetch({ termine: [], repertoire }));
  assert.deepEqual(plain(p.context.window.ZWEIKLANG.repertoire), repertoire);
});

test('timeout bounds fetch AND response parsing; late results cannot overwrite failure', async (t) => {
  for (const phase of ['fetch', 'json']) await t.test(phase, async () => {
    const p = page(originalData());
    let expire, release, signal;
    const gate = new Promise((resolve) => { release = resolve; });
    const timers = new Map();
    let timerID = 0;
    p.context.setTimeout = (callback, ms) => { assert.ok(ms > 0 && ms <= 5000); timers.set(++timerID, callback); return timerID; };
    p.context.clearTimeout = (id) => timers.delete(id);
    const ready = adapter(p, async (url, options) => {
      if (String(url).endsWith('/repertoire.json')) return { ok: true, json: async () => [] };
      signal = options.signal;
      if (phase === 'fetch') await gate;
      return { ok: true, json: async () => { if (phase === 'json') await gate; return []; } };
    });
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    expire = timers.values().next().value;
    assert.equal(typeof expire, 'function', 'bounded timer missing');
    expire();
    await ready;
    await tick();
    assert.equal(signal.aborted, true);
    assert.match(p.nodes['[data-termine-kommend]'].innerHTML, /Termine konnten nicht geladen werden/);
    assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
    release();
    await tick();
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, 'termine'), false);
  });
});

test('index loads the adapter before main without changing page markup', () => {
  const html = read('index.html');
  assert.match(html, /<script src="assets\/js\/inhalt-laden\.js\?v=[^"]+" defer><\/script>/);
  assert.ok(html.indexOf('assets/js/inhalt-laden.js') < html.indexOf('assets/js/main.js'));
  const markup = (s) => s.replace(/^[ \t]*<script src="assets\/js\/[^\n]+\n/gm, '');
  assert.equal(markup(html), markup(baseline('index.html')));
});
