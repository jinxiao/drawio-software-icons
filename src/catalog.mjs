export function resolveCategory(catalog, requested = 'all') {
  const category = catalog.categoryAliases?.[requested] ?? requested;
  return catalog.categories.some(c => c.id === category) ? category : 'all';
}
export function filterIcons(icons, categories, query = '', category = 'all', type = 'all') {
  const terms = query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const categoryText = new Map(categories.map(c=>[c.id,[c.name,c.nameEn,...c.keywords].join(' ')]));
  return icons.filter(i=> {
    if(category !== 'all' && i.category !== category) return false;
    if(type !== 'all' && i.softwareType !== type) return false;
    const text=[i.id,i.name,...i.aliases,...i.tags,categoryText.get(i.category)].join(' ').normalize('NFKC').toLowerCase();
    return terms.every(term=>text.includes(term));
  });
}
export function drawioUrl(baseUrl, paths) {
  if (!paths.length) throw Error('Select at least one library');
  const base = new URL(baseUrl);
  const ids = [...new Set(paths)].map(path => {
    const url = new URL(path,base);
    if(url.origin !== base.origin || !['http:','https:'].includes(url.protocol)) throw Error('Invalid library URL');
    return `U${encodeURIComponent(url.href)}`;
  });
  // draw.io splits libraries on literal semicolons before decoding each U-prefixed URL.
  return `https://app.diagrams.net/?splash=0&clibs=${ids.join(';')}`;
}
export function isLocalSite(url) {
  const {hostname,protocol}=new URL(url);
  return protocol !== 'https:' || hostname === 'localhost' || hostname === '[::1]' || hostname.endsWith('.localhost') || /^127\./.test(hostname);
}
