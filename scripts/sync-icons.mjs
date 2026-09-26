import { readFile, cp, mkdtemp, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { unzipSync } from 'fflate';
import { syncChangelogEntry, validateChangelog } from './changelog.mjs';
import { hash, json, save, saveJson, inspectSvg, inspectPng, normalizeSvg, packageOfficialPng } from './lib.mjs';
import { loadIconConfiguration, cacheOptions, artworkKey, licenseKey, projectMetadata, stableJson } from './icon-config.mjs';
import { createDownloader, downloadCacheDirectory } from './icon-cache.mjs';

async function optionalJson(path, fallback) {
  try { return await json(path); } catch (error) { if (error.code !== 'ENOENT') throw error; return fallback; }
}
async function verifiedFile(path, checksum) {
  try {
    const bytes = await readFile(path);
    return checksum && hash(bytes) === checksum ? bytes : null;
  } catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
}

export async function syncIcons({ update = false, refresh = false, fetchImpl = fetch,
  resolveRevision = (source, timeoutMs) => execFileSync('git', ['ls-remote', `https://github.com/${source.repo}.git`, `refs/heads/${source.branch}`],
    { encoding: 'utf8', timeout: timeoutMs }).split(/\s/)[0] } = {}) {
  // Validate every manifest before network access or publication of any output.
  const { config, icons: selection, categories } = await loadIconConfiguration();
  const oldLock = await optionalJson('data/sources.lock.json', {});
  const oldCatalog = await optionalJson('data/catalog.json', { schemaVersion: 1, version: '1.0.0', icons: [] });
  const oldState = await optionalJson('data/icon-inputs.lock.json', { icons: {}, licenses: {} });
  const history = validateChangelog(await json('data/changelog.json'));
  const categoryMap = new Map(categories.map(category => [category.id, category]));
  const oldIcons = new Map(oldCatalog.icons.map(icon => [icon.id, icon]));
  const pins = {}, officialIcons = {}, state = { schemaVersion: 1, icons: {}, licenses: {} };
  const downloader = createDownloader({ directory: downloadCacheDirectory(config), timeoutMs: config.download.timeoutMs, refresh, fetchImpl });
  const usedSources = [...new Set(selection.map(icon => icon.source))].sort();
  for (const id of usedSources) {
    const source = config.sources[id];
    if (source.kind === 'publisher-artwork') {
      pins[id] = { ...source, revision: '' };
      continue;
    }
    const previous = oldLock[id];
    const sameSource = previous?.repo === source.repo && previous?.branch === source.branch;
    let revision = source.revision ?? (update ? null : sameSource ? previous.revision : null) ?? (update ? null : source.initialRevision);
    if (!revision) revision = await resolveRevision(source, config.download.timeoutMs);
    if (!/^[a-f0-9]{40}$/.test(revision)) throw Error(`Could not resolve source revision: ${id}`);
    pins[id] = { ...source, revision };
  }
  await mkdir('.sync-stage', { recursive: true });
  const stage = await mkdtemp('.sync-stage/run-');
  let licenseChanged = false, reused = 0;
  for (const [id, source] of Object.entries(pins)) {
    const key = licenseKey(source), cache = cacheOptions(config, source);
    const prior = oldState.licenses?.[id];
    let bytes = source.kind === 'publisher-artwork' ? await readFile(source.licenseFile)
      : cache.enabled && !refresh && prior?.key === key ? await verifiedFile(`licenses/${id}-LICENSE.txt`, prior.sha256) : null;
    if (!bytes) bytes = await downloader.download(`https://raw.githubusercontent.com/${source.repo}/${source.revision}/${source.licenseFile ?? 'LICENSE'}`, cache);
    if (bytes.length < 100) throw Error(`Missing or incomplete license: ${id}`);
    state.licenses[id] = { key, sha256: hash(bytes) };
    if (!await verifiedFile(`licenses/${id}-LICENSE.txt`, hash(bytes))) licenseChanged = true;
    await save(`${stage}/licenses/${id}-LICENSE.txt`, bytes);
  }
  const indexes = new Map();
  async function resolveArtwork(item, source, cache) {
    const art = item.artwork ?? {};
    if (source.kind === 'publisher-artwork') {
      return { url: art.url, path: `icons/${item.id}.${art.format}`,
        variant: art.format === 'svg' ? 'official-svg' : art.presentation ? 'official-png-rounded' : 'official-png' };
    }
    let path = art.path, variant = art.variant ?? 'original';
    if (!path && source.adapter === 'devicon') {
      if (!indexes.has(item.source)) indexes.set(item.source, downloader.download(
        `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${source.index ?? 'devicon.json'}`, cache).then(bytes => JSON.parse(bytes.toString('utf8'))));
      const metadata = (await indexes.get(item.source)).find(entry => entry.name === item.id);
      const variants = metadata?.versions?.svg ?? [];
      variant = art.variant ?? ['original', 'plain', 'original-wordmark', 'plain-wordmark', 'line'].find(value => variants.includes(value));
      if (!variant || !variants.includes(variant)) throw Error(`No supported Devicon SVG variant: ${item.id}`);
      path = `icons/${item.id}/${item.id}-${variant}.svg`;
    }
    path ??= source.pathTemplate?.replaceAll('{id}', item.id).replaceAll('{variant}', variant);
    if (!path) throw Error(`Missing asset path: ${item.id}`);
    return { path, variant, url: `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${path}` };
  }
  const icons = new Array(selection.length), errors = [];
  let cursor = 0;
  async function worker() {
    while (cursor < selection.length) {
      const index = cursor++, item = selection[index];
      try {
        const source = pins[item.source], cache = cacheOptions(config, source), art = item.artwork ?? {};
        const official = source.kind === 'publisher-artwork';
        const png = official && art.format === 'png';
        const originalAsset = `icons/${item.id}.${png ? 'png' : 'svg'}`;
        const asset = png && art.presentation ? `icons/${item.id}.svg` : originalAsset;
        const prior = oldIcons.get(item.id), key = artworkKey(item, source, cache);
        state.icons[item.id] = key;
        let raw, upstreamSha256, location;
        if (cache.enabled && !refresh && (!official || art.sha256) && oldState.icons?.[item.id] === key && prior?.asset === asset) {
          raw = await verifiedFile(`assets/${originalAsset}`, png ? art.sha256 ?? prior.source.sha256 : prior.sha256);
          if (raw && (!png || !art.presentation || await verifiedFile(`assets/${asset}`, prior.sha256))) {
            upstreamSha256 = prior.source.sha256;
            location = { path: prior.source.path, url: prior.source.url, variant: prior.source.variant };
            reused++;
          } else raw = null;
        }
        location ??= await resolveArtwork(item, source, cache);
        if (!raw) {
          let bytes = await downloader.download(location.url, cache);
          if (art.archivePath) {
            if (hash(bytes) !== art.archiveSha256) throw Error('Artwork archive checksum mismatch');
            const entry = unzipSync(bytes)[art.archivePath];
            if (!entry) throw Error('Artwork missing from archive');
            bytes = Buffer.from(entry);
          }
          upstreamSha256 = hash(bytes);
          raw = official || source.preserveOriginal ? bytes : Buffer.from(normalizeSvg(bytes.toString('utf8')));
        }
        if (official && art.sha256 && hash(raw) !== art.sha256) throw Error('Artwork checksum mismatch; update the configured pin only after reviewing the source');
        const dimensions = png ? inspectPng(raw) : inspectSvg(raw.toString('utf8'));
        if (official && ((art.width !== undefined && dimensions.width !== art.width) || (art.height !== undefined && dimensions.height !== art.height))) throw Error('Artwork dimensions do not match configuration');
        if (official) officialIcons[item.id] = { ...art, ...dimensions, sha256: hash(raw) };
        if (png && art.presentation) {
          await save(`${stage}/assets/${originalAsset}`, raw);
          raw = Buffer.from(packageOfficialPng(raw, art.presentation));
          inspectSvg(raw.toString('utf8'));
        }
        const category = categoryMap.get(item.category);
        icons[index] = { ...prior, ...projectMetadata(item), aliases: [...new Set(item.aliases)],
          tags: [...new Set([...item.tags, category.name, ...category.keywords])],
          ...(item.softwareType === 'commercial' ? { usagePolicy: 'drawio-architecture-only', usagePolicyUrl: 'ICON_USAGE.md', brandPermissionStatus: 'not-verified' } : {}),
          asset, ...dimensions, sha256: hash(raw),
          source: { id: item.source,
            ...(official ? { kind: 'publisher-artwork', publisher: art.publisher, listing: art.listing, appId: art.appId, retrievedOn: art.retrievedOn }
              : { repository: `https://github.com/${source.repo}` }),
            revision: source.revision, path: location.path, url: location.url, variant: location.variant,
            sha256: upstreamSha256, collectionLicense: source.license,
            ...(art.archivePath ? { archivePath: art.archivePath, archiveSha256: art.archiveSha256 } : {}),
            licenseUrl: official ? art.licenseUrl ?? 'ICON_USAGE.md' : `https://github.com/${source.repo}/blob/${source.revision}/${source.licenseFile ?? 'LICENSE'}`,
            note: '图标集许可独立于软件许可；品牌标志及商标属于各自所有者。本项目仅用于标识，不代表官方背书。' } };
        await save(`${stage}/assets/${asset}`, raw);
      } catch (error) { errors.push(`${item.id}: ${error.message}`); }
    }
  }
  await Promise.all(Array.from({ length: config.download.concurrency }, worker));
  if (errors.length) throw Error(`Collection aborted; committed assets unchanged:\n${errors.join('\n')}`);
  const sortedOfficial = Object.fromEntries(Object.entries(officialIcons).sort(([a], [b]) => a.localeCompare(b, 'en')));
  for (const source of Object.values(pins)) if (source.kind === 'publisher-artwork') source.revision = hash(JSON.stringify(sortedOfficial));
  for (const icon of icons) icon.source.revision = pins[icon.source.id].revision;
  icons.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const catalog = { schemaVersion: 1, version: oldCatalog.version ?? '1.0.0', icons };
  const compare = icon => {
    if (!icon) return '';
    const copy = structuredClone(icon);
    delete copy.source.revision; delete copy.source.url; delete copy.source.licenseUrl;
    return stableJson(copy);
  };
  const changed = icons.filter(icon => compare(icon) !== compare(oldIcons.get(icon.id)));
  const selected = new Set(icons.map(icon => icon.id));
  const removed = [...oldIcons.keys()].filter(id => !selected.has(id));
  // A scheduled check must not open a PR for unrelated upstream commits. Keep
  // the reviewed revision when both artwork/metadata and source configuration
  // are unchanged; explicit configuration changes must still update their pins.
  if (update && !changed.length && !removed.length && !licenseChanged && selection.every(item => {
    const previous = oldLock[item.source];
    return previous && (!config.sources[item.source].revision || config.sources[item.source].revision === previous.revision)
      && oldState.icons?.[item.id] === artworkKey(item,
      { ...config.sources[item.source], revision: previous.revision }, cacheOptions(config, config.sources[item.source]));
  })) {
    for (const [id, source] of Object.entries(pins)) {
      source.revision = oldLock[id].revision;
      state.licenses[id] = oldState.licenses[id];
    }
    for (const icon of icons) {
      icon.source = oldIcons.get(icon.id).source;
      state.icons[icon.id] = oldState.icons[icon.id];
    }
  }
  if (changed.length || removed.length || licenseChanged) {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const entry = syncChangelogEntry(oldIcons, changed, removed, licenseChanged, date);
    if (entry) { entry.id += `-${history.length + 1}`; history.unshift(entry); }
  }
  // Downloads and validation above must all succeed before replacing artifacts.
  await cp(`${stage}/assets`, 'assets', { recursive: true });
  await cp(`${stage}/licenses`, 'licenses', { recursive: true });
  await saveJson('data/catalog.json', catalog);
  await saveJson('data/sources.lock.json', pins);
  await saveJson('data/icon-inputs.lock.json', state);
  await saveJson('data/official-icons.json', sortedOfficial);
  await saveJson('data/changelog.json', history);
  await save('.update-summary.md', changed.length || removed.length || licenseChanged
    ? `## 图标更新\n\n更新或新增 ${changed.length} 项，移除 ${removed.length} 项。\n\n${changed.map(icon => `- ${icon.name} (${icon.id})`).join('\n')}\n${removed.map(id => `- 移除 ${id}`).join('\n')}\n\n上游许可变化：${licenseChanged ? '是' : '否'}。\n`
    : 'No selected icon or license changes.\n');
  console.log(`Synced ${icons.length} icons: ${reused} local, ${downloader.stats.cached} cached, ${downloader.stats.revalidated} not modified, ${downloader.stats.downloaded} downloaded; ${changed.length} changed, ${removed.length} removed.`);
  return { count: icons.length, changed: changed.length, removed: removed.length, reused, ...downloader.stats };
}
