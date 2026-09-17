import test from 'node:test';
import assert from 'node:assert/strict';
import { configurationFor, mergeConfiguration, DEFAULT_LIBRARIES } from '../src/configuration.mjs';
import { filterIcons } from '../src/catalog.mjs';

const catalog = {
  collections: [{ id:'software',name:'软件',nameEn:'Software' },{ id:'alibaba-cloud',name:'阿里云',nameEn:'Alibaba Cloud' }],
  categories: [
    {id:'development',collection:'software',name:'开发工具',nameEn:'Development',keywords:['Git','中文']},
    {id:'data',collection:'software',name:'数据',nameEn:'Data',keywords:['AI']},
    {id:'alibaba-cloud',collection:'alibaba-cloud',name:'云计算',nameEn:'Cloud',keywords:['阿里云']}
  ]
};
const payloads = Object.fromEntries(catalog.categories.map(c=>[c.id,[{title:'中文 & "quotes"',data:'data:image/svg+xml;base64,PHN2Zy8+',w:64,h:64}]]));
const incoming = configurationFor(catalog,catalog.categories.map(c=>c.id),payloads);

test('one self-contained configuration contains selected categories from both collections in either language',()=>{
  for(const locale of ['en','zh-CN']) {
    const config=configurationFor(catalog,['development','alibaba-cloud'],payloads,locale);
    assert.deepEqual(config.libraries.map(s=>s.entries[0].id),['software-icons','alibaba-cloud-iconfont']);
    const libs=config.libraries.flatMap(s=>s.entries.flatMap(e=>e.libs));
    assert.equal(libs.length,2);
    assert.equal(libs[0].title.main,locale==='en'?'Software · Development':'软件 · 开发工具');
    assert.equal(libs[1].data[0].title,'中文 & "quotes"');
    assert.ok(libs.every(l=>!l.url));
    assert.ok(config.defaultLibraries.startsWith(DEFAULT_LIBRARIES));
  }
  assert.throws(()=>configurationFor(catalog,[],payloads));
  assert.throws(()=>configurationFor(catalog,['unknown'],payloads));
  assert.throws(()=>configurationFor(catalog,['data'],{}));
});

test('merging updates existing packs in place, preserves unrelated settings and is idempotent',()=>{
  const custom={id:'company',libs:[{url:'file:///D:/custom.xml'}]};
  const existing={version:18,customFonts:['Example'],defaultEdgeStyle:{rounded:'1'},css:'body {}',
    defaultLibraries:'general;company;alibaba-cloud-iconfont',enabledLibraries:['general','company'],
    defaultCustomLibraries:['Luser-shapes'],libraries:[{title:{main:'My tools'},entries:[custom,
      {id:'alibaba-cloud-iconfont',libs:[{data:[]}]}]}]};
  const before=structuredClone(existing);
  const merged=mergeConfiguration(existing,incoming);
  assert.deepEqual(existing,before);
  for(const key of ['version','customFonts','defaultEdgeStyle','css','defaultCustomLibraries']) assert.deepEqual(merged[key],existing[key]);
  assert.deepEqual(merged.libraries[0].entries[0],custom);
  assert.equal(merged.libraries[0].entries[1].libs.length,1);
  assert.equal(merged.libraries.length,2);
  assert.deepEqual(merged.enabledLibraries,['general','company','software-icons','alibaba-cloud-iconfont']);
  assert.equal(merged.defaultLibraries,'general;company;alibaba-cloud-iconfont;software-icons');
  assert.deepEqual(mergeConfiguration(merged,incoming),merged);
  assert.equal(mergeConfiguration({enabledLibraries:null},incoming).enabledLibraries,null);
  assert.equal(mergeConfiguration({},incoming).enabledLibraries,undefined);
  assert.equal(mergeConfiguration({defaultLibraries:''},incoming).defaultLibraries,'software-icons;alibaba-cloud-iconfont');
});

test('updating only software preserves an existing Alibaba pack and rejects malformed input',()=>{
  const only=configurationFor(catalog,['development'],payloads);
  const merged=mergeConfiguration(incoming,only);
  assert.deepEqual(merged.libraries[1],incoming.libraries[1]);
  assert.equal(merged.libraries[0].entries[0].libs.length,1);
  for(const bad of [null,[],true,{libraries:{}},{libraries:[{}]},{defaultLibraries:[]},{enabledLibraries:'general'},
    {libraries:[{entries:[{id:'a',libs:[]},{id:'a',libs:[]}]}]}]) assert.throws(()=>mergeConfiguration(bad,incoming));
});

test('search supports collection filters and icons that belong to multiple Alibaba categories',()=>{
  const icons=[{id:'a',name:'ECS',aliases:[],tags:[],collection:'alibaba-cloud',category:'data',categories:['data','alibaba-cloud'],softwareType:'commercial'},
    {id:'b',name:'Git',aliases:[],tags:[],collection:'software',category:'development',softwareType:'open-source'}];
  assert.deepEqual(filterIcons(icons,catalog.categories,'阿里云','alibaba-cloud','commercial','alibaba-cloud').map(i=>i.id),['a']);
  assert.deepEqual(filterIcons(icons,catalog.categories,'','all','all','software').map(i=>i.id),['b']);
  assert.equal(filterIcons(icons,catalog.categories,'').length,2);
});
