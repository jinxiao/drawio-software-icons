# JS 插件安装 / JavaScript plugin installation

插件一次注册 9 个独立、默认折叠的分类面板，支持搜索。按 Iconfont 分类保留原色。全部 SVG 与图形结构内嵌在一个 JS 文件中，运行时不下载图标。拖入画布的图标标签为空，双击编辑后在图标下方显示。

## 适用环境

用于可以修改构建配置和插件注册表的 **自托管 draw.io 网页版**。公共 `app.diagrams.net` 不接受本项目未注册的插件 ID；不要把 GitHub JS 地址拼到 `?p=` 后面。

上游当前 `App.loadPlugins` 通过 `App.pluginRegistry` 查找 ID；未知 ID 被忽略。draw.io 官方文档明确说明桌面版及 Confluence/Jira 集成不支持插件。普通网页或桌面用户使用分发包的 `config/*.json` 更直接。

参考：[插件文档](https://www.drawio.com/docs/reference/plugins/add-plugin/) · [加载器源码](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/js/diagramly/App.js) · [图库渲染 API](https://github.com/jgraph/drawio/blob/dev/src/main/webapp/js/diagramly/EditorUi.js)。核查日期：2026-09-10；这些内部 Sidebar API 后续可能调整。

## 自托管源码版安装

先在本项目构建，取得 `dist/plugins/alibaba-cloud.js`。不要安装含 `__PLUGIN_DATA__` 的 `src/plugin.js` 模板。

1. 将生成的 JS 复制为 draw.io 源码目录下的 `src/main/webapp/plugins/alibaba-cloud.js`。
2. 在 draw.io 的 `src/main/webapp/js/diagramly/App.js` 中，紧接 `App.pluginRegistry = {...};` 定义之后加入：

   ```js
   App.pluginRegistry['alibaba-cloud'] = 'plugins/alibaba-cloud.js';
   ```

3. 按该 draw.io 版本自身的构建说明重新构建并部署。发布包一般使用压缩 bundle，仅修改未参与打包的源码不会生效。
4. 打开自己的编辑器地址并添加 `?p=alibaba-cloud`，例如 `https://drawio.example.com/?p=alibaba-cloud`。已有 URL 参数时使用 `&p=alibaba-cloud`。示例域名须替换为自己的地址。

团队只需收藏这条链接；每次通过链接启动即加载全部分类。插件未修改用户的持久设置。不要与阿里云 JSON 配置同时加载，否则会出现两套面板。

如果自托管部署使用其他插件入口，也必须保证它最终通过 `Draw.loadPlugin(callback)` 把编辑器实例交给本插件。不同 Docker 镜像的打包方式不同，这里不假定镜像具备任意 URL 插件安装能力。

## 更新和卸载

- 更新数据：重新生成并替换同一个 JS 文件，再刷新。不需要额外导入 XML。
- 卸载：从入口链接移除 `p=alibaba-cloud` 并刷新。彻底移除时删除自己的注册项和部署的插件文件。
- 重复加载同一版本会跳过；安装另一版本时应刷新编辑器，避免分类重复。
- 已保存的图形内嵌 SVG，后续打开图纸不要求继续安装插件。

## English quick instructions

For a self-hosted source build, copy the generated `plugins/alibaba-cloud.js` bundle to draw.io's `src/main/webapp/plugins/alibaba-cloud.js`. Add the registry assignment shown above immediately after `App.pluginRegistry` is defined, rebuild and deploy your draw.io application, then launch your own editor with `?p=alibaba-cloud`.

The public app cannot register this custom plugin for you. Desktop plugins are unsupported according to upstream documentation. Use the native JSON configuration for those users. Do not load the configuration and plugin together. Remove the URL parameter to stop loading the plugin. Saved diagrams remain independent of the plugin.
