import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterIcons,drawioUrl,isLocalSite,resolveCategory} from '../src/catalog.mjs';
import {inspectSvg,normalizeSvg,libraryEntry,libraryXml,readLibrary,json} from '../scripts/lib.mjs';
import {categoryAliases,categoryForProject} from '../data/taxonomy.mjs';

const catalog=await json('data/catalog.json');
const english=await json('data/categories.en.json');
const categories=(await json('data/categories.json')).map(c=>({...c,nameEn:english[c.id][0]}));
const square='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#123456" d="M0 0h100v100H0z"/></svg>';

test('homepage and category links tolerate catalogs without the optional alias map',()=>{
  const olderCatalog={categories};
  assert.equal(resolveCategory(olderCatalog,'all'),'all');
  assert.equal(resolveCategory(olderCatalog,'development'),'development');
  assert.equal(resolveCategory(olderCatalog,'unknown'),'all');
  assert.equal(resolveCategory({...olderCatalog,categoryAliases:null},'all'),'all');
  assert.equal(resolveCategory({...olderCatalog,categoryAliases},'automation'),'development');
  assert.equal(resolveCategory({...olderCatalog,categoryAliases},'all'),'all');
});
test('bilingual search, aliases, combined filters and no results',()=>{
  assert.equal(filterIcons(catalog.icons,categories,'k8s')[0].id,'kubernetes');
  const zh=filterIcons(catalog.icons,categories,'数据库').map(i=>i.id);
  const en=filterIcons(catalog.icons,categories,'databases').map(i=>i.id);
  assert.deepEqual(zh,en);
  assert.ok(zh.includes('postgresql'));
  assert.deepEqual(filterIcons(catalog.icons,categories,'PostgreSQL','databases','open-source').map(i=>i.id),['postgresql']);
  assert.deepEqual(filterIcons(catalog.icons,categories,'PostgreSQL','cloud'),[]);
  assert.deepEqual(filterIcons(catalog.icons,categories,'zz-no-icon-zz'),[]);
  assert.equal(filterIcons(catalog.icons,categories,'  ＲＥＡＣＴ  ').some(i=>i.id==='react'),true);
  assert.ok(filterIcons(catalog.icons,categories,'','all','commercial').every(i=>i.softwareType==='commercial'));
});
test('both locale category catalogs are complete and all categories are populated',()=>{
  assert.deepEqual(Object.keys(english).sort(),categories.map(c=>c.id).sort());
  assert.equal(categories.length,8);
  assert.ok(catalog.icons.length>=300);
  assert.equal(new Set(catalog.icons.map(i=>i.id)).size,catalog.icons.length);
  assert.ok(categories.every(c=>catalog.icons.some(i=>i.category===c.id)));
  assert.ok(catalog.icons.every(i=>categories.some(c=>c.id===i.category)));
});

test('related software shares a category across icon sources and legacy categories resolve',async()=>{
  for(const id of ['git','github','gitlab','gitea','forgejo']) {
    assert.equal(catalog.icons.find(i=>i.id===id)?.category,'development',id);
  }
  for(const id of ['opensearch','elasticsearch']) assert.equal(catalog.icons.find(i=>i.id===id)?.category,'databases',id);
  assert.equal(categoryForProject('gitea','collaboration'),'development');
  const legacy=await json('data/legacy-categories.json');
  assert.equal(legacy.length,18);
  for(const c of legacy) {
    assert.equal(categoryAliases[c.id]??c.id,c.category);
    assert.ok(categories.some(current=>current.id===c.category));
  }
});

test('open all includes exactly eight distinct category libraries in either language',()=>{
  const base='https://example.github.io/drawio-software-icons/';
  for(const locale of ['zh-CN','en']) {
    const paths=categories.map(c=>`libraries/${locale}/${(locale==='en'?c.nameEn:c.name).replaceAll('/','-')}.xml`);
    const url=drawioUrl(base,paths);
    const loaded=url.split('clibs=')[1].split(';').map(id=>decodeURIComponent(id.slice(1)));
    assert.equal(new Set(loaded).size,8);
    assert.deepEqual(loaded,paths.map(p=>new URL(p,base).href));
  }
});
test('draw.io links preserve multiple Unicode paths and repository base paths',()=>{
  const base='https://example.github.io/drawio-software-icons/';
  const paths=['libraries/zh-CN/数据库.xml','libraries/en/Storage & Backup.xml'];
  const url=drawioUrl(base,[...paths,paths[0]]);
  // Match draw.io's documented raw clibs convention: split first, then decode.
  const loaded=url.split('clibs=')[1].split(';').map(id=>decodeURIComponent(id.slice(1)));
  assert.deepEqual(loaded,paths.map(p=>new URL(p,base).href));
  assert.ok(!url.includes('libs=0'));
  assert.throws(()=>drawioUrl(base,[]));
  assert.throws(()=>drawioUrl(base,['https://unrelated.test/icon.xml']));
  assert.throws(()=>drawioUrl(base,['javascript:alert(1)']));
  assert.ok(isLocalSite('http://127.0.0.1:5173/'));
  assert.ok(isLocalSite('http://[::1]:5173/'));
  assert.equal(isLocalSite(base),false);
});
test('library XML survives Unicode, quotes, ampersands and embedded SVG unchanged',()=>{
  const icon={id:'special',name:'A & B "中文" <tools>',aliases:['别名'],tags:['tag & name']};
  const entry=libraryEntry(icon,square);
  const xml=libraryXml([entry],'分类 & tools');
  assert.deepEqual(readLibrary(xml),[entry]);
  assert.equal(Buffer.from(readLibrary(xml)[0].data.split(',')[1],'base64').toString(),square);
  assert.equal(entry.w,64);assert.equal(entry.h,64);assert.equal(entry.aspect,'fixed');
});
test('wide and portrait logos keep aspect ratio, including actual collected SVGs',async()=>{
  const wide=square.replace('0 0 100 100','0 0 200 50');
  const icon={id:'wide',name:'Wide',aliases:[],tags:[]};
  assert.equal(libraryEntry(icon,wide).h,16);
  const portrait=square.replace('0 0 100 100','0 0 50 200');
  assert.equal(libraryEntry(icon,portrait).w,16);
  const real=catalog.icons.find(i=>i.width/i.height>2);
  assert.ok(real);
  const entry=libraryEntry(real,await readFile(`assets/${real.asset}`,'utf8'));
  assert.ok(Math.abs(entry.w/entry.h-real.width/real.height)<0.001);
});
test('unsafe SVG payloads are rejected, including entity-encoded remote URLs',()=>{
  const wrap=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;
  for(const payload of ['<script>alert(1)</script>','<path onclick="run()"/>','<foreignObject/>','<image href="https://evil.test/x.png"/>','<use href="&#104;ttps://evil.test/x.svg"/>','<style>@import "https://evil.test/x.css";</style>','<path fill="url(https://evil.test/f.svg)"/>','<animate attributeName="href"/>']) assert.throws(()=>inspectSvg(wrap(payload)),payload);
  assert.throws(()=>inspectSvg(square.replace('100 100','0 -1')));
  assert.throws(()=>inspectSvg(square.replace('</svg>','')));
  assert.throws(()=>normalizeSvg('<!ENTITY x SYSTEM "https://evil.test">'+square));
  assert.deepEqual(inspectSvg(wrap('<defs><linearGradient id="g"/></defs><path fill="url(#g)"/>')),{width:10,height:10});
  assert.equal(inspectSvg(normalizeSvg('<?xml version="1.0"?>'+square)).width,100);
});
