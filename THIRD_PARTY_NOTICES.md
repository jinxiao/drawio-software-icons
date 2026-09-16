# Third-party resources / 第三方资源

The collection contains brand artwork from these upstream repositories:

| Collection / 图标集 | Upstream / 来源 | Collection license / 图标集许可 | Included text / 附带文本 |
| --- | --- | --- | --- |
| Devicon | https://github.com/devicons/devicon | MIT | [devicon-LICENSE.txt](licenses/devicon-LICENSE.txt) |
| Dashboard Icons | https://github.com/homarr-labs/dashboard-icons | Apache-2.0 | [dashboard-LICENSE.txt](licenses/dashboard-LICENSE.txt) |
| Ant Design Icons | https://github.com/ant-design/ant-design-icons | MIT | [antdesign-LICENSE.txt](licenses/antdesign-LICENSE.txt) |
| Vendor Icons SVG (ServiceNow) | https://github.com/bwks/vendor-icons-svg | GPL-3.0-only | [vendor-LICENSE.txt](licenses/vendor-LICENSE.txt) |
| Official app publisher artwork / 官方应用图标 | Publisher listings in `data/official-icons.json` | Proprietary brand artwork; no open-source license claimed | [official-apps-LICENSE.txt](licenses/official-apps-LICENSE.txt) |

Each entry in `catalog.json` (source: `data/catalog.json`) records its original SVG URL, pinned upstream commit, source checksum, packaged checksum and collection license URL. `data/sources.lock.json` pins the exact collection revisions.

For official publisher PNGs, the catalog instead records the verified publisher, App Store listing, original artwork URL, retrieval date and SHA-256; the manifest is pinned by a SHA-256 content digest rather than a Git commit. Public availability and publisher authenticity do not confer copyright or trademark permission. The four official PNGs are embedded as `data:image/png;base64` in draw.io libraries, without tracing or recoloring.

官方 PNG 的来源记录包含发布者、App Store 条目、原图网址、采集日期和 SHA-256；清单以内容摘要锁定，不伪造 Git 提交号。来源真实和公开可下载不代表获得版权或商标授权。四张官方 PNG 原样内嵌为 `data:image/png;base64`，不描摹、不改色。

原始来源、固定提交、原文件 SHA-256、处理后 SHA-256 和图标集许可链接均记录在清单中。每项图标的详情页也提供来源和许可链接。

## Modifications / 处理方式

When present, obsolete XML declarations, external DTD declarations and editor metadata are removed. The artwork's paths, colors and proportions are retained. SVGs are embedded as base64 data URIs in draw.io libraries, with their proportions retained within a 64 px bounding box. A source may supply a plain or wordmark variant when no original symbol is available; the selected variant is recorded in each entry.

必要时移除旧 XML 声明、外部 DTD 声明和编辑器元数据，不改动图形路径、配色与比例。优先原色无文字图标；上游只有单色或字标版本时使用已有版本，并记录 variant。并非每个品牌都提供多色图形。

Exception: the ServiceNow SVG from Vendor Icons SVG is preserved verbatim, including its editable vector source and metadata. It is distributed with the upstream GPL text and source attribution; no additional GPL restrictions are imposed by the project-use statement. Ant Design supplies the remaining monochrome QQ artwork. WeChat, WeCom, DingTalk and Feishu use unmodified color PNG artwork from their official app publishers, with listing URLs and content hashes in `data/official-icons.json`. Lark remains a separate Dashboard Icons entry.

例外：Vendor Icons SVG 的 ServiceNow 素材保留完整原始 SVG 源码与元数据，附带上游 GPL 文本及来源；本项目用途声明不额外限制 GPL 已授予的权利。Ant Design 提供 QQ 的单色图形。微信、企业微信、钉钉和飞书使用各自官方应用发布者提供的彩色 PNG 原图，发布页面及内容校验值记录于 `data/official-icons.json`。Lark 保留为独立条目。

## Attribution and trademarks / 署名与商标

Devicon artwork is collected by the Devicon contributors; Dashboard Icons artwork is collected by Homarr Labs and its contributors. All product names, logos, trademarks and brands belong to their respective owners. This independent collection uses them for identification and does not imply endorsement or affiliation with draw.io, Devicon, Homarr Labs, or the featured projects. Collection licenses do not grant trademark rights or replace project-specific brand guidelines.

Additional artwork is collected by the Ant Design Icons contributors and bwks / Vendor Icons SVG contributors. Collection licensing is reported from each pinned repository; it is not a representation that the collection's authors own every depicted brand or can authorize all brand uses.

**Commercial icon scope:** this project's commercial software icons are provided solely for draw.io architecture diagrams, not other distribution purposes. This does not override upstream licenses or brand-owner rights. See the bilingual [icon usage policy](ICON_USAGE.md). Brand-owner permissions are not individually verified.

**商业图标用途：** 本项目仅提供用于 draw.io 架构图绘制的商业软件图标，不适用于其他发行用途；此声明不覆盖上游许可和品牌方权利。详见中英双语 [图标使用声明](ICON_USAGE.md)。品牌授权尚未逐项核实。

感谢 Devicon、Homarr Labs 与各项目贡献者。品牌名称、图标与商标属于各自所有者。本项目仅用于标识，不代表官方背书或隶属关系。图标集许可证不授予商标权，也不替代具体项目的品牌规范。

## Software classifications / 软件类型

Software classifications are editorial metadata about the linked project or community edition. Commercial editions may have different terms. `source-available` is separate from `open-source`; unclear or mixed-edition cases are marked `unverified`. SPDX software-license identifiers are currently null because they have not been individually verified. Check the linked project's license for the specific version you use. An icon collection's MIT or Apache-2.0 license is not the software's license.

软件类型由人工整理，按链接所指的项目或社区版本分类；商业版本可能采用不同许可。源码可用不等于开源，不明确或许可混合的项目标为待核实。尚未逐项核实软件 SPDX 许可证，因此对应字段为 null。软件类型不是法律结论，具体版本请查阅项目本身的许可。
