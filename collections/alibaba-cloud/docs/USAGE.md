# 阿里云 Iconfont 原色分类图标库

本包包含 9 个 Iconfont 原始分类、888 个条目，保留各自配色，包括不同颜色版本及 UI 图标；不是 888 个独立云服务。

**网页版一键加载：** 打开 `index.html`，点击 **一键加载全部分类到 draw.io**，即可在新标签页加载 9 个独立分类面板，无需复制配置。选择某个分类后，也可点击 **加载当前分类到 draw.io**；搜索不会改变加载范围。首次打开若提示选择存储位置或创建图表，按页面提示继续。

一键加载需要联网。本地预览使用 `https://jinxiao.github.io/alibaba-cloud-icons/` 上已发布的 XML；HTTPS 部署使用当前站点目录内的 XML。本地尚未发布的图标更改不会通过在线链接加载，请使用配置或 XML 导入。

默认顺序为：云计算基础、大数据、安全、人工智能、企业应用、开发者服务、物联网、橙色全集、UI 补充图标。一键加载、JSON 配置和插件使用相同顺序，UI 补充图标固定在最后。draw.io 会优先恢复浏览器中已有的图库顺序；如需恢复这里的顺序，先关闭已有的 9 个阿里云面板，再从预览页重新一键加载。

**离线或桌面版配置：**

1. 双击 `index.html`，点击 **复制全部分类配置**。
2. 在 draw.io 的 **其他 → 配置 → JSON** 粘贴、应用并刷新；简洁界面在 Settings 菜单。
3. 若未显示，进入“更多图形”，勾选 **阿里云 Iconfont 全部分类**。
4. 展开分类、拖入图标。默认没有文字，双击后在下方填写标签。

“更多图形”中的分类预览已内嵌到 JSON，可离线显示。旧配置若没有预览，请替换为本包中的新版阿里云分组，应用并刷新。单独查看预览可打开 `previews/alibaba-cloud.svg`。

已有自定义配置时，将阿里云 `libraries` 分组与 `defaultLibraries` 中的 `alibaba-cloud-iconfont` 合并到原配置，保留其他字段。

从旧版迁移：先删除旧阿里云 `libraries` 分组及 `defaultLibraries` 中的 `alibaba-cloud-services`，关闭旧 XML 面板或卸载旧插件，然后加载新版。已有图纸的图标不会自动换色。新版不再使用统一蓝色/蓝底白色主题或旧 19 类目录。

| 文件 | 用途 |
| --- | --- |
| `config/alibaba-cloud.json` | 原生单文件分类配置 |
| `plugins/alibaba-cloud.js` | 自托管 JS 插件，见 [PLUGIN.md](PLUGIN.md) |
| `drawio/01-cloud-infrastructure.xml` 等 | 单分类库，通过“文件 → 打开图库 → 设备”导入 |
| `drawio/all-icons.xml` | 平铺总库，一个面板，无可折叠子分类 |
| `svg/` | 以 Iconfont ID 命名的单个 SVG |
| `catalog.csv` | 分类、命名状态、色值和来源 |
| `SHA256SUMS.json` | 文件校验和 |

基础设施蓝、大数据蓝紫、AI 紫、安全绿等均来自原始 SVG，底板和留白不额外加工。分类色条仅提示主色，图标保留自身细微色差。上游 31 个未明确命名画板仍可使用；它们不是缺图服务的文字占位。

在线一键加载、JSON 配置和插件按需选择一种即可。公共 app.diagrams.net 不接受任意 JS URL，官方文档说明桌面版不支持插件；网页版可直接用一键加载，离线或桌面版使用 JSON 配置。

卸载时删除新版阿里云配置分组和 `defaultLibraries` 中对应 ID，并关闭对应面板。

请实际检查分类折叠、图标原色、搜索、空标签、下方文字编辑、连线、缩放及保存重新打开。

代码与第三方素材许可分开，参见 [NOTICE.md](NOTICE.md)、[SOURCES.md](SOURCES.md)、[COLORS.md](COLORS.md)。
