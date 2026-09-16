import { readFile, readdir, rm, lstat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from 'fflate';
import { json,save,libraryEntry,libraryXml,readLibrary } from './lib.mjs';
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
const entries=new Map(), zipFiles={};
const addZip=(name,data)=>{zipFiles[name]=[typeof data==='string'?strToU8(data):data,{mtime:new Date('2020-01-01T00:00:00Z')}];};
for(const icon of catalog.icons) {
  const svg=await readFile(`assets/${icon.asset}`,'utf8');
  entries.set(icon.id,libraryEntry(icon,svg));
  await save(`public/${icon.asset}`,svg);
  addZip(icon.asset,svg);
}
for(const category of categories) {
  const items=catalog.icons.filter(i=>i.category===category.id).map(i=>entries.get(i.id));
  const xml=libraryXml(items,`${category.name} ${category.nameEn} ${category.keywords.join(' ')}`);
  const parsed=readLibrary(xml);
  if(JSON.stringify(parsed)!==JSON.stringify(items)) throw Error(`Library round-trip failed: ${category.id}`);
  category.count=items.length;
  for(const path of Object.values(category.libraries)) {await save(`public/${path}`,xml);addZip(path,xml);}
}
const allXml=libraryXml(catalog.icons.map(i=>entries.get(i.id)),'software 软件');
await save('public/libraries/all.xml',allXml);addZip('libraries/all.xml',allXml);
const publicCatalog=JSON.stringify({...catalog,categories},null,2)+'\n';
await save('public/catalog.json',publicCatalog);addZip('catalog.json',publicCatalog);
for(const file of await readdir('licenses')) {const content=await readFile(`licenses/${file}`);await save(`public/licenses/${file}`,content);addZip(`licenses/${file}`,content);}
for(const file of ['README.md','README.en.md','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md','LICENSE']) {
  const content=await readFile(file);await save(`public/${file}`,content);addZip(file,content);
}
const zip=zipSync(zipFiles,{level:6});
await save('public/downloads/drawio-software-icons.zip',zip);
await save('public/.nojekyll','');
console.log(`Generated ${catalog.icons.length} icons, ${categories.length*2} bilingual libraries, catalog and ${(zip.length/1024/1024).toFixed(2)} MB ZIP.`);
