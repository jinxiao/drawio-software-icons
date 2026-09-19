# Contributing / 贡献指南

## Requests and pull requests / 提交需求与 PR

Use the homepage's **Request an icon / feature** link or the [request forms](https://github.com/jinxiao/drawio-software-icons/issues/new/choose) to suggest icons, correct artwork or report problems. No code changes are required. Include product names, the official homepage, the collection, your use case, and any known artwork sources or brand terms. English and Chinese are both welcome.

Already have changes? Use **Submit a PR** on the homepage or [compare your branch or fork](https://github.com/jinxiao/drawio-software-icons/compare). The PR template collects the change summary, related issue, icon provenance, validation results and compatibility impact. Both website entrypoints send contributions to this repository.

仅提需求可点击首页的**提交图标 / 功能需求**，填写图标申请或功能反馈表单，无需修改代码。请提供产品名称、官网、图标集、使用场景，以及已知的素材来源或品牌规范，中英文均可。

已有修改则点击首页的**提交 PR**，选择你的分支或 Fork，按自动填入的模板说明变更、关联需求、图标来源、验证结果和兼容性影响。主站与阿里云入口统一在本仓库处理。

## Add or correct an icon / 添加或修正图标

1. Edit `data/selection.mjs`: choose a stable lowercase ID, one primary category and the official project homepage or repository. Devicon entries use their upstream ID; Dashboard Icons entries use the SVG filename without `.svg`.
2. Set a readable brand name in `names` when it differs from simple capitalization. Add ambiguous or mixed-license projects to `unverified`; never classify software from the icon collection's license.
3. Run `npm run sync` to collect against pinned revisions. If a new icon only exists upstream, use `npm run sync -- --update` and review all affected changes.
4. Run `npm test` and `npm run build`. Open the local preview to inspect the artwork on light and dark backgrounds. Confirm the correct icon / brand, reasonable margins and an intact aspect ratio. Follow the README browser checks for draw.io.
5. Include catalog, SVG, pins and any updated license texts in the PR. Explain classification or source changes and provide project references.

编辑清单时给每个软件选择一个主分类，跨用途使用搜索标签；不要通过重复图标或多个变体增加收录数。添加软件时使用真实项目地址，许可不清晰则标记待核实。更新图标后检查预览，并随 PR 提交来源、SVG、清单及锁定版本。

## Localization / 中英文

Icon update history lives in `data/changelog.json`, newest batch first, with dates in Asia/Shanghai. `npm run sync` automatically appends added, updated and removed software icon groups (and license-only changes); review its generated English and Chinese title/summary before merging. Manual artwork changes and collection imports must add an entry too. Keep historical names and removed IDs, and record separate batches rather than overwriting past entries. Validation requires every current software icon to have an addition record. Builds generate both Markdown changelogs, the website timeline and offline ZIP copies from this single source.

图标日志维护在 `data/changelog.json`，最新批次在前，日期采用 Asia/Shanghai。采集脚本自动记录新增、更新、移除及许可变更，合并前可补充具体的中英文说明；手动替换素材或合并图标集也须添加记录。保留历史名称及已移除 ID，不覆盖旧批次。构建会从同一份数据生成网站时间线、中英文 Markdown 和离线包中的日志。

Observability additions live in `data/observability.mjs`, including bilingual aliases and telemetry-specific tags. Keep them in the existing Monitoring & Security category. Grafana publisher SVGs are pinned in `data/official-icons.json` with `format: "svg"` and preserved unchanged. Dashboard Icons additions use their existing pinned revision. Software project licensing is separate from artwork rights; do not classify hosted or enterprise editions from the community repository's license.

监控类新增项目维护于 `data/observability.mjs`，补充中英文别名及日志、指标、追踪等搜索标签，沿用「监控与安全」分类。Grafana 官方 SVG 在素材清单中固定版本并原样保留；不要将社区版的软件许可套用到品牌图标、托管服务或企业版。

AI additions belong in `data/ai.mjs` under the existing `data` (Analytics & AI) category. Choose the upstream color SVG when available, record its exact filename and add Chinese / English aliases. Classify the linked tool or hosted service separately from model-weight licenses. Lobe Icons artwork is community-collected; do not label it as an official publisher download or infer brand-use permission from its MIT license.

UI strings are paired in `src/i18n.ts`. Categories use `data/categories.json` and `data/categories.en.json`. Both locales must contain corresponding entries. Product names remain in their original language. Search uses both category languages regardless of the selected UI language. Keep the default English `README.md` and Chinese `README.zh-CN.md` in sync; `README.en.md` is a compatibility link.

Messaging and enterprise additions are maintained in `data/communication.mjs`, with Chinese / English aliases and a reviewed software type. Add each upstream source with a fixed revision, license text and SVG path in the collector. Commercial entries must retain their `drawio-architecture-only` project-use metadata. Follow `ICON_USAGE.md`; never infer brand-owner permission from an icon collection license. Preserve upstream rights, attribution and source requirements, including verbatim GPL SVG source where applicable.

## Stable interfaces / 稳定接口

Keep icon IDs stable. Classify projects by purpose using `data/taxonomy.mjs`, independently of their upstream collection. When merging categories, add retired IDs to `categoryAliases` and preserve published localized library paths in `data/legacy-categories.json`. The generator serves those paths with the successor category while the ZIP and website list only current categories. Renames without compatibility mappings are breaking changes. Additive metadata may keep `schemaVersion: 1`; incompatible schema changes require a version increase.

分类调整使用 `data/taxonomy.mjs`，同类项目统一归类。合并分类时保留旧 ID 映射和 XML 地址，避免已保存的链接失效；中英文分类与使用说明需同步更新。

SVGs must be safe and self-contained. Scripts, event handlers, external resources and invalid dimensions fail validation. Do not rasterize, recolor or redraw a logo merely to bypass a validation failure; investigate the source or exclude the entry.

Official publisher PNGs are also supported. Prefer original color publisher artwork over monochrome substitutes. Pin each PNG's exact URL, official product listing, publisher, dimensions and SHA-256 in `data/official-icons.json`; never silently replace it during monthly updates. Keep original pixels, distinguish Feishu from Lark, and describe PNG as raster artwork. Use `inspectPng` validation and embed PNG bytes directly in libraries. The dedicated rights notice must not claim an open-source artwork license.

For DingTalk, the manifest's `presentation` adds an SVG rounded-corner clip around the original PNG. Preserve both source and packaged hashes and include the original PNG in the ZIP. Do not replace this with website-only CSS: downloads and draw.io must use the same clipped asset.
