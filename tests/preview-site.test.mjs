import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addHomepagePreview } from '../scripts/preview-site.mjs';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'homepage-preview-test-'));
  const production = join(root, 'production'), preview = join(root, 'preview-build');
  await mkdir(join(production, 'libraries'), { recursive: true });
  await mkdir(join(preview, 'libraries'), { recursive: true });
  await writeFile(join(production, 'index.html'), '<head></head><body>Production</body>');
  await writeFile(join(production, '.nojekyll'), '');
  await writeFile(join(production, 'libraries/all.xml'), '<mxlibrary>production</mxlibrary>');
  await writeFile(join(preview, 'index.html'), '<head></head><body>Preview</body>');
  await writeFile(join(preview, 'libraries/all.xml'), '<mxlibrary>preview</mxlibrary>');
  return { production, preview };
}

test('preview preserves production HTML, hidden files and library bytes, and keeps assets relative', async () => {
  const { production, preview } = await fixture();
  assert.equal(await addHomepagePreview(production, preview, { productionSha: 'main-sha', previewSha: 'preview-sha' }), 3);
  assert.equal(await readFile(join(production, 'index.html'), 'utf8'), '<head></head><body>Production</body>');
  assert.equal(await readFile(join(production, '.nojekyll'), 'utf8'), '');
  assert.equal(await readFile(join(production, 'libraries/all.xml'), 'utf8'), '<mxlibrary>production</mxlibrary>');
  assert.equal(await readFile(join(production, 'preview/homepage/libraries/all.xml'), 'utf8'), '<mxlibrary>preview</mxlibrary>');
  assert.match(await readFile(join(production, 'preview/homepage/index.html'), 'utf8'), /noindex, nofollow.*Preview/);
  assert.equal(await readFile(join(preview, 'index.html'), 'utf8'), '<head></head><body>Preview</body>');
  assert.equal(JSON.parse(await readFile(join(production, 'preview/homepage/preview.json'), 'utf8')).productionSha, 'main-sha');
});

test('preview refuses path collisions and invalid builds before writing to the production tree', async () => {
  const { production, preview } = await fixture();
  await writeFile(join(preview, 'index.html'), 'invalid build');
  await assert.rejects(addHomepagePreview(production, preview, {}), /no head element/);
  assert.equal((await readdir(production)).includes('preview'), false);
  await mkdir(join(production, 'preview'));
  await assert.rejects(addHomepagePreview(production, preview, {}), /already contains a preview path/);
  assert.deepEqual(await readdir(join(production, 'preview')), []);
});
