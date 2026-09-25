# Homepage preview

[English](#english) · [中文](#中文)

## English

The `preview/homepage` branch can be published at:
https://icons.rambow.cloud/preview/homepage/

After pushing that branch, manually run **Validate and publish** from the same branch with `publish_preview` enabled:

```sh
gh workflow run ci-pages.yml --ref preview/homepage -f publish_preview=true
```

The workflow runs the normal tests and build. It then downloads the successful Pages artifact for the current `main` commit and adds the preview in a subdirectory. Checks enforce byte-for-byte preservation of production files and abort if `main` changes during preparation. Preview and production publication share a concurrency group. The `github-pages` environment must allow the exact `preview/homepage` branch; existing `main` restrictions remain in place.

No commit is made to `main`; the Alibaba site is not redeployed. A subsequent normal `main` deployment removes the preview path. To restore it, dispatch the preview again after the main deployment succeeds. If the production Pages artifact has expired, first rerun the main workflow. Preview pages are marked `noindex`.

Review at desktop (1440 × 900 and 1366 × 768), tablet (768 × 1024) and phone (390 × 844 and 375 × 667) widths. Check both languages, first-screen visibility of introduction/search/latest updates, search result navigation, update icon navigation, and the category/desktop setup dialog. Very small windows and enlarged text can scroll naturally.

## 中文

`preview/homepage` 分支的预览地址：
https://icons.rambow.cloud/preview/homepage/

推送分支后，在该分支手动触发 **Validate and publish**，勾选 `publish_preview`，或运行上面的命令。

流程执行正常测试与构建，随后下载当前 `main` 提交已成功发布的 Pages 产物，只在子目录中加入预览。发布前逐文件校验正式站内容未变；如果准备期间 `main` 发生变化则终止。预览与正式发布使用相同并发组。`github-pages` 环境需要额外允许精确的 `preview/homepage` 分支，保留原有 `main` 规则。

不会提交到 `main`，也不会重新部署阿里云入口。之后正常发布 `main` 会移除预览目录；正式发布成功后，可再次触发预览恢复链接。如果正式版 Pages 产物过期，先重新运行主分支流程。预览页面带有禁止搜索引擎索引的标记。

建议在桌面（1440 × 900、1366 × 768）、平板（768 × 1024）、手机（390 × 844、375 × 667）查看两种语言：检查首屏介绍、搜索和最近更新是否可见，搜索结果和更新图标是否能正确定位，以及分类 / 桌面配置弹窗是否正常。极小窗口和放大字体时允许自然滚动。
