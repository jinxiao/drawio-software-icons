import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { unzipSync, strFromU8 } from 'fflate';
import { json, hash, readLibrary, parser } from './lib.mjs';

const unified=await json('dist/unified-catalog.json');
const software=await json('dist/catalog.json');
const alibaba=await json('dist-alibaba/catalog.json');
assert.equal(unified.icons.length,software.icons.length+alibaba.entries.length);
assert.equal(unified.categories.length,software.categories.length+alibaba.categories.length);
assert.equal(new Set(unified.icons.map(i=>i.id)).size,unified.icons.length);
const archive=unzipSync(await readFile('dist/downloads/drawio-icons.zip'));
assert.equal(readLibrary(strFromU8(archive['libraries/combined.xml'])).length,unified.icons.length);
assert.deepEqual(JSON.parse(strFromU8(archive['catalog.json'])),unified);
for(const c of unified.categories) {
  assert.equal(c.count,unified.icons.filter(i=>i.category===c.id||i.categories?.includes(c.id)).length);
  const data=await json(`dist/${c.configData}`);
  assert.equal(data.length,c.count);
  for(const locale of ['en','zh-CN']) {
    const xml=await readFile(`dist/${c.libraries[locale]}`,'utf8');
    assert.equal(xml.slice(0,10),'<mxlibrary');
    assert.equal(hash(xml),c.libraryRevisions[locale]);
    assert.equal(readLibrary(xml).length,c.count);
    const collection=unified.collections.find(p=>p.id===c.collection);
    const title=locale==='en'?`${collection.nameEn} · ${c.nameEn}`:`${collection.name} · ${c.name}`;
    assert.equal(parser.parse(xml).mxlibrary['@_title'],title);
    assert.equal(strFromU8(archive[c.libraries[locale]]),xml);
    assert.equal(await readFile(`dist-alibaba/${c.libraries[locale]}`,'utf8'),xml);
  }
}
for(const icon of unified.icons) assert.equal(hash(await readFile(`dist/${icon.asset}`)),icon.sha256);
for(const locale of ['en','zh-CN']) {
  const config=await json(`dist/config/drawio-icons.${locale}.json`);
  const entries=config.libraries.flatMap(s=>s.entries);
  assert.deepEqual(entries.map(e=>e.id),['software-icons','alibaba-cloud-iconfont']);
  assert.equal(entries.flatMap(e=>e.libs).length,unified.categories.length);
  for(const [index,c] of unified.categories.entries()) {
    const collection=unified.collections.find(p=>p.id===c.collection);
    assert.equal(entries.flatMap(e=>e.libs)[index].title.main,locale==='en'?`${collection.nameEn} · ${c.nameEn}`:`${collection.name} · ${c.name}`);
  }
  const softwareData=entries[0].libs.flatMap(l=>l.data);
  assert.equal(softwareData.length,software.icons.length);
  assert.ok(softwareData.every(e=>e.data.startsWith('data:image/')));
  for(const lib of entries[1].libs) for(const entry of lib.data) {
    const xml=decodeURIComponent(inflateRawSync(Buffer.from(entry.xml,'base64')).toString());
    assert.ok(parser.parse(xml).mxGraphModel.root.object.mxCell);
    assert.equal(parser.parse(xml).mxGraphModel.root.object['@_label'],'');
  }
}
// Every original Alibaba endpoint is byte-identical except its intentionally replaced homepage and manifest.
const original=await json('.sync-stage/alibaba-build/SHA256SUMS.json');
for(const [path,sha] of Object.entries(original)) {
  if(path==='index.html')continue;
  assert.equal(hash(await readFile(`dist-alibaba/${path}`)),sha,`Legacy Alibaba URL: ${path}`);
}
for(const site of ['dist','dist-alibaba']) {
  const html=await readFile(`${site}/index.html`,'utf8');
  const app=html.match(/src="\.\/([^"\s]+\.js)"/)[1];
  const code=await readFile(`${site}/${app}`,'utf8');
  const catalog=code.match(/unified-catalog-[a-f0-9]+\.json/)[0];
  assert.equal(await readFile(`${site}/${catalog}`,'utf8'),await readFile('dist/unified-catalog.json','utf8'));
  for(const path of ['compat/alibaba-cloud/LICENSE','compat/alibaba-cloud/NOTICE.md','compat/alibaba-cloud/SOURCES.md']) {
    assert.equal(strFromU8(archive[path]),await readFile(`${site}/${path}`,'utf8'));
  }
}
console.log(`Verified ${unified.icons.length} icons, offline configurations, bilingual ZIP libraries and all ${Object.keys(original).length-1} legacy Alibaba resource endpoints.`);
