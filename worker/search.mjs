export const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().trim();

export function search(index, query, page, count) {
  const needle = normalize(query);
  if (!needle) return { images: [], total: 0, page, count };
  const terms = needle.split(/\s+/);
  const buckets = [[], [], [], []];
  for (const icon of index.icons) {
    if (!terms.every(term => icon.text.includes(term))) continue;
    const rank = icon.names.includes(needle) ? 0 : icon.names.some(name => name.startsWith(needle)) ? 1 :
      terms.every(term => icon.names.some(name => name.includes(term))) ? 2 : 3;
    buckets[rank].push(icon.image);
  }
  const matches = buckets.flat();
  return { images: matches.slice(page * count, (page + 1) * count), total: matches.length, page, count };
}

function integer(params, key, fallback, min, max) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < min || n > max) throw Error(`Invalid ${key}: expected ${min}..${max}`);
  return n;
}

export function createHandler(index) {
  return function handle(request) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
    const reply = (data, status = 200, extra = {}) => new Response(request.method === 'HEAD' ? null : JSON.stringify(data),
      { status, headers: { ...headers, ...extra } });
    const url = new URL(request.url);
    if (!['/api/icons/search', '/api/health'].includes(url.pathname)) return reply({ error: 'Not found' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS' } });
    if (!['GET', 'HEAD'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405, { Allow: 'GET, HEAD, OPTIONS' });
    if (url.pathname === '/api/health') return reply({ status: 'ok', icons: index.icons.length, version: index.version });
    try {
      const q = url.searchParams.get('q') ?? '';
      if (q.length > 256) throw Error('q exceeds 256 characters');
      const p = integer(url.searchParams, 'p', 0, 0, 1000000);
      const c = integer(url.searchParams, 'c', 20, 1, 100);
      const result = search(index, q, p, c);
      // Use this deployment's HTTPS origin so preview results exercise preview assets too.
      const origin = url.protocol === 'https:' ? url.origin : 'https://icons.rambow.cloud';
      result.images = result.images.map(image => ({ ...image, url: new URL(image.url, origin).href }));
      return reply(result, 200, { 'Cache-Control': 'public, max-age=300' });
    } catch (error) {
      return reply({ error: error.message }, 400);
    }
  };
}
