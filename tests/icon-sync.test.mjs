import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDownloader, downloadCacheDirectory } from '../scripts/icon-cache.mjs';
import { loadIconConfiguration } from '../scripts/icon-config.mjs';
import { syncIcons } from '../scripts/sync-icons.mjs';
import { json, save, saveJson, hash } from '../scripts/lib.mjs';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#123456" d="M0 0h32v32H0z"/></svg>\n';
const settings = { enabled: true, version: '1', maxAgeHours: null };
const forbidden = async () => { throw Error('Unexpected network request'); };
const temporary = async t => {
  const directory = await mkdtemp(join(tmpdir(), 'drawio-icon-sync-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
};

test('download cache skips HTTP, deduplicates requests and repairs corrupt cached bytes', async t => {
  const directory = await temporary(t);
  let requests = 0;
  const fetchImpl = async () => { requests++; return new Response(svg, { headers: { etag: '"v1"' } }); };
  let client = createDownloader({ directory, fetchImpl });
  await Promise.all([client.download('https://example.com/icon.svg', settings), client.download('https://example.com/icon.svg', settings)]);
  assert.equal(requests, 1);
  client = createDownloader({ directory, fetchImpl: forbidden });
  assert.equal((await client.download('https://example.com/icon.svg', settings)).toString(), svg);
  const filename = (await readdir(directory)).find(name => name.endsWith('.bin'));
  await writeFile(join(directory, filename), 'corrupt');
  await createDownloader({ directory, fetchImpl }).download('https://example.com/icon.svg', settings);
  assert.equal(requests, 2);
  await createDownloader({ directory, fetchImpl }).download('https://example.com/icon.svg', { ...settings, version: '2' });
  assert.equal(requests, 3, 'namespace bump invalidates old cache');
  await createDownloader({ directory, fetchImpl }).download('https://example.com/icon.svg', { ...settings, enabled: false });
  assert.equal(requests, 4, 'disabled cache does not read cached bytes');
});

test('expired downloads use conditional HTTP and refresh replaces changed files', async t => {
  const directory = await temporary(t), cache = { ...settings, maxAgeHours: 1 };
  let clock = 0;
  await createDownloader({ directory, now: () => clock, fetchImpl: async () => new Response(svg,
    { headers: { etag: '"v1"', 'last-modified': 'Mon, 01 Jan 2024 00:00:00 GMT' } }) }).download('https://example.com/icon.svg', cache);
  clock = 3600001;
  const client = createDownloader({ directory, now: () => clock, fetchImpl: async (_, options) => {
    assert.equal(options.headers['If-None-Match'], '"v1"');
    assert.equal(options.headers['If-Modified-Since'], 'Mon, 01 Jan 2024 00:00:00 GMT');
    return new Response(null, { status: 304 });
  } });
  assert.equal((await client.download('https://example.com/icon.svg', cache)).toString(), svg);
  assert.equal(client.stats.revalidated, 1);
  const updated = svg.replace('#123456', '#abcdef');
  assert.equal((await createDownloader({ directory, now: () => clock, refresh: true,
    fetchImpl: async () => new Response(updated) }).download('https://example.com/icon.svg', cache)).toString(), updated);
  await assert.rejects(createDownloader({ directory, refresh: true, fetchImpl: async () => new Response('', { status: 503 }) })
    .download('https://example.com/icon.svg', cache), /503/);
});

test('Cloudflare and local builds use separate predictable cache directories', () => {
  assert.equal(downloadCacheDirectory({}, {}), '.sync-stage/cache');
  assert.equal(downloadCacheDirectory({}, { WORKERS_CI: '1', npm_config_cache: '/build/.npm' }), join('/build/.npm', 'drawio-software-icons'));
  assert.equal(downloadCacheDirectory({ cache: { directory: '.custom-cache' } }, { WORKERS_CI: '1' }), '.custom-cache');
});

test('configuration-only additions build, reuse bytes, invalidate source changes and fail without publishing partial outputs', async t => {
  const directory = await temporary(t), previousCwd = process.cwd();
  process.chdir(directory);
  try {
    const config = { schemaVersion: 1, cache: settings, download: { concurrency: 2, timeoutMs: 1000 }, defaults: { softwareType: 'unverified' },
      sources: { test: { kind: 'github', repo: 'example/icons', branch: 'main', initialRevision: 'a'.repeat(40), pathTemplate: 'svg/{id}.svg', license: 'MIT' },
        official: { kind: 'publisher-artwork', licenseFile: 'licenses/official-LICENSE.txt', license: 'Publisher terms' } } };
    const entry = { id: 'sample', name: 'Sample', category: 'test', source: 'test', homepage: 'https://example.com', aliases: ['示例'], tags: ['test'] };
    let manifest = { icons: [entry] };
    await saveJson('data/icon-sources.json', config);
    await saveJson('data/icons/test.json', manifest);
    await saveJson('data/categories.json', [{ id: 'test', name: '测试', keywords: ['Test'] }]);
    await saveJson('data/changelog.json', []);
    await save('licenses/official-LICENSE.txt', 'Publisher terms. '.repeat(10));
    const urls = [];
    const fetchImpl = async url => { urls.push(url); return new Response(url.endsWith('/LICENSE') ? 'MIT License '.repeat(20) : svg); };
    assert.equal((await syncIcons({ fetchImpl })).downloaded, 2);
    let catalog = await json('data/catalog.json');
    assert.equal(catalog.icons[0].name, 'Sample');
    assert.equal(catalog.icons[0].sha256, hash(svg));
    assert.equal((await syncIcons({ fetchImpl: forbidden })).reused, 1);
    const bytes = await readFile('assets/icons/sample.svg');
    entry.name = 'Renamed'; entry.aliases.push('new alias');
    await saveJson('data/icons/test.json', manifest);
    assert.equal((await syncIcons({ fetchImpl: forbidden })).changed, 1);
    assert.deepEqual(await readFile('assets/icons/sample.svg'), bytes);
    manifest.icons.push({ ...entry, id: 'second', name: 'Second' });
    await saveJson('data/icons/test.json', manifest);
    const added = await syncIcons({ fetchImpl });
    assert.equal(added.downloaded, 1);
    assert.equal(added.reused, 1);
    // Simulate a fresh checkout of configuration-only changes, with only the
    // download cache restored by CI and none of the generated files committed.
    for (const path of ['data/catalog.json', 'data/sources.lock.json', 'data/icon-inputs.lock.json']) await rm(path);
    await rm('assets', { recursive: true });
    assert.equal((await syncIcons({ fetchImpl: forbidden })).cached, 3);
    config.sources.test.revision = 'b'.repeat(40);
    await saveJson('data/icon-sources.json', config);
    assert.equal((await syncIcons({ fetchImpl })).downloaded, 3);
    assert.ok(urls.at(-1).includes('/' + 'b'.repeat(40) + '/'));
    manifest.icons.push({ ...entry, id: 'publisher', source: 'official', artwork: { url: 'https://example.com/publisher.svg', format: 'svg', sha256: hash(svg) } });
    await saveJson('data/icons/test.json', manifest);
    assert.equal((await syncIcons({ fetchImpl })).downloaded, 1);
    assert.equal((await syncIcons({ fetchImpl: forbidden })).reused, 3);
    const published = await readFile('data/catalog.json');
    const locked = await readFile('data/icon-inputs.lock.json');
    const publishedHistory = await readFile('data/changelog.json');
    manifest.icons.push({ ...entry, id: 'broken', artwork: { path: 'broken.svg' } });
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(syncIcons({ fetchImpl: async () => new Response('<svg><script/></svg>') }), /Collection aborted/);
    assert.deepEqual(await readFile('data/catalog.json'), published);
    assert.deepEqual(await readFile('data/icon-inputs.lock.json'), locked);
    assert.deepEqual(await readFile('data/changelog.json'), publishedHistory);
    manifest.icons.pop();
    manifest.icons = manifest.icons.filter(icon => icon.id !== 'second');
    await saveJson('data/icons/test.json', manifest);
    assert.equal((await syncIcons({ fetchImpl: forbidden })).removed, 1);
    assert.ok(!(await json('data/catalog.json')).icons.some(icon => icon.id === 'second'));
    manifest.icons.push({ ...entry });
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(syncIcons({ fetchImpl: forbidden }), /duplicate icon ID/);
    manifest.icons.pop();
    manifest.icons[0].category = 'missing';
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(loadIconConfiguration(), /Unknown category/);
    manifest.icons[0].category = 'test';
    manifest.icons[0].artwork = { path: '../outside.svg' };
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(loadIconConfiguration(), /invalid relative path/);
    manifest.icons[0].artwork = { varaint: 'original' };
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(loadIconConfiguration(), /unknown field varaint/);
    delete manifest.icons[0].artwork;
    const publisher = manifest.icons.find(icon => icon.id === 'publisher');
    publisher.artwork.sha256 = '0'.repeat(64);
    await saveJson('data/icons/test.json', manifest);
    await assert.rejects(syncIcons({ fetchImpl: forbidden }), /Artwork checksum mismatch/);
    publisher.artwork.sha256 = hash(svg);
    config.sources.devicon = { kind: 'github', repo: 'example/devicon', branch: 'main', initialRevision: 'a'.repeat(40), adapter: 'devicon', index: 'devicon.json', license: 'MIT' };
    manifest.icons.push({ ...entry, id: 'indexed', source: 'devicon' });
    await saveJson('data/icon-sources.json', config);
    await saveJson('data/icons/test.json', manifest);
    const indexedRequests = [];
    const indexedFetch = async url => {
      indexedRequests.push(url);
      return url.endsWith('devicon.json')
        ? new Response(JSON.stringify([{ name: 'indexed', versions: { svg: ['plain'] } }]))
        : fetchImpl(url);
    };
    assert.equal((await syncIcons({ fetchImpl: indexedFetch })).downloaded, 3);
    assert.ok(indexedRequests.some(url => url.endsWith('/icons/indexed/indexed-plain.svg')));
    assert.equal((await json('data/catalog.json')).icons.find(icon => icon.id === 'indexed').source.variant, 'plain');
    const reviewedPins = await readFile('data/sources.lock.json');
    const reviewedCatalog = await readFile('data/catalog.json');
    assert.equal((await syncIcons({ update: true, fetchImpl: indexedFetch, resolveRevision: () => 'c'.repeat(40) })).changed, 0);
    assert.deepEqual(await readFile('data/sources.lock.json'), reviewedPins, 'unrelated upstream commits do not create pin-only PRs');
    assert.deepEqual(await readFile('data/catalog.json'), reviewedCatalog);
    config.sources.devicon.revision = 'd'.repeat(40);
    await saveJson('data/icon-sources.json', config);
    await syncIcons({ update: true, fetchImpl: indexedFetch, resolveRevision: () => { throw Error('Explicit revisions must not resolve branches'); } });
    assert.equal((await json('data/sources.lock.json')).devicon.revision, 'd'.repeat(40));
  } finally { process.chdir(previousCwd); }
});
