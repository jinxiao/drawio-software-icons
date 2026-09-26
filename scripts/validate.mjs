import {readFile} from 'node:fs/promises';
import {selection} from '../data/selection.mjs';
import {loadIconConfiguration,artworkKey,cacheOptions} from './icon-config.mjs';
import {json,hash,inspectSvg,inspectPng,packageOfficialPng} from './lib.mjs';
import {validateChangelog} from './changelog.mjs';
const catalog = await json('data/catalog.json');
const categories = await json('data/categories.json');
const sources = await json('data/sources.lock.json');
const officialIcons = await json('data/official-icons.json');
const {config,icons:configuredIcons}=await loadIconConfiguration();
const configured=new Map(configuredIcons.map(icon=>[icon.id,icon]));
const inputs=await json('data/icon-inputs.lock.json');
const history=validateChangelog(await json('data/changelog.json'));
const documented=new Set(history.flatMap(entry=>entry.changes.filter(c=>c.collection==='software'&&c.kind==='added').flatMap(c=>c.icons.map(i=>i.id))));
for(const icon of catalog.icons)if(!documented.has(icon.id))throw Error(`Missing added-icon changelog entry: ${icon.id}`);
const fail = message => {throw Error(message);};
if(catalog.schemaVersion !== 1 || catalog.icons.length < 300) fail('Catalog must contain at least 300 icons');
const ids = new Set(), categoryIds = new Set(categories.map(c=>c.id));
const selected = new Map(selection.map(i=>[i.id,i]));
if(catalog.icons.length !== selection.length) fail('Catalog is out of sync with selection');
for(const icon of catalog.icons) {
  if(!/^[a-z0-9-]+$/.test(icon.id) || ids.has(icon.id)) fail(`Invalid or duplicate ID: ${icon.id}`);
  ids.add(icon.id);
  const seed = selected.get(icon.id);
  if(!seed || Object.entries(seed).some(([key,value])=>key !== 'source' && JSON.stringify(icon[key]) !== JSON.stringify(value))) fail(`Stale metadata: ${icon.id}`);
  if(!categoryIds.has(icon.category)) fail(`Unknown category: ${icon.id}`);
  if(!['open-source','source-available','commercial','unverified'].includes(icon.softwareType)) fail(`Invalid type: ${icon.id}`);
  if(icon.softwareType==='commercial' && (icon.usagePolicy!=='drawio-architecture-only' || icon.usagePolicyUrl!=='ICON_USAGE.md' || icon.brandPermissionStatus!=='not-verified')) fail(`Missing commercial usage policy: ${icon.id}`);
  if(!icon.name || !Array.isArray(icon.aliases) || !icon.tags.length) fail(`Incomplete metadata: ${icon.id}`);
  const input=configured.get(icon.id);
  const category=categories.find(category=>category.id===icon.category);
  if(JSON.stringify(icon.aliases)!==JSON.stringify([...new Set(input.aliases)]) || JSON.stringify(icon.tags)!==JSON.stringify([...new Set([...input.tags,category.name,...category.keywords])])) fail(`Stale search metadata: ${icon.id}`);
  if(new URL(icon.homepage).protocol !== 'https:') fail(`Invalid project URL: ${icon.id}`);
  const source=sources[icon.source.id];
  const definition=config.sources[input.source];
  if(input.source!==icon.source.id || !source || (definition.revision && definition.revision!==source.revision)
    || inputs.icons[icon.id]!==artworkKey(input,{...definition,revision:source.revision},cacheOptions(config,definition))) fail(`Stale artwork configuration: ${icon.id}; run npm run sync`);
  const official=source?.kind==='publisher-artwork';
  if(!source || icon.source.revision !== source.revision || !(official?/^[a-f0-9]{64}$/:/^[a-f0-9]{40}$/).test(source.revision)) fail(`Invalid source pin: ${icon.id}`);
  if((!official && !icon.source.url.includes(`/${source.revision}/`)) || !icon.source.licenseUrl || !icon.source.collectionLicense || !/^[a-f0-9]{64}$/.test(icon.source.sha256)) fail(`Incomplete provenance: ${icon.id}`);
  if(official) {
    const pinned=officialIcons[icon.id];
    if(!pinned || icon.source.url!==pinned.url || icon.source.publisher!==pinned.publisher || icon.source.listing!==pinned.listing || icon.source.sha256!==pinned.sha256 || source.revision!==hash(JSON.stringify(officialIcons))) fail(`Invalid official artwork pin: ${icon.id}`);
    const svg=pinned.format==='svg';
    const original=await readFile(`assets/icons/${icon.id}.${svg?'svg':'png'}`);
    if(hash(original)!==pinned.sha256 || hash(svg?original:packageOfficialPng(original,pinned.presentation))!==icon.sha256) fail(`Invalid packaged official artwork: ${icon.id}`);
  }
  const png=official && officialIcons[icon.id].format!=='svg' && !officialIcons[icon.id].presentation;
  if(icon.asset !== `icons/${icon.id}.${png?'png':'svg'}`) fail(`Invalid asset path: ${icon.id}`);
  const svg=await readFile(`assets/${icon.asset}`,png?undefined:'utf8');
  if(hash(svg)!==icon.sha256) fail(`Checksum mismatch: ${icon.id}`);
  const size=png?inspectPng(svg):inspectSvg(svg);
  if(size.width!==icon.width || size.height!==icon.height) fail(`Dimension mismatch: ${icon.id}`);
}
for(const c of categories) if(!catalog.icons.some(i=>i.category===c.id)) fail(`Empty category: ${c.id}`);
for(const id of Object.keys(sources)) if((await readFile(`licenses/${id}-LICENSE.txt`,'utf8')).length<100) fail(`Missing license: ${id}`);
console.log(`Validated ${ids.size} unique icons, ${categories.length} categories, SVG/PNG safety, hashes and provenance.`);
