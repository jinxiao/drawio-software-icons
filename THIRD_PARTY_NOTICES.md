# Third-party resources / 第三方资源

The collection contains brand artwork from these upstream repositories:

| Collection / 图标集 | Upstream / 来源 | Collection license / 图标集许可 | Included text / 附带文本 |
| --- | --- | --- | --- |
| Devicon | https://github.com/devicons/devicon | MIT | [devicon-LICENSE.txt](licenses/devicon-LICENSE.txt) |
| Dashboard Icons | https://github.com/homarr-labs/dashboard-icons | Apache-2.0 | [dashboard-LICENSE.txt](licenses/dashboard-LICENSE.txt) |

Each entry in `catalog.json` (source: `data/catalog.json`) records its original SVG URL, pinned upstream commit, source checksum, packaged checksum and collection license URL. `data/sources.lock.json` pins the exact collection revisions.

原始来源、固定提交、原文件 SHA-256、处理后 SHA-256 和图标集许可链接均记录在清单中。每项图标的详情页也提供来源和许可链接。

## Modifications / 处理方式

When present, obsolete XML declarations, external DTD declarations and editor metadata are removed. The artwork's paths, colors and proportions are retained. SVGs are embedded as base64 data URIs in draw.io libraries, with their proportions retained within a 64 px bounding box. A source may supply a plain or wordmark variant when no original symbol is available; the selected variant is recorded in each entry.

必要时移除旧 XML 声明、外部 DTD 声明和编辑器元数据，不改动图形路径、配色与比例。优先原色无文字图标；上游只有单色或字标版本时使用已有版本，并记录 variant。并非每个品牌都提供多色图形。

## Attribution and trademarks / 署名与商标

Devicon artwork is collected by the Devicon contributors; Dashboard Icons artwork is collected by Homarr Labs and its contributors. All product names, logos, trademarks and brands belong to their respective owners. This independent collection uses them for identification and does not imply endorsement or affiliation with draw.io, Devicon, Homarr Labs, or the featured projects. Collection licenses do not grant trademark rights or replace project-specific brand guidelines.

感谢 Devicon、Homarr Labs 与各项目贡献者。品牌名称、图标与商标属于各自所有者。本项目仅用于标识，不代表官方背书或隶属关系。图标集许可证不授予商标权，也不替代具体项目的品牌规范。

## Software classifications / 软件类型

Software classifications are editorial metadata about the linked project or community edition. Commercial editions may have different terms. `source-available` is separate from `open-source`; unclear or mixed-edition cases are marked `unverified`. SPDX software-license identifiers are currently null because they have not been individually verified. Check the linked project's license for the specific version you use. An icon collection's MIT or Apache-2.0 license is not the software's license.

软件类型由人工整理，按链接所指的项目或社区版本分类；商业版本可能采用不同许可。源码可用不等于开源，不明确或许可混合的项目标为待核实。尚未逐项核实软件 SPDX 许可证，因此对应字段为 null。软件类型不是法律结论，具体版本请查阅项目本身的许可。
