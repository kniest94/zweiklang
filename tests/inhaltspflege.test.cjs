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
const sections = ['termine', 'repertoire', 'galerie', 'videos', 'videogruppen', 'steckbriefe', 'hoerproben', 'kontakt'];
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
    '[data-termine-vergangen-box]', '[data-jahr]', '[data-videos]', '[data-video-filter]', '[data-galerie]', '[data-steckbriefe]', '[data-anfrage]'];
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
test('immutable historical migration is separate from current editorial data', () => {
  const original = originalData();
  const context = { window: {} };
  vm.runInNewContext(read('assets/js/inhalte.js'), context);
  for (const key of sections) {
    assert.ok(fs.existsSync(path.join(ROOT, `content/${key}.json`)), `${key}: JSON missing`);
    if (['termine', 'repertoire'].includes(key)) {
      const migrated = execFileSync('git', ['show', `bb0851b01e4f8dd50a7ba3660cc78e15f29b190a:content/${key}.json`], { cwd: ROOT, encoding: 'utf8' });
      assert.deepEqual(JSON.parse(migrated), original[key]);
    }
    assert.equal(Object.hasOwn(context.window.ZWEIKLANG, key), false, `${key}: duplicate data`);
    delete original[key];
  }
  assert.deepEqual(plain(context.window.ZWEIKLANG), original, 'Other content must not change');
});

test('current editorial JSON is validated without requiring historical content', async () => {
  const p = page();
  const current = Object.fromEntries(sections.map((name) => [name, JSON.parse(read(`content/${name}.json`))]));
  if (process.env.PRUEFE_GALERIE_MIGRATION === '1') {
    assert.deepEqual(current.galerie, originalData().galerie, 'Initial gallery migration must preserve data and order');
  }
  await adapter(p, jsonFetch(current));
  for (const name of Object.keys(current)) assert.deepEqual(plain(p.context.window.ZWEIKLANG[name]), current[name], name);
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
  assert.deepEqual(calls.map(([url]) => url).sort(), [...sections, 'seite'].map((s) => `https://example.test/zweiklang/content/${s}.json`).sort());
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
      if (!String(url).endsWith('/termine.json')) return { ok: true, json: async () => [] };
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

test('gallery supports one image, safe paths and mandatory alt text', async (t) => {
  const image = { gross: 'assets/img/galerie/neues-foto.webp', alt: 'Beschreibung' };
  for (const klein of [undefined, '', 'assets/img/galerie/klein.jpg']) {
    const p = page(originalData());
    const galerie = [{ ...image, ...(klein === undefined ? {} : { klein }) }];
    await adapter(p, jsonFetch({ termine: [], repertoire: [], galerie }));
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.galerie), galerie);
    assert.ok(p.nodes['[data-galerie]'].innerHTML.includes(`src="${klein || image.gross}"`));
  }
  for (const [label, change] of Object.entries({
    traversal: { gross: 'assets/img/../secret.webp' }, encoded: { gross: 'assets/img/%2e%2e/x.webp' },
    root: { gross: '/assets/img/x.webp' }, remote: { gross: 'https://example.org/x.webp' },
    script: { gross: 'javascript:alert(1)' }, svg: { gross: 'assets/img/x.svg' },
    backslash: { gross: 'assets/img/..\\x.webp' }, missingAlt: { alt: '' },
    invalidSmall: { klein: 'https://example.org/x.webp' }, missingImage: { gross: '' },
  })) await t.test(label, async () => {
    const p = page(originalData());
    await adapter(p, jsonFetch({ termine: [], repertoire: [], galerie: [{ ...image, ...change }] }));
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, 'galerie'), false);
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    assert.match(p.nodes['[data-galerie]'].textContent, /Galerie konnte nicht geladen werden/);
    assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
  });
});

test('gallery renderer exception cannot stop following sections or contact form', async () => {
  const p = page(originalData());
  let first = true;
  Object.defineProperty(p.nodes['[data-galerie]'], 'innerHTML', {
    get: () => '', set() { if (first) { first = false; throw new Error('render failure'); } },
  });
  await adapter(p, jsonFetch(originalData()));
  vm.runInContext(read('assets/js/main.js'), p.context);
  await tick();
  assert.match(p.nodes['[data-galerie]'].textContent, /Galerie konnte nicht geladen werden/);
  assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
  assert.match(p.nodes['[data-repertoire]'].innerHTML, /Gefühlvolle Balladen/);
});

test('Pages CMS gallery form uses documented image media source, required alt and optional thumbnail', () => {
  const config = read('.pages.yml');
  assert.match(config, /media:\s*\n\s*- name: galeriebilder/);
  assert.match(config, /input: assets\/img\/galerie/);
  assert.match(config, /output: assets\/img\/galerie/);
  const gallery = config.split('  - name: galerie\n')[1];
  assert.ok(gallery, 'Gallery form missing');
  assert.match(gallery, /path: content\/galerie.json/);
  assert.match(gallery, /name: gross[\s\S]*?type: image[\s\S]*?required: true/);
  assert.match(gallery, /name: klein[\s\S]*?type: image[\s\S]*?required: false/);
  assert.match(gallery, /name: alt[\s\S]*?required: true/);
  assert.match(gallery, /media: galeriebilder/);
});

test('all remaining dynamic sections load independently and reject unsafe input', async (t) => {
  const data = originalData();
  const cases = [
    ['videos', [{ ...data.videos[0], datei: 'https://example.org/x.mp4' }]],
    ['videos', [{ ...data.videos[0], datei: 'assets/video/../x.mp4' }]],
    ['videos', [{ ...data.videos[0], typ: 'youtube' }]],
    ['videos', [{ ...data.videos[0], poster: 'javascript:alert(1)' }]],
    ['videos', [{ ...data.videos[0], dauer: '1:99' }]],
    ['videos', [{ gruppe: 'duo', typ: 'instagram', titel: 'Test', link: 'https://evil.test/reel/1/' }]],
    ['videos', [{ gruppe: 'duo', typ: 'instagram', titel: 'Test', link: 'javascript:alert(1)' }]],
    ['videos', [{ ...data.videos[0], gruppe: 'missing' }]],
    ['videogruppen', [{ id: 'duo', name: 'A' }, { id: 'duo', name: 'B' }]],
    ['videogruppen', [{ id: '../x', name: 'A' }]],
    ['steckbriefe', [{ name: 'Person', bild: 'assets/img/x.webp', alt: '' }]],
    ['steckbriefe', [{ name: '', alt: 'Text' }]],
    ['steckbriefe', [{ name: 'Person', bild: '/assets/img/x.webp', alt: 'Text' }]],
    ['hoerproben', [{ titel: 'Audio', datei: 'assets/audio/../x.mp3' }]],
    ['hoerproben', [{ titel: 'Audio', datei: 'https://example.org/x.mp3' }]],
    ['kontakt', { ...data.kontakt, mail: 'a@example.org?subject=injected' }],
    ['kontakt', { ...data.kontakt, telefonLink: 'javascript:alert(1)' }],
    ['kontakt', { ...data.kontakt, whatsapp: '12?text=inject' }],
    ['kontakt', { ...data.kontakt, instagram: '../evil' }],
  ];
  for (const [i, [section, invalid]] of cases.entries()) await t.test(`${section}-${i}`, async () => {
    const p = page();
    await adapter(p, jsonFetch({ ...data, [section]: invalid }));
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, section), false);
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.termine), data.termine);
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.repertoire), data.repertoire);
  });
  const p = page();
  const valid = { ...data,
    steckbriefe: [{ name: 'Ohne Bild' }],
    videos: [{ gruppe: 'duo', typ: 'mp4', titel: 'Ohne Poster', datei: 'assets/video/test.mp4' },
      { gruppe: 'duo', typ: 'instagram', titel: 'Reel', link: 'https://www.instagram.com/reel/123/' }],
    hoerproben: [{ titel: 'Hörprobe', datei: 'assets/audio/test.mp3' }],
  };
  await adapter(p, jsonFetch(valid));
  for (const key of sections) assert.deepEqual(plain(p.context.window.ZWEIKLANG[key]), valid[key], key);
});

test('load failure in each new section leaves other renderers and form usable', async (t) => {
  for (const section of ['videos', 'videogruppen', 'steckbriefe', 'hoerproben', 'kontakt']) await t.test(section, async () => {
    const data = originalData();
    const p = page(data);
    const audio = node(), list = node();
    audio.hidden = true;
    audio.querySelector = () => list;
    p.nodes['[data-hoerproben]'] = audio;
    const contact = node();
    p.nodes['[data-kontakt-status]'] = contact;
    await adapter(p, (url) => String(url).endsWith(`/${section}.json`)
      ? Promise.resolve({ ok: false }) : jsonFetch(data)(url));
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    const selectors = { videos: '[data-videos]', videogruppen: '[data-video-filter]', steckbriefe: '[data-steckbriefe]', hoerproben: '[data-hoerproben-liste]', kontakt: '[data-kontakt-status]' };
    const target = section === 'hoerproben' ? list : p.nodes[selectors[section]];
    assert.match(target.textContent, /konnt.*nicht geladen werden/i, section);
    assert.match(p.nodes['[data-repertoire]'].innerHTML, /Gefühlvolle Balladen/);
    assert.notEqual(p.nodes['[data-jahr]'].textContent, '');
    assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
    if (section === 'videogruppen') assert.match(p.nodes['[data-videos]'].innerHTML, /video__knopf/);
  });
});

test('render exceptions are isolated for all content sections', async (t) => {
  for (const selector of ['[data-videos]', '[data-steckbriefe]', '[data-repertoire]', '[data-termine-kommend]']) await t.test(selector, async () => {
    const p = page(originalData());
    let once = true;
    Object.defineProperty(p.nodes[selector], 'innerHTML', { get: () => '', set() { if (once) { once = false; throw new Error('render failed'); } } });
    await adapter(p, jsonFetch(originalData()));
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    assert.match(p.nodes[selector].textContent, /konnt.*nicht geladen werden/i);
    assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
    assert.notEqual(p.nodes['[data-jahr]'].textContent, '');
  });
});

test('CMS provides all eight forms and image, MP4 and audio sources without workflows', () => {
  const config = read('.pages.yml');
  for (const section of sections) assert.ok(config.includes(`path: content/${section}.json`), section);
  for (const extension of ['mp4', 'mp3']) assert.ok(config.includes(extension));
  for (const field of ['gruppe', 'typ', 'datei', 'poster', 'titel', 'dauer', 'bild', 'telefonLink', 'whatsapp', 'instagram']) {
    assert.ok(config.includes(`name: ${field}\n`), field);
  }
  assert.doesNotMatch(config, /workflow:|actions:/);
});

test('central contact updates visible links, hero query, Instagram and JSON-LD; failure retains HTML', async () => {
  for (const failed of [false, true]) {
    const data = originalData();
    data.kontakt = { mail: 'neu@example.org', telefonAnzeige: '0123 456789', telefonLink: '+49123****89', whatsapp: '49123456789', instagram: 'neues_duo' };
    const p = page();
    const link = (href, text = '') => ({ ...node(), href, textContent: text,
      getAttribute(key) { return this[key]; }, setAttribute(key, value) { this[key] = value; },
      matches(selector) { return selector === '.kontakt__wert' && !!text; } });
    const mail = link('mailto:alt@example.org', 'alt@example.org');
    const phone = link('tel:+49****00', 'Alt');
    const call = link('tel:+49****00');
    const insta = link('https://www.instagram.com/alt/', '@alt');
    const social = link('https://www.instagram.com/alt/');
    const hero = link('https://wa.me/491111111?text=Hallo%20Welt');
    const wa = link('https://wa.me/491111111');
    const seo = { ...node(), textContent: JSON.stringify({ '@type': 'MusicGroup', email: 'alt@example.org', telephone: '+49****00', sameAs: [insta.href], name: 'Zweiklang' }) };
    const groups = { 'a[href^="mailto:"]': [mail], 'a[href^="tel:"]': [phone, call],
      'a[href^="https://wa.me/"]': [hero, wa], 'a[href^="https://www.instagram.com/"]': [insta, social],
      'script[type="application/ld+json"]': [seo] };
    p.context.document.querySelectorAll = (s) => groups[s] || [];
    const oldQuery = p.context.document.querySelector;
    p.context.document.querySelector = (s) => groups[s]?.[0] || oldQuery(s);
    p.nodes['[data-kontakt-status]'] = node();
    const handlers = {};
    p.nodes['[data-anfrage]'].addEventListener = (type, fn) => { handlers[type] = fn; };
    await adapter(p, (url) => failed && String(url).endsWith('/kontakt.json') ? Promise.resolve({ ok: false }) : jsonFetch(data)(url));
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    if (failed) {
      assert.equal(mail.href, 'mailto:alt@example.org');
      assert.equal(hero.href, 'https://wa.me/491111111?text=Hallo%20Welt');
      assert.equal(JSON.parse(seo.textContent).email, 'alt@example.org');
      assert.match(p.nodes['[data-kontakt-status]'].textContent, /nicht geladen/);
      // No FormData or window.open is available: an unavailable contact must exit first.
      assert.doesNotThrow(() => handlers.click({ target: { closest: () => ({ dataset: { senden: 'whatsapp' } }) } }));
    } else {
      assert.equal(mail.href, 'mailto:neu@example.org');
      assert.equal(mail.textContent, 'neu@example.org');
      assert.equal(phone.href, `tel:${data.kontakt.telefonLink}`);
      assert.equal(call.href, phone.href);
      assert.equal(phone.textContent, data.kontakt.telefonAnzeige);
      assert.equal(hero.href, 'https://wa.me/49123456789?text=Hallo%20Welt');
      assert.equal(wa.href, 'https://wa.me/49123456789');
      assert.equal(insta.textContent, '@neues_duo');
      assert.equal(social.href, 'https://www.instagram.com/neues_duo/');
      assert.deepEqual(JSON.parse(seo.textContent), { '@type': 'MusicGroup', name: 'Zweiklang', email: data.kontakt.mail, telephone: data.kontakt.telefonLink, sameAs: [social.href] });
    }
  }
});

test('each added section bounds fetch and JSON parsing, ignoring late success', async (t) => {
  for (const section of sections.slice(3)) for (const phase of ['fetch', 'json']) await t.test(`${section}-${phase}`, async () => {
    const data = originalData(), p = page(data);
    const timers = new Map();
    let id = 0, signal, release;
    const gate = new Promise((resolve) => { release = resolve; });
    p.context.setTimeout = (fn) => { timers.set(++id, fn); return id; };
    p.context.clearTimeout = (n) => timers.delete(n);
    const ready = adapter(p, async (url, options) => {
      if (!String(url).endsWith(`/${section}.json`)) return jsonFetch(data)(url);
      signal = options.signal;
      if (phase === 'fetch') await gate;
      return { ok: true, json: async () => { if (phase === 'json') await gate; return data[section]; } };
    });
    await tick();
    assert.equal(timers.size, 1);
    timers.values().next().value();
    await ready;
    assert.equal(signal.aborted, true);
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, section), false);
    assert.deepEqual(plain(p.context.window.ZWEIKLANG.termine), data.termine);
    release();
    await tick();
    assert.equal(Object.hasOwn(p.context.window.ZWEIKLANG, section), false);
  });
});

test('audio, video filter and contact rendering exceptions remain visible and isolated', async (t) => {
  for (const section of ['audio', 'filter', 'contact']) await t.test(section, async () => {
    const data = originalData();
    data.hoerproben = [{ titel: 'Test', datei: 'assets/audio/test.mp3' }];
    const p = page(), audio = node(), list = node(), status = node();
    audio.hidden = true;
    audio.querySelector = () => list;
    p.nodes['[data-hoerproben]'] = audio;
    p.nodes['[data-kontakt-status]'] = status;
    const target = section === 'audio' ? list : section === 'filter' ? p.nodes['[data-video-filter]'] : node();
    let once = true;
    if (section === 'contact') {
      p.context.document.querySelectorAll = (s) => s === 'a[href^="mailto:"]' ? [{ setAttribute() { throw new Error('contact render'); } }] : [];
    } else Object.defineProperty(target, 'innerHTML', { get: () => '', set() { if (once) { once = false; throw new Error('render'); } } });
    await adapter(p, jsonFetch(data));
    vm.runInContext(read('assets/js/main.js'), p.context);
    await tick();
    assert.match((section === 'contact' ? status : target).textContent, /nicht geladen werden/);
    if (section === 'audio') assert.equal(audio.hidden, false);
    if (section === 'filter') assert.match(p.nodes['[data-videos]'].innerHTML, /video__knopf/);
    assert.ok(p.nodes['[data-anfrage]'].events.includes('click'));
    assert.notEqual(p.nodes['[data-jahr]'].textContent, '');
  });
});

test('CMS media declarations use random upload names, relative paths and constrained field formats', () => {
  const config = read('.pages.yml');
  const media = config.split('\ncontent:')[0];
  assert.equal((media.match(/rename: random/g) || []).length, 4);
  assert.doesNotMatch(media, /(?:input|output): \//);
  for (const folder of ['assets/img', 'assets/img/galerie', 'assets/video', 'assets/audio']) {
    assert.ok(media.includes(`input: ${folder}\n`));
    assert.ok(media.includes(`output: ${folder}\n`));
  }
  const videos = config.split('  - name: videos\n')[1].split('  - name: videogruppen\n')[0];
  assert.match(videos, /name: datei[\s\S]*?type: file[\s\S]*?media: videomedien\n\s+extensions: \[mp4\]/);
  assert.match(videos, /name: poster[\s\S]*?type: image[\s\S]*?extensions: \[jpg, jpeg, png, webp\]/);
});

test('index loads the adapter before main without changing page markup', () => {
  const html = read('index.html');
  assert.match(html, /<script src="assets\/js\/inhalt-laden\.js\?v=[^"]+" defer><\/script>/);
  assert.ok(html.indexOf('assets/js/inhalt-laden.js') < html.indexOf('assets/js/main.js'));
  const markup = (s) => s.replace(/^[ \t]*<script src="assets\/js\/[^\n]+\n/gm, '');
  assert.equal(markup(html), markup(baseline('index.html')));
});
