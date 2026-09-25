import { readFile, readdir, rm, lstat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from 'fflate';
import { json,save,hash,libraryEntry,libraryXml,readLibrary } from './lib.mjs';
import {changelogMarkdown} from './changelog.mjs';
import { categoryAliases } from '../data/taxonomy.mjs';
// Only this script's generated output may be cleaned; never follow an output symlink.
const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(projectRoot,'public');
if(resolve(process.cwd())!==resolve(projectRoot) || relative(projectRoot,output)!=='public') throw Error('Run from the project root');
const existing=await lstat(output).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
if(existing?.isSymbolicLink()) throw Error('Generated output must not be a symlink');
if(existing) await rm(output,{recursive:true});
const catalog=await json('data/catalog.json');
const en=await json('data/categories.en.json');
const categories=(await json('data/categories.json')).map(c=>({...c,nameEn:en[c.id][0],descriptionEn:en[c.id][1],
  libraries:{'zh-CN':`libraries/zh-CN/${c.name.replaceAll('/','-')}.xml`,en:`libraries/en/${en[c.id][0]}.xml`}}));
const entries=new Map(), categoryXml=new Map(), zipFiles={};
const usageNotice='Commercial icons: provided solely for draw.io architecture diagrams, not other distribution purposes. 商业图标仅供 draw.io 架构图绘制，不适用于其他发行用途。 Upstream licenses and brand rights remain applicable; this statement grants no additional rights. See ICON_USAGE.md and THIRD_PARTY_NOTICES.md.';
const addZip=(name,data)=>{zipFiles[name]=[typeof data==='string'?strToU8(data):data,{mtime:new Date('2020-01-01T00:00:00Z')}];};
for(const icon of catalog.icons) {
  const svg=await readFile(`assets/${icon.asset}`,icon.asset.endsWith('.png')?undefined:'utf8');
  entries.set(icon.id,libraryEntry(icon,svg));
  await save(`public/${icon.asset}`,svg);
  addZip(icon.asset,svg);
  if(icon.source.variant==='official-png-rounded') {
    const original=await readFile(`assets/icons/${icon.id}.png`);
    await save(`public/icons/${icon.id}.png`,original);
    addZip(`icons/${icon.id}.png`,original);
  }
}
for(const category of categories) {
  const items=catalog.icons.filter(i=>i.category===category.id).map(i=>entries.get(i.id));
  category.count=items.length;
  category.libraryRevisions={};
  const localizedXml={};
  for(const [locale,path] of Object.entries(category.libraries)) {
    const title=locale==='en'?`General Software · ${category.nameEn}`:`通用软件 · ${category.name}`;
    const xml=libraryXml(items,`${category.name} ${category.nameEn} ${category.keywords.join(' ')}`,title,usageNotice);
    const parsed=readLibrary(xml);
    if(JSON.stringify(parsed)!==JSON.stringify(items)) throw Error(`Library round-trip failed: ${category.id}/${locale}`);
    localizedXml[locale]=xml;
    category.libraryRevisions[locale]=hash(xml);
    await save(`public/${path}`,xml);addZip(path,xml);
  }
  categoryXml.set(category.id,localizedXml);
}
// Keep published URLs usable, without adding duplicate libraries to the ZIP or UI.
for(const legacy of await json('data/legacy-categories.json')) {
  const xml=categoryXml.get(legacy.category);
  if(!xml) throw Error(`Unknown legacy category: ${legacy.category}`);
  for(const [locale,path] of Object.entries(legacy.libraries)) await save(`public/${path}`,xml[locale]);
}
const allXml=libraryXml(catalog.icons.map(i=>entries.get(i.id)),'General Software 通用软件','通用软件 · 全部图标 / General Software · All Icons',usageNotice);
await save('public/libraries/all.xml',allXml);addZip('libraries/all.xml',allXml);
const publicCatalog=JSON.stringify({...catalog,categories,categoryAliases},null,2)+'\n';
await save('public/catalog.json',publicCatalog);addZip('catalog.json',publicCatalog);
// Content-addressed URL keeps new application code from fetching an old cached catalog.
await save(`public/catalog-${hash(publicCatalog)}.json`,publicCatalog);
for(const file of await readdir('licenses')) {const content=await readFile(`licenses/${file}`);await save(`public/licenses/${file}`,content);addZip(`licenses/${file}`,content);}
for(const file of ['README.md','README.en.md','README.zh-CN.md','ICON_USAGE.md','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md','LICENSE','data/official-icons.json','docs/DEPLOYMENT.md']) {
  const content=await readFile(file);await save(`public/${file}`,content);addZip(file,content);
}
const history=await json('data/changelog.json');
for(const [locale,path] of [['en','CHANGELOG.md'],['zh-CN','CHANGELOG.zh-CN.md']]) {
  const content=changelogMarkdown(history,locale);
  await save(`public/${path}`,content);addZip(path,content);
}
const historyJson=JSON.stringify(history,null,2)+'\n';
await save('public/changelog.json',historyJson);addZip('changelog.json',historyJson);
const zip=zipSync(zipFiles,{level:6});
await save('public/downloads/drawio-software-icons.zip',zip);
await save('public/.nojekyll','');
await save('public/robots.txt','User-agent: *\nAllow: /\n\nSitemap: https://icons.rambow.cloud/sitemap.xml\n');
await save('public/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://icons.rambow.cloud/</loc></url>\n</urlset>\n');
console.log(`Generated ${catalog.icons.length} icons, ${categories.length*2} bilingual libraries, catalog and ${(zip.length/1024/1024).toFixed(2)} MB ZIP.`);
await (await import('./generate-unified.mjs')).generateUnified({...catalog,categories,categoryAliases},entries);
