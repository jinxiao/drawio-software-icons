# Cloudflare website and draw.io MCP icon service

Production cutover is configured as of 2026-09-26: `icons.rambow.cloud` is attached
to the Cloudflare Worker, and Workers Builds deploys `main` with
`npm run deploy:cloudflare:production`. Both GitHub Pages repositories have
`LEGACY_REDIRECTS=true`; their homepages redirect while resource paths remain
available. The software repository no longer has a GitHub Pages custom domain.

The website is deployed with **Workers Static Assets**. Existing HTML, JS, SVG,
PNG, JSON, XML and ZIP paths are served directly by static asset hosting. Only
`/api` and `/api/*` use Worker-first routing. Missing static files return 404;
they must not return the homepage in place of an XML library or image.

No database, R2 bucket, KV namespace, Node server or runtime upstream fetch is
needed. GitHub Actions still runs Node and Python builders. A compact, normalized
search index is compiled into the same Worker version as its static assets.
Static resources explicitly allow cross-origin reads so the draw.io web editor
can continue loading XML libraries and images from this domain.

## MCP contract

After production cutover, configure the **MCP server process** with:

```json
{
  "env": {
    "DRAWIO_ICON_SERVICE_URL": "https://icons.rambow.cloud/api/icons"
  }
}
```

Merge this `env` entry into your existing draw.io MCP server configuration and
restart that process. This is an icon-service HTTP endpoint, not an MCP transport
endpoint. Do not append `/search` or a trailing slash to the configured URL.
Before production cutover, use `https://<worker>.<account>.workers.dev/api/icons`.

Upstream source reviewed at commit `1da785068fdeb455f8f8cfae0b7799f1ff183894`:
[shared/icon-search.js](https://github.com/jgraph/drawio-mcp/blob/1da785068fdeb455f8f8cfae0b7799f1ff183894/shared/icon-search.js).
Both MCP servers use the same image response contract. The MCP prefers built-in
shapes and consults this service only when it has room for supplementary icons.

`GET /api/icons/search?q=kubernetes&p=0&c=10`

- `q`: up to 256 characters; Unicode NFKC normalization and case-insensitive AND
  matching across names, aliases, tags and category names in both languages.
- `p`: zero-based page, default 0, range 0–1,000,000.
- `c`: page size, default 20, range 1–100.
- Exact names/aliases rank first, followed by prefixes, name matches, then metadata.
- Missing/blank queries and unmatched terms return `images: []`.
- Invalid parameters return JSON 400; unsupported methods 405; unknown APIs 404.
- GET, HEAD and OPTIONS are supported; public read-only CORS is enabled.

```json
{
  "images": [{
    "url": "https://icons.rambow.cloud/icons/kubernetes.svg",
    "title": "Kubernetes",
    "width": 48,
    "height": 48,
    "set": { "slug": "software", "name": "General Software" }
  }],
  "total": 1,
  "page": 0,
  "count": 10
}
```

Dimensions preserve the source aspect ratio with the larger side at 48 units.
HTTPS requests return images from that deployment's origin. Local HTTP development
uses production HTTPS image URLs because upstream MCP rejects HTTP image URLs.
`GET /api/health` exposes the icon count and content-derived index version.
The existing [icon usage policy](../ICON_USAGE.md) applies to API results too.

## Build and deployment

```sh
npm ci
npm test
npm run build:cloudflare
npm run check:cloudflare
npm run dev:cloudflare
```

`build:cloudflare` retains `dist` and `dist-alibaba`, creates the bundled index
under `.worker-build`, and produces `dist-pages` / `dist-alibaba-pages` with redirect
homepages. It verifies search parity, static-asset size/count limits, and unchanged
legacy resource bytes. `check:cloudflare` bundles the Worker without deploying it.

Authenticate with `npx wrangler login`, then `npm run deploy:cloudflare` publishes
the site and API on workers.dev, without claiming the production domain. Both
deployment commands require a fresh `build:cloudflare` output.

### Cloudflare Workers Builds (current deployment pipeline)

The Cloudflare GitHub App connects `jinxiao/drawio-software-icons` directly to
Workers Builds. Pushes to `main` build and deploy the Worker from root directory
`/`. The configured build command creates a temporary Python environment,
installs `uv`, runs `npm test`, then runs `npm run build:cloudflare`. Cloudflare
installs npm dependencies before executing this command.

Use `npm run deploy:cloudflare` as the deploy command before domain cutover.
Set `NODE_VERSION=22` and `PYTHON_VERSION=3.13.3` under **Build variables**,
not Worker runtime variables. Non-main preview builds are currently disabled.

Workers Builds uses its Cloudflare-managed build token; no Cloudflare API token
is required in GitHub Actions secrets for this pipeline. Keep the GitHub
repository variable `CLOUDFLARE_ENABLED` unset to avoid deploying the same Worker
from two pipelines. GitHub Actions continues testing and publishing the GitHub
Pages compatibility sites.

### Alternative: deployment from GitHub Actions

If switching away from Workers Builds, disable its deployment trigger first.
For GitHub Actions configure repository secrets `CLOUDFLARE_API_TOKEN` (account
Workers Scripts edit; Zone edit for custom-domain setup as required by Cloudflare)
and `CLOUDFLARE_ACCOUNT_ID`. Keep tokens in secrets, never in source. Set repository
variable `CLOUDFLARE_ENABLED=true` to enable the Cloudflare job. Initially leave
`CLOUDFLARE_PRODUCTION` and `LEGACY_REDIRECTS` unset. Pages publication waits for
Cloudflare success whenever the Cloudflare job is enabled.

## Safe cutover and old GitHub Pages URLs

1. Deploy to workers.dev; open `/`, `/api/health`,
   `/api/icons/search?q=kubernetes&p=0&c=3`, and
   `/api/icons/search?q=云服务器&p=0&c=3` in a browser. Confirm JSON results and
   open one returned image. Check a library download and configure MCP with the
   workers.dev API URL to try `search_shapes`.
2. After preview acceptance, attach `icons.rambow.cloud` using the production
   environment (`npm run deploy:cloudflare:production`). An existing CNAME to
   GitHub Pages must be replaced during this step; do not delete it ahead of time.
   Cloudflare may require removing a conflicting DNS record before attaching the
   custom domain. Check Cloudflare's deployment/domain status and then open the
   main site in a browser. No local DNS probes are needed.
3. Change the Workers Builds deploy command to
   `npm run deploy:cloudflare:production` so subsequent deployments retain that
   domain. If using the alternative GitHub Actions deployment instead, set
   `CLOUDFLARE_PRODUCTION=true`.
   Remove the **Custom domain** setting from the software repository's GitHub
   Pages settings, so its github.io URL serves the compatibility artifact itself.
4. Set `LEGACY_REDIRECTS=true` in the software repository and publish the main
   workflow. Install the updated `deployment/alibaba-pages.yml` as
   `.github/workflows/pages.yml` in `jinxiao/alibaba-cloud-icons`, set its
   `LEGACY_REDIRECTS=true`, and dispatch it. Its cache key includes the switch, so
   changing the switch cannot incorrectly skip publication.

The old homepages redirect to the main site, retaining query parameters and
fragments. Alibaba's homepage adds `collection=alibaba-cloud` only when no
collection was specified. JavaScript performs the parameter-preserving redirect;
without JavaScript a meta refresh and a manual link open the default destination.
These are HTML redirects, not server-side HTTP 301 responses.

All old XML/SVG/PNG/JSON/ZIP paths remain real files on GitHub Pages. Do not add a
blanket 404 redirect or replace resource files with HTML. Existing desktop
configurations must keep loading their library URLs. The sitemap/canonical keep
the same primary domain, and no API URLs are added to the sitemap.

After cutover open both old github.io homepages and an old XML/image URL from each
repository. Homepages should navigate; resource URLs should still return their
original formats. Browser checks are intentional; this project does not use local
DNS probes or command-line HTTP smoke tests for deployment acceptance.

For rollback, unset `LEGACY_REDIRECTS` in both repos and rebuild/publish full Pages
sites before moving the custom domain back. Retain previous Cloudflare versions
and use Wrangler/dashboard rollback for Worker-only regressions.

## 中文摘要

静态网页、图标和下载由 Cloudflare Static Assets 直接响应，仅 `/api/*` 执行
Worker。Cloudflare Workers Builds 通过 GitHub App 自动构建和部署，搜索索引与网站
同版发布；GitHub Actions 继续测试和发布兼容站。先验证 workers.dev，
再切主域名，最后开启两仓库 `LEGACY_REDIRECTS`，旧首页跳转、旧资源继续保留。
仅提交这些代码不会自动切换线上域名；Workers Builds 的仓库连接、构建变量和迁移
开关需要配置。当前自动部署方案无需向 GitHub 添加 Cloudflare API Token。
MCP 设置 `DRAWIO_ICON_SERVICE_URL` 后需要重启对应 MCP 进程。

References: [Static Assets](https://developers.cloudflare.com/workers/static-assets/),
[routing](https://developers.cloudflare.com/workers/static-assets/routing/advanced/),
[limits](https://developers.cloudflare.com/workers/platform/limits/).
