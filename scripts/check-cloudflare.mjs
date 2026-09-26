import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { json, hash } from './lib.mjs';
import { search } from '../worker/search.mjs';
import { searchSpotlight } from '../src/spotlight.mjs';

const index = await json('.worker-build/search-index.json');
const catalog = await json('dist/unified-catalog.json');
assert.equal(index.icons.length, catalog.icons.length);
assert.equal(new Set(index.icons.map(i => i.id)).size, catalog.icons.length);
for (const q of ['git', 'k8s', 'ecs', '阿里云', 'cloud', '容器', 'database', '云服务器']) {
  assert.deepEqual(search(index, q, 0, 100).images.map(i => i.url),
    searchSpotlight(catalog.icons, catalog.categories, q).slice(0, 100).map(i => `/${i.asset}`));
}
for (const icon of index.icons) {
  assert.ok(icon.image.width > 0 && icon.image.height > 0);
  assert.ok(icon.image.set.name);
  assert.doesNotMatch(icon.image.url, /[;&"'<>\s]/);
}
async function files(dir, prefix = '') {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + e.name;
    if (e.isDirectory()) result.push(...await files(`${dir}/${e.name}`, `${path}/`));
    else result.push(path);
  }
  return result;
}
const assets = await files('dist');
assert.ok(assets.length <= 20000);
for (const path of assets) assert.ok((await readFile(`dist/${path}`)).length <= 25 * 1024 * 1024, `Asset too large: ${path}`);
for (const [source, target] of [['dist', 'dist-pages'], ['dist-alibaba', 'dist-alibaba-pages']]) {
  assert.match(await readFile(`${target}/index.html`, 'utf8'), /location.replace/);
  for (const path of await files(source)) {
    if (['index.html', 'SHA256SUMS.json'].includes(path)) continue;
    assert.equal(hash(await readFile(`${target}/${path}`)), hash(await readFile(`${source}/${path}`)), `Legacy resource: ${path}`);
  }
}
const checksums = await json('dist-alibaba-pages/SHA256SUMS.json');
for (const [path, sha] of Object.entries(checksums)) assert.equal(hash(await readFile(`dist-alibaba-pages/${path}`)), sha);
console.log(`Verified ${index.icons.length} searchable icons, ${assets.length} Cloudflare assets and both legacy resource trees.`);
