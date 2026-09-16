# Software Icons for draw.io

[English](README.en.md) · [在线图标库](https://jinxiao.github.io/drawio-software-icons/)

410 个软件与服务图标，8 个用途分类，支持中英文浏览、搜索与分类库下载。以开源项目为主，兼收常用商业工具，优先使用上游原色 SVG。

## 使用

1. 打开在线图标库，点击 **一键加载全部分类**，在新标签页打开 draw.io。
2. 进入编辑画布后，8 个分类库会一起出现在左侧，无需逐个导入 XML。
3. 将图标拖入画布，可以缩放、连接和添加自己的说明。

网站右上角可切换 English / 中文，选择会保存到本机浏览器，加载的分类库名称也会跟随语言切换。软件品牌名称保留原名。**自选分类加载** 默认全选，可取消不需要的分类；也可单独打开一个分类。保留 draw.io 默认形状库。

分类按用途合并为：数据与中间件、云与基础设施、开发工具与 DevOps、语言与运行时、框架与应用开发、数据分析与 AI、监控与安全、应用与内容管理。Git、Gitea、Forgejo、GitHub、GitLab 统一归入「开发工具与 DevOps」。旧分类网页参数与 XML 地址继续映射到合并后的分类。

**桌面版与离线使用：** 下载完整 ZIP 后解压，在 draw.io 中打开 **文件 → 打开库 → 设备**，选择 `libraries/zh-CN/` 或 `libraries/en/` 下的 XML。`libraries/all.xml` 是去重后的全集。SVG 已内嵌，导入后不依赖图标源网站。不要用“打开图表”导入图标库。

图标是可缩放的 SVG 图片，不是可逐条编辑路径的原生形状。默认不附加文字，名称用于库内识别。浅色 / 深色按钮仅改变预览背景，不修改品牌颜色。

## 本地开发

需要 Node.js 22.12+ 和 npm。首次安装依赖：

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

`npm run build` 校验图标、执行 TypeScript 检查、生成库与 ZIP，再构建静态网站到 `dist/`。依赖安装后，测试和构建完全使用仓库中的资源，不联网采集。

## 收集与更新

```sh
npm run sync
npm run sync -- --update
```

默认使用 `data/sources.lock.json` 中的固定提交；`--update` 检查上游当前分支。HTTP 下载带超时，按固定 URL 缓存到 `.sync-stage/`。任一文件下载或检查失败时，现有图标、清单及锁定版本保持不变；修复原因后可复用缓存补齐。只有图标、清单内容或许可证实际改变才提交更新，上游无关提交不会产生更新 PR。

每月通过 Actions 检查一次，更新现有 `automation/icon-update` 分支和 PR，人工审核后合并，不自动上线未经合并的更新。新软件通过维护清单添加，不自动把整个上游目录全部收录。

## 数据与产物

- `data/selection.mjs`：维护的软件范围、官网、软件类型；`data/taxonomy.mjs`：分类合并与项目归类规则。
- `data/catalog.json`：采集后的图标清单与完整来源；`data/categories*.json`：分类中英文案。
- `assets/icons/`：处理后的 SVG；`licenses/`：原始图标集许可。
- `scripts/`：采集、校验、离线生成工具；`src/`：中英文静态网站。
- `dist/catalog.json`：公共目录接口，`schemaVersion: 1`、版本、分类、图标与稳定相对路径。
- `dist/libraries/zh-CN/` 与 `dist/libraries/en/`：每种语言 8 个分类库，以及兼容旧链接的文件；`dist/libraries/all.xml`：全集。ZIP 只包含当前分类库。
- `dist/downloads/drawio-software-icons.zip`：全部 SVG、分类库、清单、使用说明与许可文件。

清单字段包括 `id/name/aliases/tags/category/softwareType/homepage/repository/asset/width/height/sha256/source`。`source` 中包含原始 URL、提交、路径、变体、图标集许可和原始 SHA-256。`softwareLicense` 未核实时为 null，不将图标集许可套用到软件上。

## GitHub Pages

公开仓库 `jinxiao/drawio-software-icons`，默认网址 `https://jinxiao.github.io/drawio-software-icons/`。Settings → Pages → Source 选择 GitHub Actions，推送到 `main` 后校验并发布。站点使用相对资源地址，也支持其他仓库子路径。

Settings → Actions → General 中允许 GitHub Actions 创建 Pull Request，供每月更新工作流使用。定时任务用仓库 `GITHUB_TOKEN` 创建更新 PR，并在自身工作流内完成测试及构建；如果 GitHub 对机器人 PR 的附加检查要求批准，在 PR 页面批准运行即可。

## 验收

打开站点检查：语言切换与刷新保持、中文/英文/别名搜索、软件类型筛选、无结果提示、明暗预览、详情来源链接、SVG/XML/ZIP 下载。在 draw.io 中分别打开一个分类、多个分类；拖入横向和方形图标，缩放后保存并重新打开。桌面版导入下载的分类 XML，确认离线图标可见。

代码与文档采用 MIT；图标保留上游许可与商标权。详见 [第三方资源说明](THIRD_PARTY_NOTICES.md) 与 [贡献指南](CONTRIBUTING.md)。
