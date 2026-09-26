import index from '../.worker-build/search-index.json';
import { createHandler } from './search.mjs';

const handle = createHandler(index);
export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api' || path.startsWith('/api/')) return handle(request);
    return env.ASSETS.fetch(request);
  },
};
