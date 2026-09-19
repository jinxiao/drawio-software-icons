import {filterIcons} from './catalog.mjs';

const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().trim();
export const compareIconNames=(a,b)=>a.name.localeCompare(b.name,'en') || a.id.localeCompare(b.id,'en');

// Search every collection; exact names/aliases precede prefixes and category matches.
export function searchSpotlight(icons,categories,query='') {
  const needle=normalize(query),terms=needle.split(/\s+/).filter(Boolean);
  const rank=icon=>{
    const names=[icon.id,icon.name,icon.nameEn,...icon.aliases].map(normalize).filter(Boolean);
    if(!needle || names.includes(needle))return 0;
    if(names.some(name=>name.startsWith(needle)))return 1;
    if(terms.every(term=>names.some(name=>name.includes(term))))return 2;
    return 3;
  };
  return filterIcons(icons,categories,needle)
    .map(icon=>({icon,rank:rank(icon)}))
    .sort((a,b)=>a.rank-b.rank || compareIconNames(a.icon,b.icon))
    .map(item=>item.icon);
}

// Reveal the target even when its category has more than one page of icons.
export function spotlightLocation(icons,categories,id) {
  const icon=icons.find(item=>item.id===id);
  if(!icon)return null;
  const siblings=filterIcons(icons,categories,'',icon.category,'all',icon.collection).sort(compareIconNames);
  const index=siblings.findIndex(item=>item.id===id);
  return {collection:icon.collection,category:icon.category,limit:Math.ceil((index+1)/72)*72};
}
