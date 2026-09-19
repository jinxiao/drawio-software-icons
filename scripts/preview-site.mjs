import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function snapshot(directory, prefix = '') {
  const files = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) {
      for (const [name, hash] of await snapshot(`${directory}/${entry.name}`, `${path}/`)) files.set(name, hash);
    } else if (entry.isFile()) {
      files.set(path, createHash('sha256').update(await readFile(`${directory}/${entry.name}`)).digest('hex'));
    } else throw Error(`Unexpected non-regular artifact entry: ${path}`);
  }
  return files;
}

export async function addHomepagePreview(productionDir, previewDist, metadata) {
  await readFile(`${productionDir}/index.html`);
  const production = await snapshot(productionDir);
  if ((await readdir(productionDir)).includes('preview')) throw Error('Production artifact already contains a preview path.');
  const html = await readFile(`${previewDist}/index.html`, 'utf8');
  if (!html.includes('<head>')) throw Error('Preview HTML has no head element.');
  await snapshot(previewDist); // Reject symlinks before copying.
  const preview = `${productionDir}/preview/homepage`;
  await cp(previewDist, preview, { recursive: true, errorOnExist: true, force: false });
  await writeFile(`${preview}/index.html`, html.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">'));
  await writeFile(`${preview}/preview.json`, JSON.stringify({ ...metadata, previewPath: 'preview/homepage/' }, null, 2) + '\n');
  const combined = await snapshot(productionDir);
  for (const [path, hash] of production) {
    if (combined.get(path) !== hash) throw Error(`Production file changed: ${path}`);
  }
  for (const path of combined.keys()) {
    if (!production.has(path) && !path.startsWith('preview/homepage/')) throw Error(`Unexpected file outside the preview: ${path}`);
  }
  return production.size;
}
