import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export default defineConfig(({ command, isPreview }) => {
  // Preview serves an already-built bundle; it does not need generated source files.
  const filename = command === 'serve' && isPreview ? 'unified-catalog.json' :
    `unified-catalog-${createHash('sha256').update(readFileSync(new URL('./public/unified-catalog.json', import.meta.url))).digest('hex')}.json`;
  return { base: './', define: { __CATALOG_FILE__: JSON.stringify(filename) } };
});
