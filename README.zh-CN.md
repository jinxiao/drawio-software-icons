# Architecture Icons for draw.io

[English](README.md) · [在线图标库](https://icons.rambow.cloud/)

**Cloudflare 与 MCP：** [部署与图标搜索接口](docs/CLOUDFLARE.md)，包含
`DRAWIO_ICON_SERVICE_URL` 配置及旧 GitHub Pages 首页跳转方案。

**AI 绘图接入：** 在[网站首页](https://icons.rambow.cloud/)点击「接入 MCP」，
选择 Codex、Claude Desktop、Cursor 或 VS Code，以及 Windows / macOS / Linux，
即可复制官方 Draw.io MCP 的命令或配置。需要 Node.js LTS；已有 MCP 配置时仅合并
`drawio` 条目。已有 Draw.io MCP 的用户可切换「已有 Draw.io MCP」，将
`DRAWIO_ICON_SERVICE_URL` 设置为 `https://icons.rambow.cloud/api/icons`，保留其他
环境变量和启动参数，保存并重启 MCP 服务或客户端。无需本站账号或 API Key。
这个地址是图标搜索接口，不能作为远程 MCP Server URL；官方 `search_shapes`
优先使用内置形状，结果不足时补充本站图标。可试着说：
「请用 Draw.io MCP 搜索 ScyllaDB 图标，并绘制一个数据库节点。」

456 个软件与服务图标，8 个用途分类，支持中英文浏览、搜索与分类库下载。以开源项目为主，兼收常用商业工具，优先使用上游原色 SVG。

**商业图标使用范围：** 本项目中的商业软件与服务图标仅适用于 draw.io / diagrams.net 架构图绘制，不适用于其他发行用途。本项目不额外授予品牌使用权，也不覆盖上游许可证。原创代码和文档继续采用 MIT 许可。使用商业品牌图标前请阅读中英双语 [图标使用声明](ICON_USAGE.md)。


## 图标集合并，两个旧网址保留

现在包含 **456 个软件与服务图标**（8 类）和 **888 个阿里云图标条目**（9 个来源分类），
共 **1,344 个条目、两个图标集**。阿里云条目包含颜色变体和 UI 补充图形，不代表 888 种独立云服务。
分类、界面和使用流程支持中英文；上游没有英文产品名称的条目保留原名。

- [软件入口](https://icons.rambow.cloud/)默认选中「通用软件」。
- [阿里云入口](https://jinxiao.github.io/alibaba-cloud-icons/)默认选中「阿里云」。
- 侧栏采用「图标集 → 分类」两层按钮：先选择「阿里云」「通用软件」或「全部图标集」，再选择下方分类，两层按钮风格一致。切换图标集会重置分类，「全部分类」只清除分类筛选。主站首页第一个按钮固定加载全部合集；阿里云首页保留独立复选框，未选时加载阿里云，选中时加载全部合集。侧栏筛选不改变首页按钮的加载范围。原 XML、JSON、SVG、插件及 ZIP 地址保留，
  两个旧站的 `catalog.json` 各自保持原结构。

**Spotlight 快捷搜索：** 在非文本输入区域按 `/` 或 `Ctrl/Cmd + K`，也可点击顶部「快捷搜索」。
支持跨全部图标集搜索中英文名称、别名和分类，不受当前页面筛选影响。使用 ↑/↓ 选择、回车确认，
或点击结果，即可切换到对应分类并滚动定位、高亮图标，分页靠后的图标也会自动显示。按 Esc 关闭弹窗。

**已有桌面配置的合并流程：** 打开「选择分类加载 / 桌面配置」，勾选两个图标集中的所需分类；
在桌面端「其他 → 配置」（Extras → Configuration）复制并备份完整 JSON，粘贴到网站的可选输入框。
点击「生成 / 合并配置」，将结果复制回客户端，应用并重启。保留其他图标库、字体、样式及设置；
这两个图标集按固定 ID 更新，多次合并不会重复添加。更新某个图标集时，用当前勾选分类替换其旧分类；
完全未选的图标集不变。如重启后侧栏仍未显示，在「更多图形」里启用。配置只在浏览器内处理，不上传。

生成的 JSON 内嵌图像，可离线使用，不需要 JS 插件。它是版本快照，不会自动订阅更新；
更新时再次生成并合并。空配置也可直接使用 `config/drawio-icons.en.json` 或
`config/drawio-icons.zh-CN.json`，已有配置请走合并流程，避免覆盖。

网站的完整 ZIP（`downloads/drawio-icons.zip`）在每个语言目录中包含全部 17 类 XML；
`libraries/combined.xml` 把两个图标集放进同一个库。原软件 ZIP 和 `libraries/all.xml`
仍只含软件图标，原阿里云 ZIP 和 `drawio/all-icons.xml` 仍只含阿里云图标。

源码、数据和测试统一维护于当前仓库。阿里云旧仓库从主仓库最近一次发布成功的提交构建兼容站点，
每小时检查更新，也可手动立即同步。详见[发布说明](docs/DEPLOYMENT.md)。

## 监控与可观测性

可在首页[更新日志](https://icons.rambow.cloud/#changelog)查看每批新增、
修正或移除的图标，点击名称可定位当前版本。日志跟随网站语言切换，通用软件及完整合集的
离线 ZIP 均附带中英文 Markdown 日志。

「监控与安全」分类新增 Grafana Loki、Tempo、Mimir、Alloy、Pyroscope，以及
VictoriaMetrics、VictoriaLogs、Thanos、Prometheus Alertmanager、Vector、SigNoz。
已有 Grafana、Prometheus、OpenTelemetry、Jaeger、Zabbix、Netdata 等继续保留；
Grafana k6 属于负载测试工具，仍在「开发工具与 DevOps」分类。

普通搜索及 Spotlight 均可使用产品名、`Grafana`、`LGTM`、`Victoria Metrics`、`otel`，
以及「日志」「指标」「链路追踪」「持续剖析」等关键词。
五个新增 Grafana 图标使用官方原始 SVG，并固定 SHA-256；其余六个来自固定版本的
Dashboard Icons。保留原色及比例，VictoriaMetrics 使用上游单色标志。
图标权利与软件许可证分别适用，详见[第三方说明](THIRD_PARTY_NOTICES.md)。

## AI 工具与品牌

「数据分析与 AI」新增 vLLM、DeepSeek、Qwen、Google Gemini、ChatGPT、Claude、Hugging Face、LangChain、LlamaIndex、Dify、Open WebUI、LM Studio、Perplexity、ComfyUI、Cursor 和 GitHub Copilot，与已有 Ollama、PyTorch、TensorFlow 放在一起。支持产品名、深度求索 / 通义千问 / 千问等中文别名，以及 AI / LLM / RAG / 推理 / 智能体等搜索词。

这 16 张 SVG 来自固定版本的 [Lobe Icons](https://github.com/lobehub/lobe-icons)，附带其 MIT 许可。优先采用彩色版本；ChatGPT 使用图标集的单色 OpenAI 标志，Open WebUI、LM Studio、Cursor 和 GitHub Copilot 保留上游单色素材。这些是社区整理的品牌图形，不声称是逐项授权的官方下载。商业条目沿用仅供架构图绘制的用途声明。软件类型指所链接工具或在线服务，不代表模型权重的许可证；Dify 和 Open WebUI 标记为源码可用。新增清单、别名与素材变体维护在 `data/ai.mjs`。

## 即时通讯与企业应用

「应用与内容管理」收录微信、企业微信、钉钉、QQ、飞书、Lark、Microsoft Teams、Slack、Discord、Telegram、Signal、WhatsApp、Zoom、Cisco Webex、Element、Rocket.Chat、Zulip 和 ServiceNow，并保留已有 Mattermost。支持中文名称、英文名称以及 IM / ITSM / 工单等标签搜索。客户端、托管服务和企业版本可能采用不同的软件许可，清单记录所链接产品的软件类型。

微信、企业微信、钉钉、QQ 和飞书使用各自官方发布者在 App Store 提供的 512 × 512 彩色 PNG 应用图标，原样保留像素。飞书与 Lark 分开收录。QQ 使用腾讯官方彩色企鹅应用图标；ServiceNow 使用上游字标。保留原素材颜色和比例，不自行重绘品牌 Logo。

钉钉通过 SVG 圆角裁切显示，四角透明；内部原始 PNG 保持不变，ZIP 也单独附带原图。这是项目的显示调整，不是新的官方矢量 Logo。

## 使用

1. 主站首页第一个按钮固定加载全部合集；阿里云入口默认只加载阿里云，勾选后加载全部合集。旁边的 **选择分类加载 / 桌面配置** 可挑选分类加载或生成、合并桌面 JSON。
2. 进入编辑画布后，当前图标集的分类库会一起出现在左侧，无需逐个导入 XML。
3. 将图标拖入画布，可以缩放、连接和添加自己的说明。

网站右上角可切换 English / 中文，选择会保存到本机浏览器，加载的分类库名称也会跟随语言切换。软件品牌名称保留原名。**选择分类加载 / 桌面配置** 初始选中当前入口图标集，可取消不需要的分类；也可单独打开一个分类。保留 draw.io 默认形状库。

通用软件分类按用途合并为：数据与中间件、云与基础设施、开发工具与 DevOps、语言与运行时、框架与应用开发、数据分析与 AI、监控与安全、应用与内容管理。网站展示、XML 库标题和桌面 JSON 均添加 **通用软件 ·** 前缀，与 **阿里云 ·** 对应。Git、Gitea、Forgejo、GitHub、GitLab 统一归入「开发工具与 DevOps」。旧分类网页参数与 XML 地址继续映射到合并后的分类。

**桌面版一次导入全部分类：** 下载并解压最新 ZIP，在 draw.io 桌面版新建空白图表，然后在文件管理器中全选 `libraries/zh-CN/`（英文用 `libraries/en/`）里的所需 XML，一起拖到画布空白处。放下前松开 Ctrl / Shift。每个文件会成为左侧一个独立图标库，保留独立分类。选择 XML 文件，不要拖整个目录或 ZIP，也不要同时导入两种语言。

单个库也可通过桌面版 **文件 → 打开库** 打开（网页版有“设备”子菜单）。`libraries/all.xml` 将全部软件图标合并到一个库，不保留独立分类栏。SVG / PNG 已内嵌，可离线使用。更新时先关闭旧分类库，再拖入新版。XML 以 `<mxlibrary` 开头，兼容 draw.io 的[拖拽识别逻辑](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/js/diagramly/EditorUi.js)。

大部分图标为 SVG 图片，五款官方应用图标为 PNG 原图。PNG 超过原始分辨率放大时可能变模糊；两种格式都不是可逐条编辑路径的原生形状。默认不附加文字，名称用于库内识别。浅色 / 深色按钮仅改变预览背景，不修改品牌颜色。

## 本地开发

需要 Node.js 22.12+、npm、uv 及 Python 3.13+（Python 仅使用标准库）。首次安装依赖：

```sh
npm ci
npm run dev
```

终端会打印本地网址，默认 `http://127.0.0.1:5173/`。本地环境请下载 XML 后手动导入；draw.io 在线服务无法读取你电脑上的本地库地址。

```sh
npm test
npm run build
npm run preview
```

前端采用 React + TypeScript、Vite、Tailwind CSS 和 shadcn/ui。`src/App.tsx` 组合整个页面，`src/components/` 管理页面区块和弹窗，`src/site.tsx` 管理共享交互状态。shadcn/ui 生成的基础组件放在 `src/components/ui/`；操作统一使用 `Button`，按钮外观的链接使用 `ButtonLink`，保留链接语义。`src/theme.css` 管理主题配色和 Tailwind 工具类，`src/style.css` 保留页面布局；为兼容现有布局，未引入 Tailwind 的全局 Preflight 重置。

终端和配置编辑器共用 `CodePanel`，由 shadcn/ui 的 Card、Textarea 组合，`CopyButton` 统一复制反馈和手动复制回退。`.terminal-theme` 只调整终端配色，提示符与实际复制内容分离。`npm run test:ui` 验证渲染、URL 筛选恢复、按钮语义和配置文本，也包含在 `npm test` 中。

`npm run build` 校验图标、执行 TypeScript 检查、生成库与 ZIP，再构建两个静态站点到 `dist/` 和 `dist-alibaba/`。依赖安装后，测试和构建完全使用仓库中的资源，不联网采集。

## 收集与更新

```sh
npm run sync
npm run sync -- --update
```

默认使用 `data/sources.lock.json` 中的固定提交；`--update` 检查上游当前分支。HTTP 下载带超时，按固定 URL 缓存到 `.sync-stage/`。任一文件下载或检查失败时，现有图标、清单及锁定版本保持不变；修复原因后可复用缓存补齐。只有图标、清单内容或许可证实际改变才提交更新，上游无关提交不会产生更新 PR。

每月通过 Actions 检查一次，更新现有 `automation/icon-update` 分支和 PR，人工审核后合并，不自动上线未经合并的更新。新软件通过维护清单添加，不自动把整个上游目录全部收录。

## 数据与产物

- `data/selection.mjs`：维护的软件范围、官网、软件类型；`data/taxonomy.mjs`：分类合并与项目归类规则。
- `data/communication.mjs`：即时通讯与企业应用补充清单、中英文搜索别名。
- `data/catalog.json`：采集后的图标清单与完整来源；`data/categories*.json`：分类中英文案。
- `assets/icons/`：收录的 SVG / PNG；`licenses/`：原始图标集许可。
- `scripts/`：采集、校验、离线生成工具；`src/`：中英文静态网站。
- `dist/catalog.json`：公共目录接口，`schemaVersion: 1`、版本、分类、图标与稳定相对路径。
- `dist/libraries/zh-CN/` 与 `dist/libraries/en/`：每种语言 8 个分类库，以及兼容旧链接的文件；`dist/libraries/all.xml`：全集。ZIP 只包含当前分类库。
- `dist/downloads/drawio-software-icons.zip`：全部 SVG / PNG、分类库、清单、使用说明与许可文件。

`README.md` 为默认英文说明，`README.zh-CN.md` 为中文说明，旧 `README.en.md` 保留跳转入口。ZIP 附带中英文说明、`ICON_USAGE.md`、上游许可文本和来源记录。商业图标额外记录 `usagePolicy`、`usagePolicyUrl` 和 `brandPermissionStatus`，这些字段说明项目用途，不表示已获得品牌授权。

清单字段包括 `id/name/aliases/tags/category/softwareType/homepage/repository/asset/width/height/sha256/source`。`source` 中包含原始 URL、提交、路径、变体、图标集许可和原始 SHA-256。`softwareLicense` 未核实时为 null，不将图标集许可套用到软件上。

## GitHub Pages

公开仓库 `jinxiao/drawio-software-icons`，主站网址 `https://icons.rambow.cloud/`。Settings → Pages → Source 选择 GitHub Actions，推送到 `main` 后校验并发布。站点使用相对资源地址，也支持其他仓库子路径。

Settings → Actions → General 中允许 GitHub Actions 创建 Pull Request，供每月更新工作流使用。定时任务用仓库 `GITHUB_TOKEN` 创建更新 PR，并在自身工作流内完成测试及构建；如果 GitHub 对机器人 PR 的附加检查要求批准，在 PR 页面批准运行即可。

## 验收

打开站点检查：语言切换与刷新保持、中文/英文/别名搜索、软件类型筛选、无结果提示、明暗预览、详情来源链接、SVG/XML/ZIP 下载。在 draw.io 中分别打开一个分类、多个分类；拖入横向和方形图标，缩放后保存并重新打开。桌面版导入下载的分类 XML，确认离线图标可见。

原创代码与文档采用 MIT；图标保留上游许可与商标权，包括采用 GPL 的 ServiceNow SVG 源文件。详见 [图标使用声明](ICON_USAGE.md)、[第三方资源说明](THIRD_PARTY_NOTICES.md) 与 [贡献指南](CONTRIBUTING.md)。
