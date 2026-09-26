import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { messages, type Locale } from './i18n';
import { drawioUrl, filterIcons, isLocalSite, libraryPaths, resolveCategory } from './catalog.mjs';
import { compareIconNames, spotlightLocation } from './spotlight.mjs';
import type { Catalog, Category, Collection, Icon } from './types';

export const siteBase=new URL('./',globalThis.location?.href ?? 'https://icons.rambow.cloud/').href;
export const file=(path:string)=>new URL(path,siteBase).href;
export const starRepository='jinxiao/drawio-software-icons';
export function readPreference(key:string) { try{return localStorage.getItem(key);}catch{return null;} }
export function preference(key:string,value:string) { try{localStorage.setItem(key,value);}catch{/* Browsing works without storage. */} }
export function initialLocale():Locale {
  const saved=readPreference('icons-locale');
  return saved==='en'||saved==='zh-CN'?saved:globalThis.navigator?.language?.startsWith('zh')?'zh-CN':'en';
}
export function initialFilters(catalog:Catalog,href:string) {
  const url=new URL(href),params=url.searchParams;
  const defaultCollection=url.pathname.includes('/alibaba-cloud-icons/')?'alibaba-cloud':'software';
  let collection=params.get('collection')??defaultCollection;
  if(collection!=='all'&&!catalog.collections.some(c=>c.id===collection))collection=defaultCollection;
  const category=resolveCategory(catalog,params.get('category')??'all');
  if(category!=='all'&&collection!=='all')collection=catalog.categories.find(c=>c.id===category)!.collection;
  const type=params.get('type')??'all';
  return {collection,category,type:['all','open-source','source-available','commercial','unverified'].includes(type)?type:'all',query:params.get('q')??'',limit:72};
}
type Modal = {kind:'spotlight'|'bundle'|'mcp'|'notice'} | {kind:'detail';icon:Icon} | null;

function useSite(catalog:Catalog,locale:Locale,setLocale:(locale:Locale)=>void) {
  const [filters,setFilters]=useState(()=>initialFilters(catalog,globalThis.location?.href??siteBase));
  const [dark,setDark]=useState(()=>readPreference('icons-preview')==='dark');
  const [homepageLoadAll,setHomepageLoadAll]=useState(false);
  const [modal,setModal]=useState<Modal>(null);
  const [selected,setSelected]=useState(()=>new Set(catalog.categories.filter(c=>filters.collection==='all'||c.collection===filters.collection).map(c=>c.id)));
  const [focusRequest,setFocusRequest]=useState<{kind:'icon'|'heading';id?:string;scroll?:boolean}|null>(null);
  const [located,setLocated]=useState<string|null>(null);
  const t=messages[locale],local=isLocalSite(siteBase);
  const alibabaEntrypoint=new URL(siteBase).pathname.includes('/alibaba-cloud-icons/');
  const visibleCategories=useMemo(()=>catalog.categories.filter(c=>filters.collection==='all'||c.collection===filters.collection),[catalog,filters.collection]);
  const results=useMemo(()=>(filterIcons(catalog.icons,catalog.categories,filters.query,filters.category,filters.type,filters.collection) as Icon[]).sort(compareIconNames),[catalog,filters.query,filters.category,filters.type,filters.collection]);
  const title=(c:Category|Collection):string=>{
    const name=locale==='en'?c.nameEn:c.name;
    return 'collection' in c?`${title(catalog.collections.find(p=>p.id===c.collection)!)} · ${name}`:name;
  };
  const iconName=(icon:Icon)=>locale==='en'?(icon.nameEn||icon.name):icon.name;
  const typeLabel=(type:string)=>({'open-source':t.openSource,'source-available':t.sourceAvailable,commercial:t.commercial,unverified:t.unverified} as Record<string,string>)[type]??t.unverified;
  const closeModal=()=>setModal(null);
  const openLibraries=(categories:Category[])=>{
    if(local){setModal({kind:'notice'});return;}
    window.open(drawioUrl(siteBase,libraryPaths(categories,locale)),'_blank','noopener,noreferrer');
  };
  const selectCollection=(collection:string,clear=false)=>{
    setFilters(current=>({...current,collection,category:'all',limit:72,...(clear?{query:'',type:'all'}:{})}));
    setSelected(new Set(catalog.categories.filter(c=>collection==='all'||c.collection===collection).map(c=>c.id)));
  };
  const locateIcon=(icon:Icon)=>{
    const destination=spotlightLocation(catalog.icons,catalog.categories,icon.id);
    if(!destination)return;
    closeModal();
    setFilters({collection:destination.collection,category:destination.category,limit:destination.limit,query:'',type:'all'});
    if(location.hash==='#changelog')history.replaceState(null,'',location.pathname+location.search+'#library');
    setFocusRequest({kind:'icon',id:icon.id});
  };
  useEffect(()=>{
    document.documentElement.lang=locale;
    document.title=locale==='en'?'Architecture Icons — for draw.io':'架构图标合集 — for draw.io';
    preference('icons-locale',locale);
  },[locale]);
  const previousFilters=useRef(filters);
  useEffect(()=>{
    if(previousFilters.current===filters)return;
    previousFilters.current=filters;
    const url=new URL(location.href);
    for(const [key,value] of [['q',filters.query],['category',filters.category],['type',filters.type],['collection',filters.collection]]) {
      if(value&&(value!=='all'||key==='collection'))url.searchParams.set(key,value);else url.searchParams.delete(key);
    }
    history.replaceState(null,'',url);
  },[filters]);
  useEffect(()=>{if(location.hash==='#changelog')document.getElementById('changelog')?.scrollIntoView();},[]);
  useEffect(()=>{
    const keydown=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||modal||(event.target as Element).closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
      if((event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey)||((event.metaKey||event.ctrlKey)&&!event.altKey&&event.key.toLowerCase()==='k')){event.preventDefault();setModal({kind:'spotlight'});}
    };
    document.addEventListener('keydown',keydown);return()=>document.removeEventListener('keydown',keydown);
  },[modal]);
  useEffect(()=>{
    if(!focusRequest)return;
    const frame=requestAnimationFrame(()=>{
      if(focusRequest.kind==='icon') {
        const card=document.querySelector<HTMLButtonElement>(`[data-icon="${CSS.escape(focusRequest.id!)}"]`);
        card?.focus({preventScroll:true});
        card?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
        setLocated(focusRequest.id!);
      } else {document.getElementById('category-title')?.focus({preventScroll:true});if(focusRequest.scroll)document.getElementById('library')?.scrollIntoView();}
    });
    return()=>cancelAnimationFrame(frame);
  },[focusRequest]);
  useEffect(()=>{if(!located)return;const timer=setTimeout(()=>setLocated(null),3000);return()=>clearTimeout(timer);},[located,focusRequest]);
  return {catalog,locale,setLocale,t,filters,setFilters,dark,setDark:(value:boolean)=>{preference('icons-preview',value?'dark':'light');setDark(value);},homepageLoadAll,setHomepageLoadAll,modal,setModal,closeModal,selected,setSelected,visibleCategories,results,title,iconName,typeLabel,openLibraries,selectCollection,locateIcon,setFocusRequest,located,local,alibabaEntrypoint};
}

type Site = ReturnType<typeof useSite>;
const SiteContext=createContext<Site|null>(null);
export function SiteProvider({catalog,locale,setLocale,children}:PropsWithChildren<{catalog:Catalog;locale:Locale;setLocale:(locale:Locale)=>void}>) {
  const site=useSite(catalog,locale,setLocale);
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}
export function useIcons() {const site=useContext(SiteContext);if(!site)throw Error('SiteProvider is required');return site;}
