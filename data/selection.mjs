// Compatibility export; author icons in data/icons/*.json.
import { loadIconConfiguration, projectMetadata } from '../scripts/icon-config.mjs';
const { icons } = await loadIconConfiguration();
export const selection = icons.map(icon => ({ ...projectMetadata(icon), source: icon.source }));
