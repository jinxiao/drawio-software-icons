# Contributing / 贡献指南

## Add or correct an icon / 添加或修正图标

1. Edit `data/selection.mjs`: choose a stable lowercase ID, one primary category and the official project homepage or repository. Devicon entries use their upstream ID; Dashboard Icons entries use the SVG filename without `.svg`.
2. Set a readable brand name in `names` when it differs from simple capitalization. Add ambiguous or mixed-license projects to `unverified`; never classify software from the icon collection's license.
3. Run `npm run sync` to collect against pinned revisions. If a new icon only exists upstream, use `npm run sync -- --update` and review all affected changes.
4. Run `npm test` and `npm run build`. Open the local preview to inspect the artwork on light and dark backgrounds. Confirm the correct icon / brand, reasonable margins and an intact aspect ratio. Follow the README browser checks for draw.io.
5. Include catalog, SVG, pins and any updated license texts in the PR. Explain classification or source changes and provide project references.

编辑清单时给每个软件选择一个主分类，跨用途使用搜索标签；不要通过重复图标或多个变体增加收录数。添加软件时使用真实项目地址，许可不清晰则标记待核实。更新图标后检查预览，并随 PR 提交来源、SVG、清单及锁定版本。

## Localization / 中英文

UI strings are paired in `src/i18n.ts`. Categories use `data/categories.json` and `data/categories.en.json`. Both locales must contain corresponding entries. Product names remain in their original language. Search uses both category languages regardless of the selected UI language. Keep the default English `README.md` and Chinese `README.zh-CN.md` in sync; `README.en.md` is a compatibility link.

Messaging and enterprise additions are maintained in `data/communication.mjs`, with Chinese / English aliases and a reviewed software type. Add each upstream source with a fixed revision, license text and SVG path in the collector. Commercial entries must retain their `drawio-architecture-only` project-use metadata. Follow `ICON_USAGE.md`; never infer brand-owner permission from an icon collection license. Preserve upstream rights, attribution and source requirements, including verbatim GPL SVG source where applicable.

## Stable interfaces / 稳定接口

Keep icon IDs stable. Classify projects by purpose using `data/taxonomy.mjs`, independently of their upstream collection. When merging categories, add retired IDs to `categoryAliases` and preserve published localized library paths in `data/legacy-categories.json`. The generator serves those paths with the successor category while the ZIP and website list only current categories. Renames without compatibility mappings are breaking changes. Additive metadata may keep `schemaVersion: 1`; incompatible schema changes require a version increase.

分类调整使用 `data/taxonomy.mjs`，同类项目统一归类。合并分类时保留旧 ID 映射和 XML 地址，避免已保存的链接失效；中英文分类与使用说明需同步更新。

SVGs must be safe and self-contained. Scripts, event handlers, external resources and invalid dimensions fail validation. Do not rasterize, recolor or redraw a logo merely to bypass a validation failure; investigate the source or exclude the entry.

Official publisher PNGs are also supported. Prefer original color publisher artwork over monochrome substitutes. Pin each PNG's exact URL, official product listing, publisher, dimensions and SHA-256 in `data/official-icons.json`; never silently replace it during monthly updates. Keep original pixels, distinguish Feishu from Lark, and describe PNG as raster artwork. Use `inspectPng` validation and embed PNG bytes directly in libraries. The dedicated rights notice must not claim an open-source artwork license.

For DingTalk, the manifest's `presentation` adds an SVG rounded-corner clip around the original PNG. Preserve both source and packaged hashes and include the original PNG in the ZIP. Do not replace this with website-only CSS: downloads and draw.io must use the same clipped asset.
