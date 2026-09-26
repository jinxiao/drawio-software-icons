# 配置驱动的图标采集 / Configuration-driven icons

日常新增或修改通用软件图标，只需编辑 `data/icons/*.json` 并提交。网站、搜索 API、draw.io 图标库和 ZIP 使用同一份生成目录，不需要逐处改代码。

Add or edit an icon in `data/icons/*.json` and commit the configuration. Builds resolve the source, download missing artwork, validate it and generate all consumers. `data/catalog.json`, `data/official-icons.json`, `data/sources.lock.json` and `data/icon-inputs.lock.json` are generated outputs; do not edit them by hand.

## 新增图标

每个配置文件包含一个 `icons` 数组。构建自动发现目录中的所有 JSON 文件，文件名不决定图标分类，条目的 `category` 才决定分类。下面以已有 Redis 的配置形态为例；已有 ID 不应重复添加：

```json
{
  "$schema": "../schemas/icons.schema.json",
  "icons": [
    {
      "id": "redis",
      "name": "Redis",
      "category": "databases",
      "source": "devicon",
      "homepage": "https://redis.io",
      "softwareType": "source-available",
      "aliases": ["Redis 数据库"],
      "tags": ["cache", "缓存"],
      "artwork": { "variant": "original" }
    }
  ]
}
```

- `id`：稳定的小写 ID，不要为已有图标改名。
- `source`：引用 `data/icon-sources.json` 中的来源。
- `category`：引用 `data/categories.json` 中的分类。
- `aliases`、`tags`：可选，中英文均可；分类搜索词由构建补充。
- `softwareType`：未填写时为 `unverified`。软件许可与图形素材许可分别记录。
- `artwork`：可选；支持的默认来源规则能定位素材时可以省略。

Devicon 自动从固定版本索引选择 SVG 变体，也可指定 `artwork.variant` 或完整 `artwork.path`。Dashboard Icons 默认读取 `svg/{id}.svg`。Lobe Icons、自定义 GitHub 来源可直接配置 `artwork.path`，例如 `packages/static-svg/icons/claude-color.svg`，并设置 `variant: "color"`。

GitHub 来源默认锁定当前收录的提交。若新增图标只存在于较新提交，可以在来源配置中设置 `revision` 为该提交的 40 位 SHA；普通构建和月度更新都尊重显式 `revision`。去掉它后，`npm run sync -- --update` 才会跟踪配置的分支。`initialRevision` 仅在没有适用锁文件时提供初始版本。

## URL、PNG 和原始素材

发布者原图使用 `source: "official-apps"`，将素材描述放在同一条配置的 `artwork` 中：

```json
{
  "url": "https://publisher.example/assets/product.png",
  "format": "png",
  "publisher": "发布者名称",
  "listing": "https://publisher.example/product",
  "retrievedOn": "2026-09-26"
}
```

`format` 必须为 `svg` 或 `png`。推荐同时填写 `sha256` 固定原始内容；也可固定 `width`、`height`。省略哈希时，首次下载会生成哈希，但该 URL 仍视为可变来源，按下载缓存有效期检查，而不是永久复用本地素材。来源条款由 source 的 `license`、本地 `licenseFile` 和可选 `artwork.licenseUrl` 记录；新增其他来源条款时增加一个 source 配置即可。

支持 ZIP 内的原图：配置 `archivePath`、`archiveSha256` 和原图的 `sha256`。PNG 的圆角展示可通过 `presentation: { "kind": "rounded-rect", "radius": 112 }` 描述，保留 PNG 原图并生成 SVG 包装。不要用网页 CSS 代替导出素材的处理，也不要把包装 PNG 的 SVG 当成纯矢量。

## 缓存配置

`data/icon-sources.json`：

```json
{
  "cache": {
    "directory": "auto",
    "enabled": true,
    "version": "1",
    "maxAgeHours": null
  },
  "download": {
    "concurrency": 8,
    "timeoutMs": 30000
  }
}
```

以上是配置片段，需要保留文件中的 `schemaVersion`、`defaults` 和 `sources`。

| 设置 | 含义 |
| --- | --- |
| `enabled: true` | 复用校验通过的固定版本本地素材和下载缓存 |
| `enabled: false` | 跳过本地素材和磁盘下载缓存，每次同步重新请求 |
| `version` | 下载缓存命名空间；改变它会使旧图标缓存失效，无需删除目录 |
| `maxAgeHours: null` | 下载缓存不过期；适合固定提交、固定哈希的素材 |
| `maxAgeHours: 24` | 下载缓存 24 小时后重新验证；远端支持时使用 ETag / Last-Modified，304 不传输文件内容 |
| `directory: "auto"` | 本地及 GitHub Actions 使用 `.sync-stage/cache`；Workers Builds 使用 npm 缓存下的 `drawio-software-icons` 子目录 |
| `directory: ".my-icon-cache"` | 自定义目录；CI 需要另行持久化这个目录 |

每个 source 可以通过 `cache` 覆盖 `enabled`、`version`、`maxAgeHours`。例如经常变化的 URL 来源可设 `"cache": { "maxAgeHours": 24 }`。

固定版本本地素材的复用优先于下载缓存，不受下载缓存 TTL 影响：输入指纹及文件 SHA-256 都一致时不发 HTTP 请求。修改名称、别名、标签不会重新下载素材；修改素材地址、路径、来源版本或缓存版本会重新解析素材。已有许可证仍按固定来源和哈希复用。

GitHub Actions 已配置跨构建缓存。Cloudflare Workers Builds 使用系统提供的 `WORKERS_CI=1` 识别构建环境，将下载缓存放在 npm 缓存的独立子目录；需要在 Cloudflare 的 **Settings → Build → Build cache** 开启平台缓存，才会跨构建保留。平台清理缓存后，下次构建会重新下载缺失文件，不影响正确性。自定义目录不会自动获得 Cloudflare 持久化。

参考：[Workers Builds 环境变量](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[构建缓存范围](https://developers.cloudflare.com/workers/ci-cd/builds/build-caching/)。

## 构建与验证

```sh
npm run build:cloudflare
npm test
```

`build`、`build:cloudflare`、`dev`、`test` 都先同步配置。构建日志会显示 local / cached / not modified / downloaded 的数量。仅使用已有产物且禁止采集时，运行 `npm run build:offline`；配置和产物不一致会报错。

```sh
npm run sync -- --refresh
npm run sync -- --update
```

`--refresh` 强制检查缓存内容，不切换来源版本；`--update` 更新未显式指定 `revision` 的 GitHub 来源。校验或下载失败会终止构建，所有图标处理成功前不会覆盖已有素材、目录或锁文件，也不会继续部署。

本地查看可运行 `npm run dev`，打开终端给出的地址，搜索新增名称和别名，并检查 SVG/PNG、XML、ZIP 下载。合并并发布后，在主站重复同样检查。

阿里云的导入快照仍由 `collections/alibaba-cloud` 的原有构建器生成，以保留 888 个图标的历史资源地址；本次通用软件采集配置不改变该兼容目录。
