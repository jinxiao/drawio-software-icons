# Architecture Icons for draw.io

[简体中文](README.zh-CN.md) · [Browse the collection](https://icons.rambow.cloud/)

**Cloudflare and MCP:** [deployment and icon search API](docs/CLOUDFLARE.md), including
`DRAWIO_ICON_SERVICE_URL` setup and legacy GitHub Pages redirects.

**Use these icons with AI:** Select **Connect MCP** on the
[homepage](https://icons.rambow.cloud/), choose Codex, Claude Desktop, Cursor or
VS Code and your operating system, then copy the official Draw.io MCP command
or configuration. Node.js LTS is required; merge only the `drawio` entry into
existing MCP settings. Already using Draw.io MCP? Choose that setup mode, set
`DRAWIO_ICON_SERVICE_URL` to `https://icons.rambow.cloud/api/icons`, preserve other
variables and launch arguments, then save and restart the MCP server or client.
No site account or API key is needed. This is an icon search API, not a remote
MCP Server URL. The official `search_shapes` tool uses built-in shapes first and
supplements sparse results with icons from this service. Try: “Use Draw.io MCP
to search for the ScyllaDB icon and draw a database node.”

456 software and service icons across 8 categories. Bilingual browsing, search and library downloads, focused on open-source projects with selected commercial tools. Original-color upstream SVGs are preferred.

**Commercial icon usage:** commercial software and service icons are provided solely for drawing draw.io / diagrams.net architecture diagrams, not for other distribution purposes. The project does not grant additional brand rights or override upstream licenses. Original code and documentation remain MIT licensed. Read the bilingual [icon usage policy](ICON_USAGE.md) before using commercial brand assets.


## Unified collections, unchanged URLs

The site now combines **456 software and service icons** in 8 categories with
**888 Alibaba Cloud icon entries** in 9 source categories: **1,344 entries across
two collections**. Alibaba counts include color variants and supplemental UI
symbols, not 888 distinct cloud services. Original names remain where no upstream
English product name exists; categories, browsing and setup are bilingual.

- [Software entrypoint](https://icons.rambow.cloud/) defaults to General Software.
- [Alibaba Cloud entrypoint](https://jinxiao.github.io/alibaba-cloud-icons/) defaults to Alibaba Cloud.
- The sidebar follows **Collection → Category**: choose **Alibaba Cloud**, **General Software** or **All collections**, then a category below. All rows share the same button style. Switching collections resets the category filter; **All categories** only clears that filter. The main homepage’s first button always loads all collections. The Alibaba homepage has a separate checkbox: unchecked loads Alibaba Cloud, checked loads all collections. Sidebar choices do not change either homepage action. Existing XML,
  JSON, SVG, plugin and ZIP URLs continue to work; the two old `catalog.json` schemas remain separate.

**Spotlight search:** press `/` or `Ctrl/Cmd + K` outside a text field, or click
**Quick search** in the header. Search across every collection by Chinese/English
name, alias or category. Use ↑/↓ and Enter, or click a result, to switch to its
category and scroll to the highlighted icon, including icons on later pages.
Esc closes the dialog. Existing page filters do not limit this search.

**Desktop with existing configuration:** open **Choose categories / desktop setup**, select
categories from either collection, and copy your existing JSON from Desktop's
**Extras → Configuration** into the optional input. Click **Generate / merge
configuration**, then copy the result back, apply and restart. Back up the original
text first. Other libraries, fonts, styles and settings are preserved; these two
collections are updated by stable ID, with no duplicate entry on repeated merges.
Updating a collection replaces its categories with the current selection; an
unselected collection is left unchanged. If the sidebar does not show it after
restart, enable it in **More Shapes**. Processing stays in your browser and does
not upload your configuration.

The generated JSON embeds images and works offline, without a JS plugin. It is a
snapshot, not an automatic subscription; generate/merge again to update. For an
empty configuration you may also download `config/drawio-icons.en.json` or
`config/drawio-icons.zh-CN.json`. Do not overwrite an existing configuration with
these unmerged downloads.

The **complete ZIP** (`downloads/drawio-icons.zip`) contains all 17 category XMLs
in each language directory. `libraries/combined.xml` combines both collections
into one panel. The older software ZIP and `libraries/all.xml` stay software-only;
the original Alibaba ZIP and `drawio/all-icons.xml` stay Alibaba-only.

Code, data and tests are maintained in this repository. The old Alibaba repository
publishes a compatibility site from the latest successful source build, checking
hourly or on manual dispatch. See [deployment details](docs/DEPLOYMENT.md).

## Monitoring and observability

See the bilingual [changelog](https://icons.rambow.cloud/#changelog)
for each batch of added, corrected or removed icons. Select an icon in the timeline
to locate its current version. Both English and Chinese Markdown logs are included
in the software and unified offline ZIPs; the website follows the selected language.

The **Monitoring & Security** category now includes Grafana Loki, Tempo, Mimir,
Alloy and Pyroscope, plus VictoriaMetrics, VictoriaLogs, Thanos, Prometheus
Alertmanager, Vector and SigNoz. Existing Grafana, Prometheus, OpenTelemetry,
Jaeger, Zabbix and Netdata entries remain available. Grafana k6 stays under
Developer Tools & DevOps because it is a load-testing tool.

Search by product name, `Grafana`, `LGTM`, `Victoria Metrics`, `otel`, or Chinese
terms such as `日志`, `指标`, `链路追踪` and `持续剖析`, including in Spotlight.
The five new Grafana logos are original publisher SVGs pinned by SHA-256;
the other six use the pinned Dashboard Icons source. Original colors and
proportions are retained; VictoriaMetrics uses the upstream monochrome mark.
Artwork rights are separate from software licenses. See [third-party notices](THIRD_PARTY_NOTICES.md).

## AI tools and brands

**Analytics & AI** includes vLLM, DeepSeek, Qwen, Google Gemini, ChatGPT, Claude, Hugging Face, LangChain, LlamaIndex, Dify, Open WebUI, LM Studio, Perplexity, ComfyUI, Cursor and GitHub Copilot, alongside Ollama, PyTorch and TensorFlow. Search by product name, Chinese aliases such as 深度求索 / 通义千问 / 千问, or AI / LLM / RAG / 推理 / 智能体.

The 16 new SVGs come from a pinned revision of [Lobe Icons](https://github.com/lobehub/lobe-icons), with its MIT license included. Color variants are preferred; ChatGPT uses the collection's monochrome OpenAI mark, and Open WebUI, LM Studio, Cursor and GitHub Copilot retain upstream monochrome artwork. These are community-collected brand assets, not individually authorized official downloads. Commercial entries retain the architecture-diagram-only usage notice. Classification refers to the linked tool or hosted service, not model-weight licenses; Dify and Open WebUI are marked source-available.

## Messaging and enterprise applications

The **Apps & Content Management** category includes WeChat, WeCom, DingTalk, QQ, Feishu, Lark, Microsoft Teams, Slack, Discord, Telegram, Signal, WhatsApp, Zoom, Cisco Webex, Element, Rocket.Chat, Zulip and ServiceNow, alongside existing Mattermost. Search by English names, Chinese names such as 微信 / 钉钉 / 飞书, or tags such as IM / ITSM / 工单. Messaging clients, hosted services and enterprise editions may have different software licenses; the collection records the linked product's editorial type.

WeChat, WeCom, DingTalk, QQ and Feishu use unmodified 512 × 512 color PNG application icons from their official publishers’ App Store listings. Feishu and Lark are separate entries. ServiceNow uses an upstream wordmark, not a newly drawn logo. Original colors and proportions are preserved.

DingTalk is displayed through an SVG rounded-corner clip with transparent corners. The original PNG is embedded unchanged and also included separately in the ZIP. This is a project presentation adjustment, not a new official vector logo.

## Use the icons

1. Use the first homepage button to load every collection on the main site, or Alibaba Cloud by default on the Alibaba site. Its checkbox includes every collection. Use the adjacent **Choose categories / desktop setup** button for selected categories or desktop JSON.
2. Once you enter the editor, all selected collection categories appear in the left sidebar, without individual XML imports.
3. Drag an icon onto the canvas, resize it, connect it and add your own labels.

Switch between English and Chinese using the header button. Your choice is remembered in this browser and determines the library names. Brand names retain their original spelling. **Choose categories / desktop setup** initially selects the entrypoint collection; uncheck any categories you do not need, or open a single category. Standard draw.io libraries remain available.

The eight software categories are Data & Middleware, Cloud & Infrastructure, Developer Tools & DevOps, Languages & Runtimes, Frameworks & App Development, Analytics & AI, Monitoring & Security, and Apps & Content Management. Category titles on the website, in XML libraries and in desktop configurations use a **General Software ·** prefix, matching the **Alibaba Cloud ·** prefix. Git, Gitea, Forgejo, GitHub and GitLab all belong to Developer Tools & DevOps. Legacy category query parameters and XML URLs resolve to the merged categories.

**Desktop: import all categories at once:** download and extract the latest ZIP, open a blank diagram in draw.io Desktop, then select the desired XML files inside `libraries/en/` (or `libraries/zh-CN/`) in your file manager and drag them together onto the drawing canvas. Release Ctrl/Shift before dropping. Each file loads as its own sidebar library, preserving their categories. Select the XML files, not the folder or ZIP; choose only one language directory.

For a single library, use **File → Open Library** in Desktop (the web version offers a **Device** submenu). `libraries/all.xml` merges all software icons into one library and does not preserve separate category panels. SVGs and PNGs are embedded for offline use. When updating, close the old category libraries before dragging in the new ones. Libraries begin with `<mxlibrary` so draw.io's [drop handler](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/js/diagramly/EditorUi.js) can recognize them.

Most icons are SVG image shapes; five official application icons are PNG images. PNGs retain their original pixels and may blur when enlarged beyond their native resolution. Neither format is an individually editable vector path in draw.io. Labels are not added to the canvas automatically. Light / dark controls only change the preview background, never the brand colors.

## Development

Requires Node.js 22.12+, npm, uv and Python 3.13+ (Python uses only its standard library).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`). Download and manually import XML during local development: online draw.io cannot fetch libraries from your computer's localhost.

```sh
npm test
npm run build
npm run preview
```

The frontend uses React + TypeScript with Vite. `src/App.tsx` composes the page, `src/components/` contains the page sections and dialogs, and `src/site.tsx` manages shared UI state. The existing stylesheet remains in `src/style.css`. Run `npm run test:ui` for the React rendering and URL restoration checks; these also run as part of `npm test`.

The build validates the catalog, checks TypeScript, generates libraries and the ZIP, then writes the two static sites to `dist/` and `dist-alibaba/`. Once dependencies are installed, testing and building require no upstream downloads.

## Collect and update

```sh
npm run sync
npm run sync -- --update
```

The default uses commits pinned in `data/sources.lock.json`. `--update` resolves current upstream branches. Downloads have timeouts and a URL-keyed cache under `.sync-stage/`. Network or validation failures do not replace existing committed assets, catalog or pins. Fix the cause, then reuse cached downloads to finish. Unrelated upstream commits alone do not create changes.

A monthly Actions workflow checks the existing selection and creates or updates one `automation/icon-update` PR. Review and merge it to publish. New software is added through the curated selection; upstream catalogs are not indiscriminately imported.

## Data and artifacts

- `data/selection.mjs`: project selection, homepage and editorial software type; `data/taxonomy.mjs`: category merging and project classification rules.
- `data/communication.mjs`: messaging / enterprise additions and bilingual search aliases.
- `data/ai.mjs`: AI tools / services, bilingual search aliases and selected upstream artwork variants.
- `data/catalog.json`: collected metadata and provenance. `data/categories*.json`: bilingual category text.
- `assets/icons/` and `licenses/`: packaged SVG / PNG files and original collection licenses or rights notices.
- `scripts/` and `src/`: collection / validation / generation tools and the bilingual static site.
- `dist/catalog.json`: public catalog, `schemaVersion: 1`, version, categories and stable relative asset paths.
- `dist/libraries/en/`, `dist/libraries/zh-CN/`: 8 category libraries per language, plus compatibility files for legacy URLs; `dist/libraries/all.xml`: all icons. The ZIP includes only current category libraries.
- `dist/downloads/drawio-software-icons.zip`: SVGs, PNGs, libraries, catalog, guides and licenses.

`README.md` is the default English guide; `README.zh-CN.md` is the Chinese guide. `README.en.md` remains a compatibility link. Both guides, `ICON_USAGE.md`, all upstream license texts and provenance are included in the downloadable ZIP. Commercial catalog entries expose `usagePolicy`, `usagePolicyUrl` and `brandPermissionStatus`; these describe project scope, not a vendor authorization.

Icon records expose `id/name/aliases/tags/category/softwareType/homepage/repository/asset/width/height/sha256/source`. Source metadata includes original URL, commit, path, variant, collection license and original SHA-256. Unverified software SPDX licenses are null; a collection license is never substituted for a software license.

## Deployment

The public repository is `jinxiao/drawio-software-icons`, with the primary site URL `https://icons.rambow.cloud/`. In Settings → Pages, select GitHub Actions. A push to `main` validates and publishes. Relative asset URLs support repository subpaths and other static hosts.

Enable **Allow GitHub Actions to create and approve pull requests** under Settings → Actions → General so scheduled updates can open PRs. The update workflow tests and builds its own changes before creating a PR. Additional checks on bot-created PRs may require approval in GitHub's PR interface.

## Acceptance checks

Open the published site and check language persistence, bilingual / alias search, type filtering, empty results, light / dark previews, source links and SVG / XML / ZIP downloads. Open single and multiple categories in draw.io, drag square and wide icons onto a canvas, resize, save and reopen. Import a downloaded category XML into draw.io Desktop and check icons offline.

Original code and documentation are MIT licensed. Artwork retains upstream licenses and trademark rights, including the GPL-covered ServiceNow SVG source. See the [icon usage policy](ICON_USAGE.md), [third-party notices](THIRD_PARTY_NOTICES.md) and [contribution guide](CONTRIBUTING.md).
