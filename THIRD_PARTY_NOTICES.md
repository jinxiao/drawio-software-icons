# Third-party resources / 第三方资源

The collection contains brand artwork from these upstream repositories:

| Collection / 图标集 | Upstream / 来源 | Collection license / 图标集许可 | Included text / 附带文本 |
| --- | --- | --- | --- |
| Devicon | https://github.com/devicons/devicon | MIT | [devicon-LICENSE.txt](licenses/devicon-LICENSE.txt) |
| Dashboard Icons | https://github.com/homarr-labs/dashboard-icons | Apache-2.0 | [dashboard-LICENSE.txt](licenses/dashboard-LICENSE.txt) |
| Lobe Icons | https://github.com/lobehub/lobe-icons | MIT | [lobe-LICENSE.txt](licenses/lobe-LICENSE.txt) |
| Vendor Icons SVG (ServiceNow) | https://github.com/bwks/vendor-icons-svg | GPL-3.0-only | [vendor-LICENSE.txt](licenses/vendor-LICENSE.txt) |
| Official publisher artwork / 官方发布者图标 | Publisher listings in `data/official-icons.json` | Proprietary brand artwork; no open-source license claimed | [official-apps-LICENSE.txt](licenses/official-apps-LICENSE.txt) |

Each entry in `catalog.json` (source: `data/catalog.json`) records its original SVG URL, pinned upstream commit, source checksum, packaged checksum and collection license URL. `data/sources.lock.json` pins the exact collection revisions.

For official publisher PNGs, the catalog instead records the verified publisher, App Store listing, original artwork URL, retrieval date and SHA-256; the manifest is pinned by a SHA-256 content digest rather than a Git commit. Public availability and publisher authenticity do not confer copyright or trademark permission. The five official PNGs are embedded in draw.io libraries, directly as `data:image/png;base64` or within DingTalk’s documented SVG wrapper, without tracing or recoloring.

Ubuntu uses Canonical's round Circle of Friends SVG from the [official Ubuntu community asset listing](https://discourse.ubuntu.com/t/ubuntu-merchandise-assets/67314), preserved byte for byte and pinned by SHA-256 in the same manifest. Its provenance is the publisher's listing, not an App Store entry or the Devicon MIT collection. Copyright and trademark rights remain with Canonical Ltd.

Ubuntu 使用 [Ubuntu 官方社区素材页](https://discourse.ubuntu.com/t/ubuntu-merchandise-assets/67314)提供的圆形 Circle of Friends SVG，原文件字节不变，以同一清单中的 SHA-256 固定版本。来源为官方素材页，并非 App Store 或 Devicon 的 MIT 图标集；版权和商标权归 Canonical Ltd. 所有。

官方 PNG 的来源记录包含发布者、App Store 条目、原图网址、采集日期和 SHA-256；清单以内容摘要锁定，不伪造 Git 提交号。来源真实和公开可下载不代表获得版权或商标授权。五张官方 PNG 原样内嵌到图标库中，直接使用 `data:image/png;base64` 或采用已说明的钉钉 SVG 包装，不描摹、不改色。

原始来源、固定提交、原文件 SHA-256、处理后 SHA-256 和图标集许可链接均记录在清单中。每项图标的详情页也提供来源和许可链接。

Grafana Loki, Tempo, Mimir, Alloy and Pyroscope use unmodified SVG artwork linked from Grafana's official open-source and product pages, with original URLs and SHA-256 pins. Loki, Tempo and Mimir use the gradient originals from their respective [Loki](https://grafana.com/oss/loki/), [Tempo](https://grafana.com/oss/tempo/) and [Mimir](https://grafana.com/oss/mimir/) pages; Alloy retains the official orange mark. Software licenses do not grant rights to these logos; [Grafana's trademark policy](https://grafana.com/trademark-policy/) remains applicable. VictoriaMetrics, VictoriaLogs, Thanos, Alertmanager, Vector and SigNoz use the pinned Dashboard Icons collection; these are upstream-collected assets, not individually authorized publisher downloads. VictoriaMetrics retains the upstream monochrome mark.

Grafana Loki、Tempo、Mimir、Alloy、Pyroscope 使用官网开源项目页和产品页提供的原始 SVG，记录原链接并固定 SHA-256；Loki、Tempo、Mimir 选用各自产品页的渐变原图，Alloy 保持官方橙色标志。软件许可证不代表 Logo 授权。VictoriaMetrics、VictoriaLogs、Thanos、Alertmanager、Vector、SigNoz 来自固定版本的 Dashboard Icons，不声称为逐项授权的官方素材下载；VictoriaMetrics 保留上游单色标志。

## Modifications / 处理方式

DingTalk uses an SVG wrapper with a 112 px rounded-rectangle clip on the 512 px canvas. The PNG bytes inside are unchanged; transparent corners replace the square display boundary. This project presentation is recorded in `data/official-icons.json`, with separate source and packaged checksums. The library embeds the SVG wrapper; the ZIP also retains the original PNG. The wrapper does not make the raster artwork a vector logo.

钉钉在 512 px 画布上使用半径 112 px 的 SVG 圆角裁切，内部 PNG 字节不变，四角透明。这是清单中明确记录的项目显示调整，原图与打包文件分别校验；图标库内嵌 SVG 包装文件，ZIP 同时保留原 PNG。包装不会把位图变成矢量 Logo。

When present, obsolete XML declarations, external DTD declarations and editor metadata are removed. The artwork's paths, colors and proportions are retained. SVGs are embedded as base64 data URIs in draw.io libraries, with their proportions retained within a 64 px bounding box. A source may supply a plain or wordmark variant when no original symbol is available; the selected variant is recorded in each entry.

必要时移除旧 XML 声明、外部 DTD 声明和编辑器元数据，不改动图形路径、配色与比例。优先原色无文字图标；上游只有单色或字标版本时使用已有版本，并记录 variant。并非每个品牌都提供多色图形。

Exception: the ServiceNow SVG from Vendor Icons SVG is preserved verbatim, including its editable vector source and metadata. It is distributed with the upstream GPL text and source attribution; no additional GPL restrictions are imposed by the project-use statement. WeChat, WeCom, DingTalk, QQ and Feishu use unmodified color PNG artwork from their official app publishers, with listing URLs and content hashes in `data/official-icons.json`. Lark remains a separate Dashboard Icons entry.

例外：Vendor Icons SVG 的 ServiceNow 素材保留完整原始 SVG 源码与元数据，附带上游 GPL 文本及来源；本项目用途声明不额外限制 GPL 已授予的权利。微信、企业微信、钉钉、QQ 和飞书使用各自官方应用发布者提供的彩色 PNG 原图，发布页面及内容校验值记录于 `data/official-icons.json`。Lark 保留为独立条目。

## Attribution and trademarks / 署名与商标

AI additions use SVGs collected by LobeHub's Lobe Icons contributors. Color variants are selected where provided; upstream monochrome marks are retained otherwise. ChatGPT uses the collection's OpenAI mark. Their exact paths, revisions and hashes are recorded per icon; no brand-owner approval or official-download status is claimed. The collection license is separate from model-weight, software and hosted-service terms.

AI 新增素材来自 LobeHub 的 Lobe Icons 社区图标集，有彩色版本时优先使用，否则保留上游单色图形；ChatGPT 使用该集的 OpenAI 标志。逐项记录路径、版本与校验值，不声称获得品牌方批准或来自官方下载。图标集许可与模型权重、软件及在线服务条款分别适用。

Devicon artwork is collected by the Devicon contributors; Dashboard Icons artwork is collected by Homarr Labs and its contributors. All product names, logos, trademarks and brands belong to their respective owners. This independent collection uses them for identification and does not imply endorsement or affiliation with draw.io, Devicon, Homarr Labs, or the featured projects. Collection licenses do not grant trademark rights or replace project-specific brand guidelines.

Additional artwork is collected by bwks / Vendor Icons SVG contributors. Collection licensing is reported from each pinned repository; it is not a representation that the collection's authors own every depicted brand or can authorize all brand uses.

**Commercial icon scope:** this project's commercial software icons are provided solely for draw.io architecture diagrams, not other distribution purposes. This does not override upstream licenses or brand-owner rights. See the bilingual [icon usage policy](ICON_USAGE.md). Brand-owner permissions are not individually verified.

**商业图标用途：** 本项目仅提供用于 draw.io 架构图绘制的商业软件图标，不适用于其他发行用途；此声明不覆盖上游许可和品牌方权利。详见中英双语 [图标使用声明](ICON_USAGE.md)。品牌授权尚未逐项核实。

感谢 Devicon、Homarr Labs 与各项目贡献者。品牌名称、图标与商标属于各自所有者。本项目仅用于标识，不代表官方背书或隶属关系。图标集许可证不授予商标权，也不替代具体项目的品牌规范。

## Software classifications / 软件类型

Alibaba Cloud artwork is imported with its original colors and source metadata from
`jinxiao/alibaba-cloud-icons` at commit `a2f1cd9c00b7f2ced4af97c537c77493b7b59fa5`.
The upstream publisher is the Alibaba Cloud Design Center on Iconfont. Its original
code license, artwork notices and source documentation are retained in
`collections/alibaba-cloud/` in this repository and `compat/alibaba-cloud/` in site
downloads. The code's MIT license does not relicense Alibaba Cloud artwork or
trademarks. Commercial architecture-diagram use restrictions in `ICON_USAGE.md`
apply without overriding upstream rights. Color variants and supplemental UI
symbols remain distinct entries. Historical attribution to
[mcsrainbow/alibaba-cloud-icons](https://github.com/mcsrainbow/alibaba-cloud-icons)
is preserved in the imported `NOTICE.md`.

阿里云图标及来源数据从上述固定提交迁入，保留原色及 Iconfont 阿里云设计中心的来源信息。
原代码许可、第三方素材说明和来源文档在源码 `collections/alibaba-cloud/` 及发布包
`compat/alibaba-cloud/` 内保留。MIT 代码许可不重新授权阿里云图形或商标；商业图标沿用
`ICON_USAGE.md` 的架构图绘制用途声明，不覆盖上游权利。颜色变体和 UI 补充图形分别保留，
原项目的历史归属说明不删除。

Software classifications are editorial metadata about the linked project or community edition. Commercial editions may have different terms. `source-available` is separate from `open-source`; unclear or mixed-edition cases are marked `unverified`. SPDX software-license identifiers are currently null because they have not been individually verified. Check the linked project's license for the specific version you use. An icon collection's MIT or Apache-2.0 license is not the software's license.

软件类型由人工整理，按链接所指的项目或社区版本分类；商业版本可能采用不同许可。源码可用不等于开源，不明确或许可混合的项目标为待核实。尚未逐项核实软件 SPDX 许可证，因此对应字段为 null。软件类型不是法律结论，具体版本请查阅项目本身的许可。
