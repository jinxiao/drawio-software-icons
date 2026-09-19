import './style.css';
import { configurationFor, mergeConfiguration } from './configuration.mjs';
import { messages, type Locale } from './i18n';
import { filterIcons, drawioUrl, isLocalSite, resolveCategory, libraryPaths } from './catalog.mjs';
import { searchSpotlight, spotlightLocation, compareIconNames } from './spotlight.mjs';

// Vite binds the application to the catalog generated for this build.
declare const __CATALOG_FILE__: string;

type Icon = {
  id:string; name:string; nameEn?:string; collection:string; categories?:string[]; aliases:string[]; tags:string[]; category:string; softwareType:string;
  asset:string; homepage:string; repository:string|null;
  source:{id:string;variant?:string;url:string;revision:string;collectionLicense:string;licenseUrl:string;listing?:string;publisher?:string};
};
type Category = {id:string;collection:string;configData:string;name:string;nameEn:string;description:string;descriptionEn:string;keywords:string[];count:number;libraries:Record<Locale,string>;libraryRevisions?:Record<Locale,string>};
type Collection = {id:string;name:string;nameEn:string;count:number;allLibrary:string};
type Change = {kind:'added'|'updated'|'removed';collection:string;count?:number;icons:{id:string;name:string}[]};
type UpdateEntry = {id:string;date:string;commit?:string;title:Record<Locale,string>;summary:Record<Locale,string>;changes:Change[]};
type Catalog = {collections:Collection[];version:string;icons:Icon[];categories:Category[];categoryAliases?:Record<string,string>;changelog?:UpdateEntry[]};
const $ = <T extends Element=HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
const esc = (s:unknown) => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const readPreference = (key:string) => {try{return localStorage.getItem(key);}catch{return null;}};
const preference = (key:string,value:string) => {try{localStorage.setItem(key,value);}catch{/* Browsing works without storage. */}};
let locale:Locale = readPreference('icons-locale') === 'en' ? 'en' : readPreference('icons-locale') === 'zh-CN' ? 'zh-CN' : navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
const params = new URLSearchParams(location.search);
let query=params.get('q')??'', activeCategory=params.get('category')??'all', activeType=params.get('type')??'all';
const alibabaEntrypoint=location.pathname.includes('/alibaba-cloud-icons/');
const defaultCollection=alibabaEntrypoint?'alibaba-cloud':'software';
let homepageLoadAll=false;
let loadAllCollections=params.get('collection')==='all';
let activeCollection=loadAllCollections?defaultCollection:(params.get('collection')??defaultCollection);
let dark=readPreference('icons-preview')==='dark', limit=72;
let catalog:Catalog;
let configGeneration=0;
const selected=new Set<string>();
const siteBase=new URL('./',location.href).href;
const local=isLocalSite(siteBase);
const file=(path:string)=>new URL(path,siteBase).href;
const title=(c:Category|Collection):string=>{
  const name=locale==='en'?c.nameEn:c.name;
  return 'collection' in c?`${title(catalog.collections.find(p=>p.id===c.collection)!)} · ${name}`:name;
};
const browseCollection=()=>loadAllCollections?'all':activeCollection;
const visibleCategories=()=>catalog.categories.filter(c=>loadAllCollections||c.collection===activeCollection);
const iconName=(icon:Icon)=>locale==='en'?(icon.nameEn||icon.name):icon.name;
const allLibrary=()=>loadAllCollections?'libraries/combined.xml':catalog.collections.find(c=>c.id===activeCollection)!.allLibrary;
const description=(c:Category)=>locale==='en'?c.descriptionEn:c.description;
const sourceName=(id:string)=>({devicon:'Devicon',dashboard:'Dashboard Icons',lobe:'Lobe Icons',antdesign:'Ant Design Icons',vendor:'Vendor Icons SVG','alibaba-iconfont':'Alibaba Cloud · Iconfont','official-apps':messages[locale].officialPublisher} as Record<string,string>)[id]??id;
const symbols={
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  external:'<path d="M14 3h7v7m0-7L10 14M9 3H3v18h18v-6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
};
const svg=(id:keyof typeof symbols)=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[id]}</svg>`;
function typeLabel(type:string) { const t=messages[locale]; return ({'open-source':t.openSource,'source-available':t.sourceAvailable,commercial:t.commercial,unverified:t.unverified} as Record<string,string>)[type]??t.unverified; }
function updateUrl() {
  const url=new URL(location.href);
  for(const [key,value] of [['q',query],['category',activeCategory],['type',activeType],['collection',browseCollection()]]) value && (value!=='all'||key==='collection')?url.searchParams.set(key,value):url.searchParams.delete(key);
  history.replaceState(null,'',url);
}
function openLibraries(categories:Category[]) {
  if(local){showNotice();return;}
  window.open(drawioUrl(siteBase,libraryPaths(categories,locale)),'_blank','noopener,noreferrer');
}
function showNotice() {
  const t=messages[locale];
  $('#notice-body').textContent=t.localNote;
  $<HTMLDialogElement>('#notice').showModal();
}
function allCollectionsCheckbox() {
  return `<label class="load-all-toggle"><input type="checkbox" data-load-all ${homepageLoadAll?'checked':''}><span>${messages[locale].loadAll}</span></label>`;
}
function resetSelectionToScope() {
  selected.clear();visibleCategories().forEach(c=>selected.add(c.id));
}
function openAllLink(className:string) {
  return `<a class="button ${className}" data-open-all href="${esc(drawioUrl(siteBase,libraryPaths(visibleCategories(),locale)))}" target="_blank" rel="noopener noreferrer">${messages[locale].openDrawio}${svg('external')}</a>`;
}
function homepageLoadLink() {
  // Homepage loading is independent of sidebar browsing and category selection.
  const all=!alibabaEntrypoint||homepageLoadAll;
  const categories=all?catalog.categories:catalog.categories.filter(c=>c.collection==='alibaba-cloud');
  const label=all?messages[locale].openEveryCollection:messages[locale].openAll.replace('{collection}',title(catalog.collections.find(c=>c.id==='alibaba-cloud')!));
  return `<a class="button primary" data-open-all href="${esc(drawioUrl(siteBase,libraryPaths(categories,locale)))}" target="_blank" rel="noopener noreferrer">${esc(label)}${svg('external')}</a>`;
}
function renderLatestUpdate() {
  const latest=catalog.changelog?.[0];
  if(!latest)return '';
  const t=messages[locale];
  const counts={added:0,updated:0,removed:0};
  for(const group of latest.changes)counts[group.kind]+=group.count??group.icons.length;
  const labels={added:t.bannerAdded,updated:t.bannerUpdated,removed:t.bannerRemoved};
  const summary=(Object.keys(counts) as Change['kind'][]).filter(kind=>counts[kind]>0)
    .map(kind=>labels[kind].replace('{count}',String(counts[kind]))).join(' · ');
  const refs=[...new Map(latest.changes.flatMap(group=>group.icons.map(icon=>[icon.id,{...icon,kind:group.kind}] as const))).values()].slice(0,4);
  return `<aside class="home-updates" aria-labelledby="latest-update-title"><div class="home-update-meta"><span>${t.latestUpdate}</span><time datetime="${esc(latest.date)}">${esc(latest.date)}</time></div><h2 id="latest-update-title">${esc(latest.title[locale])}</h2>${summary?`<p class="home-update-count">${esc(summary)}</p>`:''}<div class="home-update-icons">${refs.map(ref=>{
    const icon=catalog.icons.find(i=>i.id===ref.id);
    return icon && ref.kind!=='removed'?`<button data-update-icon="${esc(ref.id)}" title="${t.locateCurrentIcon}: ${esc(ref.name)}"><img src="${file(icon.asset)}" width="24" height="24" alt=""><span>${esc(ref.name)}</span>${svg('arrow')}</button>`:`<span>${esc(ref.name)}</span>`;
  }).join('')}</div><a class="home-update-link" href="#changelog">${t.viewChangelog}${svg('arrow')}</a></aside>`;
}
function renderChangelog() {
  const t=messages[locale],history=catalog.changelog??[],icons=new Map(catalog.icons.map(i=>[i.id,i]));
  const labels={added:t.changeAdded,updated:t.changeUpdated,removed:t.changeRemoved};
  const record=(entry:UpdateEntry,index:number)=>`<details class="update-entry" ${index===0?'open':''}><summary><time datetime="${esc(entry.date)}">${esc(entry.date)}</time><strong>${esc(entry.title[locale])}</strong><span class="update-counts">${entry.changes.map(group=>`<span class="change-${group.kind}">${labels[group.kind]} ${group.count??group.icons.length}</span>`).join('')}</span></summary><div class="update-body"><p>${esc(entry.summary[locale])}</p>${entry.changes.map(group=>`<div class="update-group"><h3>${labels[group.kind]} · ${esc(title(catalog.collections.find(c=>c.id===group.collection)!))} <small>${group.count??group.icons.length}</small></h3><div class="update-icons">${group.icons.map(ref=>{
    const icon=icons.get(ref.id);
    return icon && group.kind!=='removed'?`<button class="update-icon" data-update-icon="${esc(ref.id)}" title="${t.locateCurrentIcon}"><img src="${file(icon.asset)}" alt="" width="20" height="20" loading="lazy">${esc(ref.name)}</button>`:`<span class="update-icon removed">${esc(ref.name)}</span>`;
  }).join('')}</div>${!group.icons.length?`<p>${t.collectionImport}</p><button class="button outline small" data-update-collection="${esc(group.collection)}">${t.browse}</button>`:''}</div>`).join('')}${entry.commit?`<a class="update-commit" href="https://github.com/jinxiao/drawio-software-icons/commit/${entry.commit}" target="_blank" rel="noopener noreferrer">${t.viewChange}${svg('external')}</a>`:''}</div></details>`;
  return `<section class="updates" id="changelog" aria-labelledby="updates-title"><div class="updates-heading"><div><p class="eyebrow">${t.changelogEyebrow}</p><h2 id="updates-title">${t.changelog}</h2><p>${t.changelogIntro}</p></div><a class="button outline small" href="${file(locale==='en'?'CHANGELOG.md':'CHANGELOG.zh-CN.md')}" download>${svg('download')}${t.downloadChangelog}</a></div><div class="update-list">${history.slice(0,3).map(record).join('')}${history.length>3?`<details class="update-history"><summary>${t.olderUpdates} (${history.length-3})</summary>${history.slice(3).map((entry,i)=>record(entry,i+3)).join('')}</details>`:''}</div></section>`;
}
function renderShell() {
  const t=messages[locale];
  document.documentElement.lang=locale;
  document.title=locale==='en'?'Architecture Icons — for draw.io':'架构图标合集 — for draw.io';
  $('#app').innerHTML=`
    <a class="skip-link" href="#library">${t.browse}</a>
    <header class="topbar"><a class="brand" href="#" aria-label="Architecture Icons"><span class="brand-mark">${svg('grid')}</span><span>architecture<span class="brand-light">icons</span><small>for draw.io</small></span></a>
      <nav aria-label="${locale==='en'?'Main navigation':'主导航'}"><a href="#library">${t.navLibrary}</a><a href="#changelog">${t.changelog}</a><a href="#guide">${t.navGuide}</a></nav>
      <div class="topbar-actions"><button class="language button subtle" id="language">${svg('globe')}${locale==='en'?'中文':'English'}</button></div>
    </header>
    <main>
      <section class="home-overview" aria-labelledby="home-title">
        <div class="home-intro"><p class="eyebrow"><span></span>${t.eyebrow}</p><h1 id="home-title">${t.hero1}<br><em>${t.hero2}</em></h1><p>${t.homeIntro}</p></div>
        <div class="home-search"><button class="home-search-trigger" id="home-search" aria-haspopup="dialog" aria-controls="spotlight" aria-keyshortcuts="/ Control+k Meta+k">${svg('search')}<span>${t.homeSearch}</span><kbd>/</kbd></button><div class="home-search-caption"><span>${t.homeSearchScope.replace('{count}',catalog.icons.length.toLocaleString(locale))}</span><a href="#library">${t.browse}${svg('arrow')}</a></div></div>
        ${renderLatestUpdate()}
        <div class="home-actions">${alibabaEntrypoint?allCollectionsCheckbox():''}<div class="home-primary-actions">${homepageLoadLink()}<button class="button outline" id="bundle">${svg('grid')}${t.bundle}</button></div><p class="home-load-hint">${alibabaEntrypoint?t.alibabaLoadHint:t.homeLoadShort}</p></div>
      </section>
      <div class="home-tools"><span>${catalog.categories.length} ${t.categories} <span aria-hidden="true">·</span> ${t.vector}</span><div><a href="${file('downloads/drawio-icons.zip')}" download>${svg('download')}${t.downloadAll}</a><a href="https://github.com/jinxiao/drawio-software-icons/issues/new/choose" target="_blank" rel="noopener noreferrer">${t.requestChange}${svg('external')}</a><a href="https://github.com/jinxiao/drawio-software-icons/compare" target="_blank" rel="noopener noreferrer">${t.submitPr}${svg('external')}</a></div></div>
      <section class="workspace" id="library" aria-label="${t.navLibrary}">
        <aside class="sidebar"><div class="sidebar-top"><span class="eyebrow">${t.library}</span><span class="tiny-pill">${catalog.icons.length}</span></div>
          <section class="sidebar-group" aria-labelledby="collection-heading">
            <h2 class="category-heading" id="collection-heading">${t.collectionLabel}</h2>
            <div class="collection-list"><button class="category-button" data-collection="all" aria-pressed="${loadAllCollections}"><span>${t.allCollections}</span><small>${catalog.icons.length}</small></button>${[...catalog.collections].sort((a,b)=>Number(b.id==='alibaba-cloud')-Number(a.id==='alibaba-cloud')).map(c=>`<button class="category-button" data-collection="${c.id}" aria-pressed="${browseCollection()===c.id}"><span>${esc(title(c))}</span><small>${c.count}</small></button>`).join('')}</div>
          </section>
          <section class="sidebar-group category-group" aria-labelledby="category-heading">
            <h2 class="category-heading" id="category-heading">${t.categoryLabel}<span>${loadAllCollections?t.allCollections:esc(title(catalog.collections.find(c=>c.id===activeCollection)!))}</span></h2>
            <div class="category-list"><button class="category-button" data-category="all"><span>${svg('grid')}${t.all}</span><small>${loadAllCollections?catalog.icons.length:catalog.collections.find(c=>c.id===activeCollection)!.count}</small></button>${visibleCategories().map(c=>`<button class="category-button" data-category="${c.id}"><span>${esc(title(c))}</span><small>${c.count}</small></button>`).join('')}</div>
          </section>
          ${openAllLink('primary open-all-sidebar')}
        </aside>
        <div class="library-main"><div class="library-toolbar"><div class="filter-row" aria-label="${t.softwareType}">${['all','open-source','source-available','commercial','unverified'].map(type=>`<button class="filter-chip" data-type="${type}" aria-pressed="${type===activeType}">${type==='all'?t.allTypes:typeLabel(type)}</button>`).join('')}</div>
          <div class="background-toggle" role="group" aria-label="${t.preview}"><button id="light" aria-label="${t.light}" title="${t.light}" aria-pressed="${!dark}"><span class="light-dot"></span></button><button id="dark" aria-label="${t.dark}" title="${t.dark}" aria-pressed="${dark}"><span class="dark-dot"></span></button></div></div>
          <div id="query-filter" class="query-filter" hidden></div>
          <div class="section-heading"><div><h2 id="category-title" tabindex="-1"></h2><p id="category-description"></p></div><span id="result-count" class="result-count" role="status" aria-live="polite"></span></div>
          <div id="category-actions" class="category-actions"></div>
          <div class="icon-grid${dark?' dark-preview':''}" id="grid"></div><div id="more" class="more"></div>
        </div>
      </section>
      ${renderChangelog()}
      <section class="guide" id="guide"><p class="eyebrow">FROM LIBRARY TO CANVAS</p><h2>${t.guideTitle}</h2><div class="steps">${[[t.step1,t.step1Text],[t.step2,t.step2Text],[t.step3,t.step3Text]].map(([name,detail],i)=>`<article><span class="step-number">0${i+1}</span><h3>${name}</h3><p>${detail}</p></article>`).join('')}</div><div class="offline-note">${svg('download')}<div><p>${t.guideOffline}</p><p>${t.guideLanguage}</p></div></div></section>
      <section class="sources" id="sources"><div><p class="eyebrow">CLEAR ORIGINS, DEFINED USE</p><h2>${t.sourceTitle}</h2><p>${t.sourceText}</p><p>${t.commercialUse}</p><small>${t.brandNote}</small></div><div class="source-links"><a href="${file('compat/alibaba-cloud/NOTICE.md')}" target="_blank" rel="noopener noreferrer">Alibaba Cloud · Iconfont ${svg('external')}</a><a href="https://github.com/devicons/devicon" target="_blank" rel="noopener noreferrer">Devicon ${svg('external')}</a><a href="https://github.com/homarr-labs/dashboard-icons" target="_blank" rel="noopener noreferrer">Dashboard Icons ${svg('external')}</a><a href="https://github.com/lobehub/lobe-icons" target="_blank" rel="noopener noreferrer">Lobe Icons ${svg('external')}</a><a href="https://github.com/ant-design/ant-design-icons" target="_blank" rel="noopener noreferrer">Ant Design Icons ${svg('external')}</a><a href="https://github.com/bwks/vendor-icons-svg" target="_blank" rel="noopener noreferrer">Vendor Icons SVG ${svg('external')}</a><a href="${file('ICON_USAGE.md')}" target="_blank" rel="noopener noreferrer">${t.usagePolicy} ${svg('external')}</a><a href="${file('THIRD_PARTY_NOTICES.md')}" target="_blank" rel="noopener noreferrer">${t.notices} ${svg('external')}</a></div></section>
    </main><footer><span>${t.footer}<small>${t.footerNote}</small></span><div><a href="#changelog">${t.changelog}</a><a href="${file('guides/README.md')}" target="_blank" rel="noopener noreferrer">${t.englishGuide}</a><a href="${file('guides/README.zh-CN.md')}" target="_blank" rel="noopener noreferrer">${t.chineseGuide}</a><span>v${catalog.version}</span></div></footer>
    <dialog id="detail" aria-labelledby="detail-title"></dialog>
    <dialog id="spotlight" aria-label="${t.quickSearch}"></dialog>
    <dialog id="bundle-dialog" aria-labelledby="bundle-title"></dialog>
    <dialog id="notice" aria-labelledby="notice-title"><button class="dialog-close" data-close="notice" aria-label="${t.close}">${svg('close')}</button><h2 id="notice-title">${t.navGuide}</h2><p id="notice-body"></p><a class="button primary" href="${file('downloads/drawio-icons.zip')}" download>${t.downloadAll}</a></dialog>`;
  $('#language').addEventListener('click',()=>{locale=locale==='en'?'zh-CN':'en';preference('icons-locale',locale);renderShell();});
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.category!;limit=72;updateUrl();renderResults();}));
  document.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(button=>button.addEventListener('click',()=>{activeType=button.dataset.type!;limit=72;updateUrl();renderResults();}));
  for(const theme of ['light','dark']) $('#'+theme).addEventListener('click',()=>{dark=theme==='dark';preference('icons-preview',theme);$('#grid').classList.toggle('dark-preview',dark);$('#light').setAttribute('aria-pressed',String(!dark));$('#dark').setAttribute('aria-pressed',String(dark));});
  $('#bundle').addEventListener('click',showBundle);
  $('#home-search').addEventListener('click',showSpotlight);
  document.querySelectorAll<HTMLButtonElement>('[data-collection]').forEach(button=>button.addEventListener('click',()=>{
    const collection=button.dataset.collection!;
    loadAllCollections=collection==='all';
    if(!loadAllCollections)activeCollection=collection;
    activeCategory='all';limit=72;resetSelectionToScope();updateUrl();renderShell();
    document.querySelector<HTMLButtonElement>(`[data-collection="${collection}"]`)?.focus();
  }));
  document.querySelectorAll<HTMLInputElement>('[data-load-all]').forEach(input=>input.addEventListener('change',()=>{
    homepageLoadAll=input.checked;renderShell();
    document.querySelector<HTMLInputElement>('[data-load-all]')?.focus();
  }));
  renderResults();
}
function renderResults() {
  const t=messages[locale], c=catalog.categories.find(c=>c.id===activeCategory);
  const results=filterIcons(catalog.icons,catalog.categories,query,activeCategory,activeType,browseCollection()) as Icon[];
  results.sort(compareIconNames);
  $('#category-title').textContent=c?title(c):loadAllCollections?t.allIcons:title(catalog.collections.find(c=>c.id===activeCollection)!);
  $('#category-description').textContent=c?description(c):t.allDescription;
  $('#result-count').textContent=`${results.length} ${t.results}`;
  const queryFilter=$('#query-filter');
  queryFilter.hidden=!query;
  queryFilter.innerHTML=query?`<span>${t.searchLabel}: <strong>${esc(query)}</strong></span><button class="text-button" id="clear-query">${t.clear}${svg('close')}</button>`:'';
  if(query)$('#clear-query').addEventListener('click',()=>{query='';limit=72;updateUrl();renderResults();$('#category-title').focus({preventScroll:true});});
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===activeCategory)));
  document.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===activeType)));
  $('#category-actions').innerHTML=c?`<button class="button small primary" id="open-category">${t.openDrawio}${svg('external')}</button><a class="button small subtle" href="${file(c.libraries[locale])}" download>${svg('download')}${t.downloadLibrary}</a>`:`${openAllLink('small primary')}<a class="button small subtle" href="${file(allLibrary())}" download>${svg('download')}${t.allLibrary}</a>`;
  if(c) $('#open-category').addEventListener('click',()=>openLibraries([c]));
  const grid=$('#grid');
  grid.innerHTML=results.length?results.slice(0,limit).map(icon=>{
    const category=catalog.categories.find(c=>c.id===icon.category)!;
    return `<button class="icon-card" data-icon="${icon.id}" aria-label="${esc(iconName(icon))} — ${t.details}"><span class="icon-stage"><img src="${file(icon.asset)}" alt="" loading="lazy" width="48" height="48"><span class="card-arrow">${svg('arrow')}</span></span><span class="card-info"><strong>${esc(iconName(icon))}</strong><small>${esc(title(category))}</small></span><span class="type-dot type-${icon.softwareType}" title="${esc(typeLabel(icon.softwareType))}" aria-label="${esc(typeLabel(icon.softwareType))}"></span></button>`;
  }).join(''):`<div class="empty">${svg('search')}<h3>${t.emptyTitle}</h3><p>${t.emptyText}</p><button id="clear" class="button outline">${t.clear}</button></div>`;
  grid.querySelectorAll<HTMLButtonElement>('[data-icon]').forEach(b=>b.addEventListener('click',()=>showDetail(catalog.icons.find(i=>i.id===b.dataset.icon)!)));
  if(!results.length) $('#clear').addEventListener('click',()=>{query='';activeCategory='all';activeType='all';loadAllCollections=true;resetSelectionToScope();updateUrl();renderShell();$('#category-title').focus({preventScroll:true});});
  $('#more').innerHTML=results.length>limit?`<span>${t.showing} ${limit}${t.of}${results.length}</span><button class="button outline" id="load-more">${t.loadMore}${svg('arrow')}</button>`:'';
  if(results.length>limit) $('#load-more').addEventListener('click',()=>{limit+=72;renderResults();});
}
function locateIcon(icon:Icon) {
  const destination=spotlightLocation(catalog.icons,catalog.categories,icon.id);
  if(!destination)return;
  $<HTMLDialogElement>('#spotlight').close();
  activeCollection=destination.collection;activeCategory=destination.category;
  loadAllCollections=false;activeType='all';query='';limit=destination.limit;
  updateUrl();
  if(location.hash==='#changelog')history.replaceState(null,'',location.pathname+location.search+'#library');
  renderShell();
  const card=document.querySelector<HTMLButtonElement>(`[data-icon="${CSS.escape(icon.id)}"]`);
  if(card) {
    card.classList.add('icon-located');
    card.focus({preventScroll:true});
    card.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    setTimeout(()=>card.classList.remove('icon-located'),3000);
  }
}
function showSpotlight() {
  if(!catalog || document.querySelector('dialog[open]'))return;
  const t=messages[locale],dialog=$<HTMLDialogElement>('#spotlight');
  dialog.innerHTML=`<div class="spotlight-search">${svg('search')}<input id="spotlight-input" type="text" role="combobox" aria-label="${t.quickSearch}" aria-autocomplete="list" aria-expanded="true" aria-controls="spotlight-results" aria-describedby="spotlight-scope" placeholder="${t.spotlightPlaceholder}" autocomplete="off" spellcheck="false" autofocus><button class="spotlight-close" data-close="spotlight" aria-label="${t.close}"><kbd>Esc</kbd></button></div><p id="spotlight-scope" class="spotlight-scope">${t.spotlightScope}</p><div id="spotlight-results" role="listbox" aria-label="${t.spotlightResults}"></div><p id="spotlight-status" class="spotlight-status" role="status" aria-live="polite"></p><div class="spotlight-help"><span><kbd>↑</kbd><kbd>↓</kbd> ${t.spotlightMove}</span><span><kbd>↵</kbd> ${t.spotlightLocate}</span><span><kbd>Esc</kbd> ${t.close}</span></div>`;
  const input=$<HTMLInputElement>('#spotlight-input'),list=$('#spotlight-results');
  let matches:Icon[]=[],active=-1;
  const select=(index:number,scroll=false)=>{
    active=index;
    list.querySelectorAll<HTMLElement>('[role="option"]').forEach((row,i)=>row.setAttribute('aria-selected',String(i===active)));
    if(active<0){input.removeAttribute('aria-activedescendant');return;}
    input.setAttribute('aria-activedescendant',`spotlight-option-${active}`);
    if(scroll)document.getElementById(`spotlight-option-${active}`)?.scrollIntoView({block:'nearest'});
  };
  const render=()=>{
    const results=searchSpotlight(catalog.icons,catalog.categories,input.value) as Icon[];
    matches=results.slice(0,40);
    list.innerHTML=matches.map((icon,index)=>{
      const category=catalog.categories.find(c=>c.id===icon.category)!;
      return `<div id="spotlight-option-${index}" class="spotlight-option" role="option" aria-selected="false" data-result="${index}"><span class="spotlight-art${dark?' dark-preview':''}"><img src="${file(icon.asset)}" width="32" height="32" alt=""></span><span class="spotlight-label"><strong>${esc(iconName(icon))}</strong><small>${esc(title(category))}</small></span><span class="spotlight-enter" aria-hidden="true">↵</span></div>`;
    }).join('');
    $('#spotlight-status').textContent=results.length?`${results.length} ${t.results}${results.length>matches.length?` · ${t.spotlightLimit.replace('{count}',String(matches.length))}`:''}`:t.spotlightEmpty;
    list.scrollTop=0;select(matches.length?0:-1);
  };
  input.addEventListener('input',render);
  input.addEventListener('keydown',event=>{
    if(event.isComposing || event.keyCode===229)return;
    if(event.key==='ArrowDown' || event.key==='ArrowUp') {
      event.preventDefault();
      if(matches.length)select((active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length,true);
    } else if(event.key==='Enter') {
      event.preventDefault();if(matches[active])locateIcon(matches[active]);
    }
  });
  list.addEventListener('click',event=>{
    const row=(event.target as Element).closest<HTMLElement>('[data-result]');
    if(row && matches[Number(row.dataset.result)])locateIcon(matches[Number(row.dataset.result)]);
  });
  // Keep keyboard focus in the combobox when clicking a result.
  list.addEventListener('mousedown',event=>{
    if((event.target as Element).closest('[data-result]'))event.preventDefault();
  });
  dialog.onclick=event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom)dialog.close();
  };
  render();dialog.showModal();input.focus();
}
function showDetail(icon:Icon) {
  const t=messages[locale],c=catalog.categories.find(c=>c.id===icon.category)!;
  const dialog=$<HTMLDialogElement>('#detail');
  dialog.innerHTML=`<button class="dialog-close" data-close="detail" aria-label="${t.close}">${svg('close')}</button><p class="eyebrow">${t.details}</p><div class="detail-art${dark?' dark-preview':''}"><img src="${file(icon.asset)}" width="96" height="96" alt="${esc(iconName(icon))}"></div><h2 id="detail-title">${esc(iconName(icon))}</h2><div class="detail-tags"><span>${esc(title(c))}</span><span>${typeLabel(icon.softwareType)}</span></div><div class="detail-actions"><a class="button primary" href="${file(icon.asset)}" download>${svg('download')}${icon.asset.endsWith('.png')?t.downloadPng:t.downloadSvg}</a><a class="button outline" href="${file(c.libraries[locale])}" download>${t.downloadLibrary}</a></div>
    <dl><dt>${t.project}</dt><dd><a href="${esc(icon.homepage)}" target="_blank" rel="noopener noreferrer">${t.project} ↗</a></dd>${icon.repository?`<dt>${t.repository}</dt><dd><a href="${esc(icon.repository)}" target="_blank" rel="noopener noreferrer">${t.repository} ↗</a></dd>`:''}<dt>${t.source}</dt><dd><a href="${esc(icon.source.listing??icon.source.url)}" target="_blank" rel="noopener noreferrer">${esc(sourceName(icon.source.id))} ↗</a></dd>${icon.source.publisher?`<dt>${t.publisher}</dt><dd>${esc(icon.source.publisher)}</dd><dt>${t.sourceLink}</dt><dd><a href="${esc(icon.source.url)}" target="_blank" rel="noopener noreferrer">${icon.source.variant==='official-svg'?t.downloadSvg:t.downloadPng} ↗</a></dd>`:''}<dt>${icon.source.publisher?t.rightsNotice:t.license}</dt><dd><a href="${esc(file(icon.source.licenseUrl))}" target="_blank" rel="noopener noreferrer">${esc(icon.source.collectionLicense)} ↗</a></dd><dt>${icon.source.publisher?t.contentPin:t.revision}</dt><dd><code>${esc(icon.source.revision.slice(0,12))}</code></dd></dl><div class="detail-notes">${icon.source.id==='official-apps' && icon.source.variant!=='official-svg'?`<p>${t.officialRaster}</p>`:''}${icon.softwareType==='commercial'?`<p>${t.commercialUse} <a href="${file('ICON_USAGE.md')}" target="_blank" rel="noopener noreferrer">${t.usagePolicy} ↗</a></p>`:''}<p>${t.typeNote}</p><p>${t.brandNote}</p></div>`;
  dialog.showModal();
}
function showBundle() {
  configGeneration++;
  const t=messages[locale],dialog=$<HTMLDialogElement>('#bundle-dialog');
  dialog.innerHTML=`<button class="dialog-close" data-close="bundle-dialog" aria-label="${t.close}">${svg('close')}</button><p class="eyebrow">DRAW.IO LIBRARIES</p><h2 id="bundle-title">${t.bundle}</h2><p>${t.bundleHint}</p><div class="bundle-controls"><label class="load-all-toggle"><input type="checkbox" id="bundle-all"><span>${t.loadAll}</span></label><button class="text-button" id="deselect">${t.deselect}</button></div><div class="bundle-list">${catalog.categories.map(c=>`<label><input type="checkbox" value="${c.id}" ${selected.has(c.id)?'checked':''}><span>${esc(title(c))}</span><small>${c.count}</small></label>`).join('')}</div><div class="bundle-footer"><span id="selected-count" role="status"></span><button id="open-bundle" class="button primary">${t.openDrawio}${svg('external')}</button></div><section class="config-export"><h3>${t.desktopConfig}</h3><p>${t.configInstructions}</p><p>${t.configReplacement}</p><label for="existing-config">${t.existingConfig}</label><textarea id="existing-config" rows="4" spellcheck="false" placeholder="{}"></textarea><label class="config-file">${t.importConfig}<input id="config-file" type="file" accept=".json,application/json"></label><button id="generate-config" class="button outline">${t.generateConfig}</button><p id="config-status" role="status" aria-live="polite"></p><textarea id="config-output" rows="4" readonly aria-label="${t.generatedConfig}" hidden></textarea><div class="config-actions"><button id="copy-config" class="button primary" disabled>${t.copyConfig}</button><button id="download-config" class="button outline" disabled>${t.downloadConfig}</button></div></section>${local?`<p class="local-note">${t.localNote}</p>`:''}`;
  const invalidate=()=>{for(const id of ['copy-config','download-config']) $<HTMLButtonElement>('#'+id).disabled=true;$<HTMLTextAreaElement>('#config-output').value='';$('#config-output').hidden=true;$('#config-status').textContent='';};
  const refresh=()=>{invalidate();const all=$<HTMLInputElement>('#bundle-all');all.checked=selected.size===catalog.categories.length;all.indeterminate=selected.size>0&&!all.checked;$<HTMLButtonElement>('#generate-config').disabled=selected.size===0;$('#selected-count').textContent=`${selected.size} ${t.selected}`;$<HTMLButtonElement>('#open-bundle').disabled=selected.size===0;};
  const setAll=(checked:boolean)=>{selected.clear();dialog.querySelectorAll<HTMLInputElement>('.bundle-list input').forEach(i=>{i.checked=checked;if(checked)selected.add(i.value);});refresh();};
  $('#bundle-all').addEventListener('change',event=>{configGeneration++;setAll((event.target as HTMLInputElement).checked);});$('#deselect').addEventListener('click',()=>setAll(false));
  dialog.querySelectorAll<HTMLInputElement>('.bundle-list input').forEach(i=>i.addEventListener('change',()=>{i.checked?selected.add(i.value):selected.delete(i.value);refresh();}));
  $('#open-bundle').addEventListener('click',()=>{dialog.close();openLibraries(catalog.categories.filter(c=>selected.has(c.id)));});
  dialog.addEventListener('close',()=>configGeneration++,{once:true});
  const dirty=()=>{configGeneration++;invalidate();$<HTMLButtonElement>('#generate-config').disabled=selected.size===0;};
  $('#existing-config').addEventListener('input',dirty);
  dialog.querySelectorAll<HTMLInputElement>('.bundle-list input').forEach(i=>i.addEventListener('change',()=>configGeneration++));
  $('#deselect').addEventListener('click',()=>configGeneration++);
  $('#config-file').addEventListener('change',async event=>{
    const imported=(event.target as HTMLInputElement).files?.[0];
    if(imported){$<HTMLTextAreaElement>('#existing-config').value=await imported.text();dirty();}
  });
  $('#generate-config').addEventListener('click',async()=>{
    const version=++configGeneration, ids=[...selected];
    invalidate();$('#config-status').textContent=t.configLoading;
    $<HTMLButtonElement>('#generate-config').disabled=true;
    try {
      const text=$<HTMLTextAreaElement>('#existing-config').value.trim();
      const existing=text?JSON.parse(text):{};
      const payloads=Object.fromEntries(await Promise.all(catalog.categories.filter(c=>ids.includes(c.id)).map(async c=>{
        const response=await fetch(file(c.configData));
        if(!response.ok)throw Error(String(response.status));
        return [c.id,await response.json()];
      })));
      const result=mergeConfiguration(existing,configurationFor(catalog,ids,payloads,locale));
      if(version!==configGeneration)return;
      const output=$<HTMLTextAreaElement>('#config-output');output.value=JSON.stringify(result,null,2);output.hidden=false;
      $('#config-status').textContent=t.configReady;
      for(const id of ['copy-config','download-config']) $<HTMLButtonElement>('#'+id).disabled=false;
    } catch(error) {if(version===configGeneration)$('#config-status').textContent=t.configError+' '+(error instanceof Error?error.message:String(error));}
    finally {if(version===configGeneration)$<HTMLButtonElement>('#generate-config').disabled=selected.size===0;}
  });
  $('#copy-config').addEventListener('click',async()=>{
    const output=$<HTMLTextAreaElement>('#config-output');
    try {await navigator.clipboard.writeText(output.value);$('#config-status').textContent=t.configCopied;}
    catch {output.focus();output.select();$('#config-status').textContent=t.configCopyFallback;}
  });
  $('#download-config').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([$<HTMLTextAreaElement>('#config-output').value],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='drawio-icons-configuration.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  refresh();dialog.showModal();
}
document.addEventListener('click',event=>{
  const updateIcon=(event.target as Element).closest<HTMLElement>('[data-update-icon]');
  if(updateIcon){const icon=catalog.icons.find(i=>i.id===updateIcon.dataset.updateIcon);if(icon)locateIcon(icon);return;}
  const updateCollection=(event.target as Element).closest<HTMLElement>('[data-update-collection]');
  if(updateCollection){activeCollection=updateCollection.dataset.updateCollection!;loadAllCollections=false;activeCategory='all';activeType='all';query='';limit=72;updateUrl();history.replaceState(null,'',location.pathname+location.search+'#library');renderShell();$('#category-title').focus({preventScroll:true});$('#library').scrollIntoView();return;}
  if(local && (event.target as Element).closest('[data-open-all]')) {event.preventDefault();showNotice();}
  const close=(event.target as Element).closest<HTMLElement>('[data-close]');
  if(close) $<HTMLDialogElement>('#'+close.dataset.close).close();
});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented || event.repeat || event.isComposing || event.keyCode===229 || document.querySelector('dialog[open]') || (event.target as Element).closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
  const slash=event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey;
  const commandK=(event.metaKey||event.ctrlKey)&&!event.altKey&&event.key.toLowerCase()==='k';
  if(slash || commandK) {event.preventDefault();showSpotlight();}
});
async function init() {
  try {
    const response=await fetch(file(__CATALOG_FILE__));
    if(!response.ok)throw Error(String(response.status));
    catalog=await response.json();
    if(!catalog.collections.some(c=>c.id===activeCollection))activeCollection=defaultCollection;
    activeCategory=resolveCategory(catalog,activeCategory);
    if(activeCategory!=='all'&&!loadAllCollections)activeCollection=catalog.categories.find(c=>c.id===activeCategory)!.collection;
    visibleCategories().forEach(c=>selected.add(c.id));
    if(!['all','open-source','source-available','commercial','unverified'].includes(activeType))activeType='all';
    renderShell();
    if(location.hash==='#changelog')$('#changelog').scrollIntoView();
  } catch(error) {
    console.error(error);
    $('#app').innerHTML=`<div class="boot"><h1>Software Icons</h1><p>${messages[locale].error}</p><button id="retry" class="button primary">${messages[locale].retry}</button> <a class="button outline" href="${file('downloads/drawio-icons.zip')}">${messages[locale].downloadAll}</a></div>`;
    $('#retry').addEventListener('click',()=>location.reload());
  }
}
void init();
