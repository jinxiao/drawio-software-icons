import { readFile } from 'node:fs/promises';
import { json, save, inspectSvg, inspectPng, hash } from './lib.mjs';
import { normalize } from '../worker/search.mjs';
import { compareIconNames } from '../src/spotlight.mjs';

const catalog = await json('dist/unified-catalog.json');
const categories = new Map(catalog.categories.map(c => [c.id, [c.name, c.nameEn, ...c.keywords].join(' ')]));
const collections = new Map(catalog.collections.map(c => [c.id, { slug: c.id, name: c.nameEn }]));
const icons = await Promise.all([...catalog.icons].sort(compareIconNames).map(async icon => {
  if (!/^(icons|svg)\/[a-zA-Z0-9_.-]+\.(svg|png)$/.test(icon.asset)) throw Error(`Unsafe asset: ${icon.asset}`);
  const bytes = await readFile(`dist/${icon.asset}`);
  const size = icon.asset.endsWith('.png') ? inspectPng(bytes) : inspectSvg(bytes.toString('utf8'));
  const scale = 48 / Math.max(size.width, size.height);
  return { id: icon.id, names: [icon.id, icon.name, icon.nameEn, ...icon.aliases].map(normalize).filter(Boolean),
    text: normalize([icon.id, icon.name, icon.nameEn, ...icon.aliases, ...icon.tags,
      ...(icon.categories ?? [icon.category]).map(id => categories.get(id))].join(' ')),
    image: { url: `/${icon.asset}`, title: icon.nameEn || icon.name,
      width: Number((size.width * scale).toFixed(4)), height: Number((size.height * scale).toFixed(4)), set: collections.get(icon.collection) } };
}));
await save('.worker-build/search-index.json', JSON.stringify({ version: hash(JSON.stringify(icons)), icons }));
// draw.io loads libraries and images cross-origin. GitHub Pages already supplies
// CORS, but Cloudflare static hosting needs this explicit response header.
await save('dist/_headers', '/*\n  Access-Control-Allow-Origin: *\n  X-Content-Type-Options: nosniff\n');
console.log(`Compiled Worker search index: ${icons.length} icons.`);
