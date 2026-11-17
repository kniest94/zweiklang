'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.join(__dirname,'..');
test('legal pages have explicit raw-code editors without changing their approved files',()=>{
 const config=fs.readFileSync(path.join(root,'.pages.yml'),'utf8');
 for(const [name,file] of [['impressum','impressum.html'],['datenschutz','datenschutz.html']]){
  const section=config.split(`  - name: ${name}\n`)[1]?.split('\n  - name: ')[0];
  assert.ok(section,`${name}: Editor fehlt`);
  assert.ok(section.includes(`path: ${file}`));
  assert.ok(section.includes('format: code'));
  assert.ok(!section.includes('fields:'));
  assert.equal(fs.readFileSync(path.join(root,file),'utf8'),execFileSync('git',['show',`bb0851b01e4f8dd50a7ba3660cc78e15f29b190a:${file}`],{cwd:root,encoding:'utf8'}));
 }
});
