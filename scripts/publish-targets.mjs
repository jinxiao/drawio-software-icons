import { cp, readdir, readFile, lstat, rm } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { save, hash } from './lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = resolve(root, 'dist-alibaba');
if (resolve(process.cwd()) !== resolve(root) || relative(root, target) !== 'dist-alibaba') throw Error('Run from project root');
const stat = await lstat(target).catch(e => { if (e.code !== 'ENOENT') throw e; });
if (stat?.isSymbolicLink()) throw Error('Publishing target must not be a symlink');
if (stat) await rm(target, { recursive: true });
await cp('dist', target, { recursive: true });
for (const entry of await readdir('dist/compat/alibaba-cloud')) {
  if (entry === 'index.html' || entry === 'SHA256SUMS.json') continue;
  await cp(`dist/compat/alibaba-cloud/${entry}`, `${target}/${entry}`, { recursive: true });
}
// The unified UI always uses a hashed catalog; catalog.json keeps each site's old schema.
async function files(path, prefix = '') {
  const result = [];
  for (const e of await readdir(path, { withFileTypes: true })) {
    const name = prefix + e.name;
    result.push(...(e.isDirectory() ? await files(`${path}/${e.name}`, `${name}/`) : [name]));
  }
  return result;
}
const checksums = {};
for (const path of (await files(target)).sort()) {
  checksums[path] = hash(await readFile(`${target}/${path}`));
}
await save(`${target}/SHA256SUMS.json`, JSON.stringify(checksums, null, 2) + '\n');
console.log('Prepared software and Alibaba Pages targets with original resource contracts.');
