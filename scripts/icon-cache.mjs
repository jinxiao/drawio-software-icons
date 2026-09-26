import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { hash, save, saveJson } from './lib.mjs';

async function optional(path, encoding) {
  try { return await readFile(path, encoding); } catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
}
export function downloadCacheDirectory(config, env = process.env) {
  if (config.cache?.directory && config.cache.directory !== 'auto') return config.cache.directory;
  // Workers Builds persists the npm cache, but does not persist arbitrary Vite
  // output folders. Keep only our own namespaced downloads in that cache.
  return env.WORKERS_CI === '1'
    ? join(env.npm_config_cache || join(homedir(), '.npm'), 'drawio-software-icons')
    : '.sync-stage/cache';
}
export function createDownloader({ directory = '.sync-stage/cache', timeoutMs = 30000, refresh = false,
  fetchImpl = fetch, now = Date.now } = {}) {
  const pending = new Map();
  const stats = { downloaded: 0, cached: 0, revalidated: 0 };
  async function read(url, cache) {
    const key = hash(`${cache.version}\n${url}`), path = join(directory, `${key}.bin`);
    let bytes = cache.enabled ? await optional(path) : null;
    let metadata;
    const stored = cache.enabled ? await optional(`${path}.json`, 'utf8') : null;
    try { metadata = stored ? JSON.parse(stored) : null; } catch { metadata = null; }
    if (!metadata || metadata.url !== url || !bytes || hash(bytes) !== metadata.sha256) bytes = null;
    const fresh = cache.maxAgeHours === null || (Number.isFinite(metadata?.savedAt) && now() - metadata.savedAt < cache.maxAgeHours * 3600000);
    if (bytes && fresh && !refresh) { stats.cached++; return bytes; }
    const headers = {};
    if (bytes) {
      if (metadata.etag) headers['If-None-Match'] = metadata.etag;
      if (metadata.lastModified) headers['If-Modified-Since'] = metadata.lastModified;
    }
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 304 && bytes) {
      stats.revalidated++;
      await saveJson(`${path}.json`, { ...metadata, savedAt: now() });
      return bytes;
    }
    if (!response.ok) throw Error(`${response.status} ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    stats.downloaded++;
    if (cache.enabled) {
      await save(path, bytes);
      await saveJson(`${path}.json`, { url, sha256: hash(bytes), savedAt: now(),
        etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') });
    }
    return bytes;
  }
  return {
    stats,
    download(url, cache) {
      const key = JSON.stringify([url, cache]);
      if (!pending.has(key)) pending.set(key, read(url, cache));
      return pending.get(key);
    },
  };
}
