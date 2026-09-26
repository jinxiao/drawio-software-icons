import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { file, preference, readPreference, starRepository, useIcons } from '../site';
import { ExternalLink, LibraryLink, Symbol } from './Ui';
import { LatestUpdate } from './Updates';
import { McpNotice } from './McpDialog';

function useStars() {
  const [count,setCount]=useState<number|null>(null);
  useEffect(()=>{
    const key=`github-stars:${starRepository}`;
    try {
      const cached=JSON.parse(readPreference(key)??'null');
      if(cached&&Number.isSafeInteger(cached.count)&&cached.count>=0&&Number.isFinite(cached.at)&&cached.at<=Date.now()){
        setCount(cached.count);if(Date.now()-cached.at<60*60*1000)return;
      }
    } catch {/* Ignore unavailable or invalid storage. */}
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
    void (async()=>{
      try {
        const response=await fetch(`https://api.github.com/repos/${starRepository}`,{headers:{Accept:'application/vnd.github+json'},credentials:'omit',signal:controller.signal});
        if(!response.ok)return;
        const data=await response.json();
        if(!Number.isSafeInteger(data.stargazers_count)||data.stargazers_count<0||controller.signal.aborted)return;
        setCount(data.stargazers_count);preference(key,JSON.stringify({count:data.stargazers_count,at:Date.now()}));
      } catch {/* The repository link works without the star count. */}
      finally {clearTimeout(timeout);}
    })();
    return()=>{controller.abort();clearTimeout(timeout);};
  },[]);
  return count;
}
export function Header() {
  const {t,locale,setLocale}=useIcons(),stars=useStars(),count=stars?.toLocaleString(locale)??'';
  return <><a className="skip-link" href="#library">{t.browse}</a><header className="topbar"><a className="brand" href="#" aria-label="Architecture Icons"><span className="brand-mark"><Symbol name="grid"/></span><span>architecture<span className="brand-light">icons</span><small>for draw.io</small></span></a><nav aria-label={locale==='en'?'Main navigation':'主导航'}><a href="#library">{t.navLibrary}</a><a href="#changelog">{t.changelog}</a><a href="#guide">{t.navGuide}</a></nav><div className="topbar-actions"><a className="button github-star" id="github-star" href={`https://github.com/${starRepository}`} target="_blank" rel="noopener noreferrer" title={t.starHint} aria-label={stars===null?t.starHint:`${t.starHint} · ${t.starCount.replace('{count}',count)}`}><Symbol name="star"/><span>{t.starAction}</span><span className="github-star-count" hidden={stars===null}>{count}</span></a><button className="language button subtle" id="language" onClick={()=>setLocale(locale==='en'?'zh-CN':'en')}><Symbol name="globe"/>{locale==='en'?'中文':'English'}</button></div></header></>;
}
function HomeSearch() {
  const {t,locale,catalog,setModal}=useIcons(),anchorRef=useRef<HTMLDivElement>(null),buttonRef=useRef<HTMLButtonElement>(null);
  useLayoutEffect(()=>{
    const anchor=anchorRef.current!,button=buttonRef.current!,root=document.documentElement;
    let frame=0,needsMeasure=true;
    const update=()=>{
      frame=0;const wasFloating=anchor.classList.contains('is-floating');
      if(needsMeasure){anchor.classList.remove('is-floating');anchor.style.height='';anchor.style.height=`${button.getBoundingClientRect().height}px`;}
      const floating=anchor.getBoundingClientRect().top<=12;
      anchor.classList.toggle('is-floating',floating);
      if(needsMeasure||wasFloating!==floating)root.style.setProperty('--floating-search-height',`${button.getBoundingClientRect().height}px`);
      needsMeasure=false;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const measure=()=>{needsMeasure=true;schedule();};
    const observer=new ResizeObserver(measure);observer.observe(anchor);
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure);update();
    return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);cancelAnimationFrame(frame);root.style.removeProperty('--floating-search-height');};
  },[locale]);
  return <div className="home-search"><div className="home-search-anchor" ref={anchorRef}><button className="home-search-trigger" id="home-search" ref={buttonRef} aria-haspopup="dialog" aria-controls="spotlight" aria-keyshortcuts="/ Control+k Meta+k" onClick={()=>setModal({kind:'spotlight'})}><Symbol name="search"/><span>{t.homeSearch}</span><kbd>/</kbd></button></div><div className="home-search-caption"><span>{t.homeSearchScope.replace('{count}',catalog.icons.length.toLocaleString(locale))}</span><a href="#library">{t.browse}<Symbol name="arrow"/></a></div></div>;
}
export function Home() {
  const s=useIcons(),{t,catalog,alibabaEntrypoint,homepageLoadAll}=s,all=!alibabaEntrypoint||homepageLoadAll;
  const categories=all?catalog.categories:catalog.categories.filter(c=>c.collection==='alibaba-cloud');
  return <><section className="home-overview" aria-labelledby="home-title"><div className="home-intro"><p className="eyebrow"><span/>{t.eyebrow}</p><h1 id="home-title">{t.hero1}<br/><em>{t.hero2}</em></h1><p>{t.homeIntro}</p></div><HomeSearch/><LatestUpdate/><div className="home-actions">{alibabaEntrypoint&&<label className="load-all-toggle"><input type="checkbox" data-load-all checked={homepageLoadAll} onChange={event=>s.setHomepageLoadAll(event.target.checked)}/><span>{t.loadAll}</span></label>}<div className="home-primary-actions"><LibraryLink className="primary" categories={categories}>{all?t.openEveryCollection:t.openAll.replace('{collection}',s.title(catalog.collections.find(c=>c.id==='alibaba-cloud')!))}</LibraryLink><button className="button outline" id="bundle" onClick={()=>s.setModal({kind:'bundle'})}><Symbol name="grid"/>{t.bundle}</button></div><p className="home-load-hint">{alibabaEntrypoint?t.alibabaLoadHint:t.homeLoadShort}</p><McpNotice/></div></section><div className="home-tools"><span>{catalog.categories.length} {t.categories} <span aria-hidden="true">·</span> {t.vector}</span><div><a href={file('downloads/drawio-icons.zip')} download><Symbol name="download"/>{t.downloadAll}</a><ExternalLink href="https://github.com/jinxiao/drawio-software-icons/issues/new/choose">{t.requestChange}<Symbol name="external"/></ExternalLink><ExternalLink href="https://github.com/jinxiao/drawio-software-icons/compare">{t.submitPr}<Symbol name="external"/></ExternalLink></div></div></>;
}
export function GuideAndSources() {
  const {t}=useIcons();
  const sources=[['compat/alibaba-cloud/NOTICE.md','Alibaba Cloud · Iconfont'],['https://github.com/devicons/devicon','Devicon'],['https://github.com/homarr-labs/dashboard-icons','Dashboard Icons'],['https://github.com/lobehub/lobe-icons','Lobe Icons'],['https://github.com/bwks/vendor-icons-svg','Vendor Icons SVG'],['ICON_USAGE.md',t.usagePolicy],['THIRD_PARTY_NOTICES.md',t.notices]];
  return <><section className="guide" id="guide"><p className="eyebrow">FROM LIBRARY TO CANVAS</p><h2>{t.guideTitle}</h2><div className="steps">{[[t.step1,t.step1Text],[t.step2,t.step2Text],[t.step3,t.step3Text]].map(([name,detail],i)=><article key={i}><span className="step-number">0{i+1}</span><h3>{name}</h3><p>{detail}</p></article>)}</div><div className="offline-note"><Symbol name="download"/><div><p>{t.guideOffline}</p><p>{t.guideLanguage}</p></div></div><McpNotice/></section><section className="sources" id="sources"><div><p className="eyebrow">CLEAR ORIGINS, DEFINED USE</p><h2>{t.sourceTitle}</h2><p>{t.sourceText}</p><p>{t.commercialUse}</p><small>{t.brandNote}</small></div><div className="source-links">{sources.map(([href,label])=><ExternalLink key={href} href={file(href)}>{label} <Symbol name="external"/></ExternalLink>)}</div></section></>;
}
export function Footer() {
  const {t,catalog}=useIcons();
  return <footer><span>{t.footer}<small>{t.footerNote}</small></span><div><a href="#changelog">{t.changelog}</a><ExternalLink href={file('guides/README.md')}>{t.englishGuide}</ExternalLink><ExternalLink href={file('guides/README.zh-CN.md')}>{t.chineseGuide}</ExternalLink><span>v{catalog.version}</span></div></footer>;
}
