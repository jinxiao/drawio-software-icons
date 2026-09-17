# 来源与收录规则

采集日期：2026-09-10。发布者为 Iconfont 上的[阿里云设计中心](https://www.iconfont.cn/user/detail?uid=6856114)，用户 ID `6856114`。

通过公开用户图标集列表确认共有 9 个集合，并逐个读取集合详情。集合 ID、标题、数量、主色及来源记录在 `data/catalog.json`；每个原始 SVG、图标 ID 和来源集合记录在 `data/assets.json`。原始 API 下载地址和 SHA-256 记录在 `data/sources.lock.json`，缓存位于 `.cache/sources/`。

## 集合

| ID | 名称 | 条目数 |
| --- | --- | ---: |
| [21530](https://www.iconfont.cn/collections/detail?cid=21530) | 2022阿里云产品图标 - 云计算基础 Cloud Infrastructure | 132 |
| [21419](https://www.iconfont.cn/collections/detail?cid=21419) | 2022阿里云产品图标 - 大数据 Big Data | 23 |
| [21426](https://www.iconfont.cn/collections/detail?cid=21426) | 2022阿里云产品图标 - 安全 Security | 28 |
| [21532](https://www.iconfont.cn/collections/detail?cid=21532) | 2022阿里云产品图标 - 人工智能 Artificial Intelligence | 39 |
| [21533](https://www.iconfont.cn/collections/detail?cid=21533) | 2022阿里云产品图标 - 企业应用 Enterprise Applications | 38 |
| [21538](https://www.iconfont.cn/collections/detail?cid=21538) | 2022阿里云产品图标 - 开发者服务 | 22 |
| [21539](https://www.iconfont.cn/collections/detail?cid=21539) | 2022阿里云产品图标 - 物联网 IoT | 21 |
| [21408](https://www.iconfont.cn/collections/detail?cid=21408) | 2022阿里云产品图标全集（橙色版） Alibaba Cloud Icons | 286 |
| [27723](https://www.iconfont.cn/collections/detail?cid=27723) | 阿里云UI图标库 Supplemental Icons | 299 |

合计 888 个图标 ID。集合标题中的“2022”是上游原名，不能因本次采集日期是 2026 年就称为 2026 年新设计。

## 保留规则

- 来源集合决定分类；不从官网产品目录推断另一套分类，不用橙色全集替代彩色分类集。
- 原始 SVG 决定配色。即使同一分类存在相近色值，也保留每条路径的原色，不统一重涂。
- 不按几何指纹合并不同图标 ID，避免吞掉不同颜色或用途的版本。
- 31 个上游未明确命名的“备份/画板”条目保留，并在预览和提示中标注。真实产品名称“数据库备份”“混合云备份”正常保留。
- 不用无来源的文字框或相似图标补齐当前产品目录。这里是来源图标集整理，不是当前云产品覆盖率清单。
- 导出只移除 Iconfont 预览包装中的 CSS 尺寸、处理离线 SVG 所需属性；明确的路径、填色和描边保留。依赖 `currentColor` 的部分以黑色上下文离线显示，不强制改橙或改蓝。
- 图标在画布上的标签为空，名称保留在图库提示、搜索及元数据中。

旧版未再引用的 `legacy.json`、产品匹配及补充目录数据已移除；旧三套统一配色生成物由构建清单清理。仅对旧生成清单中未被用户修改的过时文件自动删除，修改过的文件会保留并打印提示。

配色差异见 [COLORS.md](COLORS.md)。draw.io 格式依据：[原生图库格式](https://www.drawio.com/docs/reference/format-custom-shape-library/)、[多图库配置](https://www.drawio.com/docs/reference/configure-diagram-editor/#libraries)。

## 权利

本项目引用上述发布者及其原始作品记录，不扩大对图标或商标的授权。公开可访问不等于可以替第三方素材授予 MIT 许可，代码许可范围见仓库或分发包根目录的 `NOTICE.md`。API 返回的无关用户字段不写入分发包。
