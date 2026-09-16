# Contributing / 贡献指南

## Add or correct an icon / 添加或修正图标

1. Edit `data/selection.mjs`: choose a stable lowercase ID, one primary category and the official project homepage or repository. Devicon entries use their upstream ID; Dashboard Icons entries use the SVG filename without `.svg`.
2. Set a readable brand name in `names` when it differs from simple capitalization. Add ambiguous or mixed-license projects to `unverified`; never classify software from the icon collection's license.
3. Run `npm run sync` to collect against pinned revisions. If a new icon only exists upstream, use `npm run sync -- --update` and review all affected changes.
4. Run `npm test` and `npm run build`. Open the local preview to inspect the artwork on light and dark backgrounds. Confirm the correct icon / brand, reasonable margins and an intact aspect ratio. Follow the README browser checks for draw.io.
5. Include catalog, SVG, pins and any updated license texts in the PR. Explain classification or source changes and provide project references.

编辑清单时给每个软件选择一个主分类，跨用途使用搜索标签；不要通过重复图标或多个变体增加收录数。添加软件时使用真实项目地址，许可不清晰则标记待核实。更新图标后检查预览，并随 PR 提交来源、SVG、清单及锁定版本。

## Localization / 中英文

UI strings are paired in `src/i18n.ts`. Categories use `data/categories.json` and `data/categories.en.json`. Both locales must contain corresponding entries. Product names remain in their original language. Search uses both category languages regardless of the selected UI language. Update both README files when the instructions change.

## Stable interfaces / 稳定接口

Keep icon IDs and existing category IDs stable. Additive metadata changes may keep `schemaVersion: 1`; incompatible changes require a schema-version increase. Library paths are generated from localized category names, so renaming a category also changes public download URLs and should be treated as a breaking change. Prefer correcting descriptions over renaming published categories.

Only safe, self-contained SVGs are accepted. Scripts, event handlers, external resources and invalid dimensions fail validation. Do not rasterize, recolor or redraw a logo merely to bypass a validation failure; investigate the source or exclude the entry.
