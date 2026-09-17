# One source, two Pages sites / 单一源码、双站点发布

The authoritative source is `jinxiao/drawio-software-icons`. The former Alibaba
source is maintained in `collections/alibaba-cloud`, with its original license,
notices, source pins, artwork, builder and tests. `ORIGIN.json` records the import.
Do not rename or delete either repository while its Pages URLs are in use.

| Site | Build directory | Default collection | Legacy catalog |
| --- | --- | --- | --- |
| `jinxiao.github.io/drawio-software-icons/` | `dist` | General Software | Software schema |
| `jinxiao.github.io/alibaba-cloud-icons/` | `dist-alibaba` | Alibaba Cloud | Alibaba schema |

Both serve the same bilingual UI and a content-addressed unified catalog. Use
`?collection=all`, `?collection=software` or `?collection=alibaba-cloud` to override
the entrypoint default. Old category query IDs are accepted.

The software site's `libraries/all.xml`, localized and legacy category XMLs,
`icons/`, `catalog.json`, and `downloads/drawio-software-icons.zip` retain their
software-only contracts. The Alibaba site's `drawio/`, `svg/`, `config/alibaba-cloud.json`,
`plugins/alibaba-cloud.js`, `catalog.json`, `catalog.csv`, `summary.json`, original
documentation and `alibaba-cloud-drawio.zip` retain their previous formats. Its
homepage changes, and its checksums are regenerated for the new site. All original
Alibaba outputs also remain under `compat/alibaba-cloud/` on both sites.

New shared downloads: `downloads/drawio-icons.zip`, `libraries/combined.xml`,
`config/drawio-icons.en.json`, and `config/drawio-icons.zh-CN.json`. Unified guides
live under `guides/`, avoiding collisions with legacy Alibaba documentation.

## Publishing

1. Main pushes run `.github/workflows/ci-pages.yml`, test both collections and
   build both targets, then publish `dist` to the software site's Pages.
2. `deployment/alibaba-pages.yml` is installed as `.github/workflows/pages.yml`
   in the Alibaba repository. It resolves the latest successful main push of the
   source workflow, checks out that exact commit and publishes `dist-alibaba`.
3. The compatibility publisher checks hourly (GitHub may delay scheduled runs).
   A successful-publication cache skips unchanged commits. It only records the
   cache after Pages deployment succeeds, so failures remain retryable.
4. For immediate synchronization, run the Alibaba workflow manually. An optional
   full source commit SHA supports deliberate rollback. Both repos must use
   **GitHub Actions** as their Pages source. No cross-repository write token is used.

Keep the template and installed compatibility workflow synchronized when changing
publishing behavior. All artwork and UI changes belong in the main source repo.
Historical source in the old repo is retained for reference, not built or updated.

## Browser verification after publishing

Open both original URLs. Software should be selected on the software site; Alibaba
Cloud should be selected on the Alibaba site. Toggle the all-icons checkbox, switch collections and languages,
search for Git and ECS, and open one category in draw.io. Select categories from
both collections, paste a backed-up existing configuration into **Categories /
desktop setup**, generate a merged result and inspect that unrelated settings
remain. Apply it in Desktop via **Extras → Configuration**, restart, and enable
the collections in **More Shapes** if persisted sidebar preferences hide them.
No custom JavaScript plugin is required for this workflow.

## 中文

当前仓库是唯一源码入口；阿里云原始数据、构建器、测试及许可迁入
`collections/alibaba-cloud/`。两个仓库及 Pages 地址继续保留，不做仓库重命名。
每次构建生成 `dist/` 和 `dist-alibaba/`，页面相同，默认图标集及旧目录数据契约不同。
旧 XML、JSON、插件、SVG、ZIP 和许可文件继续发布，新站使用独立的带哈希目录文件。

阿里云旧仓库每小时检查主仓库最近一次发布成功的版本（GitHub 定时任务可能延迟），
按提交号构建并发布，重复版本跳过。需要立即同步时手动运行工作流；指定完整提交号
可回退到已知版本。不需要跨仓库写权限令牌。修改发布规则时同步更新模板和旧仓库工作流。

上线后请打开两个旧网址，检查加载全部图标复选框、默认图标集、语言切换、Git / ECS 搜索和分类加载。
已有桌面配置可在网站中合并，再复制回「其他 → 配置」，应用并重启；若侧栏未出现，
在「更多图形」中启用图标集。此流程不需要安装 JS 插件。
