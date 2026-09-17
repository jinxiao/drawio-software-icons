export const DEFAULT_LIBRARIES = 'general;uml;er;bpmn;flowchart;basic;arrows2';
const packIds = { software: 'software-icons', 'alibaba-cloud': 'alibaba-cloud-iconfont' };
const resource = (en, zh, locale) => ({ main: locale === 'en' ? en : zh, en, zh });

export function configurationFor(catalog, selectedIds, payloads, locale = 'en') {
  const selected = new Set(selectedIds);
  if (!selected.size || [...selected].some(id => !catalog.categories.some(c => c.id === id))) {
    throw Error('Select valid categories');
  }
  const libraries = [];
  for (const collection of catalog.collections) {
    const categories = catalog.categories.filter(c => c.collection === collection.id && selected.has(c.id));
    if (!categories.length) continue;
    const title = resource(collection.nameEn, collection.name, locale);
    libraries.push({ title, entries: [{ id: packIds[collection.id], title,
      desc: resource(`${categories.length} categories · embedded icons for offline use`, `${categories.length} 个分类 · 内嵌图标可离线使用`, locale),
      libs: categories.map(c => {
        if (!Array.isArray(payloads[c.id])) throw Error(`Missing category data: ${c.id}`);
        return { title: resource(`${collection.nameEn} · ${c.nameEn}`, `${collection.name} · ${c.name}`, locale),
          tags: c.keywords.join(' '), data: payloads[c.id] };
      }) }] });
  }
  return { defaultLibraries: [DEFAULT_LIBRARIES, ...libraries.map(s => s.entries[0].id)].join(';'), libraries };
}

function validate(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw Error('Configuration must be a JSON object');
  if (config.defaultLibraries != null && typeof config.defaultLibraries !== 'string') throw Error('defaultLibraries must be a string');
  for (const key of ['enabledLibraries', 'defaultCustomLibraries']) {
    if (config[key] != null && (!Array.isArray(config[key]) || config[key].some(id => typeof id !== 'string'))) throw Error(`${key} must be an array of strings`);
  }
  if (config.libraries != null && !Array.isArray(config.libraries)) throw Error('libraries must be an array');
  const ids = new Set();
  for (const section of config.libraries ?? []) {
    if (!section || !Array.isArray(section.entries)) throw Error('Each library section must have entries');
    for (const entry of section.entries) {
      if (!entry || typeof entry.id !== 'string' || !entry.id || !Array.isArray(entry.libs)) throw Error('Each library entry must have an id and libs');
      if (ids.has(entry.id)) throw Error(`Duplicate library ID: ${entry.id}`);
      ids.add(entry.id);
    }
  }
}

// Replacement is limited to our two stable IDs; unrelated configuration is copied intact.
export function mergeConfiguration(existing, incoming) {
  validate(existing); validate(incoming);
  const result = structuredClone(existing);
  const added = incoming.libraries.flatMap(s => s.entries);
  const replacements = new Map(added.map(entry => [entry.id, entry]));
  if (added.some(e => !Object.values(packIds).includes(e.id))) throw Error('Unknown incoming library ID');
  result.libraries = (result.libraries ?? []).map(section => ({ ...section, entries: section.entries.map(entry => {
    const replacement = replacements.get(entry.id);
    if (!replacement) return entry;
    replacements.delete(entry.id);
    return structuredClone(replacement);
  }) }));
  for (const section of incoming.libraries) {
    const entries = section.entries.filter(e => replacements.has(e.id));
    if (entries.length) result.libraries.push({ ...structuredClone(section), entries: structuredClone(entries) });
  }
  const previous = existing.defaultLibraries ?? DEFAULT_LIBRARIES;
  result.defaultLibraries = [...new Set([...previous.split(';'), ...added.map(e => e.id)].filter(Boolean))].join(';');
  if (Array.isArray(result.enabledLibraries)) result.enabledLibraries = [...new Set([...result.enabledLibraries, ...added.map(e => e.id)])];
  return result;
}
