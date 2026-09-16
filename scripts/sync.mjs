import { readFile, cp, mkdtemp, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { selection } from '../data/selection.mjs';
import { communicationMetadata } from '../data/communication.mjs';
import { aiMetadata, aiSourcePaths } from '../data/ai.mjs';
import { hash, json, save, saveJson, inspectSvg, inspectPng, normalizeSvg, packageOfficialPng } from './lib.mjs';

const definitions = {
  lobe:{repo:'lobehub/lobe-icons',branch:'master',license:'MIT',index:null,
    initialRevision:'a94750e3f5f8fc33757b839d85030e742284e43a',paths:aiSourcePaths},
  devicon:{repo:'devicons/devicon', branch:'master', license:'MIT', index:'devicon.json'},
  dashboard:{repo:'homarr-labs/dashboard-icons', branch:'main', license:'Apache-2.0', index:'tree.json'},
  antdesign:{repo:'ant-design/ant-design-icons', branch:'master', license:'MIT', index:null,
    initialRevision:'7f2516ac91226d2b41f93b35cb5197c8d94f7189',
    paths:{qq:'packages/icons-svg/svg/outlined/qq.svg'}},
  vendor:{repo:'bwks/vendor-icons-svg',branch:'master',license:'GPL-3.0-only',index:null,preserveOriginal:true,
    initialRevision:'702f2ac88acc71759ce623bc5000a596195e9db3',paths:{servicenow:'servicenow.svg'}}
};
const update = process.argv.includes('--update');
const oldLock = await json('data/sources.lock.json').catch(e => {if(e.code !== 'ENOENT') throw e; return null;});
const oldCatalog = await json('data/catalog.json').catch(e => {if(e.code !== 'ENOENT') throw e; return null;});
const categories = await json('data/categories.json');
const officialIcons = await json('data/official-icons.json');
const categoryMap = new Map(categories.map(c => [c.id,c]));
if (new Set(selection.map(i=>i.id)).size !== selection.length) throw Error('Duplicate selection IDs');
const pins = {};
async function download(url, binary=false) {
  const cache = `.sync-stage/cache/${hash(url)}.${binary?'bin':'txt'}`;
  const cached = await readFile(cache,binary?undefined:'utf8').catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
  if(cached !== null) return cached;
  const response = await fetch(url, {signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`${response.status} ${url}`);
  const content=binary?Buffer.from(await response.arrayBuffer()):await response.text();
  await save(cache,content);
  return content;
}
for (const [id, source] of Object.entries(definitions)) {
  const revision = update || !(oldLock?.[id]?.revision || source.initialRevision) ? execFileSync('git', ['ls-remote', `https://github.com/${source.repo}.git`, `refs/heads/${source.branch}`], {encoding:'utf8',timeout:60000}).split(/\s/)[0] : oldLock?.[id]?.revision ?? source.initialRevision;
  if (!/^[a-f0-9]{40}$/.test(revision)) throw Error(`Could not resolve ${id}`);
  pins[id] = {...source, revision};
}
// Official artwork is reviewed and pinned by content, not silently refreshed by --update.
pins['official-apps']={kind:'publisher-artwork',manifest:'data/official-icons.json',revision:hash(JSON.stringify(officialIcons)),license:'Proprietary brand artwork; permission not verified'};
await mkdir('.sync-stage', {recursive:true});
const stage = await mkdtemp('.sync-stage/run-');
const indexes = {};
for (const [id, source] of Object.entries(pins)) {
  if(source.kind==='publisher-artwork') {
    await save(`${stage}/licenses/${id}-LICENSE.txt`,await readFile(`licenses/${id}-LICENSE.txt`));
    continue;
  }
  const base = `https://raw.githubusercontent.com/${source.repo}/${source.revision}/`;
  const [index, license] = await Promise.all([source.index?download(base+source.index):null,download(base+'LICENSE')]);
  if(index) indexes[id] = JSON.parse(index);
  await save(`${stage}/licenses/${id}-LICENSE.txt`,license);
}
const devicons = new Map(indexes.devicon.map(i=>[i.name,i]));
const dashboardFiles = new Set(indexes.dashboard.svg);
const oldIcons = new Map(oldCatalog?.icons.map(i=>[i.id,i]) ?? []);
const icons = new Array(selection.length), errors = [];
let cursor = 0, done = 0;
async function worker() {
  while (cursor < selection.length) {
    const index = cursor++, item = selection[index];
    try {
      const source = pins[item.source];
      const official = item.source==='official-apps'?officialIcons[item.id]:null;
      if(item.source==='official-apps' && !official) throw Error('Official artwork missing from pinned manifest');
      const asset=`icons/${item.id}.${official && !official.presentation?'png':'svg'}`;
      const originalAsset=official?`icons/${item.id}.png`:asset;
      const metadata = item.source === 'devicon' ? devicons.get(item.id) : null;
      let path, variant;
      if(official) {
        path=originalAsset;variant=official.presentation?'official-png-rounded':'official-png';
      } else if (item.source === 'devicon') {
        if (!metadata) throw Error('Icon missing in Devicon index');
        variant = ['original','plain','original-wordmark','plain-wordmark','line'].find(v=>metadata.versions.svg.includes(v));
        if (!variant) throw Error('No supported SVG variant');
        path = `icons/${item.id}/${item.id}-${variant}.svg`;
      } else if(item.source === 'dashboard') {
        if (!dashboardFiles.has(`${item.id}.svg`)) throw Error('Icon missing in Dashboard SVG index');
        path = `svg/${item.id}.svg`; variant = 'original';
      } else {
        path=source.paths?.[item.id];
        if(!path) throw Error('Missing curated source path');
        variant=item.source==='antdesign'?'monochrome':item.source==='lobe'?(path.endsWith('-color.svg')?'color':'monochrome'):'original';
      }
      const sourceUrl = official?.url ?? `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${path}`;
      const prior = oldIcons.get(item.id);
      let raw;
      if (prior?.source.url === sourceUrl || official) {
        try { raw = await readFile(`assets/${originalAsset}`,official?undefined:'utf8'); if(hash(raw)!==(official?.sha256??prior.sha256)) raw = null; }
        catch(e) {if(e.code !== 'ENOENT') throw e;}
      }
      let upstreamSha256 = official?.sha256 ?? (prior?.source.url === sourceUrl ? prior.source.sha256 : null);
      if (!raw) { const original = await download(sourceUrl,Boolean(official)); upstreamSha256=hash(original); raw=official?original:normalizeSvg(original); }
      if(official && hash(raw)!==official.sha256) throw Error('Official artwork checksum changed; review the source before updating the pin');
      // Keep the GPL collection's SVG source byte-for-byte, including its metadata.
      if(source.preserveOriginal) {raw=await download(sourceUrl);upstreamSha256=hash(raw);}
      const dimensions = official?inspectPng(raw):inspectSvg(raw);
      if(official && (dimensions.width!==official.width || dimensions.height!==official.height)) throw Error('Official artwork dimensions do not match manifest');
      if(official?.presentation) {
        await save(`${stage}/assets/${originalAsset}`,raw);
        raw=packageOfficialPng(raw,official.presentation);
        inspectSvg(raw);
      }
      const category = categoryMap.get(item.category);
      if (!category) throw Error('Unknown category');
      const {source: sourceId, ...project} = item;
      const extra=communicationMetadata.get(item.id)??aiMetadata.get(item.id);
      const aliases = [...new Set([...(extra?.aliases??[]),...(metadata?.altnames ?? []), ...(item.id === 'kubernetes' ? ['k8s'] : []), ...(item.id === 'postgresql' ? ['postgres','pg'] : []), ...(item.id === 'amazonwebservices' ? ['aws'] : [])])];
      icons[index] = {...project, aliases, tags:[...new Set([...(extra?.tags??[]),...(metadata?.tags ?? []).filter(t=>t !== 'open-source'), category.name,...category.keywords])],
        ...(item.softwareType==='commercial'?{usagePolicy:'drawio-architecture-only',usagePolicyUrl:'ICON_USAGE.md',brandPermissionStatus:'not-verified'}:{}),
        asset, ...dimensions, sha256:hash(raw),
        source:{id:sourceId, ...(official?{kind:'publisher-artwork',publisher:official.publisher,listing:official.listing,appId:official.appId,retrievedOn:official.retrievedOn}:{repository:`https://github.com/${source.repo}`}),revision:source.revision,path,url:sourceUrl,variant,sha256:upstreamSha256,collectionLicense:source.license,
          licenseUrl:official?'ICON_USAGE.md':`https://github.com/${source.repo}/blob/${source.revision}/LICENSE`,
          note:'图标集许可独立于软件许可；品牌标志及商标属于各自所有者。本项目仅用于标识，不代表官方背书。'}};
      await save(`${stage}/assets/${asset}`,raw);
    } catch(error) { errors.push(`${item.id}: ${error.message}`); }
    if (++done % 50 === 0 || done === selection.length) console.log(`Collected ${done}/${selection.length}`);
  }
}
await Promise.all(Array.from({length:8},worker));
if (errors.length) throw Error(`Collection aborted; committed assets unchanged:\n${errors.join('\n')}`);
icons.sort((a,b)=>a.id.localeCompare(b.id,'en'));
const catalog = {schemaVersion:1,version:'1.0.0',icons};
const compare = item => {
  if (!item) return '';
  const copy = structuredClone(item);
  // Upstream unrelated commits alone do not create update PRs.
  if (copy.source) {delete copy.source.revision; delete copy.source.url; delete copy.source.licenseUrl;}
  return JSON.stringify(copy);
};
const changed = icons.filter(i=>compare(i)!==compare(oldIcons.get(i.id)));
const removed = [...oldIcons.keys()].filter(id=>!icons.some(i=>i.id===id));
let licenseChanged = false;
for (const id of Object.keys(pins)) {
  const previous = await readFile(`licenses/${id}-LICENSE.txt`,'utf8').catch(e=>{if(e.code !== 'ENOENT')throw e;return '';});
  if(previous !== await readFile(`${stage}/licenses/${id}-LICENSE.txt`,'utf8')) licenseChanged = true;
}
if(oldCatalog && !changed.length && !removed.length && !licenseChanged) {
  await save('.update-summary.md','No selected icon or license changes.\n');
  console.log('No selected icon or license changes; existing pins retained.');
} else {
  await cp(`${stage}/assets`,'assets',{recursive:true});
  await cp(`${stage}/licenses`,'licenses',{recursive:true});
  await saveJson('data/catalog.json',catalog);
  await saveJson('data/sources.lock.json',pins);
  const summary = `## 图标更新\n\n更新或新增 ${changed.length} 项，移除 ${removed.length} 项。\n\n${changed.map(i=>`- ${i.name} (${i.id})`).join('\n')}\n${removed.map(id=>`- 移除 ${id}`).join('\n')}\n\n上游许可变化：${licenseChanged ? '是' : '否'}。请在合并前检查图标与来源信息。\n`;
  await save('.update-summary.md',summary);
  console.log(`Saved ${icons.length} icons and locked provenance.`);
}
