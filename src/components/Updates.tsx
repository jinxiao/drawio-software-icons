import { file, useIcons } from '../site';
import type { Change, UpdateEntry } from '../types';
import { Symbol } from './Ui';

export function LatestUpdate() {
  const s=useIcons(),{catalog,t,locale}=s,latest=catalog.changelog?.[0];
  if(!latest)return null;
  const counts={added:0,updated:0,removed:0};
  for(const group of latest.changes)counts[group.kind]+=group.count??group.icons.length;
  const labels={added:t.bannerAdded,updated:t.bannerUpdated,removed:t.bannerRemoved};
  const summary=(Object.keys(counts) as Change['kind'][]).filter(kind=>counts[kind]>0).map(kind=>labels[kind].replace('{count}',String(counts[kind]))).join(' · ');
  const refs=[...new Map(latest.changes.flatMap(group=>group.icons.map(icon=>[icon.id,{...icon,kind:group.kind}] as const))).values()].slice(0,4);
  return <aside className="home-updates" aria-labelledby="latest-update-title"><div className="home-update-meta"><span>{t.latestUpdate}</span><time dateTime={latest.date}>{latest.date}</time></div><h2 id="latest-update-title">{latest.title[locale]}</h2>{summary&&<p className="home-update-count">{summary}</p>}<div className="home-update-icons">{refs.map(ref=>{
    const icon=catalog.icons.find(i=>i.id===ref.id);
    return icon&&ref.kind!=='removed'?<button key={ref.id} data-update-icon={ref.id} title={`${t.locateCurrentIcon}: ${ref.name}`} onClick={()=>s.locateIcon(icon)}><img src={file(icon.asset)} width="24" height="24" alt=""/><span>{ref.name}</span><Symbol name="arrow"/></button>:<span key={ref.id}>{ref.name}</span>;
  })}</div><a className="home-update-link" href="#changelog">{t.viewChangelog}<Symbol name="arrow"/></a></aside>;
}
function UpdateRecord({entry,initialOpen}:{entry:UpdateEntry;initialOpen:boolean}) {
  const s=useIcons(),{t,catalog,locale}=s,labels={added:t.changeAdded,updated:t.changeUpdated,removed:t.changeRemoved};
  return <details className="update-entry" open={initialOpen||undefined}><summary><time dateTime={entry.date}>{entry.date}</time><strong>{entry.title[locale]}</strong><span className="update-counts">{entry.changes.map((group,i)=><span key={i} className={`change-${group.kind}`}>{labels[group.kind]} {group.count??group.icons.length}</span>)}</span></summary><div className="update-body"><p>{entry.summary[locale]}</p>{entry.changes.map((group,i)=><div className="update-group" key={i}><h3>{labels[group.kind]} · {s.title(catalog.collections.find(c=>c.id===group.collection)!)} <small>{group.count??group.icons.length}</small></h3><div className="update-icons">{group.icons.map(ref=>{
    const icon=catalog.icons.find(icon=>icon.id===ref.id);
    return icon&&group.kind!=='removed'?<button key={ref.id} className="update-icon" data-update-icon={ref.id} title={t.locateCurrentIcon} onClick={()=>s.locateIcon(icon)}><img src={file(icon.asset)} alt="" width="20" height="20" loading="lazy"/>{ref.name}</button>:<span key={ref.id} className="update-icon removed">{ref.name}</span>;
  })}</div>{!group.icons.length&&<><p>{t.collectionImport}</p><button className="button outline small" data-update-collection={group.collection} onClick={()=>{s.selectCollection(group.collection,true);history.replaceState(null,'',location.pathname+location.search+'#library');s.setFocusRequest({kind:'heading',scroll:true});}}>{t.browse}</button></>}</div>)}{entry.commit&&<a className="update-commit" href={`https://github.com/jinxiao/drawio-software-icons/commit/${entry.commit}`} target="_blank" rel="noopener noreferrer">{t.viewChange}<Symbol name="external"/></a>}</div></details>;
}
export function Changelog() {
  const {t,catalog,locale}=useIcons(),history=catalog.changelog??[];
  return <section className="updates" id="changelog" aria-labelledby="updates-title"><div className="updates-heading"><div><p className="eyebrow">{t.changelogEyebrow}</p><h2 id="updates-title">{t.changelog}</h2><p>{t.changelogIntro}</p></div><a className="button outline small" href={file(locale==='en'?'CHANGELOG.md':'CHANGELOG.zh-CN.md')} download><Symbol name="download"/>{t.downloadChangelog}</a></div><div className="update-list">{history.slice(0,3).map((entry,i)=><UpdateRecord key={entry.id} entry={entry} initialOpen={i===0}/>)}{history.length>3&&<details className="update-history"><summary>{t.olderUpdates} ({history.length-3})</summary>{history.slice(3).map(entry=><UpdateRecord key={entry.id} entry={entry} initialOpen={false}/>)}</details>}</div></section>;
}
