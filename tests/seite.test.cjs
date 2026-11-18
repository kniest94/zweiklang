'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const tick = () => new Promise((r) => setImmediate(r));
function setup() {
  const text = { nodeType: 3, nodeValue: '\n  Originaltext  \n' };
  const svg = { nodeType: 1, tagName: 'svg' };
  const heading = { childNodes: [text, svg] };
  const image = { attrs: { src: 'assets/img/original.webp' }, setAttribute(k, v) { this.attrs[k] = v; } };
  const clip = { ...image, attrs: {}, dataset: {}, addEventListener() {} };
  const map = { '.hero__slogan': heading, '.hero__notiz': heading, '.hero__foto img': image, '.hero__clip': clip };
  const document = {
    currentScript: { src: 'https://example.test/project/assets/js/inhalt-laden.js' },
    documentElement: { classList: { contains: () => false, remove() {} } },
    querySelector: (s) => map[s] || null, querySelectorAll: () => [], addEventListener() {},
  };
  const context = vm.createContext({ document, URL, AbortController, setTimeout, clearTimeout,
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {} } });
  return { context, heading, text, svg, image, clip };
}
async function load(p, seite, failure) {
  p.context.fetch = async (url) => {
    if (String(url).endsWith('/seite.json')) {
      if (failure) return failure();
      return { ok: true, json: async () => seite };
    }
    const name = new URL(url).pathname.split('/').pop();
    return { ok: true, json: async () => JSON.parse(read(`content/${name}`)) };
  };
  vm.runInContext(read('assets/js/inhalt-laden.js'), p.context);
  await p.context.window.ZWEIKLANG_BEREIT;
  vm.runInContext(read('assets/js/main.js'), p.context);
  await tick();
}
test('page content loads relative to script and edits text nodes without removing SVG or whitespace', async () => {
  const data = JSON.parse(read('content/seite.json'));
  const p = setup();
  data.texte.heroSlogan = 'Neuer Slogan <kein HTML>';
  data.texte.heroNotiz = 'Neue Notiz';
  data.hero.foto = 'assets/img/neues-foto.jpg';
  await load(p, data);
  assert.equal(p.context.window.ZWEIKLANG.seite.texte.heroSlogan, data.texte.heroSlogan);
  assert.equal(p.text.nodeValue, '\n  Neue Notiz  \n');
  assert.equal(p.heading.childNodes[1], p.svg);
  assert.equal(p.image.attrs.src, data.hero.foto);
  assert.equal(p.image.attrs.alt, data.hero.alt);
  assert.equal(p.clip.dataset.video, data.hero.video);
  assert.equal(p.clip.dataset.poster, data.hero.videoPoster);
});
test('page load, JSON and validation errors retain original text and media', async (t) => {
  const valid = JSON.parse(read('content/seite.json'));
  const cases = [
    ['http', valid, () => ({ ok: false })],
    ['network', valid, () => { throw new Error('offline'); }],
    ['json', valid, () => ({ ok: true, json() { throw new SyntaxError('json'); } })],
    ['empty', { ...valid, texte: {} }],
    ['unsafePhoto', { ...valid, hero: { ...valid.hero, foto: '../x.jpg' } }],
    ['unsafeClip', { ...valid, hero: { ...valid.hero, video: 'https://evil.test/a.mp4' } }],
    ['unsafePoster', { ...valid, hero: { ...valid.hero, poster: 'assets/video/../x.webp' } }],
    ['unsafeTerminfoto', { ...valid, terminbild: { ...valid.terminbild, datei: '/assets/img/x.jpg' } }],
  ];
  for (const [name, data, failure] of cases) await t.test(name, async () => {
    const p = setup();
    await load(p, data, failure);
    assert.equal(p.context.window.ZWEIKLANG.seite, undefined);
    assert.equal(p.text.nodeValue, '\n  Originaltext  \n');
    assert.equal(p.image.attrs.src, 'assets/img/original.webp');
    assert.ok(p.context.window.ZWEIKLANG.videos.length);
  });
});
test('every migrated page text matches actual HTML exactly and every target preserves its children', () => {
  const { execFileSync } = require('node:child_process');
  const tree = JSON.parse(execFileSync('python3', [path.join(__dirname, 'html-fixture.py')], { input: read('index.html'), encoding: 'utf8' }));
  const elements = [];
  function walk(el, parent) {
    Object.defineProperty(el, 'parent', { value: parent });
    if (el.nodeType === 1) elements.push(el);
    el.setAttribute = function (key, value) { this.attrs[key] = value; };
    Object.defineProperty(el, 'dataset', { value: {} });
    (el.childNodes || []).forEach((n) => walk(n, el));
  }
  walk(tree, null);
  function matches(el, selector) {
    if (!el || el.nodeType !== 1) return false;
    const nth = selector.match(/:(?:nth-child\((\d+)\)|first-child)/);
    if (nth) {
      const siblings = el.parent.childNodes.filter((n) => n.nodeType === 1);
      if (siblings.indexOf(el) + 1 !== Number(nth[1] || 1)) return false;
      selector = selector.replace(nth[0], '');
    }
    const attr = selector.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
    if (attr) {
      if (!(attr[1] in el.attrs) || (attr[2] !== undefined && el.attrs[attr[1]] !== attr[2])) return false;
      selector = selector.replace(attr[0], '');
    }
    const id = selector.match(/#([\w-]+)/);
    if (id && el.attrs.id !== id[1]) return false;
    const cls = selector.match(/\.([\w-]+)/);
    if (cls && !(el.attrs.class || '').split(' ').includes(cls[1])) return false;
    const tag = selector.match(/^[\w-]+/);
    return !tag || tag[0] === el.tag;
  }
  const query = (selector) => {
    const tokens = selector.replace(/ > /g, ' > ').split(' ');
    return elements.find((el) => {
      let index = tokens.length - 1, current = el;
      if (!matches(current, tokens[index--])) return false;
      while (index >= 0) {
        const direct = tokens[index] === '>';
        if (direct) index--;
        current = current.parent;
        if (!direct) while (current && !matches(current, tokens[index])) current = current.parent;
        if (!matches(current, tokens[index--])) return false;
      }
      return true;
    });
  };
  const source = read('assets/js/main.js');
  const block = source.slice(source.indexOf('  if (D.seite) {'), source.indexOf('  const fehler ='));
  const fields = vm.runInNewContext(`(${block.match(/const felder = (\{[\s\S]*?\n    \});/)[1]})`);
  const data = JSON.parse(read('content/seite.json'));
  for (const [key, selector] of Object.entries(fields)) {
    const el = query(selector);
    assert.ok(el, `${key}: selector ${selector} must exist`);
    const text = el.childNodes.find((n) => n.nodeType === 3 && n.nodeValue.trim());
    assert.equal(text?.nodeValue.trim(), data.texte[key], key);
  }
  const before = JSON.stringify(tree);
  vm.runInNewContext(block, { D: { seite: data }, $: query });
  assert.equal(JSON.stringify(tree), before, 'Baseline tree and whitespace stay identical');
  for (const key of Object.keys(data.texte)) data.texte[key] = `<test ${key}>`;
  vm.runInNewContext(block, { D: { seite: data }, $: query });
  for (const [key, selector] of Object.entries(fields)) {
    assert.equal(query(selector).childNodes.find((n) => n.nodeType === 3 && n.nodeValue.trim()).nodeValue.trim(), data.texte[key]);
  }
});

test('page CMS form covers all text and media keys without touching legal content', () => {
  const data = JSON.parse(read('content/seite.json'));
  // Page editors are now separate navigation entries sharing one merged file.
  const forms = read('.pages.yml').split(/^      - name: /m).slice(1)
    .map((block) => block.split(/^  - name: /m)[0])
    .filter((block) => /path: content\/seite.json/.test(block));
  assert.equal(forms.length, 5, 'five short page editors expected');
  for (const form of forms) assert.doesNotMatch(form, /impressum\.html|datenschutz\.html/);
  const config = forms.join('\n');
  assert.match(config, /path: content\/seite.json/);
  for (const key of Object.keys(data.texte)) assert.ok(config.includes(`name: ${key}\n`), key);
  for (const key of ['hero', 'foto', 'alt', 'video', 'titel', 'label', 'vorschau', 'poster', 'videoPoster', 'terminbild', 'datei']) assert.ok(config.includes(`name: ${key}\n`), key);
  assert.doesNotMatch(config, /impressum\.html|datenschutz\.html/);
});
