import './style.css';
import { messages, type Locale } from './i18n';
import { filterIcons, drawioUrl, isLocalSite, resolveCategory, libraryPaths } from './catalog.mjs';

// Vite binds the application to the catalog generated for this build.
declare const __CATALOG_FILE__: string;

type Icon = {
  id:string; name:string; aliases:string[]; tags:string[]; category:string; softwareType:string;
  asset:string; homepage:string; repository:string|null;
  source:{id:string;url:string;revision:string;collectionLicense:string;licenseUrl:string;listing?:string;publisher?:string};
};
type Category = {id:string;name:string;nameEn:string;description:string;descriptionEn:string;keywords:string[];count:number;libraries:Record<Locale,string>;libraryRevisions?:Record<Locale,string>};
type Catalog = {version:string;icons:Icon[];categories:Category[];categoryAliases?:Record<string,string>};
const $ = <T extends Element=HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
const esc = (s:unknown) => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const readPreference = (key:string) => {try{return localStorage.getItem(key);}catch{return null;}};
const preference = (key:string,value:string) => {try{localStorage.setItem(key,value);}catch{/* Browsing works without storage. */}};
let locale:Locale = readPreference('icons-locale') === 'en' ? 'en' : readPreference('icons-locale') === 'zh-CN' ? 'zh-CN' : navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
const params = new URLSearchParams(location.search);
let query=params.get('q')??'', activeCategory=params.get('category')??'all', activeType=params.get('type')??'all';
let dark=readPreference('icons-preview')==='dark', limit=72;
let catalog:Catalog;
const selected=new Set<string>();
const siteBase=new URL('./',location.href).href;
const local=isLocalSite(siteBase);
const file=(path:string)=>new URL(path,siteBase).href;
const title=(c:Category)=>locale==='en'?c.nameEn:c.name;
const description=(c:Category)=>locale==='en'?c.descriptionEn:c.description;
const sourceName=(id:string)=>({devicon:'Devicon',dashboard:'Dashboard Icons',antdesign:'Ant Design Icons',vendor:'Vendor Icons SVG','official-apps':messages[locale].officialPublisher} as Record<string,string>)[id]??id;
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
  for(const [key,value] of [['q',query],['category',activeCategory],['type',activeType]]) value && value!=='all'?url.searchParams.set(key,value):url.searchParams.delete(key);
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
function openAllLink(className:string) {
  return `<a class="button ${className}" data-open-all href="${esc(drawioUrl(siteBase,libraryPaths(catalog.categories,locale)))}" target="_blank" rel="noopener noreferrer">${messages[locale].openAll}${svg('external')}</a>`;
}
function renderShell() {
  const t=messages[locale];
  document.documentElement.lang=locale;
  document.title=locale==='en'?'Software Icons — for draw.io':'软件图标合集 — for draw.io';
  const featured=['kubernetes','postgresql','docker','grafana','redis','python','git','react','nginx'];
  $('#app').innerHTML=`
    <a class="skip-link" href="#library">${t.browse}</a>
    <header class="topbar"><a class="brand" href="#" aria-label="Software Icons"><span class="brand-mark">${svg('grid')}</span><span>software<span class="brand-light">icons</span><small>for draw.io</small></span></a>
      <nav aria-label="${locale==='en'?'Main navigation':'主导航'}"><a href="#library">${t.navLibrary}</a><a href="#guide">${t.navGuide}</a><a href="#sources">${t.navSources}</a></nav>
      <button class="language button subtle" id="language">${svg('globe')}${locale==='en'?'中文':'English'}</button>
    </header>
    <main>
      <section class="hero"><div class="hero-copy"><p class="eyebrow"><span></span>${t.eyebrow}</p>
        <h1>${t.hero1}<br><em>${t.hero2}</em></h1><p class="intro">${t.intro}</p>
        <div class="hero-actions">${openAllLink('primary')}<a class="button outline" href="${file('downloads/drawio-software-icons.zip')}" download>${svg('download')}${t.downloadAll}</a></div><p class="open-all-hint">${t.openAllHint}</p>
        <div class="hero-facts"><span><b>${catalog.icons.length}</b> ${t.icons}</span><i></i><span><b>${catalog.categories.length}</b> ${t.categories}</span><i></i><span>${t.vector}</span></div>
      </div><div class="hero-art" aria-hidden="true"><div class="art-label">YOUR STACK, AT A GLANCE</div><div class="art-grid">${featured.map((id,i)=>`<div class="art-tile art-${i}"><img src="${file(`icons/${id}.svg`)}" alt="" width="48" height="48"></div>`).join('')}</div><div class="art-caption"><span class="status-dot"></span>SVG · DRAW.IO · OFFLINE READY</div><span class="art-plus">+</span></div></section>
      <section class="workspace" id="library" aria-label="${t.navLibrary}">
        <aside class="sidebar"><div class="sidebar-top"><span class="eyebrow">${t.library}</span><span class="tiny-pill">${catalog.icons.length}</span></div>
          <button class="category-button" data-category="all"><span>${svg('grid')}${t.all}</span><small>${catalog.icons.length}</small></button>
          <p class="category-heading">${t.categoryLabel}</p><div class="category-list">${catalog.categories.map(c=>`<button class="category-button" data-category="${c.id}"><span>${esc(title(c))}</span><small>${c.count}</small></button>`).join('')}</div>
          ${openAllLink('primary open-all-sidebar')}<button class="bundle-button" id="bundle"><span>${svg('grid')} ${t.bundle}</span><small>${t.bundleHint}</small></button>
        </aside>
        <div class="library-main"><div class="search-row"><label class="search-box">${svg('search')}<input id="search" type="search" autocomplete="off" aria-label="${t.searchLabel}" placeholder="${t.search}" value="${esc(query)}"><kbd>/</kbd></label>
          <div class="background-toggle" role="group" aria-label="${t.preview}"><button id="light" aria-label="${t.light}" title="${t.light}" aria-pressed="${!dark}"><span class="light-dot"></span></button><button id="dark" aria-label="${t.dark}" title="${t.dark}" aria-pressed="${dark}"><span class="dark-dot"></span></button></div></div>
          <div class="filter-row" aria-label="${t.softwareType}">${['all','open-source','source-available','commercial','unverified'].map(type=>`<button class="filter-chip" data-type="${type}" aria-pressed="${type===activeType}">${type==='all'?t.allTypes:typeLabel(type)}</button>`).join('')}</div>
          <div class="section-heading"><div><h2 id="category-title"></h2><p id="category-description"></p></div><span id="result-count" class="result-count" role="status" aria-live="polite"></span></div>
          <div id="category-actions" class="category-actions"></div>
          <div class="icon-grid${dark?' dark-preview':''}" id="grid"></div><div id="more" class="more"></div>
        </div>
      </section>
      <section class="guide" id="guide"><p class="eyebrow">FROM LIBRARY TO CANVAS</p><h2>${t.guideTitle}</h2><div class="steps">${[[t.step1,t.step1Text],[t.step2,t.step2Text],[t.step3,t.step3Text]].map(([name,detail],i)=>`<article><span class="step-number">0${i+1}</span><h3>${name}</h3><p>${detail}</p></article>`).join('')}</div><div class="offline-note">${svg('download')}<div><p>${t.guideOffline}</p><p>${t.guideLanguage}</p></div></div></section>
      <section class="sources" id="sources"><div><p class="eyebrow">CLEAR ORIGINS, DEFINED USE</p><h2>${t.sourceTitle}</h2><p>${t.sourceText}</p><p>${t.commercialUse}</p><small>${t.brandNote}</small></div><div class="source-links"><a href="https://github.com/devicons/devicon" target="_blank" rel="noopener noreferrer">Devicon ${svg('external')}</a><a href="https://github.com/homarr-labs/dashboard-icons" target="_blank" rel="noopener noreferrer">Dashboard Icons ${svg('external')}</a><a href="https://github.com/ant-design/ant-design-icons" target="_blank" rel="noopener noreferrer">Ant Design Icons ${svg('external')}</a><a href="https://github.com/bwks/vendor-icons-svg" target="_blank" rel="noopener noreferrer">Vendor Icons SVG ${svg('external')}</a><a href="${file('ICON_USAGE.md')}" target="_blank" rel="noopener noreferrer">${t.usagePolicy} ${svg('external')}</a><a href="${file('THIRD_PARTY_NOTICES.md')}" target="_blank" rel="noopener noreferrer">${t.notices} ${svg('external')}</a></div></section>
    </main><footer><span>${t.footer}<small>${t.footerNote}</small></span><div><a href="${file('README.md')}" target="_blank" rel="noopener noreferrer">${t.englishGuide}</a><a href="${file('README.zh-CN.md')}" target="_blank" rel="noopener noreferrer">${t.chineseGuide}</a><span>v${catalog.version}</span></div></footer>
    <dialog id="detail" aria-labelledby="detail-title"></dialog>
    <dialog id="bundle-dialog" aria-labelledby="bundle-title"></dialog>
    <dialog id="notice" aria-labelledby="notice-title"><button class="dialog-close" data-close="notice" aria-label="${t.close}">${svg('close')}</button><h2 id="notice-title">${t.navGuide}</h2><p id="notice-body"></p><a class="button primary" href="${file('downloads/drawio-software-icons.zip')}" download>${t.downloadAll}</a></dialog>`;
  $('#language').addEventListener('click',()=>{locale=locale==='en'?'zh-CN':'en';preference('icons-locale',locale);renderShell();});
  $<HTMLInputElement>('#search').addEventListener('input',event=>{query=(event.target as HTMLInputElement).value;limit=72;updateUrl();renderResults();});
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.category!;limit=72;updateUrl();renderResults();}));
  document.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(button=>button.addEventListener('click',()=>{activeType=button.dataset.type!;limit=72;updateUrl();renderResults();}));
  for(const theme of ['light','dark']) $('#'+theme).addEventListener('click',()=>{dark=theme==='dark';preference('icons-preview',theme);$('#grid').classList.toggle('dark-preview',dark);$('#light').setAttribute('aria-pressed',String(!dark));$('#dark').setAttribute('aria-pressed',String(dark));});
  $('#bundle').addEventListener('click',showBundle);
  renderResults();
}
function renderResults() {
  const t=messages[locale], c=catalog.categories.find(c=>c.id===activeCategory);
  const results=filterIcons(catalog.icons,catalog.categories,query,activeCategory,activeType) as Icon[];
  results.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  $('#category-title').textContent=c?title(c):t.all;
  $('#category-description').textContent=c?description(c):t.allDescription;
  $('#result-count').textContent=`${results.length} ${t.results}`;
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===activeCategory)));
  document.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===activeType)));
  $('#category-actions').innerHTML=c?`<button class="button small primary" id="open-category">${t.openDrawio}${svg('external')}</button><a class="button small subtle" href="${file(c.libraries[locale])}" download>${svg('download')}${t.downloadLibrary}</a>`:`${openAllLink('small primary')}<a class="button small subtle" href="${file('libraries/all.xml')}" download>${svg('download')}${t.allLibrary}</a>`;
  if(c) $('#open-category').addEventListener('click',()=>openLibraries([c]));
  const grid=$('#grid');
  grid.innerHTML=results.length?results.slice(0,limit).map(icon=>{
    const category=catalog.categories.find(c=>c.id===icon.category)!;
    return `<button class="icon-card" data-icon="${icon.id}" aria-label="${esc(icon.name)} — ${t.details}"><span class="icon-stage"><img src="${file(icon.asset)}" alt="" loading="lazy" width="48" height="48"><span class="card-arrow">${svg('arrow')}</span></span><span class="card-info"><strong>${esc(icon.name)}</strong><small>${esc(title(category))}</small></span><span class="type-dot type-${icon.softwareType}" title="${esc(typeLabel(icon.softwareType))}" aria-label="${esc(typeLabel(icon.softwareType))}"></span></button>`;
  }).join(''):`<div class="empty">${svg('search')}<h3>${t.emptyTitle}</h3><p>${t.emptyText}</p><button id="clear" class="button outline">${t.clear}</button></div>`;
  grid.querySelectorAll<HTMLButtonElement>('[data-icon]').forEach(b=>b.addEventListener('click',()=>showDetail(catalog.icons.find(i=>i.id===b.dataset.icon)!)));
  if(!results.length) $('#clear').addEventListener('click',()=>{query='';activeCategory='all';activeType='all';updateUrl();renderShell();$('#search').focus();});
  $('#more').innerHTML=results.length>limit?`<span>${t.showing} ${limit}${t.of}${results.length}</span><button class="button outline" id="load-more">${t.loadMore}${svg('arrow')}</button>`:'';
  if(results.length>limit) $('#load-more').addEventListener('click',()=>{limit+=72;renderResults();});
}
function showDetail(icon:Icon) {
  const t=messages[locale],c=catalog.categories.find(c=>c.id===icon.category)!;
  const dialog=$<HTMLDialogElement>('#detail');
  dialog.innerHTML=`<button class="dialog-close" data-close="detail" aria-label="${t.close}">${svg('close')}</button><p class="eyebrow">${t.details}</p><div class="detail-art${dark?' dark-preview':''}"><img src="${file(icon.asset)}" width="96" height="96" alt="${esc(icon.name)}"></div><h2 id="detail-title">${esc(icon.name)}</h2><div class="detail-tags"><span>${esc(title(c))}</span><span>${typeLabel(icon.softwareType)}</span></div><div class="detail-actions"><a class="button primary" href="${file(icon.asset)}" download>${svg('download')}${icon.asset.endsWith('.png')?t.downloadPng:t.downloadSvg}</a><a class="button outline" href="${file(c.libraries[locale])}" download>${t.downloadLibrary}</a></div>
    <dl><dt>${t.project}</dt><dd><a href="${esc(icon.homepage)}" target="_blank" rel="noopener noreferrer">${t.project} ↗</a></dd>${icon.repository?`<dt>${t.repository}</dt><dd><a href="${esc(icon.repository)}" target="_blank" rel="noopener noreferrer">${t.repository} ↗</a></dd>`:''}<dt>${t.source}</dt><dd><a href="${esc(icon.source.listing??icon.source.url)}" target="_blank" rel="noopener noreferrer">${esc(sourceName(icon.source.id))} ↗</a></dd>${icon.source.publisher?`<dt>${t.publisher}</dt><dd>${esc(icon.source.publisher)}</dd><dt>${t.sourceLink}</dt><dd><a href="${esc(icon.source.url)}" target="_blank" rel="noopener noreferrer">${t.downloadPng} ↗</a></dd>`:''}<dt>${icon.source.publisher?t.rightsNotice:t.license}</dt><dd><a href="${esc(icon.source.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(icon.source.collectionLicense)} ↗</a></dd><dt>${icon.source.publisher?t.contentPin:t.revision}</dt><dd><code>${esc(icon.source.revision.slice(0,12))}</code></dd></dl><div class="detail-notes">${icon.source.id==='official-apps'?`<p>${t.officialRaster}</p>`:''}${icon.softwareType==='commercial'?`<p>${t.commercialUse} <a href="${file('ICON_USAGE.md')}" target="_blank" rel="noopener noreferrer">${t.usagePolicy} ↗</a></p>`:''}<p>${t.typeNote}</p><p>${t.brandNote}</p></div>`;
  dialog.showModal();
}
function showBundle() {
  const t=messages[locale],dialog=$<HTMLDialogElement>('#bundle-dialog');
  dialog.innerHTML=`<button class="dialog-close" data-close="bundle-dialog" aria-label="${t.close}">${svg('close')}</button><p class="eyebrow">DRAW.IO LIBRARIES</p><h2 id="bundle-title">${t.bundle}</h2><p>${t.bundleHint}</p><div class="bundle-controls"><button class="text-button" id="select-all">${t.selectAll}</button><button class="text-button" id="deselect">${t.deselect}</button></div><div class="bundle-list">${catalog.categories.map(c=>`<label><input type="checkbox" value="${c.id}" ${selected.has(c.id)?'checked':''}><span>${esc(title(c))}</span><small>${c.count}</small></label>`).join('')}</div><div class="bundle-footer"><span id="selected-count" role="status"></span><button id="open-bundle" class="button primary">${t.openDrawio}${svg('external')}</button></div>${local?`<p class="local-note">${t.localNote}</p>`:''}`;
  const refresh=()=>{$('#selected-count').textContent=`${selected.size} ${t.selected}`;$<HTMLButtonElement>('#open-bundle').disabled=selected.size===0;};
  const setAll=(checked:boolean)=>{selected.clear();dialog.querySelectorAll<HTMLInputElement>('input').forEach(i=>{i.checked=checked;if(checked)selected.add(i.value);});refresh();};
  $('#select-all').addEventListener('click',()=>setAll(true));$('#deselect').addEventListener('click',()=>setAll(false));
  dialog.querySelectorAll<HTMLInputElement>('input').forEach(i=>i.addEventListener('change',()=>{i.checked?selected.add(i.value):selected.delete(i.value);refresh();}));
  $('#open-bundle').addEventListener('click',()=>{dialog.close();openLibraries(catalog.categories.filter(c=>selected.has(c.id)));});
  refresh();dialog.showModal();
}
document.addEventListener('click',event=>{
  if(local && (event.target as Element).closest('[data-open-all]')) {event.preventDefault();showNotice();}
  const close=(event.target as Element).closest<HTMLElement>('[data-close]');
  if(close) $<HTMLDialogElement>('#'+close.dataset.close).close();
});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]') || (event.target as Element).matches('input,textarea,select,[contenteditable]'))return;
  if(event.key==='/' || ((event.metaKey||event.ctrlKey)&&event.key==='k')) {event.preventDefault();$('#search')?.focus();}
});
async function init() {
  try {
    const response=await fetch(file(__CATALOG_FILE__));
    if(!response.ok)throw Error(String(response.status));
    catalog=await response.json();
    catalog.categories.forEach(c=>selected.add(c.id));
    activeCategory=resolveCategory(catalog,activeCategory);
    if(!['all','open-source','source-available','commercial','unverified'].includes(activeType))activeType='all';
    renderShell();
  } catch(error) {
    console.error(error);
    $('#app').innerHTML=`<div class="boot"><h1>Software Icons</h1><p>${messages[locale].error}</p><button id="retry" class="button primary">${messages[locale].retry}</button> <a class="button outline" href="${file('downloads/drawio-software-icons.zip')}">${messages[locale].downloadAll}</a></div>`;
    $('#retry').addEventListener('click',()=>location.reload());
  }
}
void init();
