import { useEffect, useState } from 'react';
import { messages } from './i18n';
import type { Catalog } from './types';
import { file, initialLocale, SiteProvider, useIcons } from './site';
import { Header, Home, GuideAndSources, Footer } from './components/Home';
import { Changelog } from './components/Updates';
import { IconLibrary } from './components/IconLibrary';
import { DetailDialog, LocalNotice, SpotlightDialog } from './components/IconDialogs';
import { BundleDialog } from './components/BundleDialog';
import { McpDialog } from './components/McpDialog';

declare const __CATALOG_FILE__: string;

export function Page() {
  const {modal}=useIcons();
  return <><Header/><main><Home/><IconLibrary/><Changelog/><GuideAndSources/></main><Footer/>
    {modal?.kind==='spotlight'&&<SpotlightDialog/>}
    {modal?.kind==='detail'&&<DetailDialog icon={modal.icon}/>}
    {modal?.kind==='bundle'&&<BundleDialog/>}
    {modal?.kind==='mcp'&&<McpDialog/>}
    {modal?.kind==='notice'&&<LocalNotice/>}
  </>;
}
export default function App() {
  const [locale,setLocale]=useState(initialLocale),[catalog,setCatalog]=useState<Catalog|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try {
        const response=await fetch(file(__CATALOG_FILE__),{signal:controller.signal});if(!response.ok)throw Error(String(response.status));
        const data=await response.json();if(!controller.signal.aborted)setCatalog(data);
      } catch(error) {if(!controller.signal.aborted){console.error(error);setFailed(true);}}
    })();
    return()=>controller.abort();
  },[]);
  if(failed){const t=messages[locale];return <div className="boot"><h1>Software Icons</h1><p>{t.error}</p><button id="retry" className="button primary" onClick={()=>location.reload()}>{t.retry}</button> <a className="button outline" href={file('downloads/drawio-icons.zip')}>{t.downloadAll}</a></div>;}
  if(!catalog)return <p className="boot" role="status">正在加载图标库 · Loading icons…</p>;
  return <SiteProvider catalog={catalog} locale={locale} setLocale={setLocale}><Page/></SiteProvider>;
}
