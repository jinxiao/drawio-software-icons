import {hash} from './lib.mjs';

export function validateChangelog(entries) {
  if(!Array.isArray(entries))throw Error('Changelog must be an array');
  const ids=new Set();
  for(const entry of entries) {
    if(!entry.id || ids.has(entry.id))throw Error('Duplicate or missing changelog ID');
    ids.add(entry.id);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(entry.date)))throw Error(`Invalid changelog date: ${entry.id}`);
    for(const field of ['title','summary'])for(const locale of ['en','zh-CN']) {
      if(typeof entry[field]?.[locale]!=='string' || !entry[field][locale].trim())throw Error(`Missing ${locale} ${field}: ${entry.id}`);
    }
    if(entry.commit && !/^[a-f0-9]{7,40}$/.test(entry.commit))throw Error('Invalid changelog commit');
    if(!Array.isArray(entry.changes))throw Error('Missing changelog changes');
    for(const change of entry.changes) {
      if(!['added','updated','removed'].includes(change.kind) || !['software','alibaba-cloud'].includes(change.collection) || !Array.isArray(change.icons))throw Error('Invalid changelog change');
      if(change.count!==undefined && (!Number.isInteger(change.count) || change.count<change.icons.length))throw Error('Invalid changelog count');
      const iconIds=new Set();
      for(const icon of change.icons) {
        if(typeof icon.id!=='string' || !icon.id || typeof icon.name!=='string' || !icon.name || iconIds.has(icon.id))throw Error('Invalid or duplicate changelog icon');
        iconIds.add(icon.id);
      }
    }
  }
  return entries;
}

export function syncChangelogEntry(oldIcons,changed,removed,licenseChanged,date) {
  if(!changed.length && !removed.length && !licenseChanged)return null;
  const ref=icon=>({id:icon.id,name:icon.name});
  const changes=[
    {kind:'added',collection:'software',icons:changed.filter(i=>!oldIcons.has(i.id)).map(ref)},
    {kind:'updated',collection:'software',icons:changed.filter(i=>oldIcons.has(i.id)).map(ref)},
    {kind:'removed',collection:'software',icons:removed.map(id=>ref(oldIcons.get(id)))},
  ].filter(group=>group.icons.length);
  return {
    id:`sync-${date}-${hash(JSON.stringify({changes,hashes:changed.map(i=>i.sha256),licenseChanged})).slice(0,12)}`,
    date,
    title:{en:'Icon library update','zh-CN':'图标库更新'},
    summary:{
      en:`Synced icon artwork, names, categories or search metadata.${licenseChanged?' Upstream license texts also changed.':''}`,
      'zh-CN':`同步图标素材、名称、分类或搜索信息。${licenseChanged?'同时更新上游许可文本。':''}`,
    },changes,
  };
}

const markdown=value=>value.replace(/[\\`*_[\]<>|]/g,'\\$&').replace(/\r?\n/g,' ');
export function changelogMarkdown(entries,locale='en') {
  validateChangelog(entries);
  const zh=locale==='zh-CN';
  const labels=zh?{added:'新增',updated:'更新',removed:'移除'}:{added:'Added',updated:'Updated',removed:'Removed'};
  const lines=[`# ${zh?'更新日志':'Changelog'}`,'',zh?'[English](CHANGELOG.md)':'[简体中文](CHANGELOG.zh-CN.md)','',
    zh?'按更新批次记录，日期采用 Asia/Shanghai。图标名称链接指向当前版本。':'Updates by batch, dated in Asia/Shanghai. Icon links point to the current version.',''];
  for(const entry of entries) {
    lines.push(`## ${entry.date} — ${markdown(entry.title[locale])}`,'',entry.summary[locale],'');
    for(const change of entry.changes) {
      const collection=change.collection==='software'?(zh?'通用软件':'General Software'):(zh?'阿里云':'Alibaba Cloud');
      lines.push(`### ${labels[change.kind]} · ${collection} (${change.count??change.icons.length})`,'');
      for(const icon of change.icons)lines.push(change.kind==='removed'?`- ${markdown(icon.name)} (\`${icon.id}\`)`:`- [${markdown(icon.name)}](https://jinxiao.github.io/drawio-software-icons/?collection=all&q=${encodeURIComponent(icon.id)}) (\`${icon.id}\`)`);
      if(!change.icons.length)lines.push(zh?'整批导入；请在网站对应图标集中查看完整列表。':'Collection import; browse the collection on the website for the full list.');
      lines.push('');
    }
    if(entry.commit)lines.push(`[${zh?'查看提交':'View commit'}](https://github.com/jinxiao/drawio-software-icons/commit/${entry.commit})`,'');
  }
  return lines.join('\n');
}
