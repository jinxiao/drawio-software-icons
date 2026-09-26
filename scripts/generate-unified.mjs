import { readFile, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import { json, save, hash, libraryXml, readLibrary } from './lib.mjs';

// Keep the imported builder intact so published Alibaba formats remain compatible.
export async function generateUnified(software, softwareEntries) {
  execFileSync('uv', ['run', '--no-project', 'python', 'collections/alibaba-cloud/scripts/build_libraries.py',
    '--output', '.sync-stage/alibaba-build'], { stdio: 'inherit' });
  const upstream = '.sync-stage/alibaba-build';
  const alibaba = await json(`${upstream}/catalog.json`);
  const origin = await json('collections/alibaba-cloud/ORIGIN.json');
  const originalConfig = await json(`${upstream}/config/alibaba-cloud.json`);
  const palettes = originalConfig.libraries[0].entries[0].libs;
  // A complete snapshot is also used to overlay the Alibaba publishing target.
  await cp(upstream, 'public/compat/alibaba-cloud', { recursive: true });
  for (const path of ['drawio', 'svg', 'plugins', 'previews', 'config', 'alibaba-cloud-drawio.zip']) {
    await cp(`${upstream}/${path}`, `public/${path}`, { recursive: true });
  }
  for (const path of ['README.md', 'README.zh-CN.md', 'ICON_USAGE.md', 'THIRD_PARTY_NOTICES.md', 'docs/DEPLOYMENT.md', 'docs/CLOUDFLARE.md']) {
    await save(`public/guides/${path}`, await readFile(path));
  }
  const collections = [
    { id: 'software', name: '通用软件', nameEn: 'General Software', count: software.icons.length, allLibrary: 'libraries/all.xml' },
    { id: 'alibaba-cloud', name: '阿里云', nameEn: 'Alibaba Cloud', count: alibaba.entries.length, allLibrary: 'drawio/all-icons.xml' },
  ];
  const categories = software.categories.map(c => ({ ...c, collection: 'software' }));
  const icons = software.icons.map(i => ({ ...i, collection: 'software' }));
  const payloads = Object.fromEntries(software.categories.map(c => [c.id,
    software.icons.filter(i => i.category === c.id).map(i => softwareEntries.get(i.id))]));
  for (const [index, c] of alibaba.categories.entries()) {
    const id = `alibaba-${c.id}`;
    const items = readLibrary(await readFile(`${upstream}/drawio/${c.id}.xml`, 'utf8'));
    const category = { id, collection: 'alibaba-cloud', name: c.name, nameEn: c.name_en,
      description: `阿里云 · ${c.name}，保留来源图标的原始颜色。`,
      descriptionEn: `Alibaba Cloud · ${c.name_en}, preserving original collection colors.`,
      keywords: ['Alibaba Cloud', '阿里云', c.name, c.name_en], count: items.length,
      libraries: {}, libraryRevisions: {} };
    for (const locale of ['en', 'zh-CN']) {
      const path = `libraries/${locale}/Alibaba Cloud - ${c.id}.xml`;
      const title = locale === 'en' ? `Alibaba Cloud · ${c.name_en}` : `阿里云 · ${c.name}`;
      const xml = libraryXml(items, category.keywords.join(' '), title);
      await save(`public/${path}`, xml);
      category.libraries[locale] = path;
      category.libraryRevisions[locale] = hash(xml);
    }
    payloads[id] = palettes[index].data;
    categories.push(category);
  }
  for (const entry of alibaba.entries) {
    const asset = `svg/${entry.id}.svg`;
    icons.push({ id: `alibaba:${entry.id}`, name: entry.name, nameEn: entry.name_en || entry.name,
      aliases: [...entry.aliases, entry.name_en, entry.code].filter(Boolean),
      tags: ['Alibaba Cloud', '阿里云', entry.status, ...entry.categories],
      category: `alibaba-${entry.categories[0]}`, categories: entry.categories.map(id => `alibaba-${id}`),
      collection: 'alibaba-cloud', softwareType: entry.categories.every(id => id === '09-supplemental-icons') ? 'unverified' : 'commercial',
      asset, sha256: hash(await readFile(`${upstream}/${asset}`)),
      homepage: entry.product_url || 'https://www.aliyun.com/', repository: null,
      source: { id: 'alibaba-iconfont', url: entry.source_url, revision: origin.revision,
        collectionLicense: 'Third-party artwork / 第三方图形权利', licenseUrl: 'compat/alibaba-cloud/NOTICE.md' },
      usagePolicy: 'drawio-architecture-only', usagePolicyUrl: 'ICON_USAGE.md', brandPermissionStatus: 'not-verified' });
  }
  const combined = { ...software, collections, categories, icons, changelog:await json('data/changelog.json'),
    categoryAliases: { ...software.categoryAliases, ...Object.fromEntries(alibaba.categories.map(c => [c.id, `alibaba-${c.id}`])) } };
  await save('public/libraries/combined.xml', libraryXml([
    ...softwareEntries.values(), ...readLibrary(await readFile(`${upstream}/drawio/all-icons.xml`, 'utf8'))
  ], 'Software Alibaba Cloud 软件 阿里云', 'All Icons / 全部图标'));
  // Store each category separately: configuration export fetches only selected categories.
  for (const c of categories) {
    const content = JSON.stringify(payloads[c.id]);
    c.configData = `config/data/${c.id}-${hash(content)}.json`;
    await save(`public/${c.configData}`, content);
  }
  // Bind the UI to content-addressed export payloads from the same build.
  const finalCatalog = JSON.stringify(combined, null, 2) + '\n';
  await save('public/unified-catalog.json', finalCatalog);
  await save(`public/unified-catalog-${hash(finalCatalog)}.json`, finalCatalog);
  const { configurationFor } = await import('../src/configuration.mjs');
  for (const locale of ['en', 'zh-CN']) {
    const config = configurationFor(combined, categories.map(c => c.id), payloads, locale);
    await save(`public/config/drawio-icons.${locale}.json`, JSON.stringify(config));
  }
  const zipFiles = unzipSync(await readFile('public/downloads/drawio-software-icons.zip'));
  const add = async (path) => { zipFiles[path] = await readFile(`public/${path}`); };
  for (const c of categories.filter(c => c.collection === 'alibaba-cloud')) {
    for (const path of Object.values(c.libraries)) await add(path);
  }
  for (const i of icons.filter(i => i.collection === 'alibaba-cloud')) await add(i.asset);
  for (const path of ['libraries/combined.xml', 'config/drawio-icons.en.json', 'config/drawio-icons.zh-CN.json',
    'compat/alibaba-cloud/LICENSE', 'compat/alibaba-cloud/NOTICE.md', 'compat/alibaba-cloud/SOURCES.md',
    'compat/alibaba-cloud/COLORS.md']) await add(path);
  zipFiles['catalog.json'] = strToU8(finalCatalog);
  const deterministic = Object.fromEntries(Object.entries(zipFiles).map(([path, data]) =>
    [path, [data, { mtime: new Date('2020-01-01T00:00:00Z') }]]));
  await save('public/downloads/drawio-icons.zip', zipSync(deterministic, { level: 6 }));
  console.log(`Unified collection: ${icons.length} icons in ${categories.length} categories across ${collections.length} collections.`);
}
