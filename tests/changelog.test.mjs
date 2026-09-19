import test from 'node:test';
import assert from 'node:assert/strict';
import {syncChangelogEntry,validateChangelog,changelogMarkdown} from '../scripts/changelog.mjs';
import {json} from '../scripts/lib.mjs';

test('sync history separates additions, updates and removals, retaining removed names',()=>{
  const before=new Map([['old',{id:'old',name:'Old name'}],['updated',{id:'updated',name:'Before'}]]);
  const entry=syncChangelogEntry(before,[{id:'new',name:'New icon',sha256:'new'},{id:'updated',name:'After',sha256:'changed'}],['old'],false,'2026-09-19');
  assert.deepEqual(entry.changes.map(g=>[g.kind,g.icons]),[
    ['added',[{id:'new',name:'New icon'}]],['updated',[{id:'updated',name:'After'}]],['removed',[{id:'old',name:'Old name'}]],
  ]);
  validateChangelog([entry]);
  assert.equal(syncChangelogEntry(before,[],[],false,'2026-09-19'),null);
  const license=syncChangelogEntry(before,[],[],true,'2026-09-19');
  assert.deepEqual(license.changes,[]);
  assert.match(license.summary.en,/license/);
  assert.match(license.summary['zh-CN'],/许可/);
});

test('historical records cover every current software icon and keep bilingual details',async()=>{
  const history=validateChangelog(await json('data/changelog.json'));
  const catalog=await json('data/catalog.json');
  const added=new Set(history.flatMap(e=>e.changes.filter(g=>g.kind==='added'&&g.collection==='software').flatMap(g=>g.icons.map(i=>i.id))));
  assert.ok(catalog.icons.every(i=>added.has(i.id)));
  const en=changelogMarkdown(history,'en'),zh=changelogMarkdown(history,'zh-CN');
  assert.match(en,/Grafana Loki/);assert.match(zh,/Grafana Loki/);
  assert.match(en,/Updated · General Software/);assert.match(zh,/更新 · 通用软件/);
  assert.match(en,/Alibaba Cloud \(888\)/);assert.match(zh,/阿里云 \(888\)/);
  const bad=structuredClone(history);delete bad[0].summary.en;
  assert.throws(()=>validateChangelog(bad),/Missing en/);
  assert.throws(()=>validateChangelog([history[0],history[0]]),/Duplicate/);
});
