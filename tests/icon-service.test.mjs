import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../worker/search.mjs';
import { redirectHtml } from '../scripts/legacy-redirect.mjs';
import { runInNewContext } from 'node:vm';

const icon = (id, names, text, collection = 'software') => ({ id, names, text, image: {
  url: `/icons/${id}.svg`, title: id, width: 48, height: 24, set: { slug: collection, name: collection } } });
const index = { version: 'test', icons: [icon('guide', ['guide'], 'guide git'), icon('git', ['git'], 'git'),
  icon('gitlab', ['gitlab'], 'gitlab'), icon('kubernetes', ['kubernetes', 'k8s'], 'kubernetes k8s 容器编排'),
  icon('ecs', ['ecs', '云服务器'], 'ecs 云服务器 alibaba cloud', 'alibaba-cloud')] };
const handle = createHandler(index);
const request = (query = '', options) => new Request(`https://preview.workers.dev/api/icons/search?${query}`, options);

test('MCP response uses HTTPS images, dimensions, set and ranked bilingual matches', async () => {
  const result = await handle(request('q=ＧＩＴ&p=0&c=3')).json();
  assert.deepEqual(result.images.map(i => i.title), ['git', 'gitlab', 'guide']);
  assert.equal(result.total, 3);
  for (const image of result.images) {
    assert.match(image.url, /^https:\/\/preview\.workers\.dev\/icons\//);
    assert.doesNotMatch(image.url.substring(8), /[;&"'<>\s]/);
    assert.equal(image.width / image.height, 2);
    assert.equal(typeof image.set.name, 'string');
  }
  for (const q of ['k8s', '容器编排']) assert.equal((await handle(request(`q=${encodeURIComponent(q)}`)).json()).images[0].title, 'kubernetes');
  assert.equal((await handle(request('q=云服务器')).json()).images[0].set.slug, 'alibaba-cloud');
});

test('pagination is bounded, stable and empty queries do not dump the catalog', async () => {
  assert.deepEqual((await handle(request('q=git&p=1&c=1')).json()).images.map(i => i.title), ['gitlab']);
  for (const query of ['', 'q=%20', 'q=unknown', 'q=git&p=999']) assert.deepEqual((await handle(request(query)).json()).images, []);
  for (const query of ['c=0', 'c=101', 'c=1.5', 'p=-1', 'p=NaN', 'p=9007199254740992', `q=${'x'.repeat(257)}`]) {
    assert.equal(handle(request(query)).status, 400);
  }
});

test('routing, methods, CORS, HEAD and health return proper HTTP contracts', async () => {
  assert.equal(handle(new Request('https://example.com/api/missing')).status, 404);
  const post = handle(request('q=git', { method: 'POST' }));
  assert.equal(post.status, 405);
  assert.match(post.headers.get('Allow'), /GET/);
  const preflight = handle(request('', { method: 'OPTIONS' }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(await handle(request('q=git', { method: 'HEAD' })).text(), '');
  assert.equal((await handle(new Request('https://example.com/api/health')).json()).icons, index.icons.length);
});

test('legacy homepages preserve filters and fragments, default Alibaba collection and avoid loops', () => {
  for (const collection of ['software', 'alibaba-cloud']) {
    const html = redirectHtml(collection);
    assert.match(html, /<noscript><meta http-equiv="refresh"/);
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for (const search of ['', '?q=ecs&category=compute', '?collection=all&q=a%26b']) {
      let destination;
      runInNewContext(script, { URL, location: { origin: 'https://jinxiao.github.io', search, hash: '#library', replace: value => { destination = new URL(value); } } });
      assert.equal(destination.origin, 'https://icons.rambow.cloud');
      assert.equal(destination.hash, '#library');
      for (const [key, value] of new URLSearchParams(search)) assert.equal(destination.searchParams.get(key), value);
      if (collection === 'alibaba-cloud' && !search.includes('collection=')) assert.equal(destination.searchParams.get('collection'), 'alibaba-cloud');
    }
    runInNewContext(script, { URL, location: { origin: 'https://icons.rambow.cloud', search: '', hash: '', replace: () => assert.fail('Redirect loop') } });
  }
});
