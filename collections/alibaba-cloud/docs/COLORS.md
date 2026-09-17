# Iconfont 分类原色与文档用色

核查日期：2026-09-10。

此前实现错误地优先选了“橙色全集”，再把图形统一转换为蓝色；这覆盖了分类图标集已经提供的原色。现已改为**直接采用每个来源分类的 SVG**。

| 来源分类 | 原始路径中的主要颜色 |
| --- | --- |
| [Cloud Infrastructure](https://www.iconfont.cn/collections/detail?cid=21530) | `#2B85FB`，少量 `#2B85FC` |
| [Big Data](https://www.iconfont.cn/collections/detail?cid=21419) | `#4D3CFF`、`#4D3BFF` |
| [Security](https://www.iconfont.cn/collections/detail?cid=21426) | `#63BA4D` |
| [Artificial Intelligence](https://www.iconfont.cn/collections/detail?cid=21532) | `#6415FF` |
| [Enterprise Applications](https://www.iconfont.cn/collections/detail?cid=21533) | `#0649D0`、`#0549D0`、`#0D48D1` |
| [Developer Services](https://www.iconfont.cn/collections/detail?cid=21538) | `#04A2B8` |
| [IoT](https://www.iconfont.cn/collections/detail?cid=21539) | `#FF8A00` |
| [Orange Collection](https://www.iconfont.cn/collections/detail?cid=21408) | 主要为 `#FF6A00`，保留其他细微变化 |
| [Supplemental Icons](https://www.iconfont.cn/collections/detail?cid=27723) | 黑、灰、白等，按原图保留 |

颜色统计来自 `show_svg` 中的明确 `fill` / `stroke` 属性，不是根据分类名称猜测。预览页的分类色条使用主色，而 SVG 自身保持逐路径颜色。没有额外蓝色底板、圆角或白色反转。

## 与阿里云帮助文档的区别

之前核对的 [ALB](https://help.aliyun.com/zh/slb/application-load-balancer/what-is-alb) 和 [VPC](https://help.aliyun.com/zh/vpc/what-is-vpc) 正文 SVG 确实存在 `#1366EC` 图形。这个事实不等于 Iconfont Cloud Infrastructure 也使用相同色值，更不意味着其他分类都应统一染成这种蓝色。

**文档插图的蓝色、Iconfont 的分类配色、Iconfont 橙色全集是不同的使用版本。** 本图库既然以 Iconfont 分类为来源，就以对应 SVG 的原始颜色为准。新的源码不再包含统一染蓝或蓝底白图的转换逻辑。
