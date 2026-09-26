import { syncIcons } from './sync-icons.mjs';
const flags = process.argv.slice(2);
if (flags.some(flag => !['--update', '--refresh'].includes(flag))) throw Error('Usage: npm run sync -- [--update] [--refresh]');
await syncIcons({ update: flags.includes('--update'), refresh: flags.includes('--refresh') });
