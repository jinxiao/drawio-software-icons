# Software Icons for draw.io

[简体中文](README.zh-CN.md) · [Browse the collection](https://jinxiao.github.io/drawio-software-icons/)

428 software and service icons across 8 categories. Bilingual browsing, search and library downloads, focused on open-source projects with selected commercial tools. Original-color upstream SVGs are preferred.

**Commercial icon usage:** commercial software and service icons are provided solely for drawing draw.io / diagrams.net architecture diagrams, not for other distribution purposes. The project does not grant additional brand rights or override upstream licenses. Original code and documentation remain MIT licensed. Read the bilingual [icon usage policy](ICON_USAGE.md) before using commercial brand assets.

## Messaging and enterprise applications

The **Apps & Content Management** category includes WeChat, WeCom, DingTalk, QQ, Feishu, Lark, Microsoft Teams, Slack, Discord, Telegram, Signal, WhatsApp, Zoom, Cisco Webex, Element, Rocket.Chat, Zulip and ServiceNow, alongside existing Mattermost. Search by English names, Chinese names such as 微信 / 钉钉 / 飞书, or tags such as IM / ITSM / 工单. Messaging clients, hosted services and enterprise editions may have different software licenses; the collection records the linked product's editorial type.

WeChat, WeCom, DingTalk and Feishu use unmodified 512 × 512 color PNG application icons from their official publishers’ App Store listings. Feishu and Lark are separate entries. QQ retains its upstream monochrome artwork. ServiceNow uses an upstream wordmark, not a newly drawn logo. Original colors and proportions are preserved.

DingTalk is displayed through an SVG rounded-corner clip with transparent corners. The original PNG is embedded unchanged and also included separately in the ZIP. This is a project presentation adjustment, not a new official vector logo.

## Use the icons

1. Click **Open all in draw.io** on the website to launch draw.io in a new tab.
2. Once you enter the editor, all 8 category libraries appear in the left sidebar, without individual XML imports.
3. Drag an icon onto the canvas, resize it, connect it and add your own labels.

Switch between English and Chinese using the header button. Your choice is remembered in this browser and determines the library names. Brand names retain their original spelling. **Choose categories** starts with everything selected; uncheck any categories you do not need, or open a single category. Standard draw.io libraries remain available.

The eight categories are Data & Middleware, Cloud & Infrastructure, Developer Tools & DevOps, Languages & Runtimes, Frameworks & App Development, Analytics & AI, Monitoring & Security, and Apps & Content Management. Git, Gitea, Forgejo, GitHub and GitLab all belong to Developer Tools & DevOps. Legacy category query parameters and XML URLs resolve to the merged categories.

**Desktop and offline:** download and extract the ZIP. In draw.io, use **File → Open Library → Device** and select an XML under `libraries/en/` or `libraries/zh-CN/`. `libraries/all.xml` is the deduplicated full collection. SVGs and PNGs are embedded, so imported libraries do not depend on external image hosts. Use Open Library, not Open Diagram.

Most icons are SVG image shapes; four official application icons are PNG images. PNGs retain their original pixels and may blur when enlarged beyond their native resolution. Neither format is an individually editable vector path in draw.io. Labels are not added to the canvas automatically. Light / dark controls only change the preview background, never the brand colors.

## Development

Requires Node.js 22.12+ and npm.

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

The build validates the catalog, checks TypeScript, generates libraries and the ZIP, then writes the static site to `dist/`. Once dependencies are installed, testing and building require no upstream downloads.

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
- `data/catalog.json`: collected metadata and provenance. `data/categories*.json`: bilingual category text.
- `assets/icons/` and `licenses/`: packaged SVG / PNG files and original collection licenses or rights notices.
- `scripts/` and `src/`: collection / validation / generation tools and the bilingual static site.
- `dist/catalog.json`: public catalog, `schemaVersion: 1`, version, categories and stable relative asset paths.
- `dist/libraries/en/`, `dist/libraries/zh-CN/`: 8 category libraries per language, plus compatibility files for legacy URLs; `dist/libraries/all.xml`: all icons. The ZIP includes only current category libraries.
- `dist/downloads/drawio-software-icons.zip`: SVGs, PNGs, libraries, catalog, guides and licenses.

`README.md` is the default English guide; `README.zh-CN.md` is the Chinese guide. `README.en.md` remains a compatibility link. Both guides, `ICON_USAGE.md`, all upstream license texts and provenance are included in the downloadable ZIP. Commercial catalog entries expose `usagePolicy`, `usagePolicyUrl` and `brandPermissionStatus`; these describe project scope, not a vendor authorization.

Icon records expose `id/name/aliases/tags/category/softwareType/homepage/repository/asset/width/height/sha256/source`. Source metadata includes original URL, commit, path, variant, collection license and original SHA-256. Unverified software SPDX licenses are null; a collection license is never substituted for a software license.

## Deployment

The public repository is `jinxiao/drawio-software-icons`, with the default Pages URL `https://jinxiao.github.io/drawio-software-icons/`. In Settings → Pages, select GitHub Actions. A push to `main` validates and publishes. Relative asset URLs support repository subpaths and other static hosts.

Enable **Allow GitHub Actions to create and approve pull requests** under Settings → Actions → General so scheduled updates can open PRs. The update workflow tests and builds its own changes before creating a PR. Additional checks on bot-created PRs may require approval in GitHub's PR interface.

## Acceptance checks

Open the published site and check language persistence, bilingual / alias search, type filtering, empty results, light / dark previews, source links and SVG / XML / ZIP downloads. Open single and multiple categories in draw.io, drag square and wide icons onto a canvas, resize, save and reopen. Import a downloaded category XML into draw.io Desktop and check icons offline.

Original code and documentation are MIT licensed. Artwork retains upstream licenses and trademark rights, including the GPL-covered ServiceNow SVG source. See the [icon usage policy](ICON_USAGE.md), [third-party notices](THIRD_PARTY_NOTICES.md) and [contribution guide](CONTRIBUTING.md).
