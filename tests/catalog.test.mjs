import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterIcons,drawioUrl,isLocalSite,resolveCategory,libraryPaths} from '../src/catalog.mjs';
import {inspectSvg,normalizeSvg,libraryEntry,libraryXml,readLibrary,json,parser} from '../scripts/lib.mjs';
import {categoryAliases,categoryForProject} from '../data/taxonomy.mjs';
import {communicationProjects} from '../data/communication.mjs';

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

test('IM and enterprise additions have searchable names, correct categories and commercial notices',()=>{
  for(const project of communicationProjects) {
    const icon=catalog.icons.find(i=>i.id===project.id);
    assert.ok(icon,project.id);
    assert.equal(icon.category,'applications',project.id);
    assert.equal(icon.softwareType,project.softwareType,project.id);
    for(const query of [project.name,...project.aliases]) assert.ok(filterIcons(catalog.icons,categories,query).some(i=>i.id===project.id),query);
  }
  for(const icon of catalog.icons.filter(i=>i.softwareType==='commercial')) {
    assert.equal(icon.usagePolicy,'drawio-architecture-only',icon.id);
    assert.equal(icon.usagePolicyUrl,'ICON_USAGE.md',icon.id);
    assert.equal(icon.brandPermissionStatus,'not-verified',icon.id);
  }
  const serviceNow=catalog.icons.find(i=>i.id==='servicenow');
  assert.equal(serviceNow.sha256,serviceNow.source.sha256,'GPL SVG source must be preserved verbatim');
  assert.equal(serviceNow.source.collectionLicense,'GPL-3.0-only');
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

test('draw.io library titles are explicit Unicode text independent of encoded URL filenames',()=>{
  const entries=[libraryEntry({id:'git',name:'Git',aliases:[],tags:[]},square)];
  for(const title of [...categories.flatMap(c=>[c.name,c.nameEn]),'中文 & "quoted" <tools>']) {
    const xml=libraryXml(entries,'tags',title,'Commercial icons: draw.io architecture diagrams only. 商业图标使用声明：ICON_USAGE.md');
    // EditorUi.loadLibrary passes the root title attribute to libraryLoaded,
    // which prefers it over the URL filename for the sidebar heading.
    assert.equal(parser.parse(xml).mxlibrary['@_title'],title);
    assert.deepEqual(readLibrary(xml),entries);
  }
});

test('library links use locale-specific revisions and support older catalogs',()=>{
  const category={libraries:{'zh-CN':'libraries/zh-CN/监控与安全.xml',en:'libraries/en/Monitoring & Security.xml'},
    libraryRevisions:{'zh-CN':'abc123',en:'def456'}};
  for(const locale of ['zh-CN','en']) {
    const path=libraryPaths([category],locale)[0];
    const base='https://example.github.io/drawio-software-icons/';
    const loaded=decodeURIComponent(drawioUrl(base,[path]).split('clibs=U')[1]);
    assert.equal(new URL(loaded).searchParams.get('v'),category.libraryRevisions[locale]);
    assert.equal(decodeURIComponent(new URL(loaded).pathname),'/drawio-software-icons/'+category.libraries[locale]);
    assert.deepEqual(libraryPaths([{libraries:category.libraries}],locale),[category.libraries[locale]]);
  }
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
