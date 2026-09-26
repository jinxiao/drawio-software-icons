import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hash } from './lib.mjs';

export const stableJson = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b, 'en'))) : item);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const checksumPattern = /^[a-f0-9]{64}$/;
function requireValue(condition, message) { if (!condition) throw Error(message); }
function knownKeys(value, keys, label) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  for (const key of Object.keys(value)) requireValue(keys.includes(key), `${label}: unknown field ${key}`);
}
function https(value, label) {
  let url;
  try { url = new URL(value); } catch { throw Error(`${label}: expected an HTTPS URL`); }
  requireValue(url.protocol === 'https:' && !url.username && !url.password, `${label}: expected an HTTPS URL without credentials`);
}
function relativePath(value, label) {
  requireValue(typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !/[\\?#:]/.test(value)
    && value.split('/').every(part => part && part !== '.' && part !== '..'), `${label}: invalid relative path`);
}
export function cacheOptions(config, source = {}) {
  return { enabled: true, version: '1', maxAgeHours: null, ...config.cache, ...source.cache };
}
function validateCache(cache, label) {
  requireValue(typeof cache.enabled === 'boolean', `${label}.enabled must be boolean`);
  requireValue(typeof cache.version === 'string' && cache.version.length > 0, `${label}.version must be a nonempty string`);
  requireValue(cache.maxAgeHours === null || (Number.isFinite(cache.maxAgeHours) && cache.maxAgeHours >= 0), `${label}.maxAgeHours must be null or nonnegative`);
}
export function validateConfiguration(config, icons, categories) {
  knownKeys(config, ['$schema', 'schemaVersion', 'cache', 'download', 'defaults', 'sources'], 'configuration');
  requireValue(config.schemaVersion === 1, 'Unsupported icon configuration version');
  requireValue(config.sources && typeof config.sources === 'object', 'Missing sources');
  validateCache(cacheOptions(config), 'cache');
  if (config.cache) knownKeys(config.cache, ['enabled', 'version', 'maxAgeHours', 'directory'], 'cache');
  knownKeys(config.download, ['concurrency', 'timeoutMs'], 'download');
  if (config.cache?.directory !== undefined) requireValue(typeof config.cache.directory === 'string' && config.cache.directory.trim(), 'cache.directory must be a nonempty string');
  requireValue(Number.isInteger(config.download?.concurrency) && config.download.concurrency >= 1 && config.download.concurrency <= 32, 'download.concurrency must be 1–32');
  requireValue(Number.isInteger(config.download?.timeoutMs) && config.download.timeoutMs > 0, 'download.timeoutMs must be positive');
  for (const [id, source] of Object.entries(config.sources)) {
    knownKeys(source, ['kind', 'repo', 'branch', 'license', 'licenseFile', 'index', 'adapter', 'pathTemplate', 'preserveOriginal', 'revision', 'initialRevision', 'manifest', 'cache'], `source ${id}`);
    if (source.cache) knownKeys(source.cache, ['enabled', 'version', 'maxAgeHours'], `source ${id}.cache`);
    requireValue(idPattern.test(id), `Invalid source ID: ${id}`);
    requireValue(['github', 'publisher-artwork'].includes(source.kind), `Unsupported source kind: ${id}`);
    requireValue(typeof source.license === 'string' && source.license.length > 0, `Missing artwork license: ${id}`);
    validateCache(cacheOptions(config, source), `${id}.cache`);
    if (source.kind === 'github') {
      requireValue(/^[\w.-]+\/[\w.-]+$/.test(source.repo), `Invalid repository: ${id}`);
      requireValue(typeof source.branch === 'string' && /^[\w./-]+$/.test(source.branch), `Invalid branch: ${id}`);
      for (const key of ['revision', 'initialRevision']) if (source[key]) requireValue(revisionPattern.test(source[key]), `Invalid ${key}: ${id}`);
      if (source.index) relativePath(source.index, `${id}.index`);
      if (source.pathTemplate) {
        relativePath(source.pathTemplate, `${id}.pathTemplate`);
        requireValue(!/\{(?!id\}|variant\})/.test(source.pathTemplate), `Unknown path template variable: ${id}`);
      }
      if (source.licenseFile) relativePath(source.licenseFile, `${id}.licenseFile`);
      requireValue(!source.adapter || source.adapter === 'devicon', `Unsupported source adapter: ${id}`);
    } else {
      relativePath(source.licenseFile, `${id}.licenseFile`);
    }
  }
  const ids = new Set(), categoryIds = new Set(categories.map(category => category.id));
  requireValue(Array.isArray(icons) && icons.length > 0, 'No configured icons');
  for (const icon of icons) {
    knownKeys(icon, ['id', 'name', 'category', 'source', 'homepage', 'repository', 'softwareType', 'softwareLicense', 'classificationNote', 'aliases', 'tags', 'artwork'], `icon ${icon.id}`);
    requireValue(idPattern.test(icon.id) && !ids.has(icon.id), `Invalid or duplicate icon ID: ${icon.id}`);
    ids.add(icon.id);
    requireValue(typeof icon.name === 'string' && icon.name.trim(), `Missing name: ${icon.id}`);
    requireValue(categoryIds.has(icon.category), `Unknown category: ${icon.id}`);
    requireValue(Object.hasOwn(config.sources, icon.source), `Unknown source: ${icon.id}`);
    requireValue(['open-source', 'source-available', 'commercial', 'unverified'].includes(icon.softwareType), `Invalid softwareType: ${icon.id}`);
    https(icon.homepage, `${icon.id}.homepage`);
    if (icon.repository) https(icon.repository, `${icon.id}.repository`);
    for (const key of ['aliases', 'tags']) requireValue(Array.isArray(icon[key]) && icon[key].every(v => typeof v === 'string' && v.trim()), `${icon.id}.${key} must be an array of strings`);
    const art = icon.artwork ?? {};
    knownKeys(art, ['path', 'variant', 'url', 'format', 'sha256', 'width', 'height', 'publisher', 'listing', 'licenseUrl', 'retrievedOn', 'appId', 'name', 'artist', 'lookup', 'archivePath', 'archiveSha256', 'presentation'], `${icon.id}.artwork`);
    if (art.path) relativePath(art.path, `${icon.id}.artwork.path`);
    if (art.variant) requireValue(/^[\w-]+$/.test(art.variant), `Invalid variant: ${icon.id}`);
    if (config.sources[icon.source].kind === 'publisher-artwork') {
      https(art.url, `${icon.id}.artwork.url`);
      requireValue(['svg', 'png'].includes(art.format), `Explicit SVG/PNG format required: ${icon.id}`);
      if (art.sha256) requireValue(checksumPattern.test(art.sha256), `Invalid artwork checksum: ${icon.id}`);
      for (const dimension of ['width', 'height']) if (art[dimension] !== undefined) requireValue(Number.isFinite(art[dimension]) && art[dimension] > 0, `Invalid ${dimension}: ${icon.id}`);
      if (art.archivePath) {
        relativePath(art.archivePath, `${icon.id}.archivePath`);
        requireValue(checksumPattern.test(art.archiveSha256), `Archive checksum required: ${icon.id}`);
      }
      if (art.presentation) requireValue(art.format === 'png' && art.presentation.kind === 'rounded-rect'
        && Number.isFinite(art.presentation.radius) && art.presentation.radius > 0, `Invalid PNG presentation: ${icon.id}`);
    } else {
      requireValue(art.path || config.sources[icon.source].pathTemplate || config.sources[icon.source].adapter === 'devicon', `No asset path rule: ${icon.id}`);
      requireValue(!art.url && !art.presentation && (!art.format || art.format === 'svg'), `GitHub sources require SVG paths: ${icon.id}`);
    }
  }
  return { config, icons, categories };
}
export async function loadIconConfiguration(root = '.') {
  const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
  const config = await read('data/icon-sources.json');
  const names = (await readdir(join(root, 'data/icons'))).filter(name => name.endsWith('.json')).sort();
  const icons = [];
  for (const name of names) {
    const document = await read(`data/icons/${name}`);
    knownKeys(document, ['$schema', 'icons'], `data/icons/${name}`);
    requireValue(Array.isArray(document.icons), `data/icons/${name}: icons must be an array`);
    for (const entry of document.icons) icons.push({ repository: null, softwareLicense: null, aliases: [], tags: [], ...config.defaults, ...entry });
  }
  return validateConfiguration(config, icons, await read('data/categories.json'));
}
export function artworkKey(icon, source, cache) {
  // Metadata edits do not redownload artwork. URL sources are pinned per icon,
  // so adding another icon must not invalidate this one's cached bytes.
  const { cache: ignored, ...definition } = source;
  if (definition.kind === 'publisher-artwork') delete definition.revision;
  return hash(stableJson({ id: icon.id, source: definition, artwork: icon.artwork ?? {}, cacheVersion: cache.version }));
}
export const licenseKey = source => hash(stableJson(source.kind === 'github'
  ? { repo: source.repo, revision: source.revision, path: source.licenseFile ?? 'LICENSE' }
  : { path: source.licenseFile }));
export function projectMetadata(icon) {
  const { id, name, category, homepage, repository, softwareType, softwareLicense, classificationNote } = icon;
  return { id, name, category, homepage, repository, softwareType, softwareLicense, classificationNote };
}
